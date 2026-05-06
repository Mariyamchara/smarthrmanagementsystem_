import React, { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "./sidebar";
import Navbar from "./navbar";

function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F4F5F7" }}>
      <Sidebar isOpen={isSidebarOpen} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Navbar onMenuToggle={() => setIsSidebarOpen((prev) => !prev)} />
        <Outlet />
      </div>
    </div>
  );
}

export default Layout;
