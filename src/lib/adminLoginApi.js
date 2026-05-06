import { fetchJson } from "./http";

export async function adminLogin(username, password) {
  try {
    return await fetchJson("/api/admin-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
  } catch (error) {
    if (error.message.includes("Failed to fetch") || error.message.includes("Cannot connect")) {
      throw new Error("Cannot connect to server. Start the backend with `npm run server`.");
    }
    throw error;
  }
}
