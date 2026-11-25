
import { useEffect, useState } from 'react';

import ProjectCard from '../components/projects/ProjectCard';

import '../styles/projects.css';
import '../styles/projects-effects.css';
import '../styles/projects-card.css';

/* ========================================
   PROJECT CATEGORIES
   ======================================== */

const DEFAULT_ICON = '/icons/skull-chip.svg';

const categories = [
  'ALL',
  'AUGMENTED REALITY',
  'CLOUD & DEVOPS',
  'MACHINE LEARNING',
  'SYSTEMS PROGRAMMING',
  'WEB DEVELOPMENT',
];

/* ========================================
   PROJECT DATA
   ======================================== */

const projects = [
  {
    id: 'cu-arrival',
    path: '/projects/cu-arrival',
    title: 'CU ARrival',
    category: 'AUGMENTED REALITY',
    year: '2025',
    accent: '#54E3DB',
    icon: '/icons/maze.svg',
    image: '/images/projects/cu-arrival.webp',
    description:
      'An AR indoor navigation app for Carleton University using plaque-based localization and real-time pathfinding.',
  },
];

/* ========================================
   TERMINAL SETTINGS
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
        characterIndex += 1;

        setCurrentText(
          message.slice(0, characterIndex)
        );

        timeoutId = setTimeout(
          typeNextCharacter,
          CHARACTER_DELAY
        );
      } else {
        setLines((previous) => {
          const updated = [...previous, message];

          return updated.length > MAX_LINES
            ? updated.slice(updated.length - MAX_LINES)
            : updated;
        });

        setCurrentText('');

        messageIndex += 1;
        characterIndex = 0;

        timeoutId = setTimeout(
          typeNextCharacter,
          LINE_DELAY
        );
      }
    }

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
      {lines.map((line, index) => (
        <div
          key={`${index}-${line}`}
          className="projects-sidebar__terminal-line"
        >
          {line}
        </div>
      ))}

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
  activeProject,
}) {
  const icon = activeProject?.icon ?? DEFAULT_ICON;

  const iconMask =
    `url("${icon}") center / contain no-repeat`;

  return (
    <aside className="projects-sidebar">

      {/* CATEGORY FILTERS */}

      <div className="projects-sidebar__filters">
        <p className="projects-sidebar__label">
          {'SELECT_::{project_type}'}
        </p>

        {/* DESKTOP FILTERS */}

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
              aria-pressed={
                selectedCategory === category
              }
              onClick={() =>
                onSelectCategory(category)
              }
            >
              <span
                className="projects-filter__box"
                aria-hidden="true"
              />

              <span>{category}</span>
            </button>
          ))}
        </div>

        {/* MOBILE FILTER */}

        <select
          className="projects-filter-select"
          aria-label="Filter projects"
          value={selectedCategory}
          onChange={(event) => {
            onSelectCategory(event.target.value);
          }}
        >
          {categories.map((category) => (
            <option
              key={category}
              value={category}
            >
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
          style={{
            WebkitMask: iconMask,
            mask: iconMask,
          }}
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

function Projects({ setDitherAccent }) {
  const [selectedCategory, setSelectedCategory] =
    useState('ALL');

  const [activeId, setActiveId] = useState(null);

  /* ========================================
     ACTIVE PROJECT
     ======================================== */

  const activeProject =
    projects.find(
      (project) => project.id === activeId
    ) ?? null;

  const activeAccent =
    activeProject?.accent ?? null;

  /* ========================================
     SHARED DITHER BACKGROUND
     ======================================== */

  useEffect(() => {
    setDitherAccent(activeAccent);
  }, [activeAccent, setDitherAccent]);

  /* ========================================
     RESET ON PAGE EXIT
     ======================================== */

  useEffect(() => {
    return () => {
      setDitherAccent(null);
    };
  }, [setDitherAccent]);

  /* ========================================
     CATEGORY FILTER
     ======================================== */

  function handleCategoryChange(category) {
    setSelectedCategory(category);
    setActiveId(null);
  }

  /* ========================================
     VISIBLE PROJECTS
     ======================================== */

  const visibleProjects = projects.filter(
    (project) =>
      selectedCategory === 'ALL' ||
      project.category === selectedCategory
  );

  /* ========================================
     CARD HOVER
     ======================================== */

  function handleProjectEnter(id) {
    setActiveId(id);
  }

  function handleProjectLeave(id) {
    setActiveId((current) =>
      current === id ? null : current
    );
  }

  /* ========================================
     PAGE RENDER
     ======================================== */

  return (
    <section
      className={
        'projects-page' +
        (activeAccent ? ' is-accented' : '')
      }
      aria-label="Projects"
      style={{
        '--projects-accent':
          activeAccent ?? '#feff00',
      }}
    >
      {/* TOP BANNER */}

      <ProjectsBanner />

      {/* LEFT SIDEBAR */}

      <ProjectsSidebar
        selectedCategory={selectedCategory}
        onSelectCategory={handleCategoryChange}
        activeProject={activeProject}
      />

      {/* PROJECT GALLERY */}

      <div
        className="projects-scroll"
        aria-label="Project gallery"
        tabIndex={0}
      >
        <div className="projects-grid">
          {visibleProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEnter={handleProjectEnter}
              onLeave={handleProjectLeave}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default Projects;
