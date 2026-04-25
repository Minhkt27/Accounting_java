import { useState, useEffect } from "react"
import axios from "axios"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { CreditCard, Banknote, FileSpreadsheet, DollarSign, ShieldCheck, Receipt, CheckCircle2 } from "lucide-react"
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
      const resP = await axios.get(`/api/payroll/${month}/${year}?size=10000`, auth)
      setPayrolls(resP.data.content || [])
      const resV = await axios.get(`/api/accounting/vouchers?month=${month}&year=${year}&size=10000`, auth)
      setPayments(resV.data.content || [])
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

  const handlePaySalary = async (method: string) => {
    try {
      await axios.post(`/api/payroll/pay?month=${month}&year=${year}&paymentMethod=${method}`, null, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      })
      alert("Đã lập chứng từ thanh toán lương thành công!")
      fetchData()
    } catch (err: any) { alert(err.response?.data || "Lỗi khi thanh toán lương") }
  }

  const handlePayInsurance = async (method: string) => {
    try {
      await axios.post(`/api/payroll/pay-insurance?month=${month}&year=${year}&paymentMethod=${method}`, null, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      })
      alert("Đã lập chứng từ nộp bảo hiểm thành công!")
      fetchData()
    } catch (err: any) { alert(err.response?.data || "Lỗi khi nộp bảo hiểm") }
  }

  const handlePayTax = async (method: string) => {
    try {
      await axios.post(`/api/payroll/pay-tax?month=${month}&year=${year}&paymentMethod=${method}`, null, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      })
      alert("Đã lập chứng từ nộp thuế TNCN thành công!")
      fetchData()
    } catch (err: any) { alert(err.response?.data || "Lỗi khi nộp thuế") }
  }

  const formatVND = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0)
  }

  const approvedOrPaidPayrolls = payrolls.filter(p => p.status === 'APPROVED' || p.status === 'PAID');
  const canPay = approvedOrPaidPayrolls.length > 0;

  const totalNetPay = approvedOrPaidPayrolls.reduce((a: number, b: any) => a + (b.netPay || 0), 0);
  const totalInsuranceEE = approvedOrPaidPayrolls.reduce((a: number, b: any) => a + (b.totalInsurance || 0), 0);
  const totalInsuranceER = approvedOrPaidPayrolls.reduce((a: number, b: any) => a + (b.totalEmployerInsurance || 0), 0);
  const totalInsurance = totalInsuranceEE + totalInsuranceER;
  const totalTax = approvedOrPaidPayrolls.reduce((a: number, b: any) => a + (b.taxAmount || 0), 0);

  // Kiểm tra loại nào đã thanh toán rồi (dựa trên prefix của voucherNumber)
  const paidSalary = payments.some((p: any) => p.voucherNumber?.includes("-LUONG-") && (p.type === "PHIEU_CHI" || p.type === "UNC"));
  const paidInsurance = payments.some((p: any) => p.voucherNumber?.includes("-BH-") && (p.type === "PHIEU_CHI" || p.type === "UNC"));
  const paidTax = payments.some((p: any) => p.voucherNumber?.includes("-THUE-") && (p.type === "PHIEU_CHI" || p.type === "UNC"));

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
        {/* Left: Summary Panel */}
        <div className="lg:col-span-1 space-y-4">
            {/* Card 1: Thanh toán Lương */}
            <div className={`p-5 rounded-2xl border-2 border-dashed flex flex-col items-center text-center space-y-3 relative overflow-hidden transition-all ${
              paidSalary ? 'bg-slate-50 border-slate-200 opacity-70' : 'bg-green-50 border-green-300'
            }`}>
               {paidSalary && (
                 <div className="absolute top-3 right-3 flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">
                   <CheckCircle2 className="w-3 h-3" /> Đã thanh toán
                 </div>
               )}
               <div className={`p-3 rounded-full ${paidSalary ? 'bg-slate-100 text-slate-400' : 'bg-green-100 text-green-600'}`}>
                   <DollarSign className="w-6 h-6" />
               </div>
               <div>
                   <h3 className={`font-black uppercase text-[10px] tracking-widest ${paidSalary ? 'text-slate-500' : 'text-green-800'}`}>Lương thực lĩnh (NET)</h3>
                   <p className={`text-2xl font-black ${paidSalary ? 'text-slate-400 line-through' : 'text-green-700'}`}>{formatVND(totalNetPay)}</p>
                   <p className="text-[10px] text-slate-400 mt-0.5">Nợ 334 / Có 111, 112</p>
               </div>
               {!paidSalary && <PaymentDialog onPay={handlePaySalary} disabled={!canPay} paymentType="SALARY" />}
            </div>

            {/* Card 2: Nộp Bảo hiểm */}
            <div className={`p-5 rounded-2xl border-2 border-dashed flex flex-col items-center text-center space-y-3 relative overflow-hidden transition-all ${
              paidInsurance ? 'bg-slate-50 border-slate-200 opacity-70' : 'bg-blue-50 border-blue-300'
            }`}>
               {paidInsurance && (
                 <div className="absolute top-3 right-3 flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">
                   <CheckCircle2 className="w-3 h-3" /> Đã nộp
                 </div>
               )}
               <div className={`p-3 rounded-full ${paidInsurance ? 'bg-slate-100 text-slate-400' : 'bg-blue-100 text-blue-600'}`}>
                   <ShieldCheck className="w-6 h-6" />
               </div>
               <div>
                   <h3 className={`font-black uppercase text-[10px] tracking-widest ${paidInsurance ? 'text-slate-500' : 'text-blue-800'}`}>Bảo hiểm (NLĐ + DN)</h3>
                   <p className={`text-2xl font-black ${paidInsurance ? 'text-slate-400 line-through' : 'text-blue-700'}`}>{formatVND(totalInsurance)}</p>
                   <div className="text-[10px] text-slate-400 mt-0.5 space-y-0.5">
                     <p>NLĐ đóng (10.5%): {formatVND(totalInsuranceEE)}</p>
                     <p>DN đóng (23.5%): {formatVND(totalInsuranceER)}</p>
                     <p className="font-bold">Nợ 338 / Có 111, 112</p>
                   </div>
               </div>
               {!paidInsurance && <PaymentDialog onPay={handlePayInsurance} disabled={!canPay} paymentType="INSURANCE" />}
            </div>

            {/* Card 3: Nộp Thuế TNCN */}
            <div className={`p-5 rounded-2xl border-2 border-dashed flex flex-col items-center text-center space-y-3 relative overflow-hidden transition-all ${
              paidTax ? 'bg-slate-50 border-slate-200 opacity-70' : 'bg-amber-50 border-amber-300'
            }`}>
               {paidTax && (
                 <div className="absolute top-3 right-3 flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">
                   <CheckCircle2 className="w-3 h-3" /> Đã nộp
                 </div>
               )}
               <div className={`p-3 rounded-full ${paidTax ? 'bg-slate-100 text-slate-400' : 'bg-amber-100 text-amber-600'}`}>
                   <Receipt className="w-6 h-6" />
               </div>
               <div>
                   <h3 className={`font-black uppercase text-[10px] tracking-widest ${paidTax ? 'text-slate-500' : 'text-amber-800'}`}>Thuế TNCN</h3>
                   <p className={`text-2xl font-black ${paidTax ? 'text-slate-400 line-through' : 'text-amber-700'}`}>{formatVND(totalTax)}</p>
                   <p className="text-[10px] text-slate-400 mt-0.5 font-bold">Nợ 3335 / Có 111, 112</p>
               </div>
               {!paidTax && <PaymentDialog onPay={handlePayTax} disabled={!canPay || totalTax <= 0} paymentType="TAX" />}
            </div>
        </div>

        {/* Right: Payment Voucher List */}
        <div className="lg:col-span-3">
            <div className="border border-slate-100 rounded-3xl bg-white shadow-xl shadow-slate-200/50 overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-primary text-primary-foreground">
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
