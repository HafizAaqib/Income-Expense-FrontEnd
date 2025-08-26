import { useEffect, useState } from 'react';
import { Card, Table, Select, Row, Col, Progress, Statistic, Segmented, Button, Space } from 'antd';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const Dashboard = () => {
  const [summary, setSummary] = useState({});
  const [incomeData, setIncomeData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const [selectedType, setSelectedType] = useState('Income');
  const [selectedMonth, setSelectedMonth] = useState(dayjs().month() + 1);
  const [selectedYear, setSelectedYear] = useState(dayjs().year());

  const [topIncome, setTopIncome] = useState([]);
  const [topExpense, setTopExpense] = useState([]);


  const pieColors = ['#00C49F', '#FF8042', '#0088FE', '#FFBB28', '#FF6666'];

  const fetchDashboardData = async () => {
    const API = import.meta.env.VITE_API_BASE_URL;

    const { data } = await axios.get(`${API}/transactions/dashboard-summary?month=${selectedMonth}&year=${selectedYear}`, {
      headers: {
        "X-Client": window.location.hostname.split(".")[0],
      },
    });
    if (data.success) {
      setSummary(data.data.summary);
      setIncomeData(data.data.incomeByCategory);
      setExpenseData(data.data.expenseByCategory);

      setTopIncome(data.data.topIncome || []);
      setTopExpense(data.data.topExpense || []);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedMonth, selectedYear]);

  const changeMonth = (direction) => {
    let newMonth = selectedMonth + direction;
    let newYear = selectedYear;

    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    } else if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }

    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  const renderBars = (data) => {
    const total = data.reduce((sum, item) => sum + item.amount, 0);
    return data.map((item, idx) => {
      const percent = ((item.amount / total) * 100).toFixed(1);
      return (
        <div key={idx} style={{ marginBottom: 8 }}>
          <div style={{ marginBottom: 4 }}>
            <strong>{item.name}</strong> — {item.amount.toLocaleString()} PKR ({percent}%)
          </div>
          <Progress percent={parseFloat(percent)} strokeColor={pieColors[idx % pieColors.length]} showInfo={false} />
        </div>
      );
    });
  };

  const pieData = (selectedType === 'Income' ? incomeData : expenseData).map(item => ({
    name: item.name,
    value: item.amount
  }));

  return (
    <div>
      {/* Filters Section */}
      <Row justify="space-between" align="middle" style={{
        marginBottom: 24, display: 'flex',
        'align-items': 'center', 'justify-content': 'space-around'
      }}>

        <Col>
          <Space size="small">
            <Button shape="circle" icon={<LeftOutlined />} size="large" onClick={() => changeMonth(-1)} />
            <Select
              value={selectedMonth}
              onChange={setSelectedMonth}
              options={Array.from({ length: 12 }, (_, i) => ({
                label: dayjs().month(i).format('MMMM'),
                value: i + 1
              }))}
              size="large"
              style={{ minWidth: 150 }}
            />
            <Select
              value={selectedYear}
              onChange={setSelectedYear}
              options={[2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035].map(y => ({ label: y, value: y }))}
              size="large"
            />
            <Button shape="circle" icon={<RightOutlined />} size="large" onClick={() => changeMonth(1)} />
          </Space>
        </Col>

        <Col >
          <Segmented
            options={['Income', 'Expense']}
            value={selectedType}
            onChange={setSelectedType}
            size="mediam"
            style={{
              fontWeight: 'normal', padding: '6px 12px', margin: '6px 12px',
              background: 'linear-gradient(to bottom right, #029bd2, #20c997 )'
            }}
          />
        </Col>
      </Row>

      {/* Summary Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }} align="stretch">
        <Col span={8}>
          <Card style={{ height: '100%' }}>
            <Statistic
              title="🟢 Total Income"
              value={summary.incomeTotal}
              valueStyle={{ color: 'green' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ height: '100%' }}>
            <Statistic
              title="🔴 Total Expense"
              value={summary.expenseTotal}
              valueStyle={{ color: 'red' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ height: '100%' }}>
            <Statistic
              title="🔵 Balance"
              value={summary.balance}
              valueStyle={{ color: summary.balance >= 0 ? 'blue' : 'orange' }}
            />
          </Card>
        </Col>
      </Row>


      {/* Charts */}
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Card title={`Pie Chart (${selectedType})`}>
            <PieChart width={300} height={300}>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                label
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title={`Category-wise (${selectedType})`}>
            {renderBars(selectedType === 'Income' ? incomeData : expenseData)}
          </Card>
        </Col>
      </Row>
      {/* Top 5 Transactions */}
      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card
            title={`Top ${selectedType === 'Income' ? 'Donations / Income' : 'Expenses'} (${dayjs().month(selectedMonth - 1).format('MMMM')} ${selectedYear})`}
          >
            <Table
              dataSource={selectedType === 'Income' ? topIncome : topExpense}
              rowKey={(record, idx) => record.receiptNumber || idx}
              pagination={false}
              size="small"
              columns={[
                {
                  title: 'Receipt #',
                  dataIndex: 'receiptNumber',
                  key: 'receiptNumber',
                  align: 'center',
                  responsive: ['md'], // only show on medium and up
                },
                {
                  title: selectedType === 'Income' ? 'Donor Name' : 'Name',
                  dataIndex: 'reference',
                  key: 'reference',
                  align: 'center',
                  onCell: () => ({
                    style: {
                      whiteSpace: 'normal',
                      wordBreak: 'break-word',
                      textAlign: 'center',
                    },
                  }),
                },
                {
                  title: 'Phone #',
                  dataIndex: 'phoneNumber',
                  key: 'phoneNumber',
                  align: 'center',
                  responsive: ['md'],
                },
                {
                  title: 'Amount',
                  dataIndex: 'amount',
                  align: 'center',
                  key: 'amount',
                  render: (amt) => (
                    <span style={{ color: selectedType === 'Income' ? 'green' : 'orange' }}>
                      {amt.toLocaleString()} PKR
                    </span>
                  ),
                },
                {
                  title: 'Category',
                  dataIndex: 'category',
                  key: 'category',
                  align: 'center',
                  responsive: ['md'],
                },
                {
                  title: 'Date',
                  dataIndex: 'date',
                  align: 'center',
                  key: 'date',
                  render: (d) => dayjs(d).format('DD MMM YYYY'),
                },
                {
                  title: 'Description',
                  dataIndex: 'description',
                  key: 'description',
                  responsive: ['md'],
                  align: 'center',
                  onCell: () => ({
                    style: {
                      maxWidth: 200,        // <-- set your preferred width
                      whiteSpace: 'normal', // allow wrapping
                      wordBreak: 'break-word',
                      textAlign: 'center',
                    },
                  }),
                }

              ]}
            />
          </Card>
        </Col>
      </Row>



    </div>
  );
};

export default Dashboard;
