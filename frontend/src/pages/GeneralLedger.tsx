import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Book, Search, FileSpreadsheet, Printer } from "lucide-react";
import { ExportService } from "../utils/ExportService";
import PrintableLedger from "../components/PrintableLedger";

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
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [accountId, setAccountId] = useState("334");
  const [month, setMonth] = useState(
    new Date().getMonth() === 0 ? 12 : new Date().getMonth(),
  );
  const [year, setYear] = useState(
    new Date().getMonth() === 0
      ? new Date().getFullYear() - 1
      : new Date().getFullYear(),
  );
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize] = useState(20);

  const [overallTotalDebit, setOverallTotalDebit] = useState(0);
  const [overallTotalCredit, setOverallTotalCredit] = useState(0);

  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    }),
    [],
  );

  useEffect(() => {
    setPage(0);
  }, [accountId, month, year]);

  const fetchLedger = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `/api/accounting/ledger/${accountId}?month=${month}&year=${year}&page=${page}&size=${pageSize}`,
        {
          headers,
        },
      );
      setEntries(res.data.pageResponse.content);
      setTotalPages(res.data.pageResponse.totalPages);
      setTotalElements(res.data.pageResponse.totalElements);
      setOverallTotalDebit(res.data.totalDebit);
      setOverallTotalCredit(res.data.totalCredit);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [accountId, month, year, headers, page, pageSize]);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  const handleExportExcel = () => {
    ExportService.exportToExcel(
      entries,
      `So_cai_tai_khoan_${accountId}_T${month}_${year}`,
      "Sổ cái",
      {
        voucherDate: "Ngày",
        voucherNumber: "Số hiệu CT",
        description: "Diễn giải",
        oppositeAccount: "TK Đối ứng",
        debit: "Nợ",
        credit: "Có",
      },
    );
  };

  const formatVND = (val: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val || 0);
  };

  const getAccountName = (id: string) => {
    const names: Record<string, string> = {
      "334": "Phải trả NLĐ",
      "338": "Phải trả BH, KPCĐ",
      "642": "Chi phí QLDN",
      "111": "Tiền mặt",
      "112": "Tiền gửi NH",
      "3335": "Thuế TNCN",
    };
    return names[id] || "Sổ cái tài khoản";
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 bg-gray-50 min-h-screen p-4">
      {/* Header & Actions */}
      <div className="flex flex-col xl:flex-row justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200 gap-4">
        <h1 className="text-xl font-bold flex items-center gap-2 text-gray-800">
          <Book className="w-6 h-6 text-blue-600" /> Sổ cái (General Ledger)
        </h1>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
              Tài khoản:
            </span>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium text-gray-700 cursor-pointer"
            >
              <option value="334">334 - Phải trả NLĐ</option>
              <option value="338">338 - Phải trả BH, KPCĐ</option>
              <option value="642">642 - Chi phí QLDN</option>
              <option value="111">111 - Tiền mặt</option>
              <option value="112">112 - Tiền gửi NH</option>
              <option value="3335">3335 - Thuế TNCN</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Kỳ:
            </span>
            <input
              type="number"
              className="w-16 h-10 text-center bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium text-gray-700"
              value={month}
              onChange={(e) => {
                setPage(0);
                setMonth(Math.max(1, Math.min(12, Number(e.target.value))));
              }}
            />
            <span className="text-gray-400 font-bold">/</span>
            <input
              type="number"
              className="w-20 h-10 text-center bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium text-gray-700"
              value={year}
              onChange={(e) => {
                setPage(0);
                setYear(Math.max(2000, Number(e.target.value)));
              }}
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
              onClick={handlePrint}
              className="h-10 bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 hover:border-blue-300 gap-1.5 rounded-lg shadow-sm font-medium text-sm transition-all"
            >
              <Printer className="w-4 h-4" /> In Sổ Cái
            </Button>
            <Button
              onClick={() => {
                setPage(0);
                fetchLedger();
              }}
              disabled={loading}
              className="h-10 bg-blue-600 hover:bg-blue-700 text-white gap-1.5 rounded-lg shadow-sm font-medium text-sm transition-all"
            >
              <Search className="w-4 h-4" /> Tìm kiếm
            </Button>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-lg border border-gray-300 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-[#E6F4F1] border-b border-gray-300">
                <th className="px-4 py-3 font-bold text-black border-r border-gray-300" rowSpan={2}>
                  Ngày
                </th>
                <th className="px-4 py-3 font-bold text-black border-r border-gray-300 text-center" colSpan={2}>
                  Chứng từ
                </th>
                <th className="px-4 py-3 font-bold text-black border-r border-gray-300" rowSpan={2}>
                  Diễn giải
                </th>
                <th className="px-4 py-3 font-bold text-black border-r border-gray-300 text-center" rowSpan={2}>
                  TK Đối ứng
                </th>
                <th className="px-4 py-3 font-bold text-black text-center" colSpan={2}>
                  Số phát sinh
                </th>
              </tr>
              <tr className="bg-[#E6F4F1] border-b border-gray-300">
                <th className="px-4 py-1 text-[10px] font-bold text-black border-r border-gray-300 text-center">
                  Số hiệu
                </th>
                <th className="px-4 py-1 text-[10px] font-bold text-black border-r border-gray-300 text-center">
                  Ngày ghi
                </th>
                <th className="px-4 py-1 text-[10px] font-bold text-black border-r border-gray-300 text-right">
                  Nợ
                </th>
                <th className="px-4 py-1 text-[10px] font-bold text-black text-right">
                  Có
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {entries.map((e) => (
                <tr key={e.id} className="hover:bg-[#FFF8E1] transition-colors">
                  <td className="px-4 py-2.5 border-r border-gray-200 text-gray-700">{e.voucherDate}</td>
                  <td className="px-4 py-2.5 border-r border-gray-200 font-bold text-blue-800">{e.voucherNumber}</td>
                  <td className="px-4 py-2.5 border-r border-gray-200 text-center text-gray-700">{e.voucherDate}</td>
                  <td className="px-4 py-2.5 border-r border-gray-200 text-gray-600 italic text-xs">{e.description}</td>
                  <td className="px-4 py-2.5 border-r border-gray-200 text-center font-bold text-gray-700">
                    {e.oppositeAccount}
                  </td>
                  <td className="px-4 py-2.5 border-r border-gray-200 text-right font-bold text-gray-900 tabular-nums bg-gray-50/10">
                    {e.debit > 0 ? formatVND(e.debit) : ""}
                  </td>
                  <td className="px-4 py-2.5 text-right font-bold text-gray-900 tabular-nums bg-gray-50/10">
                    {e.credit > 0 ? formatVND(e.credit) : ""}
                  </td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-20 italic text-gray-400 bg-white"
                  >
                    Không có phát sinh cho tài khoản {accountId} trong kỳ
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-gray-100 font-bold text-gray-800 border-t border-gray-300">
              <tr>
                <td colSpan={5} className="px-4 py-3 text-right text-xs uppercase tracking-wider font-bold border-r border-gray-200">
                  TỔNG PHÁT SINH TRONG KỲ:
                </td>
                <td className="px-4 py-3 text-right text-sm font-black text-blue-900 border-r border-gray-200 tabular-nums">
                  {formatVND(overallTotalDebit)}
                </td>
                <td className="px-4 py-3 text-right text-sm font-black text-blue-900 tabular-nums">
                  {formatVND(overallTotalCredit)}
                </td>
              </tr>
            </tfoot>
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

      <div className="printable-only">
        <PrintableLedger
          entries={entries}
          accountId={accountId}
          accountName={getAccountName(accountId)}
          month={month}
          year={year}
          totalDebit={overallTotalDebit}
          totalCredit={overallTotalCredit}
        />
      </div>
    </div>
  );
}
