import { useState, useEffect, useCallback, useMemo } from "react"
import axios from "axios"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { 
    Settings, ShieldCheck, Calculator, Save, Plus, Trash2, Pencil,
    Info, AlertCircle, CheckCircle2, AlertTriangle
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { SalaryParameter, InsuranceRate, TaxTier, DeductionSetting } from "../types"

export default function SalaryConfigPage() {
  const [activeTab, setActiveTab] = useState<"params" | "insurance" | "tax">("params")
  const headers = useMemo(() => ({ 
    Authorization: `Bearer ${localStorage.getItem("token")}` 
  }), [])

  // --- State for System Params ---
  const [params, setParams] = useState<SalaryParameter>({ standardWorkDays: 26, standardWorkDayMode: 'FIXED', minimumWage: 1800000, mealAllowance: 25000 })
  
  // --- State for Insurance Rates ---
  const [rates, setRates] = useState<InsuranceRate[]>([])
  const [newRate, setNewRate] = useState<Omit<InsuranceRate, "id">>({ type: "", employeeRate: 0, employerRate: 0, effectiveDate: "" })
  const [editingRate, setEditingRate] = useState<InsuranceRate | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  
  // --- State for Tax Config ---
  const [taxTiers, setTaxTiers] = useState<TaxTier[]>([])
  const [deductions, setDeductions] = useState<DeductionSetting>({ personalDeduction: 15500000, dependentDeduction: 6200000 })

  const [loading, setLoading] = useState(true)
  const [userRoles, setUserRoles] = useState<string[]>([])
  const [message, setMessage] = useState<{ text: string, type: "success" | "info" | "error" } | null>(null)

  const showMsg = useCallback((text: string, type: "success" | "info" | "error" = "success") => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 5000)
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const payload = JSON.parse(atob(token!.split(".")[1]))
      setUserRoles(payload.roles || [])

      const [resParams, resRates, resTax, resDed] = await Promise.all([
        axios.get("/api/config/params", { headers }),
        axios.get("/api/config/insurance", { headers }),
        axios.get("/api/config/tax", { headers }),
        axios.get("/api/config/deductions", { headers })
      ])

      const p = resParams.data.find((x: SalaryParameter) => x.status === 'PENDING') || resParams.data.find((x: SalaryParameter) => x.status === 'APPROVED')
      if (p) {
        setParams(p)
      } else {
        setParams({ standardWorkDays: 26, standardWorkDayMode: 'FIXED', minimumWage: 1800000, mealAllowance: 25000, status: 'APPROVED' })
      }
      
      setRates(resRates.data)
      setTaxTiers(resTax.data)
      
      const d = resDed.data.find((x: DeductionSetting) => x.status === 'PENDING') || resDed.data.find((x: DeductionSetting) => x.status === 'APPROVED')
      if (d) {
        setDeductions(d)
      } else {
        setDeductions({ personalDeduction: 11000000, dependentDeduction: 4400000, status: 'APPROVED' })
      }

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      showMsg("Lỗi tải dữ liệu: " + message, "error")
    } finally {
      setLoading(false)
    }
  }, [headers, showMsg])

  useEffect(() => { fetchData() }, [fetchData])

  // --- Handlers ---
  const saveParams = async () => {
    try {
      const res = await axios.post("/api/config/params", params, { headers })
      if (res.data.status === 'PENDING') {
        showMsg("Đã gửi đề xuất thay đổi tham số. Chờ Kế toán trưởng phê duyệt.", "info")
      } else {
        showMsg("Cập nhật tham số hệ thống thành công!")
      }
      fetchData()
    } catch (err: unknown) { 
        const message = err instanceof Error ? err.message : String(err)
        showMsg(message, "error") 
    }
  }

  const approveParams = async (id?: number) => {
    if(!id) return
    try {
        await axios.post(`/api/config/params/${id}/approve`, {}, { headers })
        showMsg("Đã phê duyệt tham số hệ thống!")
        fetchData()
    } catch (err: unknown) { 
        const message = err instanceof Error ? err.message : String(err)
        showMsg(message, "error") 
    }
  }

  const rejectParams = async (id?: number) => {
    if(!id) return
    try {
        await axios.post(`/api/config/params/${id}/reject`, {}, { headers })
        showMsg("Đã bác bỏ thay đổi tham số!", "info")
        fetchData()
    } catch (err: unknown) { 
        const message = err instanceof Error ? err.message : String(err)
        showMsg(message, "error") 
    }
  }

  const saveRate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await axios.post("/api/config/insurance", newRate, { headers })
      setNewRate({ type: "", employeeRate: 0, employerRate: 0, effectiveDate: "" })
      if (res.data.status === 'PENDING') {
        showMsg("Đã gửi đề xuất thêm bảo hiểm. Chờ phê duyệt.", "info")
      } else {
        showMsg("Thêm tỷ lệ bảo hiểm mới thành công!")
      }
      fetchData()
    } catch (err: unknown) { 
        const message = err instanceof Error ? err.message : String(err)
        showMsg(message, "error") 
    }
  }

  const approveRate = async (id: number) => {
    try {
        await axios.post(`/api/config/insurance/${id}/approve`, {}, { headers })
        showMsg("Đã phê duyệt tỷ lệ bảo hiểm!")
        fetchData()
    } catch (err: unknown) { 
        const message = err instanceof Error ? err.message : String(err)
        showMsg(message, "error") 
    }
  }

  const rejectRate = async (id: number) => {
    try {
        await axios.post(`/api/config/insurance/${id}/reject`, {}, { headers })
        showMsg("Đã bác bỏ thay đổi tỷ lệ bảo hiểm!", "info")
        fetchData()
    } catch (err: unknown) { 
        const message = err instanceof Error ? err.message : String(err)
        showMsg(message, "error") 
    }
  }

  const deleteRate = async (id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa tỷ lệ bảo hiểm này?")) return
    try {
        await axios.delete(`/api/config/insurance/${id}`, { headers })
        showMsg("Đã xóa tỷ lệ bảo hiểm!")
        fetchData()
    } catch (err: unknown) { 
        const message = err instanceof Error ? err.message : String(err)
        showMsg(message, "error") 
    }
  }

  const handleEditRate = (rate: InsuranceRate) => {
    setEditingRate({ ...rate })
    setIsEditModalOpen(true)
  }

  const updateRate = async () => {
    if (!editingRate?.id) return
    try {
        const res = await axios.put(`/api/config/insurance/${editingRate.id}`, editingRate, { headers })
        setIsEditModalOpen(false)
        if (res.data.status === 'PENDING') {
            showMsg("Đã gửi đề xuất cập nhật bảo hiểm. Chờ phê duyệt.", "info")
        } else {
            showMsg("Cập nhật tỷ lệ bảo hiểm thành công!")
        }
        fetchData()
    } catch (err: unknown) { 
        const message = err instanceof Error ? err.message : String(err)
        showMsg(message, "error") 
    }
  }

  const saveTax = async () => {
    try {
      const [resTax, resDed] = await Promise.all([
        axios.post("/api/config/tax", taxTiers, { headers }),
        axios.post("/api/config/deductions", deductions, { headers })
      ])
      if (resTax.data[0]?.status === 'PENDING' || resDed.data.status === 'PENDING') {
        showMsg("Đã gửi đề xuất biểu thuế & giảm trừ. Chờ phê duyệt.", "info")
      } else {
        showMsg("Cập nhật biểu thuế & giảm trừ thành công!")
      }
      fetchData()
    } catch (err: unknown) { 
        const message = err instanceof Error ? err.message : String(err)
        showMsg(message, "error") 
    }
  }

  const approveTax = async () => {
    try {
        await Promise.all([
            axios.post(`/api/config/tax/approve`, {}, { headers }),
            axios.post(`/api/config/deductions/${deductions.id}/approve`, {}, { headers })
        ])
        showMsg("Đã phê duyệt biểu thuế & định mức giảm trừ!")
        fetchData()
    } catch (err: unknown) { 
        const message = err instanceof Error ? err.message : String(err)
        showMsg(message, "error") 
    }
  }

  const rejectTax = async () => {
    try {
        await Promise.all([
            axios.post(`/api/config/tax/reject`, {}, { headers }),
            axios.post(`/api/config/deductions/${deductions.id}/reject`, {}, { headers })
        ])
        showMsg("Đã bác bỏ thay đổi biểu thuế & giảm trừ!", "info")
        fetchData()
    } catch (err: unknown) { 
        const message = err instanceof Error ? err.message : String(err)
        showMsg(message, "error") 
    }
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
                onClick={() => setActiveTab(t.id as "params" | "insurance" | "tax")}
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
                                <div className="flex items-center gap-2">
                                    <h3 className="text-xl font-black text-slate-800">Tham số hằng số</h3>
                                    {params.status === 'PENDING' ? (
                                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest border border-amber-200">Chờ duyệt</span>
                                    ) : (
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest border border-emerald-200">Đang áp dụng</span>
                                    )}
                                </div>
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
                                        min={0}
                                        className="h-14 rounded-2xl bg-slate-50 border-slate-200 focus:bg-white text-lg font-black text-slate-800"
                                        value={params.standardWorkDays} 
                                        onChange={e => {
                                            e.target.value = e.target.value.replace(/^0+(?!$)/, '');
                                            setParams({...params, standardWorkDays: Math.max(0, Number(e.target.value))});
                                        }} 
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
                                    min={0}
                                    className="h-14 rounded-2xl bg-slate-50 border-slate-200 focus:bg-white text-lg font-black text-slate-800"
                                    value={params.minimumWage} 
                                    onChange={e => {
                                        e.target.value = e.target.value.replace(/^0+(?!$)/, '');
                                        setParams({...params, minimumWage: Math.max(0, Number(e.target.value))});
                                    }} 
                                />
                                <p className="text-[10px] text-slate-400 pl-2">Mức lương vùng/cơ sở áp dụng cho DN</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Phụ cấp ăn ca (VNĐ/ngày)</label>
                                <Input 
                                    type="number" 
                                    min={0}
                                    className="h-14 rounded-2xl bg-slate-50 border-slate-200 focus:bg-white text-lg font-black text-slate-800"
                                    value={params.mealAllowance} 
                                    onChange={e => {
                                        e.target.value = e.target.value.replace(/^0+(?!$)/, '');
                                        setParams({...params, mealAllowance: Math.max(0, Number(e.target.value))});
                                    }} 
                                />
                                <p className="text-[10px] text-slate-400 pl-2">Mức tối đa ko tính PIT là 730k/tháng</p>
                            </div>
                        </div>

                        <div className="pt-6 flex items-center gap-4">
                            {(params.status === 'PENDING' && (userRoles.includes("ROLE_KE_TOAN_TRUONG") || userRoles.includes("ROLE_ADMIN"))) ? (
                                <div className="flex gap-4">
                                    <Button 
                                        onClick={() => approveParams(params.id)} 
                                        className="gap-2 h-14 px-10 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-200 font-black text-sm transition-all hover:scale-105 active:scale-95"
                                    >
                                        <CheckCircle2 size={18} /> PHÊ DUYỆT
                                    </Button>
                                    <Button 
                                        onClick={() => rejectParams(params.id)} 
                                        variant="outline"
                                        className="gap-2 h-14 px-10 rounded-2xl border-red-200 text-red-600 hover:bg-red-50 font-black text-sm transition-all hover:scale-105 active:scale-95"
                                    >
                                        <AlertCircle size={18} /> TỪ CHỐI
                                    </Button>
                                </div>
                            ) : (
                                <Button onClick={saveParams} className="gap-2 h-14 px-10 rounded-2xl bg-[#111827] hover:bg-black text-white shadow-xl shadow-slate-200 font-black text-sm transition-all hover:scale-105 active:scale-95">
                                    <Save size={18} /> {userRoles.includes("ROLE_ADMIN") ? "LƯU THAY ĐỔI NGAY" : "GỬI ĐỀ XUẤT THAY ĐỔI"}
                                </Button>
                            )}
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
                                        <Input type="number" min={0} step="0.1" className="h-11 rounded-1.5xl bg-white" value={newRate.employeeRate} onChange={e => {
                                            e.target.value = e.target.value.replace(/^0+(?!$)/, '');
                                            setNewRate({...newRate, employeeRate: Math.max(0, Number(e.target.value))});
                                        }} required />
                                    </div>
                                    <div className="space-y-1.5 text-xs">
                                        <label className="font-bold text-slate-600 pl-1">Doanh nghiệp đóng (%)</label>
                                        <Input type="number" min={0} step="0.1" className="h-11 rounded-1.5xl bg-white" value={newRate.employerRate} onChange={e => {
                                            e.target.value = e.target.value.replace(/^0+(?!$)/, '');
                                            setNewRate({...newRate, employerRate: Math.max(0, Number(e.target.value))});
                                        }} required />
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
                                                <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-center">Trạng thái</th>
                                                <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-center">Hành động</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {rates.map((r, i) => (
                                                <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4 font-black text-slate-800 text-base">{r.type}</td>
                                                    <td className="px-6 py-4 text-center font-bold text-blue-600">{r.employeeRate}%</td>
                                                    <td className="px-6 py-4 text-center font-bold text-indigo-600">{r.employerRate}%</td>
                                                    <td className="px-6 py-4 text-center text-xs font-medium text-slate-500">{r.effectiveDate}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex flex-col items-center gap-2">
                                                            {r.status === 'PENDING' ? (
                                                                <div className="flex flex-col items-center gap-1">
                                                                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest">Chờ duyệt</span>
                                                                    {(userRoles.includes("ROLE_KE_TOAN_TRUONG") || userRoles.includes("ROLE_ADMIN")) && (
                                                                        <div className="flex gap-2">
                                                                            <button onClick={() => r.id && approveRate(r.id)} className="text-[10px] font-black text-emerald-600 uppercase hover:underline">Duyệt</button>
                                                                            <button onClick={() => r.id && rejectRate(r.id)} className="text-[10px] font-black text-red-600 uppercase hover:underline">Bác bỏ</button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest">Áp dụng</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button 
                                                                onClick={() => handleEditRate(r)}
                                                                className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors"
                                                                title="Chỉnh sửa"
                                                            >
                                                                <Pencil size={16} />
                                                            </button>
                                                            <button 
                                                                onClick={() => r.id && deleteRate(r.id)}
                                                                className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-red-600 transition-colors"
                                                                title="Xóa"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
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
                                    <div className="flex items-center justify-between px-2">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</span>
                                        {deductions.status === 'PENDING' ? (
                                            <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest animate-pulse">Đang chờ duyệt</span>
                                        ) : (
                                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Hoạt động</span>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Giảm trừ Bản thân</label>
                                        <Input type="number" min={0} className="h-12 rounded-xl" value={deductions.personalDeduction} onChange={e => {
                                            e.target.value = e.target.value.replace(/^0+(?!$)/, '');
                                            setDeductions({...deductions, personalDeduction: Math.max(0, Number(e.target.value))});
                                        }} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Giảm trừ Phụ thuộc</label>
                                        <Input type="number" min={0} className="h-12 rounded-xl" value={deductions.dependentDeduction} onChange={e => {
                                            e.target.value = e.target.value.replace(/^0+(?!$)/, '');
                                            setDeductions({...deductions, dependentDeduction: Math.max(0, Number(e.target.value))});
                                        }} />
                                    </div>
                                    {(deductions.status === 'PENDING' && (userRoles.includes("ROLE_KE_TOAN_TRUONG") || userRoles.includes("ROLE_ADMIN"))) ? (
                                        <div className="flex flex-col gap-2">
                                            <Button onClick={approveTax} className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase shadow-lg shadow-emerald-200">
                                                PHÊ DUYỆT
                                            </Button>
                                            <Button onClick={rejectTax} variant="outline" className="w-full h-12 rounded-xl border-red-200 text-red-600 hover:bg-red-50 font-black text-xs uppercase">
                                                TỪ CHỐI
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button onClick={saveTax} className="w-full h-12 rounded-xl bg-[#111827] text-white font-black text-xs uppercase shadow-lg shadow-slate-200">
                                            {userRoles.includes("ROLE_ADMIN") ? "LƯU CẤU HÌNH NGAY" : "GỬI ĐỀ XUẤT CẬP NHẬT"}
                                        </Button>
                                    )}
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
                                        {taxTiers.some((x: TaxTier) => x.status === 'PENDING') && (
                                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest border border-amber-200">Dữ liệu nháp</span>
                                        )}
                                    </div>
                                    <Button variant="outline" onClick={() => setTaxTiers([...taxTiers, { lowerBound: 0, upperBound: 0, taxRate: 0, tierLevel: taxTiers.length + 1, status: 'PENDING' }])} className="rounded-xl font-black text-[10px] uppercase gap-2 h-9">
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
                                                        <Input type="number" min={0} className="h-9 border-none bg-transparent font-black text-slate-700" value={t.lowerBound} onChange={e => {
                                                            e.target.value = e.target.value.replace(/^0+(?!$)/, '');
                                                            const n = [...taxTiers]; n[i].lowerBound = Math.max(0, Number(e.target.value)); setTaxTiers(n);
                                                        }} />
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <Input type="number" min={0} className="h-9 border-none bg-transparent font-black text-slate-700" value={t.upperBound} onChange={e => {
                                                            e.target.value = e.target.value.replace(/^0+(?!$)/, '');
                                                            const n = [...taxTiers]; n[i].upperBound = Math.max(0, Number(e.target.value)); setTaxTiers(n);
                                                        }} />
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <div className="flex items-center gap-2 justify-center">
                                                            <Input type="number" min={0} className="h-9 w-16 border-none bg-slate-100/50 rounded-lg text-center font-black text-blue-600" value={t.taxRate} onChange={e => {
                                                                e.target.value = e.target.value.replace(/^0+(?!$)/, '');
                                                                const n = [...taxTiers]; n[i].taxRate = Math.max(0, Number(e.target.value)); setTaxTiers(n);
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

      {/* Modal Chỉnh sửa Tỉ lệ Bảo hiểm */}
      {isEditModalOpen && editingRate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-[#111827] text-white p-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                  <Pencil size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black">Chỉnh sửa Tỷ lệ Bảo hiểm</h3>
                  <p className="text-slate-400 text-xs font-medium">Cập nhật thông số đóng bảo hiểm</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Loại (VD: XH, YT, TN)</label>
                  <Input 
                    className="h-12 rounded-xl"
                    value={editingRate.type}
                    onChange={e => setEditingRate({...editingRate, type: e.target.value.toUpperCase()})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">NLĐ đóng (%)</label>
                  <Input 
                    type="number"
                    min={0}
                    className="h-12 rounded-xl font-bold text-blue-600"
                    value={editingRate.employeeRate}
                    onChange={e => {
                        e.target.value = e.target.value.replace(/^0+(?!$)/, '');
                        setEditingRate({...editingRate, employeeRate: Math.max(0, Number(e.target.value))});
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Doanh nghiệp đóng (%)</label>
                  <Input 
                    type="number"
                    min={0}
                    className="h-12 rounded-xl font-bold text-indigo-600"
                    value={editingRate.employerRate}
                    onChange={e => {
                        e.target.value = e.target.value.replace(/^0+(?!$)/, '');
                        setEditingRate({...editingRate, employerRate: Math.max(0, Number(e.target.value))});
                    }}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Ngày hiệu lực</label>
                  <Input 
                    type="date"
                    className="h-12 rounded-xl"
                    value={editingRate.effectiveDate}
                    onChange={e => setEditingRate({...editingRate, effectiveDate: e.target.value})}
                  />
                </div>
              </div>

              {userRoles.includes("ROLE_KE_TOAN_LUONG") && !userRoles.includes("ROLE_KE_TOAN_TRUONG") && !userRoles.includes("ROLE_ADMIN") && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 flex gap-3 text-amber-700">
                  <AlertTriangle size={20} className="shrink-0" />
                  <p className="text-[10px] font-bold leading-relaxed uppercase tracking-wider">Lưu ý: Thay đổi của bạn sẽ được gửi tới Kế toán trưởng phê duyệt trước khi có hiệu lực.</p>
                </div>
              )}

              <div className="flex gap-4 pt-2">
                <Button variant="outline" className="flex-1 h-12 rounded-xl font-black text-xs uppercase" onClick={() => setIsEditModalOpen(false)}>
                  Hủy bỏ
                </Button>
                <Button className="flex-1 h-12 rounded-xl bg-[#111827] text-white font-black text-xs uppercase shadow-lg shadow-slate-200" onClick={updateRate}>
                  Lưu thay đổi
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
