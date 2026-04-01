import { useState, useEffect } from "react"
import axios from "axios"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { CreditCard, Printer, CheckCircle2, AlertCircle } from "lucide-react"
import PaymentDialog from "../components/PaymentDialog"

export default function PaymentsPage() {
  const [payrolls, setPayrolls] = useState<any[]>([])
  const [vouchers, setVouchers] = useState<any[]>([])
  const [month, setMonth] = useState(new Date().getMonth() === 0 ? 12 : new Date().getMonth())
  const [year, setYear] = useState(new Date().getMonth() === 0 ? new Date().getFullYear() - 1 : new Date().getFullYear())

  const fetchData = async () => {
    try {
      const auth = { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      const resP = await axios.get(`/api/payroll/${month}/${year}`, auth)
      setPayrolls(resP.data)
      const resV = await axios.get(`/api/accounting/vouchers?month=${month}&year=${year}`, auth)
      setVouchers(resV.data.filter((v: any) => v.type === 'PHIEU_CHI' || v.type === 'UNC'))
    } catch (err) { console.error(err) }
  }

  useEffect(() => { fetchData() }, [month, year])

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
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-blue-100">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-blue-700">
          <CreditCard className="w-8 h-8" /> Thanh toán Lương & Chứng từ (Cashier)
        </h1>
        <div className="flex items-center gap-2 bg-blue-50 p-2 rounded-lg border border-blue-200">
            <span className="text-[10px] font-black uppercase text-blue-600">Kỳ thanh toán</span>
            <Input type="number" className="w-16 h-8 text-center font-bold" value={month} onChange={e => setMonth(Number(e.target.value))} />
            <span className="text-muted-foreground">/</span>
            <Input type="number" className="w-20 h-8 text-center font-bold" value={year} onChange={e => setYear(Number(e.target.value))} />
            <Button size="default" onClick={fetchData} className="h-8 ml-2">Reload</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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

        <div className="lg:col-span-2 bg-white rounded-2xl border shadow-lg overflow-hidden">
             <div className="bg-slate-800 p-4 text-white font-bold flex justify-between items-center">
                 <span>DANH SÁCH CHỨNG TỪ CHI LƯƠNG</span>
                 <Printer className="w-4 h-4 opacity-50 cursor-pointer hover:opacity-100" />
             </div>
             <table className="w-full text-sm text-left">
                 <thead>
                     <tr className="bg-slate-100 text-slate-600 font-bold border-b">
                         <th className="p-4">Số CT</th>
                         <th className="p-4">Ngày giao dịch</th>
                         <th className="p-4">Diễn giải</th>
                         <th className="p-4 text-right">Số tiền</th>
                         <th className="p-4 text-center">Tình trạng</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y">
                     {vouchers.map(v => (
                         <tr key={v.id} className="hover:bg-slate-50 transition-colors group">
                             <td className="p-4 font-black text-blue-600">{v.voucherNumber}</td>
                             <td className="p-4">{v.voucherDate}</td>
                             <td className="p-4 italic text-slate-500">{v.description}</td>
                             <td className="p-4 text-right font-black">{formatVND(v.totalAmount)}</td>
                             <td className="p-4 text-center">
                                 <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold">HOÀN TẤT</span>
                             </td>
                         </tr>
                     ))}
                     {vouchers.length === 0 && (
                         <tr>
                             <td colSpan={5} className="p-10 text-center text-slate-300 italic">Chưa có chứng từ chi lương nào trong kỳ này</td>
                         </tr>
                     )}
                 </tbody>
             </table>
        </div>
      </div>
    </div>
  )
}
