import { useState, useEffect, useCallback } from "react"
import axios from "axios"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Plus, UserRoundCheck, Edit, Trash2, Eye, X, FileUp, FileText, FileSpreadsheet, Mail, Phone, MapPin, Calendar } from "lucide-react"
import { ExportService } from "../utils/ExportService"

interface Employee {
  id: string
  fullName: string
  contractSalary: number
  dependentCount: number
  positionCoefficient: number
  seniorityAllowance: number
  employeeType: "OFFICIAL" | "FULL_TIME" | "PROBATION" | "TRAINEE" | "INTERN" | "OTHER"
  department?: string
  active: boolean
  dob: string
  phone: string
  email: string
  hometown: string
  contractFilePath?: string
  gender?: string
  address?: string
  position?: string
  joinDate?: string
}

export default function EmployeeList() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [showForm, setShowForm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [viewOnly, setViewOnly] = useState(false)
  const [currentEmp, setCurrentEmp] = useState<Partial<Employee>>({
    id: "", fullName: "", contractSalary: 0, dependentCount: 0, 
    positionCoefficient: 0.0, seniorityAllowance: 0.0,
    employeeType: "FULL_TIME", 
    active: true, dob: "", phone: "", email: "", hometown: "",
    department: "Kế toán"
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await axios.get("/api/employees", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      })
      setEmployees(res.data)
    } catch (err: unknown) { 
        console.error(err) 
    }
  }, [])

  useEffect(() => { fetchEmployees() }, [fetchEmployees])

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
      let savedEmp: Employee | null = null
      if (isEditing) {
        const res = await axios.put(`/api/employees/${currentEmp.id}`, currentEmp, auth)
        savedEmp = res.data
      } else {
        const res = await axios.post("/api/employees", currentEmp, auth)
        savedEmp = res.data
      }

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

      alert("Đã lưu thông tin nhân sự!")
      resetForm()
      fetchEmployees()
    } catch (err: unknown) { 
        const message = err instanceof Error ? err.message : String(err)
        alert("Lỗi khi lưu nhân viên: " + message) 
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa nhân viên ${id}?`)) return
    try {
      await axios.delete(`/api/employees/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      })
      fetchEmployees()
    } catch (err: unknown) { 
        const message = err instanceof Error ? err.message : String(err)
        alert("Lỗi khi xóa nhân viên: " + message) 
    }
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
    setCurrentEmp({ id: "", fullName: "", contractSalary: 0, dependentCount: 0, positionCoefficient: 0.0, seniorityAllowance: 0.0, employeeType: "FULL_TIME", active: true, dob: "", phone: "", email: "", hometown: "", department: "Kế toán" })
    setSelectedFile(null)
  }

  const handleDownloadContract = (id: string) => {
    const token = localStorage.getItem("token")
    window.open(`/api/employees/download-contract/${id}?access_token=${token}`, "_blank")
  }

  const handleOpenAddForm = useCallback(async () => {
    try {
      const res = await axios.get("/api/employees/next-id", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      })
      setCurrentEmp(prev => ({ ...prev, id: res.data }))
      setShowForm(true)
    } catch (err: unknown) {
      setShowForm(true)
    }
  }, [])

  const handleExportExcel = () => {
    ExportService.exportToExcel(
      employees, 
      'Danh_sach_nhan_vien', 
      'Nhân viên',
      {
        id: "Mã NV",
        fullName: "Họ tên",
        dob: "Ngày sinh",
        phone: "Số điện thoại",
        email: "Email",
        hometown: "Quê quán",
        contractSalary: "Lương HĐ",
        dependentCount: "Người phụ thuộc",
        employeeType: "Loại nhân sự",
        active: "Đang làm việc"
      }
    );
  }


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <UserRoundCheck className="w-6 h-6 text-primary" /> Hồ sơ nhân sự
        </h1>
        <div className="flex items-center gap-2">
          {!showForm && (
            <>
              <Button variant="outline" onClick={handleExportExcel} className="gap-2 border-green-600 text-green-600 hover:bg-green-50">
                <FileSpreadsheet className="w-4 h-4" /> Xuất Excel
              </Button>
              <Button onClick={handleOpenAddForm} className="gap-2">
                <Plus className="w-4 h-4" /> Thêm nhân viên
              </Button>
            </>
          )}
        </div>
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
                min={0}
                value={currentEmp.contractSalary ?? ""} 
                onChange={e => {
                  e.target.value = e.target.value.replace(/^0+(?!$)/, '');
                  setCurrentEmp({...currentEmp, contractSalary: e.target.value === "" ? 0 : Number(e.target.value)})
                }} 
                disabled={viewOnly}
                required 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Người phụ thuộc</label>
              <Input 
                type="number" 
                min={0}
                value={currentEmp.dependentCount ?? ""} 
                onChange={e => {
                  e.target.value = e.target.value.replace(/^0+(?!$)/, '');
                  setCurrentEmp({...currentEmp, dependentCount: e.target.value === "" ? 0 : Number(e.target.value)})
                }} 
                disabled={viewOnly}
              /></div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Hệ số chức vụ (0.4-1.0)</label>
                <Input 
                  type="number" 
                  min={0}
                  step="0.1"
                  value={currentEmp.positionCoefficient ?? ""} 
                  onChange={e => {
                    e.target.value = e.target.value.replace(/^0+(?!$)/, '');
                    setCurrentEmp({...currentEmp, positionCoefficient: e.target.value === "" ? 0 : Number(e.target.value)})
                  }} 
                  disabled={viewOnly}
                  placeholder="0.8"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phụ cấp thâm niên (VNĐ)</label>
                <Input 
                  type="number" 
                  min={0}
                  value={currentEmp.seniorityAllowance ?? ""} 
                  onChange={e => {
                    e.target.value = e.target.value.replace(/^0+(?!$)/, '');
                    setCurrentEmp({...currentEmp, seniorityAllowance: e.target.value === "" ? 0 : Number(e.target.value)})
                  }} 
                  disabled={viewOnly}
                  placeholder="500,000"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phòng ban</label>
                <select value={currentEmp.department} onChange={e => setCurrentEmp({...currentEmp, department: e.target.value})} disabled={viewOnly} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="Kế toán">Kế toán</option>
                  <option value="Nhân sự">Nhân sự</option>
                  <option value="Kinh doanh">Kinh doanh</option>
                  <option value="Kỹ thuật">Kỹ thuật</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Loại nhân sự</label>
                <select value={currentEmp.employeeType} onChange={e => setCurrentEmp({...currentEmp, employeeType: e.target.value as any})} disabled={viewOnly} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="FULL_TIME">Chính thức</option>
                  <option value="PROBATION">Thử việc</option>
                  <option value="INTERN">Thực tập sinh</option>
                  <option value="OTHER">Khác</option>
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
      {!showForm && (
          <div className="border border-slate-100 rounded-[2rem] bg-white/70 backdrop-blur-xl shadow-2xl shadow-slate-200/50 overflow-hidden">
              <table className="w-full text-sm text-left">
                  <thead className="bg-[#111827] text-white">
                      <tr>
                          <th className="px-6 py-5 font-black uppercase tracking-tighter">Mã NV</th>
                          <th className="px-6 py-5 font-black uppercase tracking-tighter">Họ tên nhân viên</th>
                          <th className="px-6 py-5 font-black uppercase tracking-tighter">Thông tin liên hệ</th>
                          <th className="px-6 py-5 font-black uppercase tracking-tighter text-center">Phòng ban</th>
                          <th className="px-6 py-5 font-black uppercase tracking-tighter text-center">Thao tác</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {employees.map((employee) => (
                          <tr key={employee.id} className="hover:bg-slate-50/80 transition-all group">
                              <td className="px-6 py-5 font-black text-slate-400 group-hover:text-primary transition-colors tabular-nums">{employee.id}</td>
                              <td className="px-6 py-5">
                                  <div className="font-black text-slate-800 text-base">{employee.fullName}</div>
                                  <div className="flex items-center gap-2 mt-1">
                                      <span className="text-[10px] font-black bg-blue-50 text-blue-500 px-2 py-0.5 rounded uppercase tracking-widest">
                                          {employee.employeeType === 'OFFICIAL' || employee.employeeType === 'FULL_TIME' ? 'Chính thức' : 
                                           employee.employeeType === 'PROBATION' ? 'Thử việc' :
                                           employee.employeeType === 'TRAINEE' ? 'Học việc' :
                                           employee.employeeType === 'INTERN' ? 'Thực tập sinh' : 'Khác'}
                                      </span>
                                  </div>
                              </td>
                              <td className="px-6 py-5 space-y-1">
                                  <div className="flex items-center gap-2 text-slate-600 font-bold group-hover:text-slate-900 transition-colors">
                                      <Mail size={14} className="text-slate-300" /> {employee.email}
                                  </div>
                                  <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                                      <Phone size={14} className="text-slate-200" /> {employee.phone}
                                  </div>
                                  <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                                      <MapPin size={14} className="text-slate-200" /> {employee.hometown}
                                  </div>
                              </td>
                              <td className="px-6 py-5 text-center">
                                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-200">
                                      <div className="w-2 h-2 rounded-full bg-primary shadow-sm shadow-primary/20"></div>
                                      {employee.department || 'N/A'}
                                  </div>
                              </td>
                              <td className="px-6 py-5">
                                  <div className="flex items-center gap-2">
                                      <Button variant="ghost" size="icon" onClick={() => handleView(employee)}>
                                          <Eye className="w-4 h-4 text-blue-500" />
                                      </Button>
                                      <Button variant="ghost" size="icon" onClick={() => handleEdit(employee)}>
                                          <Edit className="w-4 h-4 text-orange-500" />
                                      </Button>
                                      <Button variant="ghost" size="icon" onClick={() => handleDelete(employee.id)}>
                                          <Trash2 className="w-4 h-4 text-destructive" />
                                      </Button>
                                  </div>
                              </td>
                          </tr>
                      ))}
                      {employees.length === 0 && (
                        <tr>
                          <td colSpan={5} className="text-center py-20 text-slate-300 italic">Chưa có dữ liệu nhân sự.</td>
                        </tr>
                      )}
                  </tbody>
              </table>
          </div>
      )}
    </div>
  )
}
