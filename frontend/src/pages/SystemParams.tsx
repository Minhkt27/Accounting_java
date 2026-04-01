import { useState, useEffect } from "react"
import axios from "axios"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"

export default function SystemParamsPage() {
  const [params, setParams] = useState<any>({ standardWorkDays: 26, minimumWage: 1800000, mealAllowance: 25000 })

  useEffect(() => {
    axios.get("/api/config/params", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    }).then(res => { if(res.data.length > 0) setParams(res.data[0]) })
  }, [])

  const handleSave = async () => {
    try {
      await axios.post("/api/config/params", params, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      })
      alert("Đã lưu tham số hằng số!")
    } catch (err: any) { alert("Lỗi: " + err.message) }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Tham số tính lương (UC03)</h1>
      <div className="border p-6 rounded-xl bg-card space-y-6 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Số công chuẩn (ngày)</label>
            <Input type="number" value={params.standardWorkDays} onChange={e => setParams({...params, standardWorkDays: Number(e.target.value)})} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Lương tối thiểu (VNĐ)</label>
            <Input type="number" value={params.minimumWage} onChange={e => setParams({...params, minimumWage: Number(e.target.value)})} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Phụ cấp ăn ca (VNĐ/ngày)</label>
            <Input type="number" value={params.mealAllowance} onChange={e => setParams({...params, mealAllowance: Number(e.target.value)})} />
          </div>
        </div>
        <Button onClick={handleSave} className="w-full">Cập nhật tham số hệ thống</Button>
      </div>
    </div>
  )
}
