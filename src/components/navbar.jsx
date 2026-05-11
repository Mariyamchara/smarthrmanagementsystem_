import React from "react";
import { ChevronLeft, Menu } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import "../pages/employeemodule/index.css";

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

function getBreadcrumbs(pathname) {
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = [{ label: "Home" }];

  segments.forEach((segment, index) => {
    if (index === 0 && segment === "dashboard") return;
    breadcrumbs.push({
      label: ROUTE_LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
    });
  });

  return breadcrumbs;
}

function Navbar({ onMenuToggle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const breadcrumbs = getBreadcrumbs(location.pathname);

  const handleBack = () => {
    if (window.history.length > 1) { navigate(-1); return; }
    navigate("/dashboard");
  };

  return (
    <header className="employee-navbar">
      <div className="employee-navbar-left">
        <button
          type="button"
          className="employee-icon-btn employee-menu-btn"
          onClick={onMenuToggle}
          aria-label="Toggle sidebar"
        >
          <Menu size={18} />
        </button>

        <button
          type="button"
          className="employee-back-btn"
          onClick={handleBack}
          aria-label="Go back"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="employee-breadcrumbs" aria-label="Breadcrumb">
          {breadcrumbs.map((item, index) => (
            <span className="employee-breadcrumb-item" key={`${item.label}-${index}`}>
              {index > 0 && <span className="employee-breadcrumb-separator">{">"}</span>}
              <span
                className={
                  index === breadcrumbs.length - 1
                    ? "employee-breadcrumb-current"
                    : "employee-breadcrumb-link"
                }
              >
                {item.label}
              </span>
            </span>
          ))}
        </div>
      </div>

      <div className="employee-navbar-right" />
    </header>
  );
}

export default Navbar;
