import { useEffect, useState, useCallback } from "react";
import { Table, DatePicker, Button, message, Card, Radio, Space, Row, Col, Input } from "antd";
import axios from "axios";
import dayjs from "dayjs";
import "./MarkAttendance.css";
import { SaveOutlined, ReloadOutlined } from "@ant-design/icons";

const { TextArea } = Input;

const attendanceOptions = [
    { value: 1, label: "Present", color: "#28a745" }, // Green
    { value: 4, label: "Half-Day", color: "#968c03ff" }, // Brown/Yellow
    { value: 2, label: "Absent", color: "#dc3545" }, // Red
    { value: 3, label: "Leave", color: "#fd7e14" }, // Orange
    { value: 5, label: "Weekend", color: "#007bff" }, // Blue
    { value: 6, label: "Holiday", color: "#6f42c1" }, // Purple
    { value: 0, label: "Not Marked", color: "#6c757d" }, // Grey - For initial state/not marked
];

const MarkAttendance = () => {
    const [dailyRecords, setDailyRecords] = useState([]); // Array of { _id, name, status, remarks, ... }
    const [date, setDate] = useState(dayjs());
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();

    const API = import.meta.env.VITE_API_BASE_URL;
    const clientHeader = { "X-Client": window.location.hostname.split(".")[0] };
    
    const selectedEntity = JSON.parse(localStorage.getItem("selectedEntity") || "null");
    const entityId = selectedEntity?.EntityId;

    const entityType = "Student";  // It has two total options for now :- enum: ["Student", "Staff"] 

    // --- Data Fetching (Combines fetching student list and daily attendance data) ---
    const fetchDailyRecords = useCallback(async (selectedDate) => {
        setDataLoading(true);
        try {
            const res = await axios.get(`${API}/attendance/daily-records`, {
                params: { 
                    date: selectedDate.format("YYYY-MM-DD"),
                    entityType: entityType,
                    entity: entityId
                },
                headers: clientHeader,
            });
            
            // The backend is responsible for merging student list and attendance data
            const fetchedRecords = res.data.records.map(record => ({
                ...record,
                status: record.status === undefined ? 0 : record.status, 
            }));
            
            setDailyRecords(fetchedRecords);
            
        } catch (error) {
            messageApi.error(error.response?.data?.message || "Failed to fetch daily records.");
            setDailyRecords([]);
        } finally {
            setDataLoading(false);
        }
    }, [API, clientHeader, messageApi, entityType, entityId]); // dependency on entityId added

    useEffect(() => {
        // Only fetch if entityId is available or if we are loading all (i.e. if entityId is null/undefined)
        if (entityId !== undefined || selectedEntity === null) { 
            fetchDailyRecords(date);
        } else {
             // Handle case where entity loading may still be pending if selectedEntity is being fetched dynamically
             // For now, assume it's available or null.
        }
    }, [date,  entityId, selectedEntity]);

    // --- Handlers ---
    
    const handleDateChange = (newDate) => {
        if (newDate) {
            setDate(newDate);
        }
    };

    const handleAttendanceChange = (studentId, newStatus) => {
        setDailyRecords(prevRecords => 
            prevRecords.map(record => 
                record._id === studentId 
                    ? { ...record, status: newStatus } 
                    : record
            )
        );
    };

    const handleRemarksChange = (studentId, e) => {
        setDailyRecords(prevRecords => 
            prevRecords.map(record => 
                record._id === studentId 
                    ? { ...record, remarks: e.target.value } 
                    : record
            )
        );
    };

    const handleMarkAll = (statusToMark) => {
        setDailyRecords(prevRecords => 
            prevRecords.map(record => 
                ({ ...record, status: statusToMark })
            )
        );
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            // Prepare the data to send to the backend
            const attendancePayload = dailyRecords.map(record => ({
                personId: record._id,
                status: record.status, 
                remarks: record.remarks,
                // Tasks/tasksRemarks are omitted here as this is the MarkAttendance page
            }));
            
            // Use the single markAttendanceAndTasks endpoint
            await axios.post(`${API}/attendance`, {
                date: date.format("YYYY-MM-DD"),
                entityType: entityType,
                records: attendancePayload,
            }, { headers: clientHeader });

            messageApi.success("Attendance saved successfully!");

        } catch (error) {
            messageApi.error(error.response?.data?.message || "Failed to save attendance.");
        } finally {
            setLoading(false);
        }
    };

    // --- Table Columns ---
    const columns = [
        // {
        //     title: "#",
        //     key: "serial",
        //     render: (text, record, index) => index + 1,
        //     width: 50,
        // },
        {
            title: "Student Name",
            dataIndex: "name",
            key: "name",
            fixed: 'left',
            width: 70,
            align: 'center',
            // sorter: (a, b) => a.name.localeCompare(b.name),
        },
        {
            title: "Attendance Status",
            key: "status",
            width: 300,
            align: 'center',
            render: (text, record) => (
                <div style={{ maxWidth: '50vw'}}>
                <Radio.Group
                    className="attendance-radio-group" // Uses MarkAttendance.css
                    value={record.status}
                    onChange={(e) => handleAttendanceChange(record._id, e.target.value)}
                    buttonStyle="solid"
                >
                    {attendanceOptions
                        .filter(opt => opt.value !== 0 ) // Hide "Not Marked"from daily marking
                        .map(opt => (
                        <Radio.Button 
                            key={opt.value} 
                            value={opt.value}
                            style={{ 
                                '--color': opt.color
                                , minWidth: '0px',paddingLeft: '10px' ,paddingRight: '10px' 
                            }}
                        >
                            {opt.label}
                        </Radio.Button>
                    ))}
                </Radio.Group>
                </div>
            ),
        },
        {
            title: "Remarks",
            dataIndex: "remarks",
            key: "remarks",
            width: 150,
            align: 'center',
            render: (text, record) => (
                <TextArea style={{textAlign : 'center'}}
                    value={text}
                    onChange={(e) => handleRemarksChange(record._id, e)}
                    // placeholder="Enter remarks (optional)"
                    autoSize={{ minRows: 1, maxRows: 3 }}
                />
            ),
        },
    ];

    return (
        <div style={{ minWidth: 300 }}>
            {contextHolder}
            <Card title={`Mark Daily Attendance (${entityType})`} bordered={false}>
                
                {/* Header/Controls Section */}
                <div style={{ marginBottom: 20 }}>
                    <Row gutter={[16, 16]} align="middle">
                        
                        {/* Date Picker */}
                        <Col xs={24} md={6}>
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <label style={{ fontWeight: 'bold' }}>Select Date:</label>
                                <DatePicker
                                    style={{ width: "100%" }}
                                    value={date}
                                    onChange={handleDateChange}
                                    format="YYYY-MM-DD"
                                    allowClear={false}
                                    disabledDate={(current) => current && current.valueOf() > dayjs().endOf('day').valueOf()} // Disable future dates
                                />
                            </Space>
                        </Col>

                        {/* Mark All Buttons */}
                        <Col xs={24} md={12} className="text-center">
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                                
                                <Button
                                    type="primary"
                                    onClick={() => handleMarkAll(1)} // Present
                                    style={{ background: '#28a745', borderColor: '#28a745'}}
                                >
                                    Mark All : Present
                                </Button>
                                <Button
                                    type="primary"
                                    onClick={() => handleMarkAll(5)} // Weekend
                                    style={{ background: '#007bff', borderColor: '#007bff' }}
                                >
                                    Mark All : Weekend
                                </Button>
                                <Button
                                    type="primary"
                                    onClick={() => handleMarkAll(6)} // Holiday
                                    style={{ background: '#6f42c1', borderColor: '#6f42c1' }}
                                >
                                    Mark All : Holiday
                                </Button>
                                
                                <Button
                                    icon={<ReloadOutlined />}
                                    onClick={() => fetchDailyRecords(date)}
                                    loading={dataLoading}
                                >
                                    Reload Data
                                </Button>
                            </div>
                        </Col>

                        {/* Save button */}
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
                    dataSource={dailyRecords}
                    columns={columns}
                    rowKey="_id"
                     pagination={{ pageSize: 100 }}
                    bordered
                    loading={dataLoading}
                    scroll={{ x: 850 }}
                />
            </Card>
        </div>
    );

};

export default MarkAttendance;