import { useEffect, useState } from "react";
import "./index.css";
import EmployeeNavbar from "./EmployeeNavbar";
import Sidebar from "./Sidebar";

export default function MainLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 768;
  });

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f5f7fb" }}>
      <Sidebar
        isOpen={isSidebarOpen}
        isMobile={isMobile}
        onItemClick={() => isMobile && setIsSidebarOpen(false)}
      />

      {/* Mobile overlay */}
      {isSidebarOpen && isMobile && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.3)",
            zIndex: 24,
          }}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          marginLeft: isMobile ? 0 : isSidebarOpen ? "220px" : "72px",
          transition: "margin-left 0.25s ease",
        }}
      >
        <EmployeeNavbar onMenuToggle={() => setIsSidebarOpen((prev) => !prev)} />
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
