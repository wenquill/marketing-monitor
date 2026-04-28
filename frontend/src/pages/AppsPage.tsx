import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { App } from '../types';
import { appsApi } from '../api/client';
import Modal from '../components/Modal';
import AppForm, { AppFormValues } from '../components/AppForm';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

export default function AppsPage() {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state
  const [showAdd, setShowAdd] = useState(false);
  const [editApp, setEditApp] = useState<App | null>(null);
  const [deleteApp, setDeleteApp] = useState<App | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const loadApps = useCallback(async () => {
    try {
      const data = await appsApi.getAll();
      setApps(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load apps.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadApps();
  }, [loadApps]);

  async function handleAdd(values: AppFormValues) {
    await appsApi.create({ url: values.url, name: values.name, intervalHours: values.intervalHours });
    setShowAdd(false);
    await loadApps();
  }

  async function handleEdit(values: AppFormValues) {
    if (!editApp) return;
    await appsApi.update(editApp.id, values);
    setEditApp(null);
    await loadApps();
  }

  async function handleDelete() {
    if (!deleteApp) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await appsApi.delete(deleteApp.id);
      setDeleteApp(null);
      await loadApps();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete app.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Tracked Apps</h1>
          <p className="page-subtitle">
            {apps.length} app{apps.length !== 1 ? 's' : ''} monitored
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          + Add App
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="spinner">
          <div className="spinner-ring" />
        </div>
      ) : apps.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">📱</div>
          <h3>No apps tracked yet</h3>
          <p>Add a Google Play app to start monitoring its listing page.</p>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            Add your first app
          </button>
        </div>
      ) : (
        <div className="apps-grid">
          {apps.map((app) => (
            <div key={app.id} className="card app-card">
              <div className="app-card-header">
                <div className="app-card-icon">📱</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="app-card-title">{app.name}</div>
                  <div className="app-card-package">{app.packageId}</div>
                </div>
                <span className={`badge ${app.isActive ? 'badge-active' : 'badge-paused'}`}>
                  {app.isActive ? 'Active' : 'Paused'}
                </span>
              </div>

              <div className="app-card-meta">
                <div className="meta-row">
                  <span className="meta-label">Interval</span>
                  <span>Every {app.intervalHours}h</span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">Last shot</span>
                  <span>
                    {app.lastScreenshot
                      ? formatDate(app.lastScreenshot.takenAt)
                      : 'Never'}
                  </span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">Added</span>
                  <span>{formatDate(app.createdAt)}</span>
                </div>
              </div>

              <div className="app-card-actions">
                <Link to={`/apps/${app.id}/timeline`} className="btn btn-primary btn-sm">
                  View Timeline
                </Link>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setEditApp(app)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => setDeleteApp(app)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add App modal */}
      {showAdd && (
        <Modal title="Add App" onClose={() => setShowAdd(false)}>
          <AppForm onSubmit={handleAdd} onCancel={() => setShowAdd(false)} />
        </Modal>
      )}

      {/* Edit App modal */}
      {editApp && (
        <Modal title="Edit App" onClose={() => setEditApp(null)}>
          <AppForm
            existing={editApp}
            onSubmit={handleEdit}
            onCancel={() => setEditApp(null)}
          />
        </Modal>
      )}

      {/* Delete confirmation modal */}
      {deleteApp && (
        <Modal
          title="Delete App"
          onClose={() => setDeleteApp(null)}
          footer={
            <>
              <button
                className="btn btn-secondary"
                onClick={() => setDeleteApp(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </>
          }
        >
          <p className="confirm-message">
            Are you sure you want to delete <strong>{deleteApp.name}</strong>? All
            screenshots will be removed from the database.
          </p>
          {deleteError && (
            <div className="alert alert-error" style={{ marginTop: 12 }}>
              {deleteError}
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
