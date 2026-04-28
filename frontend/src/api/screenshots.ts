import { Screenshot, ScreenshotsPage } from '../types';
import { request } from './client';

export const screenshotsApi = {
  getByApp: (appId: number, limit = 20, offset = 0): Promise<ScreenshotsPage> =>
    request(`/apps/${appId}/screenshots?limit=${limit}&offset=${offset}`),

  trigger: (appId: number): Promise<Screenshot> =>
    request(`/apps/${appId}/screenshots`, { method: 'POST' }),
};
