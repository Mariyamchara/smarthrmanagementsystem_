import React, { useEffect, useState } from "react";
import { fetchJson } from "../../lib/http";

function AttendanceSummary() {
  const [records, setRecords] = useState([]);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    async function loadAttendance() {
      try {
        setLoading(true);
        const data = await fetchJson("/api/attendance");
        if (!isActive) {
          return;
        }

        setRecords(Array.isArray(data) ? data : []);
        setError("");
      } catch (err) {
        if (!isActive) {
          return;
        }

        console.error("Failed to fetch attendance summary:", err);
        setRecords([]);
        setError(err.message || "Failed to load attendance records");
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    loadAttendance();
    return () => {
      isActive = false;
    };
  }, []);

  const presentDays = records.filter((r) => r.status === "Present").length;
  const absentDays = records.filter((r) => r.status === "Absent").length;
  const lateEntries = records.filter((r) => r.status === "Late").length;
  const overtimeHours = records.reduce(
    (sum, r) => sum + (parseFloat(r.overtime) || 0),
    0,
  );

  return (
    <>
      <div className="attendance-container">
        <div className="attendance-card" onClick={() => !loading && setShowDetails(!showDetails)}>
          <h4>Present Days</h4>
          <p>{loading ? "..." : presentDays}</p>
        </div>
        <div className="attendance-card" onClick={() => !loading && setShowDetails(!showDetails)}>
          <h4>Absent Days</h4>
          <p className="danger">{loading ? "..." : absentDays}</p>
        </div>
        <div className="attendance-card" onClick={() => !loading && setShowDetails(!showDetails)}>
          <h4>Late Entries</h4>
          <p>{loading ? "..." : lateEntries}</p>
        </div>
        <div className="attendance-card" onClick={() => !loading && setShowDetails(!showDetails)}>
          <h4>Overtime Hours</h4>
          <p>{loading ? "..." : `${overtimeHours}h`}</p>
        </div>
      </div>

      {error && (
        <div className="attendance-details">
          <div className="attendance-header">
            <h3>Attendance Records</h3>
          </div>
          <p style={{ color: "#dc2626", padding: "0 16px 16px" }}>{error}</p>
        </div>
      )}

      {showDetails && !error && (
        <div className="attendance-details">
          <div className="attendance-header">
            <h3>Attendance Records</h3>
            <button className="close-btn" onClick={() => setShowDetails(false)}>x</button>
          </div>
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Emp ID</th>
                <th>Name</th>
                <th>Date</th>
                <th>Status</th>
                <th>Overtime Hours</th>
              </tr>
            </thead>
            <tbody>
              {records.length > 0 ? (
                records.map((record, index) => (
                  <tr key={`${record.employeeId}-${record.date}-${index}`}>
                    <td>{record.employeeId}</td>
                    <td>{record.name}</td>
                    <td>{record.date}</td>
                    <td>{record.status}</td>
                    <td>{record.overtime}h</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", padding: "16px" }}>
                    No attendance records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default AttendanceSummary;
