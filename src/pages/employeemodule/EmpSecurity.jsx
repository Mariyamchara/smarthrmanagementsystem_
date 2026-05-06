import React, { useState } from "react";
import MainLayout from "./MainLayout";
import { useEmployeeSession } from "./useEmployeeSession";
import { updateEmployeePassword } from "../../lib/employeeProfileApi";

const EmpSecurity = () => {
  const session = useEmployeeSession();
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!formData.oldPassword || !formData.newPassword || !formData.confirmNewPassword) {
      setIsError(true);
      setMessage("All fields are required.");
      return;
    }

    if (formData.newPassword.length < 8) {
      setIsError(true);
      setMessage("New password must be at least 8 characters long.");
      return;
    }

    if (formData.newPassword !== formData.confirmNewPassword) {
      setIsError(true);
      setMessage("New passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      await updateEmployeePassword(session.employeeId, {
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword,
      });
      setIsError(false);
      setMessage("Password updated successfully.");
      setFormData({
        oldPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
    } catch (error) {
      setIsError(true);
      setMessage(error.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="page">
        <section className="page-hero">
          <div>
            <h2>Password & Security</h2>
            <p>Update your password and keep your employee account protected.</p>
          </div>
          <small>Minimum 8 characters</small>
        </section>

        <div className="panel settings-form-panel">
          <h3>Change Password</h3>

          {message && (
            <p className={isError ? "form-message danger" : "form-message success"}>
              {message}
            </p>
          )}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Old Password</label>
              <input
                type="password"
                name="oldPassword"
                value={formData.oldPassword}
                placeholder="Enter old password"
                onChange={handleChange}
                required
              />
            </div>

            <div className="field">
              <label>New Password</label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                placeholder="Enter new password"
                onChange={handleChange}
                required
              />
              <p className="muted">Password must be at least 8 characters long.</p>
            </div>

            <div className="field">
              <label>Confirm New Password</label>
              <input
                type="password"
                name="confirmNewPassword"
                value={formData.confirmNewPassword}
                placeholder="Confirm new password"
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn" disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
};

export default EmpSecurity;
