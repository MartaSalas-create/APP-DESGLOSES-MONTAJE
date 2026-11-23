(function () {
  "use strict";
  var D = window.SITE;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (t) {
    return String(t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  var pad = function (n) { return (n < 10 ? "0" : "") + n; };
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var FPS = 25;
  var tcToFrames = function (tc) { var p = tc.split(":").map(Number); return ((p[0] * 60 + p[1]) * 60 + p[2]) * FPS + p[3]; };
  var framesToTc = function (f) {
    f = Math.max(0, Math.round(f));
    var fr = f % FPS, s = Math.floor(f / FPS) % 60, m = Math.floor(f / FPS / 60) % 60, h = Math.floor(f / FPS / 3600);
    return pad(h) + ":" + pad(m) + ":" + pad(s) + ":" + pad(fr);
  };
  // Año de una entrada: 2021 o "2019–2020"
  var yearsOf = function (y) {
    var m = String(y).match(/\d{4}/g) || ["0"];
    return [Number(m[0]), Number(m[m.length - 1])];
  };


  /* =========================================================
     0. START: el nombre se escribe letra a letra con el cursor naranja
     ========================================================= */
  (function typeName() {
    var el = $(".hero-name"); if (!el) return;
    var text = el.textContent.trim();
    el.setAttribute("aria-label", text);
    var cursor = el.querySelector(".cursor");
    // cada palabra va en un bloque que no se parte: el cursor siempre queda pegado a la última letra
    // (nunca salta solo a la línea de abajo). Cada letra ocupa su sitio desde el principio.
    el.innerHTML = text.split(" ").map(function (w) {
      return '<span class="tw-word">' + w.split("").map(function (ch) { return '<span class="tw" aria-hidden="true">' + esc(ch) + "</span>"; }).join("") + "</span>";
    }).join(" ");
    var chars = $$(".tw", el);
    if (reduceMotion) { chars.forEach(function (c) { c.classList.add("on"); }); chars[chars.length - 1].after(cursor); return; }
    chars[0].before(cursor);
    var i = 0;
    setTimeout(function step() {
      if (i >= chars.length) return;
      chars[i].classList.add("on");
      chars[i].after(cursor);
      i++;
      setTimeout(step, chars[i] && chars[i].parentNode !== chars[i - 1].parentNode ? 220 : 95);
    }, 450);
  })();

  /* =========================================================
     0b. SOBRE MÍ: el playhead se desliza por encima de las fotos de 2000 y 2019
     ========================================================= */
  (function scrubPhotos() {
    var box = $(".then-now"), cut = $(".then-now-cut"); if (!box || !cut) return;
    var set = function (v) { v = Math.max(0, Math.min(100, v)); box.style.setProperty("--x", v); cut.setAttribute("aria-valuenow", Math.round(v)); };
    var fromX = function (x) { var r = box.getBoundingClientRect(); return (x - r.left) / r.width * 100; };
    var drag = false;
    cut.addEventListener("pointerdown", function (e) { drag = true; box.classList.add("is-dragging"); cut.setPointerCapture(e.pointerId); e.preventDefault(); });
    cut.addEventListener("pointermove", function (e) { if (drag) set(fromX(e.clientX)); });
    var end = function () { drag = false; box.classList.remove("is-dragging"); };
    cut.addEventListener("pointerup", end); cut.addEventListener("pointercancel", end);
    cut.addEventListener("keydown", function (e) {
      var v = +cut.getAttribute("aria-valuenow");
      var d = { ArrowLeft: -4, ArrowRight: 4, Home: -100, End: 100 }[e.key];
      if (d) { set(v + d); e.preventDefault(); }
    });
  })();

  /* Sobre mí: la foto empieza bajo el título «En la sala de montaje» y termina con el texto */
  /* Sobre mí (opción A): la foto grande a la izquierda empieza a la altura del texto (bajo el título)
     y llega hasta el final de la sección; se recorta por arriba. Posición fija, sin arrastre. */
  (function fitAboutPhoto() {
    var fig = $(".photo-about"), text = $(".about-grid > .about-text"); if (!fig || !text) return;
    var img = fig.querySelector("img");
    function fit() {
      fig.style.marginTop = "";
      // la foto va ahora bajo el título, en su propia columna: no necesita desplazamiento
    }
    fit(); img.addEventListener("load", fit);
    window.addEventListener("resize", fit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  })();

  /* =========================================================
     1. CABECERA: la web como secuencia
     Cada sección es un clip con ancho proporcional a su duración (altura),
     el cabezal sigue el scroll y el código de tiempo corre de 00:59:50:00 a 02:00:00:00.
     ========================================================= */
  var track = $("#nleTrack"), head = $("#nleHead"), tcEl = $("#tc"), label = $("#nleLabel");
  var navClips = $$("a", track);
  var names = ["Start", "Filmografía seleccionada", "Trayectoria", "Docencia", "Formación", "Contacto"];
  var LAST = names.length - 1;
  var sections = navClips.map(function (a) { return $(a.getAttribute("href")); });
  navClips.forEach(function (a, i) { a.setAttribute("data-n", i === 0 || i === LAST ? "" : String(i)); });
  var TC_START = tcToFrames("00:59:50:00"), TC_END = tcToFrames("02:00:00:00");
  var bounds = [];

  function layoutNle() {
    var total = document.documentElement.scrollHeight - window.innerHeight;
    bounds = sections.map(function (s) { return s.offsetTop; });
    sections.forEach(function (s, i) {
      var h = (i < sections.length - 1 ? bounds[i + 1] : document.documentElement.scrollHeight) - bounds[i];
      navClips[i].style.setProperty("--w", Math.max(h / total, 0.04).toFixed(3));
    });
    // código de tiempo de cada bloque
    $$("[data-tc]").forEach(function (s) {
      var p = Math.min(1, s.offsetTop / Math.max(1, total));
      var t = s.querySelector(".block-tc") || s.appendChild(Object.assign(document.createElement("span"), { className: "block-tc mono" }));
      t.textContent = framesToTc(TC_START + p * (TC_END - TC_START));
    });
    onScroll();
  }

  function onScroll() {
    var y = window.scrollY, total = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    var p = Math.min(1, Math.max(0, y / total));
    // posición del cabezal dentro del clip activo, para que coincida con el clip visible
    var probe = y + window.innerHeight * 0.35, idx = 0;
    for (var i = 0; i < bounds.length; i++) if (probe >= bounds[i]) idx = i;
    if (p >= 0.999) idx = sections.length - 1;
    var a = navClips[idx];
    var secStart = bounds[idx], secEnd = idx < bounds.length - 1 ? bounds[idx + 1] : document.documentElement.scrollHeight;
    var within = Math.min(1, Math.max(0, (probe - secStart) / Math.max(1, secEnd - secStart)));
    if (p >= 0.999) within = 1;
    head.style.left = (a.offsetLeft + within * a.offsetWidth) + "px";
    tcEl.textContent = framesToTc(TC_START + p * (TC_END - TC_START));
    navClips.forEach(function (c, j) { c.classList.toggle("is-current", j === idx); });
    label.textContent = (idx === 0 ? "Start · martasalas.com" : idx === LAST ? "Picture lock · " + names[idx] : "Bobina " + idx + " · " + names[idx]);
    if (onScroll.last !== undefined && onScroll.last !== idx) cueFlash();
    onScroll.last = idx;
  }

  /* Marcas de cambio de bobina (cue marks): al cambiar de sección parpadean dos veces en la esquina
     superior derecha de la pantalla, como en la proyección (la primera avisa, la segunda marca el cambio). */
  var cueEl = document.body.appendChild(Object.assign(document.createElement("i"), { className: "cue cue-flash" }));
  cueEl.setAttribute("aria-hidden", "true");
  function cueFlash() {
    if (reduceMotion || !cueEl) return;
    cueEl.classList.remove("is-on"); void cueEl.offsetWidth; cueEl.classList.add("is-on");
  }
  // cada rótulo de bobina lleva su marca delante (sin marca fija en la esquina: solo parpadea al cambiar de sección)
  $$(".kicker.hot").forEach(function (k) {
    if (!/^(Bobina|Sobre mí|Picture lock)/.test(k.textContent.trim())) return;
    k.classList.add("reel-label");
    // escrito a mano con lápiz graso sobre un trozo de celuloide
    k.innerHTML = '<i class="cue" aria-hidden="true"></i><span class="gp">' + k.innerHTML + "</span>";
  });
  document.body.insertAdjacentHTML("beforeend", '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="grease-real" x="-5%" y="-10%" width="110%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="3" seed="11" result="t"/><feColorMatrix in="t" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 2.05" result="holes"/><feTurbulence type="fractalNoise" baseFrequency="0.05 0.9" numOctaves="2" seed="5" result="streak"/><feDisplacementMap in="SourceGraphic" in2="streak" scale="2.2" result="d"/><feComposite in="d" in2="holes" operator="in"/></filter><filter id="grease"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="1.6"/><feComponentTransfer><feFuncA type="discrete" tableValues="0 .85 1 1"/></feComponentTransfer></filter></svg>');
  // al entrar en pantalla, cada rótulo arranca como el principio de una bobina de 35 mm (una sola vez)
  if (!reduceMotion && "IntersectionObserver" in window) {
    var reelIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var k = en.target; reelIO.unobserve(k);
        // arranca cuando el rótulo ya está bien dentro de la pantalla y el scroll se ha frenado un poco
        setTimeout(function () { k.classList.replace("is-waiting", "is-projected"); }, 180);
      });
    }, { rootMargin: "0px 0px -38% 0px" });
    $$(".reel-label").forEach(function (k) { k.classList.add("is-waiting"); reelIO.observe(k); });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  /* Formación: el subtítulo cuenta las formaciones solo (se actualiza al añadir cursos en data.js) */
  (function () {
    var el = document.getElementById("trainCount"), t = D.training || []; if (!el || !t.length) return;
    var yr = function (x) { return parseInt(String(x[0]).slice(0, 4), 10); };
    var first = Math.min.apply(null, t.map(yr)), last = Math.max.apply(null, t.map(yr));
    el.textContent = t.length + " formaciones desde " + first + ", la última en " + last;
  })();
  window.addEventListener("resize", function () { clearTimeout(layoutNle.t); layoutNle.t = setTimeout(layoutNle, 120); });

  /* El playhead del menú de páginas se arrastra como en el timeline: al moverlo, la página corre hasta ese punto.
     Se puede coger el cabezal o arrastrar desde cualquier punto de la pista; un clic corto sigue llevando a la sección. */
  function xToScroll(x) {
    var idx = 0;
    for (var i = 0; i < navClips.length; i++) if (x >= navClips[i].offsetLeft) idx = i;
    var a = navClips[idx];
    var within = Math.min(1, Math.max(0, (x - a.offsetLeft) / Math.max(1, a.offsetWidth)));
    var secStart = bounds[idx], secEnd = idx < bounds.length - 1 ? bounds[idx + 1] : document.documentElement.scrollHeight;
    var y = secStart + within * (secEnd - secStart) - window.innerHeight * 0.35;
    if (idx === 0 && within < 0.02) y = 0;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (idx === navClips.length - 1 && within > 0.9) y = max;
    return Math.max(0, Math.min(max, y));
  }
  var scrub = null;
  head.style.pointerEvents = "auto";
  track.addEventListener("pointerdown", function (e) {
    if (e.button !== 0) return;
    scrub = { id: e.pointerId, x0: e.clientX, on: e.target === head };
    if (scrub.on) { e.preventDefault(); startScrub(e); }
  });
  function startScrub(e) {
    scrub.on = true; track.classList.add("is-scrubbing");
    try { track.setPointerCapture(scrub.id); } catch (er) {}
    document.documentElement.style.scrollBehavior = "auto";
    moveScrub(e);
  }
  function moveScrub(e) {
    var r = track.getBoundingClientRect();
    window.scrollTo(0, xToScroll(Math.max(0, Math.min(r.width, e.clientX - r.left))));
  }
  track.addEventListener("pointermove", function (e) {
    if (!scrub || e.pointerId !== scrub.id) return;
    if (!scrub.on && Math.abs(e.clientX - scrub.x0) > 5) startScrub(e);
    if (scrub.on) { e.preventDefault(); moveScrub(e); }
  });
  function endScrub(e) {
    if (!scrub || (e && e.pointerId !== scrub.id)) return;
    var was = scrub.on; scrub = null;
    if (was) {
      track.classList.remove("is-scrubbing"); track.dataset.dragged = "1";
      setTimeout(function () { delete track.dataset.dragged; document.documentElement.style.scrollBehavior = ""; }, 60);
    }
  }
  track.addEventListener("pointerup", endScrub);
  track.addEventListener("pointercancel", endScrub);
  // tras arrastrar no se dispara el clic del clip donde se suelta
  track.addEventListener("click", function (e) { if (track.dataset.dragged) { e.preventDefault(); e.stopPropagation(); } }, true);
  track.addEventListener("dragstart", function (e) { e.preventDefault(); });

  /* =========================================================
     2. LÍNEA DE TIEMPO DE LA CARRERA (hero)
     Cuatro pistas: V2 cine, V1 series y TV, A1 documental/música/publicidad, A2 docencia y formación.
     Cada crédito es un clip que dura hasta el siguiente corte de su pista.
     ========================================================= */
  var Y0 = 1991, Y1 = 2027; // de enero de 1991 a final de 2026
  var span = Y1 - Y0;
  // Orden de lo más actual a lo más antiguo: 2026 a la izquierda, 1991 a la derecha
  var pct = function (y) { return ((Y1 - y) / span) * 100; };
  var byCat = {}; D.credits.forEach(function (c) { byCat[c.cat] = c.items; });
  var pick = function (cats) {
    var out = [];
    cats.forEach(function (c) { (byCat[c] || []).forEach(function (it) { var r = yearsOf(it[0]); out.push({ a: r[0], b: r[1], t: it[1], d: it[2], cat: c }); }); });
    return out;
  };
  var listRows = function (arr, cat) { return arr.map(function (r) { var y = yearsOf(r[0]); return { a: y[0], b: y[1], t: r[1], d: r[2], cat: cat }; }); };
  var TRACKS = [
    { id: "cine", lab: "V3 · Cine", items: pick(["Largometrajes y TV movies", "Cortometrajes"]) },
    { id: "series", lab: "V2 · Series", items: pick(["Series de ficción"]) },
    { id: "doc", lab: "V1 · Doc y varios", items: pick(["Documental y reportaje", "Programas de TV", "Musical", "Publicidad", "Otros"]) },
    { id: "wave", lab: "A1 · Docencia", items: listRows(D.teaching, "Docencia") },
    { id: "train", lab: "A2 · Formación", items: listRows(D.training, "Formación") }
  ];

  function buildClips(items) {
    // agrupa por año de inicio y corta cada clip en el siguiente inicio
    var starts = {};
    items.forEach(function (it) { (starts[it.a] = starts[it.a] || []).push(it); });
    var keys = Object.keys(starts).map(Number).sort(function (x, y) { return x - y; });
    return keys.map(function (k, i) {
      var group = starts[k];
      var end = Math.max.apply(null, group.map(function (g) { return g.b; })) + 1;
      if (i < keys.length - 1) end = Math.min(end, keys[i + 1]);
      return { a: k, b: end, items: group };
    });
  }

  var tracksEl = $("#careerTracks"), labelsEl = $("#careerLabels"), ruler = $("#careerRuler");
  labelsEl.innerHTML = "<span></span>" + TRACKS.map(function (t) {
    var p = t.lab.split(" · ");
    return '<button type="button" class="trk-btn t-' + t.id + '" data-t="' + t.id + '" aria-pressed="true" title="Activar o desactivar la pista ' + p[1] + '">' +
      '<svg class="trk-eye" viewBox="0 0 24 24" aria-hidden="true"><path class="eye-o" d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle class="eye-o" cx="12" cy="12" r="3"/><path class="eye-x" d="M4 4l16 16"/></svg><i class="trk-sw" aria-hidden="true"></i><b>' + p[0] + "</b><em>&nbsp;· " + p[1] + "</em></button>";
  }).join("");
  var rul = "";
  for (var y = Y0; y <= Y1; y++) {
    var big = y % 5 === 0;
    rul += '<i class="' + (big ? "big" : "") + '" style="left:' + pct(y) + '%"></i>';
    if (big && y < Y1) rul += '<span style="left:' + pct(y + 0.5) + '%">' + y + "</span>";
  }
  ruler.innerHTML = rul;
  tracksEl.innerHTML = TRACKS.map(function (t) {
    t.clips = buildClips(t.items);
    return '<div class="ctrack t-' + t.id + '">' + t.clips.map(function (c, i) {
      var title = c.items[0].t.split(" · ")[0] + (c.items.length > 1 ? " +" + (c.items.length - 1) : "");
      return '<div class="cclip" data-t="' + t.id + '" data-i="' + i + '" aria-label="' + esc(title) + '" style="left:' + pct(c.b) + "%;width:" + (pct(c.a) - pct(c.b)) + '%"></div>'; // sin rótulo fijo: el título sale en el monitor
    }).join("") + "</div>";
  }).join("");

  // el nombre solo se muestra si cabe en el clip
  function fitClipLabels() { $$(".cclip", tracksEl).forEach(function (el) { el.classList.toggle("mini", false); el.classList.toggle("mini", el.scrollWidth > el.clientWidth + 1); }); }
  fitClipLabels();
  window.addEventListener("resize", fitClipLabels);

  var stage = $("#careerStage"), chead = $("#careerHead"), yearEl = $("#careerYear"), nowEl = $("#careerNow");
  var mon = { quote: $("#monQuote"), frame: $("#monFrame"), meta: $("#monMeta"), title: $("#monTitle"), detail: $("#monDetail"), more: $("#monMore"), tc: $("#monTc") };
  var TRACK_OF = {}; TRACKS.forEach(function (t) { t.items.forEach(function (it) { TRACK_OF[it.cat] = t.id; }); });
  var FRAME_BG = {
    cine: "linear-gradient(135deg, #ffa41b, #c96a08)",
    series: "linear-gradient(135deg, #f64a1f, #a8192c)",
    doc: "linear-gradient(135deg, #a8192c, #4a0b14)",
    wave: "linear-gradient(135deg, #1f5a3c, #0f1f17)",
    train: "linear-gradient(135deg, #1b6f80, #0d2a31)"
  };
  var CAT_LABEL = { "Largometrajes y TV movies": "Largometraje", "Series de ficción": "Serie de ficción", "Documental y reportaje": "Documental",
    "Cortometrajes": "Cortometraje", "Programas de TV": "Programa de TV", "Ayudante de montaje": "Ayudante de montaje" };
  var curYear = null, idleTimer = null, lastYv = Y1;
  var trackOff = {};                       // pistas desactivadas con su selector
  var isOn = function (id) { return !trackOff[id]; };

  // El monitor muestra la frase (en reposo) o el «fotograma» del trabajo bajo el cabezal
  function showFrame(on) {
    if (!TRACKS.some(function (t) { return isOn(t.id); })) on = false; // sin pistas activas: WORK IN PROGRESS
    mon.frame.hidden = !on; mon.quote.hidden = on;
  }
  function idleSoon(ms, volver) {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(function () { showFrame(false); if (volver) setYear(Y1); }, ms);
  }

  function setYear(yv) {
    yv = Math.max(Y0, Math.min(Y1, yv));      // Y1 = inicio de la línea de tiempo (borde izquierdo)
    lastYv = yv;
    var yr = Math.min(Math.floor(yv), Y1 - 1);
    chead.style.left = pct(yv) + "%";
    // avanza al reproducir (de 2026 a la izquierda hacia lo más antiguo a la derecha)
    mon.tc.textContent = framesToTc(TC_START + ((Y1 - yv) / span) * (TC_END - TC_START));
    if (window.__monEra) window.__monEra(yv);
    if (yr === curYear) return;
    curYear = yr;
    chead.setAttribute("aria-valuenow", yr);
    yearEl.textContent = yr;
    var active = [];
    TRACKS.forEach(function (t) { if (isOn(t.id)) t.items.forEach(function (it) { if (it.a <= yr && it.b >= yr) active.push(it); }); });
    var rank = function (it) { return it.cat === "Docencia" || it.cat === "Formación" ? 2 : it.cat === "Ayudante de montaje" || it.cat === "Script" ? 1 : 0; };
    // dentro de cada rango, lo que empieza ese año primero
    active.sort(function (a, b) { return rank(a) - rank(b) || (b.a === yr) - (a.a === yr) || b.a - a.a; });
    var roleOf = function (it) { return it.cat === "Docencia" ? "docencia" : it.cat === "Formación" ? "formación" : it.cat === "Script" ? "script" : it.cat === "Ayudante de montaje" ? "ayte. montaje" : ""; };
    var label = function (it) { var r = roleOf(it); return "<b>" + esc(it.t) + "</b>" + (r ? " <i>(" + r + ")</i>" : ""); };
    nowEl.classList.remove("is-open");
    if (!TRACKS.some(function (t) { return isOn(t.id); })) nowEl.innerHTML = "<i>Todas las pistas desactivadas</i>";
    else if (!active.length) nowEl.innerHTML = "<i>—</i>";
    else nowEl.innerHTML = active.map(label).join(" · ");   // todos los trabajos del año a la vez
    // la línea solo crece (nunca encoge mientras se recorre el timeline), así las pistas no dan saltos
    var rd = nowEl.parentElement; if (rd) rd.style.minHeight = Math.max(parseFloat(rd.style.minHeight) || 0, rd.offsetHeight) + "px";
    $$(".cclip", tracksEl).forEach(function (el) {
      var t = TRACKS.filter(function (x) { return x.id === el.dataset.t; })[0], c = t.clips[+el.dataset.i];
      el.classList.toggle("on", isOn(t.id) && c.a <= yr && c.b > yr);
    });
    // fotograma en el monitor
    var it = active[0];
    if (it) {
      var yrs = it.a === it.b ? it.a : it.a + "–" + it.b;
      mon.meta.textContent = yrs + " · " + (CAT_LABEL[it.cat] || it.cat);
      mon.title.textContent = it.t;
      mon.title.classList.toggle("is-long", it.t.length > 34);
      mon.detail.textContent = it.d || "";
      // el monitor nombra también los demás trabajos del año (hasta 2) y cuenta el resto
      var rest = active.slice(1);
      mon.more.textContent = rest.length ? "Ese año también: " + rest.slice(0, 2).map(function (x) { return x.t + ((x.cat === "Docencia" || x.cat === "Formación") && x.d ? " (" + x.d + ")" : ""); }).join(" · ") + (rest.length > 2 ? " · +" + (rest.length - 2) + " más" : "") : "";
      mon.frame.style.setProperty("--frame-bg", FRAME_BG[TRACK_OF[it.cat]] || FRAME_BG.series);
    } else {
      mon.meta.textContent = yr; mon.title.textContent = "—"; mon.detail.textContent = ""; mon.more.textContent = "";
    }
    fitFrame();
  }

  /* Los rótulos del monitor nunca se cortan: si el texto no cabe en la ventanilla, se reduce todo junto hasta que quepa */
  function fitFrame() {
    var f = mon.frame; if (!f) return;
    var wasHidden = f.hidden; if (wasHidden) { f.style.visibility = "hidden"; f.hidden = false; }
    var s = 1; f.style.setProperty("--fs", s);
    while (s > 0.55 && f.scrollHeight > f.clientHeight + 1) { s -= 0.05; f.style.setProperty("--fs", s.toFixed(2)); }
    if (wasHidden) { f.hidden = true; f.style.visibility = ""; }
  }
  window.addEventListener("resize", function () { clearTimeout(fitFrame.t); fitFrame.t = setTimeout(function () { fitFrame(); if (nowEl.parentElement) nowEl.parentElement.style.minHeight = ""; }, 120); });

  /* ---------- Pistas interactivas ----------
     · Selector de pista (V3, V2…): la activa o desactiva, como en una mesa de edición.
     · Clic en un clip: el cabezal salta a ese trabajo y el monitor lo muestra.
     · Al pasar el ratón por un clip: etiqueta con año y títulos. */
  function refresh() { curYear = null; setYear(lastYv); }
  labelsEl.addEventListener("click", function (e) {
    var b = e.target.closest(".trk-btn"); if (!b) return;
    var id = b.dataset.t, off = !trackOff[id];
    trackOff[id] = off;
    b.setAttribute("aria-pressed", String(!off)); b.classList.toggle("is-off", off);
    tracksEl.querySelector(".t-" + id).classList.toggle("is-off", off);
    showFrame(true); refresh(); idleSoon(8000);
  });
  var tip = document.createElement("div"); tip.className = "clip-tip"; tip.hidden = true; tip.setAttribute("role", "tooltip");
  stage.appendChild(tip);
  function clipOf(el) { var t = TRACKS.filter(function (x) { return x.id === el.dataset.t; })[0]; return t.clips[+el.dataset.i]; }
  function showTip(el) {
    if (!el || !isOn(el.dataset.t)) { tip.hidden = true; return; }
    var c = clipOf(el), last = c.b - 1;
    var yrs = last > c.a ? c.a + "–" + last : String(c.a);
    var names = c.items.map(function (x) { return x.t; });
    tip.innerHTML = '<span class="mono">' + yrs + "</span>" + names.slice(0, 3).map(function (n) { return "<b>" + esc(n) + "</b>"; }).join("") +
      (names.length > 3 ? "<i>+" + (names.length - 3) + " más</i>" : "");
    tip.hidden = false;
    var sr = stage.getBoundingClientRect(), r = el.getBoundingClientRect();
    var x = Math.max(0, Math.min(sr.width - tip.offsetWidth, r.left - sr.left + r.width / 2 - tip.offsetWidth / 2));
    tip.style.left = x + "px"; tip.style.top = (r.top - sr.top - tip.offsetHeight - 8) + "px";
  }
  stage.addEventListener("pointermove", function (e) {
    if (dragging || e.pointerType !== "mouse") return;
    var el = e.target.closest(".cclip");
    if (!el) { // el cabezal puede tapar el clip: busca debajo
      var under = document.elementsFromPoint(e.clientX, e.clientY);
      for (var i = 0; i < under.length && !el; i++) if (under[i].classList && under[i].classList.contains("cclip")) el = under[i];
    }
    showTip(el);
  });
  stage.addEventListener("pointerleave", function () { tip.hidden = true; });

  // «+N más» despliega todos los trabajos del año
  nowEl.addEventListener("click", function (e) {
    if (!e.target.closest(".now-more")) return;
    nowEl.classList.toggle("is-open"); clearTimeout(idleTimer); showFrame(true); idleSoon(12000);
  });

  var yearFromX = function (x) { var r = stage.getBoundingClientRect(); return Y1 - ((x - r.left) / r.width) * span; };
  var dragging = false, auto = null;
  var downX = 0, downClip = null;
  stage.addEventListener("pointerdown", function (e) {
    dragging = true; stopPlay(); clearTimeout(idleTimer); showFrame(true); tip.hidden = true;
    downX = e.clientX; downClip = e.target.closest(".cclip");
    if (downClip && !isOn(downClip.dataset.t)) downClip = null;
    stage.setPointerCapture(e.pointerId); setYear(yearFromX(e.clientX));
  });
  stage.addEventListener("pointermove", function (e) { if (dragging) setYear(yearFromX(e.clientX)); });
  stage.addEventListener("pointerup", function (e) {
    dragging = false;
    if (downClip && Math.abs(e.clientX - downX) < 5) setYear(clipOf(downClip).a + 0.5); // clic en un clip
    downClip = null; idleSoon(6000);
  });
  stage.addEventListener("pointercancel", function () { dragging = false; idleSoon(6000); });

  /* ---------- Controles de transporte (estilo Avid) ----------
     data-transport="esencial": corte anterior · reproducir · corte siguiente
     data-transport="completa": entrada · salida | corte anterior · un año · reproducir · un año · corte siguiente
     La línea de tiempo va de lo más actual (izquierda) a lo más antiguo (derecha):
     los botones que apuntan a la izquierda llevan a trabajos más recientes. */
  var transportEl = $("#transport");
  var MODE = (transportEl.closest("[data-transport]") || transportEl).getAttribute("data-transport") || "completa";
  var BTN = {
    "in":   { icon: "i-in",        label: "Marcar entrada (I)" },
    "out":  { icon: "i-out",       label: "Marcar salida (O)" },
    "prev": { icon: "i-prev-edit", label: "Ir al corte anterior · más reciente" },
    "back": { icon: "i-step-back", label: "Un año más reciente" },
    "play": { icon: "i-play",      label: "Reproducir la carrera (espacio)" },
    "fwd":  { icon: "i-step-fwd",  label: "Un año más antiguo" },
    "next": { icon: "i-next-edit", label: "Ir al corte siguiente · más antiguo" }
  };
  var ORDER = MODE === "completa" ? ["in", "out", "|", "prev", "back", "play", "fwd", "next"] : ["prev", "play", "next"];
  var svgUse = function (id) { return '<svg aria-hidden="true" focusable="false"><use href="#' + id + '"/></svg>'; };
  transportEl.querySelector(".avid-bar").innerHTML = ORDER.map(function (k, i) {
    if (k === "|") return "";
    var sep = ORDER[i - 1] === "|" ? " sep" : "";
    return '<button type="button" class="avid-btn' + sep + '" data-act="' + k + '" aria-label="' + BTN[k].label + '" title="' + BTN[k].label + '">' + svgUse(BTN[k].icon) + "</button>";
  }).join("");
  transportEl.classList.toggle("is-completa", MODE === "completa");
  var tPlay = transportEl.querySelector('[data-act="play"]');

  // Cortes: inicios de clip de todas las pistas
  function cuts() {
    var out = [];
    TRACKS.forEach(function (t) { if (isOn(t.id)) t.clips.forEach(function (c) { if (out.indexOf(c.a) < 0) out.push(c.a); }); });
    return out.sort(function (a, b) { return a - b; });
  }
  function goTo(y) { stopPlay(); showFrame(true); setYear(y + 0.5); idleSoon(8000); }
  function jump(dir) { // dir > 0: más reciente (izquierda) · dir < 0: más antiguo (derecha)
    var y = curYear == null ? 2026 : curYear, target = null, CUTS = cuts();
    if (dir > 0) { for (var i = 0; i < CUTS.length; i++) if (CUTS[i] > y) { target = CUTS[i]; break; } }
    else { for (var j = CUTS.length - 1; j >= 0; j--) if (CUTS[j] < y) { target = CUTS[j]; break; } }
    goTo(target != null ? target : y);
  }

  // Marcas de entrada y salida: delimitan el tramo que reproduce ▶
  var mark = { "in": null, "out": null };
  var rangeEl = document.createElement("div"); rangeEl.className = "career-range"; rangeEl.hidden = true;
  stage.insertBefore(rangeEl, chead);
  var markEls = {};
  ["in", "out"].forEach(function (k) {
    var el = document.createElement("span"); el.className = "career-mark mark-" + k; el.hidden = true; el.setAttribute("aria-hidden", "true");
    stage.insertBefore(el, chead); markEls[k] = el;
  });
  function range() { // [más reciente, más antiguo] en años completos, o null
    if (mark["in"] == null && mark.out == null) return null;
    var a = mark["in"] != null ? mark["in"] : Y1 - 1, b = mark.out != null ? mark.out : Y0;
    return [Math.max(a, b), Math.min(a, b)];
  }
  function paintMarks() {
    ["in", "out"].forEach(function (k) {
      var el = markEls[k]; el.hidden = mark[k] == null;
      if (mark[k] != null) el.style.left = pct(mark[k] + 0.5) + "%";
      var b = transportEl.querySelector('[data-act="' + k + '"]'); if (b) b.classList.toggle("on", mark[k] != null);
    });
    var r = range(); rangeEl.hidden = !r;
    if (r) { rangeEl.style.left = pct(r[0] + 1) + "%"; rangeEl.style.width = (pct(r[1]) - pct(r[0] + 1)) + "%"; }
    if (mon.more && r) mon.more.textContent = "Tramo marcado: " + r[0] + " → " + r[1];
  }
  function toggleMark(k) {
    var y = curYear == null ? 2026 : curYear;
    mark[k] = mark[k] === y ? null : y; // pulsar otra vez en el mismo año la quita
    showFrame(true); paintMarks(); idleSoon(8000);
  }

  // Reproducir: de izquierda a derecha (de lo más actual a lo más antiguo), dentro del tramo si lo hay
  function stopPlay() {
    if (auto) { cancelAnimationFrame(auto); auto = null; }
    tPlay.innerHTML = svgUse("i-play"); tPlay.classList.remove("on"); tPlay.setAttribute("aria-label", BTN.play.label);
  }
  function play(delay) {
    if (typeof shut !== "undefined" && shut.raf) { cancelAnimationFrame(shut.raf); shut.raf = null; shut.dir = 0; shut.rate = 1; }
    stopPlay(); clearTimeout(idleTimer);
    var r = range();
    var START = r ? r[0] + 0.5 : Y1, END = r ? r[1] : Y0;
    var inside = lastYv < START - 0.05 && lastYv > END + 0.05;   // reanuda desde donde estaba
    var from = inside ? lastYv : START;
    /* Reproducción año a año: el cabezal se detiene en cada año el tiempo justo para leer el monitor
       y luego pasa rápido al siguiente, como avanzar plano a plano. */
    var HOLD = 850, GLIDE = 250, t0 = null;
    var pts = [from], y = Math.floor(from - 0.5) + 0.5;
    if (from - y < 0.05) y -= 1;
    for (; y > END + 0.05; y -= 1) pts.push(y);
    pts.push(END);
    var seg = HOLD + GLIDE, total = (pts.length - 1) * seg;
    var ease = function (x) { return x * x * (3 - 2 * x); };
    setYear(from); showFrame(true);
    tPlay.innerHTML = svgUse("i-pause"); tPlay.classList.add("on"); tPlay.setAttribute("aria-label", "Pausa (espacio)");
    auto = requestAnimationFrame(function step(ts) {
      if (t0 === null) t0 = ts + (delay || 0);
      var t = Math.max(0, ts - t0);
      // el primer tramo arranca sin espera (ya se ve el año inicial al empezar)
      var tt = t + HOLD, i = Math.min(pts.length - 2, Math.floor(tt / seg)), f = tt - i * seg;
      var g = f <= HOLD ? 0 : ease(Math.min(1, (f - HOLD) / GLIDE));
      setYear(pts[i] + g * (pts[i + 1] - pts[i]));
      if (tt < total) auto = requestAnimationFrame(step);
      else { setYear(END); stopPlay(); if (r) idleSoon(6000); else idleSoon(1800, true); } // sin tramo, vuelve al presente
    });
  }
  function togglePlay() { if (auto) { stopPlay(); idleSoon(8000); } else play(0); }

  transportEl.addEventListener("click", function (e) {
    var b = e.target.closest(".avid-btn"); if (!b) return;
    var act = b.dataset.act;
    if (act === "play") togglePlay();
    else if (act === "prev") { if (typeof stopShuttle === "function") stopShuttle(); stopPlay(); showFrame(true); setYear(Y1); idleSoon(8000); }   // al inicio del timeline
    else if (act === "next") jump(-1);
    else if (act === "back") goTo(Math.min(Y1 - 1, (curYear == null ? 2026 : curYear) + 1));
    else if (act === "fwd") goTo(Math.max(Y0, (curYear == null ? 2026 : curYear) - 1));
    else toggleMark(act);
  });
  // Teclado sobre el cabezal: flechas, Inicio/Fin, espacio, y en la opción completa I/O como en Avid
  function onKeys(e) {
    var d = { ArrowLeft: 1, ArrowUp: 1, ArrowRight: -1, ArrowDown: -1, PageUp: 5, PageDown: -5 }[e.key];
    var y = curYear == null ? 2026 : curYear;
    var enBoton = e.currentTarget === transportEl; // en un botón, espacio e Intro pulsan ese botón
    if (e.key === "Home") { stopPlay(); showFrame(true); setYear(Y1); idleSoon(8000); e.preventDefault(); }
    else if (e.key === "End") { goTo(Y0); e.preventDefault(); }
    else if (e.key === " " && !enBoton) { togglePlay(); e.preventDefault(); }
    else if (MODE === "completa" && (e.key === "i" || e.key === "I")) { toggleMark("in"); e.preventDefault(); }
    else if (MODE === "completa" && (e.key === "o" || e.key === "O")) { toggleMark("out"); e.preventDefault(); }
    else if (d) { goTo(Math.max(Y0, Math.min(Y1 - 1, y + d))); e.preventDefault(); }
  }
  chead.addEventListener("keydown", onKeys);
  transportEl.addEventListener("keydown", onKeys);

  /* J K L como en los programas de montaje: L avanza (hacia lo más antiguo), J retrocede (hacia el presente),
     K para. Pulsar J o L otra vez dobla la velocidad (1×, 2×, 4×, 8×). */
  var shut = { dir: 0, rate: 1, raf: null };
  function stopShuttle() { if (shut.raf) cancelAnimationFrame(shut.raf); shut.raf = null; shut.dir = 0; shut.rate = 1; stopPlay(); }
  function shuttle(dir) {
    if (auto) stopPlay();
    if (dir === -1 && lastYv >= Y1 - 0.05) dir = 1;   // en el inicio del timeline, J también arranca la reproducción
    if (shut.dir === dir) shut.rate = Math.min(8, shut.rate * 2); else { shut.dir = dir; shut.rate = 1; }
    clearTimeout(idleTimer); showFrame(true);
    tPlay.innerHTML = svgUse("i-pause"); tPlay.classList.add("on");
    if (shut.raf) return;
    var tPrev = null;
    shut.raf = requestAnimationFrame(function st(ts) {
      if (tPrev === null) tPrev = ts;
      var dt = (ts - tPrev) / 1000; tPrev = ts;
      var v = lastYv - shut.dir * shut.rate * (span / 9) * dt;
      if ((shut.dir > 0 && v <= Y0) || (shut.dir < 0 && v >= Y1)) { setYear(Math.max(Y0, Math.min(Y1, v))); stopShuttle(); idleSoon(8000); return; }
      setYear(v); shut.raf = requestAnimationFrame(st);
    });
  }
  document.addEventListener("keydown", function (e) {
    var t = e.target; if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    var k = e.key.toLowerCase();
    if (k === "l") { shuttle(1); e.preventDefault(); }
    else if (k === "j") { shuttle(-1); e.preventDefault(); }
    else if (k === "k") { stopShuttle(); idleSoon(8000); e.preventDefault(); }
    else if ((k === "i" || k === "o") && t !== chead && !transportEl.contains(t)) { toggleMark(k === "i" ? "in" : "out"); e.preventDefault(); }
  });

  // Al cargar, la secuencia se reproduce una vez
  if (reduceMotion) { setYear(Y1); showFrame(false); }
  else play(700);

  /* =========================================================
     3. TRABAJOS DESTACADOS como clips de colores
     ========================================================= */
  var k = 0;
  var worksEl = $("#works");
  if (worksEl) worksEl.innerHTML = D.featured.map(function (w, i) {
    var n = pad(i + 1);
    var body = '<span class="clip-meta">' + esc(w.years) + " · " + esc(w.kind) + "</span>" +
      "<h3>" + esc(w.title) + "</h3><p>" + esc(w.info) + "</p>" + (w.tag ? '<span class="tag">' + esc(w.tag) + "</span>" : "");
    if (w.poster) {
      return '<article class="clip poster reveal"><img src="' + esc(w.poster) + '" alt="Cartel de ' + esc(w.title) + '" loading="lazy"><div class="poster-body">' + body + "</div></article>";
    }
    var cls = "clip reveal k" + (k++ % 5) + (w.wide ? " wide" : "");
    return '<article class="' + cls + '"><span class="clip-n" aria-hidden="true">' + n + "</span>" + body + "</article>";
  }).join("");

  $("#awards").innerHTML = '<span class="awards-k mono">Premios y nominaciones</span>' + D.awards.map(function (a) {
    return '<span class="award"><span class="mono">' + esc(a.year) + "</span> " + esc(a.text) + " <i>· " + esc(a.work) + "</i></span>";
  }).join("");

  /* =========================================================
     4. REEL
     ========================================================= */
  var reelGrid = $("#reelGrid");
  function renderReel(kind) {
    reelGrid.innerHTML = D.reels[kind].map(function (v, i) {
      return '<a class="reel-item" href="https://www.youtube.com/watch?v=' + esc(v.id) + '" target="_blank" rel="noopener" data-id="' + esc(v.id) + '" aria-label="Reproducir ' + (v.t ? "el tráiler de " + esc(v.t) : "vídeo " + (i + 1)) + '">' +
        '<img src="' + (v.s ? esc(v.s) : "https://i.ytimg.com/vi/" + esc(v.id) + "/hqdefault.jpg") + '" alt="" loading="lazy" onerror="this.parentNode.classList.add(\'no-thumb\');this.remove()">' +
        '<span class="play">▶</span><span class="reel-n">' + (v.t ? "Tráiler · " + esc(v.t) : (kind === "tv" ? "Series" : "Cine") + " · Clip " + pad(i + 1)) + "</span></a>";
    }).join("");
  }
  if (reelGrid) renderReel("trailers");   // (la sección Reel se quitó: los tráileres siguen en las fichas y en Trayectoria)
  $$("[data-reel]").forEach(function (b) {
    b.addEventListener("click", function () {
      $$("[data-reel]").forEach(function (x) { var on = x === b; x.classList.toggle("is-active", on); x.setAttribute("aria-selected", on); });
      renderReel(b.dataset.reel);
    });
  });
  var lb = $("#lightbox"), lbFrame = $("#lbFrame"), lastFocus = null;
  function openVideo(id) {
    lastFocus = document.activeElement;
    lbFrame.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) +
      '?autoplay=1&rel=0" title="Vídeo del reel" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>';
    lb.hidden = false; document.body.style.overflow = "hidden"; $("#lbClose").focus();
  }
  function closeVideo() { lb.hidden = true; lbFrame.innerHTML = ""; document.body.style.overflow = ""; if (lastFocus) lastFocus.focus(); }
  // Dentro de un visor que no admite vídeos incrustados, el enlace abre YouTube
  var framed = (function () { try { return window.self !== window.top; } catch (err) { return true; } })();
  if (reelGrid) reelGrid.addEventListener("click", function (e) {
    var b = e.target.closest(".reel-item"); if (!b || framed) return;
    e.preventDefault(); openVideo(b.dataset.id);
  });
  $("#lbClose").addEventListener("click", closeVideo);
  /* Trayectoria: los títulos que tienen tráiler en el Reel (y no ficha de cartel) lo abren al pincharlos */
  var trailerKey = function (t) { return String(t).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(" · ")[0].replace(/\(.*?\)/g, "").replace(/[^a-z0-9ñ ]/g, "").replace(/\s+/g, " ").trim(); };
  var TRAILER_BY = {}; (D.reels.trailers || []).forEach(function (v) { TRAILER_BY[trailerKey(v.t)] = v; });
  function linkTrailers() {
    var c = $("#credits"); if (!c) return;
    $$(".ct > strong", c).forEach(function (st) {
      var v = TRAILER_BY[trailerKey(st.textContent)];
      if (!v || st.dataset.trailer) return;
      st.dataset.trailer = v.id; st.classList.add("has-trailer"); st.setAttribute("role", "link"); st.tabIndex = 0;
      st.setAttribute("aria-label", "Ver el tráiler de " + v.t); st.title = "Ver tráiler";
    });
  }
  function playTrailer(st) {
    if (st.dataset.ficha) return;            // con ficha de cartel, abre la ficha (que ya lleva el tráiler)
    if (framed) window.open("https://www.youtube.com/watch?v=" + st.dataset.trailer, "_blank", "noopener");
    else openVideo(st.dataset.trailer);
  }
  linkTrailers();
  $("#credits").addEventListener("click", function (e) { var st = e.target.closest("[data-trailer]"); if (st) playTrailer(st); });
  $("#credits").addEventListener("keydown", function (e) { var st = e.target.closest("[data-trailer]"); if (st && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); playTrailer(st); } });
  lb.addEventListener("click", function (e) { if (e.target === lb) closeVideo(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !lb.hidden) closeVideo(); });

  /* Contacto: al pulsar el sobre se despliega la dirección de correo (y se copia); un segundo clic abre el correo */
  (function mailReveal() {
    var m = document.querySelector(".fin-links .is-mail"); if (!m) return;
    m.addEventListener("click", function (e) {
      if (m.classList.contains("is-open")) return;          // ya visible: abre el programa de correo
      e.preventDefault(); m.classList.add("is-open");
      if (navigator.clipboard) navigator.clipboard.writeText("martasalas@me.com").then(function () {
        m.setAttribute("data-copied", "Copiado"); setTimeout(function () { m.removeAttribute("data-copied"); }, 1800);
      }, function () {});
    });
  })();

  /* =========================================================
     5. TRAYECTORIA: filtros y búsqueda
     ========================================================= */
  var total = D.credits.reduce(function (n, c) { return n + c.items.length; }, 0);
  $("#totalCredits").textContent = total;
  var current = "Todo", query = "";
  // Color de cada categoría = color de su pista en la línea de tiempo de START
  var TRACK_COLOR = {
    "Largometrajes y TV movies": "cine", "Cortometrajes": "cine",
    "Series de ficción": "series",
    "Documental y reportaje": "doc", "Programas de TV": "doc", "Musical": "doc", "Publicidad": "doc", "Otros": "doc",
    "Ayudante de montaje": "assist", "Script": "assist"
  };
  var GROUPS = [
    { id: "montaje", title: "Montaje", cats: ["Largometrajes y TV movies", "Cortometrajes", "Series de ficción", "Documental y reportaje", "Programas de TV", "Musical", "Publicidad", "Otros"].filter(function (c) { return byCat[c]; }) },
    { id: "assist", title: "Ayudante de montaje y script", cats: ["Ayudante de montaje", "Script"] }
  ];
  var chipHtml = function (c, n) {
    return '<button class="chip' + (c === current ? " is-active" : "") + '" data-cat="' + esc(c) + '" data-trk="' + (TRACK_COLOR[c] || "all") + '">' +
      '<i class="chip-sw" aria-hidden="true"></i>' + esc(c) + "<small>" + n + "</small></button>";
  };
  $("#chips").innerHTML = chipHtml("Todo", total) + GROUPS.map(function (g) {
    return '<span class="chip-group"><span class="chip-label">' + g.title + "</span>" +
      g.cats.map(function (c) { return chipHtml(c, byCat[c].length); }).join("") + "</span>";
  }).join("");
  $("#chips").addEventListener("click", function (e) {
    var b = e.target.closest(".chip"); if (!b) return;
    current = b.dataset.cat;
    $$(".chip").forEach(function (x) { x.classList.toggle("is-active", x === b); });
    renderCredits();
  });
  var norm = function (s) { return String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); };
  $("#q").addEventListener("input", function (e) { query = norm(e.target.value.trim()); renderCredits(); });
  function renderCredits() {
    var html = "", count = 0;
    GROUPS.forEach(function (g) {
      var part = "", cols = { L: "", R: "" };
      // columnas fijas: izquierda Largometrajes y Series; derecha Documental y Cortometrajes; el resto, donde haya menos
      var COL = { "Largometrajes y TV movies": "L", "Series de ficción": "L", "Documental y reportaje": "R", "Cortometrajes": "R",
        "Programas de TV": "L", "Musical": "L", "Publicidad": "R", "Otros": "R", "Ayudante de montaje": "L", "Script": "R" };
      var ORDER_C = ["Largometrajes y TV movies", "Documental y reportaje", "Series de ficción", "Cortometrajes", "Musical", "Programas de TV", "Publicidad", "Otros", "Ayudante de montaje", "Script"];
      g.cats.slice().sort(function (a, b) { return ORDER_C.indexOf(a) - ORDER_C.indexOf(b); }).forEach(function (cat) {
        if (current !== "Todo" && cat !== current) return;
        var items = byCat[cat].filter(function (it) { return !query || norm(it.join(" ")).indexOf(query) !== -1; });
        if (!items.length) return;
        count += items.length;
        var gh = '<div class="credit-group" data-trk="' + TRACK_COLOR[cat] + '"><h3 class="credit-cat"><span class="cat-t">' + esc(cat) + '</span> <span class="count">' + items.length + "</span></h3><ul>" +
          items.map(function (it) {
            return '<li><span class="yr">' + esc(it[0]) + '</span><span class="ct"><strong>' + esc(it[1]) + "</strong>" + (it[2] ? "<span>" + esc(it[2]) + "</span>" : "") + "</span></li>";
          }).join("") + "</ul></div>";
        cols[COL[cat] || "L"] += gh; part += gh;
      });
      if (part) html += '<h3 class="credits-section">' + g.title + '</h3><div class="credits credits-2col"><div class="credits-col">' + cols.L + '</div><div class="credits-col">' + cols.R + "</div></div>";
    });
    $("#credits").innerHTML = html;
    if (typeof linkTrailers === "function") linkTrailers();
    $("#empty").hidden = count > 0;
    layoutNle(); // la altura de la sección cambia: recalcula la secuencia
  }

  /* =========================================================
     6. DOCENCIA Y FORMACIÓN
     ========================================================= */
  var rowsHtml = function (arr) {
    return arr.map(function (r) {
      return '<li class="reveal"><span class="yr">' + esc(r[0]) + "</span><div><strong>" + esc(r[1]) + "</strong>" + (r[2] ? "<span>" + esc(r[2]) + "</span>" : "") + "</div></li>";
    }).join("");
  };
  $("#teaching").innerHTML = rowsHtml(D.teaching);
  $("#training").innerHTML = rowsHtml(D.training);
  $("#year").textContent = new Date().getFullYear();

  renderCredits();
  window.addEventListener("load", layoutNle);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layoutNle);

  /* Aparición al hacer scroll */
  var reveals = $$(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) reveals.forEach(function (el) { el.classList.add("is-in"); });
  else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -6% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* =========================================================
     Monitor: suciedad y rayas de la copia de 35 mm animadas
     Cada fotograma (a 18 fps, como un proyector) trae su propio polvo y pelos;
     las rayas verticales duran varios fotogramas y bailan un poco; la luz parpadea levemente.
     ========================================================= */
  (function () {
    var scr = document.getElementById("monScreen"); if (!scr || reduceMotion) return;
    var cv = document.createElement("canvas"); cv.className = "mon-dirt"; cv.setAttribute("aria-hidden", "true");
    scr.appendChild(cv);
    var ctx = cv.getContext("2d"), W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
    function size() { var r = scr.getBoundingClientRect(); W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    size(); window.addEventListener("resize", size);
    var rnd = Math.random, scratches = [], running = false, last = 0, FPS = 18;
    /* La textura de la imagen cambia con el año del timeline: de lo digital limpio de hoy (2016 en adelante)
       al vídeo (hacia 2000-2008, con líneas y sangrado de color) y a la copia de 35 mm de los 90 (grano, polvo, rayas, parpadeo).
       Mientras se ve «Work in progress», el monitor conserva el aspecto de proyección. */
    var frameEl = document.getElementById("monFrame"), fmtEl = document.getElementById("monFmt");
    var era = { f: 1, v: 0 };
    function eraOf(y) {
      var f = Math.max(0, Math.min(1, (2016 - y) / 20));
      var v = Math.max(0, 1 - Math.abs(y - 2003) / 7);
      return { f: f, v: v };
    }
    function fmtOf(y) { return y < 2000 ? "35 mm" : y < 2008 ? "Vídeo SD" : y < 2016 ? "HD" : "Digital 4K"; }
    function applyEra() {
      var e = frameEl && !frameEl.hidden ? era : { f: 1, v: 0 };
      scr.style.setProperty("--film", e.f.toFixed(3)); scr.style.setProperty("--video", e.v.toFixed(3));
      return e;
    }
    window.__monEra = function (y) {
      era = eraOf(y); applyEra();
      if (fmtEl) fmtEl.textContent = fmtOf(Math.floor(y));
    };
    function frame() {
      ctx.clearRect(0, 0, W, H);
      var e = applyEra(), f = e.f;
      if (fmtEl) fmtEl.hidden = !(frameEl && !frameEl.hidden);
      scr.style.setProperty("--flicker", (1 - 0.06 * f + rnd() * 0.08 * f).toFixed(3));
      scr.style.setProperty("--gx", Math.floor(rnd() * 160) + "px"); scr.style.setProperty("--gy", Math.floor(rnd() * 160) + "px");
      if (f < 0.04) { scratches = []; return; }
      ctx.globalAlpha = Math.min(1, 0.15 + f);
      // rayas verticales: nacen de vez en cuando, viven unos fotogramas y se desplazan un poco
      if (rnd() < 0.08 * f && scratches.length < 3) scratches.push({ x: rnd() * W, life: 6 + rnd() * 30, w: 0.6 + rnd() * 1.1, light: rnd() < 0.6, a: 0.25 + rnd() * 0.35 });
      scratches = scratches.filter(function (k) { return --k.life > 0; });
      scratches.forEach(function (k) {
        k.x += (rnd() - 0.5) * 1.6;
        ctx.strokeStyle = k.light ? "rgba(255,244,222," + (k.a * (0.6 + rnd() * 0.4)) + ")" : "rgba(10,6,3," + (k.a + 0.15) + ")";
        ctx.lineWidth = k.w; ctx.beginPath();
        var y0 = rnd() < 0.3 ? rnd() * H * 0.5 : 0, y1 = rnd() < 0.3 ? H * (0.5 + rnd() * 0.5) : H;
        ctx.moveTo(k.x, y0); ctx.lineTo(k.x + (rnd() - 0.5) * 2, y1); ctx.stroke();
      });
      // polvo: puntos claros y oscuros distintos en cada fotograma
      var n = Math.round((3 + Math.floor(rnd() * 9)) * f);
      for (var i = 0; i < n; i++) {
        var dark = rnd() < 0.7, r = 0.5 + rnd() * (rnd() < 0.1 ? 3.5 : 1.4);
        ctx.fillStyle = dark ? "rgba(8,5,2," + (0.45 + rnd() * 0.4) + ")" : "rgba(255,246,228," + (0.35 + rnd() * 0.4) + ")";
        ctx.beginPath(); ctx.ellipse(rnd() * W, rnd() * H, r, r * (0.6 + rnd() * 0.6), rnd() * 3, 0, 6.3); ctx.fill();
      }
      // pelos y fibras: de vez en cuando, una curva fina
      if (rnd() < 0.22 * f) {
        var x = rnd() * W, y = rnd() * H, L = 14 + rnd() * 40;
        ctx.strokeStyle = "rgba(8,5,2," + (0.4 + rnd() * 0.35) + ")"; ctx.lineWidth = 0.7 + rnd() * 0.6; ctx.beginPath(); ctx.moveTo(x, y);
        ctx.bezierCurveTo(x + (rnd() - 0.5) * L, y + (rnd() - 0.5) * L, x + (rnd() - 0.5) * L, y + (rnd() - 0.5) * L, x + (rnd() - 0.5) * L, y + (rnd() - 0.5) * L); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    function loop(t) { if (!running) return; if (t - last > 1000 / FPS) { last = t; frame(); } requestAnimationFrame(loop); }
    var vis = new IntersectionObserver(function (es) {
      var on = es[0].isIntersecting && !document.hidden;
      if (on && !running) { running = true; size(); requestAnimationFrame(loop); } else if (!on) running = false;
    });
    vis.observe(scr);
    document.addEventListener("visibilitychange", function () { if (document.hidden) running = false; else { var r = scr.getBoundingClientRect(); if (r.bottom > 0 && r.top < innerHeight && !running) { running = true; requestAnimationFrame(loop); } } });
  })();
})();
