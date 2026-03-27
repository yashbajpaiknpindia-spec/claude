#!/usr/bin/env node
// BrandForge — Render Production Configurator
// Run AFTER both services are deployed on Render:
// node setup-prod.js

const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(r => rl.question(q, r));

const c = {
  bold: '\x1b[1m', reset: '\x1b[0m', green: '\x1b[32m',
  cyan: '\x1b[36m', yellow: '\x1b[33m', red: '\x1b[31m', gray: '\x1b[90m',
};

async function main() {
  console.clear();
  console.log(`\n${c.bold}${c.cyan}  BrandForge — Render Production Config${c.reset}\n`);
  console.log(`  Run this after deploying both services on Render.\n`);
  console.log(`  ${'─'.repeat(52)}\n`);

  console.log(`  Find your URLs in Render dashboard → each service → top of page.\n`);

  const webUrl  = (await ask(`  ${c.cyan}Frontend URL${c.reset} (brandforge-web.onrender.com):   https://`)).trim();
  const apiUrl  = (await ask(`  ${c.cyan}Backend URL${c.reset}  (brandforge-api.onrender.com):   https://`)).trim();

  rl.close();

  const fullWebUrl = `https://${webUrl}`;
  const fullApiUrl = `https://${apiUrl}`;

  console.log(`\n  ${'─'.repeat(52)}`);
  console.log(`\n  ${c.bold}Step 1 — Update Backend (brandforge-api) on Render${c.reset}`);
  console.log(`  Go to: Render → brandforge-api → Environment\n`);
  console.log(`  ${c.yellow}FRONTEND_URL${c.reset}  =  ${fullWebUrl}\n`);

  console.log(`  ${'─'.repeat(52)}`);
  console.log(`\n  ${c.bold}Step 2 — Update Frontend (brandforge-web) on Render${c.reset}`);
  console.log(`  Go to: Render → brandforge-web → Environment\n`);
  console.log(`  ${c.yellow}NEXT_PUBLIC_API_URL${c.reset}  =  ${fullApiUrl}/api\n`);

  console.log(`  ${'─'.repeat(52)}`);
  console.log(`\n  ${c.bold}Step 3 — Update Supabase${c.reset}`);
  console.log(`  Go to: supabase.com → your project → Authentication → URL Configuration\n`);
  console.log(`  ${c.yellow}Site URL:${c.reset}      ${fullWebUrl}`);
  console.log(`  ${c.yellow}Redirect URL:${c.reset}  ${fullWebUrl}/auth/callback\n`);

  console.log(`  ${'─'.repeat(52)}`);
  console.log(`\n  ${c.bold}Step 4 — Redeploy both services${c.reset}`);
  console.log(`  After updating env vars, click "Manual Deploy" on each service.\n`);

  console.log(`  ${'─'.repeat(52)}`);
  console.log(`\n  ${c.bold}${c.green}Verify everything works:${c.reset}\n`);
  console.log(`  ${c.cyan}App:${c.reset}     ${fullWebUrl}`);
  console.log(`  ${c.cyan}Health:${c.reset}  ${fullApiUrl}/health`);
  console.log(`  ${c.cyan}Admin:${c.reset}   ${fullWebUrl}/admin`);
  console.log(`\n  ${c.gray}Admin login: phone 7897671348 · password from ADMIN_PASSWORD env var${c.reset}\n`);
}

main().catch(err => {
  console.error(`\n${c.red}Error:${c.reset}`, err.message);
  process.exit(1);
});
