import MovieCard from '../MovieCard/MovieCard'
import './MovieList.css'

const MovieList = ({
  movies,
  onCardClick,
  onLoadMore,
  canLoadMore,
  isLoading,
  error,
  favoriteIds,
  watchedIds,
  onToggleFavorite,
  onToggleWatched,
}) => {
  if (error) {
    return (
      <div className="movie-list__message movie-list__message--error" role="alert">
        <p>Something went wrong loading movies.</p>
        <p className="movie-list__message-detail">{error}</p>
      </div>
    )
  }

  if (!isLoading && movies.length === 0) {
    return (
      <div className="movie-list__message">
        <p>No movies found. Try another search.</p>
      </div>
    )
  }

  return (
    <>
      <ul className="movie-list" aria-label="Movies">
        {movies.map((movie) => (
          <li key={movie.id} className="movie-list__item">
            <MovieCard
              movie={movie}
              onClick={onCardClick}
              isFavorite={favoriteIds.has(movie.id)}
              isWatched={watchedIds.has(movie.id)}
              onToggleFavorite={onToggleFavorite}
              onToggleWatched={onToggleWatched}
            />
          </li>
        ))}
      </ul>

      {isLoading && (
        <p className="movie-list__loading" aria-live="polite">
          Loading movies…
        </p>
      )}

      {canLoadMore && !isLoading && (
        <div className="movie-list__load-more-wrap">
          <button
            type="button"
            className="movie-list__load-more"
            onClick={onLoadMore}
          >
            Load More
          </button>
        </div>
      )}
    </>
  )
}

export default MovieList
