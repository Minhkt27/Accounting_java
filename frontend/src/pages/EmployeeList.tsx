import { useState, useEffect, useCallback, useMemo } from "react"
import axios from "axios"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Plus, UserRoundCheck, Edit, Trash2, Eye, X, FileUp, FileText, FileSpreadsheet, Mail, Phone, MapPin } from "lucide-react"
import { ExportService } from "../utils/ExportService"

import { Pagination } from "../components/ui/pagination"

interface Employee {
  id: string
  fullName: string
  contractSalary: number
  dependentCount: number
  positionCoefficient: number
  seniorityAllowance: number
  employeeType: "OFFICIAL" | "FULL_TIME" | "PROBATION" | "TRAINEE" | "INTERN" | "OTHER"
  department?: string
  status: 'WORKING' | 'LEFT' | 'ON_LEAVE'
  onLeave?: boolean
  dob: string
  phone: string
  email: string
  hometown: string
  contractFilePath?: string
  gender?: string
  address?: string
  position?: string
  joinDate?: string
  resignationDate?: string
}

export default function EmployeeList() {
  const [employees, setEmployees] = useState<Employee[]>([])
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("")
  const [filterMonth, setFilterMonth] = useState("")

  const [page, setPage] = useState(0)
  const [pageSize] = useState(20)

  const [showForm, setShowForm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [viewOnly, setViewOnly] = useState(false)
  const [currentEmp, setCurrentEmp] = useState<Partial<Employee>>({
    id: "", fullName: "", contractSalary: 0, dependentCount: 0, 
    positionCoefficient: 0.0, seniorityAllowance: 0.0,
    employeeType: "FULL_TIME", 
    status: 'WORKING', dob: "", phone: "", email: "", hometown: "",
    department: "Kế toán", gender: "Nam", resignationDate: ""
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await axios.get(`/api/employees?page=0&size=2000`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      })
      setEmployees(res.data.content)
    } catch (err: unknown) { 
        console.error(err) 
    }
  }, [])

  useEffect(() => { 
    const timer = setTimeout(() => {
      fetchEmployees() 
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchEmployees])

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchSearch = !searchTerm || 
          (emp.id || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
          (emp.fullName || "").toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchType = !filterType || emp.employeeType === filterType;

      let matchMonth = true;
      if (filterMonth) {
        // filterMonth is YYYY-MM
        const [yyyy, mm] = filterMonth.split('-');
        const targetDate = new Date(parseInt(yyyy), parseInt(mm) - 1, 1);
        if (emp.status === 'LEFT' && emp.resignationDate) {
          const resDate = new Date(emp.resignationDate);
          if (resDate < targetDate) {
             matchMonth = false;
          }
        }
        // Could also check if joinDate > end of targetMonth, but let's just check if they left before target month
      }

      return matchSearch && matchType && matchMonth;
    });
  }, [employees, searchTerm, filterType, filterMonth]);

  const handleSearchTerm = (val: string) => {
    setSearchTerm(val)
    setPage(0)
  }

  const handleFilterType = (val: string) => {
    setFilterType(val)
    setPage(0)
  }

  const handleFilterMonth = (val: string) => {
    setFilterMonth(val)
    setPage(0)
  }

  const pagedEmployees = filteredEmployees.slice(page * pageSize, (page + 1) * pageSize)
  const totalElements = filteredEmployees.length
  const totalPages = Math.ceil(totalElements / pageSize)

  const validate = () => {
    if (!currentEmp.id) {
      alert("Vui lòng nhập Mã NV")
      return false
    }
    if (!currentEmp.fullName) {
      alert("Vui lòng nhập Họ tên")
      return false
    }
    if (!currentEmp.dob) {
      alert("Vui lòng nhập Ngày sinh")
      return false
    }
    if (!currentEmp.contractSalary) {
      alert("Vui lòng nhập Lương hợp đồng")
      return false
    }
    
    if (!currentEmp.phone) {
      alert("Vui lòng nhập Số điện thoại")
      return false
    }
    if (!currentEmp.email) {
      alert("Vui lòng nhập Email")
      return false
    }
    if (!currentEmp.hometown) {
      alert("Vui lòng nhập Quê quán")
      return false
    }
    
    if (currentEmp.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentEmp.email)) {
      alert("Email không đúng định dạng (ví dụ: example@domain.com)")
      return false
    }
    if (currentEmp.phone && !/^(0|\+84)\d{8,11}$/.test(currentEmp.phone.replace(/\s/g, ""))) {
      alert("Số điện thoại không hợp lệ (yêu cầu từ 8-11 chữ số)")
      return false
    }
    if (currentEmp.contractSalary && currentEmp.contractSalary < 0) {
      alert("Lương hợp đồng không được nhỏ hơn 0 VNĐ")
      return false
    }
    if (new Date(currentEmp.dob!) > new Date()) {
      alert("Ngày sinh không được là ngày trong tương lai")
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    try {
      const auth = { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      
      // Sanitize payload to prevent Java LocalDate parsing errors on empty strings
      const payload: Record<string, unknown> = { ...currentEmp }
      if (!payload.resignationDate) payload.resignationDate = null;
      if (!payload.dob) payload.dob = null;

      let savedEmp: Employee | null = null
      if (isEditing) {
        const res = await axios.put(`/api/employees/${payload.id}`, payload, auth)
        savedEmp = res.data
      } else {
        const res = await axios.post("/api/employees", payload, auth)
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
    if (!confirm(`Xác nhận nhân viên ${id} thôi việc? Hệ thống sẽ chuyển trạng thái sang "Đã nghỉ" để theo dõi.`)) return
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
    setCurrentEmp({ id: "", fullName: "", contractSalary: 0, dependentCount: 0, seniorityAllowance: 0.0, employeeType: "FULL_TIME", status: 'WORKING', dob: "", phone: "", email: "", hometown: "", department: "Kế toán", gender: "Nam", resignationDate: "" })
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
    } catch {
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
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Mã NV <span className="text-red-500">*</span></label>
                <Input value={currentEmp.id} onChange={e => setCurrentEmp({...currentEmp, id: e.target.value})} disabled={isEditing || viewOnly} placeholder={viewOnly ? "" : "NV001"} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Họ tên <span className="text-red-500">*</span></label>
                <Input value={currentEmp.fullName} onChange={e => setCurrentEmp({...currentEmp, fullName: e.target.value})} disabled={viewOnly} placeholder={viewOnly ? "" : "Nguyễn Văn A"} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Ngày sinh <span className="text-red-500">*</span></label>
                <Input type="date" value={currentEmp.dob} onChange={e => setCurrentEmp({...currentEmp, dob: e.target.value})} disabled={viewOnly} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Số điện thoại <span className="text-red-500">*</span></label>
                <Input value={currentEmp.phone} onChange={e => setCurrentEmp({...currentEmp, phone: e.target.value})} disabled={viewOnly} placeholder={viewOnly ? "" : "09xxx"} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email <span className="text-red-500">*</span></label>
                <Input type="email" value={currentEmp.email} onChange={e => setCurrentEmp({...currentEmp, email: e.target.value})} disabled={viewOnly} placeholder={viewOnly ? "" : "abc@company.com"} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Quê quán <span className="text-red-500">*</span></label>
                <Input value={currentEmp.hometown} onChange={e => setCurrentEmp({...currentEmp, hometown: e.target.value})} disabled={viewOnly} placeholder={viewOnly ? "" : "Hà Nội"} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Lương hợp đồng (VNĐ) <span className="text-red-500">*</span></label>
                <Input 
                type="text" 
                value={new Intl.NumberFormat('vi-VN').format(currentEmp.contractSalary || 0)} 
                onChange={e => {
                  const raw = e.target.value.replace(/\./g, '').replace(/[^0-9]/g, '');
                  const val = raw === "" ? 0 : Number(raw);
                  setCurrentEmp({...currentEmp, contractSalary: Math.max(0, val)})
                }} 
                disabled={viewOnly}
                required 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Số người phụ thuộc</label>
              <Input 
                type="number" 
                min={0}
                value={currentEmp.dependentCount ?? ""} 
                onChange={e => {
                  const val = e.target.value === "" ? 0 : Number(e.target.value);
                  setCurrentEmp({...currentEmp, dependentCount: Math.max(0, val)})
                }} 
                disabled={viewOnly}
              /></div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phụ cấp thâm niên (VNĐ)</label>
                <select 
                  value={currentEmp.seniorityAllowance || 0} 
                  onChange={e => setCurrentEmp({...currentEmp, seniorityAllowance: Number(e.target.value)})} 
                  disabled={viewOnly} 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-medium"
                >
                  <option value={0}>0</option>
                  <option value={200000}>200.000</option>
                  <option value={300000}>300.000</option>
                  <option value={500000}>500.000</option>
                </select>
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
                <label className="text-sm font-medium">Giới tính <span className="text-red-500">*</span></label>
                <select value={currentEmp.gender} onChange={e => setCurrentEmp({...currentEmp, gender: e.target.value})} disabled={viewOnly} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Loại nhân sự <span className="text-red-500">*</span></label>
                <select value={currentEmp.employeeType} onChange={e => setCurrentEmp({...currentEmp, employeeType: e.target.value as Employee['employeeType']})} disabled={viewOnly} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="FULL_TIME">Chính thức</option>
                  <option value="PROBATION">Thử việc</option>
                  <option value="INTERN">Thực tập sinh</option>
                  <option value="OTHER">Khác</option>
                </select>
              </div>
              {(isEditing || viewOnly) && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Trạng thái</label>
                  <div className={`flex items-center gap-2 h-10 px-3 rounded-md border ${
                    currentEmp.status === 'LEFT' ? "bg-red-50 border-red-200 text-red-700" :
                    currentEmp.onLeave 
                      ? "bg-amber-50 border-amber-200 text-amber-700" 
                      : "bg-green-50 border-green-200 text-green-700"
                  }`}>
                    <div className={`w-2 h-2 rounded-full animate-pulse ${
                      currentEmp.status === 'LEFT' ? "bg-red-500" :
                      currentEmp.onLeave ? "bg-amber-500" : "bg-green-500"
                    }`} />
                    <span className="text-sm font-bold uppercase tracking-wider">
                      {currentEmp.status === 'LEFT' ? "Đã nghỉ việc" : 
                       currentEmp.onLeave ? "Đang nghỉ phép" : "Đang làm việc"}
                    </span>
                  </div>
                </div>
              )}
              {currentEmp.status === 'LEFT' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-red-600 font-bold">Ngày nghỉ việc</label>
                  <Input type="date" value={currentEmp.resignationDate} onChange={e => setCurrentEmp({...currentEmp, resignationDate: e.target.value})} disabled={viewOnly} className="border-red-200 bg-red-50" />
                </div>
              )}
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
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
              <Input 
                  placeholder="Tìm kiếm theo Tên hoặc Mã NV..." 
                  value={searchTerm} 
                  onChange={e => handleSearchTerm(e.target.value)}
                  className="max-w-xs bg-slate-50"
              />
              <select 
                  value={filterType} 
                  onChange={e => handleFilterType(e.target.value)}
                  className="flex h-10 w-[200px] rounded-md border border-input bg-slate-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              >
                  <option value="">Tất cả loại nhân sự</option>
                  <option value="FULL_TIME">Chính thức</option>
                  <option value="PROBATION">Thử việc</option>
                  <option value="INTERN">Thực tập sinh</option>
                  <option value="OTHER">Khác</option>
              </select>
              <div className="flex items-center gap-2">
                 <span className="text-sm font-medium text-slate-500 whitespace-nowrap">Tháng:</span>
                 <select 
                     value={filterMonth ? filterMonth.split('-')[1] : ""}
                     onChange={e => {
                         const m = e.target.value;
                         if (!m) handleFilterMonth("");
                         else {
                           const y = filterMonth ? filterMonth.split('-')[0] : new Date().getFullYear().toString();
                           handleFilterMonth(`${y}-${m}`);
                         }
                     }}
                     className="flex h-10 w-[120px] rounded-md border border-input bg-slate-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                 >
                     <option value="">Cả năm</option>
                     {Array.from({length: 12}, (_, i) => {
                       const mStr = String(i + 1).padStart(2, '0');
                       return <option key={mStr} value={mStr}>Tháng {i + 1}</option>
                     })}
                 </select>

                 {filterMonth && (
                   <select 
                       value={filterMonth.split('-')[0]}
                       onChange={e => {
                           const y = e.target.value;
                           const m = filterMonth.split('-')[1];
                           handleFilterMonth(`${y}-${m}`);
                       }}
                       className="flex h-10 w-[110px] rounded-md border border-input bg-slate-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                   >
                       {Array.from({length: 11}, (_, i) => {
                         const year = new Date().getFullYear() - 5 + i;
                         return <option key={year} value={year}>Năm {year}</option>
                       })}
                   </select>
                 )}
              </div>
              {(searchTerm || filterType || filterMonth) && (
                  <Button variant="ghost" onClick={() => {handleSearchTerm(""); handleFilterType(""); handleFilterMonth("");}} className="text-red-500 hover:bg-red-50 hover:text-red-600">
                     Xóa lọc
                  </Button>
              )}
          </div>
          <div className="border border-slate-100 rounded-[2rem] bg-white/70 backdrop-blur-xl shadow-2xl shadow-slate-200/50 overflow-hidden">
              <table className="w-full text-sm text-left">
                  <thead className="bg-primary text-primary-foreground">
                      <tr>
                          <th className="px-6 py-5 font-black uppercase tracking-tighter">Mã NV</th>
                          <th className="px-6 py-5 font-black uppercase tracking-tighter">Họ tên nhân viên</th>
                          <th className="px-6 py-5 font-black uppercase tracking-tighter">Thông tin liên hệ</th>
                          <th className="px-6 py-5 font-black uppercase tracking-tighter text-center">Phòng ban</th>
                          <th className="px-6 py-5 font-black uppercase tracking-tighter text-center">Trạng thái</th>
                          <th className="px-6 py-5 font-black uppercase tracking-tighter text-center">Thao tác</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {pagedEmployees.map((employee) => (
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
                              <td className="px-6 py-5 text-center">
                                  <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest border ${
                                      employee.status === 'LEFT' 
                                          ? 'bg-red-50 text-red-600 border-red-200' 
                                          : employee.onLeave
                                          ? 'bg-amber-50 text-amber-600 border-amber-200 animate-pulse'
                                          : 'bg-green-50 text-green-600 border-green-200'
                                  }`}>
                                       {employee.status === 'LEFT' ? 'Đã nghỉ việc' : 
                                        employee.onLeave ? 'Đang nghỉ phép' : 'Đang làm việc'}
                                   </span>
                                   {employee.status === 'LEFT' && employee.resignationDate && (
                                     <div className="text-[10px] text-red-400 font-bold mt-1">Nghỉ từ: {employee.resignationDate}</div>
                                   )}
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
                      {pagedEmployees.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-20 text-slate-300 italic">Chưa có dữ liệu nhân sự.</td>
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
        </div>
      )}
    </div>
  )
}
