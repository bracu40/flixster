import { POSTER_BASE } from '../../api/tmdb'
import './MovieCard.css'

const FALLBACK_POSTER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 450">
       <rect width="100%" height="100%" fill="#2a2f3a"/>
       <text x="50%" y="50%" fill="#9aa3b2" font-family="sans-serif"
             font-size="22" text-anchor="middle">No poster</text>
     </svg>`
  )

const EyeIcon = ({ filled }) => (
  <svg
    className="movie-card__icon-svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
  >
    <path
      d="M12 5c-5 0-9 4.5-10 7 1 2.5 5 7 10 7s9-4.5 10-7c-1-2.5-5-7-10-7Z"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <circle
      cx="12"
      cy="12"
      r="3"
      fill={filled ? '#ffffff' : 'none'}
      stroke="currentColor"
      strokeWidth="1.8"
    />
  </svg>
)

const MovieCard = ({
  movie,
  onClick,
  isFavorite,
  isWatched,
  onToggleFavorite,
  onToggleWatched,
}) => {
  const { id, title, poster_path, vote_average } = movie
  const posterSrc = poster_path ? `${POSTER_BASE}${poster_path}` : FALLBACK_POSTER

  const handleKeyDown = (e) => {
    if (e.target !== e.currentTarget) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick(id)
    }
  }

  // Stops the click from bubbling to the card (which would open the modal).
  const stop = (fn) => (e) => {
    e.stopPropagation()
    fn()
  }

  return (
    <article
      className={`movie-card${isWatched ? ' movie-card--watched' : ''}`}
      tabIndex={0}
      role="button"
      aria-label={`Open details for ${title}`}
      onClick={() => onClick(id)}
      onKeyDown={handleKeyDown}
    >
      <div className="movie-card__poster-wrap">
        <img
          className="movie-card__poster"
          src={posterSrc}
          alt={`${title} poster`}
          loading="lazy"
        />

        <div className="movie-card__actions">
          <button
            type="button"
            className={`movie-card__icon-btn movie-card__icon-btn--fav${
              isFavorite ? ' is-active' : ''
            }`}
            aria-label={
              isFavorite
                ? `Remove ${title} from favorites`
                : `Add ${title} to favorites`
            }
            aria-pressed={isFavorite}
            title={isFavorite ? 'Unfavorite' : 'Favorite'}
            onClick={stop(() => onToggleFavorite(movie))}
          >
            {isFavorite ? '♥' : '♡'}
          </button>

          <button
            type="button"
            className={`movie-card__icon-btn movie-card__icon-btn--watched${
              isWatched ? ' is-active' : ''
            }`}
            aria-label={
              isWatched
                ? `Mark ${title} as not watched`
                : `Mark ${title} as watched`
            }
            aria-pressed={isWatched}
            title={isWatched ? 'Watched' : 'Mark as watched'}
            onClick={stop(() => onToggleWatched(movie))}
          >
            <EyeIcon filled={isWatched} />
          </button>
        </div>

        {isWatched && (
          <span className="movie-card__watched-badge" aria-hidden="true">
            Watched
          </span>
        )}
      </div>

      <div className="movie-card__body">
        <h3 className="movie-card__title">{title}</h3>
        <p className="movie-card__rating">
          Rating: {typeof vote_average === 'number' ? vote_average.toFixed(3) : 'N/A'}
        </p>
      </div>
    </article>
  )
}

export default MovieCard
