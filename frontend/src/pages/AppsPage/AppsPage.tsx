import { useState } from 'react';
import { App, AppFormValues } from '../../types.ts';
import { useApps } from '../../hooks/useApps.ts';
import Modal from '../../components/Modal/Modal.tsx';
import AppForm from '../../components/AppForm/AppForm.tsx';
import AppCard from '../../components/Card/AppCard.tsx';
import Spinner from '../../components/Spinner/Spinner.tsx';
import NoCards from '../../components/Card/NoCards.tsx';
import styles from './AppsPage.module.scss';

export default function AppsPage() {
  const { apps, loading, error, createApp, updateApp, deleteApp } = useApps();

  const [showAdd, setShowAdd] = useState(false);
  const [editApp, setEditApp] = useState<App | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<App | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  async function handleAdd(values: AppFormValues) {
    await createApp(values);
    setShowAdd(false);
  }

  async function handleEdit(values: AppFormValues) {
    if (!editApp) return;
    await updateApp(editApp.id, values);
    setEditApp(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteApp(deleteTarget.id);
      setDeleteTarget(null);
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
        <Spinner />
      ) : apps.length === 0 ? (
        <NoCards setShowAdd={setShowAdd} />
      ) : (
        <div className={styles.grid}>
          {apps.map((app) => (
            <AppCard key={app.id} app={app} onEdit={setEditApp} onDelete={setDeleteTarget} />
          ))}
        </div>
      )}

      {showAdd && (
        <Modal title="Add App" onClose={() => setShowAdd(false)}>
          <AppForm onSubmit={handleAdd} onCancel={() => setShowAdd(false)} />
        </Modal>
      )}

      {editApp && (
        <Modal title="Edit App" onClose={() => setEditApp(null)}>
          <AppForm existing={editApp} onSubmit={handleEdit} onCancel={() => setEditApp(null)} />
        </Modal>
      )}

      {deleteTarget && (
        <Modal
          title="Delete App"
          onClose={() => setDeleteTarget(null)}
          footer={
            <>
              <button
                className="btn btn-secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </>
          }
        >
          <p className="confirm-message">
            Are you sure you want to delete <strong>{deleteTarget.name}</strong>? All screenshots
            will be removed from the database.
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
