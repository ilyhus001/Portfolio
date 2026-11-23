
import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router';

import '../../styles/navbar.css';

/* ========================================
   NAVIGATION LINKS
   ======================================== */

const navigation = [
  { number: '01', label: 'HOME', path: '/' },
  { number: '02', label: 'PROJECTS', path: '/projects' },
  { number: '03', label: 'EXPERIENCE', path: '/experience' },
  { number: '04', label: 'CONTACT', path: '/contact' },
];

/* ========================================
   CONTACT LINKS
   ======================================== */

const socialLinks = [
  {
    label: 'GITHUB',
    href: 'https://github.com/ilyhus001',
  },
  {
    label: 'LINKEDIN',
    href: 'https://www.linkedin.com/in/ilyaas-hussein-655430252/',
  },
];

const EMAIL = 'ilyaashussein123@gmail.com';
const PHONE = '+1 613 265 6722';

/* ========================================
   NAVBAR
   ======================================== */

function Navbar() {
  const { pathname } = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);

  const toggleRef = useRef(null);
  const overlayRef = useRef(null);

  /* =====================================
     CLOSE MENU AFTER NAVIGATION
     ===================================== */

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  /* =====================================
     MENU INTERACTIONS
     ===================================== */

  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    const firstLink = overlayRef.current?.querySelector(
      '.navbar__overlay-link'
    );

    firstLink?.focus();

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        toggleRef.current?.focus();
        return;
      }

      if (event.key !== 'Tab') return;

      const links = Array.from(
        overlayRef.current?.querySelectorAll('a[href]') ?? []
      );

      const focusable = [
        toggleRef.current,
        ...links,
      ].filter(Boolean);

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === last
      ) {
        event.preventDefault();
        first.focus();
      }
    }

    function handleDesktopChange(event) {
      if (event.matches) {
        setMenuOpen(false);
      }
    }

    const desktopQuery = window.matchMedia(
      '(min-width: 1026px)'
    );

    document.addEventListener('keydown', handleKeyDown);

    desktopQuery.addEventListener(
      'change',
      handleDesktopChange
    );

    return () => {
      document.body.style.overflow = previousOverflow;

      document.removeEventListener(
        'keydown',
        handleKeyDown
      );

      desktopQuery.removeEventListener(
        'change',
        handleDesktopChange
      );
    };
  }, [menuOpen]);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <nav
      className={
        `navbar${menuOpen ? ' navbar--open' : ''}`
      }
      aria-label="Primary navigation"
    >
      {/* ===================================
          DESKTOP / MOBILE TOP BAR
          =================================== */}

      <div className="navbar__bar">

        {/* IH LOGO */}

        <NavLink
          to="/"
          className="navbar__logo"
          aria-label="Home"
          onClick={closeMenu}
        >
          <img
            src="/icons/logo.svg"
            alt="IH"
            draggable="false"
          />
        </NavLink>

        {/* DESKTOP LINKS */}

        <div className="navbar__links">
          {navigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end
              className={({ isActive }) =>
                `navbar__link${isActive ? ' is-active' : ''}`
              }
            >
              <span className="navbar__link-number">
                {item.number}
              </span>

              <span className="navbar__link-label">
                {item.label}
              </span>

              <span
                className="navbar__underline"
                aria-hidden="true"
              />
            </NavLink>
          ))}
        </div>

        {/* RIGHT ACTIONS */}

        <div className="navbar__actions">

          {/* RESUME */}

          <a
            className="navbar__resume"
            href="/images/ResumeIH.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            RESUMÉ
          </a>

          {/* MOBILE MENU BUTTON */}

          <button
            ref={toggleRef}
            type="button"
            className={
              `navbar__toggle${menuOpen ? ' is-open' : ''}`
            }
            aria-label={
              menuOpen ? 'Close menu' : 'Open menu'
            }
            aria-expanded={menuOpen}
            aria-controls="navbar-mobile-menu"
            onClick={() => {
              setMenuOpen((previous) => !previous);
            }}
          >
            <span />
            <span />
            <span />
          </button>

        </div>
      </div>

      {/* ===================================
          YELLOW MOBILE MENU
          =================================== */}

      <div
        ref={overlayRef}
        id="navbar-mobile-menu"
        className={
          `navbar__overlay${menuOpen ? ' is-open' : ''}`
        }
        aria-hidden={!menuOpen}
        inert={!menuOpen}
      >
        <div className="navbar__overlay-inner">

          {/* =================================
              MENU SECTION
              ================================= */}

          <section
            className="navbar__group"
            style={{ '--i': 0 }}
            aria-labelledby="navbar-menu-heading"
          >
            <h2
              className="navbar__group-label"
              id="navbar-menu-heading"
            >
              MENU

              <span
                className="navbar__group-rule"
                aria-hidden="true"
              />
            </h2>

            <div className="navbar__overlay-links">
              {navigation.map((item, index) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    `navbar__overlay-link${isActive ? ' is-active' : ''}`
                  }
                  style={{ '--i': index }}
                >
                  <span className="navbar__overlay-index">
                    {item.number}
                  </span>

                  <span className="navbar__overlay-label">
                    {item.label}
                  </span>
                </NavLink>
              ))}
            </div>
          </section>

          {/* =================================
              SOCIAL SECTION
              ================================= */}

          <section
            className="navbar__group"
            style={{ '--i': 4 }}
            aria-labelledby="navbar-social-heading"
          >
            <h2
              className="navbar__group-label"
              id="navbar-social-heading"
            >
              SOCIAL

              <span
                className="navbar__group-rule"
                aria-hidden="true"
              />
            </h2>

            <div className="navbar__group-row">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  className="navbar__meta-link"
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={closeMenu}
                >
                  {social.label}
                </a>
              ))}
            </div>
          </section>

          {/* =================================
              CONTACT SECTION
              ================================= */}

          <section
            className="navbar__group"
            style={{ '--i': 5 }}
            aria-labelledby="navbar-contact-heading"
          >
            <h2
              className="navbar__group-label"
              id="navbar-contact-heading"
            >
              CONTACTS

              <span
                className="navbar__group-rule"
                aria-hidden="true"
              />
            </h2>

            <div className="navbar__group-row navbar__group-row--stack">

              <div>
                <strong>E.</strong>

                <a
                  className="navbar__meta-link"
                  href={`mailto:${EMAIL}`}
                  onClick={closeMenu}
                >
                  {EMAIL}
                </a>
              </div>

              <div>
                <strong>P.</strong>

                <a
                  className="navbar__meta-link"
                  href="tel:+16132666722"
                  onClick={closeMenu}
                >
                  {PHONE}
                </a>
              </div>

            </div>
          </section>

        </div>
      </div>
    </nav>
  );
}

export default Navbar;
