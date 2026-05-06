import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Portal from "./mainfolder/portal";
import AdminLogin from "./pages/adminlogin";
import Layout from "./components/layout";
import Dashboard from "./pages/dashboard";
import Profile from "./pages/profile";
import Employees from "./pages/employees";
import Leaves from "./pages/leaves";
import Departments from "./pages/departments";
import Settings from "./pages/settings";
import Salaries from "./pages/salaries";
import Assets from "./pages/assets";
import Attendance from "./pages/attendance";
import AddDepartment from "./components/departments/AddDepartment";
import EditDepartment from "./components/departments/EditDepartment";
import EditAsset from "./components/assign/EditAsset";
import SecuritySettings from "./components/allsetttings/SecuritySettings";
import NotificationSettings from "./components/allsetttings/NotificationSettings";
import LeavePolicy from "./components/allsetttings/LeavePolicy";
import PayrollConfig from "./components/allsetttings/PayrollConfig";
import DangerZone from "./components/allsetttings/DangerZone";
import BackupSettings from "./components/allsetttings/BackupSettings";

import ForgotPassword from "./pages/ForgotPassword";
import EmployeeDashboard from "./pages/employeemodule/Dashboard";
import EmployeeProfile from "./pages/employeemodule/Profile";
import EmployeeAttendance from "./pages/employeemodule/Attendance";
import EmployeeSalary from "./pages/employeemodule/Salary";
import EmployeeLeave from "./pages/employeemodule/Leave";
import EmployeeAssets from "./pages/employeemodule/EmpAsset";
import EmployeeSettings from "./pages/employeemodule";
import EmployeeSecurity from "./pages/employeemodule/EmpSecurity";
import EmployeeDeleteAccount from "./pages/employeemodule/DeleteAccount";
import EmployeePreferences from "./pages/employeemodule/Preferences";
import EmployeeNotFound from "./pages/employeemodule/NotFound";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Portal />} />
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/employee" element={<Navigate to="/" replace />} />
        <Route path="/employee/login" element={<Navigate to="/" replace />} />
        <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
        <Route path="/employee/profile" element={<EmployeeProfile />} />
        <Route path="/employee/attendance" element={<EmployeeAttendance />} />
        <Route path="/employee/salary" element={<EmployeeSalary />} />
        <Route path="/employee/leave" element={<EmployeeLeave />} />
        <Route path="/employee/assets" element={<EmployeeAssets />} />
        <Route path="/employee/settings" element={<EmployeeSettings />} />
        <Route
          path="/employee/settings/security"
          element={<EmployeeSecurity />}
        />
        <Route
          path="/employee/settings/delete"
          element={<EmployeeDeleteAccount />}
        />
        <Route
          path="/employee/settings/preferences"
          element={<EmployeePreferences />}
        />
        <Route path="/employee/*" element={<EmployeeNotFound />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/leaves" element={<Leaves />} />
          <Route path="/departments" element={<Departments />} />
          <Route path="/departments/add" element={<AddDepartment />} />
          <Route path="/departments/edit/:id" element={<EditDepartment />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/settings/security" element={<SecuritySettings />} />
          <Route
            path="/settings/notifications"
            element={<NotificationSettings />}
          />
          <Route path="/settings/leave" element={<LeavePolicy />} />
          <Route path="/settings/salary" element={<PayrollConfig />} />
          <Route path="/settings/backup" element={<BackupSettings />} />
          <Route path="/settings/danger" element={<DangerZone />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/salaries" element={<Salaries />} />
          <Route path="/assets" element={<Assets />} />
          <Route path="/assets/edit/:id" element={<EditAsset />} />
          <Route path="/attendance" element={<Attendance />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
