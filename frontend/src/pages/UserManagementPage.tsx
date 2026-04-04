import { useState, useEffect, useCallback, useMemo } from "react"
import axios from "axios"
import { 
    Users, Shield, Key, Plus, Trash2, 
    Edit3, Save, CheckCircle2, XCircle, 
    Lock, Mail, User, Search,
    Settings, Info
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import type { UserItem, RoleItem, PermItem } from "../types"

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
  const [searchTerm, setSearchTerm] = useState("")

  const headers = useMemo(() => ({ 
    Authorization: `Bearer ${localStorage.getItem("token")}` 
  }), [])

  const fetchData = useCallback(async () => {
    setLoading(true)
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
    } catch (err: unknown) { 
        console.error(err)
    } finally {
        setLoading(false)
    }
  }, [headers])

  useEffect(() => { fetchData() }, [fetchData])

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
      alert("Cập nhật phân quyền thành công!")
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
      setResetUserId(null); setNewPassword("");
      alert("Đã đổi mật khẩu thành công!")
    } catch (err: unknown) { 
        const message = err instanceof Error ? err.message : String(err)
        alert(message) 
    }
  }

  const toggleRole = (roleName: string) => {
    setFormRoles(prev => prev.includes(roleName) ? prev.filter(r => r !== roleName) : [...prev, roleName])
  }

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4 animate-pulse">
        <Users className="w-12 h-12 text-slate-200 animate-bounce" />
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Đang tải danh sách tài khoản...</p>
    </div>
  )

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex flex-col gap-1">
            <h1 className="text-4xl font-black tracking-tighter text-slate-800 flex items-center gap-3 uppercase">
                <Shield className="w-10 h-10 text-primary" /> Quản trị hệ thống
            </h1>
            <p className="text-muted-foreground font-medium text-sm">Quản lý tài khoản người dùng và phân quyền chức năng</p>
        </div>
        <Button 
            onClick={openCreate}
            className="flex items-center gap-2 px-8 h-14 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
        >
            <Plus size={18} /> Thêm người dùng
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-10">
          {/* Permissions Matrix */}
          <section className="space-y-3">
              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                          <Settings size={16} />
                      </div>
                      <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight italic">Ma trận <span className="text-primary italic">Phân quyền</span></h2>
                  </div>
                  <Button 
                    onClick={savePerms} 
                    disabled={!permDirty}
                    className={`h-11 px-8 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                        permDirty ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                      <Save size={16} className="mr-2" /> Lưu thay đổi
                  </Button>
              </div>

              <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                  <div className="overflow-x-auto">
                      <table className="w-full text-left">
                          <thead>
                              <tr className="bg-slate-50/50 border-b border-slate-100">
                                  <th className="px-4 py-3 text-[9px] font-black uppercase text-slate-400 tracking-widest pl-8">Chức năng hệ thống</th>
                                  <th className="px-4 py-3 text-[9px] font-black uppercase text-slate-400 tracking-widest text-center">Admin</th>
                                  {EDITABLE_ROLES.map(r => (
                                      <th key={r} className="px-4 py-3 text-[9px] font-black uppercase text-slate-400 tracking-widest text-center">{ROLE_LABELS[r]}</th>
                                  ))}
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                              {FUNCTION_CODES.map(fn => (
                                  <tr key={fn} className="group hover:bg-slate-50/50 transition-all">
                                      <td className="px-4 py-3 pl-8">
                                          <div className="flex items-center gap-3">
                                              <div className="w-1 h-1 rounded-full bg-primary/30 group-hover:bg-primary transition-all" />
                                              <span className="font-black text-slate-700 text-xs italic">{FUNCTION_LABELS[fn]}</span>
                                          </div>
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                          <div className="flex justify-center">
                                              <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500 border border-emerald-100">
                                                  <CheckCircle2 size={14} />
                                              </div>
                                          </div>
                                      </td>
                                      {EDITABLE_ROLES.map(r => {
                                          const allowed = isAllowed(r, fn)
                                          return (
                                              <td key={r} className="px-4 py-3 text-center">
                                                  <button
                                                      onClick={() => togglePerm(r, fn)}
                                                      className={`w-8 h-8 mx-auto rounded-lg flex items-center justify-center transition-all ${
                                                          allowed 
                                                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                                                            : 'bg-slate-50 text-slate-300 hover:bg-slate-100'
                                                      }`}
                                                  >
                                                      {allowed ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                                                  </button>
                                              </td>
                                          )
                                      })}
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          </section>

          {/* User List */}
          <section className="space-y-6">
              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                          <Users size={20} />
                      </div>
                      <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">Danh sách <span className="text-primary italic">Tài khoản</span></h2>
                  </div>
                  <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                          type="text"
                          placeholder="Tìm người dùng..."
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                          className="pl-11 pr-6 h-12 bg-white border border-slate-100 rounded-2xl w-64 focus:ring-2 focus:ring-primary/20 text-xs font-bold transition-all shadow-sm"
                      />
                  </div>
              </div>

              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
                  <div className="overflow-x-auto">
                      <table className="w-full text-left">
                          <thead>
                              <tr className="bg-slate-50/50 border-b border-slate-100">
                                  <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest pl-10">Người dùng</th>
                                  <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Email liên hệ</th>
                                  <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Vai trò / Quyền hạn</th>
                                  <th className="px-8 py-5 text-center pr-10">Thao tác</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                              {users.filter(u => u.username.toLowerCase().includes(searchTerm.toLowerCase())).map(u => (
                                  <tr key={u.id} className="group hover:bg-slate-50/50 transition-all">
                                      <td className="px-8 py-6 pl-10">
                                          <div className="flex items-center gap-4">
                                              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all">
                                                  <User size={20} />
                                              </div>
                                              <div>
                                                  <div className="font-black text-slate-800 text-sm italic">{u.username}</div>
                                                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: #{u.id}</div>
                                              </div>
                                          </div>
                                      </td>
                                      <td className="px-8 py-6">
                                          <div className="flex items-center gap-2 text-slate-600 font-bold text-xs">
                                              <Mail size={14} className="text-slate-300" />
                                              {u.email}
                                          </div>
                                      </td>
                                      <td className="px-8 py-6">
                                          <div className="flex flex-wrap gap-2">
                                              {u.roles.map(r => (
                                                  <span key={r} className="px-3 py-1 rounded-full bg-slate-50 text-[9px] font-black uppercase tracking-widest text-slate-500 border border-slate-200">
                                                      {ROLE_LABELS[r]}
                                                  </span>
                                              ))}
                                          </div>
                                      </td>
                                      <td className="px-8 py-6 text-center pr-10">
                                          <div className="flex items-center justify-center gap-2">
                                              <button onClick={() => openEdit(u)} className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-500 transition-all" title="Chỉnh sửa">
                                                  <Edit3 size={16} />
                                              </button>
                                              <button onClick={() => { setResetUserId(u.id); setNewPassword("") }} className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-amber-50 hover:text-amber-500 transition-all" title="Đổi mật khẩu">
                                                  <Key size={16} />
                                              </button>
                                              <button onClick={() => handleDelete(u.id)} className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all" title="Xóa tài khoản">
                                                  <Trash2 size={16} />
                                              </button>
                                          </div>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          </section>
      </div>

      {/* User Form Modal */}
      <AnimatePresence>
          {showForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-3xl w-full max-w-lg space-y-8"
                  >
                        <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                <User size={24} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">{editingUser ? "Cập nhật" : "Tạo mới"} <span className="text-primary italic">Người dùng</span></h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Vui lòng nhập đầy đủ thông tin</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Tên đăng nhập</label>
                                <Input 
                                    value={formUsername} 
                                    onChange={e => setFormUsername(e.target.value)} 
                                    disabled={!!editingUser}
                                    className="h-14 rounded-2xl bg-slate-50 border-slate-200 focus:bg-white text-base font-black text-slate-800"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Email liên hệ</label>
                                <Input 
                                    value={formEmail} 
                                    onChange={e => setFormEmail(e.target.value)}
                                    className="h-14 rounded-2xl bg-slate-50 border-slate-200 focus:bg-white text-base font-black text-slate-800"
                                />
                            </div>
                            {!editingUser && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Mật khẩu ban đầu</label>
                                    <Input 
                                        type="password"
                                        value={formPassword} 
                                        onChange={e => setFormPassword(e.target.value)}
                                        className="h-14 rounded-2xl bg-slate-50 border-slate-200 focus:bg-white text-base font-black text-slate-800"
                                    />
                                </div>
                            )}

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Phân vai trò</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {roles.filter(r => r.name !== "ROLE_ADMIN").map(r => {
                                        const selected = formRoles.includes(r.name)
                                        return (
                                            <button 
                                                key={r.name} 
                                                onClick={() => toggleRole(r.name)}
                                                className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                                                    selected ? 'bg-primary/5 border-primary text-primary' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                                                }`}
                                            >
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selected ? 'bg-primary border-primary' : 'border-slate-200'}`}>
                                                    {selected && <CheckCircle2 size={12} className="text-white" />}
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-widest">{r.displayName}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4 border-t border-slate-100 mt-4">
                            <Button onClick={handleSave} className="flex-1 h-14 rounded-2xl bg-primary hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/20 active:scale-95">
                                <Save size={18} className="mr-2" /> Lưu thông tin
                            </Button>
                            <Button variant="ghost" onClick={() => setShowForm(false)} className="px-8 h-14 rounded-2xl font-black text-xs uppercase text-slate-400 hover:bg-slate-50">
                                Đóng
                            </Button>
                        </div>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>

      {/* Password Reset Modal */}
      <AnimatePresence>
          {resetUserId && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-3xl w-full max-w-sm space-y-8"
                  >
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="w-20 h-20 rounded-[2rem] bg-amber-100 flex items-center justify-center text-amber-500 mb-2">
                                <Lock size={40} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">Đổi mật khẩu</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Thiết lập mật khẩu truy cập mới</p>
                        </div>

                        <div className="space-y-4">
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                <Input 
                                    type="password" 
                                    placeholder="Nhập mật khẩu mới..."
                                    value={newPassword} 
                                    onChange={e => setNewPassword(e.target.value)}
                                    className="h-16 pl-12 rounded-2xl bg-slate-50 border-slate-200 focus:bg-white text-base font-black text-slate-800"
                                />
                            </div>
                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3">
                                <Info className="text-blue-500 w-4 h-4 flex-shrink-0 mt-0.5" />
                                <p className="text-[9px] text-blue-700 font-bold uppercase leading-relaxed text-left">Mật khẩu mới sẽ có hiệu lực ngay lập tức sau khi xác nhận.</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 pt-4">
                            <Button onClick={handleResetPassword} className="h-14 rounded-2xl bg-[#111827] hover:bg-black text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 active:scale-95">
                                Xác nhận đổi
                            </Button>
                            <Button variant="ghost" onClick={() => setResetUserId(null)} className="h-14 rounded-2xl font-black text-xs uppercase text-slate-400 hover:bg-slate-50">
                                Hủy bỏ
                            </Button>
                        </div>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>
    </div>
  )
}
