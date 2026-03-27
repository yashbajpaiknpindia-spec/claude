// PDF export via Puppeteer.
//
// On Render's free/starter plan Chromium system libraries are not guaranteed.
// We attempt a lazy import and return a 503-friendly error if Puppeteer can't
// launch, so the rest of the API stays healthy.

export async function generatePDF(project: {
  name: string;
  content: Record<string, unknown>;
  theme: Record<string, unknown>;
}): Promise<Buffer> {
  let puppeteer: typeof import('puppeteer');
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    puppeteer = require('puppeteer');
  } catch {
    throw new PDFUnavailableError('Puppeteer is not installed. Add puppeteer to API dependencies.');
  }

  const html = buildResumeHTML(project);

  const launchArgs = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',  // required on Render (small /dev/shm)
    '--disable-gpu',
  ];

  let browser: import('puppeteer').Browser | undefined;
  try {
    browser = await puppeteer.launch({ headless: true, args: launchArgs });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new PDFUnavailableError(
      `Could not launch Chromium — PDF export is unavailable in this environment. (${msg})`
    );
  }

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
      printBackground: true,
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

/** Thrown when Puppeteer/Chromium is unavailable — lets the route return 503. */
export class PDFUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PDFUnavailableError';
  }
}

// ─── HTML builder ─────────────────────────────────────────────
function buildResumeHTML(project: {
  name: string;
  content: Record<string, unknown>;
  theme: Record<string, unknown>;
}): string {
  const theme = project.theme as { colors?: Record<string, string>; font?: Record<string, string> };
  const accent = theme.colors?.accent || '#2563eb';

  const header     = (project.content['resume_header']     as Record<string, unknown>) || {};
  const summary    = (project.content['resume_summary']    as Record<string, unknown>) || {};
  const experience = (project.content['resume_experience'] as Record<string, unknown>) || {};
  const skills     = (project.content['resume_skills']     as Record<string, unknown>) || {};
  const education  = (project.content['resume_education']  as Record<string, unknown>) || {};

  const items     = (experience.items    as Array<Record<string, unknown>>) || [];
  const skillCats = (skills.categories   as Array<{ name: string; skills: Array<{ name: string }> }>) || [];
  const eduItems  = (education.items     as Array<Record<string, unknown>>) || [];

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@400;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Source Sans Pro', Arial, sans-serif; font-size: 10pt; color: #1a1a1a; line-height: 1.5; }
  .page { max-width: 210mm; }
  .header { border-bottom: 2px solid ${accent}; padding-bottom: 12px; margin-bottom: 16px; }
  .name   { font-size: 24pt; font-weight: 700; color: #111; }
  .title  { font-size: 12pt; color: ${accent}; font-weight: 600; margin-top: 2px; }
  .contact-row { display: flex; gap: 20px; margin-top: 6px; font-size: 9pt; color: #555; flex-wrap: wrap; }
  .contact-row span::before { content: '• '; color: ${accent}; }
  .contact-row span:first-child::before { content: ''; }
  .section { margin-bottom: 18px; }
  .section-title { font-size: 10pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: ${accent}; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-bottom: 10px; }
  .summary { font-size: 10pt; color: #374151; line-height: 1.6; }
  .exp-item { margin-bottom: 14px; }
  .exp-header { display: flex; justify-content: space-between; align-items: baseline; }
  .exp-role { font-weight: 700; font-size: 11pt; }
  .exp-period { font-size: 9pt; color: #6b7280; }
  .exp-company { font-size: 10pt; color: ${accent}; font-weight: 600; }
  .exp-bullets { margin-top: 4px; padding-left: 14px; }
  .exp-bullets li { font-size: 9.5pt; color: #374151; margin-bottom: 2px; }
  .skills-grid { display: flex; flex-wrap: wrap; gap: 6px; }
  .skill-tag { background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 3px; padding: 2px 8px; font-size: 9pt; }
  .edu-item { display: flex; justify-content: space-between; }
  .edu-degree { font-weight: 600; }
  .edu-school { color: #6b7280; font-size: 9.5pt; }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="name">${header.name || project.name}</div>
    <div class="title">${header.title || ''}</div>
    <div class="contact-row">
      ${header.email    ? `<span>${header.email}</span>`    : ''}
      ${header.phone    ? `<span>${header.phone}</span>`    : ''}
      ${header.location ? `<span>${header.location}</span>` : ''}
      ${header.linkedin ? `<span>${header.linkedin}</span>` : ''}
      ${header.website  ? `<span>${header.website}</span>`  : ''}
    </div>
  </div>

  ${summary.text ? `
  <div class="section">
    <div class="section-title">Professional Summary</div>
    <div class="summary">${summary.text}</div>
  </div>` : ''}

  ${items.length > 0 ? `
  <div class="section">
    <div class="section-title">Experience</div>
    ${items.map((item: Record<string, unknown>) => `
    <div class="exp-item">
      <div class="exp-header">
        <span class="exp-role">${item.role || ''}</span>
        <span class="exp-period">${item.period || ''}</span>
      </div>
      <div class="exp-company">${item.company || ''}${item.location ? ` · ${item.location}` : ''}</div>
      <ul class="exp-bullets">
        ${((item.bullets as string[]) || []).map((b: string) => `<li>${b}</li>`).join('')}
      </ul>
    </div>`).join('')}
  </div>` : ''}

  ${skillCats.length > 0 ? `
  <div class="section">
    <div class="section-title">Skills</div>
    ${skillCats.map((cat) => `
    <div style="margin-bottom:8px">
      <div style="font-weight:600;font-size:9.5pt;margin-bottom:4px">${cat.name}</div>
      <div class="skills-grid">
        ${cat.skills.map((s) => `<span class="skill-tag">${s.name}</span>`).join('')}
      </div>
    </div>`).join('')}
  </div>` : ''}

  ${eduItems.length > 0 ? `
  <div class="section">
    <div class="section-title">Education</div>
    ${eduItems.map((item: Record<string, unknown>) => `
    <div class="edu-item">
      <div>
        <div class="edu-degree">${item.degree || ''}</div>
        <div class="edu-school">${item.school || ''}</div>
      </div>
      <div style="font-size:9pt;color:#6b7280">${item.year || ''}</div>
    </div>`).join('')}
  </div>` : ''}
</div>
</body>
</html>`;
}
