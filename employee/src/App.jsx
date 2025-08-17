import { BrowserRouter as Router, Routes, Route ,Link } from 'react-router-dom';
import React from 'react'
import './App.css'
import Login from './Page/Login';
import Tb_employee from './Page/Tb_employee';
import Edit_employee from './Page/Edit_employee';
import AddEmployee from './Page/AddEmployee';
import ViewLog from './Page/ViewLog'
import RegisterUser from './Page/RegisterUser';
import RequireAuth from './Component/RequireAuth';
function App() {
  return (
    <>
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
       <Route path="/Tb_employee" element={
          <RequireAuth><Tb_employee /></RequireAuth>
        } />
       <Route path="/Edit_employee" element={
          <RequireAuth><Edit_employee /></RequireAuth>
        } />
       <Route path="/AddEmployee" element={
          <RequireAuth><AddEmployee /></RequireAuth>
        } />
       <Route path="/ViewLog" element={
          <RequireAuth><ViewLog /></RequireAuth>
        } />
       <Route path="/RegisterUser" element={
          <RequireAuth><RegisterUser /></RequireAuth>
        } />
        
        
        
        
        
        
        
        </Routes>
    </Router>

    
    </>
  )
}

export default App