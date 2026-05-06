import React from "react";
import {NavLink} from "react-router-dom"
import { FaTachometerAlt, FaUsers, FaBuilding, FaBox, FaCalendarAlt, FaMoneyBillWave, FaCogs } from "react-icons/fa";

const AdminSideBar =() =>{

    return (
        <div className="bg-gray-800 text-white h-screen fixed left-0 top-0 bottom-0 space-y-2 w-64 ">
            <div className="bg-[#3f3d9c] h-12 flex items-center justify-center">
                <h3 className ="text-2xl text-center font-pacific"> HR Management</h3>
            </div>
            <div>
                <NavLink to = "/admin-dashboard" className =" flex items-center space-x-4 block py-2.5 px-4 rounded"><FaTachometerAlt/> <span>Dashboard</span></NavLink>
                <NavLink to = "/admin-dashboard"className =" flex items-center space-x-4 block py-2.5 px-4 rounded"><FaUsers/> <span>Candidate</span></NavLink>
                <NavLink to = "/admin-dashboard/departments"className =" flex items-center space-x-4 block py-2.5 px-4 rounded"><FaBuilding/> <span>Department</span></NavLink>
                <NavLink to = "/admin-dashboard"className =" flex items-center space-x-4 block py-2.5 px-4 rounded"><FaUsers/> <span>Employee</span></NavLink>
                <NavLink to = "/admin-dashboard" className =" flex items-center space-x-4 block py-2.5 px-4 rounded"><FaCalendarAlt/> <span>Leave</span></NavLink>
                <NavLink to = "/admin-dashboard" className =" flex items-center space-x-4 block py-2.5 px-4 rounded"><FaMoneyBillWave/> <span>Salary</span></NavLink>
                <NavLink to = "/admin-dashboard/assets" className =" flex items-center space-x-4 block py-2.5 px-4 rounded"><FaBox/> <span>Assets</span></NavLink>
                <NavLink to = "/admin-dashboard/settings" className =" flex items-center space-x-4 block py-2.5 px-4 rounded"><FaCogs/> <span>Settings</span></NavLink>
            </div>
        </div>
    );
};
export default AdminSideBar;