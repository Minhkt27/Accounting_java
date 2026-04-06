import { useState, useEffect, useMemo } from "react"
import axios from "axios"
import { motion } from "framer-motion"
import { 
  Users, Wallet, ShieldAlert, BadgePercent, 
  TrendingUp, ArrowUpRight, Calendar, Info
} from "lucide-react"
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell
} from "recharts"

interface DashboardSummary {
  month: number;
  year: number;
  employeeCount: number;
  totalNetPay: number;
  totalEmployerInsurance: number;
  totalTax: number;
}

const Card = ({ title, value, subtitle, icon: Icon, color, delay }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] transition-all group relative overflow-hidden"
  >
    <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity bg-${color}-500`} />
    <div className="flex items-start justify-between relative z-10">
      <div className="space-y-4">
        <div className={`w-12 h-12 rounded-2xl bg-${color}-50 flex items-center justify-center text-${color}-600 group-hover:scale-110 transition-transform`}>
           <Icon size={24} />
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</p>
          <h2 className="text-2xl font-black text-slate-900 mt-1 tracking-tight">{value}</h2>
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp size={12} className="text-green-500" />
            <p className="text-[10px] font-bold text-slate-500">{subtitle}</p>
          </div>
        </div>
      </div>
      <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-primary/10 transition-colors">
        <ArrowUpRight size={16} className="text-slate-300 group-hover:text-primary transition-colors" />
      </div>
    </div>
  </motion.div>
)

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const auth = useMemo(() => ({ 
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } 
  }), [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const now = new Date()
        const month = now.getMonth() === 0 ? 12 : now.getMonth()
        const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
        
        const sumRes = await axios.get(`/api/accounting/summary?month=${month}&year=${year}`, auth)
        setSummary(sumRes.data)
      } catch (err: unknown) { 
        console.error(err) 
      } finally {
        setTimeout(() => setIsLoading(false), 800)
      }
    }
    fetchData()
  }, [auth])

  const formatVND = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { 
        style: 'currency', 
        currency: 'VND',
        maximumFractionDigits: 0 
    }).format(val || 0).replace('₫', 'đ')
  }

  const chartData = useMemo(() => {
    if (!summary) return []
    return [
      { name: 'Lương thực lĩnh', value: summary.totalNetPay, color: '#3b82f6' },
      { name: 'Bảo hiểm (DN)', value: summary.totalEmployerInsurance, color: '#f59e0b' },
      { name: 'Thuế TNCN', value: summary.totalTax, color: '#ef4444' },
    ]
  }, [summary])

  const COLORS = ['#3b82f6', '#f59e0b', '#ef4444'];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full"
        />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Đang tải dữ liệu...</p>
      </div>
    )
  }

  return (
    <div className="space-y-10 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
                Báo cáo <span className="text-primary italic">Tổng quan</span>
            </h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <Calendar size={14} className="text-primary/60" />
                Kỳ dữ liệu: {summary?.month}/{summary?.year}
            </p>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card 
          title="Tổng nhân sự" 
          value={summary?.employeeCount || '0'} 
          subtitle="Toàn bộ lao động" 
          icon={Users} 
          color="blue"
          delay={0.1}
        />
        <Card 
          title="Tổng thực lĩnh" 
          value={formatVND(summary?.totalNetPay || 0)} 
          subtitle="Chi phí lương thực trả" 
          icon={Wallet} 
          color="green"
          delay={0.2}
        />
        <Card 
          title="Bảo hiểm (DN)" 
          value={formatVND(summary?.totalEmployerInsurance || 0)} 
          subtitle="Trách nhiệm doanh nghiệp" 
          icon={ShieldAlert} 
          color="orange"
          delay={0.3}
        />
        <Card 
          title="Thuế TNCN" 
          value={formatVND(summary?.totalTax || 0)} 
          subtitle="Số khấu trừ tạm tính" 
          icon={BadgePercent} 
          color="red"
          delay={0.4}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Bar Chart Container */}
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)]"
        >
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase italic">Cơ cấu <span className="text-primary italic">Chi phí</span></h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 px-1">Phân bổ nguồn vốn theo các hạng mục</p>
                </div>
                <div className="w-10 h-10 bg-slate-50 flex items-center justify-center rounded-2xl text-slate-400 group cursor-pointer hover:bg-primary/10 transition-colors">
                    <Info size={18} className="group-hover:text-primary transition-colors" />
                </div>
            </div>
            <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }} 
                            dy={10}
                        />
                        <YAxis hide />
                        <Tooltip 
                            cursor={{ fill: '#f8fafc' }} 
                            contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', fontSize: '12px' }}
                        />
                        <Bar 
                            dataKey="value" 
                            radius={[12, 12, 0, 0]} 
                            barSize={60}
                        >
                            {chartData.map((_entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.8} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </motion.div>

        {/* Pie Chart Container */}
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] flex flex-col"
        >
            <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase italic mb-2">Tỷ trọng <span className="text-primary italic">Chi</span></h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">Phần trăm phân bổ</p>
            
            <div className="h-[250px] w-full my-auto">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={100}
                            paddingAngle={8}
                            dataKey="value"
                            stroke="none"
                        >
                            {chartData.map((_entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip 
                            contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <div className="space-y-3 mt-8">
                {chartData.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100/50">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider font-sans">{item.name}</span>
                        </div>
                        <span className="text-[10px] font-black text-slate-900">{((item.value / chartData.reduce((acc, curr) => acc + curr.value, 0)) * 100).toFixed(1)}%</span>
                    </div>
                ))}
            </div>
        </motion.div>
      </div>

      {/* Details Table */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] overflow-hidden"
      >
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
            <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase italic">Dữ liệu <span className="text-primary italic">Chi tiết</span></h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Báo cáo tổng hợp số liệu kỳ {summary?.month}/{summary?.year}</p>
            </div>
            <button className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 transition-colors">
                <BadgePercent size={20} />
            </button>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="bg-slate-50/50">
                        <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Chỉ số thống kê</th>
                        <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Giá trị (VNĐ)</th>
                        <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Tỷ trọng</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {[
                        { label: 'Tổng nhân sự (FTE)', value: summary?.employeeCount, raw: summary?.employeeCount, type: 'number' },
                        { label: 'Tổng lương Net payable', value: formatVND(summary?.totalNetPay || 0), raw: summary?.totalNetPay, type: 'currency' },
                        { label: 'Bảo hiểm XH doanh nghiệp', value: formatVND(summary?.totalEmployerInsurance || 0), raw: summary?.totalEmployerInsurance, type: 'currency' },
                        { label: 'Thuế TNCN tạm tính', value: formatVND(summary?.totalTax || 0), raw: summary?.totalTax, type: 'currency' },
                    ].map((row, idx) => (
                        <motion.tr 
                            whileHover={{ backgroundColor: 'rgba(248, 250, 252, 0.5)' }}
                            key={idx} 
                            className="transition-colors group"
                        >
                            <td className="px-8 py-6 text-xs font-bold text-slate-700 tracking-wide uppercase">{row.label}</td>
                            <td className="px-8 py-6 text-right text-sm font-black text-slate-900 tracking-tight group-hover:text-primary transition-colors font-sans">{row.value}</td>
                            <td className="px-8 py-6 text-right">
                                {row.type === 'currency' ? (
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                        Tỷ trọng: {((row.raw || 0) / (summary?.totalNetPay || 1) * 100).toFixed(1)}%
                                    </div>
                                ) : (
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Chỉ số gốc</span>
                                )}
                            </td>
                        </motion.tr>
                    ))}
                </tbody>
            </table>
        </div>
      </motion.div>

      <footer className="pt-10 flex items-center justify-between px-4">
        <div className="flex items-center gap-3 text-slate-300">
            <ShieldAlert size={14} />
            <p className="text-[9px] font-black uppercase tracking-[0.2em]">Hệ thống đồng bộ dữ liệu thời gian thực</p>
        </div>
        <p className="text-[9px] font-bold text-slate-300 italic uppercase tracking-widest">
            Generated by Phuc Anh OS Engine &copy; 2026
        </p>
      </footer>
    </div>
  )
}
