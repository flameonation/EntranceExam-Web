import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import StudentRegisterPage from './components/StudentRegisterPage'
import ExaminationPage from './components/ExaminationPage'
import AdminLoginPage from './admin/AdminLoginPage'
import AdminDashboardPage from './admin/AdminDashboardPage'
import Snap from './components/Snap'

function ProtectedAdminRoute({ children }) {
  const token = localStorage.getItem("admin_token");
  if (!token) return <Navigate to="/admin/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Snap/>} />
        <Route path="/register-avr" element={<StudentRegisterPage room="avr" />} />
        <Route path="/register-comlab" element={<StudentRegisterPage room="comlab-2" />} />
        <Route path="/examination" element={<ExaminationPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/dashboard" element={
          <ProtectedAdminRoute>
            <AdminDashboardPage />
          </ProtectedAdminRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}