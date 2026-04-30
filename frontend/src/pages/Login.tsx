import { useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { motion } from "framer-motion"
import { ShieldCheck, Lock, User, AlertCircle, Loader2 } from "lucide-react"

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    try {
      const res = await axios.post("/api/auth/login", {
        username,
        password
      })
      localStorage.setItem("token", res.data.token)
      localStorage.setItem("user", JSON.stringify(res.data))
      setTimeout(() => navigate("/"), 500)
    } catch {
      setError("Tài khoản hoặc mật khẩu không chính xác. Vui lòng thử lại.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans overflow-hidden relative">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-indigo-50/50 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-blue-50/50 rounded-full blur-[100px] -z-10" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        <div className="bg-white/80 backdrop-blur-xl border border-slate-100 p-10 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] relative">
          
          <div className="text-center space-y-8">
            <motion.div 
              initial={{ y: -10 }}
              animate={{ y: 0 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 rounded-3xl shadow-2xl shadow-indigo-200 mb-2"
            >
              <ShieldCheck className="text-white w-10 h-10" />
            </motion.div>
            
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-slate-900 leading-tight whitespace-nowrap">
                Công ty Phúc Anh
              </h1>
              <p className="text-indigo-600 text-[13px] font-bold tracking-wide whitespace-nowrap mt-1">
                Hệ thống kế toán tiền lương / v2.0
              </p>
            </div>

            <form onSubmit={handleLogin} className="text-left space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên đăng nhập</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={18} />
                  <input 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    placeholder="Nhập tên đăng nhập..." 
                    required 
                    className="w-full bg-slate-50 border-transparent text-slate-900 pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all placeholder:text-slate-300 font-bold text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mật khẩu</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={18} />
                  <input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="••••••••" 
                    required 
                    className="w-full bg-slate-50 border-transparent text-slate-900 pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all placeholder:text-slate-300 font-bold text-sm"
                  />
                </div>
                {error && (
                  <motion.p 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[11px] text-red-500 font-bold italic ml-1 mt-2 flex items-center gap-1.5"
                  >
                    <AlertCircle size={12} />
                    {error}
                  </motion.p>
                )}
              </div>

              <motion.button 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit" 
                disabled={isLoading}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.1em] shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 group relative h-14"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin w-5 h-5 text-white/50" />
                ) : (
                  <>
                    Xác thực truy cập
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      →
                    </motion.div>
                  </>
                )}
              </motion.button>
            </form>
            

          </div>
        </div>
      </motion.div>
    </div>
  )
}

