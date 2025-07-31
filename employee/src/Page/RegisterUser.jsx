import React, { useState } from 'react';
import axios from 'axios';
import NavBar from '../Component/Navbar';
import '../Css/Edit.css';
import Swal from 'sweetalert2';

function RegisterUser() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    role: 'user'
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!formData.username || !formData.password || !formData.full_name) {
    Swal.fire({
      icon: 'warning',
      title: 'กรุณากรอกข้อมูลให้ครบ',
      confirmButtonText: 'ตกลง'
    });
    return;
  }

  if (formData.password !== formData.confirmPassword) {
    Swal.fire({
      icon: 'error',
      title: 'รหัสผ่านไม่ตรงกัน',
      confirmButtonText: 'ตกลง'
    });
    return;
  }

  try {
    const res = await axios.post(`${API_URL}/register`, {
      username: formData.username,
      password: formData.password,
      full_name: formData.full_name,
      role: formData.role
    });

    Swal.fire({
      icon: 'success',
      title: 'สร้างบัญชีผู้ใช้สำเร็จ',
      text: res.data.message,
      confirmButtonText: 'ตกลง'
    });

    setFormData({
      username: '',
      password: '',
      confirmPassword: '',
      full_name: '',
      role: 'user'
    });

  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'เกิดข้อผิดพลาด',
      text: err.response?.data?.message || err.message,
      confirmButtonText: 'ปิด'
    });
  }
};

  return (
    <>
      <NavBar />
      <div className='page-background'>
        <div className='employee-table-container'>
          <form className='edit-box01' style={{ maxWidth: '500px' }} onSubmit={handleSubmit}>
            <h2>สร้างบัญชีผู้ใช้</h2>

            <label>ชื่อผู้ใช้</label>
            <input
              type='text'
              name='username'
              value={formData.username}
              onChange={handleChange}
              autoComplete='off'
              required
            />

            <label style={{ marginTop: '10px',  display: 'block' }}>รหัสผ่าน</label>
            <input
              type='password'
              name='password'
              value={formData.password}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '8px',
                marginTop: '5px',
                marginBottom: '15px',
                border: '1px solid #ccc',
                borderRadius: '5px'
              }}
            />

            <label style={{ marginTop: '10px',  display: 'block' }}>ยืนยันรหัสผ่าน</label>
            <input
              type='password'
              name='confirmPassword'
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '8px',
                marginTop: '5px',
                marginBottom: '15px',
                border: '1px solid #ccc',
                borderRadius: '5px'
              }}
            />

            <br />

            <label>ชื่อ-นามสกุล</label>
            <input
              type='text'
              name='full_name'
              autoComplete="off"
              value={formData.full_name}
              onChange={handleChange}
              required
            />

            <label>สิทธิ์ผู้ใช้</label>
            <select name='role' value={formData.role} onChange={handleChange}>
              
              <option value='admin'>ผู้ดูแลระบบ</option>
            </select>

            <button type='submit' style={{ marginTop: '1rem' }}>สร้างบัญชีผู้ใช้</button>
          </form>
        </div>
      </div>
    </>
  );
}

export default RegisterUser;
