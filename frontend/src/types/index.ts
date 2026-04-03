export interface TaxTier {
    id?: number;
    lowerBound: number;
    upperBound: number;
    taxRate: number;
    tierLevel: number;
    status?: "APPROVED" | "PENDING";
}

export interface DeductionSetting {
    id?: number;
    personalDeduction: number;
    dependentDeduction: number;
    status?: "APPROVED" | "PENDING";
}

export interface InsuranceRate {
    id?: number;
    type: string;
    employeeRate: number;
    employerRate: number;
    effectiveDate: string;
    status?: "APPROVED" | "PENDING";
}

export interface SalaryParameter {
    id?: number;
    standardWorkDays: number;
    standardWorkDayMode: "FIXED" | "MONTHLY";
    minimumWage: number;
    mealAllowance: number;
    status?: "APPROVED" | "PENDING";
}

export interface AccountCategory {
    id?: number;
    code: string;
    name: string;
    type: "DEBIT" | "CREDIT";
    status?: "APPROVED" | "PENDING";
}

export interface Employee {
    id: number;
    code: string;
    fullName: string;
    baseSalary: number;
    dependents: number;
    type: "FULL_TIME" | "PART_TIME" | "PROBATION" | "INTERN";
    dob?: string;
    positionCoefficient?: number;
    seniorityAllowance?: number;
    active: boolean;
}

export type LeaveType = "ANNUAL" | "SICK" | "MATERNITY";

export interface Leave {
    id: number;
    employee: Partial<Employee> & { id: number | string };
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
}

export interface UserItem {
    id: number;
    username: string;
    email: string;
    roles: string[];
}

export interface RoleItem {
    id: number;
    name: string;
    displayName: string;
}

export interface PermItem {
    roleName: string;
    functionCode: string;
    allowed: boolean;
}
