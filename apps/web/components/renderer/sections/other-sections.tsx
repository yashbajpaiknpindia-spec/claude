import React from 'react';
import type {
  Section,
  Theme,
  SkillsContent,
  ExperienceContent,
  TestimonialsContent,
  ContactContent,
} from '@brandforge/types';

import { motion } from 'framer-motion';
import { Mail, Phone, Twitter, Linkedin, Github, Globe } from 'lucide-react';

interface SectionProps {
  section: Section;
  theme: Theme;
  isEditing?: boolean;
  onUpdate?: (content: Record<string, unknown>) => void;
}

// ─── Skills Section ───────────────────────────────────────────

export function SkillsSection({ section, theme }: SectionProps) {
const content = (section.content || {}) as unknown as SkillsContent;

  const accent = theme?.colors?.accent || '#6366f1';
  const surface = theme?.colors?.surface || '#f8fafc';
  const text = theme?.colors?.text || '#111';
  const textMuted = theme?.colors?.textMuted || '#64748b';
  const fontHeading = theme?.font?.heading || 'Syne';

  return (
    <section style={{ background: surface, color: text }} className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-xs font-bold tracking-[0.15em] uppercase mb-4" style={{ color: accent }}>
          Skills
        </div>

        <h2 style={{ fontFamily: fontHeading }} className="text-4xl font-bold mb-14">
          {content.title || 'What I Do'}
        </h2>

        <div className="grid md:grid-cols-2 gap-10">
          {(content.categories || []).map((cat, ci) => (
            <motion.div
              key={cat.name || `cat-${ci}`}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: ci * 0.1 }}
            >
              <h3 className="font-bold text-sm uppercase tracking-wider mb-5" style={{ color: textMuted }}>
                {cat.name}
              </h3>

              <div className="space-y-4">
                {(cat.skills || []).map((skill, si) => (
                  <div key={skill.name || `skill-${si}`}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium">{skill.name}</span>
                      <span style={{ color: textMuted }}>{skill.level ?? 0}%</span>
                    </div>

                    <div
                      className="h-1.5 rounded-full overflow-hidden"
                      style={{ background: `${accent}26` }}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${skill.level ?? 0}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: si * 0.1 }}
                        className="h-full rounded-full"
                        style={{ background: accent }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Experience Section ───────────────────────────────────────

export function ExperienceSection({ section, theme }: SectionProps) {
  const content = (section.content || {}) as ExperienceContent;

  const accent = theme?.colors?.accent || '#6366f1';
  const bg = theme?.colors?.bg || '#fff';
  const text = theme?.colors?.text || '#111';
  const textMuted = theme?.colors?.textMuted || '#64748b';
  const fontHeading = theme?.font?.heading || 'Syne';

  return (
    <section style={{ background: bg, color: text }} className="py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-xs font-bold tracking-[0.15em] uppercase mb-4" style={{ color: accent }}>
          Experience
        </div>

        <h2 style={{ fontFamily: fontHeading }} className="text-4xl font-bold mb-14">
          {content.title || 'Work History'}
        </h2>

        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px" style={{ background: `${accent}33` }} />

          <div className="space-y-12 pl-12">
            {(content.items || []).map((item, i) => (
              <motion.div
                key={item.role || `exp-${i}`}
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                <div
                  className="absolute -left-[36px] top-1.5 w-3 h-3 rounded-full border-2"
                  style={{
                    background: item.current ? accent : bg,
                    borderColor: item.current ? accent : `${text}33`,
                  }}
                />

                <div className="flex flex-wrap gap-3 items-baseline mb-2">
                  <h3 className="font-bold text-lg" style={{ fontFamily: fontHeading }}>
                    {item.role}
                  </h3>

                  <span
                    className="text-xs px-2.5 py-1 rounded-full"
                    style={{ background: `${accent}26`, color: accent }}
                  >
                    {item.period}
                  </span>

                  {item.current && (
                    <span className="text-xs px-2.5 py-1 rounded-full text-white" style={{ background: accent }}>
                      Current
                    </span>
                  )}
                </div>

                <div className="text-sm font-semibold mb-3" style={{ color: accent }}>
                  {item.company}
                  {item.location && ` · ${item.location}`}
                </div>

                <p style={{ color: textMuted }} className="text-sm mb-4">
                  {item.description}
                </p>

                {(item.bullets || []).length > 0 && (
                  <ul className="space-y-1.5">
                    {(item.bullets || []).map((bullet, bi) => (
                      <li key={`bullet-${bi}`} className="flex gap-2.5 text-sm" style={{ color: textMuted }}>
                        <span className="mt-1.5 w-1 h-1 rounded-full" style={{ background: accent }} />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials Section ─────────────────────────────────────

export function TestimonialsSection({ section, theme }: SectionProps) {
  const content = (section.content || {}) as TestimonialsContent;

  const accent = theme?.colors?.accent || '#6366f1';
  const bg = theme?.colors?.bg || '#fff';
  const surface = theme?.colors?.surface || '#f8fafc';
  const text = theme?.colors?.text || '#111';
  const textMuted = theme?.colors?.textMuted || '#64748b';
  const fontHeading = theme?.font?.heading || 'Syne';

  return (
    <section style={{ background: surface, color: text }} className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <div className="text-xs font-bold uppercase mb-4" style={{ color: accent }}>
            Testimonials
          </div>

          <h2 style={{ fontFamily: fontHeading }} className="text-4xl font-bold mb-4">
            {content.title}
          </h2>

          {content.subtitle && <p style={{ color: textMuted }}>{content.subtitle}</p>}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {(content.items || []).map((item, i) => (
            <motion.div
              key={item.name || `testimonial-${i}`}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl p-6"
              style={{ background: bg, border: `1px solid ${accent}26` }}
            >
              <div className="flex mb-3">
                {[...Array(5)].map((_, si) => (
                  <span key={si} style={{ color: si < (item.rating ?? 5) ? '#f59e0b' : `${text}33` }}>
                    ★
                  </span>
                ))}
              </div>

              <p style={{ color: textMuted }} className="text-sm mb-6">
                "{item.text}"
              </p>

              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ background: accent }}
                >
                  {item.name?.charAt(0) || '?'}
                </div>

                <div>
                  <div className="font-semibold text-sm">{item.name}</div>
                  <div className="text-xs" style={{ color: textMuted }}>
                    {item.role} · {item.company}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Contact Section ──────────────────────────────────────────

const SOCIAL_ICONS: Record<string, React.ElementType> = {
  twitter: Twitter,
  linkedin: Linkedin,
  github: Github,
  website: Globe,
};

export function ContactSection({ section, theme }: SectionProps) {
  const content = (section.content || {}) as ContactContent;

  const accent = theme?.colors?.accent || '#6366f1';
  const bg = theme?.colors?.bg || '#fff';
  const text = theme?.colors?.text || '#111';
  const textMuted = theme?.colors?.textMuted || '#64748b';
  const fontHeading = theme?.font?.heading || 'Syne';

  return (
    <section style={{ background: bg, color: text }} className="py-24 px-6">
      <div className="max-w-3xl mx-auto text-center">
        {content.availabilityBadge && (
          <div
            className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm mb-8"
            style={{ borderColor: `${accent}66`, color: accent }}
          >
            <div className="w-1.5 h-1.5 rounded-full animate-pulse bg-green-500" />
            {content.availabilityBadge}
          </div>
        )}

        <h2 style={{ fontFamily: fontHeading }} className="text-5xl font-bold mb-6">
          {content.title || "Let's work together"}
        </h2>

        <p style={{ color: textMuted }} className="text-lg mb-10">
          {content.subtitle}
        </p>

        <div className="flex flex-wrap justify-center gap-4 mb-10">
          {content.email && (
            <a
              href={`mailto:${content.email}`}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white"
              style={{ background: accent }}
            >
              <Mail className="w-4 h-4" />
              {content.email}
            </a>
          )}

          {content.phone && (
            <a
              href={`tel:${content.phone}`}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold border"
              style={{ borderColor: `${text}26`, color: text }}
            >
              <Phone className="w-4 h-4" />
              {content.phone}
            </a>
          )}
        </div>

        {(content.socials || []).length > 0 && (
          <div className="flex justify-center gap-3">
            {(content.socials || []).map((social, i) => {
              const Icon = SOCIAL_ICONS[social.platform?.toLowerCase()] || Globe;

              return (
                <a
                  key={`${social.platform}-${i}`}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl flex items-center justify-center border hover:scale-110 transition"
                  style={{ borderColor: `${text}20`, color: textMuted }}
                  title={social.handle}
                >
                  <Icon className="w-4 h-4" />
                </a>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
