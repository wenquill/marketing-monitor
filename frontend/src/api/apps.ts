import { App, CreateAppDto, UpdateAppDto } from '../types';
import { request } from './client';

export const appsApi = {
  getAll: (): Promise<App[]> => request('/apps'),

  getById: (id: number): Promise<App> => request(`/apps/${id}`),

  create: (dto: CreateAppDto): Promise<App> =>
    request('/apps', { method: 'POST', body: JSON.stringify(dto) }),

  update: (id: number, dto: UpdateAppDto): Promise<App> =>
    request(`/apps/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),

  delete: (id: number): Promise<void> => request(`/apps/${id}`, { method: 'DELETE' }),
};
