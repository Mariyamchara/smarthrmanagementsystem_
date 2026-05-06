import React from "react";
import { useNavigate } from "react-router-dom";
import SettingsCard from "../components/allsetttings/SettingsCard";

const settingsItems = [
  { title: "Password & Security", description: "Update your password and manage security preferences.", preview: "Last updated recently", path: "/settings/security" },
  { title: "Notifications", description: "Configure email and in-app notifications for system events.", preview: "Email: Enabled, SMS: Disabled", path: "/settings/notifications" },
  { title: "Leave Policy", description: "Define leave types, quotas, and carry-forward policies.", preview: "Casual: 12, Sick: 10, Earned: 15", path: "/settings/leave" },
  { title: "Payroll Configuration", description: "Manage payslip generation and default currency settings.", preview: "Currency: INR, Payslip: Auto", path: "/settings/salary" },
  { title: "Database Backup", description: "Download a MySQL SQL dump of your HRMS database.", preview: "SQL dump", path: "/settings/backup" },
  { title: "Danger Zone", description: "Manage high-risk administrative operations like data export and bulk deletions.", preview: "Export • Reset • Delete", path: "/settings/danger" },
];

export default function Settings() {
  const navigate = useNavigate();

  return (
    <div style={{ backgroundColor: "#f3f4f6", minHeight: "100vh" }}>
      <div style={{ background: "#3f3d9c", color: "white", textAlign: "center", padding: "14px 25px", borderRadius: "8px 8px 0 0", margin: "30px 30px 0" }}>
        <h1 style={{ margin: 0, fontSize: "20px", fontWeight: "bold" }}>Settings</h1>
        <p style={{ marginTop: "4px", fontSize: "13px" }}>Manage your system preferences and configurations</p>
      </div>
      <div style={{ padding: "20px 30px 30px" }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {settingsItems.map((item, index) => (
            <SettingsCard
              key={item.path}
              title={item.title}
              description={item.description}
              preview={item.preview}
              colorIndex={index}
              onClick={() => navigate(item.path)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
