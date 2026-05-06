import { useEffect, useMemo, useState } from "react";
import MainLayout from "./MainLayout";
import { useEmployeeSession } from "./useEmployeeSession";
import { getEmployeeSalaries } from "../../lib/employeeModuleApi";
import { getEmployeeProfile } from "../../lib/employeeProfileApi";
import { formatCurrency, formatDate } from "./employeeUtils";

const escapePdfText = (text) =>
  String(text).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

const createPdf = (lines) => {
  const content = [
    "BT",
    ...lines.map(
      ({ text, x = 50, y, size = 11 }) => `/F1 ${size} Tf\n1 0 0 1 ${x} ${y} Tm\n(${escapePdfText(text)}) Tj`,
    ),
    "ET",
  ].join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
};

function getMonthLabel(record) {
  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(new Date(record.year, record.month - 1, 1));
}

function buildPayrollSummary(record) {
  const basic = Number(record?.basic || 0);
  const allowance = Number(record?.allowance || 0);
  const deduction = Number(record?.deduction || 0);
  const tax = Number(record?.tax || 0);

  return {
    basic,
    allowance,
    deduction,
    tax,
    grossPay: basic + allowance,
    totalDeductions: deduction + tax,
    netSalary: Number(record?.netSalary || 0),
    workingDays: Number(record?.presentDays || 0),
  };
}

export default function Salary() {
  const session = useEmployeeSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [salaryHistory, setSalaryHistory] = useState([]);

  useEffect(() => {
    if (!session?.employeeId) {
      return;
    }

    let isActive = true;

    async function loadSalaryData() {
      try {
        setLoading(true);
        const [profileData, salaryData] = await Promise.all([
          getEmployeeProfile(session.employeeId),
          getEmployeeSalaries(session.employeeId),
        ]);

        if (!isActive) {
          return;
        }

        setProfile(profileData);
        setSalaryHistory(salaryData);
        setError("");
      } catch (err) {
        if (isActive) {
          setError(err.message || "Failed to load salary data");
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    loadSalaryData();
    return () => {
      isActive = false;
    };
  }, [session?.employeeId]);

  const currentPayroll = salaryHistory[0] || null;
  const payrollSummary = buildPayrollSummary(currentPayroll);

  const salarySummary = useMemo(
    () => [
      { label: "Basic Pay", value: formatCurrency(payrollSummary.basic) },
      { label: "Allowances", value: formatCurrency(payrollSummary.allowance) },
      { label: "Deductions", value: formatCurrency(payrollSummary.totalDeductions) },
    ],
    [payrollSummary.allowance, payrollSummary.basic, payrollSummary.totalDeductions],
  );

  const earnings = [
    { label: "Basic Salary", value: formatCurrency(payrollSummary.basic) },
    { label: "Allowances", value: formatCurrency(payrollSummary.allowance) },
  ];

  const deductions = [
    { label: "Deduction", value: formatCurrency(payrollSummary.deduction) },
    { label: "Tax", value: formatCurrency(payrollSummary.tax) },
  ];

  const downloadPayrollPdf = (payroll) => {
    if (!payroll) {
      return;
    }

    const summary = buildPayrollSummary(payroll);
    const month = getMonthLabel(payroll);
    const lines = [
      { text: "Smart HR", y: 790, size: 18 },
      { text: `Payroll Slip - ${month}`, y: 760, size: 16 },
      { text: "Employee Details", y: 720, size: 13 },
      { text: `Name: ${profile?.name || session?.name || ""}`, y: 700 },
      { text: `Employee ID: ${session?.employeeId || ""}`, y: 682 },
      { text: `Designation: ${profile?.designation || ""}`, y: 664 },
      { text: `Department: ${profile?.departmentName || ""}`, y: 646 },
      { text: "Payroll Details", y: 606, size: 13 },
      { text: `Pay Date: ${formatDate(payroll.processedOn)}`, y: 586 },
      { text: `Status: ${payroll.status || "Processed"}`, y: 568 },
      { text: `Gross Pay: ${formatCurrency(summary.grossPay)}`, y: 550 },
      { text: `Total Deductions: ${formatCurrency(summary.totalDeductions)}`, y: 532 },
      { text: `Working Days: ${summary.workingDays}`, y: 514 },
      { text: `Net Salary: ${formatCurrency(summary.netSalary)}`, y: 486, size: 14 },
      { text: "Earnings", y: 446, size: 13 },
      ...earnings.map((item, index) => ({ text: `${item.label}: ${item.value}`, y: 426 - index * 18 })),
      { text: "Deductions", y: 356, size: 13 },
      ...deductions.map((item, index) => ({ text: `${item.label}: ${item.value}`, y: 336 - index * 18 })),
    ];

    const url = URL.createObjectURL(createPdf(lines));
    const link = document.createElement("a");
    link.href = url;
    link.download = `payroll-${month.toLowerCase().replace(/\s+/g, "-")}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <MainLayout>
      <div className="page">
        <section className="page-hero">
          <div>
            <h2>Salary</h2>
            <p>View your monthly salary slip, deductions, and payment history.</p>
          </div>
          <button className="btn hero-btn" type="button" onClick={() => downloadPayrollPdf(currentPayroll)} disabled={!currentPayroll}>
            Download Current Month
          </button>
        </section>

        {error && <p className="form-message danger">{error}</p>}

        {loading ? (
          <div className="panel">
            <p>Loading salary data...</p>
          </div>
        ) : !currentPayroll ? (
          <div className="panel">
            <p>No payroll records are available for this employee yet.</p>
          </div>
        ) : (
          <>
            <div className="salary-overview mb-20">
              <div className="salary-net-card">
                <span>Net Salary</span>
                <strong>{formatCurrency(payrollSummary.netSalary)}</strong>
                <p>Salary credited for {getMonthLabel(currentPayroll)}</p>
                <button className="btn" type="button" onClick={() => downloadPayrollPdf(currentPayroll)}>
                  Download PDF
                </button>
              </div>

              {salarySummary.map((item) => (
                <div className="stat-card" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>

            <div className="salary-main-grid">
              <div className="panel salary-slip-panel">
                <div className="salary-slip-header">
                  <div>
                    <span className="badge badge-success">{currentPayroll.status || "Processed"}</span>
                    <h3>{getMonthLabel(currentPayroll)} Payslip</h3>
                    <p className="muted">Employee ID: {session?.employeeId}</p>
                  </div>
                  <div>
                    <strong>Pay Date</strong>
                    <p className="muted">{formatDate(currentPayroll.processedOn)}</p>
                  </div>
                </div>

                <div className="salary-pay-card">
                  <div>
                    <span>Total Net Pay</span>
                    <strong>{formatCurrency(payrollSummary.netSalary)}</strong>
                  </div>
                  <div className="salary-employee-card">
                    <strong>{profile?.name || session?.name}</strong>
                    <p>{profile?.designation || "Employee"}</p>
                    <p>{profile?.departmentName || "-"}</p>
                  </div>
                </div>

                <div className="salary-metrics">
                  <div className="stat-card">
                    <span>Gross Pay</span>
                    <strong>{formatCurrency(payrollSummary.grossPay)}</strong>
                  </div>
                  <div className="stat-card">
                    <span>Total Deductions</span>
                    <strong>{formatCurrency(payrollSummary.totalDeductions)}</strong>
                  </div>
                  <div className="stat-card">
                    <span>Working Days</span>
                    <strong>{payrollSummary.workingDays}</strong>
                  </div>
                </div>

                <h3 className="salary-breakup-title">Salary Breakup</h3>
                <div className="salary-breakup-grid">
                  <div>
                    <h4>Earnings</h4>
                    {earnings.map((item) => (
                      <div className="detail-row" key={item.label}>
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                      </div>
                    ))}
                  </div>

                  <div>
                    <h4>Deductions</h4>
                    {deductions.map((item) => (
                      <div className="detail-row" key={item.label}>
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="panel salary-history-panel">
                <h3>Salary History</h3>
                <div className="salary-history-list">
                  {salaryHistory.map((item) => (
                    <div className="salary-history-item" key={item._id}>
                      <div>
                        <strong>{getMonthLabel(item)}</strong>
                        <span>Paid on {formatDate(item.processedOn)}</span>
                      </div>
                      <strong>{formatCurrency(item.netSalary)}</strong>
                      <span className="badge badge-success">{item.status || "Processed"}</span>
                      <button className="btn btn-outline btn-small" type="button" onClick={() => downloadPayrollPdf(item)}>
                        PDF
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
