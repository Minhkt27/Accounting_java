import React from "react";
import "../styles/PrintableReport.css";

interface TaxDetail {
  employeeId: string;
  fullName: string;
  grossIncome: number;
  totalInsurance: number;
  dependentCount: number;
  taxAmount: number;
}

interface PrintableTaxReportProps {
  data: TaxDetail[];
  month: number;
  year: number;
  companyName?: string;
  companyAddress?: string;
}

const PrintableTaxReport: React.FC<PrintableTaxReportProps> = ({
  data,
  month,
  year,
  companyName = "CÔNG TY TNHH PHÚC ANH",
  companyAddress = "Số 43, Tổ 4, Xã Sóc Sơn, TP Hà Nội, Việt Nam",
}) => {
  const formatCurrency = (amount: number) => {
    if (amount === 0) return "-";
    return new Intl.NumberFormat("vi-VN").format(amount || 0);
  };

  const today = new Date();
  const dateStr = `Ngày ${today.getDate().toString().padStart(2, "0")} tháng ${(today.getMonth() + 1).toString().padStart(2, "0")} năm ${today.getFullYear()}`;

  const SELF_DEDUCTION = 11000000;
  const DEPENDENT_DEDUCTION = 4400000;

  return (
    <div className="printable-area">
      <div className="report-container">
        <div className="report-header">
          <div className="company-info">
            <div className="company-name">Đơn vị: {companyName}</div>
            <div className="company-address">Địa chỉ: {companyAddress}</div>
          </div>
          <div className="report-id">BÁO CÁO LƯƠNG</div>
        </div>

        <div className="report-title-section">
          <div className="report-title">BÁO CÁO THUẾ THU NHẬP CÁ NHÂN</div>
          <div className="report-period">
            Tháng {month} năm {year}
          </div>
        </div>

        <div className="report-unit">Đơn vị tính: VNĐ</div>

        <table className="report-table">
          <thead>
            <tr>
              <th rowSpan={2} style={{ width: "40px" }}>
                STT
              </th>
              <th rowSpan={2} style={{ width: "200px" }}>
                HỌ VÀ TÊN
              </th>
              <th rowSpan={2} style={{ width: "100px" }}>
                MÃ SỐ THUẾ
              </th>
              <th rowSpan={2} style={{ width: "120px" }}>
                TỔNG THU NHẬP
              </th>
              <th colSpan={4}>CÁC KHOẢN GIẢM TRỪ</th>
              <th rowSpan={2} style={{ width: "120px" }}>
                THU NHẬP TÍNH THUẾ
              </th>
              <th rowSpan={2} style={{ width: "110px" }}>
                THUẾ TNCN PHẢI NỘP
              </th>
            </tr>
            <tr>
              <th style={{ width: "100px" }}>BẢN THÂN NGƯỜI</th>
              <th style={{ width: "100px" }}>NGƯỜI PT</th>
              <th style={{ width: "100px" }}>BHXH BHYT BHTN</th>
              <th style={{ width: "110px" }}>TỔNG</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => {
              const depTotal = (item.dependentCount || 0) * DEPENDENT_DEDUCTION;
              const totalDeduction =
                SELF_DEDUCTION + depTotal + item.totalInsurance;
              // Theo mẫu ảnh: "Thu nhập tính thuế" = Tổng thu nhập - Bảo hiểm
              const taxAssessedIncome = item.grossIncome - item.totalInsurance;

              return (
                <tr key={item.employeeId}>
                  <td className="text-center">{index + 1}</td>
                  <td>{item.fullName}</td>
                  <td className="text-center">
                    {/* Trống nếu không có MST */}
                  </td>
                  <td className="text-right">
                    {formatCurrency(item.grossIncome)}
                  </td>
                  <td className="text-right">
                    {formatCurrency(SELF_DEDUCTION)}
                  </td>
                  <td className="text-right">{formatCurrency(depTotal)}</td>
                  <td className="text-right">
                    {formatCurrency(item.totalInsurance)}
                  </td>
                  <td className="text-right" style={{ fontWeight: "bold" }}>
                    {formatCurrency(totalDeduction)}
                  </td>
                  <td className="text-right">
                    {formatCurrency(taxAssessedIncome)}
                  </td>
                  <td className="text-right" style={{ fontWeight: "bold" }}>
                    {formatCurrency(item.taxAmount)}
                  </td>
                </tr>
              );
            })}
            {data.length === 0 && (
              <tr>
                <td
                  colSpan={10}
                  className="text-center"
                  style={{ fontStyle: "italic", padding: "20px" }}
                >
                  Không có dữ liệu quyết toán thuế trong kỳ này
                </td>
              </tr>
            )}
          </tbody>
          {data.length > 0 && (
            <tfoot>
              <tr style={{ fontWeight: "bold" }}>
                <td colSpan={3} className="text-center">
                  TỔNG CỘNG
                </td>
                <td className="text-right">
                  {formatCurrency(
                    data.reduce((sum, i) => sum + i.grossIncome, 0),
                  )}
                </td>
                <td colSpan={2}></td>
                <td className="text-right">
                  {formatCurrency(
                    data.reduce((sum, i) => sum + i.totalInsurance, 0),
                  )}
                </td>
                <td></td>
                <td className="text-right">
                  {formatCurrency(
                    data.reduce(
                      (sum, i) => sum + (i.grossIncome - i.totalInsurance),
                      0,
                    ),
                  )}
                </td>
                <td className="text-right">
                  {formatCurrency(
                    data.reduce((sum, i) => sum + i.taxAmount, 0),
                  )}
                </td>
              </tr>
            </tfoot>
          )}
        </table>

        <div className="report-footer">
          <div className="footer-date">{dateStr}</div>
          <div className="signature-grid">
            <div className="signature-box">
              <div className="signature-title">Người ghi sổ</div>
              <div className="signature-note">(Ký, họ tên)</div>
              <div className="signature-space"></div>
            </div>
            <div className="signature-box">
              <div className="signature-title">Kế toán trưởng</div>
              <div className="signature-note">(Ký, họ tên)</div>
              <div className="signature-space"></div>
            </div>
            <div className="signature-box">
              <div className="signature-title">Giám đốc</div>
              <div className="signature-note">(Ký, họ tên, đóng dấu)</div>
              <div className="signature-space"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintableTaxReport;
