
import React, { useEffect, useState } from "react";
import {
  FiPlus,
  FiSearch,
  FiTrash2,
  FiMonitor,
  FiMapPin,
} from "react-icons/fi";

const API_URL = "http://localhost:5000/api";

export default function AdminTheatres() {
  const [theatres, setTheatres] = useState([]);
  const [cities, setCities] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    cityId: "",
    address: "",
    screens: "1",
  capacity: "100",
  });

  const getToken = () => localStorage.getItem("flickt_token");

  // Fetch saved theatres and available cities from the backend.
  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const token = getToken();

      if (!token) {
        throw new Error("Please log in as an administrator again.");
      }

      const [theatreResponse, cityResponse] = await Promise.all([
        fetch(`${API_URL}/admin/theatres`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`${API_URL}/cities`),
      ]);

      const theatreData = await theatreResponse.json();
      const cityData = await cityResponse.json();

      if (!theatreResponse.ok) {
        throw new Error(
          theatreData.message || "Could not load theatres."
        );
      }

      if (!cityResponse.ok) {
        throw new Error(cityData.message || "Could not load cities.");
      }

      setTheatres(Array.isArray(theatreData) ? theatreData : []);
      setCities(Array.isArray(cityData) ? cityData : []);
    } catch (err) {
      setError(err.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredTheatres = theatres.filter((theatre) => {
    const cityName =
      typeof theatre.cityId === "object"
        ? theatre.cityId?.name || ""
        : cities.find((city) => city._id === theatre.cityId)?.name || "";

    return `${theatre.name || ""} ${cityName} ${theatre.address || ""}`
      .toLowerCase()
      .includes(search.toLowerCase());
  });

  function updateForm(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  

async function handleSubmit(event) {
  event.preventDefault();

  setSaving(true);
  setError("");
  setSuccess("");

  try {
    const token = getToken();

    if (!token) {
      throw new Error("Please log in as an administrator again.");
    }

    const response = await fetch(`${API_URL}/admin/theatres`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: form.name.trim(),
        cityId: form.cityId,
        address: form.address.trim(),
        screens: Number(form.screens),
        capacity: Number(form.capacity),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to save theatre.");
    }

    setSuccess("Theatre added successfully!");

    setForm({
      name: "",
      cityId: "",
      address: "",
      screens: "1",
      capacity: "100",
    });

    setShowForm(false);

    // Fetch saved records again from MongoDB.
    await loadData();
  } catch (err) {
    setError(err.message || "Failed to save theatre.");
  } finally {
    setSaving(false);
  }
}


  async function deleteTheatre(id) {
    if (!window.confirm("Are you sure you want to remove this theatre?")) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const token = getToken();

      if (!token) {
        throw new Error("Please log in as an administrator again.");
      }

      const response = await fetch(`${API_URL}/admin/theatres/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not remove theatre.");
      }

      setSuccess("Theatre removed successfully.");
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to remove theatre.");
    }
  }

  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <h3>Theatre Management</h3>
          <p>Manage cinema locations, screens and seating capacity.</p>
        </div>

        <button
          type="button"
          className="admin-primary-button"
          onClick={() => {
            setError("");
            setShowForm(true);
          }}
        >
          <FiPlus /> Add Theatre
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
          placeholder="Search theatre or city..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {showForm && (
        <div className="admin-form-overlay">
          <form className="admin-movie-form" onSubmit={handleSubmit}>
            <div className="admin-panel-heading">
              <h3>Add New Theatre</h3>

              <button
                type="button"
                className="admin-secondary-button"
                onClick={() => setShowForm(false)}
              >
                Close
              </button>
            </div>

            <label>
              Theatre Name
              <input
                name="name"
                required
                value={form.name}
                onChange={updateForm}
                placeholder="e.g. Flickt Cinemas"
              />
            </label>

            <label>
              City
              <select
                name="cityId"
                required
                value={form.cityId}
                onChange={updateForm}
              >
                <option value="">Select a city</option>
                {cities.map((city) => (
                  <option key={city._id} value={city._id}>
                    {city.name}
                  </option>
                ))}
              </select>
            </label>

            {cities.length === 0 && (
              <p>Add an active city in the Cities section before creating a theatre.</p>
            )}

            <label>
              Full Address
              <input
                name="address"
                required
                value={form.address}
                onChange={updateForm}
                placeholder="Enter theatre address"
              />
            </label>
            
<label>
  Number of Screens
  <input
    type="number"
    name="screens"
    min="1"
    max="50"
    required
    value={form.screens}
    onChange={updateForm}
    placeholder="e.g. 4"
  />
</label>

<label>
  Total Seat Capacity
  <input
    type="number"
    name="capacity"
    min="1"
    required
    value={form.capacity}
    onChange={updateForm}
    placeholder="e.g. 250"
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
                disabled={saving || cities.length === 0}
              >
                {saving ? "Saving..." : "Save Theatre"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Theatre</th>
              <th>City</th>
              <th>Address</th>
              <th>Screens</th>
              <th>Seat Capacity</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="admin-empty-state">
                  Loading theatres...
                </td>
              </tr>
            ) : filteredTheatres.length === 0 ? (
              <tr>
                <td colSpan="6" className="admin-empty-state">
                  <FiMonitor size={25} />
                  <p>
                    {search
                      ? "No theatres match your search."
                      : "No theatres added yet."}
                  </p>
                  <span>
                    {search
                      ? "Try another search."
                      : 'Click "Add Theatre" to register your first cinema.'}
                  </span>
                </td>
              </tr>
            ) : (
              filteredTheatres.map((theatre) => {
                const cityName =
                  typeof theatre.cityId === "object"
                    ? theatre.cityId?.name || "Unknown"
                    : cities.find((city) => city._id === theatre.cityId)?.name ||
                      "Unknown";

                return (
                  <tr key={theatre._id}>
                    <td>{theatre.name}</td>
                    <td>
                      <FiMapPin size={14} /> {cityName}
                    </td>
                    <td>{theatre.address || "—"}</td>
                    
<td>{theatre.screens ?? "—"}</td>
<td>{theatre.capacity ?? "—"}</td>

                    <td>
                      <button
                        type="button"
                        className="admin-delete-button"
                        onClick={() => deleteTheatre(theatre._id)}
                        aria-label={`Delete ${theatre.name}`}
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
