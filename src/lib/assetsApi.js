import { fetchJson } from "./http";

const API_BASE = "/api/assets";

export const assetsApi = {
  getAll() {
    return fetchJson(API_BASE);
  },
  getById(id) {
    return fetchJson(`${API_BASE}/${id}`);
  },
  update(id, payload) {
    return fetchJson(`${API_BASE}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },
  delete(id) {
    return fetchJson(`${API_BASE}/${id}`, { method: "DELETE" });
  },
  assign(payload) {
    return fetchJson(`${API_BASE}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },
};
