import type { Section, Theme, AboutContent, ProjectsContent, ProjectItem } from '@brandforge/types';
import { motion } from 'framer-motion';
import { ExternalLink, Github, ArrowRight } from 'lucide-react';

// ─── About Section ────────────────────────────────────────────

interface SectionProps {
  section: Section;
  theme: Theme;
  isEditing?: boolean;
  onUpdate?: (content: Record<string, unknown>) => void;
}

export function AboutSection({ section, theme }: SectionProps) {
  const content = section.content as unknown as AboutContent;
  const accent = theme?.colors?.accent || '#6366f1';
  const bg = theme?.colors?.bg || '#fff';
  const surface = theme?.colors?.surface || '#f8fafc';
  const text = theme?.colors?.text || '#111';
  const textMuted = theme?.colors?.textMuted || '#64748b';
  const fontHeading = theme?.font?.heading || 'Syne';
  const fontBody = theme?.font?.body || 'DM Sans';

  return (
    <section style={{ background: bg, color: text, fontFamily: fontBody }} className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Image or placeholder */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            {content?.imageUrl ? (
              <img
                src={content.imageUrl}
                alt="About"
                className="w-full aspect-square object-cover rounded-2xl"
              />
            ) : (
              <div
                className="w-full aspect-square rounded-2xl flex items-center justify-center text-8xl relative overflow-hidden"
                style={{ background: `${accent}08` }}
              >
                <div
                  className="absolute top-0 right-0 w-1/2 h-1/2 rounded-full blur-3xl opacity-30"
                  style={{ background: accent }}
                />
                <span style={{ color: accent, fontFamily: fontHeading }} className="relative z-10 font-bold text-6xl">
                  {content?.title?.charAt(0) || 'A'}
                </span>
              </div>
            )}
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="text-xs font-bold tracking-[0.15em] uppercase mb-4" style={{ color: accent }}>
              About Me
            </div>
            <h2 style={{ fontFamily: fontHeading }} className="text-4xl font-bold mb-6 leading-tight">
              {content?.title || 'Who I Am'}
            </h2>
            <p style={{ color: textMuted }} className="text-lg leading-relaxed mb-8">
              {content?.bio}
            </p>

            {/* Highlights */}
            {content?.highlights && content.highlights.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                {content.highlights.map((h, i) => (
                  <div
                    key={i}
                    className="rounded-xl p-4"
                    style={{ background: surface }}
                  >
                    <div className="text-2xl mb-1">{h.icon}</div>
                    <div className="font-bold text-xl mb-0.5" style={{ color: accent }}>{h.value}</div>
                    <div className="text-sm" style={{ color: textMuted }}>{h.label}</div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Projects Section ─────────────────────────────────────────

export function ProjectsSection({ section, theme }: SectionProps) {
  const content = section.content as unknown as ProjectsContent;
  const accent = theme?.colors?.accent || '#6366f1';
  const bg = theme?.colors?.bg || '#fff';
  const surface = theme?.colors?.surface || '#f8fafc';
  const text = theme?.colors?.text || '#111';
  const textMuted = theme?.colors?.textMuted || '#64748b';
  const fontHeading = theme?.font?.heading || 'Syne';
  const fontBody = theme?.font?.body || 'DM Sans';
  const layout = content?.layout || 'grid';

  const items = content?.items || [];
  const featured = items.filter((i) => i.featured);
  const rest = items.filter((i) => !i.featured);

  return (
    <section style={{ background: bg, color: text, fontFamily: fontBody }} className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-16">
          <div className="text-xs font-bold tracking-[0.15em] uppercase mb-4" style={{ color: accent }}>
            Work
          </div>
          <h2 style={{ fontFamily: fontHeading }} className="text-4xl md:text-5xl font-bold mb-4">
            {content?.title || 'Selected Projects'}
          </h2>
          {content?.subtitle && (
            <p style={{ color: textMuted }} className="text-lg">
              {content.subtitle}
            </p>
          )}
        </div>

        {/* Featured project */}
        {featured[0] && (
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8 rounded-2xl overflow-hidden group"
            style={{ background: surface }}
          >
            <div className="grid md:grid-cols-2 gap-0">
              {/* Project image/visual */}
              <div
                className="aspect-[4/3] md:aspect-auto flex items-center justify-center relative overflow-hidden"
                style={{ background: `${accent}10`, minHeight: '280px' }}
              >
                {featured[0].imageUrl ? (
                  <img
                    src={featured[0].imageUrl}
                    alt={featured[0].title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div
                    className="text-6xl font-bold opacity-20"
                    style={{ fontFamily: fontHeading, color: accent }}
                  >
                    {featured[0].title.charAt(0)}
                  </div>
                )}
                <div
                  className="absolute top-4 left-4 text-xs font-bold px-3 py-1 rounded-full"
                  style={{ background: accent, color: '#fff' }}
                >
                  Featured
                </div>
              </div>

              {/* Content */}
              <div className="p-8 md:p-10 flex flex-col justify-center">
                <h3 style={{ fontFamily: fontHeading }} className="text-2xl font-bold mb-3">
                  {featured[0].title}
                </h3>
                <p style={{ color: textMuted }} className="mb-6 leading-relaxed">
                  {featured[0].description}
                </p>
                <div className="flex flex-wrap gap-2 mb-8">
                  {featured[0].tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-3 py-1 rounded-full border"
                      style={{ borderColor: `${accent}30`, color: accent }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex gap-3">
                  {featured[0].liveUrl && (
                    <a
                      href={featured[0].liveUrl}
                      className="inline-flex items-center gap-1.5 text-sm font-medium"
                      style={{ color: accent }}
                    >
                      <ExternalLink className="w-4 h-4" /> Live
                    </a>
                  )}
                  {featured[0].githubUrl && (
                    <a
                      href={featured[0].githubUrl}
                      className="inline-flex items-center gap-1.5 text-sm font-medium"
                      style={{ color: textMuted }}
                    >
                      <Github className="w-4 h-4" /> Code
                    </a>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Grid of remaining */}
        <div className={layout === 'list' ? 'space-y-4' : 'grid grid-cols-1 md:grid-cols-2 gap-4'}>
          {rest.map((project, i) => (
            <ProjectCard
              key={project.id}
              project={project}
              accent={accent}
              surface={surface}
              textMuted={textMuted}
              fontHeading={fontHeading}
              delay={i * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProjectCard({
  project,
  accent,
  surface,
  textMuted,
  fontHeading,
  delay,
}: {
  project: ProjectItem;
  accent: string;
  surface: string;
  textMuted: string;
  fontHeading: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="rounded-2xl p-6 group hover:shadow-lg transition-all duration-300 cursor-pointer"
      style={{ background: surface }}
    >
      <div className="flex items-start justify-between mb-4">
        <h3 style={{ fontFamily: fontHeading }} className="text-lg font-bold">
          {project.title}
        </h3>
        <ArrowRight
          className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
          style={{ color: accent }}
        />
      </div>
      <p style={{ color: textMuted }} className="text-sm leading-relaxed mb-4">
        {project.description}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {project.tags.map((tag) => (
          <span
            key={tag}
            className="text-xs px-2.5 py-1 rounded-full"
            style={{ background: `${accent}12`, color: accent }}
          >
            {tag}
          </span>
        ))}
      </div>
    </motion.div>
  );
}
