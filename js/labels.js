/* ==========================================================================
   Colocación de etiquetas sin solapes (gráficas SVG)
   Busca para cada etiqueta el hueco libre más cercano a su punto, evitando
   las etiquetas ya colocadas y los obstáculos (puntos, nodos, curva).
   ========================================================================== */
(function () {
  'use strict';
  const textW = (str, fs, bold) => String(str || '').length * fs * (bold ? 0.62 : 0.55);
  const hit = (a, b, pad) => a.x < b.x + b.w + pad && b.x < a.x + a.w + pad && a.y < b.y + b.h + pad && b.y < a.y + a.h + pad;
  const area = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));

  /**
   * items: [{ ax, ay, w, h, gap = 6, prefer: 'up' | 'down', dirs: ['up','down'], noDx }]
   * opts:  { bounds: {x0,y0,x1,y1}, obstacles: [{x,y,w,h}], step = 6, pad = 3 }
   * Devuelve [{ x, y, w, h }] (esquina superior izquierda de cada etiqueta).
   */
  function place(items, opts) {
    const B = opts.bounds, step = opts.step || 6, pad = opts.pad == null ? 3 : opts.pad;
    const placed = [], obst = (opts.obstacles || []).slice();
    return items.map(it => {
      const gap = it.gap == null ? 6 : it.gap;
      const dirs = it.dirs || (it.prefer === 'down' ? ['down', 'up'] : ['up', 'down']);
      const dxs = it.noDx ? [0] : [0, -0.3, 0.3, -0.6, 0.6, -1, 1];
      const cands = [];
      for (let k = 0; k < 60; k++) {
        dirs.forEach((d, di) => {
          const y = d === 'up' ? it.ay - gap - it.h - k * step : d === 'down' ? it.ay + gap + k * step : it.ay - it.h / 2 + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * step;
          if (y < B.y0 || y + it.h > B.y1) return;
          dxs.forEach(f => {
            let x = (d === 'right' ? it.ax + gap : it.ax - it.w / 2) + f * it.w;
            x = Math.max(B.x0, Math.min(B.x1 - it.w, x));
            cands.push({ x, y, w: it.w, h: it.h, cost: k * step + Math.abs(x - (it.ax - it.w / 2)) * 0.6 + di * 14 });
          });
        });
      }
      if (!cands.length) cands.push({ x: Math.max(B.x0, Math.min(B.x1 - it.w, it.ax - it.w / 2)), y: Math.max(B.y0, Math.min(B.y1 - it.h, it.ay - gap - it.h)), w: it.w, h: it.h, cost: 0 });
      cands.sort((a, b) => a.cost - b.cost);
      const others = placed.concat(obst);
      let best = cands.find(c => !others.some(o => hit(c, o, pad)));
      if (!best) {
        let min = Infinity;
        cands.slice(0, 400).forEach(c => { const v = others.reduce((s, o) => s + area(c, o), 0) + c.cost * 0.5; if (v < min) { min = v; best = c; } });
      }
      const box = { x: best.x, y: best.y, w: best.w, h: best.h };
      placed.push(box);
      return box;
    });
  }

  // Obstáculos a lo largo de una polilínea (para no tapar la curva)
  function alongPath(pts, every, r) {
    const out = [];
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i]; const d = Math.hypot(b.x - a.x, b.y - a.y); const n = Math.max(1, Math.round(d / every));
      for (let j = 0; j <= n; j++) { const t = j / n; out.push({ x: a.x + (b.x - a.x) * t - r, y: a.y + (b.y - a.y) * t - r, w: 2 * r, h: 2 * r }); }
    }
    return out;
  }

  // Ajusta un rótulo a un ancho: reduce la letra y, si no basta, recorta con «…»
  function fit(str, room, fs, minFs, bold) {
    str = String(str || '');
    let f = fs;
    while (f > minFs && textW(str, f, bold) > room) f -= 0.5;
    let s = str;
    while (s.length > 2 && textW(s, f, bold) > room) s = s.slice(0, -2) + '…';
    return { text: s, fs: f, cut: s !== str };
  }

  // Halo blanco para que el texto se lea sobre líneas y colores
  const HALO = 'paint-order="stroke" stroke="#fff" stroke-width="3" stroke-linejoin="round"';

  window.LabelPlacer = { place, alongPath, fit, textW, HALO };
})();
