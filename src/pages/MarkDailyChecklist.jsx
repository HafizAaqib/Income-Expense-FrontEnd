import { useEffect, useState, useCallback, useMemo } from "react";
import { Table, DatePicker, Button, message, Card, Input, Space, Row, Col, Radio, Select } from "antd"; 
import axios from "axios";
import dayjs from "dayjs";
import { SaveOutlined, ReloadOutlined } from "@ant-design/icons";
import "./MarkAttendance.css"; 

const { TextArea } = Input;
const { Option } = Select;

// Three states for the frontend
const taskStatusOptions = [
    // Frontend Value: 2 (Yes/Done) -> Saved to DB as 1
    { value: 2, label: "Yes", color: '#28a745' }, // Green
    // Frontend Value: 1 (No/Not Done) -> Saved to DB as 0
    { value: 1, label: "No", color: '#dc3545' }, // Red
    // Frontend Value: 0 (Default/Not Marked/Skip) -> Not Saved to DB. Hidden from view.
    { value: 0, label: "Skip", color: '#6c757d' } 
];
const clientHeader = { "X-Client": window.location.hostname.split(".")[0] };

const MarkDailyChecklist = ({ entityType }) => {
    const [dailyRecords, setDailyRecords] = useState([]); 
    const [tasksList, setTasksList] = useState([]); 
    const [date, setDate] = useState(dayjs());
    const [category, setCategory] = useState(null); // 'Class' for Students, 'Designation' for Staff
    const [categoryOptions, setCategoryOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();

    const API = import.meta.env.VITE_API_BASE_URL;
    const selectedEntity = useMemo(() => {
        return JSON.parse(localStorage.getItem("selectedEntity") || "null");
    }, []);
    const entityId = selectedEntity?.EntityId;
    
    const cleanApiBase = API.endsWith('/') ? API.slice(0, -1) : API;
    const ATTENDANCE_BASE_URL = `${cleanApiBase}/attendance`; 

    const pageTitle = entityType === 'Student' 
        ? 'Student Daily Checklist' 
        : 'Staff Daily Checklist';

    const categoryLabel = entityType === 'Student' ? 'Class' : 'Designation';

    useEffect(() => {
         const fetchCategories = async () => {
            try {
                const API = import.meta.env.VITE_API_BASE_URL;
                let url = `${API}/categories?type=${entityType==='Student' ? 'student' : 'staff'}`;
                if (selectedEntity) {
                    url += `&entity=${selectedEntity.EntityId}`;
                }
                const res = await axios.get(url, {
                    headers: {
                    "X-Client": window.location.hostname.split(".")[0],
                    },
                });
                setCategoryOptions(res.data.categories);
                } catch (err) {
                messageApi.error(`Failed to fetch ${entityType==='Student' ? 'classes' : 'designations'}.`);
            }
        };
        fetchCategories();
        setCategory(null); // Reset selection when entityType switches
        setDailyRecords([]);
    }, [entityType, cleanApiBase]);


    // --- Data Fetching ---
    
    const fetchTasksList = useCallback(async (selectedCat) => {
        try {
            const res = await axios.get(`${ATTENDANCE_BASE_URL}/tasks-list`, {
                params: { 
                    entityType: entityType,
                    category: selectedCat // Filter tasks by the specific class/designation
                },
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
    }, [ATTENDANCE_BASE_URL,clientHeader, entityType, messageApi]);


    const fetchDailyRecords = useCallback(async (selectedDate, currentTasksList, selectedCat) => {
        if (!selectedCat) return;
        setDataLoading(true);
        try {
            const res = await axios.get(`${ATTENDANCE_BASE_URL}/daily-records`, {
                params: { 
                    date: selectedDate.format("YYYY-MM-DD"),
                    entityType: entityType,
                    entity: entityId,
                    category: selectedCat 
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


    useEffect(() => {
        const loadData = async () => {
            if (category && (entityId !== undefined || selectedEntity === null)) {
                const tasks = await fetchTasksList(category);
                if (tasks.length > 0) {
                    await fetchDailyRecords(date, tasks, category);
                } else {
                    setDailyRecords([]);
                }
            }
        };
        loadData();
    }, [date, category, entityId, selectedEntity, entityType]);
    

    // --- Handlers ---
    const handleDateChange = (newDate) => {
        if (newDate) {
            setDate(newDate);
        }
    };

    const handleCategoryChange = (val) => {
        setCategory(val);
        setDailyRecords([]); // Clear table while loading new category
    };

    const handleTaskStatusChange = useCallback((personId, taskId, newStatus) => {
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
    }, []);

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
        if (!category) return messageApi.warning(`Please select a ${categoryLabel}`);
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

    // --- Table Columns ---
    const columns = useMemo(() => {
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

        const taskColumns = tasksList.map(task => ({
            title: task.name,
            key: `task-${task.taskId}`,
            width: 150,
            className: 'text-center',
            render: (text, record) => {
                const taskStatus = record.tasks.find(t => t.taskId === task.taskId)?.status || 0;
                return (
                    <div className="task-status-cell">
                     <Radio.Group
                        size="small"
                        value={taskStatus}
                        onChange={(e) => handleTaskStatusChange(record._id, task.taskId, e.target.value)}
                        buttonStyle="solid"
                        className="checklist-radio-group" 
                    >
                        {taskStatusOptions.map(opt => (
                            <Radio.Button 
                                key={opt.value}
                                value={opt.value} 
                                style={opt.value !== 0 ? { '--color': opt.color } : {}}
                                className={opt.value === 0 ? "hidden-skip-button" : ""}
                            >
                                {opt.label}
                            </Radio.Button>
                        ))}
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
                
                <div style={{ marginBottom: 20 }}>
                    <Row gutter={[16, 16]} align="bottom">
                        {/* Date Picker */}
                        <Col xs={24} sm={12} md={6}>
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <span style={{ fontWeight: 'bold' }}>Select Date:</span>
                                <DatePicker
                                    style={{ width: "100%" }}
                                    value={date}
                                    onChange={handleDateChange}
                                    format="DD - MMM - YYYY"
                                    allowClear={false}
                                    disabledDate={(current) => current && current > dayjs().endOf('day')}
                                />
                            </Space>
                        </Col>

                        {/* Category Selector (Class/Designation) */}
                        <Col xs={24} sm={12} md={6}>
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <span style={{ fontWeight: 'bold' }}>Select {categoryLabel}:</span>
                                <Select
                                    placeholder={`Select ${categoryLabel}`}
                                    style={{ width: '100%' }}
                                    value={category}
                                    onChange={handleCategoryChange}
                                    showSearch
                                >
                                    {categoryOptions.map((item, idx) => {
                                        const name = typeof item === 'string' ? item : item.name;
                                        const id = typeof item === 'string' ? item : item._id;
                                        return <Option key={idx} value={id}>{name}</Option>;
                                    })}
                                </Select>
                            </Space>
                        </Col>

                        {/* Reload Button */}
                        <Col xs={12} md={6}>
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={async () => {
                                    if(!category) return messageApi.info(`Select a ${categoryLabel} first`);
                                    const tasks = await fetchTasksList(category);
                                    if (tasks.length > 0) await fetchDailyRecords(date, tasks, category);
                                }}
                                loading={dataLoading}
                                block
                            >
                                Reload
                            </Button>
                        </Col>

                        {/* Save button */}
                        <Col xs={12} md={6}>
                            <Button
                                type="primary"
                                icon={<SaveOutlined />}
                                onClick={handleSave}
                                loading={loading}
                                disabled={!category || dailyRecords.length === 0}
                                style={{
                                    background: "linear-gradient(to bottom right, #029bd2, #20c997)",
                                    borderColor: "#20c997",
                                }}
                                block
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
                    scroll={{ x: 'max-content' }} 
                    locale={{ 
                        emptyText: !category 
                            ? `Please select a ${categoryLabel} to view the checklist.` 
                            : `No active ${entityType} or no active checklist items found for this ${categoryLabel}.` 
                    }}
                />
            </Card>
        </div>
    );
};

export default MarkDailyChecklist;