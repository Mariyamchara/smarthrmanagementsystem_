import React from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "./MainLayout";
import EmSettingsCard from "./EmSettingsCard";

const EmpSetting = () => {
  const navigate = useNavigate();

  const settingsItems = [
    {
      title: "Password & Security",
      description: "Update employee password and security settings.",
      preview: "Password protection enabled",
      path: "/employee/settings/security",
    },
    {
      title: "Notifications",
      description: "Configure email and in-app notifications for system events.",
      preview: "Email enabled, SMS disabled",
      path: "/employee/settings/preferences",
    },
    {
      title: "Delete Account",
      description: "Permanently delete employee account.",
      preview: "This action cannot be undone",
      path: "/employee/settings/delete",
    },
    {
      title: "Preferences",
      description: "Manage your personal settings and notification preferences.",
      preview: "Dark mode, notifications, language",
      path: "/employee/settings/preferences",
    },
  ];

  return (
    <MainLayout>
      <div className="page">
        <section className="page-hero">
          <div>
            <h2>Settings</h2>
            <p>Manage your account, security, and employee app preferences.</p>
          </div>
          <small>Employee self service</small>
        </section>

        <div className="settings-grid">
          {settingsItems.map((item) => (
            <EmSettingsCard
              key={item.title}
              title={item.title}
              description={item.description}
              preview={item.preview}
              onClick={() => navigate(item.path)}
            />
          ))}
        </div>
      </div>
    </MainLayout>
  );
};

export default EmpSetting;
