import { useEffect, useState } from 'react';
import { Table, Input, Button, message, Popconfirm, Select, Tag } from 'antd';
import axios from 'axios';
import { EditOutlined, DeleteOutlined, PlusOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';

const Tasks = ({ type }) => {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]); // Store categories for dropdown
  const [loading, setLoading] = useState(false);
  const [newTask, setNewTask] = useState('');
  const [newCategories, setNewCategories] = useState([]); // For add task row
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editStatus, setEditStatus] = useState(1);
  const [editCategories, setEditCategories] = useState([]); // For editing row
  const [messageApi, msgContextHolder] = message.useMessage();

  const selectedEntity = JSON.parse(localStorage.getItem('selectedEntity') || 'null');
  const API = import.meta.env.VITE_API_BASE_URL;

  const statusOptions = [
    { label: 'Active', value: 1, color: 'green' },
    { label: 'Inactive', value: 2, color: 'orange' },
  ];

  // Fetch Categories based on type (staff/student)
  const getCategories = async () => {
    setLoading(true);
    try {
      const API = import.meta.env.VITE_API_BASE_URL;
      let url = `${API}/categories?type=${type}`;
      if (selectedEntity) {
        url += `&entity=${selectedEntity.EntityId}`;
      }

      const res = await axios.get(url, {
        headers: {
          "X-Client": window.location.hostname.split(".")[0],
        },
      });
      setCategories(res.data.categories);
    } catch (err) {
      messageApi.error('Failed to fetch categories.');
    }
    setLoading(false);
  };

  const getTasks = async () => {
    setLoading(true);
    try {
      let url = `${API}/tasks?type=${type}`;
      if (selectedEntity) url += `&entity=${selectedEntity.EntityId}`;

      const res = await axios.get(url, {
        headers: { "X-Client": window.location.hostname.split(".")[0] },
      });
      setTasks(res.data.tasks);
    } catch (err) {
      messageApi.error('Failed to fetch items.');
    }
    setLoading(false);
  };

  useEffect(() => {
    getTasks();
    getCategories();
  }, [type]);

  const handleAdd = async () => {
    if (!newTask.trim()) return;
    try {
      const payload = { 
        name: newTask.trim(), 
        type, 
        status: 1, 
        categories: newCategories 
      };
      if (selectedEntity) payload.entity = selectedEntity.EntityId;

      await axios.post(`${API}/tasks`, payload, {
        headers: { "X-Client": window.location.hostname.split(".")[0] },
      });
      setNewTask('');
      setNewCategories([]);
      getTasks();
      messageApi.success(`New item added`);
    } catch {
      messageApi.error('Failed to add item');
    }
  };

  const handleEdit = async (id) => {
    try {
      await axios.put(`${API}/tasks/${id}`, { 
        name: editText, 
        status: editStatus,
        categories: editCategories 
      }, {
        headers: { "X-Client": window.location.hostname.split(".")[0] },
      });
      setEditingId(null);
      messageApi.success(`Item updated`);
      getTasks();
    } catch {
      messageApi.error('Update failed');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/tasks/${id}`, {
        headers: { "X-Client": window.location.hostname.split(".")[0] },
      });
      messageApi.success('Deleted');
      getTasks();
    } catch (err) {
      messageApi.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const columns = [
    {
      title: `Checklist Item Title`,
      dataIndex: 'name',
      align: 'center',
      render: (text, record) =>
        editingId === record._id ? (
          <Input
           value={editText} 
           style={{textAlign:"center" , paddingBottom:"5px"}}
           onChange={(e) => setEditText(e.target.value)} 
           autoFocus 
           />
        ) : text,
    },
    {
      title: type === 'staff' ? 'Designations' : 'Classes',
      dataIndex: 'categories',
      render: (cats, record) =>
        editingId === record._id ? (
          <Select
            mode="multiple"
            style={{ width: '100%' }}
            placeholder="-- Select --"
            value={editCategories}
            onChange={(val) => setEditCategories(val)}
            options={categories.map(c => ({ label: c.name, value: c._id }))}
          />
        ) : (
          cats?.map(c => <Tag key={c._id} color="blue">{c.name}</Tag>)
        ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      align: 'center',
      render: (status, record) =>
        editingId === record._id ? (
          <Select
            value={editStatus}
            onChange={(val) => setEditStatus(val)}
            size="small"
            options={statusOptions}
          />
        ) : (
          <Tag color={statusOptions.find(s => s.value === status)?.color}>
            {statusOptions.find(s => s.value === status)?.label}
          </Tag>
        ),
    },
    {
      title: 'Actions',
      align: 'center',
      render: (record) =>
        editingId === record._id ? (
          <>
            <Button
             icon={<CheckOutlined />} 
             size="small" 
             type="link" 
             onClick={() => handleEdit(record._id)} 
            />
            <Button
             icon={<CloseOutlined />} 
             size="small" 
             type="link" 
             onClick={() => setEditingId(null)} 
            />
          </>
        ) : (
          <>
            {(isAdmin || canUpdateData) && (
              <>
                <Button
                  icon={<EditOutlined />}
                  size="small"
                  type="link"
                  onClick={() => {
                    setEditingId(record._id);
                    setEditText(record.name);
                    setEditStatus(record.status);
                    setEditCategories(record.categories?.map(c => c._id) || []);
                  }}
                >
                  <span className="d-none d-md-inline">Edit</span>
                </Button>

                <Popconfirm
                  title="Are you sure to delete?"
                  onConfirm={() => handleDelete(record._id)}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button icon={<DeleteOutlined />} size="small" type="link" danger>
                    <span className="d-none d-md-inline">Delete</span>
                  </Button>
                </Popconfirm>
              </>
            )}
          </>
        ),
    },
  ];

  const savedUser = JSON.parse(localStorage.getItem('user') || 'null');
  const isAdmin = savedUser?.isAdmin;
  const canAddData = savedUser?.canAddData;
  const canUpdateData = savedUser?.canUpdateData;

  return (
    <>
      {msgContextHolder}

      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4>
            {type === 'student'
              ? 'Student Checklist Items'
              : type === 'staff'
              ? 'Staff Checklist Items'
              : 'Checklist Items'}
          </h4>
        </div>

        {(isAdmin || canAddData) && (
          <div className="row g-2 mb-3">
            {/* Full width on mobile, partial on desktop */}
            <div className="col-12 col-md-6">
              <Input
                placeholder={'New Checklist Item Title'}
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                className="custom-tasks-height"
              />
            </div>

            {/* Shared line on mobile, partial on desktop */}
            <div className="col-9 col-md-5">
              <Select
                mode="multiple"
                placeholder={type === 'staff' ? "Select Designations" : "Select Classes"}
                style={{ width: '100%' }}
                className="custom-tasks-height"
                value={newCategories}
                onChange={(val) => setNewCategories(val)}
                options={categories.filter(cat => cat.status === 1).map(c => ({ label: c.name, value: c._id }))}
              />
            </div>

            {/* Remaining space on mobile, small portion on desktop */}
            <div className="col-3 col-md-1">
              <Button
                icon={<PlusOutlined />}
                onClick={handleAdd}
                style={{
                  background: "linear-gradient(to bottom right, #029bd2, #20c997)",
                  borderColor: "#20c997",
                  color: 'white',
                  width: '100%'
                }}
                className="custom-tasks-height"
              >
                Add
              </Button>
            </div>
          </div>
        )}
        <div className="transaction-table-wrapper">
          <Table
          dataSource={tasks} 
          columns={columns} 
          rowKey="_id" 
          loading={loading} 
          pagination={{ pageSize: 7 }} 
          />
        </div>
      </div>
    </>
  );
};

export default Tasks;
