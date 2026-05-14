import React from 'react';
import '../styles/PrintableReport.css';

interface DetailRow {
  employeeId: string;
  fullName: string;
  grossIncome: number;
  totalInsurance: number;
  taxAmount: number;
  netPay: number;
}

interface PrintableSummaryReportProps {
  data: DetailRow[];
  month: number;
  year: number;
  companyName?: string;
  companyAddress?: string;
}

const PrintableSummaryReport: React.FC<PrintableSummaryReportProps> = ({
  data,
  month,
  year,
  companyName = "CÔNG TY TNHH PHÚC ANH",
  companyAddress = "Số 43, Tổ 4, Xã Sóc Sơn, TP Hà Nội, Việt Nam"
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount || 0);
  };

  const today = new Date();
  const dateStr = `Ngày ${today.getDate().toString().padStart(2, '0')} tháng ${(today.getMonth() + 1).toString().padStart(2, '0')} năm ${today.getFullYear()}`;

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
          <div className="report-title">BẢNG TỔNG HỢP CHI TRẢ LƯƠNG</div>
          <div className="report-period">Tháng {month} năm {year}</div>
        </div>

        <div className="report-unit">Đơn vị tính: VNĐ</div>

        <table className="report-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>STT</th>
              <th style={{ width: '100px' }}>MÃ NV</th>
              <th>HỌ VÀ TÊN</th>
              <th style={{ width: '140px' }}>TỔNG THU NHẬP</th>
              <th style={{ width: '140px' }}>BẢO HIỂM (NLĐ)</th>
              <th style={{ width: '140px' }}>THUẾ TNCN</th>
              <th style={{ width: '140px' }}>THỰC LĨNH</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={item.employeeId}>
                <td className="text-center">{index + 1}</td>
                <td className="text-center">{item.employeeId}</td>
                <td>{item.fullName}</td>
                <td className="text-right">{formatCurrency(item.grossIncome)}</td>
                <td className="text-right">{formatCurrency(item.totalInsurance)}</td>
                <td className="text-right">{formatCurrency(item.taxAmount)}</td>
                <td className="text-right" style={{ fontWeight: 'bold' }}>{formatCurrency(item.netPay)}</td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center" style={{ fontStyle: 'italic', padding: '20px' }}>
                  Không có dữ liệu tổng hợp trong kỳ này
                </td>
              </tr>
            )}
          </tbody>
          {data.length > 0 && (
            <tfoot>
              <tr style={{ fontWeight: 'bold' }}>
                <td colSpan={3} className="text-center">TỔNG CỘNG</td>
                <td className="text-right">{formatCurrency(data.reduce((sum, i) => sum + i.grossIncome, 0))}</td>
                <td className="text-right">{formatCurrency(data.reduce((sum, i) => sum + i.totalInsurance, 0))}</td>
                <td className="text-right">{formatCurrency(data.reduce((sum, i) => sum + i.taxAmount, 0))}</td>
                <td className="text-right">{formatCurrency(data.reduce((sum, i) => sum + i.netPay, 0))}</td>
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

export default PrintableSummaryReport;
