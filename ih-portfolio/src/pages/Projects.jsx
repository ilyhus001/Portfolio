
import { useEffect, useState } from 'react';

import '../styles/projects.css';
import '../styles/projects-effects.css';

/* ========================================
   PROJECT CATEGORIES
   ======================================== */

const categories = [
  'ALL',
  'AUGMENTED REALITY',
  'CLOUD & DEVOPS',
  'MACHINE LEARNING',
  'SYSTEMS PROGRAMMING',
  'WEB DEVELOPMENT',
];

/* ========================================
   STUDIO MACACO TERMINAL
   ORIGINAL MESSAGE SEQUENCE
   ======================================== */

const TERMINAL_MESSAGES = [
  'starting_artificial{lms}',
  'operating_ocean{_yellow}operating_',
  'starting_artificial{lms}',
  'loading_shader::dither[ok]',
  'sync_accent::#{hex}',
  'mount_case::{slug}',
  'render_pass::bayer_8x8',
  'operating_ocean{_yellow}',
  'ready_for_{awesomeness}',
];

/* Original timing constants */

const CHARACTER_DELAY = 42;
const LINE_DELAY = 360;
const MAX_LINES = 40;

/* ========================================
   ANIMATED TERMINAL
   ======================================== */

function ProjectsTerminal() {
  const [lines, setLines] = useState([]);
  const [currentText, setCurrentText] = useState('');

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    /* Original reduced-motion behaviour */

    if (reducedMotion) {
      setLines(TERMINAL_MESSAGES.slice(0, 4));
      setCurrentText(TERMINAL_MESSAGES[4]);
      return;
    }

    let messageIndex = 0;
    let characterIndex = 0;
    let timeoutId;

    function typeNextCharacter() {
      const message =
        TERMINAL_MESSAGES[
          messageIndex % TERMINAL_MESSAGES.length
        ];

      if (characterIndex < message.length) {
        /* Type one character */

        characterIndex += 1;

        setCurrentText(
          message.slice(0, characterIndex)
        );

        timeoutId = setTimeout(
          typeNextCharacter,
          CHARACTER_DELAY
        );

      } else {
        /* Completed line becomes part of history */

        setLines((previous) => {
          const updated = [
            ...previous,
            message,
          ];

          /* Keep the last 40 lines */

          return updated.length > MAX_LINES
            ? updated.slice(updated.length - MAX_LINES)
            : updated;
        });

        /* Reset typing state */

        setCurrentText('');

        messageIndex += 1;
        characterIndex = 0;

        /* Pause before the next message */

        timeoutId = setTimeout(
          typeNextCharacter,
          LINE_DELAY
        );
      }
    }

    /* Start typing */

    timeoutId = setTimeout(
      typeNextCharacter,
      CHARACTER_DELAY
    );

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div
      className="projects-sidebar__terminal"
      aria-hidden="true"
    >
      {/* COMPLETED LINES */}

      {lines.map((line, index) => (
        <div
          key={`${index}-${line}`}
          className="projects-sidebar__terminal-line"
        >
          {line}
        </div>
      ))}

      {/* CURRENTLY TYPING LINE */}

      <div className="projects-sidebar__terminal-line">
        {currentText}

        <span
          className="projects-sidebar__caret"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

/* ========================================
   PROJECTS BANNER
   ======================================== */

function ProjectsBanner() {
  return (
    <div className="projects-banner">

      <div
        className="projects-banner__stars"
        aria-hidden="true"
      >
        {[0, 1, 2].map((index) => (
          <img
            key={index}
            src="/icons/star_2.svg"
            alt=""
          />
        ))}
      </div>

      <span className="projects-banner__status">
        {'{core_memory_initialized}'}
      </span>

      <img
        className="projects-banner__single-star"
        src="/icons/star_2.svg"
        alt=""
        aria-hidden="true"
      />

      <div className="projects-banner__rule" />

      <p className="projects-banner__description">
        Things I've built. Ideas brought to life with software.
      </p>

      <span
        className="projects-banner__arrows"
        aria-hidden="true"
      />

      <div
        className="projects-banner__rule projects-banner__rule--short"
      />

    </div>
  );
}

/* ========================================
   PROJECTS SIDEBAR
   ======================================== */

function ProjectsSidebar({
  selectedCategory,
  onSelectCategory,
}) {
  return (
    <aside className="projects-sidebar">

      {/* CATEGORY FILTERS */}

      <div className="projects-sidebar__filters">

        <p className="projects-sidebar__label">
          {'SELECT_::{project_type}'}
        </p>

        <div
          className="projects-filter-list"
          role="group"
          aria-label="Filter projects by category"
        >
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={
                'projects-filter' +
                (selectedCategory === category
                  ? ' is-active'
                  : '')
              }
              aria-pressed={selectedCategory === category}
              onClick={() => onSelectCategory(category)}
            >
              <span
                className="projects-filter__box"
                aria-hidden="true"
              />

              <span>{category}</span>
            </button>
          ))}
        </div>

        {/* RESPONSIVE DROPDOWN */}

        <select
          className="projects-filter-select"
          aria-label="Filter projects"
          value={selectedCategory}
          onChange={(event) => {
            onSelectCategory(event.target.value);
          }}
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {/* VERTICAL PROJECTS HEADING */}

      <h1 className="projects-sidebar__heading">
        PROJECTS
      </h1>

      {/* SIDEBAR FOOTER */}

      <div className="projects-sidebar__footer">

        <span
          className="projects-sidebar__icon"
          aria-hidden="true"
        />

        <ProjectsTerminal />

      </div>

    </aside>
  );
}

/* ========================================
   PROJECTS PAGE
   ======================================== */

function Projects() {
  const [selectedCategory, setSelectedCategory] =
    useState('ALL');

  return (
    <section
      className="projects-page"
      aria-label="Projects"
    >

      <ProjectsBanner />

      <ProjectsSidebar
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* EMPTY PROJECT GALLERY */}

      <div
        className="projects-scroll"
        aria-label="Project gallery"
        tabIndex={0}
      >
        <div className="projects-grid">
          {/* Individual projects added later */}
        </div>
      </div>

    </section>
  );
}

export default Projects;
