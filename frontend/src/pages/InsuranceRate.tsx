import { useState, useEffect } from "react"
import axios from "axios"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"

export default function InsuranceRatePage() {
  const [rates, setRates] = useState<any[]>([])
  const [type, setType] = useState("")
  const [employeeRate, setEmployeeRate] = useState(0)
  const [employerRate, setEmployerRate] = useState(0)
  const [effectiveDate, setEffectiveDate] = useState("")
  const [error, setError] = useState("")

  const fetchData = async () => {
    try {
      const res = await axios.get("/api/config/insurance", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      })
      setRates(res.data)
    } catch (err: any) { setError(err.message) }
  }

  useEffect(() => { fetchData() }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await axios.post("/api/config/insurance", { type, employeeRate, employerRate, effectiveDate }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      })
      fetchData()
    } catch (err: any) { setError(err.message) }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Cấu hình Tỷ lệ Bảo hiểm (UC02)</h1>
      {error && <div className="p-3 bg-red-100 text-red-600 rounded-md">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <form onSubmit={handleSave} className="border p-4 rounded-lg bg-card space-y-4">
          <div><label className="text-sm font-medium">Loại BH</label><Input value={type} onChange={e => setType(e.target.value)} placeholder="XH, YT, TN..." required /></div>
          <div><label className="text-sm font-medium">NLĐ đóng (%)</label><Input type="number" step="0.1" value={employeeRate} onChange={e => setEmployeeRate(Number(e.target.value))} required /></div>
          <div><label className="text-sm font-medium">DN đóng (%)</label><Input type="number" step="0.1" value={employerRate} onChange={e => setEmployerRate(Number(e.target.value))} required /></div>
          <div><label className="text-sm font-medium">Ngày hiệu lực</label><Input type="date" value={effectiveDate} onChange={e => setEffectiveDate(e.target.value)} required /></div>
          <Button type="submit" className="w-full">Thêm cấu hình</Button>
        </form>
        <div className="col-span-2 border rounded-lg bg-card">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted">
              <tr>
                <th className="p-3">Loại</th>
                <th className="p-3">NLĐ (%)</th>
                <th className="p-3">DN (%)</th>
                <th className="p-3">Ngày hiệu lực</th>
              </tr>
            </thead>
            <tbody>
              {rates.map((r, i) => (
                <tr key={i} className="border-t">
                  <td className="p-3 font-medium">{r.type}</td>
                  <td className="p-3">{r.employeeRate}%</td>
                  <td className="p-3">{r.employerRate}%</td>
                  <td className="p-3">{r.effectiveDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
