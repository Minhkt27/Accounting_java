import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Layout from "./components/Layout";
import DashboardPage from "./pages/Dashboard";
import AccountCategoryPage from "./pages/AccountCategory";
import TaxConfigPage from "./pages/TaxConfig";
import EmployeeList from "./pages/EmployeeList";
import AttendancePage from "./pages/Attendance";
import LeaveManagementPage from "./pages/LeaveManagement";
import PayrollPage from "./pages/PayrollPage";
import PaymentsPage from "./pages/PaymentsPage";
import VoucherJournalPage from "./pages/VoucherJournalPage";
import GeneralLedgerPage from "./pages/GeneralLedger";
import HRTrackingPage from "./pages/HRTrackingPage";
import ReportsPage from "./pages/ReportsPage";
import UserManagementPage from "./pages/UserManagementPage";
import SalaryConfigPage from "./pages/SalaryConfigPage";
import SalaryChangePage from "./pages/SalaryChangePage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="config/accounts" element={<AccountCategoryPage />} />
          <Route path="config/salary" element={<SalaryConfigPage />} />
          <Route path="config/tax" element={<TaxConfigPage />} />
          <Route path="employees" element={<EmployeeList />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="leaves" element={<LeaveManagementPage />} />
          <Route path="payroll" element={<PayrollPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="accounting" element={<VoucherJournalPage />} />
          <Route path="ledger" element={<GeneralLedgerPage />} />
          <Route path="hr-tracking" element={<HRTrackingPage />} />
          <Route path="salary-changes" element={<SalaryChangePage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="admin/users" element={<UserManagementPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
