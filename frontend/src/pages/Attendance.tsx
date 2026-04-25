import { useState, useEffect, useCallback, useMemo } from "react"
import axios from "axios"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { CalendarDays, Save, FileSpreadsheet } from "lucide-react"
import { ExportService } from "../utils/ExportService"
import { Pagination } from "../components/ui/pagination"

interface Employee {
  id: string
  fullName: string
  contractSalary: number
  employeeType: string
}

interface Attendance {
  employee: Employee
  month: number
  year: number
  realWorkDays: number
  paidLeaveDays: number
  otNormalHours: number
  otWeekendHours: number
  otHolidayHours: number
  suggestedDays?: number
  suggestedPaidLeaveDays?: number
}

export default function AttendancePage() {
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [standardDays, setStandardDays] = useState(26)
  const [isLocked, setIsLocked] = useState(false)

  const [page, setPage] = useState(0)
  const [pageSize] = useState(20)

  const getStandardDays = (m: number, y: number) => {
    let days = 0
    const totalDays = new Date(y, m, 0).getDate()
    for (let d = 1; d <= totalDays; d++) {
      const dayOfWeek = new Date(y, m - 1, d).getDay()
      if (dayOfWeek !== 0 && dayOfWeek !== 6) days++ // Không phải Thứ 7 và Chủ Nhật
    }
    return days
  }

  const fetchData = useCallback(async () => {
    try {
      const auth = { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      
      let params = null;
      try {
          const resParams = await axios.get("/api/config/params", auth)
          params = resParams.data.length > 0 ? resParams.data[0] : null
      } catch { console.warn("cannot fetch params") }
      
      let std = getStandardDays(month, year)
      if (params && params.standardWorkDayMode === 'FIXED') {
        std = params.standardWorkDays
      }
      setStandardDays(std)
      
      // 2. Lấy danh sách nhân viên phân trang để hiển thị bảng (lọc theo tháng/năm)
      const resEmp = await axios.get(`/api/employees?page=0&size=2000&month=${month}&year=${year}`, auth)
      const empList = resEmp.data.content
 
       // Lấy dữ liệu công đã lưu (nếu có) - API này cũng cần phân trang theo nhân sự
       const resAtt = await axios.get(`/api/attendance/${month}/${year}?page=0&size=2000`, auth)
       const savedAtt: Attendance[] = resAtt.data.content
 
       // Lấy gợi ý hàng loạt (Bulk Suggestion) cho trang hiện tại
       let suggestions: Record<string, { physicalDays: number, paidLeaveDays: number }> = {}
       try {
         const bulkRes = await axios.post("/api/attendance/suggest-bulk", {
           employeeIds: empList.map((e: Employee) => e.id),
           month,
           year,
           standardDays: std
         }, auth)
         suggestions = bulkRes.data
       } catch (e: unknown) {
         console.error("Bulk suggest failed", e)
       }
 
       // Lấy trạng thái khóa (từ bảng lương) - Chỉ cần biết có bảng lương tháng đó chưa
       setIsLocked(false)
        try {
          const resPayroll = await axios.get(`/api/payroll/${month}/${year}?page=0&size=1`, auth)
          const payrolls = resPayroll.data.content
          const isCalculationDone = payrolls.length > 0 && payrolls.some((p: { status: string }) => p.status !== 'REJECTED')
          setIsLocked(isCalculationDone)
        } catch (e) {
         console.error("Fetch payroll failed", e)
       }
 
       // Map dữ liệu công vào danh sách nhân viên
       const initialAtt = empList.map((emp: Employee) => {
         const existing = savedAtt.find(a => a.employee.id === emp.id)
         const sugg = suggestions[emp.id] || { physicalDays: std, paidLeaveDays: 0 }
 
         if (existing) {
           return { 
             ...existing, 
             suggestedDays: sugg.physicalDays, 
             suggestedPaidLeaveDays: sugg.paidLeaveDays 
           }
         }
         return { 
           employee: emp, 
           month, 
           year, 
           realWorkDays: 0, 
           paidLeaveDays: 0, 
           otNormalHours: 0, 
           otWeekendHours: 0, 
           otHolidayHours: 0, 
           suggestedDays: sugg.physicalDays, 
           suggestedPaidLeaveDays: sugg.paidLeaveDays 
         }
       })
       setAttendances(initialAtt)
     } catch (err: unknown) { console.error(err) }
   }, [month, year])
 
    useEffect(() => { 
      const timer = setTimeout(() => {
        fetchData() 
      }, 0)
      return () => clearTimeout(timer)
    }, [fetchData])

   const filteredAttendances = useMemo(() => {
    return attendances.filter(att => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (att.employee.id || "").toLowerCase().includes(term) ||
             (att.employee.fullName || "").toLowerCase().includes(term);
    });
  }, [attendances, searchTerm]);

  const handleSearchTerm = (val: string) => {
    setSearchTerm(val)
    setPage(0)
  }

  const pagedAttendances = filteredAttendances.slice(page * pageSize, (page + 1) * pageSize)
  const totalElements = filteredAttendances.length
  const totalPages = Math.ceil(totalElements / pageSize)

  const handleUpdateLine = (empId: string, field: string, value: number) => {
    setAttendances(prev => prev.map(a => 
      a.employee.id === empId ? { ...a, [field]: value } : a
    ))
  }

  const handleSave = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn lưu bảng chấm công này? Dữ liệu sẽ được dùng để tính lương.")) return
    try {
      await axios.post("/api/attendance", attendances, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      })
      alert("Đã lưu bảng chấm công!")
    } catch (err: unknown) { 
        const serverMsg = axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : String(err)
        alert("Lỗi khi lưu bảng công: " + serverMsg) 
    }
  }

  const handleExportExcel = () => {
    const data = attendances.map(a => ({
      id: a.employee.id,
      fullName: a.employee.fullName,
      month: a.month,
      year: a.year,
      realWorkDays: a.realWorkDays,
      paidLeaveDays: a.paidLeaveDays,
      totalDays: a.realWorkDays + a.paidLeaveDays,
      otNormal: a.otNormalHours,
      otWeekend: a.otWeekendHours,
      otHoliday: a.otHolidayHours
    }));
    
    ExportService.exportToExcel(
      data, 
      `Cham_cong_thang_${month}_${year}`, 
      'Chấm công',
      {
        id: "Mã NV",
        fullName: "Họ tên",
        month: "Tháng",
        year: "Năm",
        realWorkDays: "Công mặt",
        paidLeaveDays: "Phep/Le",
        totalDays: "Tổng công",
        otNormal: "OT Thường",
        otWeekend: "OT CT",
        otHoliday: "OT Lễ"
      }
    );
  }


  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CalendarDays className="w-6 h-6" /> Chấm công & Ngoài giờ
        </h1>
        <div className="flex flex-wrap items-center gap-3 bg-muted/50 p-2 rounded-lg border">
            <div className="flex items-center gap-2 border-r pr-4 mr-2">
                <span className="text-[10px] font-bold uppercase text-muted-foreground whitespace-nowrap">Công chuẩn</span>
                <span className="text-lg font-black text-primary">{standardDays}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase text-muted-foreground">T{month}</span>
                <Input type="number" className="w-16 h-8" value={month} onChange={e => setMonth(Math.max(1, Math.min(12, Number(e.target.value))))} />
            </div>
            <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase text-muted-foreground">/</span>
                <Input type="number" className="w-20 h-8" value={year} onChange={e => setYear(Math.max(2000, Number(e.target.value)))} />
            </div>
            <div className="w-[1px] h-6 bg-slate-300 mx-1" />
            <Button variant="outline" onClick={handleExportExcel} className="gap-2 h-8 border-green-600 text-green-600 hover:bg-green-50">
              <FileSpreadsheet className="w-4 h-4" /> Excel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isLocked || (year * 12 + month > (new Date().getFullYear() * 12 + new Date().getMonth() + 1))}
              className="gap-2 h-8" 
              size="default"
              title={isLocked ? "Bảng lương đã được tính. Vui lòng từ chối bảng lương nếu muốn sửa lại công." : (year * 12 + month > (new Date().getFullYear() * 12 + new Date().getMonth() + 1) ? "Không thể chấm công tháng tương lai" : "")}
            >
                <Save className="w-4 h-4" /> Lưu
            </Button>
        </div>
      </div>
      
      <div className="flex bg-white p-3 rounded-xl shadow-sm border">
          <Input 
              placeholder="Tìm kiếm theo Tên hoặc Mã NV..." 
              value={searchTerm} 
              onChange={e => handleSearchTerm(e.target.value)}
              className="max-w-sm bg-slate-50"
          />
      </div>

        <div className="border rounded-xl bg-card shadow-lg overflow-hidden overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-primary text-primary-foreground">
              <tr>
                <th className="px-6 py-4 font-medium">Mã NV</th>
                <th className="px-6 py-4 font-medium">Họ tên nhân viên</th>
                <th className="px-6 py-4 font-medium text-center bg-primary/90">Ngày công thực tế (ngày)</th>
                <th className="px-6 py-4 font-medium text-center bg-primary/80">Nghỉ hưởng lương (ngày)</th>
                <th className="px-6 py-4 font-medium text-center bg-primary/70">OT Thường (giờ)</th>
                <th className="px-6 py-4 font-medium text-center bg-primary/60">OT Cuối tuần (giờ)</th>
                <th className="px-6 py-4 font-medium text-center bg-primary/50">OT Lễ Tết (giờ)</th>
                <th className="px-6 py-4 font-medium">Tổng cộng (ngày)</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {pagedAttendances.map((att) => (
                <tr key={att.employee.id} className="hover:bg-muted/50 transition-colors group">
                  <td className="px-6 py-4 font-bold text-muted-foreground">{att.employee.id}</td>
                  <td className="px-6 py-4">
                      <div className="font-medium text-base">{att.employee.fullName}</div>
                      <div className="text-[10px] text-muted-foreground">{att.employee.employeeType}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                      <Input 
                          type="text"
                          inputMode="decimal"
                          className="w-24 mx-auto text-center font-bold" 
                          value={att.realWorkDays || 0} 
                          onChange={e => {
                              let raw = e.target.value.replace(/[^0-9.]/g, '');
                              if (raw.length > 1 && raw.startsWith('0') && raw[1] !== '.') raw = raw.replace(/^0+/, '');
                              if (raw === "" || raw === ".") raw = "0";
                              let val = parseFloat(raw);
                              if (isNaN(val)) val = 0;
                              if (val < 0) val = 0;
                              if (val > standardDays) val = standardDays;
                              handleUpdateLine(att.employee.id, "realWorkDays", val);
                          }} 
                      />
                      {att.suggestedDays !== undefined && (Number(att.realWorkDays) || 0) === 0 && (
                          <div 
                              className="text-[10px] text-blue-600 cursor-pointer mt-1.5 hover:bg-blue-50 border border-blue-200 rounded-md py-0.5 w-24 mx-auto font-medium transition-all animate-pulse shadow-sm"
                              onClick={() => {
                                  handleUpdateLine(att.employee.id, "realWorkDays", att.suggestedDays!);
                                  if ((Number(att.paidLeaveDays) || 0) === 0) handleUpdateLine(att.employee.id, "paidLeaveDays", att.suggestedPaidLeaveDays!);
                              }}
                              title="Bấm để tự động điền cả Công mặt và Phép"
                          >
                              💡 Gợi ý: {att.suggestedDays}
                          </div>
                      )}
                  </td>
                  <td className="px-6 py-4 text-center">
                      <Input 
                          type="text"
                          inputMode="decimal"
                          className="w-24 mx-auto text-center font-bold text-green-600" 
                          value={att.paidLeaveDays || 0} 
                          onChange={e => {
                              let raw = e.target.value.replace(/[^0-9.]/g, '');
                              if (raw.length > 1 && raw.startsWith('0') && raw[1] !== '.') raw = raw.replace(/^0+/, '');
                              if (raw === "" || raw === ".") raw = "0";
                              let val = parseFloat(raw);
                              if (isNaN(val)) val = 0;
                              if (val < 0) val = 0;
                              if (val > standardDays) val = standardDays;
                              handleUpdateLine(att.employee.id, "paidLeaveDays", val);
                          }} 
                      />
                      {att.suggestedPaidLeaveDays !== undefined && (Number(att.paidLeaveDays) || 0) === 0 && att.suggestedPaidLeaveDays > 0 && (
                          <div 
                              className="text-[10px] text-green-600 cursor-pointer mt-1.5 hover:bg-blue-50 border border-green-300 rounded-md py-0.5 w-24 mx-auto font-medium transition-all shadow-sm"
                              onClick={() => handleUpdateLine(att.employee.id, "paidLeaveDays", att.suggestedPaidLeaveDays!)}
                              title="Bấm để điền riêng ngày nghỉ hưởng lương"
                          >
                              💡 Phép: {att.suggestedPaidLeaveDays}
                          </div>
                      )}
                  </td>
                  <td className="px-4 py-4 text-center">
                      <Input 
                          type="number"
                          className="w-16 mx-auto text-center" 
                          value={att.otNormalHours || 0} 
                          onChange={e => handleUpdateLine(att.employee.id, "otNormalHours", Math.max(0, Number(e.target.value)))} 
                      />
                  </td>
                  <td className="px-4 py-4 text-center">
                      <Input 
                          type="number"
                          className="w-16 mx-auto text-center" 
                          value={att.otWeekendHours || 0} 
                          onChange={e => handleUpdateLine(att.employee.id, "otWeekendHours", Math.max(0, Number(e.target.value)))} 
                      />
                  </td>
                  <td className="px-4 py-4 text-center">
                      <Input 
                          type="number"
                          className="w-16 mx-auto text-center" 
                          value={att.otHolidayHours || 0} 
                          onChange={e => handleUpdateLine(att.employee.id, "otHolidayHours", Math.max(0, Number(e.target.value)))} 
                      />
                  </td>
                  <td className="px-6 py-4 text-center font-black text-primary text-base">
                      {att.realWorkDays + att.paidLeaveDays}
                  </td>
                </tr>
              ))}
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
  )
}
