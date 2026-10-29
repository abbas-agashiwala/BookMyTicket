import React, { useCallback, useEffect, useState } from "react";
import {
  FiSearch,
  FiEye,
  FiXCircle,
  FiCalendar,
  FiDownload,
  FiRefreshCw,
} from "react-icons/fi";
import api from "../../services/api";

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedBooking, setSelectedBooking] = useState(null);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      // Replace this endpoint if your backend uses a different route.
      const response = await api.get("/bookings/admin/list");

      const data = response.data;
      const list = Array.isArray(data)
        ? data
        : data.bookings || data.data || [];

      setBookings(list);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load bookings. Check your backend API route.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const getBookingId = (booking) =>
    booking.bookingId || booking.reference || booking._id || booking.id;

  const getCustomer = (booking) =>
    booking.userId?.name ||
    booking.userId?.fullName ||
    booking.userId?.email ||
    booking.customer?.name ||
    booking.customerName ||
    "Unknown customer";

  const getMovie = (booking) =>
    booking.showId?.movieId?.title ||
    booking.movie?.title ||
    booking.movieName ||
    "Unknown movie";

  const getTheatre = (booking) =>
    booking.showId?.theatreId?.name ||
    booking.theatre?.name ||
    booking.theatreName ||
    "Unknown theatre";

  const getSeats = (booking) => {
    const seats = booking.seatLabels || booking.seats || booking.seatIds || [];

    if (!Array.isArray(seats)) return String(seats || "—");

    return (
      seats
        .map((seat) =>
          typeof seat === "string"
            ? seat
            : seat.seatNumber || seat.label || seat.number || "",
        )
        .filter(Boolean)
        .join(", ") || "—"
    );
  };

  const getAmount = (booking) =>
    Number(booking.totalAmount ?? booking.amount ?? 0);

  const getPayment = (booking) =>
    String(
      booking.paymentStatus ||
        booking.payment?.status ||
        booking.paymentStatusText ||
        "Pending",
    ).toLowerCase();

  const getStatus = (booking) =>
    String(booking.status || booking.bookingStatus || "Pending").toLowerCase();

  const getDate = (booking) => {
    const value =
      booking.showId?.startTime ||
      booking.showId?.date ||
      booking.showDate ||
      booking.date ||
      booking.createdAt;

    if (!value) return "—";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? String(value)
      : date.toLocaleDateString("en-CA");
  };
  const normalizedBookings = bookings.map((booking) => ({
    raw: booking,
    id: String(getBookingId(booking) || ""),
    customer: getCustomer(booking),
    movie: getMovie(booking),
    theatre: getTheatre(booking),
    date: getDate(booking),
    seats: getSeats(booking),
    amount: getAmount(booking),
    payment: getPayment(booking),
    status: getStatus(booking),
  }));

  const filteredBookings = normalizedBookings.filter((booking) => {
    const matchesSearch = [
      booking.id,
      booking.customer,
      booking.movie,
      booking.theatre,
    ]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || booking.status === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });
  function cancelBooking(id) {
    if (!window.confirm("Cancel this booking?")) return;

    setBookings((previous) =>
      previous.map((booking) =>
        booking.id === id ? { ...booking, status: "Cancelled" } : booking,
      ),
    );

    setSelectedBooking(null);
  }

  function exportBookings() {
    const headers = [
      "Booking ID",
      "Customer",
      "Movie",
      "Theatre",
      "Date",
      "Seats",
      "Amount",
      "Payment",
      "Status",
    ];

    const escapeCsv = (value) => `"${String(value).replace(/"/g, '""')}"`;

    const rows = filteredBookings.map((booking) =>
      [
        booking.id,
        booking.customer,
        booking.movie,
        booking.theatre,
        booking.date,
        booking.seats,
        booking.amount,
        booking.payment,
        booking.status,
      ]
        .map(escapeCsv)
        .join(","),
    );

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "flickt-bookings.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <h3>Booking Management</h3>
          <p>Review and manage customer ticket reservations.</p>
        </div>

        <button
          className="admin-primary-button"
          onClick={exportBookings}
          type="button"
        >
          <FiDownload /> Export CSV
        </button>
      </div>

      <div className="admin-booking-toolbar">
        <div className="admin-search">
          <FiSearch size={18} />
          <input
            type="search"
            placeholder="Search booking, customer, movie..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <select
          className="admin-filter-select"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter bookings by status"
        >
          <option value="All">All Bookings</option>
          <option value="confirmed">Confirmed</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      {loading && <p>Loading bookings...</p>}

      {error && (
        <div className="admin-error-message">
          <p>{error}</p>
          <button
            type="button"
            className="admin-secondary-button"
            onClick={loadBookings}
          >
            <FiRefreshCw /> Retry
          </button>
        </div>
      )}

      <div className="admin-booking-summary">
        <div>
          <span>Total bookings</span>
          <strong>{normalizedBookings.length}</strong>
        </div>

        <div>
          <span>Confirmed</span>
          <strong>
            {
              normalizedBookings.filter(
                (booking) => booking.status.toLowerCase() === "confirmed",
              ).length
            }
          </strong>
        </div>

        <div>
          <span>Cancelled</span>
          <strong>
            {
              normalizedBookings.filter(
                (booking) => booking.status.toLowerCase() === "cancelled",
              ).length
            }
          </strong>
        </div>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Customer / Movie</th>
              <th>Show Date</th>
              <th>Seats</th>
              <th>Amount</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredBookings.length === 0 ? (
              <tr>
                <td colSpan="8" className="admin-empty-state">
                  <FiCalendar size={24} />
                  <p>No bookings found.</p>
                  <span>Try another search or status filter.</span>
                </td>
              </tr>
            ) : (
              filteredBookings.map((booking) => (
                <tr key={booking.id}>
                  <td>{booking.id}</td>
                  <td>
                    <strong>{booking.customer}</strong>
                    <div className="admin-cell-secondary">{booking.movie}</div>
                  </td>
                  <td>{booking.date}</td>
                  <td>{booking.seats}</td>
                  <td>₹{booking.amount}</td>
                  <td>
                    <span
                      className={`admin-status ${
                        booking.payment === "paid" ? "" : "pending"
                      }`}
                    >
                      {booking.payment}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`admin-status ${
                        booking.status === "cancelled"
                          ? "cancelled"
                          : booking.status === "pending"
                            ? "pending"
                            : ""
                      }`}
                    >
                      {booking.status}
                    </span>
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      <button
                        className="admin-icon-button"
                        type="button"
                        title="View booking"
                        onClick={() => setSelectedBooking(booking)}
                      >
                        <FiEye />
                      </button>
                      {booking.status !== "cancelled" && (
                        <button
                          className="admin-delete-button"
                          type="button"
                          title="Cancel booking"
                          onClick={() => cancelBooking(booking.id)}
                        >
                          <FiXCircle />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedBooking && (
        <div className="admin-form-overlay">
          <div className="admin-movie-form">
            <div className="admin-panel-heading">
              <h3>Booking Details</h3>
              <button
                className="admin-secondary-button"
                type="button"
                onClick={() => setSelectedBooking(null)}
              >
                Close
              </button>
            </div>

            {Object.entries(selectedBooking)
              .filter(([key]) => key !== "raw")
              .map(([key, value]) => (
                <p className="admin-detail-row" key={key}>
                  <span>{key.replace(/([A-Z])/g, " $1")}</span>
                  <strong>{String(value ?? "—")}</strong>
                </p>
              ))}
          </div>
        </div>
      )}
    </section>
  );
}
