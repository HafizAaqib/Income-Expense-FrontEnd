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

const StaffSalaries = () => {
  const [month, setMonth] = useState(dayjs().startOf("month"));
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(false);
  const [paid, setPaid] = useState([]);
  const [unpaid, setUnpaid] = useState([]);

  const [categories, setCategories] = useState([]); // expense categories for salaries
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payingStaff, setPayingStaff] = useState(null);
  const [payForm] = Form.useForm();

  const [messageApi, msgContextHolder] = message.useMessage();

  const selectedEntity = JSON.parse(localStorage.getItem("selectedEntity") || "null");
  const savedUser = JSON.parse(localStorage.getItem("user") || "null");
  const isAdmin = savedUser?.isAdmin;
  const canAddData = savedUser?.canAddData;

  const API = import.meta.env.VITE_API_BASE_URL;
  const clientHeader = { "X-Client": window.location.hostname.split(".")[0] };

  // Fetch expense categories
  const getExpenseCategories = async () => {
    try {
      let url = `${API}/categories?type=expense`;
      if (selectedEntity) url += `&entity=${selectedEntity.EntityId}`;
      const res = await axios.get(url, { headers: clientHeader });
      setCategories(res.data.categories || []);
    } catch {
      messageApi.error("Failed to load categories");
    }
  };

  const fetchSalaries = async () => {
    if (!month) return;
    setLoading(true);
    try {
      let url = `${API}/staff-salaries?month=${dayjs(month).format("MMM YYYY")}`;
      if (selectedEntity) url += `&entity=${selectedEntity.EntityId}`;
      if (statusFilter && statusFilter !== "all") url += `&status=${statusFilter}`;

      const res = await axios.get(url, { headers: clientHeader });
      setPaid(res.data.paid || []);
      setUnpaid(res.data.unpaid || []);
    } catch {
      messageApi.error("Failed to fetch salaries");
    }
    setLoading(false);
  };

  useEffect(() => {
    getExpenseCategories();
  }, []);

  useEffect(() => {
    fetchSalaries();
  }, [month, statusFilter]);

  // Client search
  const filteredPaid = useMemo(() => {
    if (!search) return paid;
    return paid.filter(p =>
      (p.staff?.name || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [paid, search]);

  const filteredUnpaid = useMemo(() => {
    if (!search) return unpaid;
    return unpaid.filter(s =>
      (s.name || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [unpaid, search]);

  // Pay modal
  const openPayModal = (staff) => {
    setPayingStaff(staff);
    payForm.setFieldsValue({
      category: undefined,
      amount: staff?.salary || 0,
      paymentDate: dayjs(),
      remarks: `Salary Payment for ${staff?.name}`, // - ${dayjs(month).format("MMM YYYY")}`,
    });
    setIsPayModalOpen(true);
  };

const handlePay = async () => {
  try {
    const values = await payForm.validateFields();
    const payload = {
      staffId: payingStaff._id,
      // send YYYY-MM format (controller will normalize to Date)
      month: dayjs(month).format("YYYY-MM"),
      category: values.category,
      amount: Number(values.amount),
      paymentDate: values.paymentDate?.toISOString(),
      remarks: values.remarks,
      user: savedUser._id,
    };

    await axios.post(`${API}/staff-salaries/pay`, payload, { headers: clientHeader });
    messageApi.success("Salary paid successfully");

    setIsPayModalOpen(false);
    setPayingStaff(null);
    payForm.resetFields();
    fetchSalaries();
  } catch (err) {
    messageApi.error(err?.response?.data?.message || "Payment failed");
  }
};


  // Columns
  const unpaidColumns = [
    { title: "Name", dataIndex: "name", align: "center" },
    { title: "Designation", dataIndex: "designation", align: "center", responsive: ["md"] },
    { title: "Salary", dataIndex: "salary", align: "center", render: (s) => `${s} Rs` },
    {
      title: "Actions",
      align: "center",
      render: (staff) =>
        (isAdmin || canAddData) && (
          <Button
            type="link"
            onClick={() => openPayModal(staff)}
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

  const paidColumns = [
    { title: "Name", dataIndex: ["staff", "name"], align: "center" },
    { title: "Designation", dataIndex: ["staff", "designation"], align: "center", responsive: ["md"] },
    { title: "Amount", dataIndex: "amount", align: "center", render: (v) => `${v} Rs` },
    { title: "Receipt #", dataIndex: "receiptNumber", align: "center" },
    { title: "Paid Date", dataIndex: "paidDate", align: "center", render: (d) => (d ? dayjs(d).format("DD MMM YYYY") : "") },
    { title: "Remarks", dataIndex: "remarks", align: "center", responsive: ["md"] },
  ];

  return (
    <>
      {msgContextHolder}
      <div className="container mt-4">
        <div className="row align-items-center mb-3 g-2">
          <div className="col-12 col-md-6">
            <h4 className="m-0 mb-2 mb-md-0">Staff Salaries</h4>
          </div>

          <div className="col-12 col-md-6">
            <div className="row g-2 justify-content-md-end">
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

              <div className="col-6 col-md-3">
                <Select value={statusFilter} onChange={setStatusFilter} style={{ width: "100%" }}>
                  {statusFilterOptions.map((o) => (
                    <Option key={o.value} value={o.value}>
                      {o.label}
                    </Option>
                  ))}
                </Select>
              </div>

              <div className="col-12 col-md-3">
                <Input
                  placeholder="Search staff..."
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
          {statusFilter !== "paid" && (
            <div className={`col-12 ${statusFilter === "all" ? "col-lg-4" : "col-lg-12"}`}>
              <Card
                title={
                  <div className="d-flex justify-content-between align-items-center">
                    <span>Unpaid</span>
                    <Badge count={filteredUnpaid.length} color="orange" />
                  </div>
                }
                size="small"
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
          )}

          {statusFilter !== "unpaid" && (
            <div className={`col-12 ${statusFilter === "all" ? "col-lg-8" : "col-lg-12"}`}>
              <Card
                title={
                  <div className="d-flex justify-content-between align-items-center">
                    <span>Paid</span>
                    <Badge count={filteredPaid.length} color="green" />
                  </div>
                }
                size="small"
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
          )}
        </div>
      </div>

      {/* Pay Modal */}
      <Modal
        title={payingStaff ? `Pay Salary — ${payingStaff.name}` : "Pay Salary"}
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
            <Select placeholder="Select Expense Category">
              {categories.filter((c) => c.status === 1).map((c) => (
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
            name="paymentDate"
            label="Payment Date"
            rules={[{ required: true, message: "Payment Date is required" }]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item name="remarks" label="Remarks">
            <Input.TextArea rows={3} placeholder="Optional note" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default StaffSalaries;