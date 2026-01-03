// GraveReservations.jsx
import { useEffect, useState } from "react";
import {
    Table, Input, Button, message, Popconfirm, Modal, Form, DatePicker, Space, Select
} from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined, DollarOutlined } from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";

const { Option } = Select;

const GraveReservations = () => {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [messageApi, msgContextHolder] = message.useMessage();

    const [filters, setFilters] = useState({ status: "unpaid", name: "" });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPayModalOpen, setIsPayModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [payingRecord, setPayingRecord] = useState(null);

    const [form] = Form.useForm();
    const [payForm] = Form.useForm();

    const [categories, setCategories] = useState([]);

    const selectedEntity = JSON.parse(localStorage.getItem("selectedEntity") || "null");
    const savedUser = JSON.parse(localStorage.getItem("user") || "null");

    const isAdmin = savedUser?.isAdmin;
    const canAddData = savedUser?.canAddData;
    const canUpdateData = savedUser?.canUpdateData;

    const statusOptions = [
        { value: "unpaid", label: "Unpaid" },
        { value: "paid", label: "Paid" },
        { value: "", label: "All" },
    ];


    const API = import.meta.env.VITE_API_BASE_URL;
    const clientHeader = { "X-Client": window.location.hostname.split(".")[0] };

    const getReservations = async () => {
        setLoading(true);
        try {
            let url = `${API}/grave-reservations?`;
            if (filters.status) url += `status=${filters.status}&`;
            if (filters.name) url += `name=${encodeURIComponent(filters.name)}&`;
            if (selectedEntity) url += `entity=${selectedEntity.EntityId}&`;

            const res = await axios.get(url, { headers: clientHeader });
            setReservations(res.data.reservations || []);
        } catch (err) {
            messageApi.error("Failed to fetch reservations");
        }
        setLoading(false);
    };

    const getCategories = async () => {
        try {
            let url = `${API}/categories?type=income`;
            if (selectedEntity) url += `&entity=${selectedEntity.EntityId}`;
            const res = await axios.get(url, { headers: clientHeader });
            setCategories(res.data.categories || []);
        } catch {
            messageApi.error("Failed to fetch categories");
        }
    };

    useEffect(() => {
        getReservations();
        getCategories();
        // eslint-disable-next-line
    }, [filters]);

    const handleSave = async () => {
        try {
            let values = await form.validateFields();
            if (values.date) values.date = values.date.toISOString();

            if (editing) {
                await axios.put(`${API}/grave-reservations/${editing._id}`, values, { headers: clientHeader });
                messageApi.success("Reservation updated");
            } else {
                if (selectedEntity) values.entity = selectedEntity.EntityId;
                await axios.post(`${API}/grave-reservations`, values, { headers: clientHeader });
                messageApi.success("Reservation added");
            }

            setIsModalOpen(false);
            form.resetFields();
            setEditing(null);
            getReservations();
        } catch (err) {
            console.error(err);
            messageApi.error("Save failed");
        }
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`${API}/grave-reservations/${id}`, { headers: clientHeader });
            messageApi.success("Deleted");
            getReservations();
        } catch {
            messageApi.error("Delete failed");
        }
    };

    const handlePay = async () => {
        try {
            const values = await payForm.validateFields();
            if (values.paymentDate) values.paymentDate = values.paymentDate.toISOString();

            await axios.post(`${API}/grave-reservations/${payingRecord._id}/pay`, {
                category: values.category, // ✅ added
                paidBy: values.paidBy,
                phoneNumber: values.phoneNumber,
                date: values.paymentDate,
                description: values.description,
                user: savedUser?._id
            }, { headers: clientHeader });

            messageApi.success("Payment successful");
            setIsPayModalOpen(false);
            payForm.resetFields();
            setPayingRecord(null);
            getReservations();
        } catch (err) {
            console.error(err);
            messageApi.error(err?.response?.data?.message || "Payment failed");
        }
    };

    const columns = [
        { title: "Deceased Name", dataIndex: "name", align: "center" },
        { title: "Father Name", dataIndex: "fatherName", align: "center", responsive: ["md"] },
        { title: "Date", dataIndex: "date", align: "center", render: d => d ? dayjs(d).format("DD MMM YYYY") : "" },
        { title: "Contact", dataIndex: "contact", align: "center", responsive: ["md"] },
        { title: "Address", dataIndex: "address", align: "center", responsive: ["md"] },
        { title: "Amount", dataIndex: "amount", align: "center", render: a => Number(a || 0).toLocaleString() },
        { title: "Grave Details", dataIndex: "otherDetails", align: "center", responsive: ["md"] },
        { title: "Status", dataIndex: "status", align: "center" ,
            render: (status) =>
                status ? statusOptions.find((opt) => opt.value === status).label : "",
        },
        ...(filters.status !== "unpaid" ? [{ title: "Receipt No", dataIndex: "receiptNumber", align: "center" }] : []),
        ...(filters.status !== "paid" ? [{
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
                                        date: record.date ? dayjs(record.date) : null
                                    });
                                    setIsModalOpen(true);
                                }}
                            >
                                <span className="d-none d-md-inline">Edit</span>
                            </Button>
                            <Popconfirm
                                title="Delete this reservation?"
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
                    {record.status === "unpaid" && (isAdmin || canAddData) && (
                        <Button
                            icon={<DollarOutlined />}
                            size="small"
                            type="link"
                            style={{ color: "green" }}
                            onClick={() => {
                                setPayingRecord(record);
                                payForm.setFieldsValue({
                                    category: undefined,
                                    paymentDate: dayjs(),
                                    paidBy: record.name,
                                    phoneNumber: record.contact || ""
                                });
                                setIsPayModalOpen(true);
                            }}
                        >
                            <span className="d-none d-md-inline">Pay</span>
                        </Button>
                    )}
                </>
            )
        }] : [])
    ];

    return (
        <>
            {msgContextHolder}
            <div className="container mt-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h4>Grave Reservations</h4>
                    {(isAdmin || canAddData) && (
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => {
                                setEditing(null);
                                form.resetFields();
                                setIsModalOpen(true);
                            }}
                            style={{ background: "linear-gradient(to bottom right, #029bd2, #20c997)", borderColor: "#20c997" }}
                        >
                            Add Reservation
                        </Button>
                    )}
                </div>

                {/* Filters */}
                <div className="d-flex mb-3 gap-2">
                    <Input
                        placeholder="Search by name"
                        value={filters.name}
                        onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                        allowClear
                        style={{ width: 300 }}
                    />

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
                    

                </div>

                <div className="transaction-table-wrapper">
                    <Table
                        dataSource={reservations}
                        columns={columns}
                        rowKey="_id"
                        loading={loading}
                        pagination={{ pageSize: 7 }}
                    />
                </div>
            </div>

            {/* Add / Edit Modal */}
            <Modal
                title={editing ? "Edit Reservation" : "Add Reservation"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={handleSave}
                okText="Save"
            >
                <Form form={form} layout="horizontal" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }} style={{ maxWidth: "100%" }}>
                    <Form.Item name="name" label="Deceased Name" rules={[{ required: true, message: "Name is required" }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="fatherName" label="Father Name">
                        <Input />
                    </Form.Item>
                    <Form.Item name="date" label="Date" rules={[{ required: true, message: "Date is required" }]}>
                        <DatePicker style={{ width: "100%" }} format="DD - MMM - YYYY" />
                    </Form.Item>
                    <Form.Item name="contact" label="Contact">
                        <Input />
                    </Form.Item>
                    <Form.Item name="address" label="Address">
                        <Input />
                    </Form.Item>
                    <Form.Item name="amount" label="Amount" rules={[{ required: true, message: "Amount is required" }]}>
                        <Input type="number" />
                    </Form.Item>
                    <Form.Item name="otherDetails" label="Grave Details">
                        <Input.TextArea rows={3} />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Pay Modal */}
            <Modal
                title="Pay Reservation"
                open={isPayModalOpen}
                onCancel={() => setIsPayModalOpen(false)}
                onOk={handlePay}
                okText="Confirm Payment"
            >
                <Form form={payForm} layout="horizontal" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
                    <Form.Item
                        name="category"
                        label="Category"
                        rules={[{ required: true, message: "Category is required" }]}
                    >
                        <Select placeholder="Select Income Category">
                            {categories.map((c) => (
                                <Option key={c._id} value={c._id}>
                                    {c.name}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="paymentDate" label="Payment Date" rules={[{ required: true, message: "Payment Date is required" }]}>
                        <DatePicker style={{ width: "100%" }} format="DD - MMM - YYYY"/>
                    </Form.Item>
                    <Form.Item name="paidBy" label="Paid By" rules={[{ required: true, message: "Paid By is required" }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="phoneNumber" label="Phone">
                        <Input />
                    </Form.Item>
                    <Form.Item name="description" label="Description">
                        <Input.TextArea rows={3} />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};

export default GraveReservations;
