import { Router, Request, Response } from 'express';
import { SQLInputValue } from 'node:sqlite';
import { getDb } from '../db/database.js';
import { DbApp, DbScreenshot, AppResponse, CreateAppDto, UpdateAppDto } from '../types.js';
import { fetchAppName } from '../services/screenshotService.js';

function row<T>(v: unknown): T { return v as T; }

const router = Router();

function parsePlayUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes('play.google.com')) return null;
    if (!parsed.pathname.startsWith('/store/apps/details')) return null;
    const id = parsed.searchParams.get('id');
    if (!id || !/^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/.test(id)) return null;
    return id;
  } catch {
    return null;
  }
}

function toAppResponse(app: DbApp, lastScreenshot?: DbScreenshot | null): AppResponse {
  return {
    id: app.id,
    name: app.name,
    packageId: app.package_id,
    url: app.url,
    intervalHours: app.interval_hours,
    isActive: app.is_active === 1,
    createdAt: app.created_at,
    updatedAt: app.updated_at,
    lastScreenshot: lastScreenshot
      ? {
          id: lastScreenshot.id,
          appId: lastScreenshot.app_id,
          imageUrl: lastScreenshot.file_name ? `/screenshots/${lastScreenshot.file_name}` : '',
          takenAt: lastScreenshot.taken_at,
          status: lastScreenshot.status as 'success' | 'failed',
          errorMessage: lastScreenshot.error_message,
        }
      : null,
  };
}

// GET /api/apps
router.get('/', (_req: Request, res: Response) => {
  const db = getDb();
  const apps = row<DbApp[]>(db.prepare('SELECT * FROM apps ORDER BY created_at DESC').all());

  const result = apps.map((app) => {
    const last = row<DbScreenshot | undefined>(
      db
        .prepare(`SELECT * FROM screenshots WHERE app_id = ? ORDER BY taken_at DESC LIMIT 1`)
        .get(app.id),
    );
    return toAppResponse(app, last ?? null);
  });

  res.json(result);
});

// GET /api/apps/:id
router.get('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const app = row<DbApp | undefined>(db.prepare('SELECT * FROM apps WHERE id = ?').get(req.params.id));

  if (!app) {
    res.status(404).json({ message: 'App not found' });
    return;
  }

  const last = row<DbScreenshot | undefined>(
    db
      .prepare(`SELECT * FROM screenshots WHERE app_id = ? ORDER BY taken_at DESC LIMIT 1`)
      .get(app.id),
  );

  res.json(toAppResponse(app, last ?? null));
});

// POST /api/apps
router.post('/', async (req: Request, res: Response) => {
  const body = req.body as Partial<CreateAppDto>;

  if (!body.url || typeof body.url !== 'string') {
    res.status(400).json({ message: 'url is required' });
    return;
  }

  const packageId = parsePlayUrl(body.url.trim());
  if (!packageId) {
    res
      .status(400)
      .json({ message: 'url must be a valid Google Play app URL (play.google.com/store/apps/details?id=...)' });
    return;
  }

  const intervalHours =
    typeof body.intervalHours === 'number' && body.intervalHours > 0
      ? Math.round(body.intervalHours)
      : 24;

  // Resolve the app name: use provided name, fall back to page title, then package ID
  let name: string = typeof body.name === 'string' && body.name.trim() ? body.name.trim() : '';
  if (!name) {
    name = (await fetchAppName(body.url.trim())) ?? packageId;
  }

  const db = getDb();

  const existing = db
    .prepare('SELECT id FROM apps WHERE package_id = ?')
    .get(packageId);
  if (existing) {
    res.status(409).json({ message: `App with package ID "${packageId}" is already tracked` });
    return;
  }

  const result = db
    .prepare(
      `INSERT INTO apps (name, package_id, url, interval_hours)
       VALUES (?, ?, ?, ?)`,
    )
    .run(name, packageId, body.url.trim(), intervalHours);

  const created = row<DbApp>(
    db.prepare('SELECT * FROM apps WHERE id = ?').get(result.lastInsertRowid),
  );

  res.status(201).json(toAppResponse(created, null));
});

// PUT /api/apps/:id
router.put('/:id', async (req: Request, res: Response) => {
  const db = getDb();
  const app = row<DbApp | undefined>(db.prepare('SELECT * FROM apps WHERE id = ?').get(req.params.id));

  if (!app) {
    res.status(404).json({ message: 'App not found' });
    return;
  }

  const body = req.body as Partial<UpdateAppDto>;
  const fields: string[] = [];
  const values: SQLInputValue[] = [];

  if (typeof body.name === 'string' && body.name.trim()) {
    fields.push('name = ?');
    values.push(body.name.trim());
  }

  if (typeof body.url === 'string' && body.url.trim()) {
    const packageId = parsePlayUrl(body.url.trim());
    if (!packageId) {
      res
        .status(400)
        .json({ message: 'url must be a valid Google Play app URL' });
      return;
    }
    
    // Prevent duplicate package_id on update
    const conflict = db
      .prepare('SELECT id FROM apps WHERE package_id = ? AND id != ?')
      .get(packageId, app.id);
    if (conflict) {
      res.status(409).json({ message: `Another app with package ID "${packageId}" already exists` });
      return;
    }
    fields.push('url = ?', 'package_id = ?');
    values.push(body.url.trim(), packageId);
  }

  if (typeof body.intervalHours === 'number' && body.intervalHours > 0) {
    fields.push('interval_hours = ?');
    values.push(Math.round(body.intervalHours));
  }

  if (typeof body.isActive === 'boolean') {
    fields.push('is_active = ?');
    values.push(body.isActive ? 1 : 0);
  }

  if (fields.length === 0) {
    res.status(400).json({ message: 'No valid fields to update' });
    return;
  }

  fields.push("updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')");
  values.push(app.id);

  db.prepare(`UPDATE apps SET ${fields.join(', ')} WHERE id = ?`).run(...values);

  const updated = row<DbApp>(db.prepare('SELECT * FROM apps WHERE id = ?').get(app.id));
  const last = row<DbScreenshot | undefined>(
    db
      .prepare(`SELECT * FROM screenshots WHERE app_id = ? ORDER BY taken_at DESC LIMIT 1`)
      .get(app.id),
  );

  res.json(toAppResponse(updated, last ?? null));
});

// DELETE /api/apps/:id
router.delete('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const app = db.prepare('SELECT id FROM apps WHERE id = ?').get(req.params.id);

  if (!app) {
    res.status(404).json({ message: 'App not found' });
    return;
  }

  db.prepare('DELETE FROM apps WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

export default router;
