// MarkDailyChecklist.jsx
import { useEffect, useState, useCallback, useMemo } from "react";
import { Table, DatePicker, Button, message, Card, Input, Space, Row, Col, Radio } from "antd"; 
import axios from "axios";
import dayjs from "dayjs";
import { SaveOutlined, ReloadOutlined } from "@ant-design/icons";
import "./MarkAttendance.css"; 

const { TextArea } = Input;

// Define the three states for the frontend
const taskStatusOptions = [
    // Frontend Value: 2 (Yes/Done) -> Saved to DB as 1
    { value: 2, label: "Yes", color: '#28a745' }, // Green
    // Frontend Value: 1 (No/Not Done) -> Saved to DB as 0
    { value: 1, label: "No", color: '#dc3545' }, // Red
    // Frontend Value: 0 (Default/Not Marked/Skip) -> Not Saved to DB. Hidden from view.
    { value: 0, label: "Skip", color: '#6c757d' } 
];

const MarkDailyChecklist = ({ entityType }) => {
    const [dailyRecords, setDailyRecords] = useState([]); 
    const [tasksList, setTasksList] = useState([]); 
    const [date, setDate] = useState(dayjs());
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();

    const API = import.meta.env.VITE_API_BASE_URL;
    const clientHeader = { "X-Client": window.location.hostname.split(".")[0] };
    const selectedEntity = JSON.parse(localStorage.getItem("selectedEntity") || "null");
    const entityId = selectedEntity?.EntityId;
    
    const cleanApiBase = API.endsWith('/') ? API.slice(0, -1) : API;
    const ATTENDANCE_BASE_URL = `${cleanApiBase}/attendance`; 

    const pageTitle = entityType === 'Student' 
        ? 'Student Daily Checklist' 
        : 'Staff Daily Checklist';


    // --- Data Fetching ---
    
    const fetchTasksList = useCallback(async () => {
        // ... (implementation remains the same) ...
        try {
            const res = await axios.get(`${ATTENDANCE_BASE_URL}/tasks-list`, {
                params: { entityType: entityType },
                headers: clientHeader,
            });
            const fetchedTasks = res.data.tasks.map(t => ({
                key: t.taskId, 
                name: t.name,
                taskId: t.taskId,
            }));
            setTasksList(fetchedTasks);
            return fetchedTasks;
        } catch (error) {
            messageApi.error(error.response?.data?.message || "Failed to fetch checklist items.");
            return [];
        }
    }, [ATTENDANCE_BASE_URL, clientHeader, messageApi, entityType]);


    const fetchDailyRecords = useCallback(async (selectedDate, currentTasksList) => {
        setDataLoading(true);
        try {
            const res = await axios.get(`${ATTENDANCE_BASE_URL}/daily-records`, {
                params: { 
                    date: selectedDate.format("YYYY-MM-DD"),
                    entityType: entityType,
                    entity: entityId
                },
                headers: clientHeader,
            });
            
            const fetchedRecords = res.data.records.map(person => {
                const existingTasksMap = new Map();
                (person.tasks || []).forEach(t => existingTasksMap.set(t.taskId.toString(), t));

                const tasks = currentTasksList.map(task => {
                    const existing = existingTasksMap.get(task.taskId.toString());
                    
                    let frontendStatus = 0; // Default to 0 (Not Marked/Skip)
                    if (existing) {
                        if (existing.status === 1) frontendStatus = 2; // DB 1 (Yes) -> Frontend 2
                        else if (existing.status === 0) frontendStatus = 1; // DB 0 (No) -> Frontend 1
                    }

                    return {
                        taskId: task.taskId,
                        status: frontendStatus, 
                    };
                });

                return {
                    ...person,
                    tasks: tasks,
                    tasksRemarks: person.tasksRemarks || "",
                };
            });
            
            setDailyRecords(fetchedRecords);
            
        } catch (error) {
            messageApi.error(error.response?.data?.message || "Failed to fetch daily records.");
            setDailyRecords([]);
        } finally {
            setDataLoading(false);
        }
    }, [ATTENDANCE_BASE_URL, clientHeader, messageApi, entityId, entityType]);

    // --- FIX: Ensure data loads on initial mount and date change ---
    useEffect(() => {
        // This logic ensures data is loaded when the component mounts or when the date changes
        const loadData = async () => {
            if (entityId !== undefined || selectedEntity === null) {
                const tasks = await fetchTasksList();
                if (tasks.length > 0) {
                    await fetchDailyRecords(date, tasks);
                } else {
                    setDailyRecords([]);
                }
            }
        }
        loadData();
    }, [date,  entityId, selectedEntity, entityType]);
    
    // --- Handlers (omitted for brevity, remain the same) ---
    const handleDateChange = (newDate) => {
        if (newDate) {
            setDate(newDate);
        }
    };

    const handleTaskStatusChange = (personId, taskId, newStatus) => {
        setDailyRecords(prevRecords => 
            prevRecords.map(record => 
                record._id === personId 
                    ? { 
                        ...record, 
                        tasks: record.tasks.map(task => 
                            task.taskId === taskId 
                                ? { ...task, status: newStatus } 
                                : task
                        )
                      } 
                    : record
            )
        );
    };

    const handleRemarksChange = (personId, e) => {
        setDailyRecords(prevRecords => 
            prevRecords.map(record => 
                record._id === personId 
                    ? { ...record, tasksRemarks: e.target.value } 
                    : record
            )
        );
    };
    
    const handleSave = async () => {
        setLoading(true);
        try {
            const taskPayload = dailyRecords.map(record => {
                const tasksToSend = record.tasks
                    .filter(task => task.status !== 0) 
                    .map(task => ({
                        taskId: task.taskId,
                        status: task.status === 2 ? 1 : 0, 
                    }));

                return {
                    personId: record._id,
                    tasks: tasksToSend, 
                    tasksRemarks: record.tasksRemarks,
                };
            });
            
            await axios.post(ATTENDANCE_BASE_URL, {
                date: date.format("YYYY-MM-DD"),
                entityType: entityType,
                records: taskPayload,
            }, { headers: clientHeader });

            messageApi.success(`${entityType} daily checklist saved successfully!`);

        } catch (error) {
            messageApi.error(error.response?.data?.message || "Failed to save daily checklist.");
        } finally {
            setLoading(false);
        }
    };

    // --- Table Columns (Updated Radio.Group) ---
    const columns = useMemo(() => {
        // ... (Base columns remain the same) ...
        const baseColumns = [
            {
                title: "#",
                key: "serial",
                render: (text, record, index) => index + 1,
                width: 50,
            },
            {
                title: entityType === 'Student' ? "Student Name" : "Staff Name",
                dataIndex: "name",
                key: "name",
                fixed: 'left',
                width: 200,
                sorter: (a, b) => a.name.localeCompare(b.name),
            },
        ];

        // Dynamic Columns based on fetched tasks
        const taskColumns = tasksList.map(task => ({
            title: task.name,
            key: `task-${task.taskId}`,
            width: 150,
            className: 'text-center',
            render: (text, record) => {
                const taskStatus = record.tasks.find(t => t.taskId === task.taskId)?.status || 0;
                
                const yesOption = taskStatusOptions.find(opt => opt.value === 2);
                const noOption = taskStatusOptions.find(opt => opt.value === 1);
                const skipOption = taskStatusOptions.find(opt => opt.value === 0);

                return (
                    <div className="task-status-cell">
                        <Radio.Group
                            size="small"
                            value={taskStatus}
                            onChange={(e) => 
                                handleTaskStatusChange(record._id, task.taskId, e.target.value)
                            }
                            // FIX 1: Add buttonStyle="solid" for full color on selection
                            buttonStyle="solid" 
                            className="checklist-radio-group" 
                        >
                            {/* Yes/Done Button (Value 2, Maps to DB 1) */}
                            <Radio.Button 
                                value={yesOption.value} 
                                style={{ '--color': yesOption.color }} 
                            >
                                {yesOption.label}
                            </Radio.Button>
                            
                            {/* No/Not Done Button (Value 1, Maps to DB 0) */}
                            <Radio.Button 
                                value={noOption.value} 
                                style={{ '--color': noOption.color , margin: '1px' }}
                            >
                                {noOption.label}
                            </Radio.Button>

                            {/* Skip/Not Marked Button (Value 0). Hidden but functional for reset. */}
                             <Radio.Button 
                                value={skipOption.value} 
                                className="hidden-skip-button"
                            >
                                {skipOption.label} 
                            </Radio.Button>
                        </Radio.Group>
                    </div>
                );
            },
        }));

        const remarksColumn = {
            title: "Notes/Remarks",
            dataIndex: "tasksRemarks",
            key: "tasksRemarks",
            width: 250,
            render: (text, record) => (
                <TextArea
                    value={text}
                    onChange={(e) => handleRemarksChange(record._id, e)}
                    placeholder=""
                    autoSize={{ minRows: 1, maxRows: 3 }}
                />
            ),
        };

        return [...baseColumns, ...taskColumns, remarksColumn];
    }, [tasksList, entityType, handleTaskStatusChange, handleRemarksChange]);


    return (
        <div style={{ minWidth: 300 }}>
            {contextHolder}
            <Card title={pageTitle} bordered={false}>
                
                {/* Header/Controls Section (omitted for brevity) */}
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
                                    disabledDate={(current) => current && current.valueOf() > dayjs().endOf('day').valueOf()}
                                />
                            </Space>
                        </Col>

                        {/* Reload Button */}
                        <Col xs={24} md={12} className="text-center">
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={() => {
                                    const reloadData = async () => {
                                        const tasks = await fetchTasksList();
                                        if (tasks.length > 0) {
                                            await fetchDailyRecords(date, tasks);
                                        }
                                    }
                                    reloadData();
                                }}
                                loading={dataLoading}
                            >
                                Reload Data
                            </Button>
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
                                Save Checklist
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
                    scroll={{ x: true }} 
                    locale={{ emptyText: dataLoading ? 'Loading...' : 'No active students/staff or no active checklist items found.' }}
                />
            </Card>
        </div>
    );
};

export default MarkDailyChecklist;