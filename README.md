# BrandForge — AI Personal Branding Platform

> Canva × Apple × Stripe for your personal brand.
> Generate stunning portfolios, resumes, and business cards in seconds.

---

## Architecture Overview

```
brandforge/
├── apps/
│   ├── web/                    # Next.js 14 (App Router) — Frontend
│   │   ├── app/
│   │   │   ├── page.tsx        # Landing page with prompt input
│   │   │   ├── generate/       # Generation progress page
│   │   │   ├── editor/[id]/    # Canva-like editor
│   │   │   ├── dashboard/      # User dashboard
│   │   │   └── login/          # Auth pages
│   │   ├── components/
│   │   │   ├── renderer/       # ⭐ Component system (NEVER generates raw HTML)
│   │   │   │   ├── section-renderer.tsx    # Router/dispatcher
│   │   │   │   └── sections/               # 12 typed section components
│   │   │   └── editor/         # Theme, Sections, Score panels
│   │   ├── hooks/              # SWR data hooks
│   │   └── providers/          # Auth context
│   │
│   └── api/                    # Express.js Backend
│       └── src/
│           ├── index.ts        # All routes (generate, projects, deploy, score)
│           ├── middleware/     # Auth + rate limiting
│           └── services/       # Vercel deploy, PDF export
│
└── packages/
    ├── types/                  # Shared TypeScript types
    ├── ai-core/                # AI orchestration pipeline
    │   ├── orchestrator.ts     # Claude + GPT pipeline
    │   └── example-output.json # What the AI generates
    └── db/
        └── schema.sql          # Full PostgreSQL schema
```

## AI Pipeline

```
User Prompt
    │
    ▼
┌─────────────────────────────────────┐
│  Stage 1: Claude (Narrative)        │
│  • Writes bio, headlines, taglines  │
│  • Crafts personal brand voice      │
│  • Generates LinkedIn content       │
│  Model: claude-opus-4-5             │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│  Stage 2: GPT-4o (Structure)        │
│  • Maps narrative → JSON layout     │
│  • Selects appropriate components   │
│  • Determines theme + colors        │
│  • Structured JSON output only      │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│  Stage 3: Enrichment                │
│  • Validates all sections           │
│  • Fills gaps with smart defaults   │
│  • Saves to Supabase                │
└──────────────────┬──────────────────┘
                   │
                   ▼
         Component Renderer
         (React, type-safe)
```

## Component System Rules

The AI **ONLY** produces JSON. The component system handles all rendering.

| AI CAN                        | AI CANNOT                     |
|-------------------------------|-------------------------------|
| Fill content fields           | Write HTML/CSS                |
| Choose section types          | Create new components         |
| Arrange section order         | Override component structure  |
| Select from preset themes     | Add inline styles             |
| Suggest color values          | Inject arbitrary code         |

## Quick Start

### 1. Clone & install

```bash
git clone https://github.com/yourusername/brandforge
cd brandforge
npm install
```

### 2. Set up Supabase

1. Create project at [supabase.com](https://supabase.com)
2. Run `packages/db/schema.sql` in the SQL editor
3. Enable Google OAuth in Authentication settings

### 3. Configure environment

```bash
cp .env.example apps/web/.env.local
cp .env.example apps/api/.env
# Fill in your keys
```

### 4. Run development

```bash
npm run dev
# Web: http://localhost:3000
# API: http://localhost:3001
```

## API Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/generate` | ✓ | Main AI generation pipeline |
| GET | `/api/projects` | ✓ | List user's projects |
| GET | `/api/projects/:id` | ✓ | Get single project |
| PATCH | `/api/projects/:id` | ✓ | Update project (theme, content, layout) |
| DELETE | `/api/projects/:id` | ✓ | Delete project |
| GET | `/api/public/:slug` | — | View published project |
| POST | `/api/projects/:id/score` | ✓ | Score portfolio (+ roast mode) |
| POST | `/api/projects/:id/deploy` | Pro | Deploy to Vercel |
| GET | `/api/projects/:id/export/pdf` | ✓ | Export resume as PDF |
| POST | `/api/linkedin/optimize` | ✓ | Optimize LinkedIn profile |
| POST | `/api/analytics/event` | — | Track view/click events |
| GET | `/api/projects/:id/analytics` | ✓ | Get analytics summary |
| GET | `/api/templates` | — | List templates |

## Pricing Tiers

| Feature | Free | Pro ($12/mo) | Agency ($49/mo) |
|---------|------|--------------|-----------------|
| AI Generations | 5 | Unlimited | Unlimited |
| Hosting | BrandForge subdomain | Custom domain via Vercel | Multiple custom domains |
| Projects | 3 | Unlimited | Unlimited + team |
| PDF Export | ✓ | ✓ | ✓ |
| Score & Roast | ✓ | ✓ | ✓ |
| LinkedIn Optimizer | — | ✓ | ✓ |
| Analytics | Basic | Advanced | Advanced + team |
| Remove branding | — | ✓ | ✓ |

## Database Schema

### Core tables

- **profiles** — Extended user data (plan, credits, avatar)
- **projects** — Portfolios, resumes, business cards (layout + content JSONB)
- **templates** — Pre-built templates with layout + theme
- **branding_profiles** — AI-generated brand identity per project
- **analytics_events** — Raw event stream (views, clicks, downloads)
- **analytics_daily** — Pre-aggregated daily stats
- **generation_jobs** — AI pipeline job tracking

### Key design decisions

- `content` is JSONB indexed by section ID — flexible, schema-less per section
- `layout.sections` is an ordered array of section IDs — enables drag-to-reorder
- `theme` is a flat JSON object — makes theme switching O(1)
- RLS policies on all tables — users can only see their own data
- Public projects readable without auth (for sharing/embedding)

## Deployment

### Frontend (Vercel)

```bash
cd apps/web
vercel --prod
```

### Backend (Railway / Render)

```bash
cd apps/api
# Set all env vars in Railway dashboard
railway up
```

## Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| AI Generation | < 10s | Claude + GPT in sequence |
| Page Load | < 2s LCP | Static shell + streaming |
| Editor Paint | < 100ms | Optimistic updates |
| PDF Export | < 3s | Puppeteer headless |
| Deploy to Vercel | < 30s | Vercel API |

## Extending the Component System

To add a new section type:

1. Add to `SectionType` in `packages/types/index.ts`
2. Define content interface (e.g., `MyNewContent`)
3. Create `apps/web/components/renderer/sections/my-new-section.tsx`
4. Register in `section-renderer.tsx` SECTION_MAP
5. Add to `SECTION_META` in `sections-panel.tsx`
6. Update `getSectionOptionsForType()` in `ai-core/orchestrator.ts`

The AI will now be able to include this section type in generated layouts.
