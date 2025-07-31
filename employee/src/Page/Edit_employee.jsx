import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import '../Css/Edit.css'
import NavBar from '../Component/Navbar'
import Swal from 'sweetalert2'

function EditEmployee() {
  const [employees, setEmployees] = useState([])
  const [searchText, setSearchText] = useState('')
  const [filteredSuggestions, setFilteredSuggestions] = useState([])
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [customDept, setCustomDept] = useState('')
  const [customPos, setCustomPos] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [positionOptions, setPositionOptions] = useState([])
  const fileInputRef = useRef()

  const positionOptionsByDepartment = {
    กราฟิก: ['หัวหน้าฝ่ายกราฟิก', 'เจ้าหน้าที่กราฟิก'],
    การตลาด: ['หัวหน้าฝ่ายการตลาด', 'เจ้าหน้าที่การตลาด'],
    ธุรการบัญชีและลูกค้าสัมพันธ์: ['หัวหน้าธุรการ', 'บัญชี', 'ลูกค้าสัมพันธ์', 'เจ้าหน้าที่ทั่วไป'],
    บริหาร: ['ผู้จัดการทั่วไป', 'ประธานบริษัท']
  }

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

  useEffect(() => {
    axios.get(`${API_URL}/api/employees`)
      .then(res => setEmployees(res.data))
      .catch(err => alert('เกิดข้อผิดพลาดในการดึงข้อมูลพนักงาน: ' + err.message))
  }, [API_URL])

  useEffect(() => {
    if (selectedEmployee?.department && positionOptionsByDepartment[selectedEmployee.department]) {
      setPositionOptions(positionOptionsByDepartment[selectedEmployee.department])
    } else {
      setPositionOptions([])
    }
  }, [selectedEmployee?.department])

  // ฟังก์ชันเช็คว่า string เป็น URL หรือไม่
  const isFullUrl = (str) => /^https?:\/\//.test(str)

  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchText(value)
    const suggestions = employees.filter(emp =>
      emp.full_name.toLowerCase().includes(value.toLowerCase())
    )
    setFilteredSuggestions(suggestions)
  }

  const handleSelectSuggestion = (emp) => {
    setSelectedEmployee(emp)
    setCustomDept(emp.department === 'อื่นๆ' ? '' : emp.department)
    setCustomPos(emp.position === 'อื่นๆ' ? '' : emp.position)
    setSearchText(emp.full_name)
    setFilteredSuggestions([])

    if (emp.profile_image) {
      if (isFullUrl(emp.profile_image)) {
        setImagePreview(emp.profile_image)
      } else {
        setImagePreview(`${API_URL}/uploads/${emp.profile_image}`)
      }
    } else {
      setImagePreview(null)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    let updated = { ...selectedEmployee, [name]: value }

    if (name === 'birth_date') {
      updated.age = calculateAgeString(value)
    }

    setSelectedEmployee(updated)
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSave = async () => {
    const user_id = localStorage.getItem('user_id')
    if (!user_id) {
      alert('❌ ไม่พบ user_id กรุณาเข้าสู่ระบบใหม่')
      return
    }

    const formData = new FormData()
    for (const key in selectedEmployee) {
      formData.append(key, selectedEmployee[key])
    }

    formData.set('age', parseInt(selectedEmployee.age) || 0)
    formData.set('current_salary', parseFloat(selectedEmployee.current_salary) || 0)
    formData.set('user_id', parseInt(user_id))
    formData.set(
      'department',
      selectedEmployee.department === 'อื่นๆ' ? customDept : selectedEmployee.department
    )
    formData.set(
      'position',
      selectedEmployee.position === 'อื่นๆ' ? customPos : selectedEmployee.position
    )

    if (imageFile) {
      formData.append('profile_image', imageFile)
    }

    try {
  const res = await axios.put(
    `${API_URL}/api/EDemployees/${selectedEmployee.employee_id}`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' }
    }
  )

  Swal.fire({
    title: ' สำเร็จ!',
    text: 'อัปเดตข้อมูลเรียบร้อยแล้ว',
    icon: 'success',
    confirmButtonText: 'ตกลง'
  })

  if (res.data.profile_image) {
    setImagePreview(res.data.profile_image)

    setSelectedEmployee(prev => ({
      ...prev,
      profile_image: res.data.profile_image
    }))
  }
} catch (err) {
  Swal.fire({
    title: '❌ เกิดข้อผิดพลาด',
    text: err.message,
    icon: 'error',
    confirmButtonText: 'ปิด'
  })
}
  }

  const calculateAgeString = (birthDateStr) => {
    if (!birthDateStr) return ''
    const today = new Date()
    const birthDate = new Date(birthDateStr)
    let years = today.getFullYear() - birthDate.getFullYear()
    let months = today.getMonth() - birthDate.getMonth()
    if (months < 0) {
      years--
      months += 12
    }
    return `${years} ปี ${months} เดือน`
  }

  return (
    <>
      <NavBar />
      <div className='page-background'>
        <div className="employee-table-container">
          <h2>🔍 ค้นหาและแก้ไขข้อมูลพนักงาน</h2>
          <input
            type="text"
            className="search-input"
            placeholder="พิมพ์ชื่อพนักงาน..."
            value={searchText}
            onChange={handleSearchChange}
          />
          {searchText && filteredSuggestions.length > 0 && (
            <ul className="autocomplete-suggestions">
              {filteredSuggestions.map(emp => (
                <li key={emp.employee_id} onClick={() => handleSelectSuggestion(emp)}>
                  {emp.full_name}
                </li>
              ))}
            </ul>
          )}

          {selectedEmployee && (
            <div className="edit-box">
              <h3>✏️ แก้ไขข้อมูล: {selectedEmployee.full_name}</h3>
              <div>
                {imagePreview && (
                  <img src={imagePreview} alt="Preview" style={{ width: '120px', marginBottom: '10px' }} />
                )}
                <br />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    fileInputRef.current?.click()
                  }}
                  style={{ marginBottom: '10px' }}
                >
                  เปลี่ยนรูปภาพ
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                  accept="image/*"
                />
              </div>

              {/* ฟอร์มอื่นๆ ตามเดิม... */}
              <label>ชื่อ - นามสกุล</label>
              <input type="text" name="full_name" value={selectedEmployee.full_name || ''} autoComplete='off' onChange={handleInputChange} />

              <label>เพศ</label>
              <select name="gender" value={selectedEmployee.gender || 'ชาย'} onChange={handleInputChange}>
                <option value="ชาย">ชาย</option>
                <option value="หญิง">หญิง</option>
              </select>

              <label>อายุ</label>
              <input type="text" name="age" value={selectedEmployee.age || ''} readOnly />

              <label>วันเกิด(ค.ศ)</label>
              <input type="date" name="birth_date" value={selectedEmployee.birth_date?.slice(0, 10) || ''} onChange={handleInputChange} />

              <label>เลขบัตรประชาชน</label>
              <input type="text" name="citizen_id" value={selectedEmployee.citizen_id || ''} onChange={handleInputChange} />

              <label>แผนก</label>
              <select name="department" value={selectedEmployee.department || ''} onChange={handleInputChange}>
                <option value="">-- เลือกแผนก --</option>
                {Object.keys(positionOptionsByDepartment).map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
                <option value="อื่นๆ">อื่นๆ</option>
              </select>
              {selectedEmployee.department === 'อื่นๆ' && (
                <input type="text" placeholder="กรอกแผนกอื่นๆ" value={customDept} onChange={(e) => setCustomDept(e.target.value)} />
              )}

              <label>ตำแหน่ง</label>
              <select name="position" value={selectedEmployee.position || ''} onChange={handleInputChange}>
                <option value="">-- เลือกตำแหน่ง --</option>
                {positionOptions.map(pos => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
                <option value="อื่นๆ">อื่นๆ</option>
              </select>
              {selectedEmployee.position === 'อื่นๆ' && (
                <input type="text" placeholder="กรอกตำแหน่งอื่นๆ" value={customPos} onChange={(e) => setCustomPos(e.target.value)} />
              )}

              <label>ลิงก์ไดรฟ์</label>
              <input type="text" name="Google_drive" value={selectedEmployee.Google_drive || ''} onChange={handleInputChange} />

              <label>วันเริ่มงาน(ค.ศ)</label>
              <input type="date" name="start_date" value={selectedEmployee.start_date?.slice(0, 10) || ''} onChange={handleInputChange} />

              <label>วันลาออก (ถ้ามี)</label>
              <input type="date" name="resign_date" value={selectedEmployee.resign_date?.slice(0, 10) || ''} onChange={handleInputChange} />

              <label>เลขบัญชีที่รับเงินเดือน</label>
              <input type="text" name="bank_account" value={selectedEmployee.bank_account || ''} onChange={handleInputChange} />

              <label>เงินเดือนปัจจุบัน</label>
              <input type="number" name="current_salary" value={selectedEmployee.current_salary || ''} onChange={handleInputChange} />

              <button onClick={handleSave}>💾 บันทึก</button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default EditEmployee
