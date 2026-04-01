import { useState, useEffect } from "react"
import axios from "axios"
import { Input } from "../components/ui/input"
import { BarChart3, TrendingUp, Users, Shield, PieChart as PieIcon, FileText, Building2 } from "lucide-react"
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts'

interface SummaryData {
  month: number
  year: number
  employeeCount: number
  totalGrossIncome: number
  totalBaseSalary: number
  totalMealAllowance: number
  totalOtPay: number
  totalBHXH: number
  totalBHYT: number
  totalBHTN: number
  totalInsurance: number
  totalEmployerInsurance: number
  totalTax: number
  totalNetPay: number
  details: DetailRow[]
}

interface DetailRow {
  employeeId: string
  fullName: string
  grossIncome: number
  bhxh: number
  bhyt: number
  bhtn: number
  totalInsurance: number
  totalEmployerInsurance: number
  taxableIncome: number
  taxAmount: number
  netPay: number
  status: string
}

const TABS = [
  { id: "summary", label: "Tổng hợp", icon: PieIcon },
  { id: "insurance", label: "BC Bảo hiểm", icon: Shield },
  { id: "tax", label: "BC Thuế TNCN", icon: FileText },
  { id: "union", label: "BC Công đoàn", icon: Building2 },
]

export default function ReportsPage() {
  const [month, setMonth] = useState(new Date().getMonth() === 0 ? 12 : new Date().getMonth())
  const [year, setYear] = useState(new Date().getMonth() === 0 ? new Date().getFullYear() - 1 : new Date().getFullYear())
  const [activeTab, setActiveTab] = useState("summary")
  const [data, setData] = useState<SummaryData | null>(null)
  const [insuranceData, setInsuranceData] = useState<any>(null)
  const [taxData, setTaxData] = useState<any>(null)
  const [unionData, setUnionData] = useState<any>(null)

  const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` }

  const fetchAll = async () => {
    try {
      const [sumRes, insRes, taxRes, unionRes] = await Promise.all([
        axios.get(`/api/accounting/summary?month=${month}&year=${year}`, { headers }),
        axios.get(`/api/accounting/report/insurance?month=${month}&year=${year}`, { headers }),
        axios.get(`/api/accounting/report/tax?month=${month}&year=${year}`, { headers }),
        axios.get(`/api/accounting/report/union-fee?month=${month}&year=${year}`, { headers }),
      ])
      setData(sumRes.data)
      setInsuranceData(insRes.data)
      setTaxData(taxRes.data)
      setUnionData(unionRes.data)
    } catch (err) { console.error(err) }
  }

  useEffect(() => { fetchAll() }, [month, year])

  const formatVND = (val: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(val || 0)

  const chartData = data ? [
    { name: 'Thực lĩnh (Net)', value: data.totalNetPay || 0, color: '#10b981' },
    { name: 'Bảo hiểm (EE)', value: data.totalInsurance || 0, color: '#f59e0b' },
    { name: 'Thuế TNCN', value: data.totalTax || 0, color: '#ef4444' },
  ] : []

  const kpis = data ? [
    { label: "Nhân sự", value: data.employeeCount || 0, suffix: "người", icon: Users, color: "from-blue-600 to-blue-700" },
    { label: "Tổng phí DN", value: formatVND((data.totalGrossIncome || 0) + (data.totalEmployerInsurance || 0)), icon: TrendingUp, color: "from-indigo-600 to-indigo-700" },
    { label: "BH Công ty", value: formatVND(data.totalEmployerInsurance || 0), icon: Shield, color: "from-purple-600 to-purple-700" },
  ] : []

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700 pb-10">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex flex-col gap-1">
            <h1 className="text-4xl font-black tracking-tighter text-slate-800 flex items-center gap-3">
                <BarChart3 className="w-10 h-10 text-primary" /> SỔ SÁCH & BÁO CÁO
            </h1>
            <p className="text-muted-foreground font-medium text-sm">Báo cáo chi tiết Thuế, Bảo hiểm, Kinh phí Công đoàn & Chi phí lương</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white shadow-xl shadow-slate-200/50 p-2.5 rounded-2xl border border-slate-100">
          <div className="px-3 py-1 bg-slate-50 rounded-lg flex items-center gap-2">
            <span className="text-[10px] font-black uppercase text-slate-400">Tháng</span>
            <Input type="number" className="w-14 h-8 text-center font-black border-none bg-transparent focus-visible:ring-0 p-0" value={month} onChange={e => setMonth(Number(e.target.value))} />
          </div>
          <div className="px-3 py-1 bg-slate-50 rounded-lg flex items-center gap-2">
            <span className="text-[10px] font-black uppercase text-slate-400">Năm</span>
            <Input type="number" className="w-18 h-8 text-center font-black border-none bg-transparent focus-visible:ring-0 p-0" value={year} onChange={e => setYear(Number(e.target.value))} />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-slate-200 pb-0">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 -mb-[1px] ${
              activeTab === tab.id
                ? "text-primary border-primary"
                : "text-slate-400 border-transparent hover:text-slate-600 hover:border-slate-300"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Tổng hợp */}
      {activeTab === "summary" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {kpis.map((k, i) => (
              <div key={i} className={`rounded-3xl p-6 shadow-xl bg-gradient-to-br ${k.color} text-white relative overflow-hidden group`}>
                <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-125 transition-transform duration-700">
                    <k.icon size={120} />
                </div>
                <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase opacity-70 tracking-widest mb-1">{k.label}</p>
                    <div className="text-2xl font-black tabular-nums">
                        {k.value} {k.suffix}
                    </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2 border border-slate-100 rounded-3xl bg-white shadow-2xl shadow-slate-200/50 overflow-hidden">
                <div className="bg-slate-50/50 p-6 border-b border-slate-100">
                    <h3 className="font-black text-slate-800 text-sm uppercase flex items-center gap-2">
                        <PieIcon className="w-4 h-4 text-emerald-500" /> Cơ cấu phân bổ chi phí
                    </h3>
                </div>
                <div className="p-6 h-[350px]">
                    {data && (data.totalGrossIncome || 0) > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={chartData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value">
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <RechartsTooltip 
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }}
                                    formatter={(val: any) => formatVND(Number(val))}
                                />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-400 italic text-xs">
                            Không có dữ liệu biểu đồ
                        </div>
                    )}
                </div>
            </div>

            <div className="lg:col-span-3 border border-slate-100 rounded-3xl bg-white shadow-2xl shadow-slate-200/50 overflow-hidden">
                <div className="bg-slate-50/50 p-6 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-black text-slate-800 text-sm uppercase flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" /> Chi tiết theo nhân viên
                    </h3>
                    {data && (
                        <span className="text-[10px] font-black bg-primary/10 text-primary px-3 py-1 rounded-full">
                            {data.details.length} NHÂN SỰ
                        </span>
                    )}
                </div>
                <div className="overflow-auto max-h-[400px] custom-scrollbar">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-[#111827] text-white sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-4 font-black uppercase tracking-tighter">Nhân viên</th>
                                <th className="px-6 py-4 font-black uppercase tracking-tighter text-right">Lương ròng</th>
                                <th className="px-6 py-4 font-black uppercase tracking-tighter text-right">Bảo hiểm</th>
                                <th className="px-6 py-4 font-black uppercase tracking-tighter text-right">Thuế TNCN</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data?.details.map(d => (
                                <tr key={d.employeeId} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-black text-slate-800">{d.fullName}</div>
                                        <div className="text-[10px] text-slate-400 font-bold tracking-widest">{d.employeeId}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-black text-emerald-600 tabular-nums">{formatVND(d.netPay)}</td>
                                    <td className="px-6 py-4 text-right font-bold text-amber-600 tabular-nums">{formatVND(d.totalInsurance)}</td>
                                    <td className="px-6 py-4 text-right font-bold text-red-500 tabular-nums">{formatVND(d.taxAmount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {!data || data.details.length === 0 ? (
                    <div className="p-20 text-center text-slate-300 italic text-sm">Dữ liệu trống</div>
                ) : null}
            </div>
          </div>

          <div className="p-8 rounded-[2.5rem] bg-[#111827] text-white shadow-2xl relative overflow-hidden">
              <div className="absolute right-0 top-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full"></div>
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="space-y-4">
                      <h4 className="text-lg font-black tracking-tight">TỔNG HỢP CHI PHÍ LƯƠNG & BẢO HIỂM THÁNG {month}/{year}</h4>
                      <div className="grid grid-cols-2 gap-x-12 gap-y-4">
                          <div className="flex flex-col">
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tổng lương Gross</span>
                              <span className="text-xl font-black text-blue-400">{formatVND(data?.totalGrossIncome || 0)}</span>
                          </div>
                          <div className="flex flex-col">
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">BH & KPCĐ Doanh nghiệp</span>
                              <span className="text-xl font-black text-indigo-400">{formatVND(data?.totalEmployerInsurance || 0)}</span>
                          </div>
                      </div>
                  </div>
                  <div className="h-24 w-[2px] bg-slate-800 hidden md:block"></div>
                  <div className="text-center md:text-right">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">TỔNG CHI PHÍ TÀI CHÍNH (DN)</p>
                      <p className="text-5xl font-black tracking-tighter text-white tabular-nums">
                          {formatVND((data?.totalGrossIncome || 0) + (data?.totalEmployerInsurance || 0))}
                      </p>
                  </div>
              </div>
          </div>
        </>
      )}

      {/* Tab: BC Bảo hiểm */}
      {activeTab === "insurance" && insuranceData && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 bg-blue-50 border border-blue-200 rounded-2xl text-center">
              <p className="text-[10px] font-black uppercase text-blue-600 tracking-wider">BHXH (NLĐ 8%)</p>
              <p className="text-xl font-black text-blue-700 tabular-nums">{formatVND(insuranceData.totalBhxhEE)}</p>
            </div>
            <div className="p-5 bg-green-50 border border-green-200 rounded-2xl text-center">
              <p className="text-[10px] font-black uppercase text-green-600 tracking-wider">BHYT (NLĐ 1.5%)</p>
              <p className="text-xl font-black text-green-700 tabular-nums">{formatVND(insuranceData.totalBhytEE)}</p>
            </div>
            <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl text-center">
              <p className="text-[10px] font-black uppercase text-amber-600 tracking-wider">BHTN (NLĐ 1%)</p>
              <p className="text-xl font-black text-amber-700 tabular-nums">{formatVND(insuranceData.totalBhtnEE)}</p>
            </div>
            <div className="p-5 bg-purple-50 border border-purple-200 rounded-2xl text-center">
              <p className="text-[10px] font-black uppercase text-purple-600 tracking-wider">Tổng BH (DN 23.5%)</p>
              <p className="text-xl font-black text-purple-700 tabular-nums">{formatVND(insuranceData.totalER)}</p>
            </div>
          </div>

          <div className="border rounded-2xl bg-white shadow-lg overflow-hidden">
            <div className="bg-slate-50 p-4 border-b flex items-center justify-between">
              <h3 className="font-black text-sm uppercase text-slate-700 flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-500" /> BÁO CÁO TRÍCH NỘP BẢO HIỂM — THÁNG {month}/{year}
              </h3>
              <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-3 py-1 rounded-full">{insuranceData.employeeCount} NV</span>
            </div>
            <div className="overflow-auto">
              <table className="w-full text-xs text-left whitespace-nowrap">
                <thead className="bg-[#111827] text-white">
                  <tr>
                    <th className="px-4 py-3 font-bold">Mã NV</th>
                    <th className="px-4 py-3 font-bold">Họ tên</th>
                    <th className="px-4 py-3 font-bold text-right">Lương HĐ</th>
                    <th className="px-4 py-3 font-bold text-right text-blue-300">BHXH (8%)</th>
                    <th className="px-4 py-3 font-bold text-right text-green-300">BHYT (1.5%)</th>
                    <th className="px-4 py-3 font-bold text-right text-amber-300">BHTN (1%)</th>
                    <th className="px-4 py-3 font-bold text-right text-red-300">Tổng NLĐ</th>
                    <th className="px-4 py-3 font-bold text-right text-blue-300">BHXH (17.5%)</th>
                    <th className="px-4 py-3 font-bold text-right text-green-300">BHYT (3%)</th>
                    <th className="px-4 py-3 font-bold text-right text-amber-300">BHTN (1%)</th>
                    <th className="px-4 py-3 font-bold text-right text-purple-300">KPCĐ (2%)</th>
                    <th className="px-4 py-3 font-bold text-right text-yellow-300">Tổng DN</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {insuranceData.details?.map((d: any) => (
                    <tr key={d.employeeId} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-500">{d.employeeId}</td>
                      <td className="px-4 py-3 font-semibold">{d.fullName}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatVND(d.contractSalary)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-blue-600">{formatVND(d.bhxhEE)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-green-600">{formatVND(d.bhytEE)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-amber-600">{formatVND(d.bhtnEE)}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-bold text-red-600">{formatVND(d.totalEE)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-blue-600">{formatVND(d.bhxhER)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-green-600">{formatVND(d.bhytER)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-amber-600">{formatVND(d.bhtnER)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-purple-600">{formatVND(d.kpcd)}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-bold text-yellow-600">{formatVND(d.totalER)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 font-black border-t-2 border-slate-300">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 uppercase text-xs text-slate-500">TỔNG CỘNG</td>
                    <td className="px-4 py-3 text-right tabular-nums text-blue-700">{formatVND(insuranceData.totalBhxhEE)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-green-700">{formatVND(insuranceData.totalBhytEE)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-amber-700">{formatVND(insuranceData.totalBhtnEE)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-red-700">{formatVND(insuranceData.totalEE)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-blue-700">{formatVND(insuranceData.totalBhxhER)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-green-700">{formatVND(insuranceData.totalBhytER)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-amber-700">{formatVND(insuranceData.totalBhtnER)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-purple-700">{formatVND(insuranceData.totalKpcd)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-yellow-700">{formatVND(insuranceData.totalER)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: BC Thuế TNCN */}
      {activeTab === "tax" && taxData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-red-50 border border-red-200 rounded-2xl text-center">
              <p className="text-[10px] font-black uppercase text-red-600 tracking-wider">Tổng Thu nhập tính thuế</p>
              <p className="text-xl font-black text-red-700 tabular-nums">{formatVND(taxData.totalTaxableIncome)}</p>
            </div>
            <div className="p-5 bg-orange-50 border border-orange-200 rounded-2xl text-center">
              <p className="text-[10px] font-black uppercase text-orange-600 tracking-wider">Tổng Thuế TNCN phải nộp</p>
              <p className="text-xl font-black text-orange-700 tabular-nums">{formatVND(taxData.totalTaxAmount)}</p>
            </div>
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl text-center">
              <p className="text-[10px] font-black uppercase text-slate-600 tracking-wider">Số nhân viên chịu thuế</p>
              <p className="text-xl font-black text-slate-700">{taxData.details?.filter((d: any) => d.taxAmount > 0).length || 0} / {taxData.employeeCount}</p>
            </div>
          </div>

          <div className="border rounded-2xl bg-white shadow-lg overflow-hidden">
            <div className="bg-slate-50 p-4 border-b flex items-center justify-between">
              <h3 className="font-black text-sm uppercase text-slate-700 flex items-center gap-2">
                <FileText className="w-4 h-4 text-red-500" /> BÁO CÁO THUẾ THU NHẬP CÁ NHÂN — THÁNG {month}/{year}
              </h3>
            </div>
            <div className="overflow-auto">
              <table className="w-full text-xs text-left whitespace-nowrap">
                <thead className="bg-[#111827] text-white">
                  <tr>
                    <th className="px-4 py-3 font-bold">Mã NV</th>
                    <th className="px-4 py-3 font-bold">Họ tên</th>
                    <th className="px-4 py-3 font-bold text-center">Người PT</th>
                    <th className="px-4 py-3 font-bold text-right">Thu nhập Gross</th>
                    <th className="px-4 py-3 font-bold text-right">BH (NLĐ)</th>
                    <th className="px-4 py-3 font-bold text-right text-amber-300">TN tính thuế</th>
                    <th className="px-4 py-3 font-bold text-right text-red-300">Thuế TNCN</th>
                    <th className="px-4 py-3 font-bold text-right text-green-300">Thực lĩnh</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {taxData.details?.map((d: any) => (
                    <tr key={d.employeeId} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-500">{d.employeeId}</td>
                      <td className="px-4 py-3 font-semibold">{d.fullName}</td>
                      <td className="px-4 py-3 text-center">{d.dependentCount || 0}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatVND(d.grossIncome)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-500">{formatVND(d.totalInsurance)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-amber-600 font-bold">{formatVND(d.taxableIncome)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-red-600 font-bold">{formatVND(d.taxAmount)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-green-600 font-black">{formatVND(d.netPay)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 font-black border-t-2 border-slate-300">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 uppercase text-xs text-slate-500">TỔNG CỘNG</td>
                    <td className="px-4 py-3"></td>
                    <td className="px-4 py-3 text-right tabular-nums text-amber-700">{formatVND(taxData.totalTaxableIncome)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-red-700">{formatVND(taxData.totalTaxAmount)}</td>
                    <td className="px-4 py-3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: BC Công đoàn */}
      {activeTab === "union" && unionData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-indigo-50 border border-indigo-200 rounded-2xl text-center">
              <p className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">Tổng quỹ lương đóng BH</p>
              <p className="text-xl font-black text-indigo-700 tabular-nums">{formatVND(unionData.totalContractSalary)}</p>
            </div>
            <div className="p-5 bg-violet-50 border border-violet-200 rounded-2xl text-center">
              <p className="text-[10px] font-black uppercase text-violet-600 tracking-wider">Tỷ lệ KPCĐ</p>
              <p className="text-xl font-black text-violet-700">{unionData.unionFeeRate}%</p>
            </div>
            <div className="p-5 bg-fuchsia-50 border border-fuchsia-200 rounded-2xl text-center">
              <p className="text-[10px] font-black uppercase text-fuchsia-600 tracking-wider">Tổng phí Công đoàn</p>
              <p className="text-xl font-black text-fuchsia-700 tabular-nums">{formatVND(unionData.totalUnionFee)}</p>
            </div>
          </div>

          <div className="border rounded-2xl bg-white shadow-lg overflow-hidden">
            <div className="bg-slate-50 p-4 border-b flex items-center justify-between">
              <h3 className="font-black text-sm uppercase text-slate-700 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-500" /> BÁO CÁO KINH PHÍ CÔNG ĐOÀN — THÁNG {month}/{year}
              </h3>
              <span className="text-xs text-slate-500">Theo Luật Công đoàn — DN đóng 2% trên quỹ lương BHXH</span>
            </div>
            <div className="overflow-auto">
              <table className="w-full text-xs text-left whitespace-nowrap">
                <thead className="bg-[#111827] text-white">
                  <tr>
                    <th className="px-4 py-3 font-bold">Mã NV</th>
                    <th className="px-4 py-3 font-bold">Họ tên</th>
                    <th className="px-4 py-3 font-bold text-right">Lương HĐ (Quỹ lương đóng BH)</th>
                    <th className="px-4 py-3 font-bold text-right text-indigo-300">KPCĐ (2%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {unionData.details?.map((d: any) => (
                    <tr key={d.employeeId} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-500">{d.employeeId}</td>
                      <td className="px-4 py-3 font-semibold">{d.fullName}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatVND(d.contractSalary)}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-bold text-indigo-600">{formatVND(d.kpcd)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 font-black border-t-2 border-slate-300">
                  <tr>
                    <td colSpan={2} className="px-4 py-3 uppercase text-xs text-slate-500">TỔNG CỘNG</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatVND(unionData.totalContractSalary)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-indigo-700">{formatVND(unionData.totalUnionFee)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Empty state for tabs without data */}
      {activeTab !== "summary" && (
        (activeTab === "insurance" && !insuranceData) ||
        (activeTab === "tax" && !taxData) ||
        (activeTab === "union" && !unionData)
      ) && (
        <div className="text-center py-20 text-slate-400 italic">
          Không có dữ liệu. Hãy tính lương tháng {month}/{year} trước.
        </div>
      )}
    </div>
  )
}
