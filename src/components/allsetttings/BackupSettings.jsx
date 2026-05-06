import React, { useState } from "react";

export default function BackupSettings() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleBackup = async () => {
    setLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const res = await fetch("/api/backup");
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error(
            'Backup endpoint not found (HTTP 404). Start/restart the backend: "cd myproj" then "npm.cmd run server".'
          );
        }

        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Backup failed (HTTP ${res.status}).`);
        }

        const text = await res.text().catch(() => "");
        const trimmed = String(text).replace(/\s+/g, " ").trim();
        throw new Error(
          trimmed
            ? `Backup failed (HTTP ${res.status}): ${trimmed}`
            : `Backup failed (HTTP ${res.status}).`
        );
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const disposition = res.headers.get("content-disposition") || "";
      const match = disposition.match(/filename="([^"]+)"/i);
      const filename =
        match?.[1] ||
        `hrms-backup-${new Date().toISOString().slice(0, 10)}.sql`;

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();

      // Revoke a bit later so slower browsers can start the download.
      window.setTimeout(() => window.URL.revokeObjectURL(url), 10_000);
      setIsError(false);
      setMessage("Backup downloaded successfully.");
    } catch (error) {
      setIsError(true);
      setMessage(error.message || "Failed to download backup.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-semibold mb-2">Backup</h1>
      <p className="text-sm text-gray-600 mb-6">
        Download a full MySQL SQL dump of your HRMS database.
      </p>

      <div className="max-w-xl bg-white p-6 rounded-xl shadow border">
        {message ? (
          <p
            className={`mb-4 text-sm ${
              isError ? "text-red-600" : "text-green-600"
            }`}
          >
            {message}
          </p>
        ) : null}

        <button
          type="button"
          onClick={handleBackup}
          disabled={loading}
          className={`w-full py-2 rounded font-semibold transition ${
            loading
              ? "bg-gray-300 text-gray-700 cursor-not-allowed"
              : "bg-[#3f3d9c] text-white hover:bg-[#2e2c7a]"
          }`}
        >
          {loading ? "Preparing SQL dump..." : "Download SQL Backup"}
        </button>

        <p className="text-xs text-gray-500 mt-3">
          This export contains database schema and data in SQL format.
        </p>
      </div>
    </div>
  );
}
