import { useState, useEffect } from "react"
import axios from "axios"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Plus, UserRoundCheck, Edit, Trash2, Eye, X, FileUp, FileText } from "lucide-react"

interface Employee {
  id: string
  fullName: string
  contractSalary: number
  dependentCount: number
  positionCoefficient: number
  seniorityAllowance: number
  employeeType: string
  active: boolean
  dob: string
  phone: string
  email: string
  hometown: string
  contractFilePath?: string
}

export default function EmployeeList() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [showForm, setShowForm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [viewOnly, setViewOnly] = useState(false)
  const [currentEmp, setCurrentEmp] = useState<Partial<Employee>>({
    id: "", fullName: "", contractSalary: undefined, dependentCount: 0, 
    positionCoefficient: 0.0, seniorityAllowance: 0.0,
    employeeType: "FULL_TIME", 
    active: true, dob: "", phone: "", email: "", hometown: ""
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchEmployees = async () => {
    try {
      const res = await axios.get("/api/employees", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      })
      setEmployees(res.data)
      setLoading(false)
    } catch (err) { console.error(err); setLoading(false) }
  }

  useEffect(() => { fetchEmployees() }, [])

  const validate = () => {
    if (!currentEmp.id || !currentEmp.fullName || !currentEmp.dob) {
      alert("Vui lòng nhập đầy đủ các trường bắt buộc (*)")
      return false
    }
    if (currentEmp.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentEmp.email)) {
      alert("Email không đúng định dạng")
      return false
    }
    if (currentEmp.phone && !/^(0|\+84)\d{8,11}$/.test(currentEmp.phone.replace(/\s/g, ""))) {
      alert("Số điện thoại không đúng định dạng (8-11 số)")
      return false
    }
    if (currentEmp.contractSalary && currentEmp.contractSalary < 0) {
      alert("Lương không được âm")
      return false
    }
    if (new Date(currentEmp.dob!) > new Date()) {
      alert("Ngày sinh không được vượt quá ngày hiện tại")
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    try {
      const auth = { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      let savedEmp: any
      if (isEditing) {
        const res = await axios.put(`/api/employees/${currentEmp.id}`, currentEmp, auth)
        savedEmp = res.data
      } else {
        const res = await axios.post("/api/employees", currentEmp, auth)
        savedEmp = res.data
      }

      // Xử lý upload file nếu có
      if (selectedFile && savedEmp) {
        const formData = new FormData()
        formData.append("file", selectedFile)
        await axios.post(`/api/employees/upload-contract/${savedEmp.id}`, formData, {
          headers: { 
            ...auth.headers,
            "Content-Type": "multipart/form-data" 
          }
        })
      }

      resetForm()
      fetchEmployees()
      alert("Đã lưu thông tin nhân sự!")
    } catch (err) { alert("Lỗi khi lưu nhân viên") }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa nhân viên ${id}?`)) return
    try {
      await axios.delete(`/api/employees/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      })
      fetchEmployees()
    } catch (err) { alert("Lỗi khi xóa nhân viên") }
  }

  const handleEdit = (emp: Employee) => {
    setCurrentEmp(emp)
    setIsEditing(true)
    setViewOnly(false)
    setShowForm(true)
    setSelectedFile(null)
  }

  const handleView = (emp: Employee) => {
    setCurrentEmp(emp)
    setIsEditing(false)
    setViewOnly(true)
    setShowForm(true)
  }

  const resetForm = () => {
    setShowForm(false)
    setIsEditing(false)
    setViewOnly(false)
    setCurrentEmp({ id: "", fullName: "", contractSalary: undefined, dependentCount: undefined, positionCoefficient: 0.0, seniorityAllowance: 0.0, employeeType: "FULL_TIME", active: true, dob: "", phone: "", email: "", hometown: "" })
    setSelectedFile(null)
  }

  const handleDownloadContract = (id: string) => {
    const token = localStorage.getItem("token")
    window.open(`/api/employees/download-contract/${id}?access_token=${token}`, "_blank")
  }

  const handleOpenAddForm = async () => {
    try {
      const res = await axios.get("/api/employees/next-id", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      })
      setCurrentEmp({ ...currentEmp, id: res.data })
      setShowForm(true)
    } catch (err) {
      setShowForm(true) // Fallback if API fails
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <UserRoundCheck className="w-6 h-6 text-primary" /> Hồ sơ nhân sự nâng cao (UC07-08)
        </h1>
        {!showForm && (
          <Button onClick={handleOpenAddForm} className="gap-2">
            <Plus className="w-4 h-4" /> Thêm nhân viên
          </Button>
        )}
      </div>

      {showForm && (
        <div className="border p-6 rounded-xl bg-card shadow-lg relative animate-in zoom-in-95 duration-200">
          <button onClick={resetForm} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-bold mb-6">
            {viewOnly ? "Chi tiết nhân viên" : isEditing ? "Cập nhật thông tin" : "Tạo hồ sơ mới"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Mã NV</label>
                <Input value={currentEmp.id} onChange={e => setCurrentEmp({...currentEmp, id: e.target.value})} disabled={isEditing || viewOnly} placeholder={viewOnly ? "" : "NV001"} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Họ tên</label>
                <Input value={currentEmp.fullName} onChange={e => setCurrentEmp({...currentEmp, fullName: e.target.value})} disabled={viewOnly} placeholder={viewOnly ? "" : "Nguyễn Văn A"} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Ngày sinh</label>
                <Input type="date" value={currentEmp.dob} onChange={e => setCurrentEmp({...currentEmp, dob: e.target.value})} disabled={viewOnly} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Số điện thoại</label>
                <Input value={currentEmp.phone} onChange={e => setCurrentEmp({...currentEmp, phone: e.target.value})} disabled={viewOnly} placeholder={viewOnly ? "" : "09xxx"} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input type="email" value={currentEmp.email} onChange={e => setCurrentEmp({...currentEmp, email: e.target.value})} disabled={viewOnly} placeholder={viewOnly ? "" : "abc@company.com"} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Quê quán</label>
                <Input value={currentEmp.hometown} onChange={e => setCurrentEmp({...currentEmp, hometown: e.target.value})} disabled={viewOnly} placeholder={viewOnly ? "" : "Hà Nội"} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Lương hợp đồng (VNĐ)</label>
                <Input 
                type="number" 
                value={currentEmp.contractSalary ?? ""} 
                onChange={e => setCurrentEmp({...currentEmp, contractSalary: e.target.value === "" ? undefined : Number(e.target.value)})} 
                disabled={viewOnly}
                required 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Người phụ thuộc</label>
              <Input 
                type="number" 
                value={currentEmp.dependentCount ?? ""} 
                onChange={e => setCurrentEmp({...currentEmp, dependentCount: e.target.value === "" ? undefined : Number(e.target.value)})} 
                disabled={viewOnly}
                required 
              /></div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Hệ số chức vụ (0.4-1.0)</label>
                <Input 
                  type="number" 
                  step="0.1"
                  value={currentEmp.positionCoefficient ?? ""} 
                  onChange={e => setCurrentEmp({...currentEmp, positionCoefficient: e.target.value === "" ? undefined : Number(e.target.value)})} 
                  disabled={viewOnly}
                  placeholder="0.8"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phụ cấp thâm niên (VNĐ)</label>
                <Input 
                  type="number" 
                  value={currentEmp.seniorityAllowance ?? ""} 
                  onChange={e => setCurrentEmp({...currentEmp, seniorityAllowance: e.target.value === "" ? undefined : Number(e.target.value)})} 
                  disabled={viewOnly}
                  placeholder="500,000"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Loại nhân sự</label>
                <select value={currentEmp.employeeType} onChange={e => setCurrentEmp({...currentEmp, employeeType: e.target.value})} disabled={viewOnly} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="FULL_TIME">Chính thức</option>
                  <option value="PROBATION">Thử việc (85%)</option>
                  <option value="INTERN">Thực tập (10% Thuế)</option>
                </select>
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              <h3 className="font-semibold flex items-center gap-2"><FileText className="w-4 h-4" /> Hợp đồng lao động (PDF)</h3>
              <div className="flex items-center gap-4">
                {!viewOnly && (
                  <div className="flex-1 max-w-sm">
                    <label className="flex items-center gap-2 px-4 py-2 border border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                        <FileUp className="w-4 h-4" />
                        <span className="text-sm">{selectedFile ? selectedFile.name : "Chọn file PDF hợp đồng..."}</span>
                        <input type="file" accept=".pdf" className="hidden" onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
                    </label>
                  </div>
                )}
                {currentEmp.contractFilePath && (
                  <Button type="button" variant="outline" onClick={() => handleDownloadContract(currentEmp.id!)} className="gap-2 text-blue-600">
                    <Eye className="w-4 h-4" /> Xem hợp đồng hiện tại
                  </Button>
                )}
              </div>
            </div>

            {!viewOnly && (
              <div className="flex justify-end pt-4">
                <Button type="submit" className="px-10">{isEditing ? "Lưu thay đổi" : "Lưu hồ sơ"}</Button>
              </div>
            )}
          </form>
        </div>
      )}

      <div className="border rounded-xl bg-card shadow-sm overflow-hidden bg-white">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground uppercase text-[11px] font-bold tracking-wider">
            <tr>
              <th className="px-6 py-4">Mã NV</th>
              <th className="px-6 py-4">Họ tên</th>
              <th className="px-6 py-4">SĐT / Email</th>
              <th className="px-6 py-4 text-right">Lương HĐ</th>
              <th className="px-6 py-4 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-10 text-muted-foreground">Đang tải hồ sơ...</td></tr>
            ) : employees.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-10 text-muted-foreground italic">Chưa có dữ liệu nhân sự.</td></tr>
            ) : employees.map((emp) => (
              <tr key={emp.id} className="hover:bg-muted/30 transition-all duration-200 group">
                <td className="px-6 py-4 font-bold text-muted-foreground">{emp.id}</td>
                <td className="px-6 py-4">
                  <div className="font-medium">{emp.fullName}</div>
                  <div className="text-[10px] text-muted-foreground">{emp.employeeType}</div>
                </td>
                <td className="px-6 py-4 text-xs">
                  <div>{emp.phone || '-'}</div>
                  <div className="text-muted-foreground">{emp.email || '-'}</div>
                </td>
                <td className="px-6 py-4 text-right font-mono text-primary">
                  {new Intl.NumberFormat('vi-VN').format(emp.contractSalary)} đ
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => handleView(emp)} title="Xem chi tiết">
                      <Eye className="w-4 h-4 text-blue-500" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(emp)} title="Chỉnh sửa">
                      <Edit className="w-4 h-4 text-orange-500" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(emp.id)} title="Xóa hồ sơ">
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
  )
}
