import { useEffect, useState } from 'react';
import { Table, Input, Button, message, Popconfirm, Form, Select, Tag } from 'antd';
import axios from 'axios';
import { EditOutlined, DeleteOutlined, PlusOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';

const Tasks = ({ type }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newTask, setNewTask] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editStatus, setEditStatus] = useState(1);
  const [messageApi, msgContextHolder] = message.useMessage();

  const selectedEntity = JSON.parse(localStorage.getItem('selectedEntity') || 'null');

  const statusOptions = [
    { label: 'Active', value: 1, color: 'green' },
    { label: 'Inactive', value: 2, color: 'orange' },
    // { label: 'Closed (Keep Records)', value: 2, color: 'orange' },
    // { label: 'Closed (Hide Records)', value: 3, color: 'red' },
  ];

  const getTasks = async () => {
    setLoading(true);
    try {
      const API = import.meta.env.VITE_API_BASE_URL;
      let url = `${API}/tasks?type=${type}`;
      if (selectedEntity) {
        url += `&entity=${selectedEntity.EntityId}`;
      }

      const res = await axios.get(url, {
        headers: {
          "X-Client": window.location.hostname.split(".")[0],
        },
      });
      setTasks(res.data.tasks);
    } catch (err) {
      messageApi.error('Failed to fetch items.');
    }
    setLoading(false);
  };

  useEffect(() => {
    getTasks();
  }, [type]);

  const handleAdd = async () => {
    if (!newTask.trim()) return;
    try {
      const API = import.meta.env.VITE_API_BASE_URL;
      const payload = { name: newTask.trim(), type, status: 1 };

      if (selectedEntity) {
        payload.entity = selectedEntity.EntityId;
      }

      await axios.post(`${API}/tasks`, payload, {
        headers: { "X-Client": window.location.hostname.split(".")[0] },
      });
      setNewTask('');
      getTasks();
      messageApi.success(`New item added`);
    } catch {
      messageApi.error('Failed to add item');
    }
  };

  const handleEdit = async (id) => {
    try {
      const API = import.meta.env.VITE_API_BASE_URL;
      await axios.put(`${API}/tasks/${id}`, { name: editText, status: editStatus }, {
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
      const API = import.meta.env.VITE_API_BASE_URL;
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
      title: `Checklist Item Title `,
      dataIndex: 'name',
      align: 'center',
      render: (text, record) =>
        editingId === record._id ? (
          <Input
            value={editText}
            style={{textAlign:"center" , paddingBottom:"5px"}}
            onChange={(e) => setEditText(e.target.value)}
            size="small"
            autoFocus
          />
        ) : (
          text
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
            style={{ width: 180 }}
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
  const canViewOtherUsersData = savedUser?.canViewOtherUsersData;
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
              : 'TaChecklist Itemssks'}
          </h4>
        </div>

        {(isAdmin || canAddData) && (
          <div className="d-flex mb-3 gap-2">
            <Input
              placeholder={'New Checklist Item Title'}
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onPressEnter={handleAdd}
            />
            <Button
              color="green"
              variant="solid"
              icon={<PlusOutlined />}
              onClick={handleAdd}
              style={{
                background: "linear-gradient(to bottom right, #029bd2, #20c997)",
                borderColor: "#20c997"
              }}
            >
              Add
            </Button>
          </div>
        )}

        <Table
          dataSource={tasks}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 7 }}
        />
      </div>
    </>
  );
};

export default Tasks;
