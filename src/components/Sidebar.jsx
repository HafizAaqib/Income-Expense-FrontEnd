import { NavLink, useNavigate } from 'react-router-dom';
import {
    DashboardOutlined,
    UserOutlined,
    FolderOpenOutlined,
    LogoutOutlined,
    MessageOutlined,
    MenuOutlined,
    AppstoreAddOutlined,
    InsertRowBelowOutlined,
    BarChartOutlined,
    PlusSquareOutlined,
    MinusSquareOutlined,
    DownOutlined,
    DownCircleOutlined,
    DownSquareOutlined
} from '@ant-design/icons';
import { useState } from 'react';
import './Sidebar.css';
import { message, Modal, Button, theme } from 'antd';
import { CONFIG } from "../pages/clientConfig";

const Sidebar = () => {
    const [collapsed, setCollapsed] = useState(true);
    const navigate = useNavigate();

    const hasEntities = Array.isArray(CONFIG.Entities) && CONFIG.Entities.length > 0;

    // Load saved entity from localStorage or fallback to first if available
    const [selectedEntity, setSelectedEntity] = useState(() => {
        if (!hasEntities) return null;
        const saved = localStorage.getItem("selectedEntity");
        return saved ? JSON.parse(saved) : CONFIG.Entities[0];
    });

    // Modal state
    const [entityModalOpen, setEntityModalOpen] = useState(false);

    const savedUser = JSON.parse(localStorage.getItem('user') || 'null');
    const isAdmin = savedUser?.isAdmin;
    const canViewOtherUsersData = savedUser?.canViewOtherUsersData;

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

    // Handle entity selection
    const handleEntitySelect = (entity) => {
        setSelectedEntity(entity);
        localStorage.setItem("selectedEntity", JSON.stringify(entity));
        setEntityModalOpen(false);
        //message.success(`${entity.Name} selected`);
        window.location.reload();
    };

    const titleText = selectedEntity?.Name || "Income & Expense Management";

    return (
        <>
            {/* Mobile Nav */}
            <div className="mobile-nav d-md-none text-white p-2 d-flex justify-content-between align-items-center">
                <div></div>
                <div
                    className="fw-bold fs-6 d-flex align-items-center"
                    style={{ cursor: hasEntities ? "pointer" : "default" , fontFamily: hasEntities ? "NotoNastaliqUrdu" : "" }}
                    onClick={() => hasEntities && setEntityModalOpen(true)}
                    >
                    {titleText}
                    {hasEntities && <DownSquareOutlined style={{ fontSize: "1.2rem", marginLeft: "6px", marginTop: "0.4rem" }} />}
                </div>
                <button
                    className="btn btn-success btn-sm"
                    onClick={() => setCollapsed(!collapsed)}
                    style={{ backgroundColor: "#20c997", borderColor: "#ffffff" }}
                >
                    <MenuOutlined />
                </button>
            </div>

            {/* Sidebar */}
            <div className={`sidebar text-white ${collapsed ? '' : 'open'}`}>
                <div className="sidebar-header text-center p-3 fw-bold fs-5 d-none d-md-flex flex-column align-items-center">
                    <div
                        className="d-flex align-items-center"
                        style={{ cursor: hasEntities ? "pointer" : "default"  , fontFamily: hasEntities ? "NotoNastaliqUrdu" : "" }}
                        onClick={() => hasEntities && setEntityModalOpen(true)}
                    >
                        {titleText}
                        {hasEntities && <DownSquareOutlined style={{ fontSize: "1.2rem", marginLeft: "6px", marginTop: "0.8rem" }} />}
                    </div>
                </div>

                <nav className="nav flex-column px-2">
                    {(isAdmin || canViewOtherUsersData) &&
                        <>
                            <div className="menu-section-title">Main</div>
                            <NavLink to="/" className="nav-link text-white" onClick={autoCollapse}>
                                <BarChartOutlined /> Dashboard
                            </NavLink>
                        </>}

                    <div className="menu-section-title">Manage</div>
                    {isAdmin && (
                        <NavLink to="/users" className="nav-link text-white" onClick={autoCollapse}>
                            <UserOutlined /> Users
                        </NavLink>
                    )}
                    <NavLink to="/income-categories" className="nav-link text-white" onClick={autoCollapse}>
                        <FolderOpenOutlined /> Income Categories
                    </NavLink>
                    <NavLink to="/expense-categories" className="nav-link text-white" onClick={autoCollapse}>
                        <FolderOpenOutlined /> Expense Categories
                    </NavLink>
                    <NavLink to="/asset-types" className="nav-link text-white" onClick={autoCollapse}>
                        <AppstoreAddOutlined /> Asset Types
                    </NavLink>

                    <div className="menu-section-title">Transactions</div>
                    <NavLink to="/income" className="nav-link text-white" onClick={autoCollapse}>
                        <PlusSquareOutlined /> Add Income
                    </NavLink>
                    <NavLink to="/expense" className="nav-link text-white" onClick={autoCollapse}>
                        <MinusSquareOutlined /> Add Expense
                    </NavLink>
                    <NavLink to="/assets" className="nav-link text-white" onClick={autoCollapse}>
                        <InsertRowBelowOutlined /> Asset Donations
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

            {/* Entity Selector Modal */}
            {hasEntities && (
                <Modal
                    title="Select Entity / ادارہ"
                    open={entityModalOpen}
                    onCancel={() => setEntityModalOpen(false)}
                    footer={null}
                >
                    <div style={{padding:"30px"}}>
                    {CONFIG.Entities.map((entity) => (
                        <Button
                            key={entity.EntityId}
                            type={selectedEntity?.EntityId === entity.EntityId ? "primary" : "default"}
                            block
                            className="mb-2"
                            onClick={() => handleEntitySelect(entity)}
                            style={{ background: "linear-gradient(to bottom right, #029bd2, #20c997)", borderColor: "#20c997" ,
                                fontFamily: "NotoNastaliqUrdu" , height:"50px" , margin:"5px 0px"
                             }}
                        >
                            {entity.Name}
                        </Button>
                    ))}
                    </div>
                </Modal>
            )}
        </>
    );
};

export default Sidebar;
