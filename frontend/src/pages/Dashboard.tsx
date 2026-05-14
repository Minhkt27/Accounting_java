import React from "react";
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
        className="max-w-5xl w-full text-center space-y-16 relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Logo & Hero Section */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="space-y-6">
           <div className="flex justify-center mb-8">
             <div className="w-40 h-40 bg-white shadow-xl shadow-teal-500/10 rounded-[2.5rem] flex items-center justify-center overflow-hidden border border-slate-100 p-4">
               <img src={logo} alt="PHÚC ANH Logo" className="w-full h-full object-contain" />
             </div>
           </div>
           
           <div className="space-y-2">
              <span className="text-3xl font-black tracking-widest text-teal-600/60 uppercase">PHÚC ANH</span>
              <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight">
                HỆ THỐNG KẾ TOÁN TIỀN LƯƠNG
              </h1>
              <p className="text-lg font-bold text-slate-400 tracking-wide">
                Công ty TNHH Phúc Anh
              </p>
           </div>
        </motion.div>

        {/* Action Buttons Grid */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto"
        >
          {mainButtons.map((btn, idx) => (
            <Link 
              key={idx} 
              to={btn.to}
              className={`group relative overflow-hidden h-14 ${btn.color} rounded-xl shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 transition-all active:scale-95 flex items-center justify-center`}
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="text-white font-bold text-sm tracking-wide relative z-10">
                {btn.label}
              </span>
            </Link>
          ))}
        </motion.div>
      </motion.div>

      {/* Footer Credits */}
      <footer className="mt-20 w-full flex justify-end">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-right space-y-1"
        >
          <p className="text-sm font-bold text-slate-400">Nguyễn Thị Lan Anh</p>
          <p className="text-xs font-semibold text-slate-300">GVHD: NCS. Trần Thị Hương</p>
        </motion.div>
      </footer>
    </div>
  );
}
