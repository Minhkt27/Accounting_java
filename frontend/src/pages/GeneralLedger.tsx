import { useState, useEffect } from "react"
import axios from "axios"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Book, Search } from "lucide-react"

export default function GeneralLedgerPage() {
  const [entries, setEntries] = useState<any[]>([])
  const [accountId, setAccountId] = useState("334")
  const [month, setMonth] = useState(new Date().getMonth() === 0 ? 12 : new Date().getMonth())
  const [year, setYear] = useState(new Date().getMonth() === 0 ? new Date().getFullYear() - 1 : new Date().getFullYear())
  const [loading, setLoading] = useState(false)

  const fetchLedger = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`/api/accounting/ledger/${accountId}?month=${month}&year=${year}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      })
      setEntries(res.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchLedger() }, [month, year])

  const formatVND = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Book className="w-6 h-6 text-primary" /> Sổ cái (General Ledger)
        </h1>
        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border">
            <span className="text-[10px] font-black uppercase text-muted-foreground">Tài khoản</span>
            <select 
              value={accountId} onChange={e => setAccountId(e.target.value)}
              className="h-8 bg-transparent border-none font-bold text-primary focus:ring-0"
            >
                <option value="334">334 - Phải trả NLĐ</option>
                <option value="338">338 - Phải trả BH, KPCĐ</option>
                <option value="642">642 - Chi phí QLDN</option>
                <option value="111">111 - Tiền mặt</option>
                <option value="112">112 - Tiền gửi NH</option>
                <option value="3335">3335 - Thuế TNCN</option>
            </select>
            <Input type="number" className="w-16 h-8 text-center" value={month} onChange={e => setMonth(Number(e.target.value))} />
            <span className="text-muted-foreground">/</span>
            <Input type="number" className="w-20 h-8 text-center" value={year} onChange={e => setYear(Number(e.target.value))} />
            <Button size="default" onClick={fetchLedger} disabled={loading} className="h-8 ml-2 gap-1">
                <Search className="w-3 h-3" /> Tìm kiếm
            </Button>
        </div>
      </div>

      <div className="border rounded-xl bg-card shadow-lg overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-800 text-white border-b">
            <tr>
              <th className="px-4 py-3 font-bold" rowSpan={2}>Ngày</th>
              <th className="px-4 py-3 font-bold" colSpan={2}>Chứng từ</th>
              <th className="px-4 py-3 font-bold" rowSpan={2}>Diễn giải</th>
              <th className="px-4 py-3 font-bold text-center" rowSpan={2}>TK Đối ứng</th>
              <th className="px-4 py-3 font-bold text-right border-l" colSpan={2}>Số phát sinh</th>
            </tr>
            <tr className="bg-slate-700/50">
                <th className="px-4 py-1 text-[10px] font-bold">Số hiệu</th>
                <th className="px-4 py-1 text-[10px] font-bold text-center">Ngày ghi</th>
                <th className="px-4 py-1 text-[10px] font-bold text-right border-l">Nợ</th>
                <th className="px-4 py-1 text-[10px] font-bold text-right">Có</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {entries.map((e) => (
              <tr key={e.id} className="hover:bg-muted/50 transition-colors">
                <td className="px-4 py-4">{e.voucherDate}</td>
                <td className="px-4 py-4 font-bold text-primary">{e.voucherNumber}</td>
                <td className="px-4 py-4 text-center">{e.voucherDate}</td>
                <td className="px-4 py-4 italic">{e.description}</td>
                <td className="px-4 py-4 text-center font-bold text-muted-foreground">{e.oppositeAccount}</td>
                <td className="px-4 py-4 text-right tabular-nums bg-slate-50/30 border-l font-bold">{e.debit > 0 ? formatVND(e.debit) : ""}</td>
                <td className="px-4 py-4 text-right tabular-nums bg-slate-50/30 font-bold">{e.credit > 0 ? formatVND(e.credit) : ""}</td>
              </tr>
            ))}
            {entries.length === 0 && (
                <tr>
                    <td colSpan={7} className="text-center py-10 italic text-muted-foreground opacity-50">Không có phát sinh cho tài khoản {accountId} trong kỳ</td>
                </tr>
            )}
          </tbody>
          <tfoot className="bg-slate-50 font-black">
              <tr>
                <td colSpan={5} className="px-4 py-2 text-right">TỔNG PHÁT SINH TRONG KỲ:</td>
                <td className="px-4 py-2 text-right border-l">{formatVND(entries.reduce((a, b) => a + b.debit, 0))}</td>
                <td className="px-4 py-2 text-right">{formatVND(entries.reduce((a, b) => a + b.credit, 0))}</td>
              </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
