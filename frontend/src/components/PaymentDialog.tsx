import * as React from "react"
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog"
import { Button } from "./ui/button"
import { DollarSign, CreditCard, Banknote, HelpCircle } from "lucide-react"

interface PaymentDialogProps {
  onPay: (method: string) => void
  disabled: boolean
}

export default function PaymentDialog({ onPay, disabled }: PaymentDialogProps) {
  const [open, setOpen] = React.useState(false)

  const handlePay = (method: string) => {
    onPay(method)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button 
          disabled={disabled}
          className="gap-2 h-8 bg-green-600 hover:bg-green-700 text-white font-bold shadow-md animate-pulse"
        >
          <DollarSign className="w-4 h-4" /> Thanh toán
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md p-6 bg-white rounded-2xl shadow-2xl border-none">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
            <DollarSign className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Xác nhận thanh toán lương</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Vui lòng chọn hình thức thanh toán để hệ thống tự động sinh <strong>Chứng từ (Phiếu chi/UNC)</strong> và <strong>Bút toán kế toán</strong> tương ứng.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <button 
              onClick={() => handlePay("PAYMENT")}
              className="flex flex-col items-center justify-center p-6 border-2 border-slate-100 rounded-2xl hover:border-amber-400 hover:bg-amber-50 transition-all group"
            >
              <Banknote className="w-10 h-10 text-amber-500 mb-3 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-slate-700">Tiền mặt</span>
              <span className="text-[10px] text-muted-foreground uppercase opacity-70">Sổ quỹ - 111</span>
            </button>

            <button 
              onClick={() => handlePay("BANK")}
              className="flex flex-col items-center justify-center p-6 border-2 border-slate-100 rounded-2xl hover:border-blue-400 hover:bg-blue-50 transition-all group"
            >
              <CreditCard className="w-10 h-10 text-blue-500 mb-3 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-slate-700">Chuyển khoản</span>
              <span className="text-[10px] text-muted-foreground uppercase opacity-70">Ngân hàng - 112</span>
            </button>
          </div>

          <div className="pt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground italic">
            <HelpCircle className="w-3 h-3" />
            Lưu ý: Thao tác này sẽ khóa vĩnh viễn bảng lương tháng này.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
