import { useState, useEffect, useCallback, useMemo } from "react"
import axios from "axios"
import { PieChart as PieIcon, Shield, FileText, Building2 } from "lucide-react"
import { ExportService } from "../utils/ExportService"

interface SummaryData {
  month: number
  year: number
  employeeCount: number
  totalGrossIncome: number
  totalBaseSalary: number
  totalMealAllowance: number
  totalOtPay: number
  totalBHXH: number
  totalBHYT: number
  totalBHTN: number
  totalInsurance: number
  totalEmployerInsurance: number
  totalTax: number
  totalNetPay: number
  details: DetailRow[]
}

interface DetailRow {
  employeeId: string
  fullName: string
  grossIncome: number
  bhxh: number
  bhyt: number
  bhtn: number
  totalInsurance: number
  totalEmployerInsurance: number
  taxableIncome: number
  taxAmount: number
  netPay: number
  status: string
}

interface InsuranceDetail extends DetailRow {
  contractSalary: number
  bhxhEE: number
  bhytEE: number
  bhtnEE: number
  totalEE: number
  bhxhER: number
  bhytER: number
  bhtnER: number
  kpcd: number
  totalER: number
}

interface TaxDetail extends DetailRow {
  dependentCount: number
}

interface UnionDetail extends DetailRow {
  contractSalary: number
  kpcd: number
}

interface ReportData<T> {
    details: T[]
}

const TABS = [
  { id: "summary", label: "TỔNG HỢP CHUNG", icon: PieIcon },
  { id: "insurance", label: "BÁO CÁO BẢO HIỂM", icon: Shield },
  { id: "tax", label: "BÁO CÁO THUẾ TNCN", icon: FileText },
  { id: "union", label: "BÁO CÁO CÔNG ĐOÀN", icon: Building2 },
]

export default function ReportsPage() {
  const [month, setMonth] = useState(new Date().getMonth() === 0 ? 12 : new Date().getMonth())
  const [year, setYear] = useState(new Date().getMonth() === 0 ? new Date().getFullYear() - 1 : new Date().getFullYear())
  const [activeTab, setActiveTab] = useState("summary")
  const [data, setData] = useState<SummaryData | null>(null)
  const [insuranceData, setInsuranceData] = useState<ReportData<InsuranceDetail> | null>(null)
  const [taxData, setTaxData] = useState<ReportData<TaxDetail> | null>(null)
  const [unionData, setUnionData] = useState<ReportData<UnionDetail> | null>(null)

  const headers = useMemo(() => ({ 
    Authorization: `Bearer ${localStorage.getItem("token")}` 
  }), [])

  const fetchAll = useCallback(async () => {
    try {
      const [sumRes, insRes, taxRes, unionRes] = await Promise.all([
        axios.get(`/api/accounting/summary?month=${month}&year=${year}`, { headers }),
        axios.get(`/api/accounting/report/insurance?month=${month}&year=${year}`, { headers }),
        axios.get(`/api/accounting/report/tax?month=${month}&year=${year}`, { headers }),
        axios.get(`/api/accounting/report/union-fee?month=${month}&year=${year}`, { headers }),
      ])
      setData(sumRes.data)
      setInsuranceData(insRes.data)
      setTaxData(taxRes.data)
      setUnionData(unionRes.data)
    } catch (err: unknown) { console.error(err) }
  }, [month, year, headers])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleExportExcel = useCallback(() => {
    if (activeTab === 'summary' && data) {
      ExportService.exportToExcel(data.details, `Bao_cao_tong_hop_${month}_${year}`, 'Tổng hợp', {
        employeeId: "Mã NV", fullName: "Họ tên", grossIncome: "Thu nhập Gross", totalInsurance: "BH Nhân viên", taxAmount: "Thuế TNCN", netPay: "Thực lĩnh"
      });
    } else if (activeTab === 'insurance' && insuranceData) {
      ExportService.exportToExcel(insuranceData.details, `Bao_cao_bao_hiem_${month}_${year}`, 'Bảo hiểm', {
        employeeId: "Mã NV", fullName: "Họ tên", contractSalary: "Lương HĐ", bhxhEE: "BHXH (8%)", bhytEE: "BHYT (1.5%)", bhtnEE: "BHTN (1%)", totalEE: "Tổng NLĐ", bhxhER: "BHXH DN", bhytER: "BHYT DN", bhtnER: "BHTN DN", kpcd: "KPCĐ DN", totalER: "Tổng DN"
      });
    } else if (activeTab === 'tax' && taxData) {
      ExportService.exportToExcel(taxData.details, `Bao_cao_thue_TNCN_${month}_${year}`, 'Thuế TNCN', {
        employeeId: "Mã NV", fullName: "Họ tên", dependentCount: "Người PT", grossIncome: "Tổng thu nhập", totalInsurance: "Các khoản giảm trừ", taxableIncome: "TN Tính thuế", taxAmount: "Thuế TNCN", netPay: "Thực lĩnh"
      });
    } else if (activeTab === 'union' && unionData) {
      ExportService.exportToExcel(unionData.details, `Bao_cao_cong_doan_${month}_${year}`, 'Công đoàn', {
        employeeId: "Mã NV", fullName: "Họ tên", contractSalary: "Lương HĐ", kpcd: "Kinh phí CĐ"
      });
    }
  }, [activeTab, data, insuranceData, month, taxData, unionData, year])

  const formatVND = (val: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(val || 0)

  return (
    <div style={{ padding: "20px", fontFamily: "Arial", background: "#f0f0f0" }}>
      <div style={{ background: "white", padding: "15px", border: "3px solid black", display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
        <div>
            <h1 style={{ color: "blue", margin: 0 }}>SỔ SÁCH & BÁO CÁO CHI TIẾT</h1>
            <p style={{ margin: "5px 0" }}>Chọn tháng/năm để xem báo cáo tài chính</p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <label>Tháng:</label>
            <input type="number" value={month} onChange={e => setMonth(Number(e.target.value))} style={{ width: "50px", border: "1px solid black" }} />
            <label>Năm:</label>
            <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} style={{ width: "70px", border: "1px solid black" }} />
            {activeTab !== 'summary' && (
                <button onClick={handleExportExcel} style={{ background: "green", color: "white", padding: "5px 10px", border: "2px solid black", fontWeight: "bold" }}>
                    XUẤT FILE EXCEL
                </button>
            )}
        </div>
      </div>

      <div style={{ display: "flex", gap: "5px", marginBottom: "10px" }}>
          {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{ 
                    padding: "10px 15px", 
                    border: "2px solid black", 
                    background: activeTab === tab.id ? "blue" : "white", 
                    color: activeTab === tab.id ? "white" : "black",
                    fontWeight: "bold",
                    cursor: "pointer"
                }}
              >
                  {tab.label}
              </button>
          ))}
      </div>

      {activeTab === "summary" && data && (
          <div style={{ background: "white", padding: "20px", border: "3px solid black" }}>
              <h2 style={{ color: "blue", borderBottom: "2px solid blue", paddingBottom: "5px" }}>THÔNG TIN TỔNG HỢP KỲ {month}/{year}</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "15px", marginTop: "15px" }}>
                  <div style={{ border: "4px solid blue", padding: "15px", flex: 1, minWidth: "200px" }}>
                      <p style={{ fontWeight: "bold", color: "blue" }}>NHÂN SỰ: {data.employeeCount} Người</p>
                  </div>
                  <div style={{ border: "4px solid orange", padding: "15px", flex: 1, minWidth: "200px" }}>
                      <p style={{ fontWeight: "bold", color: "orange" }}>BH DOANH NGHIỆP: {formatVND(data.totalEmployerInsurance)}</p>
                  </div>
                  <div style={{ border: "4px solid green", padding: "15px", flex: 1, minWidth: "200px" }}>
                      <p style={{ fontWeight: "bold", color: "green" }}>TỔNG CHI PHÍ LƯƠNG: {formatVND(data.totalGrossIncome + data.totalEmployerInsurance)}</p>
                  </div>
              </div>

              <div style={{ marginTop: "30px" }}>
                  <p style={{ fontWeight: "black", fontSize: "18px", color: "red" }}>CHÚ Ý: TRANG NÀY CHỈ HIỂN THỊ DỮ LIỆU CHỮ, KHÔNG CÓ BIỂU ĐỒ NÀO!</p>
                  <table border={1} style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
                      <thead>
                          <tr style={{ background: "blue", color: "white" }}>
                              <th style={{ padding: "10px", border: "1px solid black" }}>HỌ VÀ TÊN</th>
                              <th style={{ padding: "10px", border: "1px solid black" }}>MÃ NV</th>
                              <th style={{ padding: "10px", border: "1px solid black" }}>LƯƠNG RÒNG (NET)</th>
                              <th style={{ padding: "10px", border: "1px solid black" }}>HẬU CẦN / BH</th>
                              <th style={{ padding: "10px", border: "1px solid black" }}>THUẾ TNCN</th>
                          </tr>
                      </thead>
                      <tbody>
                          {data.details.map(d => (
                              <tr key={d.employeeId}>
                                  <td style={{ padding: "8px", border: "1px solid black", fontWeight: "bold" }}>{d.fullName}</td>
                                  <td style={{ padding: "8px", border: "1px solid black", textAlign: "center" }}>{d.employeeId}</td>
                                  <td style={{ padding: "8px", border: "1px solid black", textAlign: "right" }}>{formatVND(d.netPay)}</td>
                                  <td style={{ padding: "8px", border: "1px solid black", textAlign: "right" }}>{formatVND(d.totalInsurance)}</td>
                                  <td style={{ padding: "8px", border: "1px solid black", textAlign: "right", color: "red" }}>{formatVND(d.taxAmount)}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {activeTab === "insurance" && insuranceData && (
          <div style={{ background: "white", padding: "20px", border: "3px solid black" }}>
              <h2 style={{ color: "blue" }}>BẢNG BIỂU BẢO HIỂM</h2>
              <table border={1} style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead style={{ background: "#eee" }}>
                      <tr>
                          <th style={{ padding: "8px", border: "1px solid black" }}>MÃ NV</th>
                          <th style={{ padding: "8px", border: "1px solid black" }}>HỌ TÊN</th>
                          <th style={{ padding: "8px", border: "1px solid black" }}>LƯƠNG HĐ</th>
                          <th style={{ padding: "8px", border: "1px solid black" }}>NLĐ ĐÓNG</th>
                          <th style={{ padding: "8px", border: "1px solid black" }}>CTY ĐÓNG</th>
                      </tr>
                  </thead>
                  <tbody>
                      {insuranceData.details.map((item: InsuranceDetail) => (
                          <tr key={item.employeeId}>
                              <td style={{ padding: "8px", border: "1px solid black" }}>{item.employeeId}</td>
                              <td style={{ padding: "8px", border: "1px solid black", fontWeight: "bold" }}>{item.fullName}</td>
                              <td style={{ padding: "8px", border: "1px solid black", textAlign: "right" }}>{formatVND(item.contractSalary)}</td>
                              <td style={{ padding: "8px", border: "1px solid black", textAlign: "right", color: "blue" }}>{formatVND(item.totalEE)}</td>
                              <td style={{ padding: "8px", border: "1px solid black", textAlign: "right", color: "green" }}>{formatVND(item.totalER)}</td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      )}

      {activeTab === "tax" && taxData && (
          <div style={{ background: "white", padding: "20px", border: "3px solid black" }}>
              <h2 style={{ color: "red" }}>BẢNG BIỂU THUẾ TNCN</h2>
              <table border={1} style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead style={{ background: "#eee" }}>
                      <tr>
                          <th style={{ padding: "8px", border: "1px solid black" }}>MÃ NV</th>
                          <th style={{ padding: "8px", border: "1px solid black" }}>HỌ TÊN</th>
                          <th style={{ padding: "8px", border: "1px solid black" }}>CƠ SỞ TÍNH THUẾ</th>
                          <th style={{ padding: "8px", border: "1px solid black" }}>NGƯỜI PT</th>
                          <th style={{ padding: "8px", border: "1px solid black" }}>SỐ THUẾ PHẢI NỘP</th>
                      </tr>
                  </thead>
                  <tbody>
                      {taxData.details.map((item: TaxDetail) => (
                          <tr key={item.employeeId}>
                              <td style={{ padding: "8px", border: "1px solid black" }}>{item.employeeId}</td>
                              <td style={{ padding: "8px", border: "1px solid black", fontWeight: "bold" }}>{item.fullName}</td>
                              <td style={{ padding: "8px", border: "1px solid black", textAlign: "right" }}>{formatVND(item.taxableIncome)}</td>
                              <td style={{ padding: "8px", border: "1px solid black", textAlign: "center" }}>{item.dependentCount}</td>
                              <td style={{ padding: "8px", border: "1px solid black", textAlign: "right", color: "red", fontWeight: "bold" }}>{formatVND(item.taxAmount)}</td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      )}

      {activeTab === "union" && unionData && (
          <div style={{ background: "white", padding: "20px", border: "3px solid black" }}>
              <h2 style={{ color: "purple" }}>BẢNG BIỂU CÔNG ĐOÀN (2%)</h2>
              <table border={1} style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead style={{ background: "#eee" }}>
                      <tr>
                          <th style={{ padding: "8px", border: "1px solid black" }}>MÃ NV</th>
                          <th style={{ padding: "8px", border: "1px solid black" }}>HỌ TÊN</th>
                          <th style={{ padding: "8px", border: "1px solid black" }}>QUỸ LƯƠNG ĐÓNG BH</th>
                          <th style={{ padding: "8px", border: "1px solid black" }}>KINH PHÍ CÔNG ĐOÀN</th>
                      </tr>
                  </thead>
                  <tbody>
                      {unionData.details.map((item: UnionDetail) => (
                          <tr key={item.employeeId}>
                              <td style={{ padding: "8px", border: "1px solid black" }}>{item.employeeId}</td>
                              <td style={{ padding: "8px", border: "1px solid black", fontWeight: "bold" }}>{item.fullName}</td>
                              <td style={{ padding: "8px", border: "1px solid black", textAlign: "right" }}>{formatVND(item.contractSalary)}</td>
                              <td style={{ padding: "8px", border: "1px solid black", textAlign: "right", color: "purple", fontWeight: "bold" }}>{formatVND(item.kpcd)}</td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      )}

      {(activeTab !== "summary" && (
        (activeTab === "insurance" && !insuranceData) ||
        (activeTab === "tax" && !taxData) ||
        (activeTab === "union" && !unionData)
      )) && (
        <div style={{ textAlign: "center", padding: "50px", border: "2px solid black", background: "white" }}>
            <p style={{ color: "gray", fontWeight: "bold" }}>KHÔNG CÓ DỮ LIỆU (Có thể chưa tính lương kỳ này)</p>
        </div>
      )}
    </div>
  )
}
