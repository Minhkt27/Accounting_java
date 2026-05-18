import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import logo from "../assets/logo.jpg";

export default function DashboardPage() {
  const mainButtons = [
    { label: "Quản lý nhân viên", color: "bg-blue-600", to: "/employees" },
    { label: "Bảng lương", color: "bg-emerald-700", to: "/payroll" },
    { label: "Sổ sách", color: "bg-emerald-800", to: "/ledger" },
    { label: "Báo cáo", color: "bg-amber-400", to: "/reports" },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] relative">
      {/* Subtle Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-50 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-50 rounded-full blur-[120px]" />
      </div>

      <motion.div
        className="max-w-4xl w-full text-center space-y-12 relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Logo & Hero Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="space-y-4"
        >
          <div className="flex justify-center mb-4">
            <div className="w-24 h-24 bg-white shadow-lg shadow-teal-500/5 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-100 p-3">
              <img
                src={logo}
                alt="PHÚC ANH Logo"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[12px] font-bold tracking-[0.5em] text-teal-600/60 uppercase">
              PHÚC ANH
            </span>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-wide leading-snug">
              HỆ THỐNG KẾ TOÁN TIỀN LƯƠNG
            </h1>
            <p className="text-[10px] font-bold text-slate-400 tracking-[0.3em] uppercase mt-4">
              Công ty TNHH Phúc Anh
            </p>
          </div>
        </motion.div>

        {/* Action Buttons Grid */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-3xl mx-auto"
        >
          {mainButtons.map((btn, idx) => (
            <Link
              key={idx}
              to={btn.to}
              className={`group relative overflow-hidden h-10 ${btn.color} rounded-lg shadow-md shadow-black/5 hover:shadow-lg hover:shadow-black/10 transition-all active:scale-95 flex items-center justify-center`}
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="text-white font-bold text-[10px] uppercase tracking-widest relative z-10">
                {btn.label}
              </span>
            </Link>
          ))}
        </motion.div>
      </motion.div>

      {/* Footer Credits */}
      <footer className="fixed bottom-6 right-6 z-50">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white/40 backdrop-blur-md border border-white/50 p-4 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] text-right space-y-0.5"
        >
          <p className="text-[12px] font-black text-slate-900 tracking-wide">
            Nguyễn Thị Lan Anh
          </p>
          <p className="text-[10px] font-bold text-teal-600/80 uppercase tracking-[0.15em]">
            GVHD: NCS. Trần Thị Hương
          </p>
        </motion.div>
      </footer>
    </div>
  );
}
