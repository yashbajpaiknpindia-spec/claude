// ============================================================
// BrandForge Shared Types
// ============================================================

export type ProjectType = 'portfolio' | 'resume' | 'business_card';
export type ProjectStatus = 'draft' | 'published' | 'archived';
export type Plan = 'free' | 'pro' | 'agency';

// ─── Component System ───────────────────────────────────────

export type SectionType =
  | 'hero'
  | 'about'
  | 'projects'
  | 'skills'
  | 'experience'
  | 'education'
  | 'testimonials'
  | 'contact'
  | 'resume_header'
  | 'resume_summary'
  | 'resume_experience'
  | 'resume_education'
  | 'resume_skills'
  | 'resume_certifications'
  | 'card_front'
  | 'card_back';

export interface Section {
  id: string;
  type: SectionType;
  content: Record<string, unknown>;
  visible: boolean;
  order: number;
}

// ─── Hero Section ───────────────────────────────────────────
export interface HeroContent {
  headline: string;
  subheadline: string;
  tagline: string;
  ctaPrimary: { text: string; href: string };
  ctaSecondary?: { text: string; href: string };
  badge?: string;
  avatarUrl?: string;
  style: 'center' | 'split' | 'full-bleed' | 'minimal';
}

// ─── About Section ──────────────────────────────────────────
export interface AboutContent {
  title: string;
  bio: string;
  highlights: Array<{ icon: string; label: string; value: string }>;
  imageUrl?: string;
}

// ─── Projects Section ───────────────────────────────────────
export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  tags: string[];
  imageUrl?: string;
  liveUrl?: string;
  githubUrl?: string;
  featured: boolean;
}

export interface ProjectsContent {
  title: string;
  subtitle: string;
  items: ProjectItem[];
  layout: 'grid' | 'masonry' | 'list' | 'featured';
}

// ─── Skills Section ─────────────────────────────────────────
export interface SkillsContent {
  title: string;
  categories: Array<{
    name: string;
    skills: Array<{ name: string; level: number }>; // level 0-100
  }>;
}

// ─── Experience Section ─────────────────────────────────────
export interface ExperienceItem {
  company: string;
  role: string;
  period: string;
  location?: string;
  description: string;
  bullets: string[];
  current: boolean;
}

export interface ExperienceContent {
  title: string;
  items: ExperienceItem[];
}

// ─── Testimonials ───────────────────────────────────────────
export interface TestimonialItem {
  name: string;
  role: string;
  company: string;
  avatarUrl?: string;
  text: string;
  rating: number;
}

export interface TestimonialsContent {
  title: string;
  subtitle: string;
  items: TestimonialItem[];
}

// ─── Contact ────────────────────────────────────────────────
export interface ContactContent {
  title: string;
  subtitle: string;
  email: string;
  phone?: string;
  socials: Array<{ platform: string; url: string; handle: string }>;
  formEnabled: boolean;
  availabilityBadge?: string;
}

// ─── Theme ──────────────────────────────────────────────────
export interface ThemeColors {
  bg: string;
  surface: string;
  surfaceAlt: string;
  accent: string;
  accentForeground: string;
  text: string;
  textMuted: string;
  border: string;
}

export interface ThemeFont {
  heading: string;
  body: string;
}

export interface Theme {
  colors: ThemeColors;
  font: ThemeFont;
  radius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  spacing: 'compact' | 'balanced' | 'spacious';
  mode: 'light' | 'dark';
  animationLevel: 'none' | 'subtle' | 'rich';
}

// ─── Project Layout ─────────────────────────────────────────
export interface ProjectLayout {
  sections: string[]; // ordered section IDs
  heroStyle?: 'center' | 'split' | 'full-bleed' | 'minimal';
  projectsLayout?: 'grid' | 'masonry' | 'list';
  navStyle?: 'fixed' | 'sticky' | 'none';
}

// ─── Full Project ───────────────────────────────────────────
export interface Project {
  id: string;
  userId: string;
  type: ProjectType;
  name: string;
  slug: string | null;
  status: ProjectStatus;
  prompt: string | null;
  layout: ProjectLayout;
  content: Record<string, unknown>; // sectionId -> SectionContent
  theme: Theme;
  meta: {
    title?: string;
    description?: string;
    ogImage?: string;
    keywords?: string[];
  };
  score: number | null;
  scoreFeedback: ScoreFeedback | null;
  deployedUrl: string | null;
  deploymentId: string | null;
  customDomain: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── AI Generation ──────────────────────────────────────────
export interface GenerationRequest {
  prompt: string;
  type: ProjectType;
  templateId?: string;
  userContext?: {
    name?: string;
    role?: string;
    industry?: string;
    experience?: string;
  };
}

export interface GenerationResult {
  jobId: string;
  projectId: string;
  sections: Section[];
  theme: Theme;
  layout: ProjectLayout;
  brandingProfile: BrandingProfile;
}

// ─── Branding ───────────────────────────────────────────────
export interface BrandingProfile {
  tagline: string;
  usp: string;
  niche: string;
  tone: 'professional' | 'casual' | 'bold' | 'creative';
  keywords: string[];
  linkedinHeadline: string;
  linkedinAbout: string;
  contentIdeas: string[];
}

// ─── Portfolio Score ─────────────────────────────────────────
export interface ScoreFeedback {
  overall: number;
  categories: {
    clarity: { score: number; feedback: string };
    completeness: { score: number; feedback: string };
    visual: { score: number; feedback: string };
    ats: { score: number; feedback: string };
    seo: { score: number; feedback: string };
  };
  topIssues: string[];
  quickWins: string[];
  roast?: string; // "Roast my portfolio" feature
}

// ─── Analytics ──────────────────────────────────────────────
export interface AnalyticsSummary {
  totalViews: number;
  uniqueVisitors: number;
  totalClicks: number;
  resumeDownloads: number;
  topCountries: Array<{ country: string; count: number }>;
  dailyViews: Array<{ date: string; views: number }>;
  sectionEngagement: Array<{ section: string; views: number; clicks: number }>;
}

// ─── API Responses ──────────────────────────────────────────
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
