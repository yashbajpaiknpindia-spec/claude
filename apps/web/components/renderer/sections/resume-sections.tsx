import type { Section, Theme } from '@brandforge/types';
import { Mail, Phone, MapPin, Linkedin, Globe } from 'lucide-react';

interface SectionProps {
  section: Section;
  theme: Theme;
  isEditing?: boolean;
  onUpdate?: (content: Record<string, unknown>) => void;
}

// ─── Resume Header ────────────────────────────────────────────

export function ResumeHeaderSection({ section, theme }: SectionProps) {
  const c = section.content as Record<string, string>;
  const accent = theme?.colors?.accent || '#2563eb';
  const fontHeading = theme?.font?.heading || 'Lora';

  return (
    <div className="px-10 pt-10 pb-6 border-b-2" style={{ borderColor: accent }}>
      <h1 style={{ fontFamily: fontHeading, color: '#111', fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.5px' }}>
        {c.name}
      </h1>
      {c.title && (
        <p style={{ color: accent, fontWeight: 600, fontSize: '1.05rem', marginTop: '2px' }}>
          {c.title}
        </p>
      )}
      <div className="flex flex-wrap gap-4 mt-3" style={{ fontSize: '0.8rem', color: '#555' }}>
        {c.email && <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{c.email}</span>}
        {c.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{c.phone}</span>}
        {c.location && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{c.location}</span>}
        {c.linkedin && <span className="flex items-center gap-1.5"><Linkedin className="w-3.5 h-3.5" />{c.linkedin}</span>}
        {c.website && <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" />{c.website}</span>}
      </div>
    </div>
  );
}

// ─── Resume Summary ───────────────────────────────────────────

export function ResumeSummarySection({ section, theme }: SectionProps) {
  const c = section.content as { text?: string };
  const accent = theme?.colors?.accent || '#2563eb';

  return (
    <div className="px-10 py-5">
      <SectionTitle accent={accent}>Professional Summary</SectionTitle>
      <p style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.6 }}>{c.text}</p>
    </div>
  );
}

// ─── Resume Experience ─────────────────────────────────────────

export function ResumeExperienceSection({ section, theme }: SectionProps) {
  const c = section.content as { items?: Array<{
    role: string; company: string; period: string; location?: string; description: string; bullets: string[];
  }> };
  const accent = theme?.colors?.accent || '#2563eb';
  const fontHeading = theme?.font?.heading || 'Lora';

  return (
    <div className="px-10 py-5">
      <SectionTitle accent={accent}>Experience</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {c.items?.map((item, i) => (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontWeight: 700, fontSize: '1rem', fontFamily: fontHeading }}>{item.role}</span>
              <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{item.period}</span>
            </div>
            <div style={{ fontSize: '0.9rem', color: accent, fontWeight: 600 }}>
              {item.company}{item.location && ` · ${item.location}`}
            </div>
            <p style={{ fontSize: '0.85rem', color: '#4b5563', marginTop: '0.25rem' }}>{item.description}</p>
            {item.bullets?.length > 0 && (
              <ul style={{ marginTop: '0.4rem', paddingLeft: '1rem' }}>
                {item.bullets.map((b, bi) => (
                  <li key={bi} style={{ fontSize: '0.85rem', color: '#4b5563', marginBottom: '0.2rem', listStyleType: 'disc' }}>
                    {b}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Resume Skills ─────────────────────────────────────────────

export function ResumeSkillsSection({ section, theme }: SectionProps) {
  const c = section.content as { categories?: Array<{ name: string; skills: Array<{ name: string }> }> };
  const accent = theme?.colors?.accent || '#2563eb';

  return (
    <div className="px-10 py-5">
      <SectionTitle accent={accent}>Skills</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {c.categories?.map((cat) => (
          <div key={cat.name} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, minWidth: '100px', color: '#374151' }}>{cat.name}:</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {cat.skills.map((s) => (
                <span
                  key={s.name}
                  style={{ fontSize: '0.78rem', padding: '0.2rem 0.6rem', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '3px' }}
                >
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Resume Education ──────────────────────────────────────────

export function ResumeEducationSection({ section, theme }: SectionProps) {
  const c = section.content as { items?: Array<{ degree: string; school: string; year: string; gpa?: string }> };
  const accent = theme?.colors?.accent || '#2563eb';
  const fontHeading = theme?.font?.heading || 'Lora';

  return (
    <div className="px-10 py-5 pb-10">
      <SectionTitle accent={accent}>Education</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {c.items?.map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 700, fontFamily: fontHeading }}>{item.degree}</div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{item.school}</div>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{item.year}{item.gpa && ` · GPA ${item.gpa}`}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Business Card Front ───────────────────────────────────────

export function CardFrontSection({ section, theme }: SectionProps) {
  const c = section.content as { name?: string; title?: string; email?: string; phone?: string; website?: string };
  const accent = theme?.colors?.accent || '#ffd700';
  const bg = theme?.colors?.bg || '#09090b';
  const text = theme?.colors?.text || '#fafafa';
  const fontHeading = theme?.font?.heading || 'Bebas Neue';
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
        justifyContent: 'space-between',
        borderRadius: '12px',
        position: 'relative',
        overflow: 'hidden',
        margin: '2rem auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}
    >
      {/* Accent line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: accent }} />

      <div>
        <div style={{ fontFamily: fontHeading, fontSize: '1.6rem', letterSpacing: '2px', color: text }}>
          {c.name}
        </div>
        <div style={{ fontSize: '0.75rem', color: accent, fontWeight: 500, marginTop: '2px' }}>
          {c.title}
        </div>
      </div>

      <div style={{ fontSize: '0.7rem', color: `${text}80`, display: 'flex', flexDirection: 'column', gap: '3px' }}>
        {c.email && <span>{c.email}</span>}
        {c.phone && <span>{c.phone}</span>}
        {c.website && <span>{c.website}</span>}
      </div>
    </div>
  );
}

// ─── Helper ───────────────────────────────────────────────────

function SectionTitle({ children, accent }: { children: React.ReactNode; accent: string }) {
  return (
    <div
      style={{
        fontSize: '0.7rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '1.5px',
        color: accent,
        borderBottom: `1px solid #e5e7eb`,
        paddingBottom: '0.35rem',
        marginBottom: '0.75rem',
      }}
    >
      {children}
    </div>
  );
}
