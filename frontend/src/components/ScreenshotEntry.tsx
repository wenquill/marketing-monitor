import { Screenshot } from '../types.tsx';
import { formatScreenshotTime } from '../utils/format.ts';

interface ScreenshotEntryProps {
  screenshot: Screenshot;
}

export default function ScreenshotEntry({ screenshot }: ScreenshotEntryProps) {
  return (
    <div className="screenshot-entry">
      <div className="screenshot-time">
        <span
          className={`screenshot-status-dot ${screenshot.status}`}
          title={screenshot.status}
        />
        Screenshot time: {formatScreenshotTime(screenshot.takenAt)}
      </div>
      {screenshot.status === 'success' ? (
        <img
          className="screenshot-image"
          src={screenshot.imageUrl}
          alt={`Screenshot taken at ${screenshot.takenAt}`}
          loading="lazy"
        />
      ) : (
        <div className="screenshot-error">
          <strong>Screenshot failed</strong>
          {screenshot.errorMessage}
        </div>
      )}
    </div>
  );
}
