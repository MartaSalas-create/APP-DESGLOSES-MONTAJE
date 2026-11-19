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
    var alt = "Cartel de " + p.titulo + " (" + p.anio + ")";
    return '<picture class="' + clase + '">' +
      (p.posterWebp ? '<source srcset="' + esc(p.posterWebp) + '" type="image/webp">' : "") +
      '<img src="' + esc(p.poster) + '" alt="' + esc(alt) + '"' + (lazy ? ' loading="lazy" decoding="async"' : "") + ' width="600" height="900">' +
      "</picture>";
  }

  /* ---------- Filtros ---------- */
  function pintaFiltros() {
    var n = function (cat) { return proyectos.filter(function (p) { return cat === "Todos" || p.categoria === cat; }).length; };
    filtros.innerHTML = ["Todos", "Cine", "Televisión"].map(function (cat) {
      var on = cat === actual;
      return '<button type="button" class="filmo-filter' + (on ? " is-active" : "") + '" data-cat="' + cat + '" aria-pressed="' + on + '">' +
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
        '<span class="filmo-cap"><strong>' + esc(p.titulo) + '</strong><span class="mono">' + esc(p.anio) + " · " + esc(p.categoria) + "</span></span>" +
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
    modal.querySelector(".fm-meta").textContent = p.anio + " · " + p.categoria;
    modal.querySelector(".fm-title").textContent = p.titulo;
    var rol = modal.querySelector(".fm-rol");
    rol.hidden = !p.rol; rol.querySelector("span").textContent = p.rol || "";
    var sin = modal.querySelector(".fm-sinopsis");
    sin.textContent = p.sinopsis || "Sinopsis pendiente.";
    sin.classList.toggle("is-empty", !p.sinopsis);
    modal.querySelector(".fm-video").innerHTML = video
      ? '<iframe src="' + esc(video) + '" title="Vídeo de ' + esc(p.titulo) + '" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="lazy"></iframe>'
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

  /* ---------- Carga de datos ---------- */
  fetch(DATA_URL)
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (data) {
      proyectos = data;
      pintaFiltros(); pintaGrid();
      window.dispatchEvent(new Event("resize")); // la altura cambia: recalcula la secuencia de la cabecera
    })
    .catch(function () {
      grid.innerHTML = '<li class="filmo-error">No se ha podido cargar la filmografía. Si estás abriendo el archivo en local, usa un servidor: <code>python3 -m http.server</code>.</li>';
    });
})();
