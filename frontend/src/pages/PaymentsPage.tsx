import { useState, useEffect } from "react"
import axios from "axios"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { CreditCard, Banknote, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react"
import PaymentDialog from "../components/PaymentDialog"
import { ExportService } from "../utils/ExportService"

export default function PaymentsPage() {
  const [payrolls, setPayrolls] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [month, setMonth] = useState(new Date().getMonth() === 0 ? 12 : new Date().getMonth())
  const [year, setYear] = useState(new Date().getMonth() === 0 ? new Date().getFullYear() - 1 : new Date().getFullYear())

  const fetchData = async () => {
    try {
      const auth = { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      const resP = await axios.get(`/api/payroll/${month}/${year}`, auth)
      setPayrolls(resP.data)
      const resV = await axios.get(`/api/accounting/vouchers?month=${month}&year=${year}`, auth)
      setPayments(resV.data)
    } catch (err) { console.error(err) }
  }

  useEffect(() => { fetchData() }, [month, year])

  const handleExportExcel = () => {
    ExportService.exportToExcel(
      payments,
      `Chung_tu_thanh_toan_T${month}_${year}`,
      'Chứng từ chi',
      {
        voucherNumber: "Số hiệu",
        voucherDate: "Ngày giao dịch",
        description: "Diễn giải",
        totalAmount: "Số tiền",
        type: "Loại"
      }
    );
  }


  const handlePay = async (method: string) => {
    try {
      await axios.post(`/api/payroll/pay?month=${month}&year=${year}&paymentMethod=${method}`, null, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      })
      alert("Đã lập chứng từ thanh toán thành công!")
      fetchData()
    } catch (err: any) { alert(err.response?.data || "Lỗi khi thanh toán") }
  }

  const formatVND = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0)
  }

  const approvedPayrolls = payrolls.filter(p => p.status === 'APPROVED');
  const paidPayrolls = payrolls.filter(p => p.status === 'PAID');
  const totalToPay = approvedPayrolls.reduce((a, b) => a + b.netPay, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-4 rounded-xl shadow-sm border border-blue-100 gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-blue-700">
          <CreditCard className="w-8 h-8" /> Thanh toán Lương & Chứng từ (Cashier)
        </h1>
        <div className="flex flex-wrap items-center gap-2 bg-blue-50 p-2 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 border-r pr-2 mr-2">
              <span className="text-[10px] font-black uppercase text-blue-600">Kỳ thanh toán</span>
              <Input type="number" className="w-16 h-8 text-center font-bold" value={month} onChange={e => setMonth(Math.max(1, Math.min(12, Number(e.target.value))))} />
              <span className="text-muted-foreground">/</span>
              <Input type="number" className="w-20 h-8 text-center font-bold" value={year} onChange={e => setYear(Math.max(2000, Number(e.target.value)))} />
            </div>
            <div className="flex items-center gap-2">
              <Button size="default" variant="outline" onClick={handleExportExcel} className="h-8 gap-2 border-green-600 text-green-600 hover:bg-green-50 shadow-sm">
                  <FileSpreadsheet className="w-4 h-4" /> Excel
              </Button>
              <Button size="default" variant="outline" onClick={fetchData} className="h-8 font-bold border border-blue-200 shadow-sm">Reload</Button>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left: Summary Panel (HIDDEN IN PRINT) */}
        <div className="lg:col-span-1 space-y-6">
            <div className={`p-6 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center space-y-4 ${
                totalToPay > 0 ? "bg-amber-50 border-amber-300" : "bg-slate-50 border-slate-200"
            }`}>
               <div className={`p-4 rounded-full ${totalToPay > 0 ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-400"}`}>
                   <AlertCircle className="w-8 h-8" />
               </div>
               <div>
                   <h3 className="font-black text-slate-700 uppercase text-xs">Cần thanh toán</h3>
                   <p className="text-3xl font-black text-slate-900">{formatVND(totalToPay)}</p>
                   <p className="text-xs text-slate-500 mt-1">Dành cho {approvedPayrolls.length} nhân viên đã được duyệt lương</p>
               </div>
               <PaymentDialog onPay={handlePay} disabled={totalToPay === 0} />
            </div>

            <div className="bg-white rounded-2xl border p-6 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-500" /> Đã thanh toán kỳ này</h3>
                <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Số lượng NV:</span>
                        <span className="font-bold">{paidPayrolls.length}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-t pt-2">
                        <span className="text-slate-500">Tổng tiền đã chi:</span>
                        <span className="font-bold text-green-600">{formatVND(paidPayrolls.reduce((a, b) => a + b.netPay, 0))}</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Right: Payment List (THE MAIN REPORT CONTENT) */}
        <div className="lg:col-span-3">
            <div className="border border-slate-100 rounded-3xl bg-white shadow-xl shadow-slate-200/50 overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[#111827] text-white">
                            <tr>
                                <th className="px-6 py-5 font-black uppercase tracking-tighter">Ngày</th>
                                <th className="px-6 py-5 font-black uppercase tracking-tighter">Chứng từ</th>
                                <th className="px-6 py-5 font-black uppercase tracking-tighter">Loại g/d</th>
                                <th className="px-6 py-5 font-black uppercase tracking-tighter">Tài khoản nguồn</th>
                                <th className="px-6 py-5 font-black uppercase tracking-tighter text-right">Số tiền</th>
                                <th className="px-6 py-5 font-black uppercase tracking-tighter">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {payments.map((p) => (
                                <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-5 font-bold text-slate-500 tabular-nums">{p.voucherDate}</td>
                                    <td className="px-6 py-5">
                                        <div className="font-black text-slate-800">{p.voucherNumber || `PMT-${p.id}`}</div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{p.type === 'UNC' ? 'UNC' : 'Phiếu chi'}</div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg border shadow-sm ${
                                            p.type === 'PHIEU_CHI' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-slate-50 text-slate-700 border-slate-100'
                                        }`}>
                                            {p.type === 'PHIEU_CHI' ? 'Tiền mặt' : 'Chuyển khoản'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                                                {p.type === 'UNC' ? <CreditCard size={14} /> : <Banknote size={14} />}
                                            </div>
                                            <div>
                                                <div className="text-xs font-black text-slate-800">{p.description}</div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">{p.type}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right font-black text-slate-800 tabular-nums text-base">
                                        {formatVND(p.totalAmount)}
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2 justify-end">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter">Hoàn tất</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {payments.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-32 text-center text-slate-300 italic">
                                        <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                            <Banknote size={32} />
                                        </div>
                                        Chưa có giao dịch chi trả nào trong kỳ {month}/{year}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                  </table>
              </div>
        </div>
      </div>
    </div>
  )
}

