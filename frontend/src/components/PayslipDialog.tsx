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
      <DialogContent className="max-w-2xl bg-white text-black p-0 payslip-modal print:p-0 print:m-0 print:shadow-none sm:rounded-[1rem] border-none shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        <div id="payslip-content" className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
          <div className="flex justify-between items-start border-b-4 border-primary pb-4">
            <div>
              <h1 className="text-lg font-black text-slate-800 uppercase leading-none text-primary">PHUC ANH COMPANY</h1>
              <p className="text-[10px] text-muted-foreground mt-1 font-bold italic underline opacity-80">Số 43, Tổ 4, Xã Sóc Sơn, TP Hà Nội, Việt Nam</p>
              <p className="text-[10px] text-muted-foreground font-bold mt-1 opacity-80">Mã số thuế: 0110465135</p>
              <hr className="my-2 border-primary/20 w-32" />
              <h2 className="text-lg font-black text-primary uppercase">Phiếu Lương Nhân Viên</h2>
              <p className="text-sm font-black text-slate-500">Kỳ lương: Tháng {payroll.month}/{payroll.year}</p>
            </div>
            <div className="text-right border-l pl-6 border-slate-100 min-w-[200px]">
              <p className="text-[10px] uppercase font-black text-slate-400 mb-1">Thông tin nhân viên</p>
              <p className="font-black text-xl text-slate-900 tracking-tight">{payroll.employee?.fullName}</p>
              <p className="text-sm font-bold text-primary">Mã NV: {payroll.employee?.id}</p>
              <div className="mt-2 text-right text-[11px] text-slate-500 space-y-0.5 font-medium">
                <p>Ngày sinh: {payroll.employee?.dob || '---'}</p>
                <p>SĐT: {payroll.employee?.phone || '---'}</p>
                <p>Email: {payroll.employee?.email || '---'}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 text-sm">
            <div className="space-y-3 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              <h3 className="font-bold border-b pb-1 text-primary/80 uppercase text-[10px]">1. THÔNG TIN CÔNG TÁC</h3>
              <div className="flex justify-between"><span>Lương hợp đồng:</span> <span className="font-bold">{formatVND(payroll.contractSalary)}</span></div>
              <div className="flex justify-between text-xs text-slate-500"><span>Số ngày công thực tế:</span> <span className="font-bold">{payroll.realWorkDays} ngày</span></div>
              <div className="flex justify-between text-xs text-green-600"><span>Số ngày nghỉ hưởng lương:</span> <span className="font-bold">+{payroll.paidLeaveDays || 0} ngày</span></div>
              <div className="mt-2 pt-2 border-t border-dashed">
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Giờ làm thêm (OT)</p>
                <div className="flex justify-between text-[11px]"><span>Ngày thường (150%):</span> <span className="font-medium">{formatVND(payroll.otNormalPay)}</span></div>
                <div className="flex justify-between text-[11px]"><span>Nghỉ tuần (200%):</span> <span className="font-medium">{formatVND(payroll.otWeekendPay)}</span></div>
                <div className="flex justify-between text-[11px]"><span>Lễ, Tết (300%):</span> <span className="font-medium">{formatVND(payroll.otHolidayPay)}</span></div>
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="font-bold border-b pb-1 text-primary/80 uppercase text-[10px]">2. CÁC KHOẢN THU NHẬP</h3>
              <div className="flex justify-between"><span>Lương theo thời gian:</span> <span className="font-bold">{formatVND(payroll.baseSalaryPay)}</span></div>
              <div className="flex justify-between"><span>Phụ cấp ăn trưa:</span> <span className="font-bold text-blue-600">{formatVND(payroll.mealAllowance)}</span></div>
              <div className="flex justify-between text-xs text-slate-500"><span>Phụ cấp chức vụ:</span> <span>{formatVND(payroll.positionAllowance)}</span></div>
              <div className="flex justify-between text-xs text-slate-500"><span>Phụ cấp thâm niên:</span> <span>{formatVND(payroll.seniorityAllowance)}</span></div>
              <div className="flex justify-between"><span>Làm thêm giờ (OT):</span> <span className="font-bold">{formatVND(payroll.otPay)}</span></div>
              <div className="text-[10px] text-green-600 bg-green-50/50 p-1 rounded italic flex justify-between">
                <span>- Trong đó miễn thuế TNCN:</span>
                <span className="font-bold">{formatVND(payroll.otPremiumPay + payroll.mealAllowance)}</span>
              </div>
              <p className="text-[8px] text-slate-400 italic mt-0.5">(Gồm Phụ cấp ăn ca và Phần vượt trội OT)</p>
              <div className="flex justify-between bg-primary/5 p-2 px-3 font-black border-t text-base mt-2 rounded-lg">
                <span className="uppercase">TỔNG THU NHẬP (GROSS):</span> 
                <span>{formatVND(payroll.grossIncome)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 text-sm">
            <div className="space-y-3">
              <h3 className="font-bold border-b pb-1 text-red-600/80 uppercase text-[10px]">3. CÁC KHOẢN KHẤU TRỪ (NLĐ)</h3>
              <div className="flex justify-between text-[11px]"><span>BHXH (8%):</span> <span className="text-red-600">-{formatVND(payroll.bhxhNhanVien)}</span></div>
              <div className="flex justify-between text-[11px]"><span>BHYT (1.5%):</span> <span className="text-red-600">-{formatVND(payroll.bhytNhanVien)}</span></div>
              <div className="flex justify-between text-[11px]"><span>BHTN (1%):</span> <span className="text-red-600">-{formatVND(payroll.bhtnNhanVien)}</span></div>
              <div className="flex justify-between font-bold text-red-500 border-t pt-1"><span>TỔNG TRÍCH BH (10.5%):</span> <span className="tabular-nums">-{formatVND(payroll.totalInsurance)}</span></div>
              <div className="flex justify-between text-xs text-slate-500"><span>Thu nhập chịu thuế:</span> <span className="font-bold">{formatVND(payroll.taxableIncomeBase)}</span></div>
              <div className="flex justify-between text-xs text-slate-500"><span>Giảm trừ bản thân:</span> <span>-{formatVND(payroll.personalDeduction)}</span></div>
              <div className="flex justify-between text-xs text-slate-500"><span>Giảm trừ gia cảnh ({payroll.dependentCount} NTT):</span> <span>-{formatVND(payroll.dependentDeduction)}</span></div>
              <div className="flex justify-between text-xs text-slate-500"><span>Giảm trừ bảo hiểm (10.5%):</span> <span>-{formatVND(payroll.totalInsurance)}</span></div>
              <div className="flex justify-between text-xs text-blue-600 font-bold border-b border-dotted pb-1 mb-1"><span>Thu nhập tính thuế:</span> <span>{formatVND(payroll.taxableIncome)}</span></div>
              <div className="flex justify-between group relative cursor-help">
                <span className="underline decoration-dotted decoration-red-300 font-bold">THUẾ TNCN:</span>
                <span className="font-bold text-red-500">-{formatVND(payroll.taxAmount)}</span>
                <div className="absolute bottom-full left-0 hidden group-hover:block bg-slate-800 text-white text-[10px] p-2 rounded shadow-lg z-50 w-48 mb-1">
                  TN tính thuế = Gross - Ăn trưa - BH - Giảm trừ - OT miễn thuế
                </div>
              </div>
            </div>
            <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-200 space-y-2 flex flex-col justify-center text-center shadow-inner">
              <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest leading-none mb-1">THỰC LĨNH CUỐI CÙNG (NET)</p>
              <p className="text-3xl font-black text-emerald-600 tabular-nums leading-none mb-2">{formatVND(payroll.netPay)}</p>
              <div className="pt-2 border-t border-emerald-100">
                <p className="text-[9px] font-bold text-emerald-800 uppercase opacity-60">Bằng chữ</p>
                <p className="text-[11px] italic text-emerald-800 font-bold">{toVietnameseWords(payroll.netPay)}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-5 rounded-2xl text-[10px] text-white">
            <p className="font-bold text-slate-400 uppercase mb-3 tracking-widest border-b border-slate-800 pb-2">Thông tin tham khảo: Chi phí doanh nghiệp đóng (23.5%)</p>
            <div className="grid grid-cols-4 gap-4">
              <div className="flex flex-col"><span>BHXH (17.5%):</span> <span className="font-bold text-sm text-slate-200">{formatVND(payroll.bhxhCongTy)}</span></div>
              <div className="flex flex-col"><span>BHYT (3%):</span> <span className="font-bold text-sm text-slate-200">{formatVND(payroll.bhytCongTy)}</span></div>
              <div className="flex flex-col"><span>BHTN (1%):</span> <span className="font-bold text-sm text-slate-200">{formatVND(payroll.bhtnCongTy)}</span></div>
              <div className="flex flex-col"><span>KPCĐ (2%):</span> <span className="font-bold text-sm text-slate-200">{formatVND(payroll.kpcdCongTy)}</span></div>
            </div>
            <div className="mt-3 font-bold text-blue-400 flex justify-end text-xs pt-2 border-t border-slate-800 uppercase">
                Tổng chi phí BH & KPCĐ trích nộp: {formatVND(payroll.totalEmployerInsurance)}
            </div>
          </div>

          <div className="flex justify-between items-end pt-8 italic text-[10px] text-muted-foreground uppercase font-bold">
            <div>
                <p>Mã chứng từ: PAY-{payroll.id}</p>
                <p>Ngày in: {new Date().toLocaleDateString()}</p>
            </div>
            <div className="text-center w-32 border-t-2 border-slate-200 pt-2">
              <p>Nhân viên ký nhận</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
