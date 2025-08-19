import React, { useEffect, useState } from 'react'
import axios from 'axios'
import '../Css/EmployeeTable.css'
import NavBar from '../Component/Navbar'

function EmployeeTable() {
  const [employees, setEmployees] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const itemsPerPage = 10

  // ใช้ URL backend จาก environment variable หรือ fallback เป็น localhost
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  const formatYearsOfService = (startDateStr, resignDateStr) => {
    if (!startDateStr) return '-'
    const start = new Date(startDateStr)
    const end = resignDateStr ? new Date(resignDateStr) : new Date()

    let years = end.getFullYear() - start.getFullYear()
    let months = end.getMonth() - start.getMonth()
    let days = end.getDate() - start.getDate()

    if (days < 0) {
      months -= 1
      const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0)
      days += prevMonth.getDate()
    }

    if (months < 0) {
      years -= 1
      months += 12
    }

    let result = ''
    if (years > 0) result += `${years} ปี `
    if (months > 0) result += `${months} เดือน `
    if (days > 0 || result === '') result += `${days} วัน`

    return result.trim()
  }

  const calculateAge = (birthDateString) => {
    if (!birthDateString) return '-'
    const birthDate = new Date(birthDateString)
    const today = new Date()

    let years = today.getFullYear() - birthDate.getFullYear()
    let months = today.getMonth() - birthDate.getMonth()

    if (months < 0) {
      years--
      months += 12
    }

    return `${years} ปี ${months} เดือน`
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000)) // wait 1 sec
        const res = await axios.get(`${API_URL}/api/employees`)
        setEmployees(res.data)
      } catch (err) {
        console.error('Error fetching employees:', err)
      }
    }
    fetchData()
  }, [API_URL])

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentEmployees = employees.slice(indexOfFirstItem, indexOfLastItem)

  const handleNextPage = () => {
    if (currentPage < Math.ceil(employees.length / itemsPerPage)) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  // Modal handlers
  const handleRowClick = (employee) => {
    setSelectedEmployee(employee)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
  }

  // ฟังก์ชันช่วยแปลง profile_image เป็น URL เต็ม
  const getProfileImageUrl = (profileImage) => {
    if (!profileImage) {
      return `${API_URL}/uploads/default.jpg`
    }
    if (/^https?:\/\//.test(profileImage)) {
      return profileImage
    }
    return `${API_URL}/uploads/${profileImage}`
  }

  return (
    <>
      <NavBar />
      <div className='page-background'>
        <div className="employee-table-container">
          <h2>ข้อมูลพนักงาน</h2>
          <table className="employee-table">
            <thead>
              <tr>
                <th>รหัสพนักงาน</th>
                <th>ชื่อ-นามสกุล</th>
                <th>แผนก</th>
              </tr>
            </thead>
            <tbody>
              {currentEmployees.map(emp => (
                <tr key={emp.employee_id} onClick={() => handleRowClick(emp)} className="clickable-row">
                  <td>{emp.employee_id}</td>
                  <td>{emp.full_name}</td>
                  <td>{emp.department}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination-controls">
            <button onClick={handlePrevPage} disabled={currentPage === 1}>ย้อนกลับ</button>
            <span> หน้า {currentPage} / {Math.ceil(employees.length / itemsPerPage)}</span>
            <button onClick={handleNextPage} disabled={currentPage === Math.ceil(employees.length / itemsPerPage)}>ถัดไป</button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedEmployee && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-button" onClick={handleCloseModal}>×</button>
            <div className="modal-body-horizontal">
              <div className="modal-image">
                <img
                  src={getProfileImageUrl(selectedEmployee.profile_image)}
                  alt="Employee"
                  onError={(e) => {
                    e.target.src = `${API_URL}/uploads/default.jpg`
                  }}
                />
              </div>
              <div className="modal-info">
                <p><strong>รหัสพนักงาน:</strong> {selectedEmployee.employee_id}</p>
                <p><strong>รหัสประจําตัวประชาชน:</strong> {selectedEmployee.citizen_id}</p>
                <p><strong>ชื่อ:</strong> {selectedEmployee.full_name}</p>
                <p><strong>เพศ:</strong> {selectedEmployee.gender}</p>
                <p><strong>อายุ:</strong> {calculateAge(selectedEmployee.birth_date)}</p>
                <p><strong>เบอร์โทรศัพท์:</strong> {selectedEmployee.phone_number}</p>
                <p><strong>แผนก:</strong> {selectedEmployee.department}</p>
                <p><strong>ตําเเหน่ง:</strong> {selectedEmployee.position}</p>
                {selectedEmployee.Google_drive && (
                  <p>
                    <strong>ลิงก์ Google Drive:</strong>{' '}
                    <a href={selectedEmployee.Google_drive} target="_blank" rel="noopener noreferrer">
                      คลิกเพื่อดู
                    </a>
                  </p>
                )}
                <p><strong>วันที่เริ่มงาน:</strong> {formatDate(selectedEmployee.start_date)}</p>
                <p><strong>วันที่ลาออก:</strong> {formatDate(selectedEmployee.resign_date)}</p>
                <p><strong>อายุงาน:</strong> {formatYearsOfService(selectedEmployee.start_date, selectedEmployee.resign_date)}</p>
                <p><strong>เลขบัญชีที่รับเงินเดือน:</strong> {selectedEmployee.bank_account}</p>
                <p><strong>เงินเดือนปัจจุบัน:</strong> {selectedEmployee.current_salary} บาท</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default EmployeeTable
