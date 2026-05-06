import React, { useState } from "react";

const Toggle = ({ label, checked, onChange }) => {
  const id = label.replace(/\s+/g, "-").toLowerCase();
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-gray-700 font-medium">{label}</span>
      <label htmlFor={id} className="relative inline-flex items-center cursor-pointer">
        <input id={id} type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
        <div className="w-11 h-6 bg-gray-300 rounded-full peer-focus:ring-2 peer-focus:ring-[#3f3d9c] peer-checked:bg-[#3f3d9c] transition-colors duration-300"></div>
        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 peer-checked:translate-x-5"></div>
      </label>
    </div>
  );
};

const Section = ({ title, children }) => (
  <div className="mb-6 border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
    <div className="bg-gray-100 px-4 py-3 border-l-4 border-[#3f3d9c]">
      <h4 className="text-lg font-semibold text-gray-800">{title}</h4>
    </div>
    <div className="bg-white px-4 py-2">{children}</div>
  </div>
);

const NotificationSetting = () => {
  const [notifications, setNotifications] = useState({
    leaveRequestSubmitted: true,
    leaveApproved: true,
    leaveRejected: true,
    payrollProcessed: true,
    newEmployeeOnboarded: false,
    pendingLeaveBadge: true,
    lowLeaveBalance: true,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  React.useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/notification-settings");
        const data = await res.json();
        if (data?.success && data.settings) {
          setNotifications((current) => ({ ...current, ...data.settings }));
        }
      } catch (error) {
        console.error("Failed to load notification settings:", error);
      }
    };

    load();
  }, []);

  const handleToggle = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/notification-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notifications),
      });
      const data = await res.json();
      if (!data?.success) {
        throw new Error(data?.error || "Save failed");
      }
      setMessage("Notification settings saved successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Failed to save notification settings:", error);
      setMessage(error.message || "Failed to save notification settings");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Notification Settings</h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <Section title="Leave Notifications">
          <Toggle label="Leave Request Submitted" checked={notifications.leaveRequestSubmitted} onChange={() => handleToggle("leaveRequestSubmitted")} />
          <Toggle label="Leave Approved" checked={notifications.leaveApproved} onChange={() => handleToggle("leaveApproved")} />
          <Toggle label="Leave Rejected" checked={notifications.leaveRejected} onChange={() => handleToggle("leaveRejected")} />
        </Section>

        <Section title="Payroll Notifications">
          <Toggle label="Payroll Processed" checked={notifications.payrollProcessed} onChange={() => handleToggle("payrollProcessed")} />
        </Section>

        <Section title="Employee Notifications">
          <Toggle label="New Employee Onboarded" checked={notifications.newEmployeeOnboarded} onChange={() => handleToggle("newEmployeeOnboarded")} />
        </Section>

        <Section title="In-App Alerts">
          <Toggle label="Pending Leave Requests Badge" checked={notifications.pendingLeaveBadge} onChange={() => handleToggle("pendingLeaveBadge")} />
          <Toggle label="Low Leave Balance Warning" checked={notifications.lowLeaveBalance} onChange={() => handleToggle("lowLeaveBalance")} />
        </Section>
      </div>

      <button
        onClick={handleSave}
        disabled={loading}
        className={`w-full py-3 mt-4 text-white font-semibold rounded-lg transition duration-300 ${
          loading ? "bg-[#1a5276] cursor-not-allowed" : "bg-[#3f3d9c] hover:bg-[#2e2c7a]"
        }`}
      >
        {loading ? "Saving..." : "Save Notifications"}
      </button>

      {message && (
        <p className="mt-4 text-center text-green-600 font-semibold">{message}</p>
      )}
    </div>
  );
};

export default NotificationSetting;
