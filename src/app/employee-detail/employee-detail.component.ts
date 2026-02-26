import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LeaveTrackerService } from '../services/leave-tracker.service';
import { EmployeeDetail, LeaveRecord } from '../models/models';

@Component({
  selector: 'app-employee-detail',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './employee-detail.component.html',
  styleUrl: './employee-detail.component.css',
})
export class EmployeeDetailComponent implements OnChanges {
  @Input() employeeId!: number;
  @Input() employeeName = '';

  detail: EmployeeDetail | null = null;
  loading = false;

  selectedYear = new Date().getFullYear();
  years: number[];

  showLeaveModal = false;
  editingLeave: LeaveRecord | null = null;
  leaveType = 'annual';
  leaveDate = '';
  leaveReason = '';

  constructor(private service: LeaveTrackerService) {
    const y = new Date().getFullYear();
    this.years = [y - 2, y - 1, y, y + 1];
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (changes['employeeId']) {
      await this.loadDetail();
    }
  }

  async loadDetail() {
    this.loading = true;
    try {
      this.detail = await this.service.getEmployeeDetail(this.employeeId, this.selectedYear);
    } finally {
      this.loading = false;
    }
  }

  async onYearChange() {
    await this.loadDetail();
  }

  openAddLeave() {
    this.editingLeave = null;
    this.leaveType = 'annual';
    this.leaveDate = new Date().toISOString().split('T')[0];
    this.leaveReason = '';
    this.showLeaveModal = true;
  }

  openEditLeave(record: LeaveRecord) {
    this.editingLeave = record;
    this.leaveType = record.leave_type;
    this.leaveDate = record.leave_date;
    this.leaveReason = record.reason ?? '';
    this.showLeaveModal = true;
  }

  closeLeaveModal() {
    this.showLeaveModal = false;
  }

  async saveLeave() {
    if (!this.leaveDate) return;
    const reason = this.leaveReason.trim() || undefined;
    if (this.editingLeave) {
      await this.service.updateLeave(this.editingLeave.id, this.leaveType, this.leaveDate, reason);
    } else {
      await this.service.addLeave(this.employeeId, this.leaveType, this.leaveDate, reason);
    }
    this.showLeaveModal = false;
    await this.loadDetail();
  }

  async deleteLeave(record: LeaveRecord) {
    if (confirm('Delete this leave record?')) {
      await this.service.deleteLeave(record.id);
      await this.loadDetail();
    }
  }

  summaryClass(leaveType: string): string {
    const map: Record<string, string> = {
      annual: 'card-annual',
      sick: 'card-sick',
      casual: 'card-casual',
    };
    return map[leaveType] ?? '';
  }

  badgeClass(leaveType: string): string {
    return `badge-${leaveType}`;
  }

  capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  avatar(name: string): string {
    return name.charAt(0).toUpperCase();
  }

  progressWidth(used: number, allocated: number): number {
    if (allocated <= 0) return 0;
    return Math.min((used / allocated) * 100, 100);
  }
}
