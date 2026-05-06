import { fetchJson } from "./http";

const KEY = "payroll-config";

export const defaultPayrollConfig = {
  defaultCurrency: "INR",
  payCycle: "Monthly",
  defaultTdsRate: 10,
  overtimeRateMultiplier: 1.5,
  emailPayslip: true,
  autoGeneratePayslips: true,
};

export function getPayrollConfig() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...defaultPayrollConfig, ...JSON.parse(raw) } : { ...defaultPayrollConfig };
  } catch {
    return { ...defaultPayrollConfig };
  }
}

export function savePayrollConfig(config) {
  localStorage.setItem(KEY, JSON.stringify(config));
  window.dispatchEvent(new CustomEvent("payroll-config-updated", { detail: config }));
}

export async function fetchPayrollConfigFromServer() {
  const data = await fetchJson("/api/payroll-config");

  if (!data?.success) {
    throw new Error(data?.error || "Failed to load payroll config");
  }

  const config = { ...defaultPayrollConfig, ...(data.config || {}) };
  savePayrollConfig(config);
  return config;
}

export async function savePayrollConfigToServer(config) {
  const data = await fetchJson("/api/payroll-config", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });

  if (!data?.success) {
    throw new Error(data?.error || "Failed to save payroll config");
  }

  const nextConfig = { ...defaultPayrollConfig, ...(data.config || {}) };
  savePayrollConfig(nextConfig);
  return nextConfig;
}

export function subscribeToPayrollConfig(listener) {
  const handler = (e) => listener(e.detail);
  window.addEventListener("payroll-config-updated", handler);
  return () => window.removeEventListener("payroll-config-updated", handler);
}

export const CURRENCY_SYMBOLS = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
};
