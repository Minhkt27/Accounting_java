import { useState, useEffect, useMemo } from "react"
import axios from "axios"
import { Users, TrendingUp, Calendar, UserMinus, UserPlus } from "lucide-react"
import type { Employee, Leave } from "../types"

export default function HRTrackingPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [leaves, setLeaves] = useState<Leave[]>([])
  
  const [filterMonth, setFilterMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });

  const auth = useMemo(() => ({ 
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } 
  }), [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [yyyy, mm] = filterMonth.split("-");
        const resE = await axios.get(`/api/employees?size=2000&month=${mm}&year=${yyyy}`, auth)
        setEmployees(resE.data.content || [])
        const resL = await axios.get("/api/leaves", auth)
        setLeaves(resL.data)
      } catch (err: unknown) { console.error(err) }
    }
    if (filterMonth) fetchData()
  }, [auth, filterMonth])

  const activeCount = employees.filter(e => e.status !== 'LEFT' && !e.onLeave).length
  const onLeaveCount = employees.filter(e => e.status !== 'LEFT' && e.onLeave).length
  const inactiveCount = employees.filter(e => e.status === 'LEFT').length
  const avgSalary = employees.length > 0 ? employees.reduce((a, b) => a + (b.contractSalary || 0), 0) / employees.length : 0

  const filteredLeaves = useMemo(() => {
    return leaves.filter(l => {
      const [yyyy, mm] = filterMonth.split("-");
      return l.startDate.startsWith(`${yyyy}-${mm}`);
    });
  }, [leaves, filterMonth]);

  const maternityCount = filteredLeaves.filter(l => l.leaveType === 'MATERNITY').length
  const sickCount = filteredLeaves.filter(l => l.leaveType === 'SICK').length

  const formatVND = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0)
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-primary" /> Theo dõi Biến động & Nhân sự (HR Tracking)
        </h1>
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
          <span className="text-sm font-black uppercase text-slate-600">Tháng:</span>
                 <select 
                     value={filterMonth.split('-')[1]}
                     onChange={e => {
                         const m = e.target.value;
                         const y = filterMonth.split('-')[0];
                         setFilterMonth(`${y}-${m}`);
                     }}
                     className="flex h-8 w-[100px] rounded-md border-0 bg-transparent px-2 font-bold text-primary outline-none focus:ring-0"
                 >
                     {Array.from({length: 12}, (_, i) => {
                       const mStr = String(i + 1).padStart(2, '0');
                       return <option key={mStr} value={mStr}>Tháng {i + 1}</option>
                     })}
                 </select>
                 <select 
                     value={filterMonth.split('-')[0]}
                     onChange={e => {
                         const y = e.target.value;
                         const m = filterMonth.split('-')[1];
                         setFilterMonth(`${y}-${m}`);
                     }}
                     className="flex h-8 w-[100px] rounded-md border-0 bg-transparent px-2 font-bold text-primary outline-none focus:ring-0"
                 >
                     {Array.from({length: 11}, (_, i) => {
                       const year = new Date().getFullYear() - 5 + i;
                       return <option key={year} value={year}>Năm {year}</option>
                     })}
                 </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-6 bg-white border rounded-2xl shadow-sm flex flex-col items-center">
              <Users className="w-10 h-10 text-blue-500 mb-2" />
              <p className="text-3xl font-black">{activeCount}</p>
              <p className="text-[10px] uppercase font-bold text-slate-500">Nhân viên đang làm</p>
          </div>
          <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl shadow-sm flex flex-col items-center">
              <Calendar className="w-10 h-10 text-amber-600 mb-2" />
              <p className="text-3xl font-black text-amber-600">{onLeaveCount}</p>
              <p className="text-[10px] uppercase font-bold text-amber-700">Nhân viên nghỉ phép</p>
          </div>
          <div className="p-6 bg-slate-50 border rounded-2xl shadow-sm flex flex-col items-center opacity-70">
              <UserMinus className="w-10 h-10 text-slate-400 mb-2" />
              <p className="text-3xl font-black text-slate-400">{inactiveCount}</p>
              <p className="text-[10px] uppercase font-bold text-slate-500">Nhân viên đã nghỉ</p>
          </div>
          <div className="p-6 bg-green-50 border border-green-200 rounded-2xl shadow-sm flex flex-col items-center">
              <TrendingUp className="w-10 h-10 text-green-500 mb-2" />
              <p className="text-2xl font-black text-green-600">{formatVND(avgSalary)}</p>
              <p className="text-[10px] uppercase font-bold text-green-700">Lương bình quân HĐ</p>
          </div>
          <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl shadow-sm flex flex-col items-center">
              <Calendar className="w-10 h-10 text-amber-500 mb-2" />
              <p className="text-3xl font-black text-amber-600">{maternityCount + sickCount}</p>
              <p className="text-[10px] uppercase font-bold text-amber-700">Nhân viên nghỉ chế độ (Trong tháng)</p>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white border rounded-2xl shadow-md p-6">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 uppercase text-xs tracking-wider">
                  <UserPlus className="w-4 h-4 text-blue-500" /> Danh sách Biến động chi tiết
              </h3>
              <div className="space-y-4">
                  {employees.slice(-5).reverse().map(e => (
                      <div key={e.id} className="flex justify-between items-center p-3 hover:bg-slate-50 transition-colors rounded-xl border border-dashed">
                          <div>
                              <p className="font-bold text-sm text-slate-900">{e.fullName}</p>
                              <p className="text-[10px] text-slate-500 italic">Mã NV: {e.id}</p>
                          </div>
                          <div className="text-right">
                              <p className="font-black text-xs mt-1 text-slate-600">{formatVND(e.contractSalary || 0)}</p>
                          </div>
                      </div>
                  ))}
              </div>
          </div>

          <div className="bg-white border rounded-2xl shadow-md p-6">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 uppercase text-xs tracking-wider">
                  <Calendar className="w-4 h-4 text-amber-500" /> Nhân viên nghỉ chế độ (Thai sản/Ốm đau)
              </h3>
              <div className="space-y-4">
                  {filteredLeaves.filter(l => l.leaveType !== 'ANNUAL').map((l, i) => (
                      <div key={i} className="flex justify-between items-center p-3 hover:bg-slate-50 transition-colors rounded-xl border border-dashed">
                           <div>
                              <p className="font-bold text-sm text-slate-900">{l.employee.fullName}</p>
                              <p className="text-[10px] text-slate-500 italic">{l.startDate} ➔ {l.endDate}</p>
                          </div>
                          <div className="text-right">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                                  l.leaveType === 'MATERNITY' ? 'bg-purple-100 text-purple-700' : 'bg-red-100 text-red-700'
                              }`}>{l.leaveType === 'MATERNITY' ? 'THAI SẢN' : 'ỐM ĐAU'}</span>
                              <p className="text-[10px] text-slate-400 mt-1">BHXH Chi trả</p>
                          </div>
                      </div>
                  ))}
                  {filteredLeaves.filter(l => l.leaveType !== 'ANNUAL').length === 0 && (
                      <p className="text-center py-10 text-slate-400 italic text-sm">Chưa có bản ghi nghỉ chế độ nào.</p>
                  )}
              </div>
          </div>
      </div>
    </div>
  )
}
