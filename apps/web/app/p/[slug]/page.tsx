import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SectionRenderer } from '@/components/renderer/section-renderer';
import type { Section, Theme } from '@brandforge/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface Props {
  params: { slug: string };
}

async function getProject(slug: string) {
  try {
    const res = await fetch(`${API_BASE}/public/${slug}`, {
      next: { revalidate: 60 }, // ISR: revalidate every minute
    });
    if (!res.ok) return null;
    const { data } = await res.json();
    return data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = await getProject(params.slug);
  if (!project) return { title: 'Not Found' };

  return {
    title: project.meta?.title || project.name,
    description: project.meta?.description,
    openGraph: {
      title: project.meta?.title || project.name,
      description: project.meta?.description,
      images: project.meta?.ogImage ? [project.meta.ogImage] : [],
    },
  };
}

export default async function PublicPortfolioPage({ params }: Props) {
  const project = await getProject(params.slug);
  if (!project) notFound();

  const theme: Theme = project.theme;
  const layout: { sections?: string[] } = project.layout || {};
  const content: Record<string, unknown> = project.content || {};

  const sections: Section[] = (layout.sections || []).map((sId: string, idx: number) => ({
    id: sId,
    type: sId.split('-')[0] as never,
    order: idx,
    visible: true,
    content: (content[sId] as Record<string, unknown>) || {},
  }));

  // Load fonts
  const fontHeading = theme?.font?.heading || 'Syne';
  const fontBody = theme?.font?.body || 'DM Sans';
  const googleFontsUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontHeading)}:wght@400;600;700;800&family=${encodeURIComponent(fontBody)}:wght@300;400;500;600&display=swap`;

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href={googleFontsUrl} rel="stylesheet" />

      {/* Analytics beacon */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function(){
              fetch('/api/analytics/event', {
                method: 'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify({projectId:'${project.id}',eventType:'view',sessionId:Math.random().toString(36).slice(2)})
              });
            })();
          `,
        }}
      />

      <main
        style={{
          background: theme?.colors?.bg || '#fff',
          color: theme?.colors?.text || '#111',
          fontFamily: `'${fontBody}', system-ui, sans-serif`,
          minHeight: '100vh',
        }}
      >
        {sections
          .sort((a, b) => a.order - b.order)
          .map((section) => (
            <SectionRenderer key={section.id} section={section} theme={theme} />
          ))}

        {/* BrandForge badge (free plan) */}
        <div
          className="fixed bottom-3 right-3 z-40"
          style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}
        >
          <a
            href="https://brandforge.io"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10 hover:opacity-100 transition-opacity opacity-60"
          >
            ✦ Built with BrandForge
          </a>
        </div>
      </main>
    </>
  );
}
