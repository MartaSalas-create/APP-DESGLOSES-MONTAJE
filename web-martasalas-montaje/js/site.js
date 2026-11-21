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
  var names = ["Start", "Trabajos en pantalla", "Reel", "Trayectoria", "Docencia", "Formación", "Contacto"];
  var sections = navClips.map(function (a) { return $(a.getAttribute("href")); });
  navClips.forEach(function (a, i) { a.setAttribute("data-n", i === 0 || i === 6 ? "" : String(i)); });
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
    label.textContent = (idx === 0 ? "Start · martasalas.com" : idx === 6 ? "Picture lock · " + names[idx] : "Bobina " + idx + " · " + names[idx]);
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
  document.body.insertAdjacentHTML("beforeend", '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="grease"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="1.6"/><feComponentTransfer><feFuncA type="discrete" tableValues="0 .85 1 1"/></feComponentTransfer></filter></svg>');
  // al entrar en pantalla, cada rótulo arranca como el principio de una bobina de 35 mm (una sola vez)
  if (!reduceMotion && "IntersectionObserver" in window) {
    var reelIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.replace("is-waiting", "is-projected");
        reelIO.unobserve(en.target);
      });
    }, { rootMargin: "0px 0px -12% 0px" });
    $$(".reel-label").forEach(function (k) { k.classList.add("is-waiting"); reelIO.observe(k); });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", function () { clearTimeout(layoutNle.t); layoutNle.t = setTimeout(layoutNle, 120); });

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
      '<i class="trk-sw" aria-hidden="true"></i><b>' + p[0] + "</b><em>&nbsp;· " + p[1] + "</em></button>";
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
    else if (active.length <= 3) nowEl.innerHTML = active.map(label).join(" · ");
    else nowEl.innerHTML = '<span class="now-short">' + active.slice(0, 3).map(label).join(" · ") +
      ' <button type="button" class="now-more" aria-expanded="false">+' + (active.length - 3) + " más</button></span>" +
      '<span class="now-full">' + active.map(label).join(" · ") + ' <button type="button" class="now-more" aria-expanded="true">ver menos</button></span>';
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
  }

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
    stopPlay(); clearTimeout(idleTimer);
    var r = range();
    var START = r ? r[0] + 0.5 : Y1, END = r ? r[1] : Y0;
    var inside = lastYv < START - 0.05 && lastYv > END + 0.05;   // reanuda desde donde estaba
    var from = inside ? lastYv : START;
    var DUR = Math.max(600, 9000 * (from - END) / span), t0 = null;
    setYear(from); showFrame(true);
    tPlay.innerHTML = svgUse("i-pause"); tPlay.classList.add("on"); tPlay.setAttribute("aria-label", "Pausa (espacio)");
    auto = requestAnimationFrame(function step(ts) {
      if (t0 === null) t0 = ts + (delay || 0);
      var k = Math.max(0, Math.min(1, (ts - t0) / DUR));
      setYear(from + k * (END - from));
      if (k < 1) auto = requestAnimationFrame(step);
      else { stopPlay(); if (r) idleSoon(6000); else idleSoon(1800, true); } // sin tramo, vuelve al presente
    });
  }
  function togglePlay() { if (auto) { stopPlay(); idleSoon(8000); } else play(0); }

  transportEl.addEventListener("click", function (e) {
    var b = e.target.closest(".avid-btn"); if (!b) return;
    var act = b.dataset.act;
    if (act === "play") togglePlay();
    else if (act === "prev") jump(1);
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

  $("#awards").innerHTML = D.awards.map(function (a) {
    return '<div class="award reveal"><span class="mono">' + esc(a.year) + "</span><b>" + esc(a.text) + "</b><span>" + esc(a.work) + "</span></div>";
  }).join("");

  /* =========================================================
     4. REEL
     ========================================================= */
  var reelGrid = $("#reelGrid");
  function renderReel(kind) {
    reelGrid.innerHTML = D.reels[kind].map(function (v, i) {
      return '<a class="reel-item" href="https://www.youtube.com/watch?v=' + esc(v.id) + '" target="_blank" rel="noopener" data-id="' + esc(v.id) + '" aria-label="Reproducir vídeo ' + (i + 1) + '">' +
        '<img src="https://i.ytimg.com/vi/' + esc(v.id) + '/hqdefault.jpg" alt="" loading="lazy" onerror="this.parentNode.classList.add(\'no-thumb\');this.remove()">' +
        '<span class="play">▶</span><span class="reel-n">' + (kind === "tv" ? "Series" : "Cine") + " · Clip " + pad(i + 1) + "</span></a>";
    }).join("");
  }
  renderReel("tv");
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
  reelGrid.addEventListener("click", function (e) {
    var b = e.target.closest(".reel-item"); if (!b || framed) return;
    e.preventDefault(); openVideo(b.dataset.id);
  });
  $("#lbClose").addEventListener("click", closeVideo);
  lb.addEventListener("click", function (e) { if (e.target === lb) closeVideo(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !lb.hidden) closeVideo(); });

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
      var part = "";
      g.cats.forEach(function (cat) {
        if (current !== "Todo" && cat !== current) return;
        var items = byCat[cat].filter(function (it) { return !query || norm(it.join(" ")).indexOf(query) !== -1; });
        if (!items.length) return;
        count += items.length;
        part += '<div class="credit-group" data-trk="' + TRACK_COLOR[cat] + '"><h3 class="credit-cat">' + esc(cat) + ' <span class="count">' + items.length + "</span></h3><ul>" +
          items.map(function (it) {
            return '<li><span class="yr">' + esc(it[0]) + '</span><span class="ct"><strong>' + esc(it[1]) + "</strong>" + (it[2] ? "<span>" + esc(it[2]) + "</span>" : "") + "</span></li>";
          }).join("") + "</ul></div>";
      });
      if (part) html += '<h3 class="credits-section">' + g.title + '</h3><div class="credits">' + part + "</div>";
    });
    $("#credits").innerHTML = html;
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
})();
