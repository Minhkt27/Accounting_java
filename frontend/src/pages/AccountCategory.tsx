import { useState, useEffect, useCallback } from "react"
import axios from "axios"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"

interface AccountCategory {
  id: string;
  name: string;
  type: string;
  status: string;
}

export default function AccountCategoryPage() {
  const [accounts, setAccounts] = useState<AccountCategory[]>([])
  const [id, setId] = useState("")
  const [name, setName] = useState("")
  const [type, setType] = useState("Nợ")
  const [error, setError] = useState("")

  const fetchAccounts = useCallback(async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await axios.get("/api/config/accounts", {
        headers: { Authorization: `Bearer ${token}` }
      })
      setAccounts(res.data)
      setError("")
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        window.location.href = "/login"
      }
      const message = err instanceof Error ? err.message : String(err)
      setError("Không thể lấy dữ liệu: " + message)
    }
  }, [])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem("token")
      await axios.post("/api/config/accounts", { id, name, type }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchAccounts()
      setId("")
      setName("")
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setError("Lỗi lưu dữ liệu: " + message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Danh mục tài khoản (UC01)</h1>
      </div>

      {error && <div className="p-3 bg-red-100 text-red-600 rounded-md">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 border rounded-lg p-4 bg-card shadow-sm h-fit">
          <h3 className="font-semibold mb-4 text-lg">Thêm mới tài khoản</h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Mã số TK</label>
              <Input value={id} onChange={(e) => setId(e.target.value)} placeholder="Ví dụ: 334" required />
            </div>
            <div>
              <label className="text-sm font-medium">Tên TK</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ví dụ: Phải trả NLĐ" required />
            </div>
            <div>
              <label className="text-sm font-medium">Loại (Nợ/Có)</label>
              <select 
                value={type} onChange={(e) => setType(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="Nợ">Nợ</option>
                <option value="Có">Có</option>
                <option value="Lưỡng tính">Lưỡng tính</option>
              </select>
            </div>
            <Button type="submit" className="w-full">Lưu</Button>
          </form>
        </div>

        <div className="col-span-2 border rounded-lg bg-card shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Mã TK</th>
                <th className="px-4 py-3 font-medium">Tên TK</th>
                <th className="px-4 py-3 font-medium">Loại</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {accounts.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-4 text-muted-foreground">Chưa có dữ liệu.</td></tr>
              ) : accounts.map((acc, idx) => (
                <tr key={idx} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 font-medium">{acc.id}</td>
                  <td className="px-4 py-3">{acc.name}</td>
                  <td className="px-4 py-3">{acc.type}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${acc.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {acc.status}
                    </span>
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
