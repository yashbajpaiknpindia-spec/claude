#!/usr/bin/env node
const { Client } = require('pg');
const fs   = require('fs');
const path = require('path');

const c = { green:'\x1b[32m',red:'\x1b[31m',cyan:'\x1b[36m',bold:'\x1b[1m',reset:'\x1b[0m',yellow:'\x1b[33m' };

// Retry connecting to DB with exponential backoff.
// Render Postgres can take a few seconds to accept connections on cold start.
async function connectWithRetry(config, maxAttempts = 5) {
  for (let i = 0; i < maxAttempts; i++) {
    const client = new Client(config);
    try {
      await client.connect();
      return client;
    } catch (err) {
      await client.end().catch(() => {});
      if (i === maxAttempts - 1) throw err;
      const delay = 1000 * Math.pow(2, i); // 1s, 2s, 4s, 8s, 16s
      console.log(`  ${c.yellow}⟳${c.reset} DB not ready (attempt ${i + 1}/${maxAttempts}), retrying in ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

async function migrate() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error(`\n${c.red}Error:${c.reset} DATABASE_URL not set.\n`);
    process.exit(1);
  }

  let client;
  try {
    console.log(`\n${c.bold}Running BrandForge migrations...${c.reset}\n`);
    client = await connectWithRetry({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
    console.log(`  ${c.green}✓${c.reset} Connected\n`);

    const files = [
      ['schema.sql',       path.join(__dirname,'..','packages','db','schema.sql')],
      ['admin-schema.sql', path.join(__dirname,'..','packages','db','admin-schema.sql')],
    ];

    for (const [name, file] of files) {
      process.stdout.write(`  ${name}... `);
      await client.query(fs.readFileSync(file, 'utf8'));
      console.log(`${c.green}done${c.reset}`);
    }

    console.log(`\n  ${c.bold}${c.green}All done! Your Render database is ready.${c.reset}\n`);
  } catch (err) {
    if (err.message && err.message.includes('already exists')) {
      console.log(`${c.yellow}already exists (ok)${c.reset}`);
      console.log(`\n  ${c.green}Migration already ran — database is fine.${c.reset}\n`);
    } else {
      console.error(`\n  ${c.red}Error:${c.reset}`, err.message, '\n');
      process.exit(1);
    }
  } finally {
    if (client) await client.end().catch(() => {});
  }
}

migrate();
