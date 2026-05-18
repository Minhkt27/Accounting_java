import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { Input } from "../components/ui/input";
import { FileSpreadsheet } from "lucide-react";
import { Button } from "../components/ui/button";
import { ExportService } from "../utils/ExportService";

import { Pagination } from "../components/ui/pagination";

interface VoucherItem {
  id: number;
  voucherNumber: string;
  type: string;
  voucherDate: string;
  totalAmount: number;
  description: string;
  createdAt: string;
}

interface JournalItem {
  id: number;
  voucherNumber: string;
  voucherDate: string;
  debitAccountId: string;
  debitAccountName: string;
  creditAccountId: string;
  creditAccountName: string;
  amount: number;
  description: string;
}

export default function VoucherJournalPage() {
  const [tab, setTab] = useState<"vouchers" | "journal">("vouchers");
  const [month, setMonth] = useState(
    new Date().getMonth() === 0 ? 12 : new Date().getMonth(),
  );
  const [year, setYear] = useState(
    new Date().getMonth() === 0
      ? new Date().getFullYear() - 1
      : new Date().getFullYear(),
  );
  const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
  const [journal, setJournal] = useState<JournalItem[]>([]);

  const [vPage, setVPage] = useState(0);
  const [vTotalPages, setVTotalPages] = useState(0);
  const [vTotalElements, setVTotalElements] = useState(0);

  const [jPage, setJPage] = useState(0);
  const [jTotalPages, setJTotalPages] = useState(0);
  const [jTotalElements, setJTotalElements] = useState(0);

  const pageSize = 20;

  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    }),
    [],
  );

  const handleMonthChange = (m: number) => {
    setMonth(m);
    setVPage(0);
    setJPage(0);
  };

  const handleYearChange = (y: number) => {
    setYear(y);
    setVPage(0);
    setJPage(0);
  };

  const handleTabChange = (t: "vouchers" | "journal") => {
    setTab(t);
    setVPage(0);
    setJPage(0);
  };

  const fetchData = useCallback(async () => {
    try {
      if (tab === "vouchers") {
        const vRes = await axios.get(
          `/api/accounting/vouchers?month=${month}&year=${year}&page=${vPage}&size=${pageSize}`,
          { headers },
        );
        setVouchers(vRes.data.content);
        setVTotalPages(vRes.data.totalPages);
        setVTotalElements(vRes.data.totalElements);
      } else {
        const jRes = await axios.get(
          `/api/accounting/journal?month=${month}&year=${year}&page=${jPage}&size=${pageSize}`,
          { headers },
        );
        setJournal(jRes.data.content);
        setJTotalPages(jRes.data.totalPages);
        setJTotalElements(jRes.data.totalElements);
      }
    } catch (err: unknown) {
      console.error(err);
    }
  }, [month, year, headers, tab, vPage, jPage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const handleExportExcel = useCallback(() => {
    if (tab === "vouchers") {
      ExportService.exportToExcel(
        vouchers,
        `Chung_tu_ke_toan_${month}_${year}`,
        "Chứng từ",
        {
          voucherNumber: "Số chứng từ",
          type: "Loại",
          voucherDate: "Ngày lập",
          totalAmount: "Tổng tiền",
          description: "Diễn giải",
        },
      );
    } else {
      ExportService.exportToExcel(
        journal,
        `Nhat_ky_chung_${month}_${year}`,
        "Nhật ký",
        {
          voucherDate: "Ngày",
          voucherNumber: "Chứng từ",
          debitAccountId: "TK Nợ",
          creditAccountId: "TK Có",
          amount: "Số tiền",
          description: "Diễn giải",
        },
      );
    }
  }, [tab, vouchers, journal, month, year]);

  const formatVND = (val: number) =>
    new Intl.NumberFormat("vi-VN").format(val || 0);

  const totalJournalDebit = journal.reduce((sum, j) => sum + j.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-black">
          Sổ Kế Toán
        </h1>
        <div className="flex items-center gap-3 p-2 rounded-lg border border-gray-300 bg-white">
          <div className="flex items-center gap-2 border-r border-gray-300 pr-3">
            <span className="text-sm font-normal text-black">Kỳ</span>
            <Input
              type="number"
              className="w-16 h-8 text-center font-normal text-black border-gray-300"
              value={month}
              onChange={(e) =>
                handleMonthChange(
                  Math.max(1, Math.min(12, Number(e.target.value))),
                )
              }
            />
            <span className="text-black">/</span>
            <Input
              type="number"
              className="w-20 h-8 text-center font-normal text-black border-gray-300"
              value={year}
              onChange={(e) =>
                handleYearChange(Math.max(2000, Number(e.target.value)))
              }
            />
          </div>
          <Button
            variant="outline"
            onClick={handleExportExcel}
            className="gap-2 h-8 border-gray-300 text-black hover:bg-gray-50"
          >
            <FileSpreadsheet className="w-4 h-4" /> Excel
          </Button>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 p-1 rounded-lg border border-gray-300 bg-white w-fit">
        <button
          onClick={() => handleTabChange("vouchers")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-normal transition-all ${
            tab === "vouchers"
              ? "bg-gray-800 text-white"
              : "text-black hover:bg-gray-100"
          }`}
        >
          Chứng từ ({vouchers.length})
        </button>
        <button
          onClick={() => handleTabChange("journal")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-normal transition-all ${
            tab === "journal"
              ? "bg-gray-800 text-white"
              : "text-black hover:bg-gray-100"
          }`}
        >
          Nhật ký chung ({journal.length})
        </button>
      </div>

      {/* Tab content */}
      {tab === "vouchers" && (
        <div className="border border-gray-300 rounded-lg bg-white overflow-hidden">
          {/* ==============================================
                KHU VỰC VẼ BẢNG: DANH SÁCH CHỨNG TỪ
                ============================================== */}
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 border-b border-gray-300">
              <tr>
                <th className="px-4 py-3 font-bold text-black">Số chứng từ</th>
                <th className="px-4 py-3 font-bold text-black">Loại</th>
                <th className="px-4 py-3 font-bold text-black">Ngày lập</th>
                <th className="px-4 py-3 font-bold text-black text-right">
                  Tổng tiền
                </th>
                <th className="px-4 py-3 font-bold text-black">Diễn giải</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {vouchers.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-normal text-black">
                    {v.voucherNumber}
                  </td>
                  <td className="px-4 py-3 font-normal text-black">
                    {v.type === "PHIEU_CHI" ? "Phiếu chi" : "Ủy nhiệm chi"}
                  </td>
                  <td className="px-4 py-3 font-normal text-black">
                    {v.voucherDate}
                  </td>
                  <td className="px-4 py-3 text-right font-normal text-black tabular-nums">
                    {formatVND(v.totalAmount)}
                  </td>
                  <td className="px-4 py-3 font-normal text-black">
                    {v.description}
                  </td>
                </tr>
              ))}
              {vouchers.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-16 text-center text-gray-400 italic"
                  >
                    Chưa có chứng từ nào trong kỳ {month}/{year}. Hãy thực hiện
                    "Thanh toán lương" trước.
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
        <div className="border border-gray-300 rounded-lg bg-white overflow-hidden">
          {/* ==============================================
                KHU VỰC VẼ BẢNG: CHI TIẾT BÚT TOÁN NHẬT KÝ
                ============================================== */}
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 border-b border-gray-300">
              <tr>
                <th className="px-4 py-3 font-bold text-black">Ngày</th>
                <th className="px-4 py-3 font-bold text-black">Chứng từ</th>
                <th className="px-4 py-3 font-bold text-black text-center">
                  TK Nợ
                </th>
                <th className="px-4 py-3 font-bold text-black text-center">
                  TK Có
                </th>
                <th className="px-4 py-3 font-bold text-black text-right">
                  Số tiền
                </th>
                <th className="px-4 py-3 font-bold text-black">Diễn giải</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {journal.map((j) => (
                <tr key={j.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-normal text-black tabular-nums">
                    {j.voucherDate}
                  </td>
                  <td className="px-4 py-3 font-normal text-black">
                    {j.voucherNumber}
                  </td>
                  <td className="px-4 py-3 text-center font-normal text-black">
                    <span>Nợ {j.debitAccountId}</span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {j.debitAccountName}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-center font-normal text-black">
                    <span>Có {j.creditAccountId}</span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {j.creditAccountName}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right font-normal text-black tabular-nums">
                    {formatVND(j.amount)}
                  </td>
                  <td className="px-4 py-3 font-normal text-black text-xs">
                    {j.description}
                  </td>
                </tr>
              ))}
              {journal.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-16 text-center text-gray-400 italic"
                  >
                    Chưa có bút toán nào trong kỳ {month}/{year}.
                  </td>
                </tr>
              )}
            </tbody>
            {journal.length > 0 && (
              <tfoot className="bg-gray-50 border-t border-gray-300">
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-3 text-right font-bold text-black text-sm"
                  >
                    Tổng cộng phát sinh:
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-black tabular-nums">
                    {formatVND(totalJournalDebit)}
                  </td>
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
  );
}
