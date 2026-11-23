
import { useEffect, useRef } from 'react';
import '../../styles/cursor.css';

function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    const isCoarsePointer = window.matchMedia(
      '(pointer: coarse)'
    ).matches;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (isCoarsePointer || prefersReducedMotion) {
      return;
    }

    const target = {
      x: -100,
      y: -100,
    };

    const smooth = {
      x: -100,
      y: -100,
    };

    let isInteractive = false;
    let animationFrame;

    /* ========================================
       MOUSE TRACKING
       ======================================== */

    function handlePointerMove(event) {
      target.x = event.clientX;
      target.y = event.clientY;

      const element = event.target;

      if (!(element instanceof Element)) {
        isInteractive = false;
        return;
      }

      isInteractive = Boolean(
        element.closest(
          'a, button, [data-cursor], input, textarea, select'
        )
      );
    }

    /* ========================================
       CURSOR ANIMATION
       ======================================== */

    function animate() {
      const dot = dotRef.current;
      const ring = ringRef.current;

      /* The ring follows the pointer smoothly */

      smooth.x += (target.x - smooth.x) * 0.18;
      smooth.y += (target.y - smooth.y) * 0.18;

      /* Centre dot follows immediately */

      if (dot) {
        dot.style.transform = `
          translate(${target.x}px, ${target.y}px)
          translate(-50%, -50%)
        `;
      }

      /* Diamond follows with a delay */

      if (ring) {
        const scale = isInteractive ? 1.9 : 1;

        ring.style.transform = `
          translate(${smooth.x}px, ${smooth.y}px)
          translate(-50%, -50%)
          scale(${scale})
          rotate(45deg)
        `;

        ring.style.borderColor = isInteractive
          ? 'var(--mc-cyan)'
          : 'var(--mc-yellow)';
      }

      animationFrame = requestAnimationFrame(animate);
    }

    window.addEventListener(
      'pointermove',
      handlePointerMove,
      { passive: true }
    );

    animationFrame = requestAnimationFrame(animate);

    /* ========================================
       CLEANUP
       ======================================== */

    return () => {
      window.removeEventListener(
        'pointermove',
        handlePointerMove
      );

      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <>
      <div
        ref={dotRef}
        className="mc-cursor mc-cursor--dot"
        aria-hidden="true"
      />

      <div
        ref={ringRef}
        className="mc-cursor mc-cursor--ring"
        aria-hidden="true"
      />
    </>
  );
}

export default CustomCursor;
