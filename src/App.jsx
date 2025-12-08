import { useState } from 'react'
import reactLogo from './assets/react.svg'
import './App.css'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import Contact from './pages/Contact'
import Users from './pages/Users'
import Categories from './pages/Categories'
import Transactions from './pages/Transactions'
import Students from './pages/Students'
import DuePayments from './pages/DuePayments'
import MonthlyFees from './pages/MonthlyFees'
import Donors from './pages/Donors'
import DonorTracking from './pages/DonorTracking'
import Receipt from './pages/Receipt'
import Staff from './pages/Staff'
import StaffSalaries from './pages/StaffSalaries'
import MarkAttendance from './pages/MarkAttendance'
import ViewAttendance from './pages/ViewAttendance'
import GraveReservations from './pages/GraveReservations'

function App() {
  let savedUser = null;
  try {
    savedUser = JSON.parse(localStorage.getItem('user'))
  }
  catch (err) {
    localStorage.removeItem('user')
    savedUser = null

  }
  const isAdmin = savedUser?.isAdmin;
  const canViewOtherUsersData = savedUser?.canViewOtherUsersData;
  const canAddData = savedUser?.canAddData;
  const canUpdateData = savedUser?.canUpdateData;

  // console.log(savedUser);
  // console.log(isAdmin);
  return (
    <>

      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/receipt/:id" element={<Receipt />} />

        {/* Protected Routes with Sidebar */}
        <Route
          path="*"
          element={
            <ProtectedRoutes>
              <div className="d-flex flex-column flex-md-row" style={{ height: '100vh' }}>
                <Sidebar />
                <div className="flex-grow-1 p-3" style={{ overflowY: 'auto' }}>
                  <Routes>
                    {/* <Route path="/" element={<Dashboard />} /> */}
                    <Route
                      path="/"
                      element={
                        savedUser?.canViewOtherUsersData ? (
                          <Dashboard />
                        ) : (
                          <Navigate to="/income" replace />
                        )
                      }
                    />
                    <Route path="/users" element={<ProtectedAdminRoute><Users /></ProtectedAdminRoute>} />
                    <Route path="/income-categories" element={<Categories type="income" />} />
                    <Route path="/expense-categories" element={<Categories type="expense" />} />
                    <Route path="/asset-types" element={<Categories type="asset" />} />
                    <Route path="/income" element={<Transactions type="income" />} />
                    <Route path="/expense" element={<Transactions type="expense" />} />
                    <Route path="/assets" element={<Transactions type="asset" />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/students" element={<Students />} />
                    <Route path="/staff" element={<Staff />} />
                    <Route path="/staffSalary" element={<StaffSalaries />} />
                    <Route path="/duePayments" element={<DuePayments />} />
                    <Route path="/monthlyfee" element={<MonthlyFees />} />
                    <Route path="/donors" element={<Donors />} />
                    <Route path="/donorTracking" element={<DonorTracking />} />
                    <Route path="/markAttendance" element={<MarkAttendance />} />
                    <Route path="/viewAttendance" element={<ViewAttendance />} />
                    <Route path="/graveReservations" element={<GraveReservations />} />
                    
                  </Routes>
                </div>
              </div>
            </ProtectedRoutes>
          }
        />
      </Routes>

    </>

  )
}

export function ProtectedRoutes(props) {
  const userStr = localStorage.getItem('user');
  let user = null;

  try {
    user = JSON.parse(userStr);
  } catch (error) {
    user = null; // in case of malformed JSON
  }

  if (user && user.userName && user._id && location.pathname !== "/login") {
    return props.children;
  } else {
      return <Navigate to='/login' />;
  }
}

export function ProtectedAdminRoute({ children }) {
  const userStr = localStorage.getItem('user');
  let user = null;

  try {
    user = JSON.parse(userStr);
  } catch (error) {
    user = null; // in case of malformed JSON
  }
  if ((!user || !user.isAdmin) && location.pathname !== "/") { 
    return <Navigate to="/" />;
  }

  return children;
};

export default App
