import { useEffect, useState } from 'react';
import { Table, Input, Button, message, Popconfirm, Form } from 'antd';
import axios from 'axios';
import { EditOutlined, DeleteOutlined, PlusOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';

const Categories = ({ type }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [messageApi, msgContextHolder] = message.useMessage();

  const getCategories = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/v1/categories?type=${type}`);
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
      await axios.post('/api/v1/categories', { name: newCategory.trim(), type });
      setNewCategory('');
      getCategories();
      messageApi.success('Category added');
    } catch {
      messageApi.error('Failed to add');
    }
  };

  const handleEdit = async (id) => {
    try {
      await axios.put(`/api/v1/categories/${id}`, { name: editText });
      setEditingId(null);
      messageApi.success('Category updated');
      getCategories();
    } catch {
      messageApi.error('Update failed');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/v1/categories/${id}`);
      messageApi.success('Deleted');
      getCategories();
    } catch {
      messageApi.error('Delete failed');
    }
  };

  const columns = [
    {
      title: 'Category Name',
      dataIndex: 'name',
      align: 'center',
      render: (text, record) =>
        editingId === record._id ? (
          <Input
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            size="small"
            autoFocus
          />
        ) : (
          text
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
          { isAdmin &&
          <>
           <Button
  icon={<EditOutlined />}
  size="small"
  type="link"
  onClick={() => {
    setEditingId(record._id);
    setEditText(record.name);
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
    }
          </>
        ),
    },
  ];

   const savedUser = JSON.parse(localStorage.getItem('user'));
  const isAdmin = savedUser?.isAdmin;

  return (

    <>
    {msgContextHolder}

    <div className="container mt-4">

   

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>{type === 'income' ? 'Income Categories' : 'Expense Categories'}</h4>
      </div>

      <div className="d-flex mb-3 gap-2">
        <Input
          placeholder="New Category Name"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          onPressEnter={handleAdd}
        />
        <Button color="green" variant="solid"  icon={<PlusOutlined />} onClick={handleAdd}>
          Add
        </Button>
      </div>


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
