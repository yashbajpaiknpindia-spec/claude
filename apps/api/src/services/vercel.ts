// Vercel Deployment Service
// Deploys user portfolios as static sites via Vercel API

interface VercelDeployment {
  id: string;
  url: string;
  readyState: string;
}

export async function deployToVercel(project: {
  id: string;
  slug: string;
  name: string;
  layout: Record<string, unknown>;
  content: Record<string, unknown>;
  theme: Record<string, unknown>;
}): Promise<VercelDeployment> {
  const token = process.env.VERCEL_TOKEN;
  const teamId = process.env.VERCEL_TEAM_ID;

  // Generate static HTML for the project
  const htmlContent = generateStaticHTML(project);

  const body = {
    name: `brandforge-${project.slug}`,
    files: [
      {
        file: 'index.html',
        data: Buffer.from(htmlContent).toString('base64'),
        encoding: 'base64',
      },
      {
        file: 'vercel.json',
        data: Buffer.from(JSON.stringify({
          cleanUrls: true,
          trailingSlash: false,
          headers: [
            { source: '/(.*)', headers: [{ key: 'X-Frame-Options', value: 'SAMEORIGIN' }] }
          ],
        })).toString('base64'),
        encoding: 'base64',
      },
    ],
    projectSettings: {
      framework: null,
      buildCommand: null,
      outputDirectory: null,
    },
  };

  const url = `https://api.vercel.com/v13/deployments${teamId ? `?teamId=${teamId}` : ''}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Vercel deployment failed: ${err}`);
  }

  const data = (await response.json()) as { id: string; url: string; readyState: string };
  return { id: data.id, url: `https://${data.url}`, readyState: data.readyState };
}

function generateStaticHTML(project: {
  id?: string;
  name: string;
  layout: Record<string, unknown>;
  content: Record<string, unknown>;
  theme: Record<string, unknown>;
}): string {
  const theme = project.theme as { colors?: Record<string, string>; font?: Record<string, string> };
  const colors = theme.colors || {};
  const font = theme.font || { heading: 'Syne', body: 'DM Sans' };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.name} | BrandForge</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(font.heading)}:wght@400;700&family=${encodeURIComponent(font.body)}:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: ${colors.bg || '#0a0a0a'};
      --surface: ${colors.surface || '#111'};
      --accent: ${colors.accent || '#6366f1'};
      --text: ${colors.text || '#f1f5f9'};
      --text-muted: ${colors.textMuted || '#94a3b8'};
      --font-heading: '${font.heading}', sans-serif;
      --font-body: '${font.body}', sans-serif;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: var(--bg); color: var(--text); font-family: var(--font-body); }
    h1, h2, h3 { font-family: var(--font-heading); }
    .section { padding: 5rem 2rem; max-width: 1100px; margin: 0 auto; }
    .accent { color: var(--accent); }
    /* Injected by BrandForge renderer */
  </style>
  <script>
    // Analytics beacon
    window.__bf = { pid: '${project.id || ''}' };
    function trackEvent(type, section) {
      fetch('/api/analytics/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: window.__bf.pid, eventType: type, section })
      });
    }
    document.addEventListener('DOMContentLoaded', () => trackEvent('view'));
  </script>
</head>
<body>
  <div id="brandforge-root">
    <!-- Content rendered by BrandForge component system -->
    ${renderSectionsHTML(project.content, project.layout)}
  </div>
</body>
</html>`;
}

function renderSectionsHTML(
  content: Record<string, unknown>,
  layout: Record<string, unknown>
): string {
  const sections = (layout.sections as string[]) || [];
  return sections
    .map((sectionId) => {
      const sectionContent = content[sectionId] as Record<string, unknown> | undefined;
      if (!sectionContent) return '';
      return `<section id="${sectionId}" class="section">${renderSectionHTML(sectionId, sectionContent)}</section>`;
    })
    .join('\n');
}

function renderSectionHTML(id: string, content: Record<string, unknown>): string {
  if (id.startsWith('hero')) {
    return `<h1>${content.headline || ''}</h1><p>${content.subheadline || ''}</p>`;
  }
  if (id.startsWith('about')) {
    return `<h2>${content.title || 'About'}</h2><p>${content.bio || ''}</p>`;
  }
  return `<div>${JSON.stringify(content).slice(0, 200)}</div>`;
}
