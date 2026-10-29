import React, { createContext, useContext, useState, useEffect } from "react";

import {
  Routes,
  Route,
  Link,
  useNavigate,
  useParams,
  Navigate,
  useLocation,
} from "react-router-dom";
import {
  FiMapPin,
  FiSearch,
  FiBell,
  FiUser,
  FiChevronDown,
  FiArrowLeft,
  FiClock,
  FiPlay,
  FiCheckCircle,
  FiFilm,
  FiCalendar,
  FiShield,
  FiX,
} from "react-icons/fi";

import Navbar from "./components/Navbar";
import MovieCard from "./components/MovieCard";
import SeatMap from "./components/SeatMap";
import "./styles/pages/Home.css";
import "./styles/components/GenreFilter.css";
import "./styles/pages/MovieDetails.css";
import "./styles/pages/SeatSelection.css";
import "./styles/pages/Booking.css";



import AdminLayout from "./admin/components/AdminLayout";
import AdminCities from "./admin/pages/AdminCities";
import AdminMovies from "./admin/pages/AdminMovies";
import AdminShows from "./admin/pages/AdminShows";
import AdminTheatres from "./admin/pages/AdminTheatres";
import AdminBookings from "./admin/pages/AdminBookings";
import AdminUsers from "./admin/pages/AdminUsers";
import AdminSettings from "./admin/pages/AdminSettings";

const BookingContext = createContext(null);
export const useBooking = () => useContext(BookingContext);

function useMovies() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function fetchMovies() {
      try {
        const api = (await import("./services/api")).default;
        const response = await api.get("/movies");

        const data = Array.isArray(response.data)
          ? response.data
          : response.data.movies || [];

        if (active) {
          setMovies(data);
          setError("");
        }
      } catch (err) {
        if (active) {
          setError(err.response?.data?.message || "Unable to load movies.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchMovies();

    return () => {
      active = false;
    };
  }, []);

  return { movies, loading, error };
}

function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const [city, setCity] = useState("Pune");
  const [booking, setBooking] = useState({
    seats: [],
    showId: "",
    date: "",
    time: "",
    theatre: "",
    movieId: "",
    movieTitle: "",
    bookingId: "",
    bookingReference: "",
    holdExpiresAt: ""
  });

  const [authToken, setAuthToken] = useState(() =>
    localStorage.getItem("flickt_token"),
  );

  const [authUser, setAuthUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("flickt_user") || "null");
    } catch {
      return null;
    }
  });

  const handleAuthSuccess = (data) => {
    if (!data.token) return;

    localStorage.setItem("flickt_token", data.token);
    localStorage.setItem("flickt_user", JSON.stringify(data.user));

    setAuthToken(data.token);
    setAuthUser(data.user);
  };

  const handleLogout = () => {
    localStorage.removeItem("flickt_token");
    localStorage.removeItem("flickt_user");

    setAuthToken(null);
    setAuthUser(null);
  };

  const value = { city, setCity, booking, setBooking };
  return (
    <BookingContext.Provider value={value}>
      <div className="app-shell">
        {!isAdminRoute && (
          <Navbar
            user={authUser}
            isAuthenticated={Boolean(authToken)}
            onLogout={handleLogout}
          />
        )}
        <BookingHoldTimer
  booking={booking}
  setBooking={setBooking}
/>
        <Routes>
          <Route path="/" element={<Home />} />

          
<Route
  path="/admin"
  element={
    authToken && authUser?.role === "admin" ? (
      <AdminLayout />
    ) : (
      <Navigate to="/login" replace />
    )
  }
>
  <Route path="cities" element={<AdminCities />} />
  <Route path="movies" element={<AdminMovies />} />
  <Route path="theatres" element={<AdminTheatres />} />
  <Route path="shows" element={<AdminShows />} />
  <Route path="bookings" element={<AdminBookings />} />
  <Route path="users" element={<AdminUsers />} />
  <Route path="settings" element={<AdminSettings />} />
</Route>


          <Route path="/movies/:id" element={<MovieDetails />} />
          <Route path="/shows/:showId/seats" element={<SeatSelection />} />
          <Route path="/booking/review" element={<Review />} />
          <Route path="/booking/checkout" element={<Checkout />} />
          <Route
            path="/movies"
            element={<MoviesListingPage status="Now showing" />}
          />

          <Route
            path="/coming-soon"
            element={<MoviesListingPage status="Coming soon" />}
          />
          <Route path="/booking/success" element={<Success />} />

          <Route
            path="/login"
            element={
              authToken && authUser ? (
                <Navigate
                  to={authUser.role === "admin" ? "/admin" : "/"}
                  replace
                />
              ) : (
                <AuthPage mode="Login" onAuthenticated={handleAuthSuccess} />
              )
            }
          />

          <Route
            path="/signup"
            element={
              authToken && authUser ? (
                <Navigate
                  to={authUser.role === "admin" ? "/admin" : "/"}
                  replace
                />
              ) : (
                <AuthPage
                  mode="Create account"
                  onAuthenticated={handleAuthSuccess}
                />
              )
            }
          />
          <Route
            path="/notifications"
            element={
              authToken && authUser ? (
                <NotificationsPage />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BookingContext.Provider>
  );
}
function Home() {
  const { movies, loading, error } = useMovies();

  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [appliedGenres, setAppliedGenres] = useState([]);
  const genres = [
    "Action",
    "Adventure",
    "Animation",
    "Comedy",
    "Crime",
    "Drama",
    "Fantasy",
    "Horror",
    "Mystery",
    "Romance",
    "Sci-Fi",
    "Thriller",
  ];
  const filtered = movies.filter((m) => {
    const query = search.toLowerCase();

    const matchesSearch =
      m.title.toLowerCase().includes(query) ||
      m.genre?.toString().toLowerCase().includes(query) ||
      m.cast?.toString().toLowerCase().includes(query);

    const movieGenres = (
      Array.isArray(m.genre) ? m.genre : String(m.genre || "").split(/[,/]/)
    ).map((g) => g.trim());

    const normalizeGenre = (value) =>
      String(value)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

    const matchesGenre =
      appliedGenres.length === 0 ||
      appliedGenres.some((genre) =>
        movieGenres.some(
          (movieGenre) => normalizeGenre(movieGenre) === normalizeGenre(genre),
        ),
      );

    return matchesSearch && matchesGenre;
  });
  return (
    <main className="page home-page">
      {loading && <p>Loading movies...</p>}
      {error && <p className="inline-message">{error}</p>}
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="live-dot" /> THE BIG SCREEN IS CALLING
          </span>
          <h1>
            Stories hit
            <br />
            <em>different</em> here.
          </h1>
          <p>Your next unforgettable movie night starts with a seat.</p>
          <div className="hero-actions">
            <a href="#now-showing" className="btn-primary-custom">
              Explore movies <span>↗</span>
            </a>
            <span className="hero-note">
              <FiShield /> Secure booking
            </span>
          </div>
        </div>
        <div className="hero-art">
          {movies[0]?.poster && (
            <img src={movies[0].poster} alt={movies[0].title} />
          )}

          <div className="floating-tag">
            <span className="live-dot" /> NOW SHOWING <b>IMAX</b>
          </div>
          <div className="hero-orbit" />
        </div>
      </section>
      <div className="search-row">
        <div className="search-box">
          <FiSearch />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search movies, genres, actors..."
          />
          <kbd>⌘ K</kbd>
        </div>
        <button
          className="filter-btn"
          onClick={() => setShowFilters(!showFilters)}
        >
          Filters<span> ☷</span>
          {appliedGenres.length > 0 && (
            <span className="filter-count">{appliedGenres.length}</span>
          )}
        </button>
      </div>

      {showFilters && (
        <div className="genre-filter-panel">
          <div className="genre-filter-header">
            <div>
              <span className="eyebrow">REFINE YOUR SEARCH</span>
              <h3>Filter by genre</h3>
            </div>

            <button
              type="button"
              className="filter-close"
              onClick={() => setShowFilters(false)}
              aria-label="Close filters"
            >
              ×
            </button>
          </div>

          <div className="genre-filter-options">
            {genres.map((genre) => (
              <label className="genre-option" key={genre}>
                <input
                  type="checkbox"
                  checked={selectedGenres.includes(genre)}
                  onChange={(e) => {
                    setSelectedGenres((previous) =>
                      e.target.checked
                        ? [...previous, genre]
                        : previous.filter((g) => g !== genre),
                    );
                  }}
                />
                <span>{genre}</span>
              </label>
            ))}
          </div>

          <div className="genre-filter-actions">
            <button
              type="button"
              className="clear-filters"
              onClick={() => {
                setSelectedGenres([]);
                setAppliedGenres([]);
              }}
            >
              Clear filters
            </button>

            <button
              type="button"
              className="apply-filters"
              onClick={() => {
                setAppliedGenres(selectedGenres);
                setShowFilters(false);
              }}
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      <section className="movie-section" id="now-showing">
        
<div className="section-heading">
  <div>
    <span className="eyebrow">YOUR NEXT WATCH</span>
    <h2>
      {search ? "Search results" : "Trending this week"}
      <span className="accent-dot">.</span>
    </h2>
  </div>

  <div className="movie-carousel-arrows">
    <button
      type="button"
      aria-label="Previous movies"
      onClick={() =>
        document
          .getElementById("now-showing-movies")
          ?.scrollBy({ left: -500, behavior: "smooth" })
      }
    >
      &#8592;
    </button>

    <button
      type="button"
      aria-label="Next movies"
      onClick={() =>
        document
          .getElementById("now-showing-movies")
          ?.scrollBy({ left: 500, behavior: "smooth" })
      }
    >
      &#8594;
    </button>
  </div>
</div>

        
<div className="movie-grid" id="now-showing-movies">
{filtered
  .filter((movie) => movie.status === "now-showing")
  .map((movie, index) => (
    <MovieCard
      key={movie._id || movie.id}
      movie={movie}
      index={index}
    />
  ))}
</div>

        {filtered.some((movie) => movie.status === "coming-soon") && (
          <>
            <div className="section-heading coming-heading">
              <div>
                <span className="eyebrow">MARK YOUR CALENDAR</span>
                <h2>
                  Coming soon<span className="accent-dot">.</span>
                </h2>
              </div>
            </div>
            <div className="movie-grid">
              {filtered
  .filter((movie) => movie.status === "coming-soon")
  .map((movie, index) => (
    <MovieCard
      key={movie._id || movie.id}
      movie={movie}
      index={index}
    />
  ))}
            </div>
          </>
        )}
      </section>
      <section className="offer-banner">
        <div>
          <span className="eyebrow">THE FIRST ROUND IS ON US</span>
          <h2>
            Make movie nights
            <br />
            more rewarding.
          </h2>
          <p>Discover offers made for your next big-screen moment.</p>
        </div>
        <div className="offer-stamp">
          FIRST
          <br />
          <b>SHOW</b>
          <br />
          DEAL
        </div>
      </section>
      <footer className="site-footer">
        <b>
          flickt<span>.</span>
        </b>
        <p>Less scrolling. More cinema.</p>
        <span>© 2026 Flickt · Made for movie people</span>
      </footer>
    </main>
  );
}

function MovieDetails() {
  const { id } = useParams();
  const { movies, loading, error } = useMovies();
  const nav = useNavigate();
  const { setBooking } = useBooking();

  const [shows, setShows] = useState([]);
  const [showsLoading, setShowsLoading] = useState(true);
  const [showsError, setShowsError] = useState("");

  const m = movies.find((movie) => String(movie._id || movie.id) === id);

  useEffect(() => {
    let active = true;

    async function loadShows() {
      setShowsLoading(true);
      setShowsError("");

      try {
        const api = (await import("./services/api")).default;
        const response = await api.get("/shows");

        const allShows = Array.isArray(response.data)
          ? response.data
          : response.data.shows || [];

        const matchingShows = allShows.filter((show) => {
          const showMovieId = show.movieId?._id || show.movieId;
          return String(showMovieId) === String(id);
        });

        if (active) {
          setShows(matchingShows);
        }
      } catch (err) {
        if (active) {
          setShowsError(
            err.response?.data?.message || "Unable to load showtimes.",
          );
        }
      } finally {
        if (active) {
          setShowsLoading(false);
        }
      }
    }

    if (!loading && !error && m) {
      loadShows();
    } else if (!loading) {
      setShows([]);
      setShowsLoading(false);
    }

    return () => {
      active = false;
    };
  }, [id, loading, error, m?._id, m?.id]);

  if (loading) {
    return <main className="page detail-page">Loading movie details...</main>;
  }

  if (error) {
    return <main className="page detail-page">{error}</main>;
  }

  if (!m) {
    return <main className="page detail-page">Movie not found.</main>;
  }

  function openShow(show) {
    const movieId = show.movieId?._id || show.movieId;

    if (!show?._id || !movieId) {
      alert("This show is missing its database ID.");
      return;
    }

    const start = new Date(show.startTime);

    setBooking((previous) => ({
      ...previous,
      showId: show._id,
      movieId,
      movieTitle: m.title,
      theatre: show.theatreId?.name || "Theatre",
      date: start.toLocaleDateString("en-IN"),
      time: start.toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
      }),
      seats: [],
      bookingId: "",
    }));

    nav(`/shows/${show._id}/seats`);
  }

  return (
    <main className="page detail-page">
      <button className="back-link" onClick={() => nav(-1)}>
        <FiArrowLeft /> Back to movies
      </button>

      
<div className="detail-hero">
  <div
    className="detail-backdrop"
    style={{
      backgroundImage: `url("${m.backdrop || m.poster}")`,
    }}
  />

  <div className="detail-copy">
    <span className="eyebrow">NOW SHOWING · IN CINEMAS</span>

    <h1>{m.title}</h1>

    <div className="movie-meta">
      <span className="rating">★ {m.rating}</span>
      <span>{m.cert}</span>
      <span>{m.language}</span>
      <span>{m.duration}</span>
    </div>

    <p>{m.description}</p>

    <div className="genre-pills">
      {(Array.isArray(m.genre)
        ? m.genre
        : String(m.genre || "").split(" / ")
      )
        .filter(Boolean)
        .slice(0, 3)
        .map((genre) => (
          <span key={genre}>{genre}</span>
        ))}
      <span>Thriller</span>
    </div>

    <button
      className="btn-primary-custom"
      onClick={() =>
        document
          .getElementById("showtimes")
          ?.scrollIntoView({ behavior: "smooth" })
      }
    >
      Book tickets ↗
    </button>
  </div>

  <img
    className="detail-poster"
    src={m.poster}
    alt={`${m.title} poster`}
  />
</div>


      <section className="showtimes" id="showtimes">
        <div className="section-heading">
          <div>
            <span className="eyebrow">FIND YOUR SHOW</span>
            <h2>
              Choose a showtime
              <span className="accent-dot">.</span>
            </h2>
          </div>

          <span className="city-label">
            <FiMapPin /> Pune
          </span>
        </div>

        {showsLoading && <p>Loading showtimes...</p>}

        {showsError && <p className="inline-message">{showsError}</p>}

        {!showsLoading && !showsError && shows.length === 0 && (
          <p>No upcoming shows are available for this movie.</p>
        )}

        {!showsLoading &&
          shows.map((show) => (
            <div className="theatre-row" key={show._id}>
              <div>
                <b>{show.theatreId?.name || "Theatre"}</b>
                <span>{show.screenId?.name || "Screen"}</span>
              </div>

              <div className="times">
                <button onClick={() => openShow(show)}>
                  {new Date(show.startTime).toLocaleTimeString("en-IN", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </button>
              </div>
            </div>
          ))}
      </section>
    </main>
  );
}


function SeatSelection() {
  const { showId } = useParams();
  const { movies } = useMovies();
  const { booking, setBooking } = useBooking();
  const nav = useNavigate();

  useEffect(() => {
    if (showId && booking.showId !== showId) {
      setBooking((previous) => ({
        ...previous,
        showId,
        seats: [],
      }));
    }
  }, [showId, booking.showId, setBooking]);


  const price = booking.seats.reduce((sum, seat) => {
    const category = seat.category || "standard";

    const priceByCategory = {
      standard: 220,
      premium: 280,
      recliner: 420,
    };

    return sum + (priceByCategory[category] || 220);
  }, 0);

  return (
    <main className="page booking-page">
      <div className="booking-top">
        <button className="back-link" onClick={() => nav(-1)}>
          <FiArrowLeft /> Back
        </button>
        <div>
          <span className="step-count">STEP 1 OF 4</span>
          <h1>Select your seats</h1>
        </div>
        <span className="hold-pill">
          <span className="live-dot" /> 02:00 hold demo
        </span>
      </div>
      <div className="show-summary">
        <img
          src={
            movies.find((movie) => movie.title === booking.movieTitle)
              ?.poster || movies[0]?.poster
          }
          alt={booking.movieTitle || "Selected movie"}
        />

        <div>
          <b>{booking.movieTitle || "Selected movie"}</b>
          <span>{booking.theatre || "Selected theatre"}</span>
          <span>
            <FiCalendar /> {booking.date || "Date not selected"}
            {" · "}
            <FiClock /> {booking.time || "Time not selected"}
          </span>
        </div>
      </div>
      <div className="seat-layout-card">
        <div className="screen-glow" />
        <div className="screen-label">SCREEN THIS WAY</div>
        <SeatMap
          showId={booking.showId}
          selected={booking.seats}
          onChange={(seats) =>
            setBooking((previous) => ({
              ...previous,
              seats,
            }))
          }
        />
        <div className="seat-legend">
          <span>
            <i className="legend-seat available" /> Available
          </span>
          <span>
            <i className="legend-seat selected" /> Selected
          </span>
          <span>
            <i className="legend-seat booked" /> Booked
          </span>
          <span>
            <i className="legend-seat locked" /> Locked
          </span>
        </div>
        <div className="seat-prices">
          <span>
            <i className="price-dot standard" /> Standard <b>₹220</b>
          </span>
          <span>
            <i className="price-dot premium" /> Premium <b>₹280</b>
          </span>
          <span>
            <i className="price-dot recliner" /> Recliner <b>₹420</b>
          </span>
        </div>
      </div>
      <div className="booking-bottom">
        <div>
          <span>
            {booking.seats.length} seat{booking.seats.length === 1 ? "" : "s"}{" "}
            selected
          </span>
          <b>₹{price.toLocaleString("en-IN")}</b>
        </div>

        <button
          className="btn-primary-custom"
          disabled={!booking.seats.length}
          onClick={async () => {
            try {
              const api = (await import("./services/api")).default;

              const response = await api.post("/bookings/hold-seats", {
                showId: booking.showId,
                seatIds: booking.seats.map((seat) =>
                  typeof seat === "string" ? seat : seat._id,
                ),
              });

              const createdBooking = response.data.booking;

              if (!createdBooking?._id) {
                throw new Error("Booking ID was not returned by the server.");
              }

              setBooking((previous) => ({
  ...previous,
  bookingId: createdBooking._id,
  holdExpiresAt: createdBooking.reservationExpiresAt,
}));

nav("/booking/review");

              nav("/booking/review");
            } catch (error) {
              console.error("Seat reservation failed:", error);
              alert(
                error.response?.data?.message ||
                  error.message ||
                  "Unable to reserve seats.",
              );
            }
          }}
        >
          Continue <span>›</span>
        </button>
      </div>
    </main>
  );
}
function PriceBreakdown({ price }) {
  return (
    <div className="price-breakdown">
      <div>
        <span>Tickets ({price.count})</span>
        <b>₹{price.subtotal}</b>
      </div>
      <div>
        <span>Convenience fee</span>
        <b>₹{price.fee}</b>
      </div>
      <div>
        <span>GST</span>
        <b>₹{price.tax}</b>
      </div>
      <div className="total-line">
        <span>Total payable</span>
        <b>₹{price.total}</b>
      </div>
    </div>
  );
}
function Review() {
  const { movies } = useMovies();
  const { booking } = useBooking();
  const nav = useNavigate();

  const subtotal = booking.seats.reduce((sum, seat) => {
    const prices = {
      standard: 220,
      premium: 280,
      recliner: 420,
    };

    return sum + (prices[seat.category] ?? 220);
  }, 0);

  const fee = booking.seats.length ? 35 : 0;
  const tax = Math.round((subtotal + fee) * 0.18);

  const price = {
    count: booking.seats.length,
    subtotal,
    fee,
    tax,
    total: subtotal + fee + tax,
  };

  return (
    <main className="page booking-page">
      <button
        className="back-link"
        onClick={() =>
          nav(booking.showId ? `/shows/${booking.showId}/seats` : "/")
        }
      >
        <FiArrowLeft /> Edit seats
      </button>
      <div className="booking-top">
        <div>
          <span className="step-count">STEP 2 OF 4</span>
          <h1>Review your booking</h1>
        </div>
        <span className="hold-pill">
          <span className="live-dot" /> Seats held temporarily
        </span>
      </div>
      <div className="checkout-grid">
        <section className="checkout-card">
          <div className="checkout-movie">
            <img
              src={
                movies.find((movie) => movie.title === booking.movieTitle)
                  ?.poster || movies[0]?.poster
              }
              alt={booking.movieTitle || "Selected movie"}
            />
            <div>
              <h3>{booking.movieTitle || "Selected movie"}</h3>
              <span>{booking.theatre || "Selected theatre"}</span>
              <span>
                {booking.date || "Date not selected"} ·{" "}
                {booking.time || "Time not selected"}
              </span>
              <div className="selected-tags">
                {booking.seats.map((seat) => (
                  <b key={seat._id}>
                    {seat.rowLabel}
                    {seat.seatNumber}
                  </b>
                ))}
              </div>
            </div>
          </div>
          <div className="checkout-divider" />
          <h3>Price details</h3>
          <PriceBreakdown price={price} />
          <button
            className="text-action"
            onClick={() =>
              nav(booking.showId ? `/shows/${booking.showId}/seats` : "/")
            }
          >
            ← Change seats
          </button>
        </section>
        <aside className="checkout-card pay-card">
          <span className="eyebrow">ALMOST THERE</span>
          <h2>
            Your night out
            <br />
            is one step away.
          </h2>
          <p>Review the details before moving to secure checkout.</p>
          <div className="pay-total">
            <span>Amount payable</span>
            <b>₹{price.total.toLocaleString("en-IN")}</b>
          </div>
          <button
            className="btn-primary-custom full-btn"
            disabled={!booking.seats.length}
            onClick={() => nav("/booking/checkout")}
          >
            Continue to checkout <span>↗</span>
          </button>
          <small>
            <FiShield /> Secure checkout · No hidden charges
          </small>
        </aside>
      </div>
    </main>
  );
}
function Checkout() {
  const { movies } = useMovies();
  const { booking, setBooking } = useBooking();
  const nav = useNavigate();
  const [agreed, setAgreed] = useState(false);

  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  useEffect(() => {
    const savedUser = localStorage.getItem("flickt_user");

    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setContactEmail(user.email || "");
        setContactPhone(user.phone || "");
      } catch (error) {
        console.error("Unable to load saved user details:", error);
      }
    }
  }, []);

  const subtotal = booking.seats.reduce((sum, seat) => {
    const prices = {
      standard: 220,
      premium: 280,
      recliner: 420,
    };

    const category = seat.category || "standard";
    return sum + (prices[category] ?? 220);
  }, 0);

  const fee = booking.seats.length > 0 ? 35 : 0;
  const tax = Math.round((subtotal + fee) * 0.18);
  const total = subtotal + fee + tax;

  async function confirmDemoPayment() {
    if (!booking.bookingId) {
      alert("Booking ID is missing. Please select your seats again.");
      nav("/");
      return;
    }

    if (!agreed) {
      alert("Please accept the booking terms.");
      return;
    }

    try {
      const api = (await import("./services/api")).default;

      const response = await api.post(
        `/bookings/${booking.bookingId}/confirm`,
        {},
      );

      const confirmedBooking = response.data.booking;

      setBooking((previous) => ({
        ...previous,
        bookingReference: confirmedBooking?.bookingReference || "",
        holdExpiresAt: "",
      }));

      nav("/booking/success");
    } catch (err) {
      console.error("Confirmation error:", err);

      alert(err.response?.data?.message || "Booking confirmation failed.");
    }
  }
  return (
    <main className="page booking-page">
      <button className="back-link" onClick={() => nav("/booking/review")}>
        <FiArrowLeft /> Back to review
      </button>
      <div className="booking-top">
        <div>
          <span className="step-count">STEP 3 OF 4</span>
          <h1>Secure checkout</h1>
        </div>
        <span className="secure-tag">
          <FiShield /> SSL protected
        </span>
      </div>
      <div className="checkout-grid">
        <section className="checkout-card">
          <h3>Contact details</h3>

          <label className="field-label">
            Email address
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          <label className="field-label">
            Mobile number
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+91 98765 43210"
              pattern="[0-9]{10}"
              title="Enter a 10-digit mobile number"
              required
            />
          </label>

          <div className="checkout-divider" />
          <h3>Payment method</h3>
          <label className="payment-option">
            <input type="radio" name="pay" defaultChecked />
            <span>
              <b>UPI</b>
              <small>Google Pay, PhonePe, Paytm</small>
            </span>
            <span className="pay-brand">UPI</span>
          </label>
          <label className="payment-option">
            <input type="radio" name="pay" />
            <span>
              <b>Credit / Debit card</b>
              <small>Visa, Mastercard, RuPay</small>
            </span>
            <span>💳</span>
          </label>
          <label className="payment-option">
            <input type="radio" name="pay" />
            <span>
              <b>Net banking</b>
              <small>All major Indian banks</small>
            </span>
            <span>🏦</span>
          </label>
          <label className="terms-check">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />{" "}
            I agree to the booking terms and cancellation policy.
          </label>
          <button
            className="btn-primary-custom full-btn"
            disabled={!agreed || !booking.seats.length}
            onClick={confirmDemoPayment}
          >
            Pay ₹{total.toLocaleString("en-IN")} <span>↗</span>
          </button>
          <p className="demo-warning">
            Demo checkout only — no real payment will be taken.
          </p>
        </section>
        <aside className="checkout-card order-card">
          <span className="eyebrow">ORDER SUMMARY</span>
          <h3>{booking.movieTitle || "Selected movie"}</h3>
          <span>{booking.theatre || "Selected theatre"}</span>
          <span>
            {booking.date} · {booking.time}
          </span>
          <div className="selected-tags">
            {booking.seats.map((seat) => (
              <b key={seat._id}>
                {seat.rowLabel}
                {seat.seatNumber}
              </b>
            ))}
          </div>
          <PriceBreakdown
            price={{ count: booking.seats.length, subtotal, fee, tax, total }}
          />
        </aside>
      </div>
    </main>
  );
}
function Success() {
  const { movies } = useMovies();
  const { booking, setBooking } = useBooking();
  const nav = useNavigate();
  const ref = booking.bookingReference || "Pending confirmation";
  return (
    <main className="page success-page">
      <div className="success-icon">
        <FiCheckCircle />
      </div>
      <span className="eyebrow">MOVIE NIGHT, SORTED</span>
      <h1>
        You're all set<span className="accent-dot">.</span>
      </h1>
      <p>
        This is a demo confirmation. Connect verified payment processing before
        issuing real tickets.
      </p>
      <div className="ticket-card">
        <div className="ticket-head">
          <b>
            flickt<span>.</span>
          </b>
          <span>DEMO TICKET</span>
        </div>
        <img
          src={
            movies.find((movie) => movie.title === booking.movieTitle)
              ?.poster || movies[0]?.poster
          }
          alt={booking.movieTitle || "Selected movie"}
        />
        <div>
          <h2>{booking.movieTitle || "Selected movie"}</h2>
          <p>{booking.theatre || "Selected theatre"}</p>
          <p>
            {booking.date || "Date not selected"} ·{" "}
            {booking.time || "Time not selected"}
          </p>
          <div className="selected-tags">
            {booking.seats.map((seat) => (
              <b key={seat._id}>
                {seat.rowLabel}
                {seat.seatNumber}
              </b>
            ))}
          </div>
        </div>
        <div className="ticket-ref">
          <span>BOOKING REFERENCE</span>
          <b>{ref}</b>
        </div>
      </div>
      <button
        className="btn-primary-custom"
        onClick={() => {
          setBooking({ ...booking, seats: [] });
          nav("/");
        }}
      >
        Back to home <span>↗</span>
      </button>
    </main>
  );
}
function AuthPage({ mode, onAuthenticated }) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  return (
    <main className="page auth-page">
      <div className="auth-card">
        <b className="brand-word">
          flickt<span>.</span>
        </b>
        <span className="eyebrow">YOUR NEXT MOVIE NIGHT</span>
        <h1>{mode === "Login" ? "Welcome back." : "Get in on the action."}</h1>
        <p>Sign in to manage bookings and save your movie nights.</p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const api = (await import("./services/api")).default;

              const payload =
                mode === "Login"
                  ? { email, password }
                  : { name, email, phone, password };

              const r = await api.post(
                "/auth/" + (mode === "Login" ? "login" : "signup"),
                payload,
              );

              if (!r.data.token || !r.data.user) {
                throw new Error("Authentication details were not returned.");
              }

              onAuthenticated(r.data);

              setMessage(
                mode === "Login"
                  ? "Signed in successfully!"
                  : "Account created successfully!",
              );

              if (r.data.user.role === "admin") {
                navigate("/admin", { replace: true });
              } else {
                navigate("/", { replace: true });
              }
            } catch (err) {
              setMessage(
                err.response?.data?.message ||
                  "API not connected yet. Start the backend and try again.",
              );
            }
          }}
        >
          <label className="field-label">
            Email address
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>

          {mode !== "Login" && (
            <>
              <label className="field-label">
                Full name
                <input
                  type="text"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  minLength={2}
                />
              </label>

              <label className="field-label">
                Mobile number
                <input
                  type="tel"
                  required
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your mobile number"
                  pattern="[0-9]{10}"
                  title="Enter a 10-digit mobile number"
                />
              </label>
            </>
          )}

          <label className="field-label">
            Password
            <input
              type="password"
              required
              minLength="8"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </label>
          <button className="btn-primary-custom full-btn">
            {mode} <span>↗</span>
          </button>
        </form>
        {message && <p className="inline-message">{message}</p>}
        <p className="auth-switch">
          {mode === "Login" ? "New to Flickt? " : "Already have an account? "}
          <Link to={mode === "Login" ? "/signup" : "/login"}>
            {mode === "Login" ? "Create account" : "Log in"}
          </Link>
        </p>
      </div>
    </main>
  );
}

function MoviesListingPage({ status }) {
  const { movies, loading, error } = useMovies();

  const pageMovies = movies.filter((movie) => {
    const movieStatus = String(
      movie.status || movie.release || "",
    ).toLowerCase();

    if (status === "Now showing") {
      return ["now-showing", "now showing"].includes(movieStatus);
    }

    if (status === "Coming soon") {
      return ["coming-soon", "coming soon"].includes(movieStatus);
    }

    return movieStatus === status.toLowerCase();
  });

  if (loading) {
    return <main className="home-page">Loading movies...</main>;
  }

  if (error) {
    return <main className="home-page">{error}</main>;
  }

  return (
    <main className="home-page">
      <section className="movie-section">
        <div className="section-heading">
          <h2>{status === "Coming soon" ? "Coming soon" : "Explore movies"}</h2>
        </div>

        <div className="movie-grid">
          {pageMovies.map((movie) => (
            <MovieCard key={movie._id || movie.id} movie={movie} />
          ))}
        </div>

        {pageMovies.length === 0 && (
          <p>No movies available in this section yet.</p>
        )}
      </section>
    </main>
  );
}

function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadNotifications() {
      try {
        const api = (await import("./services/api")).default;
        const response = await api.get("/notifications");

        setNotifications(response.data.notifications || []);
      } catch (err) {
        setError(
          err.response?.data?.message || "Unable to load notifications.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadNotifications();
  }, []);

  if (loading) return <main>Loading notifications...</main>;

  return (
    <main className="page notifications-page">
  <div className="notifications-header">
    <div>
      <span className="eyebrow">YOUR FLICKT UPDATES</span>
      <h1>Notifications<span>.</span></h1>
      <p>Stay updated on your movie bookings.</p>
    </div>
  </div>
      {error && <p className="inline-message">{error}</p>}

      {!error && notifications.length === 0 && (
        <p>You don't have any notifications yet.</p>
      )}

      
<div className="notification-list">
  {notifications.map((notification) => (
    <article className="notification-card" key={notification._id}>
      <div className="notification-icon">
        <FiBell />
      </div>

      <div className="notification-content">
        <div className="notification-card-top">
          <h3>{notification.title}</h3>
          <span className="notification-status">Update</span>
        </div>

        <p>{notification.message}</p>

        <div className="notification-time">
          <FiClock />
          <span>
            {new Date(notification.createdAt).toLocaleString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>
    </article>
  ))}
</div>

    </main>
  );
}

function BookingHoldTimer({ booking, setBooking }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [secondsLeft, setSecondsLeft] = useState(0);

  const isBookingPage = [
    "/booking/review",
    "/booking/checkout",
  ].includes(location.pathname);

  useEffect(() => {
    if (
      !isBookingPage ||
      !booking.bookingId ||
      !booking.holdExpiresAt
    ) {
      setSecondsLeft(0);
      return;
    }

    let expired = false;
    let intervalId;

    const updateTimer = () => {
      const remaining = Math.max(
        0,
        Math.ceil(
          (new Date(booking.holdExpiresAt).getTime() - Date.now()) /
            1000,
        ),
      );

      setSecondsLeft(remaining);

      if (remaining === 0 && !expired) {
        expired = true;
        clearInterval(intervalId);

        (async () => {
          try {
            const api = (await import("./services/api")).default;

            await api.post(
              `/bookings/${booking.bookingId}/release`,
            );
          } catch (error) {
            console.error("Unable to release expired booking:", error);
          } finally {
            setBooking((previous) => ({
              ...previous,
              seats: [],
              bookingId: "",
              bookingReference: "",
              holdExpiresAt: "",
            }));

            navigate(
              `/shows/${booking.showId}/seats`,
              { replace: true },
            );
          }
        })();
      }
    };

    updateTimer();
    intervalId = setInterval(updateTimer, 1000);

    return () => clearInterval(intervalId);
  }, [
    isBookingPage,
    booking.bookingId,
    booking.holdExpiresAt,
    booking.showId,
    setBooking,
    navigate,
  ]);

  if (
    !isBookingPage ||
    !booking.bookingId ||
    !booking.holdExpiresAt
  ) {
    return null;
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <div className="hold-pill booking-countdown">
      <span className="live-dot" />
      {String(minutes).padStart(2, "0")}:
      {String(seconds).padStart(2, "0")} remaining
    </div>
  );
}

export default App;
