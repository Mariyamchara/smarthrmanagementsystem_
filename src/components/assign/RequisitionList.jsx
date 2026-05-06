import React, { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { assetsApi } from "../../lib/assetsApi";
import { requisitionsApi } from "../../lib/requisitionsApi";

const RequisitionList = () => {
  const [requests, setRequests] = useState([]);
  const [serialNumbers, setSerialNumbers] = useState({});

  const assetLiabilityMap = {
    Laptop: 50000, Mobile: 15000, Monitor: 12000, Keyboard: 2000,
    Mouse: 1000, Headset: 3000, Tablet: 25000, Table: 8000,
  };

  useEffect(() => {
    let isActive = true;

    requisitionsApi
      .getAll()
      .then((data) => {
        if (isActive) {
          setRequests(data);
        }
      })
      .catch((error) => {
        console.error("Error fetching requisitions:", error);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const updateOverallStatus = (assets) => {
    const approved = assets.filter((a) => a.status === "Approved").length;
    const rejected = assets.filter((a) => a.status === "Rejected").length;
    if (approved === assets.length) return "Approved";
    if (rejected === assets.length) return "Rejected";
    if (approved > 0) return "Partially Approved";
    return "Pending";
  };

  const handleAssetDecision = async (requestId, assetIndex, decision) => {
    try {
      const request = requests.find((item) => item._id === requestId);
      if (!request) return;
      const updatedAssets = request.assets.map((asset, index) =>
        index === assetIndex ? { ...asset, status: decision, liabilityAmount: decision === "Approved" ? assetLiabilityMap[asset.name] || 0 : 0 } : asset
      );
      await requisitionsApi.update(requestId, { assets: updatedAssets, status: updateOverallStatus(updatedAssets) });
      setRequests((current) =>
        current.map((item) =>
          item._id === requestId
            ? { ...item, assets: updatedAssets, status: updateOverallStatus(updatedAssets) }
            : item
        )
      );
    } catch (error) { console.error("Error updating asset decision:", error); }
  };

  const handleSerialNumberChange = (requestId, assetIndex, value) => {
    setSerialNumbers((prev) => ({ ...prev, [`${requestId}-${assetIndex}`]: value }));
  };

  const handleFinalize = async (requestId) => {
    try {
      const request = requests.find((item) => item._id === requestId);
      if (!request) return;
      const approvedAssets = request.assets.map((asset, index) => {
        if (asset.status !== "Approved") return null;
        const serialNumber = serialNumbers[`${requestId}-${index}`];
        if (!serialNumber?.trim()) throw new Error(`Please enter a serial number for ${asset.name}.`);
        return { name: asset.name, serialNumber: serialNumber.trim(), liabilityAmount: asset.liabilityAmount };
      }).filter(Boolean);
      if (approvedAssets.length === 0) { alert("No approved assets to assign."); return; }
      await assetsApi.assign({ employeeId: request.employeeId, employeeName: request.employeeName, requisitionId: request._id, assets: approvedAssets });
      alert("Approved assets added to Asset List.");
      setSerialNumbers({});
      setRequests((current) =>
        current.map((item) =>
          item._id === requestId ? { ...item, status: "Fulfilled" } : item
        )
      );
    } catch (error) { alert(error.message || "Error finalizing requisition."); }
  };

  return (
    <div>
      <div style={{ background: "white", borderRadius: "0 0 8px 8px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)", overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ backgroundColor: "#9ca3af", color: "white" }}>
            <tr>
              {["S.No", "Employee ID", "Employee", "Assets Requested", "Request Date", "Status", "Actions"].map((h) => (
                <th key={h} style={{ padding: "15px", textAlign: "center", fontWeight: "600" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {requests.length > 0 ? (
              requests.map((request, index) => (
                <tr key={request._id} style={{ borderTop: "1px solid #e5e7eb" }}>
                  <td style={td}>{index + 1}</td>
                  <td style={td}>{request.employeeId}</td>
                  <td style={td}>{request.employeeName}</td>
                  <td style={td}>
                    {request.assets.map((asset, assetIndex) => (
                      <div key={`${request._id}-${assetIndex}`} style={{ marginBottom: 8, padding: 8, border: "1px solid #e5e7eb", borderRadius: 6, background: "#f9fafb" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontWeight: 600 }}>
                            {asset.name}
                            {asset.status === "Approved" && <span style={{ color: "#16a34a", marginLeft: 8 }}>(Rs {Number(asset.liabilityAmount || 0).toLocaleString()})</span>}
                            {asset.status === "Rejected" && <span style={{ color: "#dc2626", marginLeft: 8 }}>(Rejected)</span>}
                          </span>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              onClick={() => handleAssetDecision(request._id, assetIndex, "Approved")}
                              title="Approve"
                              aria-label="Approve"
                              style={{
                                alignItems: "center",
                                background: "#16a34a",
                                border: "none",
                                borderRadius: 6,
                                color: "white",
                                cursor: "pointer",
                                display: "inline-flex",
                                height: 30,
                                justifyContent: "center",
                                width: 30,
                              }}
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={() => handleAssetDecision(request._id, assetIndex, "Rejected")}
                              title="Reject"
                              aria-label="Reject"
                              style={{
                                alignItems: "center",
                                background: "#ef4444",
                                border: "none",
                                borderRadius: 6,
                                color: "white",
                                cursor: "pointer",
                                display: "inline-flex",
                                height: 30,
                                justifyContent: "center",
                                width: 30,
                              }}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                        {asset.status === "Approved" && (
                          <input type="text" placeholder="Enter Serial Number"
                            value={serialNumbers[`${request._id}-${assetIndex}`] || ""}
                            onChange={(e) => handleSerialNumberChange(request._id, assetIndex, e.target.value)}
                            style={{ marginTop: 6, width: "100%", border: "1px solid #d1d5db", padding: "6px 10px", borderRadius: 4, fontSize: 13 }}
                          />
                        )}
                      </div>
                    ))}
                  </td>
                  <td style={td}>{new Date(request.requestDate).toLocaleDateString()}</td>
                  <td style={td}>{request.status}</td>
                  <td style={td}>
                    {(request.status === "Approved" || request.status === "Partially Approved") && (
                      <button onClick={() => handleFinalize(request._id)}
                        style={{ background: "#3f3d9c", color: "white", border: "none", padding: "5px 12px", borderRadius: 4, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                        Add to Assets
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="7" style={{ textAlign: "center", padding: "20px", color: "#6b7280" }}>No requests</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const td = { padding: "15px", textAlign: "center" };

export default RequisitionList;
