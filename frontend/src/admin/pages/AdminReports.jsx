
import React, { useState } from "react";
import {
  FiDollarSign,
  FiShoppingBag,
  FiUsers,
  FiFilm,
  FiDownload,
} from "react-icons/fi";

const weeklyData = [
  { day: "Mon", revenue: 4200, bookings: 32 },
  { day: "Tue", revenue: 6100, bookings: 45 },
  { day: "Wed", revenue: 4800, bookings: 36 },
  { day: "Thu", revenue: 7800, bookings: 58 },
  { day: "Fri", revenue: 9200, bookings: 69 },
  { day: "Sat", revenue: 12500, bookings: 94 },
  { day: "Sun", revenue: 10800, bookings: 81 },
];

const popularMovies = [
  { title: "Example Movie A", bookings: 245, revenue: 73500 },
  { title: "Example Movie B", bookings: 186, revenue: 55800 },
  { title: "Example Movie C", bookings: 132, revenue: 39600 },
  { title: "Example Movie D", bookings: 98, revenue: 29400 },
];

function ReportCard({ icon: Icon, title, value, note }) {
  return (
    <div className="report-stat-card">
      <div className="report-stat-icon">
        <Icon size={21} />
      </div>
      <p>{title}</p>
      <h3>{value}</h3>
      <span>{note}</span>
    </div>
  );
}

export default function AdminReports() {
  const [period, setPeriod] = useState("week");
  const [metric, setMetric] = useState("revenue");

  const maxValue = Math.max(
    ...weeklyData.map((item) => item[metric])
  );

  function exportReport() {
    const rows = [
      ["Day", "Revenue (INR)", "Bookings"],
      ...weeklyData.map((item) => [
        item.day,
        item.revenue,
        item.bookings,
      ]),
    ];

    const csv = rows
      .map((row) =>
        row.map((value) => `"${value}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "flickt-report.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <section className="admin-panel reports-page">
      <div className="admin-panel-heading">
        <div>
          <h3>Reports & Analytics</h3>
          <p>Track revenue, ticket sales and booking performance.</p>
        </div>

        <button
          className="admin-primary-button"
          onClick={exportReport}
          type="button"
        >
          <FiDownload /> Export Report
        </button>
      </div>

      <div className="report-filters">
        <label>
          Report period
          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </label>
        <span className="report-demo-note">
          Demo statistics · Not connected to live data
        </span>
      </div>

      <div className="report-stat-grid">
        <ReportCard
          icon={FiDollarSign}
          title="Total Revenue"
          value="₹65,400"
          note="Sample revenue"
        />
        <ReportCard
          icon={FiShoppingBag}
          title="Tickets Sold"
          value="415"
          note="Sample ticket sales"
        />
        <ReportCard
          icon={FiUsers}
          title="Total Bookings"
          value="286"
          note="Sample bookings"
        />
        <ReportCard
          icon={FiFilm}
          title="Movies Listed"
          value="12"
          note="Sample movie count"
        />
      </div>

      <div className="report-chart-card">
        <div className="report-chart-heading">
          <div>
            <h3>Weekly Performance</h3>
            <p>Compare daily revenue and booking volume.</p>
          </div>

          <select
            value={metric}
            onChange={(event) => setMetric(event.target.value)}
            aria-label="Chart metric"
          >
            <option value="revenue">Revenue (₹)</option>
            <option value="bookings">Bookings</option>
          </select>
        </div>

        <div className="report-chart">
          {weeklyData.map((item) => {
            const value = item[metric];
            const height = (value / maxValue) * 100;

            return (
              <div className="report-chart-column" key={item.day}>
                <span className="report-chart-value">
                  {metric === "revenue"
                    ? `₹${value.toLocaleString("en-IN")}`
                    : value}
                </span>
                <div className="report-chart-track">
                  <div
                    className="report-chart-bar"
                    style={{ height: `${height}%` }}
                    title={`${item.day}: ${value}`}
                  />
                </div>
                <span className="report-chart-label">{item.day}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="report-chart-card">
        <div className="report-chart-heading">
          <div>
            <h3>Popular Movies</h3>
            <p>Sample performance by movie.</p>
          </div>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Movie</th>
                <th>Bookings</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {popularMovies.map((movie) => (
                <tr key={movie.title}>
                  <td>{movie.title}</td>
                  <td>{movie.bookings}</td>
                  <td>₹{movie.revenue.toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
