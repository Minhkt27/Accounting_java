import * as React from "react";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import {
  DollarSign,
  CreditCard,
  Banknote,
  HelpCircle,
  ShieldCheck,
  Receipt,
} from "lucide-react";

interface PaymentDialogProps {
  onPay: (method: string) => void;
  disabled: boolean;
  paymentType: "SALARY" | "INSURANCE" | "TAX";
}

const CONFIG = {
  SALARY: {
    icon: DollarSign,
    title: "Thanh toán ",
    description:
      "Chi trả lương thực lĩnh (NET) cho toàn bộ nhân viên. Hệ thống sẽ sinh Phiếu chi/UNC và hạch toán Nợ 334 / Có 111 hoặc 112.",
    color: "green",
    bgClass: "bg-green-600 hover:bg-green-700",
    iconBg: "bg-green-100 text-green-600",
  },
  INSURANCE: {
    icon: ShieldCheck,
    title: "Nộp Bảo hiểm",
    description:
      "Nộp toàn bộ BH (NLĐ 10.5% + DN 23.5%) cho cơ quan BHXH. Hạch toán Nợ 338 / Có 111 hoặc 112.",
    color: "blue",
    bgClass: "bg-blue-600 hover:bg-blue-700",
    iconBg: "bg-blue-100 text-blue-600",
  },
  TAX: {
    icon: Receipt,
    title: "Nộp Thuế TNCN",
    description:
      "Nộp thuế Thu nhập cá nhân cho cơ quan Thuế. Hạch toán Nợ 3335 / Có 111 hoặc 112.",
    color: "amber",
    bgClass: "bg-amber-600 hover:bg-amber-700",
    iconBg: "bg-amber-100 text-amber-600",
  },
};

export default function PaymentDialog({
  onPay,
  disabled,
  paymentType,
}: PaymentDialogProps) {
  const [open, setOpen] = React.useState(false);
  const cfg = CONFIG[paymentType];
  const Icon = cfg.icon;

  const handlePay = (method: string) => {
    onPay(method);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button
          disabled={disabled}
          className={`h-9 text-white font-bold shadow-md ${cfg.bgClass}`}
        >
          {cfg.title}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md p-6 bg-white rounded-2xl shadow-2xl border-none">
        <div className="text-center space-y-4">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2 ${cfg.iconBg}`}
          >
            <Icon className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">
            {cfg.title}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {cfg.description}
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <button
              onClick={() => handlePay("PAYMENT")}
              className="flex flex-col items-center justify-center p-6 border-2 border-slate-100 rounded-2xl hover:border-amber-400 hover:bg-amber-50 transition-all group"
            >
              <Banknote className="w-10 h-10 text-amber-500 mb-3 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-slate-700">Tiền mặt</span>
              <span className="text-[10px] text-muted-foreground uppercase opacity-70">
                Sổ quỹ - 111
              </span>
            </button>

            <button
              onClick={() => handlePay("BANK")}
              className="flex flex-col items-center justify-center p-6 border-2 border-slate-100 rounded-2xl hover:border-blue-400 hover:bg-blue-50 transition-all group"
            >
              <CreditCard className="w-10 h-10 text-blue-500 mb-3 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-slate-700">Chuyển khoản</span>
              <span className="text-[10px] text-muted-foreground uppercase opacity-70">
                Ngân hàng - 112
              </span>
            </button>
          </div>

          <div className="pt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground italic">
            <HelpCircle className="w-3 h-3" />
            Thao tác này sẽ tạo chứng từ và hạch toán tự động.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
