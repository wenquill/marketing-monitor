import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

import { getDb, closeDb } from './db/database.js';
import appsRouter from './routes/apps.js';
import screenshotsRouter from './routes/screenshots.js';
import { startScheduler } from './services/schedulerService.js';
import { closeBrowser } from './services/screenshotService.js';

const PORT = parseInt(process.env.PORT ?? '3001', 10);

const SCREENSHOTS_DIR = process.env.SCREENSHOTS_DIR
  ? path.resolve(process.env.SCREENSHOTS_DIR)
  : path.join(process.cwd(), 'screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const app = express();

const allowedOrigins =
  process.env.NODE_ENV === 'production'
    ? (process.env.CORS_ORIGIN ?? '*')
    : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  })
);
app.use(express.json({ limit: '1mb' }));

app.use('/screenshots', express.static(SCREENSHOTS_DIR));

app.use('/api/apps', appsRouter);
app.use('/api/apps/:appId/screenshots', screenshotsRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

getDb();

const server = app.listen(PORT, () => {
  console.log(`[Server] Listening on http://localhost:${PORT}`);
  startScheduler();
});

async function shutdown(signal: string): Promise<void> {
  console.log(`\n[Server] Received ${signal} — shutting down…`);
  server.close(() => {
    closeBrowser()
      .then(() => closeDb())
      .then(() => {
        console.log('[Server] Goodbye.');
        process.exit(0);
      })
      .catch(() => process.exit(1));
  });
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
