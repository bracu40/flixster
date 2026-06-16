import './SortControl.css'

const OPTIONS = [
  { value: 'default', label: 'Sort by' },
  { value: 'title', label: 'Title (A–Z)' },
  { value: 'release', label: 'Release Date (Newest)' },
  { value: 'rating', label: 'Vote Average (Highest)' },
]

const SortControl = ({ value, onChange }) => {
  return (
    <label className="sort-control">
      <span className="sort-control__sr-only">Sort movies</span>
      <select
        className="sort-control__select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Sort movies"
      >
        {OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export default SortControl
