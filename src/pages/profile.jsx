import React, { useEffect, useMemo, useState } from "react";
import { Check, Shield, Trash2, Upload, X } from "lucide-react";

import { getAdminProfile, updateAdminProfile } from "../lib/adminProfileApi.js";
import { setStoredAdminSession } from "../lib/adminSession";

const emptyAdminProfile = {
  name: "",
  username: "",
  email: "",
  phone: "",
  title: "",
  dept: "",
  location: "",
  image: "",
  password: "",
};

const defaultPermissions = {
  employees: true,
  leaves: true,
  settings: false,
  salary: false,
};

function pickProfileFields(data) {
  const {
    permissions: savedPermissions = defaultPermissions,
    _id,
    profileId: _profileId,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...profileData
  } = data;

  return {
    profileData: {
      ...emptyAdminProfile,
      ...profileData,
      password: "",
      image: data.image || "",
    },
    savedPermissions: { ...defaultPermissions, ...savedPermissions },
  };
}

const AdminProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [adminData, setAdminData] = useState(emptyAdminProfile);
  const [permissions, setPermissions] = useState(defaultPermissions);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedImageName, setSelectedImageName] = useState("");
  const [selectedImageFile, setSelectedImageFile] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await getAdminProfile();
        const { profileData, savedPermissions } = pickProfileFields(data);
        setAdminData(profileData);
        setPermissions(savedPermissions);
        setStoredAdminSession(data);
        setApiError("");
      } catch (error) {
        console.error("Unable to load admin profile:", error);
        setAdminData(emptyAdminProfile);
        setPermissions(defaultPermissions);
        setApiError("Unable to load admin profile");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const initials = useMemo(() => {
    return (
      adminData.name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("") || "AD"
    );
  }, [adminData.name]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setAdminData((current) => ({ ...current, [name]: value }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setApiError("Image too large. Please upload an image under 5MB.");
      return;
    }

    setSelectedImageName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImageFile(file);
      setAdminData((current) => ({ ...current, image: reader.result || "" }));
      setApiError("");
      setSuccessMessage(`Image selected: ${file.name}`);
      setTimeout(() => setSuccessMessage(""), 3000);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!adminData.username.trim()) {
      setApiError("Username is required.");
      return;
    }

    if (!adminData.email.includes("@")) {
      setApiError("Enter a valid email address.");
      return;
    }

    const payload = {
      ...adminData,
      username: adminData.username.trim().toLowerCase(),
      email: adminData.email.trim().toLowerCase(),
      image: adminData.image || "",
      imageFile: selectedImageFile,
      permissions,
    };

    try {
      const updatedProfile = await updateAdminProfile(payload);
      const { profileData, savedPermissions } =
        pickProfileFields(updatedProfile);
      setAdminData(profileData);
      setPermissions(savedPermissions);
      setStoredAdminSession(updatedProfile);
      setIsEditing(false);
      setSelectedImageName("");
      setSelectedImageFile(null);
      setApiError("");
      setSuccessMessage("Profile updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Failed to update admin profile:", error);
      setApiError(
        error.message || "Failed to update profile. Please try again.",
      );
    }
  };

  if (loading) {
    return (
      <div
        style={{
          padding: "24px",
          minHeight: "100vh",
          background: "#F4F5F7",
          color: "#1A1D23",
        }}
      >
        <p>Loading admin profile...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        background: "#F4F5F7",
        color: "#1A1D23",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .card { background: #fff; border-radius: 14px; padding: 20px; border: 1px solid #EAECF0; }
        .btn-primary { background: #6C63FF; color: #fff; padding: 10px 16px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; transition: all .15s; }
        .btn-primary:hover { background: #5850d6; }
        .btn-secondary { background: transparent; border: 1px solid #EAECF0; color: #1A1D23; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-weight: 500; transition: all .15s; }
        .btn-secondary:hover { background: #F9FAFB; }
        .btn-danger { background: #EF4444; color: #fff; padding: 10px 16px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; transition: all .15s; }
        .btn-danger:hover { background: #dc2626; }
        .input-field { width: 100%; border: 1px solid #EAECF0; border-radius: 8px; padding: 10px 12px; font-size: 13px; font-family: inherit; }
        .input-field:focus { outline: none; border-color: #6C63FF; box-shadow: 0 0 0 3px rgba(108, 99, 255, 0.1); }
        .image-lg { width: 88px; height: 88px; border-radius: 50%; background: #6C63FF; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 700; color: #fff; overflow: hidden; }
        .toggle-switch { width: 50px; height: 28px; background: #E5E7EB; border-radius: 99px; cursor: pointer; display: flex; align-items: center; padding: 2px; transition: background .15s; }
        .toggle-switch.active { background: #6C63FF; }
        .toggle-thumb { width: 24px; height: 24px; background: #fff; border-radius: 50%; transition: transform .15s; }
        .toggle-switch.active .toggle-thumb { transform: translateX(22px); }
      `}</style>

      {apiError && (
        <div
          style={{
            margin: "24px 24px 0",
            padding: 14,
            background: "#fee2e2",
            color: "#991B1B",
            borderRadius: 8,
          }}
        >
          {apiError}
        </div>
      )}

      {successMessage && (
        <div
          style={{
            margin: "24px 24px 0",
            padding: 14,
            background: "#dcfce7",
            color: "#166534",
            borderRadius: 8,
          }}
        >
          ✓ {successMessage}
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div className="card" style={{ marginBottom: 24 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 20,
                flexWrap: "wrap",
              }}
            >
              <div
                style={{ display: "flex", gap: 20, alignItems: "flex-start" }}
              >
                <div className="image-lg">
                  {adminData.image ? (
                    <img
                      src={adminData.image}
                      alt={adminData.name || "Admin profile"}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    initials
                  )}
                </div>
                <div style={{ paddingTop: 4 }}>
                  <h1
                    style={{ fontSize: 24, fontWeight: 600, color: "#1A1D23" }}
                  >
                    {adminData.name || "Admin Profile"}
                  </h1>
                  <p style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>
                    {adminData.title || "No title added"}
                  </p>
                  <p style={{ fontSize: 13, color: "#6B7280", marginTop: 1 }}>
                    Login with:{" "}
                    {adminData.email || adminData.username || "Not set"}
                  </p>
                  {isEditing && (
                    <label
                      style={{
                        marginTop: 12,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        cursor: "pointer",
                        color: "#3f3d9c",
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      <Upload size={14} />
                      Upload profile image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        hidden
                      />
                    </label>
                  )}
                  {selectedImageName && (
                    <p style={{ fontSize: 12, color: "#10b981", marginTop: 8 }}>
                      📁 {selectedImageName}
                    </p>
                  )}
                </div>
              </div>

              <div>
                {!isEditing ? (
                  <button
                    className="btn-primary"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Profile
                  </button>
                ) : (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="btn-primary"
                      onClick={handleSave}
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <Check size={16} /> Save
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        setIsEditing(false);
                        setSelectedImageName("");
                        setSelectedImageFile(null);
                      }}
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <X size={16} /> Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
              Profile Information
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: 16,
              }}
            >
              {[
                { key: "name", label: "Name", type: "text" },
                { key: "username", label: "Username", type: "text" },
                { key: "email", label: "Email", type: "email" },
                { key: "phone", label: "Phone", type: "text" },
                { key: "title", label: "Title", type: "text" },
                { key: "dept", label: "Department", type: "text" },
                { key: "location", label: "Location", type: "text" },
                { key: "password", label: "Password", type: "password" },
              ].map(({ key, label, type }) => (
                <div key={key}>
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: "#6B7280",
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    {label}
                  </label>
                  {isEditing ? (
                    <input
                      type={type}
                      name={key}
                      className="input-field"
                      value={adminData[key] || ""}
                      onChange={handleInputChange}
                      placeholder={
                        key === "password"
                          ? "Leave blank to keep current password"
                          : ""
                      }
                    />
                  ) : (
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: "#1A1D23",
                      }}
                    >
                      {key === "password"
                        ? "••••••••"
                        : adminData[key] || "Not provided"}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ marginBottom: 24 }}>
            <h3
              style={{
                fontSize: 16,
                fontWeight: 600,
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Shield size={18} style={{ color: "#6C63FF" }} /> Permissions
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {Object.keys(permissions).map((key) => (
                <div
                  key={key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px",
                    background: "#F9FAFB",
                    borderRadius: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: "#1A1D23",
                      textTransform: "capitalize",
                    }}
                  >
                    {key}
                  </span>
                  <div
                    className={`toggle-switch ${permissions[key] ? "active" : ""}`}
                    onClick={() => {
                      if (!isEditing) return;
                      setPermissions((current) => ({
                        ...current,
                        [key]: !current[key],
                      }));
                    }}
                    style={{
                      cursor: isEditing ? "pointer" : "not-allowed",
                      opacity: isEditing ? 1 : 0.6,
                    }}
                  >
                    <div className="toggle-thumb" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              background: "#FEE2E2",
              border: "1px solid #FECACA",
              borderRadius: 14,
              padding: 20,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#991B1B",
                  marginBottom: 4,
                }}
              >
                Danger Zone
              </h3>
              <p style={{ fontSize: 13, color: "#B91C1C" }}>
                Permanently deactivate your admin account
              </p>
            </div>
            <button
              className="btn-danger"
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <Trash2 size={16} /> Deactivate Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
