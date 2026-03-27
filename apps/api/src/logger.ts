import pino from 'pino';

// ─── Structured logger ────────────────────────────────────────
// - In production: outputs newline-delimited JSON (Render captures + indexes it)
// - In development: pretty-prints via pino-pretty if installed, falls back to JSON
//
// Usage:
//   import { logger } from './logger';
//   logger.info({ userId, route: '/api/generate' }, 'Generation started');
//   logger.error({ err, userId }, 'AI call failed');

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',

  // In production emit plain JSON — fast, grep-able, Render-compatible.
  // In dev you can pipe through `pino-pretty`: `npm run dev | pino-pretty`
  transport: process.env.NODE_ENV !== 'production'
    ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:HH:MM:ss' } }
    : undefined,

  base: {
    service: 'brandforge-api',
    env: process.env.NODE_ENV || 'development',
  },

  // Redact secrets that should never appear in logs
  redact: {
    paths: ['req.headers.authorization', 'body.password', 'body.currentPassword', 'body.newPassword'],
    censor: '[REDACTED]',
  },

  // Serialise Error objects properly (pino doesn't by default)
  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
  },
});

export type Logger = typeof logger;
