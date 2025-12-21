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
  Row,
  Col
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
import { CONFIG } from "./clientConfig"; // Ensure this is available

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
  
  // Image states
  const [viewStudent, setViewStudent] = useState(null);
  const [imagesModalVisible, setImagesModalVisible] = useState(false);
  const [isDataUploading, setIsDataUploading] = useState(false);

  const [form] = Form.useForm();

  const selectedEntity = JSON.parse(localStorage.getItem("selectedEntity") || "null");
  const savedUser = JSON.parse(localStorage.getItem("user") || "null");

  const isAdmin = savedUser?.isAdmin;
  const canAddData = savedUser?.canAddData;
  const canUpdateData = savedUser?.canUpdateData;

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
      
      // Update the viewStudent reference if it's currently open to refresh images
      if (viewStudent) {
        const updated = res.data.students.find(s => s._id === viewStudent._id);
        if (updated) setViewStudent(updated);
      }
    } catch (err) {
      messageApi.error("Failed to fetch students.");
    }
    setLoading(false);
  };

  useEffect(() => {
    getStudents();
  }, [filters]);

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

  // Cloudinary Upload Logic
  const UploadNewImageOnline = async (student) => {
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
          const currentIds = student.imagePublicIds || "";
          const updatedIds = currentIds ? `${currentIds},${publicIdWithExt}` : publicIdWithExt;

          const API = import.meta.env.VITE_API_BASE_URL;
          await axios.put(`${API}/students/${student._id}`, { ...student, imagePublicIds: updatedIds }, {
            headers: { "X-Client": window.location.hostname.split(".")[0] },
          });

          messageApi.success('Document uploaded successfully');
          getStudents();
        }
      } catch (error) {
        messageApi.error('Upload failed');
      } finally {
        setIsDataUploading(false);
      }
    };
    input.click();
  };

  // Delete Individual Image Logic
  const deleteImage = async (publicId) => {
    try {
      const API = import.meta.env.VITE_API_BASE_URL;
      await axios.delete(`${API}/students/image/${viewStudent._id}/${publicId}`, {
        headers: { "X-Client": window.location.hostname.split(".")[0] },
      });
      messageApi.success("Document deleted");
      getStudents();
    } catch {
      messageApi.error("Delete failed");
    }
  };

  const columns = [
    { title: "Name", dataIndex: "name", align: "center" },
    { title: "Father Name", dataIndex: "fatherName", align: "center", responsive: ['md'] },
    { title: "Contact", dataIndex: "contact", align: "center", responsive: ['md'] },
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
        <div style={{ display: 'flex', justifyContent: 'center', gap: '5px' }}>
          <Button
            type="link" size="small"
            icon={<CameraOutlined />}
            style={{ color: '#c4941aff' }}
            onClick={() => {
              setViewStudent(record);
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
              />
              <Popconfirm
               title="Delete Student?"
               onConfirm={() => handleDelete(record._id)}
               >
                <Button icon={<DeleteOutlined />}
                 size="small"
                  type="link"
                   danger />
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
          dataSource={students}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 7 }}
        />
      </div>

      {/* Main Student Add/Edit Modal */}
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

      {/* NEW: Document Viewer and Upload Modal */}
      <Modal
        title={`Documents: ${viewStudent?.name || ''}`}
        open={imagesModalVisible}
        onCancel={() => setImagesModalVisible(false)}
        footer={null}
        width={800}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'center', minHeight: '100px' }}>
          {viewStudent?.imagePublicIds ? (
            viewStudent.imagePublicIds.split(',').map((publicId, index) => (
              <div key={index} style={{ position: 'relative', border: '1px solid #f0f0f0', padding: '5px', borderRadius: '4px' }}>
                <img
                  src={`https://res.cloudinary.com/${CONFIG.CLOUD_NAME}/image/upload/w_200,h_200,c_fill/${publicId}`}
                  alt="Student Doc"
                  style={{ width: '150px', height: '150px', objectFit: 'cover', cursor: 'pointer', borderRadius: '2px' }}
                  onClick={() => window.open(`https://res.cloudinary.com/${CONFIG.CLOUD_NAME}/image/upload/${publicId}`, '_blank')}
                  onError={(e) => {
                    e.target.src = `https://res.cloudinary.com/${CONFIG.CLOUD_NAME}/image/upload/${publicId}`;
                  }}
                />
                {(isAdmin || canUpdateData) && (
                  <Popconfirm title="Delete this document?" onConfirm={() => deleteImage(publicId)}>
                    <Button
                      type="primary"
                      danger
                      shape="circle"
                      icon={<DeleteOutlined />}
                      size="small"
                      style={{ position: 'absolute', top: 10, right: 10 }}
                    />
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
            <Button
              type="primary"
              icon={<UploadOutlined />}
              loading={isDataUploading}
              onClick={() => UploadNewImageOnline(viewStudent)}
            >
              Upload New Document
            </Button>
          </div>
        )}
      </Modal>
    </>
  );
};

export default Students;