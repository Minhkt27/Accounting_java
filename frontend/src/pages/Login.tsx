import { useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await axios.post("/api/auth/login", {
        username,
        password
      })
      localStorage.setItem("token", res.data.token)
      localStorage.setItem("user", JSON.stringify(res.data))
      navigate("/")
    } catch {
      setError("SAI TÀI KHOẢN HOẶC MẬT KHẨU RỒI!")
    }
  }

  return (
    <div style={{ background: "#eee", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", fontFamily: "Arial" }}>
      <div style={{ background: "white", padding: "40px", border: "5px solid black", width: "350px", textAlign: "center" }}>
        <h1 style={{ color: "blue", margin: "0 0 20px 0" }}>ĐĂNG NHẬP</h1>
        <p style={{ fontWeight: "bold" }}>Hệ Thống Kế Toán Tiền Lương</p>
        
        {error && (
          <div style={{ background: "red", color: "white", padding: "10px", margin: "10px 0", border: "2px solid black", fontWeight: "bold" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ textAlign: "left", marginTop: "20px" }}>
          <div style={{ marginBottom: "15px" }}>
            <label style={{ fontWeight: "bold", display: "block" }}>Tên đăng nhập:</label>
            <input 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              placeholder="nhập tên vào đây" 
              required 
              style={{ padding: "10px", width: "100%", border: "2px solid black", marginTop: "5px" }}
            />
          </div>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ fontWeight: "bold", display: "block" }}>Mật khẩu:</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="vào đây nữa" 
              required 
              style={{ padding: "10px", width: "100%", border: "2px solid black", marginTop: "5px" }}
            />
          </div>
          <button 
            type="submit" 
            style={{ 
                background: "blue", 
                color: "white", 
                width: "100%", 
                padding: "15px", 
                border: "3px solid black", 
                fontWeight: "bold", 
                cursor: "pointer",
                fontSize: "16px"
            }}
          >
            BẤM ĐỂ ĐĂNG NHẬP
          </button>
        </form>
        
        <p style={{ marginTop: "20px", fontSize: "12px", color: "gray" }}>
            Lưu ý: Nếu không đăng nhập được hãy báo Admin
        </p>
      </div>
    </div>
  )
}
