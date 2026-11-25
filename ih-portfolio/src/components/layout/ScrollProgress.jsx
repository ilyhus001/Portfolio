
import { useEffect, useState } from 'react';

/**
 * Studio MACACO-style navbar progress for individual project detail pages.
 * ProjectLayout owns the scrolling element; the navbar only displays progress.
 */
export default function ScrollProgress({ onScrolled }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const scroller = document.querySelector('[data-project-scroll]');

    if (!scroller) {
      onScrolled(false);
      return undefined;
    }

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    let frame = 0;
    let target = 0;
    let displayed = 0;

    function animate() {
      displayed += (target - displayed) * 0.16;

      if (Math.abs(target - displayed) < 0.0004) {
        displayed = target;
        frame = 0;
      } else {
        frame = window.requestAnimationFrame(animate);
      }

      setProgress(displayed);
    }

    function update() {
      const maxScroll = Math.max(
        0,
        scroller.scrollHeight - scroller.clientHeight
      );

      target = maxScroll === 0
        ? 0
        : Math.max(0, Math.min(1, scroller.scrollTop / maxScroll));

      onScrolled(scroller.scrollTop > 8);

      if (reducedMotion) {
        displayed = target;
        setProgress(target);
      } else if (!frame) {
        frame = window.requestAnimationFrame(animate);
      }
    }

    // Start from the current scroll position without an entrance animation.
    const maxScroll = Math.max(
      0,
      scroller.scrollHeight - scroller.clientHeight
    );

    displayed = maxScroll
      ? scroller.scrollTop / maxScroll
      : 0;

    target = displayed;

    setProgress(displayed);
    onScrolled(scroller.scrollTop > 8);

    scroller.addEventListener('scroll', update, {
      passive: true,
    });

    window.addEventListener('resize', update);

    // Images load asynchronously and may change total page height.
    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(update)
      : null;

    resizeObserver?.observe(scroller);

    if (scroller.firstElementChild) {
      resizeObserver?.observe(scroller.firstElementChild);
    }

    return () => {
      scroller.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);

      resizeObserver?.disconnect();

      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [onScrolled]);

  return (
    <div
      className="navbar__scroll-progress"
      aria-hidden="true"
    >
      <div
        className="navbar__scroll-progress-bar"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  );
}
