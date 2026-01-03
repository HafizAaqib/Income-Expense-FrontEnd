import { useEffect, useMemo, useState } from "react";
import {
  Table,
  Input,
  Button,
  message,
  Select,
  DatePicker,
  Modal,
  Form,
  Tag,
  Card,
  Badge,
} from "antd";
import axios from "axios";
import dayjs from "dayjs";

const { Option } = Select;

const statusFilterOptions = [
  { value: "all", label: "All" },
  { value: "unpaid", label: "Unpaid Only" },
  { value: "paid", label: "Paid Only" },
];

const MonthlyFees = () => {
  const [month, setMonth] = useState(dayjs().startOf("month")); // default current month
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(false);
  const [paid, setPaid] = useState([]);       // array of fee docs (populated with student & transaction)
  const [unpaid, setUnpaid] = useState([]);   // array of student docs

  const [categories, setCategories] = useState([]); // income categories for fee payments
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payingStudent, setPayingStudent] = useState(null);
  const [payForm] = Form.useForm();

  const [messageApi, msgContextHolder] = message.useMessage();

  const selectedEntity = JSON.parse(localStorage.getItem("selectedEntity") || "null");
  const savedUser = JSON.parse(localStorage.getItem("user") || "null");
  const isAdmin = savedUser?.isAdmin;
  const canAddData = savedUser?.canAddData;
  const canUpdateData = savedUser?.canUpdateData;

  const API = import.meta.env.VITE_API_BASE_URL;
  const clientHeader = { "X-Client": window.location.hostname.split(".")[0] };

  // Fetch income categories (entity-aware)
  const getIncomeCategories = async () => {
    try {
      let url = `${API}/categories?type=income`;
      if (selectedEntity) url += `&entity=${selectedEntity.EntityId}`;
      const res = await axios.get(url, { headers: clientHeader });
      setCategories(res.data.categories || []);
    } catch {
      messageApi.error("Failed to load categories");
    }
  };

  const fetchMonthlyFees = async () => {
    if (!month) return;
    setLoading(true);
    try {
      const m = dayjs(month).format("MMM YYYY");
      let url = `${API}/fees?month=${m}`;
      if (selectedEntity) url += `&entity=${selectedEntity.EntityId}`;
      if (statusFilter && statusFilter !== "all") url += `&status=${statusFilter}`;

      const res = await axios.get(url, { headers: clientHeader });
      setPaid(res.data.paid || []);
      setUnpaid(res.data.unpaid || []);
    } catch {
      messageApi.error("Failed to fetch monthly fees");
    }
    setLoading(false);
  };

  useEffect(() => {
    getIncomeCategories();
  }, []);

  useEffect(() => {
    fetchMonthlyFees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, statusFilter]);

  // Filter search on client (by student name)
  const filteredPaid = useMemo(() => {
    if (!search) return paid;
    return paid.filter(p =>
      (p.student?.name || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [paid, search]);

  const filteredUnpaid = useMemo(() => {
    if (!search) return unpaid;
    return unpaid.filter(s =>
      (s.name || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [unpaid, search]);

  // Open pay modal for a student
  const openPayModal = (student) => {
    setPayingStudent(student);
    payForm.setFieldsValue({
      category: undefined,
      amount: student?.monthlyFee || 0,
      paidBy: student?.fatherName || "",
      phoneNumber: student?.contact || "",
      paymentDate: dayjs(), // default today
      description: `Monthly Fee for ${student?.name}`, // - ${dayjs(month).format("MMM YYYY")}`,
    });
    setIsPayModalOpen(true);
  };

  const handlePay = async () => {
    try {
      const values = await payForm.validateFields();
      const payload = {
        studentId: payingStudent._id,
        month: dayjs(month).format("MMM YYYY"),
        category: values.category,
        amount: Number(values.amount),
        paymentDate: values.paymentDate?.toISOString(),
        paidBy: values.paidBy,
        phoneNumber: values.phoneNumber,
        description: values.description,
        user: JSON.parse(localStorage.getItem('user'))._id
      };

      await axios.post(`${API}/fees/pay`, payload, { headers: clientHeader });
      messageApi.success("Payment recorded successfully");

      setIsPayModalOpen(false);
      setPayingStudent(null);
      payForm.resetFields();
      fetchMonthlyFees();
    } catch (err) {
      messageApi.error(err?.response?.data?.message || "Payment failed");
    }
  };

  // Columns: Unpaid students
  const unpaidColumns = [
    { title: "Student", dataIndex: "name", align: "center" },
    // {
    //   title: "Status",
    //   dataIndex: "status",
    //   align: "center",
    //   render: (st) => <Tag color={st === "active" ? "green" : "orange"}>{st}</Tag>,
    //   responsive: ["md"],
    // },
    {
      title: "Monthly Fee",
      dataIndex: "monthlyFee",
      align: "center",
      render: (v) => Number(v || 0).toLocaleString(),
    },
    ...(statusFilter !== "all"
      ? [
        { title: "Father Name", dataIndex: "fatherName", align: "center", responsive: ["md"], },
        { title: "Contact", dataIndex: "contact", align: "center" },

      ]
      : []),


    {
      title: "Actions",
      align: "center",
      render: (student) =>
        (isAdmin || canAddData) && (
          <Button
            type="link"
            onClick={() => openPayModal(student)}
            style={{
              background: "linear-gradient(to bottom right, #029bd2, #20c997)",
              color: "#fff",
              borderColor: "#20c997",
            }}
          >
            Pay
          </Button>
        ),
    },
  ];

  // Columns: Paid fees (fee documents)
  const paidColumns = [
    {
      title: "Student",
      dataIndex: ["student", "name"],
      align: "center",
    },
    {
      title: "Amount",
      dataIndex: "amount",
      align: "center",
      render: (v) => Number(v || 0).toLocaleString(),
    },
    {
      title: "Receipt #",
      dataIndex: "receiptNumber",
      align: "center",
    },
    {
      title: "Payment Date",
      dataIndex: "datePaid",
      align: "center",
      render: (d) => (d ? dayjs(d).format("DD MMM YYYY") : ""),
      responsive: ['md'],
    },
    // {
    //   title: "Paid By",
    //   dataIndex: ["transaction", "reference"],
    //   align: "center",
    //   responsive: ["md"],
    // },
    // {
    //   title: "Phone",
    //   dataIndex: ["transaction", "phoneNumber"],
    //   align: "center",
    //   responsive: ["lg"],
    // },
    {
      title: "Description",
      dataIndex: "description",
      align: "center",
      //responsive: ["lg"],
      render: (txt, record) => txt || record?.transaction?.description || "",
      responsive: ['md'],
    },
  ];

  return (
    <>
      {msgContextHolder}
      <div className="container mt-4">
        <div className="row align-items-center mb-3 g-2">
          {/* Header */}
          <div className="col-12 col-md-6">
            <h4 className="m-0 mb-2 mb-md-0">Monthly Fees</h4>
          </div>

          {/* Filters */}
          <div className="col-12 col-md-6">
            <div className="row g-2 justify-content-md-end">
              {/* Month */}
              <div className="col-6 col-md-3">
                <DatePicker
                  picker="month"
                  value={month}
                  onChange={(v) => setMonth(v || dayjs().startOf("month"))}
                  allowClear={false}
                  style={{ width: "100%" }}
                  format="MMM - YYYY"
                />
              </div>

              {/* Status */}
              <div className="col-6 col-md-3">
                <Select
                  value={statusFilter}
                  onChange={setStatusFilter}
                  style={{ width: "100%" }}
                >
                  {statusFilterOptions.map((o) => (
                    <Option key={o.value} value={o.value}>
                      {o.label}
                    </Option>
                  ))}
                </Select>
              </div>

              {/* Search */}
              <div className="col-12 col-md-3">
                <Input
                  placeholder="Search student..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  allowClear
                  style={{ width: "100%" }}
                />
              </div>
            </div>
          </div>
        </div>


        <div className="row g-3">
          {statusFilter !== 'paid' && <div className={`col-12 ${statusFilter === "all" ? "col-lg-4" : "col-lg-12"}`}>
            <Card
              title={
                <div className="d-flex justify-content-between align-items-center">
                  <span>Unpaid</span>
                  <Badge count={filteredUnpaid.length} color="orange" />
                </div>
              }
              size="small"
              bordered
            >
              <Table
                dataSource={filteredUnpaid}
                columns={unpaidColumns}
                rowKey="_id"
                loading={loading}
                pagination={{ pageSize: 7 }}
              />
            </Card>
          </div>
          }
          {statusFilter !== 'unpaid' && <div className={`col-12 ${statusFilter === "all" ? "col-lg-8" : "col-lg-12"}`}>
            <Card
              title={
                <div className="d-flex justify-content-between align-items-center">
                  <span>Paid</span>
                  <Badge count={filteredPaid.length} color="green" />
                </div>
              }
              size="small"
              bordered
            >
              <Table
                dataSource={filteredPaid}
                columns={paidColumns}
                rowKey="_id"
                loading={loading}
                pagination={{ pageSize: 7 }}
              />
            </Card>
          </div>
          }
        </div>
      </div>

      {/* Pay Modal */}
      <Modal
        title={payingStudent ? `Pay Fee — ${payingStudent.name}` : "Pay Fee"}
        open={isPayModalOpen}
        onCancel={() => setIsPayModalOpen(false)}
        onOk={handlePay}
        okText="Confirm Payment"
      >
        <Form
          form={payForm}
          layout="horizontal"
          labelCol={{ span: 7 }}
          wrapperCol={{ span: 17 }}
          style={{ maxWidth: "100%" }}
        >
          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: "Category is required" }]}
          >
            <Select placeholder="Select Income Category">
              {categories
              .filter(cat => cat.status === 1) // exclude hidden categories
              .map((c) => (
                <Option key={c._id} value={c._id}>
                  {c.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="amount"
            label="Amount"
            rules={[{ required: true, message: "Amount is required" }]}
          >
            <Input type="number" />
          </Form.Item>

          <Form.Item
            name="paidBy"
            label="Paid By"
            rules={[{ required: true, message: "Paid By is required" }]}
          >
            <Input placeholder="Guardian / Payer name" />
          </Form.Item>

          <Form.Item name="phoneNumber" label="Phone">
            <Input placeholder="Optional" />
          </Form.Item>

          <Form.Item
            name="paymentDate"
            label="Payment Date"
            rules={[{ required: true, message: "Payment Date is required" }]}
          >
            <DatePicker style={{ width: "100%" }} format="DD - MMM - YYYY"/>
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Optional note" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default MonthlyFees;
