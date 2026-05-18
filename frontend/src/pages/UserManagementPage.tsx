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
  ROLE_KE_TOAN_VON_BANG_TIEN: "KT Vốn bằng tiền",
  ROLE_NHAN_SU: "Nhân sự",
}

const FUNCTION_LABELS: Record<string, string> = {
  CONFIG_ACCOUNT: "DM Tài khoản",
  CONFIG_INSURANCE: "Cấu hình Tham số",
  HR_EMPLOYEE: "Quản lý Nhân sự",
  HR_ATTENDANCE: "Chấm công",
  HR_LEAVE: "Nghỉ phép",
  HR_SALARY_CHANGE: "Biến động lương",
  HR_SALARY_CHANGE_APPROVE: "Duyệt biến động lương",
  PAYROLL_CALCULATE: "Tính lương",
  PAYROLL_APPROVE: "Chốt sổ",
  PAYROLL_PAY: "Thanh toán lương",
  ACCOUNTING_VIEW: "Sổ sách & Báo cáo",
  ADMIN_USERS: "Hệ thống tài khoản",
  DASHBOARD_VIEW: "Tổng quan",
}

const FUNCTION_CODES = Object.keys(FUNCTION_LABELS)
const EDITABLE_ROLES = ["ROLE_NHAN_SU", "ROLE_KE_TOAN_LUONG", "ROLE_KE_TOAN_VON_BANG_TIEN", "ROLE_KE_TOAN_TRUONG"]

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
    } catch (err: unknown) { 
      const errorMessage = axios.isAxiosError(err) ? (err.response?.data || "Lỗi!") : "Lỗi!";
      alert(errorMessage); 
    }
  }

  const openCreate = () => {
    setEditingUser(null); setFormUsername(""); setFormEmail(""); setFormPassword(""); setFormRoles(["ROLE_NHAN_SU"]); setShowForm(true)
  }

  const openEdit = (u: UserItem) => {
    setEditingUser(u); setFormUsername(u.username); setFormEmail(u.email); setFormPassword(""); setFormRoles([...u.roles]); setShowForm(true)
  }

  const validate = () => {
    if (!formUsername) {
      alert("Vui lòng nhập Tên đăng nhập")
      return false
    }
    if (!formEmail) {
      alert("Vui lòng nhập Email liên hệ")
      return false
    }
    if (formEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEmail)) {
      alert("Email không đúng định dạng (ví dụ: example@domain.com)")
      return false
    }
    if (!editingUser && !formPassword) {
      alert("Vui lòng nhập Mật khẩu")
      return false
    }
    if (formRoles.length === 0) {
      alert("Vui lòng chọn ít nhất một vai trò")
      return false
    }
    return true
  }

  const handleSave = async () => {
    if (!validate()) return
    try {
      if (editingUser) {
        await axios.put(`/api/admin/users/${editingUser.id}`, { email: formEmail, roles: formRoles }, { headers })
      } else {
        await axios.post("/api/admin/users", { username: formUsername, email: formEmail, password: formPassword, roles: formRoles }, { headers })
      }
      setShowForm(false); fetchData()
    } catch (err: unknown) { 
      const errorMessage = axios.isAxiosError(err) ? (err.response?.data || "Lỗi!") : "Lỗi!";
      alert(errorMessage); 
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Xác nhận xóa tài khoản?")) return
    try {
      await axios.delete(`/api/admin/users/${id}`, { headers }); fetchData()
    } catch (err: unknown) { 
      const errorMessage = axios.isAxiosError(err) ? (err.response?.data || "Lỗi!") : "Lỗi!";
      alert(errorMessage); 
    }
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
            <h1 className="text-4xl font-bold tracking-wider text-slate-800 flex items-center gap-3">
                <Shield className="w-10 h-10 text-primary" /> Quản trị hệ thống
            </h1>
            <p className="text-muted-foreground font-medium text-sm">Quản lý tài khoản người dùng và phân quyền chức năng</p>
        </div>
        <Button 
            onClick={openCreate}
            className="flex items-center gap-2 px-8 h-14 bg-primary text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
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
                      <h2 className="text-lg font-bold text-black tracking-tight">Phân quyền</h2>
                  </div>
                  <Button 
                    onClick={savePerms} 
                    disabled={!permDirty}
                    className={`h-11 px-8 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
                        permDirty ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                      <Save size={16} className="mr-2" /> Lưu thay đổi
                  </Button>
              </div>

              <div className="bg-white rounded-lg border border-gray-300 shadow-sm overflow-hidden flex flex-col">
                  <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left border-collapse">
                          <thead>
                              <tr className="bg-[#E6F4F1] border-b border-gray-300">
                                  <th className="px-4 py-3 font-bold text-black border-r border-gray-300 pl-8">Chức năng hệ thống</th>
                                  <th className="px-4 py-3 font-bold text-black border-r border-gray-300 text-center">Admin</th>
                                  {EDITABLE_ROLES.map(r => (
                                      <th key={r} className="px-4 py-3 font-bold text-black border-r border-gray-300 text-center">{ROLE_LABELS[r]}</th>
                                  ))}
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                              {FUNCTION_CODES.map(fn => (
                                  <tr key={fn} className="hover:bg-[#FFF8E1] transition-colors group">
                                      <td className="px-4 py-3 pl-8 border-r border-gray-200 font-medium text-gray-900">
                                          <div className="flex items-center gap-3">
                                              <div className="w-1.5 h-1.5 rounded-full bg-blue-600/40 group-hover:bg-blue-600 transition-all" />
                                              <span>{FUNCTION_LABELS[fn]}</span>
                                          </div>
                                      </td>
                                      <td className="px-4 py-3 text-center border-r border-gray-200">
                                          <div className="flex justify-center">
                                              <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-200 font-bold">
                                                  <CheckCircle2 size={16} />
                                              </div>
                                          </div>
                                      </td>
                                      {EDITABLE_ROLES.map(r => {
                                          const allowed = isAllowed(r, fn)
                                          return (
                                              <td key={r} className="px-4 py-3 text-center border-r border-gray-200">
                                                  <button
                                                      onClick={() => togglePerm(r, fn)}
                                                      className={`w-8 h-8 mx-auto rounded-lg flex items-center justify-center transition-all ${
                                                          allowed 
                                                            ? 'bg-emerald-600 text-white shadow-sm' 
                                                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                                      }`}
                                                  >
                                                      {allowed ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
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
                      <h2 className="text-xl font-bold text-black tracking-tight">Danh sách tài khoản</h2>
                  </div>
                  <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                          type="text"
                          placeholder="Tìm người dùng..."
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                          className="pl-11 pr-6 h-12 bg-white border border-slate-200 rounded-2xl w-64 focus:ring-2 focus:ring-primary/20 text-xs font-bold transition-all shadow-sm"
                      />
                  </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-300 shadow-sm overflow-hidden flex flex-col">
                  <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left border-collapse">
                          <thead>
                              <tr className="bg-[#E6F4F1] border-b border-gray-300">
                                  <th className="px-6 py-3 font-bold text-black border-r border-gray-300 pl-8">Người dùng</th>
                                  <th className="px-6 py-3 font-bold text-black border-r border-gray-300">Email liên hệ</th>
                                  <th className="px-6 py-3 font-bold text-black border-r border-gray-300">Quyền hạn</th>
                                  <th className="px-6 py-3 font-bold text-black text-center pr-8">Thao tác</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                              {users.filter(u => u.username.toLowerCase().includes(searchTerm.toLowerCase())).map(u => (
                                  <tr key={u.id} className="hover:bg-[#FFF8E1] transition-colors group">
                                      <td className="px-6 py-4 pl-8 border-r border-gray-200">
                                          <div className="flex items-center gap-4">
                                              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                  <User size={18} />
                                              </div>
                                              <div>
                                                  <div className="font-bold text-gray-900 text-sm">{u.username}</div>
                                                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">ID: #{u.id}</div>
                                              </div>
                                          </div>
                                      </td>
                                      <td className="px-6 py-4 border-r border-gray-200 font-medium text-gray-800">
                                          <div className="flex items-center gap-2 text-xs">
                                              <Mail size={14} className="text-gray-400" />
                                              {u.email}
                                          </div>
                                      </td>
                                      <td className="px-6 py-4 border-r border-gray-200">
                                          <div className="flex flex-wrap gap-1.5">
                                              {u.roles.map(r => (
                                                  <span key={r} className="px-2.5 py-1 rounded bg-gray-100 text-[10px] font-bold text-gray-700 border border-gray-200">
                                                      {ROLE_LABELS[r]}
                                                  </span>
                                              ))}
                                          </div>
                                      </td>
                                      <td className="px-6 py-4 text-center pr-8">
                                          <div className="flex items-center justify-center gap-1.5">
                                              <button onClick={() => openEdit(u)} className="p-2 rounded hover:bg-blue-100 text-blue-600 transition-all" title="Chỉnh sửa">
                                                  <Edit3 size={16} />
                                              </button>
                                              <button onClick={() => { setResetUserId(u.id); setNewPassword("") }} className="p-2 rounded hover:bg-amber-100 text-amber-600 transition-all" title="Đổi mật khẩu">
                                                  <Key size={16} />
                                              </button>
                                              <button onClick={() => handleDelete(u.id)} className="p-2 rounded hover:bg-red-100 text-red-600 transition-all" title="Xóa tài khoản">
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
                    className="bg-white rounded-lg p-8 border border-gray-300 shadow-xl w-full max-w-lg space-y-6 font-sans"
                  >
                        <div className="flex items-center gap-4 border-b border-gray-200 pb-4">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                                <User size={20} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-black tracking-tight leading-none">{editingUser ? "Cập nhật" : "Tạo mới"} người dùng</h3>
                                <p className="text-[11px] font-medium text-gray-500 mt-1">Vui lòng nhập đầy đủ thông tin hệ thống</p>
                            </div>
                        </div>

                        <div className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider pl-1">Tên đăng nhập <span className="text-red-500">*</span></label>
                                <Input 
                                    value={formUsername} 
                                    onChange={e => setFormUsername(e.target.value)} 
                                    disabled={!!editingUser}
                                    className="h-11 rounded-lg bg-white border border-gray-300 focus:border-blue-500 text-sm font-medium text-gray-800"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider pl-1">Email liên hệ <span className="text-red-500">*</span></label>
                                <Input 
                                    value={formEmail} 
                                    onChange={e => setFormEmail(e.target.value)}
                                    className="h-11 rounded-lg bg-white border border-gray-300 focus:border-blue-500 text-sm font-medium text-gray-800"
                                />
                            </div>
                            {!editingUser && (
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider pl-1">Mật khẩu ban đầu <span className="text-red-500">*</span></label>
                                    <Input 
                                        type="password"
                                        value={formPassword} 
                                        onChange={e => setFormPassword(e.target.value)}
                                        className="h-11 rounded-lg bg-white border border-gray-300 focus:border-blue-500 text-sm font-medium text-gray-800"
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider pl-1">Phân vai trò <span className="text-red-500">*</span></label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                    {roles.filter(r => r.name !== "ROLE_ADMIN").map(r => {
                                        const selected = formRoles.includes(r.name)
                                        return (
                                            <button 
                                                key={r.name} 
                                                onClick={() => toggleRole(r.name)}
                                                className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                                                    selected ? 'bg-blue-50 border-blue-600 text-blue-600 font-bold' : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                                                }`}
                                            >
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${selected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                                                    {selected && <CheckCircle2 size={12} className="text-white stroke-[3]" />}
                                                </div>
                                                <span className="text-xs font-semibold">{r.displayName}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-gray-200 mt-6">
                            <Button onClick={handleSave} className="flex-1 h-11 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm">
                                <Save size={16} className="mr-2" /> Lưu thông tin
                            </Button>
                            <Button variant="ghost" onClick={() => setShowForm(false)} className="px-6 h-11 rounded-lg font-bold text-xs uppercase text-gray-500 hover:bg-gray-100 border border-gray-300">
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
                    className="bg-white rounded-lg p-8 border border-gray-300 shadow-xl w-full max-w-sm space-y-6 font-sans"
                  >
                        <div className="flex flex-col items-center text-center gap-3 pb-2 border-b border-gray-200">
                            <div className="w-14 h-14 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                                <Lock size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-black tracking-tight leading-none">Đổi mật khẩu</h3>
                            <p className="text-[11px] font-medium text-gray-500">Thiết lập mật khẩu truy cập mới</p>
                        </div>

                        <div className="space-y-4">
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input 
                                    type="password" 
                                    placeholder="Nhập mật khẩu mới..."
                                    value={newPassword} 
                                    onChange={e => setNewPassword(e.target.value)}
                                    className="h-11 pl-10 rounded-lg bg-white border border-gray-300 focus:border-blue-500 text-sm font-medium text-gray-800"
                                />
                            </div>
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2.5 text-xs text-blue-800">
                                <Info className="text-blue-600 w-4 h-4 flex-shrink-0 mt-0.5" />
                                <span>Mật khẩu mới sẽ có hiệu lực ngay lập tức sau khi xác nhận.</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2.5 pt-2">
                            <Button onClick={handleResetPassword} className="h-11 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm">
                                Xác nhận đổi
                            </Button>
                            <Button variant="ghost" onClick={() => setResetUserId(null)} className="h-11 rounded-lg font-bold text-xs uppercase text-gray-500 hover:bg-gray-100 border border-gray-300">
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
