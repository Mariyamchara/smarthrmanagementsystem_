import { fetchJson } from "./http";

const API_BASE = "/api";

export const employeesApi = {
  // Get all employees
  async getAll() {
    return fetchJson(`${API_BASE}/employees`);
  },

  // Get single employee by ID
  async getById(id) {
    return fetchJson(`${API_BASE}/employees/${id}`);
  },

  // Create new employee
  async create(employeeData) {
    return fetchJson(`${API_BASE}/employees`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(employeeData),
    });
  },

  // Update employee
  async update(id, employeeData) {
    return fetchJson(`${API_BASE}/employees/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(employeeData),
    });
  },

  // Delete employee
  async delete(id) {
    return fetchJson(`${API_BASE}/employees/${id}`, {
      method: "DELETE",
    });
  },
};
