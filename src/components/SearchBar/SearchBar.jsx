import './SearchBar.css'

const SearchBar = ({ query, onQueryChange, onSubmit, onClear }) => {
  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim()) onSubmit()
  }

  return (
    <form className="search-bar" onSubmit={handleSubmit} role="search">
      <input
        className="search-bar__input"
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Search for movies"
        aria-label="Search for movies"
      />
      <button type="submit" className="search-bar__btn search-bar__btn--primary">
        Search
      </button>
      <button
        type="button"
        className="search-bar__btn"
        onClick={onClear}
        aria-label="Clear search and show now playing"
      >
        Clear
      </button>
    </form>
  )
}

export default SearchBar
