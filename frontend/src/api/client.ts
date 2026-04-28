import { App, Screenshot, ScreenshotsPage, CreateAppDto, UpdateAppDto } from '../types';

const API_BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error((data as { message?: string }).message ?? `HTTP ${response.status}`);
  }

  return data as T;
}

// ── Apps ──────────────────────────────────────────────────────────────────

export const appsApi = {
  getAll: (): Promise<App[]> => request('/apps'),

  getById: (id: number): Promise<App> => request(`/apps/${id}`),

  create: (dto: CreateAppDto): Promise<App> =>
    request('/apps', { method: 'POST', body: JSON.stringify(dto) }),

  update: (id: number, dto: UpdateAppDto): Promise<App> =>
    request(`/apps/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),

  delete: (id: number): Promise<void> =>
    request(`/apps/${id}`, { method: 'DELETE' }),
};

// ── Screenshots ───────────────────────────────────────────────────────────

export const screenshotsApi = {
  getByApp: (appId: number, limit = 20, offset = 0): Promise<ScreenshotsPage> =>
    request(`/apps/${appId}/screenshots?limit=${limit}&offset=${offset}`),

  trigger: (appId: number): Promise<Screenshot> =>
    request(`/apps/${appId}/screenshots`, { method: 'POST' }),
};
