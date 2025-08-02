import { NavLink, useNavigate } from 'react-router-dom';
import {
    DashboardOutlined,
    UserOutlined,
    PlusCircleOutlined,
    MinusCircleOutlined,
    FolderOpenOutlined,
    LogoutOutlined,
    MessageOutlined,
    MenuOutlined,
} from '@ant-design/icons';
import { useState } from 'react';
import './Sidebar.css';
import { message } from 'antd';

const Sidebar = () => {
    const [collapsed, setCollapsed] = useState(true);
    const navigate = useNavigate();

    const logoutHandler = () => {
        localStorage.removeItem('user');
        message.success('Logout Successfully');
        navigate('/login');
        autoCollapse();
    };

    const autoCollapse = () => {
        if (window.innerWidth < 768) {
            setCollapsed(true);
        }
    };

    return (
        <>
            {/* Mobile Nav */}
            <div className="mobile-nav d-md-none bg-success text-white p-2 d-flex justify-content-between align-items-center">
                <div className="fw-bold fs-6">Income & Expense Management</div>
                <button className="btn btn-success btn-sm" onClick={() => setCollapsed(!collapsed)}>
                    <MenuOutlined />
                </button>
            </div>

            {/* Sidebar */}
            <div className={`sidebar text-white ${collapsed ? 'd-none d-md-block' : ''}`}>
                <div className="sidebar-header text-center p-3 fw-bold fs-5 d-none d-md-block">
                    Income & Expense Management
                </div>

                <nav className="nav flex-column px-2">
                    <div className="menu-section-title">Main</div>
                    <NavLink to="/" className="nav-link text-white" onClick={autoCollapse}>
                        <DashboardOutlined /> Dashboard
                    </NavLink>

                    <div className="menu-section-title">Manage</div>
                    <NavLink to="/users" className="nav-link text-white" onClick={autoCollapse}>
                        <UserOutlined /> Users
                    </NavLink>
                    <NavLink to="/income-categories" className="nav-link text-white" onClick={autoCollapse}>
                        <FolderOpenOutlined /> Income Categories
                    </NavLink>
                    <NavLink to="/expense-categories" className="nav-link text-white" onClick={autoCollapse}>
                        <FolderOpenOutlined /> Expense Categories
                    </NavLink>

                    <div className="menu-section-title">Transactions</div>
                    <NavLink to="/income" className="nav-link text-white" onClick={autoCollapse}>
                        <PlusCircleOutlined /> Add Income
                    </NavLink>
                    <NavLink to="/expense" className="nav-link text-white" onClick={autoCollapse}>
                        <MinusCircleOutlined /> Add Expense
                    </NavLink>

                    <div className="menu-section-title">Support</div>
                    <NavLink to="/contact" className="nav-link text-white" onClick={autoCollapse}>
                        <MessageOutlined /> Contact Developer
                    </NavLink>

                    <button className="nav-link text-white bg-transparent border-0 text-start w-100" onClick={logoutHandler}>
                        <LogoutOutlined /> Logout
                    </button>
                </nav>
            </div>
        </>
    );
};

export default Sidebar;
