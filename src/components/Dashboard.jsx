import { useEffect, useState } from 'react';
import { Card, Table, Select, Row, Col, Progress, Statistic, Segmented, Button, Space, Badge, Tag } from 'antd';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { useSearchParams } from "react-router-dom";


const Dashboard = () => {
  const [summary, setSummary] = useState({});
  const [incomeData, setIncomeData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const [selectedType, setSelectedType] = useState('Income');
  const [selectedMonth, setSelectedMonth] = useState(dayjs().month() + 1);
  const [selectedYear, setSelectedYear] = useState(dayjs().year());
  const [searchParams] = useSearchParams();

  const [topIncome, setTopIncome] = useState([]);
  const [topExpense, setTopExpense] = useState([]);

  const [notifications, setNotifications] = useState({ duePayments: [], unpaidStudents: [], unpaidDonors: [], unpaidStaff: [] });

  const pieColors = ['#00C49F', '#FF8042', '#0088FE', '#FFBB28', '#FF6666'];

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) setSelectedType(tab);
  }, [searchParams]);

  const fetchDashboardData = async () => {
    const API = import.meta.env.VITE_API_BASE_URL;

    const selectedEntity = JSON.parse(localStorage.getItem("selectedEntity") || "null");

    let url = `${API}/transactions/dashboard-summary?month=${selectedMonth}&year=${selectedYear}`;
    if (selectedEntity) {
      url += `&entity=${selectedEntity.EntityId}`;
    }

    const { data } = await axios.get(url, {
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
      setNotifications(data.data.notifications || {});

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

          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: 4,
              gap: "12px", // spacing between items
            }}
          >
            <div style={{ minWidth: 120, fontWeight: "bold" }}>
              {item.name}
            </div>
            <div style={{ minWidth: 100, textAlign: "left", color: selectedType === 'Income' ? 'green' : '#f3491af7' }}>
              {item.amount.toLocaleString()} Rs
            </div>
            <div style={{ minWidth: 50, color: "gray" }}>{percent}%</div>
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
              options={[
                { label: 'All', value: 0 }, // <-- Add this first
                ...Array.from({ length: 12 }, (_, i) => ({
                  label: dayjs().month(i).format('MMMM'),
                  value: i + 1,
                })),
              ]}
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

        <Col>
          <Segmented
            options={[
              { label: "Income", value: "Income" },
              { label: "Expense", value: "Expense" },
              { label: "Notifications", value: "Notifications" }
            ]}
            value={selectedType}
            onChange={setSelectedType}
            size="middle"
            className="themed-segmented"
          />
        </Col>


      </Row>

      {selectedType !== "Notifications" && (
        <>
          {/* Summary Cards */}
          <Row gutter={16} style={{ marginBottom: 24 }} align="stretch">
            <Col span={8}>
              <Card
                style={{
                  height: '100%',
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #e6f7e6, #ffffff)',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                }}
              >
                <Statistic
                  title="🟢 Total Income"
                  value={summary.incomeTotal}
                  valueStyle={{ color: 'green', fontWeight: 600 }}
                />
              </Card>
            </Col>

            <Col span={8}>
              <Card
                style={{
                  height: '100%',
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #fff0f0, #ffffff)',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                }}
              >
                <Statistic
                  title="🔴 Total Expense"
                  value={summary.expenseTotal}
                  valueStyle={{ color: '#f3491af7', fontWeight: 600 }}
                />
              </Card>
            </Col>

            <Col span={8}>
              <Card
                style={{
                  height: '100%',
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #f0f7ff, #ffffff)',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                }}
              >
                <Statistic
                  title="🔵 Balance"
                  value={summary.balance}
                  valueStyle={{
                    color: summary.balance >= 0 ? '#1a71f3f7' : '#f3491af7',
                    fontWeight: 600,
                  }}
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
          {/* Top Transactions */}
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
                          maxWidth: 200,
                          whiteSpace: 'normal',
                          wordBreak: 'break-word',
                          textAlign: 'center',
                        },
                      }),
                      render: (txt) => (
                        <Tag
                          color={selectedType === 'Income' ? 'green' : 'orange'}
                          style={{ padding: "5px", fontSize: 14 }}
                        >
                          {txt}
                        </Tag>
                      ),
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

                        <Tag
                          color={selectedType === 'Income' ? 'green' : 'orange'}
                          style={{ fontWeight: 500, fontSize: 14, color: "#f3491af7'" }}
                        >
                          {amt.toLocaleString()} Rs
                        </Tag>
                      ),
                    },
                    {
                      title: 'Category',
                      dataIndex: 'category',
                      key: 'category',
                      align: 'center',
                      responsive: ['md'],
                      render: (cat) => cat?.name || '',
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
                          maxWidth: 200,
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
        </>
      )
      }

      {selectedType === "Notifications" && (
        <Row gutter={16} style={{ marginTop: 24 }}>
          {notifications.duePayments && notifications.duePayments.length > 0 &&
            <Col span={24}>
              <Card
                title={
                  <div className="d-flex justify-content-between align-items-center">
                    <span>Due Payments</span>
                    <Badge count={notifications.duePayments.length} color="orange" />
                  </div>
                }>
                <Table
                  dataSource={notifications.duePayments}
                  rowKey="_id"
                  pagination={false}
                  columns={[
                    { title: "Category", dataIndex: ["category", "name"], align: "center" },
                    { title: "Amount", dataIndex: "amount", align: "center" },
                    { title: "Due Date", dataIndex: "date", render: d => dayjs(d).format("DD MMM YYYY"), align: "center" },
                    { title: "Description", dataIndex: "description", align: "center", }, // responsive: ["md"],

                  ]}
                />
              </Card>
            </Col>
          }

          {notifications.unpaidDonors && notifications.unpaidDonors.length > 0 &&
            <Col span={24} style={{ marginTop: 16 }}>
              <Card
                title={
                  <div className="d-flex justify-content-between align-items-center">
                    <span>Unpaid Donors</span>
                    <Badge count={notifications.unpaidDonors.length} color="orange" />
                  </div>
                }
              >
                <Table
                  dataSource={notifications.unpaidDonors}
                  rowKey="_id"
                  pagination={false}
                  columns={[
                    { title: "Donor", dataIndex: "name", align: "center" },
                    { title: "Commitment", dataIndex: "monthlyCommitment", align: "center" },
                    { title: "Date", dataIndex: "date", align: "center" },
                    { title: "Contact", dataIndex: "contact", align: "center" },
                    {
                      title: "Address",
                      dataIndex: "address",
                      align: "center",
                      responsive: ["md"],
                    },
                  ]}
                />
              </Card>
            </Col>
          }
          {notifications.unpaidStudents && notifications.unpaidStudents.length > 0 &&
            <Col span={24} style={{ marginTop: 16 }}>
              <Card title={
                <div className="d-flex justify-content-between align-items-center">
                  <span>Unpaid Student Fees</span>
                  <Badge count={notifications.unpaidStudents.length} color="orange" />
                </div>
              }>

                <Table
                  dataSource={notifications.unpaidStudents}
                  rowKey="_id"
                  pagination={false}
                  columns={[
                    { title: "Student", dataIndex: "name", align: "center" },
                    { title: "Father Name", dataIndex: "fatherName", align: "center", responsive: ["md"], },
                    { title: "Contact", dataIndex: "contact", align: "center" },
                    { title: "Monthly Fee", dataIndex: "monthlyFee", align: "center" },
                  ]}
                />
              </Card>
            </Col>
          }
          {notifications.unpaidStaff && notifications.unpaidStaff.length > 0 &&
            <Col span={24} style={{ marginTop: 16 }}>
              <Card title={
                <div className="d-flex justify-content-between align-items-center">
                  <span>Unpaid Staff Salaries</span>
                  <Badge count={notifications.unpaidStaff.length} color="orange" />
                </div>
              }>
                <Table
                  dataSource={notifications.unpaidStaff}
                  rowKey="_id"
                  pagination={false}
                  columns={[
                    { title: "Name", dataIndex: "name", align: "center" },
                    { title: "Designation", dataIndex: "designation", align: "center", responsive: ["md"] },
                    { title: "Contact", dataIndex: "contact", align: "center" },
                    { title: "Monthly Salary", dataIndex: "monthlySalary", align: "center" },
                  ]}
                />
              </Card>
            </Col>
          }

        </Row>
      )}


    </div>
  );
};

export default Dashboard;
