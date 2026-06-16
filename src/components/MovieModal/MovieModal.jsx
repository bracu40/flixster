import { useEffect, useState } from 'react'
import { fetchMovieDetails, POSTER_BASE, BACKDROP_BASE } from '../../api/tmdb'
import { getMovieInsight } from '../../api/openrouter'
import './MovieModal.css'

const formatRuntime = (minutes) => {
  if (!minutes && minutes !== 0) return null
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

const findTrailerKey = (videos) => {
  if (!videos?.results?.length) return null
  const youtube = videos.results.filter((v) => v.site === 'YouTube')
  const trailer =
    youtube.find((v) => v.type === 'Trailer' && v.official) ||
    youtube.find((v) => v.type === 'Trailer') ||
    youtube[0]
  return trailer?.key ?? null
}

const MovieModal = ({ movieId, onClose }) => {
  const [details, setDetails] = useState(null)
  const [loadingDetails, setLoadingDetails] = useState(true)
  const [detailsError, setDetailsError] = useState(null)

  const [aiInsight, setAiInsight] = useState(null)
  const [loadingInsight, setLoadingInsight] = useState(false)

  // Fetch movie details when the modal opens (or movieId changes).
  useEffect(() => {
    let cancelled = false
    setLoadingDetails(true)
    setDetailsError(null)
    setDetails(null)

    fetchMovieDetails(movieId)
      .then((data) => {
        if (cancelled) return
        setDetails(data)
        setLoadingDetails(false)
      })
      .catch((err) => {
        if (cancelled) return
        setDetailsError(err.message || 'Failed to load movie details.')
        setLoadingDetails(false)
      })

    return () => {
      cancelled = true
    }
  }, [movieId])

  // Fetch the AI watch recommendation once details have arrived.
  useEffect(() => {
    if (!details) return
    let cancelled = false
    setLoadingInsight(true)
    setAiInsight(null)

    const genres = (details.genres || []).map((g) => g.name).join(', ')
    getMovieInsight({
      title: details.title,
      genres,
      overview: details.overview,
    }).then((text) => {
      if (cancelled) return
      setAiInsight(text)
      setLoadingInsight(false)
    })

    return () => {
      cancelled = true
    }
  }, [details])

  // Close on Escape key.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Lock body scroll while open.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  const trailerKey = findTrailerKey(details?.videos)
  const posterPath = details?.poster_path || details?.backdrop_path
  const backdropPath = details?.backdrop_path

  return (
    <div
      className="movie-modal__overlay"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        className="movie-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="movie-modal-title"
      >
        {backdropPath && (
          <div
            className="movie-modal__backdrop"
            style={{
              backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.6) 70%, rgba(255,255,255,1) 100%), url(${BACKDROP_BASE}${backdropPath})`,
            }}
            aria-hidden="true"
          />
        )}

        {loadingDetails && (
          <div className="movie-modal__state">Loading movie details…</div>
        )}

        {detailsError && (
          <div className="movie-modal__state movie-modal__state--error">
            <h2 id="movie-modal-title">We couldn&apos;t load this movie</h2>
            <p>{detailsError}</p>
            <button
              type="button"
              className="movie-modal__close"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        )}

        {details && !loadingDetails && !detailsError && (
          <div className="movie-modal__body">
            <h2 id="movie-modal-title" className="movie-modal__title">
              {details.title}
            </h2>

            {posterPath && (
              <img
                className="movie-modal__poster"
                src={`${POSTER_BASE}${posterPath}`}
                alt={`${details.title} poster`}
              />
            )}

            <dl className="movie-modal__meta">
              {details.release_date && (
                <>
                  <dt>Release Date</dt>
                  <dd>{details.release_date}</dd>
                </>
              )}
              {formatRuntime(details.runtime) && (
                <>
                  <dt>Runtime</dt>
                  <dd>{formatRuntime(details.runtime)}</dd>
                </>
              )}
              {details.genres?.length > 0 && (
                <>
                  <dt>Genres</dt>
                  <dd>{details.genres.map((g) => g.name).join(', ')}</dd>
                </>
              )}
            </dl>

            {details.overview && (
              <p className="movie-modal__overview">
                <strong>Overview:</strong> {details.overview}
              </p>
            )}

            <section
              className="movie-modal__insight"
              aria-label="Watch recommendation"
            >
              <h3 className="movie-modal__insight-title">
                ✨ Watch Recommendation
              </h3>
              {loadingInsight && (
                <p className="movie-modal__insight-loading" aria-live="polite">
                  ✨ Getting a recommendation…
                </p>
              )}
              {!loadingInsight && aiInsight && (
                <p className="movie-modal__insight-text">{aiInsight}</p>
              )}
            </section>

            {trailerKey && (
              <div className="movie-modal__trailer">
                <iframe
                  width="560"
                  height="315"
                  src={`https://www.youtube.com/embed/${trailerKey}`}
                  title={`${details.title} trailer`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            <div className="movie-modal__actions">
              <button
                type="button"
                className="movie-modal__close"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MovieModal
