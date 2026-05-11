import React, { useEffect, useMemo, useState } from "react";
import {
  employeeService,
  payrollService,
  salaryIncrementService,
} from "../../services/api";
import { CURRENCY_SYMBOLS } from "../../lib/payrollConfig";

function PayrollTabs({ payrollConfig = {} }) {
  const symbol =
    CURRENCY_SYMBOLS[payrollConfig.defaultCurrency] || CURRENCY_SYMBOLS.INR;
  const [employees, setEmployees] = useState([]);
  const [records, setRecords] = useState([]);
  const [increments, setIncrements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [employeeList, salaryRecords, salaryIncrementRecords] =
        await Promise.all([
          employeeService.getAll(),
          payrollService.getAll(),
          salaryIncrementService.getAll(),
        ]);
      setEmployees(employeeList);
      setRecords(salaryRecords);
      setIncrements(salaryIncrementRecords);
      setError("");
    } catch (err) {
      console.error("Failed to load payroll tabs data:", err);
      setError(err.message || "Failed to load payroll data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const latestIncrementByEmployeeId = useMemo(() => {
    const map = new Map();

    increments.forEach((increment) => {
      const key = increment.employeeCode || increment.employeeId;
      if (!key) {
        return;
      }

      const existing = map.get(key);
      if (!existing) {
        map.set(key, increment);
        return;
      }

      const currentTime = new Date(
        increment.incrementDate || increment.createdAt || 0,
      ).getTime();
      const existingTime = new Date(
        existing.incrementDate || existing.createdAt || 0,
      ).getTime();
      if (currentTime > existingTime) {
        map.set(key, increment);
      }
    });

    return map;
  }, [increments]);

  const detailedRecords = useMemo(() => {
    if (employees.length === 0) {
      return [];
    }

    const hasMeaningfulAmount = (value) => Number(value || 0) > 0;
    const latestRecordByEmployeeId = new Map();

    records.forEach((record) => {
      const existing = latestRecordByEmployeeId.get(record.employeeId);
      if (!existing) {
        latestRecordByEmployeeId.set(record.employeeId, record);
        return;
      }

      const currentKey =
        Number(record.year || 0) * 100 + Number(record.month || 0);
      const existingKey =
        Number(existing.year || 0) * 100 + Number(existing.month || 0);

      if (currentKey > existingKey) {
        latestRecordByEmployeeId.set(record.employeeId, record);
        return;
      }

      if (currentKey === existingKey) {
        const currentProcessedOn = new Date(record.processedOn || 0).getTime();
        const existingProcessedOn = new Date(
          existing.processedOn || 0,
        ).getTime();
        if (currentProcessedOn > existingProcessedOn) {
          latestRecordByEmployeeId.set(record.employeeId, record);
        }
      }
    });

    return employees
      .map((employee) => {
        const latestRecord = latestRecordByEmployeeId.get(employee.id);
        const latestIncrement = latestIncrementByEmployeeId.get(employee.id);
        const employeeBasic = Number(employee.basic || 0);
        const employeeAllowance = Number(employee.allowance || 0);
        const fallbackDeduction = Math.round(employeeBasic * 0.1);
        const fallbackTax = Math.round(employeeBasic * 0.05);
        const departmentName =
          employee.departmentName || employee.department || "-";
        const baseIncrementPercentage = Number(
          latestIncrement?.incrementPercentage || 0,
        );
        const deriveAllowanceIncrement = (allowance, basic) => {
          if (basic <= 0) return 0;
          return Number(((allowance / basic) * 100).toFixed(2));
        };
        const defaultIncrementPercentage =
          baseIncrementPercentage > 0
            ? baseIncrementPercentage
            : deriveAllowanceIncrement(employeeAllowance, employeeBasic);

        if (latestRecord) {
          const recordBasic = Number(latestRecord.basic || 0);
          const recordAllowance = Number(latestRecord.allowance || 0);
          const recordDeduction = Number(latestRecord.deduction || 0);
          const recordTax = Number(latestRecord.tax || 0);
          const recordNetSalary = Number(latestRecord.netSalary || 0);
          const shouldUseEmployeeCompensation =
            !hasMeaningfulAmount(recordBasic) &&
            !hasMeaningfulAmount(recordAllowance) &&
            (hasMeaningfulAmount(employeeBasic) ||
              hasMeaningfulAmount(employeeAllowance));
          const incrementPercentage =
            baseIncrementPercentage > 0
              ? baseIncrementPercentage
              : deriveAllowanceIncrement(
                  recordAllowance || employeeAllowance,
                  recordBasic || employeeBasic,
                );

          if (!shouldUseEmployeeCompensation) {
            return {
              ...latestRecord,
              employeeName: employee.name,
              department: departmentName,
              incrementPercentage,
            };
          }

          const deduction = hasMeaningfulAmount(recordDeduction)
            ? recordDeduction
            : fallbackDeduction;
          const tax = hasMeaningfulAmount(recordTax) ? recordTax : fallbackTax;

          return {
            ...latestRecord,
            employeeName: employee.name,
            department: departmentName,
            basic: employeeBasic,
            allowance: employeeAllowance,
            deduction,
            tax,
            incrementPercentage,
            netSalary:
              hasMeaningfulAmount(recordNetSalary) &&
              !shouldUseEmployeeCompensation
                ? recordNetSalary
                : employeeBasic + employeeAllowance - deduction - tax,
          };
        }

        const basic = employeeBasic;
        const allowance = employeeAllowance;
        const deduction = fallbackDeduction;
        const tax = fallbackTax;

        return {
          _id: employee._id,
          employeeId: employee.id,
          employeeName: employee.name,
          department: departmentName,
          basic,
          allowance,
          deduction,
          tax,
          incrementPercentage: defaultIncrementPercentage,
          netSalary: basic + allowance - deduction - tax,
          status: "Not Generated",
        };
      })
      .sort((a, b) =>
        String(a.employeeId || "").localeCompare(String(b.employeeId || "")),
      );
  }, [employees, latestIncrementByEmployeeId, records]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        Loading payroll data...
      </div>
    );
  }

  return (
    <div className="payroll-tabs">
      {error && (
        <div style={{ textAlign: "center", padding: "20px", color: "red" }}>
          {error}
        </div>
      )}

      <div className="payroll-content">
        <div className="payroll-section-label">Detailed Payroll</div>
        <table className="payroll-table detailed-payroll-table">
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Name</th>
              <th>Department</th>
              <th>Basic</th>
              <th>Increment</th>
              <th>Allowance</th>
              <th>Deduction</th>
              <th>Tax</th>
              <th>Net Salary</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {detailedRecords.length > 0 ? (
              detailedRecords.map((record) => (
                <tr key={record._id}>
                  <td>{record.employeeId}</td>
                  <td>{record.employeeName}</td>
                  <td>{record.department}</td>
                  <td>
                    {symbol}
                    {Number(record.basic || 0).toLocaleString("en-IN")}
                  </td>
                  <td>
                    {Number(record.incrementPercentage || 0).toLocaleString(
                      "en-IN",
                    )}
                    %
                  </td>
                  <td>
                    {symbol}
                    {Number(record.allowance || 0).toLocaleString("en-IN")}
                  </td>
                  <td>
                    {symbol}
                    {Number(record.deduction || 0).toLocaleString("en-IN")}
                  </td>
                  <td>
                    {symbol}
                    {Number(record.tax || 0).toLocaleString("en-IN")}
                  </td>
                  <td>
                    {symbol}
                    {Number(record.netSalary || 0).toLocaleString("en-IN")}
                  </td>
                  <td>{record.status}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="10"
                  style={{ textAlign: "center", padding: "20px" }}
                >
                  No payroll generated yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PayrollTabs;
