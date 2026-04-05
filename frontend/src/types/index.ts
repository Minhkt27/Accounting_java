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

export interface InsuranceConfig {
    id?: number;
    bhxhEmployee: number;
    bhytEmployee: number;
    bhtnEmployee: number;
    bhxhEmployer: number;
    bhytEmployer: number;
    bhtnEmployer: number;
    kpcdEmployer: number;
    effectiveDate: string;
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

export type EmployeeType = "FULL_TIME" | "OFFICIAL" | "PROBATION" | "INTERN" | "TRAINEE" | "OTHER";
export type TaxMethod = "EXEMPT" | "FIXED_10" | "PROGRESSIVE";

export interface EmployeeTaxConfig {
    id?: number;
    employeeType: EmployeeType;
    taxMethod: TaxMethod;
    status?: "APPROVED" | "PENDING";
}

export interface SalaryParameter {
    id?: number;
    standardWorkDays: number;
    standardWorkDayMode: "FIXED" | "MONTHLY";
    baseSalary: number;
    minimumWage: number;
    insuranceCeiling: number;
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
    id: number | string;
    code: string;
    fullName: string;
    contractSalary: number;
    dependents: number;
    type: "OFFICIAL" | "PROBATION";
    department?: string;
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
