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
  { value: "passed_out", label: "Passed Out" },
  { value: "left", label: "Left" },
  { value: "expelled", label: "Expelled" },
  { value: "on_hold", label: "On Hold" },
];

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [messageApi, msgContextHolder] = message.useMessage();

  const [filters, setFilters] = useState({ name: "", status: "" });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [form] = Form.useForm();

  const selectedEntity = JSON.parse(localStorage.getItem("selectedEntity") || "null");
  const savedUser = JSON.parse(localStorage.getItem("user") || "null");

  const isAdmin = savedUser?.isAdmin;
  const canAddData = savedUser?.canAddData;
  const canUpdateData = savedUser?.canUpdateData;

  // Fetch Students
  const getStudents = async () => {
    setLoading(true);
    try {
      const API = import.meta.env.VITE_API_BASE_URL;
      let url = `${API}/students?`;

      if (filters.name) url += `name=${filters.name}&`;
      if (filters.status) url += `status=${filters.status}&`;
      if (selectedEntity) url += `entity=${selectedEntity.EntityId}&`;

      const res = await axios.get(url, {
        headers: { "X-Client": window.location.hostname.split(".")[0] },
      });

      setStudents(res.data.students);
    } catch (err) {
      messageApi.error("Failed to fetch students.");
    }
    setLoading(false);
  };

  useEffect(() => {
    getStudents();
  }, [filters]);

  // Save Student (Add / Edit)
  const handleSave = async () => {
    try {
      let values = await form.validateFields();

      // Convert dates to ISO
      if (values.admissionDate) {
        values.admissionDate = values.admissionDate.toISOString();
      }
      if (values.dateOfLeave) {
        values.dateOfLeave = values.dateOfLeave.toISOString();
      }

      const API = import.meta.env.VITE_API_BASE_URL;
      let payload = { ...values };
      if (selectedEntity) payload.entity = selectedEntity.EntityId;

      if (editingStudent) {
        await axios.put(`${API}/students/${editingStudent._id}`, payload, {
          headers: { "X-Client": window.location.hostname.split(".")[0] },
        });
        messageApi.success("Student updated");
      } else {
        await axios.post(`${API}/students`, payload, {
          headers: { "X-Client": window.location.hostname.split(".")[0] },
        });
        messageApi.success("Student added");
      }

      setIsModalOpen(false);
      form.resetFields();
      setEditingStudent(null);
      getStudents();
    } catch (err) {
      messageApi.error("Save failed");
    }
  };

  // Delete Student
  const handleDelete = async (id) => {
    try {
      const API = import.meta.env.VITE_API_BASE_URL;
      await axios.delete(`${API}/students/${id}`, {
        headers: { "X-Client": window.location.hostname.split(".")[0] },
      });
      messageApi.success("Deleted");
      getStudents();
    } catch {
      messageApi.error("Delete failed");
    }
  };

  // Table Columns
  const columns = [
    { title: "Name", dataIndex: "name", align: "center" },
    { title: "Father Name", dataIndex: "fatherName", align: "center" ,responsive: ['md'],},
    { title: "Contact", dataIndex: "contact", align: "center" ,responsive: ['md'],},
    { title: "Status", dataIndex: "status", align: "center" },
    { title: "Monthly Fee", dataIndex: "monthlyFee", align: "center" },
    {
      title: "Admission Date",
      dataIndex: "admissionDate",
      align: "center",
      render: (date) => (date ? dayjs(date).format("DD/MM/YYYY") : ""),
      responsive: ['md'],
    },
    {
      title: "Date of Leave",
      dataIndex: "dateOfLeave",
      align: "center",
      render: (date) => (date ? dayjs(date).format("DD/MM/YYYY") : ""),
      responsive: ['md'],
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
                  setEditingStudent(record);
                  form.setFieldsValue({
                    ...record,
                    admissionDate: record.admissionDate
                      ? dayjs(record.admissionDate)
                      : null,
                    dateOfLeave: record.dateOfLeave
                      ? dayjs(record.dateOfLeave)
                      : null,
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
                <Button
                  icon={<DeleteOutlined />}
                  size="small"
                  type="link"
                  danger
                >
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
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4>Students</h4>
          {(isAdmin || canAddData) && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingStudent(null);
                form.resetFields();
                setIsModalOpen(true);
              }}
              style={{
                background: "linear-gradient(to bottom right, #029bd2, #20c997)",
                borderColor: "#20c997",
              }}
            >
              Add Student
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

        {/* Table */}
        <Table
          dataSource={students}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 7 }}
        />
      </div>

      {/* Modal */}
      <Modal
        title={editingStudent ? "Edit Student" : "Add Student"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleSave}
        okText="Save"
      >
        <Form form={form} 
         layout="horizontal"
                        labelCol={{ span: 6 }}
                        wrapperCol={{ span: 18 }}
                        style={{ maxWidth: '100%' }}>
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
          <Form.Item name="monthlyFee" label="Monthly Fee">
            <Input type="number" />
          </Form.Item>
          <Form.Item name="admissionDate" label="Admission Date">
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

export default Students;
