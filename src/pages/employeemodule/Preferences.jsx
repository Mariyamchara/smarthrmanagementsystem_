import React, { useEffect, useState } from "react";
import MainLayout from "./MainLayout";
import { useEmployeeSession } from "./useEmployeeSession";
import { getEmployeeProfile, updateEmployeeProfile } from "../../lib/employeeProfileApi";
import { setStoredEmployeeSession } from "../../lib/employeeSession";

const defaultPreferences = {
  darkMode: false,
  emailNotifications: true,
  smsAlerts: false,
};

const ToggleSwitch = ({ name, checked, onChange }) => (
  <label className="toggle-switch">
    <input type="checkbox" name={name} checked={checked} onChange={onChange} />
    <span />
  </label>
);

const Preferences = () => {
  const session = useEmployeeSession();
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session?.employeeId) {
      return;
    }

    let isActive = true;

    async function loadPreferences() {
      try {
        const data = await getEmployeeProfile(session.employeeId);
        if (!isActive) {
          return;
        }

        const nextPreferences = {
          ...defaultPreferences,
          ...(data.preferences || {}),
        };
        setPreferences(nextPreferences);
        document.documentElement.classList.toggle("dark", nextPreferences.darkMode);
      } catch (err) {
        if (isActive) {
          setError(err.message || "Failed to load preferences.");
        }
      }
    }

    loadPreferences();
    return () => {
      isActive = false;
    };
  }, [session?.employeeId]);

  const handleToggle = (e) => {
    const { name, checked } = e.target;

    setPreferences((current) => ({
      ...current,
      [name]: checked,
    }));

    if (name === "darkMode") {
      document.documentElement.classList.toggle("dark", checked);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!session?.employeeId) {
      return;
    }

    try {
      const updated = await updateEmployeeProfile(session.employeeId, {
        preferences,
      });
      setStoredEmployeeSession({
        ...(session || {}),
        preferences: updated.preferences,
      });
      setMessage("Preferences updated successfully.");
      setError("");
    } catch (err) {
      setError(err.message || "Failed to update preferences.");
      setMessage("");
    }
  };

  return (
    <MainLayout>
      <div className="page">
        <section className="page-hero">
          <div>
            <h2>Preferences</h2>
            <p>Manage your display and notification preferences.</p>
          </div>
          <small>{preferences.darkMode ? "Dark mode on" : "Light mode on"}</small>
        </section>

        <div className="panel settings-form-panel">
          <h3>Personal Preferences</h3>

          {message && <p className="form-message success">{message}</p>}
          {error && <p className="form-message danger">{error}</p>}

          <form onSubmit={handleSubmit}>
            <div className="preference-row">
              <span>Dark Mode</span>
              <ToggleSwitch
                name="darkMode"
                checked={preferences.darkMode}
                onChange={handleToggle}
              />
            </div>

            <div className="preference-row">
              <span>Email Notifications</span>
              <ToggleSwitch
                name="emailNotifications"
                checked={preferences.emailNotifications}
                onChange={handleToggle}
              />
            </div>

            <div className="preference-row">
              <span>SMS Alerts</span>
              <ToggleSwitch
                name="smsAlerts"
                checked={preferences.smsAlerts}
                onChange={handleToggle}
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn">
                Save Preferences
              </button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
};

export default Preferences;
