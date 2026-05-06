import { CURRENCY_SYMBOLS } from "../../lib/payrollConfig";

function SalaryStats({ employees = [], payrollConfig = {} }) {
  const symbol = CURRENCY_SYMBOLS[payrollConfig.defaultCurrency] || CURRENCY_SYMBOLS.INR;
  const totalPayrollCost = employees.reduce(
    (sum, employee) => sum + Number(employee.basic || 0) + Number(employee.allowance || 0),
    0
  );

  const allowanceBudget = employees.reduce(
    (sum, employee) => sum + Number(employee.allowance || 0),
    0
  );

  return (
    <div className="stats-container">
      <div className="stat-card">
        <h4>Total Employees</h4>
        <p>{employees.length}</p>
      </div>

      <div className="stat-card">
        <h4>Pay Cycle</h4>
        <p style={{ fontSize: 18 }}>{payrollConfig.payCycle || "Monthly"}</p>
      </div>

      <div className="stat-card">
        <h4>Total Payroll Cost</h4>
        <p>{symbol}{totalPayrollCost.toLocaleString()}</p>
      </div>

      <div className="stat-card">
        <h4>Allowance Budget</h4>
        <p className="danger">{symbol}{allowanceBudget.toLocaleString()}</p>
      </div>
    </div>
  );
}

export default SalaryStats;
