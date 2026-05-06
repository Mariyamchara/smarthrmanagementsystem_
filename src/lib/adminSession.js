const SESSION_KEY = "admin-session";
const PROFILE_EVENT = "admin-profile-updated";

function sanitizeSession(session) {
  if (!session) {
    return null;
  }

  const safeSession = { ...session };
  delete safeSession.password;
  return safeSession;
}

export function getStoredAdminSession() {
  const raw = window.localStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function setStoredAdminSession(session) {
  const safeSession = sanitizeSession(session);
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(safeSession));
  window.dispatchEvent(new CustomEvent(PROFILE_EVENT, { detail: safeSession }));
}

export function clearStoredAdminSession() {
  window.localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new CustomEvent(PROFILE_EVENT, { detail: null }));
}

export function subscribeToAdminSession(listener) {
  const handler = (event) => listener(event.detail ?? getStoredAdminSession());
  window.addEventListener(PROFILE_EVENT, handler);
  return () => window.removeEventListener(PROFILE_EVENT, handler);
}
