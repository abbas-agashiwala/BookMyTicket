import React from "react";
import { FiArrowUpRight, FiClock } from "react-icons/fi";
import AdminStatCard from "../components/AdminStatCard";

const recentBookings = [
  { id: "FLK-1024", customer: "Rahul Sharma", movie: "Example Movie A", seats: "C4, C5", status: "Confirmed", amount: "₹600" },
  { id: "FLK-1025", customer: "Priya Patel", movie: "Example Movie B", seats: "D6", status: "Pending", amount: "₹300" },
  { id: "FLK-1026", customer: "Aarav Shah", movie: "Example Movie C", seats: "A1, A2", status: "Confirmed", amount: "₹500" },
];

export default function AdminDashboard() {
  return (
    <div className="admin-dashboard">
      <div className="admin-welcome">
        <div>
          <span className="admin-eyebrow">OVERVIEW</span>
          <h2>Welcome to Flickt 👋</h2>
          <p>Here is what's happening with your platform.</p>
        </div>
        <div className="admin-date">
          <FiClock /> Admin overview
        </div>
      </div>

      <div className="admin-stats-grid">
        <AdminStatCard title="Total Movies" value="128" change="Sample data" type="movies" />
        <AdminStatCard title="Total Bookings" value="2,450" change="Sample data" type="bookings" />
        <AdminStatCard title="Registered Users" value="8,240" change="Sample data" type="users" />
        <AdminStatCard title="Total Revenue" value="₹4.8L" change="Sample data" type="revenue" />
      </div>

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <h3>Recent Bookings</h3>
            <p>Example records for the dashboard layout</p>
          </div>
          <FiArrowUpRight size={20} />
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Customer</th>
                <th>Movie</th>
                <th>Seats</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map((booking) => (
                <tr key={booking.id}>
                  <td>{booking.id}</td>
                  <td>{booking.customer}</td>
                  <td>{booking.movie}</td>
                  <td>{booking.seats}</td>
                  <td>{booking.amount}</td>
                  <td>
                    <span className={`admin-status ${booking.status.toLowerCase()}`}>
                      {booking.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
