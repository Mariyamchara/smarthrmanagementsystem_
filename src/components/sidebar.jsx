import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  Users,
  CalendarDays,
  Building2,
  Settings,
  UserCircle,
  WalletCards,
  Package,
  ClipboardList,
  LogOut,
} from "lucide-react";
import { clearStoredAdminSession } from "../lib/adminSession";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", path: "/dashboard", icon: Home },
  { id: "employees", label: "Employees", path: "/employees", icon: Users },
  {
    id: "attendance",
    label: "Attendance",
    path: "/attendance",
    icon: ClipboardList,
  },
  { id: "leaves", label: "Leaves", path: "/leaves", icon: CalendarDays },
  {
    id: "departments",
    label: "Departments",
    path: "/departments",
    icon: Building2,
  },
  { id: "salaries", label: "Salaries", path: "/salaries", icon: WalletCards },
  { id: "assets", label: "Assets", path: "/assets", icon: Package },
  { id: "settings", label: "Settings", path: "/settings", icon: Settings },
  { id: "profile", label: "Profile", path: "/profile", icon: UserCircle },
];

function Sidebar({ isOpen = true, onItemClick }) {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 768;
  });

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = () => {
    clearStoredAdminSession();
    navigate("/");
  };

  return (
    <aside
      style={{
        position: "fixed",
        top: 0,
        left: isMobile ? (isOpen ? 0 : "-100%") : 0,
        width: isOpen ? "220px" : isMobile ? "220px" : "72px",
        background: "#3f3d9c",
        color: "white",
        minHeight: "100vh",
        maxHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        transition: isMobile ? "left 0.3s ease" : "width 0.25s ease",
        flexShrink: 0,
        zIndex: 50,
        overflowY: "auto",
      }}
    >
      <div style={{ padding: isOpen ? "24px 16px" : "20px 12px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 32,
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
            }}
          >
            HR
          </div>
          {isOpen && (
            <div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>Smart HR</div>
              <div style={{ fontSize: 12, color: "#9ca3af" }}>Admin Panel</div>
            </div>
          )}
        </div>

        <nav>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id} style={{ marginBottom: 8 }}>
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
                    })}
                    onMouseEnter={(e) => {
                      if (!e.currentTarget.classList.contains("active"))
                        e.currentTarget.style.background = "rgba(0,0,0,0.15)";
                    }}
                    onMouseLeave={(e) => {
                      if (!e.currentTarget.classList.contains("active"))
                        e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <Icon size={18} />
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

export default Sidebar;
