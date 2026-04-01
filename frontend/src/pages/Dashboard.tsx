import { useState, useEffect } from "react"
import axios from "axios"
import { Users, CreditCard, Banknote, TrendingUp, Calculator, BarChart3, ShieldCheck } from "lucide-react"
import { motion } from "framer-motion"

// Simple UI Components
const Card = ({ children, className = "" }: any) => (
  <div className={`rounded-2xl border bg-card text-card-foreground shadow ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = "" }: any) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className = "" }: any) => (
  <h3 className={`font-semibold leading-none tracking-tight ${className}`}>
    {children}
  </h3>
);

const CardContent = ({ children, className = "" }: any) => (
  <div className={`p-6 pt-0 ${className}`}>
    {children}
  </div>
);

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function DashboardPage() {
  const [summary, setSummary] = useState<any>(null)
  const [trendData, setTrendData] = useState<any[]>([])

  const auth = { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const now = new Date()
        const month = now.getMonth() === 0 ? 12 : now.getMonth()
        const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
        
        const [sumRes, trendRes] = await Promise.all([
            axios.get(`/api/accounting/summary?month=${month}&year=${year}`, auth),
            axios.get(`/api/accounting/trend`, auth)
        ])
        setSummary(sumRes.data)
        setTrendData(trendRes.data)
      } catch (err) { console.error(err) }
    }
    fetchData()
  }, [])

  const formatVND = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { 
        style: 'currency', 
        currency: 'VND',
        maximumFractionDigits: 0 
    }).format(val || 0)
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1e293b] border border-slate-700 p-4 rounded-xl shadow-2xl backdrop-blur-md">
          <p className="text-[10px] font-black uppercase text-slate-400 mb-1">{label}</p>
          <p className="text-sm font-black text-primary">
            {formatVND(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tighter text-slate-800">TỔNG QUAN HỆ THỐNG</h1>
        <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <p className="text-muted-foreground font-medium text-sm">Cập nhật dữ liệu thời gian thực: Kỳ {summary?.month}/{summary?.year}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-[0_20px_50px_rgba(37,99,235,0.2)] bg-gradient-to-br from-blue-600 to-blue-800 text-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-700">
            <Users size={100} />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
            <CardTitle className="text-[10px] font-black uppercase opacity-70 tracking-widest">Tổng Nhân Sự</CardTitle>
            <Users className="h-4 w-4 opacity-50" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-black tracking-tighter mb-1">{summary?.employeeCount || '---'}</div>
            <p className="text-[10px] opacity-70 font-bold flex items-center gap-1 bg-white/10 w-fit px-2 py-0.5 rounded-full">
                <TrendingUp size={10} /> +2% mục tiêu tuyển dụng
            </p>
          </CardContent>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-300 to-transparent opacity-30"></div>
        </Card>

        <Card className="border-none shadow-[0_20px_50px_rgba(16,185,129,0.2)] bg-gradient-to-br from-emerald-600 to-emerald-800 text-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-700">
            <Banknote size={100} />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
            <CardTitle className="text-[10px] font-black uppercase opacity-70 tracking-widest">Tổng Lương Net</CardTitle>
            <CreditCard className="h-4 w-4 opacity-50" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-black tracking-tight tabular-nums mb-1">{formatVND(summary?.totalNetPay)}</div>
            <p className="text-[10px] opacity-70 font-bold bg-white/10 w-fit px-2 py-0.5 rounded-full">Đã bao gồm phụ cấp & OT</p>
          </CardContent>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-green-300 to-transparent opacity-30"></div>
        </Card>

        <Card className="border-none shadow-[0_20px_50px_rgba(249,115,22,0.2)] bg-gradient-to-br from-orange-500 to-orange-700 text-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-700">
            <ShieldCheck size={100} />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
            <CardTitle className="text-[10px] font-black uppercase opacity-70 tracking-widest">Chi Phí BH (DN)</CardTitle>
            <ShieldCheck className="h-4 w-4 opacity-50" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-black tracking-tight tabular-nums mb-1">{formatVND(summary?.totalEmployerInsurance)}</div>
            <p className="text-[10px] opacity-70 font-bold bg-white/10 w-fit px-2 py-0.5 rounded-full">Tiết kiệm 5.2% quỹ phúc lợi</p>
          </CardContent>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-orange-300 to-transparent opacity-30"></div>
        </Card>

        <Card className="border-none shadow-[0_20px_50px_rgba(30,41,59,0.2)] bg-gradient-to-br from-slate-800 to-slate-950 text-white overflow-hidden relative group">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-700">
            <Calculator size={100} />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
            <CardTitle className="text-[10px] font-black uppercase opacity-70 tracking-widest">Khấu Trừ Thuế</CardTitle>
            <BarChart3 className="h-4 w-4 opacity-50" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-black tracking-tight tabular-nums mb-1">{formatVND(summary?.totalTax)}</div>
            <p className="text-[10px] opacity-70 font-bold bg-white/10 w-fit px-2 py-0.5 rounded-full">Tạm trích thuế TNCN tháng</p>
          </CardContent>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-slate-400 to-transparent opacity-30"></div>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-7">
          <Card className="lg:col-span-4 border-slate-100 shadow-2xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-black flex items-center gap-2 text-slate-800">
                        <TrendingUp className="w-5 h-5 text-primary" /> Diễn biến chi phí lương (AreaTrend)
                    </CardTitle>
                    <div className="flex items-center gap-1.5 bg-primary/10 px-3 py-1 rounded-full text-primary font-black text-[10px]">
                        DỮ LIỆU ĐỘNG 6 THÁNG
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6 h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}}
                    dy={10}
                  />
                  <YAxis 
                    hide 
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3b82f6" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3 border-slate-100 shadow-2xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                <CardTitle className="text-base font-black flex items-center gap-2 text-slate-800">
                    <Users className="w-5 h-5 text-emerald-500" /> Trạng thái vận hành
                </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
                <div className="space-y-6">
                    <div className="group">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Phê duyệt lương (Approved)</span>
                            <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full shadow-sm shadow-emerald-100">100%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-full shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                            />
                        </div>
                    </div>

                    <div className="group">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Thanh toán UNC/PC (Paid)</span>
                            <span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full shadow-sm shadow-blue-100">85%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: "85%" }}
                                transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                                className="bg-gradient-to-r from-blue-400 to-blue-600 h-full shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                            />
                        </div>
                    </div>

                    <div className="mt-8 p-4 rounded-2xl bg-slate-50 border border-slate-100 italic text-[11px] text-slate-500 font-medium">
                        * Dữ liệu được tổng hợp dựa trên các chứng từ kế toán (Vouchers) đã phát sinh trong kỳ hiện tại.
                    </div>
                </div>
            </CardContent>
          </Card>
      </div>
    </div>
  )
}
