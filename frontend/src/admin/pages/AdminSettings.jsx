
import React, { useState } from "react";
import {
  FiSettings,
  FiBell,
  FiShield,
  FiSave,
  FiMonitor,
} from "react-icons/fi";

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    platformName: "Flickt",
    supportEmail: "support@flickt.com",
    currency: "INR",
    city: "Pune",
    bookingNotifications: true,
    cancellationNotifications: true,
    newUserNotifications: false,
    maintenanceMode: false,
  });

  const [saved, setSaved] = useState(false);

  function updateSetting(key, value) {
    setSettings((previous) => ({
      ...previous,
      [key]: value,
    }));
    setSaved(false);
  }

  function handleSubmit(event) {
    event.preventDefault();

    // This saves settings in this page's state only.
    // Connect a backend API to persist them across refreshes.
    setSaved(true);
  }

  return (
    <section className="admin-panel admin-settings-page">
      <div className="admin-panel-heading">
        <div>
          <h3>Admin Settings</h3>
          <p>Configure platform preferences and administrator options.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="settings-section">
          <div className="settings-section-heading">
            <FiSettings />
            <div>
              <h3>Platform Settings</h3>
              <p>Basic information about your movie booking platform.</p>
            </div>
          </div>

          <div className="settings-form-grid">
            <label>
              Platform Name
              <input
                required
                value={settings.platformName}
                onChange={(event) =>
                  updateSetting("platformName", event.target.value)
                }
              />
            </label>

            <label>
              Support Email
              <input
                type="email"
                required
                value={settings.supportEmail}
                onChange={(event) =>
                  updateSetting("supportEmail", event.target.value)
                }
              />
            </label>

            <label>
              Currency
              <select
                value={settings.currency}
                onChange={(event) =>
                  updateSetting("currency", event.target.value)
                }
              >
                <option value="INR">INR - Indian Rupee (₹)</option>
                <option value="USD">USD - US Dollar ($)</option>
              </select>
            </label>

            <label>
              Default City
              <input
                required
                value={settings.city}
                onChange={(event) =>
                  updateSetting("city", event.target.value)
                }
              />
            </label>
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-section-heading">
            <FiBell />
            <div>
              <h3>Notification Preferences</h3>
              <p>Choose which admin events you want to be notified about.</p>
            </div>
          </div>

          <div className="settings-toggle-list">
            <label className="settings-toggle-row">
              <span>
                <strong>New bookings</strong>
                <small>Notify when a customer books tickets.</small>
              </span>
              <input
                type="checkbox"
                checked={settings.bookingNotifications}
                onChange={(event) =>
                  updateSetting("bookingNotifications", event.target.checked)
                }
              />
            </label>

            <label className="settings-toggle-row">
              <span>
                <strong>Booking cancellations</strong>
                <small>Notify when a reservation is cancelled.</small>
              </span>
              <input
                type="checkbox"
                checked={settings.cancellationNotifications}
                onChange={(event) =>
                  updateSetting(
                    "cancellationNotifications",
                    event.target.checked
                  )
                }
              />
            </label>

            <label className="settings-toggle-row">
              <span>
                <strong>New user registrations</strong>
                <small>Notify when a customer creates an account.</small>
              </span>
              <input
                type="checkbox"
                checked={settings.newUserNotifications}
                onChange={(event) =>
                  updateSetting("newUserNotifications", event.target.checked)
                }
              />
            </label>
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-section-heading">
            <FiMonitor />
            <div>
              <h3>Platform Availability</h3>
              <p>Control the maintenance mode preference.</p>
            </div>
          </div>

          <label className="settings-toggle-row">
            <span>
              <strong>Maintenance mode</strong>
              <small>
                Preference only; this will not disable the website until
                connected to the backend.
              </small>
            </span>
            <input
              type="checkbox"
              checked={settings.maintenanceMode}
              onChange={(event) =>
                updateSetting("maintenanceMode", event.target.checked)
              }
            />
          </label>
        </div>

        <div className="settings-security-note">
          <FiShield size={22} />
          <div>
            <strong>Administrator security</strong>
            <p>
              Keep admin access protected. Changes to roles, passwords, and
              permissions should be validated by the backend.
            </p>
          </div>
        </div>

        <div className="settings-save-row">
          {saved && (
            <span className="settings-saved-message">
              Settings updated for this session.
            </span>
          )}

          <button type="submit" className="admin-primary-button">
            <FiSave /> Save Settings
          </button>
        </div>
      </form>
    </section>
  );
}
