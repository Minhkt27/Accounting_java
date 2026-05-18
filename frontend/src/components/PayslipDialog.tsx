import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { FileText } from "lucide-react";

import type { Payroll } from "../pages/PayrollPage";

interface PayslipDialogProps {
  payroll: Payroll;
}

export default function PayslipDialog({ payroll }: PayslipDialogProps) {
  const formatVND = (val: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val || 0);
  };

  // Hàm chuyển số thành chữ (Tiếng Việt)
  const toVietnameseWords = (amount: number): string => {
    if (amount <= 0) return "Không đồng";
    const units = [
      "",
      "một",
      "hai",
      "ba",
      "bốn",
      "năm",
      "sáu",
      "bảy",
      "tám",
      "chín",
    ];

    const readThreeDigits = (n: number, showZero: boolean): string => {
      let res = "";
      const h = Math.floor(n / 100);
      const t = Math.floor((n % 100) / 10);
      const u = n % 10;

      if (h > 0) {
        res += units[h] + " trăm ";
      } else if (showZero) {
        res += "không trăm ";
      }

      if (t > 1) {
        res += units[t] + " mươi ";
        if (u === 1) res += "mốt ";
        else if (u === 5) res += "lăm ";
        else if (u > 0) res += units[u] + " ";
      } else if (t === 1) {
        res += "mười ";
        if (u === 5) res += "lăm ";
        else if (u > 0) res += units[u] + " ";
      } else if (u > 0) {
        if (h > 0 || showZero) res += "lẻ ";
        res += units[u] + " ";
      }
      return res;
    };

    const groups = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"];
    let res = "";
    let temp = Math.floor(amount);
    let groupIdx = 0;

    while (temp > 0) {
      const three = temp % 1000;
      if (three > 0) {
        res = readThreeDigits(three, temp > 999) + groups[groupIdx] + " " + res;
      }
      temp = Math.floor(temp / 1000);
      groupIdx++;
    }

    const final = res.trim();
    if (!final) return "Không đồng";
    return final.charAt(0).toUpperCase() + final.slice(1) + " đồng";
  };

  return (
    <Dialog>
      <DialogTrigger>
        <Button
          variant="outline"
          className="h-7 text-[10px] gap-1 px-3 border-black text-black hover:bg-black/5 rounded-none shadow-none"
        >
          <FileText className="w-3 h-3" /> Phiếu lương
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl bg-white text-black p-0 payslip-modal print:p-0 print:m-0 print:shadow-none sm:rounded-none border border-black shadow-none overflow-hidden flex flex-col max-h-[95vh]">
        <div
          id="payslip-content"
          className="flex-1 overflow-y-auto p-10 space-y-6 scrollbar-hide text-[13px] leading-tight"
        >
          {/* Header Section */}
          <div className="flex flex-col items-start text-left space-y-1 mb-4">
            <h1 className="text-sm uppercase w-full text-left">
              Công ty TNHH thiết bị kỹ thuật tin học Phúc Anh
            </h1>
            <p className="text-[12px] w-full text-left">
              Số 43, Tổ 4, Xã Sóc Sơn, TP Hà Nội, Việt Nam
            </p>
            <p className="text-[12px] w-full text-left">
              Mã số thuế: 0110465135
            </p>

            <div className="py-4 space-y-1 text-center w-full border-b border-black">
              <h2 className="text-xl uppercase">PHIẾU LƯƠNG NHÂN VIÊN</h2>
              <p className="text-sm">
                Kỳ lương: Tháng {payroll.month} / {payroll.year}
              </p>
            </div>
          </div>

          {/* Employee & Work Info */}
          <div className="grid grid-cols-2 gap-x-10 gap-y-1 py-2">
            <div className="flex text-left">
              <span className="w-40 shrink-0">Họ tên nhân viên:</span>
              <span className="uppercase">{payroll.employee?.fullName}</span>
            </div>
            <div className="flex text-left">
              <span className="w-40 shrink-0">Ngày sinh:</span>
              <span>{payroll.employee?.dob || "---"}</span>
            </div>
            <div className="flex text-left">
              <span className="w-40 shrink-0">SĐT:</span>
              <span>{payroll.employee?.phone || "---"}</span>
            </div>
            <div className="flex text-left">
              <span className="w-40 shrink-0">Mã nhân viên:</span>
              <span>{payroll.employee?.id}</span>
            </div>
            <div className="flex text-left">
              <span className="w-40 shrink-0">Chức vụ/Bộ phận:</span>
              <span>
                {(() => {
                  const type = payroll.employee?.employeeType;
                  const dept = payroll.employee?.department || "Văn phòng";
                  if (type === "INTERN") return `Thực tập sinh ${dept}`;
                  if (type === "PROBATION") return `Nhân viên thử việc ${dept}`;
                  return `Nhân viên phòng ${dept}`;
                })()}
              </span>
            </div>
            <div className="flex text-left">
              <span className="w-40 shrink-0">Lương đóng BH:</span>
              <span>{formatVND(payroll.contractSalary)}</span>
            </div>
            <div className="flex text-left">
              <span className="w-40 shrink-0">Ngày công chuẩn:</span>
              <span>{payroll.standardWorkDays || 26}</span>
            </div>
            <div className="flex text-left">
              <span className="w-40 shrink-0">Ngày công thực tế:</span>
              <span>{payroll.realWorkDays}</span>
            </div>
            <div className="flex text-left">
              <span className="w-40 shrink-0">Nghỉ không phép:</span>
              <span>
                {(payroll.standardWorkDays || 26) -
                  (payroll.realWorkDays + (payroll.paidLeaveDays || 0))}
              </span>
            </div>
            <div className="flex text-left">
              <span className="w-40 shrink-0">Ngày nghỉ hưởng lương:</span>
              <span>{payroll.paidLeaveDays || 0}</span>
            </div>
            <div className="flex text-left">
              <span className="w-40 shrink-0">Giờ OT:</span>
              <span>
                {(payroll.otNormalHours || 0) +
                  (payroll.otWeekendHours || 0) +
                  (payroll.otHolidayHours || 0)}{" "}
                giờ
              </span>
            </div>
          </div>

          {/* INCOME SECTION */}
          <div className="border border-black">
            <div className="flex border-b border-black text-center uppercase text-[11px] font-bold bg-white">
              <div className="w-10 border-r border-black py-1">STT</div>
              <div className="flex-1 border-r border-black py-1 px-2">
                I. CÁC KHOẢN THU NHẬP
              </div>
              <div className="w-40 py-1 px-2">Số tiền</div>
            </div>
            <div className="flex border-b border-black">
              <div className="w-10 border-r border-black py-1 text-center">
                1
              </div>
              <div className="flex-1 border-r border-black py-1 px-2 text-left">
                Lương theo thời gian
              </div>
              <div className="w-40 py-1 px-2 text-left tabular-nums">
                {formatVND(payroll.baseSalaryPay)}
              </div>
            </div>
            <div className="flex border-b border-black">
              <div className="w-10 border-r border-black py-1 text-center">
                2
              </div>
              <div className="flex-1 border-r border-black py-1 px-2 text-left">
                Phụ cấp thâm niên
              </div>
              <div className="w-40 py-1 px-2 text-left tabular-nums">
                {formatVND(payroll.seniorityAllowance)}
              </div>
            </div>
            <div className="flex border-b border-black">
              <div className="w-10 border-r border-black py-1 text-center">
                3
              </div>
              <div className="flex-1 border-r border-black py-1 px-2 text-left">
                Lương làm ngoài giờ (OT)
              </div>
              <div className="w-40 py-1 px-2 text-left tabular-nums">
                {formatVND(payroll.otPay)}
              </div>
            </div>
            <div className="flex border-b border-black">
              <div className="w-10 border-r border-black py-1 text-center">
                4
              </div>
              <div className="flex-1 border-r border-black py-1 px-2 text-left">
                Phụ cấp ăn trưa
              </div>
              <div className="w-40 py-1 px-2 text-left tabular-nums">
                {formatVND(payroll.mealAllowance)}
              </div>
            </div>
            <div className="flex border-b border-black">
              <div className="w-10 border-r border-black py-1 text-center">
                5
              </div>
              <div className="flex-1 border-r border-black py-1 px-2 text-left">
                Tiền thưởng / Các khoản khác
              </div>
              <div className="w-40 py-1 px-2 text-left tabular-nums">
                {formatVND(payroll.bonus || 0)}
              </div>
            </div>
            <div className="flex bg-white py-2 uppercase text-sm font-bold border-b border-black">
              <div className="w-10 border-r border-black"></div>
              <div className="flex-1 px-2 border-r border-black">
                TỔNG THU NHẬP (GROSS)
              </div>
              <div className="w-40 px-2 text-left tabular-nums">
                {formatVND(payroll.grossIncome)}
              </div>
            </div>
          </div>

          {/* DEDUCTION SECTION */}
          <div className="border border-black">
            <div className="flex border-b border-black text-center uppercase text-[11px] font-bold bg-white">
              <div className="w-10 border-r border-black py-1">STT</div>
              <div className="flex-1 border-r border-black py-1 px-2">
                II. CÁC KHOẢN KHẤU TRỪ
              </div>
              <div className="w-40 py-1 px-2">Số tiền</div>
            </div>
            <div className="flex border-b border-black">
              <div className="w-10 border-r border-black py-1 text-center">
                1
              </div>
              <div className="flex-1 border-r border-black py-1 px-2 text-left">
                Bảo hiểm xã hội (8%)
              </div>
              <div className="w-40 py-1 px-2 text-left tabular-nums">
                {formatVND(payroll.bhxhNhanVien)}
              </div>
            </div>
            <div className="flex border-b border-black">
              <div className="w-10 border-r border-black py-1 text-center">
                2
              </div>
              <div className="flex-1 border-r border-black py-1 px-2 text-left">
                Bảo hiểm y tế (1.5%)
              </div>
              <div className="w-40 py-1 px-2 text-left tabular-nums">
                {formatVND(payroll.bhytNhanVien)}
              </div>
            </div>
            <div className="flex border-b border-black">
              <div className="w-10 border-r border-black py-1 text-center">
                3
              </div>
              <div className="flex-1 border-r border-black py-1 px-2 text-left">
                Bảo hiểm thất nghiệp (1%)
              </div>
              <div className="w-40 py-1 px-2 text-left tabular-nums">
                {formatVND(payroll.bhtnNhanVien)}
              </div>
            </div>
            <div className="flex border-b border-black">
              <div className="w-10 border-r border-black py-1 text-center">
                4
              </div>
              <div className="flex-1 border-r border-black py-1 px-2 text-left">
                Thuế thu nhập cá nhân
              </div>
              <div className="w-40 py-1 px-2 text-left tabular-nums">
                {(payroll.taxAmount || 0) > 0 ? "-" : ""}
                {formatVND(payroll.taxAmount || 0)}
              </div>
            </div>

            <div className="flex border-b border-black">
              <div className="w-10 border-r border-black py-1 text-center">
                4.1
              </div>
              <div className="flex-1 border-r border-black py-1 px-2 text-left">
                Miễn thuế TNCN
              </div>
              <div className="w-40 py-1 px-2 text-left tabular-nums">
                {formatVND(
                  (payroll.otPremiumPay || 0) + (payroll.mealAllowance || 0),
                )}
              </div>
            </div>
            <div className="flex border-b border-black">
              <div className="w-10 border-r border-black py-1 text-center">
                4.2
              </div>
              <div className="flex-1 border-r border-black py-1 px-2 text-left">
                Giảm trừ bản thân
              </div>
              <div className="w-40 py-1 px-2 text-left tabular-nums">
                {formatVND(payroll.personalDeduction)}
              </div>
            </div>
            <div className="flex border-b border-black">
              <div className="w-10 border-r border-black py-1 text-center">
                4.3
              </div>
              <div className="flex-1 border-r border-black py-1 px-2 text-left">
                Giảm trừ người phụ thuộc ({payroll.dependentCount} NTT)
              </div>
              <div className="w-40 py-1 px-2 text-left tabular-nums">
                {formatVND(payroll.dependentDeduction)}
              </div>
            </div>
            <div className="flex border-b border-black">
              <div className="w-10 border-r border-black py-1 text-center">
                4.4
              </div>
              <div className="flex-1 border-r border-black py-1 px-2 text-left">
                Tổng trích bảo hiểm (10.5%)
              </div>
              <div className="w-40 py-1 px-2 text-left tabular-nums">
                {formatVND(payroll.totalInsurance)}
              </div>
            </div>

            <div className="flex border-b border-black">
              <div className="w-10 border-r border-black py-1 text-center">
                5
              </div>
              <div className="flex-1 border-r border-black py-1 px-2 text-left">
                Tiền phạt (Kỷ luật)
              </div>
              <div className="w-40 py-1 px-2 text-left tabular-nums">
                {(payroll.penalty || 0) > 0 ? "-" : ""}
                {formatVND(payroll.penalty || 0)}
              </div>
            </div>

            <div className="flex py-2 uppercase text-sm font-bold">
              <div className="w-10 border-r border-black"></div>
              <div className="flex-1 px-2 border-r border-black">
                TỔNG CÁC KHOẢN KHẤU TRỪ
              </div>
              <div className="w-40 px-2 text-left tabular-nums">
                {formatVND(
                  payroll.totalInsurance +
                    (payroll.taxAmount || 0) +
                    (payroll.penalty || 0),
                )}
              </div>
            </div>
          </div>

          {/* NET PAY SECTION */}
          <div className="border border-black p-6 space-y-4">
            <div className="flex items-baseline gap-4 justify-start">
              <h3 className="text-xl uppercase">TỔNG SỐ TIỀN THỰC NHẬN:</h3>
              <span className="text-2xl tabular-nums">
                {formatVND(payroll.netPay)}
              </span>
            </div>
            <div className="flex gap-4 justify-start pt-2 border-t border-black">
              <span>Bằng chữ:</span>
              <span className="capitalize">
                {toVietnameseWords(payroll.netPay)}
              </span>
            </div>
          </div>

          {/* Footer Signatures */}
          <div className="grid grid-cols-2 pt-6 text-left uppercase text-[11px]">
            <div className="space-y-16">
              <p>Người lập phiếu</p>
              <div className="h-16" />
              <p className="normal-case">
                {new Date().toLocaleDateString("vi-VN")}
              </p>
            </div>
            <div className="space-y-16">
              <p>Nhân viên ký nhận</p>
              <div className="h-16" />
              <p className="normal-case border-t border-black pt-1">
                (Ký và ghi rõ họ tên)
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
