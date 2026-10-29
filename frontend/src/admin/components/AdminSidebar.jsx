
import React from "react";
import { NavLink, Link } from "react-router-dom";
import {
  FiFilm,
  FiCalendar,
  FiMonitor,
  FiShoppingBag,
  FiUsers,
  FiSettings,
  FiArrowLeft,
  FiMapPin,
  FiGrid,
} from "react-icons/fi";

const menuItems = [
  { label: "Cities", path: "/admin/cities", icon: FiMapPin },
  { label: "Movies", path: "/admin/movies", icon: FiFilm },
  { label: "Theatres", path: "/admin/theatres", icon: FiMonitor },
  {
    label: "Shows & Schedules",
    path: "/admin/shows",
    icon: FiCalendar,
  },
  { label: "Bookings", path: "/admin/bookings", icon: FiShoppingBag },
  { label: "Users", path: "/admin/users", icon: FiUsers },
  { label: "Settings", path: "/admin/settings", icon: FiSettings },
];

export default function AdminSidebar() {
  return (
    <aside className="admin-sidebar">
      <Link to="/admin" className="admin-brand">
        <span className="admin-brand-icon">F</span>
        <span>
          Flickt
          <small>ADMIN PANEL</small>
        </span>
      </Link>

      <div className="admin-menu-label">MAIN MENU</div>

      <nav className="admin-navigation">
        {menuItems.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end
            className={({ isActive }) =>
              `admin-nav-link ${isActive ? "active" : ""}`
            }
          >
            <Icon size={19} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <Link to="/" className="admin-back-link">
        <FiArrowLeft size={18} />
        <span>Back to Website</span>
      </Link>
    </aside>
  );
}
