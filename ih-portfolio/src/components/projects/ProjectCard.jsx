
import { useEffect, useState } from 'react';
import { Link } from 'react-router';

import ExperienceImage from '../experience/ExperienceImage';

/* ========================================
   PROJECT CARD

   Reuses the exact WebGL image effect from
   the Experience page. The image effect
   responds only to hovering the image.

   The card's page accent responds to hovering
   anywhere on the card, including the text.
   ======================================== */

function ProjectCard({ project, onEnter, onLeave }) {
  const [imageLoaded, setImageLoaded] = useState(false);

  /* ========================================
     CHECK PROJECT IMAGE
     ======================================== */

  useEffect(() => {
    setImageLoaded(false);

    if (!project.image) return;

    const image = new Image();
    let cancelled = false;

    image.onload = () => {
      if (!cancelled) {
        setImageLoaded(true);
      }
    };

    image.onerror = () => {
      if (!cancelled) {
        setImageLoaded(false);
      }
    };

    image.src = project.image;

    return () => {
      cancelled = true;
      image.onload = null;
      image.onerror = null;
    };
  }, [project.image]);

  /* ========================================
     CARD RENDER
     ======================================== */

  return (
    <article
      className="projects-card"
      style={{
        '--card-accent': project.accent,
      }}
      onPointerEnter={(event) => {
        if (event.pointerType !== 'touch') {
          onEnter(project.id);
        }
      }}
      onPointerLeave={(event) => {
        if (event.pointerType !== 'touch') {
          onLeave(project.id);
        }
      }}
    >
      <Link
        className="projects-card__link"
        to={project.path}
        aria-label={`View ${project.title} project`}
        onFocus={() => onEnter(project.id)}
        onBlur={() => onLeave(project.id)}
      >

        {/* METADATA ABOVE THE IMAGE */}

        <div className="projects-card__metadata">
          <span>{project.category}</span>
          <span>{project.year}</span>
        </div>

        {/* IMAGE — EXACT EXPERIENCE WEBGL EFFECT */}

        <div className="projects-card__media">
          {imageLoaded ? (
            <ExperienceImage
              src={project.image}
              alt={`${project.title} project preview`}
              accent={project.accent}
            />
          ) : (
            <div
              className="projects-card__placeholder"
              aria-hidden="true"
            >
              <span className="projects-card__placeholder-title">
                {project.title}
              </span>
            </div>
          )}
        </div>

        {/* PROJECT TITLE AND DESCRIPTION */}

        <div className="projects-card__footer">
          <h2 className="projects-card__title">
            {project.title}
          </h2>

          <div className="projects-card__bottom">
            <p className="projects-card__description">
              {project.description}
            </p>

            <span
              className="projects-card__arrow"
              aria-hidden="true"
            />
          </div>
        </div>

      </Link>
    </article>
  );
}

export default ProjectCard;
