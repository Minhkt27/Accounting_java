import { useState, useEffect, useCallback, useMemo } from "react"
import axios from "axios"
import { Input } from "../components/ui/input"
import { BookOpen, Receipt, ArrowRightLeft, FileSpreadsheet } from "lucide-react"
import { Button } from "../components/ui/button"
import { ExportService } from "../utils/ExportService"

import { Pagination } from "../components/ui/pagination"

interface VoucherItem {
  id: number
  voucherNumber: string
  type: string
  voucherDate: string
  totalAmount: number
  description: string
  createdAt: string
}

interface JournalItem {
  id: number
  voucherNumber: string
  voucherDate: string
  debitAccountId: string
  debitAccountName: string
  creditAccountId: string
  creditAccountName: string
  amount: number
  description: string
}

export default function VoucherJournalPage() {
  const [tab, setTab] = useState<"vouchers" | "journal">("vouchers")
  const [month, setMonth] = useState(new Date().getMonth() === 0 ? 12 : new Date().getMonth())
  const [year, setYear] = useState(new Date().getMonth() === 0 ? new Date().getFullYear() - 1 : new Date().getFullYear())
  const [vouchers, setVouchers] = useState<VoucherItem[]>([])
  const [journal, setJournal] = useState<JournalItem[]>([])

  const [vPage, setVPage] = useState(0)
  const [vTotalPages, setVTotalPages] = useState(0)
  const [vTotalElements, setVTotalElements] = useState(0)

  const [jPage, setJPage] = useState(0)
  const [jTotalPages, setJTotalPages] = useState(0)
  const [jTotalElements, setJTotalElements] = useState(0)

  const pageSize = 20

  const headers = useMemo(() => ({ 
    Authorization: `Bearer ${localStorage.getItem("token")}` 
  }), [])

  const handleMonthChange = (m: number) => {
    setMonth(m)
    setVPage(0)
    setJPage(0)
  }

  const handleYearChange = (y: number) => {
    setYear(y)
    setVPage(0)
    setJPage(0)
  }

  const handleTabChange = (t: "vouchers" | "journal") => {
    setTab(t)
    setVPage(0)
    setJPage(0)
  }

  const fetchData = useCallback(async () => {
    try {
      if (tab === "vouchers") {
        const vRes = await axios.get(`/api/accounting/vouchers?month=${month}&year=${year}&page=${vPage}&size=${pageSize}`, { headers })
        setVouchers(vRes.data.content)
        setVTotalPages(vRes.data.totalPages)
        setVTotalElements(vRes.data.totalElements)
      } else {
        const jRes = await axios.get(`/api/accounting/journal?month=${month}&year=${year}&page=${jPage}&size=${pageSize}`, { headers })
        setJournal(jRes.data.content)
        setJTotalPages(jRes.data.totalPages)
        setJTotalElements(jRes.data.totalElements)
      }
    } catch (err: unknown) {
      console.error(err)
    }
  }, [month, year, headers, tab, vPage, jPage])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchData])

  const handleExportExcel = useCallback(() => {
    if (tab === 'vouchers') {
      ExportService.exportToExcel(vouchers, `Chung_tu_ke_toan_${month}_${year}`, 'Chứng từ', {
        voucherNumber: "Số chứng từ", type: "Loại", voucherDate: "Ngày lập", totalAmount: "Tổng tiền", description: "Diễn giải"
      });
    } else {
      ExportService.exportToExcel(journal, `Nhat_ky_chung_${month}_${year}`, 'Nhật ký', {
        voucherDate: "Ngày", voucherNumber: "Chứng từ", debitAccountId: "TK Nợ", creditAccountId: "TK Có", amount: "Số tiền", description: "Diễn giải"
      });
    }
  }, [tab, vouchers, journal, month, year])


  const formatVND = (val: number) =>
    new Intl.NumberFormat('vi-VN').format(val || 0)

  const totalJournalDebit = journal.reduce((sum, j) => sum + j.amount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-primary" /> Sổ Kế Toán
        </h1>
        <div className="flex items-center gap-3 bg-muted/30 p-2 rounded-xl border shadow-sm">
          <div className="flex items-center gap-2 border-r pr-3">
            <span className="text-[10px] font-black uppercase text-muted-foreground">Kỳ</span>
            <Input type="number" className="w-16 h-8 text-center font-bold" value={month} onChange={e => handleMonthChange(Math.max(1, Math.min(12, Number(e.target.value))))} />
            <span className="text-muted-foreground">/</span>
            <Input type="number" className="w-20 h-8 text-center font-bold" value={year} onChange={e => handleYearChange(Math.max(2000, Number(e.target.value)))} />
          </div>
          <Button variant="outline" onClick={handleExportExcel} className="gap-2 h-8 border-green-600 text-green-600 hover:bg-green-50 shadow-sm">
            <FileSpreadsheet className="w-4 h-4" /> Excel
          </Button>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 bg-muted/30 p-1 rounded-xl border w-fit">
        <button
          onClick={() => handleTabChange("vouchers")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            tab === "vouchers" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <Receipt className="w-4 h-4" /> Chứng từ ({vouchers.length})
        </button>
        <button
          onClick={() => handleTabChange("journal")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            tab === "journal" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" /> Nhật ký chung ({journal.length})
        </button>
      </div>

      {/* Tab content */}
      {tab === "vouchers" && (
          <div className="border rounded-2xl bg-card shadow-xl overflow-hidden border-primary/10">
            <table className="w-full text-sm text-left">
              <thead className="bg-primary text-primary-foreground">
                <tr>
                  <th className="px-4 py-4 font-bold">Số chứng từ</th>
                  <th className="px-4 py-4 font-bold">Loại</th>
                  <th className="px-4 py-4 font-bold">Ngày lập</th>
                  <th className="px-4 py-4 font-bold text-right">Tổng tiền</th>
                  <th className="px-4 py-4 font-bold">Diễn giải</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {vouchers.map(v => (
                  <tr key={v.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-4 font-black text-primary">{v.voucherNumber}</td>
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg border ${
                        v.type === 'PHIEU_CHI' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {v.type === 'PHIEU_CHI' ? 'Phiếu chi' : 'Ủy nhiệm chi'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">{v.voucherDate}</td>
                    <td className="px-4 py-4 text-right font-black text-green-600 text-base tabular-nums">{formatVND(v.totalAmount)}</td>
                    <td className="px-4 py-4 text-muted-foreground">{v.description}</td>
                  </tr>
                ))}
                {vouchers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-muted-foreground/60 italic">
                      <Receipt className="w-12 h-12 mx-auto mb-4 opacity-10" />
                      Chưa có chứng từ nào trong kỳ {month}/{year}. Hãy thực hiện "Thanh toán lương" trước.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <Pagination 
              currentPage={vPage}
              totalPages={vTotalPages}
              totalElements={vTotalElements}
              pageSize={pageSize}
              onPageChange={setVPage}
            />
          </div>
      )}

      {tab === "journal" && (
          <div className="border rounded-2xl bg-card shadow-xl overflow-hidden border-primary/10">
            <table className="w-full text-sm text-left">
              <thead className="bg-primary text-primary-foreground">
                <tr>
                  <th className="px-4 py-4 font-bold">Ngày</th>
                  <th className="px-4 py-4 font-bold">Chứng từ</th>
                  <th className="px-4 py-4 font-bold text-center">TK Nợ</th>
                  <th className="px-4 py-4 font-bold text-center">TK Có</th>
                  <th className="px-4 py-4 font-bold text-right">Số tiền</th>
                  <th className="px-4 py-4 font-bold">Diễn giải</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {journal.map(j => (
                  <tr key={j.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-4 text-muted-foreground tabular-nums">{j.voucherDate}</td>
                    <td className="px-4 py-4 font-bold text-primary">{j.voucherNumber}</td>
                    <td className="px-4 py-4 text-center">
                      <span className="bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-md text-xs font-black">
                        Nợ {j.debitAccountId}
                      </span>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{j.debitAccountName}</p>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md text-xs font-black">
                        Có {j.creditAccountId}
                      </span>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{j.creditAccountName}</p>
                    </td>
                    <td className="px-4 py-4 text-right font-black tabular-nums text-base">{formatVND(j.amount)}</td>
                    <td className="px-4 py-4 text-muted-foreground text-xs">{j.description}</td>
                  </tr>
                ))}
                {journal.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-muted-foreground/60 italic">
                      <ArrowRightLeft className="w-12 h-12 mx-auto mb-4 opacity-10" />
                      Chưa có bút toán nào trong kỳ {month}/{year}.
                    </td>
                  </tr>
                )}
              </tbody>
              {journal.length > 0 && (
                <tfoot className="bg-muted/30 border-t-2 border-primary/20">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-right font-black text-xs uppercase text-muted-foreground">Tổng cộng phát sinh:</td>
                    <td className="px-4 py-3 text-right font-black text-primary text-lg tabular-nums">{formatVND(totalJournalDebit)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
            <Pagination 
              currentPage={jPage}
              totalPages={jTotalPages}
              totalElements={jTotalElements}
              pageSize={pageSize}
              onPageChange={setJPage}
            />
          </div>
      )}
    </div>
  )
}
