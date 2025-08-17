import React, { useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../Css/Navbar.css';

const NavBar = () => {
  const toggleRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    if (toggleRef.current) {
      toggleRef.current.checked = false;
    }
  }, [location]);

  const handleLogout = () => {
  localStorage.clear();
  window.location.replace('/');
}



  return (
    <nav id="nav-bar" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <input type="checkbox" id="nav-toggle" ref={toggleRef} />

      {/* Header Logo + Text */}
      <div
        id="nav-header"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '1.5rem 1rem',
        }}
      >
        <img
          src="/img/LOGO.png"
          alt="Logo"
          style={{
            height: '50px',
            marginBottom: '0.5rem',
            objectFit: 'contain',
          }}
        />
        <p
          style={{
            fontSize: '13px',
            backgroundColor: 'rgb(8 90 10)',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            color: 'white',
            padding: '0.25rem 0.5rem',
            borderRadius: '6px',
            margin: 0,
            textAlign: 'center',
          }}
        >
          TAKIANG EMPLOYEE
        </p>
      </div>

      {/* Nav Menu */}
      <div id="nav-content" style={{ flexGrow: 1 }}>
        <Link to="/Tb_employee" className="nav-button">
          <i className="fa-solid fa-user" style={{ marginLeft: '2rem' }}></i>
          <span style={{ marginLeft: '10px' }}>ข้อมูลพนักงานทั้งหมด</span>
        </Link>

        <Link to="/Edit_employee" className="nav-button">
          <i className="fa-solid fa-pen" style={{ marginLeft: '2rem' }}></i>
          <span style={{ marginLeft: '10px' }}>แก้ไขข้อมูลพนักงาน</span>
        </Link>
        

        <Link to="/AddEmployee" className="nav-button">
          <i className="fa-solid fa-plus" style={{ marginLeft: '2rem' }}></i>
          <span style={{ marginLeft: '10px' }}>เพิ่มข้อมูลพนักงาน</span>
        </Link>
        
        <Link to="/ViewLog" className="nav-button">
         <i class="fa-solid fa-table-list" style={{ marginLeft: '2rem' }}></i>
          <span style={{ marginLeft: '10px' }}>ประวัติการแก้ไข</span>
        </Link>
        
        <Link to="/RegisterUser" className="nav-button">
         <i class="fa-solid fa-plus" style={{ marginLeft: '2rem' }}></i>
          <span style={{ marginLeft: '10px' }}>สร้างบัญชี</span>
        </Link>
      </div>
      
      

      <button className="nav-button logout-button" onClick={handleLogout}>
        <i className="fa-solid fa-right-from-bracket icon-left"></i>
        <span style={{ marginLeft: '9px' }}>ออกจากระบบ</span>
      </button>
    </nav>
  );
};

export default NavBar;
