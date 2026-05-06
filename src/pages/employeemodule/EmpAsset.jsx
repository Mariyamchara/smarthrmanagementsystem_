import { useEffect, useState } from "react";
import MainLayout from "./MainLayout";
import { useEmployeeSession } from "./useEmployeeSession";
import {
  getEmployeeAssets,
  getEmployeeRequisitions,
  submitEmployeeRequisition,
} from "../../lib/employeeModuleApi";
import { formatDate } from "./employeeUtils";

const assetOptions = [
  { name: "Laptop", liabilityAmount: 50000 },
  { name: "Mobile", liabilityAmount: 15000 },
  { name: "Monitor", liabilityAmount: 12000 },
  { name: "Keyboard", liabilityAmount: 2000 },
  { name: "Mouse", liabilityAmount: 1000 },
  { name: "Headset", liabilityAmount: 3000 },
  { name: "Tablet", liabilityAmount: 25000 },
  { name: "Table", liabilityAmount: 8000 },
];

export default function EmpAsset() {
  const session = useEmployeeSession();
  const [selectedAssets, setSelectedAssets] = useState([""]);
  const [reason, setReason] = useState("");
  const [requests, setRequests] = useState([]);
  const [assignedAssets, setAssignedAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!session?.employeeId) {
      return;
    }

    let isActive = true;

    async function loadAssets() {
      try {
        setLoading(true);
        const [requestData, assetData] = await Promise.all([
          getEmployeeRequisitions(session.employeeId),
          getEmployeeAssets(session.employeeId),
        ]);

        if (!isActive) {
          return;
        }

        setRequests(requestData);
        setAssignedAssets(assetData);
        setError("");
      } catch (err) {
        if (isActive) {
          setError(err.message || "Failed to load asset data");
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    loadAssets();
    return () => {
      isActive = false;
    };
  }, [session?.employeeId]);

  const handleAssetChange = (index, value) => {
    const updated = [...selectedAssets];
    updated[index] = value;
    setSelectedAssets(updated);
  };

  const addAssetField = () => {
    setSelectedAssets((current) => [...current, ""]);
  };

  const removeAssetField = (index) => {
    setSelectedAssets((current) => current.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!session?.employeeId) {
      return;
    }

    const cleanedAssets = selectedAssets.filter((item) => item.trim() !== "");
    if (cleanedAssets.length === 0) {
      setError("Please select at least one asset.");
      return;
    }

    try {
      setSubmitting(true);
      const created = await submitEmployeeRequisition({
        employeeId: session.employeeId,
        employeeName: session.name || "Employee",
        assets: cleanedAssets.map((assetName) => {
          const found = assetOptions.find((item) => item.name === assetName);
          return {
            name: assetName,
            liabilityAmount: found ? found.liabilityAmount : 0,
            status: "Pending",
          };
        }),
        reason,
      });

      setRequests((current) => [created, ...current]);
      setSelectedAssets([""]);
      setReason("");
      setError("");
      setSuccessMessage("Asset request submitted successfully.");
    } catch (err) {
      setError(err.message || "Failed to submit asset request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="page">
        <section className="page-hero">
          <div>
            <h2>Asset Requisition</h2>
            <p>Request assigned equipment and track your asset history.</p>
          </div>
          <small>
            {requests.length} active request{requests.length === 1 ? "" : "s"}
          </small>
        </section>

        {error && <p className="form-message danger">{error}</p>}
        {successMessage && <p className="form-message success">{successMessage}</p>}

        <div className="mb-20">
          <div className="panel">
            <h3>Request Assets</h3>

            <form onSubmit={handleSubmit}>
              <div className="grid-2 mb-20">
                <div className="field">
                  <label>Employee Name</label>
                  <input type="text" value={session?.name || ""} disabled />
                </div>

                <div className="field">
                  <label>Employee ID</label>
                  <input type="text" value={session?.employeeId || ""} disabled />
                </div>
              </div>

              <div className="field asset-field-list">
                <label>Select Assets</label>

                {selectedAssets.map((asset, index) => (
                  <div className="asset-select-row" key={index}>
                    <select
                      value={asset}
                      onChange={(e) => handleAssetChange(index, e.target.value)}
                      required
                    >
                      <option value="">Select Asset</option>
                      {assetOptions.map((item) => (
                        <option key={item.name} value={item.name}>
                          {item.name} (Rs. {item.liabilityAmount})
                        </option>
                      ))}
                    </select>

                    {selectedAssets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAssetField(index)}
                        className="btn btn-outline btn-small"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addAssetField}
                  className="btn btn-outline btn-small asset-add-btn"
                >
                  Add Another Asset
                </button>
              </div>

              <div className="field">
                <label>Reason</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter reason"
                  rows="4"
                  required
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="panel asset-request-panel mb-20">
          <div className="section-title">
            <h3>My Asset Requests</h3>
            <p className="muted">Recently submitted requests</p>
          </div>

          {loading ? (
            <p>Loading asset requests...</p>
          ) : (
            <div className="asset-request-list">
              {requests.length === 0 ? (
                <p className="muted">No asset requests submitted yet.</p>
              ) : (
                requests.map((req) => (
                  <div className="asset-request-item" key={req._id}>
                    <div>
                      <strong>{req._id}</strong>
                      <span>{req.employeeId}</span>
                    </div>

                    <div className="asset-request-assets">
                      {req.assets?.map((asset) => (
                        <span key={`${req._id}-${asset.name}`}>
                          {asset.name} - Rs. {asset.liabilityAmount}
                        </span>
                      ))}
                    </div>

                    <div className="asset-request-footer">
                      <span className="badge badge-warning">{req.status}</span>
                      <small>{formatDate(req.requestDate)}</small>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="panel">
          <div className="section-title">
            <h3>Assigned Assets</h3>
            <p className="muted">Assets already assigned by admin</p>
          </div>

          {loading ? (
            <p>Loading assigned assets...</p>
          ) : assignedAssets.length === 0 ? (
            <p className="muted">No assets assigned yet.</p>
          ) : (
            <div className="asset-request-list">
              {assignedAssets.map((record) => (
                <div className="asset-request-item" key={record._id}>
                  <div>
                    <strong>{record.requisitionId || `Asset ${record._id}`}</strong>
                    <span>Assigned on {formatDate(record.assignedDate)}</span>
                  </div>
                  <div className="asset-request-assets">
                    {record.assets?.map((asset) => (
                      <span key={`${record._id}-${asset.name}`}>
                        {asset.name} - {asset.serialNumber || "No serial"} - Rs. {asset.liabilityAmount}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
