
import { useEffect, useRef } from 'react';

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
   STUDIO MACACO IMAGE LENS SHADER
   ======================================== */

const FRAGMENT_SHADER = `
precision highp float;

uniform sampler2D uTex;

uniform vec2 uRes;
uniform vec2 uUvScale;
uniform vec2 uUvOffset;
uniform vec2 uMouse;

uniform float uStrength;
uniform float uTime;
uniform float uPixel;
uniform float uRadius;
uniform float uZoom;

uniform vec3 uAccent;
uniform vec3 uDark;

float bayer2(vec2 a) {
  a = floor(a);
  return fract(a.x / 2.0 + a.y * a.y * 0.75);
}

float bayer8(vec2 p) {
  float b4 =
    bayer2(0.25 * p) * 0.25 +
    bayer2(p);

  float b8 =
    bayer2(0.125 * p) * 0.0625 +
    b4;

  return (b8 * 63.0 + 0.5) / 64.0;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;

  float aspect = uRes.x / uRes.y;

  vec2 p = vec2(uv.x * aspect, uv.y);
  vec2 m = vec2(uMouse.x * aspect, uMouse.y);

  float d = distance(p, m);

  float f =
    smoothstep(uRadius, 0.0, d) *
    uStrength;

  f *= 1.0 + 0.045 * sin(uTime * 2.3);

  vec2 pd =
    m + (p - m) * (1.0 - uZoom * f);

  vec2 duv = vec2(pd.x / aspect, pd.y);

  vec2 tuv = clamp(
    duv * uUvScale + uUvOffset,
    0.0,
    1.0
  );

  vec3 col = texture2D(uTex, tuv).rgb;

  vec2 cell = floor(
    gl_FragCoord.xy / uPixel
  );

  float lum = dot(
    col,
    vec3(0.299, 0.587, 0.114)
  );

  lum = smoothstep(
    0.12,
    0.82,
    lum + 0.10 * f
  );

  float lit = step(bayer8(cell), lum);

  vec3 dcol = mix(uDark, uAccent, lit);

  float mask = smoothstep(
    uRadius,
    uRadius * 0.30,
    d
  ) * uStrength;

  float show = step(
    bayer8(cell + vec2(37.0, 19.0)),
    mask
  );

  gl_FragColor = vec4(
    mix(col, dcol, show),
    1.0
  );
}
`;

/* ========================================
   HELPERS
   ======================================== */

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);

  if (!shader) return null;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(
      'Shader compilation failed:',
      gl.getShaderInfoLog(shader)
    );

    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function hexToRGB(hex) {
  const value = hex.replace('#', '');

  return [
    parseInt(value.slice(0, 2), 16) / 255,
    parseInt(value.slice(2, 4), 16) / 255,
    parseInt(value.slice(4, 6), 16) / 255,
  ];
}

/* ========================================
   IMAGE COMPONENT
   ======================================== */

function ExperienceImage({ src, alt, accent }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;

    if (!container || !canvas) return;

    const canHover = window.matchMedia(
      '(hover: hover) and (pointer: fine)'
    ).matches;

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (!canHover || reducedMotion) return;

    /* =====================================
       WEBGL
       ===================================== */

    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      premultipliedAlpha: false,
    });

    if (!gl) {
      console.warn('WebGL is not available.');
      return;
    }

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
      return;
    }

    const program = gl.createProgram();

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(
        'WebGL program error:',
        gl.getProgramInfoLog(program)
      );
      return;
    }

    gl.useProgram(program);

    /* =====================================
       GEOMETRY
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
      'uTex',
      'uRes',
      'uUvScale',
      'uUvOffset',
      'uMouse',
      'uStrength',
      'uTime',
      'uPixel',
      'uRadius',
      'uZoom',
      'uAccent',
      'uDark',
    ].forEach((name) => {
      uniforms[name] = gl.getUniformLocation(
        program,
        name
      );
    });

    gl.uniform1i(uniforms.uTex, 0);
    gl.uniform1f(uniforms.uRadius, 0.55);
    gl.uniform1f(uniforms.uZoom, 0.34);

    gl.uniform3fv(
      uniforms.uAccent,
      hexToRGB(accent)
    );

    gl.uniform3fv(
      uniforms.uDark,
      [0.04, 0.04, 0.04]
    );

    /* =====================================
       IMAGE TEXTURE
       ===================================== */

    const texture = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_WRAP_S,
      gl.CLAMP_TO_EDGE
    );

    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_WRAP_T,
      gl.CLAMP_TO_EDGE
    );

    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MIN_FILTER,
      gl.LINEAR
    );

    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MAG_FILTER,
      gl.LINEAR
    );

    const state = {
      hovering: false,
      ready: false,

      strength: 0,

      x: 0.5,
      y: 0.5,

      targetX: 0.5,
      targetY: 0.5,
    };

    let imageWidth = 0;
    let imageHeight = 0;

    let animationFrame = 0;
    let running = false;
    let disposed = false;

    const startTime = performance.now();

    /* =====================================
       CANVAS SIZE
       ===================================== */

    function resize() {
      const dpr = Math.min(
        window.devicePixelRatio || 1,
        1.75
      );

      const width = Math.max(
        1,
        Math.round(container.clientWidth * dpr)
      );

      const height = Math.max(
        1,
        Math.round(container.clientHeight * dpr)
      );

      if (
        canvas.width !== width ||
        canvas.height !== height
      ) {
        canvas.width = width;
        canvas.height = height;
      }

      gl.viewport(0, 0, width, height);

      gl.uniform2f(
        uniforms.uRes,
        width,
        height
      );

      gl.uniform1f(
        uniforms.uPixel,
        3 * dpr
      );

      if (!imageWidth || !imageHeight) return;

      const scale = Math.max(
        width / imageWidth,
        height / imageHeight
      );

      const scaledWidth = imageWidth * scale;
      const scaledHeight = imageHeight * scale;

      gl.uniform2f(
        uniforms.uUvScale,
        width / scaledWidth,
        height / scaledHeight
      );

      gl.uniform2f(
        uniforms.uUvOffset,
        (scaledWidth - width) / (2 * scaledWidth),
        (scaledHeight - height) / (2 * scaledHeight)
      );
    }

    /* =====================================
       RENDER
       ===================================== */

    function draw() {
      if (!state.ready || gl.isContextLost()) {
        return;
      }

      gl.useProgram(program);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);

      gl.uniform1f(
        uniforms.uStrength,
        state.strength
      );

      gl.uniform2f(
        uniforms.uMouse,
        state.x,
        state.y
      );

      gl.uniform1f(
        uniforms.uTime,
        (performance.now() - startTime) / 1000
      );

      gl.drawArrays(
        gl.TRIANGLES,
        0,
        3
      );
    }

    /* =====================================
       ANIMATION
       ===================================== */

    function animate() {
      if (disposed) return;

      state.strength += (
        (state.hovering ? 1 : 0) -
        state.strength
      ) * 0.09;

      state.x += (
        state.targetX - state.x
      ) * 0.16;

      state.y += (
        state.targetY - state.y
      ) * 0.16;

      draw();

      if (
        state.hovering ||
        state.strength > 0.004
      ) {
        animationFrame = requestAnimationFrame(
          animate
        );
      } else {
        state.strength = 0;
        running = false;
        canvas.style.opacity = '0';
      }
    }

    function startAnimation() {
      if (!state.ready || running) return;

      running = true;

      canvas.style.opacity = '1';

      animationFrame = requestAnimationFrame(
        animate
      );
    }

    /* =====================================
       LOAD IMAGE
       ===================================== */

    const image = new Image();

    image.onload = () => {
      if (disposed) return;

      imageWidth = image.naturalWidth;
      imageHeight = image.naturalHeight;

      gl.pixelStorei(
        gl.UNPACK_FLIP_Y_WEBGL,
        true
      );

      gl.bindTexture(gl.TEXTURE_2D, texture);

      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGB,
        gl.RGB,
        gl.UNSIGNED_BYTE,
        image
      );

      state.ready = true;

      resize();

      if (state.hovering) {
        startAnimation();
      }
    };

    image.src = src;

    /* =====================================
       POINTER EVENTS
       ===================================== */

    function updateMouse(event) {
      const bounds = container.getBoundingClientRect();

      state.targetX =
        (event.clientX - bounds.left) /
        Math.max(1, bounds.width);

      state.targetY =
        1 - (
          (event.clientY - bounds.top) /
          Math.max(1, bounds.height)
        );
    }

    function handleEnter(event) {
      updateMouse(event);

      state.x = state.targetX;
      state.y = state.targetY;

      state.hovering = true;

      startAnimation();
    }

    function handleMove(event) {
      updateMouse(event);
    }

    function handleLeave() {
      state.hovering = false;
    }

    container.addEventListener(
      'pointerenter',
      handleEnter
    );

    container.addEventListener(
      'pointermove',
      handleMove
    );

    container.addEventListener(
      'pointerleave',
      handleLeave
    );

    /* =====================================
       RESIZE OBSERVER
       ===================================== */

    const observer = new ResizeObserver(resize);

    observer.observe(container);
    resize();

    /* =====================================
       CLEANUP
       ===================================== */

    return () => {
      disposed = true;

      cancelAnimationFrame(animationFrame);
      observer.disconnect();

      container.removeEventListener(
        'pointerenter',
        handleEnter
      );

      container.removeEventListener(
        'pointermove',
        handleMove
      );

      container.removeEventListener(
        'pointerleave',
        handleLeave
      );

      image.onload = null;

      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }, [src, accent]);

  return (
    <div
      ref={containerRef}
      className="experience-item__image"
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
      />

      <canvas
        ref={canvasRef}
        className="experience-item__lens"
        aria-hidden="true"
      />
    </div>
  );
}

export default ExperienceImage;
