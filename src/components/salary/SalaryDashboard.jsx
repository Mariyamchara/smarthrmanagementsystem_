import { useEffect, useState } from "react";
import { employeeService } from "../../services/api";
import {
  fetchPayrollConfigFromServer,
  getPayrollConfig,
  subscribeToPayrollConfig,
} from "../../lib/payrollConfig";
import "./salary.css";

import SalaryHeader from "./SalaryHeader";
import SalaryStats from "./SalaryStats";
import AttendanceSummary from "./AttendanceSummary";
import PayrollTabs from "./PayrollTabs";
import SalaryTable from "./SalaryTable";
import Pagination from "./Pagination";
import AllowanceModel from "./AllowanceModel";
import EditSalaryForm from "./EditSalaryForm";

function SalaryDashboard() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [allowanceEmployee, setAllowanceEmployee] = useState(null);
  const [searchId, setSearchId] = useState("");
  const [payrollConfig, setPayrollConfig] = useState(() => getPayrollConfig());
  const [showPayroll, setShowPayroll] = useState(false);

  useEffect(() => {
    fetchPayrollConfigFromServer().catch((error) => {
      console.error("Failed to load payroll config:", error);
    });
    return subscribeToPayrollConfig((cfg) => setPayrollConfig(cfg));
  }, []);

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        setLoading(true);
        const employeeData = await employeeService.getAll();
        setEmployees(employeeData);
        setError(null);
      } catch (err) {
        console.error("Error loading employees:", err);
        setError(
          "Failed to load employees. Check that the backend server is running.",
        );
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    };

    loadEmployees();
  }, []);

  const saveCompensation = async (employee, updates) => {
    const updatedEmployee = await employeeService.updateCompensation(
      employee._id,
      updates,
    );
    setEmployees((current) =>
      current.map((item) =>
        item._id === updatedEmployee._id ? updatedEmployee : item,
      ),
    );
  };

  const saveEmployee = async (updatedEmployee) => {
    await saveCompensation(updatedEmployee, {
      salary: Number(updatedEmployee.basic || 0),
      allowance: Number(updatedEmployee.allowance || 0),
    });
    setEditingEmployee(null);
  };

  const saveAllowance = async (amount) => {
    if (!allowanceEmployee) {
      return;
    }

    await saveCompensation(allowanceEmployee, {
      salary: Number(allowanceEmployee.basic || 0),
      allowance: Number(amount || 0),
    });
    setAllowanceEmployee(null);
  };

  const filteredEmployees =
    searchId.trim() === ""
      ? employees
      : employees.filter((employee) =>
          employee.id.toLowerCase().includes(searchId.toLowerCase()),
        );

  return (
    <div style={{ backgroundColor: "#f3f4f6", minHeight: "100vh" }}>
      {/* Page Header */}
      <div
        style={{
          background: "#3f3d9c",
          color: "white",
          padding: "clamp(16px, 5vw, 25px) clamp(16px, 5vw, 30px)",
          borderRadius: "8px 8px 0 0",
          margin: "clamp(16px, 5vw, 30px)",
          display: "flex",
          flexDirection: "column",
          gap: "clamp(12px, 3vw, 20px)",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(20px, 5vw, 28px)",
              fontWeight: "bold",
            }}
          >
            Salary Management
          </h1>
          <p
            style={{
              marginTop: "6px",
              fontSize: "clamp(13px, 3vw, 16px)",
              opacity: 0.85,
            }}
          >
            Manage employee salaries and payroll
          </p>
        </div>
        <div
          style={{
            display: "flex",
            gap: "clamp(8px, 2vw, 12px)",
            alignItems: "center",
            width: "100%",
            flexWrap: "wrap",
          }}
        >
          <input
            type="text"
            placeholder="Search employee by id..."
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            style={{
              padding: "8px 14px",
              borderRadius: 6,
              border: "none",
              fontSize: 14,
              flex: 1,
              minWidth: "150px",
              outline: "none",
              background: "white",
              color: "#111",
            }}
          />
          <button
            onClick={() => setShowPayroll(true)}
            style={{
              padding: "8px 18px",
              borderRadius: 6,
              border: "none",
              background: "#2e2c7a",
              color: "white",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: 14,
              whiteSpace: "nowrap",
            }}
          >
            Generate Payroll
          </button>
        </div>
      </div>

      <div
        className="salary-page"
        style={{ margin: "0 clamp(16px, 5vw, 30px) clamp(16px, 5vw, 30px)" }}
      >
        {loading && (
          <div
            style={{ textAlign: "center", padding: "20px", fontSize: "18px" }}
          >
            Loading employees...
          </div>
        )}
        {error && (
          <div
            style={{
              textAlign: "center",
              padding: "20px",
              color: "red",
              fontSize: "16px",
            }}
          >
            {error}
          </div>
        )}

        <SalaryHeader
          onSearch={setSearchId}
          searchId={searchId}
          payrollConfig={payrollConfig}
          showModal={showPayroll}
          onCloseModal={() => setShowPayroll(false)}
        />
        <SalaryStats employees={employees} payrollConfig={payrollConfig} />
        <AttendanceSummary />
        <PayrollTabs payrollConfig={payrollConfig} />
        <SalaryTable
          employees={filteredEmployees}
          openEdit={setEditingEmployee}
          openAllowance={setAllowanceEmployee}
          payrollConfig={payrollConfig}
        />
        <Pagination />

        {editingEmployee && (
          <EditSalaryForm
            employee={editingEmployee}
            onSave={saveEmployee}
            onCancel={() => setEditingEmployee(null)}
          />
        )}

        {allowanceEmployee && (
          <AllowanceModel
            employee={allowanceEmployee}
            onSave={saveAllowance}
            onCancel={() => setAllowanceEmployee(null)}
          />
        )}
      </div>
    </div>
  );
}

export default SalaryDashboard;
