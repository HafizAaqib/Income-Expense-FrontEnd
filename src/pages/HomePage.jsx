// we need to make these as => functional component : using arrow function


import React, { useState, useEffecte, useEffect } from 'react';
import { Form, Modal, Input, Select, message, Table, DatePicker } from 'antd';
import Layout from '../components/Layout';
import axios from 'axios';
import Spinner from '../components/Spinner';
import moment from 'moment';
import { UnorderedListOutlined, AreaChartOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import Analytics from '../components/Analytics';

const { RangePicker } = DatePicker

const HomePage = () => {

    const [messageApi, msgContextHolder] = message.useMessage();

    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [allExpenses, setAllExpenses] = useState([]);
    const [frequency, setFrequency] = useState("7");
    const [selectedDate, setSelectedDate] = useState([]);
    const [type, setType] = useState('0');
    const [viewData, setViewData] = useState('table');
    const [editable, setEditable] = useState(null)

    const columns = [
        {
            title: 'Date',
            dataIndex: 'date',
            render: (text) => <span> {moment(text).format('DD-MM-YYYY')} </span>
        },
        {
            title: 'Amount',
            dataIndex: 'amount'
        },
        {
            title: 'Type',
            dataIndex: 'type'
        },
        {
            title: 'Reference',
            dataIndex: 'reference'
        },
        {
            title: 'Description',
            dataIndex: 'description'
        },
        {
            title: 'Actions',
            render: (text, record) => (
                <div>
                    <EditOutlined className='ant-icon' onClick={() => {
                        setEditable(record),
                            setShowModal(true)
                    }} />
                    <DeleteOutlined className='ant-icon mx-2' onClick={() => handleDelete(record)} />
                </div>
            )
        },
    ]

    useEffect(() => {

        const getAllExpenses = async () => {
            try {
                setLoading(true);
                const res = await axios.post('/api/v1/expenses/get-Expenses', { frequency, selectedDate, type });
                setAllExpenses(res.data);
                setLoading(false);
            } catch (error) {
                setLoading(false);
                messageApi.error('Failed to get expenses')
            }
        }
        getAllExpenses();

    }, [frequency, selectedDate, type])

    const handleSubmit = async (values) => {
        console.log(values)
        try {
            setLoading(true);
            if (editable) {
                await axios.post('/api/v1/expenses/edit-Expense', {
                    payload: {
                        ...values,
                        expenseId: editable._id
                    }
                });
                setLoading(false);
                messageApi.success('Expense Update');
            } else {
                await axios.post('/api/v1/expenses/add-Expense', values);
                setLoading(false);
                messageApi.success('Expense Added');
            }
            setShowModal(false);
            setEditable(null);
        } catch (error) {
            setLoading(false);
            messageApi.error('Failed to save expense')
        }
    }

    const handleDelete = async (record) => {
        try {
            setLoading(true);
            await axios.post('/api/v1/expenses/delete-Expense', { expenseId: record._id })
            setLoading(false);
            message.success('Expense Deleted')
        } catch (error) {
            setLoading(false);
            messageApi.error('Failed to delete expense')
        }
    }

    return (

        // layout ko ham as a tag use kr rae , to is k andar jo bhi ho ga as children pass ho ga Layout ko

        <Layout >
            {msgContextHolder}
            {loading && <Spinner />}
            <div className='filters'>
                <div>
                    <h6>Select Frequency</h6>
                    <Select value={frequency} onChange={(v) => setFrequency(v)}>
                        <Select.Option value="7" >Last 1 Week</Select.Option>
                        <Select.Option value="30">Last 1 Month</Select.Option>
                        <Select.Option value="265">Last 1 Year</Select.Option>
                        <Select.Option value="custom">Custom </Select.Option>
                    </Select>
                    {frequency === 'custom' &&
                        <RangePicker value={selectedDate} onChange={(v) => setSelectedDate(v)} format={'DD-MM-YYYY'} />
                    }
                </div>

                <div>
                    <h6>Select Type</h6>
                    <Select value={type} onChange={(v) => setType(v)} >
                        <Select.Option value="0"> All </Select.Option>
                        <Select.Option value="1"> Type A </Select.Option>
                        <Select.Option value="2"> Type B </Select.Option>
                    </Select>
                </div>

                <div className='switch-icons'>
                    <UnorderedListOutlined
                        className={`ant-icon mx-2 ${viewData === 'table' ? 'active-icons' : 'inactive-icons'}`}
                        onClick={() => setViewData('table')} />
                    <AreaChartOutlined
                        className={`ant-icon mx-2 ${viewData === 'analytics' ? 'active-icons' : 'inactive-icons'}`}
                        onClick={() => setViewData('analytics')} />
                </div>

                <div>
                    <button className='btn btn-primary' onClick={() => setShowModal(true)} >Add New</button>
                </div>
            </div>

            <div className="content">
                {viewData === 'table' ?
                    <Table columns={columns} dataSource={allExpenses} >
                    </Table>
                    : <Analytics allExpenses={allExpenses} />
                }
            </div>
            <Modal
                title={editable ? 'Edit Expense' : 'Add Expense'}
                open={showModal} onCancel={() => setShowModal(false)}
                footer={false}   >

                <Form layout='vertical' onFinish={handleSubmit} initialValues={editable}>
                    <Form.Item label="Amount" name="amount">
                        <Input type="number" />
                    </Form.Item>
                    <Form.Item label="Type" name="type">
                        <Select>
                            <Select.Option value="1"> Type A </Select.Option>
                            <Select.Option value="2"> Type B </Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item label="Reference" name="reference">
                        <Input type="text" />
                    </Form.Item>
                    <Form.Item label="Description" name="description">
                        <Input type="text" />
                    </Form.Item>
                    <Form.Item label="Date" name="date">
                        <Input type="date" />
                    </Form.Item>

                    <div className="d-flex justify-content-end">
                        <button className='btn btn-primary' type='submit'>
                            SAVE
                        </button>
                    </div>
                </Form>

            </Modal>
        </Layout>
    )
}

export default HomePage;