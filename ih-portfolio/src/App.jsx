
import { useEffect, useState } from 'react';

import { Route, Routes } from 'react-router';

import Navbar from './components/layout/Navbar';
import CustomCursor from './components/layout/CustomCursor';
import DitherBackground from './components/background/DitherBackground';
import PageTransitions from './components/layout/PageTransitions';

import Home from './pages/Home';
import Projects from './pages/Projects';
import Experience from './pages/Experience';
import Contact from './pages/Contact';

/* ========================================
   DETECT GPU / SOFTWARE WEBGL
   ======================================== */

function canUseAcceleratedGraphics() {
  if (new URLSearchParams(window.location.search).has('lite')) return false;

  if (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    navigator.connection?.saveData
  ) {
    return false;
  }

  const canvas = document.createElement('canvas');
  let gl;

  try {
    // Browsers can refuse software WebGL when this flag is set.
    gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      failIfMajorPerformanceCaveat: true,
      powerPreference: 'low-power',
    });

    if (!gl || gl.isContextLost()) return false;

    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = [
      gl.getParameter(gl.RENDERER),
      gl.getParameter(gl.VENDOR),
      info && gl.getParameter(info.UNMASKED_RENDERER_WEBGL),
      info && gl.getParameter(info.UNMASKED_VENDOR_WEBGL),
    ].filter(Boolean).join(' ');

    const softwareRenderer =
      /swiftshader|llvmpipe|softpipe|software|warp|basic render|lavapipe|mesa offscreen/i
        .test(renderer);

    gl.getExtension('WEBGL_lose_context')?.loseContext();

    return !softwareRenderer;
  } catch {
    return false;
  }
}

/* ========================================
   STATIC FALLBACK — NO WEBGL OR ANIMATION
   ======================================== */

function StaticBackground({ accent }) {
  let color = [63, 57, 8];

  if (typeof accent === 'string' && /^#[0-9a-f]{6}$/i.test(accent)) {
    color = [1, 3, 5].map((i) =>
      Math.round(parseInt(accent.slice(i, i + 2), 16) * 0.3)
    );
  }

  const dotColor = `rgb(${color.join(',')})`;
  const mask = 'radial-gradient(ellipse 70% 65% at 60% 67%, black 15%, transparent 85%)';

  return (
    <div
      className="dither-background"
      style={{ backgroundColor: '#060606', overflow: 'hidden' }}
      aria-hidden="true"
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(ellipse 48% 52% at 60% 68%, rgba(${color.join(',')}, 0.35), transparent 95%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(circle, ${dotColor} 1px, transparent 1.4px)`,
          backgroundSize: '6px 6px',
          maskImage: mask,
          WebkitMaskImage: mask,
        }}
      />
    </div>
  );
}

/* ========================================
   APP
   ======================================== */

function App() {
  const [ditherAccent, setDitherAccent] = useState(null);

  // Start lightweight. Only enable WebGL after checking the renderer.
  const [graphicsMode, setGraphicsMode] = useState('lite');

  useEffect(() => {
    setGraphicsMode(canUseAcceleratedGraphics() ? 'full' : 'lite');
  }, []);

  // Some browsers hide their renderer details. Detect sustained slow
  // frame rates and switch off expensive graphics automatically.
  useEffect(() => {
    if (graphicsMode !== 'full') return;

    let frame = 0;
    let windowStart = 0;
    let frameCount = 0;

    function measure(now) {
      if (document.visibilityState !== 'visible') {
        windowStart = 0;
        frameCount = 0;
      } else {
        if (!windowStart) windowStart = now;
        frameCount += 1;

        const elapsed = now - windowStart;

        if (elapsed >= 2500) {
          const fps = (frameCount * 1000) / elapsed;

          if (fps < 35) {
            setGraphicsMode('lite');
            return;
          }

          windowStart = now;
          frameCount = 0;
        }
      }

      frame = requestAnimationFrame(measure);
    }

    frame = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(frame);
  }, [graphicsMode]);

  const lite = graphicsMode === 'lite';

  return (
    <div className={`app-shell${lite ? ' app-shell--lite' : ''}`}>
      {/* Keep native cursors and normal images in lightweight mode. */}
      {lite && (
        <style>{`
          html:has(.app-shell--lite),
          html:has(.app-shell--lite) * { cursor: auto !important; }
          html:has(.app-shell--lite) a,
          html:has(.app-shell--lite) button { cursor: pointer !important; }
          .app-shell--lite .experience-item__image { pointer-events: none; }
          .app-shell--lite .experience-item__lens { display: none !important; }
          .app-shell--lite .home-footer-art,
          .app-shell--lite .contact-artwork-image {
            filter: none !important;
            opacity: 0.1;
          }
        `}</style>
      )}

      {/* Static patterned background if GPU acceleration is unavailable. */}
      {lite ? (
        <StaticBackground accent={ditherAccent} />
      ) : (
        <DitherBackground accent={ditherAccent} />
      )}

      <Navbar />
      {!lite && <CustomCursor />}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/projects" element={<Projects />} />
        <Route
          path="/experience"
          element={<Experience setDitherAccent={setDitherAccent} />}
        />
        <Route path="/contact" element={<Contact />} />
      </Routes>

      {/* Links still work normally without the WebGL page transition. */}
      {!lite && <PageTransitions />}
    </div>
  );
}

export default App;
