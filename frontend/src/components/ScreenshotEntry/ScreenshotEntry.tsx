import { Screenshot } from '../../types.ts';
import { formatScreenshotTime } from '../../utils/format.ts';
import styles from './ScreenshotEntry.module.scss';

interface ScreenshotEntryProps {
  screenshot: Screenshot;
}

export default function ScreenshotEntry({ screenshot }: ScreenshotEntryProps) {
  return (
    <div className={styles.entry}>
      <div className={styles.time}>
        <span
          className={`${styles.statusDot} ${styles[screenshot.status]}`}
          title={screenshot.status}
        />
        Screenshot time: {formatScreenshotTime(screenshot.takenAt)}
      </div>
      {screenshot.status === 'success' ? (
        <img
          className={styles.image}
          src={screenshot.imageUrl}
          alt={`Screenshot taken at ${screenshot.takenAt}`}
          loading="lazy"
        />
      ) : (
        <div className={styles.error}>
          <strong>Screenshot failed</strong>
          {screenshot.errorMessage}
        </div>
      )}
    </div>
  );
}
