import { useState, useEffect } from "react"
import axios from "axios"
import { 
    Settings, Save, Calendar, 
    Coins, Utensils, ShieldCheck, 
    Activity
} from "lucide-react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"

interface SystemParams {
  id?: number
  standardWorkDays: number
  minimumWage: number
  mealAllowance: number
}

export default function SystemParamsPage() {
  const [params, setParams] = useState<SystemParams>({ standardWorkDays: 26, minimumWage: 1800000, mealAllowance: 25000 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    axios.get("/api/config/params", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    }).then(res => { 
        if(res.data.length > 0) setParams(res.data[0]) 
    }).finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    try {
      await axios.post("/api/config/params", params, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      })
      alert("Đã cập nhật tham số hệ thống thành công!")
    } catch (err: unknown) { 
        const message = err instanceof Error ? err.message : String(err)
        alert("Lỗi: " + message) 
    }
  }

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4 animate-pulse">
        <Settings className="w-12 h-12 text-slate-200 animate-spin" />
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Đang tải tham số...</p>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Header Area */}
      <div className="flex flex-col items-center text-center gap-2">
          <div className="w-16 h-16 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary mb-2 shadow-xl shadow-primary/5">
              <Settings size={32} />
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-800 uppercase">Tham số <span className="text-primary italic">Hệ thống</span></h1>
          <p className="text-muted-foreground font-medium text-sm max-w-md">Thiết lập các hằng số cơ bản dùng trong tính toán lương và phúc lợi</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
              { label: 'Số công chuẩn', value: `${params.standardWorkDays} ngày`, icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50' },
              { label: 'Lương tối thiểu', value: new Intl.NumberFormat('vi-VN').format(params.minimumWage) + ' đ', icon: Coins, color: 'text-emerald-500', bg: 'bg-emerald-50' },
              { label: 'Ăn ca / Ngày', value: new Intl.NumberFormat('vi-VN').format(params.mealAllowance) + ' đ', icon: Utensils, color: 'text-orange-500', bg: 'bg-orange-50' }
          ].map((s, i) => (
              <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col gap-4 items-center text-center">
                  <div className={`w-12 h-12 ${s.bg} rounded-2xl flex items-center justify-center ${s.color}`}>
                      <s.icon size={24} />
                  </div>
                  <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">{s.label}</p>
                      <h4 className={`text-xl font-black tracking-tight ${s.color}`}>{s.value}</h4>
                  </div>
              </div>
          ))}
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-3xl shadow-slate-200/50 overflow-hidden">
          <div className="p-10 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                  <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 flex items-center gap-2">
                          <Calendar className="w-3 h-3"/> Số công chuẩn trong tháng
                      </label>
                      <div className="relative">
                          <Input 
                            type="number" 
                            className="h-16 pl-6 pr-16 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white focus:border-primary/20 text-lg font-black text-slate-800 transition-all"
                            value={params.standardWorkDays} 
                            onChange={e => setParams({...params, standardWorkDays: Number(e.target.value)})} 
                          />
                          <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase tracking-widest">Ngày</span>
                      </div>
                  </div>

                  <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 flex items-center gap-2">
                          <Coins className="w-3 h-3"/> Mức lương tối thiểu vùng
                      </label>
                      <div className="relative">
                          <Input 
                            type="number" 
                            className="h-16 pl-6 pr-16 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white focus:border-primary/20 text-lg font-black text-slate-800 transition-all font-mono"
                            value={params.minimumWage} 
                            onChange={e => setParams({...params, minimumWage: Number(e.target.value)})} 
                          />
                          <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase tracking-widest">VNĐ</span>
                      </div>
                  </div>

                  <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 flex items-center gap-2">
                          <Utensils className="w-3 h-3"/> Định mức tiền ăn giữa ca
                      </label>
                      <div className="relative">
                          <Input 
                            type="number" 
                            className="h-16 pl-6 pr-16 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white focus:border-primary/20 text-lg font-black text-slate-800 transition-all font-mono"
                            value={params.mealAllowance} 
                            onChange={e => setParams({...params, mealAllowance: Number(e.target.value)})} 
                          />
                          <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase tracking-widest">VNĐ</span>
                      </div>
                  </div>

                  <div className="flex flex-col justify-end pb-1">
                      <div className="p-5 bg-blue-50 border border-blue-100 rounded-2.5xl flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-blue-500 shadow-sm flex-shrink-0">
                                <ShieldCheck size={20} />
                          </div>
                          <div>
                              <h5 className="text-[10px] font-black text-blue-900 uppercase tracking-widest mb-1">Xác thực hệ thống</h5>
                              <p className="text-[9px] text-blue-600/80 font-bold leading-tight">Các thay đổi sẽ ảnh hưởng trực tiếp đến kết quả tính lương của toàn bộ nhân viên trong kỳ.</p>
                          </div>
                      </div>
                  </div>
              </div>

              <div className="pt-6 border-t border-slate-50 flex justify-center">
                  <Button 
                    onClick={handleSave} 
                    className="h-16 px-16 rounded-2xl bg-[#111827] hover:bg-black text-white font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-slate-400 transition-all active:scale-95 group"
                  >
                      <Save size={18} className="mr-3 group-hover:scale-125 transition-all" /> Cập nhật tham số hệ thống
                  </Button>
              </div>
          </div>
      </div>

      <div className="flex items-center justify-center gap-8 text-[10px] font-black text-slate-300 uppercase tracking-widest">
          <div className="flex items-center gap-2">
              <Activity size={14} /> Hệ thống PA-Payroll
          </div>
          <div className="w-1 h-1 rounded-full bg-slate-200" />
          <div className="flex items-center gap-2">
              <ShieldCheck size={14} /> Bảo mật mã hóa
          </div>
      </div>
    </div>
  )
}
