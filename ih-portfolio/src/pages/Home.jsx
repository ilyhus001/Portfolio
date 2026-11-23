
import { Link } from 'react-router';

import '../styles/home.css';
import '../styles/home-artwork.css';

const socialLinks = [
  {
    label: 'GITHUB',
    href: '', // Add your GitHub URL
  },
  {
    label: 'LINKEDIN',
    href: '', // Add your LinkedIn URL
  },
  {
    label: 'EMAIL',
    href: 'mailto:ilyaashussein123@gmail.com',
  },
];

function SocialLink({ label, href }) {
  const content = (
    <>
      <span>{label}</span>
      <span className="home-arrow" aria-hidden="true" />
    </>
  );

  if (!href) {
    return (
      <span className="home-social__link">
        {content}
      </span>
    );
  }

  return (
    <a
      className="home-social__link"
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel={
        href.startsWith('http')
          ? 'noopener noreferrer'
          : undefined
      }
    >
      {content}
    </a>
  );
}

function Home() {
  return (
    <section
      className="home-page"
      aria-labelledby="home-title"
    >
      {/* SVG FILTER — REUSES EXISTING LOGO */}

      <svg
        className="home-artwork-filter"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <filter
            id="ih-footer-outline"
            x="-2%"
            y="-2%"
            width="104%"
            height="104%"
            colorInterpolationFilters="sRGB"
          >
            {/* Expand the silhouette by 1px */}

            <feMorphology
              in="SourceAlpha"
              operator="dilate"
              radius="1"
              result="expanded"
            />

            {/* Remove the original silhouette */}

            <feComposite
              in="expanded"
              in2="SourceAlpha"
              operator="out"
              result="outline"
            />

            {/* Yellow outline at 30% opacity */}

            <feFlood
              floodColor="#FDFF01"
              floodOpacity="0.3"
              result="yellow"
            />

            <feComposite
              in="yellow"
              in2="outline"
              operator="in"
              result="yellowOutline"
            />

            {/* Black fill at 50% opacity */}

            <feFlood
              floodColor="#000000"
              floodOpacity="0.5"
              result="black"
            />

            <feComposite
              in="black"
              in2="SourceAlpha"
              operator="in"
              result="blackFill"
            />

            <feMerge>
              <feMergeNode in="blackFill" />
              <feMergeNode in="yellowOutline" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* SAME LOGO AS NAVBAR, DIFFERENT STYLING */}

      <img
        className="home-footer-art"
        src="/icons/logo.svg"
        alt=""
        aria-hidden="true"
      />

      <div className="home-hero">
        <div className="home-hero__main">
          <div className="home-hero__content">

            <p className="home-hero__eyebrow">
              {'{HELLO_WORLD}'}
            </p>

            <h1
              id="home-title"
              className="home-hero__name"
            >
              <span>ILYAAS</span>
              <span>HUSSEIN</span>
            </h1>

            <div className="home-hero__intro">
              <p className="home-hero__role">
                SOFTWARE ENGINEER
              </p>

              <p className="home-hero__description">
                Ottawa-based software engineer with experience
                building cloud infrastructure, backend applications,
                and developer tools. I enjoy solving problems,
                learning how systems work, and building things
                from scratch.
              </p>
            </div>

            <div className="home-hero__buttons">
              <Link
                to="/projects"
                className="home-cta home-cta--primary"
              >
                <span>VIEW PROJECTS</span>
                <span
                  className="home-arrow"
                  aria-hidden="true"
                />
              </Link>

              <a
                href="/ResumeIH.pdf"
                download="ResumeIH.pdf"
                className="home-cta home-cta--secondary"
              >
                <span>DOWNLOAD RESUME</span>
                <span
                  className="home-arrow"
                  aria-hidden="true"
                />
              </a>
            </div>
          </div>
        </div>

        <div className="home-social-footer">
          <div className="home-social">
            {socialLinks.map((link) => (
              <SocialLink
                key={link.label}
                label={link.label}
                href={link.href}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Home;
