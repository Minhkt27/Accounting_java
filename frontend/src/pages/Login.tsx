import { useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { motion } from "framer-motion"
import { Lock, User, Eye, EyeOff, Loader2 } from "lucide-react"
import background from "../assets/backgroup.jpg"

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

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
      setError("Tài khoản hoặc mật khẩu không chính xác.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-100 p-4 font-sans">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-5xl bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] flex flex-col lg:flex-row overflow-hidden min-h-[600px]"
      >
        {/* Left Side - Background Image */}
        <div className="hidden lg:block lg:w-1/2 relative">
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${background})`,
              backgroundSize: 'cover',
              backgroundPosition: 'left center',
            }}
          />
          <div className="absolute inset-0 bg-blue-900/10" />
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 p-10 lg:p-16 flex flex-col justify-center">
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Đăng nhập hệ thống</h2>
              <p className="text-gray-400 text-sm">Chào mừng bạn quay trở lại. Vui lòng đăng nhập để tiếp tục.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-lg font-medium text-gray-400 ml-1">Tên đăng nhập</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-600 transition-colors" size={20} />
                  <input 
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ví dụ: admin"
                    className="w-full bg-gray-50 border-transparent text-gray-900 pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all placeholder:text-gray-300 font-medium text-lg"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-lg font-medium text-gray-400 ml-1">Mật khẩu</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-600 transition-colors" size={20} />
                  <input 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-gray-50 border-transparent text-gray-900 pl-12 pr-12 py-4 rounded-2xl focus:outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all placeholder:text-gray-300 font-medium text-lg"
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {error && <p className="text-red-500 text-xs mt-2 ml-1 font-bold">{error}</p>}
              </div>

              <div className="flex items-center text-lg">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-gray-400 group-hover:text-gray-700 transition-colors font-medium">Ghi nhớ đăng nhập</span>
                </label>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 h-14"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin w-5 h-5" />
                ) : (
                  "Xác thực truy cập"
                )}
              </button>
            </form>


          </div>
        </div>
      </motion.div>
    </div>
  )
}
