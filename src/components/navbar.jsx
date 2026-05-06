import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AlignJustify } from "lucide-react";
import { getAdminProfile } from "../lib/adminProfileApi";
import {
  clearStoredAdminSession,
  getStoredAdminSession,
  setStoredAdminSession,
  subscribeToAdminSession,
} from "../lib/adminSession";

const ROUTE_LABELS = {
  dashboard: "Dashboard",
  employees: "Employees",
  attendance: "Attendance",
  leaves: "Leaves",
  departments: "Departments",
  add: "Add",
  edit: "Edit",
  settings: "Settings",
  security: "Security",
  notifications: "Notifications",
  leave: "Leave Policy",
  salary: "Payroll Config",
  danger: "Danger Zone",
  profile: "Profile",
  salaries: "Salaries",
  assets: "Assets",
};

function Breadcrumb() {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return null;
  }

  const crumbs = segments.map((seg, i) => {
    const path = "/" + segments.slice(0, i + 1).join("/");
    const label = ROUTE_LABELS[seg] || seg.charAt(0).toUpperCase() + seg.slice(1);
    const isLast = i === segments.length - 1;
    return { path, label, isLast };
  });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "#6b7280" }}>
      <Link to="/dashboard" style={{ color: "#6b7280", textDecoration: "none" }}>Home</Link>
      {crumbs.map((crumb) => (
        <React.Fragment key={crumb.path}>
          <span style={{ color: "#d1d5db" }}>›</span>
          {crumb.isLast ? (
            <span style={{ color: "#111827", fontWeight: 600 }}>{crumb.label}</span>
          ) : (
            <Link to={crumb.path} style={{ color: "#6b7280", textDecoration: "none" }}
              onMouseEnter={(e) => (e.target.style.color = "#3f3d9c")}
              onMouseLeave={(e) => (e.target.style.color = "#6b7280")}>
              {crumb.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function Navbar({ onMenuToggle }) {
  const navigate = useNavigate();
  const [adminProfile, setAdminProfile] = useState(() => getStoredAdminSession());

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await getAdminProfile();
        setAdminProfile(profile);
        setStoredAdminSession(profile);
      } catch (error) {
        console.error("Failed to load admin profile for navbar:", error);
      }
    };

    loadProfile();
    return subscribeToAdminSession(setAdminProfile);
  }, []);

  const initials = useMemo(() => {
    const source = adminProfile?.name || "Admin";
    return source
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }, [adminProfile?.name]);

  const handleLogout = () => {
    clearStoredAdminSession();
    navigate("/");
  };

  return (
    <div style={{
      height: "60px",
      background: "white",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "0 20px",
      borderBottom: "1px solid #e5e7eb"
    }}>
      
      {/* Left */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          type="button"
          onClick={onMenuToggle}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 36,
            borderRadius: 999,
            border: "none",
            background: "#F3F4F6",
            color: "#1F2937",
            cursor: "pointer",
          }}
          aria-label="Toggle sidebar"
        >
          <AlignJustify size={18} />
        </button>
        <Breadcrumb />
      </div>

      {/* Right */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "#3f3d9c",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {initials || "AD"}
          </div>
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{adminProfile?.name || "Admin"}</div>
            <div style={{ fontSize: 11, color: "#6b7280" }}>
              {adminProfile?.email || adminProfile?.username || ""}
            </div>
          </div>
        </div>
        <button onClick={handleLogout} style={{ marginRight: "10px", padding: "7px 16px", borderRadius: 8, border: "none", background: "#3f3d9c", color: "white", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Log Out</button>
      </div>

    </div>
  );
}

export default Navbar;
