import { useState, useEffect, useCallback } from "react"
import axios from "axios"
import { 
  Calculator, Plus, Trash2, ShieldCheck, 
  Info, Save, TrendingUp
} from "lucide-react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import type { TaxTier, DeductionSetting } from "../types"

export default function TaxConfigPage() {
  const [tiers, setTiers] = useState<TaxTier[]>([])
  const [deductions, setDeductions] = useState<DeductionSetting>({ personalDeduction: 15500000, dependentDeduction: 6200000 })
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const auth = { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      const resTax = await axios.get("/api/config/tax", auth)
      setTiers(resTax.data)
      const resDed = await axios.get("/api/config/deductions", auth)
      if(resDed.data.length > 0) setDeductions(resDed.data[0])
    } catch (err: unknown) { 
      const message = err instanceof Error ? err.message : String(err)
      console.error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleAddTier = () => {
    setTiers([...tiers, { lowerBound: 0, upperBound: 0, taxRate: 0, tierLevel: tiers.length + 1, status: 'PENDING' }])
  }

  const handleSaveTax = async () => {
    try {
      await axios.post("/api/config/tax", tiers, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      })
      alert("Đã gửi đề xuất cập nhật biểu thuế TNCN!")
      fetchData()
    } catch (err: unknown) { 
        const message = err instanceof Error ? err.message : String(err)
        alert("Lỗi lưu thuế: " + message) 
    }
  }

  const handleSaveDeduction = async () => {
    try {
      await axios.post("/api/config/deductions", deductions, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      })
      alert("Đã cập nhật định mức giảm trừ gia cảnh!")
      fetchData()
    } catch (err: unknown) { 
        const message = err instanceof Error ? err.message : String(err)
        alert("Lỗi lưu giảm trừ: " + message) 
    }
  }

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4 animate-pulse">
        <Calculator className="w-12 h-12 text-slate-200 animate-spin" />
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Đang tải cấu hình thuế...</p>
    </div>
  )

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Header Area */}
      <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-black tracking-tighter text-slate-800 flex items-center gap-3 uppercase">
              <Calculator className="w-10 h-10 text-primary" /> Thuế & Giảm trừ
          </h1>
          <p className="text-muted-foreground font-medium text-sm">Cấu hình biểu thuế lũy tiến và định mức giảm trừ gia cảnh (UC04/05/06)</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        {/* Left Column: Tax Tiers */}
        <section className="xl:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                        <TrendingUp size={20} />
                    </div>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">Biểu thuế <span className="text-primary italic">Lũy tiến</span></h2>
                </div>
                <Button variant="outline" onClick={handleAddTier} className="rounded-xl font-black text-[10px] uppercase gap-2 h-9 border-slate-200">
                    <Plus size={14}/> Thêm bậc mới
                </Button>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center w-20 pl-10">Bậc</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Cận dưới (VNĐ)</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Cận trên (VNĐ)</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center w-32">Thuế suất (%)</th>
                            <th className="px-8 py-5 text-center w-20 pr-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                    {tiers.map((t, i) => (
                        <tr key={i} className="group hover:bg-slate-50/50 transition-all">
                            <td className="px-8 py-4 text-center pl-10">
                                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center font-black text-slate-400 border border-slate-100 group-hover:bg-primary group-hover:text-white transition-all">
                                    {i+1}
                                </div>
                            </td>
                            <td className="px-8 py-4">
                                <Input 
                                    type="number" 
                                    className="h-11 rounded-1.5xl bg-slate-50/50 border-transparent focus:bg-white focus:border-primary/20 font-black text-slate-700"
                                    value={t.lowerBound} 
                                    onChange={e => {
                                        const newTiers = [...tiers]; newTiers[i].lowerBound = Number(e.target.value); setTiers(newTiers);
                                    }} 
                                />
                            </td>
                            <td className="px-8 py-4">
                                <Input 
                                    type="number" 
                                    className="h-11 rounded-1.5xl bg-slate-50/50 border-transparent focus:bg-white focus:border-primary/20 font-black text-slate-700"
                                    value={t.upperBound} 
                                    onChange={e => {
                                        const newTiers = [...tiers]; newTiers[i].upperBound = Number(e.target.value); setTiers(newTiers);
                                    }} 
                                />
                            </td>
                            <td className="px-8 py-4 text-center">
                                <div className="flex items-center gap-2 justify-center">
                                    <Input 
                                        type="number" 
                                        className="h-11 w-20 rounded-1.5xl bg-slate-50/50 border-transparent text-center font-black text-primary focus:bg-white focus:border-primary/20"
                                        value={t.taxRate} 
                                        onChange={e => {
                                            const newTiers = [...tiers]; newTiers[i].taxRate = Number(e.target.value); setTiers(newTiers);
                                        }} 
                                    />
                                    <span className="font-black text-slate-300">%</span>
                                </div>
                            </td>
                            <td className="px-8 py-4 text-center pr-10">
                                <button 
                                    onClick={() => setTiers(tiers.filter((_, idx)=>idx!==i))}
                                    className="p-2 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-all"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                <div className="p-8 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-[10px] text-slate-400 font-bold uppercase italic">* Nhập cận trên là 0 để hiểu là không giới hạn (Bậc cao nhất)</p>
                    <Button 
                        onClick={handleSaveTax}
                        className="h-12 px-10 rounded-2xl bg-[#111827] hover:bg-black text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 transition-all active:scale-95"
                    >
                        <Save size={16} className="mr-2" /> Lưu biểu thuế
                    </Button>
                </div>
            </div>
        </section>

        {/* Right Column: Deductions */}
        <section className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-200">
                    <ShieldCheck size={20} />
                </div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">Giảm trừ <span className="text-orange-500 italic">Gia cảnh</span></h2>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 space-y-8">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Bản thân (VNĐ/tháng)</label>
                        <Input 
                            type="number" 
                            className="h-14 rounded-2xl bg-slate-50 border-slate-200 focus:bg-white text-lg font-black text-slate-800"
                            value={deductions.personalDeduction} 
                            onChange={e => setDeductions({...deductions, personalDeduction: Number(e.target.value)})} 
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Người phụ thuộc (VNĐ/tháng)</label>
                        <Input 
                            type="number" 
                            className="h-14 rounded-2xl bg-slate-50 border-slate-200 focus:bg-white text-lg font-black text-slate-800"
                            value={deductions.dependentDeduction} 
                            onChange={e => setDeductions({...deductions, dependentDeduction: Number(e.target.value)})} 
                        />
                    </div>
                </div>

                <Button 
                    onClick={handleSaveDeduction}
                    className="w-full h-14 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-orange-500/20 transition-all active:scale-95"
                >
                    <Save size={16} className="mr-2" /> Lưu định mức
                </Button>

                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
                    <Info className="text-amber-500 w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-[10px] text-amber-700 font-bold uppercase leading-relaxed">Luật Thuế TNCN hiện hành:</p>
                        <p className="text-[9px] text-amber-600/80 font-medium leading-relaxed italic mt-1">Nghị quyết 954/2020/UBTVQH14 điều chỉnh mức giảm trừ gia cảnh lên 11tr cho người nộp thuế và 4.4tr cho mỗi người phụ thuộc.</p>
                    </div>
                </div>
            </div>
        </section>
      </div>
    </div>
  )
}
