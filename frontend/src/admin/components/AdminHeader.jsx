import React from "react";
import { FiBell, FiShield } from "react-icons/fi";

export default function AdminHeader({ title, subtitle }) {
  return (
    <header className="admin-header">
      <div className="admin-header-title">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      <div className="admin-header-actions">
        <button
          type="button"
          className="admin-icon-button"
          aria-label="Notifications"
          onClick={() => window.alert("No new notifications")}
        >
          <FiBell size={19} />
        </button>

        <div className="admin-profile">
          <div className="admin-avatar">
            <FiShield size={20} />
          </div>
          <div>
            <strong>Administrator</strong>
            <span>Super Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
}
