import { Link } from 'react-router-dom';
import { App } from '../../types.ts';
import { formatDate } from '../../utils/format.ts';

interface AppCardProps {
  app: App;
  onEdit: (app: App) => void;
  onDelete: (app: App) => void;
}

export default function AppCard({ app, onEdit, onDelete }: AppCardProps) {
  return (
    <div className="card app-card">
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
          <span>{app.lastScreenshot ? formatDate(app.lastScreenshot.takenAt) : 'Never'}</span>
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
        <button className="btn btn-secondary btn-sm" onClick={() => onEdit(app)}>
          Edit
        </button>
        <button className="btn btn-danger btn-sm" onClick={() => onDelete(app)}>
          Delete
        </button>
      </div>
    </div>
  );
}
