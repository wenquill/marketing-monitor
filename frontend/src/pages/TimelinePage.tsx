import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { App, Screenshot } from '../types';
import { appsApi, screenshotsApi } from '../api/client';

const PAGE_SIZE = 15;

function formatScreenshotTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  });
}

export default function TimelinePage() {
  const { id } = useParams<{ id: string }>();
  const appId = Number(id);

  const [app, setApp] = useState<App | null>(null);
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [triggerMsg, setTriggerMsg] = useState('');
  const [error, setError] = useState('');

  const loadApp = useCallback(async () => {
    const data = await appsApi.getById(appId);
    setApp(data);
  }, [appId]);

  const loadScreenshots = useCallback(
    async (offset: number, replace: boolean) => {
      const page = await screenshotsApi.getByApp(appId, PAGE_SIZE, offset);
      setTotal(page.total);
      if (replace) {
        setScreenshots(page.screenshots);
      } else {
        setScreenshots((prev) => [...prev, ...page.screenshots]);
      }
    },
    [appId],
  );

  useEffect(() => {
    async function init() {
      try {
        await Promise.all([loadApp(), loadScreenshots(0, true)]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data.');
      } finally {
        setLoading(false);
      }
    }
    void init();
  }, [loadApp, loadScreenshots]);

  async function handleLoadMore() {
    setLoadingMore(true);
    try {
      await loadScreenshots(screenshots.length, false);
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleTrigger() {
    setTriggering(true);
    setTriggerMsg('');
    try {
      const result = await screenshotsApi.trigger(appId);
      if (result.status === 'success') {
        setTriggerMsg('Screenshot captured successfully.');
        // Reload screenshots list
        const page = await screenshotsApi.getByApp(appId, PAGE_SIZE, 0);
        setTotal(page.total);
        setScreenshots(page.screenshots);
      } else {
        setTriggerMsg(`Screenshot failed: ${result.errorMessage ?? 'Unknown error'}`);
      }
    } catch (err) {
      setTriggerMsg(err instanceof Error ? err.message : 'Failed to trigger screenshot.');
    } finally {
      setTriggering(false);
    }
  }

  if (loading) {
    return (
      <div className="spinner">
        <div className="spinner-ring" />
      </div>
    );
  }

  if (error || !app) {
    return (
      <div>
        <Link to="/apps" className="btn btn-secondary btn-sm" style={{ marginBottom: 16 }}>
          ← Back to Apps
        </Link>
        <div className="alert alert-error">{error || 'App not found.'}</div>
      </div>
    );
  }

  return (
    <>
      <div className="timeline-header">
        <div className="timeline-app-info">
          <Link to="/apps" className="btn btn-ghost btn-sm" style={{ marginBottom: 8, paddingLeft: 0 }}>
            ← Back to Apps
          </Link>
          <h1 className="page-title">{app.name}</h1>
          <div className="timeline-app-url">
            <a href={app.url} target="_blank" rel="noopener noreferrer">
              {app.url}
            </a>
          </div>
        </div>
        <div className="timeline-actions">
          <button
            className="btn btn-primary"
            onClick={handleTrigger}
            disabled={triggering}
          >
            {triggering ? 'Capturing…' : '📷 Take Screenshot Now'}
          </button>
        </div>
      </div>

      {triggerMsg && (
        <div
          className={`alert ${triggerMsg.startsWith('Screenshot captured') ? 'alert-success' : 'alert-error'}`}
        >
          {triggerMsg}
        </div>
      )}

      {screenshots.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">📸</div>
          <h3>No screenshots yet</h3>
          <p>
            Screenshots are taken automatically every {app.intervalHours} hour
            {app.intervalHours !== 1 ? 's' : ''}. You can also trigger one manually above.
          </p>
        </div>
      ) : (
        <>
          <p className="page-subtitle" style={{ marginBottom: 16 }}>
            Showing {screenshots.length} of {total} screenshot{total !== 1 ? 's' : ''} — newest
            first
          </p>

          <div className="timeline-list">
            {screenshots.map((shot) => (
              <div key={shot.id} className="screenshot-entry">
                <div className="screenshot-time">
                  <span
                    className={`screenshot-status-dot ${shot.status}`}
                    title={shot.status}
                  />
                  Screenshot time: {formatScreenshotTime(shot.takenAt)}
                </div>
                {shot.status === 'success' ? (
                  <img
                    className="screenshot-image"
                    src={shot.imageUrl}
                    alt={`Screenshot taken at ${shot.takenAt}`}
                    loading="lazy"
                  />
                ) : (
                  <div className="screenshot-error">
                    <strong>Screenshot failed</strong>
                    {shot.errorMessage}
                  </div>
                )}
              </div>
            ))}
          </div>

          {screenshots.length < total && (
            <div className="load-more">
              <button
                className="btn btn-secondary"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? 'Loading…' : `Load more (${total - screenshots.length} remaining)`}
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
