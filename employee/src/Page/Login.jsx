import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import '../Css/Login.css' 

function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ username: '', password: '' })
  const navigate = useNavigate()
  const API_URL = import.meta.env.VITE_API_URL // ใช้จาก .env

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev)
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const res = await axios.post(`${API_URL}/api/login`, form, {
      withCredentials: true
    });
    console.log('Login response:', res.data);

    if (res.data && res.data.user_id) {
      localStorage.setItem('user_id', res.data.user_id);
      localStorage.setItem('username', res.data.username);
      localStorage.setItem('full_name', res.data.full_name);
      localStorage.setItem('role', res.data.role);
      navigate('/Tb_employee');
    } else {
      alert('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    }
  } catch (error) {
    console.error('Login error:', error);
    alert('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
  }
};

  return (
    <div className="login-box">
      <h2>LOGIN</h2>
      <form onSubmit={handleSubmit}>
        <div className="user-box">
          <input
            type="text"
            name="username"
            autoComplete="off"
            required
            onChange={handleChange}
            value={form.username}
          />
          <label className="label1">Username</label>
        </div>

        <div className="user-box" style={{ position: 'relative' }}>
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            autoComplete="off"
            required
            onChange={handleChange}
            value={form.password}
          />
          <label>Password</label>

          <span
            onClick={togglePasswordVisibility}
            style={{
              position: 'absolute',
              right: '10px',
              top: '12px',
              cursor: 'pointer',
              color: '#03e9f4',
              fontSize: '14px',
              backgroundColor: '#000',
              padding: '2px 6px',
              borderRadius: '4px',
              userSelect: 'none',
            }}
          >
            {showPassword ? 'Hide' : 'Show'}
          </span>
        </div>

        <button type="submit">LOGIN</button>
      </form>
    </div>
  )
}

export default Login