# Marketing Monitor

A competition monitoring system for Android apps. Periodically captures screenshots of Google Play app listing pages and displays them on a timeline so you can track how competitors update their store presence over time.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js 22+, Express 4, TypeScript, `node:sqlite` (built-in), Puppeteer |
| Frontend | React 18, TypeScript, Vite, React Router v6 |
| Storage | SQLite (via Node.js built-in `node:sqlite`) + local filesystem for screenshots |

## Prerequisites

- **Node.js v22 or later** (the project uses the built-in `node:sqlite` module, available from v22)
- npm

## Getting Started

### 1. Install dependencies

```bash
# From the project root
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure the backend (optional)

Copy the example environment file and edit as needed:

```bash
cd backend
cp .env.example .env
```

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | Backend HTTP port |
| `CHECK_INTERVAL_MINUTES` | `30` | How often the scheduler checks for due screenshots |
| `DATA_DIR` | `./data` | Directory for the SQLite database file |
| `SCREENSHOTS_DIR` | `./screenshots` | Directory where screenshot images are saved |

### 3. Start the development servers

Open **two terminals**:

```bash
# Terminal 1 — backend
cd backend
npm run dev
```

```bash
# Terminal 2 — frontend
cd frontend
npm run dev
```

The frontend will be available at **http://localhost:5173**. API requests are proxied to the backend on port 3001.

> **Note:** On first run, Puppeteer will download a bundled Chromium binary (~170 MB). This only happens once and may take a minute.

## How It Works

1. **Add an app** — paste a Google Play URL (e.g. `https://play.google.com/store/apps/details?id=com.example.app`). The system automatically extracts the package ID and resolves the app name from the page.
2. **Scheduler** — every `CHECK_INTERVAL_MINUTES` the scheduler checks for apps whose last successful screenshot is older than their configured interval (default: 24 h). Due apps are screenshotted in sequence.
3. **Manual capture** — on an app's Timeline page, click **Take Screenshot Now** to trigger an immediate capture.
4. **Timeline view** — screenshots are displayed newest-first with the exact capture timestamp. Failed attempts show an error message rather than an image.

## API Reference

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/apps` | List all tracked apps (with last screenshot) |
| `POST` | `/api/apps` | Add a new app |
| `PUT` | `/api/apps/:id` | Update an app (name, URL, interval, active status) |
| `DELETE` | `/api/apps/:id` | Delete an app and all its screenshots |
| `GET` | `/api/apps/:id/screenshots` | Paginated screenshot list (`?limit=20&offset=0`) |
| `POST` | `/api/apps/:id/screenshots` | Trigger an immediate screenshot |
| `GET` | `/api/health` | Health check |

## Project Structure

```
home-task-rounds/
├── backend/
│   ├── src/
│   │   ├── index.ts                  # Express server & graceful shutdown
│   │   ├── types.ts                  # Shared DB + API types
│   │   ├── db/
│   │   │   └── database.ts           # SQLite initialisation & migrations
│   │   ├── routes/
│   │   │   ├── apps.ts               # CRUD for tracked apps
│   │   │   └── screenshots.ts        # Screenshot listing & manual trigger
│   │   └── services/
│   │       ├── screenshotService.ts  # Puppeteer screenshot logic
│   │       └── schedulerService.ts   # node-cron periodic checker
│   ├── data/                         # SQLite DB (created at runtime)
│   ├── screenshots/                  # Captured images (created at runtime)
│   └── package.json
└── frontend/
    ├── src/
    │   ├── App.tsx                   # Router & navbar
    │   ├── index.css                 # Global styles
    │   ├── types.ts                  # Shared frontend types
    │   ├── api/
    │   │   └── client.ts             # Typed fetch wrappers
    │   ├── pages/
    │   │   ├── AppsPage.tsx          # Manage tracked apps
    │   │   └── TimelinePage.tsx      # Per-app screenshot timeline
    │   └── components/
    │       ├── AppForm.tsx           # Add / edit form
    │       └── Modal.tsx             # Reusable modal dialog
    └── package.json
```

## Production Build

```bash
# Build backend
cd backend && npm run build   # outputs to backend/dist/

# Build frontend
cd frontend && npm run build  # outputs to frontend/dist/
```

To serve the frontend statically you can configure the backend to serve `frontend/dist/` or deploy to any static host (Vercel, Netlify, S3, etc.).
