/* Filmografía: galería de carteles con filtros y modal de detalle.
   Lee los datos de src/data/proyectos.json (lo genera scripts/descargar-carteles.py).
   Para verla en local hace falta un servidor (p. ej. `python3 -m http.server`), porque
   los navegadores no permiten leer archivos JSON abriendo index.html directamente. */
(function () {
  "use strict";
  var DATA_URL = "src/data/proyectos.json";
  var grid = document.getElementById("filmoGrid");
  var filtros = document.getElementById("filmoFilters");
  var modal = document.getElementById("filmoModal");
  if (!grid || !filtros || !modal) return;

  var esc = function (t) {
    return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  var proyectos = [], actual = "Todos", ultimoFoco = null;

  /* ---------- Vídeo: YouTube o Vimeo ---------- */
  function embedDe(url) {
    if (!url) return null;
    var m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
    if (m) return "https://www.youtube-nocookie.com/embed/" + m[1] + "?rel=0";
    m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (m) return "https://player.vimeo.com/video/" + m[1];
    return null;
  }

  /* ---------- Cartel (WebP con JPG de respaldo) ---------- */
  function cartel(p, clase, lazy) {
    var alt = "Cartel de " + p.titulo + " (" + (p.anioTexto || p.anio) + ")";
    return '<picture class="' + clase + '">' +
      (p.posterWebp ? '<source srcset="' + esc(p.posterWebp) + '" type="image/webp">' : "") +
      '<img src="' + esc(p.poster) + '" alt="' + esc(alt) + '"' + (lazy ? ' loading="lazy" decoding="async"' : "") + ' width="600" height="900">' +
      "</picture>";
  }

  /* ---------- Filtros ---------- */
  function pintaFiltros() {
    var n = function (cat) { return proyectos.filter(function (p) { return cat === "Todos" || p.categoria === cat; }).length; };
    var cats = ["Todos", "Cine", "Series"]; proyectos.forEach(function (p) { if (cats.indexOf(p.categoria) < 0) cats.push(p.categoria); });
    filtros.innerHTML = cats.map(function (cat) {
      var on = cat === actual;
      return '<button type="button" class="filmo-filter' + (on ? " is-active" : "") + '" data-cat="' + cat + '" aria-pressed="' + on + '"><i class="ff-sw" aria-hidden="true"></i>' +
        cat + " <small>(" + n(cat) + ")</small></button>";
    }).join("");
  }
  filtros.addEventListener("click", function (e) {
    var b = e.target.closest(".filmo-filter"); if (!b) return;
    actual = b.dataset.cat; pintaFiltros(); pintaGrid();
  });

  /* ---------- Cuadrícula ---------- */
  function pintaGrid() {
    var lista = proyectos.filter(function (p) { return actual === "Todos" || p.categoria === actual; });
    grid.innerHTML = lista.map(function (p) {
      return '<li class="filmo-item"><button type="button" class="filmo-card" data-id="' + esc(p.id) + '" aria-label="Ver detalles de ' + esc(p.titulo) + '">' +
        cartel(p, "filmo-poster", true) +
        (embedDe(p.videoUrl) ? '<span class="filmo-play" aria-hidden="true">▶ Tráiler</span>' : "") +
        '<span class="filmo-cap"><strong>' + esc(p.titulo) + '</strong><span class="mono">' + esc(p.anioTexto || p.anio) + " · " + esc(p.categoria) + "</span></span>" +
        "</button></li>";
    }).join("");
  }
  grid.addEventListener("click", function (e) {
    var b = e.target.closest(".filmo-card"); if (b) abre(b.dataset.id);
  });

  /* ---------- Modal ---------- */
  function abre(id) {
    var p = proyectos.filter(function (x) { return x.id === id; })[0]; if (!p) return;
    ultimoFoco = document.activeElement;
    var video = embedDe(p.videoUrl);
    modal.querySelector(".fm-poster-wrap").innerHTML = cartel(p, "fm-poster", false);
    modal.querySelector(".fm-meta").textContent = (p.anioTexto || p.anio) + " · " + p.categoria;
    modal.querySelector(".fm-title").textContent = p.titulo;
    var rol = modal.querySelector(".fm-rol");
    rol.hidden = !p.rol; rol.querySelector("span").textContent = p.rol || "";
    var sin = modal.querySelector(".fm-sinopsis");
    sin.textContent = p.sinopsis || "Sinopsis pendiente.";
    sin.classList.toggle("is-empty", !p.sinopsis);
    // dentro de un visor que no admite vídeos incrustados, solo el enlace a YouTube
    var framed = (function () { try { return window.self !== window.top; } catch (err) { return true; } })();
    modal.querySelector(".fm-video").innerHTML = video
      ? (framed ? "" : '<iframe src="' + esc(video) + '" title="Vídeo de ' + esc(p.titulo) + '" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="lazy"></iframe>') +
        '<a class="fm-video-link" href="' + esc(p.videoUrl) + '" target="_blank" rel="noopener">▶ Ver el tráiler en YouTube ↗</a>'
      : "";
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    modal.querySelector(".fm-close").focus();
  }
  function cierra() {
    if (modal.hidden) return;
    modal.hidden = true;
    modal.querySelector(".fm-video").innerHTML = ""; // detiene el vídeo
    document.body.style.overflow = "";
    if (ultimoFoco) ultimoFoco.focus();
  }
  modal.addEventListener("click", function (e) {
    if (e.target === modal || e.target.closest(".fm-close")) cierra();
  });
  document.addEventListener("keydown", function (e) {
    if (modal.hidden) return;
    if (e.key === "Escape") { cierra(); return; }
    if (e.key === "Tab") { // mantiene el foco dentro del modal
      var f = modal.querySelectorAll("button, iframe, a[href]");
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
      else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
    }
  });

  /* ---------- Trayectoria: los títulos con cartel abren su ficha ---------- */
  function clave(t) {
    return String(t).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .split(" · ")[0].replace(/\(.*?\)/g, "").replace(/\s+t\d.*$/, "").replace(/[^a-z0-9ñ ]/g, "").replace(/\s+/g, " ").trim();
  }
  var porTitulo = {};
  function enlazaTrayectoria() {
    var cont = document.getElementById("credits"); if (!cont) return;
    cont.querySelectorAll(".ct > strong").forEach(function (st) {
      var p = porTitulo[clave(st.textContent)];
      if (!p || st.classList.contains("has-ficha")) return;
      st.classList.add("has-ficha"); st.dataset.ficha = p.id;
      st.setAttribute("role", "button"); st.tabIndex = 0;
      st.setAttribute("aria-label", "Ver cartel y ficha de " + p.titulo);
      st.title = "Ver cartel";
    });
  }
  function iniciaEnlaces() {
    proyectos.forEach(function (p) { porTitulo[clave(p.titulo)] = p; });
    var cont = document.getElementById("credits"); if (!cont) return;
    enlazaTrayectoria();
    new MutationObserver(enlazaTrayectoria).observe(cont, { childList: true });
    cont.addEventListener("click", function (e) { var st = e.target.closest("[data-ficha]"); if (st) abre(st.dataset.ficha); });
    cont.addEventListener("keydown", function (e) {
      var st = e.target.closest("[data-ficha]"); if (st && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); abre(st.dataset.ficha); }
    });
  }

  /* ---------- Carga de datos ---------- */
  fetch(DATA_URL)
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (data) {
      // de lo más actual a lo más antiguo (a igual año, se mantiene el orden del JSON)
      proyectos = data.map(function (p, i) { return [p, i]; })
        .sort(function (a, b) { return (b[0].anio - a[0].anio) || (a[1] - b[1]); })
        .map(function (x) { return x[0]; });
      pintaFiltros(); pintaGrid(); iniciaEnlaces();
      window.dispatchEvent(new Event("resize")); // la altura cambia: recalcula la secuencia de la cabecera
    })
    .catch(function () {
      grid.innerHTML = '<li class="filmo-error">No se ha podido cargar la filmografía. Si estás abriendo el archivo en local, usa un servidor: <code>python3 -m http.server</code>.</li>';
    });
})();
