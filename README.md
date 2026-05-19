# Accounting OS — Professional Payroll & HR Management

A modern, high-performance desktop-style web application for comprehensive payroll, HR management, and accounting. Built with **Spring Boot 3**, **React 19**, and **MS SQL Server 2022**, orchestrated via **Docker**.

## 🚀 Key Features

*   **HR Management**: Full employee profiles, position coefficient tracking, and seniority allowance management.
*   **Payroll Engine**: Automated salary calculation with custom insurance rates, personal/dependent deductions, and 7-tier personal income tax (PIT) calculations.
*   **Attendance & Leaves**: Integrated tracking of workdays, overtime, and leave requests (Sick, Maternity, Annual).
*   **Accounting Integration**: Automatic General Ledger (GL) entry generation based on approved payroll (Debit 642 / Credit 334).
*   **Role-Based Security**: Dynamic permission matrix for Admin, HR, Payroll Accountant, and Chief Accountant.

## 🧮 Calculation Logic & Business Rules

This application follows standard accounting and payroll regulations, with flexible configurations.

### 1. Salary Components (Thành phần Lương)
*   **Base Salary (Lương thời gian)**: `(Contract Salary / Standard Work Days) * (Real Work Days + Paid Leave Days)`
    *   *Probation (Thử việc)*: Employees on probation receive **85%** of the calculated base salary.
*   **Allowances (Phụ cấp)**:
    *   **Meal Allowance**: `Rate per Day * Real Work Days`.
    *   **Position Allowance**: `Position Coefficient * Minimum Wage` (e.g., 1.8M VNĐ).
    *   **Seniority Allowance**: Fixed monthly amount based on years of service.
*   **Overtime (OT)**: 
    *   **Normal (150%)**: `Hourly Rate * 1.5 * Hours`.
    *   **Weekend (200%)**: `Hourly Rate * 2.0 * Hours`.
    *   **Holiday (300%)**: `Hourly Rate * 3.0 * Hours`.

### 2. Insurance Rates (Tỷ lệ Bảo hiểm)
Calculated based on the `Contract Salary` (or Insurance Salary if configured separately).

| Category | Employee (NLĐ) | Employer (DN) | Total |
| :--- | :---: | :---: | :---: |
| Social Insurance (BHXH) | 8.0% | 17.5% | 25.5% |
| Health Insurance (BHYT) | 1.5% | 3.0% | 4.5% |
| Unemployment (BHTN) | 1.0% | 1.0% | 2.0% |
| Trade Union (KPCĐ) | 0.0% | 2.0% | 2.0% |
| **Total** | **10.5%** | **23.5%** | **34.0%** |

### 3. Personal Income Tax (PIT - Thuế TNCN)
The 7-Tier Progressive tax system is applied to `Taxable Income`.

*   **Taxable Base**: `Gross Income - Meal Allowance (Exempt) - OT Premium (Exempt)`.
*   **Net Taxable Income**: `Taxable Base - Self Deduction - Dependent Deduction - Insurance (EE) - Charity`.

| Tier | Taxable Income (Monthly) | Tax Rate | Subtract Amount |
| :---: | :--- | :---: | :---: |
| 1 | Up to 5M | 5% | 0 |
| 2 | 5M - 10M | 10% | 250,000 |
| 3 | 10M - 18M | 15% | 750,000 |
| 4 | 18M - 32M | 20% | 1,650,000 |
| 5 | 32M - 52M | 25% | 3,250,000 |
| 6 | 52M - 80M | 30% | 5,850,000 |
| 7 | Over 80M | 35% | 9,850,000 |

### 4. Accounting Mapping (Hạch toán Kế toán)
Upon payroll approval, the system automatically generates accounting vouchers (Voucher PK):

*   **Debit 642 / Credit 334**: Gross Salary Expense.
*   **Debit 334 / Credit 338**: Insurance (Employee's part).
*   **Debit 642 / Credit 338**: Insurance (Employer's part).
*   **Debit 334 / Credit 3335**: Personal Income Tax.
*   **Debit 334 / Credit 111, 112**: Net Pay (upon payment).

## 🛠 Tech Stack

*   **Backend**: Java 21, Spring Boot 3.3.4, Spring Security (JWT), Hibernate/JPA.
*   **Frontend**: Vite, React 19, TypeScript, Tailwind CSS, Recharts (Data Visualization).
*   **Database**: Microsoft SQL Server 2022.
*   **DevOps**: Docker, Docker Compose.

## 📦 Getting Started

### Prerequisites

*   Docker Desktop (with Compose)
*   Git
*   Port `1433`, `8888`, `3000` phải trống (không bị ứng dụng khác chiếm)

### Installation & Run

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/Minhkt27/accounting-desktop-app.git
    cd accounting-desktop-app
    ```

2.  **Dọn dẹp database cũ (nếu có)** — Bỏ qua bước này nếu cài lần đầu:
    ```bash
    docker compose down -v          # Dừng và xóa toàn bộ containers + volumes cũ
    docker rm -f accounting_db      # Xóa container DB cũ (nếu còn sót)
    ```

    > [!WARNING]
    > Bước này sẽ **xóa toàn bộ dữ liệu** của database cũ (PostgreSQL/MySQL). Hãy sao lưu trước nếu cần.

3.  **Khởi động SQL Server container trước**:
    ```bash
    docker compose up -d sqlserver-db
    ```
    > Chờ khoảng **15–20 giây** để SQL Server khởi động hoàn tất.

4.  **Tạo database `accounting_db`** (chỉ cần chạy 1 lần duy nhất):
    ```bash
    docker exec accounting_db /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "AccountingApp@123" -C -Q "CREATE DATABASE accounting_db"
    ```

    > [!IMPORTANT]
    > SQL Server không tự động tạo database khi khởi động. Bước này **bắt buộc** phải chạy trước khi khởi động backend.

5.  **Khởi động toàn bộ hệ thống**:
    ```bash
    docker compose up --build
    ```
    > Lần đầu tiên sẽ tải Maven dependencies + npm packages, có thể mất **3–5 phút**.
    > Hibernate sẽ tự động tạo tất cả bảng (với tên tiếng Việt) và seed dữ liệu mẫu (nhân viên, tài khoản kế toán...).

6.  **Access the Application**:
    *   Frontend: [http://localhost:3000](http://localhost:3000)
    *   Backend API: [http://localhost:8888](http://localhost:8888)

> [!TIP]
> **Troubleshooting**:
> *   Nếu gặp lỗi **"container name already in use"** → chạy `docker rm -f accounting_db` rồi bắt đầu lại từ Bước 2.
> *   Nếu gặp lỗi database sau khi pull code mới (missing columns/tables), reset lại database:
>     ```bash
>     docker compose down -v   # Dừng và XÓA toàn bộ data volumes
>     ```
>     Sau đó lặp lại từ **Bước 2**.

### 🔄 Cập nhật từ phiên bản cũ (Double -> BigDecimal)

Nếu bạn vừa `pull` code mới về, bạn có 2 lựa chọn để cập nhật hệ thống:

#### Cách 1: Reset sạch sẽ (Nhanh nhất, Mất dữ liệu cũ)
Phù hợp nếu bạn không quan trọng dữ liệu cũ và muốn hệ thống chạy chuẩn nhất:
1.  `docker compose down -v` (Xóa sạch container và volume dữ liệu)
2.  `docker compose up -d sqlserver-db`
3.  Đợi 15s, sau đó tạo lại DB trống:
    `docker exec accounting_db /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "AccountingApp@123" -C -Q "CREATE DATABASE accounting_db"`
4.  `docker compose up --build -d`

#### Cách 2: Nâng cấp giữ dữ liệu (Phức tạp hơn)
Sử dụng nếu bạn muốn giữ lại các bản ghi cũ:
1.  **Dừng Backend:** `docker compose stop backend`
2.  **Xóa ràng buộc cũ:**
    ```bash
    docker cp drop_constraints.sql accounting_db:/tmp/
    docker exec accounting_db /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "AccountingApp@123" -C -i /tmp/drop_constraints.sql
    ```
3.  **Khởi động lại:** `docker compose up --build -d backend`

### Database Connection Info

| Thuộc tính | Giá trị |
|---|---|
| Server | `localhost:1433` |
| Database | `accounting_db` |
| Username | `sa` |
| Password | `AccountingApp@123` |

### Default Credentials

*   **Admin (Quản trị viên)**: `admin` / `admin123`
*   **HR (Nhân sự)**: `nhansu` / `123456`
*   **Payroll Accountant (Kế toán Tiền lương)**: `ketoan_luong` / `123456` *(Has permission to Calculate Salary)*
*   **Cash Accountant (Kế toán Vốn bằng tiền)**: `ketoan_tien` / `123456` *(Has permission to Pay Salary)*
*   **Chief Accountant (Kế toán Trưởng)**: `ketoan_truong` / `123456` *(Has permission to Approve/Finalize Payroll)*

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
