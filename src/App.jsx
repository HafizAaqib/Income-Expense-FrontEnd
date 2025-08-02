import { useState } from 'react'
import reactLogo from './assets/react.svg'
import './App.css'
import { Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './pages/HomePage'
import Login from './pages/Login'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import Contact from './pages/Contact'
import Users from './pages/Users'
import Categories from './pages/Categories'
import Transactions from './pages/Transactions'

function App() {
  const savedUser = JSON.parse(localStorage.getItem('user'));
  const isAdmin = savedUser?.isAdmin;
  console.log(savedUser);
  console.log(isAdmin);
  return (
    <>

      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes with Sidebar */}
        <Route
          path="*"
          element={
            <ProtectedRoutes>
              <div className="d-flex flex-column flex-md-row">
                <Sidebar />
                <div className="flex-grow-1 p-3">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    {isAdmin && <Route path="/users" element={<Users />} />}
                    <Route path="/income-categories" element={<Categories type="income" />} />
                    <Route path="/expense-categories" element={<Categories type="expense" />} />
                    <Route path="/income" element={<Transactions type="income" />} />
                    <Route path="/expense" element={<Transactions type="expense" />} />
                    <Route path="/contact" element={<Contact />} />
                  </Routes>
                </div>
              </div>
            </ProtectedRoutes>
          }
        />
      </Routes>

    </>

    /* <a href=""> <img src={reactLogo} className="logo react" alt="React logo" /> </a> */

  )
}

export function ProtectedRoutes(props) {
  if (localStorage.getItem('user')) {
    return props.children
  } else {
    return <Navigate to='/login' />
  }
}

export default App
