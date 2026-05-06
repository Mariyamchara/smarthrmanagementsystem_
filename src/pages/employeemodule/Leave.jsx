import { useEffect, useState } from "react";
import MainLayout from "./MainLayout";
import { useEmployeeSession } from "./useEmployeeSession";
import {
  getEmployeeLeaves,
  submitEmployeeLeave,
} from "../../lib/employeeModuleApi";

const statusClass = {
  Approved: "badge-success",
  Pending: "badge-warning",
  Rejected: "badge-danger",
};

const emptyForm = {
  type: "Casual Leave",
  fromDate: "",
  toDate: "",
  reason: "",
};

export default function Leave() {
  const session = useEmployeeSession();
  const [leaves, setLeaves] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!session?.employeeId) {
      return;
    }

    let isActive = true;

    async function loadLeaves() {
      try {
        setLoading(true);
        const data = await getEmployeeLeaves(session.employeeId);
        if (isActive) {
          setLeaves(data);
          setError("");
        }
      } catch (err) {
        if (isActive) {
          setError(err.message || "Failed to load leave data");
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    loadLeaves();
    return () => {
      isActive = false;
    };
  }, [session?.employeeId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!session?.employeeId) {
      return;
    }

    try {
      setSubmitting(true);
      const created = await submitEmployeeLeave({
        employee: session.employeeId,
        type: form.type,
        from: form.fromDate,
        to: form.toDate,
        reason: form.reason,
      });

      setLeaves((current) => [created, ...current]);
      setForm(emptyForm);
      setError("");
      setSuccessMessage("Leave request submitted successfully.");
    } catch (err) {
      setError(err.message || "Failed to submit leave request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="page">
        <section className="page-hero">
          <div>
            <h2>Leave</h2>
            <p>Apply for leave and track your request status.</p>
          </div>
        </section>

        {error && <p className="form-message danger">{error}</p>}
        {successMessage && <p className="form-message success">{successMessage}</p>}

        <div className="grid-2">
          <div className="panel">
            <h3>Apply Leave</h3>
            <form className="field" onSubmit={handleSubmit}>
              <div className="field">
                <label>Leave Type</label>
                <select name="type" value={form.type} onChange={handleChange}>
                  <option>Casual Leave</option>
                  <option>Sick Leave</option>
                  <option>Earned Leave</option>
                  <option>Half Day Leave</option>
                </select>
              </div>

              <div className="grid-2">
                <div className="field">
                  <label>From Date</label>
                  <input name="fromDate" type="date" value={form.fromDate} onChange={handleChange} required />
                </div>
                <div className="field">
                  <label>To Date</label>
                  <input name="toDate" type="date" value={form.toDate} onChange={handleChange} required />
                </div>
              </div>

              <div className="field">
                <label>Reason</label>
                <textarea name="reason" placeholder="Write your leave reason" value={form.reason} onChange={handleChange} required />
              </div>

              <button className="btn" type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Leave Request"}
              </button>
            </form>
          </div>

          <div className="panel">
            <h3>Leave Status</h3>
            {loading ? (
              <p>Loading leave requests...</p>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>From</th>
                      <th>To</th>
                      <th>Reason</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaves.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="muted">
                          No leave requests submitted yet.
                        </td>
                      </tr>
                    ) : (
                      leaves.map((leave) => (
                        <tr key={leave._id}>
                          <td>{leave.type}</td>
                          <td>{String(leave.fromDate || "").slice(0, 10)}</td>
                          <td>{String(leave.toDate || "").slice(0, 10)}</td>
                          <td>{leave.reason || "-"}</td>
                          <td>
                            <span className={`badge ${statusClass[leave.status] || "badge-warning"}`}>
                              {leave.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
