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
  CalendarOutlined,
  TeamOutlined,
  BookOutlined,
  LeftCircleFilled,
  RightCircleFilled,
  UsergroupAddOutlined,
  GiftOutlined,
  DownSquareOutlined,
  BellFilled,
  IdcardOutlined,
  SolutionOutlined,
  GatewayOutlined,
} from '@ant-design/icons';
import { useState } from 'react';
import './Sidebar.css';
import { message, Modal, Button, Flex } from 'antd';
import { CONFIG } from "../pages/clientConfig";
import { useEffect } from 'react';
import axios from "axios";

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [hasDue, setHasDue] = useState(false);

  const [openSections, setOpenSections] = useState({
    main: true,
    manage: false,
    students: false,
    staff: false,
    graveyard: false,
    income: true,
    expense: true,
    support: false,
  });
  const navigate = useNavigate();

  const hasEntities = Array.isArray(CONFIG.Entities) && CONFIG.Entities.length > 0;

  const [selectedEntity, setSelectedEntity] = useState(() => {
    if (!hasEntities) return null;
    const saved = localStorage.getItem("selectedEntity");
    return saved ? JSON.parse(saved) : CONFIG.Entities[0];
  });

  const [entityModalOpen, setEntityModalOpen] = useState(false);

  const savedUser = JSON.parse(localStorage.getItem('user') || 'null');
  const isAdmin = savedUser?.isAdmin;
  const canViewOtherUsersData = savedUser?.canViewOtherUsersData;

  useEffect(() => {
    console.log('useEffect')
    const checkDue = async () => {
      console.log('useEffect2')

      try {
        const API = import.meta.env.VITE_API_BASE_URL;
        const selectedEntity = JSON.parse(localStorage.getItem("selectedEntity") || "null");
        let url = `${API}/due-payments/has-due`;
        if (selectedEntity) url += `?entity=${selectedEntity.EntityId}`;
        const res = await axios.get(url, { headers: { "X-Client": window.location.hostname.split(".")[0] } });
        setHasDue(res.data.hasDue);
      } catch (err) {
        console.log('err', err)
        setHasDue(false);
      }
    };

    checkDue();
  }, []);
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

  const handleEntitySelect = (entity) => {
    setSelectedEntity(entity);
    localStorage.setItem("selectedEntity", JSON.stringify(entity));
    setEntityModalOpen(false);
    window.location.reload();
  };

  const titleText = selectedEntity?.Name || "Income & Expense Management";

  const toggleSection = (key) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <>
      {/* Mobile Nav */}
      <div className="mobile-nav d-md-none text-white p-2 d-flex justify-content-between align-items-center">
        <div style={{ display: "Flex" }}>


          {hasDue && <div className="tgleBtnDiv bellBtn"
            style={{ backgroundColor: "#20c997" }}
            onClick={(e) => {
              navigate("/?tab=Notifications"); // ✅ open dashboard with tab param
            }}
          >
            <div className="tgleBtnIcon">
              <BellFilled style={{ color: "white", marginRight: "-0.1rem" }} />
            </div>
          </div>}
          {hasDue && <div className='notifySign'></div>}

        </div>
        <div
          className="fw-bold fs-6 d-flex align-items-center"
          style={{ cursor: hasEntities ? "pointer" : "default", fontFamily: hasEntities ? "NotoNastaliqUrdu" : "" }}
          onClick={() => hasEntities && setEntityModalOpen(true)}
        >
          {titleText}
          {hasEntities && <DownSquareOutlined style={{ fontSize: "1.2rem", marginLeft: "6px", marginTop: "0.4rem" }} />}
        </div>
        <button
          className="btn btn-success btn-sm"
          onClick={() => setCollapsed(!collapsed)}
          style={{ background: "linear-gradient(to bottom right, #029bd2, #20c997)", borderColor: "#ffffff" }}
        >
          <MenuOutlined />
        </button>
      </div>

      {/* Sidebar */}

      <div className={`sidebar text-white ${collapsed ? 'collapsed' : 'open'}`}>
        <div className="sidebar-header text-center fw-bold fs-5 d-none d-md-flex justify-content-around align-items-center
        toggleDiv">

          {/* <div></div> */}
          {!collapsed &&
            <div
              style={{ cursor: hasEntities ? "pointer" : "default", fontFamily: hasEntities ? "NotoNastaliqUrdu" : "" }}
              onClick={() => hasEntities && setEntityModalOpen(true)}
            >
              {titleText}
              {hasEntities && <DownSquareOutlined style={{ fontSize: "1.2rem", marginLeft: "6px", marginTop: "0.8rem" }} />}
            </div>
          }

        </div>

        {!collapsed && <nav className="nav flex-column px-2">
          {(isAdmin || canViewOtherUsersData) && (
            <>
              <div
                className="menu-section-title d-flex justify-content-between align-items-center"
                onClick={() => toggleSection("main")}
                style={{ cursor: "pointer" }}
              >
                Main <DownOutlined rotate={openSections.main ? 180 : 0} />
              </div>
              {openSections.main && (
                <NavLink to="/" className="nav-link text-white" onClick={autoCollapse}>
                  <div style={{
                    display: 'flex', alignItems: "center",
                    justifyContent: "space-between"
                  }}>
                    <div>
                      <BarChartOutlined /> Dashboard

                    </div>
                    <div className='d-md-none'></div>
                    <div className='d-none d-md-flex' style={{ display: "Flex" }}>

                      {hasDue &&
                        <div className="tgleBtnDiv bellBtn bellBtn2"
                          style={{ backgroundColor: "#20c997" }}
                          onClick={(e) => {
                            e.preventDefault(); // stop NavLink navigation
                            navigate("/?tab=Notifications"); // ✅ open dashboard with tab param
                          }}
                        >
                          <div className="tgleBtnIcon">
                            <BellFilled style={{ color: "white", marginRight: "-0.1rem" }} />
                          </div>
                        </div>}
                      {hasDue && <div className='notifySign'></div>}

                    </div>

                  </div>

                </NavLink>
              )}
            </>
          )}

          <div
            className="menu-section-title d-flex justify-content-between align-items-center"
            onClick={() => toggleSection("manage")}
            style={{ cursor: "pointer" }}
          >
            Manage <DownOutlined rotate={openSections.manage ? 180 : 0} />
          </div>
          {openSections.manage && (
            <>
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
              <NavLink to="/donors" className="nav-link text-white" onClick={autoCollapse}>
                <UsergroupAddOutlined /> Regular Donors
              </NavLink>
            </>
          )}

          <div
            className="menu-section-title d-flex justify-content-between align-items-center"
            onClick={() => toggleSection("income")}
            style={{ cursor: "pointer" }}
          >
            Income <DownOutlined rotate={openSections.income ? 180 : 0} />
          </div>
          {openSections.income && (
            <>
              <NavLink to="/donorTracking" className="nav-link text-white" onClick={autoCollapse}>
                <GiftOutlined /> Donor Tracking
              </NavLink>
              <NavLink to="/income" className="nav-link text-white" onClick={autoCollapse}>
                <PlusSquareOutlined /> Income Records
              </NavLink>

              <NavLink to="/assets" className="nav-link text-white" onClick={autoCollapse}>
                <InsertRowBelowOutlined /> Asset Donations
              </NavLink>


            </>
          )}

          <div
            className="menu-section-title d-flex justify-content-between align-items-center"
            onClick={() => toggleSection("expense")}
            style={{ cursor: "pointer" }}
          >
            Expenses <DownOutlined rotate={openSections.expense ? 180 : 0} />
          </div>
          {openSections.expense && (
            <>
              <NavLink to="/duePayments" className="nav-link text-white" onClick={autoCollapse}>
                <CalendarOutlined /> Due Payments
              </NavLink>
              <NavLink to="/expense" className="nav-link text-white" onClick={autoCollapse}>
                <MinusSquareOutlined /> Expense Records
              </NavLink>

            </>
          )}

          <div
            className="menu-section-title d-flex justify-content-between align-items-center"
            onClick={() => toggleSection("students")}
            style={{ cursor: "pointer" }}
          >
            Students <DownOutlined rotate={openSections.students ? 180 : 0} />
          </div>
          {openSections.students && (
            <>
              <NavLink to="/students" className="nav-link text-white" onClick={autoCollapse}>
                <TeamOutlined /> All Students
              </NavLink>
              <NavLink to="/monthlyfee" className="nav-link text-white" onClick={autoCollapse}>
                <BookOutlined /> Monthly Fee
              </NavLink>
            </>
          )}

          <div
            className="menu-section-title d-flex justify-content-between align-items-center"
            onClick={() => toggleSection("staff")}
            style={{ cursor: "pointer" }}
          >
            Staff <DownOutlined rotate={openSections.staff ? 180 : 0} />
          </div>
          {openSections.staff && (
            <>
              <NavLink to="/staff" className="nav-link text-white" onClick={autoCollapse}>
                <IdcardOutlined /> All Staff
              </NavLink>
              <NavLink to="/staffSalary" className="nav-link text-white" onClick={autoCollapse}>
                <SolutionOutlined /> Staff Salaries
              </NavLink>
            </>
          )}

<div
  className="menu-section-title d-flex justify-content-between align-items-center"
  onClick={() => toggleSection("graveyard")}
  style={{ cursor: "pointer" }}
>
  Graveyard <DownOutlined rotate={openSections.graveyard ? 180 : 0} />
</div>
{openSections.graveyard && (
  <>
    <NavLink to="/graveReservations" className="nav-link text-white" onClick={autoCollapse}>
      <GatewayOutlined /> Grave Reservations
    </NavLink>
  </>
)}


          <div
            className="menu-section-title d-flex justify-content-between align-items-center"
            onClick={() => toggleSection("support")}
            style={{ cursor: "pointer" }}
          >
            Support <DownOutlined rotate={openSections.support ? 180 : 0} />
          </div>
          {openSections.support && (
            <>
              <NavLink to="/contact" className="nav-link text-white" onClick={autoCollapse}>
                <MessageOutlined /> Contact Developer
              </NavLink>

            </>
          )}
          <button className="nav-link text-white bg-transparent border-0 text-start w-100" onClick={logoutHandler}>
            <LogoutOutlined /> Logout
          </button>
        </nav>}
      </div>

      <div className='d-none d-md-block'
        style={{
          width: "0px",
          marginLeft: "-1.1rem",
          marginRight: "1.1rem",
          zIndex: 1000,
          marginTop: "2.5rem",
        }}
      >
        <button className="toggleBtn" onClick={() => setCollapsed(!collapsed)}>
          <div className="tgleBtnDiv">
            <div className="tgleBtnIcon">
              {!collapsed && <LeftCircleFilled />}
              {collapsed && <RightCircleFilled />}
            </div>
          </div>
        </button>

      </div>


      {/* Entity Selector Modal */}
      {hasEntities && (
        <Modal
          title="Select Entity / ادارہ"
          open={entityModalOpen}
          onCancel={() => setEntityModalOpen(false)}
          footer={null}
        >
          <div style={{ padding: "30px" }}>
            {CONFIG.Entities.map((entity) => (
              <Button
                key={entity.EntityId}
                type={selectedEntity?.EntityId === entity.EntityId ? "primary" : "default"}
                block
                className="mb-2"
                onClick={() => handleEntitySelect(entity)}
                style={{
                  background: "linear-gradient(to bottom right, #029bd2, #20c997)",
                  borderColor: "#20c997",
                  fontFamily: "NotoNastaliqUrdu",
                  height: "50px",
                  margin: "5px 0px",
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
