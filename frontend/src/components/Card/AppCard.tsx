import { Link } from 'react-router-dom';
import { App } from '../../types.ts';
import { formatDate } from '../../utils/format.ts';
import styles from './AppCard.module.scss';

interface AppCardProps {
  app: App;
  onEdit: (app: App) => void;
  onDelete: (app: App) => void;
}

export default function AppCard({ app, onEdit, onDelete }: AppCardProps) {
  return (
    <div className={`card ${styles.card}`}>
      <div className={styles.header}>
        <div className={styles.icon}>📱</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className={styles.title}>{app.name}</div>
          <div className={styles.package}>{app.packageId}</div>
        </div>
        <span className={`badge ${app.isActive ? 'badge-active' : 'badge-paused'}`}>
          {app.isActive ? 'Active' : 'Paused'}
        </span>
      </div>

      <div className={styles.meta}>
        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>Interval</span>
          <span>Every {app.intervalHours}h</span>
        </div>
        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>Last shot</span>
          <span>{app.lastScreenshot ? formatDate(app.lastScreenshot.takenAt) : 'Never'}</span>
        </div>
        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>Added</span>
          <span>{formatDate(app.createdAt)}</span>
        </div>
      </div>

      <div className={styles.actions}>
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
