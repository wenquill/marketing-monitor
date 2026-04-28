import { useState, useEffect, useCallback } from 'react';
import { App, Screenshot } from '../types.tsx';
import { screenshotsApi } from '../api/screenshots.ts';
import { appsApi } from '../api/apps.ts';

const PAGE_SIZE = 15;

interface UseTimelineReturn {
  app: App | null;
  screenshots: Screenshot[];
  total: number;
  loading: boolean;
  loadingMore: boolean;
  triggering: boolean;
  triggerMessage: string;
  error: string;
  loadMore: () => Promise<void>;
  triggerScreenshot: () => Promise<void>;
}

export function useTimeline(appId: number): UseTimelineReturn {
  const [app, setApp] = useState<App | null>(null);
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [triggerMessage, setTriggerMessage] = useState('');
  const [error, setError] = useState('');

  const fetchScreenshots = useCallback(
    async (offset: number, replace: boolean) => {
      const page = await screenshotsApi.getByApp(appId, PAGE_SIZE, offset);
      setTotal(page.total);
      setScreenshots((prev) => (replace ? page.screenshots : [...prev, ...page.screenshots]));
    },
    [appId],
  );

  useEffect(() => {
    async function init() {
      try {
        const [appData] = await Promise.all([
          appsApi.getById(appId),
          fetchScreenshots(0, true),
        ]);
        setApp(appData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data.');
      } finally {
        setLoading(false);
      }
    }
    void init();
  }, [appId, fetchScreenshots]);

  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    try {
      await fetchScreenshots(screenshots.length, false);
    } finally {
      setLoadingMore(false);
    }
  }, [fetchScreenshots, screenshots.length]);

  const triggerScreenshot = useCallback(async () => {
    setTriggering(true);
    setTriggerMessage('');
    try {
      const result = await screenshotsApi.trigger(appId);
      if (result.status === 'success') {
        setTriggerMessage('Screenshot captured successfully.');
        await fetchScreenshots(0, true);
      } else {
        setTriggerMessage(`Screenshot failed: ${result.errorMessage ?? 'Unknown error'}`);
      }
    } catch (err) {
      setTriggerMessage(err instanceof Error ? err.message : 'Failed to trigger screenshot.');
    } finally {
      setTriggering(false);
    }
  }, [appId, fetchScreenshots]);

  return {
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
  };
}
