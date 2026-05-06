const KEY = "attendance-data";

export const ATTENDANCE_DATA = [
  { employeeId: "EMP001", name: "Amir Khan", date: "2026-04-15", inTime: "09:00 AM", outTime: "06:00 PM", department: "Human Resources", overtime: 0, status: "Present" },
  { employeeId: "EMP002", name: "Sara Ali", date: "2026-04-15", inTime: "09:15 AM", outTime: "06:30 PM", department: "IT", overtime: 0.5, status: "Present" },
  { employeeId: "EMP003", name: "Bilal Khan", date: "2026-04-15", inTime: "—", outTime: "—", department: "Database", overtime: 0, status: "Absent" },
  { employeeId: "EMP001", name: "Amir Khan", date: "2026-04-14", inTime: "09:05 AM", outTime: "06:00 PM", department: "Human Resources", overtime: 0, status: "Present" },
  { employeeId: "EMP002", name: "Sara Ali", date: "2026-04-14", inTime: "—", outTime: "—", department: "IT", overtime: 0, status: "On Leave" },
  { employeeId: "EMP003", name: "Bilal Khan", date: "2026-04-14", inTime: "10:30 AM", outTime: "06:00 PM", department: "Database", overtime: 1, status: "Late" },
];

export function getAttendanceData() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : ATTENDANCE_DATA;
  } catch {
    return ATTENDANCE_DATA;
  }
}

export function saveAttendanceData(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent("attendance-updated", { detail: data }));
}

export function subscribeToAttendance(listener) {
  const handler = (e) => listener(e.detail);
  window.addEventListener("attendance-updated", handler);
  return () => window.removeEventListener("attendance-updated", handler);
}
