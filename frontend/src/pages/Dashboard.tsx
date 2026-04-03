import { useState, useEffect, useMemo } from "react"
import axios from "axios"

interface DashboardSummary {
  month: number;
  year: number;
  employeeCount: number;
  totalNetPay: number;
  totalEmployerInsurance: number;
  totalTax: number;
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)

  const auth = useMemo(() => ({ 
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } 
  }), [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const now = new Date()
        const month = now.getMonth() === 0 ? 12 : now.getMonth()
        const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
        
        const sumRes = await axios.get(`/api/accounting/summary?month=${month}&year=${year}`, auth)
        setSummary(sumRes.data)
      } catch (err: unknown) { 
        console.error(err) 
      }
    }
    fetchData()
  }, [auth])

  const formatVND = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { 
        style: 'currency', 
        currency: 'VND',
        maximumFractionDigits: 0 
    }).format(val || 0)
  }

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1 style={{ color: "blue", borderBottom: "3px solid blue", paddingBottom: "10px" }}>
        TRANG CHỦ - TỔNG QUAN HỆ THỐNG
      </h1>
      <p style={{ fontWeight: "bold" }}>Dữ liệu của tháng: {summary?.month}/{summary?.year}</p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", marginTop: "20px" }}>
        <div style={{ flex: 1, minWidth: "200px", border: "5px solid blue", padding: "20px", background: "white" }}>
          <h3 style={{ margin: "0", color: "blue" }}>TỔNG NHÂN SỰ</h3>
          <h2 style={{ fontSize: "50px", margin: "10px 0" }}>{summary?.employeeCount || '0'}</h2>
          <p>Người đang làm việc</p>
        </div>

        <div style={{ flex: 1, minWidth: "200px", border: "5px solid green", padding: "20px", background: "white" }}>
          <h3 style={{ margin: "0", color: "green" }}>TỔNG LƯƠNG PHẢI TRẢ</h3>
          <h2 style={{ fontSize: "30px", margin: "10px 0" }}>{formatVND(summary?.totalNetPay || 0)}</h2>
          <p>Tiền lương cho nhân viên</p>
        </div>

        <div style={{ flex: 1, minWidth: "200px", border: "5px solid orange", padding: "20px", background: "white" }}>
          <h3 style={{ margin: "0", color: "orange" }}>BẢO HIỂM DOANH NGHIỆP</h3>
          <h2 style={{ fontSize: "30px", margin: "10px 0" }}>{formatVND(summary?.totalEmployerInsurance || 0)}</h2>
          <p>Tiền đóng bảo hiểm</p>
        </div>

        <div style={{ flex: 1, minWidth: "200px", border: "5px solid red", padding: "20px", background: "white" }}>
          <h3 style={{ margin: "0", color: "red" }}>THUẾ THU NHẬP</h3>
          <h2 style={{ fontSize: "30px", margin: "10px 0" }}>{formatVND(summary?.totalTax || 0)}</h2>
          <p>Thuế tạm trích</p>
        </div>
      </div>

      <div style={{ marginTop: "40px", border: "2px solid black", padding: "20px", background: "#f9f9f9" }}>
        <h2 style={{ color: "blue" }}>DANH SÁCH CHI TIẾT</h2>
        <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid black" }}>
            <thead>
                <tr style={{ background: "#ccc" }}>
                    <th style={{ border: "1px solid black", padding: "10px" }}>Tên mục</th>
                    <th style={{ border: "1px solid black", padding: "10px" }}>Giá trị</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style={{ border: "1px solid black", padding: "10px" }}>Tổng nhân sự</td>
                    <td style={{ border: "1px solid black", padding: "10px" }}>{summary?.employeeCount}</td>
                </tr>
                <tr>
                    <td style={{ border: "1px solid black", padding: "10px" }}>Tổng lương net</td>
                    <td style={{ border: "1px solid black", padding: "10px" }}>{formatVND(summary?.totalNetPay || 0)}</td>
                </tr>
                <tr>
                    <td style={{ border: "1px solid black", padding: "10px" }}>Bảo hiểm xã hội</td>
                    <td style={{ border: "1px solid black", padding: "10px" }}>{formatVND(summary?.totalEmployerInsurance || 0)}</td>
                </tr>
                <tr>
                    <td style={{ border: "1px solid black", padding: "10px" }}>Thuế TNCN</td>
                    <td style={{ border: "1px solid black", padding: "10px" }}>{formatVND(summary?.totalTax || 0)}</td>
                </tr>
            </tbody>
        </table>
      </div>

      <p style={{ marginTop: "30px", color: "gray", fontSize: "12px" }}>
        * Ghi chú: Dữ liệu này được lấy tự động từ máy chủ.
      </p>
    </div>
  )
}
