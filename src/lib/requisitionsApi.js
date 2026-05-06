import { fetchJson } from "./http";

const API_BASE = "/api/requisitions";

export const requisitionsApi = {
  getAll() {
    return fetchJson(API_BASE);
  },
  update(id, payload) {
    return fetchJson(`${API_BASE}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },
};
