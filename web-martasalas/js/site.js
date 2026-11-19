(function () {
  "use strict";
  var D = window.SITE;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (t) {
    return String(t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Navegación ---------- */
  var nav = $("#nav"), toggle = $("#navToggle"), links = $("#navLinks");
  toggle.addEventListener("click", function () {
    var open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", open);
  });
  links.addEventListener("click", function (e) {
    if (e.target.tagName === "A") { nav.classList.remove("is-open"); toggle.setAttribute("aria-expanded", "false"); }
  });
  var onScroll = function () { nav.classList.toggle("is-scrolled", window.scrollY > 24); };
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  // Marca la sección visible en el menú
  var navAnchors = Array.prototype.slice.call(links.querySelectorAll("a"));
  if ("IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navAnchors.forEach(function (a) { a.classList.toggle("is-current", a.getAttribute("href") === "#" + en.target.id); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    navAnchors.forEach(function (a) { var t = $(a.getAttribute("href")); if (t) spy.observe(t); });
  }

  /* ---------- Código de tiempo del hero ---------- */
  var tc = $("#timecode");
  if (tc && !reduceMotion) {
    var t0 = performance.now();
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };
    (function tick(now) {
      var f = Math.floor((now - t0) / (1000 / 25));
      var fr = f % 25, s = Math.floor(f / 25) % 60, m = Math.floor(f / 1500) % 60;
      tc.textContent = "01:" + pad(m) + ":" + pad(s) + ":" + pad(fr);
      requestAnimationFrame(tick);
    })(t0);
  }

  /* ---------- Cifras calculadas a partir de los datos ---------- */
  var total = D.credits.reduce(function (n, c) { return n + c.items.length; }, 0);
  var seriesCat = D.credits.filter(function (c) { return c.cat === "Series de ficción"; })[0];
  var seriesN = seriesCat ? new Set(seriesCat.items.map(function (i) { return i[1].split(" · ")[0]; })).size : 0;
  var sc = $('[data-stat="credits"]'); if (sc) sc.textContent = total;
  var ss = $('[data-stat="series"]'); if (ss) ss.textContent = seriesN;

  /* ---------- Trabajos destacados ---------- */
  $("#works").innerHTML = D.featured.map(function (w, i) {
    var poster = w.poster
      ? '<img class="work-poster" src="' + esc(w.poster) + '" alt="Cartel de ' + esc(w.title) + '" loading="lazy">'
      : '<div class="work-slate"><span class="mono" aria-hidden="true">' + String(i + 1).padStart(2, "0") + '</span><h3 class="slate-title">' + esc(w.title) + "</h3></div>";
    return '<article class="work reveal' + (w.poster ? " has-poster" : "") + '">' + poster +
      '<div class="work-body">' +
      '<span class="mono dim">' + esc(w.years) + " · " + esc(w.kind) + "</span>" +
      (w.poster ? "<h3>" + esc(w.title) + "</h3>" : "") +
      "<p>" + esc(w.info) + "</p>" +
      (w.tag ? '<span class="pill">' + esc(w.tag) + "</span>" : "") +
      "</div></article>";
  }).join("");

  /* ---------- Premios (cinta continua) ---------- */
  var awardsHtml = D.awards.map(function (a) {
    return '<span class="award"><b>' + esc(a.year) + "</b> " + esc(a.text) + " <i>— " + esc(a.work) + "</i></span>";
  }).join('<span class="dot">✦</span>');
  $("#awards").innerHTML = '<div class="awards-run">' + awardsHtml + '<span class="dot">✦</span></div>' +
    '<div class="awards-run" aria-hidden="true">' + awardsHtml + '<span class="dot">✦</span></div>';

  /* ---------- Reel ---------- */
  var reelGrid = $("#reelGrid");
  function renderReel(kind) {
    reelGrid.innerHTML = D.reels[kind].map(function (v, i) {
      return '<button class="reel-item reveal is-in" data-id="' + esc(v.id) + '" aria-label="Reproducir vídeo ' + (i + 1) + '">' +
        '<img src="https://i.ytimg.com/vi/' + esc(v.id) + '/hqdefault.jpg" alt="" loading="lazy">' +
        '<span class="play">▶</span>' +
        '<span class="mono reel-n">' + (kind === "tv" ? "TV" : "CINE") + " · " + String(i + 1).padStart(2, "0") + "</span></button>";
    }).join("");
  }
  renderReel("tv");
  document.querySelectorAll("[data-reel]").forEach(function (b) {
    b.addEventListener("click", function () {
      document.querySelectorAll("[data-reel]").forEach(function (x) {
        var on = x === b; x.classList.toggle("is-active", on); x.setAttribute("aria-selected", on);
      });
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
  function closeVideo() {
    lb.hidden = true; lbFrame.innerHTML = ""; document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }
  reelGrid.addEventListener("click", function (e) {
    var b = e.target.closest(".reel-item"); if (b) openVideo(b.dataset.id);
  });
  $("#lbClose").addEventListener("click", closeVideo);
  lb.addEventListener("click", function (e) { if (e.target === lb) closeVideo(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !lb.hidden) closeVideo(); });

  /* ---------- Trayectoria: filtros y búsqueda ---------- */
  var current = "Todo", query = "";
  var cats = ["Todo"].concat(D.credits.map(function (c) { return c.cat; }));
  $("#chips").innerHTML = cats.map(function (c) {
    var n = c === "Todo" ? total : D.credits.filter(function (x) { return x.cat === c; })[0].items.length;
    return '<button class="chip' + (c === current ? " is-active" : "") + '" data-cat="' + esc(c) + '">' + esc(c) + " <small>" + n + "</small></button>";
  }).join("");
  $("#chips").addEventListener("click", function (e) {
    var b = e.target.closest(".chip"); if (!b) return;
    current = b.dataset.cat;
    document.querySelectorAll(".chip").forEach(function (x) { x.classList.toggle("is-active", x === b); });
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
      html += '<div class="credit-group"><h3 class="credit-cat">' + esc(c.cat) + ' <span class="mono dim">' + items.length + "</span></h3><ul>" +
        items.map(function (it) {
          return '<li><span class="mono yr">' + esc(it[0]) + '</span><span class="ct"><strong>' + esc(it[1]) + "</strong>" +
            (it[2] ? "<span>" + esc(it[2]) + "</span>" : "") + "</span></li>";
        }).join("") + "</ul></div>";
    });
    $("#credits").innerHTML = html;
    $("#empty").hidden = count > 0;
  }
  renderCredits();

  /* ---------- Docencia y formación ---------- */
  var listHtml = function (arr) {
    return arr.map(function (r) {
      return '<li class="reveal"><span class="mono yr">' + esc(r[0]) + "</span><div><strong>" + esc(r[1]) + "</strong>" +
        (r[2] ? "<span>" + esc(r[2]) + "</span>" : "") + "</div></li>";
    }).join("");
  };
  $("#teaching").innerHTML = listHtml(D.teaching);
  $("#training").innerHTML = listHtml(D.training);

  $("#year").textContent = new Date().getFullYear();

  /* ---------- Aparición al hacer scroll ---------- */
  var reveals = document.querySelectorAll(".reveal:not(.is-in)");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  }
})();
