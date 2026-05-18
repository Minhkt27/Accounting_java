import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { FileSpreadsheet, CheckCircle2 } from "lucide-react";
import PaymentDialog from "../components/PaymentDialog";
import { ExportService } from "../utils/ExportService";

export default function PaymentsPage() {
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [month, setMonth] = useState(
    new Date().getMonth() === 0 ? 12 : new Date().getMonth(),
  );
  const [year, setYear] = useState(
    new Date().getMonth() === 0
      ? new Date().getFullYear() - 1
      : new Date().getFullYear(),
  );

  const fetchData = useCallback(async () => {
    try {
      const auth = {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      };
      const resP = await axios.get(
        `/api/payroll/${month}/${year}?size=10000`,
        auth,
      );
      setPayrolls(resP.data.content || []);
      const resV = await axios.get(
        `/api/accounting/vouchers?month=${month}&year=${year}&size=10000`,
        auth,
      );
      setPayments(resV.data.content || []);
    } catch (err: unknown) {
      console.error(err);
    }
  }, [month, year]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const handleExportExcel = () => {
    ExportService.exportToExcel(
      payments,
      `Chung_tu_thanh_toan_T${month}_${year}`,
      "Chứng từ chi",
      {
        voucherNumber: "Số hiệu",
        voucherDate: "Ngày giao dịch",
        description: "Diễn giải",
        totalAmount: "Số tiền",
        type: "Loại",
      },
    );
  };

  const handlePaySalary = async (method: string) => {
    try {
      await axios.post(
        `/api/payroll/pay?month=${month}&year=${year}&paymentMethod=${method}`,
        null,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      alert("Đã lập chứng từ thanh toán lương thành công!");
      fetchData();
    } catch (err: unknown) {
      const serverMsg = axios.isAxiosError(err)
        ? err.response?.data || err.message
        : String(err);
      alert("Lỗi: " + serverMsg);
    }
  };

  const handlePayInsurance = async (method: string) => {
    try {
      await axios.post(
        `/api/payroll/pay-insurance?month=${month}&year=${year}&paymentMethod=${method}`,
        null,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      alert("Đã lập chứng từ nộp bảo hiểm thành công!");
      fetchData();
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data || err.message
        : String(err);
      alert("Lỗi: " + msg);
    }
  };

  const handlePayTax = async (method: string) => {
    try {
      await axios.post(
        `/api/payroll/pay-tax?month=${month}&year=${year}&paymentMethod=${method}`,
        null,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      alert("Đã lập chứng từ nộp thuế TNCN thành công!");
      fetchData();
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data || err.message
        : String(err);
      alert("Lỗi: " + msg);
    }
  };

  const formatVND = (val: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val || 0);
  };

  const approvedOrPaidPayrolls = payrolls.filter(
    (p) => p.status === "APPROVED" || p.status === "PAID",
  );
  const canPay = approvedOrPaidPayrolls.length > 0;

  const totalNetPay = approvedOrPaidPayrolls.reduce(
    (a: number, b: any) => a + (Number(b.netPay) || 0),
    0,
  );
  const totalInsuranceEE = approvedOrPaidPayrolls.reduce(
    (a: number, b: any) => a + (Number(b.totalInsurance) || 0),
    0,
  );
  const totalInsuranceER = approvedOrPaidPayrolls.reduce(
    (a: number, b: any) => a + (Number(b.totalEmployerInsurance) || 0),
    0,
  );
  const totalInsurance = totalInsuranceEE + totalInsuranceER;
  const totalTax = approvedOrPaidPayrolls.reduce(
    (a: number, b: any) => a + (Number(b.taxAmount) || 0),
    0,
  );

  // Kiểm tra loại nào đã thanh toán rồi (dựa trên prefix của voucherNumber)
  const paidSalary = payments.some(
    (p: any) =>
      String(p.voucherNumber || "").includes("-LUONG-") &&
      (p.type === "PHIEU_CHI" || p.type === "UNC"),
  );
  const paidInsurance = payments.some(
    (p: any) =>
      String(p.voucherNumber || "").includes("-BH-") &&
      (p.type === "PHIEU_CHI" || p.type === "UNC"),
  );
  const paidTax = payments.some(
    (p: any) =>
      String(p.voucherNumber || "").includes("-THUE-") &&
      (p.type === "PHIEU_CHI" || p.type === "UNC"),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-4 rounded-lg border border-gray-300 gap-4">
        <h1 className="text-2xl font-bold text-black">
          Thanh toán Lương & Chứng từ
        </h1>
        <div className="flex flex-wrap items-center gap-2 p-2 rounded-lg border border-gray-300 bg-white">
          <div className="flex items-center gap-2 border-r border-gray-300 pr-2 mr-2">
            <span className="text-sm font-normal text-black">
              Kỳ thanh toán
            </span>
            <Input
              type="number"
              className="w-16 h-8 text-center font-normal text-black border-gray-300"
              value={month}
              onChange={(e) =>
                setMonth(Math.max(1, Math.min(12, Number(e.target.value))))
              }
            />
            <span className="text-black">/</span>
            <Input
              type="number"
              className="w-20 h-8 text-center font-normal text-black border-gray-300"
              value={year}
              onChange={(e) => setYear(Math.max(2000, Number(e.target.value)))}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="default"
              variant="outline"
              onClick={handleExportExcel}
              className="h-8 gap-2 border-gray-300 text-black hover:bg-gray-50"
            >
              <FileSpreadsheet className="w-4 h-4" /> Excel
            </Button>
            <Button
              size="default"
              variant="outline"
              onClick={fetchData}
              className="h-8 font-normal border-gray-300 text-black hover:bg-gray-50"
            >
              Tải lại
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Summary Panel */}
        <div className="lg:col-span-1 space-y-4">
          {/* Card 1: Thanh toán Lương */}
          <div
            className={`p-5 rounded-lg border flex flex-col items-start text-left space-y-2 relative overflow-hidden transition-all ${
              paidSalary
                ? "bg-gray-50 border-gray-200 opacity-70"
                : "bg-white border-gray-300"
            }`}
          >
            {paidSalary && (
              <div className="absolute top-3 right-3 flex items-center gap-1 text-black text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" /> Đã thanh toán
              </div>
            )}
            <div>
              <h3
                className={`font-bold text-sm ${paidSalary ? "text-gray-400" : "text-black"}`}
              >
                Lương thực lĩnh (NET)
              </h3>
              <p
                className={`text-xl font-bold mt-1 ${paidSalary ? "text-gray-400 line-through" : "text-black"}`}
              >
                {formatVND(totalNetPay)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Nợ 334 / Có 111, 112</p>
            </div>
            {!paidSalary && (
              <PaymentDialog
                onPay={handlePaySalary}
                disabled={!canPay}
                paymentType="SALARY"
              />
            )}
          </div>

          {/* Card 2: Nộp Bảo hiểm */}
          <div
            className={`p-5 rounded-lg border flex flex-col items-start text-left space-y-2 relative overflow-hidden transition-all ${
              paidInsurance
                ? "bg-gray-50 border-gray-200 opacity-70"
                : "bg-white border-gray-300"
            }`}
          >
            {paidInsurance && (
              <div className="absolute top-3 right-3 flex items-center gap-1 text-black text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" /> Đã nộp
              </div>
            )}
            <div>
              <h3
                className={`font-bold text-sm ${paidInsurance ? "text-gray-400" : "text-black"}`}
              >
                Bảo hiểm (NLĐ + DN)
              </h3>
              <p
                className={`text-xl font-bold mt-1 ${paidInsurance ? "text-gray-400 line-through" : "text-black"}`}
              >
                {formatVND(totalInsurance)}
              </p>
              <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                <p>NLĐ đóng (10.5%): {formatVND(totalInsuranceEE)}</p>
                <p>DN đóng (23.5%): {formatVND(totalInsuranceER)}</p>
                <p className="font-bold">Nợ 338 / Có 111, 112</p>
              </div>
            </div>
            {!paidInsurance && (
              <PaymentDialog
                onPay={handlePayInsurance}
                disabled={!canPay}
                paymentType="INSURANCE"
              />
            )}
          </div>

          {/* Card 3: Nộp Thuế TNCN */}
          <div
            className={`p-5 rounded-lg border flex flex-col items-start text-left space-y-2 relative overflow-hidden transition-all ${
              paidTax
                ? "bg-gray-50 border-gray-200 opacity-70"
                : "bg-white border-gray-300"
            }`}
          >
            {paidTax && (
              <div className="absolute top-3 right-3 flex items-center gap-1 text-black text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" /> Đã nộp
              </div>
            )}
            <div>
              <h3
                className={`font-bold text-sm ${paidTax ? "text-gray-400" : "text-black"}`}
              >
                Thuế TNCN
              </h3>
              <p
                className={`text-xl font-bold mt-1 ${paidTax ? "text-gray-400 line-through" : "text-black"}`}
              >
                {formatVND(totalTax)}
              </p>
              <p className="text-xs text-gray-500 mt-1 font-bold">
                Nợ 3335 / Có 111, 112
              </p>
            </div>
            {!paidTax && (
              <PaymentDialog
                onPay={handlePayTax}
                disabled={!canPay || totalTax <= 0}
                paymentType="TAX"
              />
            )}
          </div>
        </div>

        {/* Right: Payment Voucher List */}
        <div className="lg:col-span-3">
          <div className="border border-gray-300 rounded-lg bg-white overflow-hidden">
            {/* ==============================================
                        KHU VỰC VẼ BẢNG: DANH SÁCH THANH TOÁN (CHI LƯƠNG/BẢO HIỂM)
                        ============================================== */}
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 border-b border-gray-300">
                <tr>
                  <th className="px-4 py-3 font-bold text-black">Ngày</th>
                  <th className="px-4 py-3 font-bold text-black">Chứng từ</th>
                  <th className="px-4 py-3 font-bold text-black">Loại g/d</th>
                  <th className="px-4 py-3 font-bold text-black">Diễn giải</th>
                  <th className="px-4 py-3 font-bold text-black text-right">
                    Số tiền
                  </th>
                  <th className="px-4 py-3 font-bold text-black text-center">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-normal text-black tabular-nums">
                      {p.voucherDate}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-normal text-black">
                        {p.voucherNumber || `PMT-${p.id}`}
                      </div>
                      <div className="text-xs text-gray-500">
                        {p.type === "UNC" ? "UNC" : "Phiếu chi"}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-normal text-black">
                      {p.type === "PHIEU_CHI" ? "Tiền mặt" : "Chuyển khoản"}
                    </td>
                    <td className="px-4 py-3 font-normal text-black text-xs">
                      {p.description}
                    </td>
                    <td className="px-4 py-3 text-right font-normal text-black tabular-nums">
                      {formatVND(p.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs font-normal text-black">
                        Hoàn tất
                      </span>
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-16 text-center text-gray-400 italic"
                    >
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
  );
}
