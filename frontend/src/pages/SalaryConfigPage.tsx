import { useState, useEffect } from "react"
import axios from "axios"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { 
    Settings, ShieldCheck, Calculator, Save, Plus, Trash2, 
    ChevronRight, Info, AlertCircle, CheckCircle2 
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function SalaryConfigPage() {
  const [activeTab, setActiveTab] = useState<"params" | "insurance" | "tax">("params")
  const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` }

  // --- State for System Params ---
  const [params, setParams] = useState<any>({ standardWorkDays: 26, minimumWage: 1800000, mealAllowance: 25000 })
  
  // --- State for Insurance Rates ---
  const [rates, setRates] = useState<any[]>([])
  const [newRate, setNewRate] = useState({ type: "", employeeRate: 0, employerRate: 0, effectiveDate: "" })
  
  // --- State for Tax Config ---
  const [taxTiers, setTaxTiers] = useState<any[]>([])
  const [deductions, setDeductions] = useState<any>({ personalDeduction: 15500000, dependentDeduction: 6200000 })

  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ text: string, type: "success" | "error" } | null>(null)

  const showMsg = (text: string, type: "success" | "error" = "success") => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 3000)
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const [resParams, resRates, resTax, resDed] = await Promise.all([
        axios.get("/api/config/params", { headers }),
        axios.get("/api/config/insurance", { headers }),
        axios.get("/api/config/tax", { headers }),
        axios.get("/api/config/deductions", { headers })
      ])

      if (resParams.data.length > 0) setParams(resParams.data[0])
      setRates(resRates.data)
      setTaxTiers(resTax.data)
      if (resDed.data.length > 0) setDeductions(resDed.data[0])
    } catch (err: any) {
      showMsg("Lỗi tải dữ liệu: " + err.message, "error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  // --- Handlers ---
  const saveParams = async () => {
    try {
      await axios.post("/api/config/params", params, { headers })
      showMsg("Cập nhật tham số hệ thống thành công!")
    } catch (err: any) { showMsg(err.message, "error") }
  }

  const saveRate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await axios.post("/api/config/insurance", newRate, { headers })
      setNewRate({ type: "", employeeRate: 0, employerRate: 0, effectiveDate: "" })
      fetchData()
      showMsg("Thêm tỷ lệ bảo hiểm mới thành công!")
    } catch (err: any) { showMsg(err.message, "error") }
  }

  const saveTax = async () => {
    try {
      await Promise.all([
        axios.post("/api/config/tax", taxTiers, { headers }),
        axios.post("/api/config/deductions", deductions, { headers })
      ])
      showMsg("Cập nhật biểu thuế & giảm trừ thành công!")
      fetchData()
    } catch (err: any) { showMsg(err.message, "error") }
  }

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4 animate-pulse">
        <Settings className="w-12 h-12 text-slate-200 animate-spin" />
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Đang tải cấu hình...</p>
    </div>
  )

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700 pb-20">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex flex-col gap-1">
            <h1 className="text-4xl font-black tracking-tighter text-slate-800 flex items-center gap-3 uppercase">
                <Settings className="w-10 h-10 text-primary" /> Cấu hình Lương
            </h1>
            <p className="text-muted-foreground font-medium text-sm">Thiết lập các tham số tài chính, bảo hiểm và biểu thuế TNCN</p>
        </div>
        
        <AnimatePresence>
            {message && (
                <motion.div 
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                    className={`px-6 py-3 rounded-2xl flex items-center gap-3 shadow-xl backdrop-blur-md border ${
                        message.type === "success" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-red-500/10 text-red-600 border-red-500/20"
                    }`}
                >
                    {message.type === "success" ? <CheckCircle2 className="w-5 h-5"/> : <AlertCircle className="w-5 h-5"/>}
                    <span className="font-black text-xs uppercase tracking-tight">{message.text}</span>
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      {/* Tabs Switcher */}
      <div className="flex p-1.5 bg-slate-100 rounded-2xl w-fit gap-1 shadow-inner">
        {[
            { id: "params", label: "Tham số Hệ thống", icon: Settings },
            { id: "insurance", label: "Tỷ lệ Bảo hiểm", icon: ShieldCheck },
            { id: "tax", label: "Biểu thuế TNCN", icon: Calculator }
        ].map(t => (
            <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all duration-500 ${
                    activeTab === t.id 
                        ? "bg-white text-primary shadow-xl shadow-slate-200" 
                        : "text-slate-400 hover:text-slate-600"
                }`}
            >
                <t.icon size={16} />
                <span className="uppercase tracking-widest">{t.label}</span>
            </button>
        ))}
      </div>

      {/* Tab Content Card */}
      <AnimatePresence mode="wait">
        <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="border border-slate-100 rounded-[2.5rem] bg-white shadow-2xl shadow-slate-200/50 overflow-hidden"
        >
            <div className="p-10">
                {activeTab === "params" && (
                    <div className="max-w-3xl space-y-10">
                        <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                <Settings size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-800">Tham số hằng số</h3>
                                <p className="text-muted-foreground text-xs font-medium">Định nghĩa các giá trị cơ bản cho việc tính toán lương hàng tháng</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Chế độ tính công chuẩn</label>
                                <div className="flex flex-col gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200">
                                    <button 
                                        onClick={() => setParams({...params, standardWorkDayMode: 'FIXED'})}
                                        className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${params.standardWorkDayMode === 'FIXED' ? 'bg-white shadow-md text-primary' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <span className="text-xs font-black uppercase tracking-tight">Cố định (VD: 26 ngày)</span>
                                        {params.standardWorkDayMode === 'FIXED' && <CheckCircle2 size={16} />}
                                    </button>
                                    <button 
                                        onClick={() => setParams({...params, standardWorkDayMode: 'MONTHLY'})}
                                        className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${params.standardWorkDayMode === 'MONTHLY' ? 'bg-white shadow-md text-primary' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <span className="text-xs font-black uppercase tracking-tight">Tự động theo tháng</span>
                                        {params.standardWorkDayMode === 'MONTHLY' && <CheckCircle2 size={16} />}
                                    </button>
                                </div>
                            </div>

                            {params.standardWorkDayMode === 'FIXED' ? (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Số công chuẩn (ngày)</label>
                                    <Input 
                                        type="number" 
                                        className="h-14 rounded-2xl bg-slate-50 border-slate-200 focus:bg-white text-lg font-black text-slate-800"
                                        value={params.standardWorkDays} 
                                        onChange={e => setParams({...params, standardWorkDays: Number(e.target.value)})} 
                                    />
                                    <p className="text-[10px] text-slate-400 pl-2">Thường là 26 ngày (Trừ Chủ Nhật)</p>
                                </div>
                            ) : (
                                <div className="space-y-4 p-6 bg-blue-50 border border-blue-100 rounded-3xl">
                                    <div className="flex items-center gap-3 text-blue-600">
                                        <Info size={20} />
                                        <span className="text-xs font-black uppercase">Chế độ tự động</span>
                                    </div>
                                    <p className="text-xs text-blue-700 leading-relaxed font-medium">Hệ thống sẽ tự động tính số ngày làm việc (T2 - T6) của từng tháng để làm căn cứ tính lương. Đơn giá ngày công sẽ thay đổi theo từng tháng.</p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Lương tối thiểu (VNĐ)</label>
                                <Input 
                                    type="number" 
                                    className="h-14 rounded-2xl bg-slate-50 border-slate-200 focus:bg-white text-lg font-black text-slate-800"
                                    value={params.minimumWage} 
                                    onChange={e => setParams({...params, minimumWage: Number(e.target.value)})} 
                                />
                                <p className="text-[10px] text-slate-400 pl-2">Mức lương vùng/cơ sở áp dụng cho DN</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Phụ cấp ăn ca (VNĐ/ngày)</label>
                                <Input 
                                    type="number" 
                                    className="h-14 rounded-2xl bg-slate-50 border-slate-200 focus:bg-white text-lg font-black text-slate-800"
                                    value={params.mealAllowance} 
                                    onChange={e => setParams({...params, mealAllowance: Number(e.target.value)})} 
                                />
                                <p className="text-[10px] text-slate-400 pl-2">Mức tối đa ko tính PIT là 730k/tháng</p>
                            </div>
                        </div>

                        <div className="pt-6">
                            <Button onClick={saveParams} className="gap-2 h-14 px-10 rounded-2xl bg-[#111827] hover:bg-black text-white shadow-xl shadow-slate-200 font-black text-sm transition-all hover:scale-105 active:scale-95">
                                <Save size={18} /> LƯU CẤU HÌNH HỆ THỐNG
                            </Button>
                        </div>
                    </div>
                )}

                {activeTab === "insurance" && (
                    <div className="space-y-10">
                        <div className="flex flex-col md:flex-row gap-10 items-start">
                            <form onSubmit={saveRate} className="w-full md:w-80 p-8 rounded-3xl bg-slate-50 border border-slate-200 space-y-6 shadow-sm">
                                <h4 className="font-black text-sm uppercase text-slate-500 tracking-tight flex items-center gap-2">
                                    <Plus size={16} className="text-primary"/> Thêm loại bảo hiểm
                                </h4>
                                <div className="space-y-4">
                                    <div className="space-y-1.5 text-xs">
                                        <label className="font-bold text-slate-600 pl-1">Loại bảo hiểm</label>
                                        <Input className="h-11 rounded-1.5xl bg-white" value={newRate.type} onChange={e => setNewRate({...newRate, type: e.target.value})} placeholder="BHXH, BHYT..." required />
                                    </div>
                                    <div className="space-y-1.5 text-xs">
                                        <label className="font-bold text-slate-600 pl-1">NLĐ đóng (%)</label>
                                        <Input type="number" step="0.1" className="h-11 rounded-1.5xl bg-white" value={newRate.employeeRate} onChange={e => setNewRate({...newRate, employeeRate: Number(e.target.value)})} required />
                                    </div>
                                    <div className="space-y-1.5 text-xs">
                                        <label className="font-bold text-slate-600 pl-1">Doanh nghiệp đóng (%)</label>
                                        <Input type="number" step="0.1" className="h-11 rounded-1.5xl bg-white" value={newRate.employerRate} onChange={e => setNewRate({...newRate, employerRate: Number(e.target.value)})} required />
                                    </div>
                                    <div className="space-y-1.5 text-xs">
                                        <label className="font-bold text-slate-600 pl-1">Ngày hiệu lực</label>
                                        <Input type="date" className="h-11 rounded-1.5xl bg-white" value={newRate.effectiveDate} onChange={e => setNewRate({...newRate, effectiveDate: e.target.value})} required />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20">
                                    Lưu thiết lập
                                </Button>
                            </form>

                            <div className="flex-1 space-y-6">
                                <div className="flex items-center gap-3">
                                    <ShieldCheck className="text-emerald-500 w-6 h-6" />
                                    <h3 className="text-xl font-black text-slate-800">Danh sách tỷ lệ trích nộp</h3>
                                </div>
                                <div className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm bg-slate-50/30">
                                    <table className="w-full text-sm text-left">
                                        <thead>
                                            <tr className="bg-[#111827] text-white">
                                                <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest">Loại</th>
                                                <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-center">NLĐ (%)</th>
                                                <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-center">DN (%)</th>
                                                <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-center">Hiệu lực</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {rates.map((r, i) => (
                                                <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4 font-black text-slate-800 text-base">{r.type}</td>
                                                    <td className="px-6 py-4 text-center font-bold text-blue-600">{r.employeeRate}%</td>
                                                    <td className="px-6 py-4 text-center font-bold text-indigo-600">{r.employerRate}%</td>
                                                    <td className="px-6 py-4 text-center text-xs font-medium text-slate-500">{r.effectiveDate}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-3">
                                    <Info className="text-amber-500 w-5 h-5 flex-shrink-0" />
                                    <p className="text-[10px] text-amber-700 font-bold uppercase leading-relaxed">Lưu ý: Tỷ lệ bảo hiểm được tính trên mức lương đóng bảo hiểm (thường là Lương hợp đồng + Các khoản phụ cấp chịu bảo hiểm).</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "tax" && (
                    <div className="space-y-12">
                        {/* Deductions Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                            <div className="lg:col-span-1 space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-200">
                                        <Calculator size={20} />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-800">Giảm trừ Gia cảnh</h3>
                                </div>
                                <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Giảm trừ Bản thân</label>
                                        <Input type="number" className="h-12 rounded-xl" value={deductions.personalDeduction} onChange={e => setDeductions({...deductions, personalDeduction: Number(e.target.value)})} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Giảm trừ Phụ thuộc</label>
                                        <Input type="number" className="h-12 rounded-xl" value={deductions.dependentDeduction} onChange={e => setDeductions({...deductions, dependentDeduction: Number(e.target.value)})} />
                                    </div>
                                    <Button onClick={saveTax} className="w-full h-12 rounded-xl bg-[#111827] text-white font-black text-xs uppercase shadow-lg shadow-slate-200">
                                        Cập nhật định mức
                                    </Button>
                                </div>
                            </div>

                            {/* Tax Tiers Table */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-200">
                                            <ShieldCheck size={20} />
                                        </div>
                                        <h3 className="text-xl font-black text-slate-800">Biểu thuế lũy tiến từng phần</h3>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => setTaxTiers([...taxTiers, { lowerBound: 0, upperBound: 0, taxRate: 0, tierLevel: taxTiers.length + 1 }])} className="rounded-xl font-black text-[10px] uppercase gap-2">
                                        <Plus size={14}/> Thêm bậc
                                    </Button>
                                </div>

                                <div className="border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                                    <table className="w-full text-xs">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="px-6 py-4 font-black uppercase text-slate-500 text-center w-20">Bậc</th>
                                                <th className="px-6 py-4 font-black uppercase text-slate-500">Cận dưới (VNĐ)</th>
                                                <th className="px-6 py-4 font-black uppercase text-slate-500">Cận trên (VNĐ)</th>
                                                <th className="px-6 py-4 font-black uppercase text-slate-500 text-center w-32">Thuế (%)</th>
                                                <th className="px-6 py-4 text-center w-20"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {taxTiers.map((t, i) => (
                                                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-3 text-center font-black text-slate-400">#{i+1}</td>
                                                    <td className="px-6 py-3">
                                                        <Input type="number" className="h-9 border-none bg-transparent font-black text-slate-700" value={t.lowerBound} onChange={e => {
                                                            const n = [...taxTiers]; n[i].lowerBound = Number(e.target.value); setTaxTiers(n);
                                                        }} />
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <Input type="number" className="h-9 border-none bg-transparent font-black text-slate-700" value={t.upperBound} onChange={e => {
                                                            const n = [...taxTiers]; n[i].upperBound = Number(e.target.value); setTaxTiers(n);
                                                        }} />
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <div className="flex items-center gap-2 justify-center">
                                                            <Input type="number" className="h-9 w-16 border-none bg-slate-100/50 rounded-lg text-center font-black text-blue-600" value={t.taxRate} onChange={e => {
                                                                const n = [...taxTiers]; n[i].taxRate = Number(e.target.value); setTaxTiers(n);
                                                            }} />
                                                            <span className="font-black text-slate-400">%</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3 text-center">
                                                        <button onClick={() => setTaxTiers(taxTiers.filter((_, idx)=>idx!==i))} className="text-red-300 hover:text-red-500 transition-colors">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="flex items-center justify-between pt-4">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase italic">* Nhập 0 cho Cận trên để hiểu là "Vô cực" (Bậc trên cùng)</p>
                                    <Button onClick={saveTax} className="h-12 px-10 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs shadow-lg shadow-orange-500/20">
                                        LƯU BIỂU THUẾ TNCN
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
