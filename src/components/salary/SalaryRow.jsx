import React from 'react';
import { CURRENCY_SYMBOLS } from "../../lib/payrollConfig";

function SalaryRow({ employee, openEdit, openAllowance, payrollConfig = {} }) {
  const symbol = CURRENCY_SYMBOLS[payrollConfig.defaultCurrency] || CURRENCY_SYMBOLS.INR;

  const basic = Number(employee.basic || 0);
  const allowance = Number(employee.allowance || 0);
  const totalSalary = basic + allowance;

  return (

    <tr>

      <td>{employee.id}</td>
      <td>{employee.name}</td>
      <td>{employee.departmentName || employee.department}</td>

      <td>{symbol}{basic.toLocaleString("en-IN")}</td>
      <td>{symbol}{allowance.toLocaleString("en-IN")}</td>
      <td>{symbol}{totalSalary.toLocaleString("en-IN")}</td>

      <td className="salary-row-actions">

        <button
          className="btn-teal salary-action-btn"
          onClick={() => openAllowance(employee)}
        >
          Allowances
        </button>

        <button
          className="btn-teal salary-action-btn salary-action-btn-secondary"
          onClick={() => openEdit(employee)}
        >
          Edit
        </button>

      </td>

    </tr>

  );
}

export default SalaryRow;
