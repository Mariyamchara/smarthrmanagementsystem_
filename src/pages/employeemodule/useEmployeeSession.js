import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getEmployeeProfile } from "../../lib/employeeProfileApi";
import {
  getStoredEmployeeSession,
  setStoredEmployeeSession,
  subscribeToEmployeeSession,
} from "../../lib/employeeSession";

export function useEmployeeSession({ requireAuth = true } = {}) {
  const navigate = useNavigate();
  const [session, setSession] = useState(() => getStoredEmployeeSession());

  useEffect(() => subscribeToEmployeeSession(setSession), []);

  useEffect(() => {
    if (!session?.employeeId) {
      return undefined;
    }

    let isActive = true;

    getEmployeeProfile(session.employeeId)
      .then((profile) => {
        if (isActive) {
          setStoredEmployeeSession({
            ...(getStoredEmployeeSession() || {}),
            ...profile,
          });
        }
      })
      .catch((error) => {
        console.error("Failed to refresh employee session:", error);
      });

    return () => {
      isActive = false;
    };
  }, [session?.employeeId]);

  useEffect(() => {
    if (requireAuth && !session) {
      navigate("/");
    }
  }, [navigate, requireAuth, session]);

  return session;
}
