const SESSION_KEY = "employee-session";
const PROFILE_EVENT = "employee-session-updated";

function sanitizeSession(session) {
  if (!session) {
    return null;
  }

  const safeSession = { ...session };
  delete safeSession.password;
  return safeSession;
}

export function getStoredEmployeeSession() {
  const raw = window.localStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function setStoredEmployeeSession(session) {
  const safeSession = sanitizeSession(session);
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(safeSession));
  window.dispatchEvent(new CustomEvent(PROFILE_EVENT, { detail: safeSession }));
}

export function clearStoredEmployeeSession() {
  window.localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new CustomEvent(PROFILE_EVENT, { detail: null }));
}

export function subscribeToEmployeeSession(listener) {
  const handler = (event) => listener(event.detail ?? getStoredEmployeeSession());
  window.addEventListener(PROFILE_EVENT, handler);
  return () => window.removeEventListener(PROFILE_EVENT, handler);
}
