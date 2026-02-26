import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Employee } from './models/models';
import { LeaveTrackerService } from './services/leave-tracker.service';
import { EmployeeDetailComponent } from './employee-detail/employee-detail.component';
import { UpdateBannerComponent } from './update-banner/update-banner.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, EmployeeDetailComponent, UpdateBannerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  employees: Employee[] = [];
  selectedEmployee: Employee | null = null;

  showModal = false;
  editingEmployee: Employee | null = null;
  employeeName = '';
  annualLeave = 15;
  sickLeave = 10;
  casualLeave = 5;

  constructor(private service: LeaveTrackerService) {}

  async ngOnInit() {
    await this.loadEmployees();
  }

  async loadEmployees() {
    try {
      this.employees = await this.service.getEmployees();
      if (this.selectedEmployee) {
        this.selectedEmployee = this.employees.find(e => e.id === this.selectedEmployee!.id) ?? null;
      }
    } catch (err) {
      console.error('Failed to load employees:', err);
    }
  }

  selectEmployee(emp: Employee) {
    this.selectedEmployee = emp;
  }

  openAddModal() {
    this.editingEmployee = null;
    this.employeeName = '';
    this.annualLeave = 15;
    this.sickLeave = 10;
    this.casualLeave = 5;
    this.showModal = true;
  }

  async openEditModal(employee: Employee, event: Event) {
    event.stopPropagation();
    this.editingEmployee = employee;
    this.employeeName = employee.name;
    this.annualLeave = 15;
    this.sickLeave = 10;
    this.casualLeave = 5;
    try {
      const alloc = await this.service.getLeaveAllocations(employee.id);
      this.annualLeave = alloc.annual;
      this.sickLeave = alloc.sick;
      this.casualLeave = alloc.casual;
    } catch {}
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  async saveEmployee() {
    if (!this.employeeName.trim()) return;
    try {
      if (this.editingEmployee) {
        await this.service.updateEmployee(this.editingEmployee.id, this.employeeName, this.annualLeave, this.sickLeave, this.casualLeave);
      } else {
        const emp = await this.service.createEmployee(this.employeeName, this.annualLeave, this.sickLeave, this.casualLeave);
        this.selectedEmployee = emp;
      }
      this.showModal = false;
      await this.loadEmployees();
    } catch (err) {
      console.error('Failed to save employee:', err);
      alert('Failed to save. Check the console for details.');
    }
  }

  async deleteEmployee(employee: Employee, event: Event) {
    event.stopPropagation();
    if (confirm(`Delete "${employee.name}" and all their leave records?`)) {
      try {
        await this.service.deleteEmployee(employee.id);
        if (this.selectedEmployee?.id === employee.id) {
          this.selectedEmployee = null;
        }
        await this.loadEmployees();
      } catch (err) {
        console.error('Failed to delete employee:', err);
      }
    }
  }

  avatar(name: string): string {
    return name.charAt(0).toUpperCase();
  }
}
