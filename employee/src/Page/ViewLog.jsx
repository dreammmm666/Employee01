import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../Css/EmployeeTable.css';
import NavBar from '../Component/Navbar';

function LogViewer() {
  const [logs, setLogs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const itemsPerPage = 10;

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  useEffect(() => {
    axios.get(`${API_URL}/api/logs/employee-edit`)
      .then(res => setLogs(res.data))
      .catch(err => console.error('❌ Error fetching logs:', err));
  }, [API_URL]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLogs = Array.isArray(logs) ? logs.slice(indexOfFirstItem, indexOfLastItem) : [];

  const handleNextPage = () => {
    if (currentPage < Math.ceil(logs.length / itemsPerPage)) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleRowClick = (log) => {
    setSelectedLog(log);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return '-';
    const date = new Date(dateTimeStr);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  const parseJSONSafe = (jsonStr) => {
    if (!jsonStr) return null;
    if (typeof jsonStr === 'object') return jsonStr;
    try {
      return JSON.parse(jsonStr);
    } catch {
      return jsonStr;
    }
  };

  return (
    <>
      <NavBar />
      <div className='page-background'>
        <div className="employee-table-container">
          <h2>📋 ประวัติการแก้ไขข้อมูลพนักงาน</h2>
          <table className="employee-table">
            <thead>
              <tr>
                <th>รหัส Log</th>
                <th>การกระทำ</th>
                <th>ตาราง</th>
                <th>ID ที่ถูกแก้ไข</th>
                <th>เวลา</th>
              </tr>
            </thead>
            <tbody>
              {currentLogs.map(log => (
                <tr key={log.log_id} onClick={() => handleRowClick(log)} className="clickable-row">
                  <td>{log.log_id}</td>
                  <td>{log.action}</td>
                  <td>{log.target_table}</td>
                  <td>{log.target_id}</td>
                  <td>{formatDateTime(log.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination-controls">
            <button onClick={handlePrevPage} disabled={currentPage === 1}>ย้อนกลับ</button>
            <span>หน้า {currentPage} / {Math.ceil(logs.length / itemsPerPage)}</span>
            <button onClick={handleNextPage} disabled={currentPage === Math.ceil(logs.length / itemsPerPage)}>ถัดไป</button>
          </div>
        </div>
      </div>

      {showModal && selectedLog && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-button" onClick={handleCloseModal}>×</button>
            <h3>รายละเอียดการแก้ไขข้อมูลพนักงาน</h3>
            <p><strong>ผู้แก้ไข:</strong> {selectedLog.editor_username || selectedLog.user_id}</p>
            <p><strong>การกระทำ:</strong> {selectedLog.action}</p>
            <p><strong>ตารางเป้าหมาย:</strong> {selectedLog.target_table}</p>
            <p><strong>ID ที่ถูกแก้ไข:</strong> {selectedLog.target_id}</p>
            <p><strong>ชื่อพนักงานที่ถูกแก้ไข:</strong> {selectedLog.edited_employee_name || '-'}</p>

            <h4>รายละเอียดการเปลี่ยนแปลง</h4>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {(() => {
                const desc = parseJSONSafe(selectedLog.description);
                if (!desc) return '-';
                if (typeof desc === 'string') return desc;
                return JSON.stringify(desc, null, 2);
              })()}
            </pre>

            <p><strong>เวลาที่ทำรายการ:</strong> {formatDateTime(selectedLog.created_at)}</p>
          </div>
        </div>
      )}
    </>
  );
}

export default LogViewer;
