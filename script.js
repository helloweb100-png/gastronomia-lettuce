/* ==========================================================================
   Gastronómica Lettuce · script.js
   Todo es mejora progresiva: sin JavaScript (o si algo falla) la página se ve completa.
   Secciones:
     0. Configuración (número de WhatsApp en UNA sola constante)
     1. Utilidades
     2. Cargador
     3. Menú móvil, encabezado y progreso
     4. Revelado, títulos por palabra y texto que se ilumina con el scroll
     5. Hero: burbujas (canvas), parallax 3D y marquesinas
     6. Servicios (escena fijada con scroll horizontal)
     7. Barra de bebidas (pestañas + copa que cambia de color)
     8. Imagen que se abre con el scroll
     9. Alimentos (acordeón + fotos) y Método (línea de pasos)
    10. Interacciones de puntero (tilt, imán, foco de luz)
    11. Formulario → WhatsApp y botón flotante
    12. Arranque
   ========================================================================== */
(function () {
  'use strict';
  window.__lettuceListo = true; // avisa al respaldo del <head> que el script arrancó

  /* ------------------------------------------------------------------------
     0. CONFIGURACIÓN
     Número de WhatsApp del negocio: solo dígitos, con lada de país (México = 52).
     Ejemplo de formato: 52 + 10 dígitos. Si queda vacío, el botón de WhatsApp y el
     envío por WhatsApp se ocultan con elegancia y el formulario arma el mensaje
     para copiarlo y enviarlo por Instagram.
     ------------------------------------------------------------------------ */
  const WHATSAPP_NUM = '';

  const NEGOCIO = 'Gastronómica Lettuce';
  const INSTAGRAM_URL = 'https://www.instagram.com/gastronomicalettuce';
  const INSTAGRAM_USUARIO = '@gastronomicalettuce';

  /* ------------------------------------------------------------------------
     1. UTILIDADES
     ------------------------------------------------------------------------ */
  const $ = (s, ctx) => (ctx || document).querySelector(s);
  const $$ = (s, ctx) => Array.from((ctx || document).querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b === undefined ? 1 : b, Math.max(a === undefined ? 0 : a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const suave = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
  const TAU = Math.PI * 2;

  const mqReducir = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mqFino = window.matchMedia('(hover: hover) and (pointer: fine)');
  const mqAncho = window.matchMedia('(min-width: 960px)');
  const REDUCIR = mqReducir.matches;
  const PUNTERO_FINO = mqFino.matches;

  let digitos = String(WHATSAPP_NUM || '').replace(/\D/g, '');
  if (digitos.length === 10) digitos = '52' + digitos;
  const NUM_WA = /^\d{11,15}$/.test(digitos) ? digitos : '';
  const TIENE_WA = NUM_WA !== '';

  let vh = window.innerHeight;
  let menuAbierto = false;

  /* ------------------------------------------------------------------------
     2. CARGADOR (máx. 2.5 s; además hay un respaldo en CSS)
     ------------------------------------------------------------------------ */
  function iniciarCargador() {
    const cargador = $('#cargador');
    if (!cargador) return;
    const nivel = $('#cargador-nivel');
    const pct = $('#cargador-pct');
    const DURACION = REDUCIR ? 250 : 1350;
    const t0 = performance.now();
    let terminado = false;

    function terminar() {
      if (terminado) return;
      terminado = true;
      if (nivel) nivel.style.transform = 'scaleX(1)';
      if (pct) pct.textContent = '100';
      cargador.style.pointerEvents = 'none';
      cargador.classList.add('salir');
      setTimeout(function () {
        cargador.style.display = 'none';
        cargador.setAttribute('aria-hidden', 'true');
      }, 900);
    }

    function paso(t) {
      if (terminado) return;
      const p = clamp((t - t0) / DURACION);
      const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      if (nivel) nivel.style.transform = 'scaleX(' + e.toFixed(4) + ')';
      if (pct) pct.textContent = String(Math.round(e * 100)).padStart(2, '0');
      if (p >= 1) terminar(); else requestAnimationFrame(paso);
    }

    requestAnimationFrame(paso);
    setTimeout(terminar, 1500); // por si la pestaña está en segundo plano y rAF se pausa
  }

  /* ------------------------------------------------------------------------
     3. MENÚ MÓVIL, ENCABEZADO Y PROGRESO
     ------------------------------------------------------------------------ */
  const cabecera = $('#cabecera');
  const burger = $('#burger');
  const menu = $('#menu-movil');
  const barraProgreso = $('#progreso-barra');
  let ultimoY = window.scrollY;

  function abrirMenu() {
    if (!menu || menuAbierto) return;
    menuAbierto = true;
    menu.hidden = false;
    menu.setAttribute('aria-hidden', 'false');
    void menu.offsetWidth; // fuerza el reflujo para que la transición arranque
    menu.classList.add('abierto');
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Cerrar menú');
    document.documentElement.style.overflow = 'hidden';
    cabecera.classList.remove('oculta');
    actualizarFab();
  }

  function cerrarMenu(devolverFoco) {
    if (!menu || !menuAbierto) return;
    menuAbierto = false;
    menu.classList.remove('abierto');
    menu.setAttribute('aria-hidden', 'true');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Abrir menú');
    document.documentElement.style.overflow = '';
    setTimeout(function () { if (!menuAbierto) menu.hidden = true; }, 720);
    if (devolverFoco) burger.focus();
    actualizarFab();
  }

  function iniciarMenu() {
    if (!burger || !menu) return;
    burger.addEventListener('click', function () { menuAbierto ? cerrarMenu(false) : abrirMenu(); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { cerrarMenu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menuAbierto) cerrarMenu(true); });
    mqAncho.addEventListener('change', function (e) { if (e.matches) cerrarMenu(false); });
  }

  function actualizarCabecera(y) {
    if (!cabecera) return;
    const baja = y > ultimoY + 4;
    const sube = y < ultimoY - 4;
    if (menuAbierto || y < 140 || cabecera.matches(':focus-within')) cabecera.classList.remove('oculta');
    else if (baja && y > 320) cabecera.classList.add('oculta');
    else if (sube) cabecera.classList.remove('oculta');
    if (baja || sube) ultimoY = y;
  }

  function actualizarProgreso(y) {
    if (!barraProgreso) return;
    const max = document.documentElement.scrollHeight - vh;
    barraProgreso.style.transform = 'scaleX(' + (max > 0 ? clamp(y / max) : 0).toFixed(4) + ')';
  }

  // Sección activa en el menú de escritorio
  const secciones = ['servicios', 'bebidas', 'alimentos', 'equipo', 'metodo', 'contacto']
    .map(function (id) { return { el: document.getElementById(id), a: $('.nav a[href="#' + id + '"]') }; })
    .filter(function (s) { return s.el && s.a; });

  function actualizarEspia() {
    let activa = null;
    secciones.forEach(function (s) {
      const r = s.el.getBoundingClientRect();
      if (r.top <= vh * 0.4 && r.bottom > vh * 0.4) activa = s;
    });
    secciones.forEach(function (s) {
      if (s === activa) s.a.setAttribute('aria-current', 'true'); else s.a.removeAttribute('aria-current');
    });
  }

  /* ------------------------------------------------------------------------
     4. REVELADO, TÍTULOS POR PALABRA, TEXTO QUE SE ILUMINA
     ------------------------------------------------------------------------ */
  function dividirTitulo(h) {
    let n = 0;
    Array.from(h.childNodes).forEach(function (nodo) {
      if (nodo.nodeType !== 3) return;
      const frag = document.createDocumentFragment();
      nodo.textContent.split(/(\s+)/).forEach(function (parte) {
        if (!parte) return;
        if (/^\s+$/.test(parte)) { frag.appendChild(document.createTextNode(' ')); return; }
        const caja = document.createElement('span');
        caja.className = 'sw';
        const interno = document.createElement('span');
        interno.style.setProperty('--i', String(n++));
        interno.textContent = parte;
        caja.appendChild(interno);
        frag.appendChild(caja);
      });
      nodo.replaceWith(frag);
    });
  }

  function iniciarReveal() {
    $$('[data-split]').forEach(dividirTitulo);
    const objetivos = $$('[data-reveal], [data-split]');
    if (!('IntersectionObserver' in window)) {
      objetivos.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    const io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        // También se revela lo que quedó arriba (por ejemplo, tras un salto por ancla)
        if (en.isIntersecting || en.boundingClientRect.top < 0) {
          en.target.classList.add('is-visible');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    objetivos.forEach(function (el) { io.observe(el); });
  }

  // Texto que se ilumina palabra por palabra mientras avanzas
  const scrubs = [];
  function iniciarScrub() {
    $$('[data-scrub]').forEach(function (el) {
      const palabras = [];
      (function recorrer(nodo) {
        Array.from(nodo.childNodes).forEach(function (hijo) {
          if (hijo.nodeType === 3) {
            const frag = document.createDocumentFragment();
            hijo.textContent.split(/(\s+)/).forEach(function (parte) {
              if (!parte) return;
              if (/^\s+$/.test(parte)) { frag.appendChild(document.createTextNode(parte)); return; }
              const s = document.createElement('span');
              s.className = 'w';
              s.textContent = parte;
              frag.appendChild(s);
              palabras.push(s);
            });
            hijo.replaceWith(frag);
          } else if (hijo.nodeType === 1) {
            recorrer(hijo);
          }
        });
      })(el);
      scrubs.push({ el: el, palabras: palabras, n: 0 });
    });
    if (REDUCIR) scrubs.forEach(function (s) { s.palabras.forEach(function (w) { w.classList.add('on'); }); });
  }

  function actualizarScrub() {
    if (REDUCIR) return;
    scrubs.forEach(function (s) {
      const r = s.el.getBoundingClientRect();
      if (r.bottom < -80 || r.top > vh + 80) {
        if (r.bottom < -80 && s.n !== s.palabras.length) { s.palabras.forEach(function (w) { w.classList.add('on'); }); s.n = s.palabras.length; }
        return;
      }
      const ini = vh * 0.88;
      const fin = vh * 0.42;
      const p = clamp((ini - r.top) / (ini - fin + r.height));
      const n = Math.round(p * s.palabras.length);
      if (n === s.n) return;
      for (let i = 0; i < s.palabras.length; i++) s.palabras[i].classList.toggle('on', i < n);
      s.n = n;
    });
  }

  /* ------------------------------------------------------------------------
     5. HERO: burbujas (canvas), parallax 3D y marquesinas
     ------------------------------------------------------------------------ */
  const hero = $('.hero');
  const heroVisual = $('.hero-visual');
  const heroProf = heroVisual ? $$('[data-prof]', heroVisual) : [];
  const puntero = { x: 0, y: 0, cx: 0, cy: 0, en: false, px: -999, py: -999 };
  let heroVisible = true;
  let heroAlto = 1;

  // ---- Burbujas de champaña / burbujas de la copa (canvas, siempre en movimiento) ----
  const burbujas = { canvas: null, ctx: null, w: 0, h: 0, lista: [] };

  function nuevaBurbuja(inicio) {
    const grande = Math.random() < 0.18;
    const r = grande ? 9 + Math.random() * 11 : 2 + Math.random() * 6;
    return {
      x: Math.random() * (burbujas.w || 400),
      y: inicio ? Math.random() * (burbujas.h || 600) : (burbujas.h || 600) + r + Math.random() * 120,
      r: r,
      vy: 16 + (22 - r) * 2.1 + Math.random() * 14,
      amp: 4 + Math.random() * 18,
      f: 0.5 + Math.random() * 1.1,
      fase: Math.random() * TAU,
      a: 0.2 + Math.random() * 0.45,
      rojo: Math.random() < 0.3,
      ox: 0
    };
  }

  function medirBurbujas() {
    const b = burbujas;
    if (!b.canvas) return;
    const r = b.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    b.w = r.width; b.h = r.height;
    b.canvas.width = Math.max(1, Math.round(r.width * dpr));
    b.canvas.height = Math.max(1, Math.round(r.height * dpr));
    b.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(clamp((r.width * r.height) / 20000, 20, 64));
    while (b.lista.length < n) b.lista.push(nuevaBurbuja(true));
    b.lista.length = n;
  }

  function iniciarBurbujas() {
    const canvas = $('#burbujas');
    if (!canvas || REDUCIR || !canvas.getContext) return;
    burbujas.canvas = canvas;
    burbujas.ctx = canvas.getContext('2d');
    medirBurbujas();
  }

  function dibujarBurbujas(dt, t) {
    const b = burbujas;
    if (!b.ctx || !heroVisible) return;
    const ctx = b.ctx;
    ctx.clearRect(0, 0, b.w, b.h);
    ctx.lineWidth = 1;
    for (let i = 0; i < b.lista.length; i++) {
      const p = b.lista[i];
      p.y -= p.vy * dt;
      if (p.y < -p.r * 2) { b.lista[i] = nuevaBurbuja(false); continue; }
      let x = p.x + Math.sin(t * 0.001 * p.f + p.fase) * p.amp + p.ox;
      if (puntero.en) {
        const dx = x - puntero.px, dy = p.y - puntero.py;
        const d2 = dx * dx + dy * dy;
        if (d2 < 10000) { const d = Math.sqrt(d2) || 1; p.ox += (dx / d) * (1 - d / 100) * 60 * dt; }
      }
      p.ox *= 0.97;
      const borde = clamp(p.y / (b.h * 0.22)) * clamp((b.h - p.y + p.r) / 60);
      const a = p.a * borde;
      if (a < 0.01) continue;
      ctx.beginPath();
      ctx.arc(x, p.y, p.r, 0, TAU);
      ctx.fillStyle = p.rojo ? 'rgba(225,29,46,' + (a * 0.16).toFixed(3) + ')' : 'rgba(255,255,255,' + (a * 0.06).toFixed(3) + ')';
      ctx.fill();
      ctx.strokeStyle = p.rojo ? 'rgba(255,112,124,' + a.toFixed(3) + ')' : 'rgba(255,255,255,' + (a * 0.9).toFixed(3) + ')';
      ctx.stroke();
      if (p.r > 5) {
        ctx.beginPath();
        ctx.arc(x - p.r * 0.34, p.y - p.r * 0.34, p.r * 0.5, Math.PI * 1.08, Math.PI * 1.7);
        ctx.strokeStyle = 'rgba(255,255,255,' + Math.min(1, a * 1.3).toFixed(3) + ')';
        ctx.stroke();
      }
    }
  }

  // ---- Parallax 3D del hero: puntero + scroll ----
  function iniciarParalaje() {
    if (!hero || !heroVisual) return;
    if (PUNTERO_FINO && !REDUCIR) {
      hero.addEventListener('pointermove', function (e) {
        if (e.pointerType === 'touch') return;
        const r = hero.getBoundingClientRect();
        puntero.x = (e.clientX - r.left) / r.width - 0.5;
        puntero.y = (e.clientY - r.top) / r.height - 0.5;
        puntero.px = e.clientX - r.left;
        puntero.py = e.clientY - r.top;
        puntero.en = true;
      });
      hero.addEventListener('pointerleave', function () { puntero.x = 0; puntero.y = 0; puntero.en = false; });
    }
  }

  function actualizarParalaje() {
    if (!heroVisual || REDUCIR || !heroVisible) return;
    puntero.cx = lerp(puntero.cx, puntero.x, 0.08);
    puntero.cy = lerp(puntero.cy, puntero.y, 0.08);
    const sp = clamp(window.scrollY / heroAlto);
    heroVisual.style.setProperty('--ry', (puntero.cx * 9).toFixed(2) + 'deg');
    heroVisual.style.setProperty('--rx', (-puntero.cy * 7 - sp * 6).toFixed(2) + 'deg');
    for (let i = 0; i < heroProf.length; i++) {
      const el = heroProf[i];
      const prof = parseFloat(el.getAttribute('data-prof')) || 1;
      el.style.setProperty('--tx', (puntero.cx * prof * 26).toFixed(2) + 'px');
      el.style.setProperty('--ty', (puntero.cy * prof * 18 - sp * prof * 70).toFixed(2) + 'px');
    }
  }

  // ---- Marquesinas infinitas (la velocidad reacciona al scroll) ----
  const cintas = [];
  const cintasVisibles = new Map(); // caja → ¿está en pantalla?
  let ioCintas = null;

  function prepararCintas() {
    // Se limpian los clones de una medición anterior y se vuelven a crear
    $$('[data-cinta] [data-clon]').forEach(function (n) { n.remove(); });
    cintas.length = 0;
    $$('[data-cinta]').forEach(function (el) {
      const originales = Array.from(el.children);
      if (!originales.length) return;
      const vel = parseFloat(el.getAttribute('data-vel')) || 0.5;
      const grupo = function () {
        return originales.map(function (n) { const c = n.cloneNode(true); c.setAttribute('data-clon', ''); return c; });
      };
      const primero = grupo();
      primero.forEach(function (c) { el.appendChild(c); });
      const ciclo = primero[0].offsetLeft - originales[0].offsetLeft;
      if (ciclo <= 0) { primero.forEach(function (c) { c.remove(); }); return; }
      const extra = Math.ceil(window.innerWidth / ciclo);
      for (let i = 0; i < extra; i++) grupo().forEach(function (c) { el.appendChild(c); });
      const caja = el.parentElement;
      cintas.push({ el: el, ciclo: ciclo, vel: vel, x: vel < 0 ? -ciclo * 0.5 : 0, caja: caja });
      if ('IntersectionObserver' in window) {
        if (!ioCintas) {
          ioCintas = new IntersectionObserver(function (entradas) {
            entradas.forEach(function (en) { cintasVisibles.set(en.target, en.isIntersecting); });
          });
        }
        ioCintas.observe(caja); // observar dos veces el mismo elemento no duplica nada
      }
    });
  }

  function moverCintas(dt, velY) {
    if (REDUCIR) return;
    const impulso = Math.min(Math.abs(velY), 70) * 9;
    for (let i = 0; i < cintas.length; i++) {
      const c = cintas[i];
      if (cintasVisibles.get(c.caja) === false) continue;
      const dir = c.vel < 0 ? -1 : 1;
      c.x -= dir * (Math.abs(c.vel) * 90 + impulso) * dt;
      if (c.x <= -c.ciclo) c.x += c.ciclo;
      if (c.x > 0) c.x -= c.ciclo;
      c.el.style.transform = 'translate3d(' + c.x.toFixed(2) + 'px,0,0)';
    }
  }

  /* ------------------------------------------------------------------------
     6. SERVICIOS: escena fijada con scroll horizontal (solo en pantallas anchas)
     ------------------------------------------------------------------------ */
  const hs = $('#hs');
  const hsPista = $('#hs-pista');
  const hsActual = $('#hs-actual');
  const hsBarra = $('#hs-barra');
  const hsTarjetas = hsPista ? $$('.svc', hsPista) : [];
  const hs$ = { on: false, dist: 0, objetivo: 0, actual: 0 };

  function configurarHS() {
    if (!hs || !hsPista) return;
    const activar = mqAncho.matches && !REDUCIR;
    if (!activar) {
      hs.classList.remove('pin');
      hs.style.height = '';
      hsPista.style.transform = '';
      hs$.on = false;
      return;
    }
    hs.classList.add('pin');
    hsPista.style.transform = 'translate3d(0,0,0)';
    hs$.dist = Math.max(0, hsPista.scrollWidth - document.documentElement.clientWidth);
    if (hs$.dist < 8) { hs.classList.remove('pin'); hs.style.height = ''; hs$.on = false; return; }
    hs.style.height = 'calc(100svh + ' + Math.round(hs$.dist) + 'px)';
    hs$.on = true;
  }

  function actualizarHS() {
    if (!hs$.on) return;
    const r = hs.getBoundingClientRect();
    const p = clamp(-r.top / hs$.dist);
    hs$.objetivo = p * hs$.dist;
    if (hsBarra) hsBarra.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    if (hsActual && hsTarjetas.length) {
      const idx = Math.round(p * (hsTarjetas.length - 1));
      const txt = String(idx + 1).padStart(2, '0');
      if (hsActual.textContent !== txt) hsActual.textContent = txt;
    }
  }

  function moverHS() {
    if (!hs$.on) return;
    hs$.actual = lerp(hs$.actual, hs$.objetivo, 0.14);
    if (Math.abs(hs$.actual - hs$.objetivo) < 0.1) hs$.actual = hs$.objetivo;
    hsPista.style.transform = 'translate3d(' + (-hs$.actual).toFixed(2) + 'px,0,0)';
  }

  // Accesibilidad: al enfocar con teclado una tarjeta oculta, la escena avanza hasta ella
  function iniciarFocoHS() {
    if (!hsPista) return;
    hsPista.addEventListener('focusin', function (e) {
      if (!hs$.on) return;
      const tarjeta = e.target.closest('.svc');
      const idx = hsTarjetas.indexOf(tarjeta);
      if (idx < 0) return;
      const arriba = hs.getBoundingClientRect().top + window.scrollY;
      const p = hsTarjetas.length > 1 ? idx / (hsTarjetas.length - 1) : 0;
      window.scrollTo({ top: arriba + p * hs$.dist, behavior: 'instant' });
    });
  }

  /* ------------------------------------------------------------------------
     7. BARRA DE BEBIDAS: pestañas, copa que cambia de color y rotación automática
     ------------------------------------------------------------------------ */
  function hexARgba(hex, a) {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.replace(/(.)/g, '$1$1') : h, 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  function llenarCopa() {
    const nivel = $('#barra-nivel');
    if (!nivel || REDUCIR) return;
    if (window.anime) {
      window.anime({ targets: nivel, translateY: [78, 0], duration: 1300, easing: 'easeOutElastic(1, .7)' });
    } else if (nivel.animate) {
      nivel.animate([{ transform: 'translateY(78px)' }, { transform: 'translateY(0)' }], { duration: 1100, easing: 'cubic-bezier(.22,1,.36,1)' });
    }
  }

  function iniciarBarra() {
    const lista = $('.tabs');
    const tabs = $$('.tab');
    const paneles = $$('.panel');
    const copa = $('#copa-barra');
    const nombre = $('#barra-nombre');
    const vis = $('.barra-vis');
    const seccion = $('#bebidas');
    if (!lista || !tabs.length || tabs.length !== paneles.length) return;

    let actual = 0;
    let auto = !REDUCIR;
    let visible = false;
    let timer = 0;

    function activar(i, usuario) {
      actual = i;
      tabs.forEach(function (t, k) {
        const on = k === i;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        paneles[k].hidden = !on;
      });
      const col = (tabs[i].getAttribute('data-liq') || '').split('|');
      if (col.length === 3 && copa && vis) {
        copa.style.setProperty('--la', col[0]);
        copa.style.setProperty('--lb', col[1]);
        copa.style.setProperty('--lc', col[2]);
        vis.style.setProperty('--glow', hexARgba(col[1], 0.4));
      }
      if (nombre) {
        nombre.textContent = tabs[i].getAttribute('data-nombre') || tabs[i].textContent;
        nombre.classList.remove('cambia');
        void nombre.offsetWidth;
        nombre.classList.add('cambia');
      }
      if (usuario || visible) llenarCopa();
    }

    function programar() {
      clearTimeout(timer);
      if (!auto || !visible) return;
      timer = setTimeout(function () { activar((actual + 1) % tabs.length, false); programar(); }, 6000);
    }

    function reiniciarProgreso() {
      lista.classList.remove('auto');
      void lista.offsetWidth;
      if (auto) lista.classList.add('auto');
    }

    function detenerAuto() {
      if (!auto) return;
      auto = false;
      clearTimeout(timer);
      lista.classList.remove('auto');
    }

    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { detenerAuto(); activar(i, true); });
      t.addEventListener('keydown', function (e) {
        let nuevo = -1;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') nuevo = (i + 1) % tabs.length;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') nuevo = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') nuevo = 0;
        else if (e.key === 'End') nuevo = tabs.length - 1;
        if (nuevo < 0) return;
        e.preventDefault();
        detenerAuto();
        activar(nuevo, true);
        tabs[nuevo].focus();
      });
    });

    activar(0, false);

    if (auto && seccion && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entradas) {
        visible = entradas[0].isIntersecting;
        if (visible) { reiniciarProgreso(); programar(); } else { clearTimeout(timer); }
      }, { threshold: 0.35 }).observe(seccion);
    }
  }

  /* ------------------------------------------------------------------------
     8. IMAGEN QUE SE ABRE CON EL SCROLL
     ------------------------------------------------------------------------ */
  const expande = $('#montaje');
  const marco = $('#expande-marco');

  function actualizarExpande() {
    if (!expande || !marco || REDUCIR) return;
    const r = expande.getBoundingClientRect();
    if (r.bottom < -50 || r.top > vh + 50) return;
    const total = expande.offsetHeight - vh;
    if (total <= 0) return;
    const p = clamp(-r.top / total);
    const e = suave(0, 0.55, p);
    marco.style.setProperty('--ix', (10 * (1 - e)).toFixed(2) + '%');
    marco.style.setProperty('--iy', (18 * (1 - e)).toFixed(2) + '%');
    marco.style.setProperty('--r', (28 * (1 - e)).toFixed(1) + 'px');
    marco.style.setProperty('--s', (1.2 - 0.2 * e).toFixed(4));
    expande.style.setProperty('--o1', (1 - suave(0.42, 0.6, p)).toFixed(3));
    expande.style.setProperty('--o2', suave(0.58, 0.78, p).toFixed(3));
  }

  // Si una foto de stock no carga, se oculta y queda el degradado de marca (nunca un icono roto)
  function iniciarFotos() {
    $$('img[data-foto]').forEach(function (img) {
      img.addEventListener('error', function () { img.classList.add('sin-foto'); });
    });
  }

  /* ------------------------------------------------------------------------
     9. ALIMENTOS (acordeón + fotos) y MÉTODO (línea de pasos)
     ------------------------------------------------------------------------ */
  function iniciarAlimentos() {
    const items = $$('#menu-lista .menu-item');
    const fotos = $$('#foto-pila .foto');
    const leyenda = $('#foto-leyenda');
    const seccion = $('#alimentos');
    if (!items.length) return;

    let actual = 0;
    let auto = !REDUCIR;
    let visible = false;
    let timer = 0;

    function fijar(i, abrir) {
      items.forEach(function (it, k) {
        const on = abrir && k === i;
        const btn = $('.menu-btn', it);
        const det = $('.menu-d', it);
        it.classList.toggle('is-on', on);
        if (btn) btn.setAttribute('aria-expanded', on ? 'true' : 'false');
        if (det) det.inert = !on;
      });
      if (!abrir) return;
      actual = i;
      const fi = parseInt(items[i].getAttribute('data-foto-i'), 10) || 0;
      fotos.forEach(function (f, k) { f.classList.toggle('is-on', k === fi); });
      const t = $('.menu-t', items[i]);
      if (leyenda && t) leyenda.textContent = t.textContent;
    }

    function programar() {
      clearTimeout(timer);
      if (!auto || !visible) return;
      timer = setTimeout(function () { fijar((actual + 1) % items.length, true); programar(); }, 5200);
    }

    items.forEach(function (it, i) {
      const btn = $('.menu-btn', it);
      if (!btn) return;
      btn.addEventListener('click', function () {
        auto = false;
        clearTimeout(timer);
        fijar(i, !it.classList.contains('is-on'));
      });
    });

    fijar(0, true);

    if (auto && seccion && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entradas) {
        visible = entradas[0].isIntersecting;
        if (visible) programar(); else clearTimeout(timer);
      }, { threshold: 0.3 }).observe(seccion);
    }
  }

  const pasos = { ol: null, lista: [], n: -1 };
  function iniciarPasos() {
    pasos.ol = $('#pasos');
    if (!pasos.ol) return;
    pasos.lista = $$('.paso', pasos.ol);
    if (REDUCIR) {
      pasos.ol.style.setProperty('--prog', '1');
      pasos.lista.forEach(function (p) { p.classList.add('on'); });
    }
  }

  function actualizarPasos() {
    if (!pasos.ol || REDUCIR) return;
    const r = pasos.ol.getBoundingClientRect();
    const p = clamp((vh * 0.85 - r.top) / (r.height * 0.9 + vh * 0.25));
    pasos.ol.style.setProperty('--prog', p.toFixed(4));
    const n = Math.min(pasos.lista.length, Math.floor(p * pasos.lista.length * 1.05) + (p > 0.02 ? 1 : 0));
    if (n === pasos.n) return;
    pasos.n = n;
    pasos.lista.forEach(function (el, i) { el.classList.toggle('on', i < n); });
  }

  /* ------------------------------------------------------------------------
     10. INTERACCIONES DE PUNTERO: foco de luz, tilt 3D y botones imantados
     ------------------------------------------------------------------------ */
  function iniciarPuntero() {
    if (!PUNTERO_FINO) return;

    $$('[data-spot]').forEach(function (sec) {
      sec.addEventListener('pointermove', function (e) {
        const r = sec.getBoundingClientRect();
        sec.style.setProperty('--mx', (e.clientX - r.left).toFixed(0) + 'px');
        sec.style.setProperty('--my', (e.clientY - r.top).toFixed(0) + 'px');
      });
    });

    $$('[data-tilt]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        el.style.setProperty('--ry', ((x - 0.5) * 10).toFixed(2) + 'deg');
        el.style.setProperty('--rx', ((0.5 - y) * 8).toFixed(2) + 'deg');
        el.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
        el.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      });
      el.addEventListener('pointerleave', function () {
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
      });
    });

    $$('.btn-mag').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        const r = b.getBoundingClientRect();
        b.style.setProperty('--bx', ((e.clientX - (r.left + r.width / 2)) * 0.2).toFixed(1) + 'px');
        b.style.setProperty('--by', ((e.clientY - (r.top + r.height / 2)) * 0.3).toFixed(1) + 'px');
      });
      b.addEventListener('pointerleave', function () {
        b.style.setProperty('--bx', '0px');
        b.style.setProperty('--by', '0px');
      });
    });
  }

  /* ------------------------------------------------------------------------
     11. FORMULARIO → WHATSAPP y BOTÓN FLOTANTE
     ------------------------------------------------------------------------ */
  const fab = $('#fab');
  const contacto = $('#contacto');

  function mensajeGenerico() {
    return 'Hola, quiero cotizar mi evento con ' + NEGOCIO + '.';
  }

  function enlaceWA(texto) {
    return 'https://wa.me/' + NUM_WA + '?text=' + encodeURIComponent(texto);
  }

  function configurarFab() {
    if (!fab) return;
    const texto = $('#fab-texto');
    const uso = $('use', fab);
    if (TIENE_WA) {
      fab.href = enlaceWA(mensajeGenerico());
      fab.target = '_blank';
      fab.rel = 'noopener';
      fab.classList.add('fab--wa');
      fab.setAttribute('aria-label', 'Escribir por WhatsApp a ' + NEGOCIO);
      fab.removeAttribute('data-servicio');
      if (texto) texto.textContent = 'Escríbenos por WhatsApp';
    } else {
      // Sin número: el botón flotante no finge ser WhatsApp, solo lleva a cotizar
      if (uso) uso.setAttribute('href', '#i-flecha');
      if (texto) texto.textContent = 'Cotizar mi evento';
    }
  }

  function actualizarFab() {
    if (!fab) return;
    const y = window.scrollY;
    let enContacto = false;
    if (contacto && !TIENE_WA) {
      const r = contacto.getBoundingClientRect();
      enContacto = r.top < vh * 0.55 && r.bottom > vh * 0.2;
    }
    fab.classList.toggle('visible', y > vh * 0.7 && !enContacto && !menuAbierto);
  }

  function formatearFecha(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (!m) return iso;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function construirMensaje(d) {
    const l = ['Hola, soy ' + d.nombre + '. Quiero cotizar un servicio con ' + NEGOCIO + '.', '', '• Servicio: ' + d.servicio];
    if (d.fecha) l.push('• Fecha del evento: ' + formatearFecha(d.fecha));
    if (d.invitados) l.push('• Invitados (aprox.): ' + d.invitados);
    if (d.detalles) l.push('• Detalles: ' + d.detalles);
    l.push('', '¡Gracias! Quedo al pendiente.');
    return l.join('\n');
  }

  function iniciarFormulario() {
    const form = $('#form-cotiza');
    if (!form) return;
    const estado = $('#form-estado');
    const nota = $('#form-nota');
    const enviar = $('#form-enviar');
    const enviarTxt = $('#form-enviar-texto');
    const selServicio = $('#f-servicio');
    const fecha = $('#f-fecha');
    let resultado = null;

    if (fecha) {
      const hoy = new Date();
      fecha.min = hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0') + '-' + String(hoy.getDate()).padStart(2, '0');
    }

    if (nota) {
      nota.textContent = TIENE_WA
        ? 'Tu mensaje se arma solo y se abre en WhatsApp, listo para enviar.'
        : 'Armamos tu mensaje por ti: solo cópialo y envíalo por Instagram.';
    }

    // Los botones de "cotizar" de toda la página preseleccionan el servicio correspondiente
    $$('[data-servicio]').forEach(function (a) {
      a.addEventListener('click', function () {
        const v = a.getAttribute('data-servicio');
        if (!v || !selServicio) return;
        const op = Array.from(selServicio.options).find(function (o) { return o.value === v; });
        if (op) { selServicio.value = v; marcar(selServicio, ''); }
      });
    });

    function marcar(campo, msg) {
      const caja = campo.closest('.campo');
      if (!caja) return;
      const err = $('.error', caja);
      caja.classList.toggle('invalido', !!msg);
      campo.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (err) err.textContent = msg;
    }

    ['f-nombre', 'f-servicio', 'f-invitados', 'f-fecha'].forEach(function (id) {
      const c = document.getElementById(id);
      if (!c) return;
      c.addEventListener('input', function () { marcar(c, ''); });
      c.addEventListener('change', function () { marcar(c, ''); });
    });

    function validar() {
      const nombre = $('#f-nombre');
      const inv = $('#f-invitados');
      let primero = null;
      const fallo = function (campo, msg) { marcar(campo, msg); if (!primero) primero = campo; };
      if (nombre.value.trim().length < 2) fallo(nombre, 'Cuéntanos cómo te llamas.'); else marcar(nombre, '');
      if (!selServicio.value) fallo(selServicio, 'Elige el servicio que más se acerca a lo que necesitas.'); else marcar(selServicio, '');
      if (inv && inv.value && Number(inv.value) < 1) fallo(inv, 'Escribe un número de invitados válido.'); else if (inv) marcar(inv, '');
      if (fecha && fecha.value && fecha.min && fecha.value < fecha.min) fallo(fecha, 'Elige una fecha de hoy en adelante.'); else if (fecha) marcar(fecha, '');
      if (primero) primero.focus();
      return !primero;
    }

    function limpiarResultado() {
      if (resultado) { resultado.remove(); resultado = null; }
    }

    function mostrarSinWhatsApp(mensaje) {
      limpiarResultado();
      resultado = document.createElement('div');
      const pre = document.createElement('div');
      pre.className = 'form-pre';
      pre.tabIndex = 0;
      pre.textContent = mensaje;
      const acciones = document.createElement('div');
      acciones.className = 'form-acciones';
      const copiar = document.createElement('button');
      copiar.type = 'button';
      copiar.className = 'form-copiar';
      copiar.textContent = 'Copiar mensaje';
      copiar.addEventListener('click', function () {
        const ok = function () { copiar.textContent = '¡Copiado!'; setTimeout(function () { copiar.textContent = 'Copiar mensaje'; }, 2200); };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(mensaje).then(ok, function () { seleccionar(pre); });
        } else { seleccionar(pre); }
      });
      const ig = document.createElement('a');
      ig.className = 'form-copiar';
      ig.href = INSTAGRAM_URL;
      ig.target = '_blank';
      ig.rel = 'noopener';
      ig.textContent = 'Abrir Instagram ' + INSTAGRAM_USUARIO;
      acciones.appendChild(copiar);
      acciones.appendChild(ig);
      resultado.appendChild(pre);
      resultado.appendChild(acciones);
      estado.insertAdjacentElement('afterend', resultado);
      estado.textContent = 'Tu mensaje está listo. Cópialo y envíalo por mensaje directo en Instagram (' + INSTAGRAM_USUARIO + ').';
    }

    function seleccionar(nodo) {
      const rango = document.createRange();
      rango.selectNodeContents(nodo);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(rango);
      estado.textContent = 'Selecciona y copia el mensaje con tu teclado o menú.';
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validar()) return;
      const datos = {
        nombre: $('#f-nombre').value.trim(),
        servicio: selServicio.value,
        fecha: fecha ? fecha.value : '',
        invitados: $('#f-invitados') ? $('#f-invitados').value.trim() : '',
        detalles: $('#f-detalles') ? $('#f-detalles').value.trim() : ''
      };
      const mensaje = construirMensaje(datos);

      if (TIENE_WA) {
        limpiarResultado();
        estado.textContent = 'Abriendo WhatsApp con tu mensaje listo para enviar…';
        if (enviarTxt) enviarTxt.textContent = 'Abriendo WhatsApp…';
        if (enviar) enviar.disabled = true;
        const url = enlaceWA(mensaje);
        const ventana = window.open(url, '_blank', 'noopener');
        if (!ventana) window.location.href = url;
        setTimeout(function () {
          if (enviarTxt) enviarTxt.textContent = 'Quiero mi cotización';
          if (enviar) enviar.disabled = false;
        }, 2800);
      } else {
        mostrarSinWhatsApp(mensaje);
      }
    });
  }

  /* ------------------------------------------------------------------------
     12. ARRANQUE
     ------------------------------------------------------------------------ */
  let pendiente = false;
  function alScroll() {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(function () {
      pendiente = false;
      const y = window.scrollY;
      actualizarProgreso(y);
      actualizarCabecera(y);
      actualizarEspia();
      actualizarHS();
      actualizarExpande();
      actualizarScrub();
      actualizarPasos();
      actualizarFab();
    });
  }

  let ultimoT = 0;
  let ultimaY = window.scrollY;
  let velY = 0;
  let raf = 0;

  function tick(t) {
    raf = requestAnimationFrame(tick);
    const dt = Math.min(0.05, (t - (ultimoT || t)) / 1000);
    ultimoT = t;
    const y = window.scrollY;
    velY += ((y - ultimaY) - velY) * 0.12;
    ultimaY = y;
    moverCintas(dt, velY);
    moverHS();
    actualizarParalaje();
    dibujarBurbujas(dt, t);
  }

  function arrancarBucle() {
    if (raf || REDUCIR) return;
    ultimoT = 0;
    raf = requestAnimationFrame(tick);
  }

  function recalcular() {
    vh = window.innerHeight;
    heroAlto = hero ? hero.offsetHeight || vh : vh;
    configurarHS();
    prepararCintas();
    medirBurbujas();
    alScroll();
  }

  function iniciar() {
    iniciarCargador();
    iniciarMenu();
    iniciarFotos();
    iniciarReveal();
    iniciarScrub();
    iniciarBurbujas();
    iniciarParalaje();
    iniciarFocoHS();
    iniciarBarra();
    iniciarAlimentos();
    iniciarPasos();
    iniciarPuntero();
    iniciarFormulario();
    configurarFab();
    recalcular();

    if (hero && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { heroVisible = e[0].isIntersecting; }).observe(hero);
    }

    window.addEventListener('scroll', alScroll, { passive: true });
    let temporizador = 0;
    window.addEventListener('resize', function () {
      clearTimeout(temporizador);
      temporizador = setTimeout(recalcular, 160);
    });
    window.addEventListener('load', recalcular);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(recalcular);

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else { arrancarBucle(); }
    });
    arrancarBucle();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
