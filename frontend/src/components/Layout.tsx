import { Outlet, Link, useNavigate, useLocation } from "react-router-dom"
import {
  LogOut, Settings, Users, CalendarCheck,
  Database, ChevronDown, Wallet, PieChart, Home, User
} from "lucide-react"
import React, { useMemo, useState, useEffect } from "react"
import axios from "axios"
import { motion, AnimatePresence } from "framer-motion"
import logo from "../assets/logo.jpg"

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string
}

function FunctionIcon(props: IconProps) {
  return (
    <svg
      {...props}
      width={props.size || 24}
      height={props.size || 24}
      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      className={`${props.className} w-[1.1rem] h-[1.1rem]`}
    >
      <path d="M9 17c2 0 2.8-1 2.8-2.8V10c0-2 1-3.3 3.2-3" />
      <path d="M9 11.2h5.7" />
    </svg>
  );
}

function useCurrentUser() {
  try {
    const raw = localStorage.getItem("user")
    if (!raw) return { username: "?", roles: [] as string[] }
    const data = JSON.parse(raw)
    return { username: data.username || "?", roles: (data.roles || []) as string[] }
  } catch { return { username: "?", roles: [] as string[] } }
}

interface MenuItem {
  to?: string
  label: string
  icon?: React.ReactNode
  functionCode?: string
  children?: MenuItem[]
}

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { username, roles } = useCurrentUser()
  const [allowedFunctions, setAllowedFunctions] = useState<string[]>([])
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const rolesKey = roles.join(",")
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) return
    axios.get("/api/auth/my-permissions", {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setAllowedFunctions(res.data)).catch(() => { })
  }, [rolesKey])

  const hasPermission = (functionCode?: string): boolean => {
    if (!functionCode) return true;
    if (roles.includes("ROLE_ADMIN")) return true
    return allowedFunctions.includes(functionCode)
  }

  const menuItems = useMemo<MenuItem[]>(() => [
    { to: "/", label: "Tổng quan", icon: <Home size={18} />, functionCode: "DASHBOARD_VIEW" },
    { to: "/config/salary", label: "Cấu hình Lương", icon: <Settings size={18} />, functionCode: "CONFIG_INSURANCE" },
    {
      label: "Dữ liệu tính lương", icon: <Database size={18} />, children: [
        { to: "/employees", label: "Hồ sơ nhân sự", functionCode: "HR_EMPLOYEE" },
        { to: "/attendance", label: "Chấm công tháng", functionCode: "HR_ATTENDANCE" },
        { to: "/leaves", label: "Danh sách nghỉ phép", functionCode: "HR_LEAVE" },
        { to: "/salary-changes", label: "Biến động lương", functionCode: "HR_SALARY_CHANGE" },
        { to: "/hr-tracking", label: "Biến động nhân sự", functionCode: "HR_EMPLOYEE" },
      ]
    },
    {
      label: "Tính lương", icon: <FunctionIcon size={18} />, children: [
        { to: "/payroll", label: "Bảng tính lương tháng", functionCode: "PAYROLL_CALCULATE" },
        { to: "/accounting", label: "Nhật ký hạch toán", functionCode: "ACCOUNTING_VIEW" },
        { to: "/ledger", label: "Sổ cái tài khoản", functionCode: "ACCOUNTING_VIEW" },
      ]
    },
    {
      label: "Chi trả", icon: <Wallet size={18} />, children: [
        { to: "/payments", label: "Thanh toán & UNC", functionCode: "PAYROLL_PAY" },
      ]
    },
    { to: "/reports", label: "Báo cáo", icon: <PieChart size={18} />, functionCode: "ACCOUNTING_VIEW" },
    {
      label: "Thiết lập", icon: <Settings size={18} />, children: [
        { to: "/admin/users", label: "Quản lý người dùng", functionCode: "ADMIN_USERS" },
        { to: "/config/accounts", label: "Danh mục tài khoản", functionCode: "CONFIG_ACCOUNT" },
      ]
    },
  ], [])

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-slate-200 px-8 py-3 flex items-center justify-between shadow-sm sticky top-0 bg-white z-50 no-print">
        <div className="flex items-center gap-10">
          <Link to="/" className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white shadow-md rounded-2xl flex items-center justify-center overflow-hidden border border-slate-100 p-2">
              <img src={logo} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tighter text-teal-600 italic leading-none">PHÚC ANH</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Hệ thống kế toán tiền lương</span>
            </div>
          </Link>
          
          <nav className="hidden xl:flex items-center gap-6">
            {menuItems.map((item, idx) => {
               if (item.functionCode && !hasPermission(item.functionCode)) return null;
               const visibleChildren = item.children?.filter(c => hasPermission(c.functionCode)) || [];
               if (item.children && visibleChildren.length === 0) return null;

               return (
                <div 
                  key={idx} 
                  className="relative group"
                  onMouseEnter={() => item.children && setActiveDropdown(item.label)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  {item.to ? (
                     <Link to={item.to} className={`flex items-center gap-1.5 cursor-pointer py-2 transition-all ${location.pathname === item.to ? "text-teal-600" : "text-slate-500 hover:text-slate-900"}`}>
                      <span className={`${location.pathname === item.to ? "text-teal-600" : "text-slate-400 group-hover:text-teal-600"}`}>
                        {item.icon}
                      </span>
                      <span className="text-[13px] font-bold tracking-wide whitespace-nowrap">
                        {item.label}
                      </span>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-1.5 cursor-pointer py-2 group">
                      <span className="text-slate-400 group-hover:text-teal-600 transition-colors">
                        {item.icon}
                      </span>
                      <span className="text-[13px] font-bold text-slate-500 group-hover:text-slate-900 transition-colors whitespace-nowrap">
                        {item.label}
                      </span>
                      <ChevronDown size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                    </div>
                  )}

                  <AnimatePresence>
                    {item.children && activeDropdown === item.label && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute left-0 top-full pt-2 w-64"
                      >
                        <div className="bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden py-2 backdrop-blur-xl">
                          {visibleChildren.map((child, cIdx) => (
                            <Link 
                              key={cIdx} 
                              to={child.to || "#"}
                              className={`block px-5 py-2.5 text-[12px] font-bold tracking-wide transition-all ${location.pathname === child.to ? "text-teal-600 bg-teal-50" : "text-slate-600 hover:bg-slate-50 hover:text-teal-600"}`}
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
               );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[11px] font-bold text-slate-900">{username}</span>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Hệ thống tiền lương</span>
          </div>
          
          <div className="h-8 w-px bg-slate-200" />

          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-xl transition-all border border-slate-200 hover:border-red-100"
          >
            <LogOut size={16} />
            <span className="text-[11px] font-bold uppercase tracking-wider">Thoát</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 relative print:block print:w-full">
        <div className="flex-1 p-8 lg:p-12 overflow-auto custom-scrollbar print:p-0 print:overflow-visible">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
