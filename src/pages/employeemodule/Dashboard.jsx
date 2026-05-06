import { useEffect, useMemo, useState } from "react";
import MainLayout from "./MainLayout";
import { useEmployeeSession } from "./useEmployeeSession";
import {
  getEmployeeAttendance,
  getEmployeeLeaves,
  getEmployeeRequisitions,
  getEmployeeSalaries,
} from "../../lib/employeeModuleApi";
import { getEmployeeProfile } from "../../lib/employeeProfileApi";
import { formatCurrency, formatDate } from "./employeeUtils";

const leaveTypes = ["Casual Leave", "Sick Leave", "Earned Leave"];

export default function Dashboard() {
  const session = useEmployeeSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [requisitions, setRequisitions] = useState([]);

  useEffect(() => {
    if (!session?.employeeId) {
      return;
    }

    let isActive = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        const [profileData, attendanceData, leaveData, salaryData, requisitionData] =
          await Promise.all([
            getEmployeeProfile(session.employeeId),
            getEmployeeAttendance(session.employeeId),
            getEmployeeLeaves(session.employeeId),
            getEmployeeSalaries(session.employeeId),
            getEmployeeRequisitions(session.employeeId),
          ]);

        if (!isActive) {
          return;
        }

        setProfile(profileData);
        setAttendance(attendanceData[0] || null);
        setLeaves(leaveData);
        setSalaries(salaryData);
        setRequisitions(requisitionData);
        setError("");
      } catch (err) {
        if (!isActive) {
          return;
        }

        setError(err.message || "Failed to load dashboard");
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    loadDashboard();
    return () => {
      isActive = false;
    };
  }, [session?.employeeId]);

  const latestSalary = salaries[0] || null;

  const leaveBalance = useMemo(
    () =>
      leaveTypes.map((type) => ({
        label: type,
        value: `${leaves
          .filter((leave) => leave.type === type)
          .reduce((total, leave) => total + Number(leave.days || 0), 0)} days`,
      })),
    [leaves],
  );

  const notifications = useMemo(() => {
    const items = [];

    if (leaves[0]) {
      items.push(
        `${leaves[0].type} request is ${String(leaves[0].status || "").toLowerCase()}.`,
      );
    }

    if (latestSalary) {
      items.push(
        `${formatDate(new Date(latestSalary.year, latestSalary.month - 1, 1), {
          month: "long",
          year: "numeric",
        })} salary processed.`,
      );
    }

    if (requisitions[0]) {
      items.push(`Asset request ${requisitions[0].status.toLowerCase()}.`);
    }

    if (items.length === 0) {
      items.push("No recent notifications available.");
    }

    return items;
  }, [latestSalary, leaves, requisitions]);

  return (
    <MainLayout>
      <div className="page">
        <section className="page-hero">
          <div>
            <h2>Hello, {profile?.name || session?.name || "Employee"}</h2>
            <p>Here is your latest work summary from the HR system.</p>
          </div>
          <small>{formatDate(new Date(), { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</small>
        </section>

        {error && <p className="form-message danger">{error}</p>}

        {loading ? (
          <div className="panel">
            <p>Loading dashboard data...</p>
          </div>
        ) : (
          <>
            <div className="grid-2 mb-20">
              <div className="panel">
                <h3>Today's Status</h3>
                <p className={`badge ${attendance?.status === "Present" ? "badge-success" : attendance?.status === "On Leave" ? "badge-warning" : "badge-danger"}`}>
                  {attendance?.status || "Unavailable"}
                </p>
                <p>
                  Checked in at {attendance?.inTime && attendance.inTime !== "-" ? attendance.inTime : "N/A"}
                </p>
                <p>
                  Checked out at {attendance?.outTime && attendance.outTime !== "-" ? attendance.outTime : "N/A"}
                </p>
              </div>

              <div className="panel">
                <h3>This Month Salary</h3>
                <div className="stat-card">
                  <span>Net Salary</span>
                  <strong>{latestSalary ? formatCurrency(latestSalary.netSalary) : formatCurrency(0)}</strong>
                </div>
              </div>
            </div>

            <div className="grid-3 mb-20">
              {leaveBalance.map((item) => (
                <div className="stat-card" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>

            <div className="panel">
              <h3>Recent Notifications</h3>
              {notifications.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
