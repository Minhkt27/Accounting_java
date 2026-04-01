import { useState, useEffect } from "react"
import axios from "axios"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Plus, Trash2 } from "lucide-react"

export default function TaxConfigPage() {
  const [tiers, setTiers] = useState<any[]>([])
  const [deductions, setDeductions] = useState<any>({ personalDeduction: 15500000, dependentDeduction: 6200000 })

  const fetchData = async () => {
    try {
      const auth = { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      const resTax = await axios.get("/api/config/tax", auth)
      setTiers(resTax.data)
      const resDed = await axios.get("/api/config/deductions", auth)
      if(resDed.data.length > 0) setDeductions(resDed.data[0])
    } catch (err: any) { alert("Lỗi tải dữ liệu: " + err.message) }
  }

  useEffect(() => { fetchData() }, [])

  const handleAddTier = () => {
    setTiers([...tiers, { lowerBound: 0, upperBound: 0, taxRate: 0, tierLevel: tiers.length + 1 }])
  }

  const handleSaveTax = async () => {
    try {
      await axios.post("/api/config/tax", tiers, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      })
      alert("Đã cập nhật biểu thuế TNCN!")
    } catch (err: any) { alert("Lỗi lưu thuế: " + err.message) }
  }

  const handleSaveDeduction = async () => {
    try {
      await axios.post("/api/config/deductions", deductions, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      })
      alert("Đã cập nhật giảm trừ gia cảnh!")
    } catch (err: any) { alert("Lỗi lưu giảm trừ: " + err.message) }
  }

  return (
    <div className="space-y-10 pb-10">
      <section className="space-y-4">
        <h2 className="text-xl font-bold">Biểu thuế TNCN (UC04/05)</h2>
        <div className="border rounded-xl bg-card overflow-hidden shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted">
              <tr>
                <th className="p-3">Bậc</th>
                <th className="p-3">Cận dưới (VNĐ)</th>
                <th className="p-3">Cận trên (VNĐ)</th>
                <th className="p-3">Thuế suất (%)</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {tiers.map((t, i) => (
                <tr key={i}>
                  <td className="p-3 font-medium">{i+1}</td>
                  <td className="p-3"><Input type="number" value={t.lowerBound} onChange={e => {
                    const newTiers = [...tiers]; newTiers[i].lowerBound = Number(e.target.value); setTiers(newTiers);
                  }} /></td>
                  <td className="p-3"><Input type="number" value={t.upperBound} onChange={e => {
                    const newTiers = [...tiers]; newTiers[i].upperBound = Number(e.target.value); setTiers(newTiers);
                  }} /></td>
                  <td className="p-3"><Input type="number" value={t.taxRate} onChange={e => {
                    const newTiers = [...tiers]; newTiers[i].taxRate = Number(e.target.value); setTiers(newTiers);
                  }} /></td>
                  <td className="p-3">
                    <Button variant="ghost" size="icon" onClick={() => setTiers(tiers.filter((_, idx)=>idx!==i))}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-4 bg-muted/30 flex justify-between">
            <Button variant="outline" onClick={handleAddTier} className="gap-2"><Plus className="w-4 h-4"/> Thêm bậc</Button>
            <Button onClick={handleSaveTax}>Lưu biểu thuế</Button>
          </div>
        </div>
      </section>

      <section className="max-w-md space-y-4">
        <h2 className="text-xl font-bold">Giảm trừ gia cảnh (UC06)</h2>
        <div className="border p-6 rounded-xl bg-card space-y-4 shadow-sm">
          <div className="space-y-2">
            <label className="text-sm font-medium">Bản thân (VNĐ)</label>
            <Input type="number" value={deductions.personalDeduction} onChange={e => setDeductions({...deductions, personalDeduction: Number(e.target.value)})} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Người phụ thuộc (VNĐ)</label>
            <Input type="number" value={deductions.dependentDeduction} onChange={e => setDeductions({...deductions, dependentDeduction: Number(e.target.value)})} />
          </div>
          <Button onClick={handleSaveDeduction} className="w-full">Lưu định mức giảm trừ</Button>
        </div>
      </section>
    </div>
  )
}
