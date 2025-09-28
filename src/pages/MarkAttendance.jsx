import { useEffect, useState } from "react";
import { Table, DatePicker, Button, message, Card, Radio, Space, Row, Col } from "antd";
import axios from "axios";
import dayjs from "dayjs";
import "./MarkAttendance.css";
import { SaveOutlined } from "@ant-design/icons";

const attendanceOptions = [
    { value: 1, label: "Present", color: "#28a745" },
    { value: 2, label: "Absent", color: "#dc3545" },
    { value: 3, label: "Leave", color: "#fd7e14" },
    { value: 4, label: "Weekend", color: "#007bff" },
    { value: 5, label: "Holiday", color: "#6f42c1" },
];

const MarkAttendance = () => {
    const [students, setStudents] = useState([]);
    const [date, setDate] = useState(dayjs());
    const [attendance, setAttendance] = useState({});
    const [loading, setLoading] = useState(false);

    const API = import.meta.env.VITE_API_BASE_URL;
    const clientHeader = { "X-Client": window.location.hostname.split(".")[0] };
    const selectedEntity = JSON.parse(localStorage.getItem("selectedEntity") || "null");

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

    useEffect(() => {
        fetchStudents();
    }, []);

    const handleSave = async () => {
        try {
            setLoading(true);
            const payload = {
                date: date.toISOString(),
                records: students.map(s => ({
                    studentId: s._id,
                    status: attendance[s._id] || 0,
                })),
                user: JSON.parse(localStorage.getItem("user"))?._id,
            };
            await axios.post(`${API}/attendance/bulk`, payload, { headers: clientHeader });
            message.success("Attendance saved successfully");
        } catch (err) {
            message.error(err?.response?.data?.message || "Save failed");
        }
        setLoading(false);
    };

    const markAll = (statusValue) => {
        const updated = {};
        students.forEach(s => {
            updated[s._id] = statusValue;
        });
        setAttendance(updated);
    };

    const columns = [
        { title: "Student Name", dataIndex: "name", key: "name", align: "center" },
        {
            title: `Attendance for ${date.format("dddd DD MMMM YYYY")}`,
            key: "attendance",
            align: "center",
            render: (record) => (
                <Radio.Group
                    className="attendance-radio-group"
                    value={attendance[record._id]}
                    onChange={(e) => setAttendance({ ...attendance, [record._id]: e.target.value })}
                >
                    {attendanceOptions.map(opt => (
                        <Radio.Button
                            key={opt.value}
                            value={opt.value}
                            className="attendance-radio"
                            style={{ "--color": opt.color }}
                        >
                            {opt.label}
                        </Radio.Button>
                    ))}
                </Radio.Group>
            ),
        }

    ];

    return (
        <div >
            <Card variant="borderless" style={{ boxShadow:"none"}}>
                <div className="mb-3">
                    <Row gutter={[16, 16]} align="middle">
                        {/* Title - always left */}
                        <Col xs={24} md={6}>
                            <h4 className="m-0">Mark Attendance</h4>
                        </Col>

                        {/* Date + Mark All (centered on desktop) */}
                        <Col xs={24} md={12}>
                            <div className="d-flex flex-column flex-md-row justify-content-md-center align-items-center gap-2">
                                <DatePicker
                                    value={date}
                                    onChange={setDate}
                                    style={{ width: 200 }}
                                    format="DD MMM YYYY"
                                />
                                <div>
                                <Button
                                    onClick={() => markAll(4)}
                                    style={{
                                        border: "1px solid #007bff",
                                        color: "#007bff"
                                    }}
                                >
                                    Mark All Weekend
                                </Button>
                                <Button
                                    onClick={() => markAll(5)}
                                    style={{
                                        border: "1px solid #6f42c1",
                                        color: "#6f42c1",
                                            marginLeft: "0.5rem"
                                    }}
                                >
                                    Mark All Holiday
                                </Button>
                                </div>

                            </div>
                        </Col>

                        {/* Save button - right on desktop, full row on mobile */}
                        <Col xs={24} md={6} className="text-md-end text-center">
                            <Button
                                type="primary"
                                icon={<SaveOutlined />}
                                onClick={handleSave}
                                loading={loading}
                                style={{
                                    background: "linear-gradient(to bottom right, #029bd2, #20c997)",
                                    borderColor: "#20c997",
                                }}
                            >
                                Save Attendance
                            </Button>
                        </Col>
                    </Row>
                </div>

                {/* Table */}
                <Table
                    dataSource={students}
                    columns={columns}
                    rowKey="_id"
                    pagination={false}
                    bordered
                    scroll={{ x: true }}
                />
            </Card>
        </div>
    );

};

export default MarkAttendance;
