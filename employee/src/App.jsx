import { BrowserRouter as Router, Routes, Route ,Link } from 'react-router-dom';
import React from 'react'
import './App.css'
import Login from './Page/Login';
import Tb_employee from './Page/Tb_employee';
import Edit_employee from './Page/Edit_employee';
import AddEmployee from './Page/AddEmployee';
import ViewLog from './Page/ViewLog'
import RegisterUser from './Page/RegisterUser';
function App() {
  return (
    <>
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="Tb_employee" element={<Tb_employee />} />
        <Route path="Edit_employee" element={<Edit_employee />} />
        <Route path="AddEmployee" element={<AddEmployee />} />
        
        <Route path="ViewLog" element={<ViewLog />} />
        <Route path="RegisterUser" element={<RegisterUser />} />
        
        </Routes>
    </Router>

    
    </>
  )
}

export default App