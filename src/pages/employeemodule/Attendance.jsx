import { useEffect, useMemo, useState } from "react";
import MainLayout from "./MainLayout";
import { useEmployeeSession } from "./useEmployeeSession";
import {
  getEmployeeAttendance,
  getEmployeeLeaves,
  getEmployeeSalaries,
} from "../../lib/employeeModuleApi";

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getMonthOptions(records) {
  const map = new Map();

  records.forEach((record) => {
    const key = `${record.year}-${String(record.month).padStart(2, "0")}`;
    if (!map.has(key)) {
      map.set(key, {
        key,
        month: Number(record.month),
        year: Number(record.year),
        name: `${monthNames[Number(record.month) - 1]} ${record.year}`,
      });
    }
  });

  if (map.size === 0) {
    const today = new Date();
    return [
      {
        key: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`,
        month: today.getMonth() + 1,
        year: today.getFullYear(),
        name: `${monthNames[today.getMonth()]} ${today.getFullYear()}`,
      },
    ];
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(a.year, a.month - 1, 1) - new Date(b.year, b.month - 1, 1),
  );
}

function getLeaveDatesForMonth(leaves, month, year) {
  const leaveDates = new Set();

  leaves
    .filter((leave) => leave.status !== "Rejected")
    .forEach((leave) => {
      const fromDate = new Date(leave.fromDate);
      const toDate = new Date(leave.toDate || leave.fromDate);
      const current = new Date(fromDate);

      while (current <= toDate) {
        if (current.getMonth() + 1 === month && current.getFullYear() === year) {
          leaveDates.add(current.getDate());
        }
        current.setDate(current.getDate() + 1);
      }
    });

  return leaveDates;
}

function getHolidayCount(month, year) {
  const totalDays = new Date(year, month, 0).getDate();
  let count = 0;

  for (let day = 1; day <= totalDays; day += 1) {
    const weekDay = new Date(year, month - 1, day).getDay();
    if (weekDay === 0 || weekDay === 6) {
      count += 1;
    }
  }

  return count;
}

function buildCalendarData(month, year, absentDays, leaveDates) {
  const totalDays = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();
  const startBlanks = firstDay === 0 ? 6 : firstDay - 1;
  const candidateAbsentDays = [];

  for (let day = totalDays; day >= 1; day -= 1) {
    const weekDay = new Date(year, month - 1, day).getDay();
    if (weekDay !== 0 && weekDay !== 6 && !leaveDates.has(day)) {
      candidateAbsentDays.push(day);
    }
  }

  const absentSet = new Set(candidateAbsentDays.slice(0, Math.max(0, absentDays)));
  const days = Array.from({ length: totalDays }, (_, index) => {
    const day = index + 1;
    const weekDay = new Date(year, month - 1, day).getDay();

    let status = "present";
    if (leaveDates.has(day)) {
      status = "leave";
    } else if (weekDay === 0 || weekDay === 6) {
      status = "holiday";
    } else if (absentSet.has(day)) {
      status = "absent";
    }

    return { day, status };
  });

  return { days, startBlanks };
}

export default function Attendance() {
  const session = useEmployeeSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attendance, setAttendance] = useState(null);
  const [salaryRecords, setSalaryRecords] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [selectedMonthKey, setSelectedMonthKey] = useState("");

  useEffect(() => {
    if (!session?.employeeId) {
      return;
    }

    let isActive = true;

    async function loadAttendance() {
      try {
        setLoading(true);
        const [attendanceData, salaryData, leaveData] = await Promise.all([
          getEmployeeAttendance(session.employeeId),
          getEmployeeSalaries(session.employeeId),
          getEmployeeLeaves(session.employeeId),
        ]);

        if (!isActive) {
          return;
        }

        setAttendance(attendanceData[0] || null);
        setSalaryRecords(salaryData);
        setLeaves(leaveData);
        setError("");
      } catch (err) {
        if (isActive) {
          setError(err.message || "Failed to load attendance");
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    loadAttendance();
    return () => {
      isActive = false;
    };
  }, [session?.employeeId]);

  const monthOptions = useMemo(() => getMonthOptions(salaryRecords), [salaryRecords]);

  useEffect(() => {
    if (!selectedMonthKey && monthOptions.length > 0) {
      setSelectedMonthKey(monthOptions[monthOptions.length - 1].key);
    }
  }, [monthOptions, selectedMonthKey]);

  const selectedMonthIndex = Math.max(
    0,
    monthOptions.findIndex((option) => option.key === selectedMonthKey),
  );
  const selectedMonth = monthOptions[selectedMonthIndex] || monthOptions[0];

  const selectedRecord =
    salaryRecords.find(
      (record) =>
        selectedMonth &&
        Number(record.month) === selectedMonth.month &&
        Number(record.year) === selectedMonth.year,
    ) || null;

  const leaveDates = useMemo(
    () =>
      selectedMonth
        ? getLeaveDatesForMonth(leaves, selectedMonth.month, selectedMonth.year)
        : new Set(),
    [leaves, selectedMonth],
  );

  const holidayCount = selectedMonth
    ? getHolidayCount(selectedMonth.month, selectedMonth.year)
    : 0;

  const summary = [
    { label: "Present", status: "present", value: Number(selectedRecord?.presentDays || 0) },
    { label: "Absent", status: "absent", value: Number(selectedRecord?.absentDays || 0) },
    { label: "Leave", status: "leave", value: leaveDates.size },
    { label: "Half Day", status: "halfday", value: 0 },
    { label: "Holidays", status: "holiday", value: holidayCount },
  ];

  const calendarData = selectedMonth
    ? buildCalendarData(
        selectedMonth.month,
        selectedMonth.year,
        Number(selectedRecord?.absentDays || 0),
        leaveDates,
      )
    : { days: [], startBlanks: 0 };

  return (
    <MainLayout>
      <div className="page">
        <section className="page-hero">
          <div>
            <h2>Attendance</h2>
            <p>Track today's timings and monthly attendance summary.</p>
          </div>
        </section>

        {error && <p className="form-message danger">{error}</p>}

        {loading ? (
          <div className="panel">
            <p>Loading attendance data...</p>
          </div>
        ) : (
          <>
            <div className="grid-5 mb-20">
              {summary.map((item) => (
                <div className="stat-card" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>

            <div className="grid-2">
              <div className="panel">
                <h3>Today's Summary</h3>
                <div className="grid-2 mb-20">
                  <div className="stat-card">
                    <span>Check In</span>
                    <strong>{attendance?.inTime || "-"}</strong>
                  </div>
                  <div className="stat-card">
                    <span>Check Out</span>
                    <strong>{attendance?.outTime || "-"}</strong>
                  </div>
                  <div className="stat-card">
                    <span>Total Hours</span>
                    <strong>
                      {attendance?.inTime && attendance?.outTime && attendance.inTime !== "-" ? "9h 00m" : "-"}
                    </strong>
                  </div>
                  <div className="stat-card">
                    <span>Status</span>
                    <strong>{attendance?.status || "-"}</strong>
                  </div>
                </div>
                <span className={`badge ${attendance?.status === "Present" ? "badge-success" : attendance?.status === "On Leave" ? "badge-warning" : "badge-danger"}`}>
                  {attendance?.status || "Unavailable"}
                </span>
              </div>

              <div className="panel">
                <div className="calendar-title">
                  <h3>{selectedMonth?.name || "Attendance Calendar"}</h3>
                  <div className="calendar-actions">
                    <button
                      className="btn btn-outline"
                      type="button"
                      onClick={() => setSelectedMonthKey(monthOptions[selectedMonthIndex - 1]?.key || selectedMonthKey)}
                      disabled={selectedMonthIndex === 0}
                    >
                      Previous
                    </button>
                    <button
                      className="btn btn-outline"
                      type="button"
                      onClick={() => setSelectedMonthKey(monthOptions[selectedMonthIndex + 1]?.key || selectedMonthKey)}
                      disabled={selectedMonthIndex === monthOptions.length - 1}
                    >
                      Next
                    </button>
                  </div>
                </div>

                <div className="weekdays">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                    <span key={day}>{day}</span>
                  ))}
                </div>

                <div className="calendar-grid">
                  {Array.from({ length: calendarData.startBlanks }).map((_, index) => (
                    <div className="calendar-day calendar-empty" key={`empty-${index}`}></div>
                  ))}
                  {calendarData.days.map(({ day, status }) => (
                    <div className={`calendar-day status-${status}`} key={day}>
                      {day}
                    </div>
                  ))}
                </div>

                <div className="legend">
                  {summary.map((item) => (
                    <div className="legend-item" key={item.label}>
                      <span className={`legend-dot status-${item.status}`}></span>
                      {item.label} - {item.value}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
