import { Router, Request, Response } from 'express';
import { getDb } from '../db/database.js';
import { DbApp, DbScreenshot } from '../types.js';
import { takeScreenshot } from '../services/screenshotService.js';
import { row } from '../utils/db.js';
import { toScreenshotResponse } from '../utils/mappers.js';

const router = Router({ mergeParams: true });

// GET /api/apps/:appId/screenshots?limit=20&offset=0
router.get('/', (req: Request, res: Response) => {
  const db = getDb();
  const app = db.prepare('SELECT id FROM apps WHERE id = ?').get(req.params.appId);

  if (!app) {
    res.status(404).json({ message: 'App not found' });
    return;
  }

  const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) ?? '20', 10)));
  const offset = Math.max(0, parseInt((req.query.offset as string) ?? '0', 10));

  const screenshots = row<DbScreenshot[]>(
    db
      .prepare(
        `SELECT * FROM screenshots
         WHERE app_id = ?
         ORDER BY taken_at DESC
         LIMIT ? OFFSET ?`
      )
      .all(req.params.appId, limit, offset)
  );

  const total = row<{ count: number }>(
    db.prepare('SELECT COUNT(*) as count FROM screenshots WHERE app_id = ?').get(req.params.appId)
  ).count;

  res.json({ total, screenshots: screenshots.map(toScreenshotResponse) });
});

// POST /api/apps/:appId/screenshots — manually trigger a screenshot
router.post('/', async (req: Request, res: Response) => {
  const db = getDb();
  const app = row<DbApp | undefined>(
    db.prepare('SELECT * FROM apps WHERE id = ?').get(req.params.appId)
  );

  if (!app) {
    res.status(404).json({ message: 'App not found' });
    return;
  }

  const result = await takeScreenshot(app);
  res.status(result.status === 'success' ? 201 : 422).json(result);
});

export default router;
