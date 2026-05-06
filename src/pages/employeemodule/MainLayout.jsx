import { useState } from "react";
import "./index.css";
import EmployeeNavbar from "./EmployeeNavbar";
import Sidebar from "./Sidebar";

export default function MainLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="app-shell">
      <Sidebar isOpen={isSidebarOpen} />

      <div className={`app-main${isSidebarOpen ? "" : " app-main-expanded"}`}>
        <EmployeeNavbar onMenuToggle={() => setIsSidebarOpen((prev) => !prev)} />
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
