import { NavLink, useNavigate } from "react-router-dom";
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
  FolderOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  FileDoneOutlined,
  DotChartOutlined,
  CarryOutOutlined,
  ClusterOutlined,
  ReadOutlined,
} from "@ant-design/icons";
import { useState, useEffect } from "react";
import "./Sidebar.css";
import { message, Modal, Button } from "antd";
import { CONFIG } from "../pages/clientConfig";
import axios from "axios";
import logoEcom from "../assets/LogoEcom.png";
import logoMasjid from "../assets/LogoMasjid.png";
import logoSchool from "../assets/LogoSchool.png";


const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [hasDue, setHasDue] = useState(false);
  // Ensured some sections are closed by default for a clean look
  const [openSections, setOpenSections] = useState({
    main: true,
    manage: false,
    students: false,
    staff: false,
    graveyard: false,
    income: false,
    expense: false,
    support: false,
  });
  const navigate = useNavigate();

  const hasEntities =
    Array.isArray(CONFIG.Entities) && CONFIG.Entities.length > 0;

  const [selectedEntity, setSelectedEntity] = useState(() => {
    if (!hasEntities) return null;
    const saved = localStorage.getItem("selectedEntity");
    return saved ? JSON.parse(saved) : CONFIG.Entities[0];
  });

  const [entityModalOpen, setEntityModalOpen] = useState(false);

  const savedUser = JSON.parse(localStorage.getItem("user") || "null");
  const isAdmin = savedUser?.isAdmin;
  const canViewOtherUsersData = savedUser?.canViewOtherUsersData;
  const AllowedPages =
    CONFIG.PagesToShow ??
    JSON.parse(localStorage.getItem("selectedEntity" || "null"))?.PagesToShow;

  useEffect(() => {
    const checkDue = async () => {
      try {
        const API = import.meta.env.VITE_API_BASE_URL;
        const selectedEntity = JSON.parse(
          localStorage.getItem("selectedEntity" || "null")
        );
        let url = `${API}/due-payments/has-due`;
        if (selectedEntity) url += `?entity=${selectedEntity.EntityId}`;
        const res = await axios.get(url, {
          headers: { "X-Client": window.location.hostname.split(".")[0] },
        });
        setHasDue(res.data.hasDue);
      } catch (err) {
        setHasDue(false);
      }
    };

    checkDue();
  }, []);
  const logoutHandler = () => {
    localStorage.removeItem("user");
    message.success("Logout Successfully");
    navigate("/login");
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

  const title_A =
    CONFIG.SOFTWARE_TYPE === "Masjid"
      ? "MASJID"
      : CONFIG.SOFTWARE_TYPE === "School"
      ? "SCHOOL"
      : "E-COM";
  const title_B = CONFIG.SOFTWARE_TYPE === "ECom" ? "MANAGEMENT" : "MANAGEMENT";

  const titleText = selectedEntity?.Name || title_A + " " + title_B;

  const toggleSection = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <>
      {/* Sidebar - main element with gradient and collapse classes */}
      <div className={`sidebar-gradient ${collapsed ? "collapsed" : "open"}`}>
        {/* Sidebar Header/Branding Area - Removed old toggle button */}
        <div className="sidebar-header-gradient text-center fw-bold d-none d-md-flex justify-content-center align-items-center">
          {!collapsed ? (
            <div >
              <div
                className="app-main-title-gradient text-white flex items-center p-2"
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontSize: "16px",
                }}
              >
                <div>
                 <img
                    src={ 
                      CONFIG.SOFTWARE_TYPE === "Masjid"
                        ? logoMasjid
                        : CONFIG.SOFTWARE_TYPE === "ECom"
                        ? logoEcom
                        : logoSchool
                    }
                    alt="Logo"
                    style={{
                      height: "85px",
                      borderRadius: "15%",
                      marginTop: "5px",
                    }}
                    className="logo-animation"
                  />
                </div>
                <div style={{ paddingLeft: "0px", paddingRight: "25px" }}>
                  <div
                    className="ml-3 font-bold tracking-tight"
                    style={{
                      fontSize: "26px",
                      color: "#dbeefaff",
                      textShadow: "1px 1px 2px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    {title_A}
                  </div>

                  <div
                    className="ml-3 font-medium opacity-80"
                    style={{
                      fontSize: "13px",
                      color: "#dbeefaff",
                      marginTop: "-2px",
                    }}
                  >
                    {title_B}
                  </div>
                </div>
              </div>
              {/* <div className="app-main-title-gradient text-white">
                {title_A + ' '+ title_B}
              </div>
              {hasEntities && (
                <div className="entity-name-display-gradient">
                  {selectedEntity?.Name || "Select Entity"}
                  <DownSquareOutlined className="entity-dropdown-icon-gradient" />
                </div>
              )} */}
            </div>
          ) : (
            <FolderOutlined className="collapsed-app-icon-gradient" />
          )}
        </div>

        {/* Navigation Content */}
        <nav className="nav flex-column sidebar-nav-container-gradient">
          <div style={{ display: "flex", justifyContent: "center" }} className="entity-title-desktop">
            {hasEntities && (
              <div
                className="entity-name-display-gradient"
                style={{ padding: "10px" }}
                onClick={() => hasEntities && setEntityModalOpen(true)}
              >
                {selectedEntity?.Name || "Select Entity"}
                <DownSquareOutlined className="entity-dropdown-icon-gradient" />
              </div>
            )}
          </div>
          {/* Main Section */}
          {(isAdmin || canViewOtherUsersData) && (
            <>
              {/* Main Nav Link (Dashboard) */}
              <NavLink
                to="/"
                className="nav-link-gradient nav-link-parent-main text-white"
                onClick={autoCollapse}
              >
                {/* Dashboard content wrapper for bell placement */}
                <div className="dashboard-content-wrapper">
                  <div className="nav-link-content">
                    <BarChartOutlined /> {!collapsed && "Dashboard"}
                  </div>
                  {/* Bell/Notification Area for Desktop - RESTORED OLD DESIGN */}
                  <div className="d-none d-md-flex" style={{ display: "Flex" }}>
                    {hasDue && (
                      <div
                        className="tgleBtnDiv bellBtn bellBtn2"
                        style={{ backgroundColor: "#20c997" }}
                        onClick={(e) => {
                          e.preventDefault(); // stop NavLink navigation
                          navigate("/?tab=Notifications"); // ✅ open dashboard with tab param
                        }}
                      >
                        <div className="tgleBtnIcon">
                          <BellFilled
                            style={{ color: "white", marginRight: "-0.1rem" }}
                          />
                        </div>
                      </div>
                    )}
                    {hasDue && <div className="notifySign"></div>}
                  </div>
                </div>
              </NavLink>
            </>
          )}

          {/* Manage Section - PARENT MENU */}
          <div
            className="parent-menu-title-gradient d-flex justify-content-between align-items-center"
            onClick={() => toggleSection("manage")}
          >
            <div className="title-content">
              <FolderOutlined />
              {!collapsed && "MANAGE"}
            </div>
            {!collapsed && (
              <DownOutlined
                style={{ fontSize: "1em" }}
                rotate={openSections.manage ? 180 : 0}
              />
            )}
          </div>
          {openSections.manage && (
            <div className="child-menu-container">
              {isAdmin && (
                <NavLink
                  to="/users"
                  className="nav-link-gradient nav-link-child text-white"
                  onClick={autoCollapse}
                >
                  <UserOutlined /> Users
                </NavLink>
              )}
              {AllowedPages && AllowedPages.find((x) => x == "income") && (
                <NavLink
                  to="/income-categories"
                  className="nav-link-gradient nav-link-child text-white"
                  onClick={autoCollapse}
                >
                  <FolderOpenOutlined /> Income Categories
                </NavLink>
              )}
              <NavLink
                to="/expense-categories"
                className="nav-link-gradient nav-link-child text-white"
                onClick={autoCollapse}
              >
                <FolderOpenOutlined /> Expense Categories
              </NavLink>
              {AllowedPages && AllowedPages.find((x) => x == "income") && (
                <>
                  <NavLink
                    to="/asset-types"
                    className="nav-link-gradient nav-link-child text-white"
                    onClick={autoCollapse}
                  >
                    <AppstoreAddOutlined /> Asset Types
                  </NavLink>
                  <NavLink
                    to="/donors"
                    className="nav-link-gradient nav-link-child text-white"
                    onClick={autoCollapse}
                  >
                    <UsergroupAddOutlined /> Regular Donors
                  </NavLink>
                </>
              )}

              {AllowedPages && AllowedPages.find((x) => x == "students") && (
                <>
                <NavLink
                    to="/student-classes"
                    className="nav-link-gradient nav-link-child text-white"
                    onClick={autoCollapse}
                  >
                    <ReadOutlined /> Classes
                  </NavLink>
                <NavLink
                  to="/student-checklist"
                  className="nav-link-gradient nav-link-child text-white"
                  onClick={autoCollapse}
                >
                  <OrderedListOutlined /> Student Checklist Items
                </NavLink>
                </>
              )}
              {AllowedPages && AllowedPages.find((x) => x == "staff") && (
                <>
                <NavLink
                    to="/staff-designations"
                    className="nav-link-gradient nav-link-child text-white"
                    onClick={autoCollapse}
                  >
                    <ClusterOutlined /> Staff Designations
                  </NavLink>
                <NavLink
                  to="/staff-checklist"
                  className="nav-link-gradient nav-link-child text-white"
                  onClick={autoCollapse}
                >
                  <UnorderedListOutlined /> Staff Checklist Items
                </NavLink>
                
                  </>
                
              )}
            </div>
          )}

          {/* Income Section - PARENT MENU */}
          {AllowedPages && AllowedPages.find((x) => x == "income") && (
            <>
              <div
                className="parent-menu-title-gradient d-flex justify-content-between align-items-center"
                onClick={() => toggleSection("income")}
              >
                <div className="title-content">
                  <PlusSquareOutlined />
                  {!collapsed && "INCOME"}
                </div>
                {!collapsed && (
                  <DownOutlined
                    style={{ fontSize: "1em" }}
                    rotate={openSections.income ? 180 : 0}
                  />
                )}
              </div>
              {openSections.income && (
                <div className="child-menu-container">
                  <NavLink
                    to="/donorTracking"
                    className="nav-link-gradient nav-link-child text-white"
                    onClick={autoCollapse}
                  >
                    <GiftOutlined /> Donor Tracking
                  </NavLink>
                  <NavLink
                    to="/income"
                    className="nav-link-gradient nav-link-child text-white"
                    onClick={autoCollapse}
                  >
                    <PlusSquareOutlined /> Income Records
                  </NavLink>
                  <NavLink
                    to="/assets"
                    className="nav-link-gradient nav-link-child text-white"
                    onClick={autoCollapse}
                  >
                    <InsertRowBelowOutlined /> Asset Donations
                  </NavLink>
                </div>
              )}
            </>
          )}

          {/* Expenses Section - PARENT MENU */}
          <div
            className="parent-menu-title-gradient d-flex justify-content-between align-items-center"
            onClick={() => toggleSection("expense")}
          >
            <div className="title-content">
              <MinusSquareOutlined />
              {!collapsed && "EXPENSES"}
            </div>
            {!collapsed && (
              <DownOutlined
                style={{ fontSize: "1em" }}
                rotate={openSections.expense ? 180 : 0}
              />
            )}
          </div>
          {openSections.expense && (
            <div className="child-menu-container">
              <NavLink
                to="/duePayments"
                className="nav-link-gradient nav-link-child text-white"
                onClick={autoCollapse}
              >
                <CalendarOutlined /> Due Payments
              </NavLink>
              <NavLink
                to="/expense"
                className="nav-link-gradient nav-link-child text-white"
                onClick={autoCollapse}
              >
                <MinusSquareOutlined /> Expense Records
              </NavLink>
            </div>
          )}

          {/* Students Section - PARENT MENU */}
          {AllowedPages && AllowedPages.find((x) => x == "students") && (
            <>
              <div
                className="parent-menu-title-gradient d-flex justify-content-between align-items-center"
                onClick={() => toggleSection("students")}
              >
                <div className="title-content">
                  <TeamOutlined />
                  {!collapsed && "STUDENTS"}
                </div>
                {!collapsed && (
                  <DownOutlined
                    style={{ fontSize: "1em" }}
                    rotate={openSections.students ? 180 : 0}
                  />
                )}
              </div>
              {openSections.students && (
                <div className="child-menu-container">
                  <NavLink
                    to="/students"
                    className="nav-link-gradient nav-link-child text-white"
                    onClick={autoCollapse}
                  >
                    <TeamOutlined /> All Students
                  </NavLink>
                  <NavLink
                    to="/monthlyfee"
                    className="nav-link-gradient nav-link-child text-white"
                    onClick={autoCollapse}
                  >
                    <BookOutlined /> Monthly Fee
                  </NavLink>
                  <NavLink
                    to="/markAttendance"
                    className="nav-link-gradient nav-link-child text-white"
                    onClick={autoCollapse}
                  >
                    <CarryOutOutlined /> Mark Attendance
                  </NavLink>
                  <NavLink
                    to="/studentDailyChecklist"
                    className="nav-link-gradient nav-link-child text-white"
                    onClick={autoCollapse}
                  >
                    <FileDoneOutlined /> Daily Checklist
                  </NavLink>
                  <NavLink
                    to="/viewAttendance"
                    className="nav-link-gradient nav-link-child text-white"
                    onClick={autoCollapse}
                  >
                    <DotChartOutlined /> View Attendance
                  </NavLink>
                </div>
              )}
            </>
          )}

          {/* Staff Section - PARENT MENU */}
          {AllowedPages && AllowedPages.find((x) => x == "staff") && (
            <>
              <div
                className="parent-menu-title-gradient d-flex justify-content-between align-items-center"
                onClick={() => toggleSection("staff")}
              >
                <div className="title-content">
                  <IdcardOutlined />
                  {!collapsed && "STAFF"}
                </div>
                {!collapsed && (
                  <DownOutlined
                    style={{ fontSize: "1em" }}
                    rotate={openSections.staff ? 180 : 0}
                  />
                )}
              </div>
              {openSections.staff && (
                <div className="child-menu-container">
                  <NavLink
                    to="/staff"
                    className="nav-link-gradient nav-link-child text-white"
                    onClick={autoCollapse}
                  >
                    <IdcardOutlined /> All Staff
                  </NavLink>
                  <NavLink
                    to="/staffSalary"
                    className="nav-link-gradient nav-link-child text-white"
                    onClick={autoCollapse}
                  >
                    <SolutionOutlined /> Staff Salaries
                  </NavLink>
                  <NavLink
                    to="/markStaffAttendance"
                    className="nav-link-gradient nav-link-child text-white"
                    onClick={autoCollapse}
                  >
                    <CarryOutOutlined /> Mark Attendance
                  </NavLink>
                  <NavLink
                    to="/staffDailyChecklist"
                    className="nav-link-gradient nav-link-child text-white"
                    onClick={autoCollapse}
                  >
                    <FileDoneOutlined /> Daily Checklist
                  </NavLink>
                  <NavLink
                    to="/viewStaffAttendance"
                    className="nav-link-gradient nav-link-child text-white"
                    onClick={autoCollapse}
                  >
                    <DotChartOutlined /> View Attendance
                  </NavLink>
                </div>
              )}
            </>
          )}

          {/* Graveyard Section - PARENT MENU */}
          {AllowedPages && AllowedPages.find((x) => x == "graveyard") && (
            <>
              <div
                className="parent-menu-title-gradient d-flex justify-content-between align-items-center"
                onClick={() => toggleSection("graveyard")}
              >
                <div className="title-content">
                  <GatewayOutlined />
                  {!collapsed && "GRAVEYARD"}
                </div>
                {!collapsed && (
                  <DownOutlined
                    style={{ fontSize: "1em" }}
                    rotate={openSections.graveyard ? 180 : 0}
                  />
                )}
              </div>
              {openSections.graveyard && (
                <div className="child-menu-container">
                  <NavLink
                    to="/graveReservations"
                    className="nav-link-gradient nav-link-child text-white"
                    onClick={autoCollapse}
                  >
                    <GatewayOutlined /> Grave Reservations
                  </NavLink>
                </div>
              )}
            </>
          )}

          {/* Support Section - PARENT MENU */}
          <div
            className="parent-menu-title-gradient d-flex justify-content-between align-items-center"
            onClick={() => toggleSection("support")}
          >
            <div className="title-content">
              <MessageOutlined />
              {!collapsed && "SUPPORT"}
            </div>
            {!collapsed && (
              <DownOutlined
                style={{ fontSize: "1em" }}
                rotate={openSections.support ? 180 : 0}
              />
            )}
          </div>
          {openSections.support && (
            <div className="child-menu-container">
              <NavLink
                to="/contact"
                className="nav-link-gradient nav-link-child text-white"
                onClick={autoCollapse}
              >
                <MessageOutlined /> Contact Developer
              </NavLink>
            </div>
          )}

          {/* Logout Button */}
          <button
            className="nav-link-gradient logout-btn-gradient text-white bg-transparent border-0 text-start w-100"
            onClick={logoutHandler}
          >
            <LogoutOutlined /> {!collapsed && "Logout"}
          </button>
        </nav>
      </div>

      {/* DESKTOP COLLAPSE BUTTON */}
      <div
        className="d-none d-md-block"
        style={{
          width: "0px",
          marginLeft: collapsed ? "-1.1rem" : "-1.1rem",
          marginRight: "1.1rem",
          zIndex: 1000,
          marginTop: "2.5rem",
          position: "fixed", 
          left: collapsed ? "55px" : "260px",
          transition: "all 0.3s ease-in-out",
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

      {/* Mobile Nav - Uses the full gradient now */}
      <div className="mobile-nav-gradient d-md-none p-3 d-flex justify-content-between align-items-center">
        {/* Bell/Notification Area for Mobile  */}
        <div style={{ display: "Flex" }}>
          {hasDue && (
            <div
              className="tgleBtnDiv bellBtn"
              style={{ backgroundColor: "#20c997" }}
              onClick={(e) => {
                navigate("/?tab=Notifications");
              }}
            >
              <div className="tgleBtnIcon">
                <BellFilled
                  style={{ color: "white", marginRight: "-0.1rem" }}
                />
              </div>
            </div>
          )}
          {hasDue && <div className="notifySign"></div>}
        </div>

        {/* Title/Entity Selector for Mobile */}
        <div
          className="fw-bold d-flex align-items-center mobile-entity-title-gradient"
          onClick={() => hasEntities && setEntityModalOpen(true)}
        >
          {titleText}
          {hasEntities && (
            <DownSquareOutlined className="entity-dropdown-icon-gradient" />
          )}
        </div>

        {/* Menu Toggle Button for Mobile */}
        <button
          className="btn btn-sm mobile-menu-toggle-btn-gradient"
          onClick={() => setCollapsed(!collapsed)}
        >
          <MenuOutlined />
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
                type={
                  selectedEntity?.EntityId === entity.EntityId
                    ? "primary"
                    : "default"
                }
                block
                className="mb-2 modal-entity-button-gradient"
                onClick={() => handleEntitySelect(entity)}
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
