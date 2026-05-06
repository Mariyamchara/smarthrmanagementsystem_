import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminLogin } from "../lib/adminLoginApi";
import { setStoredAdminSession } from "../lib/adminSession";

export default function AdminLogin() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const session = await adminLogin(form.username, form.password);
      setStoredAdminSession(session);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <div className="bg-[#2e2c7a] text-white px-8 py-4 shadow-md">
        <h1 className="text-xl font-bold">SmartHR</h1>
      </div>

      <div className="flex items-center justify-center min-h-[90vh] px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border-l-4 border-[#3f3d9c] p-8">
          <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">Admin Login</h2>

          {error && (
            <div className="mb-4 px-4 py-2 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Email or Username</label>
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="Enter admin email or username"
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#3f3d9c]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter password"
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#3f3d9c]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#3f3d9c] hover:bg-[#2e2c7a] text-white font-semibold py-2 rounded-lg transition disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Login"}
            </button>

            <p onClick={() => navigate("/forgot-password")}
              className="text-center text-sm text-slate-500 hover:text-[#3f3d9c] cursor-pointer transition">
              Forgot Password?
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
