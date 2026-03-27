import type { Section, Theme, HeroContent } from '@brandforge/types';
import { motion } from 'framer-motion';
import { ArrowRight, MapPin } from 'lucide-react';

interface Props {
  section: Section;
  theme: Theme;
  isEditing?: boolean;
  onUpdate?: (content: Record<string, unknown>) => void;
}

export function HeroSection({ section, theme }: Props) {
  const content = section.content as unknown as HeroContent;
  const isDark = theme?.mode === 'dark';

  const accent = theme?.colors?.accent || '#6366f1';
  const bg = theme?.colors?.bg || '#fff';
  const text = theme?.colors?.text || '#111';
  const textMuted = theme?.colors?.textMuted || '#64748b';
  const fontHeading = theme?.font?.heading || 'Syne';
  const fontBody = theme?.font?.body || 'DM Sans';

  const heroStyle = content?.style || 'center';

  if (heroStyle === 'full-bleed') {
    return (
      <FullBleedHero content={content} accent={accent} bg={bg} text={text} textMuted={textMuted} fontHeading={fontHeading} fontBody={fontBody} isDark={isDark} />
    );
  }

  if (heroStyle === 'split') {
    return (
      <SplitHero content={content} accent={accent} bg={bg} text={text} textMuted={textMuted} fontHeading={fontHeading} fontBody={fontBody} isDark={isDark} />
    );
  }

  // Default: center
  return (
    <CenterHero content={content} accent={accent} bg={bg} text={text} textMuted={textMuted} fontHeading={fontHeading} fontBody={fontBody} isDark={isDark} />
  );
}

function CenterHero({ content, accent, bg, text, textMuted, fontHeading, fontBody, isDark }: {
  content: HeroContent;
  accent: string;
  bg: string;
  text: string;
  textMuted: string;
  fontHeading: string;
  fontBody: string;
  isDark: boolean;
}) {
  return (
    <section
      style={{ background: bg, color: text, fontFamily: fontBody }}
      className="min-h-screen flex flex-col items-center justify-center px-6 py-24 text-center relative overflow-hidden"
    >
      {/* Subtle background glow */}
      {isDark && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] rounded-full blur-[80px] opacity-20 pointer-events-none"
          style={{ background: accent }}
        />
      )}

      {/* Badge */}
      {content?.badge && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm mb-8"
          style={{ borderColor: `${accent}40`, color: accent, background: `${accent}10` }}
        >
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accent }} />
          {content.badge}
        </motion.div>
      )}

      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        style={{ fontFamily: fontHeading }}
        className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] max-w-3xl mb-6"
      >
        {content?.headline || 'Your Name Here'}
      </motion.h1>

      {/* Subheadline */}
      <motion.p
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{ color: textMuted, fontFamily: fontBody }}
        className="text-xl max-w-xl mb-10 leading-relaxed"
      >
        {content?.subheadline || 'Your professional subheadline'}
      </motion.p>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="flex flex-wrap gap-3 justify-center"
      >
        {content?.ctaPrimary && (
          <a
            href={content.ctaPrimary.href}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: accent, color: '#fff' }}
          >
            {content.ctaPrimary.text}
            <ArrowRight className="w-4 h-4" />
          </a>
        )}
        {content?.ctaSecondary && (
          <a
            href={content.ctaSecondary.href}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold border transition-all hover:opacity-80"
            style={{ borderColor: `${text}20`, color: text }}
          >
            {content.ctaSecondary.text}
          </a>
        )}
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <div
          className="w-px h-12 animate-pulse"
          style={{ background: `linear-gradient(to bottom, transparent, ${accent})` }}
        />
      </motion.div>
    </section>
  );
}

function SplitHero({ content, accent, bg, text, textMuted, fontHeading, fontBody, isDark }: {
  content: HeroContent;
  accent: string;
  bg: string;
  text: string;
  textMuted: string;
  fontHeading: string;
  fontBody: string;
  isDark: boolean;
}) {
  return (
    <section
      style={{ background: bg, color: text, fontFamily: fontBody }}
      className="min-h-screen flex items-center px-6 md:px-16 lg:px-24 py-20"
    >
      <div className="grid md:grid-cols-2 gap-16 items-center max-w-6xl mx-auto w-full">
        <div>
          {content?.badge && (
            <div
              className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm mb-8"
              style={{ borderColor: `${accent}40`, color: accent }}
            >
              {content.badge}
            </div>
          )}
          <h1
            style={{ fontFamily: fontHeading }}
            className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.05] mb-6"
          >
            {content?.headline}
          </h1>
          <p style={{ color: textMuted }} className="text-lg leading-relaxed mb-8">
            {content?.subheadline}
          </p>
          <div className="flex flex-wrap gap-3">
            {content?.ctaPrimary && (
              <a
                href={content.ctaPrimary.href}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold"
                style={{ background: accent, color: '#fff' }}
              >
                {content.ctaPrimary.text}
                <ArrowRight className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>

        {/* Avatar / Visual */}
        <div className="flex justify-center">
          {content?.avatarUrl ? (
            <img
              src={content.avatarUrl}
              alt="Profile"
              className="w-72 h-72 rounded-3xl object-cover"
            />
          ) : (
            <div
              className="w-72 h-72 rounded-3xl flex items-center justify-center text-6xl font-syne font-bold"
              style={{ background: `${accent}15`, color: accent }}
            >
              {content?.headline?.charAt(0) || '?'}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function FullBleedHero({ content, accent, bg, text, textMuted, fontHeading, fontBody, isDark }: {
  content: HeroContent;
  accent: string;
  bg: string;
  text: string;
  textMuted: string;
  fontHeading: string;
  fontBody: string;
  isDark: boolean;
}) {
  return (
    <section
      className="min-h-screen relative flex flex-col items-center justify-end pb-20 px-6 text-center overflow-hidden"
      style={{ color: '#fff' }}
    >
      {/* Full-bleed background */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at center top, ${accent}30 0%, ${bg} 60%), ${bg}`,
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'1\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-4xl">
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ fontFamily: fontHeading, color: text }}
          className="text-7xl md:text-8xl font-bold tracking-tighter leading-[0.95] mb-6"
        >
          {content?.headline}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{ color: textMuted }}
          className="text-xl mb-10"
        >
          {content?.subheadline}
        </motion.p>
        {content?.ctaPrimary && (
          <a
            href={content.ctaPrimary.href}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-semibold"
            style={{ background: accent, color: '#fff' }}
          >
            {content.ctaPrimary.text}
            <ArrowRight className="w-4 h-4" />
          </a>
        )}
      </div>
    </section>
  );
}
