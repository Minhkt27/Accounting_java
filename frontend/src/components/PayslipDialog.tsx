import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog"
import { Button } from "./ui/button"
import { FileText } from "lucide-react"

import type { Payroll } from "../pages/PayrollPage"

interface PayslipDialogProps {
  payroll: Payroll
}

export default function PayslipDialog({ payroll }: PayslipDialogProps) {
  const formatVND = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0)
  }


  // Hàm chuyển số thành chữ (Tiếng Việt)
  const toVietnameseWords = (amount: number): string => {
    if (amount <= 0) return "Không đồng"
    const units = ["", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"]
    
    const readThreeDigits = (n: number, showZero: boolean): string => {
      let res = ""
      const h = Math.floor(n / 100)
      const t = Math.floor((n % 100) / 10)
      const u = n % 10
      
      if (h > 0) {
        res += units[h] + " trăm "
      } else if (showZero) {
        res += "không trăm "
      }
      
      if (t > 1) {
        res += units[t] + " mươi "
        if (u === 1) res += "mốt "
        else if (u === 5) res += "lăm "
        else if (u > 0) res += units[u] + " "
      } else if (t === 1) {
        res += "mười "
        if (u === 5) res += "lăm "
        else if (u > 0) res += units[u] + " "
      } else if (u > 0) {
        if (h > 0 || showZero) res += "lẻ "
        res += units[u] + " "
      }
      return res
    }

    const groups = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"]
    let res = ""
    let temp = Math.floor(amount)
    let groupIdx = 0
    
    while (temp > 0) {
      const three = temp % 1000
      if (three > 0) {
        res = readThreeDigits(three, temp > 999) + groups[groupIdx] + " " + res
      }
      temp = Math.floor(temp / 1000)
      groupIdx++
    }
    
    const final = res.trim()
    if (!final) return "Không đồng"
    return final.charAt(0).toUpperCase() + final.slice(1) + " đồng"
  }

  return (
    <Dialog>
      <DialogTrigger>
        <Button variant="outline" className="h-7 text-[10px] font-bold gap-1 px-3 border-blue-200 text-blue-600 hover:bg-blue-50 rounded-full shadow-sm">
          <FileText className="w-3 h-3" /> Phiếu lương
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl bg-white text-black p-0 payslip-modal print:p-0 print:m-0 print:shadow-none sm:rounded-[0.5rem] border-none shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        <div id="payslip-content" className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-hide text-[13px] leading-relaxed">
          {/* Header Section */}
          <div className="flex flex-col items-start text-left space-y-1 mb-6">
            <h1 className="text-sm uppercase w-full text-left">Công ty TNHH thiết bị kỹ thuật tin học Phúc Anh</h1>
            <p className="text-[12px] w-full text-left">Số 43, Tổ 4, Xã Sóc Sơn, TP Hà Nội, Việt Nam</p>
            <p className="text-[12px] w-full text-left">Mã số thuế: 0110465135</p>
            
            <div className="py-4 space-y-1 text-left w-full">
                <h2 className="text-xl uppercase tracking-tight">PHIẾU LƯƠNG NHÂN VIÊN</h2>
                <p className="text-sm">Kỳ lương: Tháng {payroll.month} / {payroll.year}</p>
            </div>
          </div>

          {/* Employee & Work Info Grid */}
          <div className="grid grid-cols-2 gap-x-20 gap-y-1 border-t border-b py-4">
             <div className="flex">
                <span className="mr-2">Họ tên nhân viên:</span>
                <span className="uppercase">{payroll.employee?.fullName}</span>
             </div>
             <div className="flex text-left">
                <span className="mr-2">Ngày sinh:</span>
                <span>{payroll.employee?.dob || '---'}</span>
             </div>
             <div className="flex text-left">
                <span className="mr-2">SĐT:</span>
                <span>{payroll.employee?.phone || '---'}</span>
             </div>
             <div className="flex text-left">
                <span className="mr-2">Mã nhân viên:</span>
                <span>{payroll.employee?.id}</span>
             </div>
             <div className="flex text-left">
                <span className="mr-2">Chức danh/Phòng ban:</span>
                <span>{payroll.employee?.department || 'Văn phòng'}</span>
             </div>
             <div className="flex text-left">
                <span className="italic mr-2">Lương đóng Bảo hiểm:</span>
                <span>{formatVND(payroll.contractSalary)}</span>
             </div>
             <div className="flex text-left">
                <span className="mr-2">Ngày công chuẩn:</span>
                <span>{payroll.standardWorkDays || 26}</span>
             </div>
             <div className="flex text-left">
                <span className="mr-2">Ngày công đi làm thực tế:</span>
                <span>{payroll.realWorkDays}</span>
             </div>
             <div className="flex text-left">
                <span className="mr-2">Ngày nghỉ không tính phép:</span>
                <span>{(payroll.standardWorkDays || 26) - (payroll.realWorkDays + (payroll.paidLeaveDays || 0))}</span>
             </div>
             <div className="flex text-left">
                <span className="mr-2">Ngày nghỉ hưởng lương:</span>
                <span>{payroll.paidLeaveDays || 0}</span>
             </div>
             <div className="flex text-left">
                <span className="mr-2">Giờ làm ngoài giờ (OT):</span>
                <span>{(payroll.otNormalHours || 0) + (payroll.otWeekendHours || 0) + (payroll.otHolidayHours || 0)} giờ</span>
             </div>
          </div>

          {/* Main Calculation Tables */}
          <div className="grid grid-cols-2 gap-0 border border-black">
             {/* LEFT COLUMN: INCOME */}
             <div className="border-r border-black flex flex-col">
                {/* Header */}
                <div className="flex border-b border-black text-left bg-slate-50">
                   <div className="w-10 border-r border-black py-2 text-center">STT</div>
                   <div className="flex-1 border-r border-black py-2 px-2">Các khoản thu nhập</div>
                   <div className="w-32 py-2 text-right pr-2">Số tiền</div>
                </div>
                {/* Row 1 */}
                <div className="flex border-b border-black/10">
                   <div className="w-10 border-r border-black py-2 text-center">1</div>
                   <div className="flex-1 border-r border-black py-2 px-2 text-left">Lương theo thời gian</div>
                   <div className="w-32 py-2 text-right pr-2 tabular-nums">{formatVND(payroll.baseSalaryPay)}</div>
                </div>
                {/* Row 2 */}
                <div className="flex border-b border-black/10">
                   <div className="w-10 border-r border-black py-2 text-center">2</div>
                   <div className="flex-1 border-r border-black py-2 px-2 text-left">Phụ cấp thâm niên</div>
                   <div className="w-32 py-2 text-right pr-2 tabular-nums">{formatVND(payroll.seniorityAllowance)}</div>
                </div>
                {/* Row 3 - OT with sub-rows */}
                <div className="flex border-b border-black/10">
                   <div className="w-10 border-r border-black py-2 text-center">3</div>
                   <div className="flex-1 border-r border-black py-2 px-2 text-left">
                      <div>Tổng tiền làm ngoài giờ</div>
                      <div className="px-2 text-[11px] space-y-1 italic mt-1">
                         <div className="flex justify-between"><span>+ Ngày thường (150%):</span> <span>{payroll.otNormalHours || 0}h</span></div>
                         <div className="flex justify-between"><span>+ Nghỉ tuần (200%):</span> <span>{payroll.otWeekendHours || 0}h</span></div>
                         <div className="flex justify-between"><span>+ Lễ, Tết (300%):</span> <span>{payroll.otHolidayHours || 0}h</span></div>
                      </div>
                   </div>
                   <div className="w-32 py-2 text-right pr-2 tabular-nums">
                      <div>{formatVND(payroll.otPay)}</div>
                      <div className="text-[11px] space-y-1 mt-1">
                         <div>{formatVND(payroll.otNormalPay)}</div>
                         <div>{formatVND(payroll.otWeekendPay)}</div>
                         <div>{formatVND(payroll.otHolidayPay)}</div>
                      </div>
                   </div>
                </div>
                {/* Row 4 */}
                <div className="flex border-b border-black/10">
                   <div className="w-10 border-r border-black py-2 text-center">4</div>
                   <div className="flex-1 border-r border-black py-2 px-2 text-left">Phụ cấp ăn trưa ({payroll.realWorkDays} ngày)</div>
                   <div className="w-32 py-2 text-right pr-2 tabular-nums">{formatVND(payroll.mealAllowance)}</div>
                </div>
                {/* Row 5 */}
                <div className="flex border-b border-black/10">
                   <div className="w-10 border-r border-black py-2 text-center">5</div>
                   <div className="flex-1 border-r border-black py-2 px-2 text-left">Tiền thưởng (Khen thưởng)</div>
                   <div className="w-32 py-2 text-right pr-2 tabular-nums">{formatVND(payroll.bonus || 0)}</div>
                </div>
                {/* Row 6 */}
                <div className="flex border-b border-black/10">
                   <div className="w-10 border-r border-black py-2 text-center">6</div>
                   <div className="flex-1 border-r border-black py-2 px-2 text-left">Tiền phạt (Kỷ luật)</div>
                   <div className="w-32 py-2 text-right pr-2 tabular-nums">{(payroll.penalty || 0) > 0 ? '-' : ''}{formatVND(payroll.penalty || 0)}</div>
                </div>
                {/* GROSS Total */}
                <div className="flex border-t border-black bg-slate-100 py-3 uppercase mt-auto">
                   <div className="w-10 border-r border-black/30"></div>
                   <div className="flex-1 px-4 leading-tight">TỔNG THU NHẬP (GROSS)</div>
                   <div className="w-32 text-right pr-4 tabular-nums">{formatVND(payroll.grossIncome)}</div>
                </div>
             </div>

             {/* RIGHT COLUMN: DEDUCTIONS */}
             <div className="flex flex-col">
                {/* Header */}
                <div className="flex border-b border-black text-left bg-slate-50">
                   <div className="w-10 border-r border-black py-2 text-center">STT</div>
                   <div className="flex-1 border-r border-black py-2 px-2">Các khoản khấu trừ vào Lương NLĐ</div>
                   <div className="w-32 py-2 text-right pr-2">Số tiền</div>
                </div>
                {/* Row 1 */}
                <div className="flex border-b border-black/10">
                   <div className="w-10 border-r border-black py-2 text-center">1</div>
                   <div className="flex-1 border-r border-black py-2 px-2 text-left">Bảo hiểm xã hội (8%)</div>
                   <div className="w-32 py-2 text-right pr-2 tabular-nums">{formatVND(payroll.bhxhNhanVien)}</div>
                </div>
                {/* Row 2 */}
                <div className="flex border-b border-black/10">
                   <div className="w-10 border-r border-black py-2 text-center">2</div>
                   <div className="flex-1 border-r border-black py-2 px-2 text-left">Bảo hiểm y tế (1.5%)</div>
                   <div className="w-32 py-2 text-right pr-2 tabular-nums">{formatVND(payroll.bhytNhanVien)}</div>
                </div>
                {/* Row 3 */}
                <div className="flex border-b border-black/10">
                   <div className="w-10 border-r border-black py-2 text-center">3</div>
                   <div className="flex-1 border-r border-black py-2 px-2 text-left">Bảo hiểm thất nghiệp (1%)</div>
                   <div className="w-32 py-2 text-right pr-2 tabular-nums">{formatVND(payroll.bhtnNhanVien)}</div>
                </div>
                {/* Row 4 - Tổng BH */}
                <div className="flex border-b border-black/10 bg-black/5">
                   <div className="w-10 border-r border-black py-2 text-center">4</div>
                   <div className="flex-1 border-r border-black py-2 px-2 text-left flex justify-between">
                      <span>TỔNG TRÍCH BẢO HIỂM</span>
                      <span>(10.5%)</span>
                   </div>
                   <div className="w-32 py-2 text-right pr-2 tabular-nums">{formatVND(payroll.totalInsurance)}</div>
                </div>
                {/* Row 4.1 - Thuế TNCN with sub-rows */}
                <div className="flex border-b border-black/10">
                   <div className="w-10 border-r border-black py-2 text-center">4.1</div>
                   <div className="flex-1 border-r border-black py-2 px-2 text-left">
                      <div>Thuế thu nhập cá nhân</div>
                      <div className="px-2 text-[11px] italic mt-1 space-y-1">
                         <div>Trong đó miễn thuế TNCN</div>
                         <div>Giảm trừ bản thân</div>
                         <div>Giảm trừ người phụ thuộc ({payroll.dependentCount} NTT)</div>
                         <div>Giảm trừ Bảo hiểm (10.5%)</div>
                      </div>
                   </div>
                   <div className="w-32 py-2 text-right pr-2 tabular-nums">
                      <div>{(payroll.taxAmount || 0) > 0 ? '-' : ''}{formatVND(payroll.taxAmount || 0)}</div>
                      <div className="text-[10px] mt-1 space-y-1">
                         <div>{formatVND((payroll.otPremiumPay || 0) + (payroll.mealAllowance || 0))}</div>
                         <div>{formatVND(payroll.personalDeduction)}</div>
                         <div>{formatVND(payroll.dependentDeduction)}</div>
                         <div>{formatVND(payroll.totalInsurance)}</div>
                      </div>
                   </div>
                </div>
                {/* Tax summary */}
                <div className="flex flex-col border-t border-black p-2 bg-slate-50/50 space-y-1 mt-auto">
                    <div className="flex justify-between items-center px-2">
                        <span className="text-[11px] uppercase">Thu nhập chịu thuế:</span>
                        <span>{formatVND(payroll.taxableIncomeBase)}</span>
                    </div>
                    <div className="flex justify-between items-center px-2 border-t border-black/5 pt-1">
                        <span className="text-[11px] uppercase">Thu nhập tính thuế:</span>
                        <span className="underline">{formatVND(payroll.taxableIncome)}</span>
                    </div>
                </div>
             </div>
          </div>

          {/* NET PAY SECTION */}
          <div className="border-2 border-black p-6 flex flex-col items-start justify-start space-y-4">
             <div className="flex items-baseline gap-4 w-full justify-start">
                 <h3 className="text-2xl">TỔNG SỐ TIỀN LƯƠNG THỰC NHẬN:</h3>
                 <span className="text-2xl tabular-nums">{formatVND(payroll.netPay)}</span>
             </div>
             <div className="flex gap-4 w-full justify-start pt-2 border-t border-black/20 italic">
                <span>Bằng chữ:</span>
                <span className="capitalize">{toVietnameseWords(payroll.netPay)}</span>
             </div>
          </div>

          {/* Footer Signatures */}
          <div className="grid grid-cols-2 pt-10 text-left uppercase tracking-widest text-[11px]">
             <div className="space-y-20">
                <p>Người lập phiếu</p>
                <div className="h-20" />
                <p className="normal-case">{new Date().toLocaleDateString('vi-VN')}</p>
             </div>
             <div className="space-y-20">
                <p>Nhân viên ký nhận</p>
                <div className="h-20" />
                <p className="normal-case italic px-10 border-t border-black/40 pt-2">(Ký và ghi rõ họ tên)</p>
             </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
