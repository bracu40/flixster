import './Header.css'

const Header = ({ children }) => {
  return (
    <header className="app-header">
      <h1 className="app-header__title">
        <span aria-hidden="true">🎥</span> Flixster <span aria-hidden="true">🎬</span>
      </h1>
      {children && <div className="app-header__controls">{children}</div>}
    </header>
  )
}

export default Header
