import { NavLink } from "react-router-dom";
import {
  CalendarDays,
  ClipboardList,
  Home,
  Package,
  Settings,
  UserCircle,
  WalletCards,
} from "lucide-react";

const menuItems = [
  { label: "Dashboard", path: "/employee/dashboard", icon: Home },
  { label: "Profile", path: "/employee/profile", icon: UserCircle },
  { label: "Attendance", path: "/employee/attendance", icon: ClipboardList },
  { label: "Salary", path: "/employee/salary", icon: WalletCards },
  { label: "Leave", path: "/employee/leave", icon: CalendarDays },
  { label: "Assets", path: "/employee/assets", icon: Package },
  { label: "Settings", path: "/employee/settings", icon: Settings },
];

export default function Sidebar({ isOpen = true }) {
  return (
    <aside className={`sidebar${isOpen ? "" : " sidebar-collapsed"}`}>
      <div className="sidebar-brand">
        <div className="sidebar-brand-badge">HR</div>

        {isOpen && (
          <div>
            <h2>Smart HR</h2>
            <p>Employee Panel</p>
          </div>
        )}
      </div>

      <nav className="sidebar-menu">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink className="sidebar-link" to={item.path} key={item.path}>
              <Icon size={18} />
              {isOpen && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
