import { fetchJson } from "../lib/http";

async function fetchWithPermissionCheck(url, options) {
  const res = await fetch(url, options);
  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }
  if (!res.ok) {
    if (data.permissionDenied) {
      alert(`⛔ Permission Denied\n\n${data.error}`);
    }
    throw new Error(data.error || text || "Request failed");
  }
  return data;
}

const mapEmployee = (employee) => ({
  ...employee,
  id: employee.employeeId,
  basic: Number(employee.salary || 0),
  allowance: Number(employee.allowance || 0),
});

export const employeeService = {
  async getAll() {
    const employees = await fetchJson("/api/employees");
    return employees.map(mapEmployee);
  },
  async updateCompensation(employeeDbId, payload) {
    const employee = await fetchWithPermissionCheck(`/api/employees/${employeeDbId}/compensation`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return mapEmployee(employee);
  },
};

export const payrollService = {
  getAll() {
    return fetchJson("/api/salaries");
  },
  generate(payload) {
    return fetchWithPermissionCheck("/api/salaries/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },
};

export const salaryIncrementService = {
  getAll() {
    return fetchJson("/api/salary-increments");
  },
  create(payload) {
    return fetchWithPermissionCheck("/api/salary-increments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },
  updateStatus(id, status, reviewedBy, note) {
    return fetchWithPermissionCheck(`/api/salary-increments/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, reviewedBy, note }),
    });
  },
};
