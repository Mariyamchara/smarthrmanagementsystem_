import { NavLink, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  ClipboardList,
  Home,
  LogOut,
  Package,
  Settings,
  UserCircle,
  WalletCards,
} from "lucide-react";
import { clearStoredEmployeeSession } from "../../lib/employeeSession";

const menuItems = [
  { label: "Dashboard", path: "/employee/dashboard", icon: Home },
  { label: "Profile", path: "/employee/profile", icon: UserCircle },
  { label: "Attendance", path: "/employee/attendance", icon: ClipboardList },
  { label: "Salary", path: "/employee/salary", icon: WalletCards },
  { label: "Leave", path: "/employee/leave", icon: CalendarDays },
  { label: "Assets", path: "/employee/assets", icon: Package },
  { label: "Settings", path: "/employee/settings", icon: Settings },
];

export default function Sidebar({ isOpen = true, onItemClick, isMobile }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearStoredEmployeeSession();
    navigate("/");
  };

  return (
    <aside
      style={{
        position: "fixed",
        top: 0,
        left: isMobile ? (isOpen ? 0 : "-100%") : 0,
        width: isOpen ? "220px" : isMobile ? "220px" : "72px",
        minHeight: "100vh",
        maxHeight: "100vh",
        background: "#3f3d9c",
        color: "white",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        transition: isMobile ? "left 0.3s ease" : "width 0.25s ease",
        flexShrink: 0,
        zIndex: 25,
      }}
    >
      {/* Brand */}
      <div style={{ padding: isOpen ? "24px 16px" : "20px 12px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 32,
            background: "rgba(255,255,255,0.15)",
            borderRadius: 16,
            padding: "18px 16px",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              background: "#2e2c7a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            HR
          </div>
          {isOpen && (
            <div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>Smart HR</div>
              <div style={{ fontSize: 12, color: "#c7d2fe" }}>Employee Panel</div>
            </div>
          )}
        </div>

        {/* Nav links */}
        <nav>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path} style={{ marginBottom: 8 }}>
                  <NavLink
                    to={item.path}
                    onClick={() => onItemClick?.()}
                    style={({ isActive }) => ({
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 14px",
                      borderRadius: 12,
                      color: isActive ? "#f8fafc" : "#d1d5db",
                      background: isActive
                        ? "rgba(255,255,255,0.2)"
                        : "transparent",
                      textDecoration: "none",
                      transition: "background 0.2s ease",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                    })}
                    onMouseEnter={(e) => {
                      if (!e.currentTarget.getAttribute("aria-current"))
                        e.currentTarget.style.background = "rgba(0,0,0,0.15)";
                    }}
                    onMouseLeave={(e) => {
                      if (!e.currentTarget.getAttribute("aria-current"))
                        e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <Icon size={18} style={{ flexShrink: 0 }} />
                    {isOpen && (
                      <span style={{ fontSize: 14, fontWeight: 500 }}>
                        {item.label}
                      </span>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Logout pinned to bottom */}
      <div style={{ marginTop: "auto", padding: isOpen ? "16px" : "16px 12px" }}>
        <button
          onClick={handleLogout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            width: "100%",
            padding: "10px 14px",
            borderRadius: 12,
            border: "none",
            background: "rgba(255,255,255,0.1)",
            color: "#d1d5db",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 500,
            transition: "background 0.2s ease",
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.25)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
        >
          <LogOut size={18} style={{ flexShrink: 0 }} />
          {isOpen && <span>Log Out</span>}
        </button>
      </div>
    </aside>
  );
}
