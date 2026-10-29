import React, { useEffect, useMemo, useState } from "react";
import {
  FiPlus,
  FiSearch,
  FiCalendar,
  FiClock,
  FiTrash2,
  FiRefreshCw,
} from "react-icons/fi";
import api from "../../services/api";

function getId(value) {
  return typeof value === "object" && value !== null ? value._id : value;
}

function formatDate(value) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value) {
  if (!value) return "—";

  return new Date(value).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminShows() {
  const [shows, setShows] = useState([]);
  const [movies, setMovies] = useState([]);
  const [cities, setCities] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [screens, setScreens] = useState([]);

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    movieId: "",
    cityId: "",
    theatreId: "",
    screenId: "",
    date: "",
    startTime: "",
    endTime: "",
    language: "Hindi",
    format: "2D",
    standardPrice: "220",
  premiumPrice: "280",
  reclinerPrice: "420",
  });

  const filteredShows = useMemo(() => {
    const query = search.toLowerCase();

    return shows.filter((show) => {
      const movie = typeof show.movieId === "object" ? show.movieId?.title : "";

      const theatre =
        typeof show.theatreId === "object" ? show.theatreId?.name : "";

      const screen =
        typeof show.screenId === "object" ? show.screenId?.name : "";

      return `${movie || ""} ${theatre || ""} ${screen || ""}`
        .toLowerCase()
        .includes(query);
    });
  }, [shows, search]);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
  const [
    showResponse,
    movieResponse,
    cityResponse,
    theatreResponse,
    screenResponse,
  ] = await Promise.all([
    api.get("/admin/shows"),
    api.get("/admin/movies"),
    api.get("/cities"),
    api.get("/admin/theatres"),
    api.get("/admin/screens"),
  ]);

  const showData = showResponse.data;
  const movieData = movieResponse.data;
  const cityData = cityResponse.data;
  const theatreData = theatreResponse.data;
  const screenData = screenResponse.data;

  setShows(Array.isArray(showData) ? showData : showData.shows || []);
  setMovies(Array.isArray(movieData) ? movieData : movieData.movies || []);
  setCities(Array.isArray(cityData) ? cityData : cityData.cities || []);
  setTheatres(
    Array.isArray(theatreData) ? theatreData : theatreData.theatres || []
  );
  setScreens(
    Array.isArray(screenData) ? screenData : screenData.screens || []
  );
} catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const availableScreens = screens.filter(
    (screen) => String(getId(screen.theatreId)) === String(form.theatreId),
  );

  const filteredTheatres = theatres.filter((theatre) => {
    const theatreCityId = getId(theatre.cityId);

    return String(theatreCityId) === String(form.cityId);
  });

  function updateForm(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function handleTheatreChange(theatreId) {
    setForm((previous) => ({
      ...previous,
      theatreId,
      screenId: "",
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.movieId || !form.theatreId || !form.screenId) {
      setError("Please select a movie, theatre, and screen.");
      return;
    }

    const start = new Date(`${form.date}T${form.startTime}:00`);
    const end = new Date(`${form.date}T${form.endTime}:00`);

    if (
      !form.date ||
      !form.startTime ||
      !form.endTime ||
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      setError("Please enter a valid date and both show times.");
      return;
    }

    if (start <= new Date()) {
      setError("The show must start in the future.");
      return;
    }

    if (end <= start) {
      setError("End time must be after start time.");
      return;
    }

    setSaving(true);

    try {
      const pricing = {
        standard: Number(form.standardPrice),
        premium: Number(form.premiumPrice),
        recliner: Number(form.reclinerPrice),
      };

      if (
        Object.values(pricing).some(
          (price) => !Number.isFinite(price) || price <= 0,
        )
      ) {
        throw new Error("Enter a valid price for every seat category.");
      }

      const response = await api.post("/admin/shows", {
  movieId: form.movieId,
  theatreId: form.theatreId,
  screenId: form.screenId,
  startTime: start.toISOString(),
  endTime: end.toISOString(),
  language: form.language,
  format: form.format,
  pricing,
});

const savedShow = response.data;

      setShows((previous) => [...previous, savedShow]);
      setForm({
        movieId: "",
        cityId: "",
        theatreId: "",
        screenId: "",
        date: "",
        startTime: "",
        endTime: "",
        language: "Hindi",
        format: "2D",
        standardPrice: "220",
        premiumPrice: "280",
        reclinerPrice: "420",
      });

      setShowForm(false);
      setSuccess("Show saved successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteShow(id) {
    if (!window.confirm("Delete this show schedule?")) return;

    setError("");
    setSuccess("");

    try {
      await api.delete(`/admin/shows/${id}`);

setShows((previous) =>
  previous.filter((show) => show._id !== id)
);

setSuccess("Show deleted successfully.");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <h3>Shows &amp; Schedules</h3>
          <p>Create and manage movie showtimes.</p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            className="admin-secondary-button"
            onClick={loadData}
            disabled={loading}
          >
            <FiRefreshCw /> Refresh
          </button>

          <button
            type="button"
            className="admin-primary-button"
            onClick={() => {
              setError("");
              setSuccess("");
              setShowForm(true);
            }}
          >
            <FiPlus /> Add Show
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" style={{ color: "#ff6b75", margin: "16px 0" }}>
          {error}
        </p>
      )}

      {success && (
        <p role="status" style={{ color: "#20c978", margin: "16px 0" }}>
          {success}
        </p>
      )}

      <div className="admin-search">
        <FiSearch size={18} />
        <input
          type="search"
          placeholder="Search movie, theatre, screen..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {showForm && (
        <div className="admin-form-overlay">
          <form className="admin-movie-form" onSubmit={handleSubmit}>
            <div className="admin-panel-heading">
              <h3>Create Show</h3>

              <button
                type="button"
                className="admin-secondary-button"
                onClick={() => setShowForm(false)}
              >
                Close
              </button>
            </div>

            <label>
              Movie
              <select
                required
                value={form.movieId}
                onChange={(event) => updateForm("movieId", event.target.value)}
              >
                <option value="">Select movie</option>
                {movies.map((movie) => (
                  <option key={movie._id} value={movie._id}>
                    {movie.title}
                  </option>
                ))}
              </select>
            </label>

            <label>
              City
              <select
                required
                value={form.cityId}
                onChange={(event) => {
                  const cityId = event.target.value;

                  setForm((previous) => ({
                    ...previous,
                    cityId,
                    theatreId: "",
                    screenId: "",
                  }));
                }}
              >
                <option value="">Select city</option>

                {cities.map((city) => (
                  <option key={city._id} value={city._id}>
                    {city.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Theatre
              <select
                required
                value={form.theatreId}
                disabled={!form.cityId}
                onChange={(event) => handleTheatreChange(event.target.value)}
              >
                <option value="">
                  {form.cityId ? "Select theatre" : "Select city first"}
                </option>

                {filteredTheatres.map((theatre) => (
                  <option key={theatre._id} value={theatre._id}>
                    {theatre.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Screen
              <select
                required
                value={form.screenId}
                onChange={(event) => updateForm("screenId", event.target.value)}
                disabled={!form.theatreId}
              >
                <option value="">Select screen</option>
                {availableScreens.map((screen) => (
                  <option key={screen._id} value={screen._id}>
                    {screen.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Show Date
              <input
                type="date"
                required
                min={new Date().toLocaleDateString("en-CA")}
                value={form.date}
                onChange={(event) => updateForm("date", event.target.value)}
              />
            </label>

            <label>
              Start Time
              <input
                type="time"
                required
                value={form.startTime}
                onChange={(event) =>
                  updateForm("startTime", event.target.value)
                }
              />
            </label>

            <label>
              End Time
              <input
                type="time"
                required
                value={form.endTime}
                onChange={(event) => updateForm("endTime", event.target.value)}
              />
            </label>

            <label>
              Language
              <input
                required
                value={form.language}
                onChange={(event) => updateForm("language", event.target.value)}
              />
            </label>

            <label>
              Format
              <select
                value={form.format}
                onChange={(event) => updateForm("format", event.target.value)}
              >
                <option value="2D">2D</option>
                <option value="3D">3D</option>
                <option value="IMAX">IMAX</option>
                <option value="4DX">4DX</option>
              </select>
            </label>

            <label>
              Standard Price (₹)
              <input
                type="number"
                min="1"
                required
                value={form.standardPrice}
                onChange={(e) => updateForm("standardPrice", e.target.value)}
              />
            </label>

            <label>
              Premium Price (₹)
              <input
                type="number"
                min="1"
                required
                value={form.premiumPrice}
                onChange={(e) => updateForm("premiumPrice", e.target.value)}
              />
            </label>

            <label>
              Recliner Price (₹)
              <input
                type="number"
                min="1"
                required
                value={form.reclinerPrice}
                onChange={(e) => updateForm("reclinerPrice", e.target.value)}
              />
            </label>

            <div className="admin-form-actions">
              <button
                type="button"
                className="admin-secondary-button"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="admin-primary-button"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Show"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Movie</th>
              <th>Theatre</th>
              <th>Date</th>
              <th>Time</th>
              <th>Screen</th>
              <th>Ticket Prices</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="admin-empty-state">
                  Loading shows...
                </td>
              </tr>
            ) : filteredShows.length === 0 ? (
              <tr>
                <td colSpan="7" className="admin-empty-state">
                  <FiCalendar size={24} />
                  <p>No shows scheduled yet.</p>
                  <span>
                    Add a show after creating movies, theatres, and screens.
                  </span>
                </td>
              </tr>
            ) : (
              filteredShows.map((show) => (
                <tr key={show._id}>
                  <td>
                    {typeof show.movieId === "object"
                      ? show.movieId?.title
                      : "Movie unavailable"}
                  </td>

                  <td>
                    {typeof show.theatreId === "object"
                      ? show.theatreId?.name
                      : "Theatre unavailable"}
                  </td>

                  <td>{formatDate(show.startTime)}</td>
                  <td>
                    <FiClock size={14} /> {formatTime(show.startTime)}
                  </td>

                  <td>
                    {typeof show.screenId === "object"
                      ? show.screenId?.name
                      : "Screen unavailable"}
                  </td>

                  
<td>
  <div>
    <div>Standard: ₹{show.pricing?.standard ?? "—"}</div>
    <div>Premium: ₹{show.pricing?.premium ?? "—"}</div>
    <div>Recliner: ₹{show.pricing?.recliner ?? "—"}</div>
  </div>
</td>


                  <td>
                    <button
                      type="button"
                      className="admin-delete-button"
                      onClick={() => deleteShow(show._id)}
                      aria-label="Delete show"
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
