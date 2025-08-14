import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, DatePicker, message, Popconfirm, Select, Grid } from 'antd';
import axios from 'axios';
import { EditOutlined, DeleteOutlined, CloseCircleFilled, EyeOutlined, WhatsAppOutlined, PrinterOutlined, FileImageOutlined, UploadOutlined, PictureOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import html2canvas from 'html2canvas';

const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;

const Transactions = ({ type }) => {
    const isIncome = type === 'income';
    const pageTitle = isIncome ? 'Income Records' : 'Expense Records';
    const modalTitle = (editMode) => `${editMode ? 'Edit' : 'Add'} ${isIncome ? 'Income' : 'Expense'}`;
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [viewTransaction, setViewTransaction] = useState(null);
    const [viewModalVisible, setViewModalVisible] = useState(false);
    const [imagesModalVisible, setImagesModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [categories, setCategories] = useState([]);
    const [users, setUsers] = useState([]);

    const [searchText, setSearchText] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedUser, setSelectedUser] = useState('');
    const [selectedDateRange, setSelectedDateRange] = useState([]);
    const isMobile = useBreakpoint().xs;
    const [messageApi, msgContextHolder] = message.useMessage();


    const getTransactions = async () => {
        setLoading(true);
        try {
            const params = {
                type,
            };

            if (searchText) params.search = searchText;
            if (selectedCategory) params.category = selectedCategory;
            if (selectedUser) params.user = selectedUser;
            if (selectedDateRange?.[0]) {
                params.startDate = selectedDateRange[0].startOf('day').toISOString();
            }
            if (selectedDateRange?.[1]) {
                params.endDate = selectedDateRange[1].endOf('day').toISOString();
            }
            const API = import.meta.env.VITE_API_BASE_URL;
            const res = await axios.get(`${API}/transactions/getAll`, { params });

            setTransactions(res.data.transactions);
        } catch (err) {
            messageApi.error(`Failed to fetch ${type} records.`);
        }
        setLoading(false);
    };


    const fetchCategories = async () => {
        try {
            const API = import.meta.env.VITE_API_BASE_URL;
            const res = await axios.get(`${API}/categories?type=${type}`);
            setCategories(res.data.categories);
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    const fetchUsers = async () => {
        try {
            const API = import.meta.env.VITE_API_BASE_URL;
            const res = await axios.get(`${API}/users/getAllUsers`);
            setUsers(res.data.users);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    // Run once on mount: set default date range
    useEffect(() => {
        const startOfMonth = dayjs().startOf('month');
        const endOfMonth = dayjs().endOf('month');
        setSelectedDateRange([startOfMonth, endOfMonth]);
    }, []);

    useEffect(() => {
        getTransactions();
        fetchCategories();
        fetchUsers();
    }, [type, searchText, selectedCategory, selectedUser, selectedDateRange]);



    const showAddModal = () => {
        form.resetFields();
        setEditMode(false);
        setIsModalOpen(true);
    };

    const showEditModal = (transaction) => {
        form.setFieldsValue({
            ...transaction,
            category: transaction.category?._id,
            date: dayjs(transaction.date),
        });
        setEditingTransaction(transaction);
        setEditMode(true);
        setIsModalOpen(true);
    };

    const showImagesModal = (transaction) => {
        console.log('showImagesModal');
        setViewTransaction(transaction);
        setImagesModalVisible(true);
    };


    const showViewModal = (transaction) => {
        setViewTransaction(transaction);
        setViewModalVisible(true);
    };

    const handleDelete = async (id) => {
        try {
            const API = import.meta.env.VITE_API_BASE_URL;
            await axios.delete(`${API}/transactions/${id}`);
            messageApi.success(`${isIncome ? 'Income' : 'Expense'} deleted`);
            getTransactions();
        } catch {
            messageApi.error('Delete failed');
        }
    };

    const onFinish = async (values) => {

        const storedUser = JSON.parse(localStorage.getItem('user'));
        //const userCode = storedUser?.code || '';
        console.log('values' , values);
        
        const payload = {
            ...values,
            type,
            user: (editMode && values.user )? values.user._id : storedUser._id,
            date: values.date.toISOString(),
        };
        try {
            if (editMode) {
                const API = import.meta.env.VITE_API_BASE_URL;
                await axios.put(`${API}/transactions/${editingTransaction._id}`, payload);
                messageApi.success(`${isIncome ? 'Income' : 'Expense'} updated`);
            } else {
                const API = import.meta.env.VITE_API_BASE_URL;
                await axios.post(`${API}/transactions/create`, payload);
                messageApi.success(`${isIncome ? 'Income' : 'Expense'} added`);
            }
            setIsModalOpen(false);
            getTransactions();
        } catch {
            messageApi.error('Operation failed');
        }
    };

    const columns = [
        {
            title: 'Receipt #',
            dataIndex: 'receiptNumber',
            align: 'center',
            responsive: ['md'], // ✅ Show only on medium+ screens
        },

        {
            title: isIncome ? 'Donor Name' : 'Paid To',
            dataIndex: 'reference',
            align: 'center',
            responsive: ['md'], // ✅ Show only on medium+ screens
        },
        {
            title: 'Phone #',
            dataIndex: 'phoneNumber',
            align: 'center',
            responsive: ['md'], // ✅ Show only on medium+ screens
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            align: 'center',
        },
        {
            title: 'Category',
            dataIndex: 'category',
            align: 'center',
            render: (cat) => cat?.name || '',
        },
        {
            title: 'Date',
            dataIndex: 'date',
            align: 'center',
            render: (date) => dayjs(date).format('DD-MM YYYY'),
        },
        {
            title: 'Description',
            dataIndex: 'description',
            align: 'center',
            responsive: ['md'], // ✅ Show only on medium+ screens
            className: 'description-column'
        },
        {
            title: 'Generated By',
            dataIndex: 'user',
            align: 'center',
            render: (usr) => usr?.name || '',
            responsive: ['md'], // ✅ Show only on medium+ screens

        },
        {
            title: 'Actions',
            align: 'center',
            render: (record) => (
                <>
                    <Button type="link" icon={<EyeOutlined />} onClick={() => showViewModal(record)} />
                    {isAdmin &&
                        <>
                            <Button type="link" icon={<FileImageOutlined />} onClick={() => showImagesModal(record)} style={{ color: '#c4941aff' }} />
                            <Button type="link" icon={<EditOutlined />} onClick={() => showEditModal(record)} style={{ color: '#52c41a' }} />
                            <Popconfirm title="Are you sure?" onConfirm={() => handleDelete(record._id)}>
                                <Button type="link" danger icon={<DeleteOutlined />} />
                            </Popconfirm>
                        </>
                    }
                </>
            ),
        },

    ];

    const handlePrint = () => {
        const amount = viewTransaction?.amount || '';
        const receiptNumber = viewTransaction?.receiptNumber || '';
        const category = viewTransaction?.category?.name || '';
        const user = viewTransaction?.user?.name || '';
        const reference = viewTransaction?.reference || '';
        const description = viewTransaction?.description || '';
        const date = dayjs(viewTransaction?.date || '').format('YYYY-MM-DD');


        const printWindow = window.open('', '_blank');

        const htmlContentForIncome = `
  <div>

    <div class="center" style="margin-top: 15px; padding-bottom: 5px;">
      <div style="font-size: 15px; font-weight: bold;">جامع مسجد فیضانِ ہجویری</div>
      سکین کالج والی گلی P-565، بلال روڈ<br />
      لنک ویسٹ کینال روڈ، امین ٹاؤن، فیصل آباد
    </div>

    <div class="box">
    <div class="row"><span class="label">رسید نمبر&nbsp;&nbsp;&nbsp;:</span> <span>${receiptNumber}</span></div>
    <div class="row"><span class="label">تاریخ&nbsp;&nbsp;&nbsp;:</span> <span>${date}</span></div>
<div class="row"><span class="label">رقم&nbsp;&nbsp;&nbsp;:</span> <span>${amount} روپے</span></div>
<div class="row"><span class="label">مد&nbsp;&nbsp;&nbsp;:</span> <span>${category}</span></div>
    <div class="row"><span class="label">نام&nbsp;&nbsp;&nbsp;:</span> <span>${reference}</span></div>
<div class="row"><span class="label">تفصیل&nbsp;&nbsp;&nbsp;:</span> <span>${description}</span></div>


    </div>

    <div class="box">
      <div class="center" style="font-weight: bold;">نوٹ</div>
      <div>
        آپ کی عطیہ کردہ رقم کسی بھی جائز دینی، اصلاحی، تعمیری یا مسجد کی تزئین و آرائش کے کام میں استعمال کی جا سکتی ہے۔
      </div>
    </div>

    <div class="center">
      <strong>مزید معلومات یا شرعی رہنمائی کے لیے:</strong><br />
      مفتی نزاکت علی المدنی &nbsp;:&nbsp; 7812905-0306
    </div>

    <div class="center" style="margin-top: 15px; border-top: 1px dashed #000; padding-top: 5px; margin-right: 15px; margin-left: 15px;">
     <span>Generated By : </span> ${user}
    </div>

  </div>
`;


        printWindow.document.write(`
  <html>
    <head>
      <style>
        @font-face {
          font-family: 'NotoNastaliqUrdu';
          src: url('/fonts/NotoNastaliqUrdu-Regular.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
        }
        body {
          font-family: 'NotoNastaliqUrdu', Arial, sans-serif;
          direction: rtl;
          font-size: 12px;
          text-align: right;
          padding: 0px;
          width: 280px;
        }
        .box {
          border: 1px dashed #000;
          padding: 10px;
          border-radius: 4px;
          margin: 10px 0;
        }
        .center {
          text-align: center;
        }
        .row {
          display: flex;
          justify-content: flex-start;
          gap: 5px;
          margin-bottom: 3px;
        }
        .label {
          font-weight: bold;
          min-width: 70px;
          display: inline-block;
        }
          @media print {
  body {
    width: 80mm;
    margin: 0 auto;
  }

  @page {
    size: 80mm auto;
    margin: 0;
  }
}
      </style>
    </head>
    <body>
      ${htmlContentForIncome}
    </body>
  </html>
`);
        printWindow.document.close();

        // ✅ Wait a little before triggering print
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
            //  printWindow.close(); // Optional — you can comment this if needed
        }, 500); // 500ms works well for most mobile devices


    };


    // const UploadNewImageOnline = (receipt)=> {
    // console.log('*** viewTransaction' , receipt)
    //    const ImgbbsAPIKey = "24d06688207f377027d410b25be68498";
    // }

    // cLOUDINARY

    // const CloudinaryAPIKey = "448227896933795";
    // const CloudinaryAPISecret = "0r7c7F6w9l1ZTMN76zKmO57xc24"
    // const CloudinaryAPI_EnvironmentVariable = `CLOUDINARY_URL=cloudinary://${CloudinaryAPIKey}:${CloudinaryAPISecret}@drinjgbm5`;
    // const Cloudinary_Cloud_name = "drinjgbm5";

    const CLOUD_NAME = "drinjgbm5";
    const UPLOAD_PRESET = "FaizaneHajveriImages";


    const UploadNewImageOnline = async (transaction) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = false;

        input.onchange = async (event) => {
            const file = event.target.files[0];
            if (!file) return;

            try {
                // Prepare form data for Cloudinary
                const formData = new FormData();
                formData.append("file", file);
                formData.append("upload_preset", UPLOAD_PRESET);

                // Upload to Cloudinary
                const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
                    method: "POST",
                    body: formData
                });

                const result = await response.json();

                if (result.public_id) {
                    // Extract extension from format (e.g., jpg, png)
                    const publicIdWithExt = `${result.public_id}.${result.format}`;
                    console.log("✅ Public ID with extension:", publicIdWithExt);

                    // Append to transaction's list
                    if (!transaction.imagePublicIds) {
                        transaction.imagePublicIds = publicIdWithExt;
                    } else {
                        transaction.imagePublicIds += `,${publicIdWithExt}`;
                    }

                    // Send backend request to update transaction
                    try {
                        const API = import.meta.env.VITE_API_BASE_URL;
                        await axios.put(`${API}/transactions/${transaction._id}`, transaction);

                        message.success('Image uploaded & transaction updated');
                        getTransactions();
                    } catch {
                        message.error('Operation failed');
                    }

                } else {
                    console.error("❌ Upload failed:", result);
                }
            } catch (error) {
                console.error("❌ Error uploading:", error);
            }
        };

        input.click();
    };





    const handleImageDownload = async () => {
        const amount = viewTransaction?.amount || '';
        const receiptNumber = viewTransaction?.receiptNumber || '';
        const category = viewTransaction?.category?.name || '';
        const user = viewTransaction?.user?.name || '';
        const reference = viewTransaction?.reference || '';
        const description = viewTransaction?.description || '';
        const date = dayjs(viewTransaction?.date || '').format('YYYY-MM-DD');

        // Create a container for our styled receipt
        const container = document.createElement('div');
        container.innerHTML = `
        <div style="
        font-family: 'NotoNastaliqUrdu', Arial, sans-serif;
        direction: rtl;
        background-color: #fdf8f2;
        color: #333;
        width: 550px;
        border: 2px solid #165c2f;
        border-radius: 8px;
        padding: 20px;
        margin: 5px;
        ">
        <!-- Header -->
        <div style="
            text-align: center;
            background-color: #165c2f;
            color: white;
            padding: 10px;
            padding-bottom: 15px;
            border-radius: 6px;
            margin-bottom: 15px;
        ">
            <div style="font-size: 16px; font-weight: bold; margin-bottom:10px;">جامع مسجد فیضانِ ہجویری</div>
            <div style="font-size: 11px;">سکین کالج والی گلی P-565، بلال روڈ ، 
            لنک ویسٹ کینال روڈ، امین ٹاؤن، فیصل آباد</div>
        </div>

        <!-- Details (2 columns per row) -->
        <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 15px; font-size: 12px; padding:5px;">
            <div style="flex: 1; min-width: 200px;"><span class="label">رسید نمبر :</span> ${receiptNumber}</div>
            <div style="flex: 1; min-width: 200px;"><span class="label">تاریخ :</span> ${date}</div>
            <div style="flex: 1; min-width: 200px;"><span class="label">رقم :</span> ${amount} روپے</div>
            <div style="flex: 1; min-width: 200px;"><span class="label">مد :</span> ${category}</div>
            <div style="flex: 1; min-width: 200px;"><span class="label">نام :</span> ${reference}</div>
            <div style="flex: 1; min-width: 200px;"><span class="label">تفصیل :</span> ${description}</div>
        </div>

        <!-- Note -->
        <div style="
            border: 1px dashed #165c2f;
            padding: 10px;
            padding-bottom: 15px;
            border-radius: 4px;
            font-size: 12px;
            margin-bottom: 10px;
            background-color: #f5fbf7;
        ">
            <p style="text-align: center; font-weight: bold;">نوٹ</p>
            آپ کی عطیہ کردہ رقم کسی بھی جائز دینی، اصلاحی، تعمیری یا مسجد کی تزئین و آرائش کے کام میں استعمال کی جا سکتی ہے۔
        </div>

        <!-- Footer -->
        <div style="text-align: center; font-size: 12px;">
            <p style="font-weight: bold;">مزید معلومات یا شرعی رہنمائی کے لیے:</p>
            مفتی نزاکت علی المدنی &nbsp;:&nbsp; 7812905-0306
            <div style="margin-top: 10px; border-top: 1px dashed #165c2f; padding-top: 5px;">
            <span>Generated By : </span> ${user}
            </div>
        </div>
        </div>
    `;

        document.body.appendChild(container);
        container.style.position = 'fixed';
        container.style.top = '-9999px'; // hide from view

        // Convert to image
        const canvas = await html2canvas(container, { scale: 2 });
        const image = canvas.toDataURL('image/png');

        // Download
        const link = document.createElement('a');
        link.href = image;
        link.download = `${receiptNumber}.png`;
        link.click();

        // Cleanup
        document.body.removeChild(container);
    };


    const handleWhatsApp = () => {
        let number = viewTransaction?.phoneNumber || '';
        number = number.replace(/\D/g, ''); // remove non-digits

        // Convert 03xxxxxxxxx to 923xxxxxxxxx
        if (number.startsWith('03')) {
            number = '92' + number.substring(1);
        } else if (number.startsWith('+')) {
            number = number.substring(1);
        }

        // // Construct message
        // const amount = viewTransaction?.amount || '';
        // const receiptNumber = viewTransaction?.receiptNumber || '';
        // const category = viewTransaction?.category?.name || '';
        // const user = viewTransaction?.user?.name || '';
        // const reference = viewTransaction?.reference || '';
        // const description = viewTransaction?.description || '';
        // const date = dayjs(viewTransaction?.date  || '').format('DD-MM-YYYY');

        // const message = isIncome
        //     ? `*السلام علیکم ورحمۃ اللہ وبرکاته*\n` +
        //     `========================\n\n` +

        //     `*رسید نمبر :* ${receiptNumber}\n` +
        //     `*تاریخ :* ${date}\n` +
        //     `*نام :* ${reference}\n` +
        //     `*تفصیل :* ${description}\n` +
        //     `*رقم :* روپے ${amount}\n` +
        //     `*مد :* ${category}\n\n` +

        //     `========================\n\n` +

        //     `آپ کی عطیہ کردہ رقم کسی بھی جائز دینی، اصلاحی، تعمیری یا مسجد کی تزئین و آرائش کے کام میں استعمال کی جا سکتی ہے۔\n` +
        //     `*جزاکم اللہ خیراً و احسن الجزاء*\n\n` +

        //     `========================\n\n` +

        //     `*مزید معلومات یا شرعی رہنمائی کے لیے رابطہ کریں:*\n` +
        //     `مفتی نزاکت علی المدنی\n` +
        //     `فون: 0306-7812905\n\n` +

        //     `========================\n\n` +

        //     `*:: جامع مسجد فیضانِ ہجویری ::*\n` +
        //     `سکین کالج والی گلی P-565، بلال روڈ ۔ ` +
        //     `لنک ویسٹ کینال روڈ، امین ٹاؤن، فیصل آباد`
        //     : '';

        const message = isIncome
            ? `Thank you for your Donation \n\n` +
            `*جزاکم اللہ خیراً و احسن الجزاء*\n\n`
            : '';


        const encodedMessage = encodeURIComponent(message);
        const whatsappURL = `https://wa.me/${number}?text=${encodedMessage}`;

        window.open(whatsappURL, '_blank');
    };

    const savedUser = JSON.parse(localStorage.getItem('user') || 'null');
    const isAdmin = savedUser?.isAdmin;

    const handleDeleteImage = async (transactionId, publicId) => {
        try {
            const API = import.meta.env.VITE_API_BASE_URL;
            await axios.delete(`${API}/transactions/${transactionId}/image/${publicId}`);

            message.success("Image deleted successfully");
            getTransactions(); // refresh main list
            setViewTransaction(prev => ({
                ...prev,
                imagePublicIds: prev.imagePublicIds
                    .split(',')
                    .filter(id => id.trim() !== publicId)
                    .join(',')
            }));
        } catch (error) {
            console.error("Delete image error:", error);
            message.error("Failed to delete image");
        }
    };


    return (
        <>
            {msgContextHolder}

            <div className="container mt-4">
                <div className="d-flex justify-content-between mb-3">
                    <h4>{pageTitle}</h4>
                    {isAdmin &&
                        <Button color="green" variant="solid" onClick={showAddModal}>
                            Add {isIncome ? 'Income' : 'Expense'}
                        </Button>
                    }
                </div>


                {/* Filters Section */}
                <div className="row mb-3">

                    <div className="col-12 col-md-4 mb-2">
                        <div className="d-flex flex-row flex-md-row" style={{ gap: '8px' }}>
                            <div style={{ flex: 1 }}>
                                <Input
                                    placeholder="Search Name , Phone , Receitp #, Description."
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                    style={{ flex: 1 }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="col-12 col-md-5 mb-2">
                        <div className="d-flex flex-row flex-md-row" style={{ gap: '8px' }}>

                            <div style={{ flex: 1 }}>
                                <Select
                                    placeholder="All Categories"
                                    value={selectedCategory}
                                    onChange={(value) => setSelectedCategory(value)}
                                    style={{ width: '100%' }}
                                >
                                    <Select.Option value="">All Categories</Select.Option>
                                    {categories.map(cat => (
                                        <Select.Option key={cat._id} value={cat._id}>
                                            {cat.name}
                                        </Select.Option>
                                    ))}
                                </Select>
                            </div>

                            <div style={{ flex: 1 }}>
                                <Select
                                    placeholder="Generated by All Users"
                                    value={selectedUser}
                                    onChange={(value) => setSelectedUser(value)}
                                    style={{ width: '100%' }}
                                >
                                    <Select.Option value="">All Users</Select.Option>
                                    {users.map(usr => (
                                        <Select.Option key={usr._id} value={usr._id}>
                                            {usr.name}
                                        </Select.Option>
                                    ))}
                                </Select>
                            </div>

                        </div>
                    </div>

                    <div className="col-md-3 mb-2">
                        {/* <RangePicker
                        value={selectedDateRange}
                        onChange={(value) => setSelectedDateRange(value)}
                        format="DD-MM-YYYY"
                        style={{ width: '100%' }}
                    /> */}

                        {isMobile ? (
                            <div className="d-flex" style={{ gap: '8px' }}>
                                <DatePicker
                                    placeholder="From Date"
                                    value={selectedDateRange?.[0]}
                                    onChange={(value) =>
                                        setSelectedDateRange([value, selectedDateRange?.[1]])
                                    }
                                    format="DD-MM-YYYY"
                                    style={{ width: '100%' }}
                                />
                                <DatePicker
                                    placeholder="To Date"
                                    value={selectedDateRange?.[1]}
                                    onChange={(value) =>
                                        setSelectedDateRange([selectedDateRange?.[0], value])
                                    }
                                    format="DD-MM-YYYY"
                                    style={{ width: '100%' }}
                                />
                            </div>
                        ) : (
                            <RangePicker
                                value={selectedDateRange}
                                onChange={(value) => setSelectedDateRange(value)}
                                format="DD-MM-YYYY"
                                style={{ width: '100%' }}
                            />
                        )}

                    </div>

                </div>



                <div className="transaction-table-wrapper">

                    <Table
                        dataSource={transactions}

                        columns={columns}
                        rowKey="_id"
                        loading={loading}
                        pagination={{ pageSize: 7 }}
                    />

                </div>

                {/* Add/Edit Modal */}
                <Modal
                    title={modalTitle(editMode)}
                    open={isModalOpen}
                    onCancel={() => setIsModalOpen(false)}
                    onOk={() => form.submit()}
                    okText={editMode ? 'Update' : 'Create'}
                >
                    <Form
                        layout="horizontal"
                        labelCol={{ span: 6 }}
                        wrapperCol={{ span: 18 }}
                        style={{ maxWidth: '100%' }}
                        form={form} onFinish={onFinish}>

                        {editMode && <Form.Item name="receiptNumber" label="Receipt #">
                            <Input readOnly />
                        </Form.Item>}
                        <Form.Item name="reference" label={isIncome ? 'Donor Name' : 'Paid To'}>
                            <Input />
                        </Form.Item>
                        <Form.Item name="phoneNumber" label="Phone #">
                            <Input />
                        </Form.Item>

                        <Form.Item name="amount" label="Amount" rules={[{ required: true }]}>
                            <Input type="number" />
                        </Form.Item>

                        <Form.Item name="category" label="Category" rules={[{ required: true }]}>
                            <Select>
                                {categories.map(cat => (
                                    <Select.Option key={cat._id} value={cat._id}>
                                        {cat.name}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>


                        {editMode && <Form.Item name="user" label="Generated By" style={{ display: 'none' }}>
                            <Input value={viewTransaction?.user?.name} readOnly />
                        </Form.Item>}

                        <Form.Item name="date" label="Date" rules={[{ required: true }]}>
                            <DatePicker style={{ width: '100%' }} format='DD-MM-YYYY' />
                        </Form.Item>

                        <Form.Item name="description" label="Description" >
                            <Input.TextArea rows={4} />
                        </Form.Item>
                    </Form>
                </Modal>

                {/* View Modal */}

                <Modal
                    title={`${isIncome ? 'Income' : 'Expense'} Details`}
                    open={viewModalVisible}
                    onCancel={() => setViewModalVisible(false)}
                    footer={null}
                >
                    <Form
                        layout="horizontal"
                        labelCol={{ span: 6 }}
                        wrapperCol={{ span: 18 }}
                        style={{ maxWidth: '100%' }}
                    >

                        <Form.Item label="Receipt #">
                            <Input value={viewTransaction?.receiptNumber} readOnly />
                        </Form.Item>

                        <Form.Item label={isIncome ? 'Donor Name' : 'Paid To'}>
                            <Input value={viewTransaction?.reference} readOnly />
                        </Form.Item>
                        <Form.Item label="Phone #">
                            <Input value={viewTransaction?.phoneNumber} readOnly />
                        </Form.Item>

                        <Form.Item label="Amount">
                            <Input value={viewTransaction?.amount} readOnly />
                        </Form.Item>
                        <Form.Item label="Category">
                            <Input value={viewTransaction?.category?.name} readOnly />
                        </Form.Item>

                        <Form.Item label="Date">
                            <Input value={dayjs(viewTransaction?.date).format('DD-MM-YYYY')} readOnly />
                        </Form.Item>

                        <Form.Item label="Description">
                            <Input.TextArea rows={4} value={viewTransaction?.description} readOnly />
                        </Form.Item>
                        <Form.Item label="Generated By">
                            <Input value={viewTransaction?.user?.name} readOnly />
                        </Form.Item>
                    </Form>

                    {/* Buttons Section */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                        {isIncome && <Button
                            type="default"
                            icon={<PrinterOutlined />}
                            onClick={handlePrint}
                        >
                            Print
                        </Button>}
                        {isIncome && <Button
                            type="default"
                            icon={<PictureOutlined />}
                            onClick={handleImageDownload}
                        >
                            Image
                        </Button>}




                        {isIncome && <Button
                            type="primary"
                            icon={<WhatsAppOutlined />}
                            onClick={handleWhatsApp}
                        >
                            WhatsApp
                        </Button>}

                    </div>
                </Modal>

                <Modal
                    title={`Images for ${viewTransaction?.receiptNumber}`}
                    open={imagesModalVisible}
                    onCancel={() => setImagesModalVisible(false)}
                    footer={null}
                >
                    {/* Display Images */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', padding: '15px' , justifyContent:'center' }}>
                        {viewTransaction?.imagePublicIds
                            ?.split(',')
                            .filter(id => id.trim() !== '')
                            .map((publicId, index) => (
                                <div
                                    key={index}
                                    style={{
                                        position: 'relative',
                                        width: '190px',
                                        margin:'10px'
                                    }}
                                >
                                    {/* Delete Button */}
                                    <Popconfirm
                                        title="Delete this image?"
                                        onConfirm={() => handleDeleteImage(viewTransaction._id, publicId)}
                                        okText="Yes"
                                        cancelText="No"
                                    >
                                        <CloseCircleFilled
                                            style={{
                                                position: 'absolute',
                                                top: '-6px',
                                                right: '-6px',
                                                fontSize: '18px',
                                                color: 'red',
                                                cursor: 'pointer',
                                                background: '#fff',
                                                borderRadius: '50%'
                                            }}
                                        />
                                    </Popconfirm>

                                    {/* Image */}
                                    <img
                                        src={`https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${publicId}`}
                                        alt={`Transaction ${index + 1}`}
                                        style={{
                                            width: '100%',
                                            borderRadius: '6px',
                                            border: '1px solid #ddd',
                                            cursor: 'pointer',
                                        }}
                                        onClick={() =>
                                            window.open(
                                                `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${publicId}`,
                                                '_blank'
                                            )
                                        }
                                    />
                                </div>
                            ))}
                    </div>

                    {/* Buttons Section */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                        <Button
                            type="primary"
                            icon={<UploadOutlined />}
                            onClick={() => UploadNewImageOnline(viewTransaction)}
                        >
                            Upload New Image
                        </Button>
                    </div>
                </Modal>

            </div>
        </>
    );

};

export default Transactions;
