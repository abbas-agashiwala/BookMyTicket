import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiMapPin,
  FiSearch,
  FiBell,
  FiUser,
  FiChevronDown,
  FiMenu,
  FiX,
} from "react-icons/fi";
import { useBooking } from "../App";
import "../styles/components/Navbar.css";
export default function Navbar({
  user,
  isAuthenticated,
  onLogout,
}) {
  
  const { city, setCity } = useBooking();
  const [profileOpen, setProfileOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [query, setQuery] = useState("");
  const nav = useNavigate();
  return (
    <header className="site-nav">
      <Link className="brand-word" to="/">
        flickt<span>.</span>
      </Link>
      <button className="city-trigger" onClick={() => setCityOpen(!cityOpen)}>
        <FiMapPin />
        <span>{city}</span>
        <FiChevronDown />
        {cityOpen && (
          <div className="city-menu">
            {["Pune", "Mumbai", "Bengaluru", "Delhi", "Hyderabad"].map((c) => (
              <button
                key={c}
                onClick={(e) => {
                  e.stopPropagation();
                  setCity(c);
                  setCityOpen(false);
                }}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </button>
      <div className="nav-search">
        <FiSearch />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && nav("/?q=" + query)}
          placeholder="Movies, theatres, experiences"
        />
      </div>
      <nav className={open ? "nav-links open" : "nav-links"}>
        <Link to="/movies">Movies</Link>
<Link to="/coming-soon">Coming soon</Link>
        <Link to="/">Offers</Link>
        <button
  className="icon-button"
  aria-label="Notifications"
  onClick={() => nav("/notifications")}
>
  <FiBell />
</button>
        
{isAuthenticated && user ? (
  <div className="profile-menu">
    <button
      type="button"
      className="profile-link"
      onClick={() => setProfileOpen(!profileOpen)}
    >
      <FiUser />
      <span>{user.name || user.email}</span>
      <FiChevronDown />
    </button>

    {profileOpen && (
      <div className="profile-dropdown">
        <strong>{user.name}</strong>
        <small>{user.email}</small>

        <button
          type="button"
          onClick={() => {
            setProfileOpen(false);
            onLogout();
            nav("/");
          }}
        >
          Log out
        </button>
      </div>
    )}
  </div>
) : (
  <Link className="profile-link" to="/login">
    <FiUser />
    <span>Sign in</span>
  </Link>
)}

      </nav>
      <button className="mobile-menu" onClick={() => setOpen(!open)}>
        {open ? <FiX /> : <FiMenu />}
      </button>
    </header>
  );
}
