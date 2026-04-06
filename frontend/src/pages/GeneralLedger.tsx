import { useState, useEffect, useCallback, useMemo } from "react"
import axios from "axios"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Book, Search, FileSpreadsheet } from "lucide-react"
import { ExportService } from "../utils/ExportService"

interface LedgerEntry {
  id: number;
  voucherDate: string;
  voucherNumber: string;
  description: string;
  oppositeAccount: string;
  debit: number;
  credit: number;
}

export default function GeneralLedgerPage() {
  const [entries, setEntries] = useState<LedgerEntry[]>([])
  const [accountId, setAccountId] = useState("334")
  const [month, setMonth] = useState(new Date().getMonth() === 0 ? 12 : new Date().getMonth())
  const [year, setYear] = useState(new Date().getMonth() === 0 ? new Date().getFullYear() - 1 : new Date().getFullYear())
  const [loading, setLoading] = useState(false)

  const headers = useMemo(() => ({ 
    Authorization: `Bearer ${localStorage.getItem("token")}` 
  }), [])

  const fetchLedger = useCallback(async () => {
    setLoading(true)
    try {
      const res = await axios.get(`/api/accounting/ledger/${accountId}?month=${month}&year=${year}`, {
        headers
      })
      setEntries(res.data)
    } catch (err: unknown) { 
        console.error(err) 
    }
    finally { setLoading(false) }
  }, [accountId, month, year, headers])

  useEffect(() => { fetchLedger() }, [fetchLedger])

  const handleExportExcel = () => {
    ExportService.exportToExcel(
      entries,
      `So_cai_tai_khoan_${accountId}_T${month}_${year}`,
      'Sổ cái',
      {
        voucherDate: "Ngày",
        voucherNumber: "Số hiệu CT",
        description: "Diễn giải",
        oppositeAccount: "TK Đối ứng",
        debit: "Nợ",
        credit: "Có"
      }
    );
  }


  const formatVND = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center bg-white p-4 rounded-xl shadow-sm border gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Book className="w-6 h-6 text-primary" /> Sổ cái (General Ledger)
        </h1>
        <div className="flex flex-wrap lg:flex-nowrap items-center gap-3 bg-slate-50/80 p-1.5 rounded-lg border shadow-sm">
            <div className="flex items-center gap-2 px-2">
              <span className="text-xs font-semibold uppercase text-muted-foreground whitespace-nowrap">Tài khoản</span>
              <select 
                value={accountId} onChange={e => setAccountId(e.target.value)}
                className="h-8 bg-transparent border-none font-bold text-primary focus:ring-0 cursor-pointer outline-none"
              >
                  <option value="334">334 - Phải trả NLĐ</option>
                  <option value="338">338 - Phải trả BH, KPCĐ</option>
                  <option value="642">642 - Chi phí QLDN</option>
                  <option value="111">111 - Tiền mặt</option>
                  <option value="112">112 - Tiền gửi NH</option>
                  <option value="3335">3335 - Thuế TNCN</option>
              </select>
            </div>
            
            <div className="hidden lg:block h-6 w-[1px] bg-border"></div>

            <div className="flex items-center gap-2 px-2">
              <Input type="number" className="w-16 h-8 text-center bg-white font-medium shadow-sm transition-all focus:border-primary" value={month} onChange={e => setMonth(Math.max(1, Math.min(12, Number(e.target.value))))} />
              <span className="text-muted-foreground font-bold">/</span>
              <Input type="number" className="w-20 h-8 text-center bg-white font-medium shadow-sm transition-all focus:border-primary" value={year} onChange={e => setYear(Math.max(2000, Number(e.target.value)))} />
            </div>
            
            <div className="hidden lg:block h-6 w-[1px] bg-border"></div>
            
            <div className="flex items-center gap-2 px-1">
              <Button size="default" variant="outline" onClick={handleExportExcel} className="h-8 gap-1.5 border-green-600 text-green-600 hover:bg-green-50 shadow-sm bg-white hover:text-green-700">
                  <FileSpreadsheet className="w-4 h-4" /> Excel
              </Button>
              <Button size="default" onClick={fetchLedger} disabled={loading} className="h-8 gap-1.5 shadow-sm">
                  <Search className="w-4 h-4" /> Tìm kiếm
              </Button>
            </div>
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
                  <td className="px-4 py-2 text-right border-l">{formatVND(entries.reduce((a: number, b: LedgerEntry) => a + b.debit, 0))}</td>
                  <td className="px-4 py-2 text-right">{formatVND(entries.reduce((a: number, b: LedgerEntry) => a + b.credit, 0))}</td>
                </tr>
            </tfoot>
          </table>
        </div>
    </div>
  )
}
