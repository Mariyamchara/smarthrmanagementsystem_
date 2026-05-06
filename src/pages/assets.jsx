import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import AssetList from "../components/assign/AssetList";
import RequisitionList from "../components/assign/RequisitionList";

const tabs = [
  { id: "assets", label: "Manage Assets" },
  { id: "requisitions", label: "Requisitions" },
];

export default function AssetsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "assets";

  const activeView = useMemo(() => {
    return activeTab === "assets" ? <AssetList /> : <RequisitionList />;
  }, [activeTab]);

  return (
    <div style={{ backgroundColor: "#f3f4f6", minHeight: "100vh" }}>

      {/* Page Header */}
      <div style={{ background: "#3f3d9c", color: "white", textAlign: "center", padding: "25px", borderRadius: "8px 8px 0 0", margin: "30px 30px 0" }}>
        <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "bold" }}>Assets</h1>
        <p style={{ marginTop: "10px", fontSize: "16px" }}>Manage assigned assets and approval requests together</p>
      </div>

      <div style={{ padding: "20px 30px 30px" }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 10, background: "#fff", padding: 6, borderRadius: 12, border: "1px solid #e5e7eb", marginBottom: 20, width: "fit-content" }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSearchParams({ tab: tab.id })}
              style={{
                border: "none", borderRadius: 10, padding: "10px 14px", cursor: "pointer",
                background: activeTab === tab.id ? "#3f3d9c" : "transparent",
                color: activeTab === tab.id ? "#fff" : "#374151",
                fontWeight: 600,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeView}
      </div>
    </div>
  );
}
