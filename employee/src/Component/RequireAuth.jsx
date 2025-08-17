import React from 'react'
import { Navigate } from 'react-router-dom'

function RequireAuth({ children }) {
  // ดึงข้อมูล username จาก localStorage
  const username = localStorage.getItem('username')

  // ดีบักดูค่าที่ดึงมา
  console.log('RequireAuth: username =', username)

  // เช็คว่ามีค่า username ที่ไม่ใช่ null, undefined, หรือ string ว่าง
  if (!username || username.trim() === '') {
    // ถ้ายังไม่ล็อกอิน ให้รีไดเรกต์ไปหน้า login (path: "/")
    return <Navigate to="/" replace />
  }

  
  return children
}

export default RequireAuth
