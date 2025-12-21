import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Select,
  DatePicker,
  Card,
  Table,
  Tag,
  message,
  Radio,
  Row,
  Col,
  Statistic,
  Tooltip,
  Empty,
} from "antd";
import axios from "axios";
import dayjs from "dayjs";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  CalendarOutlined,
  TableOutlined,
} from "@ant-design/icons";
import "./ViewAttendance.css";

const { Option } = Select;

// --- STATUS DEFINITIONS & COLOR SCHEME (Kept the same for consistency) ---
// const ATTENDANCE_STATUS_MAP = {
//     1: { label: "P", color: "#28a745", fullLabel: "Present" },
//     2: { label: "A", color: "#dc3545", fullLabel: "Absent" },
//     3: { label: "L", color: "#ffc107", fullLabel: "Leave" },
//     4: { label: "H/D", color: "#007bff", fullLabel: "Half Day" },
//     5: { label: "W/E", color: "#6f42c1", fullLabel: "Weekend" },
//     6: { label: "H", color: "#17a2b8", fullLabel: "Holiday" },
//     0: { label: "", color: "default", fullLabel: "" },
// };

const ATTENDANCE_STATUS_MAP = {
  1: { label: "Present", color: "#28a745", fullLabel: "Present" },
  2: { label: "Absent", color: "#dc3545", fullLabel: "Absent" },
  3: { label: "Leave", color: "#ffc107", fullLabel: "Leave" },
  4: { label: "Half Day", color: "#007bff", fullLabel: "Half Day" },
  5: { label: "Weekend", color: "#6f42c1", fullLabel: "Weekend" },
  6: { label: "Holiday", color: "#17a2b8", fullLabel: "Holiday" },
  0: { label: "-", color: "default", fullLabel: "-" },
};

const TASK_STATUS_MAP = {
  2: { label: "Yes", color: "#28a745", icon: <CheckCircleOutlined /> },
  1: { label: "No", color: "#dc3545", icon: <CloseCircleOutlined /> },
  0: { label: "-", color: "default", icon: "" },
};

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const ViewAttendance = ({ entityType }) => {
  const [persons, setPersons] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [month, setMonth] = useState(dayjs());
  const [report, setReport] = useState({
    monthlySummary: {},
    dailyRecords: [],
    tasksList: [],
  });
  const [viewMode, setViewMode] = useState("calendar");
  const [calendarMode, setCalendarMode] = useState("attendance");
  const [loading, setLoading] = useState(false);
  const [personLoading, setPersonLoading] = useState(false); // New state for separate person list loading

  const API = import.meta.env.VITE_API_BASE_URL;
  const clientHeader = useMemo(
    () => ({ "X-Client": window.location.hostname.split(".")[0] }),
    []
  );
  const selectedEntity = useMemo(
    () => JSON.parse(localStorage.getItem("selectedEntity") || "null"),
    []
  );

  const personTypeLabel = entityType === "Student" ? "Student" : "Staff";
  const reportTitle = `${personTypeLabel} Attendance & Checklist`;

  // 1. Fetch the list of Students/Staff
  const fetchPersons = useCallback(async () => {
    // Clear previous selection and report when entityType changes
    setSelectedPerson(null);
    setReport({ monthlySummary: {}, dailyRecords: [], tasksList: [] });

    setPersonLoading(true);
    try {
      // FIX 3: Implemented the corrected API URL logic
      const entityPath = entityType === "Student" ? "students" : "staff";
      let url = `${API}/${entityPath}?status=active`;

      if (selectedEntity && selectedEntity.EntityId) {
        url += `&entity=${selectedEntity.EntityId}`;
      }

      const res = await axios.get(url, { headers: clientHeader });

      // FIX 3: Implemented the corrected response parsing logic
      const personList = res.data[entityPath] || [];
      setPersons(personList);

      // Automatically select the first person if available
      if (personList.length > 0) {
        setSelectedPerson(personList[0]._id);
      } else {
        setSelectedPerson(null);
      }
    } catch (error) {
      message.error(`Failed to load ${personTypeLabel} list.`);
      setPersons([]);
      setSelectedPerson(null);
    } finally {
      setPersonLoading(false);
    }
    // FIX 2: Added entityType to dependencies to re-run when page/prop changes
  }, [API, clientHeader, selectedEntity, entityType, personTypeLabel]);

  // 2. Fetch the Attendance Report (Logic remains mostly the same)
  const fetchAttendanceReport = useCallback(async () => {
    if (!selectedPerson || !month) {
      setReport({ monthlySummary: {}, dailyRecords: [], tasksList: [] });
      return;
    }

    setLoading(true);
    try {
      const url = `${API}/attendance/report`;
      const params = {
        personId: selectedPerson,
        month: month.month() + 1, // dayjs month is 0-indexed, API expects 1-indexed
        year: month.year(),
        entityType: entityType,
      };
      const res = await axios.get(url, { params, headers: clientHeader });
      const newReport = res.data.report;
      setReport(newReport);

      // Re-check calendarMode if the selected task is no longer available
      if (
        calendarMode !== "attendance" &&
        !newReport.tasksList.find((t) => t.taskId === calendarMode)
      ) {
        setCalendarMode("attendance");
      }
    } catch (error) {
      message.error("Failed to load attendance report.");
      setReport({ monthlySummary: {}, dailyRecords: [], tasksList: [] });
    } finally {
      setLoading(false);
    }
  }, [API, clientHeader, selectedPerson, month, entityType, calendarMode]);

  // Initialization and Prop Change Handler
  // FIX 2: Runs whenever entityType changes (page switch) or on initial mount.
  useEffect(() => {
    fetchPersons();
  }, [fetchPersons, entityType]); // entityType is included for clarity, though fetchPersons handles the re-run

  // Data Fetch Trigger (Runs whenever selectedPerson or month changes)
  useEffect(() => {
    fetchAttendanceReport();
  }, [selectedPerson, month, fetchAttendanceReport]);

  const daysInMonth = month.daysInMonth();
  const startDayOfWeek = month.startOf("month").day();
  const firstDayOffset = (startDayOfWeek === 0 ? 7 : startDayOfWeek) - 1;

  const renderCalendarTag = (dailyRecord) => {
    if (!dailyRecord) return null;

    let tagData = null;
    let remarks = null;
    let tagLabel = "";

    if (calendarMode === "attendance") {
      const status = dailyRecord.attendance.status;
      tagData = ATTENDANCE_STATUS_MAP[status] || ATTENDANCE_STATUS_MAP[0];
      remarks = dailyRecord.attendance.remarks;
      tagLabel = tagData.label;
    } else {
      const status = dailyRecord.tasks[calendarMode] || 0;
      tagData = TASK_STATUS_MAP[status] || TASK_STATUS_MAP[0];
      remarks = dailyRecord.tasksRemarks;
      tagLabel = tagData.label;
    }

    const tag = (
      <Tag
        color={tagData.color}
        style={{
          fontSize: 10,
          lineHeight: "16px",
          padding: "0 4px",
          margin: "2px 0",
        }}
      >
        {tagLabel}
      </Tag>
    );

    return remarks ? (
      <Tooltip title={remarks} placement="top">
        {tag}
      </Tooltip>
    ) : (
      tag
    );
  };

  const renderSummary = () => {
    const { monthlySummary } = report;
    const totalDays = report.dailyRecords.length;

    if (totalDays === 0) return null;

    const taskSummaryItems = report.tasksList.map((task) => {
      const summary = monthlySummary.tasks
        ? monthlySummary.tasks[task.taskId]
        : { done: 0, notDone: 0 };
      const totalMarked = summary.done + summary.notDone;
      return (
        <Col key={task.taskId} xs={24} sm={12} md={8} lg={4}>
          <Card size="small" className="summary-card task-card">
            <Statistic
              title={`${task.name} (Done)`}
              value={summary.done}
              suffix={totalMarked > 0 ? `/ ${totalMarked}` : ""}
              valueStyle={{ color: TASK_STATUS_MAP[2].color, fontSize: 18 }}
            />
          </Card>
        </Col>
      );
    });

    return (
      <>
        <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
          {/* Attendance Summary Cards (Layout improved for responsiveness) */}
          <Col xs={12} sm={8} md={4} lg={3}>
            <Card size="small" className="summary-card present-card">
              <Statistic
                title="Present"
                value={monthlySummary.present}
                valueStyle={{
                  color: ATTENDANCE_STATUS_MAP[1].color,
                  fontSize: 18,
                }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4} lg={3}>
            <Card size="small" className="summary-card absent-card">
              <Statistic
                title="Absent"
                value={monthlySummary.absent}
                valueStyle={{
                  color: ATTENDANCE_STATUS_MAP[2].color,
                  fontSize: 18,
                }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4} lg={3}>
            <Card size="small" className="summary-card leave-card">
              <Statistic
                title="Leave"
                value={monthlySummary.leave}
                valueStyle={{
                  color: ATTENDANCE_STATUS_MAP[3].color,
                  fontSize: 18,
                }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4} lg={3}>
            <Card size="small" className="summary-card notmarked-card">
              <Statistic
                title="Not Marked"
                value={monthlySummary.notMarked}
                valueStyle={{
                  color: ATTENDANCE_STATUS_MAP[0].color,
                  fontSize: 18,
                }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4} lg={3}>
            <Card size="small" className="summary-card total-card">
              <Statistic
                title="Half Day"
                value={monthlySummary.halfDay}
                valueStyle={{
                  color: ATTENDANCE_STATUS_MAP[4].color,
                  fontSize: 18,
                }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4} lg={3}>
            <Card size="small" className="summary-card total-card">
              <Statistic
                title="Total Days"
                value={totalDays}
                valueStyle={{ color: "#17a2b8", fontSize: 18 }}
              />
            </Card>
          </Col>
        </Row>
        <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
          {/* Task Summary */}
          {taskSummaryItems}
        </Row>
      </>
    );
  };

  const tableColumns = useMemo(() => {
    // ... (tableColumns implementation remains the same)
    const columns = [
      {
        title: "Date",
        dataIndex: "date",
        align: "center",
        width: 100,
        fixed: "left",
        render: (text) => dayjs(text).format("DD MMM"),
      },
      {
        title: "Day",
        dataIndex: "date",
        align: "center",
        width: 70,
        render: (text) => dayjs(text).format("ddd"),
      },
      {
        title: "Attendance",
        dataIndex: ["attendance", "status"],
        align: "center",
        width: 120,
        render: (status, record) => {
          const data =
            ATTENDANCE_STATUS_MAP[status] || ATTENDANCE_STATUS_MAP[0];
          return (
            <Tooltip
              title={record.attendance.remarks || data.fullLabel}
              placement="topLeft"
            >
              <Tag color={data.color}>{data.fullLabel}</Tag>
            </Tooltip>
          );
        },
      },
    ];

    columns.push({
      title: "Attendance Remarks",
      dataIndex: ["attendance", "remarks"],
      width: 180,
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text} placement="topLeft">
          {text}
        </Tooltip>
      ),
    });

    report.tasksList.forEach((task) => {
      columns.push({
        title: task.name,
        dataIndex: ["tasks", task.taskId],
        align: "center",
        width: 100,
        render: (status) => {
          const data = TASK_STATUS_MAP[status] || TASK_STATUS_MAP[0];
          return (
            <Tooltip title={data.label} placement="topLeft">
              <Tag color={data.color} icon={data.icon} style={{ minWidth: 60 }}>
                {data.label}
              </Tag>
            </Tooltip>
          );
        },
      });
    });

    columns.push({
      title: "Notes/Remarks",
      dataIndex: "tasksRemarks",
      width: 180,
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text} placement="topLeft">
          {text}
        </Tooltip>
      ),
    });

    return columns;
  }, [report.tasksList]);

  return (
    <div style={{ padding: 20 }}>
      <Row
        gutter={[16, 8]}
        align="middle"
        justify={{ xs: "center", sm: "center" }}
        style={{
          width: "100%",
          justifyContent: "space-between",
          padding: "10px",
          marginBottom: "20px",
        }}
      >
        <h5>{reportTitle}</h5>

        {/* Person Selector */}
        <Col xs={24} sm={10} md={8} lg={6} xl={4} style={{ minWidth: 150 }}>
          <Select
            placeholder={`Select ${personTypeLabel}`}
            style={{ width: "100%" }}
            onChange={setSelectedPerson}
            value={selectedPerson}
            allowClear
            showSearch
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
            loading={personLoading} // Use new loading state
          >
            {persons.map((p) => (
              <Option key={p._id} value={p._id}>
                {p.name}
              </Option>
            ))}
          </Select>
        </Col>
        {/* Month Picker */}
        <Col xs={24} sm={10} md={8} lg={6} xl={4} style={{ minWidth: 120 }}>
          <DatePicker
            picker="month"
            value={month}
            onChange={setMonth}
            style={{ width: "100%" }}
            format="MMM YYYY"
            allowClear={false}
          />
        </Col>
        {/* View Mode Selector */}
        <Col
          xs={24}
          sm={10}
          md={8}
          lg={6}
          xl={4}
          style={{ minWidth: 250, "justify-content": "space-between" }}
        >
          {/* background: 'linear-gradient(to bottom right, #029bd2, #20c997)'  */}
          <Radio.Group
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            optionType="button"
            buttonStyle="solid"
            style={{ width: "100%", display: "flex" }}
          >
            <Radio.Button
              value="calendar"
              style={{
                width: "50%",
                textAlign: "center",
                // Apply gradient if active, otherwise default
                background:
                  viewMode === "calendar"
                    ? "linear-gradient(to bottom right, #029bd2, #20c997)"
                    : "",
                borderColor: viewMode === "calendar" ? "#20c997" : "",
                color: viewMode === "calendar" ? "white" : "",
              }}
            >
              <CalendarOutlined style={{ marginRight: "10px" }} /> Calendar
            </Radio.Button>

            <Radio.Button
              value="table"
              style={{
                width: "50%",
                textAlign: "center",
                // Apply gradient if active, otherwise default
                background:
                  viewMode === "table"
                    ? "linear-gradient(to bottom right, #029bd2, #20c997)"
                    : "",
                borderColor: viewMode === "table" ? "#20c997" : "",
                color: viewMode === "table" ? "white" : "",
              }}
            >
              <TableOutlined style={{ marginRight: "10px" }} /> Table
            </Radio.Button>
          </Radio.Group>
        </Col>
      </Row>

      {(loading || personLoading) && (
        <div style={{ textAlign: "center", padding: 50 }}>
          Loading Report...
        </div>
      )}

      {/* Initial State / No Selection */}
      {!selectedPerson && !loading && !personLoading && (
        <div style={{ textAlign: "center", padding: 50, color: "#999" }}>
          Please select a {personTypeLabel} and a Month to view the report.
        </div>
      )}

      {/* No Data State */}
      {selectedPerson &&
        !loading &&
        !personLoading &&
        report.dailyRecords.length === 0 && (
          <Empty
            description={`No attendance data found for the selected month.`}
            style={{ padding: 50 }}
          />
        )}

      {/* --- Calendar View --- */}
      {viewMode === "calendar" &&
        selectedPerson &&
        !loading &&
        report.dailyRecords.length > 0 && (
          <div style={{ marginTop: 20 }}>
            {/* Calendar Content Selector */}
            <Select
              value={calendarMode}
              onChange={setCalendarMode}
              style={{ width: 250, marginBottom: 15 }}
              placeholder="Select view mode"
            >
              <Option value="attendance">Attendance Status</Option>
              {report.tasksList.map((t) => (
                <Option key={t.taskId} value={t.taskId}>
                  {t.name} (Checklist)
                </Option>
              ))}
            </Select>

            {/* Week headers */}
            <Row
              gutter={[2, 2]}
              className="calendar-weekday-headers"
              style={{ marginBottom: 5 }}
            >
              {weekDays.map((d) => (
                <Col key={d} span={24 / 7} className="calendar-col-7-width">
                  {d}
                </Col>
              ))}
            </Row>

            {/* Calendar Grid */}
            <Row gutter={[2, 2]} className="calendar-grid-container">
              {/* Empty slots before the 1st day */}
              {Array.from({ length: firstDayOffset }).map((_, i) => (
                <Col
                  key={`empty-${i}`}
                  span={24 / 7}
                  className="calendar-grid-cell empty-cell calendar-col-7-width"
                ></Col>
              ))}

              {/* Days of the month */}
              {report.dailyRecords.map((record) => {
                const isToday = dayjs().format("YYYY-MM-DD") === record.date;
                return (
                  <Col
                    key={`day-${record.day}`}
                    span={24 / 7}
                    className={`calendar-grid-cell ${
                      isToday ? "today-cell" : ""
                    } calendar-col-7-width`}
                    style={{
                      background:
                        record.attendance.status === 5 ? "#f0f4ff" : "#fff",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: "bold",
                        marginBottom: 5,
                      }}
                    >
                      {record.day}
                    </div>
                    {renderCalendarTag(record)}
                  </Col>
                );
              })}

              {/* Fill remaining slots */}
              {(() => {
                const totalCells = firstDayOffset + daysInMonth;
                const remaining = 7 - (totalCells % 7);
                if (remaining > 0 && remaining < 7) {
                  return Array.from({ length: remaining }).map((_, i) => (
                    <Col
                      key={`empty-end-${i}`}
                      span={24 / 7}
                      className="calendar-grid-cell empty-cell calendar-col-7-width"
                    ></Col>
                  ));
                }
                return null;
              })()}
            </Row>
          </div>
        )}

      {/* --- Table View --- */}
      {viewMode === "table" &&
        selectedPerson &&
        !loading &&
        report.dailyRecords.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <Table
              dataSource={report.dailyRecords}
              columns={tableColumns}
              rowKey="date"
              pagination={{ pageSize: daysInMonth }}
              bordered
              loading={loading}
              scroll={{ x: 1200 }}
            />
          </div>
        )}

      {/* Content rendering logic remains the same */}
      {selectedPerson &&
        !loading &&
        report.dailyRecords.length > 0 &&
        renderSummary()}
    </div>
  );
};

export default ViewAttendance;
