import { useState, FormEvent } from 'react';
import { App } from '../types';

export interface AppFormValues {
  url: string;
  name?: string;
  intervalHours?: number;
  isActive?: boolean;
}

interface AppFormProps {
  /** When provided, the form is in edit mode */
  existing?: App;
  onSubmit: (values: AppFormValues) => Promise<void>;
  onCancel: () => void;
}

export default function AppForm({ existing, onSubmit, onCancel }: AppFormProps) {
  const [url, setUrl] = useState(existing?.url ?? '');
  const [name, setName] = useState(existing?.name ?? '');
  const [intervalHours, setIntervalHours] = useState(String(existing?.intervalHours ?? 24));
  const [isActive, setIsActive] = useState(existing?.isActive ?? true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!url.trim()) {
      setError('Google Play URL is required.');
      return;
    }

    const hours = parseInt(intervalHours, 10);
    if (isNaN(hours) || hours < 1) {
      setError('Interval must be a positive number of hours.');
      return;
    }

    setSubmitting(true);
    try {
      const values: AppFormValues = { url: url.trim(), name: name.trim() || undefined, intervalHours: hours };
      if (existing) values.isActive = isActive;
      await onSubmit(values);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="form-group">
        <label className="form-label" htmlFor="app-url">
          Google Play URL <span style={{ color: 'red' }}>*</span>
        </label>
        <input
          id="app-url"
          className="form-control"
          type="url"
          placeholder="https://play.google.com/store/apps/details?id=com.example.app"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
        <span className="form-hint">
          Must be a valid Google Play app listing URL.
        </span>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="app-name">
          Display Name <span style={{ color: 'var(--gray-500)' }}>(optional)</span>
        </label>
        <input
          id="app-name"
          className="form-control"
          type="text"
          placeholder="Resolved automatically from the page if left blank"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="app-interval">
          Screenshot Interval (hours)
        </label>
        <input
          id="app-interval"
          className="form-control"
          type="number"
          min="1"
          step="1"
          value={intervalHours}
          onChange={(e) => setIntervalHours(e.target.value)}
        />
        <span className="form-hint">How often to automatically capture a new screenshot.</span>
      </div>

      {existing && (
        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <span className="form-label" style={{ margin: 0 }}>
              Active (auto-screenshots enabled)
            </span>
          </label>
        </div>
      )}

      <div className="modal-footer" style={{ padding: 0, marginTop: 8 }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : existing ? 'Save Changes' : 'Add App'}
        </button>
      </div>
    </form>
  );
}
