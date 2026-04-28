export interface Screenshot {
  id: number;
  appId: number;
  imageUrl: string;
  takenAt: string;
  status: 'success' | 'failed';
  errorMessage: string | null;
}

export interface App {
  id: number;
  name: string;
  packageId: string;
  url: string;
  intervalHours: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastScreenshot?: Screenshot | null;
}

export interface ScreenshotsPage {
  total: number;
  screenshots: Screenshot[];
}

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

export interface AppFormValues {
  url: string;
  name?: string;
  intervalHours?: number;
  isActive?: boolean;
}
