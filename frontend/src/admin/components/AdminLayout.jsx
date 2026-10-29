import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import "../styles/AdminLayout.css";

const pageInfo = {
  "/admin": {
    title: "Dashboard",
    subtitle: "Overview of your movie booking platform.",
  },
  "/admin/movies": {
    title: "Movies",
    subtitle: "Manage movies available on Flickt.",
  },
  "/admin/shows": {
    title: "Shows & Schedules",
    subtitle: "Manage showtimes and movie schedules.",
  },
  "/admin/theatres": {
    title: "Theatres",
    subtitle: "Manage theatres and screens.",
  },
  "/admin/bookings": {
    title: "Bookings",
    subtitle: "Review customer ticket bookings.",
  },
  "/admin/users": {
    title: "Users",
    subtitle: "View and manage registered customers.",
  },
  "/admin/reports": {
    title: "Reports",
    subtitle: "Review platform performance.",
  },
  "/admin/settings": {
    title: "Settings",
    subtitle: "Configure your admin preferences.",
  },
};

export default function AdminLayout() {
  const location = useLocation();
  const currentPage = pageInfo[location.pathname] || pageInfo["/admin"];

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <main className="admin-main">
        <AdminHeader
          title={currentPage.title}
          subtitle={currentPage.subtitle}
        />

        <div className="admin-page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
