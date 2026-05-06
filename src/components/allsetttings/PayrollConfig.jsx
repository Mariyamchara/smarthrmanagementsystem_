import React, { useState, useEffect } from "react";
import {
  fetchPayrollConfigFromServer,
  getPayrollConfig,
  savePayrollConfigToServer,
} from "../../lib/payrollConfig";

/* Toggle Component */
const Toggle = ({ label, checked, onChange }) => (
  <div className="flex items-center justify-between py-3">
    <span className="text-gray-700 font-medium">{label}</span>
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={onChange}
      />
      <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-[#3f3d9c] transition-colors duration-300"></div>
      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 peer-checked:translate-x-5"></div>
    </label>
  </div>
);

const PayrollConfig = () => {
  const [config, setConfig] = useState(() => getPayrollConfig());
  const [initialConfig, setInitialConfig] = useState(() => getPayrollConfig());
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const cfg = await fetchPayrollConfigFromServer();
        setConfig(cfg);
        setInitialConfig(cfg);
      } catch (error) {
        console.error("Failed to load payroll config:", error);
        const cfg = getPayrollConfig();
        setConfig(cfg);
        setInitialConfig(cfg);
      }
    };

    load();
  }, []);

  /* Handle input changes */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig((prev) => ({
      ...prev,
      [name]:
        name === "defaultTdsRate" || name === "overtimeRateMultiplier"
          ? Number(value)
          : value,
    }));
  };

  /* Handle toggle changes */
  const handleToggle = (key) => {
    setConfig((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage("");
    try {
      const saved = await savePayrollConfigToServer(config);
      setConfig(saved);
      setInitialConfig(saved);
      setMessage("Payroll configuration saved successfully!");
    } catch {
      setMessage("Error saving payroll configuration.");
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  /* Cancel changes */
  const handleCancel = () => {
    setConfig(initialConfig);
    setMessage("Changes reverted.");
    setTimeout(() => setMessage(""), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-2xl shadow-lg">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
        Payroll Configuration
      </h2>

      {/* Default Currency */}
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2">
          Default Currency
        </label>
        <select
          name="defaultCurrency"
          value={config.defaultCurrency}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-[#3f3d9c]"
        >
          <option value="INR">INR - Indian Rupee</option>
          <option value="USD">USD - US Dollar</option>
          <option value="EUR">EUR - Euro</option>
          <option value="GBP">GBP - British Pound</option>
        </select>
      </div>

      {/* Pay Cycle */}
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2">
          Pay Cycle
        </label>
        <select
          name="payCycle"
          value={config.payCycle}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-[#3f3d9c]"
        >
          <option value="Weekly">Weekly</option>
          <option value="Bi-Weekly">Bi-Weekly</option>
          <option value="Monthly">Monthly</option>
        </select>
      </div>

      {/* Default TDS Rate */}
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2">
          Default TDS Rate (%)
        </label>
        <input
          type="number"
          name="defaultTdsRate"
          value={config.defaultTdsRate}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-[#3f3d9c]"
          min="0"
          max="100"
        />
      </div>

      {/* Overtime Rate Multiplier */}
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2">
          Overtime Rate Multiplier
        </label>
        <input
          type="number"
          step="0.1"
          name="overtimeRateMultiplier"
          value={config.overtimeRateMultiplier}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-[#3f3d9c]"
          min="1"
        />
      </div>

      {/* Toggles */}
      <Toggle
        label="Email Payslip to Employee"
        checked={config.emailPayslip}
        onChange={() => handleToggle("emailPayslip")}
      />
      <Toggle
        label="Auto-Generate Payslips"
        checked={config.autoGeneratePayslips}
        onChange={() => handleToggle("autoGeneratePayslips")}
      />

      {/* Buttons */}
      <div className="flex justify-end gap-4 mt-6">
        <button
          onClick={handleCancel}
          className="px-5 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          className={`px-5 py-2 text-white rounded-lg transition ${
            loading
              ? "bg-[#1a5276] cursor-not-allowed"
              : "bg-[#3f3d9c] hover:bg-[#2e2c7a]"
          }`}
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>

      {/* Message */}
      {message && (
        <p className="mt-4 text-center text-green-600 font-semibold">
          {message}
        </p>
      )}
    </div>
  );
};

export default PayrollConfig;
