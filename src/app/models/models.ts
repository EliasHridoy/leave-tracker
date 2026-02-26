export interface Employee {
  id: number;
  name: string;
  created_at: string;
}

export interface LeaveRecord {
  id: number;
  employee_id: number;
  leave_type: 'annual' | 'sick' | 'casual';
  leave_date: string;
  reason?: string;
  created_at: string;
}

export interface LeaveSummary {
  leave_type: string;
  allocated: number;
  used: number;
  remaining: number;
}

export interface EmployeeDetail {
  employee: Employee;
  leave_records: LeaveRecord[];
  leave_summary: LeaveSummary[];
}

export interface LeaveAllocations {
  annual: number;
  sick: number;
  casual: number;
}
