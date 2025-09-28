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
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";

const { Option } = Select;

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "resigned", label: "Resigned" },
  { value: "terminated", label: "Terminated" },
  { value: "on_leave", label: "On Leave" },
];

const Staff = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [messageApi, msgContextHolder] = message.useMessage();

  const [filters, setFilters] = useState({ name: "", status: "" });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [form] = Form.useForm();

  const selectedEntity = JSON.parse(localStorage.getItem("selectedEntity") || "null");
  const savedUser = JSON.parse(localStorage.getItem("user") || "null");

  const isAdmin = savedUser?.isAdmin;
  const canAddData = savedUser?.canAddData;
  const canUpdateData = savedUser?.canUpdateData;

  // Fetch Staff
  const getStaff = async () => {
    setLoading(true);
    try {
      const API = import.meta.env.VITE_API_BASE_URL;
      let url = `${API}/staff?`;

      if (filters.name) url += `name=${filters.name}&`;
      if (filters.status) url += `status=${filters.status}&`;
      if (selectedEntity) url += `entity=${selectedEntity.EntityId}&`;

      const res = await axios.get(url, {
        headers: { "X-Client": window.location.hostname.split(".")[0] },
      });

      setStaff(res.data.staff);
    } catch (err) {
      messageApi.error("Failed to fetch staff.");
    }
    setLoading(false);
  };

  useEffect(() => {
    getStaff();
  }, [filters]);

  // Save Staff (Add / Edit)
  const handleSave = async () => {
    try {
      let values = await form.validateFields();

      if (values.joiningDate) values.joiningDate = values.joiningDate.toISOString();
      if (values.dateOfLeave) values.dateOfLeave = values.dateOfLeave.toISOString();

      const API = import.meta.env.VITE_API_BASE_URL;
      let payload = { ...values };
      if (selectedEntity) payload.entity = selectedEntity.EntityId;

      if (editingStaff) {
        await axios.put(`${API}/staff/${editingStaff._id}`, payload, {
          headers: { "X-Client": window.location.hostname.split(".")[0] },
        });
        messageApi.success("Staff updated");
      } else {
        await axios.post(`${API}/staff`, payload, {
          headers: { "X-Client": window.location.hostname.split(".")[0] },
        });
        messageApi.success("Staff added");
      }

      setIsModalOpen(false);
      form.resetFields();
      setEditingStaff(null);
      getStaff();
    } catch (err) {
      messageApi.error("Save failed");
    }
  };

  // Delete Staff
  const handleDelete = async (id) => {
    try {
      const API = import.meta.env.VITE_API_BASE_URL;
      await axios.delete(`${API}/staff/${id}`, {
        headers: { "X-Client": window.location.hostname.split(".")[0] },
      });
      messageApi.success("Deleted");
      getStaff();
    } catch {
      messageApi.error("Delete failed");
    }
  };

  // Table Columns
  const columns = [
    { title: "Name", dataIndex: "name", align: "center" },
    { title: "Father Name", dataIndex: "fatherName", align: "center", responsive: ["md"] },
    { title: "Contact", dataIndex: "contact", align: "center", responsive: ["md"] },
    { title: "Designation", dataIndex: "designation", align: "center" },
    { title: "Salary", dataIndex: "salary", align: "center", render: (s) => `${s} Rs` },
    { title: "Status", dataIndex: "status", align: "center" },
    {
      title: "Joining Date",
      dataIndex: "joiningDate",
      align: "center",
      render: (date) => (date ? dayjs(date).format("DD/MM/YYYY") : ""),
      responsive: ["md"],
    },
    {
      title: "Date of Leave",
      dataIndex: "dateOfLeave",
      align: "center",
      render: (date) => (date ? dayjs(date).format("DD/MM/YYYY") : ""),
      responsive: ["md"],
    },
    {
      title: "Actions",
      align: "center",
      render: (record) => (
        <>
          {(isAdmin || canUpdateData) && (
            <>
              <Button
                icon={<EditOutlined />}
                size="small"
                type="link"
                onClick={() => {
                  setEditingStaff(record);
                  form.setFieldsValue({
                    ...record,
                    joiningDate: record.joiningDate ? dayjs(record.joiningDate) : null,
                    dateOfLeave: record.dateOfLeave ? dayjs(record.dateOfLeave) : null,
                  });
                  setIsModalOpen(true);
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

  return (
    <>
      {msgContextHolder}

      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4>Staff</h4>
          {(isAdmin || canAddData) && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingStaff(null);
                form.resetFields();
                setIsModalOpen(true);
              }}
              style={{
                background: "linear-gradient(to bottom right, #029bd2, #20c997)",
                borderColor: "#20c997",
              }}
            >
              Add Staff
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="d-flex mb-3 gap-2">
          <Input
            placeholder="Search by Name"
            value={filters.name}
            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
            allowClear
            style={{ width: 400 }}
          />
          <Select
            placeholder="Filter by Status"
            value={filters.status || undefined}
            onChange={(value) => setFilters({ ...filters, status: value })}
            allowClear
            style={{ width: 200 }}
          >
            {statusOptions.map((opt) => (
              <Option key={opt.value} value={opt.value}>
                {opt.label}
              </Option>
            ))}
          </Select>
        </div>

        <Table
          dataSource={staff}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 7 }}
        />
      </div>

      <Modal
        title={editingStaff ? "Edit Staff" : "Add Staff"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleSave}
        okText="Save"
      >
        <Form
          form={form}
          layout="horizontal"
          labelCol={{ span: 7 }}
          wrapperCol={{ span: 17 }}
          style={{ maxWidth: "100%" }}
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Name is required" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="fatherName" label="Father Name">
            <Input />
          </Form.Item>
          <Form.Item name="contact" label="Contact">
            <Input />
          </Form.Item>
          <Form.Item name="designation" label="Designation">
            <Input />
          </Form.Item>
          <Form.Item name="salary" label="Salary" rules={[{ required: true }]}>
            <Input type="number" />
          </Form.Item>
          <Form.Item name="joiningDate" label="Joining Date">
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="status" label="Status" initialValue="active">
            <Select>
              {statusOptions.map((opt) => (
                <Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="dateOfLeave" label="Date of Leave">
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default Staff;
