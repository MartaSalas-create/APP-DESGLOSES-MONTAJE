/* ==========================================================================
   ZOOM DENTRO DE UNA GRÁFICA SVG + PANTALLA COMPLETA (reutilizable)
   Pellizco con dos dedos, rueda del ratón, pinza del trackpad, arrastrar el
   fondo para moverse. El estado (zoom y encuadre) se conserva al redibujar.
   ========================================================================== */
(function () {
  'use strict';
  const S = {};                       // estado por gráfica: { z, cx, cy, full }
  const ZMIN = 1, ZMAX = 8;
  const st = k => (S[k] = S[k] || { z: 1, cx: null, cy: null, full: false });
  const base = svg => (svg.dataset.fullvb || svg.getAttribute('viewBox') || '0 0 100 100').split(/[\s,]+/).map(Number);

  function vb(k, svg) {
    const s = st(k), [bx, by, BW, BH] = base(svg);
    if (s.cx == null) { s.cx = bx + BW / 2; s.cy = by + BH / 2; }
    const w = BW / s.z, h = BH / s.z;
    s.cx = Math.max(bx + w / 2, Math.min(bx + BW - w / 2, s.cx));
    s.cy = Math.max(by + h / 2, Math.min(by + BH - h / 2, s.cy));
    return [s.cx - w / 2, s.cy - h / 2, w, h];
  }
  function apply(k) {
    const r = reg[k]; if (!r || !r.svg.isConnected) return;
    const s = st(k);
    r.svg.setAttribute('viewBox', vb(k, r.svg).map(v => Math.round(v * 10) / 10).join(' '));
    r.wrap.classList.toggle('zv-zoomed', s.z > 1.001);
    r.wrap.classList.toggle('zv-full', s.full);
    document.body.classList.toggle('zv-full-on', Object.values(S).some(x => x.full));
    document.querySelectorAll(`[data-zv-pct="${k}"]`).forEach(e => { e.textContent = Math.round(s.z * 100) + '%'; });
    document.querySelectorAll(`[data-zv-key="${k}"][data-zv-d]`).forEach(b => { b.disabled = +b.dataset.zvD < 0 ? s.z <= ZMIN + 1e-6 : s.z >= ZMAX - 1e-6; });
    bar(k);
  }
  // escala real de la imagen en pantalla (preserveAspectRatio por defecto: «meet»)
  function geom(k) {
    const r = reg[k]; const rc = r.svg.getBoundingClientRect(); const [x, y, w, h] = vb(k, r.svg);
    const sc = Math.min(rc.width / w, rc.height / h);
    return { rc, x, y, w, h, sc, ox: (rc.width - w * sc) / 2, oy: (rc.height - h * sc) / 2 };
  }
  function zoomAt(k, cx, cy, f) {
    const r = reg[k]; if (!r) return; const s = st(k);
    const nz = Math.max(ZMIN, Math.min(ZMAX, s.z * f)); if (Math.abs(nz - s.z) < 1e-4) return;
    const g = geom(k); const [, , BW, BH] = base(r.svg);
    const px = g.x + (cx - g.rc.left - g.ox) / g.sc, py = g.y + (cy - g.rc.top - g.oy) / g.sc;
    const rx = (px - g.x) / g.w, ry = (py - g.y) / g.h, nw = BW / nz, nh = BH / nz;
    s.z = nz; s.cx = px - rx * nw + nw / 2; s.cy = py - ry * nh + nh / 2;
    apply(k);
  }
  function panBy(k, dx, dy) { const g = geom(k); const s = st(k); s.cx -= dx / g.sc; s.cy -= dy / g.sc; apply(k); }
  function fit(k) { const s = st(k); s.z = 1; s.cx = null; apply(k); }
  function setFull(k, on) { st(k).full = on; apply(k); if (reg[k] && reg[k].onResize) reg[k].onResize(); }

  // barra flotante en pantalla completa
  function bar(k) {
    const s = st(k); let b = document.getElementById('zvBar-' + k);
    if (s.full && !b) {
      b = document.createElement('div'); b.id = 'zvBar-' + k; b.className = 'map-full-bar no-print';
      b.innerHTML = `<button class="btn btn-small" data-action="zv-zoom" data-zv-key="${k}" data-zv-d="-1">−</button><b data-zv-pct="${k}">${Math.round(s.z * 100)}%</b><button class="btn btn-small" data-action="zv-zoom" data-zv-key="${k}" data-zv-d="1">+</button><button class="btn btn-small" data-action="zv-fit" data-zv-key="${k}">Ver entero</button><button class="btn btn-small btn-primary" data-action="zv-full-off" data-zv-key="${k}">✕ Salir</button>`;
      document.body.appendChild(b);
    }
    if (!s.full && b) b.remove();
  }

  const reg = {};
  /**
   * attach(clave, contenedor, svg, { skip: 'selector de elementos que se arrastran' })
   * Llamar después de cada redibujado: aplica el zoom guardado y activa los gestos.
   */
  function attach(k, wrap, svg, opt) {
    if (!wrap || !svg) return;
    opt = opt || {};
    if (!svg.dataset.fullvb) svg.dataset.fullvb = svg.getAttribute('viewBox');
    reg[k] = { wrap, svg, skip: opt.skip || '', onResize: opt.onResize };
    apply(k);
    if (wrap.dataset.zvBound) return;
    wrap.dataset.zvBound = '1';
    const touches = new Map(); let pinch = null;
    const two = () => { const [a, b] = Array.from(touches.values()); return { d: Math.hypot(a.x - b.x, a.y - b.y), x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; };
    wrap.addEventListener('pointerdown', e => {
      if (e.pointerType === 'touch') {
        touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (touches.size === 2) { pinch = two(); return; }
      }
      const r = reg[k]; if (!r || (r.skip && e.target.closest(r.skip))) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      // con zoom (o a pantalla completa) arrastrar el fondo mueve el encuadre
      if (st(k).z <= 1.001 && !st(k).full && e.pointerType === 'touch') return;
      let lx = e.clientX, ly = e.clientY, moved = false; const sx = lx, sy = ly;
      const mv = ev => {
        if (touches.size > 1) return;
        if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 5) return;
        moved = true; panBy(k, ev.clientX - lx, ev.clientY - ly); lx = ev.clientX; ly = ev.clientY;
      };
      const up = () => { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); document.removeEventListener('pointercancel', up); };
      document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up); document.addEventListener('pointercancel', up);
    });
    wrap.addEventListener('pointermove', e => {
      if (!touches.has(e.pointerId)) return;
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (touches.size !== 2 || !pinch) return;
      const t = two(); zoomAt(k, t.x, t.y, t.d / (pinch.d || t.d)); panBy(k, t.x - pinch.x, t.y - pinch.y); pinch = t;
    });
    const end = e => { touches.delete(e.pointerId); if (touches.size < 2) pinch = null; };
    wrap.addEventListener('pointerup', end); wrap.addEventListener('pointercancel', end);
    wrap.addEventListener('wheel', e => {
      const mouseWheel = e.deltaMode === 1 || (e.deltaX === 0 && Math.abs(e.deltaY) >= 40 && Number.isInteger(e.deltaY));
      if (e.ctrlKey || mouseWheel) { e.preventDefault(); zoomAt(k, e.clientX, e.clientY, Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015))); }
      else if (st(k).z > 1.001 || st(k).full) { e.preventDefault(); panBy(k, -e.deltaX, -e.deltaY); }
    }, { passive: false });
    let g0 = 1;
    wrap.addEventListener('gesturestart', e => { e.preventDefault(); g0 = 1; });
    wrap.addEventListener('gesturechange', e => { if (touches.size < 2) { e.preventDefault(); zoomAt(k, e.clientX, e.clientY, e.scale / g0); g0 = e.scale; } });
  }

  // botones para la barra de herramientas de cada gráfica
  const controls = k => `<span class="zoom-ctl no-print" title="Zoom dentro de la gráfica: pellizca con dos dedos, rueda del ratón o pinza del trackpad. Con zoom, arrastra el fondo para moverte."><span class="muted">Zoom</span><button class="btn btn-small" data-action="zv-zoom" data-zv-key="${k}" data-zv-d="-1" ${st(k).z <= ZMIN ? 'disabled' : ''}>−</button><b data-zv-pct="${k}">${Math.round(st(k).z * 100)}%</b><button class="btn btn-small" data-action="zv-zoom" data-zv-key="${k}" data-zv-d="1">+</button><button class="btn btn-small" data-action="zv-fit" data-zv-key="${k}">Ver entero</button><button class="btn btn-small" data-action="zv-full" data-zv-key="${k}">⛶ Pantalla completa</button></span>`;

  const A = window.DesgloseApp;
  A.actions['zv-zoom'] = el => { const k = el.dataset.zvKey, r = reg[k]; if (!r) return; const rc = r.svg.getBoundingClientRect(); zoomAt(k, rc.left + rc.width / 2, rc.top + rc.height / 2, +el.dataset.zvD > 0 ? 1.25 : 0.8); };
  A.actions['zv-fit'] = el => fit(el.dataset.zvKey);
  A.actions['zv-full'] = el => setFull(el.dataset.zvKey, true);
  A.actions['zv-full-off'] = el => setFull(el.dataset.zvKey, false);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') Object.keys(S).forEach(k => { if (S[k].full) setFull(k, false); }); });

  window.ZoomView = { attach, controls, fit, state: st };
})();
