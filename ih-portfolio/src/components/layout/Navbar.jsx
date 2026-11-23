
import { NavLink } from 'react-router';
import '../../styles/navbar.css';

const navLinks = [
  { number: '01', label: 'HOME', path: '/' },
  { number: '02', label: 'PROJECTS', path: '/projects' },
  { number: '03', label: 'EXPERIENCE', path: '/experience' },
  { number: '04', label: 'CONTACT', path: '/contact' },
];

function Navbar() {
  return (
    <header className="navbar">
      <NavLink
        to="/"
        className="navbar__logo"
        aria-label="Home"
      >
        <img src="/icons/logo.svg" alt="IH logo" />
      </NavLink>

      <nav className="navbar__links" aria-label="Main navigation">
        {navLinks.map(({ number, label, path }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className="navbar__link"
          >
            <span className="navbar__number">{number}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <a
        href="/ResumeIH.pdf"
        className="navbar__resume"
        target="_blank"
        rel="noopener noreferrer"
      >
        RESUMÉ
      </a>
    </header>
  );
}

export default Navbar;
