import { useState, useEffect } from "react"
import axios from "axios"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { motion, AnimatePresence } from "framer-motion"
import { UserCog, Plus, Pencil, Trash2, KeyRound, Shield, Save, Check, X, AlertCircle, Users } from "lucide-react"

interface UserItem {
  id: number
  username: string
  email: string
  roles: string[]
}

interface RoleItem {
  id: number
  name: string
  displayName: string
}

interface PermItem {
  roleName: string
  functionCode: string
  allowed: boolean
}

const ROLE_COLORS: Record<string, string> = {
  ROLE_ADMIN: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  ROLE_KE_TOAN_TRUONG: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  ROLE_KE_TOAN_LUONG: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  ROLE_NHAN_SU: "bg-amber-500/10 text-amber-500 border-amber-500/20",
}

const ROLE_LABELS: Record<string, string> = {
  ROLE_ADMIN: "Quản trị viên",
  ROLE_KE_TOAN_TRUONG: "KT Trưởng",
  ROLE_KE_TOAN_LUONG: "KT Tiền lương",
  ROLE_NHAN_SU: "Nhân sự",
}

const FUNCTION_LABELS: Record<string, string> = {
  CONFIG_ACCOUNT: "DM Tài khoản",
  CONFIG_INSURANCE: "Cấu hình Tham số",
  HR_EMPLOYEE: "Quản lý Nhân sự",
  HR_ATTENDANCE: "Chấm công",
  HR_LEAVE: "Nghỉ phép",
  PAYROLL_CALCULATE: "Tính lương",
  PAYROLL_APPROVE: "Chốt sổ / Thanh toán",
  ACCOUNTING_VIEW: "Sổ sách & Báo cáo",
  ADMIN_USERS: "Hệ thống tài khoản",
}

const FUNCTION_CODES = Object.keys(FUNCTION_LABELS)
const EDITABLE_ROLES = ["ROLE_NHAN_SU", "ROLE_KE_TOAN_LUONG", "ROLE_KE_TOAN_TRUONG"]

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [roles, setRoles] = useState<RoleItem[]>([])
  const [perms, setPerms] = useState<PermItem[]>([])
  const [permDirty, setPermDirty] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<UserItem | null>(null)

  const [formUsername, setFormUsername] = useState("")
  const [formEmail, setFormEmail] = useState("")
  const [formPassword, setFormPassword] = useState("")
  const [formRoles, setFormRoles] = useState<string[]>([])

  const [resetUserId, setResetUserId] = useState<number | null>(null)
  const [newPassword, setNewPassword] = useState("")

  const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` }

  const fetchData = async () => {
    try {
      const [uRes, rRes, pRes] = await Promise.all([
        axios.get("/api/admin/users", { headers }),
        axios.get("/api/admin/users/roles", { headers }),
        axios.get("/api/admin/users/permissions", { headers }),
      ])
      setUsers(Array.isArray(uRes.data) ? uRes.data : [])
      setRoles(Array.isArray(rRes.data) ? rRes.data : [])
      setPerms(Array.isArray(pRes.data) ? pRes.data : [])
      setPermDirty(false)
    } catch (err) { 
        console.error(err)
        setUsers([])
        setRoles([])
        setPerms([])
    } finally {
        setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const isAllowed = (roleName: string, functionCode: string) => {
    if (roleName === "ROLE_ADMIN") return true
    if (!Array.isArray(perms)) return false
    const p = perms.find(x => x.roleName === roleName && x.functionCode === functionCode)
    return p ? p.allowed : false
  }

  const togglePerm = (roleName: string, functionCode: string) => {
    if (roleName === "ROLE_ADMIN") return
    setPermDirty(true)
    setPerms(prev => {
      const existing = prev.find(x => x.roleName === roleName && x.functionCode === functionCode)
      if (existing) {
        return prev.map(x =>
          x.roleName === roleName && x.functionCode === functionCode
            ? { ...x, allowed: !x.allowed } : x
        )
      }
      return [...prev, { roleName, functionCode, allowed: true }]
    })
  }

  const savePerms = async () => {
    try {
      const updates = perms.filter(p => p.roleName !== "ROLE_ADMIN")
      await axios.put("/api/admin/users/permissions", updates, { headers })
      setPermDirty(false)
      fetchData()
    } catch (err: any) { alert(err.response?.data || "Lỗi!") }
  }

  const openCreate = () => {
    setEditingUser(null); setFormUsername(""); setFormEmail(""); setFormPassword(""); setFormRoles(["ROLE_NHAN_SU"]); setShowForm(true)
  }

  const openEdit = (u: UserItem) => {
    setEditingUser(u); setFormUsername(u.username); setFormEmail(u.email); setFormPassword(""); setFormRoles([...u.roles]); setShowForm(true)
  }

  const handleSave = async () => {
    try {
      if (editingUser) {
        await axios.put(`/api/admin/users/${editingUser.id}`, { email: formEmail, roles: formRoles }, { headers })
      } else {
        await axios.post("/api/admin/users", { username: formUsername, email: formEmail, password: formPassword, roles: formRoles }, { headers })
      }
      setShowForm(false); fetchData()
    } catch (err: any) { alert(err.response?.data || "Lỗi!") }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Xác nhận xóa tài khoản?")) return
    try {
      await axios.delete(`/api/admin/users/${id}`, { headers }); fetchData()
    } catch (err: any) { alert(err.response?.data || "Lỗi!") }
  }

  const handleResetPassword = async () => {
    if (!resetUserId || !newPassword) return
    try {
      await axios.put(`/api/admin/users/${resetUserId}/password`, { newPassword }, { headers })
      setResetUserId(null); setNewPassword("")
    } catch (err: any) { alert(err.response?.data || "Lỗi!") }
  }

  const toggleRole = (roleName: string) => {
    setFormRoles(prev => prev.includes(roleName) ? prev.filter(r => r !== roleName) : [...prev, roleName])
  }

  if (loading) {
    return (
        <div className="h-[60vh] flex flex-col items-center justify-center gap-4 animate-pulse pt-20">
            <UserCog className="w-16 h-16 text-slate-200" />
            <div className="h-4 w-48 bg-slate-100 rounded-full"></div>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Đang tải cấu hình hệ thống...</p>
        </div>
    )
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-700 pb-16">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
            <h1 className="text-4xl font-black tracking-tighter text-slate-800 flex items-center gap-3">
                <UserCog className="w-10 h-10 text-primary" /> QUẢN TRỊ HỆ THỐNG
            </h1>
            <p className="text-muted-foreground font-medium text-sm">Quản lý tài khoản & Ma trận phân quyền chức năng</p>
        </div>
        <Button onClick={openCreate} className="gap-2 bg-primary hover:bg-primary/90 text-white rounded-2xl h-12 px-6 shadow-xl shadow-primary/20">
            <Plus className="w-5 h-5" /> Thêm tài khoản
        </Button>
      </div>

      <section className="bg-[#111827] rounded-[2.5rem] shadow-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-primary/10 blur-[120px] rounded-full"></div>
        <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
                        <Shield className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-black text-lg tracking-tight">Ma trận phân quyền</h3>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Cấu hình chức năng cho từng vai trò</p>
                    </div>
                </div>
                <Button 
                    onClick={savePerms} 
                    disabled={!permDirty} 
                    className={`gap-2 h-10 px-6 rounded-xl transition-all duration-300 font-black text-xs ${
                        permDirty ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" : "bg-slate-800 text-slate-500 opacity-50"
                    }`}
                >
                    <Save className="w-4 h-4" /> {permDirty ? "LẬP TỨC LƯU THAY ĐỔI" : "ĐÃ LƯU"}
                </Button>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="text-slate-500 font-black uppercase tracking-widest">
                            <th className="p-4 text-left min-w-[200px]">Chức năng / Module</th>
                            <th className="p-4 text-center">
                                <span className="px-3 py-1 rounded-lg border border-slate-700 bg-slate-800/50">Admin</span>
                            </th>
                            {EDITABLE_ROLES.map(r => (
                                <th key={r} className="p-4 text-center">
                                    <span className="px-3 py-1 rounded-lg border border-slate-700 bg-slate-800/50 whitespace-nowrap">
                                        {ROLE_LABELS[r]}
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {FUNCTION_CODES.map(fn => (
                            <tr key={fn} className="hover:bg-slate-800/20 transition-colors">
                                <td className="p-4 font-black text-slate-300 text-sm">{FUNCTION_LABELS[fn]}</td>
                                <td className="p-4 text-center">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-500 font-black">
                                        <Check className="w-4 h-4" />
                                    </div>
                                </td>
                                {EDITABLE_ROLES.map(r => {
                                    const allowed = isAllowed(r, fn)
                                    return (
                                        <td key={r} className="p-4 text-center">
                                            <button
                                                onClick={() => togglePerm(r, fn)}
                                                className={`w-9 h-9 rounded-xl border-2 transition-all flex items-center justify-center mx-auto ${
                                                    allowed
                                                        ? "bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/30"
                                                        : "bg-slate-900 border-slate-800 text-slate-700 hover:border-slate-600"
                                                }`}
                                            >
                                                {allowed ? <Check className="w-5 h-5 stroke-[3]" /> : <X className="w-4 h-4" />}
                                            </button>
                                        </td>
                                    )
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <AnimatePresence>
                {permDirty && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-3 overflow-hidden group shadow-2xl shadow-amber-500/5"
                    >
                        <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 animate-pulse">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="font-black text-amber-500 text-sm">Dữ liệu phân quyền đã thay đổi!</p>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Bạn cần nhấn Lưu để áp dụng thay đổi vào hệ thống</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </section>

      <section className="border border-slate-100 rounded-[2.5rem] bg-white shadow-2xl shadow-slate-200/50 overflow-hidden">
        <div className="bg-slate-50/50 p-8 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-black text-slate-800 text-sm uppercase flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" /> Danh sách tài khoản vận hành
            </h3>
            <span className="text-[10px] font-black bg-primary/10 text-primary px-3 py-1 rounded-full">
                {users.length} NGƯỜI DÙNG
            </span>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead>
                    <tr className="bg-[#111827] text-white">
                        <th className="px-8 py-6 font-black uppercase tracking-tighter">Tải khoản</th>
                        <th className="px-8 py-6 font-black uppercase tracking-tighter">Email liên hệ</th>
                        <th className="px-8 py-6 font-black uppercase tracking-tighter">Vai trò</th>
                        <th className="px-8 py-6 font-black uppercase tracking-tighter text-center">Hành động</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {users.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-8 py-6">
                                <div className="font-black text-slate-800 text-base">{u.username}</div>
                                <div className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">ID: #{u.id}</div>
                            </td>
                            <td className="px-8 py-6 text-slate-500 font-medium">{u.email}</td>
                            <td className="px-8 py-6">
                                <div className="flex gap-2 flex-wrap">
                                    {(u.roles || []).map(r => (
                                        <span key={r} className={`px-3 py-1 text-[10px] font-black rounded-lg border ${ROLE_COLORS[r] || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                                            {ROLE_LABELS[r] || r}
                                        </span>
                                    ))}
                                </div>
                            </td>
                            <td className="px-8 py-6">
                                <div className="flex gap-2 justify-center">
                                    <button onClick={() => openEdit(u)} className="p-2.5 rounded-xl hover:bg-blue-50 text-blue-600 border border-transparent hover:border-blue-100 transition-all" title="Sửa"><Pencil className="w-4 h-4" /></button>
                                    <button onClick={() => { setResetUserId(u.id); setNewPassword("") }} className="p-2.5 rounded-xl hover:bg-amber-50 text-amber-600 border border-transparent hover:border-amber-100 transition-all" title="Đổi mật khẩu"><KeyRound className="w-4 h-4" /></button>
                                    <button onClick={() => handleDelete(u.id)} className="p-2.5 rounded-xl hover:bg-red-50 text-red-600 border border-transparent hover:border-red-100 transition-all" title="Xóa"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </section>

      {/* MODALS */}
      <AnimatePresence>
        {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-md" 
                    onClick={() => setShowForm(false)} 
                />
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative z-50 w-full max-w-md rounded-3xl bg-white p-8 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.3)] space-y-6"
                >
                    <h2 className="text-2xl font-black tracking-tight">{editingUser ? "Chỉnh sửa tài khoản" : "Tạo tài khoản mới"}</h2>
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Tên đăng nhập</label>
                            <Input className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white" value={formUsername} onChange={e => setFormUsername(e.target.value)} disabled={!!editingUser} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Email</label>
                            <Input className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white" value={formEmail} onChange={e => setFormEmail(e.target.value)} />
                        </div>
                        {!editingUser && (
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Mật khẩu</label>
                                <Input type="password" className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white" value={formPassword} onChange={e => setFormPassword(e.target.value)} />
                            </div>
                        )}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Phân quyền vai trò</label>
                            <div className="grid grid-cols-2 gap-2">
                                {roles.filter(r => r.name !== "ROLE_ADMIN").map(r => (
                                    <button
                                        key={r.name}
                                        onClick={() => toggleRole(r.name)}
                                        className={`px-3 py-3 rounded-xl text-[10px] font-black border-2 transition-all text-left flex items-center justify-between ${
                                            formRoles.includes(r.name)
                                                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                                                : "bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-200"
                                        }`}
                                    >
                                        {r.displayName}
                                        {formRoles.includes(r.name) && <Check className="w-3 h-3" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold" onClick={() => setShowForm(false)}>Hủy</Button>
                        <Button className="flex-1 h-12 rounded-xl font-black bg-[#111827] text-white hover:bg-black" onClick={handleSave}>
                            {editingUser ? "LƯU THAY ĐỔI" : "TẠO TÀI KHOẢN"}
                        </Button>
                    </div>
                </motion.div>
            </div>
        )}

        {resetUserId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-md" 
                    onClick={() => setResetUserId(null)} 
                />
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                    className="relative z-50 w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl space-y-6"
                >
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto">
                        <KeyRound className="w-8 h-8 text-amber-500" />
                    </div>
                    <div className="text-center space-y-1">
                        <h2 className="text-xl font-black">Đặt lại mật khẩu</h2>
                        <p className="text-xs text-slate-500 font-medium">Bảo mật cho: <strong className="text-slate-800">{users.find(u => u.id === resetUserId)?.username}</strong></p>
                    </div>
                    <Input type="password" placeholder="Mật khẩu bảo mật mới" className="h-12 rounded-xl text-center font-black" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                    <div className="flex gap-3">
                        <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold" onClick={() => setResetUserId(null)}>Hủy bỏ</Button>
                        <Button onClick={handleResetPassword} className="flex-1 h-12 rounded-xl font-black bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20">XÁC NHẬN</Button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  )
}
