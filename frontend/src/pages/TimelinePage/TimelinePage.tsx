import { useParams, Link } from 'react-router-dom';
import { useTimeline } from '../../hooks/useTimeline.ts';
import ScreenshotEntry from '../../components/ScreenshotEntry/ScreenshotEntry.tsx';
import Spinner from '../../components/Spinner/Spinner.tsx';
import styles from './TimelinePage.module.scss';

export default function TimelinePage() {
  const { id } = useParams<{ id: string }>();
  const appId = Number(id);

  const {
    app,
    screenshots,
    total,
    loading,
    loadingMore,
    triggering,
    triggerMessage,
    error,
    loadMore,
    triggerScreenshot,
  } = useTimeline(appId);

  if (loading) {
    return <Spinner />;
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
      <div className={styles.header}>
        <div className={styles.appInfo}>
          <Link
            to="/apps"
            className="btn btn-ghost btn-sm"
            style={{ marginBottom: 8, paddingLeft: 0 }}
          >
            ← Back to Apps
          </Link>
          <h1 className="page-title">{app.name}</h1>
          <div className={styles.appUrl}>
            <a href={app.url} target="_blank" rel="noopener noreferrer">
              {app.url}
            </a>
          </div>
        </div>
        <div className={styles.actions}>
          <button className="btn btn-primary" onClick={triggerScreenshot} disabled={triggering}>
            {triggering ? 'Capturing…' : '📷 Take Screenshot Now'}
          </button>
        </div>
      </div>

      {triggerMessage && (
        <div
          className={`alert ${triggerMessage.startsWith('Screenshot captured') ? 'alert-success' : 'alert-error'}`}
        >
          {triggerMessage}
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

          <div className={styles.list}>
            {screenshots.map((shot) => (
              <ScreenshotEntry key={shot.id} screenshot={shot} />
            ))}
          </div>

          {screenshots.length < total && (
            <div className={styles.loadMore}>
              <button className="btn btn-secondary" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? 'Loading…' : `Load more (${total - screenshots.length} remaining)`}
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
