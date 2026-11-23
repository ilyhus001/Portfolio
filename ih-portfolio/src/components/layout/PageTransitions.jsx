
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  useLocation,
  useNavigate,
} from 'react-router';

import '../../styles/page-transitions.css';

/* ========================================
   TRANSITION SETTINGS
   ======================================== */

const STRIPE_COUNT = 72;
const STRIP_SEGMENTS = 3;

const SCROLL_SPEED_PX_PER_SECOND = 55;

const FILL_DURATION = 420;
const HOLD_DURATION = 1300;
const REVEAL_DURATION = 700;

/* ========================================
   VERTEX SHADER
   ======================================== */

const VERTEX_SHADER = `
attribute vec2 aPos;

void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

/* ========================================
   DITHER WIPE SHADER
   ======================================== */

const FRAGMENT_SHADER = `
precision highp float;

uniform vec2 uRes;
uniform float uTime;
uniform float uPixel;
uniform float uScale;
uniform float uSpeed;
uniform float uSpread;
uniform float uFill;
uniform vec3 uColor;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);

  f = f * f * (3.0 - 2.0 * f);

  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));

  return mix(
    mix(a, b, f.x),
    mix(c, d, f.x),
    f.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;

  for (int i = 0; i < 5; i++) {
    v += a * vnoise(p);
    p = p * 2.0 + 11.3;
    a *= 0.5;
  }

  return v;
}

float bayer2(vec2 a) {
  a = floor(a);

  return fract(
    a.x / 2.0 +
    a.y * a.y * 0.75
  );
}

void main() {
  vec2 px =
    floor(gl_FragCoord.xy / uPixel) *
    uPixel;

  vec2 uv = px / uRes.y;
  vec2 nuv = uv * uScale;

  float t = uTime * uSpeed;

  vec2 q = vec2(
    fbm(nuv * 1.6 + vec2(0.0, t)),
    fbm(nuv * 1.6 + vec2(5.2, 1.3) - t * 0.8)
  );

  float flow = fbm(
    nuv * 1.8 +
    q * 1.7 +
    vec2(t * 0.6, -t * 0.4)
  );

  float coverage =
    uFill * (1.0 + uSpread) -
    (1.0 - flow) * uSpread;

  vec2 bp = px / uPixel;

  float b4 =
    bayer2(0.25 * bp) * 0.25 +
    bayer2(bp);

  float b8 =
    bayer2(0.125 * bp) * 0.0625 +
    b4;

  b8 = (b8 * 63.0 + 0.5) / 64.0;

  float lit = step(
    b8,
    clamp(coverage, 0.0, 1.0)
  );

  gl_FragColor = vec4(uColor, lit);
}
`;

/* ========================================
   SHADER HELPER
   ======================================== */

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);

  if (!shader) return null;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(
      '[PageTransitions] Shader error:',
      gl.getShaderInfoLog(shader)
    );

    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

/* ========================================
   DITHER CANVAS
   ======================================== */

function DitherFillCanvas({ fill }) {
  const canvasRef = useRef(null);
  const fillRef = useRef(fill);

  const [webglFailed, setWebglFailed] = useState(false);

  fillRef.current = fill;

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: false,
      premultipliedAlpha: false,
    });

    if (!gl) {
      setWebglFailed(true);
      return;
    }

    /* =====================================
       COMPILE SHADERS
       ===================================== */

    const vs = compileShader(
      gl,
      gl.VERTEX_SHADER,
      VERTEX_SHADER
    );

    const fs = compileShader(
      gl,
      gl.FRAGMENT_SHADER,
      FRAGMENT_SHADER
    );

    if (!vs || !fs) {
      if (vs) gl.deleteShader(vs);
      if (fs) gl.deleteShader(fs);

      setWebglFailed(true);
      return;
    }

    /* =====================================
       CREATE PROGRAM
       ===================================== */

    const program = gl.createProgram();

    if (!program) {
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      setWebglFailed(true);
      return;
    }

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(
        '[PageTransitions] Program error:',
        gl.getProgramInfoLog(program)
      );

      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);

      setWebglFailed(true);
      return;
    }

    gl.useProgram(program);

    /* =====================================
       FULLSCREEN TRIANGLE
       ===================================== */

    const buffer = gl.createBuffer();

    if (!buffer) {
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      setWebglFailed(true);
      return;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1,
         3, -1,
        -1,  3,
      ]),
      gl.STATIC_DRAW
    );

    const position = gl.getAttribLocation(
      program,
      'aPos'
    );

    gl.enableVertexAttribArray(position);

    gl.vertexAttribPointer(
      position,
      2,
      gl.FLOAT,
      false,
      0,
      0
    );

    /* =====================================
       UNIFORMS
       ===================================== */

    const uniforms = {};

    [
      'uRes',
      'uTime',
      'uPixel',
      'uScale',
      'uSpeed',
      'uSpread',
      'uFill',
      'uColor',
    ].forEach((name) => {
      uniforms[name] = gl.getUniformLocation(
        program,
        name
      );
    });

    gl.uniform1f(uniforms.uScale, 0.9);
    gl.uniform1f(uniforms.uSpeed, 0.08);
    gl.uniform1f(uniforms.uSpread, 0.45);

    gl.uniform3f(
      uniforms.uColor,
      254 / 255,
      1,
      0
    );

    gl.clearColor(0, 0, 0, 0);

    /* =====================================
       RESIZE
       ===================================== */

    function resize() {
      if (gl.isContextLost()) return;

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (!width || !height) return;

      const scale = Math.min(
        window.devicePixelRatio || 1,
        1.5,
        Math.sqrt(90000 / (width * height))
      );

      const w = Math.max(
        1,
        Math.floor(width * scale)
      );

      const h = Math.max(
        1,
        Math.floor(height * scale)
      );

      if (
        canvas.width !== w ||
        canvas.height !== h
      ) {
        canvas.width = w;
        canvas.height = h;
      }

      gl.viewport(0, 0, w, h);
      gl.useProgram(program);

      gl.uniform2f(uniforms.uRes, w, h);

      gl.uniform1f(
        uniforms.uPixel,
        Math.max(1, 3 * scale)
      );
    }

    /* =====================================
       RENDER LOOP
       ===================================== */

    let raf = 0;
    let stopped = false;

    const started = performance.now();

    function render() {
      if (stopped || gl.isContextLost()) return;

      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.uniform1f(
        uniforms.uTime,
        (performance.now() - started) / 1000
      );

      gl.uniform1f(
        uniforms.uFill,
        fillRef.current
      );

      gl.drawArrays(
        gl.TRIANGLES,
        0,
        3
      );

      raf = requestAnimationFrame(render);
    }

    const observer = new ResizeObserver(resize);

    observer.observe(canvas);

    resize();
    render();

    return () => {
      stopped = true;

      cancelAnimationFrame(raf);
      observer.disconnect();

      if (!gl.isContextLost()) {
        gl.deleteBuffer(buffer);
        gl.deleteProgram(program);
        gl.deleteShader(vs);
        gl.deleteShader(fs);
      }
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="page-transition__canvas"
        aria-hidden="true"
      />

      {webglFailed && (
        <div
          className="page-transition__fallback"
          style={{ opacity: fill }}
          aria-hidden="true"
        />
      )}
    </>
  );
}

/* ========================================
   TYPEWRITER LABEL
   ======================================== */

function TypewriterLabel({ label }) {
  const fullText = `${label} {loading}`;

  const [typed, setTyped] = useState('');

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (reducedMotion) {
      setTyped(fullText);
      return;
    }

    let index = 0;
    let timer;

    setTyped('');

    function typeNext() {
      index += 1;

      setTyped(fullText.slice(0, index));

      if (index < fullText.length) {
        timer = window.setTimeout(typeNext, 45);
      }
    }

    timer = window.setTimeout(typeNext, 45);

    return () => clearTimeout(timer);
  }, [fullText]);

  return (
    <div className="page-transition__label">
      {typed}

      <span
        className="page-transition__caret"
        aria-hidden="true"
      />
    </div>
  );
}

/* ========================================
   LOADING STRIP SEGMENT
   ======================================== */

function LoadingStripSegment() {
  return (
    <div className="page-transition__segment">

      {/* STAR */}

      <svg
        className="page-transition__star"
        viewBox="0 0 28 28"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M14 1V27M1 14H27M5 5L23 23M23 5L5 23"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>

      {/* TEXT */}

      <span className="page-transition__strip-text">
        ready_for_{'{awesomeness}'}
      </span>

      {/* JAPANESE TEXT */}

      <span className="page-transition__jp">
        つくる
      </span>

      {/* ===================================
          ORIGINAL DOUBLE ARROW SVG

          File:
          public/icons/double-arrow.svg

          The uploaded SVG is white.
          brightness(0) makes it black
          on the yellow loading screen.
          =================================== */}

      <img
        className="page-transition__arrows"
        src="/icons/double-arrow.svg"
        alt=""
        aria-hidden="true"
        draggable="false"
        style={{
          filter: 'brightness(0)',
        }}
      />

      {/* HORIZONTAL LINE */}

      <span className="page-transition__rule" />

      {/* SECOND JAPANESE LABEL */}

      <span className="page-transition__jp">
        かえる
      </span>

      {/* DIAGONAL RECTANGLES */}

      <div className="page-transition__hazard">
        {Array.from(
          { length: STRIPE_COUNT },
          (_, index) => (
            <span key={index} />
          )
        )}
      </div>

    </div>
  );
}

/* ========================================
   CONTINUOUS LOADING STRIP
   ======================================== */

function LoadingStrip() {
  const trackRef = useRef(null);
  const groupRef = useRef(null);

  useEffect(() => {
    const track = trackRef.current;
    const group = groupRef.current;

    if (!track || !group) return;

    function updateScrollDuration() {
      const groupWidth =
        group.getBoundingClientRect().width;

      if (!groupWidth) return;

      const duration =
        groupWidth / SCROLL_SPEED_PX_PER_SECOND;

      track.style.setProperty(
        '--strip-duration',
        `${duration}s`
      );
    }

    updateScrollDuration();

    const observer = new ResizeObserver(
      updateScrollDuration
    );

    observer.observe(group);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      className="page-transition__strip"
      aria-hidden="true"
    >
      <div
        ref={trackRef}
        className="page-transition__strip-track"
      >

        {/* FIRST GROUP */}

        <div
          ref={groupRef}
          className="page-transition__strip-group"
        >
          {Array.from(
            { length: STRIP_SEGMENTS },
            (_, index) => (
              <LoadingStripSegment key={index} />
            )
          )}
        </div>

        {/* IDENTICAL SECOND GROUP */}

        <div className="page-transition__strip-group">
          {Array.from(
            { length: STRIP_SEGMENTS },
            (_, index) => (
              <LoadingStripSegment key={index} />
            )
          )}
        </div>

      </div>
    </div>
  );
}

/* ========================================
   PAGE HELPERS
   ======================================== */

function getPageName(path) {
  const pathname =
    path.split(/[?#]/)[0].replace(/\/+$/, '') ||
    '/';

  if (pathname === '/projects') return 'projects';
  if (pathname === '/experience') return 'experience';
  if (pathname === '/contact') return 'contact';

  return 'home';
}

const ROUTES = new Set([
  '/',
  '/projects',
  '/experience',
  '/contact',
]);

const sleep = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const nextPaint = () =>
  new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
  });

const easeIn = (t) => t * t;

const easeOut = (t) =>
  1 - (1 - t) * (1 - t);

/* ========================================
   PAGE TRANSITIONS
   ======================================== */

function PageTransitions() {
  const navigate = useNavigate();
  const location = useLocation();

  const [active, setActive] = useState(false);
  const [fill, setFill] = useState(0);
  const [label, setLabel] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  const busyRef = useRef(false);
  const disposedRef = useRef(false);

  const fillRef = useRef(0);
  const animationRef = useRef(0);

  const managedDestinationRef = useRef(null);

  const lastPathRef = useRef(
    location.pathname + location.search
  );

  /* =====================================
     ANIMATE DITHER FILL
     ===================================== */

  const animateFill = useCallback(
    (destination, duration, easing) => {
      return new Promise((resolve) => {
        const initial = fillRef.current;
        const start = performance.now();

        function tick(now) {
          if (disposedRef.current) {
            resolve();
            return;
          }

          const t = Math.min(
            1,
            (now - start) / duration
          );

          const next =
            initial +
            (destination - initial) * easing(t);

          fillRef.current = next;
          setFill(next);

          if (t < 1) {
            animationRef.current =
              requestAnimationFrame(tick);
          } else {
            resolve();
          }
        }

        animationRef.current =
          requestAnimationFrame(tick);
      });
    },
    []
  );

  /* =====================================
     START NAVIGATION
     ===================================== */

  const beginNavigation = useCallback(
    async (destination) => {
      if (busyRef.current) return;

      const reducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;

      if (reducedMotion) {
        managedDestinationRef.current =
          destination.split('#')[0];

        navigate(destination);
        return;
      }

      busyRef.current = true;
      fillRef.current = 0;

      setFill(0);
      setLabel(getPageName(destination));
      setShowDetails(false);
      setActive(true);

      /* Mount the transition overlay */

      await nextPaint();

      if (disposedRef.current) return;

      /* Dither fills the screen */

      await animateFill(
        1,
        FILL_DURATION,
        easeIn
      );

      if (disposedRef.current) return;

      /* Show loader */

      setShowDetails(true);

      /* Navigate under the overlay */

      managedDestinationRef.current =
        destination.split('#')[0];

      navigate(destination);

      /* Let the typing animation finish */

      await sleep(HOLD_DURATION);

      if (disposedRef.current) return;

      /* Hide loader */

      setShowDetails(false);

      /* Dither reveal */

      await animateFill(
        0,
        REVEAL_DURATION,
        easeOut
      );

      if (disposedRef.current) return;

      setActive(false);
      busyRef.current = false;
    },
    [animateFill, navigate]
  );

  /* =====================================
     INTERCEPT INTERNAL LINKS
     ===================================== */

  useEffect(() => {
    function handleClick(event) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        busyRef.current
      ) {
        return;
      }

      const target =
        event.target instanceof Element
          ? event.target
          : null;

      const link = target?.closest('a[href]');

      if (!link) return;

      if (
        link.hasAttribute('download') ||
        link.hasAttribute('data-no-transition')
      ) {
        return;
      }

      if (
        link.target &&
        link.target !== '_self'
      ) {
        return;
      }

      const href = link.getAttribute('href');

      if (!href || href.startsWith('#')) return;

      const url = new URL(
        link.href,
        window.location.href
      );

      if (url.origin !== window.location.origin) {
        return;
      }

      const nextPath =
        url.pathname.replace(/\/+$/, '') ||
        '/';

      if (!ROUTES.has(nextPath)) return;

      const destination =
        url.pathname + url.search + url.hash;

      const current =
        window.location.pathname +
        window.location.search;

      if (url.pathname + url.search === current) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      beginNavigation(destination);
    }

    document.addEventListener(
      'click',
      handleClick,
      true
    );

    return () => {
      document.removeEventListener(
        'click',
        handleClick,
        true
      );
    };
  }, [beginNavigation]);

  /* ========================================
     BROWSER BACK / FORWARD
     ======================================== */

  useEffect(() => {
    const current =
      location.pathname +
      location.search;

    if (current === lastPathRef.current) {
      return;
    }

    lastPathRef.current = current;

    if (
      managedDestinationRef.current === current
    ) {
      managedDestinationRef.current = null;
      return;
    }

    if (busyRef.current) return;

    if (
      window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches
    ) {
      return;
    }

    busyRef.current = true;

    fillRef.current = 1;

    setFill(1);
    setLabel(getPageName(current));
    setActive(true);
    setShowDetails(true);

    (async () => {
      await nextPaint();

      await sleep(HOLD_DURATION);

      if (disposedRef.current) return;

      setShowDetails(false);

      await animateFill(
        0,
        REVEAL_DURATION,
        easeOut
      );

      if (disposedRef.current) return;

      setActive(false);
      busyRef.current = false;
    })();
  }, [
    location.pathname,
    location.search,
    animateFill,
  ]);

  /* ========================================
     COMPONENT CLEANUP
     ======================================== */

  useEffect(() => {
    disposedRef.current = false;

    return () => {
      disposedRef.current = true;

      cancelAnimationFrame(
        animationRef.current
      );
    };
  }, []);

  /* ========================================
     RENDER
     ======================================== */

  if (!active) return null;

  return (
    <div
      className="page-transition"
      role="status"
      aria-label={`Loading ${label}`}
    >
      <DitherFillCanvas fill={fill} />

      {/* CENTER LOADER */}

      <div
        className={
          `page-transition__content` +
          (showDetails ? ' is-visible' : '')
        }
      >
        <div className="page-transition__center">

          {/* IH LOGO */}

          <img
            src="/icons/logo.svg"
            className="page-transition__icon"
            alt=""
            aria-hidden="true"
            draggable="false"
          />

          {/* TYPING ANIMATION */}

          {showDetails && (
            <TypewriterLabel label={label} />
          )}

        </div>
      </div>

      {/* SCROLLING FOOTER */}

      <div
        className={
          `page-transition__footer` +
          (showDetails ? ' is-visible' : '')
        }
      >
        <LoadingStrip />
      </div>

    </div>
  );
}

export default PageTransitions;
