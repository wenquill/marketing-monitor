import { DbApp, DbScreenshot, AppResponse, ScreenshotResponse } from '../types.js';

export function toAppResponse(app: DbApp, lastScreenshot?: DbScreenshot | null): AppResponse {
  return {
    id: app.id,
    name: app.name,
    packageId: app.package_id,
    url: app.url,
    intervalHours: app.interval_hours,
    isActive: app.is_active === 1,
    createdAt: app.created_at,
    updatedAt: app.updated_at,
    lastScreenshot: lastScreenshot
      ? {
          id: lastScreenshot.id,
          appId: lastScreenshot.app_id,
          imageUrl: lastScreenshot.file_name ? `/screenshots/${lastScreenshot.file_name}` : '',
          takenAt: lastScreenshot.taken_at,
          status: lastScreenshot.status as 'success' | 'failed',
          errorMessage: lastScreenshot.error_message,
        }
      : null,
  };
}

export function toScreenshotResponse(s: DbScreenshot): ScreenshotResponse {
  return {
    id: s.id,
    appId: s.app_id,
    imageUrl: s.file_name ? `/screenshots/${s.file_name}` : '',
    takenAt: s.taken_at,
    status: s.status as 'success' | 'failed',
    errorMessage: s.error_message,
  };
}
