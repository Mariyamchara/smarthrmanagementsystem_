import React from 'react';
import SalaryRow from "./SalaryRow";

function SalaryTable({ employees, openEdit, openAllowance, payrollConfig }) {

  return (

    <div className="table-container">

      <div style={{
        background: "white",
        padding: "16px 20px",
        borderBottom: "1px solid #e5e7eb",
        fontSize: "16px",
        fontWeight: "700",
        color: "#1f2937",
      }}>
        Employee Salary Table
      </div>

      <table>

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

  );
}

export default SalaryTable;
