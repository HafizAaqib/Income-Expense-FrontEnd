import { useEffect, useState } from 'react';
import { Collapse, Table, Button, Modal, Form, Input, DatePicker, message, Popconfirm, Select, Grid, Row, Col, Tag } from 'antd';
import axios from 'axios';
import { FileTextOutlined, FilterOutlined, UpOutlined, DownOutlined, EditOutlined, DeleteOutlined, CloseCircleFilled, EyeOutlined, WhatsAppOutlined, PrinterOutlined, FileImageOutlined, UploadOutlined, PictureOutlined, FilePdfOutlined, PlusCircleOutlined, ScheduleOutlined, CameraOutlined, UpCircleOutlined, DownSquareOutlined, UpSquareOutlined, DownCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import html2canvas from 'html2canvas';
import html2pdf from "html2pdf.js";
import Spinner from '../components/Spinner';
import { CONFIG } from "./clientConfig";
import QRCode from "qrcode";

const { Panel } = Collapse;
const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;



const Transactions = ({ type }) => {
    const trxnType = type; // === 'income';
    const pageTitle = trxnType === 'income' ? 'Income Records' : (trxnType === 'expense' ? 'Expense Records' : 'Asset Donations Records');
    const modalTitle = (editMode) => `${editMode ? 'Edit' : 'Add'} ${trxnType === 'income' ? 'Income' : (trxnType === 'expense' ? 'Expense' : 'Asset Donations')}`;
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
    const [donors, setDonors] = useState([]);
    const [duePayments, setDuePayments] = useState([]);

    const [users, setUsers] = useState([]);

    const [searchText, setSearchText] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedUser, setSelectedUser] = useState('');
    const [selectedDateRange, setSelectedDateRange] = useState([]);
    const [isDataUploading, setIsDataUploading] = useState(false);
    const isMobile = useBreakpoint().xs;
    const [messageApi, msgContextHolder] = message.useMessage();
    const [open, setOpen] = useState(false);




    const getTransactions = async () => {
        setLoading(true);
        try {
            const params = { type };

            if (searchText) params.search = searchText;
            if (selectedCategory) params.category = selectedCategory;
            if (selectedUser) params.user = selectedUser;
            if (selectedDateRange?.[0]) {
                params.startDate = selectedDateRange[0].startOf('day').toISOString();
            }
            if (selectedDateRange?.[1]) {
                params.endDate = selectedDateRange[1].endOf('day').toISOString();
            }

            // ✅ add entity filter if available
            const selectedEntity = JSON.parse(localStorage.getItem("selectedEntity") || "null");
            if (selectedEntity) {
                params.entity = selectedEntity.EntityId;
            }

            const API = import.meta.env.VITE_API_BASE_URL;
            const res = await axios.get(`${API}/transactions/getAll`, {
                params,
                headers: {
                    "X-Client": window.location.hostname.split(".")[0],
                },
            });

            setTransactions(res.data.transactions);
        } catch (err) {
            messageApi.error(`Failed to fetch ${type} records.`);
        }
        setLoading(false);
    };


    const fetchCategories = async () => {
        try {
            const API = import.meta.env.VITE_API_BASE_URL;

            // ✅ get selectedEntity from localStorage
            const selectedEntity = JSON.parse(localStorage.getItem("selectedEntity") || "null");

            let url = `${API}/categories?type=${type}`;
            if (selectedEntity) {
                url += `&entity=${selectedEntity.EntityId}`;
            }

            const res = await axios.get(url, {
                headers: {
                    "X-Client": window.location.hostname.split(".")[0],
                },
            });

            setCategories(res.data.categories);
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };
    const getDonors = async () => {
        try {
            const API = import.meta.env.VITE_API_BASE_URL;
            const clientHeader = { "X-Client": window.location.hostname.split(".")[0] };
            const selectedEntity = JSON.parse(localStorage.getItem("selectedEntity") || "null");

            let url = `${API}/donors?status=active&`;
            if (selectedEntity) url += `entity=${selectedEntity.EntityId}&`;

            const res = await axios.get(url, { headers: clientHeader });
            setDonors(res.data.donors);
        } catch (err) {
            messageApi.error("Failed to fetch donors");
            console.error("Error fetching donors:", err.response?.data || err.message);

        }
    };
    const getDuePayments = async () => {
        setLoading(true);
        try {
            const API = import.meta.env.VITE_API_BASE_URL;
            const entity = JSON.parse(localStorage.getItem("selectedEntity") || "null");
            let url = `${API}/due-payments?`;
            url += `status=unpaid&`;
            if (entity) url += `entity=${entity.EntityId}&`;

            const res = await axios.get(url, {
                headers: { "X-Client": window.location.hostname.split(".")[0] },
            });
            setDuePayments(res.data.duePayments);
        } catch {
            messageApi.error("Failed to fetch due payments");
        }
        setLoading(false);
    };

    const fetchUsers = async () => {
        try {
            const API = import.meta.env.VITE_API_BASE_URL;
            const res = await axios.get(`${API}/users/getAllUsers`, {
                headers: {
                    "X-Client": window.location.hostname.split(".")[0],
                },
            });
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
        if (!selectedDateRange || selectedDateRange.length === 0) return;

        if (!isAdmin && !canViewOtherUsersData &&
            selectedUser?._id !== savedUser?._id) {
            setSelectedUser(savedUser?._id);
        }

        fetchCategories();
        fetchUsers();
        getTransactions();
        if (type === 'income') {
            getDonors();
        }
        if (type === 'expense') {
            getDuePayments();
        }

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

    const handleDelete = async (record) => {
        try {
            const API = import.meta.env.VITE_API_BASE_URL;
            await axios.delete(`${API}/transactions/${record._id}`, {
                headers: {
                    "X-Client": window.location.hostname.split(".")[0],
                },
            });
            messageApi.success(`${trxnType === 'income' ? 'Income' : (trxnType === 'expense' ? 'Expense' : 'Asset')} deleted`);
            if (type === 'expense' && record.duePayment) {
                window.location.reload();
                return;
            }

            getTransactions();
            if (type === 'income') {
                getDonors();
            }
            if (type === 'expense') {
                getDuePayments();
            }
        } catch {
            messageApi.error('Delete failed');
        }
    };

    const onFinish = async (values) => {

        const storedUser = JSON.parse(localStorage.getItem('user'));
        //const userCode = storedUser?.code || '';
        console.log('values', values);

        const payload = {
            ...values,
            type,
            user: (editMode && values.user) ? values.user._id : storedUser._id,
            date: values.date.toISOString(),
        };
        try {
            if (editMode) {
                const API = import.meta.env.VITE_API_BASE_URL;
                await axios.put(`${API}/transactions/${editingTransaction._id}`, payload, {
                    headers: {
                        "X-Client": window.location.hostname.split(".")[0],
                    },
                });
                messageApi.success(`${trxnType === 'income' ? 'Income' : (trxnType === 'expense' ? 'Expense' : 'Asset')} updated`);
            } else {
                const API = import.meta.env.VITE_API_BASE_URL;
                await axios.post(`${API}/transactions/create`, payload, {
                    headers: {
                        "X-Client": window.location.hostname.split(".")[0],
                    },
                });
                messageApi.success(`${trxnType === 'income' ? 'Income' : (trxnType === 'expense' ? 'Expense' : 'Asset')} added`);
            }
            setIsModalOpen(false);
            if (type === 'expense' && payload.duePayment) {
                window.location.reload();
                return;
            }

            getTransactions();
            if (type === 'income') {
                getDonors();
            }
            if (type === 'expense') {
                getDuePayments();
            }
        } catch {
            messageApi.error('Operation failed');
        }
    };

    const baseColumns = [
        {
            title: 'Receipt #',
            dataIndex: 'receiptNumber',
            align: 'center',
            responsive: ['md'], // ✅ Show only on medium+ screens
        },

        {
            title: trxnType !== "expense" ? "Donor Name" : "Paid To",
            dataIndex: "reference",
            align: "center",
            responsive: ["md"], // ✅ Show only on medium+ screens
            render: (text, record) => (
                <>
                    {trxnType === "income" && (
                        <>
                            {record.donor ? (
                                <Tag color="green">{text || "Regular Donor"}</Tag>
                            ) : (
                                text
                            )}
                        </>
                    )}

                    {trxnType === "expense" && (
                        <>
                            {record.duePayment ? (
                                <Tag color="orange">{text || "From Due"}</Tag>
                            ) : (
                                text
                            )}
                        </>
                    )}
                </>
            ),
        }
        ,
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
            title: trxnType === 'asset' ? 'Asset Type' : 'Category',
            dataIndex: 'category',
            align: 'center',
            render: (cat) => cat?.name || '',
        },
        {
            title: 'Date',
            dataIndex: 'date',
            align: 'center',
            render: (date) => dayjs(date).format('DD MMM YYYY'),
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
                    <Button type="link" icon={<CameraOutlined />} onClick={() => showImagesModal(record)} style={{ color: '#c4941aff' }} />
                    {(isAdmin || canUpdateData) &&
                        <>
                            <Button type="link" icon={<EditOutlined />} onClick={() => showEditModal(record)} style={{ color: '#52c41a' }} />
                            <Popconfirm title="Are you sure?" onConfirm={() => handleDelete(record)}>
                                <Button type="link" danger icon={<DeleteOutlined />} />
                            </Popconfirm>
                        </>
                    }
                </>
            ),
        },

    ];

    const columns = baseColumns.filter(col => {
        if (trxnType === 'asset' && col.dataIndex === 'amount') {
            return false;
        }
        return true;
    });

    const handlePrint = () => {
        const amount = viewTransaction?.amount || '';
        const receiptNumber = viewTransaction?.receiptNumber || '';
        const category = viewTransaction?.category?.name || '';
        const user = viewTransaction?.user?.name || '';
        const reference = viewTransaction?.reference || '';
        const description = viewTransaction?.description || '';
        const date = dayjs(viewTransaction?.date || '').format('DD-MMM-YYYY');


        const printWindow = window.open('', '_blank');

        const htmlContentForIncome = `
  <div>

    <div class="center" style="margin-top: 15px; padding-bottom: 5px;">
      <div style="font-size: 15px; font-weight: bold;">${CONFIG.Header_FullName?.trim()
                ? CONFIG.Header_FullName
                : (JSON.parse(localStorage.getItem("selectedEntity") || "null"))?.Header_FullName ?? ""}</div>
     ${CONFIG.Header_Address?.trim()
                ? CONFIG.Header_Address
                : (JSON.parse(localStorage.getItem("selectedEntity") || "null"))?.Header_Address ?? ""}
    </div>

    <div class="box">
    <div class="row"><span class="label">رسید نمبر&nbsp;&nbsp;&nbsp;:</span> <span>${receiptNumber}</span></div>
    <div class="row"><span class="label">تاریخ&nbsp;&nbsp;&nbsp;:</span> <span style="direction:ltr;" >${date}</span></div>
${trxnType === 'asset' ? '' : `<div class="row"><span class="label">رقم&nbsp;&nbsp;&nbsp;:</span> <span>${amount} روپے</span></div>`}
<div class="row"><span class="label"> ${trxnType === 'asset' ? 'ہدیہ' : 'مد'} &nbsp;&nbsp;&nbsp;:</span> <span>${category}</span></div>
    <div class="row"><span class="label">نام&nbsp;&nbsp;&nbsp;:</span> <span>${reference}</span></div>
<div class="row"><span class="label">تفصیل&nbsp;&nbsp;&nbsp;:</span> <span>${description}</span></div>


    </div>

    ${trxnType === 'asset' ? '' : `<div class="box">
      <div class="center" style="font-weight: bold;">نوٹ</div>
      <div class="center">
            ${CONFIG.PrintNotes?.trim()
                    ? CONFIG.PrintNotes
                    : (JSON.parse(localStorage.getItem("selectedEntity") || "null"))?.PrintNotes ?? ""}
        
      </div>
    </div> `}

    <div class="center">
      <strong> ${trxnType === 'asset' ? '' : ' مزید'} 
       معلومات یا شرعی رہنمائی کے لیے:</strong><br />
      ${CONFIG.Footer_Names}
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


    const UploadNewImageOnline = async (transaction) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = false;

        input.onchange = async (event) => {
            setIsDataUploading(true);
            const file = event.target.files[0];
            if (!file) return;

            try {
                // Prepare form data for Cloudinary
                const formData = new FormData();
                formData.append("file", file);
                formData.append("upload_preset", CONFIG.UPLOAD_PRESET);

                // Upload to Cloudinary
                const response = await fetch(`https://api.cloudinary.com/v1_1/${CONFIG.CLOUD_NAME}/image/upload`, {
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
                        await axios.put(`${API}/transactions/${transaction._id}`, transaction, {
                            headers: {
                                "X-Client": window.location.hostname.split(".")[0],
                            },
                        });

                        message.success('Image uploaded & transaction updated');
                        getTransactions();
                        setIsDataUploading(false);

                    } catch {
                        setIsDataUploading(false);
                        message.error('Operation failed');

                    }

                } else {
                    setIsDataUploading(false);
                    console.error("❌ Upload failed:", result);
                }
            } catch (error) {
                setIsDataUploading(false);
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
        const date = dayjs(viewTransaction?.date || '').format('DD-MM-YYYY');

        let url = window.location.hostname;
        if (url === "localhost") {
            url = "localhost:5173";
        }

        const qrDataUrl = await QRCode.toDataURL(url + '/receipt/' + viewTransaction?._id || "", {
            width: 100,
            margin: 2,
            color: {
                dark: "#0a7857ff",  // your theme color (foreground)
                light: "#ffffff"  // background color
            }
        });


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
            background: linear-gradient(to bottom right, #029bd2, #20c997);
            color: white;
            padding: 10px;
            padding-bottom: 15px;
            border-radius: 6px;
            margin-bottom: 15px;
        ">
            <div style="font-size: 16px; font-weight: bold; margin-bottom:10px;">${CONFIG.Header_FullName?.trim()
                ? CONFIG.Header_FullName
                : (JSON.parse(localStorage.getItem("selectedEntity") || "null"))?.Header_FullName ?? ""}</div>
            <div style="font-size: 11px;">${CONFIG.Header_Address?.trim()
                ? CONFIG.Header_Address
                : (JSON.parse(localStorage.getItem("selectedEntity") || "null"))?.Header_Address ?? ""}</div>
        </div>

        <!-- Details (2 columns per row) -->
        <!-- <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 15px; font-size: 12px; padding:5px;">
            <div style="flex: 1; min-width: 200px;"><span class="label">رسید نمبر :</span> ${receiptNumber}</div>
            <div style="flex: 1; min-width: 200px;"><span class="label">تاریخ :</span> <span style="direction:ltr;"> ${date} </span> </div>
            
            
            ${trxnType === 'asset' ? '' : `<div style="flex: 1; min-width: 200px;"><span class="label">رقم :</span> ${amount} روپے</div>`}
            <div  style="flex: 1; min-width: 200px;"><span class="label"> ${trxnType === 'asset' ? 'ہدیہ' : 'مد'} &nbsp;&nbsp;&nbsp;:</span> <span>${category}</span></div>

            <div style="flex: 1; min-width: 200px;"><span class="label">نام :</span> ${reference}</div>
            <div style="flex: 1; min-width: 200px;"><span class="label">تفصیل :</span> ${description}</div>
        </div> -->

        <!-- Details -->
<div style="
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 15px;
    font-size: 12px;
">
  <div style="
      flex: 1;
      min-width: 220px;
      background: #ffffff;
      border: 1px solid #e0e6e3;
      border-radius: 6px;
      padding: 6px 10px;
      display: flex;
      align-items: center;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  ">
    <span style="min-width: 70px; color:#555; font-weight:600;">رسید نمبر &nbsp;&nbsp;&nbsp;:</span>
    <span style="color:#165c2f;">${receiptNumber}</span>
  </div>

  <div style="
      flex: 1;
      min-width: 220px;
      background: #ffffff;
      border: 1px solid #e0e6e3;
      border-radius: 6px;
      padding: 6px 10px;
      display: flex;
      align-items: center;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  ">
    <span style="min-width: 70px; color:#555; font-weight:600;">تاریخ &nbsp;&nbsp;&nbsp;:</span>
    <span style="color:#165c2f; direction:ltr;">${date}</span>
  </div>

  ${trxnType === 'asset' ? '' : `
  <div style="
      flex: 1;
      min-width: 220px;
      background: #ffffff;
      border: 1px solid #e0e6e3;
      border-radius: 6px;
      padding: 6px 10px;
      display: flex;
      align-items: center;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  ">
    <span style="min-width: 70px; color:#555; font-weight:600;">رقم &nbsp;&nbsp;&nbsp;:</span>
    <span style="color:#165c2f;">${amount} روپے</span>
  </div>`}

  <div style="
      flex: 1;
      min-width: 220px;
      background: #ffffff;
      border: 1px solid #e0e6e3;
      border-radius: 6px;
      padding: 6px 10px;
      display: flex;
      align-items: center;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  ">
    <span style="min-width: 70px; color:#555; font-weight:600;">${trxnType === 'asset' ? 'ہدیہ &nbsp;&nbsp;&nbsp;:' : ' مد &nbsp;&nbsp;&nbsp;:'}</span>
    <span style="color:#165c2f;">${category}</span>
  </div>

  <div style="
      flex: 1;
      min-width: 220px;
      background: #ffffff;
      border: 1px solid #e0e6e3;
      border-radius: 6px;
      padding: 6px 10px;
      display: flex;
      align-items: center;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  ">
    <span style="min-width: 70px; color:#555; font-weight:600;">نام &nbsp;&nbsp;&nbsp;:</span>
    <span style="color:#165c2f;">${reference}</span>
  </div>

  <div style="
      flex: 1;
      min-width: 220px;
      background: #ffffff;
      border: 1px solid #e0e6e3;
      border-radius: 6px;
      padding: 6px 10px;
      display: flex;
      align-items: center;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  ">
    <span style="min-width: 70px; color:#555; font-weight:600;">تفصیل &nbsp;&nbsp;&nbsp;:</span>
    <span style="color:#165c2f;">${description}</span>
  </div>
</div>


        <!-- Note -->
        ${trxnType === 'asset' ? '' : `<div style="
            border: 1px dashed #165c2f;
            padding: 10px;
            padding-bottom: 15px;
            border-radius: 4px;
            font-size: 12px;
            margin-bottom: 10px;
            background-color: #f5fbf7;
        ">
            <p style="text-align: center; font-weight: bold;">نوٹ</p>
                <div style="text-align: center; ">    
                    ${CONFIG.PrintNotes?.trim()
                    ? CONFIG.PrintNotes
                    : (JSON.parse(localStorage.getItem("selectedEntity") || "null"))?.PrintNotes ?? ""}
                    </div>
                </div>`

            }

        <!-- Footer Old-->
        <!-- <div style="text-align: center; font-size: 12px;">
            <div style="display:flex; justify-content: space-around; align-items:center;">

                <div>
                    <p style="font-weight: bold;"> ${trxnType === 'asset' ? '' : 'مزید '}
                        معلومات یا شرعی رہنمائی کے لیے:</p>
                    ${CONFIG.Footer_Names}
                </div>
                <div style="text-align: center; margin-top: 10px;">
                    <img src="${qrDataUrl}" alt="QR Code" style="width:80px; height:80px;" />
                </div>
            </div>
            <div style="margin-top: 10px; border-top: 1px dashed #165c2f; padding-top: 5px;">
                <span>Generated By : </span> ${user}
            </div>
        </div>     -->

        <!-- Footer -->
<div style="font-size: 12px; margin-top: 15px;">
  <div style="
      display: flex;
      justify-content: space-between;
      align-items: stretch;
      gap: 15px;
  ">
    <!-- Info Box -->
    <div style="
        flex: 1;
        background: #f5f9f7;
        border: 1px solid #cfe0d5;
        border-radius: 10px;
        padding: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        line-height: 1.6;
    ">
      <div>
        <p style="font-weight: bold; color: #165c2f; margin: 0 0 6px 0;">
          ${trxnType === 'asset' ? '' : 'مزید '} معلومات یا شرعی رہنمائی کے لیے:
        </p>
        <div style="font-size: 12px; color: #333;">
          ${CONFIG.Footer_Names}
        </div>
      </div>
    </div>

    <!-- QR Box -->
    <div style="
        width: 110px;
        background: #fff;
        border: 2px dashed #165c2f81;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 4px;
    ">
      <img src="${qrDataUrl}" alt="QR Code" 
           style="width:90px; height:90px;" />
    </div>
  </div>

  <!-- Generated By -->
  <div style="margin-top: 10px; text-align:center; font-size: 11px; color:#555;">
    <span style="border-top:1px solid #ddd; padding-top:4px; display:inline-block;">
      Generated By : ${user}
    </span>
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

        const message = trxnType !== 'expense'
            ? `\n\n Thank you for your Donation \n\n` +
            `*جزاکم اللہ خیراً و احسن الجزاء*\n\n`
            : '';


        const encodedMessage = encodeURIComponent(message);
        const whatsappURL = `https://wa.me/${number}?text=${encodedMessage}`;

        window.open(whatsappURL, '_blank');
    };


    const downloadPdf = (transactions) => {
        transactions = [...transactions].reverse();

        const totalAmount = trxnType !== 'asset'
            ? transactions.reduce((sum, t) => sum + (t.amount || 0), 0)
            : 0;

        const categoryName = selectedCategory
            ? categories.find(c => c._id === selectedCategory)?.name
            : "";
        const userName = selectedUser
            ? users.find(u => u._id === selectedUser)?.name
            : "";
        let dateRangeText = "";
        if (selectedDateRange && (selectedDateRange[0] || selectedDateRange[1])) {
            const from = selectedDateRange[0]?.format("DD-MM-YYYY");
            const to = selectedDateRange[1]?.format("DD-MM-YYYY");

            if (from && to) {
                dateRangeText = ` Date : ${from} to ${to}`;
            } else if (from) {
                dateRangeText = ` Date : From ${from}`;
            } else if (to) {
                dateRangeText = ` Date : Till ${to}`;
            }
        }


        // Build filter line
        let filterLine = "";
        if (dateRangeText) filterLine += ` ${dateRangeText} `;
        if (categoryName) filterLine += ` </br>  ${categoryName} `;
        if (userName) filterLine += ` </br> ~ User ~ ${userName} `;

        const htmlContent = `
  <div>

    <!-- ✅ Header -->
    <div class="center" style="margin-top: 15px; padding-bottom: 3px; color: #0b4f2f; font-weight: bold; font-size: 16px;">
      ${CONFIG.Header_FullName?.trim()
                ? CONFIG.Header_FullName
                : (JSON.parse(localStorage.getItem("selectedEntity") || "null"))?.Header_FullName ?? ""}
    </div>
     <div class="center" style="margin-top: 4px;">
          ${trxnType === 'income' ? 'Income' : (trxnType === 'expense' ? 'Expense' : 'Assets')} Report ${filterLine ? " ~ " + filterLine : ""}
        </div>
    <!-- ✅ Transactions table -->
    <table>
      <thead>
        <tr>
          <th class="col-small">رسید نمبر</th>
          <th class="col-medium">تاریخ</th>
          <th class="col-large">نام</th>
          ${trxnType === 'asset' ? '' : '<th class="col-medium">رقم</th>'}
          <th class="col-medium">${trxnType === 'asset' ? 'اشیاء' : 'مد'}</th>
          <th class="col-xlarge">تفصیل</th>
        </tr>
      </thead>
      <tbody>
        ${transactions
                .map(
                    (t) => `
          <tr>
            <td>${t.receiptNumber || ""}</td>
            <td style="direction:ltr" >${dayjs(t.date).format('DD-MMM-YYYY')}</td>
            <td>${t.reference || ""}</td>
            ${trxnType === 'asset' ? '' : `<td>${t.amount} روپے</td>`}
            <td>${t.category?.name || ""}</td>
            <td>${t.description || ""}</td>
          </tr>
        `
                )
                .join("")}
                ${trxnType !== 'asset'
                ? `
            <tr style="font-weight: bold; background-color: #f5f5f5;">
              <td colspan="3" style="text-align: center;">کل</td>
              <td>${totalAmount.toLocaleString()} روپے</td>
              <td colspan="2"></td>
            </tr>
          `
                : ""
            }
      </tbody>
    </table>

  </div>
  `;

        const fullHtml = `
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
          padding: 10px;
        }
        .center {
          text-align: center;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 12px;
          border: 1px solid #444;
          border-radius: 6px;
          overflow: hidden;
        }
        th, td {
          border: 1px solid #666 !important;
          padding: 5px 6px;
          font-size: 12px;
        }
        th {
          font-weight: bold;
          text-align: center;
          background: linear-gradient(to bottom right, #029bd2, #20c997);      
          color: #fff;
          padding: 10px 8px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        td {
          text-align: right;
        }

        /* ✅ Column widths */
        .col-small { width: 10%; }
        .col-medium { width: 15%; }
        .col-large { width: 20%; }
        .col-xlarge { width: 30%; }

        /* ✅ Repeat table headers on each page */
        thead { display: table-header-group; }
        tfoot { display: table-footer-group; }

        /* ✅ Force print styles */
        @media print {
          table, th, td {
            border: 1px solid #000 !important;
          }
        }
      </style>
    </head>
    <body>
      ${htmlContent}
      <script>
        document.fonts.ready.then(() => {
            window.print();
        });
        </script>

    </body>
  </html>
  `;

        // ✅ Open in new tab for testing + auto print
        const newTab = window.open();
        newTab.document.write(fullHtml);
        newTab.document.close();
    };





    const savedUser = JSON.parse(localStorage.getItem('user') || 'null');
    const isAdmin = savedUser?.isAdmin;
    const canViewOtherUsersData = savedUser?.canViewOtherUsersData;
    const canAddData = savedUser?.canAddData;
    const canUpdateData = savedUser?.canUpdateData;


    const handleDeleteImage = async (transactionId, publicId) => {
        try {
            const API = import.meta.env.VITE_API_BASE_URL;
            await axios.delete(`${API}/transactions/${transactionId}/image/${publicId}`, {
                headers: {
                    "X-Client": window.location.hostname.split(".")[0],
                },
            });

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

            <div className="container mt-md-4">
                <div className="d-flex justify-content-between mb-1">
                    <h4>{pageTitle}</h4>
                    {(isAdmin || canAddData) &&

                        <Button color="green" variant="solid" onClick={showAddModal}
                            style={{ background: "linear-gradient(to bottom right, #029bd2, #20c997)", borderColor: "#03adebff" }} >
                            <ScheduleOutlined className="w-4 h-4 mr-2" />
                            Add {trxnType === 'income' ? 'Income' : (trxnType === 'expense' ? 'Expense' : 'Asset')}
                        </Button>
                    }

                </div>


                {/* Filters Section */}

                <div
                    className='filters-wrapper'
                    style={{
                        backgroundColor: "#20c9962c",
                        background: "linear-gradient(to bottom , #029bd21d,  #20c9962c)",
                        borderRadius: "8px",
                        marginBottom: "16px",
                        overflow: "hidden",
                    }}
                >
                    {/* Header */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "8px 12px",
                            cursor: "pointer",
                            userSelect: "none",
                            color: "#01516e",
                            margin: "3px",
                            borderRadius: "5px"

                        }}
                        onClick={() => setOpen(!open)}
                    >
                        <span style={{ fontWeight: "bold" }}>Filters</span>
                        {open ? <UpCircleOutlined /> : <DownCircleOutlined />}
                    </div>

                    {/* Body */}
                    <div
                        style={{
                            maxHeight: open ? "1000px" : "0",
                            overflow: "hidden",
                            transition: "max-height 0.4s ease",
                        }}
                    >
                        <div style={{ padding: "12px", paddingTop: "0px" }}>
                            <Row gutter={[12, 12]}>
                                {/* Search */}
                                <Col xs={24} md={8}>
                                    <label className='filterLabel'>Search</label>
                                    <Input
                                        placeholder="Search Name , Phone , Receitp #, Description."
                                        value={searchText}
                                        onChange={(e) => setSearchText(e.target.value)}
                                    />
                                </Col>

                                {/* From Date */}
                                <Col xs={12} md={4}>
                                    <label className='filterLabel'>From Date</label>
                                    <DatePicker
                                        placeholder="From Date"
                                        value={selectedDateRange?.[0]}
                                        onChange={(value) =>
                                            setSelectedDateRange([value, selectedDateRange?.[1]])
                                        }
                                        format="DD - MMM - YYYY"
                                        style={{ width: "100%" }}
                                    />
                                </Col>

                                {/* To Date */}
                                <Col xs={12} md={4}>
                                    <label className='filterLabel'>To Date</label>
                                    <DatePicker
                                        placeholder="To Date"
                                        value={selectedDateRange?.[1]}
                                        onChange={(value) =>
                                            setSelectedDateRange([selectedDateRange?.[0], value])
                                        }
                                        format="DD - MMM - YYYY"
                                        style={{ width: "100%" }}
                                    />
                                </Col>

                                {/* Category */}
                                <Col xs={12} md={4}>
                                    <label className='filterLabel'>Category</label>
                                    <Select
                                        placeholder="All"
                                        value={selectedCategory}
                                        onChange={(value) => setSelectedCategory(value)}
                                        style={{ width: "100%" }}
                                    >
                                        <Option value="">
                                            {trxnType === "asset" ? "All Types" : "All Categories"}
                                        </Option>

                                        {categories
                                            .filter(cat => cat.status !== 3) // ✅ only Active categories
                                            .map(cat => (
                                                <Option key={cat._id} value={cat._id}>
                                                    {cat.name}
                                                </Option>
                                            ))}
                                    </Select>

                                </Col>

                                {/* Generated By (if allowed) */}
                                {(isAdmin || canViewOtherUsersData) && (
                                    <Col xs={12} md={4}>
                                        <label className='filterLabel'>Generated By</label>
                                        <Select
                                            placeholder="Generated by All Users"
                                            value={selectedUser}
                                            onChange={(value) => setSelectedUser(value)}
                                            style={{ width: "100%" }}
                                        >
                                            <Option value="">All Users</Option>
                                            {users.map((usr) => (
                                                <Option key={usr._id} value={usr._id}>
                                                    {usr.name}
                                                </Option>
                                            ))}
                                        </Select>
                                    </Col>
                                )}

                                {/* Buttons */}
                                <Col
                                    xs={24}
                                    style={{
                                        marginTop: "10px",
                                        marginBottom: "3px",
                                        display: "flex",
                                        justifyContent: "flex-end",
                                        gap: "8px",
                                    }}
                                >
                                    <Button
                                        type="primary"
                                        style={{ backgroundColor: "#20c997", borderColor: "#20c997" }}
                                        icon={<FilePdfOutlined />}
                                        onClick={() => downloadPdf(transactions)}
                                    >
                                        PDF
                                    </Button>
                                    {/* <Button
                                        type="primary"
                                        style={{ backgroundColor: "#20c997", borderColor: "#20c997" }}
                                        icon={<FilePdfOutlined />}
                                        onClick={() => downloadPdf(transactions)}
                                    >
                                        Full Report
                                    </Button> */}
                                </Col>
                            </Row>
                        </div>
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

                        {/* ✅ Regular Donor selection */}
                        {trxnType === "income" && (!editMode || editingTransaction.donor) && (
                            <Form.Item name="donor" label="Regular Donor">
                                <Select
                                    allowClear
                                    placeholder="Select Donor (optional)"
                                    onChange={(donorId) => {
                                        const donor = donors.find((d) => d._id === donorId);
                                        if (donor) {
                                            form.setFieldsValue({
                                                reference: donor.name,
                                                phoneNumber: donor.contact,
                                                amount: donor.monthlyCommitment > 0 ? donor.monthlyCommitment : undefined,
                                            });
                                        }
                                    }}
                                >
                                    {donors.map((d) => (
                                        <Select.Option key={d._id} value={d._id}>
                                            {d.name} {d.monthlyCommitment ? `- Rs.${d.monthlyCommitment}` : ""}
                                        </Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        )}


                        {/* ✅ Due Payment selection */}
                        {trxnType === "expense" && (!editMode
                            //    || editingTransaction.duePayment
                        ) && (
                                <Form.Item name="duePayment" label="Due Payment">
                                    <Select
                                        allowClear
                                        placeholder="Select Due Payment (optional)"
                                        onChange={(dueId) => {
                                            const duePayment = duePayments.find((d) => d._id === dueId);
                                            if (duePayment) {
                                                form.setFieldsValue({
                                                    category: duePayment.category._id,
                                                    amount: duePayment.amount,
                                                    description: duePayment.description,
                                                });
                                            }
                                        }}
                                    >
                                        {duePayments.map((d) => (
                                            <Select.Option key={d._id} value={d._id}>
                                                {d.category.name} {d.amount ? `- Rs.${d.amount}` : ""}
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            )}



                        {/* ✅ One-time donor / Paid To */}
                        <Form.Item
                            name="reference"
                            label={trxnType !== "expense" ? "Donor Name" : "Paid To"}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item name="phoneNumber" label="Phone #">
                            <Input />
                        </Form.Item>

                        {trxnType !== "asset" && (
                            <Form.Item
                                name="amount"
                                label="Amount"
                                rules={[{ required: true }]}
                            >
                                <Input type="number" />
                            </Form.Item>
                        )}

                        <Form.Item
                            name="category"
                            label={trxnType === "asset" ? "Asset Type" : "Category"}
                            rules={[
                                {
                                    required: true,
                                    message: `Please Select ${trxnType === "asset" ? "Asset Type" : "Category"
                                        }`,
                                },
                            ]}
                        >
                            <Select>
                                {categories
                                    .filter(cat => cat.status === 1 || (editMode && cat.status === 2)) // exclude hidden categories
                                    .map(cat => (
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
                            <DatePicker style={{ width: '100%' }} format="DD - MMM - YYYY" />
                        </Form.Item>

                        <Form.Item name="description" label="Description" >
                            <Input.TextArea rows={4} />
                        </Form.Item>
                    </Form>
                </Modal>

                {/* View Modal */}

                <Modal
                    title={`${trxnType === 'income' ? 'Income' : (trxnType === 'expense' ? 'Expense' : 'Asset')} Details`}
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

                        <Form.Item label={trxnType !== 'expense' ? 'Donor Name' : 'Paid To'}>
                            <Input value={viewTransaction?.reference} readOnly />
                        </Form.Item>
                        <Form.Item label="Phone #">
                            <Input value={viewTransaction?.phoneNumber} readOnly />
                        </Form.Item>

                        {trxnType !== 'asset' && <Form.Item label="Amount">
                            <Input value={viewTransaction?.amount} readOnly />
                        </Form.Item>}
                        <Form.Item label={trxnType === 'asset' ? 'Asset Type' : 'Category'}>
                            <Input value={viewTransaction?.category?.name} readOnly />
                        </Form.Item>

                        <Form.Item label="Date">
                            <Input value={dayjs(viewTransaction?.date).format('DD MMM YYYY')} readOnly />
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
                        {trxnType !== 'expense' && <Button
                            type="default"
                            icon={<PrinterOutlined />}
                            onClick={handlePrint}
                        >
                            Print
                        </Button>}
                        {trxnType !== 'expense' && <Button
                            type="default"
                            icon={<PictureOutlined />}
                            onClick={handleImageDownload}
                        >
                            Reciept
                        </Button>}




                        {trxnType !== 'expense' && viewTransaction?.phoneNumber?.trim() && <Button
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
                    {isDataUploading && <Spinner />}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', padding: '15px', justifyContent: 'center' }}>
                        {viewTransaction?.imagePublicIds
                            ?.split(',')
                            .filter(id => id.trim() !== '')
                            .map((publicId, index) => (
                                <div
                                    key={index}
                                    style={{
                                        position: 'relative',
                                        width: '190px',
                                        margin: '10px'
                                    }}
                                >
                                    {/* Delete Button */}
                                    {(isAdmin || canUpdateData) && <Popconfirm
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
                                    }
                                    {/* Image */}
                                    <img
                                        src={`https://res.cloudinary.com/${CONFIG.CLOUD_NAME}/image/upload/w_300/${publicId}`}
                                        alt={`Transaction ${index + 1}`}
                                        style={{
                                            width: '100%',
                                            borderRadius: '6px',
                                            border: '1px solid #ddd',
                                            cursor: 'pointer',
                                        }}
                                        onError={(e) => {
                                            // Tries to load the w_300 thumbnail first (transformation).
                                            // If the request fails (e.g., transformation limit exceeded), the onError fires.
                                            // Then we replace it with the full-size image.
                                            e.target.src = `https://res.cloudinary.com/${CONFIG.CLOUD_NAME}/image/upload/${publicId}`;
                                        }}
                                        onClick={() =>
                                            window.open(
                                                `https://res.cloudinary.com/${CONFIG.CLOUD_NAME}/image/upload/${publicId}`,
                                                '_blank'
                                            )
                                        }
                                    />

                                </div>
                            ))}
                    </div>

                    {/* Buttons Section */}
                    {(isAdmin || canAddData) && <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                        <Button
                            type="primary"
                            icon={<UploadOutlined />}
                            onClick={() => UploadNewImageOnline(viewTransaction)}
                        >
                            Upload New Image
                        </Button>
                    </div>}
                </Modal>

            </div>
        </>
    );

};

export default Transactions;
