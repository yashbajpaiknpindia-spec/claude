import Anthropic from '@anthropic-ai/sdk';
import type {
  GenerationRequest,
  GenerationResult,
  Section,
  Theme,
  ProjectLayout,
  BrandingProfile,
  ProjectType,
} from '@brandforge/types';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Timeout helper ───────────────────────────────────────────
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`[orchestrator] ${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

// ─── Retry helper ─────────────────────────────────────────────
async function withRetry<T>(fn: () => Promise<T>, label: string, attempts = 2): Promise<T> {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      const isLast = i === attempts - 1;
      if (isLast) throw err;
      const delay = 1000 * (i + 1);
      console.warn(`[orchestrator] ${label} failed (attempt ${i + 1}/${attempts}), retrying in ${delay}ms:`, (err as Error).message);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error(`[orchestrator] ${label} exhausted all ${attempts} attempts`);
}

// ─── Strip markdown fences helper ────────────────────────────
function stripFences(text: string): string {
  return text
    .replace(/^```\s*(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

// ─── Stage 1: Claude — Narrative & Branding ─────────────────

async function runClaudeStage(
  prompt: string,
  type: ProjectType,
  userContext?: GenerationRequest['userContext']
): Promise<{ narrative: Record<string, unknown>; brandingProfile: BrandingProfile }> {
  const systemPrompt = `You are BrandForge's creative director — a world-class personal branding strategist.
Your job: Transform a user prompt into a compelling personal brand narrative.
You write with precision, warmth, and strategic clarity.
Output ONLY valid JSON. No markdown, no commentary.`;

  const userPrompt = `
User's prompt: "${prompt}"
Document type: ${type}
${userContext ? `User context: ${JSON.stringify(userContext)}` : ''}

Generate a JSON object with:
{
  "narrative": {
    "heroHeadline": "Bold, memorable headline (max 8 words)",
    "heroSubheadline": "Supporting line that adds context (max 15 words)",
    "bio": "3-4 sentence professional bio, first person, authentic and specific",
    "aboutExpanded": "Full about section paragraph, 80-120 words, tells their story",
    "tone": "professional|casual|bold|creative"
  },
  "brandingProfile": {
    "tagline": "Catchy 5-8 word personal tagline",
    "usp": "1-2 sentences on what makes them uniquely valuable",
    "niche": "Specific niche/positioning (e.g. 'React performance specialist for fintech startups')",
    "tone": "professional|casual|bold|creative",
    "keywords": ["5-8 relevant professional keywords"],
    "linkedinHeadline": "Compelling LinkedIn headline (max 220 chars)",
    "linkedinAbout": "LinkedIn About section, 3 paragraphs, conversational and SEO-rich",
    "contentIdeas": ["5 content ideas they could post about on LinkedIn/Twitter"]
  }
}`;

  const response = await withRetry(
    () => withTimeout(
      anthropic.messages.create({
        model: 'claude-opus-4-5',
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
      30_000,
      'Claude narrative stage'
    ),
    'Claude narrative stage'
  );

  const text = response.content[0].type === 'text' ? (response.content[0].text ?? '') : '';
  const parsed = JSON.parse(stripFences(text));
  return { narrative: parsed.narrative, brandingProfile: parsed.brandingProfile };
}

// ─── Stage 2: Structure — JSON → Component Layout ────────────

async function runStructureStage(
  prompt: string,
  type: ProjectType,
  narrative: Record<string, unknown>,
  templateLayout?: ProjectLayout
): Promise<{ sections: Section[]; layout: ProjectLayout; theme: Theme }> {
  const sectionOptions = getSectionOptionsForType(type);

  const systemPrompt = `You are a UI architect. Convert narrative content into a structured component layout.
Output ONLY valid JSON. No markdown, no commentary. Be specific with content.`;

  const userPrompt = `
User prompt: "${prompt}"
Type: ${type}
Available sections: ${sectionOptions.join(', ')}
Template layout hint: ${templateLayout ? JSON.stringify(templateLayout) : 'none'}

Narrative content:
${JSON.stringify(narrative)}

Output this exact JSON structure:
{
  "layout": {
    "sections": ["ordered", "section", "ids"],
    "heroStyle": "center|split|full-bleed|minimal",
    "projectsLayout": "grid|masonry|list",
    "navStyle": "fixed|sticky|none"
  },
  "theme": {
    "colors": {
      "bg": "#hex",
      "surface": "#hex",
      "surfaceAlt": "#hex",
      "accent": "#hex",
      "accentForeground": "#hex",
      "text": "#hex",
      "textMuted": "#hex",
      "border": "#hex"
    },
    "font": { "heading": "Google Font name", "body": "Google Font name" },
    "radius": "none|sm|md|lg|xl|full",
    "spacing": "compact|balanced|spacious",
    "mode": "light|dark",
    "animationLevel": "none|subtle|rich"
  },
  "sections": [
    {
      "id": "section-id",
      "type": "hero|about|projects|skills|experience|testimonials|contact",
      "order": 0,
      "visible": true,
      "content": { /* all fields populated with real content from narrative */ }
    }
  ]
}

CRITICAL RULES:
- Infer dark/light theme from user's prompt words ("dark", "minimal", "light", "vibrant")
- Pick distinctive Google Fonts — NEVER Inter or Roboto
- Each section content must be fully populated (no placeholders)
- For portfolios: always include hero, about, projects, contact
- For resumes: always include header, summary, experience, skills, education
- For business cards: front and back only`;

  const response = await withRetry(
    () => withTimeout(
      anthropic.messages.create({
        model: 'claude-opus-4-5',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
      45_000,
      'Claude structure stage'
    ),
    'Claude structure stage'
  );

  const text = response.content[0].type === 'text' ? (response.content[0].text ?? '{}') : '{}';
  return JSON.parse(stripFences(text));
}

// ─── Stage 3: Content Enrichment ─────────────────────────────

async function enrichContent(
  sections: Section[],
  prompt: string
): Promise<Section[]> {
  return sections.map((section) => {
    if (section.type === 'projects') {
      const content = section.content as Record<string, unknown>;
      const items = content.items as unknown[];
      if (!items || items.length === 0) {
        content.items = generateDefaultProjects(prompt);
      }
    }
    if (section.type === 'skills') {
      const content = section.content as Record<string, unknown>;
      if (!content.categories) {
        content.categories = inferSkillsFromPrompt(prompt);
      }
    }
    return section;
  });
}

// ─── Main Orchestrator ───────────────────────────────────────

export async function orchestrateGeneration(
  request: GenerationRequest,
  onProgress?: (stage: string, progress: number) => void
): Promise<GenerationResult> {
  const startTime = Date.now();

  onProgress?.('claude', 10);
  const { narrative, brandingProfile } = await runClaudeStage(
    request.prompt,
    request.type,
    request.userContext
  );
  onProgress?.('claude', 40);

  onProgress?.('structuring', 50);
  const { sections, layout, theme } = await runStructureStage(
    request.prompt,
    request.type,
    narrative,
    undefined
  );
  onProgress?.('structuring', 75);

  onProgress?.('rendering', 80);
  const enrichedSections = await enrichContent(sections, request.prompt);
  onProgress?.('rendering', 95);

  const duration = Date.now() - startTime;
  console.log(`[orchestrator] Generation completed in ${duration}ms`);

  return {
    jobId: crypto.randomUUID(),
    projectId: crypto.randomUUID(),
    sections: enrichedSections,
    theme,
    layout,
    brandingProfile,
  };
}

// ─── Portfolio Scorer ─────────────────────────────────────────

export async function scorePortfolio(
  project: { sections: Section[]; prompt?: string },
  roastMode = false
): Promise<import('@brandforge/types').ScoreFeedback> {
  const systemPrompt = `You are a brutal but fair career coach and portfolio reviewer.
Score portfolios honestly. Output ONLY valid JSON.`;

  const prompt = roastMode
    ? `Roast this portfolio HARD but helpfully. Be witty, specific, and actionable. Include a "roast" field with a 2-3 sentence savage but constructive critique.`
    : `Score this portfolio professionally.`;

  const response = await withRetry(
    () => withTimeout(
      anthropic.messages.create({
        model: 'claude-opus-4-5',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `${prompt}

Portfolio sections: ${JSON.stringify(project.sections.map((s) => ({ type: s.type, content: s.content })))}

Return:
{
  "overall": 0-100,
  "categories": {
    "clarity": { "score": 0-100, "feedback": "specific feedback" },
    "completeness": { "score": 0-100, "feedback": "specific feedback" },
    "visual": { "score": 0-100, "feedback": "specific feedback" },
    "ats": { "score": 0-100, "feedback": "specific feedback" },
    "seo": { "score": 0-100, "feedback": "specific feedback" }
  },
  "topIssues": ["3-4 specific issues"],
  "quickWins": ["3-4 quick improvements"],
  ${roastMode ? '"roast": "savage but constructive 2-3 sentence roast"' : ''}
}`,
          },
        ],
      }),
      30_000,
      'Claude scorer'
    ),
    'Claude scorer'
  );

  const text = response.content[0].type === 'text' ? (response.content[0].text ?? '{}') : '{}';
  return JSON.parse(stripFences(text));
}

// ─── LinkedIn Optimizer ──────────────────────────────────────

export async function optimizeLinkedIn(input: {
  currentHeadline?: string;
  currentAbout?: string;
  role: string;
  goals: string;
}): Promise<{ headline: string; about: string; contentIdeas: string[] }> {
  const response = await withRetry(
    () => withTimeout(
      anthropic.messages.create({
        model: 'claude-opus-4-5',
        max_tokens: 1000,
        system: 'You are a LinkedIn growth expert. Output ONLY valid JSON.',
        messages: [
          {
            role: 'user',
            content: `Optimize this LinkedIn profile:
Role: ${input.role}
Goals: ${input.goals}
Current headline: ${input.currentHeadline || 'none'}
Current about: ${input.currentAbout || 'none'}

Return JSON:
{
  "headline": "optimized headline max 220 chars, keyword-rich",
  "about": "3-paragraph about section, 2000 chars max, conversational, ends with CTA",
  "contentIdeas": ["10 specific post ideas with hooks"]
}`,
          },
        ],
      }),
      20_000,
      'Claude LinkedIn optimizer'
    ),
    'Claude LinkedIn optimizer'
  );

  const text = response.content[0].type === 'text' ? (response.content[0].text ?? '{}') : '{}';
  return JSON.parse(stripFences(text));
}

// ─── Helpers ─────────────────────────────────────────────────

function getSectionOptionsForType(type: ProjectType): string[] {
  const map: Record<ProjectType, string[]> = {
    portfolio: ['hero', 'about', 'projects', 'skills', 'experience', 'testimonials', 'contact'],
    resume: ['resume_header', 'resume_summary', 'resume_experience', 'resume_skills', 'resume_education', 'resume_certifications'],
    business_card: ['card_front', 'card_back'],
  };
  return map[type];
}

function generateDefaultProjects(prompt: string) {
  const isDesigner = /design|ui|ux|figma/i.test(prompt);
  const isDev = /dev|engineer|react|node|python/i.test(prompt);

  if (isDesigner) {
    return [
      { id: '1', title: 'Brand Identity System', description: 'Complete visual identity for a fintech startup', tags: ['Branding', 'Figma', 'Design Systems'], featured: true },
      { id: '2', title: 'E-commerce Redesign', description: 'UX overhaul that increased conversions by 34%', tags: ['UX', 'User Research', 'Prototyping'], featured: false },
      { id: '3', title: 'Mobile App Design', description: 'iOS fitness tracking app with 50K+ downloads', tags: ['Mobile', 'iOS', 'Interaction Design'], featured: false },
    ];
  }
  if (isDev) {
    return [
      { id: '1', title: 'Real-time Analytics Dashboard', description: 'Built with React, WebSockets, and D3.js for 10K+ daily users', tags: ['React', 'TypeScript', 'WebSockets'], featured: true },
      { id: '2', title: 'E-commerce API', description: 'High-performance REST API handling 1M+ requests/day', tags: ['Node.js', 'PostgreSQL', 'Redis'], featured: false },
      { id: '3', title: 'Open Source CLI Tool', description: '2K+ GitHub stars, used by 500+ developers', tags: ['Go', 'CLI', 'Open Source'], featured: false },
    ];
  }
  return [
    { id: '1', title: 'Featured Project', description: 'Your most impressive work', tags: ['Add your tags'], featured: true },
    { id: '2', title: 'Project Two', description: 'Description of your work', tags: ['Skills used'], featured: false },
  ];
}

function inferSkillsFromPrompt(prompt: string) {
  const categories = [];
  if (/react|vue|angular|next|frontend/i.test(prompt)) {
    categories.push({ name: 'Frontend', skills: [{ name: 'React', level: 95 }, { name: 'TypeScript', level: 90 }, { name: 'Next.js', level: 88 }, { name: 'CSS/Tailwind', level: 85 }] });
  }
  if (/node|express|api|backend|server/i.test(prompt)) {
    categories.push({ name: 'Backend', skills: [{ name: 'Node.js', level: 90 }, { name: 'PostgreSQL', level: 82 }, { name: 'Redis', level: 75 }, { name: 'Docker', level: 70 }] });
  }
  if (/design|figma|ui|ux/i.test(prompt)) {
    categories.push({ name: 'Design', skills: [{ name: 'Figma', level: 95 }, { name: 'User Research', level: 85 }, { name: 'Prototyping', level: 90 }, { name: 'Design Systems', level: 88 }] });
  }
  if (categories.length === 0) {
    categories.push({ name: 'Core Skills', skills: [{ name: 'Leadership', level: 90 }, { name: 'Strategy', level: 85 }, { name: 'Communication', level: 92 }, { name: 'Problem Solving', level: 88 }] });
  }
  return categories;
}
