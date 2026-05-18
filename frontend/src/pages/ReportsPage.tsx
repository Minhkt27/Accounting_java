import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import {
  Shield,
  FileText,
  Building2,
  Download,
  Calendar,
  TrendingUp,
  Users,
  Wallet,
  ShieldAlert,
  Info,
  Search,
  Printer,
} from "lucide-react";
import {
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { ExportService } from "../utils/ExportService";
import PrintableInsuranceReport from "../components/PrintableInsuranceReport";
import PrintableTaxReport from "../components/PrintableTaxReport";
import PrintableUnionReport from "../components/PrintableUnionReport";

// ==========================================
// 1. DỮ LIỆU TỔNG HỢP CHUNG (SUMMARY)
// ==========================================
interface SummaryData {
  month: number;
  year: number;
  employeeCount: number;
  totalGrossIncome: number;
  totalBaseSalary: number;
  totalMealAllowance: number;
  totalOtPay: number;
  totalBHXH: number;
  totalBHYT: number;
  totalBHTN: number;
  totalInsurance: number;
  totalEmployerInsurance: number;
  totalTax: number;
  totalNetPay: number;
  details: DetailRow[];
}

// ==========================================
// 2. DỮ LIỆU CHI TIẾT TỪNG NHÂN VIÊN (BASE)
// ==========================================
interface DetailRow {
  employeeId: string;
  fullName: string;
  grossIncome: number;
  bhxh: number;
  bhyt: number;
  bhtn: number;
  totalInsurance: number;
  totalEmployerInsurance: number;
  taxableIncome: number;
  taxAmount: number;
  netPay: number;
  status: string;
}

// ==========================================
// 3. CHI TIẾT BÁO CÁO BẢO HIỂM
// ==========================================
interface InsuranceDetail extends DetailRow {
  contractSalary: number;
  bhxhEE: number; // BHXH người lao động (Employee)
  bhytEE: number; // BHYT người lao động
  bhtnEE: number; // BHTN người lao động
  totalEE: number; // Tổng người lao động đóng
  bhxhER: number; // BHXH doanh nghiệp (Employer)
  bhytER: number; // BHYT doanh nghiệp
  bhtnER: number; // BHTN doanh nghiệp
  kpcd: number; // Kinh phí công đoàn
  totalER: number; // Tổng doanh nghiệp đóng
}

// ==========================================
// 4. CHI TIẾT BÁO CÁO THUẾ TNCN
// ==========================================
interface TaxDetail extends DetailRow {
  dependentCount: number; // Số người phụ thuộc
}

// ==========================================
// 5. CHI TIẾT BÁO CÁO CÔNG ĐOÀN
// ==========================================
interface UnionDetail extends DetailRow {
  contractSalary: number;
  kpcd: number;
}

// ==========================================
// 6. KHUÔN MẪU BÁO CÁO CHUNG (GENERIC)
// ==========================================
interface ReportData<T> {
  details: T[];
}

const TABS = [
  { id: "summary", label: "TỔNG HỢP CHUNG", icon: TrendingUp },
  { id: "insurance", label: "BÁO CÁO BẢO HIỂM", icon: Shield },
  { id: "tax", label: "BÁO CÁO THUẾ TNCN", icon: FileText },
  { id: "union", label: "BÁO CÁO CÔNG ĐOÀN", icon: Building2 },
];

const COLORS = ["#3b82f6", "#f59e0b", "#ef4444", "#10b981", "#8b5cf6"];

export default function ReportsPage() {
  const [month, setMonth] = useState(
    new Date().getMonth() === 0 ? 12 : new Date().getMonth(),
  );
  const [year, setYear] = useState(
    new Date().getMonth() === 0
      ? new Date().getFullYear() - 1
      : new Date().getFullYear(),
  );
  const [activeTab, setActiveTab] = useState("summary");
  const [data, setData] = useState<SummaryData | null>(null);
  const [insuranceData, setInsuranceData] =
    useState<ReportData<InsuranceDetail> | null>(null);
  const [taxData, setTaxData] = useState<ReportData<TaxDetail> | null>(null);
  const [unionData, setUnionData] = useState<ReportData<UnionDetail> | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState("");

  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    }),
    [],
  );

  const fetchAll = useCallback(async () => {
    try {
      const res = await axios.get(
        `/api/accounting/report/all?month=${month}&year=${year}`,
        { headers },
      );
      const { summary, insurance, tax, union } = res.data;
      setData(summary);
      setInsuranceData(insurance);
      setTaxData(tax);
      setUnionData(union);
    } catch (err: unknown) {
      console.error(err);
    }
  }, [month, year, headers]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleExportExcel = useCallback(() => {
    if (!data && !insuranceData && !taxData && !unionData) return;

    if (activeTab === "summary" && data) {
      const exportData = data.details.map((d, i) => ({ stt: i + 1, ...d }));
      ExportService.exportToExcel(
        exportData,
        `Bao_cao_tong_hop_${month}_${year}`,
        "Tổng hợp",
        {
          stt: "STT",
          employeeId: "Mã NV",
          fullName: "Họ tên",
          grossIncome: "Thu nhập Gross",
          totalInsurance: "BH Nhân viên",
          taxAmount: "Thuế TNCN",
          netPay: "Thực lĩnh",
        },
      );
    } else if (activeTab === "insurance" && insuranceData) {
      const exportData = insuranceData.details.map((d, i) => ({
        stt: i + 1,
        bhxhRate: "8.00%",
        bhytRate: "1.50%",
        bhtnRate: "1.00%",
        ...d,
      }));
      ExportService.exportToExcel(
        exportData,
        `Bao_cao_bao_hiem_${month}_${year}`,
        "Bảo hiểm",
        {
          stt: "STT",
          employeeId: "Mã NV",
          fullName: "Tên NV",
          contractSalary: "Thu nhập chịu",
          bhxhRate: "Tỉ lệ BHXH",
          bhytRate: "Tỉ lệ BHYT",
          bhtnRate: "Tỉ lệ BHTN",
          bhxhEE: "Mức BHXH",
          bhytEE: "Mức BHYT",
          bhtnEE: "Mức BHTN",
          totalEE: "Tổng chi trả (NLĐ)",
          bhxhER: "BHXH Doanh nghiệp",
          bhytER: "BHYT Doanh nghiệp",
          bhtnER: "BHTN Doanh nghiệp",
          kpcd: "Kinh phí CĐ",
          totalER: "Tổng Doanh nghiệp",
        },
      );
    } else if (activeTab === "tax" && taxData) {
      const exportData = taxData.details.map((d, i) => ({ stt: i + 1, ...d }));
      ExportService.exportToExcel(
        exportData,
        `Bao_cao_thue_TNCN_${month}_${year}`,
        "Thuế TNCN",
        {
          stt: "STT",
          employeeId: "Mã NV",
          fullName: "Họ tên",
          dependentCount: "Người PT",
          grossIncome: "Tổng thu nhập",
          totalInsurance: "Các khoản giảm trừ",
          taxableIncome: "TN Tính thuế",
          taxAmount: "Thuế TNCN",
          netPay: "Thực lĩnh",
        },
      );
    } else if (activeTab === "union" && unionData) {
      const exportData = unionData.details.map((d, i) => ({
        stt: i + 1,
        ...d,
      }));
      ExportService.exportToExcel(
        exportData,
        `Bao_cao_cong_doan_${month}_${year}`,
        "Công đoàn",
        {
          stt: "STT",
          employeeId: "Mã NV",
          fullName: "Họ tên",
          contractSalary: "Lương HĐ",
          kpcd: "Kinh phí CĐ",
        },
      );
    }
  }, [activeTab, data, insuranceData, month, taxData, unionData, year]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const formatVND = (val: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    })
      .format(val || 0)
      .replace("₫", "đ");

  // Dữ liệu từ Backend đã được lọc các trạng thái APPROVED / PAID
  const lockedDetails = useMemo(() => data?.details || [], [data]);
  const lockedInsuranceDetails = useMemo(
    () => insuranceData?.details || [],
    [insuranceData],
  );
  const lockedTaxDetails = useMemo(() => taxData?.details || [], [taxData]);
  const lockedUnionDetails = useMemo(
    () => unionData?.details || [],
    [unionData],
  );

  // Derived stats based on LOCKED data only
  const stats = useMemo(() => {
    const list = lockedDetails;
    return {
      count: list.length,
      totalNetPay: list.reduce((sum, d) => sum + (d.netPay || 0), 0),
      totalInsurance: list.reduce((sum, d) => sum + (d.totalInsurance || 0), 0),
      totalEmployerInsurance: list.reduce(
        (sum, d) => sum + (d.totalEmployerInsurance || 0),
        0,
      ),
      totalTax: list.reduce((sum, d) => sum + (d.taxAmount || 0), 0),
      totalGross: list.reduce((sum, d) => sum + (d.grossIncome || 0), 0),
      totalBHXH: list.reduce((sum, d) => sum + (d.bhxh || 0), 0),
      totalBHYT: list.reduce((sum, d) => sum + (d.bhyt || 0), 0),
      totalBHTN: list.reduce((sum, d) => sum + (d.bhtn || 0), 0),
    };
  }, [lockedDetails]);

  const chartData = useMemo(() => {
    if (stats.count === 0) return [];
    return [
      { name: "Thực lĩnh", value: stats.totalNetPay },
      { name: "BH (DN)", value: stats.totalEmployerInsurance },
      { name: "Thuế TNCN", value: stats.totalTax },
      { name: "BH (NLĐ)", value: stats.totalInsurance },
    ];
  }, [stats]);

  const insuranceChartsData = useMemo(() => {
    if (stats.count === 0) return [];
    return [
      { name: "BHXH", value: stats.totalBHXH },
      { name: "BHYT", value: stats.totalBHYT },
      { name: "BHTN", value: stats.totalBHTN },
    ];
  }, [stats]);

  const hasData = useMemo(() => {
    if (activeTab === "summary") return false; // Không cần in/xuất excel cho tổng hợp chung
    if (activeTab === "insurance")
      return (insuranceData?.details?.length || 0) > 0;
    if (activeTab === "tax") return (taxData?.details?.length || 0) > 0;
    if (activeTab === "union") return (unionData?.details?.length || 0) > 0;
    return false;
  }, [activeTab, insuranceData, taxData, unionData]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* ==============================================
          PHẦN 1: HEADER & CÁC NÚT ĐIỀU KHIỂN (XUẤT EXCEL, IN)
          ============================================== */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-black tracking-tighter text-slate-800 flex items-center gap-3 uppercase">
            <FileText className="w-10 h-10 text-primary" /> Báo cáo & Phân tích
          </h1>
          <p className="text-muted-foreground font-medium text-sm">
            Truy xuất dữ liệu tài chính và báo cáo chi tiết kỳ lương
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white p-2 rounded-2.5xl border border-slate-100 shadow-xl shadow-slate-200/50">
          <div className="relative group">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="number"
              value={month}
              onChange={(e) =>
                setMonth(Math.max(1, Math.min(12, Number(e.target.value))))
              }
              className="pl-10 pr-4 py-2.5 w-24 bg-slate-50 rounded-xl font-black text-sm border-none focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="MM"
            />
          </div>
          <div className="relative group">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Math.max(2000, Number(e.target.value)))}
              className="pl-10 pr-4 py-2.5 w-32 bg-slate-50 rounded-xl font-black text-sm border-none focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="YYYY"
            />
          </div>
          {hasData && (
            <>
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#111827] text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95"
              >
                <Download size={16} /> Xuất Excel
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg active:scale-95"
              >
                <Printer size={16} /> In Báo Cáo
              </button>
            </>
          )}
        </div>
      </div>

      {/* ==============================================
          PHẦN 2: MENU CHUYỂN ĐỔI CÁC TAB BÁO CÁO 
          ============================================== */}
      <div className="flex p-1.5 bg-slate-100 rounded-2.5xl w-fit gap-1 shadow-inner">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-xs font-black transition-all duration-500 uppercase tracking-widest ${
              activeTab === tab.id
                ? "bg-white text-primary shadow-xl shadow-slate-200"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {stats.count === 0 && (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 shadow-sm">
          <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-6">
            <Shield size={48} />
          </div>
          <h3 className="text-2xl font-black text-slate-800 italic uppercase">
            Chưa có báo cáo kỳ này
          </h3>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-2">
            Báo cáo chỉ hiển thị sau khi bảng lương đã được phê duyệt
          </p>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === "summary" && stats.count > 0 && (
            <div className="space-y-10">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    label: "Nhân sự",
                    value: `${stats.count} Người`,
                    icon: Users,
                    color: "text-blue-600",
                    bg: "bg-blue-50",
                  },
                  {
                    label: "BH Doanh nghiệp",
                    value: formatVND(stats.totalEmployerInsurance),
                    icon: ShieldAlert,
                    color: "text-amber-600",
                    bg: "bg-amber-50",
                  },
                  {
                    label: "Thuế TNCN",
                    value: formatVND(stats.totalTax),
                    icon: Wallet,
                    color: "text-red-600",
                    bg: "bg-red-50",
                  },
                  {
                    label: "Tổng CP Lương",
                    value: formatVND(
                      stats.totalGross + stats.totalEmployerInsurance,
                    ),
                    icon: TrendingUp,
                    color: "text-emerald-600",
                    bg: "bg-emerald-50",
                  },
                ].map((s, i) => (
                  <div
                    key={i}
                    className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col gap-4"
                  >
                    <div
                      className={`w-12 h-12 ${s.bg} rounded-2xl flex items-center justify-center ${s.color}`}
                    >
                      <s.icon size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {s.label}
                      </p>
                      <h4
                        className={`text-2xl font-black tracking-tight ${s.color}`}
                      >
                        {s.value}
                      </h4>
                    </div>
                  </div>
                ))}
              </div>

              {/* ==============================================
                    PHẦN 3.2: KHU VỰC VẼ BIỂU ĐỒ TRỰC QUAN (PIE CHART)
                    ============================================== */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase italic mb-2">
                    Phân bổ <span className="text-primary">Chi phí</span>
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">
                    Tỷ trọng các khoản trong kỳ
                  </p>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={120}
                          paddingAngle={5}
                          dataKey="value"
                          stroke="none"
                        >
                          {chartData.map((_entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            borderRadius: "1.5rem",
                            border: "none",
                            boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                          }}
                        />
                        <Legend
                          verticalAlign="bottom"
                          wrapperStyle={{
                            paddingTop: "20px",
                            fontSize: "10px",
                            fontWeight: "900",
                            textTransform: "uppercase",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase italic mb-2">
                    Cơ cấu <span className="text-amber-500">Bảo hiểm</span>
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">
                    Phân tích theo loại hình
                  </p>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={insuranceChartsData}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={120}
                          paddingAngle={5}
                          dataKey="value"
                          stroke="none"
                        >
                          {insuranceChartsData.map((_entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                ["#3b82f6", "#10b981", "#f59e0b"][index % 3]
                              }
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            borderRadius: "1.5rem",
                            border: "none",
                            boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                          }}
                        />
                        <Legend
                          verticalAlign="bottom"
                          wrapperStyle={{
                            paddingTop: "20px",
                            fontSize: "10px",
                            fontWeight: "900",
                            textTransform: "uppercase",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* ==============================================
                    PHẦN 3.3: KHU VỰC VẼ BẢNG HIỂN THỊ DANH SÁCH (TABLE)
                    (Vẽ chi tiết từng dòng dữ liệu lương của nhân viên)
                    ============================================== */}
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">
                      Danh sách{" "}
                      <span className="text-primary italic">Tổng hợp</span>
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Dữ liệu chi tiết từng nhân sự
                    </p>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm nhân viên..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-11 pr-6 h-12 bg-slate-50 border-none rounded-2xl w-64 focus:ring-2 focus:ring-primary/20 text-xs font-bold transition-all"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest pl-10">
                          Mã NV
                        </th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                          Họ và tên
                        </th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">
                          Thực lĩnh
                        </th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">
                          Đóng BH (NLĐ)
                        </th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right pr-10">
                          Thuế TNCN
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {lockedDetails
                        .filter((d) =>
                          (d.fullName || "")
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase()),
                        )
                        .map((d) => (
                          <tr
                            key={d.employeeId}
                            className="group hover:bg-slate-50/50 transition-all"
                          >
                            <td className="px-8 py-6 pl-10">
                              <span className="font-black text-slate-400 text-xs uppercase">
                                #{d.employeeId}
                              </span>
                            </td>
                            <td className="px-8 py-6">
                              <div className="font-black text-slate-800 text-sm">
                                {d.fullName}
                              </div>
                              <div
                                className={`text-[10px] font-bold uppercase flex items-center gap-1 ${
                                  d.status === "PAID"
                                    ? "text-indigo-500"
                                    : d.status === "APPROVED"
                                      ? "text-emerald-500"
                                      : d.status === "REJECTED"
                                        ? "text-red-500"
                                        : "text-slate-400"
                                }`}
                              >
                                <div
                                  className={`w-1 h-1 rounded-full animate-pulse ${
                                    d.status === "PAID"
                                      ? "bg-indigo-500"
                                      : d.status === "APPROVED"
                                        ? "bg-emerald-500"
                                        : d.status === "REJECTED"
                                          ? "bg-red-500"
                                          : "bg-slate-400"
                                  }`}
                                />
                                {d.status === "PAID"
                                  ? "Đã thanh toán"
                                  : d.status === "APPROVED"
                                    ? "Đã chốt lương"
                                    : d.status === "REJECTED"
                                      ? "Bị từ chối"
                                      : "Bản nháp (Chưa chốt)"}
                              </div>
                            </td>
                            <td className="px-8 py-6 text-right">
                              <div className="font-black text-primary text-base">
                                {formatVND(d.netPay)}
                              </div>
                            </td>
                            <td className="px-8 py-6 text-right font-black text-slate-600 text-sm">
                              {formatVND(d.totalInsurance)}
                            </td>
                            <td className="px-8 py-6 text-right pr-10">
                              <div className="font-black text-red-500 text-sm">
                                {formatVND(d.taxAmount)}
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "insurance" && lockedInsuranceDetails.length > 0 && (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">
                    Chi tiết{" "}
                    <span className="text-emerald-500 italic">Bảo hiểm</span>
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Báo cáo trích nộp kỳ {month}/{year}
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest pl-10">
                        Mã NV
                      </th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                        Họ tên
                      </th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">
                        Lương đóng BH
                      </th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right text-indigo-500">
                        NLĐ Đóng
                      </th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right text-emerald-500 pr-10">
                        Doanh nghiệp đóng
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {lockedInsuranceDetails.map((item: InsuranceDetail) => (
                      <tr
                        key={item.employeeId}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-8 py-6 pl-10 text-xs font-black text-slate-400">
                          #{item.employeeId}
                        </td>
                        <td className="px-8 py-6 font-black text-slate-800 text-sm">
                          {item.fullName}
                        </td>
                        <td className="px-8 py-6 text-right font-black text-slate-600">
                          {formatVND(item.contractSalary)}
                        </td>
                        <td className="px-8 py-6 text-right font-black text-indigo-600">
                          {formatVND(item.totalEE)}
                        </td>
                        <td className="px-8 py-6 text-right font-black text-emerald-600 pr-10">
                          {formatVND(item.totalER)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "tax" && lockedTaxDetails.length > 0 && (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">
                    Quyết toán{" "}
                    <span className="text-red-500 italic">Thuế TNCN</span>
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Kỳ báo cáo tháng {month}/{year}
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest pl-10">
                        Mã NV
                      </th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                        Họ tên
                      </th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">
                        TN Tính thuế
                      </th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">
                        Người PT
                      </th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right text-red-500 pr-10">
                        Số thuế phải nộp
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {lockedTaxDetails.map((item: TaxDetail) => (
                      <tr
                        key={item.employeeId}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-8 py-6 pl-10 text-xs font-black text-slate-400">
                          #{item.employeeId}
                        </td>
                        <td className="px-8 py-6 font-black text-slate-800 text-sm">
                          {item.fullName}
                        </td>
                        <td className="px-8 py-6 text-right font-black text-slate-600">
                          {formatVND(item.taxableIncome)}
                        </td>
                        <td className="px-8 py-6 text-center font-black text-slate-400">
                          {item.dependentCount}
                        </td>
                        <td className="px-8 py-6 text-right font-black text-red-500 pr-10">
                          {formatVND(item.taxAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "union" && lockedUnionDetails.length > 0 && (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">
                    Quỹ{" "}
                    <span className="text-purple-500 italic">Công đoàn</span>
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Phải nộp 2% quỹ tiền lương
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest pl-10">
                        Mã NV
                      </th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                        Họ tên
                      </th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">
                        Lương đóng BH
                      </th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right text-purple-600 pr-10">
                        Kinh phí Công đoàn
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {lockedUnionDetails.map((item: UnionDetail) => (
                      <tr
                        key={item.employeeId}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-8 py-6 pl-10 text-xs font-black text-slate-400">
                          #{item.employeeId}
                        </td>
                        <td className="px-8 py-6 font-black text-slate-800 text-sm">
                          {item.fullName}
                        </td>
                        <td className="px-8 py-6 text-right font-black text-slate-600">
                          {formatVND(item.contractSalary)}
                        </td>
                        <td className="px-8 py-6 text-right font-black text-purple-600 pr-10">
                          {formatVND(item.kpcd)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {((activeTab !== "summary" &&
            ((activeTab === "insurance" && !insuranceData) ||
              (activeTab === "tax" && !taxData) ||
              (activeTab === "union" && !unionData))) ||
            (!data && activeTab === "summary")) && (
            <div className="h-[400px] bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200 flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-300 shadow-xl">
                <Info size={32} />
              </div>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
                Chưa có dữ liệu cho kỳ {month}/{year}
              </p>
              <p className="text-slate-300 text-[10px] uppercase font-bold px-10 text-center">
                Có thể bảng lương tháng này chưa được phê duyệt hoặc chưa có
                phát sinh
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ==============================================
          PHẦN 4: GIAO DIỆN KHI IN ẤN (HIDDEN PRINTABLE AREA)
          (Các Component này bị ẩn trên trình duyệt và chỉ hiện ra khi bấm In Báo Cáo)
          (Nằm trong thư mục src/components/Printable*.tsx)
          ============================================== */}
      <div className="printable-only">
        {activeTab === "insurance" && insuranceData && (
          <PrintableInsuranceReport
            data={insuranceData.details}
            month={month}
            year={year}
          />
        )}
        {activeTab === "tax" && taxData && (
          <PrintableTaxReport
            data={taxData.details}
            month={month}
            year={year}
          />
        )}
        {activeTab === "union" && unionData && (
          <PrintableUnionReport
            data={unionData.details}
            month={month}
            year={year}
          />
        )}
      </div>
    </div>
  );
}
