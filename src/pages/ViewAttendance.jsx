import { useEffect, useState } from "react";
import { Select, DatePicker, Card, Table, Tag, message, Radio } from "antd";
import axios from "axios";
import dayjs from "dayjs";

const { Option } = Select;

const statusColors = {
  1: "green",
  2: "red",
  3: "orange",
  4: "blue",
  5: "purple",
};

const statusLabels = {
  1: "Present",
  2: "Absent",
  3: "Leave",
  4: "Weekend",
  5: "Holiday",
};

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const ViewAttendance = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [month, setMonth] = useState(dayjs());
  const [attendance, setAttendance] = useState([]);
  const [viewMode, setViewMode] = useState("calendar");

  const API = import.meta.env.VITE_API_BASE_URL;
  const clientHeader = { "X-Client": window.location.hostname.split(".")[0] };
  const selectedEntity = JSON.parse(localStorage.getItem("selectedEntity") || "null");

  // Load students
  const fetchStudents = async () => {
    try {
      let url = `${API}/students?status=active`;
      if (selectedEntity) url += `&entity=${selectedEntity.EntityId}`;
      const res = await axios.get(url, { headers: clientHeader });
      setStudents(res.data.students || []);
    } catch {
      message.error("Failed to load students");
    }
  };

  const fetchAttendance = async () => {
    if (!selectedStudent || !month) return;
    try {
      const url = `${API}/attendance?studentId=${selectedStudent}&month=${month.format("YYYY-MM")}`;
      const res = await axios.get(url, { headers: clientHeader });

      if (res.data?.attendance?.days?.length) {
        setAttendance(res.data.attendance.days);
      } else {
        // Dummy data → random statuses for demo
        const days = month.daysInMonth();
const dummy = Array.from({ length: days }, () => Math.ceil(Math.random() * 5));
setAttendance(dummy);
      }
    } catch {
      // Dummy data if API not available
      const days = month.daysInMonth();
const dummy = Array.from({ length: days }, () => Math.ceil(Math.random() * 5));
setAttendance(dummy);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [selectedStudent, month]);

  const daysInMonth = month.daysInMonth();
  const startDay = month.startOf("month").day(); // Sunday = 0, but we want Monday = 0
  const adjustedStart = startDay === 0 ? 6 : startDay - 1;

  // Table Data
  const tableData = Array.from({ length: daysInMonth }, (_, i) => ({
    key: i + 1,
    date: dayjs(month).date(i + 1).format("DD MMM YYYY"),
    status: attendance[i] || 0,
  }));

  return (
    <div className="container mt-4">
      <Card
        title="View Attendance"
        extra={
          <div className="d-flex gap-2 flex-wrap">
            <Select
              placeholder="Select Student"
              style={{ width: 200 }}
              onChange={setSelectedStudent}
              allowClear
            >
              {students.map((s) => (
                <Option key={s._id} value={s._id}>
                  {s.name}
                </Option>
              ))}
            </Select>
            <DatePicker
              picker="month"
              value={month}
              onChange={setMonth}
              style={{ width: 140 }}
              format="MMM YYYY"
            />
            <Radio.Group
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              optionType="button"
              buttonStyle="solid"
            >
              <Radio.Button value="calendar">Calendar</Radio.Button>
              <Radio.Button value="table">Table</Radio.Button>
            </Radio.Group>
          </div>
        }
      >
        {viewMode === "table" && (
          <Table
            dataSource={tableData}
            pagination={false}
            columns={[
              { title: "Date", dataIndex: "date", align: "center" },
              {
                title: "Status",
                dataIndex: "status",
                align: "center",
                render: (st) =>
                  st ? <Tag color={statusColors[st]}>{statusLabels[st]}</Tag> : "",
              },
            ]}
          />
        )}

        {viewMode === "calendar" && (
  <div>
    {/* Week headers */}
    <div className="row g-1 mb-1 text-center">
      {weekDays.map((d) => (
        <div key={d} className="col text-center fw-bold">
          {d}
        </div>
      ))}
    </div>

    {/* Calendar grid */}
    <div className="row g-1">
      {(() => {
        const daysInMonth = month.daysInMonth();
        const startDay = month.startOf("month").day(); // Sunday = 0
        const adjustedStart = startDay === 0 ? 6 : startDay - 1;

        const cells = [];

        // Empty slots before the 1st day
        for (let i = 0; i < adjustedStart; i++) {
          cells.push(<div key={`empty-${i}`} className="col text-center p-2"></div>);
        }

        // Days of the month
        for (let i = 0; i < daysInMonth; i++) {
          const st = attendance[i] || 0;
          cells.push(
            <div
              key={`day-${i}`}
              className="col text-center p-2"
              style={{
                border: "1px solid #ddd",
                borderRadius: 6,
                background: "#f9f9f9",
                margin: "2px",
                minHeight: 60,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: "bold" }}>{i + 1}</div>
              {st ? (
                <Tag color={statusColors[st]} style={{ fontSize: 10 }}>
                  {statusLabels[st]}
                </Tag>
              ) : null}
            </div>
          );
        }

        // Fill remaining slots to complete last week
        const totalCells = adjustedStart + daysInMonth;
        const remaining = 7 - (totalCells % 7);
        if (remaining < 7) {
          for (let i = 0; i < remaining; i++) {
            cells.push(<div key={`empty-end-${i}`} className="col text-center p-2"></div>);
          }
        }

        // Group into weeks (rows of 7 cols)
        const weeks = [];
        for (let i = 0; i < cells.length; i += 7) {
          weeks.push(
            <div key={`week-${i}`} className="row g-1">
              {cells.slice(i, i + 7)}
            </div>
          );
        }

        return weeks;
      })()}
    </div>
  </div>
)}

      </Card>
    </div>
  );
};

export default ViewAttendance;
