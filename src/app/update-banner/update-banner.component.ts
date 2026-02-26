import { Component, OnInit } from '@angular/core';
import { UpdateService, UpdateStatus } from '../services/update.service';

@Component({
  selector: 'app-update-banner',
  standalone: true,
  templateUrl: './update-banner.component.html',
  styleUrl: './update-banner.component.css',
})
export class UpdateBannerComponent implements OnInit {
  status: UpdateStatus = { available: false, downloading: false, progress: 0 };
  dismissed = false;

  constructor(private updateService: UpdateService) {}

  ngOnInit() {
    setTimeout(() => this.checkForUpdate(), 3000);
  }

  async checkForUpdate() {
    this.status = await this.updateService.checkForUpdate();
  }

  async downloadAndInstall() {
    this.status = { ...this.status, downloading: true, progress: 0, error: undefined };
    try {
      await this.updateService.downloadAndInstall((progress) => {
        this.status = { ...this.status, progress };
      });
    } catch (err) {
      this.status = {
        ...this.status,
        downloading: false,
        error: String(err),
      };
    }
  }

  dismiss() {
    this.dismissed = true;
  }
}
