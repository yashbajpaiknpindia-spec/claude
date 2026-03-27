// Re-export all section components - barrel file
export { AboutSection, ProjectsSection } from './about-projects-sections';
export { SkillsSection, ExperienceSection, TestimonialsSection, ContactSection } from './other-sections';
export {
  ResumeHeaderSection,
  ResumeSummarySection,
  ResumeExperienceSection,
  ResumeSkillsSection,
  ResumeEducationSection,
  CardFrontSection,
} from './resume-sections';

import type { Section, Theme } from '@brandforge/types';

export function CardBackSection({ section, theme }: { section: Section; theme: Theme }) {
  const c = section.content as { tagline?: string; qrUrl?: string };
  const accent = theme?.colors?.accent || '#ffd700';
  const bg = theme?.colors?.bg || '#09090b';
  const text = theme?.colors?.text || '#fafafa';
  const fontBody = theme?.font?.body || 'Montserrat';

  return (
    <div
      style={{
        width: '3.5in',
        height: '2in',
        background: bg,
        color: text,
        fontFamily: fontBody,
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: '12px',
        margin: '1rem auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        gap: '1rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: accent }} />
      {c?.qrUrl && <img src={c.qrUrl} alt="QR" style={{ width: '70px', height: '70px' }} />}
      {c?.tagline && (
        <p style={{ fontSize: '0.75rem', color: `${text}80`, textAlign: 'center', fontStyle: 'italic' }}>
          {c.tagline}
        </p>
      )}
    </div>
  );
}
