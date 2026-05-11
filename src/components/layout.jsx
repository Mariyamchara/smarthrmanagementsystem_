import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "./sidebar";
import Navbar from "./navbar";

function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.innerWidth >= 768;
  });
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

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleMenuToggle = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const handleSidebarClose = () => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F4F5F7" }}>
      <Sidebar isOpen={isSidebarOpen} onItemClick={handleSidebarClose} />
      {isSidebarOpen && isMobile && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.3)",
            zIndex: 40,
          }}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Navbar onMenuToggle={handleMenuToggle} />
        <Outlet />
      </div>
    </div>
  );
}

export default Layout;
