import { useState, useEffect, useMemo, useCallback } from "react"
import axios from "axios"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { 
  Plus, CheckCircle, XCircle, FileSpreadsheet, 
  ArrowUpDown, Award, AlertTriangle, DollarSign, Pencil, Trash2, Clock,
  type LucideIcon 
} from "lucide-react"
import { ExportService } from "../utils/ExportService"

import { Pagination } from "../components/ui/pagination"

interface SalaryChange {
  id: number
  employeeId: string
  employeeName: string
  changeType: string
  oldValue: number
  newValue: number
  reason: string
  effectiveDate: string
  status: string
  createdBy: string
  approvedBy: string | null
  approvedAt: string | null
  rejectionReason: string | null
  createdAt: string
}

interface Employee {
  id: string
  fullName: string
  contractSalary: number
  active?: boolean
}

const CHANGE_TYPES: Record<string, { label: string; icon: LucideIcon; color: string }> = {
  SALARY_ADJUSTMENT: { label: "Điều chỉnh lương", icon: DollarSign, color: "blue" },
  REWARD: { label: "Khen thưởng", icon: Award, color: "amber" },
  DISCIPLINE: { label: "Kỷ luật", icon: AlertTriangle, color: "red" },
}

export default function SalaryChangePage() {
  const [changes, setChanges] = useState<SalaryChange[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [pageSize] = useState(20)

  const [showForm, setShowForm] = useState(false)
  const [filterStatus, setFilterStatus] = useState("")
  const [rejectId, setRejectId] = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState("")

  // Form fields
  const [formEmployeeId, setFormEmployeeId] = useState("")
  const [formChangeType, setFormChangeType] = useState("SALARY_ADJUSTMENT")
  const [formOldValue, setFormOldValue] = useState(0)
  const [formNewValue, setFormNewValue] = useState(0)
  const [formReason, setFormReason] = useState("")
  const [formEffectiveDate, setFormEffectiveDate] = useState(new Date().toISOString().split('T')[0])

  // Editing state
  const [editingId, setEditingId] = useState<number | null>(null)

  const headers = useMemo(() => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`
  }), [])

  const [allowedFunctions, setAllowedFunctions] = useState<string[]>([])

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) return
    axios.get("/api/auth/my-permissions", {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setAllowedFunctions(res.data)).catch(() => { })
  }, [])

  const userRoles = useMemo(() => {
    try {
      const raw = localStorage.getItem("user")
      if (!raw) return []
      return JSON.parse(raw).roles || []
    } catch { return [] }
  }, [])

  const isDirectAdmin = userRoles.includes("ROLE_NHAN_SU") || userRoles.includes("ROLE_ADMIN")
  const canApprove = userRoles.includes("ROLE_ADMIN") || userRoles.includes("ROLE_KE_TOAN_TRUONG") || allowedFunctions.includes("HR_SALARY_CHANGE_APPROVE")

  useEffect(() => {
    setPage(0)
  }, [filterStatus])

  const fetchChanges = useCallback(async () => {
    try {
      const baseUrl = "/api/salary-changes"
      const params = new URLSearchParams()
      params.append("page", page.toString())
      params.append("size", pageSize.toString())
      if (!isDirectAdmin && filterStatus) {
        params.append("status", filterStatus)
      } else if (isDirectAdmin && filterStatus) {
        params.append("status", filterStatus)
      }

      const res = await axios.get(`${baseUrl}?${params.toString()}`, { headers })
      setChanges(res.data.content)
      setTotalPages(res.data.totalPages)
      setTotalElements(res.data.totalElements)
    } catch (err) { console.error(err) }
  }, [filterStatus, isDirectAdmin, headers, page, pageSize])

  const fetchEmployees = useCallback(async () => {
    try {
      // API employees cũng đã phân trang, nhưng ở đây form tạo biến động cần list active để chọn.
      // Tạm thời lấy trang đầu tiên hoặc lấy list đầy đủ nếu có API riêng. 
      // Do đã cập nhật repository trả về Page, nên ta lấy trang 0 size lớn để demo.
      const res = await axios.get("/api/employees?page=0&size=1000", { headers })
      setEmployees(res.data.content.filter((e: Employee) => e.active))
    } catch (err) { console.error(err) }
  }, [headers])

  useEffect(() => { 
    fetchChanges(); 
    fetchEmployees(); 
  }, [fetchChanges, fetchEmployees])

  // Auto-fill old salary when employee is selected (only when creating new)
  useEffect(() => {
    if (formEmployeeId && !editingId) {
      const emp = employees.find(e => e.id === formEmployeeId)
      if (emp) {
        setFormOldValue(emp.contractSalary)
        setFormNewValue(emp.contractSalary) 
      }
    }
  }, [formEmployeeId, employees, editingId])

  const handleCreateOrUpdate = async () => {
    try {
      const data = {
        employeeId: formEmployeeId,
        changeType: formChangeType,
        oldValue: (formChangeType === 'REWARD' || formChangeType === 'DISCIPLINE') ? 0 : formOldValue,
        newValue: formNewValue,
        reason: formReason,
        effectiveDate: formEffectiveDate,
      };

      if (editingId) {
        await axios.put(`/api/salary-changes/${editingId}`, data, { headers })
        alert("Đã cập nhật biến động thành công!")
      } else {
        const res = await axios.post("/api/salary-changes", data, { headers })
        alert(res.data.message || "Đã lưu biến động thành công!")
      }
      
      setShowForm(false)
      setEditingId(null)
      resetForm()
      fetchChanges()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Lỗi khi lưu dữ liệu"
      alert(message)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bản ghi biến động này?")) return
    try {
      await axios.delete(`/api/salary-changes/${id}`, { headers })
      alert("Đã xóa thành công")
      fetchChanges()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Lỗi khi xóa"
      alert(message)
    }
  }

  const startEdit = (c: SalaryChange) => {
    setEditingId(c.id)
    setFormEmployeeId(c.employeeId)
    setFormChangeType(c.changeType)
    setFormOldValue(c.oldValue)
    setFormNewValue(c.newValue)
    setFormReason(c.reason)
    setFormEffectiveDate(c.effectiveDate)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleExportExcel = () => {
    ExportService.exportToExcel(
      changes,
      'Bien_dong_luong',
      'Biến động',
      {
        id: "ID",
        employeeId: "Mã NV",
        employeeName: "Họ tên",
        changeType: "Loại biến động",
        oldValue: "Giá trị cũ",
        newValue: "Giá trị mới",
        reason: "Lý do",
        effectiveDate: "Ngày hiệu lực",
        status: "Trạng thái"
      }
    );
  }

  const handleApprove = async (id: number) => {
    if (!confirm("Bạn có chắc muốn phê duyệt biến động này?")) return
    try {
      await axios.post(`/api/salary-changes/${id}/approve`, {}, { headers })
      alert("Đã phê duyệt thành công!")
      fetchChanges()
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi")
    }
  }

  const handleReject = async () => {
    if (!rejectId) return
    try {
      await axios.post(`/api/salary-changes/${rejectId}/reject`, { reason: rejectReason }, { headers })
      alert("Đã từ chối biến động!")
      setRejectId(null)
      setRejectReason("")
      fetchChanges()
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi")
    }
  }

  const resetForm = () => {
    setFormEmployeeId("")
    setFormChangeType("SALARY_ADJUSTMENT")
    setFormOldValue(0)
    setFormNewValue(0)
    setFormReason("")
    setFormEffectiveDate(new Date().toISOString().split('T')[0])
    setEditingId(null)
  }

  const formatVND = (val: number) =>
    new Intl.NumberFormat('vi-VN').format(Math.round(val || 0))

  const pendingCount = changes.filter(c => c.status === "PENDING").length

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ArrowUpDown className="w-6 h-6 text-primary" /> Biến động Lương & Nhân sự
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Quản lý các thay đổi lương, thăng chức, khen thưởng, kỷ luật</p>
        </div>
        <div className="flex items-center gap-3">
          {!isDirectAdmin && pendingCount > 0 && (
            <span className="px-3 py-1 text-xs font-black bg-amber-100 text-amber-700 rounded-full border border-amber-200 animate-pulse">
              {pendingCount} chờ duyệt
            </span>
          )}
          <Button variant="outline" onClick={handleExportExcel} className="gap-2 border-green-600 text-green-600 hover:bg-green-50">
            <FileSpreadsheet className="w-4 h-4" /> Xuất Excel
          </Button>
          <Button onClick={() => { if(showForm) resetForm(); setShowForm(!showForm) }} className="gap-2">
            <Plus className="w-4 h-4" /> {isDirectAdmin ? "Thêm biến động" : "Tạo đề xuất"}
          </Button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white border border-primary/20 rounded-2xl p-6 shadow-xl shadow-primary/5 space-y-4">
          <h3 className="font-bold text-sm uppercase text-primary tracking-wider flex items-center gap-2">
            {editingId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {editingId ? `Cập nhật biến động #${editingId}` : isDirectAdmin ? "Thêm biến động nhân sự mới" : "Tạo đề xuất biến động mới"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500">Nhân viên</label>
              <select 
                disabled={!!editingId}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-primary/20 outline-none disabled:bg-slate-50"
                value={formEmployeeId} 
                onChange={e => setFormEmployeeId(e.target.value)}
              >
                <option value="">-- Chọn nhân viên --</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>{e.id} — {e.fullName}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500">Loại biến động</label>
              <select 
                className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-primary/20 outline-none"
                value={formChangeType} 
                onChange={e => setFormChangeType(e.target.value)}
              >
                {Object.entries(CHANGE_TYPES).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500">Ngày hiệu lực</label>
              <Input type="date" value={formEffectiveDate} onChange={e => setFormEffectiveDate(e.target.value)} />
            </div>
            {(formChangeType !== 'REWARD' && formChangeType !== 'DISCIPLINE') && (
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500">Lương cũ</label>
                <Input type="text" value={formatVND(formOldValue)} onChange={e => {
                  const raw = e.target.value.replace(/\./g, '').replace(/[^0-9]/g, '');
                  setFormOldValue(Number(raw))
                }} />
              </div>
            )}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500">
                {formChangeType === 'REWARD' ? 'Số tiền thưởng' : formChangeType === 'DISCIPLINE' ? 'Số tiền phạt' : 'Lương mới'}
              </label>
              <Input type="text" value={formatVND(formNewValue)} onChange={e => {
                const raw = e.target.value.replace(/\./g, '').replace(/[^0-9]/g, '');
                setFormNewValue(Number(raw))
              }} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500">Lý do</label>
              <Input value={formReason} onChange={e => setFormReason(e.target.value)} placeholder="Nhập lý do biến động..." />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { setShowForm(false); resetForm() }}>Hủy</Button>
            <Button onClick={handleCreateOrUpdate} disabled={!formEmployeeId || !formReason}>
              <CheckCircle className="w-4 h-4 mr-1" /> {editingId ? "Cập nhật thay đổi" : isDirectAdmin ? "Lưu biến động" : "Gửi đề xuất"}
            </Button>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {[
          { value: "", label: "Tất cả" },
          { value: "PENDING", label: "Chờ duyệt" },
          { value: "APPROVED", label: "Đã duyệt" },
          { value: "REJECTED", label: "Từ chối" },
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilterStatus(tab.value)}
            className={`px-4 py-2 text-xs font-black rounded-xl transition-all border ${
              filterStatus === tab.value
                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                : "bg-white text-slate-500 border-slate-200 hover:border-primary/30 hover:text-primary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="border rounded-xl bg-card shadow-lg overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-[#111827] text-white">
            <tr>
              <th className="px-4 py-4 font-bold">#</th>
              <th className="px-4 py-4 font-bold">Nhân viên</th>
              <th className="px-4 py-4 font-bold">Loại biến động</th>
              <th className="px-4 py-4 font-bold text-right">Trước biến động</th>
              <th className="px-4 py-4 font-bold text-right">Sau biến động</th>
              <th className="px-4 py-4 font-bold">Lý do</th>
              <th className="px-4 py-4 font-bold text-center">Trạng thái</th>
              <th className="px-4 py-4 font-bold">Ngày hiệu lực</th>
              <th className="px-4 py-4 font-bold text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {changes.map(c => {
              const typeInfo = CHANGE_TYPES[c.changeType] || { label: c.changeType, color: "slate" }
              const diff = c.newValue - c.oldValue
              return (
                <tr key={c.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-4 text-muted-foreground font-mono text-xs">#{c.id}</td>
                  <td className="px-4 py-4">
                    <div className="font-bold">{c.employeeName}</div>
                    <div className="text-[10px] text-slate-400">{c.employeeId}</div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] font-black rounded-lg bg-${typeInfo.color}-50 text-${typeInfo.color}-700 border border-${typeInfo.color}-200`}>
                      {typeInfo.label}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right tabular-nums font-medium text-slate-500">
                    {(c.changeType === 'REWARD' || c.changeType === 'DISCIPLINE') ? '' : formatVND(c.oldValue)}
                  </td>
                  <td className="px-4 py-4 text-right tabular-nums font-bold">
                    <span className={diff >= 0 ? "text-green-600" : "text-red-600"}>
                      {formatVND(c.newValue)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-600 max-w-[200px] truncate" title={c.reason}>{c.reason}</td>
                  <td className="px-4 py-4 text-center">
                      <span className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg shadow-sm border ${
                      c.status === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-200' :
                      c.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                      {c.status === 'PENDING' ? '⏳ Chờ duyệt' : c.status === 'APPROVED' ? '✅ Đã duyệt' : '❌ Từ chối'}
                      </span>
                      {c.rejectionReason && (
                      <p className="text-[10px] text-red-500 mt-1 italic">"{c.rejectionReason}"</p>
                      )}
                  </td>
                  <td className="px-4 py-4 text-xs text-slate-500 tabular-nums">{c.effectiveDate}</td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex items-center gap-1 justify-center">
                        {isDirectAdmin && (
                            <>
                                <button
                                    onClick={() => startEdit(c)}
                                    className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors border border-blue-200"
                                    title="Chỉnh sửa"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(c.id)}
                                    className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors border border-red-200"
                                    title="Xóa"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </>
                        )}
                        {c.status === 'PENDING' && canApprove && (
                            <>
                                <button
                                    onClick={() => handleApprove(c.id)}
                                    className="p-1.5 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors border border-green-200"
                                    title="Phê duyệt"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setRejectId(c.id)}
                                    className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors border border-red-200"
                                    title="Từ chối"
                                >
                                    <XCircle className="w-4 h-4" />
                                </button>
                            </>
                        )}
                    </div>
                  </td>
                </tr>
              )
            })}
            {changes.length === 0 && (
              <tr>
                <td colSpan={isDirectAdmin ? 8 : 9} className="px-6 py-16 text-center text-muted-foreground/60 italic">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-10" />
                  Chưa có biến động nào{filterStatus ? ` ở trạng thái "${filterStatus}"` : ""}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <Pagination 
          currentPage={page}
          totalPages={totalPages}
          totalElements={totalElements}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </div>

      {rejectId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2 text-red-600">
              <XCircle className="w-5 h-5" /> Từ chối biến động #{rejectId}
            </h3>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500">Lý do từ chối</label>
              <textarea
                className="w-full border rounded-lg px-3 py-2 text-sm min-h-[80px] focus:ring-2 focus:ring-red-200 outline-none"
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Nhập lý do từ chối..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setRejectId(null); setRejectReason("") }}>Hủy</Button>
              <Button onClick={handleReject} disabled={!rejectReason} className="bg-red-600 hover:bg-red-700 text-white">
                <XCircle className="w-4 h-4 mr-1" /> Xác nhận từ chối
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
