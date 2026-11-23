
import { useEffect, useState } from 'react';

import ExperienceImage from '../components/experience/ExperienceImage';

import '../styles/experience.css';
import '../styles/experience-effects.css';
import '../styles/experience-ultrawide.css';

/* ========================================
   DEFAULT SIDEBAR ICON
   ======================================== */

const DEFAULT_ICON = '/icons/skull-chip.svg';

/* ========================================
   EXPERIENCE DATA
   ======================================== */

const experiences = [
  {
    id: 'edc',

    title: 'CLOUD INFRASTRUCTURE DEVELOPER',
    company: 'EXPORT DEVELOPMENT CANADA',

    endDate: 'SEP. 2026',
    startDate: 'JUL. 2025',

    image: '/images/experience/edc.jpg',
    imageAlt:
      'Export Development Canada headquarters in Ottawa',

    description:
      'Developed cloud infrastructure automation, Terraform modules, and CI/CD improvements across Azure environments.',

    bulletPoints: [
      'Developed Terraform modules and automation scripts to support cloud infrastructure and security remediation.',
      'Worked with Azure Policy, Key Vault, Resource Graph, and KQL to investigate and address compliance issues.',
      'Supported CI/CD pipeline migration to Azure Managed DevOps Pools and created operational dashboards using Power BI.',
    ],

    accent: '#7F3AEF',
    icon: '/icons/black-hole.svg',
  },

  {
    id: 'carleton',

    title: 'SOFTWARE ENGINEERING',
    company: 'CARLETON UNIVERSITY',

    endDate: 'JUN. 2025',
    startDate: 'SEP. 2021',

    image: '/images/experience/carleton.jpg',
    imageAlt:
      'Carleton University building and sign',

    description:
      'Bachelor of Engineering in Software Engineering.',

    bulletPoints: [
      'Built CU ARrival, an augmented reality indoor navigation application using Unity, C#, and ARCore.',
      'Worked on backend applications, distributed systems, testing, and machine learning projects.',
    ],

    accent: '#7FFFFF',
    icon: '/icons/satellite.svg',
  },
];

/* ========================================
   TERMINAL MESSAGES
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

function ExperienceTerminal() {
  const [history, setHistory] = useState([]);
  const [currentText, setCurrentText] = useState('');

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (reducedMotion) {
      setHistory(TERMINAL_MESSAGES.slice(0, 4));
      setCurrentText(TERMINAL_MESSAGES[4]);
      return;
    }

    let messageIndex = 0;
    let characterIndex = 0;
    let timeoutId;

    function type() {
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
          type,
          CHARACTER_DELAY
        );

        return;
      }

      setHistory((previous) =>
        [...previous, message].slice(-MAX_LINES)
      );

      setCurrentText('');

      messageIndex += 1;
      characterIndex = 0;

      timeoutId = setTimeout(
        type,
        LINE_DELAY
      );
    }

    timeoutId = setTimeout(
      type,
      CHARACTER_DELAY
    );

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div
      className="experience-sidebar__terminal"
      aria-hidden="true"
    >
      {history.slice(-4).map((line, index) => (
        <div
          key={`${history.length}-${index}`}
          className="experience-sidebar__terminal-line"
        >
          {line}
        </div>
      ))}

      <div className="experience-sidebar__terminal-line">
        {currentText}

        <span className="experience-sidebar__caret" />
      </div>
    </div>
  );
}

/* ========================================
   EXPERIENCE SIDEBAR
   ======================================== */

function ExperienceSidebar({ activeExperience }) {
  const icon = activeExperience?.icon ?? DEFAULT_ICON;

  return (
    <aside className="experience-sidebar">

      <p className="experience-sidebar__label">
        {'{WORK_HISTORY}'}
      </p>

      <h1 className="experience-sidebar__heading">
        EXPERIENCE
      </h1>

      <div className="experience-sidebar__footer">
        <img
          className="experience-sidebar__icon"
          src={icon}
          alt=""
          aria-hidden="true"
        />

        <ExperienceTerminal />
      </div>

    </aside>
  );
}

/* ========================================
   DATE COLUMN
   ======================================== */

function DateColumn({ endDate, startDate }) {
  return (
    <div className="experience-item__dates">
      <span>{endDate}</span>
      <span>{startDate}</span>
    </div>
  );
}

/* ========================================
   TIMELINE RAIL
   ======================================== */

function TimelineRail() {
  return (
    <div
      className="experience-item__rail"
      aria-hidden="true"
    >
      <span className="experience-item__diamond" />
      <span className="experience-item__line" />
      <span className="experience-item__diamond" />
    </div>
  );
}

/* ========================================
   EXPERIENCE DETAILS
   ======================================== */

function ExperienceDetails({ experience }) {
  return (
    <div className="experience-item__details">

      <h3 className="experience-item__title">
        {experience.title}
      </h3>

      <p className="experience-item__company">
        {experience.company}
      </p>

      <ExperienceImage
        src={experience.image}
        alt={experience.imageAlt}
        accent={experience.accent}
      />

      <p className="experience-item__description">
        {experience.description}
      </p>

      <ul className="experience-item__bullets">
        {experience.bulletPoints.map((point) => (
          <li key={point}>
            {point}
          </li>
        ))}
      </ul>

    </div>
  );
}

/* ========================================
   EXPERIENCE ITEM
   ======================================== */

function ExperienceItem({
  experience,
  onEnter,
  onLeave,
}) {
  return (
    <li
      className="experience-item"
      style={{
        '--item-accent': experience.accent,
      }}
      onPointerEnter={(event) => {
        if (event.pointerType !== 'touch') {
          onEnter(experience.id);
        }
      }}
      onPointerLeave={onLeave}
    >
      <DateColumn
        endDate={experience.endDate}
        startDate={experience.startDate}
      />

      <TimelineRail />

      <ExperienceDetails experience={experience} />
    </li>
  );
}

/* ========================================
   EXPERIENCE PAGE
   ======================================== */

function Experience({ setDitherAccent }) {
  const [activeId, setActiveId] = useState(null);

  const activeExperience =
    experiences.find(
      (item) => item.id === activeId
    ) ?? null;

  const activeAccent =
    activeExperience?.accent ?? null;

  /* =====================================
     UPDATE SHARED BACKGROUND

     The accent now comes from App.jsx.
     There is no second dither canvas.
     ===================================== */

  useEffect(() => {
    setDitherAccent(activeAccent);
  }, [activeAccent, setDitherAccent]);

  /* =====================================
     RESTORE DEFAULT ON PAGE EXIT
     ===================================== */

  useEffect(() => {
    return () => {
      setDitherAccent(null);
    };
  }, [setDitherAccent]);

  return (
    <section
      className="experience-page"
      aria-label="Experience"
      style={{
        '--experience-accent':
          activeAccent ?? '#FFFFFF',
      }}
    >

      {/* LEFT SIDEBAR */}

      <ExperienceSidebar
        activeExperience={activeExperience}
      />

      {/* SCROLLABLE EXPERIENCE CONTENT */}

      <div className="experience-scroll">
        <div className="experience-content">

          <header className="experience-intro">
            <p className="experience-intro__label">
              {'{PROFESSIONAL_EXPERIENCE}'}
            </p>

            <h2 className="experience-intro__title">
              WHERE I'VE WORKED
            </h2>
          </header>

          <ol className="experience-timeline">
            {experiences.map((experience) => (
              <ExperienceItem
                key={experience.id}
                experience={experience}
                onEnter={setActiveId}
                onLeave={() => setActiveId(null)}
              />
            ))}
          </ol>

        </div>
      </div>

    </section>
  );
}

export default Experience;
