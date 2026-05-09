import { useState, useEffect, useCallback, useMemo } from "react"
import axios from "axios"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { 
    Settings, ShieldCheck, Calculator, Save, Plus, Trash2, Pencil,
    AlertCircle, CheckCircle2, RefreshCw
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { SalaryParameter, TaxTier, DeductionSetting, EmployeeTaxConfig, InsuranceConfig } from "../types"

// Mặc định 5 bậc thuế luỹ tiến từng phần theo quy định pháp luật
const DEFAULT_5_TAX_TIERS: TaxTier[] = [
  { lowerBound: 0, upperBound: 10000000, lowerBoundYearly: 0, upperBoundYearly: 120000000, taxRate: 5, tierLevel: 1, status: 'PENDING' },
  { lowerBound: 10000000, upperBound: 30000000, lowerBoundYearly: 120000000, upperBoundYearly: 360000000, taxRate: 10, tierLevel: 2, status: 'PENDING' },
  { lowerBound: 30000000, upperBound: 60000000, lowerBoundYearly: 360000000, upperBoundYearly: 720000000, taxRate: 20, tierLevel: 3, status: 'PENDING' },
  { lowerBound: 60000000, upperBound: 100000000, lowerBoundYearly: 720000000, upperBoundYearly: 1200000000, taxRate: 30, tierLevel: 4, status: 'PENDING' },
  { lowerBound: 100000000, upperBound: 999999999, lowerBoundYearly: 1200000000, upperBoundYearly: 999999999999, taxRate: 35, tierLevel: 5, status: 'PENDING' },
]

export default function SalaryConfigPage() {
  const [activeTab, setActiveTab] = useState<"params" | "insurance" | "tax">("params")
  const headers = useMemo(() => ({ 
    Authorization: `Bearer ${localStorage.getItem("token")}` 
  }), [])

  // --- State for System Params ---
  const [params, setParams] = useState<SalaryParameter>({ 
    standardWorkDays: 26, 
    standardWorkDayMode: 'FIXED', 
    baseSalary: 1800000, 
    minimumWage: 1800000,
    insuranceCeiling: 36000000, 
    mealAllowance: 25000 
  })
  
  // --- State for Insurance Config ---
  const [insuranceConfig, setInsuranceConfig] = useState<InsuranceConfig>({
    bhxhEmployee: 8.0, bhytEmployee: 1.5, bhtnEmployee: 1.0,
    bhxhEmployer: 17.5, bhytEmployer: 3.0, bhtnEmployer: 1.0, kpcdEmployer: 2.0,
    effectiveDate: new Date().toISOString().split('T')[0]
  })

  const [taxTiers, setTaxTiers] = useState<TaxTier[]>(DEFAULT_5_TAX_TIERS)
  const [deductions, setDeductions] = useState<DeductionSetting>({ personalDeduction: 15500000, dependentDeduction: 6200000 })
  const [taxRules, setTaxRules] = useState<EmployeeTaxConfig[]>([])

  const [loading, setLoading] = useState(true)
  const [userRoles, setUserRoles] = useState<string[]>([])
  const [message, setMessage] = useState<{ text: string, type: "success" | "info" | "error" } | null>(null)
  const [isDeductionEditing, setIsDeductionEditing] = useState(false)
  const [isPitEditing, setIsPitEditing] = useState(false)
  const [isInsuranceEditing, setIsInsuranceEditing] = useState(false)
  const [originalDeductions, setOriginalDeductions] = useState<DeductionSetting | null>(null)
  const [originalTaxTiers, setOriginalTaxTiers] = useState<TaxTier[] | null>(null)
  const [originalInsuranceConfig, setOriginalInsuranceConfig] = useState<InsuranceConfig | null>(null)

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

      const [resParams, resInsurance, resTax, resDed, resTaxRules] = await Promise.all([
        axios.get("/api/config/params", { headers }),
        axios.get("/api/config/insurance-config", { headers }),
        axios.get("/api/config/tax", { headers }),
        axios.get("/api/config/deductions", { headers }),
        axios.get("/api/config/tax-rules", { headers })
      ])

      const p = resParams.data.find((x: SalaryParameter) => x.status === 'PENDING') || resParams.data.find((x: SalaryParameter) => x.status === 'APPROVED')
      if (p) {
        setParams({
            ...p,
            insuranceCeiling: p.insuranceCeiling || (p.baseSalary * 20)
        })
      } else {
        setParams({ 
          standardWorkDays: 26, 
          standardWorkDayMode: 'FIXED', 
          baseSalary: 1800000, 
          minimumWage: 1800000,
          insuranceCeiling: 36000000, 
          mealAllowance: 25000, 
          status: 'APPROVED' 
        })
      }
      
      const currentInsurance = resInsurance.data.find((x: InsuranceConfig) => x.status === 'PENDING') || resInsurance.data.find((x: InsuranceConfig) => x.status === 'APPROVED')
      if (currentInsurance) {
        setInsuranceConfig(currentInsurance)
      }
      
      const allTax = resTax.data
      let finalTiers: TaxTier[] = []
      if (allTax.length === 0) {
          finalTiers = [...DEFAULT_5_TAX_TIERS]
      } else {
          const hasPendingTax = allTax.some((x: TaxTier) => x.status === 'PENDING')
          finalTiers = hasPendingTax 
            ? allTax.filter((x: TaxTier) => x.status === 'PENDING')
            : allTax.filter((x: TaxTier) => x.status === 'APPROVED')
      }
      setTaxTiers(finalTiers.map(t => ({
        ...t,
        lowerBoundYearly: t.lowerBoundYearly ?? (t.lowerBound * 12),
        upperBoundYearly: t.upperBoundYearly ?? (t.upperBound * 12)
      })))
      
      setTaxRules(resTaxRules.data)
      
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

  const saveInsuranceConfig = async () => {
    try {
      const res = await axios.post("/api/config/insurance-config", insuranceConfig, { headers })
      if (res.data.status === 'PENDING') {
        showMsg("Đã gửi đề xuất thay đổi tỷ lệ bảo hiểm. Chờ phê duyệt.", "info")
      } else {
        showMsg("Cập nhật tỷ lệ bảo hiểm thành công!")
      }
      setIsInsuranceEditing(false)
      fetchData()
    } catch (err: unknown) { 
        const message = err instanceof Error ? err.message : String(err)
        showMsg(message, "error") 
    }
  }

  const cancelInsuranceEdit = () => {
    if (originalInsuranceConfig) {
      setInsuranceConfig(originalInsuranceConfig)
    }
    setIsInsuranceEditing(false)
  }

  const approveInsuranceConfig = async (id?: number) => {
    if (!id) return
    try {
        await axios.post(`/api/config/insurance-config/${id}/approve`, {}, { headers })
        showMsg("Đã phê duyệt tỷ lệ bảo hiểm!")
        fetchData()
    } catch (err: unknown) { 
        const message = err instanceof Error ? err.message : String(err)
        showMsg(message, "error") 
    }
  }

  const rejectInsuranceConfig = async (id?: number) => {
    if (!id) return
    try {
        await axios.post(`/api/config/insurance-config/${id}/reject`, {}, { headers })
        showMsg("Đã bác bỏ thay đổi tỷ lệ bảo hiểm!", "info")
        fetchData()
    } catch (err: unknown) { 
        const message = err instanceof Error ? err.message : String(err)
        showMsg(message, "error") 
    }
  }

  const saveDeductions = async () => {
    try {
      const res = await axios.post("/api/config/deductions", deductions, { headers })
      if (res.data.status === 'PENDING') {
        showMsg("Đã gửi đề xuất định mức giảm trừ. Chờ phê duyệt.", "info")
      } else {
        showMsg("Cập nhật định mức giảm trừ thành công!")
      }
      setIsDeductionEditing(false)
      fetchData()
    } catch (err: unknown) { 
        const message = err instanceof Error ? err.message : String(err)
        showMsg(message, "error") 
    }
  }

  const cancelDeductionEdit = () => {
    if (originalDeductions) {
      setDeductions(originalDeductions)
    }
    setIsDeductionEditing(false)
  }

  const savePitTiers = async () => {
    try {
      // Đảm bảo tính liên tục của biểu thuế trước khi lưu
      const sortedTiers = [...taxTiers].sort((a,b) => a.tierLevel - b.tierLevel);
      for(let i = 1; i < sortedTiers.length; i++) {
        sortedTiers[i].lowerBound = sortedTiers[i-1].upperBound;
      }
      
      const res = await axios.post("/api/config/tax", sortedTiers, { headers })
      if (res.data[0]?.status === 'PENDING') {
        showMsg("Đã gửi đề xuất biểu thuế PIT. Chờ phê duyệt.", "info")
      } else {
        showMsg("Cập nhật biểu thuế PIT thành công!")
      }
      setIsPitEditing(false)
      fetchData()
    } catch (err: unknown) { 
        const message = err instanceof Error ? err.message : String(err)
        showMsg(message, "error") 
    }
  }

  const cancelPitEdit = () => {
    if (originalTaxTiers) {
      setTaxTiers(originalTaxTiers)
    }
    setIsPitEditing(false)
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

  const saveTaxRules = async () => {
    try {
      const res = await axios.post("/api/config/tax-rules", taxRules, { headers })
      if (res.data[0]?.status === 'PENDING') {
        showMsg("Đã gửi đề xuất cấu hình thuế. Chờ phê duyệt.", "info")
      } else {
        showMsg("Cập nhật cấu hình thuế thành công!")
      }
      fetchData()
    } catch (err: unknown) { 
        const message = err instanceof Error ? err.message : String(err)
        showMsg(message, "error") 
    }
  }

  const approveTaxRules = async () => {
    try {
        await axios.post(`/api/config/tax-rules/approve`, {}, { headers })
        showMsg("Đã phê duyệt cấu hình thuế TNCN!")
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
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3 leading-tight">
                <Settings className="w-10 h-10 text-primary" /> Cấu hình Lương
            </h1>
            <p className="text-muted-foreground font-medium text-sm">Thiết lập các tham số lương, bảo hiểm và biểu thuế TNCN</p>
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
                    <span className="font-bold text-xs uppercase tracking-tight">{message.text}</span>
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      {/* Tabs Switcher */}
      <div className="flex p-1.5 bg-slate-100 rounded-2xl w-fit gap-1 shadow-inner">
        {[
            { id: "params", label: "Tham số Hệ thống", icon: Settings },
            { id: "insurance", label: "Tỷ lệ Bảo hiểm", icon: ShieldCheck },
            { id: "tax", label: "Biểu thuế luỹ tiến", icon: Calculator }
        ].map(t => (
            <button
                key={t.id}
                onClick={() => setActiveTab(t.id as "params" | "insurance" | "tax")}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all duration-500 ${
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
                                    <h3 className="text-xl font-bold text-slate-800">Tham số tính lương</h3>
                                    {params.status === 'PENDING' ? (
                                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-widest border border-amber-200">Chờ duyệt</span>
                                    ) : (
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-widest border border-emerald-200">Đang áp dụng</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">Số công chuẩn (ngày)</label>
                                <Input 
                                    type="number" 
                                    min={0}
                                    className="h-14 rounded-2xl bg-slate-50 border-slate-200 focus:bg-white text-lg font-bold text-slate-800"
                                    value={params.standardWorkDays} 
                                    onChange={e => {
                                        e.target.value = e.target.value.replace(/^0+(?!$)/, '');
                                        setParams({...params, standardWorkDays: Math.max(0, Number(e.target.value))});
                                    }} 
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">Lương cơ sở (VNĐ)</label>
                                <Input 
                                    type="text" 
                                    className="h-14 rounded-2xl bg-slate-50 border-slate-200 focus:bg-white text-lg font-bold text-slate-800"
                                    value={new Intl.NumberFormat('vi-VN').format(params.baseSalary || 0)} 
                                    onChange={e => {
                                        const raw = e.target.value.replace(/\./g, '').replace(/[^0-9]/g, '');
                                        const val = Math.max(0, Number(raw));
                                        setParams({
                                            ...params, 
                                            baseSalary: val,
                                            minimumWage: val,
                                            insuranceCeiling: val * 20
                                        });
                                    }} 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">Mức trần đóng BHXH/BHYT (VNĐ)</label>
                                <Input 
                                    disabled
                                    className="h-14 rounded-2xl bg-slate-100 border-slate-200 text-lg font-bold text-slate-500 cursor-not-allowed"
                                    value={new Intl.NumberFormat('vi-VN').format(params.insuranceCeiling || 0)} 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">Phụ cấp ăn ca (VNĐ/ngày)</label>
                                <Input 
                                    type="text" 
                                    className="h-14 rounded-2xl bg-slate-50 border-slate-200 focus:bg-white text-lg font-bold text-slate-800"
                                    value={new Intl.NumberFormat('vi-VN').format(params.mealAllowance || 0)} 
                                    onChange={e => {
                                        const raw = e.target.value.replace(/\./g, '').replace(/[^0-9]/g, '');
                                        setParams({...params, mealAllowance: Math.max(0, Number(raw))});
                                    }} 
                                />
                            </div>
                        </div>

                        <div className="pt-6 flex items-center gap-4">
                            {(params.status === 'PENDING' && (userRoles.includes("ROLE_KE_TOAN_TRUONG") || userRoles.includes("ROLE_ADMIN"))) ? (
                                <div className="flex gap-4">
                                    <Button 
                                        onClick={() => approveParams(params.id)} 
                                        className="gap-2 h-14 px-10 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-200 font-bold text-sm transition-all hover:scale-105 active:scale-95"
                                    >
                                        <CheckCircle2 size={18} /> PHÊ DUYỆT
                                    </Button>
                                    <Button 
                                        onClick={() => rejectParams(params.id)} 
                                        variant="outline"
                                        className="gap-2 h-14 px-10 rounded-2xl border-red-200 text-red-600 hover:bg-red-50 font-bold text-sm transition-all hover:scale-105 active:scale-95"
                                    >
                                        <AlertCircle size={18} /> TỪ CHỐI
                                    </Button>
                                </div>
                            ) : (
                                <Button 
                                    onClick={saveParams}
                                    className="gap-2 h-14 px-10 rounded-2xl bg-[#111827] hover:bg-black text-white shadow-xl shadow-slate-200 font-bold text-sm"
                                >
                                    <Save size={18} /> {userRoles.includes("ROLE_ADMIN") ? "LƯU THAY ĐỔI NGAY" : "GỬI ĐỀ XUẤT THAY ĐỔI"}
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === "insurance" && (
                    <div className="space-y-10">
                        <div className="flex flex-col gap-8">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                                        <ShieldCheck size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Tỷ lệ trích nộp</h3>
                                            {insuranceConfig.status === 'PENDING' ? (
                                                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-widest border border-amber-200">Chờ duyệt</span>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-widest border border-emerald-200">Đang áp dụng</span>
                                            )}
                                            {!isInsuranceEditing && (
                                                <button onClick={() => {
                                                    setOriginalInsuranceConfig({...insuranceConfig});
                                                    setIsInsuranceEditing(true);
                                                }} className="ml-2 text-[10px] font-bold uppercase text-blue-600 hover:text-blue-700 flex items-center transition-all hover:scale-105">
                                                    <Pencil size={12} className="mr-1" /> Chỉnh sửa
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Tỷ lệ đóng BHXH, BHYT, BHTN & KPCĐ</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ngày hiệu lực:</label>
                                    <Input 
                                        type="date" 
                                        readOnly={!isInsuranceEditing}
                                        className={`h-10 w-44 rounded-xl font-bold text-sm transition-all ${!isInsuranceEditing ? 'bg-slate-200/50 border-slate-300 text-black opacity-100 cursor-default' : 'bg-slate-50 border-slate-200 focus:bg-white text-primary'}`}
                                        value={insuranceConfig.effectiveDate}
                                        onChange={e => setInsuranceConfig({...insuranceConfig, effectiveDate: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                {/* Employee Contribution */}
                                <div className="p-8 rounded-[2rem] bg-indigo-50/30 border border-indigo-100/50 space-y-6">
                                    <h4 className="text-base font-bold text-black flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500" /> Người lao động đóng (%)
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {[
                                            { label: "BHXH", key: "bhxhEmployee" as const },
                                            { label: "BHYT", key: "bhytEmployee" as const },
                                            { label: "BHTN", key: "bhtnEmployee" as const }
                                        ].map(item => (
                                            <div key={item.key} className="space-y-2">
                                                <label className="text-sm font-medium text-black pl-1">{item.label}</label>
                                                <div className="relative">
                                                    <Input 
                                                        type="number" min={0} step="0.01" 
                                                        readOnly={!isInsuranceEditing}
                                                        className={`h-14 rounded-2xl text-lg font-normal pr-14 transition-all ${!isInsuranceEditing ? 'bg-slate-200/50 border-slate-300 text-black opacity-100 cursor-default select-none' : 'bg-white border-indigo-100 focus:ring-indigo-500/10 text-black'}`}
                                                        value={insuranceConfig[item.key]}
                                                        onChange={e => setInsuranceConfig({...insuranceConfig, [item.key]: Math.max(0, Number(e.target.value))})}
                                                    />
                                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-normal text-black">%</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Employer Contribution */}
                                <div className="p-8 rounded-[2rem] bg-emerald-50/30 border border-emerald-100/50 space-y-6">
                                    <h4 className="text-base font-bold text-black flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500" /> Doanh nghiệp đóng (%)
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        {[
                                            { label: "BHXH", key: "bhxhEmployer" as const },
                                            { label: "BHYT", key: "bhytEmployer" as const },
                                            { label: "BHTN", key: "bhtnEmployer" as const },
                                            { label: "KPCĐ", key: "kpcdEmployer" as const }
                                        ].map(item => (
                                            <div key={item.key} className="space-y-2">
                                                <label className="text-sm font-medium text-black pl-1">{item.label}</label>
                                                <div className="relative">
                                                    <Input 
                                                        type="number" min={0} step="0.01" 
                                                        readOnly={!isInsuranceEditing}
                                                        className={`h-14 rounded-2xl text-lg font-normal pr-14 transition-all ${!isInsuranceEditing ? 'bg-slate-200/50 border-slate-300 text-black opacity-100 cursor-default select-none' : 'bg-white border-emerald-100 focus:ring-emerald-500/10 text-black'}`}
                                                        value={insuranceConfig[item.key]}
                                                        onChange={e => setInsuranceConfig({...insuranceConfig, [item.key]: Math.max(0, Number(e.target.value))})}
                                                    />
                                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-normal text-black">%</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                {isInsuranceEditing ? (
                                    <div className="flex gap-4">
                                        <Button 
                                            onClick={saveInsuranceConfig}
                                            className="gap-2 h-14 px-10 rounded-2xl bg-[#111827] hover:bg-black text-white shadow-xl shadow-slate-200 font-bold text-sm flex items-center transition-all hover:scale-105 active:scale-95"
                                        >
                                            <Save size={18} /> {userRoles.includes("ROLE_ADMIN") ? "LƯU THAY ĐỔI NGAY" : "GỬI ĐỀ XUẤT THAY ĐỔI"}
                                        </Button>
                                        <Button 
                                            onClick={cancelInsuranceEdit}
                                            variant="outline"
                                            className="gap-2 h-14 px-10 rounded-2xl border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-sm transition-all hover:scale-105 active:scale-95"
                                        >
                                            Hủy bỏ
                                        </Button>
                                    </div>
                                ) : (
                                    (insuranceConfig.status === 'PENDING' && (userRoles.includes("ROLE_KE_TOAN_TRUONG") || userRoles.includes("ROLE_ADMIN"))) && (
                                        <div className="flex gap-4">
                                            <Button 
                                                onClick={() => approveInsuranceConfig(insuranceConfig.id)} 
                                                className="gap-2 h-14 px-10 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-200 font-bold text-sm transition-all hover:scale-105 active:scale-95"
                                            >
                                                <CheckCircle2 size={18} /> PHÊ DUYỆT CẤU HÌNH
                                            </Button>
                                            <Button 
                                                onClick={() => rejectInsuranceConfig(insuranceConfig.id)} 
                                                variant="outline"
                                                className="gap-2 h-14 px-10 rounded-2xl border-red-200 text-red-600 hover:bg-red-50 font-bold text-sm transition-all hover:scale-105 active:scale-95"
                                            >
                                                <AlertCircle size={18} /> TỪ CHỐI
                                            </Button>
                                        </div>
                                    )
                                )}
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
                                    <h3 className="text-xl font-bold text-slate-800">Giảm trừ Gia cảnh</h3>
                                    {!isDeductionEditing && (
                                        <button onClick={() => {
                                            setOriginalDeductions({...deductions});
                                            setIsDeductionEditing(true);
                                        }} className="text-[10px] font-bold uppercase text-blue-600 hover:text-blue-700 flex items-center">
                                            <Pencil size={12} className="mr-1" /> Chỉnh sửa
                                        </button>
                                    )}
                                </div>
                                <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 space-y-6">
                                    <div className="flex items-center justify-between px-2">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trạng thái</span>
                                        {deductions.status === 'PENDING' ? (
                                            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest animate-pulse">Đang chờ duyệt</span>
                                        ) : (
                                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Hoạt động</span>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">Giảm trừ Bản thân</label>
                                        <Input type="text" className="h-12 rounded-xl" value={new Intl.NumberFormat('vi-VN').format(deductions.personalDeduction || 0)} disabled={!isDeductionEditing} onChange={e => {
                                            const raw = e.target.value.replace(/\./g, '').replace(/[^0-9]/g, '');
                                            setDeductions({...deductions, personalDeduction: Math.max(0, Number(raw))});
                                        }} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">Giảm trừ Phụ thuộc</label>
                                        <Input type="text" className="h-12 rounded-xl" value={new Intl.NumberFormat('vi-VN').format(deductions.dependentDeduction || 0)} disabled={!isDeductionEditing} onChange={e => {
                                            const raw = e.target.value.replace(/\./g, '').replace(/[^0-9]/g, '');
                                            setDeductions({...deductions, dependentDeduction: Math.max(0, Number(raw))});
                                        }} />
                                    </div>
                                    {isDeductionEditing && (
                                        <div className="flex gap-2">
                                            {(deductions.status === 'PENDING' && (userRoles.includes("ROLE_KE_TOAN_TRUONG") || userRoles.includes("ROLE_ADMIN"))) ? (
                                                <div className="flex flex-col w-full gap-2">
                                                    <Button onClick={approveTax} className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase shadow-lg shadow-emerald-200">
                                                        PHÊ DUYỆT
                                                    </Button>
                                                    <Button onClick={rejectTax} variant="outline" className="w-full h-12 rounded-xl border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs uppercase">
                                                        TỪ CHỐI
                                                    </Button>
                                                </div>
                                            ) : (
                                                <>
                                                    <Button variant="outline" onClick={cancelDeductionEdit} className="flex-1 h-12 rounded-xl font-bold text-xs uppercase">HỦY</Button>
                                                    <Button onClick={saveDeductions} className="flex-1 h-12 rounded-xl bg-[#111827] text-white font-bold text-xs uppercase shadow-lg shadow-slate-200">
                                                        {userRoles.includes("ROLE_ADMIN") ? "LƯU NGAY" : "GỬI ĐỀ XUẤT"}
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="lg:col-span-2 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-200">
                                            <ShieldCheck size={20} />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-800">Biểu thuế lũy tiến từng phần</h3>
                                        {taxTiers.some((x: TaxTier) => x.status === 'PENDING') && (
                                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-widest border border-amber-200">Dữ liệu nháp</span>
                                        )}
                                    </div>
                                    {isPitEditing && (
                                        <div className="flex items-center gap-2">
                                            <Button 
                                                variant="outline" 
                                                onClick={() => setTaxTiers([...DEFAULT_5_TAX_TIERS])} 
                                                className="rounded-xl font-bold text-[10px] uppercase gap-2 h-9 border-blue-100 text-blue-600 hover:bg-blue-50"
                                            >
                                                <RefreshCw size={14}/> Khôi phục chuẩn 5 bậc
                                            </Button>
                                            <Button variant="outline" onClick={() => setTaxTiers([...taxTiers, { lowerBound: 0, upperBound: 0, lowerBoundYearly: 0, upperBoundYearly: 0, taxRate: 0, tierLevel: taxTiers.length + 1, status: 'PENDING' }])} className="rounded-xl font-bold text-[10px] uppercase gap-2 h-9 border-slate-200 hover:bg-slate-50">
                                                <Plus size={14}/> Thêm bậc
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                <div className="border border-slate-400 shadow-sm overflow-hidden bg-white">
                                    <table className="w-full text-sm border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-400">
                                                <th className="px-4 py-4 font-semibold text-slate-800 text-center w-24 border-r border-slate-400 bg-slate-50">Bậc thuế</th>
                                                <th className="px-6 py-4 font-semibold text-slate-800 text-center border-r border-slate-400 bg-slate-50 leading-relaxed">
                                                    Phần thu nhập tính thuế/năm<br/><span className="text-sm font-normal text-slate-600 tracking-tight">(triệu đồng)</span>
                                                </th>
                                                <th className="px-6 py-4 font-semibold text-slate-800 text-center border-r border-slate-400 bg-slate-50 leading-relaxed">
                                                    Phần thu nhập tính thuế/tháng<br/><span className="text-sm font-normal text-slate-600 tracking-tight">(triệu đồng)</span>
                                                </th>
                                                <th className="px-4 py-4 font-semibold text-slate-800 text-center w-36 bg-slate-50 leading-relaxed">
                                                    Thuế suất<br/><span className="text-sm font-normal text-slate-600 tracking-tight">(%)</span>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-400">
                                            {[...taxTiers].sort((a,b)=>a.tierLevel - b.tierLevel).map((t) => {
                                                const minM_month = (t.lowerBound || 0) / 1000000;
                                                const maxM_month = (t.upperBound || 0) / 1000000;
                                                const minM_year = (t.lowerBoundYearly || 0) / 1000000;
                                                const maxM_year = (t.upperBoundYearly || 0) / 1000000;
                                                
                                                const renderText = (min: number, max: number) => {
                                                    if (min === 0) return `Đến ${max}`;
                                                    if (max > 900) return `Trên ${min}`;
                                                    return `Trên ${min} đến ${max}`;
                                                };

                                                return (
                                                <tr key={t.tierLevel} className="hover:bg-slate-50/50 transition-colors text-slate-900">
                                                    <td className="px-4 py-4 text-center font-medium border-r border-slate-400">{t.tierLevel}</td>
                                                    
                                                    {/* Thu nhập Năm */}
                                                    <td className="px-6 py-4 text-left border-r border-slate-400">
                                                        {isPitEditing ? (
                                                            <div className="flex items-center gap-2 w-full justify-center">
                                                                  <Input 
                                                                      type="number" 
                                                                      className="h-9 w-20 text-center border-slate-300" 
                                                                      value={minM_year} 
                                                                      onChange={e => {
                                                                          const val = Number(e.target.value) * 1000000;
                                                                          const monthlyVal = val / 12;
                                                                          const n = taxTiers.map(tier => {
                                                                              if (tier.tierLevel === t.tierLevel) return { ...tier, lowerBoundYearly: val, lowerBound: monthlyVal };
                                                                              if (tier.tierLevel === t.tierLevel - 1) return { ...tier, upperBoundYearly: val, upperBound: monthlyVal };
                                                                              return tier;
                                                                          });
                                                                          setTaxTiers(n);
                                                                      }} 
                                                                  />
                                                                  <span className="text-slate-500 font-medium whitespace-nowrap">-</span>
                                                                  <Input 
                                                                      type="number" 
                                                                      className="h-9 w-20 text-center border-slate-300" 
                                                                      value={maxM_year > 900 ? 999 : maxM_year} 
                                                                      onChange={e => {
                                                                          const val = Number(e.target.value) * 1000000;
                                                                          const monthlyVal = val / 12;
                                                                          const n = taxTiers.map(tier => {
                                                                              if (tier.tierLevel === t.tierLevel) return { ...tier, upperBoundYearly: val, upperBound: monthlyVal };
                                                                              if (tier.tierLevel === t.tierLevel + 1) return { ...tier, lowerBoundYearly: val, lowerBound: monthlyVal };
                                                                              return tier;
                                                                          });
                                                                          setTaxTiers(n);
                                                                      }} 
                                                                  />
                                                            </div>
                                                        ) : (
                                                            renderText(minM_year, maxM_year)
                                                        )}
                                                    </td>

                                                    {/* Thu nhập Tháng */}
                                                    <td className="px-6 py-4 text-left border-r border-slate-400">
                                                        {isPitEditing ? (
                                                            <div className="flex items-center gap-2 w-full justify-center">
                                                                  <Input 
                                                                      type="number" 
                                                                      className="h-9 w-20 text-center border-slate-300" 
                                                                      value={minM_month} 
                                                                      onChange={e => {
                                                                          const val = Number(e.target.value) * 1000000;
                                                                          const yearlyVal = val * 12;
                                                                          const n = taxTiers.map(tier => {
                                                                              if (tier.tierLevel === t.tierLevel) return { ...tier, lowerBound: val, lowerBoundYearly: yearlyVal };
                                                                              if (tier.tierLevel === t.tierLevel - 1) return { ...tier, upperBound: val, upperBoundYearly: yearlyVal };
                                                                              return tier;
                                                                          });
                                                                          setTaxTiers(n);
                                                                      }} 
                                                                  />
                                                                  <span className="text-slate-500 font-medium whitespace-nowrap">-</span>
                                                                  <Input 
                                                                      type="number" 
                                                                      className="h-9 w-20 text-center border-slate-300" 
                                                                      value={maxM_month > 900 ? 999 : maxM_month} 
                                                                      onChange={e => {
                                                                          const val = Number(e.target.value) * 1000000;
                                                                          const yearlyVal = val * 12;
                                                                          const n = taxTiers.map(tier => {
                                                                              if (tier.tierLevel === t.tierLevel) return { ...tier, upperBound: val, upperBoundYearly: yearlyVal };
                                                                              if (tier.tierLevel === t.tierLevel + 1) return { ...tier, lowerBound: val, lowerBoundYearly: yearlyVal };
                                                                              return tier;
                                                                          });
                                                                          setTaxTiers(n);
                                                                      }} 
                                                                  />
                                                            </div>
                                                        ) : (
                                                            renderText(minM_month, maxM_month)
                                                        )}
                                                    </td>

                                                    {/* Thuế suất */}
                                                    <td className="px-4 py-4 text-center">
                                                        <div className="flex items-center gap-2 justify-center">
                                                            {isPitEditing ? (
                                                                <>
                                                                    <Input 
                                                                        type="number" 
                                                                        className="h-9 w-16 text-center border-slate-300 font-bold text-blue-700" 
                                                                        value={t.taxRate} 
                                                                        onChange={e => {
                                                                            const val = Math.max(0, Number(e.target.value));
                                                                            const n = taxTiers.map(tier => 
                                                                                tier.tierLevel === t.tierLevel ? { ...tier, taxRate: val } : tier
                                                                            );
                                                                            setTaxTiers(n);
                                                                        }} 
                                                                    />
                                                                    <button onClick={() => setTaxTiers(taxTiers.filter(x => x.tierLevel !== t.tierLevel))} className="text-red-400 hover:text-red-600 transition-colors">
                                                                        <Trash2 size={18} />
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <span className="font-semibold text-slate-800">{t.taxRate}</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )})}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="flex items-center justify-end pt-4 gap-3">
                                    {!isPitEditing ? (
                                        <Button onClick={() => {
                                            setOriginalTaxTiers([...taxTiers]);
                                            setIsPitEditing(true);
                                        }} className="h-12 px-8 rounded-xl bg-slate-800 hover:bg-black text-white font-bold text-xs uppercase shadow-lg shadow-slate-200 flex items-center gap-2">
                                            <Pencil size={14} /> CHỈNH SỬA BIỂU THUẾ
                                        </Button>
                                    ) : (
                                        <>
                                            <Button variant="outline" onClick={cancelPitEdit} className="h-12 px-8 rounded-xl font-bold text-xs uppercase border-slate-200">
                                                HỦY BỎ
                                            </Button>
                                            <Button onClick={savePitTiers} className="h-12 px-10 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs uppercase shadow-lg shadow-orange-500/20">
                                                LƯU & CẬP NHẬT BIỂU THUẾ
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Employee Tax Rules Section (Formerly pit_rules) */}
                        <div className="space-y-8 pt-10 border-t border-slate-100">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 border border-emerald-500/20">
                                    <CheckCircle2 size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800 uppercase italic underline decoration-emerald-200 decoration-4 underline-offset-8">Thuế TNCN</h3>
                                </div>
                            </div>

                            <div className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100">
                                            <th className="px-8 py-5 font-bold uppercase text-[10px] tracking-widest text-slate-400">Loại nhân sự</th>
                                            <th className="px-6 py-5 font-bold uppercase text-[10px] tracking-widest text-slate-400 text-center">Miễn thuế</th>
                                            <th className="px-6 py-5 font-bold uppercase text-[10px] tracking-widest text-slate-400 text-center">10% Cố định</th>
                                            <th className="px-6 py-5 font-bold uppercase text-[10px] tracking-widest text-slate-400 text-center">Biểu thuế lũy tiến</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {[
                                            { type: "PROBATION", label: "Thử việc" },
                                            { type: "TRAINEE", label: "Học việc" },
                                            { type: "OTHER", label: "Khác" },
                                            { type: "INTERN", label: "Thực tập sinh" },
                                            { type: "FULL_TIME", label: "Chính thức" }
                                        ].map((row) => {
                                            const config = taxRules.find(r => r.employeeType === row.type) || { employeeType: row.type as EmployeeTaxConfig['employeeType'], taxMethod: "PROGRESSIVE" };
                                            const updateMethod = (method: "EXEMPT" | "FIXED_10" | "PROGRESSIVE") => {
                                                const newRules = [...taxRules];
                                                const idx = newRules.findIndex(r => r.employeeType === row.type);
                                                if (idx > -1) {
                                                    newRules[idx] = { ...newRules[idx], taxMethod: method };
                                                } else {
                                                    newRules.push({ employeeType: row.type as EmployeeTaxConfig['employeeType'], taxMethod: method });
                                                }
                                                setTaxRules(newRules);
                                            };

                                            return (
                                                <tr key={row.type} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-8 py-5 font-bold text-slate-700">{row.label} :</td>
                                                    <td className="px-6 py-5 text-center">
                                                        <label className="inline-flex items-center cursor-pointer group">
                                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                                                config.taxMethod === "EXEMPT" ? "border-emerald-500 bg-emerald-500 shadow-lg shadow-emerald-200" : "border-slate-300 group-hover:border-slate-400"
                                                            }`}>
                                                                <input type="radio" name={`tax_${row.type}`} checked={config.taxMethod === "EXEMPT"} onChange={() => updateMethod("EXEMPT")} className="hidden" />
                                                                {config.taxMethod === "EXEMPT" && <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />}
                                                            </div>
                                                            <span className={`ml-3 text-xs font-bold transition-colors ${config.taxMethod === "EXEMPT" ? "text-slate-900" : "text-slate-400"}`}>Miễn thuế</span>
                                                        </label>
                                                    </td>
                                                    <td className="px-6 py-5 text-center">
                                                        <label className="inline-flex items-center cursor-pointer group">
                                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                                                config.taxMethod === "FIXED_10" ? "border-emerald-500 bg-emerald-500 shadow-lg shadow-emerald-200" : "border-slate-300 group-hover:border-slate-400"
                                                            }`}>
                                                                <input type="radio" name={`tax_${row.type}`} checked={config.taxMethod === "FIXED_10"} onChange={() => updateMethod("FIXED_10")} className="hidden" />
                                                                {config.taxMethod === "FIXED_10" && <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />}
                                                            </div>
                                                            <span className={`ml-3 text-xs font-bold transition-colors ${config.taxMethod === "FIXED_10" ? "text-slate-900" : "text-slate-400"}`}>10%</span>
                                                        </label>
                                                    </td>
                                                    <td className="px-6 py-5 text-center">
                                                        <label className="inline-flex items-center cursor-pointer group">
                                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                                                config.taxMethod === "PROGRESSIVE" ? "border-emerald-500 bg-emerald-500 shadow-lg shadow-emerald-200" : "border-slate-300 group-hover:border-slate-400"
                                                            }`}>
                                                                <input type="radio" name={`tax_${row.type}`} checked={config.taxMethod === "PROGRESSIVE"} onChange={() => updateMethod("PROGRESSIVE")} className="hidden" />
                                                                {config.taxMethod === "PROGRESSIVE" && <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />}
                                                            </div>
                                                            <span className={`ml-3 text-xs font-bold transition-colors ${config.taxMethod === "PROGRESSIVE" ? "text-slate-900" : "text-slate-400"}`}>Theo biểu lũy tiến</span>
                                                        </label>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex flex-col gap-4">
                                <div className="pt-2 flex items-center gap-4">
                                    {taxRules.some(r => r.status === 'PENDING') && (userRoles.includes("ROLE_KE_TOAN_TRUONG") || userRoles.includes("ROLE_ADMIN")) ? (
                                        <Button onClick={approveTaxRules} className="gap-2 h-14 px-10 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-200 font-bold text-sm">
                                            <CheckCircle2 size={18} /> PHÊ DUYỆT PHƯƠNG THỨC TÍNH THUẾ
                                        </Button>
                                    ) : (
                                        <Button onClick={saveTaxRules} className="gap-2 h-14 px-10 rounded-2xl bg-[#111827] hover:bg-black text-white shadow-xl shadow-slate-200 font-bold text-sm">
                                            <Save size={18} /> {userRoles.includes("ROLE_ADMIN") ? "LƯU CẤU HÌNH THUẾ NGAY" : "GỬI ĐỀ XUẤT CẤU HÌNH THUẾ"}
                                        </Button>
                                    )}
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
