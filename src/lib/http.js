const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export async function parseJsonResponse(response) {
  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.error || text || "Request failed");
  }

  return data;
}

export async function fetchJson(url, options) {
  const fullUrl = url.startsWith("http") ? url : `${API_BASE_URL}${url}`;
  const response = await fetch(fullUrl, options);
  return parseJsonResponse(response);
}
