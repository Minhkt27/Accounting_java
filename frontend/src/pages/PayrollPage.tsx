import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Button } from "../components/ui/button";
import {
  Calculator,
  CheckCircle,
  XCircle,
  FileSpreadsheet,
} from "lucide-react";
import { ExportService } from "../utils/ExportService";
import PayslipDialog from "../components/PayslipDialog";

export interface Employee {
  id: string;
  fullName: string;
  dob?: string;
  phone?: string;
  email?: string;
  department?: string;
  resignationDate?: string;
  employeeType?: string;
}

export interface Payroll {
  id: number;
  employee: Employee;
  month: number;
  year: number;
  contractSalary: number;
  realWorkDays: number;
  paidLeaveDays: number;
  baseSalaryPay: number;
  mealAllowance: number;
  positionAllowance: number;
  seniorityAllowance: number;
  otNormalPay: number;
  otWeekendPay: number;
  otHolidayPay: number;
  otPay: number;
  otPremiumPay: number;
  grossIncome: number;
  bhxhNhanVien: number;
  bhytNhanVien: number;
  bhtnNhanVien: number;
  totalInsurance: number;
  bhxhCongTy: number;
  bhytCongTy: number;
  bhtnCongTy: number;
  kpcdCongTy: number;
  totalEmployerInsurance: number;
  taxableIncomeBase: number;
  personalDeduction: number;
  dependentDeduction: number;
  dependentCount: number;
  taxableIncome: number;
  taxAmount: number;
  netPay: number;
  status: string;
  rejectionReason?: string;
  bonus?: number;
  penalty?: number;
  otherAllowances?: number;
  standardWorkDays?: number;
  otNormalHours?: number;
  otWeekendHours?: number;
  otHolidayHours?: number;
}

export default function PayrollPage() {
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize] = useState(20);

  const [month, setMonth] = useState(
    new Date().getMonth() === 0 ? 12 : new Date().getMonth(),
  );
  const [year, setYear] = useState(
    new Date().getMonth() === 0
      ? new Date().getFullYear() - 1
      : new Date().getFullYear(),
  );
  const [loading, setLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const canApprove =
    user.roles?.includes("ROLE_ADMIN") ||
    user.roles?.includes("ROLE_KE_TOAN_TRUONG");

  useEffect(() => {
    setPage(0);
  }, [month, year]);

  const fetchPayrolls = useCallback(async () => {
    try {
      const res = await axios.get(
        `/api/payroll/${month}/${year}?page=${page}&size=${pageSize}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      setPayrolls(res.data.content);
      setTotalPages(res.data.totalPages);
      setTotalElements(res.data.totalElements);
    } catch (err: unknown) {
      console.error(err);
    }
  }, [month, year, page, pageSize]);

  useEffect(() => {
    fetchPayrolls();
  }, [fetchPayrolls]);

  const handleCalculate = async () => {
    setLoading(true);
    try {
      await axios.post(
        `/api/payroll/calculate?month=${month}&year=${year}`,
        null,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      alert(`Đã tính lương xong cho tháng ${month}/${year}`);
      fetchPayrolls();
    } catch (err: unknown) {
      const serverMsg = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : String(err);
      alert("Lỗi: " + serverMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (
      !confirm(
        "Bạn có chắc muốn chốt bảng lương này? Sau khi chốt sẽ không thể tính lại.",
      )
    )
      return;
    try {
      await axios.post(
        `/api/payroll/approve?month=${month}&year=${year}`,
        null,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      alert("Đã chốt lương thành công!");
      fetchPayrolls();
    } catch (err: unknown) {
      const serverMsg = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : String(err);
      alert("Lỗi khi chốt: " + serverMsg);
    }
  };

  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const handleReject = async () => {
    if (!rejectReason.trim()) return alert("Vui lòng nhập lý do từ chối");
    try {
      await axios.post(
        `/api/payroll/reject?month=${month}&year=${year}&reason=${encodeURIComponent(rejectReason)}`,
        null,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      alert("Đã từ chối bảng lương. Kế toán cần tính lại.");
      setShowRejectDialog(false);
      setRejectReason("");
      fetchPayrolls();
    } catch (err: unknown) {
      const serverMsg = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : String(err);
      alert("Lỗi khi từ chối: " + serverMsg);
    }
  };

  const handleExportExcel = () => {
    const data = payrolls.map((p) => ({
      employeeId: p.employee.id,
      fullName: p.employee.fullName,
      month: p.month,
      year: p.year,
      contractSalary: p.contractSalary,
      realWorkDays: p.realWorkDays,
      paidLeaveDays: p.paidLeaveDays,
      baseSalaryPay: p.baseSalaryPay,
      mealAllowance: p.mealAllowance,
      seniorityAllowance: p.seniorityAllowance,
      otPay: p.otPay,
      grossIncome: p.grossIncome,
      totalInsurance: p.totalInsurance,
      taxAmount: p.taxAmount,
      totalEmployerInsurance: p.totalEmployerInsurance,
      kpcdCongTy: p.kpcdCongTy,
      netPay: p.netPay,
      status: p.status,
    }));

    ExportService.exportToExcel(
      data,
      `Bang_luong_thang_${month}_${year}`,
      "Bảng lương",
      {
        employeeId: "Mã NV",
        fullName: "Họ tên",
        month: "Tháng",
        year: "Năm",
        contractSalary: "Lương HĐ",
        realWorkDays: "Công mặt",
        paidLeaveDays: "Ngày phép",
        baseSalaryPay: "Lương thời gian",
        mealAllowance: "Phụ cấp ăn",
        seniorityAllowance: "Phụ cấp TN",
        otPay: "Tiền OT",
        grossIncome: "Tổng thu nhập",
        totalInsurance: "BH Nhân viên",
        taxAmount: "Thuế TNCN",
        totalEmployerInsurance: "BH Công ty",
        kpcdCongTy: "Kinh phí CĐ",
        netPay: "Thực lĩnh",
        status: "Trạng thái",
      },
    );
  };

  const formatVND = (val: number) => {
    return new Intl.NumberFormat("vi-VN").format(Math.round(val || 0));
  };

  const isCurrentOrFuture =
    year * 12 + month >
    new Date().getFullYear() * 12 + new Date().getMonth() + 1;
  const isDraftAll =
    payrolls.length > 0 && payrolls.every((p) => p.status === "DRAFT");
  const isApprovedAll =
    payrolls.length > 0 && payrolls.every((p) => p.status === "APPROVED");
  const isPaidAll =
    payrolls.length > 0 && payrolls.every((p) => p.status === "PAID");
  const isRejectedAll =
    payrolls.length > 0 && payrolls.every((p) => p.status === "REJECTED");

  return (
    <div className="space-y-4 bg-gray-50 min-h-screen p-4">
      {/* Header & Actions */}
      <div className="flex flex-col xl:flex-row justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200 gap-4">
        <h1 className="text-xl font-bold flex items-center gap-2 text-gray-800">
          <Calculator className="w-6 h-6 text-blue-600" /> Quản lý Tiền lương
        </h1>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
              Kỳ lương:
            </span>
            <input
              type="number"
              className="w-16 h-10 text-center bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium text-gray-700"
              value={month}
              onChange={(e) =>
                setMonth(Math.max(1, Math.min(12, Number(e.target.value))))
              }
            />
            <span className="text-gray-400 font-bold">/</span>
            <input
              type="number"
              className="w-20 h-10 text-center bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium text-gray-700"
              value={year}
              onChange={(e) => setYear(Math.max(2000, Number(e.target.value)))}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleExportExcel}
              className="h-10 bg-white hover:bg-green-50 text-green-600 border border-green-200 hover:border-green-300 gap-1.5 rounded-lg shadow-sm font-medium text-sm transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" /> Excel
            </Button>

            <Button
              onClick={handleCalculate}
              disabled={
                loading || isCurrentOrFuture || isApprovedAll || isPaidAll
              }
              className="h-10 bg-blue-600 hover:bg-blue-700 text-white gap-1.5 rounded-lg shadow-sm font-medium text-sm transition-all"
            >
              <Calculator className="w-4 h-4" />{" "}
              {loading
                ? "Đang tính..."
                : isRejectedAll
                  ? "Tính lại"
                  : "Tính Lương"}
            </Button>

            {canApprove && (
              <Button
                onClick={handleApprove}
                disabled={!isDraftAll || payrolls.length === 0}
                className="h-10 bg-amber-500 hover:bg-amber-600 text-white gap-1.5 rounded-lg shadow-sm font-medium text-sm transition-all"
              >
                <CheckCircle className="w-4 h-4" /> Chốt Sổ
              </Button>
            )}

            {canApprove && (
              <Button
                onClick={() => setShowRejectDialog(true)}
                disabled={!isDraftAll || payrolls.length === 0}
                className="h-10 bg-red-600 hover:bg-red-700 text-white gap-1.5 rounded-lg shadow-sm font-medium text-sm transition-all"
              >
                <XCircle className="w-4 h-4" /> Từ chối
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-lg border border-gray-300 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-[#E6F4F1] border-b border-gray-300">
                <th className="px-4 py-3 font-bold text-black border-r border-gray-300">Mã NV</th>
                <th className="px-4 py-3 font-bold text-black border-r border-gray-300">Họ tên nhân viên</th>
                <th className="px-4 py-3 font-bold text-black border-r border-gray-300 text-center">Trạng thái</th>
                <th className="px-4 py-3 font-bold text-black border-r border-gray-300 text-center">Hành động</th>
                <th className="px-4 py-3 font-bold text-black border-r border-gray-300 text-right text-green-800">Thực lĩnh</th>
                <th className="px-4 py-3 font-bold text-black border-r border-gray-300 text-right bg-slate-50/10">Công mặt</th>
                <th className="px-4 py-3 font-bold text-black border-r border-gray-300 text-right bg-slate-50/10">Ngày phép</th>
                <th className="px-4 py-3 font-bold text-black border-r border-gray-300 text-right">Lương thời gian</th>
                <th className="px-4 py-3 font-bold text-black border-r border-gray-300 text-right">Phụ cấp/OT</th>
                <th className="px-4 py-3 font-bold text-black border-r border-gray-300 text-right text-blue-800">Tổng thu nhập</th>
                <th className="px-4 py-3 font-bold text-black border-r border-gray-300 text-right text-red-800">Bảo hiểm</th>
                <th className="px-4 py-3 font-bold text-black text-right text-red-800">Thuế TNCN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {payrolls.map((p) => (
                <tr key={p.id} className="hover:bg-[#FFF8E1] transition-colors">
                  <td className="px-4 py-2.5 border-r border-gray-200 text-gray-700">{p.employee.id}</td>
                  <td className="px-4 py-2.5 border-r border-gray-200 font-semibold text-gray-900">{p.employee.fullName}</td>
                  <td className="px-4 py-2.5 border-r border-gray-200 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        p.status === "APPROVED"
                          ? "bg-amber-50 text-amber-600"
                          : p.status === "PAID"
                            ? "bg-emerald-50 text-emerald-600"
                            : p.status === "REJECTED"
                              ? "bg-red-50 text-red-600"
                              : "bg-gray-100 text-gray-600"
                      }`}
                      title={p.status === "REJECTED" ? p.rejectionReason : ""}
                    >
                      {p.status === "DRAFT"
                        ? "Dự thảo"
                        : p.status === "APPROVED"
                          ? "Đã chốt"
                          : p.status === "REJECTED"
                            ? "Từ chối"
                            : "Đã trả"}
                      {p.status === "REJECTED" && p.rejectionReason && " *"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 border-r border-gray-200 text-center">
                    <PayslipDialog payroll={p} />
                  </td>
                  <td className="px-4 py-2.5 border-r border-gray-200 text-right font-black text-emerald-600 tabular-nums">
                    {formatVND(p.netPay)}
                  </td>
                  <td className="px-4 py-2.5 border-r border-gray-200 text-right text-gray-600 tabular-nums">
                    {p.realWorkDays}
                  </td>
                  <td className="px-4 py-2.5 border-r border-gray-200 text-right font-bold text-emerald-600 tabular-nums">
                    +{p.paidLeaveDays || 0}
                  </td>
                  <td className="px-4 py-2.5 border-r border-gray-200 text-right text-gray-700 tabular-nums">
                    {formatVND(p.baseSalaryPay)}
                  </td>
                  <td className="px-4 py-2.5 border-r border-gray-200 text-right text-gray-600 tabular-nums">
                    {formatVND(
                      p.mealAllowance +
                        p.otPay +
                        (p.seniorityAllowance || 0) +
                        (p.bonus || 0) +
                        (p.otherAllowances || 0) -
                        (p.penalty || 0),
                    )}
                  </td>
                  <td className="px-4 py-2.5 border-r border-gray-200 text-right font-bold text-blue-800 tabular-nums">
                    {formatVND(p.grossIncome)}
                  </td>
                  <td className="px-4 py-2.5 border-r border-gray-200 text-right text-red-500 font-medium tabular-nums">
                    {formatVND(Math.abs(p.totalInsurance))}
                  </td>
                  <td className="px-4 py-2.5 text-right text-red-500 font-medium tabular-nums">
                    {formatVND(Math.abs(p.taxAmount))}
                  </td>
                </tr>
              ))}
              {payrolls.length === 0 && (
                <tr>
                  <td
                    colSpan={12}
                    className="px-6 py-20 text-center text-gray-400 italic bg-white"
                  >
                    <Calculator className="w-12 h-12 mx-auto mb-4 opacity-10" />
                    Chưa có dữ liệu bảng lương tháng {month}/{year}. Vui lòng nhấn "Tính Lương".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Professional Footer */}
        <div className="bg-white border-t border-gray-300 p-3 flex flex-col md:flex-row items-center justify-between text-xs text-gray-600 gap-4">
          <div className="font-medium">
            Tổng số:{" "}
            <span className="font-bold text-black">
              {totalElements}
            </span>{" "}
            bản ghi
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">{pageSize} bản ghi trên 1 trang</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                className={`px-2 py-1 rounded transition-colors ${
                  page === 0
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-blue-600 font-medium hover:bg-gray-100"
                }`}
              >
                Trước
              </button>
              {Array.from({ length: totalPages }).map((_, pIdx) => (
                <button
                  key={pIdx}
                  onClick={() => setPage(pIdx)}
                  className={`w-7 h-7 flex items-center justify-center rounded border transition-all ${
                    pIdx === page
                      ? "border-blue-600 bg-blue-50 text-blue-600 font-bold"
                      : "border-transparent hover:bg-gray-100 text-gray-600"
                  }`}
                >
                  {pIdx + 1}
                </button>
              ))}
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(page + 1)}
                className={`px-2 py-1 rounded transition-colors ${
                  page >= totalPages - 1
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-blue-600 font-medium hover:bg-gray-100"
                }`}
              >
                Sau
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2 text-red-600">
              <XCircle className="w-5 h-5" /> Từ chối Bảng lương tháng {month}/
              {year}
            </h3>
            <p className="text-sm text-gray-500">
              Sau khi từ chối, Kế toán tiền lương sẽ cần tính lại bảng lương.
            </p>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-500">
                Lý do từ chối *
              </label>
              <textarea
                className="w-full border rounded-lg px-3 py-2 text-sm min-h-[80px] focus:ring-2 focus:ring-red-200 outline-none"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập lý do từ chối bảng lương..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectReason("");
                }}
              >
                Hủy
              </Button>
              <Button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <XCircle className="w-4 h-4 mr-1" /> Xác nhận từ chối
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
