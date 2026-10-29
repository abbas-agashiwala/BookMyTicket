
import React, { useEffect, useState } from "react";
import {
  FiPlus,
  FiSearch,
  FiTrash2,
  FiFilm,
} from "react-icons/fi";

const API_URL = "http://localhost:5000/api";

const emptyForm = {
  title: "",
  poster: "",
  description: "",
  genre: "",
  language: "",
  duration: "120",
  certification: "",
  releaseDate: "",
  status: "now-showing",
};

export default function AdminMovies() {
  const [movies, setMovies] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function getToken() {
    return localStorage.getItem("flickt_token");
  }

  // Load movies saved in MongoDB.
  async function loadMovies() {
    setLoading(true);
    setError("");

    try {
      const token = getToken();

      if (!token) {
        throw new Error("Please log in as an administrator again.");
      }

      const response = await fetch(`${API_URL}/admin/movies`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load movies.");
      }

      setMovies(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Could not load movies.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMovies();
  }, []);

  const filteredMovies = movies.filter((movie) => {
    const searchableText = [
      movie.title,
      ...(Array.isArray(movie.genre) ? movie.genre : []),
      ...(Array.isArray(movie.language) ? movie.language : []),
      movie.status,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(search.toLowerCase());
  });

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const token = getToken();

      if (!token) {
        throw new Error("Please log in as an administrator again.");
      }

      const slug = form.title
        .trim()
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      if (!slug) {
        throw new Error("Please enter a valid movie title.");
      }

      const movieData = {
        title: form.title.trim(),
        slug,
        poster: form.poster.trim(),
        description: form.description.trim(),
        genre: form.genre
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        language: form.language
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        duration: Number(form.duration) || 120,
        certification: form.certification.trim(),
        releaseDate: form.releaseDate || undefined,
        status: form.status,
      };

      const response = await fetch(`${API_URL}/admin/movies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(movieData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save movie.");
      }

      setForm(emptyForm);
      setShowForm(false);
      setSuccess("Movie saved successfully.");

      // Reload the actual database records.
      await loadMovies();
      setSuccess("Movie saved successfully.");
    } catch (err) {
      setError(err.message || "Could not save movie.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteMovie(movie) {
    if (
      !window.confirm(
        `Are you sure you want to delete "${movie.title}"?`
      )
    ) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const token = getToken();

      if (!token) {
        throw new Error("Please log in as an administrator again.");
      }

      const response = await fetch(
        `${API_URL}/admin/movies/${movie._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete movie.");
      }

      setSuccess("Movie deleted successfully.");
      await loadMovies();
    } catch (err) {
      setError(err.message || "Could not delete movie.");
    }
  }

  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <h3>Movie Library</h3>
          <p>Manage the movies displayed to customers.</p>
        </div>

        <button
          type="button"
          className="admin-primary-button"
          onClick={() => {
            setError("");
            setShowForm(true);
          }}
        >
          <FiPlus /> Add Movie
        </button>
      </div>

      {error && (
        <div className="admin-error-message" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="admin-success-message" role="status">
          {success}
        </div>
      )}

      <div className="admin-search">
        <FiSearch size={18} />
        <input
          type="search"
          placeholder="Search movies, genre, language..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {showForm && (
        <div className="admin-form-overlay">
          <form className="admin-movie-form" onSubmit={handleSubmit}>
            <div className="admin-panel-heading">
              <h3>Add New Movie</h3>

              <button
                type="button"
                className="admin-secondary-button"
                onClick={() => setShowForm(false)}
              >
                Close
              </button>
            </div>

            <label>
              Movie Title
              <input
                name="title"
                required
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Interstellar"
              />
            </label>

            <label>
              Poster Image URL
              <input
                name="poster"
                type="url"
                value={form.poster}
                onChange={handleChange}
                placeholder="https://example.com/poster.jpg"
              />
            </label>

            <label>
              Description
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Enter movie description"
                rows="3"
              />
            </label>

            <label>
              Genre
              <input
                name="genre"
                required
                value={form.genre}
                onChange={handleChange}
                placeholder="Action, Drama"
              />
              <small>Separate multiple genres with commas.</small>
            </label>

            <label>
              Language
              <input
                name="language"
                required
                value={form.language}
                onChange={handleChange}
                placeholder="Hindi, English"
              />
              <small>Separate multiple languages with commas.</small>
            </label>

            <label>
              Duration (minutes)
              <input
                name="duration"
                type="number"
                min="1"
                required
                value={form.duration}
                onChange={handleChange}
              />
            </label>

            <label>
              Certification
              <select
                name="certification"
                value={form.certification}
                onChange={handleChange}
              >
                <option value="">Select certification</option>
                <option value="U">U</option>
                <option value="UA 7+">UA 7+</option>
                <option value="UA 13+">UA 13+</option>
                <option value="UA 16+">UA 16+</option>
                <option value="A">A</option>
              </select>
            </label>

            <label>
              Release Date
              <input
                name="releaseDate"
                type="date"
                value={form.releaseDate}
                onChange={handleChange}
              />
            </label>

            <label>
              Movie Status
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
              >
                <option value="now-showing">Now Showing</option>
                <option value="coming-soon">Coming Soon</option>
                <option value="archived">Archived</option>
              </select>
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
                {saving ? "Saving..." : "Save Movie"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Movie Title</th>
              <th>Genre</th>
              <th>Language</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="admin-empty-state">
                  Loading movies...
                </td>
              </tr>
            ) : filteredMovies.length === 0 ? (
              <tr>
                <td colSpan="5" className="admin-empty-state">
                  <FiFilm size={25} />
                  <p>
                    {search
                      ? "No movies match your search."
                      : "No movies added yet."}
                  </p>
                  <span>
                    {search
                      ? "Try another search."
                      : 'Click "Add Movie" to add your first movie.'}
                  </span>
                </td>
              </tr>
            ) : (
              filteredMovies.map((movie) => (
                <tr key={movie._id}>
                  <td>{movie.title}</td>
                  <td>
                    {Array.isArray(movie.genre)
                      ? movie.genre.join(", ")
                      : "—"}
                  </td>
                  <td>
                    {Array.isArray(movie.language)
                      ? movie.language.join(", ")
                      : "—"}
                  </td>
                  <td>
                    <span
                      className={`admin-status-badge ${
                        movie.status === "now-showing"
                          ? "active"
                          : movie.status === "coming-soon"
                            ? "warning"
                            : ""
                      }`}
                    >
                      {movie.status === "now-showing"
                        ? "Now Showing"
                        : movie.status === "coming-soon"
                          ? "Coming Soon"
                          : "Archived"}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="admin-delete-button"
                      onClick={() => deleteMovie(movie)}
                      aria-label={`Delete ${movie.title}`}
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
