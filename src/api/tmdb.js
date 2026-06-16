const API_KEY = import.meta.env.VITE_API_KEY
const BASE = 'https://api.themoviedb.org/3'

export const POSTER_BASE = 'https://image.tmdb.org/t/p/w500'
export const BACKDROP_BASE = 'https://image.tmdb.org/t/p/w1280'

const ensureKey = () => {
  if (!API_KEY) {
    throw new Error('Missing VITE_API_KEY. Add it to your .env file.')
  }
}

const get = async (path, params = {}) => {
  ensureKey()
  const url = new URL(`${BASE}${path}`)
  url.searchParams.set('api_key', API_KEY)
  url.searchParams.set('language', 'en-US')
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, v)
  }
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`TMDb request failed (${res.status})`)
  }
  return res.json()
}

export const fetchNowPlaying = (page = 1) =>
  get('/movie/now_playing', { page })

export const fetchSearch = (query, page = 1) =>
  get('/search/movie', { query, page, include_adult: false })

export const fetchMovieDetails = (movieId) =>
  get(`/movie/${movieId}`, { append_to_response: 'videos' })
