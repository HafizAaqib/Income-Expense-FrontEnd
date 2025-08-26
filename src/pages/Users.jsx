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
            const API = import.meta.env.VITE_API_BASE_URL;
            const res = await axios.get(`${API}/users/getAllUsers`, {
                headers: {
                    "X-Client": window.location.hostname.split(".")[0],
                },
            });
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
        if (isEditPassword) {
            form.setFieldsValue({ password: '' });
        }
        setEditingUser(user);
        setEditMode(true);
        setPasswordEditMode(isEditPassword);
        setIsModalOpen(true);
    };

    const handleDelete = async (userId) => {
        try {
            const API = import.meta.env.VITE_API_BASE_URL;
            await axios.delete(`${API}/users/${userId}`, {
                headers: {
                    "X-Client": window.location.hostname.split(".")[0],
                },
            });
            messageApi.success('User deleted successfully');
            getUsers();
        } catch {
            messageApi.error('Delete failed.');
        }
    };

    const onFinish = async (values) => {
        // console.log("Form values:", values);
        if (values.isAdmin) {
            values.canViewOtherUsersData = true;
            values.canAddData = true;
            values.canUpdateData = true;
        }

        try {
            if (editMode) {
                const API = import.meta.env.VITE_API_BASE_URL;
                await axios.put(`${API}/users/${editingUser._id}`, values, {
                    headers: {
                        "X-Client": window.location.hostname.split(".")[0],
                    },
                });
                if (passwordEditMode)
                    messageApi.success('Password updated successfully');
                else
                    messageApi.success('User updated successfully');
            } else {
                const API = import.meta.env.VITE_API_BASE_URL;
                await axios.post(`${API}/users/createUser`, values, {
                    headers: {
                        "X-Client": window.location.hostname.split(".")[0],
                    },
                });
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
            title: 'User Name',
            align: 'center',
            dataIndex: 'name',
            responsive: ['md'], // ❌ hides in xs/sm, ✅ shows in md+
        },
        {
            title: 'Login ID',
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
            title: "Can View Other Users’ Data And Dashboard",
            dataIndex: "canViewOtherUsersData",
            align: "center",
            render: (val) => (val ? "Yes" : "No"),
            responsive: ['md'],
        },
        {
            title: "Can Add New Data",
            dataIndex: "canAddData",
            align: "center",
            render: (val) => (val ? "Yes" : "No"),
            responsive: ['md'],
        },
        {
            title: "Can Update or Delete",
            dataIndex: "canUpdateData",
            align: "center",
            render: (val) => (val ? "Yes" : "No"),
            responsive: ['md'],
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
                    <Button color="green" variant="solid" onClick={showAddModal}
                        style={{ backgroundColor: "#20c997", borderColor: "#20c997" }} >Add User</Button>


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
                        labelCol={{ span: 10 }}
                        wrapperCol={{ span: 14 }}
                        style={{ maxWidth: '100%' }}
                        onFinish={onFinish}
                        initialValues={{ isAdmin: false }}
                    >
                        {(!editMode || !passwordEditMode) && (
                            <>

                                <Form.Item name="name" label="User Name" rules={[{ required: true, message: "Please Enter User Name" }]}>
                                    <Input />
                                </Form.Item>
                                <Form.Item name="userName" label="Login ID" rules={[{ required: true, message: "Please Enter Login ID" }]}>
                                    <Input />
                                </Form.Item>

                                <Form.Item
                                    name="isAdmin"
                                    label="Is Admin?"
                                    valuePropName="checked"
                                >
                                    <Switch
                                        onChange={(checked) => {
                                            if (checked) {
                                                form.setFieldsValue({
                                                    canViewOtherUsersData: true,
                                                    canAddData: true,
                                                    canUpdateData: true,
                                                });
                                            }
                                        }}
                                    />
                                </Form.Item>

                                {/* Reactive wrapper to auto-update when isAdmin changes */}
                                <Form.Item noStyle shouldUpdate={(prev, curr) => prev.isAdmin !== curr.isAdmin}>
                                    {({ getFieldValue }) => {
                                        const isAdmin = getFieldValue("isAdmin");
                                        return (
                                            <>
                                                <Form.Item
                                                    name="canViewOtherUsersData"
                                                    label="Can View Other Users’ Data"
                                                    valuePropName="checked"
                                                >
                                                    <Switch disabled={isAdmin} />
                                                </Form.Item>

                                                <Form.Item
                                                    name="canAddData"
                                                    label="Can Add New Data"
                                                    valuePropName="checked"
                                                >
                                                    <Switch disabled={isAdmin} />
                                                </Form.Item>

                                                <Form.Item
                                                    name="canUpdateData"
                                                    label="Can Update or Delete"
                                                    valuePropName="checked"
                                                >
                                                    <Switch disabled={isAdmin} />
                                                </Form.Item>
                                            </>
                                        );
                                    }}
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
                        labelCol={{ span: 10 }}
                        wrapperCol={{ span: 14 }}
                        style={{ maxWidth: '100%' }} initialValues={viewUser}>
                        <Form.Item label="User Name">
                            <Input value={viewUser?.name} />
                        </Form.Item>
                        <Form.Item label="Login ID">
                            <Input value={viewUser?.userName} />
                        </Form.Item>
                        <Form.Item label="Is Admin">
                            <Switch checked={viewUser?.isAdmin} />
                        </Form.Item>
                        <Form.Item label="Can Access Users Page">
                            <Switch checked={viewUser?.isAdmin} />
                        </Form.Item>
                        {/* {!viewUser?.isAdmin && <> */}
                        <Form.Item label="Can View Other Users’ Data">
                            <Switch checked={viewUser?.canViewOtherUsersData} />
                        </Form.Item>
                        <Form.Item label="Can Add New Data">
                            <Switch checked={viewUser?.canAddData} />
                        </Form.Item>
                        <Form.Item label="Can Update or Delete">
                            <Switch checked={viewUser?.canUpdateData} />
                        </Form.Item>
                        {/* </>} */}
                    </Form>
                </Modal>

            </div>
        </>
    );
};

export default Users;
