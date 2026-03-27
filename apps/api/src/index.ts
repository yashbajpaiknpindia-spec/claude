import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import pinoHttp from 'pino-http';
import { orchestrateGeneration, scorePortfolio, optimizeLinkedIn } from '@brandforge/ai-core';
import type { GenerationRequest } from '@brandforge/types';
import { deployToVercel } from './services/vercel';
import { generatePDF, PDFUnavailableError } from './services/pdf';
import { requireAuth, requirePlan } from './middleware/auth';
import adminRouter from './routes/admin';
import authRouter from './routes/auth';
import { setupDatabase, testConnection, query as dbQuery } from './db/client';
import * as db from './db/queries';
import { logger } from './logger';

// ─── Env validation ──────────────────────────────────────────
const REQUIRED_ENV: Record<string, string> = {
  DATABASE_URL:     'PostgreSQL connection string',
  JWT_SECRET:       'JWT signing secret',
  ADMIN_PASSWORD:   'Admin panel password',
  ANTHROPIC_API_KEY:'Claude AI — required for portfolio/resume generation',
};

(function validateEnv() {
  const missing: string[] = [];
  for (const [key, desc] of Object.entries(REQUIRED_ENV)) {
    if (!process.env[key]) missing.push(`✗ ${key} — ${desc}`);
  }
  if (missing.length) {
    logger.fatal({ missing: missing.map(m => m.trim()) }, 'Missing required environment variables — shutting down');
    process.exit(1);
  }
})();

// ─── Async error wrapper ─────────────────────────────────────
function asyncHandler(
  fn: (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<unknown>
) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
const app = express();
app.set('trust proxy', 1); // Required for Render.com — trusts X-Forwarded-For header

// ─── CORS config ─────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:5173',  // Vite dev server
].filter(Boolean) as string[];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server / curl requests (no origin header)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-token', 'x-session-id'],
  // ✅ Expose so browsers can read the filename on PDF downloads
  exposedHeaders: ['Content-Disposition'],
  optionsSuccessStatus: 204, // Some legacy browsers choke on 204 vs 200
};

// ─── Middleware ───────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));

// ✅ Handle ALL preflight OPTIONS requests before any auth/rate-limit middleware
app.options('*', cors(corsOptions));

// Apply CORS to every subsequent request
app.use(cors(corsOptions));

app.use(pinoHttp({
  logger,
  autoLogging: { ignore: (req) => req.url === '/health' },
  customLogLevel: (_req, res) =>
    res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info',
  serializers: {
    req: (req) => ({ method: req.method, url: req.url, id: req.id }),
    res: (res) => ({ statusCode: res.statusCode }),
  },
}));

app.use(express.json({ limit: '2mb' }));

const limiter     = rateLimit({ windowMs: 60_000, max: 60,  standardHeaders: true, legacyHeaders: false });
const aiLimiter   = rateLimit({ windowMs: 60_000, max: 10,  standardHeaders: true, legacyHeaders: false });
const authLimiter = rateLimit({ windowMs: 60_000, max: 10,  standardHeaders: true, legacyHeaders: false });

app.use('/api/', limiter);

// ─── Routes ───────────────────────────────────────────────────
app.use('/api/auth',  authLimiter, authRouter);
app.use('/api/admin', adminRouter);

// ─── Health ───────────────────────────────────────────────────
app.get('/health', async (_, res) => {
  const dbOk = await testConnection();
  return res.json({ status: dbOk ? 'ok' : 'degraded', db: dbOk ? 'connected' : 'error', ts: Date.now() });
});

// ─── Generate ─────────────────────────────────────────────────
// Health check
app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'brandforge-api' });
});app.post('/api/generate', aiLimiter, requireAuth, async (req, res) => {
  try {
    const { prompt, type, templateId, userContext } = req.body as GenerationRequest;

    if (!prompt || prompt.length < 10) {
      return res.status(400).json({ error: 'Prompt too short. Tell us more about yourself.' });
    }

    const userId  = req.user!.id;
    const profile = await db.users.findById(userId) as { plan: string; credits: number; id: string } | null;

    if (profile?.plan === 'free' && (profile.credits ?? 0) <= 0) {
      return res.status(402).json({ error: 'No credits remaining. Upgrade to Pro.' });
    }

    const job       = await db.generationJobs.create(userId, prompt);
    const startTime = Date.now();
    const jobId     = (job as { id: string } | null)?.id ?? null;

    const result = await orchestrateGeneration(
      { prompt, type: type || 'portfolio', templateId, userContext },
      async (stage) => { if (jobId) db.generationJobs.updateStage(jobId, stage); }
    );

    const heroSection = result.sections.find((s) => s.type === 'hero');
    const projectName = (heroSection?.content?.headline as string) || 'My Portfolio';
    const slug        = generateSlug(projectName);

    const project = await db.projects.create({
      userId,
      type: type || 'portfolio',
      name: projectName,
      slug,
      prompt,
      layout:  result.layout,
      content: Object.fromEntries(result.sections.map((s) => [s.id, s.content])),
      theme:   result.theme,
      meta: {
        title:       result.brandingProfile.tagline,
        description: result.brandingProfile.usp,
        keywords:    result.brandingProfile.keywords,
      },
    });

    if (!project) throw new Error('Failed to save project');

    const savedProject = project as { id: string };
    const duration     = Date.now() - startTime;

    db.brandingProfiles.create({ userId, projectId: savedProject.id, ...result.brandingProfile, rawInput: prompt });
    if (profile?.plan === 'free') db.users.deductCredit(userId);
    if (jobId) db.generationJobs.complete(jobId, savedProject.id, duration);

    const { projectId: _ignored, ...resultWithoutId } = result;
    return res.json({ data: { projectId: savedProject.id, slug, ...resultWithoutId } });

  } catch (err: unknown) {
    logger.error({ err }, 'Generation failed');
    return res.status(500).json({ error: 'Generation failed. Please try again.' });
  }
});

// ─── Projects ─────────────────────────────────────────────────
app.get('/api/projects', requireAuth, async (req, res) => {
  const rows = await db.projects.listByUser(req.user!.id);
  return res.json({ data: rows });
});

app.get('/api/projects/:id', requireAuth, async (req, res) => {
  const project = await db.projects.findByIdAndUser(req.params.id, req.user!.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  return res.json({ data: project });
});

app.patch('/api/projects/:id', requireAuth, async (req, res) => {
  const allowed = ['name','slug','status','layout','content','theme','meta'];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) if (req.body[key] !== undefined) updates[key] = req.body[key];
  const project = await db.projects.update(req.params.id, req.user!.id, updates);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  return res.json({ data: project });
});

app.delete('/api/projects/:id', requireAuth, async (req, res) => {
  await db.projects.delete(req.params.id, req.user!.id);
  return res.json({ message: 'Deleted' });
});

// ─── Public portfolio ──────────────────────────────────────────
app.get('/api/public/:slug', async (req, res) => {
  const project = await db.projects.findBySlug(req.params.slug);
  if (!project) return res.status(404).json({ error: 'Not found' });
  db.analytics.trackEvent({
    projectId: (project as { id: string }).id,
    eventType: 'view',
    referrer:  req.headers.referer,
    sessionId: req.headers['x-session-id'] as string,
  });
  return res.json({ data: project });
});

// ─── Score ────────────────────────────────────────────────────
app.post('/api/projects/:id/score', aiLimiter, requireAuth, async (req, res) => {
  const { roastMode = false } = req.body;
  const project = await db.projects.findByIdAndUser(req.params.id, req.user!.id);
  if (!project) return res.status(404).json({ error: 'Not found' });
  const sections = Object.entries((project as { content: Record<string, unknown> }).content || {})
    .map(([id, content]) => ({ id, content }));
  const feedback = await scorePortfolio({ sections: sections as never[] }, roastMode);
  db.projects.update(req.params.id, req.user!.id, { score: feedback.overall, score_feedback: feedback });
  return res.json({ data: feedback });
});

// ─── Deploy ───────────────────────────────────────────────────
app.post('/api/projects/:id/deploy', requireAuth, requirePlan('pro'), async (req, res) => {
  const project = await db.projects.findByIdAndUser(req.params.id, req.user!.id);
  if (!project) return res.status(404).json({ error: 'Not found' });
  const deployment = await deployToVercel(project as never);
  db.projects.update(req.params.id, req.user!.id, {
    deployed_url:  deployment.url,
    deployment_id: deployment.id,
    status:        'published',
  });
  return res.json({ data: deployment });
});

// ─── PDF Export ───────────────────────────────────────────────
app.get('/api/projects/:id/export/pdf', requireAuth, async (req, res) => {
  const project = await db.projects.findByIdAndUser(req.params.id, req.user!.id);
  if (!project) return res.status(404).json({ error: 'Not found' });

  const p = project as { name: string; content: unknown; theme: unknown };
  let pdfBuffer: Buffer;

  try {
    pdfBuffer = await generatePDF(p as never);
  } catch (err: unknown) {
    if (err instanceof PDFUnavailableError) {
      return res.status(503).json({ error: 'PDF export is not available in this environment. ' + err.message });
    }
    throw err;
  }

  db.analytics.trackEvent({ projectId: req.params.id, eventType: 'resume_download' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${p.name.replace(/\s+/g, '_')}_Resume.pdf"`);
  return res.send(pdfBuffer);
});

// ─── LinkedIn ─────────────────────────────────────────────────
app.post('/api/linkedin/optimize', aiLimiter, requireAuth, async (req, res) => {
  const result = await optimizeLinkedIn(req.body);
  return res.json({ data: result });
});

// ─── Analytics ────────────────────────────────────────────────
app.post('/api/analytics/event', async (req, res) => {
  const { projectId, eventType, section, sessionId } = req.body;
  if (!projectId || !eventType) return res.status(400).json({ error: 'Missing fields' });
  db.analytics.trackEvent({ projectId, eventType, section, sessionId, referrer: req.headers.referer });
  return res.json({ ok: true });
});

app.get('/api/projects/:id/analytics', requireAuth, async (req, res) => {
  const { days = '30' } = req.query;
  const since = new Date(Date.now() - parseInt(days as string) * 86400000).toISOString();
  const summary = await db.analytics.summary(req.params.id, since);
  return res.json({ data: summary });
});

// ─── Templates ────────────────────────────────────────────────
app.get('/api/templates', async (req, res) => {
  const { type } = req.query;
  const rows = type
    ? await dbQuery(`SELECT * FROM templates WHERE type = $1 ORDER BY use_count DESC`, [type])
    : await dbQuery(`SELECT * FROM templates ORDER BY use_count DESC`);
  return res.json({ data: rows });
});

// ─── Helpers ──────────────────────────────────────────────────
function generateSlug(text: string): string {
  const base = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 45) || 'portfolio';
  return `${base}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Global error handler ─────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err, method: req.method, path: req.path }, 'Unhandled error');
  if (res.headersSent) return;
  return res.status(500).json({ error: 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

async function start() {
  await setupDatabase();
  app.listen(PORT, HOST, () => {
    logger.info({ host: HOST, port: PORT }, 'BrandForge API started');
  });
}

start().catch((err) => {
  logger.fatal({ err }, 'Startup failed');
  process.exit(1);
});

export default app;
