import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminLogin } from "../lib/adminLoginApi";
import { setStoredAdminSession } from "../lib/adminSession";
import { employeeLogin } from "../lib/employeeAuthApi";
import { setStoredEmployeeSession } from "../lib/employeeSession";

export default function SmartHRFrontPage() {
  const navigate = useNavigate();
  const [adminForm, setAdminForm] = useState({ username: "", password: "" });
  const [employeeForm, setEmployeeForm] = useState({
    employeeId: "",
    password: "",
    remember: false,
  });
  const [adminError, setAdminError] = useState("");
  const [employeeError, setEmployeeError] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);
  const [employeeLoading, setEmployeeLoading] = useState(false);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setAdminError("");
    setAdminLoading(true);

    try {
      const session = await adminLogin(adminForm.username, adminForm.password);
      setStoredAdminSession(session);
      navigate("/dashboard");
    } catch (err) {
      setAdminError(err.message || "Unable to connect to server");
    } finally {
      setAdminLoading(false);
    }
  };

  const handleEmployeeChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEmployeeForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleEmployeeLogin = async (e) => {
    e.preventDefault();
    setEmployeeError("");
    setEmployeeLoading(true);

    try {
      const session = await employeeLogin({
        employeeId: employeeForm.employeeId,
        password: employeeForm.password,
      });
      setStoredEmployeeSession(session);
      navigate("/employee/dashboard");
    } catch (err) {
      setEmployeeError(err.message || "Unable to connect to server");
    } finally {
      setEmployeeLoading(false);
    }
  };

  return (
    <div
      style={{
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        background: "#f1f5f9",
        minHeight: "100vh",
        color: "#1e293b",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp .4s ease forwards; }
        .fade-up-1 { animation: fadeUp .4s ease .05s forwards; opacity: 0; }
      `}</style>

      <nav
        style={{
          background: "#2e2c7a",
          height: 56,
          display: "flex",
          alignItems: "center",
          padding: "0 32px",
        }}
      />

      <div
        className="fade-up"
        style={{
          background: "linear-gradient(135deg, #3f3d9c, #5a57d6)",
          padding: "32px 32px 24px",
          textAlign: "center",
          borderBottom: "1px solid #2e2c7a",
        }}
      >
        <h1
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: "#fff",
            lineHeight: 1.15,
            margin: "0 auto 12px",
          }}
        >
          Smart HR Management System
        </h1>
        <p
          style={{
            fontSize: 15,
            color: "#e0e7ff",
            maxWidth: 680,
            margin: "0 auto",
            lineHeight: 1.7,
          }}
        >
          Sign in to the right workspace for your role. Admins can manage HR
          operations, while employees can access their self service pages.
        </p>
      </div>

      <div
        className="fade-up-1"
        style={{
          display: "grid",
          gap: 24,
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          maxWidth: 920,
          margin: "0 auto",
          padding: "32px 32px 60px",
        }}
      >
        <div
          style={{
            width: "100%",
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 8px 32px rgba(0,0,0,0.10)",
            borderLeft: "4px solid #3f3d9c",
            padding: "28px",
          }}
        >
          <h2
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#3f3d9c",
              marginBottom: 6,
            }}
          >
            Admin Login
          </h2>
          <p style={{ fontSize: 13, color: "#64748b", marginBottom: 24 }}>
            Sign in to access the HR management dashboard.
          </p>

          {adminError && (
            <div
              style={{
                marginBottom: 16,
                padding: "10px 14px",
                background: "#fee2e2",
                border: "1px solid #fecaca",
                color: "#dc2626",
                borderRadius: 8,
                fontSize: 13,
              }}
            >
              {adminError}
            </div>
          )}

          <form
            onSubmit={handleAdminLogin}
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            <div>
              <label
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#374151",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Email or Username
              </label>
              <input
                type="text"
                name="username"
                value={adminForm.username}
                onChange={(e) =>
                  setAdminForm({ ...adminForm, username: e.target.value })
                }
                placeholder="Enter admin email or username"
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "1px solid #d1d5db",
                  borderRadius: 8,
                  fontSize: 14,
                  outline: "none",
                  background: "#f8fafc",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#374151",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Password
              </label>
              <input
                type="password"
                name="password"
                value={adminForm.password}
                onChange={(e) =>
                  setAdminForm({ ...adminForm, password: e.target.value })
                }
                placeholder="Enter password"
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "1px solid #d1d5db",
                  borderRadius: 8,
                  fontSize: 14,
                  outline: "none",
                  background: "#f8fafc",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={adminLoading}
              style={{
                width: "100%",
                padding: "11px",
                borderRadius: 8,
                border: "none",
                background: "#3f3d9c",
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                opacity: adminLoading ? 0.7 : 1,
              }}
            >
              {adminLoading ? "Signing in..." : "Login"}
            </button>

            <p
              onClick={() => navigate("/forgot-password")}
              style={{
                textAlign: "center",
                fontSize: 13,
                color: "#3f3d9c",
                cursor: "pointer",
              }}
            >
              Forgot Password?
            </p>
          </form>
        </div>

        <div
          style={{
            width: "100%",
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 8px 32px rgba(0,0,0,0.10)",
            borderLeft: "4px solid #5a57d6",
            padding: "28px",
          }}
        >
          <h2
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#3f3d9c",
              marginBottom: 6,
            }}
          >
            Employee Login
          </h2>
          <p style={{ fontSize: 13, color: "#64748b", marginBottom: 24 }}>
            Sign in to open your employee self service module.
          </p>

          {employeeError && (
            <div
              style={{
                marginBottom: 16,
                padding: "10px 14px",
                background: "#fee2e2",
                border: "1px solid #fecaca",
                color: "#dc2626",
                borderRadius: 8,
                fontSize: 13,
              }}
            >
              {employeeError}
            </div>
          )}

          <form
            onSubmit={handleEmployeeLogin}
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            <div>
              <label
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#374151",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Employee ID
              </label>
              <input
                type="text"
                name="employeeId"
                value={employeeForm.employeeId}
                onChange={handleEmployeeChange}
                placeholder="Enter employee ID"
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "1px solid #d1d5db",
                  borderRadius: 8,
                  fontSize: 14,
                  outline: "none",
                  background: "#f8fafc",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#374151",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Password
              </label>
              <input
                type="password"
                name="password"
                value={employeeForm.password}
                onChange={handleEmployeeChange}
                placeholder="Enter password"
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "1px solid #d1d5db",
                  borderRadius: 8,
                  fontSize: 14,
                  outline: "none",
                  background: "#f8fafc",
                }}
              />
            </div>



            <button
              type="submit"
              disabled={employeeLoading}
              style={{
                width: "100%",
                padding: "11px",
                borderRadius: 8,
                border: "none",
                background: "#3f3d9c",
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                opacity: employeeLoading ? 0.7 : 1,
              }}
            >
              {employeeLoading ? "Signing in..." : "Login"}
            </button>

            <p
              onClick={() => navigate("/forgot-password?type=employee")}
              style={{
                textAlign: "center",
                fontSize: 13,
                color: "#3f3d9c",
                cursor: "pointer",
              }}
            >
              Forgot Password?
            </p>

          </form>
        </div>
      </div>
    </div>
  );
}
