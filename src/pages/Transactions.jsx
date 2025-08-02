import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, DatePicker, message, Popconfirm, Select, Grid } from 'antd';
import axios from 'axios';
import { EditOutlined, DeleteOutlined, EyeOutlined, WhatsAppOutlined, PrinterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

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
    const [form] = Form.useForm();
    const [categories, setCategories] = useState([]);

    const [searchText, setSearchText] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedDateRange, setSelectedDateRange] = useState([]);
    const isMobile = useBreakpoint().xs;
  const [messageApi, msgContextHolder] = message.useMessage();

    // const getTransactions = async () => {
    //     setLoading(true);
    //     try {
    //         const res = await axios.get(`/api/v1/transactions/getAll?type=${type}`);
    //         setTransactions(res.data.transactions);
    //     } catch (err) {
    //         messageApi.error(`Failed to fetch ${type} records.`);
    //     }
    //     setLoading(false);
    // };

    const getTransactions = async () => {
        setLoading(true);
        try {
            const params = {
                type,
            };

            if (searchText) params.search = searchText;
            if (selectedCategory) params.category = selectedCategory;
            if (selectedDateRange?.[0]) {
                params.startDate = selectedDateRange[0].startOf('day').toISOString();
            }
            if (selectedDateRange?.[1]) {
                params.endDate = selectedDateRange[1].endOf('day').toISOString();
            }

            const res = await axios.get('/api/v1/transactions/getAll', { params });

            setTransactions(res.data.transactions);
        } catch (err) {
            messageApi.error(`Failed to fetch ${type} records.`);
        }
        setLoading(false);
    };


    const fetchCategories = async () => {
        try {
            const res = await axios.get(`/api/v1/categories?type=${type}`);
            setCategories(res.data.categories);
        } catch (error) {
            console.error("Error fetching categories:", error);
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
    }, [type, searchText, selectedCategory, selectedDateRange]);



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


    const showViewModal = (transaction) => {
        setViewTransaction(transaction);
        setViewModalVisible(true);
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`/api/v1/transactions/${id}`);
            messageApi.success(`${isIncome ? 'Income' : 'Expense'} deleted`);
            getTransactions();
        } catch {
            messageApi.error('Delete failed');
        }
    };

    const onFinish = async (values) => {
        const payload = {
            ...values,
            type,
            date: values.date.toISOString(),
        };
        try {
            if (editMode) {
                await axios.put(`/api/v1/transactions/${editingTransaction._id}`, payload);
                messageApi.success(`${isIncome ? 'Income' : 'Expense'} updated`);
            } else {
                await axios.post('/api/v1/transactions/create', payload);
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
            title: isIncome ? 'Donor Name' : 'Paid To',
            dataIndex: 'reference',
            align: 'center',
            responsive: ['md'], // ✅ Show only on medium+ screens
        },
        {
            title: 'Phone Number',
            dataIndex: 'phoneNumber',
            align: 'center',
            responsive: ['md'], // ✅ Show only on medium+ screens
        },
        {
            title: 'Description',
            dataIndex: 'description',
            align: 'center',
            responsive: ['md'], // ✅ Show only on medium+ screens
            className: 'description-column'
        },
        {
            title: 'Actions',
            align: 'center',
            render: (record) => (
                <>
                    <Button type="link" icon={<EyeOutlined />} onClick={() => showViewModal(record)} />
                    {isAdmin &&
                    <>
                    <Button type="link" icon={<EditOutlined />} onClick={() => showEditModal(record)} style={{ color: '#52c41a' }} />
                    <Popconfirm title="Are you sure?" onConfirm={() => handleDelete(record._id)}>
                        <Button type="link" danger icon={<DeleteOutlined />} />
                    </Popconfirm> 
                    </>
                    }
                </>
            ),
        },

        // {
        //             title: 'Actions',
        //             align: 'center',
        //             render: (record) => (
        //                 <>
        //                     <Button type="link" icon={<EyeOutlined />} onClick={() => showViewModal(record)} />
        //                     <Button type="link" icon={<EditOutlined />} onClick={() => showEditModal(record)} />
        //                     <Popconfirm title="Are you sure?" onConfirm={() => handleDelete(record._id)}>
        //                         <Button type="link" danger icon={<DeleteOutlined />} />
        //                     </Popconfirm>
        //                 </>
        //             ),
        //         },
    ];

    const handlePrint = () => {

        const amount = viewTransaction?.amount;
        const category = viewTransaction?.category?.name || '';
        const reference = viewTransaction?.reference;
        const description = viewTransaction?.description;
        const date = dayjs(viewTransaction?.date).format('YYYY-MM-DD');


        const printWindow = window.open('', '_blank');

        const htmlContentForIncome = `
  <div>

    <div class="center" style="margin-top: 15px; padding-bottom: 5px;">
      <div style="font-size: 15px; font-weight: bold;">جامع مسجد فیضانِ ہجویری</div>
      سکین کالج والی گلی P-565، بلال روڈ<br />
      لنک ویسٹ کینال روڈ، امین ٹاؤن، فیصل آباد
    </div>

    <div class="box">
    <div class="row"><span class="label">تاریخ&nbsp;&nbsp;&nbsp;:</span> <span>${date}</span></div>
<div class="row"><span class="label">نام&nbsp;&nbsp;&nbsp;:</span> <span>${reference}</span></div>
<div class="row"><span class="label">تفصیل&nbsp;&nbsp;&nbsp;:</span> <span>${description}</span></div>
<div class="row"><span class="label">رقم&nbsp;&nbsp;&nbsp;:</span> <span>${amount} روپے</span></div>
<div class="row"><span class="label">مد&nbsp;&nbsp;&nbsp;:</span> <span>${category}</span></div>


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
      جزاکم اللہ خیراً و احسن الجزاء
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
  min-width: 70px; /* adjust if needed for proper alignment */
  display: inline-block;
}

      </style>
    </head>
    <body onload="window.print(); window.close();">
      ${htmlContentForIncome}
    </body>
  </html>
`);

        printWindow.document.close();
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

        // Construct message
        const amount = viewTransaction?.amount;
        const category = viewTransaction?.category?.name || '';
        const reference = viewTransaction?.reference;
        const description = viewTransaction?.description;
        const date = dayjs(viewTransaction?.date).format('DD-MM-YYYY');

        //     const message = isIncome
        //         ? `Assalamu Alaikum,\n\n
        // JazakAllah khair! 
        // A donation of Rs. ${amount} has been received on ${date} for "${category}".\n\n
        // – ${masjidName}`

        //         : `Assalamu Alaikum,\n\n
        // An expense of Rs. ${amount} has been recorded on ${date} under "${category}".
        // \n\n– ${masjidName}`;

        const message = isIncome
            ? `*السلام علیکم ورحمۃ اللہ وبرکاته*\n` +
            `========================\n\n` +

            `*تاریخ :* ${date}\n` +
            `*نام :* ${reference}\n` +
            `*تفصیل :* ${description}\n` +
            `*رقم :* روپے ${amount}\n` +
            `*مد :* ${category}\n\n` +

            `========================\n\n` +

            `آپ کی عطیہ کردہ رقم کسی بھی جائز دینی، اصلاحی، تعمیری یا مسجد کی تزئین و آرائش کے کام میں استعمال کی جا سکتی ہے۔\n` +
            `*جزاکم اللہ خیراً و احسن الجزاء*\n\n` +

            `========================\n\n` +

            `*مزید معلومات یا شرعی رہنمائی کے لیے رابطہ کریں:*\n` +
            `مفتی نزاکت علی المدنی\n` +
            `فون: 0306-7812905\n\n` +

            `========================\n\n` +

            `*:: جامع مسجد فیضانِ ہجویری ::*\n` +
            `سکین کالج والی گلی P-565، بلال روڈ ۔ ` +
            `لنک ویسٹ کینال روڈ، امین ٹاؤن، فیصل آباد`
            : '';



        const encodedMessage = encodeURIComponent(message);
        const whatsappURL = `https://wa.me/${number}?text=${encodedMessage}`;

        window.open(whatsappURL, '_blank');
    };

  const savedUser = JSON.parse(localStorage.getItem('user'));
  const isAdmin = savedUser?.isAdmin;

    return (
<>
{msgContextHolder}

        <div className="container mt-4">
            <div className="d-flex justify-content-between mb-3">
                <h4>{pageTitle}</h4>
                { isAdmin &&
                <Button color="green" variant="solid" onClick={showAddModal}>
                    Add {isIncome ? 'Income' : 'Expense'}
                </Button>
                }
            </div>


            {/* Filters Section */}
            <div className="row mb-3">
                <div className="col-12 col-md-6 mb-2">
                    <div className="d-flex flex-row flex-md-row" style={{ gap: '8px' }}>
                        <div style={{ flex: 1 }}>
                            <Input
                                placeholder="Search Name , Phone , Description."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                style={{ flex: 1 }}
                            />
                        </div>
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
                    // {transactions.filter(tx => {
                    //     const matchesText = searchText === '' || tx.reference?.toLowerCase().includes(searchText.toLowerCase()) || tx.description?.toLowerCase().includes(searchText.toLowerCase());
                    //     const matchesCategory = selectedCategory === '' || tx.category?._id === selectedCategory;
                    //     const matchesPhone = phoneFilter === '' || tx.phoneNumber?.includes(phoneFilter);
                    //     const matchesDate =
                    //         !Array.isArray(selectedDateRange) ||
                    //         selectedDateRange.length === 0 ||
                    //         (dayjs(tx.date).isAfter(dayjs(selectedDateRange[0]).startOf('day')) &&
                    //             dayjs(tx.date).isBefore(dayjs(selectedDateRange[1]).endOf('day')));

                    //     return matchesText && matchesCategory && matchesDate && matchesPhone;
                    // })}
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


                    <Form.Item name="date" label="Date" rules={[{ required: true }]}>
                        <DatePicker style={{ width: '100%' }} format='DD-MM-YYYY' />
                    </Form.Item>
                    <Form.Item name="reference" label={isIncome ? 'Donor Name' : 'Paid To'}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="phoneNumber" label="Phone Number">
                        <Input />
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
                    <Form.Item label="Amount">
                        <Input value={viewTransaction?.amount} readOnly />
                    </Form.Item>
                    <Form.Item label="Category">
                        <Input value={viewTransaction?.category?.name} readOnly />
                    </Form.Item>
                    <Form.Item label="Date">
                        <Input value={dayjs(viewTransaction?.date).format('DD-MM-YYYY')} readOnly />
                    </Form.Item>
                    <Form.Item label={isIncome ? 'Donor Name' : 'Paid To'}>
                        <Input value={viewTransaction?.reference} readOnly />
                    </Form.Item>
                    <Form.Item label="Phone Number">
                        <Input value={viewTransaction?.phoneNumber} readOnly />
                    </Form.Item>
                    <Form.Item label="Description">
                        <Input.TextArea rows={4} value={viewTransaction?.description} readOnly />
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
                        type="primary"
                        icon={<WhatsAppOutlined />}
                        onClick={handleWhatsApp}
                    >
                        WhatsApp
                    </Button>}

                </div>
            </Modal>


            {/* <Modal
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
                    <Form.Item label="Amount">
                        <Input value={viewTransaction?.amount} readOnly />
                    </Form.Item>
                    <Form.Item label="Category">
                        <Input value={viewTransaction?.category?.name} readOnly />
                    </Form.Item>
                    <Form.Item label="Date">
                        <Input value={dayjs(viewTransaction?.date).format('DD-MM-YYYY')} readOnly />
                    </Form.Item>
                    <Form.Item label="Reference">
                        <Input value={viewTransaction?.reference} readOnly />
                    </Form.Item>
                    <Form.Item label="Phone Number">
                        <Input value={viewTransaction?.phoneNumber} readOnly />
                    </Form.Item>
                    <Form.Item label="Description">
                        <Input.TextArea rows={4} value={viewTransaction?.description} readOnly />
                    </Form.Item>
                </Form>




            </Modal> */}
        </div>
</>
    );

};

export default Transactions;
