
import React from "react";
import { Link } from "react-router-dom";
import { FiClock, FiArrowUpRight } from "react-icons/fi";
import "../styles/components/MovieCard.css";

export default function MovieCard({ movie, index = 0 }) {
  const movieId = movie._id || movie.id;

  const duration =
    typeof movie.duration === "number"
      ? `${Math.floor(movie.duration / 60)}h ${
          movie.duration % 60
        }m`
      : movie.duration;

  const genre = Array.isArray(movie.genre)
    ? movie.genre.join(" / ")
    : movie.genre || "Genre unavailable";

  const language = Array.isArray(movie.language)
    ? movie.language.join(" / ")
    : movie.language || "Language unavailable";

  const poster = movie.poster || movie.backdrop || "";

  return (
    <article
      className="movie-card"
      style={{ "--card-index": index }}
    >
      <Link to={`/movies/${movieId}`} className="poster-wrap">
        <img
          src={poster}
          alt={movie.title}
          loading="lazy"
        />

        <span className="poster-rating">
          ★ {movie.rating || "N/A"}
        </span>

        <span className="poster-arrow">
          <FiArrowUpRight />
        </span>
      </Link>

      <div className="movie-card-info">
        <Link to={`/movies/${movieId}`} className="movie-title">
          {movie.title}
        </Link>

        <p>
          {genre} <span>·</span> {language}
        </p>

        <div className="movie-card-bottom">
          <span>
            <FiClock /> {duration || "Duration unavailable"}
          </span>

          <Link to={`/movies/${movieId}`}>
            Book <span>↗</span>
          </Link>
        </div>
      </div>
    </article>
  );
}


