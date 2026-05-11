import React from 'react';
import SalaryRow from "./SalaryRow";

function SalaryTable({ employees, openEdit, openAllowance, payrollConfig }) {

  return (
    <div className="payroll-tabs">
      <div className="payroll-content">
        <div className="payroll-section-label">Employee Salary Table</div>
        <table className="payroll-table detailed-payroll-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Department</th>
              <th>Basic Salary</th>
              <th>Allowance</th>
              <th>Total Salary</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <SalaryRow
                key={emp._id}
                employee={emp}
                openEdit={openEdit}
                openAllowance={openAllowance}
                payrollConfig={payrollConfig}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SalaryTable;
