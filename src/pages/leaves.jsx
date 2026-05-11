import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, CheckCircle, XCircle, Plus, ArrowUpRight } from "lucide-react";
import { getDepartments } from "../lib/departmentsApi";
import { employeesApi } from "../lib/employeesApi";
import { leavesApi } from "../lib/leavesApi";

const leaveTypes = [
  "Annual",
  "Sick",
  "Casual",
  "Maternity",
  "Paternity",
  "Unpaid",
  "Compensatory",
];
const policyItems = [
  { label: "Annual leave", value: "21 days / yr" },
  { label: "Sick leave", value: "12 days / yr" },
  { label: "Casual leave", value: "7 days / yr" },
  { label: "Maternity", value: "90 days" },
  { label: "Paternity", value: "14 days" },
  { label: "Notice period", value: "3 days min" },
  { label: "Carry forward", value: "5 days max" },
];

export default function LeaveManagement() {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [department, setDepartment] = useState("");
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [leaveData, employeeData, departmentData] = await Promise.all([
          leavesApi.getAll(),
          employeesApi.getAll(),
          getDepartments(),
        ]);

        setLeaves(leaveData);
        setEmployees(employeeData);
        setDepartments(departmentData);
        if (departmentData.length > 0) {
          setDepartment(departmentData[0]._id);
        }
      } catch (error) {
        console.error("Failed to load leave data:", error);
      }
    };

    loadData();
  }, []);

  const updateStatus = async (id, status) => {
    const updatedLeave = await leavesApi.updateStatus(id, status);
    setLeaves((prev) =>
      prev.map((leave) => (leave.id === id ? updatedLeave : leave)),
    );
  };

  const filtered = leaves
    .filter((leave) => filter === "All" || leave.status === filter)
    .filter((leave) => leave.name.toLowerCase().includes(search.toLowerCase()));
  const pendingCount = leaves.filter(
    (leave) => leave.status === "Pending",
  ).length;
  const approvedCount = leaves.filter(
    (leave) => leave.status === "Approved",
  ).length;
  const rejectedCount = leaves.filter(
    (leave) => leave.status === "Rejected",
  ).length;
  const activeDepartment = departments.find((item) => item._id === department);
  const selectedDepartmentEmployees = employees.filter(
    (employee) => employee.department === department,
  );
  const approvedLeavesForDepartment = leaves.filter(
    (leave) => leave.department === department && leave.status === "Approved",
  );
  const annualUsed = approvedLeavesForDepartment
    .filter((leave) => leave.type === "Annual")
    .reduce((sum, leave) => sum + leave.days, 0);
  const sickUsed = approvedLeavesForDepartment
    .filter((leave) => leave.type === "Sick")
    .reduce((sum, leave) => sum + leave.days, 0);
  const departmentSummary = {
    annualUsed,
    annualTotal: Math.max(selectedDepartmentEmployees.length * 21, 21),
    sickUsed,
    sickTotal: Math.max(selectedDepartmentEmployees.length * 12, 12),
  };
  const selectedEmployeeBalances = selectedDepartmentEmployees.map(
    (employee) => {
      const employeeLeaves = leaves.filter(
        (leave) =>
          (leave.employeeId
            ? leave.employeeId === employee.employeeId
            : leave.name === employee.name) && leave.status === "Approved",
      );
      const approvedAnnual = employeeLeaves
        .filter((leave) => leave.type === "Annual")
        .reduce((sum, leave) => sum + leave.days, 0);
      const approvedSick = employeeLeaves
        .filter((leave) => leave.type === "Sick")
        .reduce((sum, leave) => sum + leave.days, 0);
      const approvedCasual = employeeLeaves
        .filter((leave) => leave.type === "Casual")
        .reduce((sum, leave) => sum + leave.days, 0);

      return {
        name: employee.name,
        annual: Math.max(0, 21 - approvedAnnual),
        sick: Math.max(0, 12 - approvedSick),
        casual: Math.max(0, 7 - approvedCasual),
      };
    },
  );

  const handleApplyLeave = async (form) => {
    const newLeave = await leavesApi.create({
      employee: form.employee,
      type: form.type,
      from: form.from,
      to: form.to,
      reason: form.reason,
      attachmentName: form.file?.name || "",
    });

    setLeaves((prev) => [newLeave, ...prev]);
    setFilter("All");
    setSearch("");
    setShowForm(false);
  };

  return (
    <div style={{ backgroundColor: "#f3f4f6", minHeight: "100vh" }}>
      {/* Page Header */}
      <div
        style={{
          background: "#3f3d9c",
          color: "white",
          textAlign: "center",
          padding: "25px",
          borderRadius: "8px 8px 0 0",
          margin: "30px 30px 0",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "bold" }}>
          Leave Management
        </h1>
        <p style={{ marginTop: "10px", fontSize: "16px" }}>
          Manage leave requests, balances and policy
        </p>
      </div>

      <div
        style={{
          padding: "20px 30px 30px",
          fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
          color: "#111827",
        }}
      >
        <style>{`
        .leave-card {
          background: #fff;
          border: 1px solid #E5E7EB;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
        }
        .leave-filter {
          border: none;
          background: transparent;
          color: #6B7280;
          padding: 8px 0;
          border-bottom: 2px solid transparent;
          font: inherit;
          cursor: pointer;
        }
        .leave-filter.active {
          color: #3f3d9c;
          border-bottom-color: #3f3d9c;
          font-weight: 600;
        }
        .leave-icon-btn {
          width: 36px;
          height: 36px;
          border: none;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .leave-input,
        .leave-select,
        .leave-textarea {
          width: 100%;
          border: 1px solid #D1D5DB;
          border-radius: 10px;
          padding: 12px;
          font: inherit;
          box-sizing: border-box;
          background: #fff;
        }
        .leave-textarea {
          min-height: 96px;
          resize: vertical;
        }
        .leave-input:focus,
        .leave-select:focus,
        .leave-textarea:focus {
          outline: none;
          border-color: #3f3d9c;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        }
        @media (max-width: 960px) {
          .leave-grid,
          .leave-stats,
          .leave-form-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: 16,
          }}
        >
          <button
            onClick={() => setShowForm(true)}
            style={{
              background: "#3f3d9c",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 16px",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Plus size={16} /> Apply for leave
          </button>
        </div>

        <div
          className="leave-stats"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <Card
            title="Total leave requests"
            value={String(leaves.length)}
            color="#6C63FF"
          />
          <Card
            title="Pending approval"
            value={String(pendingCount)}
            color="#F59E0B"
          />
          <Card
            title="Approved requests"
            value={String(approvedCount)}
            color="#10B981"
          />
          <Card
            title="Rejected requests"
            value={String(rejectedCount)}
            color="#EF4444"
          />
        </div>

        <div
          className="leave-grid"
          style={{ display: "flex", flexDirection: "column", gap: 24 }}
        >
          <div className="leave-card" style={{ padding: 20 }}>
            <div style={{ marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>Leave requests</h3>
              <p style={{ marginTop: 4, fontSize: 14, color: "#6B7280" }}>
                Search employees and review leaves applied.
              </p>
            </div>

            <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  border: "1px solid #D1D5DB",
                  borderRadius: 12,
                  padding: "0 12px",
                  width: "100%",
                  background: "#fff",
                }}
              >
                <Search size={16} color="#6B7280" />
                <input
                  placeholder="Search employee..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    border: "none",
                    outline: "none",
                    width: "100%",
                    padding: "12px 0",
                    font: "inherit",
                    background: "transparent",
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 18,
                marginBottom: 18,
                flexWrap: "wrap",
              }}
            >
              {["All", "Pending", "Approved", "Rejected"].map((item) => (
                <button
                  key={item}
                  onClick={() => setFilter(item)}
                  className={`leave-filter ${filter === item ? "active" : ""}`}
                >
                  {item}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filtered.length === 0 ? (
                <div style={{ padding: "18px 0", color: "#6B7280" }}>
                  No leave requests match this filter.
                </div>
              ) : (
                filtered.map((leave) => (
                  <div
                    key={leave.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 16,
                      alignItems: "center",
                      padding: "14px 0",
                      borderBottom: "1px solid #F1F5F9",
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <p style={{ fontWeight: 600, margin: 0 }}>{leave.name}</p>
                      <p
                        style={{ fontSize: 14, color: "#6B7280", marginTop: 4 }}
                      >
                        {leave.type} • {leave.dates} • {leave.days} days
                      </p>
                    </div>

                    {leave.status === "Pending" ? (
                      <div style={{ display: "flex", gap: 10 }}>
                        <button
                          onClick={() => updateStatus(leave.id, "Approved")}
                          className="leave-icon-btn"
                          style={{ background: "#DCFCE7", color: "#15803D" }}
                          aria-label={`Approve ${leave.name}`}
                        >
                          <CheckCircle size={18} />
                        </button>
                        <button
                          onClick={() => updateStatus(leave.id, "Rejected")}
                          className="leave-icon-btn"
                          style={{ background: "#FEE2E2", color: "#DC2626" }}
                          aria-label={`Reject ${leave.name}`}
                        >
                          <XCircle size={18} />
                        </button>
                      </div>
                    ) : (
                      <span
                        style={{
                          padding: "7px 12px",
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 700,
                          background:
                            leave.status === "Approved" ? "#DCFCE7" : "#FEE2E2",
                          color:
                            leave.status === "Approved" ? "#166534" : "#991B1B",
                        }}
                      >
                        {leave.status}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
              gap: 24,
              alignContent: "start",
            }}
          >
            <div className="leave-card" style={{ padding: 20 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "center",
                  marginBottom: 16,
                  flexWrap: "wrap",
                }}
              >
                <h3 style={{ margin: 0, fontSize: 18 }}>Leave balances</h3>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="leave-select"
                  style={{ width: "auto", minWidth: 140, padding: "8px 10px" }}
                >
                  {departments.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.dep_name}
                    </option>
                  ))}
                </select>
              </div>

              <p style={{ margin: "0 0 14px", fontSize: 13, color: "#6B7280" }}>
                Department-level consumption and remaining employee balances for{" "}
                {activeDepartment?.dep_name || "the selected team"}.
              </p>

              <ProgressRow
                label="Annual leave used"
                value={`${departmentSummary.annualUsed} / ${departmentSummary.annualTotal} days`}
                width={`${Math.round((departmentSummary.annualUsed / departmentSummary.annualTotal) * 100)}%`}
                color="#3f3d9c"
              />
              <ProgressRow
                label="Sick leave used"
                value={`${departmentSummary.sickUsed} / ${departmentSummary.sickTotal} days`}
                width={`${Math.round((departmentSummary.sickUsed / departmentSummary.sickTotal) * 100)}%`}
                color="#F59E0B"
              />

              <div
                style={{
                  marginTop: 18,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {selectedEmployeeBalances.map((employee) => (
                  <div
                    key={employee.name}
                    style={{
                      border: "1px solid #E5E7EB",
                      borderRadius: 12,
                      padding: 12,
                      background: "#FAFAFA",
                    }}
                  >
                    <p
                      style={{
                        margin: "0 0 8px",
                        fontSize: 14,
                        fontWeight: 600,
                      }}
                    >
                      {employee.name}
                    </p>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <BalancePill label="Annual" value={employee.annual} />
                      <BalancePill label="Sick" value={employee.sick} />
                      <BalancePill label="Casual" value={employee.casual} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="leave-card" style={{ padding: 20 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "start",
                  justifyContent: "space-between",
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: 18 }}>Leave Policy</h3>
                  <p style={{ marginTop: 4, fontSize: 13, color: "#6B7280" }}>
                    Current entitlement and carry-forward rules
                  </p>
                </div>
                <Link
                  to="/settings/leave"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    color: "#3f3d9c",
                    textDecoration: "none",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  Edit Policy <ArrowUpRight size={16} />
                </Link>
              </div>

              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {policyItems.map((item) => (
                  <div
                    key={item.label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      paddingBottom: 10,
                      borderBottom: "1px solid #F1F5F9",
                    }}
                  >
                    <span style={{ fontSize: 14, color: "#374151" }}>
                      {item.label}
                    </span>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#111827",
                        textAlign: "right",
                      }}
                    >
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {showForm && (
          <ApplyForm
            employees={employees.map((employee) => ({
              employeeId: employee.employeeId,
              name: employee.name,
            }))}
            onClose={() => setShowForm(false)}
            onSubmitLeave={handleApplyLeave}
          />
        )}
      </div>
    </div>
  );
}

function Card({ title, value, color = "#6C63FF" }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        padding: 20,
        border: "1px solid #EAECF0",
        borderLeft: `4px solid ${color}`,
        boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
        cursor: "default",
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          background: `${color}18`,
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 12,
        }}
      >
        <div
          style={{ width: 14, height: 14, background: color, borderRadius: 3 }}
        />
      </div>
      <p
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: "#1A1D23",
          margin: 0,
          lineHeight: 1.1,
        }}
      >
        {value}
      </p>
      <p style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>{title}</p>
    </div>
  );
}

function ProgressRow({ label, value, width, color }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <p style={{ margin: 0, fontSize: 14 }}>{label}</p>
        <p style={{ margin: 0, fontSize: 14, color: "#6B7280" }}>{value}</p>
      </div>
      <div
        style={{
          height: 10,
          background: "#E5E7EB",
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width,
            background: color,
            borderRadius: 999,
          }}
        />
      </div>
    </div>
  );
}

function BalancePill({ label, value }) {
  const exhausted = value <= 0;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        background: exhausted ? "#FEE2E2" : "#EEF2FF",
        color: exhausted ? "#B91C1C" : "#2e2c7a",
      }}
    >
      {label}: {value}d
    </span>
  );
}

function ApplyForm({ employees, onClose, onSubmitLeave }) {
  const [form, setForm] = useState({
    employee: "",
    type: "",
    from: "",
    to: "",
    reason: "",
    file: null,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.employee || !form.type || !form.from) {
      return;
    }

    onSubmitLeave(form);
  };

  const handleClear = () => {
    setForm({
      employee: "",
      type: "",
      from: "",
      to: "",
      reason: "",
      file: null,
    });
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        zIndex: 30,
      }}
    >
      <div
        className="leave-card"
        style={{
          width: "100%",
          maxWidth: 520,
          padding: 24,
          boxSizing: "border-box",
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: 18, fontSize: 24 }}>
          Apply for leave
        </h2>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
        >
          <div
            className="leave-form-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 12,
            }}
          >
            <select
              className="leave-select"
              value={form.employee}
              onChange={(e) => setForm({ ...form, employee: e.target.value })}
            >
              <option value="">Select Employee</option>
              {employees.map((employee) => (
                <option key={employee.employeeId} value={employee.employeeId}>
                  {employee.name}
                </option>
              ))}
            </select>

            <select
              className="leave-select"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="">Leave Type</option>
              {leaveTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div
            className="leave-form-grid"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <input
              type="date"
              className="leave-input"
              value={form.from}
              onChange={(e) => setForm({ ...form, from: e.target.value })}
            />
            <input
              type="date"
              className="leave-input"
              value={form.to}
              onChange={(e) => setForm({ ...form, to: e.target.value })}
            />
          </div>

          <textarea
            placeholder="Reason"
            className="leave-textarea"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
          />

          <label
            htmlFor="leave-file-upload"
            style={{
              display: "block",
              border: "1px dashed #93C5FD",
              borderRadius: 12,
              padding: "16px 14px",
              background: "#F8FBFF",
              color: "#3f3d9c",
              cursor: "pointer",
              textAlign: "center",
              fontWeight: 600,
            }}
          >
            {form.file ? form.file.name : "Click to upload PDF / JPG"}
          </label>
          <input
            id="leave-file-upload"
            type="file"
            accept=".pdf,image/*"
            style={{ display: "none" }}
            onChange={(e) =>
              setForm({ ...form, file: e.target.files?.[0] ?? null })
            }
          />

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={handleClear}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #D1D5DB",
                background: "#fff",
                cursor: "pointer",
              }}
            >
              Clear
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #D1D5DB",
                background: "#fff",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "none",
                background: "#3f3d9c",
                color: "#fff",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
