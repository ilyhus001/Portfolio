
import { useEffect, useRef } from 'react';

import '../../styles/dither-background.css';

/* ========================================
   STUDIO MACACO BACKGROUND SETTINGS
   ======================================== */

const SETTINGS = {
  dark: '#060606',
  light: '#3F3908',

  pixel: 1,
  lo: 0.4,
  hi: 1,
  scale: 0.9,
  speed: 0.065,
  halo: 0.3,

  accentBrightness: 0.3,
};

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
   STUDIO MACACO DITHER SHADER
   ======================================== */

const FRAGMENT_SHADER = `
precision highp float;

uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;

uniform float uPixel;
uniform float uLo;
uniform float uHi;
uniform float uScale;
uniform float uSpeed;
uniform float uHalo;

uniform vec3 uColor;
uniform vec3 uDot;

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
    fbm(
      nuv * 1.6 +
      vec2(0.0, t)
    ),
    fbm(
      nuv * 1.6 +
      vec2(5.2, 1.3) -
      t * 0.8
    )
  );

  float n = fbm(
    nuv * 1.8 +
    q * 1.7 +
    vec2(t * 0.6, -t * 0.4)
  );

  vec2 m = uMouse * (uRes / uRes.y);

  float d = distance(uv, m);

  float halo =
    smoothstep(0.34, 0.0, d) *
    uHalo;

  n += halo;

  n = smoothstep(uLo, uHi, n);

  vec2 bp = px / uPixel;

  float b4 =
    bayer2(0.25 * bp) * 0.25 +
    bayer2(bp);

  float b8 =
    bayer2(0.125 * bp) * 0.0625 +
    b4;

  b8 = (b8 * 63.0 + 0.5) / 64.0;

  float lit = step(b8, n);

  vec3 col = mix(uColor, uDot, lit);

  gl_FragColor = vec4(col, 1.0);
}
`;

/* ========================================
   COLOUR HELPERS
   ======================================== */

function hexToRGB(hex) {
  const value = hex.replace('#', '');

  return [
    parseInt(value.slice(0, 2), 16) / 255,
    parseInt(value.slice(2, 4), 16) / 255,
    parseInt(value.slice(4, 6), 16) / 255,
  ];
}

function getDitherColor(accent) {
  if (
    typeof accent === 'string' &&
    /^#[0-9a-f]{6}$/i.test(accent)
  ) {
    return hexToRGB(accent).map(
      (channel) =>
        channel * SETTINGS.accentBrightness
    );
  }

  return hexToRGB(SETTINGS.light);
}

/* ========================================
   SHADER COMPILATION
   ======================================== */

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);

  if (!shader) return null;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(
      '[DitherBackground]',
      gl.getShaderInfoLog(shader)
    );

    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

/* ========================================
   RESPONSIVE RENDER SCALE
   ======================================== */

function getRenderScale(width, height) {
  const deviceRatio = Math.min(
    window.devicePixelRatio || 1,
    2
  );

  const coarsePointer = window.matchMedia(
    '(pointer: coarse)'
  ).matches;

  const maxRatio = coarsePointer ? 1 : 1.2;

  const pixelBudget =
    1366 * 768 * (coarsePointer ? 0.6 : 1);

  let scale =
    coarsePointer || deviceRatio >= 1.5
      ? Math.min(deviceRatio, maxRatio)
      : deviceRatio;

  const pixels = width * height * scale * scale;

  if (pixels > pixelBudget) {
    scale *= Math.sqrt(pixelBudget / pixels);
  }

  return Math.max(0.1, scale);
}

/* ========================================
   DITHER BACKGROUND COMPONENT

   accent:
     null      -> original yellow/black
     #7F3AEF   -> dark purple
     #7FFFFF   -> dark cyan
   ======================================== */

function DitherBackground({
  accent = null,
  className = 'dither-background',
}) {
  const canvasRef = useRef(null);

  /* Always keep the latest React prop */

  const accentRef = useRef(accent);
  accentRef.current = accent;

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const gl = canvas.getContext('webgl', {
      antialias: false,
      alpha: true,
    });

    if (!gl) {
      console.warn('[DitherBackground] WebGL unavailable');
      return;
    }

    /* =====================================
       CREATE WEBGL PROGRAM
       ===================================== */

    const vertexShader = compileShader(
      gl,
      gl.VERTEX_SHADER,
      VERTEX_SHADER
    );

    const fragmentShader = compileShader(
      gl,
      gl.FRAGMENT_SHADER,
      FRAGMENT_SHADER
    );

    if (!vertexShader || !fragmentShader) {
      if (vertexShader) gl.deleteShader(vertexShader);
      if (fragmentShader) gl.deleteShader(fragmentShader);
      return;
    }

    const program = gl.createProgram();

    if (!program) return;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(
        '[DitherBackground]',
        gl.getProgramInfoLog(program)
      );

      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      return;
    }

    gl.useProgram(program);

    /* =====================================
       FULLSCREEN TRIANGLE
       ===================================== */

    const buffer = gl.createBuffer();

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
      'uMouse',
      'uPixel',
      'uLo',
      'uHi',
      'uScale',
      'uSpeed',
      'uHalo',
      'uColor',
      'uDot',
    ].forEach((name) => {
      uniforms[name] = gl.getUniformLocation(
        program,
        name
      );
    });

    gl.uniform1f(uniforms.uLo, SETTINGS.lo);
    gl.uniform1f(uniforms.uHi, SETTINGS.hi);
    gl.uniform1f(uniforms.uScale, SETTINGS.scale);
    gl.uniform1f(uniforms.uSpeed, SETTINGS.speed);
    gl.uniform1f(uniforms.uHalo, SETTINGS.halo);

    gl.uniform3fv(
      uniforms.uColor,
      hexToRGB(SETTINGS.dark)
    );

    /* =====================================
       DIRECT ACCENT-TO-SHADER CONNECTION
       ===================================== */

    let previousAccent;

    function updateAccent() {
      const nextAccent = accentRef.current;

      if (nextAccent === previousAccent) return;

      previousAccent = nextAccent;

      gl.useProgram(program);

      gl.uniform3fv(
        uniforms.uDot,
        getDitherColor(nextAccent)
      );
    }

    updateAccent();

    /* =====================================
       CANVAS RESIZING
       ===================================== */

    function resize() {
      if (gl.isContextLost()) return;

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (!width || !height) return;

      const scale = getRenderScale(width, height);

      const renderWidth = Math.max(
        1,
        Math.floor(width * scale)
      );

      const renderHeight = Math.max(
        1,
        Math.floor(height * scale)
      );

      if (
        canvas.width !== renderWidth ||
        canvas.height !== renderHeight
      ) {
        canvas.width = renderWidth;
        canvas.height = renderHeight;
      }

      gl.viewport(
        0,
        0,
        renderWidth,
        renderHeight
      );

      gl.useProgram(program);

      gl.uniform2f(
        uniforms.uRes,
        renderWidth,
        renderHeight
      );

      const deviceRatio = Math.min(
        window.devicePixelRatio || 1,
        2
      );

      gl.uniform1f(
        uniforms.uPixel,
        Math.max(
          1,
          SETTINGS.pixel * scale / deviceRatio
        )
      );
    }

    /* =====================================
       MOUSE TRACKING
       ===================================== */

    const pointer = {
      x: 0.5,
      y: 0.5,
      targetX: 0.5,
      targetY: 0.5,
    };

    function handlePointerMove(event) {
      pointer.targetX =
        event.clientX / window.innerWidth;

      pointer.targetY =
        1 - event.clientY / window.innerHeight;
    }

    if (
      window.matchMedia(
        '(hover: hover) and (pointer: fine)'
      ).matches
    ) {
      window.addEventListener(
        'pointermove',
        handlePointerMove,
        { passive: true }
      );
    }

    /* =====================================
       RENDER LOOP
       ===================================== */

    const startTime = performance.now();

    let animationFrame = 0;
    let running = true;

    function render() {
      if (!running) return;

      animationFrame = requestAnimationFrame(render);

      if (gl.isContextLost()) return;

      /* Read current React accent prop */

      updateAccent();

      /* Smooth mouse tracking */

      pointer.x += (
        pointer.targetX - pointer.x
      ) * 0.08;

      pointer.y += (
        pointer.targetY - pointer.y
      ) * 0.08;

      gl.useProgram(program);

      gl.uniform1f(
        uniforms.uTime,
        (performance.now() - startTime) / 1000
      );

      gl.uniform2f(
        uniforms.uMouse,
        pointer.x,
        pointer.y
      );

      gl.drawArrays(
        gl.TRIANGLES,
        0,
        3
      );
    }

    /* =====================================
       INITIALIZE AND CLEAN UP
       ===================================== */

    const observer = new ResizeObserver(resize);

    observer.observe(canvas);

    resize();
    render();

    return () => {
      running = false;

      cancelAnimationFrame(animationFrame);

      observer.disconnect();

      window.removeEventListener(
        'pointermove',
        handlePointerMove
      );

      if (!gl.isContextLost()) {
        gl.deleteBuffer(buffer);
        gl.deleteProgram(program);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
    />
  );
}

export default DitherBackground;
