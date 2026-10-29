
import React, { useCallback, useEffect, useState } from "react";
import {
  FiSearch,
  FiEye,
  FiUserCheck,
  FiUserX,
  FiUsers,
  FiRefreshCw,
} from "react-icons/fi";
import api from "../../services/api";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/auth/admin/users");
      const list = response.data.users || [];
      setUsers(list);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load users. Check your backend API and admin login."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = users.filter((user) => {
    const matchesSearch = [
      user._id,
      user.name,
      user.email,
      user.phone,
    ]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase());

    const status =
      user.accountStatus === "disabled" ? "Inactive" : "Active";

    const matchesStatus =
      statusFilter === "All" || status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  async function toggleStatus(user) {
    const currentlyDisabled = user.accountStatus === "disabled";
    const nextStatus = currentlyDisabled ? "active" : "disabled";

    const action = currentlyDisabled ? "activate" : "deactivate";

    if (!window.confirm(`Are you sure you want to ${action} ${user.name}?`)) {
      return;
    }

    // Status changes need a backend endpoint to persist in MongoDB.
    // Do not change the UI locally and pretend the database was updated.
    setError(
      "Account status updates are not connected yet. Add a protected backend endpoint first."
    );
  }

  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <h3>User Management</h3>
          <p>View registered customers and manage account status.</p>
        </div>

        <button
          type="button"
          className="admin-secondary-button"
          onClick={loadUsers}
          disabled={loading}
        >
          <FiRefreshCw /> {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div className="admin-booking-summary">
        <div>
          <span>Total Users</span>
          <strong>{users.length}</strong>
        </div>

        <div>
          <span>Active Users</span>
          <strong>
            {users.filter((user) => user.accountStatus === "active").length}
          </strong>
        </div>

        <div>
          <span>Inactive Users</span>
          <strong>
            {users.filter((user) => user.accountStatus === "disabled").length}
          </strong>
        </div>
      </div>

      <div className="admin-booking-toolbar">
        <div className="admin-search">
          <FiSearch size={18} />
          <input
            type="search"
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <select
          className="admin-filter-select"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter users by status"
        >
          <option value="All">All Users</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="admin-empty-state">
                  Loading registered users...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={4} className="admin-empty-state">
                  <FiUsers size={24} />
                  <p>No users found.</p>
                  <span>
                    {users.length === 0
                      ? "No registered customer accounts were returned."
                      : "Try a different search or filter."}
                  </span>
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user._id}>
                  <td>
                    <strong>{user.name}</strong>
                    <div className="admin-cell-secondary">
                      {user._id}
                    </div>
                  </td>

                  <td>{user.email}</td>
                  <td>{user.phone || "—"}</td>

                  <td>
                    <div className="admin-row-actions">
                      <button
                        type="button"
                        className="admin-icon-button"
                        title="View user details"
                        onClick={() => setSelectedUser(user)}
                      >
                        <FiEye />
                      </button>

                      <button
                        type="button"
                        className="admin-delete-button"
                        title={
                          user.accountStatus === "disabled"
                            ? "Activate user"
                            : "Deactivate user"
                        }
                        onClick={() => toggleStatus(user)}
                      >
                        {user.accountStatus === "disabled" ? (
                          <FiUserCheck />
                        ) : (
                          <FiUserX />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedUser && (
        <div className="admin-form-overlay">
          <div className="admin-movie-form">
            <div className="admin-panel-heading">
              <h3>User Details</h3>

              <button
                type="button"
                className="admin-secondary-button"
                onClick={() => setSelectedUser(null)}
              >
                Close
              </button>
            </div>

            <p className="admin-detail-row">
              <span>Name</span>
              <strong>{selectedUser.name}</strong>
            </p>
            <p className="admin-detail-row">
              <span>Email</span>
              <strong>{selectedUser.email}</strong>
            </p>
            <p className="admin-detail-row">
              <span>Phone</span>
              <strong>{selectedUser.phone || "—"}</strong>
            </p>
            <p className="admin-detail-row">
              <span>Account status</span>
              <strong>{selectedUser.accountStatus}</strong>
            </p>
            <p className="admin-detail-row">
              <span>Registered</span>
              <strong>
                {selectedUser.createdAt
                  ? new Date(selectedUser.createdAt).toLocaleDateString()
                  : "—"}
              </strong>
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
