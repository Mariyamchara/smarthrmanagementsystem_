import React, { useState } from "react";

const DangerZone = () => {
  const [loading, setLoading] = useState({
    export: false,
    resetLeave: false,
    deleteEmployees: false,
  });

  const [message, setMessage] = useState("");

  const handleAction = async (endpoint, key, confirmMessage) => {
    const confirmed = window.confirm(confirmMessage);
    if (!confirmed) return;

    setLoading((prev) => ({ ...prev, [key]: true }));
    setMessage("");

    try {
      const response = await fetch(`/api${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Request failed");

      if (key === "export") {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "hrms-data.json";
        a.click();

        window.URL.revokeObjectURL(url);
        setMessage("Data exported successfully!");
      } else {
        const data = await response.json();
        setMessage(data.message || "Action completed successfully.");
      }
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong.");
    } finally {
      setLoading((prev) => ({ ...prev, [key]: false }));
      setTimeout(() => setMessage(""), 4000);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white shadow-lg rounded-2xl">
      <h1 className="text-2xl font-semibold text-red-600 mb-4">Danger Zone</h1>

      <p className="text-gray-600 mb-8">
        These actions are irreversible. Proceed carefully.
      </p>

      <div className="space-y-4">
        {/* EXPORT */}
        <button
          onClick={() =>
            handleAction("/danger/export", "export", "Export all system data?")
          }
          disabled={loading.export}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg disabled:opacity-60"
        >
          {loading.export ? "Exporting..." : "Export All Data"}
        </button>

        {/* RESET LEAVE */}
        <button
          onClick={() =>
            handleAction(
              "/danger/reset-leave-balances",
              "resetLeave",
              "Reset all leave balances?",
            )
          }
          disabled={loading.resetLeave}
          className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-3 rounded-lg disabled:opacity-60"
        >
          {loading.resetLeave ? "Processing..." : "Reset Leave Balances"}
        </button>

        {/* DELETE EMPLOYEES */}
        <button
          onClick={() =>
            handleAction(
              "/danger/delete-employees",
              "deleteEmployees",
              "Delete ALL employees? This cannot be undone.",
            )
          }
          disabled={loading.deleteEmployees}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg disabled:opacity-60"
        >
          {loading.deleteEmployees ? "Deleting..." : "Delete All Employees"}
        </button>
      </div>

      {message && (
        <p className="mt-6 text-center text-green-600 font-medium">{message}</p>
      )}
    </div>
  );
};

export default DangerZone;
