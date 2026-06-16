import { useEffect, useMemo, useState } from 'react'
import './App.css'
import Header from './components/Header/Header'
import Footer from './components/Footer/Footer'
import SearchBar from './components/SearchBar/SearchBar'
import SortControl from './components/SortControl/SortControl'
import MovieList from './components/MovieList/MovieList'
import MovieModal from './components/MovieModal/MovieModal'
import Sidebar from './components/Sidebar/Sidebar'
import { fetchNowPlaying, fetchSearch } from './api/tmdb'

const sortMovies = (movies, sortOption) => {
  if (sortOption === 'default') return movies
  const copy = [...movies]
  if (sortOption === 'title') {
    return copy.sort((a, b) => a.title.localeCompare(b.title))
  }
  if (sortOption === 'release') {
    return copy.sort((a, b) => {
      // Newest first; missing dates sort to the bottom.
      const aDate = a.release_date || ''
      const bDate = b.release_date || ''
      if (!aDate && !bDate) return 0
      if (!aDate) return 1
      if (!bDate) return -1
      return bDate.localeCompare(aDate)
    })
  }
  if (sortOption === 'rating') {
    return copy.sort((a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0))
  }
  return movies
}

const dedupeById = (movies) => {
  const seen = new Set()
  return movies.filter((m) => {
    if (seen.has(m.id)) return false
    seen.add(m.id)
    return true
  })
}

const App = () => {
  const [movies, setMovies] = useState([])
  const [mode, setMode] = useState('nowPlaying') // 'nowPlaying' | 'search'
  const [searchQuery, setSearchQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [sortOption, setSortOption] = useState('default')
  const [selectedMovieId, setSelectedMovieId] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Favorites and watched are stored as ordered Maps keyed by movie id, so we
  // can render titles + posters in the sidebar even after the user paginates
  // away from the original list. Not persisted — resets on reload.
  const [favorites, setFavorites] = useState(() => new Map())
  const [watched, setWatched] = useState(() => new Map())
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data =
          mode === 'search'
            ? await fetchSearch(submittedQuery, page)
            : await fetchNowPlaying(page)
        if (cancelled) return
        const newResults = data.results || []
        setTotalPages(data.total_pages || 1)
        setMovies((prev) =>
          page === 1 ? newResults : dedupeById([...prev, ...newResults])
        )
      } catch (err) {
        if (cancelled) return
        setError(err.message || 'Could not load movies.')
        if (page === 1) setMovies([])
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    if (mode === 'search' && !submittedQuery.trim()) {
      setIsLoading(false)
      return
    }

    run()
    return () => {
      cancelled = true
    }
  }, [mode, submittedQuery, page])

  const displayedMovies = useMemo(
    () => sortMovies(movies, sortOption),
    [movies, sortOption]
  )

  const handleSearchSubmit = () => {
    const trimmed = searchQuery.trim()
    if (!trimmed) return
    setMode('search')
    setSubmittedQuery(trimmed)
    setPage(1)
    setMovies([])
  }

  const handleClear = () => {
    setSearchQuery('')
    setSubmittedQuery('')
    setMode('nowPlaying')
    setPage(1)
    setMovies([])
  }

  const handleLoadMore = () => {
    if (page < totalPages) setPage((p) => p + 1)
  }

  const canLoadMore = page < totalPages

  const toggleInMap = (setter) => (movie) => {
    setter((prev) => {
      const next = new Map(prev)
      if (next.has(movie.id)) {
        next.delete(movie.id)
      } else {
        next.set(movie.id, {
          id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
        })
      }
      return next
    })
  }

  const removeFromMap = (setter) => (id) => {
    setter((prev) => {
      if (!prev.has(id)) return prev
      const next = new Map(prev)
      next.delete(id)
      return next
    })
  }

  const handleToggleFavorite = toggleInMap(setFavorites)
  const handleToggleWatched = toggleInMap(setWatched)
  const handleRemoveFavorite = removeFromMap(setFavorites)
  const handleRemoveWatched = removeFromMap(setWatched)

  const favoriteIds = useMemo(() => new Set(favorites.keys()), [favorites])
  const watchedIds = useMemo(() => new Set(watched.keys()), [watched])
  const favoriteList = useMemo(() => Array.from(favorites.values()), [favorites])
  const watchedList = useMemo(() => Array.from(watched.values()), [watched])
  const sidebarCount = favorites.size + watched.size

  return (
    <div className="app">
      <Header>
        <SearchBar
          query={searchQuery}
          onQueryChange={setSearchQuery}
          onSubmit={handleSearchSubmit}
          onClear={handleClear}
        />
        <SortControl value={sortOption} onChange={setSortOption} />
        <button
          type="button"
          className="app__sidebar-toggle"
          onClick={() => setIsSidebarOpen((v) => !v)}
          aria-expanded={isSidebarOpen}
          aria-controls="app-sidebar"
        >
          {isSidebarOpen ? 'Hide my lists' : 'My lists'}
          {sidebarCount > 0 && (
            <span className="app__sidebar-toggle-count" aria-hidden="true">
              {sidebarCount}
            </span>
          )}
        </button>
      </Header>

      <main className="app__main">
        <div
          className={`app__content${isSidebarOpen ? '' : ' app__content--no-sidebar'}`}
        >
          <div className="app__list-wrap">
            <MovieList
              movies={displayedMovies}
              onCardClick={setSelectedMovieId}
              onLoadMore={handleLoadMore}
              canLoadMore={canLoadMore}
              isLoading={isLoading}
              error={error}
              favoriteIds={favoriteIds}
              watchedIds={watchedIds}
              onToggleFavorite={handleToggleFavorite}
              onToggleWatched={handleToggleWatched}
            />
          </div>
          {isSidebarOpen && (
            <Sidebar
              id="app-sidebar"
              favorites={favoriteList}
              watched={watchedList}
              onSelect={setSelectedMovieId}
              onRemoveFavorite={handleRemoveFavorite}
              onRemoveWatched={handleRemoveWatched}
              onClose={() => setIsSidebarOpen(false)}
            />
          )}
        </div>
      </main>

      <Footer />

      {selectedMovieId !== null && (
        <MovieModal
          movieId={selectedMovieId}
          onClose={() => setSelectedMovieId(null)}
        />
      )}
    </div>
  )
}

export default App
