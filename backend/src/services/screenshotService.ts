import puppeteer, { Browser } from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { getDb } from '../db/database.js';
import { DbApp, ScreenshotResponse } from '../types.js';

const SCREENSHOTS_DIR = process.env.SCREENSHOTS_DIR
  ? path.resolve(process.env.SCREENSHOTS_DIR)
  : path.join(process.cwd(), 'screenshots');

let browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browser || !browser.connected) {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
      ],
    });

    browser.on('disconnected', () => {
      browser = null;
    });
  }
  return browser;
}

export async function takeScreenshot(app: DbApp): Promise<ScreenshotResponse> {
  const db = getDb();

  const appDir = path.join(SCREENSHOTS_DIR, app.package_id);
  if (!fs.existsSync(appDir)) {
    fs.mkdirSync(appDir, { recursive: true });
  }

  // Build a filesystem-safe timestamp string
  const now = new Date();
  const takenAt = now.toISOString();
  const safeTimestamp = takenAt.replace(/[:.]/g, '-');
  const fileName = `${safeTimestamp}.png`;
  const relativePath = `${app.package_id}/${fileName}`;
  const absolutePath = path.join(SCREENSHOTS_DIR, relativePath);

  try {
    const b = await getBrowser();
    const page = await b.newPage();

    try {
      await page.setViewport({ width: 1280, height: 900 });
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      );
      await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });

      await page.goto(app.url, { waitUntil: 'networkidle2', timeout: 45_000 });

      // Allow any deferred rendering to settle
      await new Promise((resolve) => setTimeout(resolve, 2000));

      await page.screenshot({ path: absolutePath, fullPage: false });
    } finally {
      await page.close();
    }

    const result = db
      .prepare(
        `INSERT INTO screenshots (app_id, file_name, taken_at, status)
         VALUES (?, ?, ?, 'success')`,
      )
      .run(app.id, relativePath, takenAt);

    return {
      id: result.lastInsertRowid as number,
      appId: app.id,
      imageUrl: `/screenshots/${relativePath}`,
      takenAt,
      status: 'success',
      errorMessage: null,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Screenshot] Failed for app ${app.package_id}:`, errorMessage);

    const result = db
      .prepare(
        `INSERT INTO screenshots (app_id, file_name, taken_at, status, error_message)
         VALUES (?, '', ?, 'failed', ?)`,
      )
      .run(app.id, takenAt, errorMessage);

    return {
      id: result.lastInsertRowid as number,
      appId: app.id,
      imageUrl: '',
      takenAt,
      status: 'failed',
      errorMessage,
    };
  }
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

/** Attempt to resolve the app name from the Google Play page title. */
export async function fetchAppName(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) return null;

    const html = await response.text();
    const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (match) {
      return match[1].replace(/\s*[-–|].*$/, '').trim() || null;
    }
  } catch {
    // ignore network / timeout errors
  }
  return null;
}
