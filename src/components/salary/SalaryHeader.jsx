import React, { useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import { employeeService, payrollService } from "../../services/api";
import { CURRENCY_SYMBOLS } from "../../lib/payrollConfig";

function SalaryHeader({ payrollConfig = {}, showModal = false, onCloseModal }) {
  const symbol =
    CURRENCY_SYMBOLS[payrollConfig.defaultCurrency] || CURRENCY_SYMBOLS.INR;
  const pdfSymbol = payrollConfig.defaultCurrency === "INR" ? "Rs." : symbol;
  const [employeeData, setEmployeeData] = useState([]);
  const [periodFromDate, setPeriodFromDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .slice(0, 10);
  });
  const [periodToDate, setPeriodToDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .slice(0, 10);
  });
  const [selectedDepartment, setSelectedDepartment] =
    useState("All Departments");
  const [generatedPayroll, setGeneratedPayroll] = useState(null);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const data = await employeeService.getAll();
        setEmployeeData(data);
      } catch (error) {
        console.error("Error loading employees:", error);
        setEmployeeData([]);
      }
    };

    loadEmployees();
  }, []);

  const departments = useMemo(
    () => [
      "All Departments",
      ...new Set(employeeData.map((employee) => employee.department)),
    ],
    [employeeData],
  );

  const filteredEmployees = useMemo(() => {
    return employeeData.filter((employee) => {
      const matchesSearch =
        employee.id.toLowerCase().includes(employeeSearch.toLowerCase()) ||
        employee.name.toLowerCase().includes(employeeSearch.toLowerCase());
      const matchesDepartment =
        selectedDepartment === "All Departments" ||
        employee.department === selectedDepartment;
      return matchesSearch && matchesDepartment;
    });
  }, [employeeData, employeeSearch, selectedDepartment]);

  const toggleEmployee = (employee) => {
    setSelectedEmployees((current) =>
      current.some((item) => item._id === employee._id)
        ? current.filter((item) => item._id !== employee._id)
        : [...current, employee],
    );
  };

  const handleGeneratePayroll = async () => {
    if (selectedEmployees.length === 0) {
      alert("Please select at least one employee");
      return;
    }

    if (!periodFromDate || !periodToDate) {
      alert("Please select both From and To dates");
      return;
    }

    try {
      setSubmitting(true);
      const summary = await payrollService.generate({
        // Backend uses the period range to generate months; `month` is only a fallback.
        month: periodFromDate.slice(0, 7),
        processedOn: new Date().toISOString().slice(0, 10),
        periodFrom: periodFromDate,
        periodTo: periodToDate,
        department: selectedDepartment,
        employeeIds: selectedEmployees.map((employee) => employee.id),
        processedBy: "Admin",
      });
      setGeneratedPayroll(summary);
    } catch (error) {
      console.error("Failed to generate payroll:", error);
      alert(error.message || "Failed to generate payroll");
    } finally {
      setSubmitting(false);
    }
  };

  const resetModal = () => {
    onCloseModal();
    setGeneratedPayroll(null);
    setSelectedEmployees([]);
    setEmployeeSearch("");
  };

  const formatCurrency = (value) => {
    const num = Number(value || 0);
    return num.toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const generatePDF = async () => {
    if (!generatedPayroll) return;

    try {
      const records = generatedPayroll.records || [];

      records.forEach((record) => {
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });

        let yPosition = 20;
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 15;
        const lineHeight = 6;

        pdf.setFontSize(16);
        pdf.setFont(undefined, "bold");
        pdf.text("PAYROLL SLIP", margin, yPosition);
        yPosition += 12;

        pdf.setFontSize(10);
        pdf.setFont(undefined, "normal");
        pdf.text(
          "Months: " +
            (Array.isArray(generatedPayroll.months)
              ? generatedPayroll.months.join(", ")
              : generatedPayroll.month),
          margin,
          yPosition,
        );
        yPosition += 8;

        pdf.setFontSize(11);
        pdf.setFont(undefined, "bold");
        pdf.text("Employee Information", margin, yPosition);
        yPosition += 8;

        pdf.setFontSize(9);
        pdf.setFont(undefined, "normal");
        pdf.text("ID: " + record.employeeId, margin, yPosition);
        yPosition += lineHeight;
        pdf.text("Name: " + record.employeeName, margin, yPosition);
        yPosition += lineHeight;
        pdf.text("Department: " + record.department, margin, yPosition);
        yPosition += 10;

        pdf.setFontSize(11);
        pdf.setFont(undefined, "bold");
        pdf.text("Salary Details", margin, yPosition);
        yPosition += 8;

        pdf.setFontSize(9);
        pdf.setFont(undefined, "normal");

        const basic = Number(record.basic || 0);
        const allowance = Number(record.allowance || 0);
        const deduction = Number(record.deduction || 0);
        const tax = Number(record.tax || 0);
        const netSalary = Number(record.netSalary || 0);

        const basicText = "Basic Salary: " + pdfSymbol + formatCurrency(basic);
        const allowanceText =
          "Allowance: " + pdfSymbol + formatCurrency(allowance);
        const deductionText =
          "Deduction: " + pdfSymbol + formatCurrency(deduction);
        const taxText = "Tax: " + pdfSymbol + formatCurrency(tax);
        const netSalaryText =
          "Net Salary: " + pdfSymbol + formatCurrency(netSalary);

        pdf.text(basicText, margin, yPosition);
        yPosition += lineHeight;
        pdf.text(allowanceText, margin, yPosition);
        yPosition += lineHeight;
        pdf.text(deductionText, margin, yPosition);
        yPosition += lineHeight;
        pdf.text(taxText, margin, yPosition);
        yPosition += lineHeight;

        pdf.setFont(undefined, "bold");
        pdf.text(netSalaryText, margin, yPosition);
        pdf.setFont(undefined, "normal");
        yPosition += 12;

        pdf.setFontSize(8);
        pdf.text(
          "Generated on: " + new Date().toLocaleDateString(),
          margin,
          pageHeight - 10,
        );

        const fileName =
          "Payroll_" +
          record.employeeId +
          "_" +
          record.employeeName.replace(/\s+/g, "_") +
          "_" +
          generatedPayroll.month +
          ".pdf";
        pdf.save(fileName);
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF");
    }
  };

  return (
    <>
      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: "900px" }}>
            {/* Organization Header */}
            <div
              style={{
                background: "linear-gradient(135deg, #2e2c7a 0%, #3f3d9c 100%)",
                padding: "28px 24px",
                borderRadius: "12px 12px 0 0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: "0 0 4px 0",
                      fontSize: "26px",
                      fontWeight: "800",
                      color: "#fff",
                    }}
                  >
                    Generate Payroll
                  </h2>
                  <p style={{ margin: 0, fontSize: "13px", color: "#e0e7ff" }}>
                    Smart HR Management System
                  </p>
                </div>
                <button
                  className="close-btn"
                  onClick={resetModal}
                  style={{
                    background: "rgba(255,255,255,0.2)",
                    border: "none",
                    color: "#fff",
                    fontSize: "28px",
                    cursor: "pointer",
                    width: "36px",
                    height: "36px",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "background 0.2s",
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            {!generatedPayroll ? (
              <div className="payroll-form" style={{ padding: "32px" }}>
                {/* Step 1: Period Selection */}
                <div style={{ marginBottom: "32px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "14px",
                    }}
                  >
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        background: "#3f3d9c",
                        color: "white",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "700",
                        fontSize: "16px",
                        marginRight: "12px",
                        flexShrink: 0,
                      }}
                    >
                      1
                    </div>
                    <h4
                      style={{
                        margin: 0,
                        fontSize: "15px",
                        fontWeight: "700",
                        color: "#1f2937",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Payroll Period
                    </h4>
                  </div>
                  <div
                    style={{
                      marginLeft: "44px",
                      background: "#f9fafb",
                      padding: "16px",
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <label
                      style={{
                        display: "block",
                        marginBottom: "8px",
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "#374151",
                      }}
                    >
                      From Date *
                    </label>
                    <input
                      type="date"
                      value={periodFromDate}
                      onChange={(event) =>
                        setPeriodFromDate(event.target.value)
                      }
                      style={{
                        width: "100%",
                        padding: "11px 12px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        fontSize: "14px",
                        outline: "none",
                        background: "#fff",
                        fontWeight: "500",
                      }}
                    />
                    <label
                      style={{
                        display: "block",
                        margin: "14px 0 8px",
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "#374151",
                      }}
                    >
                      To Date *
                    </label>
                    <input
                      type="date"
                      value={periodToDate}
                      onChange={(event) => setPeriodToDate(event.target.value)}
                      style={{
                        width: "100%",
                        padding: "11px 12px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        fontSize: "14px",
                        outline: "none",
                        background: "#fff",
                        fontWeight: "500",
                      }}
                    />
                    <p
                      style={{
                        margin: "8px 0 0 0",
                        fontSize: "12px",
                        color: "#6b7280",
                      }}
                    >
                      Payroll will be generated for all selected employees in
                      this period
                    </p>
                  </div>
                </div>

                {/* Step 2: Department Selection */}
                <div style={{ marginBottom: "32px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "14px",
                    }}
                  >
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        background: "#3f3d9c",
                        color: "white",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "700",
                        fontSize: "16px",
                        marginRight: "12px",
                        flexShrink: 0,
                      }}
                    >
                      2
                    </div>
                    <h4
                      style={{
                        margin: 0,
                        fontSize: "15px",
                        fontWeight: "700",
                        color: "#1f2937",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Department Filter
                    </h4>
                  </div>
                  <div
                    style={{
                      marginLeft: "44px",
                      background: "#f9fafb",
                      padding: "16px",
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <label
                      style={{
                        display: "block",
                        marginBottom: "8px",
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "#374151",
                      }}
                    >
                      Select Department
                    </label>
                    <select
                      value={selectedDepartment}
                      onChange={(event) =>
                        setSelectedDepartment(event.target.value)
                      }
                      style={{
                        width: "100%",
                        padding: "11px 12px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        fontSize: "14px",
                        outline: "none",
                        background: "#fff",
                        cursor: "pointer",
                        fontWeight: "500",
                      }}
                    >
                      {departments.map((department) => (
                        <option key={department}>{department}</option>
                      ))}
                    </select>
                    <p
                      style={{
                        margin: "8px 0 0 0",
                        fontSize: "12px",
                        color: "#6b7280",
                      }}
                    >
                      Filter employees by department or select all
                    </p>
                  </div>
                </div>

                {/* Step 3: Employee Selection */}
                <div style={{ marginBottom: "32px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "14px",
                    }}
                  >
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        background: "#3f3d9c",
                        color: "white",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "700",
                        fontSize: "16px",
                        marginRight: "12px",
                        flexShrink: 0,
                      }}
                    >
                      3
                    </div>
                    <h4
                      style={{
                        margin: 0,
                        fontSize: "15px",
                        fontWeight: "700",
                        color: "#1f2937",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Select Employees
                    </h4>
                  </div>
                  <div
                    style={{
                      marginLeft: "44px",
                      background: "#f9fafb",
                      padding: "16px",
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <label
                      style={{
                        display: "block",
                        marginBottom: "8px",
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "#374151",
                      }}
                    >
                      Search & Select Employees
                    </label>
                    <input
                      type="text"
                      placeholder="Search by employee ID or name..."
                      className="employee-search"
                      value={employeeSearch}
                      onChange={(event) =>
                        setEmployeeSearch(event.target.value)
                      }
                      style={{
                        width: "100%",
                        padding: "11px 12px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        fontSize: "14px",
                        outline: "none",
                        background: "#fff",
                        marginBottom: "12px",
                        fontWeight: "500",
                      }}
                    />
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "10px",
                        padding: "8px 0",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: "700",
                          color: "#1f2937",
                        }}
                      >
                        Selected:{" "}
                        <span style={{ color: "#3f3d9c", fontSize: "14px" }}>
                          {selectedEmployees.length}
                        </span>
                      </span>
                      <span style={{ fontSize: "12px", color: "#6b7280" }}>
                        Available: {filteredEmployees.length}
                      </span>
                    </div>
                    <div
                      className="employees-list"
                      style={{
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        maxHeight: "320px",
                        overflowY: "auto",
                        background: "#fff",
                      }}
                    >
                      {filteredEmployees.length > 0 ? (
                        filteredEmployees.map((employee) => (
                          <label
                            key={employee._id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              padding: "12px",
                              borderBottom: "1px solid #e5e7eb",
                              cursor: "pointer",
                              transition: "background-color 0.15s",
                              background: selectedEmployees.some(
                                (item) => item._id === employee._id,
                              )
                                ? "#f0f0ff"
                                : "transparent",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={selectedEmployees.some(
                                (item) => item._id === employee._id,
                              )}
                              onChange={() => toggleEmployee(employee)}
                              style={{
                                width: "18px",
                                height: "18px",
                                cursor: "pointer",
                                accentColor: "#3f3d9c",
                                marginRight: "12px",
                                flexShrink: 0,
                              }}
                            />
                            <span style={{ flex: 1 }}>
                              <div
                                style={{
                                  fontSize: "13px",
                                  fontWeight: "600",
                                  color: "#1f2937",
                                  marginBottom: "2px",
                                }}
                              >
                                {employee.id}
                              </div>
                              <div
                                style={{ fontSize: "12px", color: "#6b7280" }}
                              >
                                {employee.name}
                              </div>
                              <div
                                style={{
                                  fontSize: "11px",
                                  color: "#9ca3af",
                                  marginTop: "2px",
                                }}
                              >
                                {employee.department}
                              </div>
                            </span>
                          </label>
                        ))
                      ) : (
                        <p
                          style={{
                            padding: "24px",
                            textAlign: "center",
                            color: "#9ca3af",
                            fontSize: "13px",
                            margin: 0,
                          }}
                        >
                          No employees found
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div
                  className="form-actions"
                  style={{
                    display: "flex",
                    gap: "12px",
                    marginTop: "32px",
                    paddingTop: "24px",
                    borderTop: "1px solid #e5e7eb",
                  }}
                >
                  <button
                    onClick={handleGeneratePayroll}
                    disabled={submitting || selectedEmployees.length === 0}
                    style={{
                      flex: 1,
                      padding: "12px 16px",
                      background:
                        selectedEmployees.length === 0 ? "#d1d5db" : "#3f3d9c",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor:
                        selectedEmployees.length === 0
                          ? "not-allowed"
                          : "pointer",
                      fontWeight: "600",
                      fontSize: "14px",
                      transition: "all 0.3s",
                      opacity: submitting ? 0.8 : 1,
                    }}
                  >
                    {submitting
                      ? "Generating..."
                      : "Generate Payroll (" + selectedEmployees.length + ")"}
                  </button>
                  <button
                    onClick={resetModal}
                    style={{
                      flex: 1,
                      padding: "12px 16px",
                      background: "#f3f4f6",
                      color: "#374151",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "14px",
                      transition: "all 0.3s",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ padding: "32px" }}>
                {/* Success Header */}
                <div
                  style={{
                    background:
                      "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
                    border: "1px solid #86efac",
                    borderRadius: "8px",
                    padding: "20px",
                    marginBottom: "28px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "12px",
                    }}
                  >
                    <div style={{ fontSize: "24px", marginTop: "2px" }}>✓</div>
                    <div>
                      <h4
                        style={{
                          margin: "0 0 8px 0",
                          fontSize: "15px",
                          fontWeight: "700",
                          color: "#166534",
                        }}
                      >
                        Payroll Generated Successfully
                      </h4>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "13px",
                          color: "#166534",
                          lineHeight: "1.5",
                        }}
                      >
                        Payroll for {generatedPayroll.totalEmployees} employee
                        {generatedPayroll.totalEmployees !== 1 ? "s" : ""} has
                        been processed for {generatedPayroll.month}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Payroll Slips - Horizontal Cards */}
                <div style={{ marginBottom: "28px" }}>
                  <h4
                    style={{
                      margin: "0 0 16px 0",
                      fontSize: "15px",
                      fontWeight: "700",
                      color: "#1f2937",
                    }}
                  >
                    Payroll Slips - {generatedPayroll.month}
                  </h4>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                    }}
                  >
                    {generatedPayroll.records &&
                      generatedPayroll.records.map((record, index) => {
                        const basic = Number(record.basic || 0);
                        const allowance = Number(record.allowance || 0);
                        const deduction = Number(record.deduction || 0);
                        const netSalary = Number(record.netSalary || 0);
                        const deductionPercentage =
                          basic > 0
                            ? ((deduction / basic) * 100).toFixed(2)
                            : 0;

                        return (
                          <div
                            key={index}
                            style={{
                              background: "#fff",
                              border: "1px solid #e5e7eb",
                              borderRadius: "8px",
                              padding: "20px",
                              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                            }}
                          >
                            {/* Header Row */}
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "16px",
                                paddingBottom: "16px",
                                borderBottom: "1px solid #e5e7eb",
                              }}
                            >
                              <div>
                                <p
                                  style={{
                                    margin: "0 0 4px 0",
                                    fontSize: "12px",
                                    fontWeight: "600",
                                    color: "#6b7280",
                                    textTransform: "uppercase",
                                  }}
                                >
                                  Payroll Slip
                                </p>
                                <p
                                  style={{
                                    margin: 0,
                                    fontSize: "16px",
                                    fontWeight: "700",
                                    color: "#1f2937",
                                  }}
                                >
                                  {generatedPayroll.month}
                                </p>
                              </div>
                              <div style={{ textAlign: "right" }}>
                                <p
                                  style={{
                                    margin: "0 0 4px 0",
                                    fontSize: "12px",
                                    fontWeight: "600",
                                    color: "#6b7280",
                                    textTransform: "uppercase",
                                  }}
                                >
                                  Total Selected
                                </p>
                                <p
                                  style={{
                                    margin: 0,
                                    fontSize: "16px",
                                    fontWeight: "700",
                                    color: "#3f3d9c",
                                  }}
                                >
                                  {generatedPayroll.totalEmployees} Employee
                                  {generatedPayroll.totalEmployees !== 1
                                    ? "s"
                                    : ""}
                                </p>
                              </div>
                            </div>

                            {/* Content Grid */}
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns:
                                  "repeat(auto-fit, minmax(150px, 1fr))",
                                gap: "20px",
                              }}
                            >
                              {/* Employee Information */}
                              <div>
                                <p
                                  style={{
                                    margin: "0 0 8px 0",
                                    fontSize: "11px",
                                    fontWeight: "700",
                                    color: "#6b7280",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                  }}
                                >
                                  Employee Information
                                </p>
                                <div
                                  style={{
                                    background: "#f9fafb",
                                    padding: "12px",
                                    borderRadius: "6px",
                                    border: "1px solid #e5e7eb",
                                  }}
                                >
                                  <p
                                    style={{
                                      margin: "0 0 6px 0",
                                      fontSize: "12px",
                                      color: "#6b7280",
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontWeight: "600",
                                        color: "#374151",
                                      }}
                                    >
                                      ID:
                                    </span>{" "}
                                    {record.employeeId}
                                  </p>
                                  <p
                                    style={{
                                      margin: "0 0 6px 0",
                                      fontSize: "12px",
                                      color: "#6b7280",
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontWeight: "600",
                                        color: "#374151",
                                      }}
                                    >
                                      Name:
                                    </span>{" "}
                                    {record.employeeName}
                                  </p>
                                  <p
                                    style={{
                                      margin: 0,
                                      fontSize: "12px",
                                      color: "#6b7280",
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontWeight: "600",
                                        color: "#374151",
                                      }}
                                    >
                                      Dept:
                                    </span>{" "}
                                    {record.department}
                                  </p>
                                </div>
                              </div>

                              {/* Earnings */}
                              <div>
                                <p
                                  style={{
                                    margin: "0 0 8px 0",
                                    fontSize: "11px",
                                    fontWeight: "700",
                                    color: "#166534",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                  }}
                                >
                                  Earnings
                                </p>
                                <div
                                  style={{
                                    background: "#f0fdf4",
                                    padding: "12px",
                                    borderRadius: "6px",
                                    border: "1px solid #86efac",
                                  }}
                                >
                                  <p
                                    style={{
                                      margin: "0 0 6px 0",
                                      fontSize: "12px",
                                      color: "#166534",
                                    }}
                                  >
                                    <span style={{ fontWeight: "600" }}>
                                      Basic:
                                    </span>{" "}
                                    {symbol}
                                    {formatCurrency(basic)}
                                  </p>
                                  <p
                                    style={{
                                      margin: 0,
                                      fontSize: "12px",
                                      color: "#166534",
                                    }}
                                  >
                                    <span style={{ fontWeight: "600" }}>
                                      Allowance:
                                    </span>{" "}
                                    {symbol}
                                    {formatCurrency(allowance)}
                                  </p>
                                </div>
                              </div>

                              {/* Deductions */}
                              <div>
                                <p
                                  style={{
                                    margin: "0 0 8px 0",
                                    fontSize: "11px",
                                    fontWeight: "700",
                                    color: "#991b1b",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                  }}
                                >
                                  Deductions
                                </p>
                                <div
                                  style={{
                                    background: "#fee2e2",
                                    padding: "12px",
                                    borderRadius: "6px",
                                    border: "1px solid #fecaca",
                                  }}
                                >
                                  <p
                                    style={{
                                      margin: "0 0 6px 0",
                                      fontSize: "12px",
                                      color: "#991b1b",
                                    }}
                                  >
                                    <span style={{ fontWeight: "600" }}>
                                      Amount:
                                    </span>{" "}
                                    {symbol}
                                    {formatCurrency(deduction)}
                                  </p>
                                  <p
                                    style={{
                                      margin: 0,
                                      fontSize: "12px",
                                      color: "#991b1b",
                                    }}
                                  >
                                    <span style={{ fontWeight: "600" }}>
                                      %:
                                    </span>{" "}
                                    {deductionPercentage}%
                                  </p>
                                </div>
                              </div>

                              {/* Net Salary */}
                              <div>
                                <p
                                  style={{
                                    margin: "0 0 8px 0",
                                    fontSize: "11px",
                                    fontWeight: "700",
                                    color: "#3f3d9c",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                  }}
                                >
                                  Net Salary
                                </p>
                                <div
                                  style={{
                                    background: "#f0f0ff",
                                    padding: "12px",
                                    borderRadius: "6px",
                                    border: "1px solid #c7c9ff",
                                  }}
                                >
                                  <p
                                    style={{
                                      margin: 0,
                                      fontSize: "18px",
                                      fontWeight: "700",
                                      color: "#3f3d9c",
                                    }}
                                  >
                                    {symbol}
                                    {formatCurrency(netSalary)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Total Summary Card */}
                <div
                  style={{
                    background:
                      "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
                    border: "2px solid #3f3d9c",
                    borderRadius: "8px",
                    padding: "24px",
                    marginBottom: "28px",
                  }}
                >
                  <h4
                    style={{
                      margin: "0 0 16px 0",
                      fontSize: "15px",
                      fontWeight: "700",
                      color: "#3f3d9c",
                    }}
                  >
                    Payroll Summary
                  </h4>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(140px, 1fr))",
                      gap: "16px",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          margin: "0 0 6px 0",
                          fontSize: "12px",
                          fontWeight: "600",
                          color: "#1e40af",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Total Basic Salary
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "20px",
                          fontWeight: "700",
                          color: "#3f3d9c",
                        }}
                      >
                        {symbol}
                        {formatCurrency(generatedPayroll.totalBasic)}
                      </p>
                    </div>
                    <div>
                      <p
                        style={{
                          margin: "0 0 6px 0",
                          fontSize: "12px",
                          fontWeight: "600",
                          color: "#1e40af",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Total Allowance
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "20px",
                          fontWeight: "700",
                          color: "#3f3d9c",
                        }}
                      >
                        {symbol}
                        {formatCurrency(generatedPayroll.totalAllowance)}
                      </p>
                    </div>
                    <div>
                      <p
                        style={{
                          margin: "0 0 6px 0",
                          fontSize: "12px",
                          fontWeight: "600",
                          color: "#1e40af",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Total Deduction
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "20px",
                          fontWeight: "700",
                          color: "#3f3d9c",
                        }}
                      >
                        {symbol}
                        {formatCurrency(generatedPayroll.totalDeduction)}
                      </p>
                    </div>
                    <div>
                      <p
                        style={{
                          margin: "0 0 6px 0",
                          fontSize: "12px",
                          fontWeight: "600",
                          color: "#1e40af",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Total Net Payroll
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "20px",
                          fontWeight: "700",
                          color: "#3f3d9c",
                        }}
                      >
                        {symbol}
                        {formatCurrency(generatedPayroll.totalNetSalary)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    onClick={generatePDF}
                    style={{
                      flex: 1,
                      padding: "12px 16px",
                      background: "#10b981",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "14px",
                      transition: "all 0.3s",
                    }}
                  >
                    📥 Download Payroll Slips (PDF)
                  </button>
                  <button
                    onClick={resetModal}
                    style={{
                      flex: 1,
                      padding: "12px 16px",
                      background: "#f3f4f6",
                      color: "#374151",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "14px",
                      transition: "all 0.3s",
                    }}
                  >
                    ← Back
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default SalaryHeader;
