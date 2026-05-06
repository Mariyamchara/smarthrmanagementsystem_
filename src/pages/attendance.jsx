import React, { useState } from "react";
import { getAttendanceData } from "../lib/attendanceData";

export default function Attendance() {
  const [data] = useState(() => getAttendanceData());
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  const presentCount = data.filter((r) => r.status === "Present").length;
  const absentCount = data.filter((r) => r.status === "Absent").length;
  const lateCount = data.filter((r) => r.status === "Late").length;
  const overtimeTotal = data.reduce((sum, r) => sum + (parseFloat(r.overtime) || 0), 0);

  const filtered = data.filter((r) => {
    const matchSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.employeeId.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "All" || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const statusStyle = (status) => {
    if (status === "Present") return { backgroundColor: "#16a34a" };
    if (status === "Absent") return { backgroundColor: "#dc2626" };
    if (status === "On Leave") return { backgroundColor: "#f59e0b" };
    if (status === "Late") return { backgroundColor: "#3f3d9c" };
    return {};
  };

  const cards = [
    { label: "Present Days", value: presentCount, color: "#16a34a" },
    { label: "Absent Days", value: absentCount, color: "#dc2626" },
    { label: "Late Entries", value: lateCount, color: "#3f3d9c" },
    { label: "Overtime Hours", value: `${overtimeTotal}h`, color: "#3f3d9c" },
  ];

  return (
    <div style={{ backgroundColor: "#f3f4f6", minHeight: "100vh", padding: "30px" }}>
      <div style={{ background: "#2e2c7a", color: "white", textAlign: "center", padding: "25px", borderRadius: "8px 8px 0 0" }}>
        <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "bold" }}>Employee Attendance Report</h1>
        <p style={{ marginTop: "10px", fontSize: "18px" }}>Daily Attendance Summary</p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", padding: "20px 0 10px" }}>
        {cards.map((card) => (
          <div
            key={card.label}
            onClick={() => setFilterStatus(
              card.label === "Overtime Hours" ? "All"
              : card.label.replace(" Days", "").replace(" Entries", "").replace(" Hours", "")
            )}
            style={{ background: "white", borderRadius: "12px", padding: "20px", boxShadow: "0 4px 12px rgba(0,0,0,0.07)", borderLeft: `4px solid ${card.color}`, cursor: "pointer" }}
          >
            <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>{card.label}</p>
            <p style={{ margin: "8px 0 0", fontSize: "32px", fontWeight: 700, color: card.color }}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div style={{ background: "white", padding: "16px 20px", display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Search by name or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: "8px 14px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px", width: "260px" }}
        />
        <div style={{ display: "flex", gap: "8px" }}>
          {["All", "Present", "Absent", "Late", "On Leave"].map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)}
              style={{ padding: "6px 14px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 600,
                background: filterStatus === s ? "#2e2c7a" : "#f3f4f6",
                color: filterStatus === s ? "white" : "#374151" }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "white", borderRadius: "0 0 8px 8px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)", overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ backgroundColor: "#9ca3af", color: "white" }}>
            <tr>
              {["Emp ID", "Name", "Date", "Login Time", "Logout Time", "Department", "Overtime", "Status"].map((h) => (
                <th key={h} style={{ padding: "15px", textAlign: "center", fontWeight: "600" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: "center", padding: "20px", color: "#6b7280" }}>No records found</td></tr>
            ) : (
              filtered.map((emp, index) => (
                <tr key={index} style={{ borderTop: "1px solid #e5e7eb" }}>
                  <td style={{ padding: "15px", textAlign: "center" }}>{emp.employeeId}</td>
                  <td style={{ padding: "15px", textAlign: "center" }}>{emp.name}</td>
                  <td style={{ padding: "15px", textAlign: "center" }}>{emp.date}</td>
                  <td style={{ padding: "15px", textAlign: "center" }}>{emp.inTime}</td>
                  <td style={{ padding: "15px", textAlign: "center" }}>{emp.outTime}</td>
                  <td style={{ padding: "15px", textAlign: "center" }}>{emp.department}</td>
                  <td style={{ padding: "15px", textAlign: "center" }}>{emp.overtime}h</td>
                  <td style={{ padding: "15px", textAlign: "center" }}>
                    <span style={{ padding: "6px 14px", borderRadius: "6px", color: "white", fontWeight: "bold", display: "inline-block", ...statusStyle(emp.status) }}>
                      {emp.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
