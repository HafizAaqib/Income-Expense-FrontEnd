import { useEffect, useState } from 'react';
import { Table, Input, Button, message, Popconfirm, Select, Tag, Modal, Form, Space } from 'antd';
import { 
  EditOutlined, 
  DeleteOutlined, 
  PlusOutlined, 
  CameraOutlined, 
  UploadOutlined,
  FileImageOutlined,
  EyeOutlined 
} from '@ant-design/icons';
import axios from 'axios';
import { CONFIG } from "./clientConfig"; 

const ProductCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form] = Form.useForm();
  const [messageApi, msgContextHolder] = message.useMessage();
  
  // Image states
  const [viewCategory, setViewCategory] = useState(null);
  const [imgModalVisible, setImgModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);

  const API = import.meta.env.VITE_API_BASE_URL;
  const selectedEntity = JSON.parse(localStorage.getItem('selectedEntity') || 'null');
  const savedUser = JSON.parse(localStorage.getItem('user') || 'null');

  const isAdmin = savedUser?.isAdmin;
  const canAddData = savedUser?.canAddData;
  const canUpdateData = savedUser?.canUpdateData;

  // Status options mapping (matching Categories.jsx)
  const statusOptions = [
    { label: 'Active', value: 1, color: 'green' },
     { label: 'Inactive', value: 2, color: 'orange' },
    // { label: 'Closed (Keep Records)', value: 2, color: 'orange' },
    // { label: 'Closed (Hide Records)', value: 3, color: 'red' },
  ];

  // Helper to build hierarchy for Ant Design Tree Table
  const buildTree = (flatData) => {
    const map = {};
    flatData.forEach(item => map[item._id] = { ...item, key: item._id });
    const tree = [];
    flatData.forEach(item => {
      if (item.parentId?._id && map[item.parentId._id]) {
        if (!map[item.parentId._id].children) map[item.parentId._id].children = [];
        map[item.parentId._id].children.push(map[item._id]);
      } else if (item.level === 1) {
        tree.push(map[item._id]);
      }
    });
    return tree;
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      let url = `${API}/product-categories`;
      if (selectedEntity?.EntityId) url += `?entity=${selectedEntity.EntityId}`;

      const res = await axios.get(url, {
        headers: { "X-Client": window.location.hostname.split(".")[0] }
      });
      
      const treeData = buildTree(res.data.categories);
      setCategories(treeData);

      if (viewCategory) {
        const updated = res.data.categories.find(c => c._id === viewCategory._id);
        if (updated) setViewCategory(updated);
      }
    } catch (err) { messageApi.error("Failed to load categories"); }
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleSave = async () => {
    const values = await form.validateFields();
    if (selectedEntity) values.entity = selectedEntity.EntityId;

    try {
      if (editingCategory) {
        await axios.put(`${API}/product-categories/${editingCategory._id}`, values, {
          headers: { "X-Client": window.location.hostname.split(".")[0] }
        });
        messageApi.success("Category updated");
      } else {
        await axios.post(`${API}/product-categories`, values, {
          headers: { "X-Client": window.location.hostname.split(".")[0] }
        });
        messageApi.success("Category added");
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (err) { messageApi.error("Save failed"); }
  };

  const uploadImage = async (category) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      setUploading(true);
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CONFIG.UPLOAD_PRESET);

      try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CONFIG.CLOUD_NAME}/image/upload`, {
          method: "POST", body: formData
        });
        const result = await res.json();
        const publicIdWithExt = `${result.public_id}.${result.format}`;
        
        await axios.put(`${API}/product-categories/${category._id}`, { imagePublicIds: publicIdWithExt }, {
          headers: { "X-Client": window.location.hostname.split(".")[0] }
        });
        fetchCategories();
        messageApi.success("Image uploaded successfully");
      } catch { messageApi.error("Upload failed"); }
      setUploading(false);
    };
    input.click();
  };

  const deleteImage = async (catId, publicId) => {
    try {
      await axios.delete(`${API}/product-categories/image/${catId}/${publicId}`, {
        headers: { "X-Client": window.location.hostname.split(".")[0] }
      });
      messageApi.success("Image deleted");
      fetchCategories();
    } catch { messageApi.error("Delete failed"); }
  };

  const columns = [
    { 
      title: 'Category Name', 
      dataIndex: 'name', 
      key: 'name',
    },
    { 
      title: 'Level', 
      dataIndex: 'level', 
      align: 'left',
      render: (l) => (
        <Tag color={l === 1 ? 'green' : l === 2 ? 'purple' : 'blue'}>
           {l} {l === 1 && "- Menu"} {l === 2 && "- Category"} {l === 3 && "- Subcategory"}
          {/* {l === 3 && "(Leaf)"} */}
        </Tag>
      ) 
    },
    {
      title: 'Status',
      dataIndex: 'status',
      align: 'center',
      render: (status) => {
        const option = statusOptions.find(s => s.value === status);
        return <Tag color={option?.color || 'green'}>{option?.label || 'Active'}</Tag>;
      }
    },
    {
      title: 'Actions',
      align: 'center',
      render: (record) => (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '5px' }}>
          <Button 
            type="link" 
            size="small"
            icon={record.imagePublicIds ? <EyeOutlined /> : <CameraOutlined />} 
            style={{ color: record.imagePublicIds ? '#1ac43fff' : '#999' }} 
            onClick={() => { setViewCategory(record); setImgModalVisible(true); }} 
          />
          
          {(isAdmin || canUpdateData) && (
            <>
              <Button 
                icon={<EditOutlined />} 
                type="link" 
                size="small"
                onClick={() => { 
                  setEditingCategory(record); 
                  form.setFieldsValue({
                    ...record,
                    parentId: record.parentId?._id || null,
                    status: record.status || 1
                  }); 
                  setIsModalOpen(true); 
                }} 
              />
              <Popconfirm title="Delete category and sub-items?" onConfirm={() => axios.delete(`${API}/product-categories/${record._id}`, { headers: {"X-Client": window.location.hostname.split(".")[0]} }).then(fetchCategories)}>
                <Button icon={<DeleteOutlined />} type="link" size="small" danger />
              </Popconfirm>
            </>
          )}
        </div>
      )
    }
  ];

  return (
    <>
      {msgContextHolder}
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4>Product Categories</h4>
          {(isAdmin || canAddData) && (
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => { setEditingCategory(null); form.resetFields(); setIsModalOpen(true); }}
              style={{
                background: "linear-gradient(to bottom right, #029bd2, #20c997)",
                borderColor: "#20c997",
              }}
            >
              Add Category
            </Button>
          )}
        </div>

        <Table 
          dataSource={categories} 
          columns={columns} 
          rowKey="_id" 
          loading={loading} 
          pagination={{ pageSize: 10 }}
          expandable={{ defaultExpandAllRows: false }} 
        />

        <Modal 
          title={editingCategory ? "Edit Category" : "Add Category"} 
          open={isModalOpen} 
          onOk={handleSave} 
          onCancel={() => setIsModalOpen(false)}
          okText="Save"
        >
          <Form form={form} layout="horizontal" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
            <Form.Item name="name" label="Name" rules={[{required: true}]}><Input /></Form.Item>
            
            {/* Added Status Dropdown */}
            <Form.Item name="status" label="Status" initialValue={1}>
              <Select options={statusOptions} />
            </Form.Item>

            <Form.Item name="level" label="Level" initialValue={1} rules={[{required: true}]}>
              <Select onChange={() => form.setFieldsValue({ parentId: null })}>
                <Select.Option value={1}>Level 1 - Menu</Select.Option>
                <Select.Option value={2}>Level 2 - Category</Select.Option>
                <Select.Option value={3}>Level 3 - Subcategory</Select.Option>
              </Select>
            </Form.Item>
            
            <Form.Item noStyle shouldUpdate={(prev, curr) => prev.level !== curr.level}>
              {({ getFieldValue }) => getFieldValue('level') > 1 ? (
                <Form.Item name="parentId" label="Parent" rules={[{required: true}]}>
                  <Select placeholder="Select Parent">
                    {Array.from(categories).reduce((acc, curr) => {
                      if (curr.level === getFieldValue('level') - 1) acc.push(curr);
                      if (curr.children) {
                         curr.children.forEach(child => {
                           if (child.level === getFieldValue('level') - 1) acc.push(child);
                         });
                      }
                      return acc;
                    }, []).map(c => (
                      <Select.Option key={c._id} value={c._id}>{c.name}</Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              ) : null}
            </Form.Item>
          </Form>
        </Modal>

        <Modal 
          title={`Category Image: ${viewCategory?.name || ''}`} 
          open={imgModalVisible} 
          onCancel={() => setImgModalVisible(false)} 
          footer={null}
          width={400}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
            {viewCategory?.imagePublicIds ? (
              <div style={{ position: 'relative', border: '1px solid #f0f0f0', padding: '5px', borderRadius: '4px' }}>
                <img 
                  src={`https://res.cloudinary.com/${CONFIG.CLOUD_NAME}/image/upload/w_200,h_200,c_fill/${viewCategory.imagePublicIds}`} 
                  alt="Category" 
                  style={{ width: '200px', height: '200px', objectFit: 'cover', cursor: 'pointer', borderRadius: '4px' }}
                  onClick={() => window.open(`https://res.cloudinary.com/${CONFIG.CLOUD_NAME}/image/upload/${viewCategory.imagePublicIds}`, '_blank')}
                />
                {(isAdmin || canUpdateData) && (
                  <Popconfirm title="Remove this image?" onConfirm={() => deleteImage(viewCategory._id, viewCategory.imagePublicIds)}>
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
            ) : (
              <div style={{ color: '#999', margin: '20px 0' }}>No image uploaded for this category.</div>
            )}

            {(isAdmin || canAddData || canUpdateData) && !viewCategory?.imagePublicIds && (
              <Button 
                block 
                type="primary" 
                icon={<UploadOutlined />} 
                loading={uploading} 
                onClick={() => uploadImage(viewCategory)}
                style={{ background: "linear-gradient(to bottom right, #029bd2, #20c997)", borderColor: "#20c997" }}
              >
                Upload Category Image
              </Button>
            )}
          </div>
        </Modal>
      </div>
    </>
  );
};

export default ProductCategories;