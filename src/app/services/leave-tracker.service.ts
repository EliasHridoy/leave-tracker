import { Injectable } from '@angular/core';
import { invoke } from '@tauri-apps/api/core';
import { Employee, LeaveRecord, EmployeeDetail, LeaveAllocations } from '../models/models';

@Injectable({ providedIn: 'root' })
export class LeaveTrackerService {
  getEmployees(): Promise<Employee[]> {
    return invoke('get_employees');
  }

  createEmployee(name: string, annual: number, sick: number, casual: number): Promise<Employee> {
    return invoke('create_employee', { name, annual, sick, casual });
  }

  updateEmployee(id: number, name: string, annual: number, sick: number, casual: number): Promise<Employee> {
    return invoke('update_employee', { id, name, annual, sick, casual });
  }

  getLeaveAllocations(id: number): Promise<LeaveAllocations> {
    return invoke('get_leave_allocations', { id });
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
