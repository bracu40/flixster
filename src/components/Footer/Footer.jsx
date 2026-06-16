import './Footer.css'

const Footer = () => {
  const year = new Date().getFullYear()
  return (
    <footer className="app-footer">
      <p className="app-footer__line">
        © {year} Flixster · Movie data provided by{' '}
        <a
          href="https://www.themoviedb.org/"
          target="_blank"
          rel="noreferrer"
          className="app-footer__link"
        >
          The Movie Database
        </a>
      </p>
    </footer>
  )
}

export default Footer
