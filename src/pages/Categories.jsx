import { useEffect, useState } from 'react';
import { Table, Input, Button, message, Popconfirm, Form, Select, Tag } from 'antd';
import axios from 'axios';
import { EditOutlined, DeleteOutlined, PlusOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';

const Categories = ({ type }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editStatus, setEditStatus] = useState(1);
  const [messageApi, msgContextHolder] = message.useMessage();

  const selectedEntity = JSON.parse(localStorage.getItem('selectedEntity') || 'null');

  const TWO_STATUS_OPTIONS = [
  { label: 'Active', value: 1, color: 'green' },
  { label: 'Inactive', value: 2, color: 'red' },
];

const DEFAULT_STATUS_OPTIONS = [
  { label: 'Active', value: 1, color: 'green' },
  { label: 'Closed (Keep Records)', value: 2, color: 'orange' },
  { label: 'Closed (Hide Records)', value: 3, color: 'red' },
];

const statusOptions =
  (type === 'staff' || type === 'student') ? TWO_STATUS_OPTIONS : DEFAULT_STATUS_OPTIONS;


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

  useEffect(() => {
    getCategories();
  }, [type]);

  const handleAdd = async () => {
    if (!newCategory.trim()) return;
    try {
      const API = import.meta.env.VITE_API_BASE_URL;
      const payload = { name: newCategory.trim(), type, status: 1 };

      if (selectedEntity) {
        payload.entity = selectedEntity.EntityId;
      }

      await axios.post(`${API}/categories`, payload, {
        headers: { "X-Client": window.location.hostname.split(".")[0] },
      });
      setNewCategory('');
      getCategories();
      messageApi.success(`${type === 'asset' ? 'Asset Type' : (type === 'staff' ? 'Staff Designation' : (type === 'student' ? 'Class' : 'Category'))} added`);
    } catch {
      messageApi.error('Failed to add');
    }
  };

  const handleEdit = async (id) => {
    try {
      const API = import.meta.env.VITE_API_BASE_URL;
      await axios.put(`${API}/categories/${id}`, { name: editText, status: editStatus }, {
        headers: { "X-Client": window.location.hostname.split(".")[0] },
      });
      setEditingId(null);
      messageApi.success(`${type === 'asset' ? 'Asset Type' : (type === 'staff' ? 'Staff Designation' : (type === 'student' ? 'Class' : 'Category'))} updated`);
      getCategories();
    } catch {
      messageApi.error('Update failed');
    }
  };

  const handleDelete = async (id) => {
    try {
      const API = import.meta.env.VITE_API_BASE_URL;
      await axios.delete(`${API}/categories/${id}`, {
        headers: { "X-Client": window.location.hostname.split(".")[0] },
      });
      messageApi.success('Deleted');
      getCategories();
    } catch (err) {
      messageApi.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const columns = [
    {
      title: `${type === 'asset' ? 'Asset Type' : (type === 'staff' ? 'Designation' : (type === 'student' ? 'Class Name' : 'Category Name'))} `,
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
            {type === 'income'
              ? 'Income Categories'
              : type === 'expense'
              ? 'Expense Categories'
              : type === 'staff'
              ? 'Staff Designations'
              : type === 'student'
              ? 'Classes'
              : 'Asset Types'}
          </h4>
        </div>

        {(isAdmin || canAddData) && (
          <div className="d-flex mb-3 gap-2">
            <Input
              placeholder={type === 'asset' ? 'New Asset Type' : (type === 'staff' ? 'New Designation' : (type === 'student' ? 'New Class Name' : 'New Category Name'))}
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
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
          dataSource={categories}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 7 }}
        />
      </div>
    </>
  );
};

export default Categories;
