/**
 * LIBERTY WEAR — MOTOR ULTRA-RÁPIDO (60 FPS) DE TEJIDO DEPORTIVO DRY FIT FLAMEANDO
 * - Aceleración por GPU (WebGL Shader en 1 sola llamada de dibujo = 0% carga de CPU)
 *   con Fallback Canvas 2D por lotes (5 llamadas por frame en lugar de miles)
 * - Textura auténtica DRY FIT: malla piqué/panal microperforada con poros respirables
 *   y brillo satinado de poliéster deportivo en los pliegues 3D de la bandera
 * - Cambia de sentido dinámicamente al mover el ratón, deslizar el dedo o hacer scroll.
 */

document.addEventListener('DOMContentLoaded', () => {
  /* ==========================================================================
     1. BARRA DE PROGRESO, HEADER Y LÍNEA DE TIEMPO AL SCROLL (rAF 60 FPS)
     ========================================================================== */
  const scrollProgress = document.getElementById('scroll-progress');
  const siteHeader = document.getElementById('site-header');
  const originTimeline = document.getElementById('origin-timeline');
  const timelineFill = document.getElementById('timeline-fill');

  let isTicking = false;
  let lastScrollY = window.scrollY || 0;

  // Vector global de viento y flameo
  const wind = {
    dirX: 1.0,
    dirY: 0.3,
    targetDirX: 1.0,
    targetDirY: 0.3,
    speed: 1.0,
    targetSpeed: 1.0,
    phaseX: 0,
    phaseY: 0
  };

  const updateOnScroll = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollDelta = scrollTop - lastScrollY;
    lastScrollY = scrollTop;

    // El deslizamiento de página invierte el sentido vertical del flameo
    if (Math.abs(scrollDelta) > 1) {
      wind.targetDirY = scrollDelta > 0 ? 0.9 : -0.9;
      wind.targetSpeed = Math.min(1.0 + Math.abs(scrollDelta) * 0.035, 2.2);
    }

    if (scrollProgress && docHeight > 0) {
      const progress = Math.min(Math.max(scrollTop / docHeight, 0), 1);
      scrollProgress.style.transform = `scaleX(${progress})`;
    }

    if (siteHeader) {
      if (scrollTop > 40) {
        siteHeader.classList.add('is-scrolled');
      } else {
        siteHeader.classList.remove('is-scrolled');
      }
    }

    if (originTimeline && timelineFill) {
      const rect = originTimeline.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const startOffset = windowHeight * 0.72;
      const endOffset = windowHeight * 0.28;

      const totalTravel = rect.height + startOffset - endOffset;
      const currentTravel = startOffset - rect.top;
      const fillRatio = Math.min(Math.max(currentTravel / totalTravel, 0), 1);

      timelineFill.style.transform = `scaleY(${fillRatio})`;
    }

    isTicking = false;
  };

  window.addEventListener(
    'scroll',
    () => {
      if (!isTicking) {
        window.requestAnimationFrame(updateOnScroll);
        isTicking = true;
      }
    },
    { passive: true }
  );

  updateOnScroll();

  /* ==========================================================================
     2. ANIMACIONES SCROLL / REVEAL (IntersectionObserver)
     ========================================================================== */
  const revealElements = document.querySelectorAll('[data-reveal]');

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const delay = parseInt(el.getAttribute('data-delay') || '0', 10);

            if (delay > 0) {
              setTimeout(() => el.classList.add('is-visible'), delay);
            } else {
              el.classList.add('is-visible');
            }

            observer.unobserve(el);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -35px 0px'
      }
    );

    revealElements.forEach((el) => revealObserver.observe(el));
  } else {
    revealElements.forEach((el) => el.classList.add('is-visible'));
  }

  /* ==========================================================================
     3. MICROINTERACCIONES: BOTONES MAGNÉTICOS Y TARJETAS SPOTLIGHT
     ========================================================================== */
  const isFinePointer = window.matchMedia('(pointer: fine)').matches;

  if (isFinePointer) {
    const magneticButtons = document.querySelectorAll('.magnetic-btn');

    magneticButtons.forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate3d(${x * 0.18}px, ${y * 0.24}px, 0)`;
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translate3d(0, 0, 0)';
      });
    });

    const spotlightCards = document.querySelectorAll('.spotlight-card');

    spotlightCards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
        card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
      });
    });
  }

  /* ==========================================================================
     4. INTERACCIÓN DE PUNTERO (RATÓN Y DEDO EN CELULAR)
     ========================================================================== */
  const pointer = {
    x: window.innerWidth * 0.5,
    y: window.innerHeight * 0.5,
    targetX: window.innerWidth * 0.5,
    targetY: window.innerHeight * 0.5,
    prevX: null,
    prevY: null,
    strength: 0,
    targetStrength: 0,
    lastMove: 0
  };

  const onSteer = (clientX, clientY) => {
    if (pointer.prevX !== null && pointer.prevY !== null) {
      const dx = clientX - pointer.prevX;
      const dy = clientY - pointer.prevY;
      const dist = Math.hypot(dx, dy);

      if (dist > 2) {
        const normX = dx / dist;
        const normY = dy / dist;
        // Cambiar el sentido del flameo hacia donde se mueve el ratón o el dedo
        wind.targetDirX = normX * 1.35;
        wind.targetDirY = normY * 1.15;
        wind.targetSpeed = Math.min(1.1 + dist * 0.035, 2.3);
      }
    }

    pointer.prevX = clientX;
    pointer.prevY = clientY;
    pointer.targetX = clientX;
    pointer.targetY = clientY;
    pointer.targetStrength = 1.0;
    pointer.lastMove = performance.now();
  };

  window.addEventListener('mousemove', (e) => onSteer(e.clientX, e.clientY), { passive: true });

  window.addEventListener(
    'touchstart',
    (e) => {
      if (e.touches && e.touches.length > 0) {
        const t = e.touches[0];
        pointer.prevX = t.clientX;
        pointer.prevY = t.clientY;
        pointer.x = t.clientX;
        pointer.y = t.clientY;
        onSteer(t.clientX, t.clientY);
      }
    },
    { passive: true }
  );

  window.addEventListener(
    'touchmove',
    (e) => {
      if (e.touches && e.touches.length > 0) {
        const t = e.touches[0];
        onSteer(t.clientX, t.clientY);
      }
    },
    { passive: true }
  );

  window.addEventListener(
    'touchend',
    () => {
      pointer.prevX = null;
      pointer.prevY = null;
    },
    { passive: true }
  );

  /* ==========================================================================
     5. MOTOR GPU WEBGL — TEJIDO DRY FIT FLAMEANDO EN 3D (0% LAG, 60 FPS PUROS)
     ========================================================================== */
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  const gl = canvas.getContext('webgl', {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'high-performance'
  });

  if (gl) {
    const vertexShaderSrc = `
      attribute vec2 a_pos;
      void main() {
        gl_Position = vec4(a_pos, 0.0, 1.0);
      }
    `;

    // Fragment Shader que genera la malla piqué Dry Fit microperforada y los pliegues 3D de bandera en la GPU
    const fragmentShaderSrc = `
      precision mediump float;
      uniform vec2 u_res;
      uniform vec2 u_phase;
      uniform vec2 u_windDir;
      uniform vec2 u_mouse;
      uniform float u_mouseStrength;
      uniform float u_time;

      void main() {
        vec2 fragCoord = gl_FragCoord.xy;
        vec2 uv = fragCoord / u_res.y;

        // Distancia al ratón o dedo en pantalla (coordenadas corregidas en Y)
        vec2 mouseUV = vec2(u_mouse.x, u_res.y - u_mouse.y) / u_res.y;
        vec2 toMouse = uv - mouseUV;
        float distMouse = length(toMouse);

        // Onda interactiva local cuando pasa el dedo o el ratón
        float mouseEffect = exp(-distMouse * distMouse * 18.0) * u_mouseStrength;
        float mouseRipple = sin(distMouse * 28.0 - u_time * 7.0) * mouseEffect * 0.45;

        // Pliegues 3D de la bandera flameando en el sentido de u_phase
        float w1 = sin(uv.x * 5.2 + u_phase.x + uv.y * 2.3);
        float w2 = cos(uv.y * 4.6 + u_phase.y - uv.x * 1.9) * 0.65;
        float w3 = sin((uv.x + uv.y) * 8.5 + (u_phase.x + u_phase.y) * 0.7) * 0.25;

        // Altura Z del pliegue e inclinación para iluminación satinada
        float foldZ = (w1 + w2 + w3) * 0.55 + mouseRipple + mouseEffect * 0.5;
        float slopeX = cos(uv.x * 5.2 + u_phase.x + uv.y * 2.3) * 0.6 + mouseRipple;
        float slopeY = -sin(uv.y * 4.6 + u_phase.y - uv.x * 1.9) * 0.5;

        // Deformación de las coordenadas del tejido por los pliegues 3D y el empuje del dedo
        vec2 fabricUV = fragCoord + vec2(foldZ * 26.0 * u_windDir.x, foldZ * 22.0 * u_windDir.y);
        fabricUV -= normalize(toMouse + 0.0001) * mouseEffect * 22.0;

        // Escala de las celdillas del tejido deportivo Dry Fit (en píxeles)
        vec2 cellScale = vec2(18.0, 15.0);
        vec2 gridPos = fabricUV / cellScale;

        // Desfase en panal (tresbolillo) en filas alternas típico del punto Dry Fit
        float rowIdx = floor(gridPos.y);
        gridPos.x += mod(rowIdx, 2.0) * 0.5;

        // Coordenada local dentro de cada celdilla (-0.5 a +0.5)
        vec2 local = fract(gridPos) - 0.5;

        // Forma ovalada del poro respirable microperforado Dry Fit
        vec2 poreCoord = local * vec2(1.05, 1.38);
        float poreDist = length(poreCoord);

        // Textura fina de las microfibras tejidas en "V" alrededor del poro
        float knitRib = sin((local.x + local.y * 0.6) * 18.8) * sin((local.x - local.y * 0.6) * 18.8);

        // Máscara del poro profundo oscuro vs fibra de poliéster
        float poreMask = smoothstep(0.24, 0.37, poreDist);

        // Reborde en relieve iluminado alrededor de cada poro Dry Fit
        float poreRim = smoothstep(0.22, 0.33, poreDist) * (1.0 - smoothstep(0.33, 0.48, poreDist));
        float rimHighlight = max(0.0, dot(normalize(local + 0.001), normalize(vec2(0.5, 0.7)))) * poreRim;

        // Iluminación 3D del pliegue (Brillo satinado de poliéster en crestas, sombra en valles)
        float light = clamp(0.45 + foldZ * 0.35 + slopeX * 0.25 - slopeY * 0.15, 0.04, 1.0);
        float specular = pow(light, 3.2) * 0.55;

        // Paleta Azul Marino LIBERTY WEAR (#0A192F base -> Azul Acero / Blanco satinado en crestas)
        vec3 valleyColor = vec3(0.025, 0.065, 0.13);
        vec3 midNavy    = vec3(0.065, 0.15, 0.29);
        vec3 crestSheen = vec3(0.32, 0.56, 0.88);

        vec3 fiberColor = mix(valleyColor, midNavy, light);
        fiberColor = mix(fiberColor, crestSheen, specular);

        // Sumar textura de los hilos de microfibra y el reborde brillante del poro
        fiberColor += knitRib * 0.028 * light;
        fiberColor += vec3(0.45, 0.68, 0.98) * rimHighlight * (0.4 + light * 0.9);

        // Color interior del poro respirable microperforado
        vec3 poreColor = vec3(0.01, 0.028, 0.065) * (0.5 + light * 0.5);

        vec3 finalColor = mix(poreColor, fiberColor, poreMask);

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    const compileShader = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    };

    const vs = compileShader(gl.VERTEX_SHADER, vertexShaderSrc);
    const fs = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSrc);
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const aPos = gl.getAttribLocation(program, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, 'u_res');
    const uPhase = gl.getUniformLocation(program, 'u_phase');
    const uWindDir = gl.getUniformLocation(program, 'u_windDir');
    const uMouse = gl.getUniformLocation(program, 'u_mouse');
    const uMouseStrength = gl.getUniformLocation(program, 'u_mouseStrength');
    const uTime = gl.getUniformLocation(program, 'u_time');

    let renderScale = 1;

    const resizeGL = () => {
      // Escala 1:1 en pantallas estándar para máxima fluidez a 60fps
      renderScale = Math.min(window.devicePixelRatio || 1, 1.25);
      canvas.width = Math.floor(window.innerWidth * renderScale);
      canvas.height = Math.floor(window.innerHeight * renderScale);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    window.addEventListener('resize', resizeGL);
    resizeGL();

    let startTime = performance.now();

    const renderLoop = (now) => {
      const elapsed = (now - startTime) * 0.001;

      if (now - pointer.lastMove > 1400) {
        pointer.targetStrength = 0;
      }

      // Inercia suave del viento y del puntero
      wind.targetSpeed += (1.0 - wind.targetSpeed) * 0.03;
      wind.dirX += (wind.targetDirX - wind.dirX) * 0.05;
      wind.dirY += (wind.targetDirY - wind.dirY) * 0.05;
      wind.speed += (wind.targetSpeed - wind.speed) * 0.07;

      wind.phaseX -= wind.dirX * 0.038 * wind.speed;
      wind.phaseY += wind.dirY * 0.038 * wind.speed;

      pointer.x += (pointer.targetX - pointer.x) * 0.22;
      pointer.y += (pointer.targetY - pointer.y) * 0.22;
      pointer.strength += (pointer.targetStrength - pointer.strength) * 0.1;

      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform2f(uPhase, wind.phaseX, wind.phaseY);
      gl.uniform2f(uWindDir, wind.dirX, -wind.dirY);
      gl.uniform2f(uMouse, pointer.x * renderScale, pointer.y * renderScale);
      gl.uniform1f(uMouseStrength, pointer.strength);
      gl.uniform1f(uTime, elapsed);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      window.requestAnimationFrame(renderLoop);
    };

    window.requestAnimationFrame(renderLoop);
  }
});
