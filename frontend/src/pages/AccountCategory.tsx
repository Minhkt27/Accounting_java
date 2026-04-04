import { useState, useEffect, useCallback } from "react"
import axios from "axios"
import { 
  Plus, Search, ShieldAlert, CheckCircle2, 
  BookOpen, Hash, Type, Activity
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"

interface AccountCategory {
  id: string;
  name: string;
  type: string;
  status: string;
}

export default function AccountCategoryPage() {
  const [accounts, setAccounts] = useState<AccountCategory[]>([])
  const [id, setId] = useState("")
  const [name, setName] = useState("")
  const [type, setType] = useState("Nợ")
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState("")

  const fetchAccounts = useCallback(async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await axios.get("/api/config/accounts", {
        headers: { Authorization: `Bearer ${token}` }
      })
      setAccounts(res.data)
      setError("")
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        window.location.href = "/login"
      }
      const message = err instanceof Error ? err.message : String(err)
      setError("Không thể lấy dữ liệu: " + message)
    }
  }, [])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem("token")
      await axios.post("/api/config/accounts", { id, name, type }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchAccounts()
      setId("")
      setName("")
      setError("")
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setError("Lỗi lưu dữ liệu: " + message)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex flex-col gap-1">
            <h1 className="text-4xl font-black tracking-tighter text-slate-800 flex items-center gap-3 uppercase">
                <BookOpen className="w-10 h-10 text-primary" /> Hệ thống Tài khoản
            </h1>
            <p className="text-muted-foreground font-medium text-sm">Quản lý danh mục tài khoản kế toán doanh nghiệp (UC01)</p>
        </div>
      </div>

      <AnimatePresence>
        {error && (
            <motion.div 
                initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                className="p-4 bg-red-50 border border-red-100 rounded-2.5xl flex items-center gap-3 text-red-600 shadow-xl shadow-red-500/5"
            >
                <ShieldAlert className="w-5 h-5" />
                <span className="font-black text-xs uppercase tracking-tight">{error}</span>
            </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 sticky top-8">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight italic mb-6">Thêm <span className="text-primary italic">Tài khoản</span></h3>
                
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 flex items-center gap-2">
                            <Hash className="w-3 h-3"/> Mã số tài khoản
                        </label>
                        <Input 
                            value={id} 
                            onChange={(e) => setId(e.target.value)} 
                            placeholder="Ví dụ: 334, 642..." 
                            required 
                            className="h-14 rounded-2xl bg-slate-50 border-slate-200 focus:bg-white text-lg font-black text-slate-800"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 flex items-center gap-2">
                            <Type className="w-3 h-3"/> Tên tài khoản
                        </label>
                        <Input 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            placeholder="Ví dụ: Phải trả người lao động" 
                            required 
                            className="h-14 rounded-2xl bg-slate-50 border-slate-200 focus:bg-white text-base font-black text-slate-800"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 flex items-center gap-2">
                            <Activity className="w-3 h-3"/> Loại tài khoản
                        </label>
                        <div className="flex p-1.5 bg-slate-100 rounded-2xl w-full gap-1 shadow-inner">
                            {["Nợ", "Có", "Lưỡng tính"].map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setType(t)}
                                    className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all duration-300 uppercase tracking-widest ${
                                        type === t 
                                            ? "bg-white text-primary shadow-lg shadow-slate-200" 
                                            : "text-slate-400 hover:text-slate-600"
                                    }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <Button type="submit" className="w-full h-14 rounded-2xl bg-[#111827] text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-black transition-all active:scale-95 mt-4">
                        <Plus className="w-4 h-4 mr-2"/> Lưu tài khoản
                    </Button>
                </form>

            </div>
        </div>

        <div className="lg:col-span-2">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">Danh mục <span className="text-primary italic">Đã thiết lập</span></h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Toàn bộ tài khoản hiện có trong hệ thống</p>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text"
                            placeholder="Tìm mã hoặc tên TK..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-11 pr-6 h-12 bg-white border border-slate-100 rounded-2xl w-64 focus:ring-2 focus:ring-primary/20 text-xs font-bold transition-all shadow-sm"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest pl-10">Mã TK</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Tên tài khoản</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Tư thế</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center pr-10">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {accounts.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-20">
                                        <div className="flex flex-col items-center gap-4 animate-pulse">
                                            <Activity className="w-12 h-12 text-slate-200" />
                                            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Chưa có tài khoản nào được khai báo</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : accounts.filter(acc => 
                                acc.id.includes(searchTerm) || acc.name.toLowerCase().includes(searchTerm.toLowerCase())
                            ).map((acc, idx) => (
                                <tr key={idx} className="group hover:bg-slate-50/50 transition-all">
                                    <td className="px-8 py-6 pl-10">
                                        <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center font-black text-slate-900 border border-slate-100 group-hover:bg-primary group-hover:text-white group-hover:scale-110 transition-all">
                                            {acc.id}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="font-black text-slate-800 text-sm italic">{acc.name}</div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase">Hệ thống kế toán PA</div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                            acc.type === 'Nợ' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                                            acc.type === 'Có' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-600 border-slate-100'
                                        }`}>
                                            {acc.type}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-center pr-10">
                                        <div className="flex flex-col items-center gap-1">
                                            {acc.status === 'APPROVED' ? (
                                                <div className="flex items-center gap-1 text-emerald-500">
                                                    <CheckCircle2 size={14} />
                                                    <span className="text-[10px] font-bold uppercase tracking-widest">Đã duyệt</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 text-amber-500">
                                                    <Activity size={14} className="animate-spin" />
                                                    <span className="text-[10px] font-bold uppercase tracking-widest">Đang chờ</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}
