// src/pages/Receipt.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import dayjs from "dayjs";
import "./login.css"; // reuse login page background & styling
import "./Receipt.css"; // reuse login page background & styling
import Spinner from "../components/Spinner";
import { CONFIG } from "./clientConfig";

const Receipt = () => {
    const { id } = useParams(); // receipt id from URL
    const [loading, setLoading] = useState(true);
    const [transaction, setTransaction] = useState(null);

    useEffect(() => {
        const fetchReceipt = async () => {
            try {
                setLoading(true);
                const API = import.meta.env.VITE_API_BASE_URL;
                const { data } = await axios.get(`${API}/transactions/${id}`, {
                    headers: {
                        "X-Client": window.location.hostname.split(".")[0],
                    },
                });
                setTransaction(data.transaction);
            } catch (error) {
                console.error("Error fetching receipt:", error.response?.data || error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchReceipt();
    }, [id]);

    if (loading) {
        return (
            <div className="login-wrapper d-flex align-items-center justify-content-center">
                <Spinner />
            </div>
        );
    }

    if (!transaction) {
        return (
            <div className="login-wrapper d-flex align-items-center justify-content-center">
                <div className="login-box shadow p-4 rounded bg-white text-center">
                    <h4 className="text-danger">Receipt not found</h4>
                </div>
            </div>
        );
    }

    const {
        amount,
        receiptNumber,
        category,
        user,
        reference,
        description,
        date,
        trxnType,
    } = transaction;

    console.log('CONFIG.Entities', CONFIG.Entities);
    console.log('transaction.category', transaction.category)
    let categoryEntity = transaction?.category?.entity;
    console.log('categoryEntity', categoryEntity)
    if (categoryEntity === undefined || categoryEntity === null)
        categoryEntity = 1;
    const selectedEntity = CONFIG.Entities?.find(
        x => Number(x.EntityId) === categoryEntity
    ) || null;
    console.log('selectedEntity', selectedEntity)

    return (
        <div className="login-wrapper d-flex align-items-center justify-content-center receiptDiv">
            <div
                className="login-box shadow p-4 rounded bg-white"
                style={{
                    maxWidth: 600,
                    backgroundColor: "#fdf8f2",
                    border: "2px solid #165c2f",
                    borderRadius: "8px"
                }}
            >
                {/* Header */}
                <div
                    style={{
                        textAlign: "center",
                        background: "linear-gradient(to bottom right, #029bd2, #20c997)",
                        color: "white",
                        padding: "12px",
                        borderRadius: "6px",
                        marginBottom: "15px",
                        paddingBottom: "15px",
                    }}
                >
                    <div style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "10px" }}>
                        {CONFIG.Header_FullName || selectedEntity?.Header_FullName || ""}
                    </div>
                    <div style={{ fontSize: "11px" , lineHeight:"Normal"}}>{CONFIG.Header_Address || selectedEntity?.Header_Address || ""}</div>
                </div>

                {/* Receipt Details */}
                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "10px",
                        marginBottom: "15px",
                        fontSize: "13px",
                        padding: "5px",
                    }}
                >
                    <div style={{ flex: 1, minWidth: 200 }}>
                        <strong className="label">رسید نمبر &nbsp;&nbsp;&nbsp;:</strong> {receiptNumber}
                    </div>
                    <div style={{ flex: 1, minWidth: 200 }}>
                        <strong  className="label">تاریخ &nbsp;&nbsp;&nbsp;:</strong> {dayjs(date).format("YYYY-MM-DD")}
                    </div>
                    {trxnType !== "asset" && (
                        <div style={{ flex: 1, minWidth: 200 }}>
                            <strong className="label">رقم &nbsp;&nbsp;&nbsp;:</strong> {amount} روپے
                        </div>
                    )}
                    <div style={{ flex: 1, minWidth: 200 }}>
                        <strong  className="label">{trxnType === "asset" ? "ہدیہ" : "مد"} &nbsp;&nbsp;&nbsp;:</strong>{" "}
                        {category?.name}
                    </div>
                    <div style={{ flex: 1, minWidth: 200 }}>
                        <strong className="label">نام &nbsp;&nbsp;&nbsp;:</strong> {reference}
                    </div>
                    <div style={{ flex: 1, minWidth: 200 }}>
                        <strong className="label">تفصیل &nbsp;&nbsp;&nbsp;:</strong> {description}
                    </div>
                </div>

                {/* Note */}
                {trxnType !== "asset" && (
                    <div
                        style={{
                            border: "1px dashed #165c2f",
                            padding: "10px",
                            borderRadius: "4px",
                            fontSize: "12px",
                            marginBottom: "10px",
                            backgroundColor: "#f5fbf7",
                        }}
                    >
                        <p style={{ textAlign: "center", fontWeight: "bold" }}>نوٹ</p>
                        <div style={{ textAlign: "center" , lineHeight:"Normal" }}>
                            {CONFIG.PrintNotes || selectedEntity?.PrintNotes || ""}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div style={{ textAlign: "center", fontSize: "12px" }}>
                    <p style={{ fontWeight: "bold" , lineHeight:"Normal" }}>
                        {trxnType === "asset" ? "" : "مزید "} معلومات یا شرعی رہنمائی کے لیے:
                    </p>
                    <div
                        dangerouslySetInnerHTML={{ __html: CONFIG.Footer_Names || "" }}
                    />                    <div style={{ marginTop: "10px", borderTop: "1px dashed #165c2f", paddingTop: "5px" }}>
                        <span>Generated By : </span> {user?.name}
                    </div>
                </div>

                {/* QR Code placeholder */}
                {/* <div style={{ textAlign: "center", marginTop: "15px" }}>
          <div
            style={{
              width: "100px",
              height: "100px",
              border: "1px dashed #aaa",
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#888",
              fontSize: "12px",
            }}
          >
            QR Code
          </div>
        </div> */}
            </div>
        </div>
    );
};

export default Receipt;
