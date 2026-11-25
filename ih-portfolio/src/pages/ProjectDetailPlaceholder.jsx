
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import '../styles/project-detail-placeholder.css';

/* ========================================
   CU ARRIVAL — PROJECT DETAIL
   ======================================== */

const BASE = '/images/projects/cu-arrival';

const GITHUB = 'https://github.com/JalterCode/CU-ARival';
const YOUTUBE = 'https://www.youtube.com/watch?v=O81VTGpvLYU';

const screenshots = [
  {
    src: `${BASE}/01-select-building.webp`,
    alt: 'Choose a building in CU ARrival',
  },
  {
    src: `${BASE}/02-scan-starting-plaque.webp`,
    alt: 'Scan the room plaque to set a starting location',
  },
  {
    src: `${BASE}/03-select-destination.webp`,
    alt: 'Choose a destination from the room list',
  },
  {
    src: `${BASE}/04-follow-ar-route.webp`,
    alt: 'Follow the blue augmented reality path',
  },
  {
    src: `${BASE}/05-approach-destination.webp`,
    alt: 'Follow the route along the hallway',
  },
  {
    src: `${BASE}/06-arrival-confirmation.webp`,
    alt: 'Arrival confirmation at room 4460',
  },
];

const team = [
  'Jake Swann',
  'Jad Hamzeh',
  'Firas El-Ezzi',
  'Ilyaas Hussein',
  'Rozba Hakam',
];

/* ========================================
   HOME-STYLE PROJECT BUTTON
   ======================================== */

function ProjectButton({ href, variant, children }) {
  return (
    <a
      className={`cu-arrival__action cu-arrival__action--${variant}`}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span>{children}</span>
      <span
        className="cu-arrival__action-arrow"
        aria-hidden="true"
      />
    </a>
  );
}

/* ========================================
   CAROUSEL ARROW
   ======================================== */

function CarouselArrow({ right = false }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className={
        right
          ? 'cu-arrival__arrow-svg is-right'
          : 'cu-arrival__arrow-svg'
      }
    >
      <path d="M22 9V7h-1V5h-1V4h-1V3h-2V2h-2V1H9v1H7v1H5v1H4v1H3v2H2v2H1v6h1v2h1v2h1v1h1v1h2v1h2v1h6v-1h2v-1h2v-1h1v-1h1v-2h1v-2h1V9h-1ZM12 13v4h-1v-1h-1v-1H9v-1H8v-1H7v-2h1v-1h1V9h1V8h1V7h1v4h6v2h-6Z" />
    </svg>
  );
}

/* ========================================
   APP CAROUSEL
   ======================================== */

function AppCarousel() {
  const slides = [
    screenshots[screenshots.length - 1],
    ...screenshots,
    screenshots[0],
  ];

  const [index, setIndex] = useState(1);
  const [dragOffset, setDragOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [instant, setInstant] = useState(false);

  const gesture = useRef(null);
  const wrapFrames = useRef([]);

  const active =
    ((index - 1 + screenshots.length) % screenshots.length) + 1;

  function move(direction) {
    if (instant) return;

    setIndex((previous) =>
      Math.max(0, Math.min(slides.length - 1, previous + direction))
    );
  }

  function onTransitionEnd(event) {
    if (event.target !== event.currentTarget) return;

    if (index === 0) {
      setInstant(true);
      setIndex(screenshots.length);
    } else if (index === slides.length - 1) {
      setInstant(true);
      setIndex(1);
    }
  }

  useEffect(() => {
    if (!instant) return undefined;

    const first = requestAnimationFrame(() => {
      const second = requestAnimationFrame(() => {
        setInstant(false);
      });

      wrapFrames.current.push(second);
    });

    wrapFrames.current = [first];

    return () => {
      wrapFrames.current.forEach(cancelAnimationFrame);
      wrapFrames.current = [];
    };
  }, [instant]);

  function pointerDown(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (instant) return;

    gesture.current = { startX: event.clientX };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function pointerMove(event) {
    if (gesture.current?.startX == null) return;

    setDragOffset(event.clientX - gesture.current.startX);
  }

  function pointerUp(event) {
    if (gesture.current?.startX == null) return;

    const distance = event.clientX - gesture.current.startX;

    gesture.current = null;
    setDragging(false);
    setDragOffset(0);

    if (Math.abs(distance) > 45) {
      move(distance < 0 ? 1 : -1);
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return (
    <section
      className="cu-arrival__gallery"
      aria-label="CU ARrival app screenshots"
    >
      <p className="cu-arrival__gallery-label">
        {'{Screens from the app}'}
      </p>

      <div
        className="cu-arrival__carousel-viewport"
        role="region"
        aria-roledescription="carousel"
        aria-label="App walkthrough"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') {
            event.preventDefault();
            move(-1);
          } else if (event.key === 'ArrowRight') {
            event.preventDefault();
            move(1);
          }
        }}
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
        onPointerCancel={pointerUp}
      >
        <div
          className={
            'cu-arrival__carousel-track' +
            (dragging || instant ? ' is-instant' : '')
          }
          onTransitionEnd={onTransitionEnd}
          style={{
            '--active-slide': index,
            '--drag-offset': `${dragOffset}px`,
          }}
        >
          {slides.map((slide, slideIndex) => (
            <figure
              className="cu-arrival__carousel-slide"
              key={`${slideIndex}-${slide.src}`}
              aria-hidden={slideIndex !== index}
            >
              <img
                src={slide.src}
                alt={slide.alt}
                draggable="false"
                loading="lazy"
              />
            </figure>
          ))}
        </div>
      </div>

      {/* ONLY CAROUSEL ARROWS REMAIN HERE */}

      <div className="cu-arrival__carousel-controls">
        <div className="cu-arrival__carousel-buttons">
          <button
            type="button"
            onClick={() => move(-1)}
            aria-label="Previous screenshot"
          >
            <CarouselArrow />
          </button>

          <button
            type="button"
            onClick={() => move(1)}
            aria-label="Next screenshot"
          >
            <CarouselArrow right />
          </button>
        </div>
      </div>

      <span
        className="cu-arrival__screenreader"
        aria-live="polite"
      >
        Screenshot {active} of {screenshots.length}
      </span>
    </section>
  );
}

/* ========================================
   PROJECT DETAIL PAGE
   ======================================== */

export default function ProjectDetailPlaceholder() {
  return (
    <main className="cu-arrival">

      {/* ====================================
          HERO
          ==================================== */}

      <section
        className="cu-arrival__hero"
        aria-labelledby="cu-arrival-title"
      >
        <p className="cu-arrival__status">
          CU ARRIVAL // AUGMENTED REALITY
        </p>

        {/* GITHUB AND YOUTUBE BUTTONS AT THE TOP */}

        <div className="cu-arrival__hero-actions">
          <ProjectButton
            href={GITHUB}
            variant="primary"
          >
            VIEW ON GITHUB
          </ProjectButton>

          <ProjectButton
            href={YOUTUBE}
            variant="secondary"
          >
            WATCH ON YOUTUBE
          </ProjectButton>
        </div>

        <div className="cu-arrival__hero-image">
          <img
            src={`${BASE}/cu-arrival.webp`}
            alt="CU ARrival overlaying a blue path on a real university hallway"
            fetchPriority="high"
          />
        </div>

        <div className="cu-arrival__headline">
          <h1 id="cu-arrival-title">
            CU ARrival
          </h1>

          <p>
            Indoor navigation through augmented reality.
            Choose a room, scan a starting point and
            follow the path in front of you.
          </p>

          <div className="cu-arrival__meta">
            <span>2025</span>
            <span>SOFTWARE ENGINEERING CAPSTONE</span>
          </div>
        </div>

        <div className="cu-arrival__specs">
          <div>
            <span>{'{Technologies}'}</span>

            <p>
              Unity · C# · ARCore · LiDAR · NavMesh
            </p>
          </div>

          <div>
            <span>{'{Platform}'}</span>

            <p>Mobile AR</p>
          </div>
        </div>
      </section>

      {/* ====================================
          INTRODUCTION
          ==================================== */}

      <section
        className="cu-arrival__intro"
        aria-labelledby="cu-arrival-intro"
      >
        <h2 id="cu-arrival-intro">
          Find your way.
        </h2>

        <div>
          <p>
            Select a building, scan a plaque to locate
            yourself, then follow the AR route to your
            destination.
          </p>
        </div>
      </section>

      {/* ====================================
          STUDIO MACACO-STYLE CAROUSEL
          ==================================== */}

      <AppCarousel />

      {/* ====================================
          TEAM
          ==================================== */}

      <section
        className="cu-arrival__team"
        aria-labelledby="cu-arrival-team"
      >
        <div className="cu-arrival__team-intro">
          <h2 id="cu-arrival-team">
            The team.
          </h2>

          <p>
            Our Carleton University capstone team.
            CU ARrival received first place in the
            popular vote.
          </p>
        </div>

        <img
          className="cu-arrival__team-image"
          src={`${BASE}/team.webp`}
          alt="The five CU ARrival team members at their capstone showcase"
          loading="lazy"
        />

        <ul className="cu-arrival__team-names">
          {team.map((name) => (
            <li key={name}>
              {name}
            </li>
          ))}
        </ul>
      </section>

      {/* ====================================
          BACK TO PROJECTS
          ==================================== */}

      <footer className="cu-arrival__footer">
        <Link to="/projects">
          ← ALL PROJECTS
        </Link>
      </footer>

    </main>
  );
}
