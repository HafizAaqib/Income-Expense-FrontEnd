import { useEffect, useState } from "react";
import {
    Table,
    Input,
    Button,
    message,
    Popconfirm,
    Modal,
    Form,
    Select,
    DatePicker,
} from "antd";
import {
    EditOutlined,
    DeleteOutlined,
    PlusOutlined,
    DollarOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";

const { Option } = Select;

const statusOptions = [
    { value: "unpaid", label: "Unpaid" },
    { value: "paid", label: "Paid" },
];

const DuePayments = () => {
    const [duePayments, setDuePayments] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [messageApi, msgContextHolder] = message.useMessage();

    const [filters, setFilters] = useState({ status: "unpaid", category: "" }); // default unpaid

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPayModalOpen, setIsPayModalOpen] = useState(false);

    const [editing, setEditing] = useState(null);
    const [payingRecord, setPayingRecord] = useState(null);


    const [form] = Form.useForm();
    const [payForm] = Form.useForm();

    const selectedEntity = JSON.parse(localStorage.getItem("selectedEntity") || "null");
    const savedUser = JSON.parse(localStorage.getItem("user") || "null");

    const isAdmin = savedUser?.isAdmin;
    const canAddData = savedUser?.canAddData;
    const canUpdateData = savedUser?.canUpdateData;

    // Fetch Categories (Expense type only)
    const getCategories = async () => {
        try {
            const API = import.meta.env.VITE_API_BASE_URL;
            let url = `${API}/categories?type=expense`;
            if (selectedEntity) url += `&entity=${selectedEntity.EntityId}`;

            const res = await axios.get(url, {
                headers: { "X-Client": window.location.hostname.split(".")[0] },
            });
            setCategories(res.data.categories);
        } catch {
            messageApi.error("Failed to fetch categories");
        }
    };

    // Fetch DuePayments
    const getDuePayments = async () => {
        setLoading(true);
        try {
            const API = import.meta.env.VITE_API_BASE_URL;
            let url = `${API}/due-payments?`;
            if (filters.status) url += `status=${filters.status}&`;
            if (filters.category) url += `category=${filters.category}&`;
            if (selectedEntity) url += `entity=${selectedEntity.EntityId}&`;

            const res = await axios.get(url, {
                headers: { "X-Client": window.location.hostname.split(".")[0] },
            });
            setDuePayments(res.data.duePayments);
        } catch {
            messageApi.error("Failed to fetch due payments");
        }
        setLoading(false);
    };

    useEffect(() => {
        getCategories();
    }, []);

    useEffect(() => {
        getDuePayments();
    }, [filters]);

    // Save (Add / Edit)
    const handleSave = async () => {
        try {
            let values = await form.validateFields();
            if (values.dueDate) values.dueDate = values.dueDate.toISOString();

            const API = import.meta.env.VITE_API_BASE_URL;

            if (editing) {
                await axios.put(`${API}/due-payments/${editing._id}`, values, {
                    headers: { "X-Client": window.location.hostname.split(".")[0] },
                });
                messageApi.success("Due Payment updated");
            } else {
                await axios.post(`${API}/due-payments`, values, {
                    headers: { "X-Client": window.location.hostname.split(".")[0] },
                });
                messageApi.success("Due Payment added");
            }

            setIsModalOpen(false);
            form.resetFields();
            setEditing(null);
            //getDuePayments();
            window.location.reload();
        } catch {
            messageApi.error("Save failed");
        }
    };

    // Delete
    const handleDelete = async (id) => {
        try {
            const API = import.meta.env.VITE_API_BASE_URL;
            await axios.delete(`${API}/due-payments/${id}`, {
                headers: { "X-Client": window.location.hostname.split(".")[0] },
            });
            messageApi.success("Deleted");
            //getDuePayments();
            window.location.reload();
        } catch {
            messageApi.error("Delete failed");
        }
    };

    // Pay
    const handlePay = async () => {
        try {
            const values = await payForm.validateFields();
            if (values.paymentDate) {
                values.paymentDate = values.paymentDate.toISOString();
            }

            const API = import.meta.env.VITE_API_BASE_URL;

            await axios.post(
                `${API}/due-payments/${payingRecord._id}/pay`,
                {
                    reference: values.paidTo,         // maps to transaction.reference
                    date: values.paymentDate,         // maps to transaction.date
                    phoneNumber: values.phoneNumber,  // maps to transaction.phoneNumber
                    description: values.description,  // overrides / sets new description
                    user: JSON.parse(localStorage.getItem('user'))._id
                },
                {
                    headers: { "X-Client": window.location.hostname.split(".")[0] },
                }
            );

            messageApi.success("Payment successful");
            setIsPayModalOpen(false);
            payForm.resetFields();
            setPayingRecord(null);
            //getDuePayments();
            window.location.reload();

        } catch (err){
            console.error(err)
            messageApi.error("Payment failed");
        }
    };


    const columns = [
        { title: "Category", dataIndex: ["category", "name"], align: "center" },
        { title: "Amount", dataIndex: "amount", align: "center" },
        {
            title: "Due Date",
            dataIndex: "dueDate",
            align: "center",
            render: (date) => (date ? dayjs(date).format("DD MMM YYYY") : ""),
        },
        {
            title: "Status",
            dataIndex: "status",
            align: "center",
            responsive: ["md"],
            render: (status) =>
                status ? statusOptions.find((opt) => opt.value === status).label : "",
        },
        { title: "Description", dataIndex: "description", align: "center", responsive: ["md"], },

        ...(filters.status !== "unpaid"
            ? [
                {
                    title: "Receipt No",
                    dataIndex: "receiptNumber",
                    align: "center",
                },
            ]
            : []),

        ...(filters.status !== "paid"
            ? [
                {
                    title: "Actions",
                    align: "center",
                    render: (record) => (
                        <>
                            {record.status === "unpaid" && (isAdmin || canUpdateData) && (
                                <>
                                    <Button
                                        icon={<EditOutlined />}
                                        size="small"
                                        type="link"
                                        onClick={() => {
                                            setEditing(record);
                                            form.setFieldsValue({
                                                ...record,
                                                category: record.category?._id,
                                                dueDate: record.dueDate ? dayjs(record.dueDate) : null,
                                            });
                                            setIsModalOpen(true);
                                        }}
                                    >
                                        <span className="d-none d-md-inline">Edit</span>
                                    </Button>
                                    <Popconfirm
                                        title="Delete this due payment?"
                                        onConfirm={() => handleDelete(record._id)}
                                        okText="Yes"
                                        cancelText="No"
                                    >
                                        <Button icon={<DeleteOutlined />} size="small" type="link" danger>
                                            <span className="d-none d-md-inline">Delete</span>
                                        </Button>
                                    </Popconfirm>
                                    <Button
                                        icon={<DollarOutlined />}
                                        size="small"
                                        type="link"
                                        style={{ color: "green" }}
                                        onClick={() => {
                                            setPayingRecord(record);
                                            payForm.setFieldsValue({
                                                paymentDate: dayjs(),
                                            });
                                            setIsPayModalOpen(true);
                                        }}
                                    >
                                        <span className="d-none d-md-inline">Pay</span>
                                    </Button>
                                </>
                            )}
                        </>
                    ),
                },
            ]
            : []),

    ];

    return (
        <>
            {msgContextHolder}
            <div className="container mt-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h4>Due Payments</h4>
                    {(isAdmin || canAddData) && (
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => {
                                setEditing(null);
                                form.resetFields();
                                setIsModalOpen(true);
                            }}
                            style={{
                                background: "linear-gradient(to bottom right, #029bd2, #20c997)",
                                borderColor: "#20c997",
                            }}
                        >
                            Add Due Payment
                        </Button>
                    )}
                </div>

                {/* Filters */}
                <div className="d-flex mb-3 gap-2">
                    <Select
                        placeholder="Filter by Status"
                        value={filters.status || undefined}
                        onChange={(v) => setFilters({ ...filters, status: v })}
                        allowClear
                        style={{ width: 180 }}
                    >
                        {statusOptions.map((opt) => (
                            <Option key={opt.value} value={opt.value}>
                                {opt.label}
                            </Option>
                        ))}
                    </Select>
                    <Select
                        placeholder="Filter by Category"
                        value={filters.category || undefined}
                        onChange={(v) => setFilters({ ...filters, category: v })}
                        allowClear
                        style={{ width: 220 }}
                    >
                        {categories
                        .filter(cat => cat.status === 1) // exclude hidden categories
                        .map((c) => (
                            <Option key={c._id} value={c._id}>
                                {c.name}
                            </Option>
                        ))}
                    </Select>
                </div>

                <div className="transaction-table-wrapper">
                    <Table
                        dataSource={duePayments}
                        columns={columns}
                        rowKey="_id"
                        loading={loading}
                        pagination={{ pageSize: 7 }}
                    />
                </div>
            </div>

            {/* Add/Edit Modal */}
            <Modal
                title={editing ? "Edit Due Payment" : "Add Due Payment"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={handleSave}
                okText="Save"
            >
                <Form
                    form={form}
                    layout="horizontal"
                    labelCol={{ span: 6 }}
                    wrapperCol={{ span: 18 }}
                    style={{ maxWidth: "100%" }}
                >
                    <Form.Item
                        name="category"
                        label="Category"
                        rules={[{ required: true, message: "Category is required" }]}
                    >
                        <Select>
                            {categories
                            .filter(cat => cat.status === 1) // exclude hidden categories
                            .map((c) => (
                                <Option key={c._id} value={c._id}>
                                    {c.name}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name="amount"
                        label="Amount"
                        rules={[{ required: true, message: "Amount is required" }]}
                    >
                        <Input type="number" />
                    </Form.Item>
                    <Form.Item
                        name="dueDate"
                        label="Due Date"
                        rules={[{ required: true, message: "Due Date is required" }]}
                    >
                        <DatePicker style={{ width: "100%" }} format="DD - MMM - YYYY" />
                    </Form.Item>
                    <Form.Item name="description" label="Description">
                        <Input.TextArea rows={3} />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Pay Modal */}
            <Modal
                title="Pay Due Payment"
                open={isPayModalOpen}
                onCancel={() => setIsPayModalOpen(false)}
                onOk={handlePay}
                okText="Confirm Payment"
            >
                <Form
                    form={payForm}
                    layout="horizontal"
                    labelCol={{ span: 6 }}
                    wrapperCol={{ span: 18 }}
                    style={{ maxWidth: "100%" }}
                >

                    <Form.Item
                        name="paymentDate"
                        label="Payment Date"
                        rules={[{ required: true, message: "Payment Date is required" }]}
                    >
                        <DatePicker style={{
                            width: "100%" }}
                            format="DD - MMM - YYYY" />
                    </Form.Item>


                    <Form.Item
                        name="paidTo"
                        label="Paid To"
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="phoneNumber"
                        label="Phone Number"
                    >
                        <Input />
                    </Form.Item>


                    <Form.Item
                        name="description"
                        label="Description"
                    >
                        <Input.TextArea rows={3} />
                    </Form.Item>
                </Form>
            </Modal>

        </>
    );
};

export default DuePayments;
