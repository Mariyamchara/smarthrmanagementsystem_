import { fetchJson } from "./http";

const API_BASE = "/api/departments";

export async function getDepartments() {
  return await fetchJson(API_BASE);
}

export async function getDepartmentById(id) {
  return await fetchJson(`${API_BASE}/${id}`);
}

export async function createDepartment(payload) {
  return await fetchJson(API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function updateDepartment(id, payload) {
  return await fetchJson(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function deleteDepartment(id) {
  return await fetchJson(`${API_BASE}/${id}`, {
    method: "DELETE",
  });
}
