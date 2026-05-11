import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getAdminProfile } from "../lib/adminProfileApi";
import { assetsApi } from "../lib/assetsApi";
import { getDepartments } from "../lib/departmentsApi";
import { employeesApi } from "../lib/employeesApi";
import { leavesApi } from "../lib/leavesApi";
import { salaryIncrementService } from "../services/api";

export default function Dashboard() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [profile, setProfile] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [assets, setAssets] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [increments, setIncrements] = useState([]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [
          profileData,
          employeeData,
          departmentData,
          assetData,
          leaveData,
          incrementData,
        ] = await Promise.all([
          getAdminProfile(),
          employeesApi.getAll(),
          getDepartments(),
          assetsApi.getAll(),
          leavesApi.getAll(),
          salaryIncrementService.getAll(),
        ]);

        setProfile(profileData);
        setEmployees(employeeData);
        setDepartments(departmentData);
        setAssets(assetData);
        setLeaves(leaveData);
        setIncrements(incrementData);
      } catch (error) {
        console.error("Failed to load dashboard:", error);
      }
    };

    loadDashboard();
  }, []);

  const pendingLeaves = leaves.filter((leave) => leave.status === "Pending");
  const pendingIncrements = increments.filter((item) =>
    ["Pending", "Pending Approval"].includes(item.status),
  );
  const filteredEmployees = employees.filter((employee) =>
    employee.name.toLowerCase().includes(search.toLowerCase()),
  );

  const stats = useMemo(
    () => [
      {
        label: "Total Employees",
        value: String(employees.length),
        change: `${departments.length} active departments`,
        color: "#6C63FF",
        bg: "#6C63FF18",
        onClick: () => navigate("/employees"),
      },
      {
        label: "On Leave Today",
        value: String(leaves.length),
        change: `${pendingLeaves.length} pending approval`,
        color: "#F59E0B",
        bg: "#F59E0B18",
        onClick: () => navigate("/leaves"),
      },
      {
        label: "Departments",
        value: String(departments.length),
        change: `${employees.filter((employee) => !employee.departmentName).length} need review`,
        color: "#10B981",
        bg: "#10B98118",
        onClick: () => navigate("/departments"),
      },
      {
        label: "Assets + Salary",
        value: String(assets.length),
        change: `${pendingIncrements.length} increments pending`,
        color: "#EC4899",
        bg: "#EC489918",
        onClick: () => navigate("/salaries"),
      },
    ],
    [
      assets.length,
      departments.length,
      employees,
      leaves.length,
      navigate,
      pendingIncrements.length,
      pendingLeaves.length,
    ],
  );

  const recentEmployees = filteredEmployees.slice(0, 5);
  const departmentCards = departments.slice(0, 6).map((department) => ({
    name: department.dep_name,
    count: employees.filter(
      (employee) => employee.department === department._id,
    ).length,
    code: department._id,
  }));

  const displayName = profile?.name || "Admin";

  return (
    <div
      style={{
        padding: "24px",
        minHeight: "100vh",
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        background: "#F4F5F7",
        color: "#1A1D23",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 99px; }
        .card { background: #fff; border-radius: 14px; padding: 20px; border: 1px solid #EAECF0; }
        .stat-card { background: #fff; border-radius: 14px; padding: 20px; border: 1px solid #EAECF0; transition: transform .15s; cursor: pointer; }
        .stat-card:hover { transform: translateY(-2px); }
        .badge { display: inline-flex; align-items: center; padding: 3px 9px; border-radius: 99px; font-size: 11px; font-weight: 600; }
        .badge-active { background: #D1FAE5; color: #065F46; }
        .badge-pending { background: #FEF3C7; color: #92400E; }
        .badge-approved { background: #D1FAE5; color: #065F46; }
        .badge-rejected { background: #FEE2E2; color: #991B1B; }
        .avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; color: #fff; }
        .row-item { display: flex; align-items: center; gap: 12px; padding: 11px 0; border-bottom: 1px solid #F4F5F7; }
        .row-item:last-child { border-bottom: none; }
        .dept-bar-wrap { flex: 1; height: 6px; background: #F4F5F7; border-radius: 99px; overflow: hidden; }
        .search-input { border: 1px solid #EAECF0; border-radius: 8px; padding: 7px 12px 7px 34px; font-family: inherit; font-size: 13px; background: #fff; color: #1A1D23; outline: none; width: 220px; }
        .search-input:focus { border-color: #6C63FF; }
      `}</style>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: "#1A1D23" }}>
          Good morning, {displayName}
        </h1>
        <p style={{ fontSize: 13.5, color: "#6B7280", marginTop: 3 }}>
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}{" "}
          · Here's what's happening today.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 14,
          marginBottom: 24,
        }}
      >
        {stats.map((item) => (
          <button
            key={item.label}
            className="stat-card"
            type="button"
            onClick={item.onClick}
            style={{ textAlign: "left" }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                background: item.bg,
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  background: item.color,
                  borderRadius: 3,
                }}
              />
            </div>
            <p
              style={{
                fontSize: 24,
                fontWeight: 600,
                color: "#1A1D23",
                lineHeight: 1.1,
              }}
            >
              {item.value}
            </p>
            <p style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>
              {item.label}
            </p>
            <p
              style={{
                fontSize: 11.5,
                color: item.color,
                marginTop: 6,
                fontWeight: 500,
              }}
            >
              {item.change}
            </p>
          </button>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <div className="card">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <h2 style={{ fontSize: 14, fontWeight: 600 }}>Recent employees</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ position: "relative" }}>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#9CA3AF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  style={{
                    position: "absolute",
                    left: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                  }}
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  className="search-input"
                  placeholder="Search employees..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={() => navigate("/employees")}
                style={{
                  fontSize: 12,
                  color: "#6C63FF",
                  cursor: "pointer",
                  fontWeight: 500,
                  border: "none",
                  background: "transparent",
                }}
              >
                View all →
              </button>
            </div>
          </div>
          {recentEmployees.map((employee, index) => (
            <div key={employee._id} className="row-item">
              <div
                className="avatar"
                style={{
                  background: [
                    "#6C63FF",
                    "#10B981",
                    "#F59E0B",
                    "#EC4899",
                    "#3B82F6",
                  ][index % 5],
                }}
              >
                {employee.name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{ fontSize: 13.5, fontWeight: 500, color: "#1A1D23" }}
                >
                  {employee.name}
                </p>
                <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 1 }}>
                  {employee.designation || "No designation"} ·{" "}
                  {employee.departmentName || employee.department}
                </p>
              </div>
              <span className="badge badge-active">Active</span>
            </div>
          ))}
        </div>

        <div className="card">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <h2 style={{ fontSize: 14, fontWeight: 600 }}>Leave requests</h2>
            <button
              type="button"
              onClick={() => navigate("/leaves")}
              style={{
                background: "#FEF3C7",
                color: "#92400E",
                fontSize: 11,
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: 99,
                border: "none",
                cursor: "pointer",
              }}
            >
              {pendingLeaves.length} pending
            </button>
          </div>
          {leaves.slice(0, 4).map((leave, index) => (
            <div key={leave.id} className="row-item">
              <div
                className="avatar"
                style={{
                  background: ["#6C63FF", "#10B981", "#F59E0B", "#EC4899"][
                    index % 4
                  ],
                  fontSize: 11,
                }}
              >
                {leave.name
                  .split(" ")
                  .map((name) => name[0])
                  .join("")}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{ fontSize: 13.5, fontWeight: 500, color: "#1A1D23" }}
                >
                  {leave.name}
                </p>
                <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 1 }}>
                  {leave.type} · {leave.dates}
                </p>
              </div>
              <span className={`badge badge-${leave.status.toLowerCase()}`}>
                {leave.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <h2 style={{ fontSize: 14, fontWeight: 600 }}>Departments</h2>
          <button
            type="button"
            onClick={() => navigate("/departments")}
            style={{
              fontSize: 12,
              color: "#6C63FF",
              cursor: "pointer",
              fontWeight: 500,
              border: "none",
              background: "transparent",
            }}
          >
            Manage →
          </button>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 10,
          }}
        >
          {departmentCards.map((department, index) => (
            <button
              key={department.code}
              type="button"
              onClick={() => navigate("/departments")}
              style={{
                padding: "14px 16px",
                borderRadius: 10,
                border: "1px solid #EAECF0",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                background: "#fff",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{ fontSize: 13.5, fontWeight: 500, color: "#1A1D23" }}
                >
                  {department.name}
                </span>
                <span style={{ fontSize: 12, color: "#9CA3AF" }}>
                  {department.count} staff
                </span>
              </div>
              <div className="dept-bar-wrap">
                <div
                  style={{
                    height: "100%",
                    width: `${Math.max(12, Math.min(100, department.count * 18))}%`,
                    background: [
                      "#6C63FF",
                      "#10B981",
                      "#F59E0B",
                      "#EC4899",
                      "#3B82F6",
                      "#8B5CF6",
                    ][index % 6],
                    borderRadius: 99,
                  }}
                />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
