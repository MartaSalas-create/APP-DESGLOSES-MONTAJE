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
     1. CABECERA: la web como secuencia
     Cada sección es un clip con ancho proporcional a su duración (altura),
     el cabezal sigue el scroll y el código de tiempo corre de 00:59:50:00 a 02:00:00:00.
     ========================================================= */
  var track = $("#nleTrack"), head = $("#nleHead"), tcEl = $("#tc"), label = $("#nleLabel");
  var navClips = $$("a", track);
  var names = ["Inicio", "Trabajos en pantalla", "Reel", "Trayectoria", "Docencia", "Formación", "Picture lock · Contacto"];
  var sections = navClips.map(function (a) { return $(a.getAttribute("href")); });
  navClips.forEach(function (a, i) { a.setAttribute("data-n", i === 0 ? "00" : i === 6 ? "FIN" : "0" + i); });
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
    label.textContent = (idx === 0 ? "Secuencia · martasalas.com" : idx === 6 ? "Fin · " + names[idx] : "Bobina 0" + idx + " · " + names[idx]);
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
  var pct = function (y) { return ((y - Y0) / span) * 100; };
  var byCat = {}; D.credits.forEach(function (c) { byCat[c.cat] = c.items; });
  var pick = function (cats) {
    var out = [];
    cats.forEach(function (c) { (byCat[c] || []).forEach(function (it) { var r = yearsOf(it[0]); out.push({ a: r[0], b: r[1], t: it[1], d: it[2], cat: c }); }); });
    return out;
  };
  var listRows = function (arr, cat) { return arr.map(function (r) { var y = yearsOf(r[0]); return { a: y[0], b: y[1], t: r[1], d: r[2], cat: cat }; }); };
  var TRACKS = [
    { id: "cine", lab: "V2 · Cine", items: pick(["Largometrajes y TV movies", "Cortometrajes"]) },
    { id: "series", lab: "V1 · Series", items: pick(["Series de ficción", "Programas de TV", "Ayudante de montaje", "Script"]) },
    { id: "doc", lab: "A1 · Doc", items: pick(["Documental y reportaje", "Musical", "Publicidad", "Otros"]) },
    { id: "wave", lab: "A2 · Docencia", items: listRows(D.teaching, "Docencia") },
    { id: "train", lab: "A3 · Formación", items: listRows(D.training, "Formación") }
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
  labelsEl.innerHTML = "<span></span>" + TRACKS.map(function (t) { var p = t.lab.split(" · "); return "<span><b>" + p[0] + "</b><em>&nbsp;· " + p[1] + "</em></span>"; }).join("");
  var rul = "";
  for (var y = Y0; y <= Y1; y++) {
    var big = y % 5 === 0;
    rul += '<i class="' + (big ? "big" : "") + '" style="left:' + pct(y) + '%"></i>';
    if (big) rul += '<span style="left:' + pct(y) + '%">' + y + "</span>";
  }
  ruler.innerHTML = rul;
  tracksEl.innerHTML = TRACKS.map(function (t) {
    t.clips = buildClips(t.items);
    return '<div class="ctrack t-' + t.id + '">' + t.clips.map(function (c, i) {
      var title = c.items[0].t.split(" · ")[0] + (c.items.length > 1 ? " +" + (c.items.length - 1) : "");
      return '<div class="cclip" data-t="' + t.id + '" data-i="' + i + '" style="left:' + pct(c.a) + "%;width:" + (pct(c.b) - pct(c.a)) + '%" title="' + esc(c.a + " · " + c.items.map(function (x) { return x.t; }).join(", ")) + '">' + esc(title) + "</div>";
    }).join("") + "</div>";
  }).join("");

  // el nombre solo se muestra si cabe en el clip
  function fitClipLabels() { $$(".cclip", tracksEl).forEach(function (el) { el.classList.toggle("mini", false); el.classList.toggle("mini", el.scrollWidth > el.clientWidth + 1); }); }
  fitClipLabels();
  window.addEventListener("resize", fitClipLabels);

  var stage = $("#careerStage"), chead = $("#careerHead"), yearEl = $("#careerYear"), nowEl = $("#careerNow");
  var mon = { quote: $("#monQuote"), frame: $("#monFrame"), meta: $("#monMeta"), title: $("#monTitle"), detail: $("#monDetail"), more: $("#monMore"), tc: $("#monTc") };
  var tPlay = $("#tPlay"), tPrev = $("#tPrev"), tNext = $("#tNext");
  var TRACK_OF = {}; TRACKS.forEach(function (t) { t.items.forEach(function (it) { TRACK_OF[it.cat] = t.id; }); });
  var FRAME_BG = {
    cine: "linear-gradient(135deg, #ffa41b, #c96a08)",
    series: "linear-gradient(135deg, #f64a1f, #a8192c)",
    doc: "linear-gradient(135deg, #a8192c, #4a0b14)",
    wave: "linear-gradient(135deg, #1f5a3c, #0f1f17)",
    train: "linear-gradient(135deg, #4a443c, #1a1816)"
  };
  var CAT_LABEL = { "Largometrajes y TV movies": "Largometraje", "Series de ficción": "Serie de ficción", "Documental y reportaje": "Documental",
    "Cortometrajes": "Cortometraje", "Programas de TV": "Programa de TV", "Ayudante de montaje": "Ayudante de montaje" };
  var curYear = null, idleTimer = null;

  // El monitor muestra la frase (en reposo) o el «fotograma» del trabajo bajo el cabezal
  function showFrame(on) {
    mon.frame.hidden = !on; mon.quote.hidden = on;
  }
  function idleSoon(ms) {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(function () { showFrame(false); }, ms);
  }

  function setYear(yv) {
    yv = Math.max(Y0, Math.min(Y1 - 1, yv));
    var yr = Math.floor(yv);
    chead.style.left = pct(Math.min(yv, Y1 - 0.0001)) + "%";
    mon.tc.textContent = framesToTc(TC_START + ((yv - Y0) / span) * (TC_END - TC_START));
    if (yr === curYear) return;
    curYear = yr;
    chead.setAttribute("aria-valuenow", yr);
    yearEl.textContent = yr;
    var active = [];
    TRACKS.forEach(function (t) { t.items.forEach(function (it) { if (it.a <= yr && it.b >= yr) active.push(it); }); });
    var rank = function (it) { return it.cat === "Docencia" || it.cat === "Formación" ? 2 : it.cat === "Ayudante de montaje" || it.cat === "Script" ? 1 : 0; };
    // dentro de cada rango, lo que empieza ese año primero
    active.sort(function (a, b) { return rank(a) - rank(b) || (b.a === yr) - (a.a === yr) || b.a - a.a; });
    var roleOf = function (it) { return it.cat === "Docencia" ? "docencia" : it.cat === "Formación" ? "formación" : it.cat === "Script" ? "script" : it.cat === "Ayudante de montaje" ? "ayte. montaje" : ""; };
    var shown = active.slice(0, 3).map(function (it) { var r = roleOf(it); return "<b>" + esc(it.t) + "</b>" + (r ? " <i>(" + r + ")</i>" : ""); });
    nowEl.innerHTML = shown.length ? shown.join(" · ") + (active.length > 3 ? " <i>+" + (active.length - 3) + " más</i>" : "") : "<i>—</i>";
    $$(".cclip", tracksEl).forEach(function (el) {
      var t = TRACKS.filter(function (x) { return x.id === el.dataset.t; })[0], c = t.clips[+el.dataset.i];
      el.classList.toggle("on", c.a <= yr && c.b > yr);
    });
    // fotograma en el monitor
    var it = active[0];
    if (it) {
      var yrs = it.a === it.b ? it.a : it.a + "–" + it.b;
      mon.meta.textContent = yrs + " · " + (CAT_LABEL[it.cat] || it.cat);
      mon.title.textContent = it.t;
      mon.detail.textContent = it.d || "";
      mon.more.textContent = active.length > 1 ? "+ " + (active.length - 1) + " en la línea de tiempo ese año" : "";
      mon.frame.style.setProperty("--frame-bg", FRAME_BG[TRACK_OF[it.cat]] || FRAME_BG.series);
    } else {
      mon.meta.textContent = yr; mon.title.textContent = "—"; mon.detail.textContent = ""; mon.more.textContent = "";
    }
  }

  var yearFromX = function (x) { var r = stage.getBoundingClientRect(); return Y0 + ((x - r.left) / r.width) * span; };
  var dragging = false, auto = null;
  stage.addEventListener("pointerdown", function (e) {
    dragging = true; stopPlay(); clearTimeout(idleTimer); showFrame(true);
    stage.setPointerCapture(e.pointerId); setYear(yearFromX(e.clientX));
  });
  stage.addEventListener("pointermove", function (e) { if (dragging) setYear(yearFromX(e.clientX)); });
  stage.addEventListener("pointerup", function () { dragging = false; idleSoon(6000); });
  stage.addEventListener("pointercancel", function () { dragging = false; idleSoon(6000); });

  // Cortes: inicios de clip de todas las pistas
  var CUTS = [];
  TRACKS.forEach(function (t) { t.clips.forEach(function (c) { if (CUTS.indexOf(c.a) < 0) CUTS.push(c.a); }); });
  CUTS.sort(function (a, b) { return a - b; });
  function jump(dir) {
    stopPlay(); showFrame(true);
    var y = curYear == null ? 2026 : curYear, target = null;
    if (dir > 0) { for (var i = 0; i < CUTS.length; i++) if (CUTS[i] > y) { target = CUTS[i]; break; } }
    else { for (var j = CUTS.length - 1; j >= 0; j--) if (CUTS[j] < y) { target = CUTS[j]; break; } }
    if (target != null) setYear(target + 0.5);
    idleSoon(8000);
  }
  tPrev.addEventListener("click", function () { jump(-1); });
  tNext.addEventListener("click", function () { jump(1); });
  chead.addEventListener("keydown", function (e) {
    var d = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1, PageDown: -5, PageUp: 5 }[e.key];
    if (e.key === "Home") { stopPlay(); showFrame(true); setYear(Y0); idleSoon(8000); e.preventDefault(); }
    else if (e.key === "End") { stopPlay(); showFrame(true); setYear(Y1 - 1); idleSoon(8000); e.preventDefault(); }
    else if (d) { stopPlay(); showFrame(true); setYear((curYear || 2026) + d + 0.5); idleSoon(8000); e.preventDefault(); }
  });

  // Reproducir: el cabezal recorre la carrera y el monitor va mostrando los trabajos
  function stopPlay() {
    if (auto) { cancelAnimationFrame(auto); auto = null; }
    tPlay.textContent = "▶"; tPlay.setAttribute("aria-label", "Reproducir la carrera");
  }
  function play(delay) {
    stopPlay(); clearTimeout(idleTimer);
    var from = curYear == null || curYear >= 2026 ? Y0 : curYear + 0.5;
    var END = 2026.5, DUR = 9000 * (END - from) / (END - Y0), t0 = null;
    setYear(from); showFrame(true);
    tPlay.textContent = "❚❚"; tPlay.setAttribute("aria-label", "Pausa");
    auto = requestAnimationFrame(function step(ts) {
      if (t0 === null) t0 = ts + (delay || 0);
      var k = Math.max(0, Math.min(1, (ts - t0) / DUR));
      setYear(from + k * (END - from));
      if (k < 1) auto = requestAnimationFrame(step);
      else { stopPlay(); idleSoon(1800); }
    });
  }
  tPlay.addEventListener("click", function () { if (auto) { stopPlay(); idleSoon(8000); } else play(0); });

  // Al cargar, la secuencia se reproduce una vez
  if (reduceMotion) { setYear(2026.5); showFrame(false); }
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
        '<span class="play">▶</span><span class="reel-n">' + (kind === "tv" ? "TV" : "Cine") + " · Clip " + pad(i + 1) + "</span></a>";
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
  var cats = ["Todo"].concat(D.credits.map(function (c) { return c.cat; }));
  $("#chips").innerHTML = cats.map(function (c) {
    var n = c === "Todo" ? total : byCat[c].length;
    return '<button class="chip' + (c === current ? " is-active" : "") + '" data-cat="' + esc(c) + '">' + esc(c) + "<small>" + n + "</small></button>";
  }).join("");
  $("#chips").addEventListener("click", function (e) {
    var b = e.target.closest(".chip"); if (!b) return;
    current = b.dataset.cat;
    $$(".chip").forEach(function (x) { x.classList.toggle("is-active", x === b); });
    renderCredits();
  });
  var norm = function (s) { return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
  $("#q").addEventListener("input", function (e) { query = norm(e.target.value.trim()); renderCredits(); });
  function renderCredits() {
    var html = "", count = 0;
    D.credits.forEach(function (c) {
      if (current !== "Todo" && c.cat !== current) return;
      var items = c.items.filter(function (it) { return !query || norm(it.join(" ")).indexOf(query) !== -1; });
      if (!items.length) return;
      count += items.length;
      html += '<div class="credit-group"><h3 class="credit-cat">' + esc(c.cat) + ' <span class="count">' + items.length + "</span></h3><ul>" +
        items.map(function (it) {
          return '<li><span class="yr">' + esc(it[0]) + '</span><span class="ct"><strong>' + esc(it[1]) + "</strong>" + (it[2] ? "<span>" + esc(it[2]) + "</span>" : "") + "</span></li>";
        }).join("") + "</ul></div>";
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
