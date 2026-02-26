import { Injectable } from '@angular/core';
import { check, Update } from '@tauri-apps/plugin-updater';

export interface UpdateStatus {
  available: boolean;
  version?: string;
  body?: string;
  downloading: boolean;
  progress: number;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class UpdateService {
  private currentUpdate: Update | null = null;

  async checkForUpdate(): Promise<UpdateStatus> {
    try {
      const update = await check();
      if (update) {
        this.currentUpdate = update;
        return {
          available: true,
          version: update.version,
          body: update.body ?? undefined,
          downloading: false,
          progress: 0,
        };
      }
      return { available: false, downloading: false, progress: 0 };
    } catch (err) {
      console.error('Update check failed:', err);
      return {
        available: false,
        downloading: false,
        progress: 0,
        error: String(err),
      };
    }
  }

  async downloadAndInstall(
    onProgress?: (progress: number) => void
  ): Promise<void> {
    if (!this.currentUpdate) {
      throw new Error('No update available');
    }

    let totalLength = 0;
    let downloaded = 0;

    await this.currentUpdate.downloadAndInstall((event) => {
      switch (event.event) {
        case 'Started':
          totalLength = event.data.contentLength ?? 0;
          break;
        case 'Progress':
          downloaded += event.data.chunkLength;
          if (totalLength > 0 && onProgress) {
            onProgress(Math.round((downloaded / totalLength) * 100));
          }
          break;
        case 'Finished':
          if (onProgress) onProgress(100);
          break;
      }
    });
  }
}
