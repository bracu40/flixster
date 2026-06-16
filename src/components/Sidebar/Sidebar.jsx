import { POSTER_BASE } from '../../api/tmdb'
import './Sidebar.css'

const FALLBACK_THUMB =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 90">
       <rect width="100%" height="100%" fill="#2a2f3a"/>
     </svg>`
  )

const SidebarSection = ({ title, items, emptyText, onSelect, onRemove, removeLabel }) => {
  return (
    <section className="sidebar__section">
      <h3 className="sidebar__heading">
        {title}{' '}
        <span className="sidebar__count" aria-label={`${items.length} items`}>
          {items.length}
        </span>
      </h3>
      {items.length === 0 ? (
        <p className="sidebar__empty">{emptyText}</p>
      ) : (
        <ul className="sidebar__list">
          {items.map((m) => (
            <li key={m.id} className="sidebar__item">
              <button
                type="button"
                className="sidebar__item-main"
                onClick={() => onSelect(m.id)}
                aria-label={`Open details for ${m.title}`}
              >
                <img
                  className="sidebar__thumb"
                  src={m.poster_path ? `${POSTER_BASE}${m.poster_path}` : FALLBACK_THUMB}
                  alt=""
                />
                <span className="sidebar__item-title">{m.title}</span>
              </button>
              <button
                type="button"
                className="sidebar__remove"
                onClick={() => onRemove(m.id)}
                aria-label={`${removeLabel} ${m.title}`}
                title={removeLabel}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

const Sidebar = ({
  id,
  favorites,
  watched,
  onSelect,
  onRemoveFavorite,
  onRemoveWatched,
  onClose,
}) => {
  return (
    <aside id={id} className="sidebar" aria-label="Your lists">
      <div className="sidebar__top">
        <h2 className="sidebar__title">My lists</h2>
        {onClose && (
          <button
            type="button"
            className="sidebar__close"
            onClick={onClose}
            aria-label="Hide my lists"
            title="Hide my lists"
          >
            ×
          </button>
        )}
      </div>
      <SidebarSection
        title="❤️ Favorites"
        items={favorites}
        emptyText="No favorites yet. Tap the heart on a movie to save it here."
        onSelect={onSelect}
        onRemove={onRemoveFavorite}
        removeLabel="Remove from favorites"
      />
      <SidebarSection
        title="✓ Watched"
        items={watched}
        emptyText="No watched movies yet. Tap the eye icon on a movie to add it."
        onSelect={onSelect}
        onRemove={onRemoveWatched}
        removeLabel="Remove from watched"
      />
    </aside>
  )
}

export default Sidebar
