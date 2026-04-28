import cron from 'node-cron';
import { getDb } from '../db/database.js';
import { takeScreenshot } from './screenshotService.js';
import { DbApp } from '../types.js';
import { row } from '../utils/db.js';

const CHECK_INTERVAL_MINUTES = Math.max(
  1,
  parseInt(process.env.CHECK_INTERVAL_MINUTES ?? '30', 10)
);

export function startScheduler(): void {
  // Run immediately on startup, then on the cron schedule
  void checkAndTakeScreenshots();

  const expression = `*/${CHECK_INTERVAL_MINUTES} * * * *`;
  cron.schedule(expression, () => {
    void checkAndTakeScreenshots();
  });

  console.log(`[Scheduler] Started — checking every ${CHECK_INTERVAL_MINUTES} minute(s).`);
}

async function checkAndTakeScreenshots(): Promise<void> {
  const db = getDb();

  // Find active apps whose last successful screenshot is older than their interval
  // (or that have never been screenshotted successfully).
  const apps = row<DbApp[]>(
    db
      .prepare(
        `SELECT a.*
       FROM apps a
       WHERE a.is_active = 1
         AND (
           NOT EXISTS (
             SELECT 1 FROM screenshots s
             WHERE s.app_id = a.id AND s.status = 'success'
           )
           OR (
             SELECT MAX(s.taken_at) FROM screenshots s
             WHERE s.app_id = a.id AND s.status = 'success'
           ) < strftime('%Y-%m-%dT%H:%M:%SZ',
               datetime('now', '-' || a.interval_hours || ' hours'))
         )`
      )
      .all()
  );

  if (apps.length === 0) {
    console.log('[Scheduler] No apps due for screenshots.');
    return;
  }

  console.log(`[Scheduler] ${apps.length} app(s) due — taking screenshots…`);

  for (const app of apps) {
    try {
      console.log(`[Scheduler] Processing: ${app.name} (${app.package_id})`);
      const result = await takeScreenshot(app);
      if (result.status === 'success') {
        console.log(`[Scheduler] Success: ${app.name}`);
      } else {
        console.warn(`[Scheduler] Error: ${app.name}: ${result.errorMessage}`);
      }
    } catch (err) {
      console.error(`[Scheduler] Unexpected error for ${app.name}:`, err);
    }
  }
}
