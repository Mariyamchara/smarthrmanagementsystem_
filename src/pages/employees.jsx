import { useEffect, useState } from "react";
import { employeesApi } from "../lib/employeesApi.js";
import { getDepartments } from "../lib/departmentsApi.js";

const LEGACY_EMPLOYEE_MODAL_ENABLED = false;

const emptyForm = {
  employeeId: "", name: "", email: "", dob: "", gender: "", marital: "",
  designation: "", department: "", salary: "", password: "", role: "Employee", image: "",
};

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [viewEmployee, setViewEmployee] = useState(null);

  useEffect(() => { fetchEmployees(); fetchDepartments(); }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setEmployees(await employeesApi.getAll());
      setError("");
    } catch { setError("Failed to load employees"); } 
    finally { setLoading(false); }
  };

  const fetchDepartments = async () => {
    try { setDepartments(await getDepartments()); }
    catch (err) { console.error(err); }
  };

  const resetForm = () => { setFormData(emptyForm); setEditingId(null); setIsAdding(false); };

  const generateEmployeeId = async () => {
    try {
      const allEmployees = await employeesApi.getAll();
      const ids = allEmployees
        .map((emp) => emp.employeeId)
        .filter((id) => id && id.startsWith("EMP"))
        .map((id) => parseInt(id.replace("EMP", ""), 10))
        .filter((num) => !isNaN(num));
      const nextId = Math.max(...ids, 0) + 1;
      return `EMP${String(nextId).padStart(4, "0")}`;
    } catch (error) {
      console.error("Error generating ID:", error);
      return `EMP${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;
    }
  };

  const getDepartmentName = (deptId) => {
    const dept = departments.find((d) => d._id === deptId);
    return dept ? dept.dep_name : deptId;
  };

  const handleInputChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setFormData((prev) => ({ ...prev, image: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!formData.employeeId || !formData.name || !formData.email || !formData.department) {
      setError("Employee ID, Name, Email, and Department are required"); return;
    }
    try {
      if (editingId) await employeesApi.update(editingId, formData);
      else await employeesApi.create(formData);
      resetForm(); setError(""); fetchEmployees();
    } catch (err) { setError(err.message || "Failed to save employee"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this employee?")) return;
    try { await employeesApi.delete(id); fetchEmployees(); }
    catch (err) { setError(err.message || "Failed to delete employee"); }
  };

  const filteredEmployees = employees.filter((emp) =>
    emp.name?.toLowerCase().includes(search.toLowerCase()) ||
    emp.employeeId?.toLowerCase().includes(search.toLowerCase()) ||
    emp.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ backgroundColor: "#f3f4f6", minHeight: "100%" }}>

      {/* Page Header */}
      <div style={{ background: "#3f3d9c", color: "white", padding: "25px 30px", borderRadius: "8px 8px 0 0", margin: "30px 30px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "bold" }}>Manage Employees</h1>
          <p style={{ marginTop: "6px", fontSize: "16px", opacity: 0.85 }}>Add, edit and manage employee records</p>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <input
            type="text"
            placeholder="Search by name, ID or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: "8px 14px", borderRadius: 6, border: "none", fontSize: 14, width: 260, outline: "none", background: "white", color: "#111" }}
          />
          <button
            onClick={() => { resetForm(); setIsAdding(true); }}
            style={{ padding: "8px 18px", borderRadius: 6, border: "none", background: "#2e2c7a", color: "white", fontWeight: 700, cursor: "pointer", fontSize: 14, whiteSpace: "nowrap" }}
          >
            Add New Employee
          </button>
        </div>
      </div>

      <div style={{ padding: "20px 30px 30px" }}>

      {error && (
        <div style={{ background: "#fee2e2", color: "#dc2626", padding: "12px", borderRadius: "6px", marginBottom: "16px" }}>
          {error}
        </div>
      )}

      {/* Add / Edit Form */}
      {isAdding && (
        <div style={{ background: "white", padding: "25px", borderRadius: "8px", marginBottom: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.08)" }}>
          <h3 style={{ marginTop: 0, marginBottom: "20px" }}>{editingId ? "Edit Employee" : "Add New Employee"}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
          <div>
            <label style={labelStyle}>Employee ID *</label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                name="employeeId"
                type="text"
                value={formData.employeeId}
                onChange={handleInputChange}
                disabled={!!editingId}
                style={{ ...inputStyle, opacity: editingId ? 0.6 : 1, flex: 1 }}
              />
              <button
                onClick={async () => {
                  const newId = await generateEmployeeId();
                  setFormData((prev) => ({ ...prev, employeeId: newId }));
                }}
                style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #d1d5db", background: "#f3f4f6", color: "#374151", fontWeight: 600, cursor: "pointer", fontSize: 12, whiteSpace: "nowrap" }}
              >
                Generate
              </button>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Name *</label>
            <input name="name" type="text" value={formData.name}
              onChange={handleInputChange}
              style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Email *</label>
            <input name="email" type="email" value={formData.email}
              onChange={handleInputChange}
              style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Date of Birth</label>
            <input name="dob" type="date" value={formData.dob ? formData.dob.split("T")[0] : ""}
              onChange={handleInputChange}
              style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Designation</label>
            <input name="designation" type="text" value={formData.designation}
              onChange={handleInputChange}
              style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Password</label>
            <input name="password" type="password" value={formData.password}
              onChange={handleInputChange}
              style={inputStyle} />
          </div>
            <div>
              <label style={labelStyle}>Gender</label>
              <select name="gender" value={formData.gender} onChange={handleInputChange} style={inputStyle}>
                <option value="">Select Gender</option>
                <option>Male</option><option>Female</option><option>Other</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Marital Status</label>
              <select name="marital" value={formData.marital} onChange={handleInputChange} style={inputStyle}>
                <option value="">Select Status</option>
                <option>Single</option><option>Married</option><option>Divorced</option><option>Widowed</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Department *</label>
              <select name="department" value={formData.department} onChange={handleInputChange} style={inputStyle}>
                <option value="">Select Department</option>
                {departments.map((d) => <option key={d._id} value={d._id}>{d.dep_name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Role</label>
              <select name="role" value={formData.role} onChange={handleInputChange} style={inputStyle}>
                <option>Employee</option><option>Manager</option><option>Admin</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Upload Image</label>
              <input type="file" accept="image/*" onChange={handleImageChange} style={inputStyle} />
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            <button onClick={handleSave} style={{ background: "#3f3d9c", color: "white", border: "none", padding: "10px 20px", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}>
              {editingId ? "Update Employee" : "Add Employee"}
            </button>
            <button onClick={resetForm} style={{ background: "#9ca3af", color: "white", border: "none", padding: "10px 20px", borderRadius: "6px", cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ background: "white", borderRadius: "8px", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "20px", textAlign: "center" }}>Loading employees...</div>
        ) : filteredEmployees.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", color: "#6b7280" }}>No employees found</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ backgroundColor: "#9ca3af", color: "white" }}>
              <tr>
                {["S No", "Image", "Name", "Employee ID", "Email", "Department", "Designation", "Salary", "Action"].map((h) => (
                  <th key={h} style={{ padding: "12px", borderBottom: "1px solid #ddd", fontWeight: "600", textAlign: "center" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp, index) => (
                <tr key={emp._id} style={{ textAlign: "center" }}>
                  <td style={tdStyle}>{index + 1}</td>
                  <td style={tdStyle}>
                    {emp.image ? (
                      <img src={emp.image} alt={emp.name} width="40" height="40" style={{ borderRadius: "50%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#3f3d9c", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, margin: "0 auto" }}>
                        {emp.name?.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </td>
                  <td style={tdStyle}>{emp.name}</td>
                  <td style={tdStyle}>{emp.employeeId}</td>
                  <td style={tdStyle}>{emp.email}</td>
                  <td style={tdStyle}>{emp.departmentName || getDepartmentName(emp.department)}</td>
                  <td style={tdStyle}>{emp.designation || "-"}</td>
                  <td style={tdStyle}>{emp.salary ? `$${Number(emp.salary).toLocaleString()}` : "-"}</td>
                  <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                    <button onClick={() => setViewEmployee(emp)} style={{ ...actionBtn, background: "#3f3d9c" }}>View</button>
                    <button onClick={() => { setFormData({ ...emptyForm, ...emp, password: "" }); setEditingId(emp._id); setIsAdding(true); }} style={{ ...actionBtn, background: "#f59e0b" }}>Edit</button>
                    <button onClick={() => handleDelete(emp._id)} style={{ ...actionBtn, background: "#ef4444" }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* View Modal */}
      {viewEmployee && (
        <EmployeeDetailModal
          employee={viewEmployee}
          getDepartmentName={getDepartmentName}
          onClose={() => setViewEmployee(null)}
        />
      )}
      {LEGACY_EMPLOYEE_MODAL_ENABLED && viewEmployee && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "white", borderRadius: "12px", padding: "28px", width: "480px", maxWidth: "95vw", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>Employee Details</h3>
              <button onClick={() => setViewEmployee(null)} style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#6b7280" }}>×</button>
            </div>

            {/* Avatar */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20, padding: "16px", background: "#f8fafc", borderRadius: "10px" }}>
              {viewEmployee.image ? (
                <img src={viewEmployee.image} alt={viewEmployee.name} style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#3f3d9c", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700 }}>
                  {viewEmployee.name?.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{viewEmployee.name}</p>
                <p style={{ margin: "2px 0 0", fontSize: 13, color: "#6b7280" }}>{viewEmployee.designation || "No designation"}</p>
                <span style={{ fontSize: 11, background: "#e7eafe", color: "#3f3d9c", padding: "2px 8px", borderRadius: 99, fontWeight: 600 }}>{viewEmployee.role}</span>
              </div>
            </div>

            {/* Info Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {[
                { label: "Employee ID", value: viewEmployee.employeeId },
                { label: "Email", value: viewEmployee.email },
                { label: "Department", value: viewEmployee.departmentName || getDepartmentName(viewEmployee.department) },
                { label: "Salary", value: viewEmployee.salary ? `$${Number(viewEmployee.salary).toLocaleString()}` : "-" },
                { label: "Gender", value: viewEmployee.gender || "-" },
                { label: "Marital Status", value: viewEmployee.marital || "-" },
                { label: "Date of Birth", value: viewEmployee.dob ? new Date(viewEmployee.dob).toLocaleDateString() : "-" },
              ].map(({ label, value }) => (
                <div key={label} style={{ padding: "10px 12px", background: "#f9fafb", borderRadius: "8px" }}>
                  <p style={{ margin: 0, fontSize: 11, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase" }}>{label}</p>
                  <p style={{ margin: "4px 0 0", fontSize: 14, fontWeight: 500, color: "#111827" }}>{value}</p>
                </div>
              ))}
            </div>

            <button onClick={() => setViewEmployee(null)} style={{ marginTop: 20, width: "100%", padding: "10px", background: "#3f3d9c", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}>
              Close
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

function EmployeeDetailModal({ employee, getDepartmentName, onClose }) {
  const departmentName = employee.departmentName || getDepartmentName(employee.department);

  const basicItems = [
    { label: "Full Name", value: employee.name },
    { label: "Phone Number", value: employee.phone },
    { label: "Email Address", value: employee.email },
    { label: "Address", value: employee.address },
  ];

  const jobItems = [
    { label: "Employee ID", value: employee.employeeId },
    { label: "Department", value: departmentName },
    { label: "Designation", value: employee.designation },
    { label: "Joining Date", value: formatDisplayDate(employee.createdAt) },
    { label: "Role", value: employee.role || "Employee" },
  ];

  return (
    <div style={modalOverlayStyle}>
      <div style={modalShellStyle}>
        <div style={modalHeaderStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, minWidth: 0 }}>
            {employee.image ? (
              <img src={employee.image} alt={employee.name} style={profileImageStyle} />
            ) : (
              <div style={profileAvatarStyle}>{getInitials(employee.name)}</div>
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <h2 style={{ margin: 0, fontSize: 24, color: "#111827" }}>{employee.name || "Employee"}</h2>
                <span style={employee.isActive === false ? inactiveBadgeStyle : activeBadgeStyle}>
                  {employee.isActive === false ? "Inactive" : "Active"}
                </span>
              </div>
              <p style={{ margin: "6px 0 0", color: "#4b5563", fontSize: 14 }}>
                {employee.designation || "No designation"} - {departmentName || "No department"}
              </p>
              <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 13 }}>
                {employee.employeeId || "No employee ID"} - {employee.email || "No email"}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close employee details" style={closeBtnStyle}>
            x
          </button>
        </div>

        <div style={detailsGridStyle}>
          <DetailSection title="Basic Information" items={basicItems} />
          <DetailSection title="Job Information" items={jobItems} />
        </div>

        <div style={modalFooterStyle}>
          <button type="button" onClick={onClose} style={primaryCloseBtnStyle}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailSection({ title, items }) {
  return (
    <section style={detailSectionStyle}>
      <h3 style={sectionTitleStyle}>{title}</h3>
      <div style={{ display: "grid", gap: 10 }}>
        {items.map((item) => (
          <div key={item.label} style={detailRowStyle}>
            <span style={detailLabelStyle}>{item.label}</span>
            <span style={detailValueStyle}>{displayValue(item.value)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function getInitials(name = "") {
  return String(name)
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "EM";
}

function displayValue(value) {
  return value === undefined || value === null || value === "" ? "-" : value;
}

function formatDisplayDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

const labelStyle = { display: "block", marginBottom: "5px", fontWeight: "600", color: "#374151", fontSize: "13px" };
const inputStyle = { width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px" };
const tdStyle = { padding: "10px", borderBottom: "1px solid #eee" };
const actionBtn = { color: "white", border: "none", padding: "5px 10px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", marginRight: "4px", fontWeight: 600 };
const modalOverlayStyle = { position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 50 };
const modalShellStyle = { background: "#fff", borderRadius: 12, width: "860px", maxWidth: "96vw", maxHeight: "92vh", overflow: "auto", boxShadow: "0 24px 80px rgba(15,23,42,0.28)", border: "1px solid #e5e7eb" };
const modalHeaderStyle = { padding: 24, borderBottom: "1px solid #e5e7eb", background: "#f8fafc", display: "flex", justifyContent: "space-between", gap: 18, alignItems: "flex-start" };
const profileImageStyle = { width: 82, height: 82, borderRadius: "50%", objectFit: "cover", border: "4px solid #fff", boxShadow: "0 8px 20px rgba(15,23,42,0.12)", flexShrink: 0 };
const profileAvatarStyle = { ...profileImageStyle, background: "#3f3d9c", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 800 };
const activeBadgeStyle = { background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0", padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 800 };
const inactiveBadgeStyle = { ...activeBadgeStyle, background: "#fee2e2", color: "#991b1b", border: "1px solid #fecaca" };
const closeBtnStyle = { width: 34, height: 34, borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer", color: "#4b5563", fontSize: 18, fontWeight: 700 };
const detailsGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, padding: 24 };
const detailSectionStyle = { border: "1px solid #e5e7eb", borderRadius: 8, padding: 16, background: "#fff" };
const sectionTitleStyle = { margin: "0 0 14px", fontSize: 15, color: "#111827", fontWeight: 800 };
const detailRowStyle = { display: "grid", gridTemplateColumns: "130px 1fr", gap: 12, alignItems: "start", borderTop: "1px solid #f1f5f9", paddingTop: 10 };
const detailLabelStyle = { color: "#6b7280", fontSize: 12, fontWeight: 700, textTransform: "uppercase" };
const detailValueStyle = { color: "#111827", fontSize: 14, fontWeight: 600, overflowWrap: "anywhere" };
const modalFooterStyle = { padding: "16px 24px 24px", display: "flex", justifyContent: "flex-end", borderTop: "1px solid #e5e7eb" };
const primaryCloseBtnStyle = { background: "#3f3d9c", color: "#fff", border: "none", padding: "10px 18px", borderRadius: 8, cursor: "pointer", fontWeight: 800 };
