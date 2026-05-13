import React from 'react';
import '../styles/PrintableLedger.css';

interface LedgerEntry {
  id: number;
  voucherDate: string;
  voucherNumber: string;
  description: string;
  oppositeAccount: string;
  debit: number;
  credit: number;
}

interface PrintableLedgerProps {
  entries: LedgerEntry[];
  accountId: string;
  accountName: string;
  month: number;
  year: number;
  totalDebit: number;
  totalCredit: number;
  companyName?: string;
  companyAddress?: string;
}

const PrintableLedger: React.FC<PrintableLedgerProps> = ({
  entries,
  accountId,
  accountName,
  month,
  year,
  totalDebit,
  totalCredit,
  companyName = "Công ty TNHH thiết bị kỹ thuật tin học Phúc Anh",
  companyAddress = "Số 43, Tổ 4, Xã Sóc Sơn, TP Hà Nội, Việt Nam"
}) => {
  const formatCurrency = (amount: number) => {
    if (!amount) return "";
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  const today = new Date();
  const dateStr = `Ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}`;

  // Lấy ngày đầu tháng và ngày cuối tháng
  const firstDay = `01/${month.toString().padStart(2, '0')}/${year}`;
  const lastDay = new Date(year, month, 0).getDate();
  const lastDayStr = `${lastDay}/${month.toString().padStart(2, '0')}/${year}`;

  return (
    <div className="printable-area">
      <div className="report-header">
        <div className="company-info">
          <div className="company-name">{companyName}</div>
          <div className="company-address">{companyAddress}</div>
        </div>
        <div className="report-form-id">
          <div className="text-bold">Mẫu số S03b - DN</div>
          <div className="text-italic">(Ban hành theo TT 200 BTC ngày 22/12/2014</div>
          <div className="text-italic">của Bộ trưởng BTC)</div>
        </div>
      </div>

      <div className="report-title-section">
        <div className="report-main-title">SỔ CÁI</div>
        <div className="report-subtitle">Từ ngày {firstDay} đến ngày {lastDayStr}</div>
        <div className="report-account-info">Tên tài khoản: {accountName}</div>
        <div className="report-account-info">Số hiệu: {accountId}</div>
      </div>

      <div className="report-currency">Tiền tệ: VNĐ</div>

      <table className="report-table">
        <thead>
          <tr>
            <th rowSpan={2} style={{ width: '10%' }}>Ngày tháng ghi sổ</th>
            <th colSpan={2} style={{ width: '20%' }}>Chứng từ</th>
            <th rowSpan={2} style={{ width: '30%' }}>Diễn giải</th>
            <th rowSpan={2} style={{ width: '10%' }}>Nhật kí chung</th>
            <th rowSpan={2} style={{ width: '10%' }}>Số hiệu TK đối ứng</th>
            <th colSpan={2} style={{ width: '20%' }}>Số tiền</th>
          </tr>
          <tr>
            <th>Số</th>
            <th>Ngày, tháng</th>
            <th>Nợ</th>
            <th>Có</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, index) => (
            <tr key={index}>
              <td className="text-center">{entry.voucherDate}</td>
              <td className="text-center">{entry.voucherNumber}</td>
              <td className="text-center">{entry.voucherDate}</td>
              <td>{entry.description}</td>
              <td></td>
              <td className="text-center">{entry.oppositeAccount}</td>
              <td className="text-right">{formatCurrency(entry.debit)}</td>
              <td className="text-right">{formatCurrency(entry.credit)}</td>
            </tr>
          ))}

          <tr className="text-bold">
            <td colSpan={6} className="text-right">Cộng phát sinh tháng</td>
            <td className="text-right">{formatCurrency(totalDebit)}</td>
            <td className="text-right">{formatCurrency(totalCredit)}</td>
          </tr>
        </tbody>
      </table>

      <div className="report-footer">
        <div className="footer-date">{dateStr}</div>
        <div className="signature-section">
          <div className="signature-item">
            <div className="signature-title">Người ghi sổ</div>
            <div className="signature-subtitle">(Ký, họ tên)</div>
            <div className="signature-space"></div>
          </div>
          <div className="signature-item">
            <div className="signature-title">Kế toán trưởng</div>
            <div className="signature-subtitle">(Ký, họ tên)</div>
            <div className="signature-space"></div>
          </div>
          <div className="signature-item">
            <div className="signature-title">Giám đốc</div>
            <div className="signature-subtitle">(Ký, họ tên, đóng dấu)</div>
            <div className="signature-space"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintableLedger;
