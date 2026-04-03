import { useState, useEffect, useCallback, useMemo } from "react"
import axios from "axios"

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
        setUsers([])
        setRoles([])
        setPerms([])
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
    } catch (err: unknown) { 
        const message = err instanceof Error ? err.message : String(err)
        alert(message) 
    }
  }

  const toggleRole = (roleName: string) => {
    setFormRoles(prev => prev.includes(roleName) ? prev.filter(r => r !== roleName) : [...prev, roleName])
  }

  if (loading) {
    return (
        <div style={{ padding: "50px", textAlign: "center" }}>
            <h2 style={{ color: "blue" }}>ĐANG TẢI DỮ LIỆU...</h2>
            <p>Vui lòng đợi một lát!</p>
        </div>
    )
  }

  return (
    <div style={{ padding: "20px", background: "#f0f0f0", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", background: "white", padding: "10px", border: "2px solid black" }}>
        <div>
            <h1 style={{ color: "blue", margin: "0" }}>QUẢN TRỊ NGƯỜI DÙNG</h1>
            <p style={{ margin: "0" }}>Trang quản lý các tài khoản trong hệ thống</p>
        </div>
        <button 
            onClick={openCreate} 
            style={{ background: "blue", color: "white", padding: "10px 20px", border: "2px solid black", cursor: "pointer", fontWeight: "bold" }}
        >
            + THÊM NGƯỜI DÙNG MỚI
        </button>
      </div>

      <div style={{ background: "white", padding: "20px", border: "2px solid black", marginBottom: "30px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid black", paddingBottom: "10px", marginBottom: "20px" }}>
            <h2 style={{ margin: "0", color: "blue" }}>BẢNG PHÂN QUYỀN</h2>
            <button 
                onClick={savePerms} 
                disabled={!permDirty}
                style={{ 
                    background: permDirty ? "green" : "gray", 
                    color: "white", 
                    padding: "5px 15px", 
                    border: "2px solid black",
                    fontWeight: "bold"
                }}
            >
                LƯU THAY ĐỔI
            </button>
        </div>

        <table border={1} style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
                <tr style={{ background: "#eee" }}>
                    <th style={{ padding: "10px", border: "1px solid black" }}>CHỨC NĂNG</th>
                    <th style={{ padding: "10px", border: "1px solid black" }}>ADMIN</th>
                    {EDITABLE_ROLES.map(r => (
                        <th key={r} style={{ padding: "10px", border: "1px solid black" }}>{ROLE_LABELS[r]}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {FUNCTION_CODES.map(fn => (
                    <tr key={fn}>
                        <td style={{ padding: "8px", border: "1px solid black", fontWeight: "bold" }}>{FUNCTION_LABELS[fn]}</td>
                        <td style={{ padding: "8px", border: "1px solid black", textAlign: "center", color: "green" }}>
                            V
                        </td>
                        {EDITABLE_ROLES.map(r => {
                            const allowed = isAllowed(r, fn)
                            return (
                                <td key={r} style={{ padding: "8px", border: "1px solid black", textAlign: "center" }}>
                                    <button
                                        onClick={() => togglePerm(r, fn)}
                                        style={{ 
                                            background: allowed ? "lightgreen" : "lightpink", 
                                            padding: "5px 10px", 
                                            border: "1px solid black",
                                            cursor: "pointer",
                                            width: "30px"
                                        }}
                                    >
                                        {allowed ? "O" : "X"}
                                    </button>
                                </td>
                            )
                        })}
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      <div style={{ background: "white", padding: "20px", border: "2px solid black" }}>
        <h2 style={{ color: "blue", borderBottom: "2px solid black", paddingBottom: "10px" }}>DANH SÁCH TÀI KHOẢN</h2>
        <table border={1} style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
            <thead style={{ background: "blue", color: "white" }}>
                <tr>
                    <th style={{ padding: "10px", border: "1px solid black" }}>Tên đăng nhập</th>
                    <th style={{ padding: "10px", border: "1px solid black" }}>Email</th>
                    <th style={{ padding: "10px", border: "1px solid black" }}>Quyền</th>
                    <th style={{ padding: "10px", border: "1px solid black" }}>Sửa/Xóa</th>
                </tr>
            </thead>
            <tbody>
                {users.map(u => (
                    <tr key={u.id}>
                        <td style={{ padding: "10px", border: "1px solid black", fontWeight: "bold" }}>{u.username} (ID: {u.id})</td>
                        <td style={{ padding: "10px", border: "1px solid black" }}>{u.email}</td>
                        <td style={{ padding: "10px", border: "1px solid black" }}>
                            {u.roles.map(r => (
                                <span key={r} style={{ 
                                    padding: "2px 5px", 
                                    marginRight: "5px", 
                                    background: "#eee", 
                                    border: "1px solid gray",
                                    fontSize: "12px"
                                }}>
                                    {ROLE_LABELS[r]}
                                </span>
                            ))}
                        </td>
                        <td style={{ padding: "10px", border: "1px solid black", textAlign: "center" }}>
                            <button onClick={() => openEdit(u)} style={{ marginRight: "5px" }}>Sửa</button>
                            <button onClick={() => { setResetUserId(u.id); setNewPassword("") }} style={{ marginRight: "5px" }}>Đổi Pass</button>
                            <button onClick={() => handleDelete(u.id)} style={{ color: "red" }}>Xóa</button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {showForm && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center" }}>
              <div style={{ background: "white", padding: "30px", border: "3px solid black", width: "400px" }}>
                  <h2 style={{ borderBottom: "2px solid blue" }}>{editingUser ? "SỬA NGƯỜI DÙNG" : "THÊM NGƯỜI DÙNG"}</h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "20px" }}>
                      <label>Tên đăng nhập:</label>
                      <input value={formUsername} onChange={e => setFormUsername(e.target.value)} disabled={!!editingUser} style={{ padding: "5px", border: "1px solid black" }} />
                      
                      <label>Email:</label>
                      <input value={formEmail} onChange={e => setFormEmail(e.target.value)} style={{ padding: "5px", border: "1px solid black" }} />
                      
                      {!editingUser && (
                          <>
                            <label>Mật khẩu:</label>
                            <input type="password" value={formPassword} onChange={e => setFormPassword(e.target.value)} style={{ padding: "5px", border: "1px solid black" }} />
                          </>
                      )}

                      <label>Chọn quyền:</label>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                          {roles.filter(r => r.name !== "ROLE_ADMIN").map(r => (
                              <label key={r.name} style={{ border: "1px solid black", padding: "5px", background: formRoles.includes(r.name) ? "yellow" : "white" }}>
                                  <input type="checkbox" checked={formRoles.includes(r.name)} onChange={() => toggleRole(r.name)} />
                                  {r.displayName}
                              </label>
                          ))}
                      </div>
                  </div>
                  <div style={{ marginTop: "30px", display: "flex", gap: "10px" }}>
                      <button onClick={handleSave} style={{ flex: 1, background: "blue", color: "white", padding: "10px", border: "2px solid black", fontWeight: "bold" }}>LƯU LẠI</button>
                      <button onClick={() => setShowForm(false)} style={{ flex: 1, background: "white", border: "2px solid black" }}>ĐÓNG</button>
                  </div>
              </div>
          </div>
      )}

      {resetUserId && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center" }}>
              <div style={{ background: "white", padding: "30px", border: "3px solid black" }}>
                  <h3>ĐỔI MẬT KHẨU MỚI</h3>
                  <input type="password" placeholder="Nhập pass mới" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ padding: "10px", width: "100%" }} />
                  <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
                      <button onClick={handleResetPassword} style={{ background: "blue", color: "white", padding: "10px", border: "1px solid black" }}>XÁC NHẬN</button>
                      <button onClick={() => setResetUserId(null)}>HỦY</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  )
}
