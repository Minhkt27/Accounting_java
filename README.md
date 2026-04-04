# Accounting OS — Professional Payroll & HR Management

A modern, high-performance desktop-style web application for comprehensive payroll, HR management, and accounting. Built with **Spring Boot 3**, **React 19**, and **PostgreSQL**, orchestrated via **Docker**.

## 🚀 Key Features

*   **HR Management**: Full employee profiles, position coefficient tracking, and seniority allowance management.
*   **Payroll Engine**: Automated salary calculation with custom insurance rates, personal/dependent deductions, and 7-tier personal income tax (PIT) calculations.
*   **Attendance & Leaves**: Integrated tracking of workdays, overtime, and leave requests (Sick, Maternity, Annual).
*   **Accounting Integration**: Automatic General Ledger (GL) entry generation based on approved payroll (Debit 642 / Credit 334).
*   **Role-Based Security**: Dynamic permission matrix for Admin, HR, Payroll Accountant, and Chief Accountant.
12: 
13: ## 🧮 Calculation Logic & Business Rules
14: 
15: This application follows standard accounting and payroll regulations, with flexible configurations.
16: 
17: ### 1. Salary Components (Thành phần Lương)
18: *   **Base Salary (Lương thời gian)**: `(Contract Salary / Standard Work Days) * (Real Work Days + Paid Leave Days)`
19:     *   *Probation (Thử việc)*: Employees on probation receive **85%** of the calculated base salary.
20: *   **Allowances (Phụ cấp)**:
21:     *   **Meal Allowance**: `Rate per Day * Real Work Days`.
22:     *   **Position Allowance**: `Position Coefficient * Minimum Wage` (e.g., 1.8M VNĐ).
23:     *   **Seniority Allowance**: Fixed monthly amount based on years of service.
24: *   **Overtime (OT)**: 
25:     *   **Normal (150%)**: `Hourly Rate * 1.5 * Hours`.
26:     *   **Weekend (200%)**: `Hourly Rate * 2.0 * Hours`.
27:     *   **Holiday (300%)**: `Hourly Rate * 3.0 * Hours`.
28: 
29: ### 2. Insurance Rates (Tỷ lệ Bảo hiểm)
30: Calculated based on the `Contract Salary` (or Insurance Salary if configured separately).
31: 
32: | Category | Employee (NLĐ) | Employer (DN) | Total |
33: | :--- | :---: | :---: | :---: |
34: | Social Insurance (BHXH) | 8.0% | 17.5% | 25.5% |
35: | Health Insurance (BHYT) | 1.5% | 3.0% | 4.5% |
36: | Unemployment (BHTN) | 1.0% | 1.0% | 2.0% |
37: | Trade Union (KPCĐ) | 0.0% | 2.0% | 2.0% |
38: | **Total** | **10.5%** | **23.5%** | **34.0%** |
39: 
40: ### 3. Personal Income Tax (PIT - Thuế TNCN)
41: The 7-Tier Progressive tax system is applied to `Taxable Income`.
42: 
43: *   **Taxable Base**: `Gross Income - Meal Allowance (Exempt) - OT Premium (Exempt)`.
44: *   **Net Taxable Income**: `Taxable Base - Self Deduction - Dependent Deduction - Insurance (EE) - Charity`.
45: 
46: | Tier | Taxable Income (Monthly) | Tax Rate | Subtract Amount |
47: | :---: | :--- | :---: | :---: |
48: | 1 | Up to 5M | 5% | 0 |
49: | 2 | 5M - 10M | 10% | 250,000 |
50: | 3 | 10M - 18M | 15% | 750,000 |
51: | 4 | 18M - 32M | 20% | 1,650,000 |
52: | 5 | 32M - 52M | 25% | 3,250,000 |
53: | 6 | 52M - 80M | 30% | 5,850,000 |
54: | 7 | Over 80M | 35% | 9,850,000 |
55: 
56: ### 4. Accounting Mapping (Hạch toán Kế toán)
57: Upon payroll approval, the system automatically generates accounting vouchers (Voucher PK):
58: 
59: *   **Debit 642 / Credit 334**: Gross Salary Expense.
60: *   **Debit 334 / Credit 338**: Insurance (Employee's part).
61: *   **Debit 642 / Credit 338**: Insurance (Employer's part).
62: *   **Debit 334 / Credit 3335**: Personal Income Tax.
63: *   **Debit 334 / Credit 111, 112**: Net Pay (upon payment).

## 🛠 Tech Stack

*   **Backend**: Java 21, Spring Boot 3.3.4, Spring Security (JWT), Hibernate/JPA.
*   **Frontend**: Vite, React 19, TypeScript, Tailwind CSS, Recharts (Data Visualization).
*   **Database**: PostgreSQL 16.
*   **DevOps**: Docker, Docker Compose.

## 📦 Getting Started

### Prerequisites

*   Docker Desktop (with Compose)
*   Git

### Installation & Run

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/Minhkt27/accounting-desktop-app.git
    cd accounting-desktop-app
    ```

2.  **Run with Docker Compose**:
    ```bash
    docker compose up --build -d
    ```

3.  **Access the Application**:
    *   Frontend: [http://localhost:3000](http://localhost:3000)
    *   Backend API Docs (Optional): [http://localhost:8888/swagger-ui.html](http://localhost:8888/swagger-ui.html) (if enabled)

### Default Credentials

*   **Admin**: `admin` / `admin123`
*   **HR (nhansu)**: `nhansu` / `123456`
*   **Payroll Accountant**: `ketoan_luong` / `123456`
*   **Chief Accountant**: `ketoan_truong` / `123456`

## 📁 Project Structure

```text
├── src/main/java      # Spring Boot Source
├── src/main/resources # Application Configuration
├── frontend/          # React Vite Application
├── docker-compose.yml # Service Orchestration
└── Dockerfile         # Backend Build instructions
```

## 📜 License

This project is developed for professional accounting management purposes.
