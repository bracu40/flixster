# Flixster — Project Plan

A movies-now-playing site backed by TMDb, with search, sort, a detail modal, and an AI-generated "Watch Recommendation" via OpenRouter.

---

## 1. Component Architecture

Hierarchy:
```
App
├── Header
│   ├── SearchBar
│   └── SortControl
├── main
│   ├── MovieList
│   │   └── MovieCard (× N)
│   └── Sidebar
│       └── SidebarSection (× 2: Favorites, Watched)
├── MovieModal      (rendered conditionally)
└── Footer
```

| Component | Responsibility | Renders | Props | State? |
| --- | --- | --- | --- | --- |
| `App` | Top-level orchestrator: owns movie list, search, sort, page, and selected-movie state. Decides whether to fetch Now Playing or Search results. | Header, ControlsBar, MovieList, MovieModal, Footer | — | Yes (see State Architecture) |
| `Header` | Branding bar at the top of the page. | App title with movie/clapperboard emoji icons. | — | No |
| `Footer` | Footer with copyright + TMDb attribution. | Copyright text, TMDb link. | — | No |
| `SearchBar` | Controlled input + Search/Clear buttons. Submits a query and can clear back to Now Playing. | `<form>` with `<input>`, Search button, Clear button. | `query: string`, `onQueryChange(value)`, `onSubmit()`, `onClear()` | No (controlled by App) |
| `SortControl` | Dropdown that picks how the visible movies are ordered. | `<select>` with 4 options. | `value: string`, `onChange(value)` | No |
| `MovieList` | Renders the responsive grid + Load More button + loading/error UI. | One `MovieCard` per movie, plus a "Load More" button when more pages exist. | `movies: Movie[]`, `onCardClick(movieId)`, `onLoadMore()`, `canLoadMore: boolean`, `isLoading: boolean`, `error: string \| null` | No |
| `MovieCard` | Single movie tile in the grid; also surfaces Favorite (heart) and Watched (eye/check) toggles overlaid on the poster. | Poster image, title, rating, two icon buttons, optional "Watched" badge. | `movie`, `onClick(id)`, `isFavorite: boolean`, `isWatched: boolean`, `onToggleFavorite(movie)`, `onToggleWatched(movie)` | No |
| `MovieModal` | Detail overlay with full movie info + AI watch recommendation. Owns the AI insight fetch. | Backdrop image, title, release date, runtime, genres, overview, AI Watch Recommendation, Close button. | `movieId: number`, `onClose()` | Yes — `details`, `loadingDetails`, `detailsError`, `aiInsight`, `loadingInsight` |
| `Sidebar` | Persistent panel showing the user's Favorites and Watched lists. Each row opens the modal or removes the movie from that list. | Two `SidebarSection`s, each with a heading + count + list of thumbnail rows. | `favorites: Movie[]`, `watched: Movie[]`, `onSelect(id)`, `onRemoveFavorite(id)`, `onRemoveWatched(id)` | No |

---

## 2. API Contracts

### 2.1 TMDb — Now Playing
- **URL:** `https://api.themoviedb.org/3/movie/now_playing`
- **Method:** GET
- **Required params:** `api_key` (from `VITE_API_KEY`), `page` (1-indexed), `language=en-US`
- **Response fields used:** `results[].id`, `results[].title`, `results[].poster_path`, `results[].vote_average`, `results[].release_date`, `page`, `total_pages`
- **Errors handled:** 401 (bad key), network failure → user-facing error message; empty `results` → empty-state message.

### 2.2 TMDb — Search Movies
- **URL:** `https://api.themoviedb.org/3/search/movie`
- **Method:** GET
- **Required params:** `api_key`, `query`, `page`, `language=en-US`, `include_adult=false`
- **Response fields used:** identical to Now Playing.
- **Errors handled:** same as above; `query` empty → don't fire a request, fall back to Now Playing.

### 2.3 TMDb — Movie Details (modal)
- **URL:** `https://api.themoviedb.org/3/movie/{movie_id}`
- **Method:** GET
- **Required params:** `api_key`, `language=en-US`
- **Response fields used:** `title`, `runtime`, `release_date`, `genres[].name`, `overview`, `backdrop_path`, `poster_path`, `videos`/trailer is fetched via `?append_to_response=videos`.
- **Errors handled:** 404 (movie not found), 401 (bad key), network failure → modal shows a friendly error and a Close button; never a broken modal.

### 2.4 OpenRouter — AI Watch Recommendation
- **URL:** `https://openrouter.ai/api/v1/chat/completions`
- **Method:** POST
- **Auth:** `Authorization: Bearer ${VITE_OPENROUTER_API_KEY}`
- **Model:** `meta-llama/llama-3.3-70b-instruct:free`
- **Body:** JSON with `model`, `messages: [{role:'system', content:<role+constraints>}, {role:'user', content:<task+movie context>}]`
- **Response field used:** `data.choices[0].message.content` (string).
- **Errors handled:** non-200 status, network failure, missing API key → fallback message rendered in the modal: "We couldn't generate a recommendation for this one — check out the overview above!"

---

## 3. State Architecture

All app-level state lives in `App` (single source of truth). Modal-internal state lives in `MovieModal`.

| Variable | Type | Initial | Owner | Updated when |
| --- | --- | --- | --- | --- |
| `movies` | `Movie[]` | `[]` | `App` | New page fetched (append) or mode/query change (replace). |
| `mode` | `'nowPlaying' \| 'search'` | `'nowPlaying'` | `App` | User submits a search → `'search'`; user clears search → `'nowPlaying'`. |
| `searchQuery` | `string` | `''` | `App` | Every keystroke in `SearchBar` (controlled input). |
| `submittedQuery` | `string` | `''` | `App` | User submits the search form (the query actually used in the fetch). |
| `page` | `number` | `1` | `App` | "Load More" → `page + 1`; mode/query change → reset to `1`. |
| `totalPages` | `number` | `1` | `App` | Set from each TMDb response. |
| `sortOption` | `'default' \| 'title' \| 'release' \| 'rating'` | `'default'` | `App` | User picks an option in `SortControl`. |
| `selectedMovieId` | `number \| null` | `null` | `App` | `MovieCard` click → set; modal `onClose` → `null`. |
| `isLoading` | `boolean` | `false` | `App` | Toggled around every list fetch. |
| `error` | `string \| null` | `null` | `App` | Set on fetch failure, cleared on retry/mode change. |
| `favorites` | `Map<id, {id, title, poster_path}>` | empty `Map` | `App` | `MovieCard` heart toggled or sidebar × clicked. Resets on reload (not persisted). |
| `watched` | `Map<id, {id, title, poster_path}>` | empty `Map` | `App` | `MovieCard` eye toggled or sidebar × clicked. Resets on reload (not persisted). |
| `details` | `MovieDetails \| null` | `null` | `MovieModal` | Details fetch resolves. |
| `loadingDetails` | `boolean` | `false` | `MovieModal` | Around details fetch. |
| `detailsError` | `string \| null` | `null` | `MovieModal` | Details fetch fails. |
| `aiInsight` | `string \| null` | `null` | `MovieModal` | OpenRouter call resolves. |
| `loadingInsight` | `boolean` | `false` | `MovieModal` | Around OpenRouter call. |

Sort is applied as a derived value at render time (a sorted copy of `movies`), not stored — switching sort doesn't refetch.

---

## 4. Data Flow

1. `App` mounts → effect fires that depends on `mode`, `submittedQuery`, `page`. It picks the right TMDb endpoint (Now Playing vs Search), builds the URL with `VITE_API_KEY`, and fetches.
2. The response JSON is read; `results` (a `Movie[]`) is either **replaced** (page 1) or **appended** to the `movies` state. `total_pages` is stored for Load More gating.
3. Render time: `App` produces `displayedMovies = sortMovies(movies, sortOption)` and passes that to `<MovieList movies={displayedMovies} … />`.
4. `MovieList` `.map`s into `<MovieCard movie={m} onClick={onCardClick} />`. Each card receives only the four fields it actually uses (`id`, `title`, `poster_path`, `vote_average`).
5. Click on a `MovieCard` → calls `onCardClick(movie.id)` → `App` sets `selectedMovieId`. `App` conditionally renders `<MovieModal movieId={selectedMovieId} onClose={…} />`.
6. `MovieModal` mounts with `movieId` → its own `useEffect` fetches `/movie/{movieId}` from TMDb (for runtime + genres + backdrop). A second `useEffect`, gated on `details`, fires the OpenRouter call with `(title, genres, overview)` to populate `aiInsight`.
7. Closing the modal sets `selectedMovieId` back to `null`. `MovieModal` unmounts; its internal state goes with it (no manual cleanup needed).

No raw API response transformation is needed beyond extracting `results` and dropping unused fields — TMDb's shape matches what components consume.

### Favorites & Watched data flow
- `App` owns two `Map<id, {id, title, poster_path}>`s. Storing a small projection (not the whole movie object) keeps the sidebar usable even if the underlying `movies` array changes (search, pagination).
- `MovieList` derives `Set`s of ids from those Maps and passes a per-card `isFavorite` / `isWatched` boolean down. Toggle handlers come from `App` and receive the full `movie` so the Map can capture title + poster on add.
- The `Sidebar` reads the Maps' values directly. Clicking a row sets `selectedMovieId`, opening the modal — same path as a card click. The × button calls `removeFromMap`, which is a no-op delete on the Map.
- Click handlers on the card icons call `e.stopPropagation()` so toggling doesn't also open the modal.

### Responsive grid breakpoints
- ≥1200px: 6 columns
- 900–1199px: 4 columns
- 600–899px: 3 columns
- 400–599px: 2 columns
- <400px: 1 column

Implemented via `grid-template-columns: repeat(auto-fill, minmax(180px, 1fr))` plus media queries.

---

## 5. AI Feature Spec

### Prompt Spec
- **Role (system):** "You are an enthusiastic but honest film critic. You write short, useful watch recommendations for moviegoers deciding whether to spend an evening on a film."
- **Task:** Given a movie's title, genre list, and plot overview, write a 2–3 sentence watch recommendation aimed at the kind of viewer most likely to enjoy it.
- **Inputs sent:** `title` (string), `genres` (comma-separated string, e.g. `"Horror, Mystery"`), `overview` (string).
- **Output format:** Plain text, 2–3 sentences, ~50–80 words. Second-person voice (address the reader as "you"). No markdown headings, bullets, or emoji.
- **Constraints:**
  - No plot spoilers beyond what's in the overview.
  - No first-person ("I", "my").
  - No hollow phrases ("must-see", "instant classic", "tour de force").
  - No comparisons to other named films unless directly useful.
  - Don't restate the overview verbatim — interpret it.
- **Failure behavior:** If the API call fails or the key is missing, render: *"We couldn't generate a recommendation for this one — check out the overview above!"*

### OpenRouter
- Endpoint: `https://openrouter.ai/api/v1/chat/completions`
- Model: `meta-llama/llama-3.3-70b-instruct:free`
- Auth: `Authorization: Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`

### State + trigger
- `aiInsight: string | null` (initial `null`) and `loadingInsight: boolean` (initial `false`) live in `MovieModal`.
- The fetch fires from a `useEffect` that depends on `details` — once the TMDb details have arrived, we have title/genres/overview, so the AI call has the context it needs.
- While loading: render `✨ Getting a recommendation...` in the recommendation section.
- On resolve: `setAiInsight(text)` and `setLoadingInsight(false)`.
- On modal close: component unmounts; state is discarded automatically.

### AI Feature — Decisions Log
- **What the API returned initially:** Llama-3.3-70b sometimes prefixed responses with `"Here's a recommendation:"` and produced 4–5 sentences instead of 2–3. It also occasionally used "I think…".
- **What I changed in my prompt:** Added explicit "No first-person", "No preamble — start directly with the recommendation", and "2–3 sentences max, ~50–80 words" to the system message. Moved the movie context into the user message as a labeled block (`Title: …\nGenres: …\nOverview: …`) instead of free-form prose.
- **What fallback behavior I implemented:** Single user-facing fallback string (above) shown in place of the recommendation if the OpenRouter call rejects, returns non-200, or the API key env var is missing/empty. The error is logged to the console for debugging.
- **What I learned:** Async features in React need their loading/error/data state co-located in the component that owns them; trying to lift the AI insight state to `App` would have meant manually clearing it on close. Keeping it in `MovieModal` lets unmount handle cleanup. Also: "no preamble" is a surprisingly powerful constraint — most stylistic problems with model output come from the model padding the start of its response.
