import React, { useCallback, useEffect, useState } from "react";
import {
  FiMapPin,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
} from "react-icons/fi";
import api from "../../services/api";

export default function AdminCities() {
  const [cities, setCities] = useState([]);
  const [cityName, setCityName] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  
  



  const loadCities = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/cities");
const data = response.data;

const list = Array.isArray(data)
  ? data
  : data.cities || data.data || [];

setCities(list);
    } catch (err) {
      setError(err.message || "Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCities();
  }, [loadCities]);

  async function addCity(event) {
    event.preventDefault();
    const name = cityName.trim();

    if (!name) return;

    if (
      cities.some(
        (city) =>
          (city.name || city.cityName || "").trim().toLowerCase() ===
          name.toLowerCase(),
      )
    ) {
      setError("This city is already in the list.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await api.post("/admin/cities", { name });

setCityName("");
setMessage("City added successfully.");
await loadCities();

    } catch (err) {
      setError(err.message || "Could not add city.");
    } finally {
      setSaving(false);
    }
  }

  async function removeCity(city) {
    const id = city._id || city.id;

    if (!id) {
      setError("This city has no ID, so it cannot be deleted.");
      return;
    }

    const name = city.name || city.cityName || "this city";

    if (!window.confirm(`Are you sure you want to remove ${name}?`)) {
      return;
    }

    setError("");
    setMessage("");

    try {
      await api.delete(`/admin/cities/${id}`);

setMessage(`${name} removed successfully.`);
await loadCities();
    } catch (err) {
      setError(err.message || "Could not remove city.");
    }
  }

  const filteredCities = cities.filter((city) =>
    (city.name || city.cityName || "")
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <section className="admin-panel admin-cities-page">
      <div className="admin-panel-heading">
        <div>
          <h3>City Management</h3>
          <p>Manage the cities available to customers when booking tickets.</p>
        </div>

        <button
          type="button"
          className="admin-secondary-button"
          onClick={loadCities}
          disabled={loading}
        >
          <FiRefreshCw /> Refresh
        </button>
      </div>

      <div className="cities-summary">
        <div className="cities-summary-icon">
          <FiMapPin size={24} />
        </div>
        <div>
          <span>Available cities</span>
          <strong>{cities.length}</strong>
        </div>
      </div>

      <form className="cities-add-form" onSubmit={addCity}>
        <label htmlFor="new-city">Add a city</label>
        <div className="cities-add-row">
          <input
            id="new-city"
            value={cityName}
            onChange={(event) => setCityName(event.target.value)}
            placeholder="Enter city name, e.g. Pune"
            required
          />
          <button
            className="admin-primary-button"
            type="submit"
            disabled={saving}
          >
            <FiPlus /> {saving ? "Adding..." : "Add City"}
          </button>
        </div>
      </form>

      <div className="admin-search cities-search">
        <FiSearch size={18} />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search existing cities..."
        />
      </div>

      {error && <p className="cities-message cities-error">{error}</p>}
      {message && <p className="cities-message cities-success">{message}</p>}

      <div className="cities-list-heading">
        <h4>Existing Cities</h4>
        <span>{filteredCities.length} cities</span>
      </div>

      {loading ? (
        <p className="cities-empty">Loading cities...</p>
      ) : filteredCities.length === 0 ? (
        <p className="cities-empty">
          {cities.length === 0
            ? "No cities returned by the server yet."
            : "No cities match your search."}
        </p>
      ) : (
        <div className="cities-grid">
          {filteredCities.map((city) => {
            const id = city._id || city.id;
            const name = city.name || city.cityName || "Unnamed city";

            return (
              <div className="city-card" key={id || name}>
                <div className="city-card-icon">
                  <FiMapPin size={20} />
                </div>
                <div className="city-card-info">
                  <strong>{name}</strong>
                  <span>
                    {city.state || city.region || "Available location"}
                  </span>
                </div>
                <button
                  type="button"
                  className="admin-delete-button"
                  onClick={() => removeCity(city)}
                  title={`Remove ${name}`}
                  aria-label={`Remove ${name}`}
                >
                  <FiTrash2 />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
