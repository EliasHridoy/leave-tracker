import { Injectable } from '@angular/core';
import { invoke } from '@tauri-apps/api/core';
import { Employee, LeaveRecord, EmployeeDetail } from '../models/models';

@Injectable({ providedIn: 'root' })
export class LeaveTrackerService {
  getEmployees(): Promise<Employee[]> {
    return invoke('get_employees');
  }

  createEmployee(name: string): Promise<Employee> {
    return invoke('create_employee', { name });
  }

  updateEmployee(id: number, name: string): Promise<Employee> {
    return invoke('update_employee', { id, name });
  }

  deleteEmployee(id: number): Promise<void> {
    return invoke('delete_employee', { id });
  }

  getEmployeeDetail(id: number, year: number): Promise<EmployeeDetail> {
    return invoke('get_employee_detail', { id, year });
  }

  addLeave(employeeId: number, leaveType: string, leaveDate: string, reason?: string): Promise<LeaveRecord> {
    return invoke('add_leave', { employeeId, leaveType, leaveDate, reason });
  }

  updateLeave(id: number, leaveType: string, leaveDate: string, reason?: string): Promise<LeaveRecord> {
    return invoke('update_leave', { id, leaveType, leaveDate, reason });
  }

  deleteLeave(id: number): Promise<void> {
    return invoke('delete_leave', { id });
  }
}
