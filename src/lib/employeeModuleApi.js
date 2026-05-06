import { fetchJson } from "./http";

function withEmployeeId(basePath, employeeId) {
  const params = new URLSearchParams();
  if (employeeId) {
    params.set("employeeId", employeeId);
  }

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function getEmployeeAttendance(employeeId) {
  return fetchJson(withEmployeeId("/api/attendance", employeeId));
}

export function getEmployeeLeaves(employeeId) {
  return fetchJson(withEmployeeId("/api/leaves", employeeId));
}

export function submitEmployeeLeave(payload) {
  return fetchJson("/api/leaves", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export function getEmployeeSalaries(employeeId) {
  return fetchJson(withEmployeeId("/api/salaries", employeeId));
}

export function getEmployeeAssets(employeeId) {
  return fetchJson(withEmployeeId("/api/assets", employeeId));
}

export function getEmployeeRequisitions(employeeId) {
  return fetchJson(withEmployeeId("/api/requisitions", employeeId));
}

export function submitEmployeeRequisition(payload) {
  return fetchJson("/api/requisitions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}
