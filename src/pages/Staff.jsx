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
  CameraOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import { CONFIG } from "./clientConfig";

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

  // Image management states
  const [viewStaff, setViewStaff] = useState(null);
  const [imagesModalVisible, setImagesModalVisible] = useState(false);
  const [isDataUploading, setIsDataUploading] = useState(false);

  const [form] = Form.useForm();

  const selectedEntity = JSON.parse(localStorage.getItem("selectedEntity") || "null");
  const savedUser = JSON.parse(localStorage.getItem("user") || "null");

  const isAdmin = savedUser?.isAdmin;
  const canAddData = savedUser?.canAddData;
  const canUpdateData = savedUser?.canUpdateData;

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
      
      if (viewStaff) {
        const updated = res.data.staff.find(s => s._id === viewStaff._id);
        if (updated) setViewStaff(updated);
      }
    } catch (err) {
      messageApi.error("Failed to fetch staff.");
    }
    setLoading(false);
  };

  useEffect(() => {
    getStaff();
  }, [filters]);

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

  const UploadNewImageOnline = async (staffMember) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (event) => {
      setIsDataUploading(true);
      const file = event.target.files[0];
      if (!file) {
        setIsDataUploading(false);
        return;
      }

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", CONFIG.UPLOAD_PRESET);

        const response = await fetch(`https://api.cloudinary.com/v1_1/${CONFIG.CLOUD_NAME}/image/upload`, {
          method: "POST",
          body: formData
        });

        const result = await response.json();

        if (result.public_id) {
          const publicIdWithExt = `${result.public_id}.${result.format}`;
          const currentIds = staffMember.imagePublicIds || "";
          const updatedIds = currentIds ? `${currentIds},${publicIdWithExt}` : publicIdWithExt;

          const API = import.meta.env.VITE_API_BASE_URL;
          await axios.put(`${API}/staff/${staffMember._id}`, { ...staffMember, imagePublicIds: updatedIds }, {
            headers: { "X-Client": window.location.hostname.split(".")[0] },
          });

          messageApi.success('Document uploaded successfully');
          getStaff();
        }
      } catch (error) {
        messageApi.error('Upload failed');
      } finally {
        setIsDataUploading(false);
      }
    };
    input.click();
  };

  const deleteImage = async (publicId) => {
    try {
      const API = import.meta.env.VITE_API_BASE_URL;
      await axios.delete(`${API}/staff/image/${viewStaff._id}/${publicId}`, {
        headers: { "X-Client": window.location.hostname.split(".")[0] },
      });
      messageApi.success("Document deleted");
      getStaff();
    } catch {
      messageApi.error("Delete failed");
    }
  };

  const columns = [
    { title: "Name", dataIndex: "name", align: "center" },
    { title: "Designation", dataIndex: "designation", align: "center" },
    { title: "Status", dataIndex: "status", align: "center" },
    { title: "Salary", dataIndex: "salary", align: "center" },
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
        <div style={{ display: 'flex', justifyContent: 'center', gap: '5px' }}>
          <Button
            type="link" size="small"
            icon={<CameraOutlined />}
            style={{ color: '#c4941aff' }}
            onClick={() => {
              setViewStaff(record);
              setImagesModalVisible(true);
            }}
          />
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
              />
              <Popconfirm title="Delete Staff?" onConfirm={() => handleDelete(record._id)}>
                <Button icon={<DeleteOutlined />} size="small" type="link" danger />
              </Popconfirm>
            </>
          )}
        </div>
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

      {/* Edit/Add Modal */}
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
            <DatePicker style={{ width: "100%" }} format="DD - MMM - YYYY"/>
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
            <DatePicker style={{ width: "100%" }} format="DD - MMM - YYYY"/>
          </Form.Item>
        </Form>
      </Modal>

      {/* Documents Modal */}
      <Modal
        title={`Documents: ${viewStaff?.name || ''}`}
        open={imagesModalVisible}
        onCancel={() => setImagesModalVisible(false)}
        footer={null}
        width={800}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'center', minHeight: '100px' }}>
          {viewStaff?.imagePublicIds ? (
            viewStaff.imagePublicIds.split(',').map((publicId, index) => (
              <div key={index} style={{ position: 'relative', border: '1px solid #f0f0f0', padding: '5px', borderRadius: '4px' }}>
                <img
                  src={`https://res.cloudinary.com/${CONFIG.CLOUD_NAME}/image/upload/w_200,h_200,c_fill/${publicId}`}
                  alt="Staff Doc"
                  style={{ width: '150px', height: '150px', objectFit: 'cover', cursor: 'pointer', borderRadius: '2px' }}
                  onClick={() => window.open(`https://res.cloudinary.com/${CONFIG.CLOUD_NAME}/image/upload/${publicId}`, '_blank')}
                />
                {(isAdmin || canUpdateData) && (
                  <Popconfirm title="Delete this document?" onConfirm={() => deleteImage(publicId)}>
                    <Button type="primary" danger shape="circle" icon={<DeleteOutlined />} size="small" style={{ position: 'absolute', top: 10, right: 10 }} />
                  </Popconfirm>
                )}
              </div>
            ))
          ) : (
            <div style={{ color: '#999', marginTop: '20px' }}>No documents uploaded.</div>
          )}
        </div>
        {(isAdmin || canAddData || canUpdateData) && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '30px', borderTop: '1px solid #f0f0f0', paddingTop: '15px' }}>
            <Button type="primary" icon={<UploadOutlined />} loading={isDataUploading} onClick={() => UploadNewImageOnline(viewStaff)}>
              Upload New Document
            </Button>
          </div>
        )}
      </Modal>
    </>
  );
};

export default Staff;
