#!/usr/bin/env node
// BrandForge — Automated Setup
// Run: node setup.js
// Creates your .env files. That's it — the database sets itself up on first boot.

const fs   = require('fs');
const path = require('path');
const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(r => rl.question(q, r));

const c = {
  reset:'\x1b[0m', bold:'\x1b[1m', green:'\x1b[32m',
  cyan:'\x1b[36m', yellow:'\x1b[33m', red:'\x1b[31m', gray:'\x1b[90m',
};

function writeEnv(filePath, vars) {
  let content = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
  for (const [k, v] of Object.entries(vars)) {
    const line = `${k}=${v}`;
    content = new RegExp(`^${k}=.*`, 'm').test(content)
      ? content.replace(new RegExp(`^${k}=.*`, 'm'), line)
      : content + `\n${line}`;
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content.trim() + '\n');
}

async function main() {
  console.clear();
  console.log(`\n${c.bold}${c.cyan}  ╔════════════════════════════════════════╗`);
  console.log(`  ║      BrandForge — Setup               ║`);
  console.log(`  ╚════════════════════════════════════════╝${c.reset}\n`);
  console.log(`  The database sets itself up automatically on first boot.`);
  console.log(`  Just fill in your API keys below.\n`);
  console.log(`  ${c.gray}${'─'.repeat(48)}${c.reset}\n`);

  // AI Keys
  console.log(`  ${c.bold}[1] AI API Keys${c.reset}\n`);
  const anthropicKey = (await ask(`  ${c.cyan}Anthropic key${c.reset} (sk-ant-...): `)).trim();
  const openaiKey    = (await ask(`  ${c.cyan}OpenAI key${c.reset}    (sk-...):     `)).trim();

  console.log(`\n  ${c.gray}${'─'.repeat(48)}${c.reset}\n`);

  // Database
  console.log(`  ${c.bold}[2] Database${c.reset}\n`);
  console.log(`  For local dev, you need PostgreSQL running.`);
  console.log(`  On Render, DATABASE_URL is set automatically — skip this.\n`);
  const dbUrl = (await ask(`  ${c.cyan}Database URL${c.reset} [Enter to skip for Render]: `)).trim();

  console.log(`\n  ${c.gray}${'─'.repeat(48)}${c.reset}\n`);

  // Admin password
  console.log(`  ${c.bold}[3] Admin password${c.reset}\n`);
  const adminPass = (await ask(`  ${c.cyan}Admin password${c.reset} [Enter for Yash@123]: `)).trim() || 'Yash@123';

  rl.close();

  // Validate AI keys
  const errors = [];
  if (anthropicKey && !anthropicKey.startsWith('sk-ant')) errors.push('Anthropic key should start with sk-ant');
  if (openaiKey && !openaiKey.startsWith('sk-'))           errors.push('OpenAI key should start with sk-');

  if (errors.length) {
    console.log();
    errors.forEach(e => console.log(`  ${c.red}✗${c.reset}  ${e}`));
    console.log();
    process.exit(1);
  }

  // Generate JWT secret
  const jwtSecret = require('crypto').randomBytes(32).toString('hex');

  // Write env files
  console.log(`\n  ${c.bold}Writing .env files...${c.reset}\n`);

  const webEnvPath = path.join(__dirname, 'apps', 'web', '.env.local');
  writeEnv(webEnvPath, {
    NEXT_PUBLIC_API_URL: 'http://localhost:3001/api',
  });
  console.log(`  ${c.green}✓${c.reset}  apps/web/.env.local`);

  const apiEnvVars = {
    PORT:              '3001',
    NODE_ENV:          'development',
    FRONTEND_URL:      'http://localhost:3000',
    JWT_SECRET:        jwtSecret,
    ANTHROPIC_API_KEY: anthropicKey,
    OPENAI_API_KEY:    openaiKey,
    ADMIN_PASSWORD:    adminPass,
  };
  if (dbUrl) apiEnvVars['DATABASE_URL'] = dbUrl;

  const apiEnvPath = path.join(__dirname, 'apps', 'api', '.env');
  writeEnv(apiEnvPath, apiEnvVars);
  console.log(`  ${c.green}✓${c.reset}  apps/api/.env`);

  // Done
  console.log(`\n  ${c.gray}${'─'.repeat(48)}${c.reset}`);
  console.log(`\n${c.bold}${c.green}  ✅  Setup complete!${c.reset}\n`);
  console.log(`  ${c.bold}Start the app:${c.reset}\n`);
  console.log(`  ${c.cyan}  npm install${c.reset}`);
  console.log(`  ${c.cyan}  npm run dev${c.reset}\n`);
  console.log(`  The database creates all tables automatically on first start.\n`);
  console.log(`  ${c.bold}  http://localhost:3000${c.reset}        ← App`);
  console.log(`  ${c.bold}  http://localhost:3000/admin${c.reset}  ← Admin panel`);
  console.log(`\n  ${c.gray}  Admin login: 7897671348 · ${adminPass}${c.reset}\n`);
}

main().catch(err => {
  console.error('\n  Error:', err.message);
  process.exit(1);
});
