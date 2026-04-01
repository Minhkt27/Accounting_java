# Accounting OS — Professional Payroll & HR Management

A modern, high-performance desktop-style web application for comprehensive payroll, HR management, and accounting. Built with **Spring Boot 3**, **React 19**, and **PostgreSQL**, orchestrated via **Docker**.

## 🚀 Key Features

*   **HR Management**: Full employee profiles, position coefficient tracking, and seniority allowance management.
*   **Payroll Engine**: Automated salary calculation with custom insurance rates, personal/dependent deductions, and 7-tier personal income tax (PIT) calculations.
*   **Attendance & Leaves**: Integrated tracking of workdays, overtime, and leave requests (Sick, Maternity, Annual).
*   **Accounting Integration**: Automatic General Ledger (GL) entry generation based on approved payroll (Debit 642 / Credit 334).
*   **Role-Based Security**: Dynamic permission matrix for Admin, HR, Payroll Accountant, and Chief Accountant.

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
