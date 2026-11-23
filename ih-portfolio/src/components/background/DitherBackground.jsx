
import { useEffect, useRef, useState } from 'react';
import '../../styles/dither-background.css';

const SETTINGS = {
  dark: '#060606',
  light: '#3F3908',
  lo: 0.4,
  hi: 1,
  scale: 0.9,
  speed: 0.065,
  halo: 0.3,
  accentBrightness: 0.3,
};

const VERTEX_SHADER = `
attribute vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

/* ========================================
   ORIGINAL WEBGL DITHER SHADER
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
  return fract(a.x / 2.0 + a.y * a.y * 0.75);
}

void main() {
  vec2 px = floor(gl_FragCoord.xy / uPixel) * uPixel;
  vec2 uv = px / uRes.y;
  vec2 nuv = uv * uScale;

  float t = uTime * uSpeed;

  vec2 q = vec2(
    fbm(nuv * 1.6 + vec2(0.0, t)),
    fbm(nuv * 1.6 + vec2(5.2, 1.3) - t * 0.8)
  );

  float n = fbm(
    nuv * 1.8 + q * 1.7 +
    vec2(t * 0.6, -t * 0.4)
  );

  vec2 m = uMouse * (uRes / uRes.y);
  float d = distance(uv, m);

  n += smoothstep(0.34, 0.0, d) * uHalo;
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

  gl_FragColor = vec4(
    mix(uColor, uDot, lit),
    1.0
  );
}
`;

/* ========================================
   COLOUR HELPERS
   ======================================== */

function hexToRGB(hex) {
  return [1, 3, 5].map(
    (i) => parseInt(hex.slice(i, i + 2), 16) / 255
  );
}

function getAccent(accent) {
  if (
    typeof accent === 'string' &&
    /^#[\da-f]{6}$/i.test(accent)
  ) {
    return hexToRGB(accent).map(
      (value) => value * SETTINGS.accentBrightness
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

  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    return shader;
  }

  console.warn(
    '[DitherBackground] Shader compilation failed:',
    gl.getShaderInfoLog(shader)
  );

  gl.deleteShader(shader);
  return null;
}

/* ========================================
   HARDWARE ACCELERATION DETECTION
   ======================================== */

function canUseAcceleratedWebGL() {
  try {
    const probe = document.createElement('canvas');

    const gl = probe.getContext('webgl', {
      antialias: false,
      failIfMajorPerformanceCaveat: true,
    });

    if (!gl || gl.isContextLost()) return false;

    const info = gl.getExtension(
      'WEBGL_debug_renderer_info'
    );

    const renderer = [
      gl.getParameter(gl.RENDERER),
      info && gl.getParameter(
        info.UNMASKED_RENDERER_WEBGL
      ),
    ].filter(Boolean).join(' ');

    gl.getExtension('WEBGL_lose_context')
      ?.loseContext();

    return !/swiftshader|llvmpipe|softpipe|software|lavapipe|warp/i
      .test(renderer);
  } catch {
    return false;
  }
}

/* ========================================
   WEBGL RESOLUTION LIMIT
   ======================================== */

function getWebGLScale(width, height) {
  const dpr = Math.min(
    window.devicePixelRatio || 1,
    2
  );

  const coarse = window.matchMedia(
    '(pointer: coarse)'
  ).matches;

  const limit =
    1366 * 768 * (coarse ? 0.6 : 1);

  let scale =
    coarse || dpr >= 1.5
      ? Math.min(dpr, coarse ? 1 : 1.2)
      : dpr;

  scale = Math.min(
    scale,
    Math.sqrt(limit / (width * height))
  );

  return Math.max(0.1, scale);
}

/* ========================================
   CANVAS 2D DITHER MATRIX
   ======================================== */

const BAYER = [
   0, 48, 12, 60,  3, 51, 15, 63,
  32, 16, 44, 28, 35, 19, 47, 31,
   8, 56,  4, 52, 11, 59,  7, 55,
  40, 24, 36, 20, 43, 27, 39, 23,
   2, 50, 14, 62,  1, 49, 13, 61,
  34, 18, 46, 30, 33, 17, 45, 29,
  10, 58,  6, 54,  9, 57,  5, 53,
  42, 26, 38, 22, 41, 25, 37, 21,
];

/* ========================================
   BACKGROUND COMPONENT
   ======================================== */

function DitherBackground({
  accent = null,
  className = 'dither-background',
}) {
  const canvasRef = useRef(null);
  const accentRef = useRef(accent);

  const [mode, setMode] = useState(() =>
    window.matchMedia('(pointer: coarse)').matches ||
    canUseAcceleratedWebGL()
      ? 'webgl'
      : 'canvas2d'
  );

  accentRef.current = accent;

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    let frame = 0;
    let stopped = false;
    let lastFrame = 0;
    const startTime = performance.now();
    let slowFrames = 0;

    const isTouchDevice = window.matchMedia(
      '(pointer: coarse)'
    ).matches;

    const pointer = {
      x: 0.5,
      y: 0.5,
      tx: 0.5,
      ty: 0.5,
    };

    const handlePointer = (event) => {
      pointer.tx =
        event.clientX / Math.max(1, window.innerWidth);

      pointer.ty =
        1 - event.clientY /
        Math.max(1, window.innerHeight);
    };

    if (
      window.matchMedia(
        '(hover: hover) and (pointer: fine)'
      ).matches
    ) {
      window.addEventListener(
        'pointermove',
        handlePointer,
        { passive: true }
      );
    }

    let resize = () => {};
    let draw = () => {};
    let cleanup = () => {};

    /* ====================================
       ACCELERATED WEBGL RENDERER
       ==================================== */

    if (mode === 'webgl') {
      const gl = canvas.getContext('webgl', {
        antialias: false,
        alpha: false,
        premultipliedAlpha: false,
      });

      if (!gl) {
        setMode('canvas2d');
      } else {
        const vert = compileShader(
          gl,
          gl.VERTEX_SHADER,
          VERTEX_SHADER
        );

        const frag = compileShader(
          gl,
          gl.FRAGMENT_SHADER,
          FRAGMENT_SHADER
        );

        const program =
          vert && frag
            ? gl.createProgram()
            : null;

        if (program) {
          gl.attachShader(program, vert);
          gl.attachShader(program, frag);
          gl.linkProgram(program);
        }

        if (
          !program ||
          !gl.getProgramParameter(
            program,
            gl.LINK_STATUS
          )
        ) {
          console.warn(
            '[DitherBackground] WebGL program unavailable'
          );

          if (program) gl.deleteProgram(program);
          if (vert) gl.deleteShader(vert);
          if (frag) gl.deleteShader(frag);

          setMode('canvas2d');
        } else {
          gl.useProgram(program);

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

          const names = [
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
          ];

          const u = Object.fromEntries(
            names.map((name) => [
              name,
              gl.getUniformLocation(program, name),
            ])
          );

          gl.uniform1f(u.uLo, SETTINGS.lo);
          gl.uniform1f(u.uHi, SETTINGS.hi);
          gl.uniform1f(u.uScale, SETTINGS.scale);
          gl.uniform1f(u.uSpeed, SETTINGS.speed);
          gl.uniform1f(u.uHalo, SETTINGS.halo);

          gl.uniform3fv(
            u.uColor,
            hexToRGB(SETTINGS.dark)
          );

          let previousAccent;

          /* WEBGL CONTEXT LOSS */

          const handleContextLost = (event) => {
            event.preventDefault();
            setMode('canvas2d');
          };

          canvas.addEventListener(
            'webglcontextlost',
            handleContextLost
          );

          /* RESIZE */

          resize = () => {
            if (gl.isContextLost()) return;

            const width = canvas.clientWidth;
            const height = canvas.clientHeight;

            if (!width || !height) return;

            const scale = getWebGLScale(
              width,
              height
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

            gl.uniform2f(u.uRes, w, h);

            gl.uniform1f(
              u.uPixel,
              Math.max(
                1,
                scale / Math.min(
                  window.devicePixelRatio || 1,
                  2
                )
              )
            );
          };

          /* ANIMATION */

          draw = (now) => {
            if (gl.isContextLost()) return;

            // Switch to 2D if desktop rendering
            // remains extremely slow.
            if (
              lastFrame &&
              now - lastFrame > 66
            ) {
              slowFrames++;
            } else {
              slowFrames = Math.max(
                0,
                slowFrames - 1
              );
            }

            if (
              !isTouchDevice &&
              slowFrames > 6
            ) {
              setMode('canvas2d');
              return;
            }

            lastFrame = now;

            pointer.x += (
              pointer.tx - pointer.x
            ) * 0.08;

            pointer.y += (
              pointer.ty - pointer.y
            ) * 0.08;

            gl.useProgram(program);

            const current = accentRef.current;

            if (current !== previousAccent) {
              previousAccent = current;

              gl.uniform3fv(
                u.uDot,
                getAccent(current)
              );
            }

            gl.uniform1f(
              u.uTime,
              (now - startTime) / 1000
            );

            gl.uniform2f(
              u.uMouse,
              pointer.x,
              pointer.y
            );

            gl.drawArrays(
              gl.TRIANGLES,
              0,
              3
            );
          };

          /* WEBGL CLEANUP */

          cleanup = () => {
            canvas.removeEventListener(
              'webglcontextlost',
              handleContextLost
            );

            if (!gl.isContextLost()) {
              gl.deleteBuffer(buffer);
              gl.deleteProgram(program);
              gl.deleteShader(vert);
              gl.deleteShader(frag);
            }
          };
        }
      }

    /* ====================================
       LIGHTWEIGHT ANIMATED 2D RENDERER
       ==================================== */

    } else {
      const ctx = canvas.getContext('2d', {
        alpha: false,
      });

      if (ctx) {
        let image = null;

        resize = () => {
          const width = canvas.clientWidth;
          const height = canvas.clientHeight;

          if (!width || !height) return;

          const scale = Math.min(
            1,
            Math.sqrt(
              120000 / (width * height)
            )
          );

          const w = Math.max(
            1,
            Math.round(width * scale)
          );

          const h = Math.max(
            1,
            Math.round(height * scale)
          );

          if (
            canvas.width !== w ||
            canvas.height !== h ||
            !image
          ) {
            canvas.width = w;
            canvas.height = h;

            image = ctx.createImageData(w, h);
          }
        };

        let lastDraw = 0;

        draw = (now) => {
          // ~12 FPS instead of 60 FPS.
          if (
            now - lastDraw < 85 ||
            !image
          ) {
            return;
          }

          lastDraw = now;

          pointer.x += (
            pointer.tx - pointer.x
          ) * 0.1;

          pointer.y += (
            pointer.ty - pointer.y
          ) * 0.1;

          const {
            width: w,
            height: h,
            data,
          } = image;

          const accentColor = getAccent(
            accentRef.current
          ).map((value) => Math.round(value * 255));

          const t =
            (now - startTime) /
            1000 *
            SETTINGS.speed;

          const mouseX = pointer.x * w;
          const mouseY = pointer.y * h;

          /* DRAW DITHER PIXELS */

          for (let y = 0; y < h; y++) {
            const v = y / h;

            const waveY = Math.cos(
              v * 7.5 - t * 3.2
            );

            for (let x = 0; x < w; x++) {
              const u = x / h;

              let n =
                0.49 +
                0.17 * Math.sin(
                  u * 5.3 +
                  Math.sin(v * 4.3 + t) * 1.5 +
                  t
                ) +
                0.14 * waveY +
                0.07 * Math.sin(
                  u * 12.4 -
                  v * 7.8 -
                  t * 2
                );

              /* MOUSE HALO */

              const dx = (x - mouseX) / h;
              const dy = (y - mouseY) / h;

              const distance = Math.sqrt(
                dx * dx + dy * dy
              );

              if (distance < 0.34) {
                const k =
                  1 - distance / 0.34;

                n +=
                  k * k * (3 - 2 * k) *
                  SETTINGS.halo;
              }

              /* BAYER THRESHOLD */

              const z = Math.max(
                0,
                Math.min(
                  1,
                  (n - SETTINGS.lo) /
                  (SETTINGS.hi - SETTINGS.lo)
                )
              );

              const threshold =
                (
                  BAYER[
                    (y & 7) * 8 +
                    (x & 7)
                  ] + 0.5
                ) / 64;

              const lit =
                z * z * (3 - 2 * z) >=
                threshold;

              const i = (
                y * w + x
              ) * 4;

              data[i] = lit
                ? accentColor[0]
                : 6;

              data[i + 1] = lit
                ? accentColor[1]
                : 6;

              data[i + 2] = lit
                ? accentColor[2]
                : 6;

              data[i + 3] = 255;
            }
          }

          ctx.putImageData(image, 0, 0);
        };
      }
    }

    /* ====================================
       SHARED RENDER LOOP
       ==================================== */

    const observer = new ResizeObserver(resize);

    observer.observe(canvas);

    resize();

    function render(now) {
      if (stopped) return;

      if (
        document.visibilityState === 'visible'
      ) {
        draw(now);
      }

      frame = requestAnimationFrame(render);
    }

    frame = requestAnimationFrame(render);

    /* CLEANUP */

    return () => {
      stopped = true;

      cancelAnimationFrame(frame);
      observer.disconnect();

      window.removeEventListener(
        'pointermove',
        handlePointer
      );

      cleanup();
    };
  }, [mode]);

  return (
    <canvas
      key={mode}
      ref={canvasRef}
      className={className}
      style={
        mode === 'canvas2d'
          ? { imageRendering: 'pixelated' }
          : undefined
      }
      aria-hidden="true"
    />
  );
}

export default DitherBackground;
