
import React from "react";
import {
  FiFilm,
  FiShoppingBag,
  FiUsers,
  FiDollarSign,
} from "react-icons/fi";

const icons = {
  movies: FiFilm,
  bookings: FiShoppingBag,
  users: FiUsers,
  revenue: FiDollarSign,
};

export default function AdminStatCard({
  title,
  value,
  change,
  type = "movies",
}) {
  const Icon = icons[type] || FiFilm;

  return (
    <article className="admin-stat-card">
      <div className={`admin-stat-icon ${type}`}>
        <Icon size={22} />
      </div>

      <p className="admin-stat-title">{title}</p>
      <h2>{value}</h2>
      <p className="admin-stat-change">{change}</p>
    </article>
  );
}
