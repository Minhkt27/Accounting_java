import { useState, useEffect, useCallback } from "react"
import axios from "axios"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { CalendarDays, Save, FileSpreadsheet } from "lucide-react"
import { ExportService } from "../utils/ExportService"

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
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [standardDays, setStandardDays] = useState(26)

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
      
      // 1. Lấy cấu hình công chuẩn (FIXED/MONTHLY)
      const resParams = await axios.get("/api/config/params", auth)
      const params = resParams.data.length > 0 ? resParams.data[0] : null
      
      let std = getStandardDays(month, year)
      if (params && params.standardWorkDayMode === 'FIXED') {
        std = params.standardWorkDays
      }
      setStandardDays(std)
      
      // 2. Lấy danh sách nhân viên để hiển thị bảng
      const resEmp = await axios.get("/api/employees", auth)
      const empList = resEmp.data
 
       // Lấy dữ liệu công đã lưu (nếu có)
       const resAtt = await axios.get(`/api/attendance/${month}/${year}`, auth)
       const savedAtt: Attendance[] = resAtt.data
 
       // Lấy gợi ý hàng loạt (Bulk Suggestion)
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
 
   useEffect(() => { fetchData() }, [fetchData])

  const handleUpdateLine = (index: number, field: string, value: number) => {
    const newAtt = [...attendances]
    newAtt[index] = { ...newAtt[index], [field]: value }
    setAttendances(newAtt)
  }

  const handleSave = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn lưu bảng chấm công này? Dữ liệu sẽ được dùng để tính lương.")) return
    try {
      await axios.post("/api/attendance", attendances, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      })
      alert("Đã lưu bảng chấm công!")
    } catch (err: unknown) { 
        const message = err instanceof Error ? err.message : String(err)
        alert("Lỗi khi lưu bảng công: " + message) 
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
          <CalendarDays className="w-6 h-6" /> Chấm công & Ngoài giờ (UC10-12)
        </h1>
        <div className="flex flex-wrap items-center gap-3 bg-muted/50 p-2 rounded-lg border">
            <div className="flex items-center gap-2 border-r pr-4 mr-2">
                <span className="text-[10px] font-bold uppercase text-muted-foreground whitespace-nowrap">Công chuẩn</span>
                <span className="text-lg font-black text-primary">{standardDays}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase text-muted-foreground">T{month}</span>
                <Input type="number" className="w-16 h-8" value={month} onChange={e => setMonth(Number(e.target.value))} />
            </div>
            <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase text-muted-foreground">/</span>
                <Input type="number" className="w-20 h-8" value={year} onChange={e => setYear(Number(e.target.value))} />
            </div>
            <div className="w-[1px] h-6 bg-slate-300 mx-1" />
            <Button variant="outline" onClick={handleExportExcel} className="gap-2 h-8 border-green-600 text-green-600 hover:bg-green-50">
              <FileSpreadsheet className="w-4 h-4" /> Excel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={year * 12 + month < (new Date().getFullYear() * 12 + new Date().getMonth() + 1)}
              className="gap-2 h-8" 
              size="default"
              title={year * 12 + month < (new Date().getFullYear() * 12 + new Date().getMonth() + 1) ? "Không thể chỉnh sửa dữ liệu tháng cũ" : ""}
            >
                <Save className="w-4 h-4" /> Lưu
            </Button>
        </div>
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
              {attendances.map((att, idx) => (
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
                              handleUpdateLine(idx, "realWorkDays", val);
                          }} 
                      />
                      {att.suggestedDays !== undefined && (Number(att.realWorkDays) || 0) === 0 && (
                          <div 
                              className="text-[10px] text-blue-600 cursor-pointer mt-1.5 hover:bg-blue-50 border border-blue-200 rounded-md py-0.5 w-24 mx-auto font-medium transition-all animate-pulse shadow-sm"
                              onClick={() => {
                                  handleUpdateLine(idx, "realWorkDays", att.suggestedDays!);
                                  if ((Number(att.paidLeaveDays) || 0) === 0) handleUpdateLine(idx, "paidLeaveDays", att.suggestedPaidLeaveDays!);
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
                              handleUpdateLine(idx, "paidLeaveDays", val);
                          }} 
                      />
                      {att.suggestedPaidLeaveDays !== undefined && (Number(att.paidLeaveDays) || 0) === 0 && att.suggestedPaidLeaveDays > 0 && (
                          <div 
                              className="text-[10px] text-green-600 cursor-pointer mt-1.5 hover:bg-blue-50 border border-green-300 rounded-md py-0.5 w-24 mx-auto font-medium transition-all shadow-sm"
                              onClick={() => handleUpdateLine(idx, "paidLeaveDays", att.suggestedPaidLeaveDays!)}
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
                          onChange={e => handleUpdateLine(idx, "otNormalHours", Number(e.target.value))} 
                      />
                  </td>
                  <td className="px-4 py-4 text-center">
                      <Input 
                          type="number"
                          className="w-16 mx-auto text-center" 
                          value={att.otWeekendHours || 0} 
                          onChange={e => handleUpdateLine(idx, "otWeekendHours", Number(e.target.value))} 
                      />
                  </td>
                  <td className="px-4 py-4 text-center">
                      <Input 
                          type="number"
                          className="w-16 mx-auto text-center" 
                          value={att.otHolidayHours || 0} 
                          onChange={e => handleUpdateLine(idx, "otHolidayHours", Number(e.target.value))} 
                      />
                  </td>
                  <td className="px-6 py-4 text-center font-black text-primary text-base">
                      {att.realWorkDays + att.paidLeaveDays}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      
    </div>
  )
}
