
import React, { useEffect, useState } from "react";
import "../styles/components/SeatMap.css";
import api from "../services/api";

export default function SeatMap({ showId, selected = [], onChange }) {
  console.log("SeatMap component rendered");
console.log("Current showId:", showId);
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadSeats() {
      if (!showId || showId === "show-demo") {
        setSeats([]);
        setError("Please select a valid show before selecting seats.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        console.log("SeatMap showId:", showId);
console.log("Requesting seats for:", `/shows/${showId}/seats`);

const response = await api.get(`/shows/${showId}/seats`);

console.log("Seats API response:", response.data);

        const seatData = Array.isArray(response.data)
          ? response.data
          : response.data?.seats;

        if (!Array.isArray(seatData)) {
          throw new Error("Invalid seat data received from the server.");
        }

        const validSeats = seatData.filter(
          (seat) =>
            seat &&
            seat._id &&
            seat.rowLabel != null &&
            seat.seatNumber != null,
        );

        if (active) {
          setSeats(validSeats);
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Unable to load seats. Please try again.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSeats();

    return () => {
      active = false;
    };
  }, [showId]);

  function toggleSeat(seat) {
    const availability = String(
      seat.availability || "unknown",
    ).toLowerCase();

    if (!seat._id || availability !== "available") {
      return;
    }

    const alreadySelected = selected.some(
      (item) =>
        (typeof item === "string" ? item : item?._id) === seat._id,
    );

    if (alreadySelected) {
      onChange(
        selected.filter(
          (item) =>
            (typeof item === "string" ? item : item?._id) !== seat._id,
        ),
      );
    } else {
      onChange([...selected, seat]);
    }
  }

  if (loading) {
    return <p>Loading seats...</p>;
  }

  if (error) {
    return <p className="inline-message">{error}</p>;
  }

  if (!seats.length) {
    return <p>No seats are available for this show.</p>;
  }

  const rows = [
    ...new Set(seats.map((seat) => seat.rowLabel)),
  ].sort();

  return (
    <div className="seat-map">
      {rows.map((row) => (
        <div className="seat-row" key={row}>
          <span className="row-label">{row}</span>

          {seats
            .filter((seat) => seat.rowLabel === row)
            .sort((a, b) => Number(a.seatNumber) - Number(b.seatNumber))
            .map((seat) => {
              const isSelected = selected.some(
                (item) =>
                  (typeof item === "string" ? item : item?._id) ===
                  seat._id,
              );

              const availability = String(
                seat.availability || "unknown",
              ).toLowerCase();

              const label = `${seat.rowLabel}${seat.seatNumber}`;

              let state;

              if (isSelected) {
                state = "selected";
              } else if (
                ["booked", "blocked"].includes(availability)
              ) {
                state = "booked";
              } else if (availability === "locked") {
                state = "locked";
              } else if (availability === "available") {
                state =
                  seat.category === "recliner"
                    ? "recliner"
                    : seat.category === "premium"
                      ? "premium"
                      : "available";
              } else {
                state = "booked";
              }

              return (
                <button
                  key={seat._id}
                  type="button"
                  title={`${label} · ${state}`}
                  aria-label={`${label} ${state}`}
                  aria-pressed={isSelected}
                  disabled={
                    availability !== "available" && !isSelected
                  }
                  className={`seat ${state}`}
                  onClick={() => toggleSeat(seat)}
                >
                  {seat.seatNumber}
                </button>
              );
            })}

          <span className="row-label">{row}</span>
        </div>
      ))}
    </div>
  );
}
