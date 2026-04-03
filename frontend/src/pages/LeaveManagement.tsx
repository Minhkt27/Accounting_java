import { useState, useEffect, useCallback } from "react"
import axios from "axios"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { PlaneTakeoff, Trash2 } from "lucide-react"
import type { Leave, Employee, LeaveType } from "../types"

export default function LeaveManagementPage() {
  const [leaves, setLeaves] = useState<Leave[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
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
      const resE = await axios.get("/api/employees", auth)
      setEmployees(resE.data)
    } catch (err: unknown) { 
        const message = err instanceof Error ? err.message : String(err)
        alert("Lỗi tải dữ liệu: " + message) 
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await axios.post("/api/leaves", newLeave, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      })
      fetchData()
      alert("Đã ghi nhận ngày nghỉ!")
    } catch (err: unknown) { 
        const message = err instanceof Error ? err.message : String(err)
        alert("Lỗi lưu dữ liệu: " + message) 
    }
  }

  const handleDelete = async (id: number) => {
    if(!confirm("Xóa bản ghi này?")) return
    await axios.delete(`/api/leaves/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
    fetchData()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <PlaneTakeoff className="w-6 h-6" /> Biến động nhân sự (UC09)
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <form onSubmit={handleSave} className="border p-6 rounded-xl bg-card space-y-4 shadow-sm h-fit">
          <h3 className="font-semibold text-lg">Đăng ký nghỉ</h3>
          <div className="space-y-2">
            <label className="text-sm font-medium">Nhân viên</label>
            <select 
              value={newLeave.employee.id} onChange={e => setNewLeave({...newLeave, employee: {id: e.target.value}})}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
            >
              <option value="">-- Chọn nhân viên --</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.id} - {e.fullName}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Loại nghỉ</label>
            <select 
              value={newLeave.leaveType} onChange={e => setNewLeave({...newLeave, leaveType: e.target.value as LeaveType})}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="ANNUAL">Nghỉ phép năm (CTY trả)</option>
              <option value="SICK">Nghỉ ốm (BH trả)</option>
              <option value="MATERNITY">Nghỉ thai sản (BH trả)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Từ ngày</label>
            <Input type="date" value={newLeave.startDate} onChange={e => setNewLeave({...newLeave, startDate: e.target.value})} required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Đến ngày</label>
            <Input type="date" value={newLeave.endDate} onChange={e => setNewLeave({...newLeave, endDate: e.target.value})} required />
          </div>

          {newLeave.startDate && newLeave.endDate && (
            <div className="p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                💡 Dự kiến tính: <strong>{(() => {
                    let count = 0;
                    const curr = new Date(newLeave.startDate);
                    const end = new Date(newLeave.endDate);
                    while (curr <= end) {
                        const day = curr.getDay();
                        if (day !== 0 && day !== 6) count++;
                        curr.setDate(curr.getDate() + 1);
                    }
                    return count;
                })()}</strong> ngày công
            </div>
          )}

          <Button type="submit" className="w-full">Lưu biến động</Button>
        </form>

        <div className="col-span-2 border rounded-xl bg-card shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted">
              <tr>
                <th className="p-4">Mã NV</th>
                <th className="p-4">Họ tên</th>
                <th className="p-4">Loại nghỉ</th>
                <th className="p-4">Từ ngày</th>
                <th className="p-4">Đến ngày</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {leaves.map((l, i) => (
                <tr key={i} className="hover:bg-muted/30">
                  <td className="p-4 font-bold text-muted-foreground">{l.employee.id}</td>
                  <td className="p-4">{l.employee.fullName}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        l.leaveType === 'ANNUAL' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                    }`}>{l.leaveType}</span>
                  </td>
                  <td className="p-4">{l.startDate}</td>
                  <td className="p-4">{l.endDate}</td>
                  <td className="p-4">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(l.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
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
