import { SQLInputValue } from 'node:sqlite';
import { getDb } from '../db/database.js';
import { DbApp, DbScreenshot, AppResponse, CreateAppDto, UpdateAppDto } from '../types.js';
import { row } from '../utils/db.js';
import { toAppResponse } from '../utils/mappers.js';
import { parsePlayUrl } from '../utils/validators.js';
import { fetchAppName } from './screenshotService.js';

function withLastScreenshot(app: DbApp): AppResponse {
  const db = getDb();
  const last = row<DbScreenshot | undefined>(
    db
      .prepare('SELECT * FROM screenshots WHERE app_id = ? ORDER BY taken_at DESC LIMIT 1')
      .get(app.id)
  );
  return toAppResponse(app, last ?? null);
}

export function getAllApps(): AppResponse[] {
  const db = getDb();
  const apps = row<DbApp[]>(db.prepare('SELECT * FROM apps ORDER BY created_at DESC').all());
  return apps.map(withLastScreenshot);
}

export function getAppById(id: number | string): AppResponse | null {
  const db = getDb();
  const app = row<DbApp | undefined>(db.prepare('SELECT * FROM apps WHERE id = ?').get(id));
  if (!app) return null;
  return withLastScreenshot(app);
}

export async function createApp(
  dto: CreateAppDto
): Promise<{ error: string; status: number } | AppResponse> {
  const url = dto.url.trim();
  const packageId = parsePlayUrl(url);
  if (!packageId) {
    return {
      status: 400,
      error: 'url must be a valid Google Play app URL (play.google.com/store/apps/details?id=...)',
    };
  }

  const intervalHours =
    typeof dto.intervalHours === 'number' && dto.intervalHours > 0
      ? Math.round(dto.intervalHours)
      : 24;

  let name: string = typeof dto.name === 'string' && dto.name.trim() ? dto.name.trim() : '';
  if (!name) {
    name = (await fetchAppName(url)) ?? packageId;
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM apps WHERE package_id = ?').get(packageId);
  if (existing) {
    return { status: 409, error: `App with package ID "${packageId}" is already tracked` };
  }

  const result = db
    .prepare('INSERT INTO apps (name, package_id, url, interval_hours) VALUES (?, ?, ?, ?)')
    .run(name, packageId, url, intervalHours);

  const created = row<DbApp>(
    db.prepare('SELECT * FROM apps WHERE id = ?').get(result.lastInsertRowid)
  );
  return toAppResponse(created, null);
}

export async function updateApp(
  id: number | string,
  dto: Partial<UpdateAppDto>
): Promise<{ error: string; status: number } | AppResponse | null> {
  const db = getDb();
  const app = row<DbApp | undefined>(db.prepare('SELECT * FROM apps WHERE id = ?').get(id));
  if (!app) return null;

  const fields: string[] = [];
  const values: SQLInputValue[] = [];

  if (typeof dto.name === 'string' && dto.name.trim()) {
    fields.push('name = ?');
    values.push(dto.name.trim());
  }

  if (typeof dto.url === 'string' && dto.url.trim()) {
    const packageId = parsePlayUrl(dto.url.trim());
    if (!packageId) {
      return { status: 400, error: 'url must be a valid Google Play app URL' };
    }
    const conflict = db
      .prepare('SELECT id FROM apps WHERE package_id = ? AND id != ?')
      .get(packageId, app.id);
    if (conflict) {
      return { status: 409, error: `Another app with package ID "${packageId}" already exists` };
    }
    fields.push('url = ?', 'package_id = ?');
    values.push(dto.url.trim(), packageId);
  }

  if (typeof dto.intervalHours === 'number' && dto.intervalHours > 0) {
    fields.push('interval_hours = ?');
    values.push(Math.round(dto.intervalHours));
  }

  if (typeof dto.isActive === 'boolean') {
    fields.push('is_active = ?');
    values.push(dto.isActive ? 1 : 0);
  }

  if (fields.length === 0) {
    return { status: 400, error: 'No valid fields to update' };
  }

  fields.push("updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')");
  values.push(app.id);

  db.prepare(`UPDATE apps SET ${fields.join(', ')} WHERE id = ?`).run(...values);

  return withLastScreenshot(row<DbApp>(db.prepare('SELECT * FROM apps WHERE id = ?').get(app.id)));
}

export function deleteApp(id: number | string): boolean {
  const db = getDb();
  const app = db.prepare('SELECT id FROM apps WHERE id = ?').get(id);
  if (!app) return false;
  db.prepare('DELETE FROM apps WHERE id = ?').run(id);
  return true;
}
