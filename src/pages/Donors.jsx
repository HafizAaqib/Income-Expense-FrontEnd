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
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import axios from "axios";

const { Option } = Select;

const Donors = () => {
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ status: "", search: "" });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const [messageApi, msgContextHolder] = message.useMessage();
  const selectedEntity = JSON.parse(localStorage.getItem("selectedEntity") || "null");

  const savedUser = JSON.parse(localStorage.getItem("user") || "null");
  const isAdmin = savedUser?.isAdmin;
  const canAddData = savedUser?.canAddData;
  const canUpdateData = savedUser?.canUpdateData;

  const API = import.meta.env.VITE_API_BASE_URL;
  const clientHeader = { "X-Client": window.location.hostname.split(".")[0] };

  // Fetch Donors
  const getDonors = async () => {
    setLoading(true);
    try {
      let url = `${API}/donors?`;
      if (filters.status) url += `status=${filters.status}&`;
      if (filters.search) url += `search=${filters.search}&`;
      if (selectedEntity) url += `entity=${selectedEntity.EntityId}&`;

      const res = await axios.get(url, { headers: clientHeader });
      setDonors(res.data.donors);
    } catch {
      messageApi.error("Failed to fetch donors");
    }
    setLoading(false);
  };

  useEffect(() => {
    getDonors();
  }, [filters]);

  // Save
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      let payload = { ...values };
            if (selectedEntity) payload.entity = selectedEntity.EntityId;

      if (editing) {
        await axios.put(`${API}/donors/${editing._id}`, payload, {
          headers: clientHeader,
        });
        messageApi.success("Donor updated");
      } else {
        await axios.post(`${API}/donors`, payload, { headers: clientHeader });
        messageApi.success("Donor added");
      }

      setIsModalOpen(false);
      form.resetFields();
      setEditing(null);
      getDonors();
    } catch {
      messageApi.error("Save failed");
    }
  };

  // Delete
  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/donors/${id}`, { headers: clientHeader });
      messageApi.success("Donor deleted");
      getDonors();
    } catch {
      messageApi.error("Delete failed");
    }
  };

  const columns = [
    { title: "Name", dataIndex: "name", align: "center" },
    { title: "Contact", dataIndex: "contact", align: "center" },
    {
      title: "Monthly Commitment",
      dataIndex: "monthlyCommitment",
      align: "center",
      render: (v) => Number(v || 0).toLocaleString(),
    },
    { title: "Status", dataIndex: "status", align: "center" },
    { title: "Address", dataIndex: "address", align: "center" },
    {
      title: "Actions",
      align: "center",
      render: (record) =>
        (isAdmin || canUpdateData) && (
          <>
            <Button
              icon={<EditOutlined />}
              size="small"
              type="link"
              onClick={() => {
                setEditing(record);
                form.setFieldsValue(record);
                setIsModalOpen(true);
              }}
            >
              <span className="d-none d-md-inline">Edit</span>
            </Button>
            <Popconfirm
              title="Delete this donor?"
              onConfirm={() => handleDelete(record._id)}
              okText="Yes"
              cancelText="No"
            >
              <Button icon={<DeleteOutlined />} size="small" type="link" danger>
                <span className="d-none d-md-inline">Delete</span>
              </Button>
            </Popconfirm>
          </>
        ),
    },
  ];

  return (
    <>
      {msgContextHolder}
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4>Regular Donors</h4>
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
              Add Donor
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
            <Option value="active">Active</Option>
            <Option value="inactive">Inactive</Option>
          </Select>
          <Input
            placeholder="Search by name"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            style={{ width: 220 }}
            allowClear
          />
        </div>

        <Table
          dataSource={donors}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 7 }}
        />
      </div>

      {/* Modal */}
      <Modal
        title={editing ? "Edit Donor" : "Add Donor"}
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
            name="name"
            label="Name"
            rules={[{ required: true, message: "Name is required" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="contact" label="Contact">
            <Input />
          </Form.Item>
          <Form.Item name="monthlyCommitment" label="Commitment">
            <Input type="number" />
          </Form.Item>
          <Form.Item name="status" label="Status" initialValue="active">
            <Select>
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
            </Select>
          </Form.Item>
          <Form.Item name="address" label="Address">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default Donors;
