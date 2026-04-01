import { Outlet, Link, useNavigate, useLocation } from "react-router-dom"
import { 
  LogOut, Settings, Users, CalendarCheck, 
  ShieldCheck, 
  Database, ChevronRight, Wallet, PieChart, Home
} from "lucide-react"
import { useMemo, useState, useEffect } from "react"
import axios from "axios"
import { motion, AnimatePresence } from "framer-motion"

function FunctionIcon(props: any) {
  return (
    <svg 
      {...props}
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

const SidebarItem = ({ item, isActive, isExpanded, onToggle, hasPermission }: { item: MenuItem, isActive: boolean, isExpanded: boolean, onToggle: () => void, hasPermission: (code?: string) => boolean }) => {
  const location = useLocation();
  const hasChildren = item.children && item.children.length > 0;
  
  // Lọc các con theo quyền
  const visibleChildren = item.children?.filter((c: MenuItem) => hasPermission(c.functionCode)) || [];
  
  if (item.functionCode && !hasPermission(item.functionCode)) return null;
  if (hasChildren && visibleChildren.length === 0) return null;

  const content = (
    <div className={`flex items-center justify-between w-full p-3 rounded-xl transition-all duration-300 group relative ${
      isActive && !hasChildren 
        ? "bg-slate-800/80 text-white shadow-[0_0_20px_rgba(59,130,246,0.15)]" 
        : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-100"
    }`}>
      {isActive && !hasChildren && (
        <motion.div 
            layoutId="active-pill"
            className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
      <div className="flex items-center gap-3">
        <div className={`transition-colors duration-300 ${isActive && !hasChildren ? "text-blue-400" : "group-hover:text-primary"}`}>
            {item.icon}
        </div>
        <span className={`text-sm font-semibold tracking-wide transition-all ${isActive && !hasChildren ? "translate-x-1" : ""}`}>
            {item.label}
        </span>
      </div>
      {hasChildren && (
        <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
        >
            <ChevronRight className="w-4 h-4 opacity-50" />
        </motion.div>
      )}
    </div>
  );

  if (hasChildren) {
    return (
      <div className="space-y-1">
        <button onClick={onToggle} className="w-full text-left outline-none">
          {content}
        </button>
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden pl-10 space-y-1 border-l border-slate-800 ml-5"
            >
              {visibleChildren.map((child: MenuItem) => (
                <Link
                  key={child.to}
                  to={child.to || "#"}
                  className={`block p-2 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                    location.pathname === child.to ? "text-blue-400" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {child.label}
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <Link to={item.to || "#"} className="block outline-none">
      {content}
    </Link>
  );
};

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { username, roles } = useCurrentUser()
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [allowedFunctions, setAllowedFunctions] = useState<string[]>([])

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) return
    axios.get("/api/auth/my-permissions", {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setAllowedFunctions(res.data)).catch(() => {})
  }, [roles.join(",")])

  const hasPermission = (functionCode?: string): boolean => {
    if (!functionCode) return true;
    if (roles.includes("ROLE_ADMIN")) return true
    return allowedFunctions.includes(functionCode)
  }

  const menuItems = useMemo<MenuItem[]>(() => [
    { to: "/", label: "Tổng quan", icon: <Home size={18} /> },
    { to: "/config/salary", label: "Cấu hình Lương", icon: <Settings size={18} /> },
    { label: "Dữ liệu tính lương", icon: <Database size={18} />, children: [
        { to: "/employees", label: "Hồ sơ nhân sự", functionCode: "HR_EMPLOYEE" },
        { to: "/attendance", label: "Chấm công tháng", functionCode: "HR_ATTENDANCE" },
        { to: "/leaves", label: "Đăng ký nghỉ phép", functionCode: "HR_LEAVE" },
        { to: "/salary-changes", label: "Biến động lương", functionCode: "HR_SALARY_CHANGE" },
        { to: "/hr-tracking", label: "Biến động nhân sự", functionCode: "HR_EMPLOYEE" },
    ]},
    { label: "Tính lương", icon: <FunctionIcon size={18} />, children: [
        { to: "/payroll", label: "Bảng tính lương tháng", functionCode: "PAYROLL_CALCULATE" },
        { to: "/accounting", label: "Nhật ký hạch toán", functionCode: "ACCOUNTING_VIEW" },
        { to: "/ledger", label: "Sổ cái tài khoản", functionCode: "ACCOUNTING_VIEW" },
    ]},
    { label: "Chi trả", icon: <Wallet size={18} />, children: [
        { to: "/payments", label: "Thanh toán & UNC", functionCode: "PAYROLL_APPROVE" },
    ]},
    { to: "/reports", label: "Báo cáo", icon: <PieChart size={18} /> },
    { label: "Thiết lập", icon: <Settings size={18} />, children: [
        { to: "/admin/users", label: "Quản lý người dùng", functionCode: "ADMIN_USERS" },
        { to: "/config/accounts", label: "Danh mục tài khoản", functionCode: "CONFIG_ACCOUNT" },
    ]},
  ], [])

  const toggleExpand = (label: string) => {
    setExpandedItems(prev => 
      prev.includes(label) ? prev.filter(i => i !== label) : [...prev, label]
    )
  }

  const roleLabel = useMemo(() => {
    if (roles.includes("ROLE_ADMIN")) return "Administrator"
    if (roles.includes("ROLE_KE_TOAN_TRUONG")) return "Kế toán Trưởng"
    return "User"
  }, [roles])

  return (
    <div className="flex h-screen bg-slate-50 font-sans antialiased text-slate-900">
      <aside className="w-72 bg-[#111827] flex flex-col shadow-2xl relative z-20">
        <div className="p-8 pb-4">
             <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 bg-primary/20 flex items-center justify-center rounded-xl border border-primary/30">
                    <ShieldCheck className="text-primary w-6 h-6" />
                </div>
                <div>
                   <h1 className="text-white font-black text-lg leading-tight uppercase tracking-tighter">ANTIGRAVITY</h1>
                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Accounting OS</p>
                </div>
             </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            if (item.functionCode && !hasPermission(item.functionCode)) return null;
            if (item.children && !item.children.some(c => hasPermission(c.functionCode))) return null;

            const isActive = !!(item.to && location.pathname === item.to) || (item.children?.some(c => location.pathname === c.to) ?? false);
            return (
              <SidebarItem 
                key={item.label}
                item={item}
                isActive={isActive}
                isExpanded={expandedItems.includes(item.label)}
                onToggle={() => toggleExpand(item.label)}
                hasPermission={hasPermission}
              />
            )
          })}
        </nav>

        <div className="p-4 mt-auto">
            <div className="bg-slate-800/40 border border-slate-800 p-4 rounded-2xl">
                 <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-blue-400 flex items-center justify-center text-white font-black text-xs shadow-lg">
                        {username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-100 truncate">{username}</p>
                        <p className="text-[10px] text-slate-500 font-medium truncate">{roleLabel}</p>
                    </div>
                 </div>
                 <button 
                  onClick={() => {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    navigate("/login");
                  }}
                  className="flex w-full items-center justify-center gap-2 py-2 text-red-400 hover:text-white hover:bg-red-500/10 rounded-xl text-xs font-bold transition-all border border-red-500/20 hover:border-red-500/40"
                 >
                    <LogOut className="w-3 h-3" /> Đăng xuất
                 </button>
            </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-white relative">
        <header className="h-16 flex items-center justify-between px-10 border-b border-slate-100 sticky top-0 bg-white/80 backdrop-blur-md z-10">
           <div className="flex items-center gap-4">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{location.pathname.split('/').pop() || 'Dashboard'}</span>
           </div>
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 border-r pr-6 border-slate-100 text-xs font-bold text-slate-400">
                  <CalendarCheck size={14} />
                  {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <button className="p-2 hover:bg-slate-50 rounded-full transition-colors relative">
                  <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></div>
                  <Users className="w-5 h-5 text-slate-400" />
              </button>
           </div>
        </header>
        <div className="flex-1 p-10 overflow-auto">
            <Outlet />
        </div>
      </main>
    </div>
  )
}
