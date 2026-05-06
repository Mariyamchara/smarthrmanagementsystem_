import React, { useEffect, useState } from "react";

export default function AttendanceModule() {
  const [data, setData] = useState([]);

  useEffect(() => {
    let isMounted = true;

    fetch("/api/attendance")
      .then((res) => res.json())
      .then((result) => {
        if (isMounted) {
          setData(Array.isArray(result) ? result : []);
        }
      })
      .catch((error) => {
        console.error("Error fetching attendance:", error);
        if (isMounted) {
          setData([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Employee Attendance Report</h1>
        <p style={styles.subtitle}>Daily Attendance Summary</p>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.thead}>
              <th style={styles.th}>Emp ID</th>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Login Time</th>
              <th style={styles.th}>Logout Time</th>
              <th style={styles.th}>Department</th>
              <th style={styles.th}>Overtime</th>
              <th style={styles.th}>Status</th>
            </tr>
          </thead>

          <tbody>
            {data.map((emp, index) => (
              <tr key={index} style={styles.tr}>
                <td style={styles.td}>{emp.employeeId}</td>
                <td style={styles.td}>{emp.name}</td>
                <td style={styles.td}>{emp.date}</td>
                <td style={styles.td}>{emp.inTime || "-"}</td>
                <td style={styles.td}>{emp.outTime || "-"}</td>
                <td style={styles.td}>{emp.department || "-"}</td>
                <td style={styles.td}>{emp.overtime || "0h"}</td>
                <td style={styles.td}>
                  <span
                    style={{
                      ...styles.status,
                      ...(emp.status === "Present" && styles.present),
                      ...(emp.status === "Absent" && styles.absent),
                      ...(emp.status === "On Leave" && styles.leave),
                      ...(emp.status === "Late" && styles.late),
                    }}
                  >
                    {emp.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  page: {
    backgroundColor: "#f3f4f6",
    minHeight: "100vh",
    padding: "30px",
  },
  header: {
    background: "#3f3d9c",
    color: "white",
    textAlign: "center",
    padding: "25px",
    borderRadius: "8px 8px 0 0",
  },
  title: {
    margin: 0,
    fontSize: "28px",
    fontWeight: "bold",
  },
  subtitle: {
    marginTop: "10px",
    fontSize: "18px",
  },
  tableContainer: {
    background: "white",
    borderRadius: "0 0 8px 8px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
    overflow: "hidden",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  thead: {
    backgroundColor: "#9ca3af",
    color: "white",
  },
  th: {
    padding: "15px",
    textAlign: "center",
    fontWeight: "600",
  },
  tr: {
    borderTop: "1px solid #e5e7eb",
  },
  td: {
    padding: "15px",
    textAlign: "center",
  },
  status: {
    padding: "6px 14px",
    borderRadius: "6px",
    color: "white",
    fontWeight: "bold",
    display: "inline-block",
  },
  present: {
    backgroundColor: "#16a34a",
  },
  absent: {
    backgroundColor: "#dc2626",
  },
  leave: {
    backgroundColor: "#f59e0b",
  },
  late: {
    backgroundColor: "#3f3d9c",
  },
};
