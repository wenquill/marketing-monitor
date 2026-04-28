import { useState, useEffect, useCallback } from 'react';
import { App } from '../types.tsx';
import { appsApi } from '../api/client.ts';
import { AppFormValues } from '../components/AppForm.tsx';

interface UseAppsReturn {
  apps: App[];
  loading: boolean;
  error: string;
  reload: () => Promise<void>;
  createApp: (values: AppFormValues) => Promise<void>;
  updateApp: (id: number, values: AppFormValues) => Promise<void>;
  deleteApp: (id: number) => Promise<void>;
}

export function useApps(): UseAppsReturn {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
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
    void reload();
  }, [reload]);

  const createApp = useCallback(
    async (values: AppFormValues) => {
      await appsApi.create({ url: values.url, name: values.name, intervalHours: values.intervalHours });
      await reload();
    },
    [reload],
  );

  const updateApp = useCallback(
    async (id: number, values: AppFormValues) => {
      await appsApi.update(id, values);
      await reload();
    },
    [reload],
  );

  const deleteApp = useCallback(
    async (id: number) => {
      await appsApi.delete(id);
      await reload();
    },
    [reload],
  );

  return { apps, loading, error, reload, createApp, updateApp, deleteApp };
}
