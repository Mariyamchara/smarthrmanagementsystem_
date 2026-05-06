import { fetchJson } from "./http";

const API_BASE = "/api/admin-profile";

export async function getAdminProfile() {
  return await fetchJson(API_BASE);
}

export async function updateAdminProfile(payload) {
  let options;

  const hasImageFile =
    payload.imageFile &&
    typeof payload.imageFile === "object" &&
    typeof payload.imageFile.name === "string";

  if (hasImageFile) {
    const formData = new FormData();
    formData.append("name", payload.name || "");
    formData.append("username", payload.username || "");
    formData.append("email", payload.email || "");
    formData.append("phone", payload.phone || "");
    formData.append("title", payload.title || "");
    formData.append("dept", payload.dept || "");
    formData.append("location", payload.location || "");
    // When uploading a file, the server will store `/uploads/...` in `image`.
    // Avoid sending the (potentially large) preview/base64 value.
    formData.append("image", "");
    formData.append("password", payload.password || "");
    formData.append("permissions", JSON.stringify(payload.permissions || {}));
    formData.append("imageFile", payload.imageFile);

    options = {
      method: "PUT",
      body: formData,
    };
  } else {
    options = {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    };
  }

  return await fetchJson(API_BASE, options);
}
