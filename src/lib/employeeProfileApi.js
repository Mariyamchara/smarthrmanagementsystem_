import { fetchJson } from "./http";

export function getEmployeeProfile(employeeId) {
  return fetchJson(`/api/employee-profile/${employeeId}`);
}

export function updateEmployeeProfile(employeeId, payload) {
  return fetchJson(`/api/employee-profile/${employeeId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export function updateEmployeePassword(employeeId, payload) {
  return fetchJson(`/api/employee-profile/${employeeId}/password`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export function deactivateEmployeeAccount(employeeId) {
  return fetchJson(`/api/employee-profile/${employeeId}`, {
    method: "DELETE",
  });
}
