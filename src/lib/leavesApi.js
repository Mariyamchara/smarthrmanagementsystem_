import { fetchJson } from "./http";

const API_BASE = "/api/leaves";

export const leavesApi = {
  getAll() {
    return fetchJson(API_BASE);
  },
  create(payload) {
    return fetchJson(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },
  updateStatus(id, status) {
    return fetchJson(`${API_BASE}/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  },
};
