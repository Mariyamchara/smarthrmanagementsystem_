import React from "react";

const COLORS = [
  "#6C63FF",
  "#10B981",
  "#F59E0B",
  "#3f3d9c",
  "#EF4444",
];

const SettingsCard = ({ title, description, preview, onClick, colorIndex = 0 }) => {
  const color = COLORS[colorIndex % COLORS.length];

  return (
    <div
      onClick={onClick}
      style={{
        background: "#fff",
        borderRadius: 14,
        padding: 20,
        border: "1px solid #EAECF0",
        borderLeft: `4px solid ${color}`,
        boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
        cursor: "pointer",
        transition: "transform 0.15s, box-shadow 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.10)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.06)";
      }}
    >
      <div style={{ width: 38, height: 38, background: `${color}18`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
        <div style={{ width: 14, height: 14, background: color, borderRadius: 3 }} />
      </div>
      <p style={{ fontSize: 16, fontWeight: 700, color: "#1A1D23", margin: 0 }}>{title}</p>
      <p style={{ fontSize: 13, color: "#6B7280", marginTop: 6 }}>{description}</p>
      {preview && (
        <p style={{ fontSize: 11.5, color: color, marginTop: 8, fontWeight: 500 }}>{preview}</p>
      )}
      <div style={{ marginTop: 14, textAlign: "right" }}>
        <span style={{ fontSize: 13, color: color, fontWeight: 600 }}>Manage →</span>
      </div>
    </div>
  );
};

export default SettingsCard;
