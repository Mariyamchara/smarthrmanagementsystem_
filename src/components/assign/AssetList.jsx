import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { assetsApi } from "../../lib/assetsApi";

const AssetList = () => {
  const [assets, setAssets] = useState([]);
  const [searchEmpId, setSearchEmpId] = useState("");

  useEffect(() => {
    let isActive = true;

    assetsApi
      .getAll()
      .then((data) => {
        if (isActive) {
          setAssets(data);
        }
      })
      .catch((error) => {
        console.error("Error fetching assets:", error);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const filteredAssets = assets.filter((item) =>
    item.employeeId?.toLowerCase().includes(searchEmpId.toLowerCase())
  );

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this asset record?")) return;
    try {
      await assetsApi.delete(id);
      setAssets((prev) => prev.filter((item) => item._id !== id));
    } catch (error) {
      console.error("Error deleting asset:", error);
    }
  };

  const handleAssetStatusChange = async (assetRecordId, assetIndex, newStatus) => {
    try {
      const assetRecord = assets.find((item) => item._id === assetRecordId);
      if (!assetRecord) return;

      if (newStatus === "Returned" || newStatus === "Not Returned") {
        const confirmed = window.confirm(`Are you sure you want to mark this asset as ${newStatus}?`);
        if (!confirmed) return;
      }

      const updatedAssets = assetRecord.assets.map((asset, index) =>
        index === assetIndex
          ? {
              ...asset,
              status: newStatus,
              originalLiabilityAmount:
                asset.originalLiabilityAmount ?? Number(asset.liabilityAmount || 0),
              liabilityAmount:
                newStatus === "Returned"
                  ? 0
                  : newStatus === "Assigned" || newStatus === "Not Returned"
                    ? Number(asset.originalLiabilityAmount ?? asset.liabilityAmount ?? 0)
                    : Number(asset.liabilityAmount || 0),
            }
          : asset
      );
      const updatedRecord = await assetsApi.update(assetRecordId, {
        employeeName: assetRecord.employeeName,
        assignedDate: assetRecord.assignedDate,
        assets: updatedAssets,
      });
      setAssets((prev) => prev.map((item) => (item._id === assetRecordId ? updatedRecord : item)));
    } catch (error) {
      console.error("Error updating asset status:", error);
    }
  };

  const calculateTotalLiability = (assetItems) =>
    assetItems?.reduce((total, asset) => total + Number(asset.liabilityAmount || 0), 0) || 0;

  const copyToClipboard = async (serialNumber) => {
    await navigator.clipboard.writeText(serialNumber);
    alert(`Serial Number ${serialNumber} copied`);
  };

  return (
    <div>
      {/* Search + View Requisitions */}
      <div style={{ background: "white", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 0 }}>
        <input
          type="text"
          placeholder="Search by Employee ID..."
          value={searchEmpId}
          onChange={(e) => setSearchEmpId(e.target.value)}
          style={{ padding: "8px 14px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px", width: "260px" }}
        />
        <Link to="/assets?tab=requisitions"
          style={{ background: "#3f3d9c", color: "white", padding: "9px 18px", borderRadius: "6px", textDecoration: "none", fontWeight: "600", fontSize: "14px" }}>
          View Requisitions
        </Link>
      </div>

      {/* Table */}
      <div style={{ background: "white", borderRadius: "0 0 8px 8px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)", overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ backgroundColor: "#9ca3af", color: "white" }}>
            <tr>
              {["S.No", "Employee ID", "Employee", "Assets", "Total Liability (Rs)", "Assigned Date", "Actions"].map((h) => (
                <th key={h} style={{ padding: "15px", textAlign: "center", fontWeight: "600" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredAssets.length > 0 ? (
              filteredAssets.map((item, index) => (
                <tr key={item._id} style={{ borderTop: "1px solid #e5e7eb" }}>
                  <td style={td}>{index + 1}</td>
                  <td style={td}>{item.employeeId || "N/A"}</td>
                  <td style={td}>{item.employeeName}</td>
                  <td style={td}>
                    {item.assets?.map((asset, assetIndex) => (
                      <div key={`${item._id}-${assetIndex}`} style={{ marginBottom: 8, padding: 8, border: "1px solid #e5e7eb", borderRadius: 6, background: "#f9fafb" }}>
                        <div style={{ fontWeight: 600 }}>{asset.name} - Rs {Number(asset.liabilityAmount || 0).toLocaleString()}</div>
                        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                          Serial: <strong>{asset.serialNumber || "N/A"}</strong>
                          {asset.serialNumber && (
                            <button onClick={() => copyToClipboard(asset.serialNumber)}
                              style={{ marginLeft: 8, color: "#3f3d9c", background: "none", border: "none", cursor: "pointer", fontSize: 12, textDecoration: "underline" }}>
                              Copy
                            </button>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                          {["Assigned", "Returned", "Not Returned"].map((status) => (
                            <button key={status}
                              onClick={() => handleAssetStatusChange(item._id, assetIndex, status)}
                              style={{ padding: "3px 8px", borderRadius: 4, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600,
                                background: asset.status === status ? "#3f3d9c" : "#e5e7eb",
                                color: asset.status === status ? "white" : "#374151" }}>
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </td>
                  <td style={{ ...td, fontWeight: 600 }}>Rs {calculateTotalLiability(item.assets).toLocaleString()}</td>
                  <td style={td}>{item.assignedDate ? new Date(item.assignedDate).toLocaleDateString() : "N/A"}</td>
                  <td style={td}>
                    <button onClick={() => handleDelete(item._id)}
                      style={{ background: "#ef4444", color: "white", border: "none", padding: "5px 10px", borderRadius: 4, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="7" style={{ textAlign: "center", padding: "20px", color: "#6b7280" }}>
                {searchEmpId ? "No matching employee found" : "No assets found"}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const td = { padding: "15px", textAlign: "center" };

export default AssetList;
