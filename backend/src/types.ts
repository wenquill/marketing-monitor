// Database row types (snake_case, as stored in SQLite)
export interface DbApp {
  id: number;
  name: string;
  package_id: string;
  url: string;
  interval_hours: number;
  is_active: number; // SQLite stores booleans as 0/1
  created_at: string;
  updated_at: string;
}

export interface DbScreenshot {
  id: number;
  app_id: number;
  file_name: string; // relative path from SCREENSHOTS_DIR, e.g. "com.example.app/filename.png"
  taken_at: string;
  status: 'success' | 'failed';
  error_message: string | null;
}

// API response types (camelCase)
export interface AppResponse {
  id: number;
  name: string;
  packageId: string;
  url: string;
  intervalHours: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastScreenshot?: ScreenshotResponse | null;
}

export interface ScreenshotResponse {
  id: number;
  appId: number;
  imageUrl: string;
  takenAt: string;
  status: 'success' | 'failed';
  errorMessage: string | null;
}

// Request DTOs
export interface CreateAppDto {
  url: string;
  name?: string;
  intervalHours?: number;
}

export interface UpdateAppDto {
  url?: string;
  name?: string;
  intervalHours?: number;
  isActive?: boolean;
}
