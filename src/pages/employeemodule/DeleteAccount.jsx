import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "./MainLayout";
import { useEmployeeSession } from "./useEmployeeSession";
import { deactivateEmployeeAccount } from "../../lib/employeeProfileApi";
import { clearStoredEmployeeSession } from "../../lib/employeeSession";

const DeleteAccount = () => {
  const session = useEmployeeSession();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);

    if (!session?.employeeId) {
      setIsError(true);
      setMessage("Employee session not found.");
      return;
    }

    const confirmed = window.confirm(
      "This will deactivate your employee account. Do you want to continue?",
    );
    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);
      await deactivateEmployeeAccount(session.employeeId);
      clearStoredEmployeeSession();
      setMessage("Account deleted successfully.");
      setTimeout(() => navigate("/"), 1200);
    } catch (error) {
      setIsError(true);
      setMessage(error.message || "Failed to delete account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="page">
        <section className="page-hero">
          <div>
            <h2>Delete Account</h2>
            <p>This action is permanent and cannot be undone.</p>
          </div>
          <small>Account control</small>
        </section>

        <div className="panel settings-form-panel">
          <h3>Delete Account</h3>
          <p className="muted">Review carefully before submitting this request.</p>

          {message && (
            <p className={isError ? "form-message danger" : "form-message success"}>
              {message}
            </p>
          )}

          <form onSubmit={handleDelete}>
            <div className="form-actions">
              <button type="submit" className="btn btn-danger" disabled={loading}>
                {loading ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
};

export default DeleteAccount;
