import { fetchJson } from "./http";

export function employeeLogin(payload) {
  return fetchJson("/api/employee-login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}
