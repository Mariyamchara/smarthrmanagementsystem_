import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteDepartment, getDepartments } from "../../lib/departmentsApi";

const DepartmentList = () => {
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchDepartments = async () => {
    try {
      const data = await getDepartments();
      setDepartments(data);
    } catch (error) {
      alert(error.message || "Error loading departments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDepartments(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete?")) return;
    try {
      await deleteDepartment(id);
      setDepartments((prev) => prev.filter((dep) => dep._id !== id));
    } catch (error) {
      alert(error.message || "Server error");
    }
  };

  const filteredDepartments = departments.filter((dep) =>
    dep.dep_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ backgroundColor: "#f3f4f6", minHeight: "100vh" }}>

      {/* Page Header */}
      <div style={{ background: "#3f3d9c", color: "white", textAlign: "center", padding: "25px", borderRadius: "8px 8px 0 0", margin: "30px 30px 0" }}>
        <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "bold" }}>Manage Departments</h1>
        <p style={{ marginTop: "10px", fontSize: "16px" }}>View, add and manage company departments</p>
      </div>

      <div style={{ padding: "20px 30px 30px" }}>
        {/* Search + Add */}
        <div className="toolbar-row" style={{ background: "white", padding: "16px 20px", marginBottom: 0 }}>
          <input
            type="text"
            placeholder="Search by department name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: "8px 14px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px" }}
          />
          <Link to="/departments/add"
            style={{ background: "#3f3d9c", color: "white", padding: "9px 18px", borderRadius: "6px", textDecoration: "none", fontWeight: "600", fontSize: "14px", whiteSpace: "nowrap" }}>
            Add New Department
          </Link>
        </div>

        {/* Table */}
        <div style={{ background: "white", borderRadius: "0 0 8px 8px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)", overflow: "auto" }}>
          {loading ? (
            <p style={{ textAlign: "center", padding: "20px" }}>Loading...</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ backgroundColor: "#9ca3af", color: "white" }}>
                <tr>
                  {["S No", "Dept ID", "Department Name", "Description", "Action"].map((h) => (
                    <th key={h} style={{ padding: "15px", textAlign: "center", fontWeight: "600" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredDepartments.length > 0 ? (
                  filteredDepartments.map((dep, index) => (
                    <tr key={dep._id} style={{ borderTop: "1px solid #e5e7eb", textAlign: "center" }}>
                      <td style={td}>{index + 1}</td>
                      <td style={td}>{dep._id}</td>
                      <td style={td}>{dep.dep_name}</td>
                      <td style={td}>{dep.description || "-"}</td>
                      <td style={{ ...td, whiteSpace: "nowrap" }}>
                        <Link to={`/departments/edit/${dep._id}`}
                          style={{ marginRight: "6px", background: "#f59e0b", color: "white", padding: "5px 10px", borderRadius: "4px", textDecoration: "none", fontSize: "12px", fontWeight: 600 }}>
                          Edit
                        </Link>
                        <button onClick={() => handleDelete(dep._id)}
                          style={{ background: "#ef4444", color: "white", border: "none", padding: "5px 10px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="5" style={{ textAlign: "center", padding: "20px", color: "#6b7280" }}>No Departments Found</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

const td = { padding: "15px", textAlign: "center" };

export default DepartmentList;
