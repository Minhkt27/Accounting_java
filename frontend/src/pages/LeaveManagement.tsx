import { useState, useEffect, useCallback } from "react"
import axios from "axios"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { PlaneTakeoff, Trash2, Pencil, X } from "lucide-react"
import type { Leave, Employee, LeaveType } from "../types"

export default function LeaveManagementPage() {
  const [leaves, setLeaves] = useState<Leave[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [newLeave, setNewLeave] = useState<{
    employee: { id: string };
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
  }>({ employee: { id: "" }, leaveType: "ANNUAL", startDate: "", endDate: "" })

  const fetchData = useCallback(async () => {
    try {
      const auth = { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      const resL = await axios.get("/api/leaves", auth)
      setLeaves(resL.data)
      const resE = await axios.get("/api/employees?size=1000", auth)
      setEmployees(resE.data.content || [])
    } catch (err: unknown) { 
        const message = err instanceof Error ? err.message : String(err)
        alert("Lỗi tải dữ liệu: " + message) 
    }
  }, [])

  useEffect(() => { 
    const timer = setTimeout(() => {
      fetchData() 
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchData])

  const resetForm = () => {
    setEditingId(null)
    setNewLeave({ employee: { id: "" }, leaveType: "ANNUAL", startDate: "", endDate: "" })
  }

  const handleEdit = (leave: Leave) => {
    setEditingId(leave.id)
    setNewLeave({
      employee: { id: String(leave.employee.id) },
      leaveType: leave.leaveType,
      startDate: leave.startDate,
      endDate: leave.endDate
    })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLeave.startDate || !newLeave.endDate) return
    if (new Date(newLeave.startDate) > new Date(newLeave.endDate)) {
        alert("Ngày bắt đầu không thể sau ngày kết thúc!")
        return
    }

    try {
      const auth = { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      if (editingId !== null) {
        await axios.put(`/api/leaves/${editingId}`, newLeave, auth)
        alert("Đã cập nhật ngày nghỉ!")
      } else {
        await axios.post("/api/leaves", newLeave, auth)
        alert("Đã ghi nhận ngày nghỉ!")
      }
      fetchData()
      resetForm()
    } catch (err: unknown) { 
        const message = axios.isAxiosError(err) ? (err.response?.data || err.message) : String(err)
        alert("Lỗi lưu dữ liệu: " + message) 
    }
  }

  const handleDelete = async (id: number) => {
    if(!confirm("Xóa bản ghi này?")) return
    await axios.delete(`/api/leaves/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
    if (editingId === id) resetForm()
    fetchData()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <PlaneTakeoff className="w-6 h-6" /> Danh sách nghỉ phép
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <form onSubmit={handleSave} className="border p-6 rounded-xl bg-card space-y-4 shadow-sm h-fit">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">
              {editingId !== null ? "Sửa nghỉ phép" : "Đăng ký nghỉ phép"}
            </h3>
            {editingId !== null && (
              <Button type="button" variant="ghost" size="icon" onClick={resetForm} title="Hủy sửa">
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {editingId !== null && (
            <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 font-medium">
              Đang sửa bản ghi #{editingId}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Loại nghỉ</label>
            <select 
              value={newLeave.leaveType} 
              onChange={e => {
                const type = e.target.value as LeaveType;
                let end = newLeave.endDate;
                if (type === "MATERNITY" && newLeave.startDate) {
                  const start = new Date(newLeave.startDate);
                  start.setMonth(start.getMonth() + 6);
                  end = start.toISOString().split('T')[0];
                }
                setNewLeave({...newLeave, leaveType: type, endDate: end, employee: {id: ""}}); // Reset nhân viên khi đổi loại nghỉ để đảm bảo lọc đúng
              }}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="ANNUAL">Nghỉ phép năm</option>
              <option value="MATERNITY">Nghỉ thai sản (6 tháng)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Nhân viên ({newLeave.leaveType === 'MATERNITY' ? 'Chỉ hiện Lao động nữ' : 'Hiện tất cả'})</label>
            <select 
              value={newLeave.employee.id} onChange={e => setNewLeave({...newLeave, employee: {id: e.target.value}})}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
            >
              <option value="">-- Chọn nhân viên --</option>
              {employees
                .filter(e => e.status !== 'LEFT') 
                .filter(e => {
                  if (newLeave.leaveType === 'MATERNITY') {
                    return e.gender === 'Nữ';
                  }
                  return true;
                })
                .map(e => <option key={e.id} value={e.id}>{e.id} - {e.fullName} ({e.gender})</option>)
              }
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Từ ngày</label>
            <Input 
                type="date" 
                value={newLeave.startDate} 
                onChange={e => {
                    const startVal = e.target.value;
                    let end = newLeave.endDate;
                    if (newLeave.leaveType === 'MATERNITY' && startVal) {
                        const start = new Date(startVal);
                        start.setMonth(start.getMonth() + 6);
                        end = start.toISOString().split('T')[0];
                    }
                    setNewLeave({...newLeave, startDate: startVal, endDate: end});
                }} 
                required 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Đến ngày {newLeave.leaveType === 'MATERNITY' && <span className="text-[10px] text-purple-600 font-bold">(Tự động 6 tháng)</span>}</label>
            <Input 
                type="date" 
                value={newLeave.endDate} 
                onChange={e => setNewLeave({...newLeave, endDate: e.target.value})} 
                disabled={newLeave.leaveType === 'MATERNITY'}
                required 
            />
          </div>

          {newLeave.startDate && newLeave.endDate && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800 space-y-1 shadow-inner">
                <div className="flex justify-between items-center">
                    <span className="font-medium">Tổng số ngày nghỉ:</span>
                    <span className="font-black text-lg text-blue-600">
                        {(() => {
                            const start = new Date(newLeave.startDate).getTime();
                            const end = new Date(newLeave.endDate).getTime();
                            return Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
                        })()} ngày
                    </span>
                </div>
                <div className="flex justify-between items-center text-[10px] opacity-70 italic border-t border-blue-100 pt-1">
                    <span>Trong đó ngày công:</span>
                    <span className="font-bold">
                        {(() => {
                            let count = 0;
                            const curr = new Date(newLeave.startDate);
                            const end = new Date(newLeave.endDate);
                            while (curr <= end) {
                                const day = curr.getDay();
                                if (day !== 0 && day !== 6) count++;
                                curr.setDate(curr.getDate() + 1);
                            }
                            return count;
                        })()} ngày
                    </span>
                </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button type="submit" className={`flex-1 ${editingId !== null ? 'bg-amber-600 hover:bg-amber-700' : ''}`}>
              {editingId !== null ? "Cập nhật" : "Lưu biến động"}
            </Button>
            {editingId !== null && (
              <Button type="button" variant="outline" onClick={resetForm}>Hủy</Button>
            )}
          </div>
        </form>

        <div className="col-span-2 border rounded-xl bg-card shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-primary text-primary-foreground">
              <tr>
                <th className="p-4">Mã NV</th>
                <th className="p-4">Họ tên</th>
                <th className="p-4">Loại nghỉ</th>
                <th className="p-4">Từ ngày</th>
                <th className="p-4">Đến ngày</th>
                <th className="p-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {leaves.map((l) => (
                <tr key={l.id} className={`hover:bg-muted/30 transition-colors ${editingId === l.id ? 'bg-amber-50 ring-1 ring-amber-200' : ''}`}>
                  <td className="p-4 font-bold text-muted-foreground">{l.employee.id}</td>
                  <td className="p-4">{l.employee.fullName}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        l.leaveType === 'ANNUAL' ? 'bg-blue-100 text-blue-700' : 
                        'bg-purple-100 text-purple-700'
                    }`}>{l.leaveType === 'ANNUAL' ? 'Phép năm' : 'Thai sản'}</span>
                  </td>
                  <td className="p-4">{l.startDate}</td>
                  <td className="p-4">{l.endDate}</td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(l)} title="Sửa">
                        <Pencil className="w-4 h-4 text-amber-600" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(l.id)} title="Xóa">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
