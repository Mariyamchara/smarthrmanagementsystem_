import React, { useState } from "react";

const SecuritySettings = () => {
  const [formData, setFormData] = useState({ oldPassword: "", newPassword: "", confirmNewPassword: "" });
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    if (!formData.oldPassword || !formData.newPassword || !formData.confirmNewPassword) {
      setIsError(true); setMessage("All fields are required."); return;
    }
    if (formData.newPassword.length < 8) {
      setIsError(true); setMessage("New password must be at least 8 characters long."); return;
    }
    if (formData.newPassword !== formData.confirmNewPassword) {
      setIsError(true); setMessage("New passwords do not match."); return;
    }
    try {
      const update = await fetch("/api/admin-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword: formData.oldPassword, newPassword: formData.newPassword }),
      });

      if (!update.ok) {
        const data = await update.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update password.");
      }
      setIsError(false);
      setMessage("Password updated successfully.");
      setFormData({ oldPassword: "", newPassword: "", confirmNewPassword: "" });
    } catch (error) {
      setIsError(true); setMessage(error.message || "Error updating password.");
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-semibold mb-6">Password & Security</h1>
      <div className="max-w-lg bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-4">Change Password</h2>
        {message && (
          <p className={`mb-3 text-sm ${isError ? "text-red-600" : "text-green-600"}`}>{message}</p>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="block mb-1 text-sm font-medium">Current Password</label>
            <input type="password" name="oldPassword" value={formData.oldPassword}
              placeholder="Enter current password" onChange={handleChange}
              className="w-full border p-2 rounded" />
          </div>
          <div className="mb-3">
            <label className="block mb-1 text-sm font-medium">New Password</label>
            <input type="password" name="newPassword" value={formData.newPassword}
              placeholder="Enter new password" onChange={handleChange}
              className="w-full border p-2 rounded" />
            <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters.</p>
          </div>
          <div className="mb-4">
            <label className="block mb-1 text-sm font-medium">Confirm New Password</label>
            <input type="password" name="confirmNewPassword" value={formData.confirmNewPassword}
              placeholder="Confirm new password" onChange={handleChange}
              className="w-full border p-2 rounded" />
          </div>
          <button type="submit" className="w-full bg-[#3f3d9c] text-white py-2 rounded hover:bg-[#2e2c7a] transition">
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default SecuritySettings;
