import React, { useState, useRef } from 'react';
import axios from 'axios';
import NavBar from '../Component/Navbar';
import '../Css/Edit.css'; // CSS เดิมของคุณ
import Swal from 'sweetalert2'

function AddEmployeeWithImage() {
  const [formData, setFormData] = useState({
    employee_id: '',
    full_name: '',
    gender: 'ชาย',
    age: '',
    birth_date: '',
    citizen_id: '',
    start_date: '',
    bank_account: '',
    current_salary: '',
    department: '',
    phone_number: '',
    otherDepartment: '',
    position: '',
    otherPosition: '',
    Google_drive: ''
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const positionOptions = {
    กราฟิก: ['หัวหน้าฝ่ายกราฟิก', 'เจ้าหน้าที่กราฟิก'],
    การตลาด: ['หัวหน้าฝ่ายการตลาด', 'เจ้าหน้าที่การตลาด'],
    ธุรการบัญชีและลูกค้าสัมพันธ์: ['หัวหน้าธุรการ', 'บัญชี', 'ลูกค้าสัมพันธ์', 'เจ้าหน้าที่ทั่วไป'],
    บริหาร: ['ผู้จัดการทั่วไป', 'ประธานบริษัท']
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'birth_date') {
      const ageString = calculateAgeString(value);
      setFormData(prev => ({
        ...prev,
        birth_date: value,
        age: ageString
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.full_name || !formData.citizen_id) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบ',
        confirmButtonText: 'ตกลง'
      });
      return;
    }

    try {
      const data = new FormData();

      const departmentToSubmit =
        formData.department === 'อื่นๆ' ? formData.otherDepartment : formData.department;
      const positionToSubmit =
        formData.position === 'อื่นๆ' ? formData.otherPosition : formData.position;

      data.append('employee_id', formData.employee_id);
data.append('full_name', formData.full_name);
data.append('gender', formData.gender);
data.append('birth_date', formData.birth_date);
data.append('age', parseInt(formData.age) || 0);
data.append('citizen_id', formData.citizen_id);
data.append('phone_number', formData.phone_number); 
data.append('start_date', formData.start_date);
data.append('bank_account', formData.bank_account);
data.append('current_salary', parseFloat(formData.current_salary) || 0); 
data.append('department', departmentToSubmit);
data.append('position', positionToSubmit);
data.append('Google_drive', formData.Google_drive);


      if (imageFile) {
        data.append('profile_image', imageFile);
      }
       console.log('--- FormData ---');
for (let pair of data.entries()) {
  console.log(pair[0]+ ': ' + pair[1]);
}
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/employees`,
        data,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );

      Swal.fire({
        icon: 'success',
        title: 'เพิ่มข้อมูลพนักงานสำเร็จ',
        text: `รหัสพนักงาน: ${res.data.employee_id}`,
        confirmButtonText: 'ตกลง'
      });

      setFormData({
        employee_id: '',
        full_name: '',
        gender: 'ชาย',
        age: '',
        birth_date: '',
        citizen_id: '',
        start_date: '',
        bank_account: '',
        phone_number: '',
        current_salary: '',
        department: '',
        otherDepartment: '',
        position: '',
       
        otherPosition: '',
        Google_drive: ''
      });

      setImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

    } catch (error) {
      Swal.fire({
        title: 'เกิดข้อผิดพลาด',
        text: error.message,
        icon: 'error',
        confirmButtonText: 'ปิด'
      });
    }
  };

  const calculateAgeString = (birthDateStr) => {
    if (!birthDateStr) return '';
    const today = new Date();
    const birthDate = new Date(birthDateStr);
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    if (months < 0) {
      years--;
      months += 12;
    }
    return `${years} ปี ${months} เดือน`;
  };

  return (
    <>
      <NavBar />
      <div className='page-background'>
        <div className="employee-table-container">
          <form
            onSubmit={handleSubmit}
            className="edit-box01"
            style={{ maxWidth: '600px' }}
            encType="multipart/form-data"
          >
            <h2>เพิ่มข้อมูลพนักงาน</h2>

            <label>รหัสพนักงาน</label>
            <input type="text" name="employee_id" value={formData.employee_id} onChange={handleChange} autoComplete="off" required />

            <label>ชื่อ - นามสกุล</label>
            <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} autoComplete="off" required />

            <label>เพศ</label>
            <select name="gender" value={formData.gender} onChange={handleChange}>
              <option value="ชาย">ชาย</option>
              <option value="หญิง">หญิง</option>
            </select>

            <label>วันเกิด(ค.ศ)</label>
            <input type="date" name="birth_date" value={formData.birth_date} onChange={handleChange} />

            <label>อายุ</label>
            <input type="text" name="age" value={formData.age} readOnly />

            <label>เลขบัตรประชาชน</label>
            <input type="text" name="citizen_id" value={formData.citizen_id} onChange={handleChange} maxLength={13} autoComplete="off" required />
            
            <label>เบอร์โทรศัพท์</label>
            <input type="text" name="phone_number" value={formData.phone_number} onChange={handleChange} maxLength={13} autoComplete="off" required />

            <label>แผนก</label>
            <select name="department" value={formData.department} onChange={handleChange}>
              <option value="">-- เลือกแผนก --</option>
              <option value="กราฟิก">กราฟิก</option>
              <option value="การตลาด">การตลาด</option>
              <option value="ธุรการบัญชีและลูกค้าสัมพันธ์">ธุรการบัญชีและลูกค้าสัมพันธ์</option>
              <option value="บริหาร">บริหาร</option>
              <option value="อื่นๆ">อื่นๆ</option>
            </select>

            {formData.department === 'อื่นๆ' && (
              <>
                <label>ระบุแผนกอื่นๆ</label>
                <input type="text" name="otherDepartment" value={formData.otherDepartment} onChange={handleChange} placeholder="กรอกชื่อแผนก" autoComplete="off" required />
              </>
            )}

            <label>ตำแหน่ง</label>
            <select name="position" value={formData.position} onChange={handleChange}>
              <option value="">-- เลือกตำแหน่ง --</option>
              {formData.department && positionOptions[formData.department]?.map((pos) => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
              <option value="อื่นๆ">อื่นๆ</option>
            </select>

            {formData.position === 'อื่นๆ' && (
              <>
                <label>ระบุตำแหน่งอื่นๆ</label>
                <input type="text" name="otherPosition" value={formData.otherPosition} onChange={handleChange} placeholder="กรอกตำแหน่ง" autoComplete="off" required />
              </>
            )}

            <label>ลิงก์ไดรฟ์</label>
            <input type="text" name="Google_drive" value={formData.Google_drive} onChange={handleChange} autoComplete="off" required />

            <label>วันเริ่มงาน(ค.ศ)</label>
            <input type="date" name="start_date" value={formData.start_date} onChange={handleChange} />

            <label>เลขบัญชีที่รับเงินเดือน</label>
            <input type="text" name="bank_account" value={formData.bank_account} autoComplete="off" onChange={handleChange} />

            <label>เงินเดือนปัจจุบัน</label>
            <input type="text" name="current_salary" value={formData.current_salary} onChange={handleChange}  />

            <label htmlFor="profile_image">คลิกเพื่อเลือกรูปภาพพนักงาน</label>
            <input type="file" id="profile_image" name="profile_image" accept="image/*" onChange={handleImageChange} ref={fileInputRef} />
            {imageFile && <div className="file-name">ชื่อไฟล์: {imageFile.name}</div>}

            {imagePreview && (
              <div style={{ marginTop: '10px' }}>
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{
                    maxWidth: '200px',
                    maxHeight: '200px',
                    borderRadius: '10px',
                    objectFit: 'cover'
                  }}
                />
              </div>
            )}

            <button type="submit" style={{ marginTop: '1rem' }}>บันทึก</button>
          </form>
        </div>
      </div>
    </>
  );
}

export default AddEmployeeWithImage;
