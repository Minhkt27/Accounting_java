import { useState, useEffect, useCallback } from "react"
import axios from "axios"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Calculator, CheckCircle, XCircle, FileSpreadsheet } from "lucide-react"
import { ExportService } from "../utils/ExportService"
import PayslipDialog from "../components/PayslipDialog"
import { Pagination } from "../components/ui/pagination"

export interface Employee {
  id: string
  fullName: string
  dob?: string
  phone?: string
  email?: string
  department?: string
  resignationDate?: string
}

export interface Payroll {
  id: number
  employee: Employee
  month: number
  year: number
  contractSalary: number
  realWorkDays: number
  paidLeaveDays: number
  baseSalaryPay: number
  mealAllowance: number
  positionAllowance: number
  seniorityAllowance: number
  otNormalPay: number
  otWeekendPay: number
  otHolidayPay: number
  otPay: number
  otPremiumPay: number
  grossIncome: number
  bhxhNhanVien: number
  bhytNhanVien: number
  bhtnNhanVien: number
  totalInsurance: number
  bhxhCongTy: number
  bhytCongTy: number
  bhtnCongTy: number
  kpcdCongTy: number
  totalEmployerInsurance: number
  taxableIncomeBase: number
  personalDeduction: number
  dependentDeduction: number
  dependentCount: number
  taxableIncome: number
  taxAmount: number
  netPay: number
  status: string
  rejectionReason?: string
  bonus?: number
  penalty?: number
  otherAllowances?: number
  standardWorkDays?: number
  otNormalHours?: number
  otWeekendHours?: number
  otHolidayHours?: number
}

export default function PayrollPage() {
  const [payrolls, setPayrolls] = useState<Payroll[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [pageSize] = useState(20)

  // Mặc định hiển thị tháng trước
  const [month, setMonth] = useState(new Date().getMonth() === 0 ? 12 : new Date().getMonth())
  const [year, setYear] = useState(new Date().getMonth() === 0 ? new Date().getFullYear() - 1 : new Date().getFullYear())
  const [loading, setLoading] = useState(false)
  
  const user = JSON.parse(localStorage.getItem("user") || "{}")
  const canApprove = user.roles?.includes("ROLE_ADMIN") || user.roles?.includes("ROLE_KE_TOAN_TRUONG")

  useEffect(() => {
    setPage(0)
  }, [month, year])

  const fetchPayrolls = useCallback(async () => {
    try {
      const res = await axios.get(`/api/payroll/${month}/${year}?page=${page}&size=${pageSize}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      })
      setPayrolls(res.data.content)
      setTotalPages(res.data.totalPages)
      setTotalElements(res.data.totalElements)
    } catch (err: unknown) {
      console.error(err)
    }
  }, [month, year, page, pageSize])

  useEffect(() => {
    fetchPayrolls()
  }, [fetchPayrolls])

  const handleCalculate = async () => {
    setLoading(true)
    try {
      await axios.post(`/api/payroll/calculate?month=${month}&year=${year}`, null, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      })
      alert(`Đã tính lương xong cho tháng ${month}/${year}`)
      fetchPayrolls()
    } catch (err: unknown) {
      const serverMsg = axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : String(err)
      alert("Lỗi: " + serverMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!confirm("Bạn có chắc muốn chốt bảng lương này? Sau khi chốt sẽ không thể tính lại.")) return
    try {
      await axios.post(`/api/payroll/approve?month=${month}&year=${year}`, null, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      })
      alert("Đã chốt lương thành công!")
      fetchPayrolls()
    } catch (err: unknown) {
      const serverMsg = axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : String(err)
      alert("Lỗi khi chốt: " + serverMsg)
    }
  }


  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState("")

  const handleReject = async () => {
    if (!rejectReason.trim()) return alert("Vui lòng nhập lý do từ chối")
    try {
      await axios.post(`/api/payroll/reject?month=${month}&year=${year}&reason=${encodeURIComponent(rejectReason)}`, null, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      })
      alert("Đã từ chối bảng lương. Kế toán cần tính lại.")
      setShowRejectDialog(false)
      setRejectReason("")
      fetchPayrolls()
    } catch (err: unknown) {
      const serverMsg = axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : String(err)
      alert("Lỗi khi từ chối: " + serverMsg)
    }
  }

  const handleExportExcel = () => {
    const data = payrolls.map(p => ({
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
      status: p.status
    }));

    ExportService.exportToExcel(
      data,
      `Bang_luong_thang_${month}_${year}`,
      'Bảng lương',
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
        status: "Trạng thái"
      }
    );
  }


  const formatVND = (val: number) => {
    return new Intl.NumberFormat('vi-VN').format(Math.round(val || 0))
  }

  const isCurrentOrFuture = year * 12 + month > (new Date().getFullYear() * 12 + new Date().getMonth() + 1);
  const isDraftAll = payrolls.length > 0 && payrolls.every(p => p.status === 'DRAFT');
  const isApprovedAll = payrolls.length > 0 && payrolls.every(p => p.status === 'APPROVED');
  const isPaidAll = payrolls.length > 0 && payrolls.every(p => p.status === 'PAID');
  const isRejectedAll = payrolls.length > 0 && payrolls.every(p => p.status === 'REJECTED');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calculator className="w-6 h-6 text-primary" /> Quản lý Tiền lương
        </h1>
        
        <div className="flex flex-nowrap items-center gap-3 bg-muted/30 p-2 rounded-xl border shadow-sm overflow-x-auto scrollbar-hide flex-shrink-0">
          <div className="flex items-center gap-2 border-r pr-3">
            <span className="text-[10px] font-black uppercase text-muted-foreground mr-1">Kỳ lương</span>
            <Input type="number" className="w-16 h-8 text-center font-bold" value={month} onChange={e => setMonth(Math.max(1, Math.min(12, Number(e.target.value))))} />
            <span className="text-muted-foreground">/</span>
            <Input type="number" className="w-20 h-8 text-center font-bold" value={year} onChange={e => setYear(Math.max(2000, Number(e.target.value)))} />
          </div>

          <Button variant="outline" onClick={handleExportExcel} className="gap-2 h-8 border-green-600 text-green-600 hover:bg-green-50 shadow-sm">
            <FileSpreadsheet className="w-4 h-4" /> Excel
          </Button>

          <div className="w-[1px] h-6 bg-slate-200 mx-1" />
          
          <Button 
            onClick={handleCalculate} 
            disabled={loading || isCurrentOrFuture || isApprovedAll || isPaidAll} 
            className="gap-2 h-8"
          >
             <Calculator className="w-4 h-4" /> {loading ? "Đang tính..." : isRejectedAll ? "Tính lại" : "Tính Lương"}
          </Button>

          {canApprove && (
            <Button 
              onClick={handleApprove} 
              disabled={!isDraftAll || payrolls.length === 0}
              className="gap-2 h-8 bg-amber-500 hover:bg-amber-600 text-white font-bold"
            >
               <CheckCircle className="w-4 h-4" /> Chốt Sổ
            </Button>
          )}

          {canApprove && (
            <Button 
              onClick={() => setShowRejectDialog(true)} 
              disabled={!isDraftAll || payrolls.length === 0}
              className="gap-2 h-8 bg-red-500 hover:bg-red-600 text-white font-bold"
            >
               <XCircle className="w-4 h-4" /> Từ chối
            </Button>
          )}

        </div>
      </div>

        <div className="border rounded-xl bg-card shadow-lg overflow-hidden overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-primary text-primary-foreground border-b border-primary-foreground/10">
              <tr>
                <th className="px-4 py-4 font-bold">Mã NV</th>
                <th className="px-4 py-4 font-bold">Họ tên nhân viên</th>
                <th className="px-4 py-4 font-bold text-center">Trạng thái</th>
                <th className="px-4 py-4 font-bold text-center">Hành động</th>
                <th className="px-4 py-4 font-bold text-right text-yellow-200">Thực lĩnh</th>
                <th className="px-4 py-4 font-medium text-right bg-primary/95">Công mặt</th>
                <th className="px-4 py-4 font-medium text-right bg-primary/95">Ngày phép</th>
                <th className="px-4 py-4 font-medium text-right">Lương thời gian</th>
                <th className="px-4 py-4 font-medium text-right">Phụ cấp/OT</th>
                <th className="px-4 py-4 font-black text-blue-300 text-right">Tổng thu nhập</th>
                <th className="px-4 py-4 font-medium text-right text-red-300">Bảo hiểm</th>
                <th className="px-4 py-4 font-medium text-right text-red-300">Thuế TNCN</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {payrolls.map((p) => (
                <tr key={p.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-4 font-bold text-muted-foreground">{p.employee.id}</td>
                  <td className="px-4 py-4 font-semibold">{p.employee.fullName}</td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span 
                        className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg shadow-sm border ${
                          p.status === 'APPROVED' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          p.status === 'PAID' ? 'bg-green-50 text-green-700 border-green-200' :
                          p.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200 cursor-help' :
                          'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                        title={p.status === 'REJECTED' ? p.rejectionReason : ""}
                      >
                        {p.status === 'DRAFT' ? 'Dự thảo' : p.status === 'APPROVED' ? 'Đã chốt' : p.status === 'REJECTED' ? 'Từ chối' : 'Đã trả'}
                        {p.status === 'REJECTED' && p.rejectionReason && " *"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                      <PayslipDialog payroll={p} />
                  </td>
                  <td className="px-4 py-4 text-right">
                      <div className="font-black text-green-600 dark:text-green-400 text-base tabular-nums">
                          {formatVND(p.netPay)}
                      </div>
                  </td>
                  <td className="px-4 py-4 text-right font-medium text-slate-500 tabular-nums bg-muted/20">{p.realWorkDays}</td>
                  <td className="px-4 py-4 text-right font-bold text-green-600 tabular-nums bg-muted/20">+{p.paidLeaveDays || 0}</td>
                  <td className="px-4 py-4 text-right font-bold tabular-nums text-primary/80">{formatVND(p.baseSalaryPay)}</td>
                  <td className="px-4 py-4 text-right tabular-nums">{formatVND(p.mealAllowance + p.otPay + (p.seniorityAllowance || 0) + (p.bonus || 0) + (p.otherAllowances || 0) - (p.penalty || 0))}</td>
                  <td className="px-4 py-4 text-right font-black text-blue-600 dark:text-blue-400 tabular-nums">{formatVND(p.grossIncome)}</td>
                  <td className="px-4 py-4 text-right text-red-500 font-medium tabular-nums">{formatVND(Math.abs(p.totalInsurance))}</td>
                  <td className="px-4 py-4 text-right text-red-500 font-medium tabular-nums">{formatVND(Math.abs(p.taxAmount))}</td>
                </tr>
              ))}
              {payrolls.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-6 py-16 text-center text-muted-foreground/60 italic">
                    <Calculator className="w-12 h-12 mx-auto mb-4 opacity-10" />
                    Chưa có dữ liệu bảng lương tháng {month}/{year}. Vui lòng nhấn "Tính Lương".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <Pagination 
            currentPage={page}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </div>

      {/* Reject Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2 text-red-600">
              <XCircle className="w-5 h-5" /> Từ chối Bảng lương tháng {month}/{year}
            </h3>
            <p className="text-sm text-slate-500">Sau khi từ chối, Kế toán tiền lương sẽ cần tính lại bảng lương.</p>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500">Lý do từ chối *</label>
              <textarea
                className="w-full border rounded-lg px-3 py-2 text-sm min-h-[80px] focus:ring-2 focus:ring-red-200 outline-none"
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Nhập lý do từ chối bảng lương..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setShowRejectDialog(false); setRejectReason("") }}>Hủy</Button>
              <Button onClick={handleReject} disabled={!rejectReason.trim()} className="bg-red-600 hover:bg-red-700 text-white">
                <XCircle className="w-4 h-4 mr-1" /> Xác nhận từ chối
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
