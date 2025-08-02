import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Switch, message, Popconfirm } from 'antd';
import axios from 'axios';
import { EditOutlined, DeleteOutlined, EyeOutlined, KeyOutlined } from '@ant-design/icons';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [passwordEditMode, setPasswordEditMode] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const [viewUser, setViewUser] = useState(null);
    const [viewModalVisible, setViewModalVisible] = useState(false);
  const [messageApi, msgContextHolder] = message.useMessage();

    const showViewModal = (user) => {
        setViewUser(user);
        setViewModalVisible(true);
    };

    const [form] = Form.useForm();

    const getUsers = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/v1/users/getAllUsers'); // adjust path as needed
            setUsers(res.data.users);
        } catch (err) {
            messageApi.error('Failed to fetch users.');
        }
        setLoading(false);
    };

    useEffect(() => {
        getUsers();
    }, []);

    const showAddModal = () => {
        form.resetFields();
        setEditMode(false);
        setIsModalOpen(true);
    };

    const showEditModal = (user, isEditPassword = false) => {
        form.setFieldsValue(user);
        if(isEditPassword){
            form.setFieldsValue({ password: '' });
        }
        setEditingUser(user);
        setEditMode(true);
        setPasswordEditMode(isEditPassword);
        setIsModalOpen(true);
    };

    const handleDelete = async (userId) => {
        try {
            await axios.delete(`/api/v1/users/${userId}`);
            messageApi.success('User deleted successfully');
            getUsers();
        } catch {
            messageApi.error('Delete failed.');
        }
    };

    const onFinish = async (values) => {
        console.log("Form values:", values);
        try {
            if (editMode) {
                await axios.put(`/api/v1/users/${editingUser._id}`, values);
                if(passwordEditMode)
                    messageApi.success('Password updated successfully');
                else
                    messageApi.success('User updated successfully');
            } else {
                await axios.post('/api/v1/users/createUser', values);
                messageApi.success('User created successfully');
            }
            setIsModalOpen(false);
            getUsers();
        } catch (err) {
            messageApi.error('Operation failed.');
        }
    };

    const columns = [
        {
            title: 'Login ID',
            align: 'center',
            dataIndex: 'name',
            responsive: ['md'], // ❌ hides in xs/sm, ✅ shows in md+
        },
        {
            title: 'User Name',
            align: 'center',
            dataIndex: 'userName',
        },
        {
            title: 'Admin',
            align: 'center',
            dataIndex: 'isAdmin',
            render: (isAdmin) => (isAdmin ? 'Yes' : 'No'),
        },

        {
            title: 'Actions',
            align: 'center',
            render: (user) => (
                // <div className="d-flex gap-1"
                <>
                    <Button
                        type="link"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => showViewModal(user)}
                    >
                        <span className="d-none d-md-inline">View</span>
                    </Button>

                    <Button
                        type="link"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => showEditModal(user, false)}
                    style={{ color: '#52c41a' }}
                    >
                        <span className="d-none d-md-inline">Edit</span>
                    </Button>

                    <Button
                        type="link"
                        size="small"
                        icon={<KeyOutlined />}
                        onClick={() => showEditModal(user, true)}
                    style={{ color: '#faad14' }}>
                        <span className="d-none d-md-inline">Update Password</span>
                    </Button>

                    <Popconfirm
                        title="Are you sure to delete?"
                        onConfirm={() => handleDelete(user._id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button
                            type="link"
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                        >
                            <span className="d-none d-md-inline">Delete</span>
                        </Button>
                    </Popconfirm>

                </>
            )
        }
    ];


    return (
        <>
        {msgContextHolder}

        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4>Users</h4>
                <Button color="green" variant="solid" onClick={showAddModal}>Add User</Button>
                {/* <Button
                    style={{ background: 'linear-gradient(to bottom right, #a8e063, #56ab2f)', border: 'none' }}
                    type="primary"
                    onClick={showAddModal}
                >
                    Add User
                </Button> */}

            </div>

<div className="transaction-table-wrapper">
            <Table
                dataSource={users}
                columns={columns}
                rowKey="_id"
                loading={loading}
                pagination={{ pageSize: 7 }}
            />
</div>
            <Modal
                //   title={passwordEditMode ? "Update Password" : (selectedUser ? "Edit User" : "Add User")}
                title={editMode ? (passwordEditMode ? "Update Password" : "Edit User") : "Add User"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={() => form.submit()}
                okText={editMode ? 'Update' : 'Create'}
            >
                <Form
                    form={form}
                    layout="horizontal"
                    labelCol={{ span: 6 }}
                    wrapperCol={{ span: 18 }}
                    style={{ maxWidth: '100%' }}
                    onFinish={onFinish}
                    initialValues={{ isAdmin: false }}
                >
                    {(!editMode || !passwordEditMode) && (
                        <>

                            <Form.Item name="name" label="Login ID" rules={[{ required: true }]}>
                                <Input />
                            </Form.Item>
                            <Form.Item name="userName" label="User Name" rules={[{ required: true }]}>
                                <Input />
                            </Form.Item>

                            <Form.Item name="isAdmin" label="Is Admin?" valuePropName="checked">
                                <Switch />
                            </Form.Item>
                        </>
                    )}

                    {!editMode && (
                        <Form.Item name="password" label="Password" rules={[{ required: true }]}>
                            <Input.Password />
                        </Form.Item>
                    )}
                    {editMode && passwordEditMode && (
                        <Form.Item name="password" label="New Password" rules={[{ required: true }]}>
                            <Input.Password />
                        </Form.Item>
                    )}
                </Form>
            </Modal>

            <Modal
                title="User Details"
                open={viewModalVisible}
                onCancel={() => setViewModalVisible(false)}
                footer={null}
            >
                <Form layout="horizontal"
                    labelCol={{ span: 6 }}
                    wrapperCol={{ span: 18 }}
                    style={{ maxWidth: '100%' }} initialValues={viewUser}>
                    <Form.Item label="Login ID">
                        <Input value={viewUser?.name} />
                    </Form.Item>
                    <Form.Item label="Username">
                        <Input value={viewUser?.userName} />
                    </Form.Item>
                    <Form.Item label="Is Admin?">
                        <Switch checked={viewUser?.isAdmin} />
                    </Form.Item>
                    {/* <Form.Item label="Password">
                        <Input.Password value={viewUser?.password} />
                    </Form.Item> */}
                </Form>
            </Modal>

        </div>
        </>
    );
};

export default Users;
