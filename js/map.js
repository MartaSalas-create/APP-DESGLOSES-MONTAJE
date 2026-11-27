/* ==========================================================================
   MAPA CONCEPTUAL DE TRAMAS (interactivo)
   Nodos: tramas (grandes, con su color) y personajes (tamaño = nº de secuencias).
   Enlaces: personaje–trama (en qué tramas aparece), trama–trama (personajes
   compartidos) y, opcionalmente, personaje–personaje (secuencias compartidas).
   Se pueden arrastrar los nodos, tocar uno para ver sus conexiones y su ficha,
   filtrar tramas, anotar las relaciones entre tramas y ampliar.
   ========================================================================== */
(function () {
  'use strict';
  const A = window.DesgloseApp;
  const { esc } = A;

  const VW = 1200, VH = 760, CX = VW / 2, CY = VH / 2;
  let sel = null;            // nodo o enlace seleccionado: 't:<id>', 'c:<nombre>', 'e:<a>|<b>'
  let showChars = true, showCo = false, allChars = false, showGiros = true, zoom = 1;

  const st = p => { p.mapa = p.mapa || { pos: {}, notes: {}, hidden: [] }; p.mapa.mode = p.mapa.mode || 'libre'; p.mapa.pos = p.mapa.pos || {}; p.mapa.notes = p.mapa.notes || {}; p.mapa.hidden = p.mapa.hidden || []; return p.mapa; };
  const textColor = hex => { // tono oscuro de la trama para textos
    const n = parseInt((hex || '#888888').slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b); let h = 0;
    if (max !== min) { const d = max - min; h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4; h = (h * 60 + 360) % 360; }
    return max === min ? '#444' : `hsl(${Math.round(h)},45%,32%)`;
  };

  /* ---------------- Datos del grafo ---------------- */
  function graph(p) {
    const m = st(p); const hidden = new Set(m.hidden);
    const used = new Set(p.scenes.map(s => s.tramaId).concat(Object.values(p.characters).map(c => c.tramaId)).filter(Boolean));
    const tramas = p.tramas.filter(t => !hidden.has(t.id) && used.has(t.id));   // las tramas sin secuencias ni personajes no se dibujan
    const tIds = new Set(tramas.map(t => t.id));
    const scenesByT = {}; p.scenes.forEach(s => { new Set([s.tramaId].concat(s.tramas2 || [])).forEach(id => { if (id) (scenesByT[id] = scenesByT[id] || []).push(s); }); });
    // personajes: secuencias totales y por trama
    const chars = {};
    p.scenes.forEach(s => s.characters.forEach(c => {
      const ch = p.characters[c]; if (!ch || ch.hidden) return;
      const x = chars[c] || (chars[c] = { n: 0, byT: {} }); x.n++;
      if (s.tramaId) x.byT[s.tramaId] = (x.byT[s.tramaId] || 0) + 1;
    }));
    let names = Object.keys(chars).sort((a, b) => chars[b].n - chars[a].n);
    names = names.filter(c => { const t = p.characters[c].tramaId; return (t && tIds.has(t)) || Object.keys(chars[c].byT).some(x => tIds.has(x)); });
    if (!allChars) names = names.filter(c => chars[c].n >= 2).slice(0, 24);
    const nodes = [], edges = [];
    tramas.forEach(t => nodes.push({ id: 't:' + t.id, kind: 't', t, label: t.name, r: 34 + Math.min(26, (scenesByT[t.id] || []).length * 0.6), color: t.color, scenes: (scenesByT[t.id] || []).length }));
    if (showChars) names.forEach(c => {
      const own = p.characters[c].tramaId;
      const tr = p.tramas.find(t => t.id === own) || p.tramas.find(t => t.id === Object.keys(chars[c].byT).sort((a, b) => chars[c].byT[b] - chars[c].byT[a])[0]);
      nodes.push({ id: 'c:' + c, kind: 'c', name: c, label: c, r: 9 + Math.min(16, Math.sqrt(chars[c].n) * 3), color: tr ? tr.color : '#ccc', tr, n: chars[c].n, byT: chars[c].byT });
      const ts = new Set(Object.keys(chars[c].byT).concat(own ? [own] : []));
      ts.forEach(tid => { if (tIds.has(tid)) edges.push({ id: 'ct:' + c + '|' + tid, kind: 'ct', a: 'c:' + c, b: 't:' + tid, w: chars[c].byT[tid] || 1, main: tid === own }); });
    });
    // puntos de giro: unidos a su trama y a los personajes que intervienen
    if (showGiros) {
      const charIds = new Set(nodes.filter(n => n.kind === 'c').map(n => n.id));
      p.scenes.filter(s => s.keyEvent && (!s.tramaId || tIds.has(s.tramaId))).forEach(s => {
        if (s.tramaId && !tIds.has(s.tramaId)) return;
        if (!s.tramaId && hidden.size) return;
        const tr = p.tramas.find(t => t.id === s.tramaId);
        const id = 'g:' + s.id;
        nodes.push({ id, kind: 'g', s, tr, label: (s.eventLabel || 'Sec. ' + s.num).toUpperCase(), r: 13, color: tr ? tr.color : '#ddd' });
        if (tr) edges.push({ id: 'gt:' + s.id, kind: 'gt', a: id, b: 't:' + tr.id });
        s.characters.forEach(c => { if (charIds.has('c:' + c)) edges.push({ id: 'gc:' + s.id + '|' + c, kind: 'gc', a: id, b: 'c:' + c }); });
      });
    }
    // trama–trama: personajes que aparecen en ambas
    for (let i = 0; i < tramas.length; i++) for (let j = i + 1; j < tramas.length; j++) {
      const a = tramas[i].id, b = tramas[j].id;
      const shared = Object.keys(chars).filter(c => chars[c].byT[a] && chars[c].byT[b]);
      const key = [a, b].sort().join('|');
      if (shared.length || m.notes[key]) edges.push({ id: 'e:' + key, kind: 'tt', a: 't:' + a, b: 't:' + b, w: shared.length, shared, key });
    }
    // personaje–personaje: secuencias compartidas
    if (showChars && showCo) {
      const set = new Set(names); const co = {};
      p.scenes.forEach(s => { const cs = s.characters.filter(c => set.has(c)); for (let i = 0; i < cs.length; i++) for (let j = i + 1; j < cs.length; j++) { const k = [cs[i], cs[j]].sort().join('|'); co[k] = (co[k] || 0) + 1; } });
      Object.keys(co).filter(k => co[k] >= 2).sort((x, y) => co[y] - co[x]).slice(0, 40).forEach(k => { const [x, y] = k.split('|'); edges.push({ id: 'cc:' + k, kind: 'cc', a: 'c:' + x, b: 'c:' + y, w: co[k] }); });
    }
    return { nodes, edges };
  }

  const MODES = { libre: 'Libre (relaciones)', tiempo: 'Por tiempo', actos: 'Por actos' };
  const store = m => m.mode === 'tiempo' ? (m.posT = m.posT || {}) : m.mode === 'actos' ? (m.posA = m.posA || {}) : m.pos;

  /* ---------------- Colocación automática (fuerzas) ---------------- */
  function layout(p, g) {
    const m = st(p);
    if (m.mode === 'tiempo' || m.mode === 'actos') return layoutGrid(p, g, m.mode);
    return { pos: layoutFree(p, g), bg: '' };
  }
  function layoutFree(p, g, reset) {
    const m = st(p); const pos = {};
    const T = g.nodes.filter(n => n.kind === 't');
    T.forEach((n, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / Math.max(1, T.length); pos[n.id] = { x: CX + Math.cos(a) * (T.length > 1 ? 230 : 0), y: CY + Math.sin(a) * (T.length > 1 ? 200 : 0) }; });
    g.nodes.filter(n => n.kind === 'c').forEach((n, i) => {
      const home = n.tr && pos['t:' + n.tr.id] || { x: CX, y: CY };
      const a = i * 2.39996; pos[n.id] = { x: home.x + Math.cos(a) * 90, y: home.y + Math.sin(a) * 90 };
    });
    g.nodes.filter(n => n.kind === 'g').forEach((n, i) => {
      const home = n.tr && pos['t:' + n.tr.id] || { x: CX, y: CY };
      const a = i * 2.39996 + 1.2; pos[n.id] = { x: home.x + Math.cos(a) * 130, y: home.y + Math.sin(a) * 130 };
    });
    const P0 = store(m);
    const fixed = id => !reset && P0[id];
    g.nodes.forEach(n => { if (fixed(n.id)) pos[n.id] = { x: P0[n.id].x, y: P0[n.id].y }; });
    const free = g.nodes.filter(n => !fixed(n.id));
    if (free.length) {
      for (let it = 0; it < 260; it++) {
        const f = {}; g.nodes.forEach(n => { f[n.id] = { x: 0, y: 0 }; });
        for (let i = 0; i < g.nodes.length; i++) for (let j = i + 1; j < g.nodes.length; j++) {
          const a = g.nodes[i], b = g.nodes[j], pa = pos[a.id], pb = pos[b.id];
          let dx = pa.x - pb.x, dy = pa.y - pb.y; let d = Math.hypot(dx, dy) || 0.1;
          const min = a.r + b.r + 26; const rep = (min * min * 1.4) / (d * d);
          dx /= d; dy /= d; f[a.id].x += dx * rep; f[a.id].y += dy * rep; f[b.id].x -= dx * rep; f[b.id].y -= dy * rep;
        }
        g.edges.forEach(e => {
          const pa = pos[e.a], pb = pos[e.b]; if (!pa || !pb) return;
          const L = e.kind === 'tt' ? 300 : e.kind === 'ct' ? (e.main ? 105 : 170) : e.kind === 'gt' ? 120 : e.kind === 'gc' ? 160 : 150;
          const k = e.kind === 'ct' ? (e.main ? 0.06 : 0.015) : e.kind === 'tt' ? 0.01 : e.kind === 'gt' ? 0.05 : e.kind === 'gc' ? 0.004 : 0.008;
          let dx = pb.x - pa.x, dy = pb.y - pa.y; const d = Math.hypot(dx, dy) || 0.1; const s = (d - L) * k;
          dx /= d; dy /= d; f[e.a].x += dx * s; f[e.a].y += dy * s; f[e.b].x -= dx * s; f[e.b].y -= dy * s;
        });
        const cool = 1 - it / 260;
        free.forEach(n => {
          const q = pos[n.id], fv = f[n.id];
          fv.x += (CX - q.x) * 0.004; fv.y += (CY - q.y) * 0.004;
          const mv = Math.min(18, Math.hypot(fv.x, fv.y)) * cool; const ang = Math.atan2(fv.y, fv.x);
          q.x = Math.max(n.r + 10, Math.min(VW - n.r - 10, q.x + Math.cos(ang) * mv));
          q.y = Math.max(n.r + 24, Math.min(VH - n.r - 24, q.y + Math.sin(ang) * mv));
        });
      }
    }
    // centrar el conjunto en el lienzo (solo si se ha recolocado todo automáticamente)
    if (free.length === g.nodes.length && g.nodes.length) {
      const xs = g.nodes.map(n => pos[n.id].x), ys = g.nodes.map(n => pos[n.id].y);
      const dx = CX - (Math.min(...xs) + Math.max(...xs)) / 2, dy = CY - (Math.min(...ys) + Math.max(...ys)) / 2;
      g.nodes.forEach(n => { pos[n.id].x += dx; pos[n.id].y += dy; });
    }
    return pos;
  }

  /* ---------------- Modos «por tiempo» y «por actos» ----------------
     Cada trama ocupa una franja horizontal (fila). En «por tiempo» el eje X es
     el avance de la película (páginas); en «por actos», columnas por acto.
     Puntos de giro y personajes se colocan en su franja y en su momento /
     acto, y luego se separan un poco para que no se monten. */
  function actsOf(p) {
    const idx = new Map(p.scenes.map((s, i) => [s.id, i]));
    const acts = (p.acts || []).map(a => ({ name: a.name, i: idx.get(a.start) })).filter(a => a.i != null).sort((a, b) => a.i - b.i);
    if (!acts.length) acts.push({ name: 'Película', i: 0 });
    const of = new Map();
    p.scenes.forEach((s, i) => { let k = 0; acts.forEach((a, j) => { if (i >= a.i) k = j; }); of.set(s.id, k); });
    return { acts, of };
  }
  function layoutGrid(p, g, mode) {
    const m = st(p); const P0 = store(m);
    const T = g.nodes.filter(n => n.kind === 't');
    const top = 64, bottom = VH - 52, L0 = 175, R0 = VW - 24;
    const laneH = (bottom - top) / Math.max(1, T.length);
    const laneY = {}; T.forEach((n, i) => { laneY[n.id] = top + laneH * (i + 0.5); });
    T.forEach(n => { n.r = Math.min(n.r, laneH * 0.36, 46); });
    g.nodes.filter(n => n.kind === 'c').forEach(n => { n.r = Math.min(n.r, Math.max(8, laneH * 0.16)); });
    g.nodes.filter(n => n.kind === 'g').forEach(n => { n.r = Math.min(n.r, Math.max(8, laneH * 0.12)); });
    const homeY = n => laneY['t:' + (n.tr ? n.tr.id : '')] != null ? laneY['t:' + n.tr.id] : (top + bottom) / 2;
    const bg = [], keep = [], fg = [];
    // franjas de las tramas
    T.forEach((n, i) => {
      bg.push(`<rect x="0" y="${top + laneH * i}" width="${VW}" height="${laneH}" fill="${n.color}" fill-opacity="${i % 2 ? 0.10 : 0.16}"/>`);
    });
    const target = {};
    T.forEach(n => { target[n.id] = { x: 88, y: laneY[n.id] }; });
    const { acts, of } = actsOf(p);
    if (mode === 'tiempo') {
      const total = Math.max(1, ...p.scenes.map(s => (s.pos || 0) + (s.lengthPages || 0)));
      const X = pg => L0 + Math.max(0, Math.min(1, pg / total)) * (R0 - L0);
      const mid = s => (s.pos || 0) + (s.lengthPages || 0) / 2;
      // eje de páginas y actos
      const step = total > 150 ? 20 : total > 60 ? 10 : total > 20 ? 5 : 1;
      for (let pg = 0; pg <= total; pg += step) bg.push(`<line x1="${X(pg)}" x2="${X(pg)}" y1="${top}" y2="${bottom}" stroke="#000" stroke-opacity="0.06"/><text x="${X(pg)}" y="${bottom + 13}" text-anchor="middle" font-size="10" fill="#2a4f8f">${Math.round(pg)}</text>`);
      bg.push(`<text x="${R0}" y="${bottom + 25}" text-anchor="end" font-size="10" fill="#999">páginas del guion →</text>`);
      acts.forEach((a, j) => {
        const s0 = p.scenes[a.i]; const x = X(s0 ? s0.pos || 0 : 0);
        if (j) bg.push(`<line x1="${x}" x2="${x}" y1="${top - 14}" y2="${bottom}" stroke="#d62828" stroke-width="3"/>`);
        const next = acts[j + 1] ? p.scenes[acts[j + 1].i] : null; const x2 = next ? X(next.pos || 0) : R0;
        const nm = window.LabelPlacer.fit(a.name.toUpperCase(), Math.max(20, x2 - x - 6), 11, 7, true);
        bg.push(`<text x="${(x + x2) / 2}" y="${top - 18}" text-anchor="middle" font-size="${nm.fs}" font-weight="800" fill="#2a4f8f">${nm.cut ? `<title>${esc(a.name)}</title>` : ''}${esc(nm.text)}</text>`);
      });
      g.nodes.forEach(n => {
        if (n.kind === 'g') target[n.id] = { x: X(mid(n.s)), y: homeY(n) - laneH * 0.2, lockX: true };
        if (n.kind === 'c') {
          const sc = p.scenes.filter(s => s.characters.includes(n.name));
          const avg = sc.length ? sc.reduce((a, s) => a + mid(s), 0) / sc.length : total / 2;
          target[n.id] = { x: X(avg), y: homeY(n) + laneH * 0.2 };
        }
      });
    } else {
      const colW = (R0 - L0) / acts.length; const colX = j => L0 + colW * (j + 0.5);
      // peso de cada trama en cada acto (nº de secuencias)
      const cnt = {}; p.scenes.forEach(s => { new Set([s.tramaId].concat(s.tramas2 || [])).forEach(id => { if (!id) return; const k = 't:' + id; cnt[k] = cnt[k] || acts.map(() => 0); cnt[k][of.get(s.id)]++; }); });
      const max = Math.max(1, ...Object.values(cnt).flat());
      acts.forEach((a, j) => {
        const x = L0 + colW * j;
        bg.push(`<line x1="${x}" x2="${x}" y1="${top - 14}" y2="${bottom}" stroke="#d62828" stroke-width="${j ? 3 : 1}" stroke-opacity="${j ? 1 : 0.3}"/>`);
        const nm = window.LabelPlacer.fit(a.name.toUpperCase(), colW - 8, 11, 7, true);
        bg.push(`<text x="${x + colW / 2}" y="${top - 18}" text-anchor="middle" font-size="${nm.fs}" font-weight="800" fill="#2a4f8f">${nm.cut ? `<title>${esc(a.name)}</title>` : ''}${esc(nm.text)}</text>`);
      });
      T.forEach(n => {
        const c = cnt[n.id] || acts.map(() => 0); const best = c.indexOf(Math.max(...c));
        c.forEach((v, j) => {
          const x = L0 + colW * j, y = laneY[n.id] - laneH / 2;
          if (v) bg.push(`<rect x="${x + 3}" y="${y + 3}" width="${colW - 6}" height="${laneH - 6}" rx="8" fill="${n.color}" fill-opacity="${0.12 + 0.5 * v / max}" ${j === best ? `stroke="${textColor(n.color)}" stroke-width="3"` : ''}/>`);
          const ct = v ? v + ' sec.' + (j === best ? ' · más peso' : '') : '';
          if (ct) { fg.push(`<text x="${x + 10}" y="${y + 16}" text-anchor="start" font-size="10" font-weight="700" fill="${textColor(n.color)}" pointer-events="none" ${window.LabelPlacer.HALO}>${ct}</text>`); const tw = window.LabelPlacer.textW(ct, 10, true); keep.push({ x: x + 10, y: y + 6, w: tw, h: 13 }); }
        });
      });
      g.nodes.forEach(n => {
        if (n.kind === 'g') {
          // repartidos dentro de su acto según su momento (no todos en el centro de la columna)
          const k = of.get(n.s.id) || 0, i = p.scenes.indexOf(n.s), a0 = acts[k].i, a1 = acts[k + 1] ? acts[k + 1].i : p.scenes.length;
          const fr = a1 - a0 > 1 ? (i - a0) / (a1 - a0 - 1) : 0.5;
          target[n.id] = { x: L0 + colW * k + 26 + fr * (colW - 52), y: homeY(n) - laneH * 0.12, lockX: true };
        }
        if (n.kind === 'c') {
          const c = acts.map(() => 0); p.scenes.forEach(s => { if (s.characters.includes(n.name)) c[of.get(s.id)]++; });
          target[n.id] = { x: colX(c.indexOf(Math.max(...c))), y: homeY(n) + laneH * 0.2 };
        }
      });
    }
    // posiciones: guardadas (si se han arrastrado) o calculadas
    const pos = {}; g.nodes.forEach((n, i) => { const t = target[n.id] || { x: CX, y: CY }; pos[n.id] = P0[n.id] ? { x: P0[n.id].x, y: P0[n.id].y } : { x: t.x + ((i % 5) - 2) * 2, y: t.y + ((i % 3) - 1) * 2 }; });
    const free = g.nodes.filter(n => n.kind !== 't' && !P0[n.id]);
    for (let it = 0; it < 160; it++) {
      const f = {}; free.forEach(n => { const t = target[n.id]; f[n.id] = { x: (t.x - pos[n.id].x) * 0.12, y: (t.y - pos[n.id].y) * 0.12 }; });
      for (let i = 0; i < free.length; i++) for (let j = i + 1; j < free.length; j++) {
        const a = free[i], b = free[j], pa = pos[a.id], pb = pos[b.id];
        let dx = pa.x - pb.x, dy = pa.y - pb.y; const d = Math.hypot(dx, dy) || 0.1; const min = a.r + b.r + 18;
        if (d < min * 1.6) { const push = (min * 1.6 - d) * 0.25; dx /= d; dy /= d; f[a.id].x += dx * push; f[a.id].y += dy * push; f[b.id].x -= dx * push; f[b.id].y -= dy * push; }
      }
      free.forEach(n => {
        const t = target[n.id]; const q = pos[n.id];
        if (!t.lockX) q.x += f[n.id].x; else q.x = t.x;
        q.y += f[n.id].y;
        const band = laneH * 0.48; q.y = Math.max(t.y - band, Math.min(t.y + band, q.y));
        q.x = Math.max(L0 - 10, Math.min(VW - n.r - 6, q.x)); q.y = Math.max(top + n.r, Math.min(bottom - n.r, q.y));
      });
    }
    return { pos, bg: bg.join(''), keep, fg: fg.join('') };
  }

  /* ---------------- Dibujo ---------------- */
  function neighbours(g, id) {
    const set = new Set([id]);
    if (id && id.startsWith('e:')) { const e = g.edges.find(x => x.id === id); if (e) { set.add(e.a); set.add(e.b); } return set; }
    g.edges.forEach(e => { if (e.a === id) set.add(e.b); if (e.b === id) set.add(e.a); });
    return set;
  }

  function svg(p) {
    const g = graph(p); const LY = layout(p, g); const pos = LY.pos; const mode = st(p).mode;
    const nb = sel ? neighbours(g, sel) : null;
    const dim = id => nb && !nb.has(id);
    const o = [`<rect width="${VW}" height="${VH}" fill="#fff"/>`, LY.bg];
    o.push(`<text x="16" y="24" font-size="15" font-weight="800" fill="#2a4f8f" letter-spacing="1">${esc((p.title || '').toUpperCase())} · MAPA DE TRAMAS</text>`);
    // enlaces
    const pills = [];
    g.edges.forEach(e => {
      const a = pos[e.a], b = pos[e.b]; if (!a || !b) return;
      const faded = nb && !(nb.has(e.a) && nb.has(e.b)) || (sel && sel.startsWith('e:') && sel !== e.id && e.kind === 'tt');
      if (e.kind === 'tt') {
        const ta = g.nodes.find(n => n.id === e.a), tb = g.nodes.find(n => n.id === e.b);
        const w = 2 + Math.min(10, e.w * 1.2);
        const curved = mode !== 'libre';
        const cxp = 18 - Math.abs(a.y - b.y) * 0.04, cyp = (a.y + b.y) / 2;
        const dd = curved ? `M${a.x},${a.y} Q${cxp},${cyp} ${b.x},${b.y}` : `M${a.x},${a.y} L${b.x},${b.y}`;
        o.push(`<path class="edge" data-id="${esc(e.id)}" d="${dd}" fill="none" stroke="#2a4f8f" stroke-width="${w}" stroke-opacity="${faded ? 0.08 : sel === e.id ? 0.7 : 0.28}" stroke-linecap="round"/>`);
        // zona amplia para tocar el enlace
        o.push(`<path class="edge-hit" data-id="${esc(e.id)}" d="${dd}" fill="none" stroke="transparent" stroke-width="22"/>`);
        const mx = curved ? (a.x + b.x) / 4 + cxp / 2 : (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        const note = st(p).notes[e.key];
        if (!faded) pills.push({ x: mx - 16, y: my - 12, w: 32, h: 24 });
        if (!faded) o.push(`<g class="edge-hit" data-id="${esc(e.id)}"><rect x="${mx - 15}" y="${my - 11}" width="30" height="22" rx="11" fill="#fff" stroke="#2a4f8f"/><text x="${mx}" y="${my + 4}" text-anchor="middle" font-size="11" font-weight="800" fill="#2a4f8f">${e.w}${note ? '✎' : ''}</text><title>${esc(ta.label)} ↔ ${esc(tb.label)}: ${e.w} personajes compartidos${e.shared && e.shared.length ? ' (' + esc(e.shared.join(', ')) + ')' : ''}</title></g>`);
      } else if (e.kind === 'ct') {
        const tn = g.nodes.find(n => n.id === e.b);
        o.push(`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${tn ? textColor(tn.color) : '#999'}" stroke-width="${e.main ? 2 : 1}" stroke-opacity="${faded ? 0.06 : e.main ? 0.55 : 0.3}" ${e.main ? '' : 'stroke-dasharray="4 4"'}/>`);
      } else if (e.kind === 'gt') {
        const tn = g.nodes.find(n => n.id === e.b);
        o.push(`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${tn ? textColor(tn.color) : '#999'}" stroke-width="2.5" stroke-opacity="${faded ? 0.06 : 0.6}"/>`);
      } else if (e.kind === 'gc') {
        const show = sel === e.a || sel === e.b;
        if (show) o.push(`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#d62828" stroke-width="1.5" stroke-opacity="0.6" stroke-dasharray="2 4"/>`);
      } else {
        o.push(`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#b03a69" stroke-width="${1 + Math.min(5, e.w * 0.5)}" stroke-opacity="${faded ? 0.05 : 0.35}"><title>${e.w} secuencias juntos</title></line>`);
      }
    });
    // rótulos: se colocan antes de dibujar, en el hueco libre más cercano a su nodo
    const LP = window.LabelPlacer;
    const rad = n => n.kind === 'g' ? n.r * 1.42 : n.r;
    const obst = g.nodes.filter(n => pos[n.id]).map(n => { const q = pos[n.id], r = rad(n) + 2; return { x: q.x - r, y: q.y - r, w: 2 * r, h: 2 * r }; }).concat(pills, LY.keep || []);
    const lab = {};
    const rank = { t: 0, g: 1, c: 2 };
    const want = g.nodes.filter(n => pos[n.id]).sort((a, b) => rank[a.kind] - rank[b.kind]).map(n => {
      const q = pos[n.id];
      if (n.kind === 't') { const t = n.label.toUpperCase().slice(0, 32); return { n, t, ax: q.x, ay: q.y, w: LP.textW(t, 13, true) + 4, h: 15, gap: n.r + 3, prefer: 'down' }; }
      if (n.kind === 'g') { const t = n.label.slice(0, 30); return { n, t, ax: q.x, ay: q.y, w: Math.max(LP.textW(t, 10, true), 40) + 4, h: 24, gap: rad(n) + 3, prefer: 'down' }; }
      const t = n.label.slice(0, 22); return { n, t, ax: q.x, ay: q.y, w: LP.textW(t, 11, true) + 4, h: 13, gap: n.r + 3, prefer: 'down' };
    });
    const boxes = LP.place(want, { bounds: { x0: 4, y0: mode === 'libre' ? 34 : 50, x1: VW - 4, y1: VH - 30 }, obstacles: obst, step: 5, pad: 2 });
    want.forEach((w, i) => { const q = pos[w.n.id], b = boxes[i]; lab[w.n.id] = { t: w.t, x: b.x + b.w / 2 - q.x, y: b.y - q.y }; });
    // nodos (primero personajes, encima tramas)
    const order = { c: 0, g: 1, t: 2 };
    g.nodes.slice().sort((x, y) => order[x.kind] - order[y.kind]).forEach(n => {
      const q = pos[n.id]; const f = dim(n.id) ? 0.15 : 1; const on = sel === n.id;
      if (n.kind === 't') {
        o.push(`<g class="node" data-id="${esc(n.id)}" transform="translate(${q.x} ${q.y})" opacity="${f}">
          <circle r="${n.r}" fill="${n.color}" stroke="${on ? '#222' : textColor(n.color)}" stroke-width="${on ? 4 : 2}"/>
          <text y="-6" text-anchor="middle" font-size="22" font-weight="900" fill="${textColor(n.color)}" pointer-events="none">${esc(n.t.letter)}</text>
          <text y="14" text-anchor="middle" font-size="10" fill="#333" pointer-events="none">${n.scenes} sec.</text>
          <text x="${lab[n.id].x}" y="${lab[n.id].y + 12}" text-anchor="middle" font-size="13" font-weight="800" fill="${textColor(n.color)}" pointer-events="none" ${LP.HALO}>${esc(lab[n.id].t)}</text>
          <title>${esc(n.t.letter + ' · ' + n.label)} — ${n.scenes} secuencias (arrastra para mover, toca para ver sus conexiones)</title></g>`);
      } else if (n.kind === 'g') {
        const r = n.r;
        o.push(`<g class="node" data-id="${esc(n.id)}" transform="translate(${q.x} ${q.y})" opacity="${f}">
          <rect x="${-r}" y="${-r}" width="${2 * r}" height="${2 * r}" transform="rotate(45)" fill="${n.color}" stroke="${on ? '#222' : '#d62828'}" stroke-width="${on ? 4 : 2.5}"/>
          <text y="4" text-anchor="middle" font-size="12" fill="#d62828" pointer-events="none">★</text>
          <text x="${lab[n.id].x}" y="${lab[n.id].y + 10}" text-anchor="middle" font-size="10" font-weight="800" fill="#d62828" pointer-events="none" ${LP.HALO}>${esc(lab[n.id].t)}</text>
          <text x="${lab[n.id].x}" y="${lab[n.id].y + 21}" text-anchor="middle" font-size="9" fill="#666" pointer-events="none" ${LP.HALO}>sec. ${esc(n.s.num)}</text>
          <title>Punto de giro · sec. ${esc(n.s.num)}: ${esc(n.label)}</title></g>`);
      } else {
        o.push(`<g class="node" data-id="${esc(n.id)}" transform="translate(${q.x} ${q.y})" opacity="${f}">
          <circle r="${n.r}" fill="#fff" stroke="${n.color}" stroke-width="${on ? 5 : 3.5}"/>
          <text y="4" text-anchor="middle" font-size="10" font-weight="800" fill="#333" pointer-events="none">${n.n}</text>
          <text x="${lab[n.id].x}" y="${lab[n.id].y + 11}" text-anchor="middle" font-size="11" font-weight="700" fill="#222" pointer-events="none" ${LP.HALO}>${esc(lab[n.id].t)}</text>
          <title>${esc(n.name)} — ${n.n} secuencias</title></g>`);
      }
    });
    if (LY.fg) o.push(LY.fg);
    o.push(`<text x="16" y="${VH - 17}" font-size="10" fill="#888">● trama (tamaño = nº de secuencias) · ○ personaje (número = secuencias) · ◆★ punto de giro</text>`);
    o.push(`<text x="16" y="${VH - 5}" font-size="10" fill="#888">━ trama principal del personaje · ┄ aparece también en esa trama · ▬ tramas unidas por personajes compartidos (cifra = cuántos)</text>`);
    return `<svg xmlns="http://www.w3.org/2000/svg" id="mapSvg" viewBox="0 0 ${VW} ${VH}" ${zoom === 1 ? `width="100%" style="max-width:${VW}px"` : `width="${Math.round(VW * zoom)}" height="${Math.round(VH * zoom)}"`} font-family="Helvetica, Arial, sans-serif">${o.join('')}</svg>`;
  }

  /* ---------------- Ficha del elemento seleccionado ---------------- */
  function panel(p) {
    if (!sel) return `<div class="map-panel muted">Toca una <b>trama</b>, un <b>personaje</b> o la <b>cifra de un enlace</b> entre tramas para ver su ficha y sus conexiones.</div>`;
    const m = st(p);
    if (sel.startsWith('t:')) {
      const t = p.tramas.find(x => x.id === sel.slice(2)); if (!t) return '';
      const sc = p.scenes.filter(s => s.tramaId === t.id);
      const cs = Object.keys(p.characters).filter(c => p.characters[c].tramaId === t.id && !p.characters[c].hidden);
      return `<div class="map-panel" style="border-top:6px solid ${t.color}">
        <h3 style="margin:0">${esc(t.letter)} · ${esc(t.name)}</h3>
        <p class="muted" style="margin:4px 0 10px">${sc.length} secuencias · ${cs.length} personajes propios</p>
        <div class="map-view-btns">${isSolo(p, t.id)
          ? `<button class="btn btn-small btn-primary" data-action="map-vis-all">Ver todas las tramas</button>`
          : `<button class="btn btn-small btn-primary" data-action="map-solo" data-id="${t.id}">Ver solo esta trama en el mapa</button>`}
          <span class="muted" style="font-size:11px">${isSolo(p, t.id) ? 'Se muestra solo esta trama.' : 'Ahora se resaltan sus conexiones sobre el mapa completo.'}</span></div>
        ${sc.filter(s => s.keyEvent).length ? `<div class="field"><label>Puntos de giro</label><div>${sc.filter(s => s.keyEvent).map(s => `<button class="chip on map-go" data-action="map-sel" data-id="g:${s.id}" style="background:#fff;color:#d62828;border:1px solid #d62828">★ ${esc((s.eventLabel || 'Sec. ' + s.num).toUpperCase())} · ${esc(s.num)}</button>`).join(' ')}</div></div>` : ''}
        ${A.field('Descripción de la trama', A.area('t:' + t.id + ':desc', 'rows="3"'))}
        <div class="field"><label>Personajes</label><div>${cs.map(c => `<button class="chip on map-go" data-action="map-sel" data-id="c:${esc(c)}" style="background:${t.color};color:#222">${esc(c)}</button>`).join(' ') || '—'}</div></div>
        <div class="field"><label>Secuencias</label><div class="map-scenes">${sc.map(s => `<span title="${esc(s.summary)}">${esc(s.num)}</span>`).join('') || '—'}</div></div>
      </div>`;
    }
    if (sel.startsWith('c:')) {
      const c = sel.slice(2); const ch = p.characters[c]; if (!ch) return '';
      const sc = p.scenes.filter(s => s.characters.includes(c));
      const byT = {}; sc.forEach(s => { const k = s.tramaId || '__none'; byT[k] = (byT[k] || 0) + 1; });
      const t = p.tramas.find(x => x.id === ch.tramaId);
      return `<div class="map-panel" style="border-top:6px solid ${t ? t.color : '#ccc'}">
        <h3 style="margin:0">${esc(c)}</h3>
        <p class="muted" style="margin:4px 0 10px">${sc.length} secuencias · trama principal: ${t ? esc(t.letter + ' · ' + t.name) : '—'}</p>
        <div class="field"><label>Presencia por trama</label>${Object.keys(byT).sort((a, b) => byT[b] - byT[a]).map(k => { const tt = p.tramas.find(x => x.id === k); const pct = Math.round(byT[k] / sc.length * 100); return `<div class="map-bar"><span>${tt ? esc(tt.letter) : '—'}</span><div><i style="width:${pct}%;background:${tt ? tt.color : '#ccc'}"></i></div><b>${byT[k]}</b></div>`; }).join('')}</div>
        ${A.field('Objetivo / deseo', A.area('c:' + c + ':objetivo', 'rows="2"'))}
        <div class="arc-line">${A.field('Al inicio', A.area('c:' + c + ':arcoInicio', 'rows="2"'))}<span>→</span>${A.field('Al final', A.area('c:' + c + ':arcoFin', 'rows="2"'))}</div>
        <div class="field"><label>Secuencias</label><div class="map-scenes">${sc.map(s => { const tt = p.tramas.find(x => x.id === s.tramaId); return `<span style="background:${tt ? tt.color : '#eee'}" title="${esc(s.summary)}">${esc(s.num)}</span>`; }).join('')}</div></div>
      </div>`;
    }
    if (sel.startsWith('g:')) {
      const s = p.scenes.find(x => x.id === sel.slice(2)); if (!s) return '';
      const t = p.tramas.find(x => x.id === s.tramaId);
      return `<div class="map-panel" style="border-top:6px solid #d62828">
        <h3 style="margin:0;color:#d62828">★ Punto de giro · sec. ${esc(s.num)}</h3>
        <p class="muted" style="margin:4px 0 10px">${esc(s.intExt ? s.intExt + '. ' : '')}${esc(s.location)}${s.time ? ' — ' + esc(s.time) : ''} · intensidad ${esc(s.intensity)}</p>
        ${A.field('Etiqueta del punto de giro', A.inp('s:' + s.id + ':eventLabel'))}
        <div class="field"><label>Trama</label><div>${t ? `<button class="chip on map-go" data-action="map-sel" data-id="t:${t.id}" style="background:${t.color};color:#222">${esc(t.letter + ' · ' + t.name)}</button>` : '—'}</div></div>
        <div class="field"><label>Acción</label><div>${esc(s.summary) || '—'}</div></div>
        ${s.conflict ? `<div class="field"><label>Conflicto / objetivo</label><div>${esc(s.conflict)}</div></div>` : ''}
        <div class="field"><label>Personajes que intervienen</label><div>${s.characters.map(c => `<button class="chip on map-go" data-action="map-sel" data-id="c:${esc(c)}">${esc(c)}</button>`).join(' ') || '—'}</div></div>
      </div>`;
    }
    if (sel.startsWith('e:')) {
      const key = sel.slice(2); const [a, b] = key.split('|');
      const ta = p.tramas.find(x => x.id === a), tb = p.tramas.find(x => x.id === b); if (!ta || !tb) return '';
      const g = graph(p); const e = g.edges.find(x => x.id === sel) || { shared: [] };
      return `<div class="map-panel" style="border-top:6px solid #2a4f8f">
        <h3 style="margin:0"><span class="trama-dot" style="background:${ta.color}"></span>${esc(ta.letter)} ↔ <span class="trama-dot" style="background:${tb.color}"></span>${esc(tb.letter)}</h3>
        <p class="muted" style="margin:4px 0 10px">${esc(ta.name)} · ${esc(tb.name)}</p>
        <div class="field"><label>Personajes que las unen</label><div>${(e.shared || []).map(c => `<button class="chip on map-go" data-action="map-sel" data-id="c:${esc(c)}">${esc(c)}</button>`).join(' ') || '—'}</div></div>
        ${A.field('Relación entre las dos tramas (cómo se cruzan, en qué secuencias, qué provoca una en la otra)', A.area('p:mapa.notes.' + key, 'rows="4"'))}
      </div>`;
    }
    return '';
  }

  function isSolo(p, id) {
    const h = new Set(st(p).hidden); const used = new Set(p.scenes.map(s => s.tramaId).filter(Boolean));
    return !h.has(id) && p.tramas.filter(t => t.id !== id && used.has(t.id)).every(t => h.has(t.id)) && p.tramas.some(t => t.id !== id && h.has(t.id));
  }

  /* ---------------- Pestaña ---------------- */
  function tab(p) {
    const m = st(p); const hidden = new Set(m.hidden);
    const chip = t => `<span class="trama-vis-wrap"><button class="btn btn-small trama-vis ${hidden.has(t.id) ? 'off' : ''}" data-action="map-vis" data-id="${t.id}"><span class="trama-dot" style="background:${t.color}"></span>${esc(t.letter + ' · ' + t.name)}</button><button class="btn btn-small btn-ghost solo-btn" data-action="map-solo" data-id="${t.id}">solo</button></span>`;
    return `<section class="panel">
      ${A.printHeader(p, 'Mapa de tramas')}
      <h2>Mapa de tramas</h2>
      <p class="lead no-print">Mapa conceptual de las tramas, sus personajes y sus puntos de giro (◆★). <b>Arrastra</b> los nodos para ordenarlo a tu manera (se recuerda), <b>toca</b> una trama o un personaje para ver sus conexiones y su ficha, y toca la <b>cifra</b> de un enlace entre tramas para anotar cómo se cruzan.</p>
      <div class="toolbar no-print stepline-filter"><span class="muted">Tramas:</span>${p.tramas.map(chip).join('')}<button class="btn btn-small btn-ghost" data-action="map-vis-all">Todas</button></div>
      <div class="toolbar no-print"><span class="muted">Colocación:</span>${Object.keys(MODES).map(k => `<button class="btn btn-small ${m.mode === k ? 'btn-primary' : ''}" data-action="map-mode" data-v="${k}">${MODES[k]}</button>`).join('')}
        <span class="muted" style="font-size:12px">${{ libre: 'Se acercan las tramas que comparten personajes; cada personaje junto a su trama principal y entre las demás en que aparece.', tiempo: 'Una franja por trama; de izquierda a derecha, el avance de la película (páginas). Los ★ en su momento exacto; los personajes en el punto medio de sus apariciones.', actos: 'Una franja por trama y una columna por acto: el color más intenso marca dónde pesa más cada trama (nº de secuencias). Personajes en el acto donde más aparecen.' }[m.mode]}</span></div>
      <div class="toolbar no-print">
        <label><input type="checkbox" data-action-change="map-opt" data-o="giros" ${showGiros ? 'checked' : ''}> Puntos de giro</label>
        <label><input type="checkbox" data-action-change="map-opt" data-o="chars" ${showChars ? 'checked' : ''}> Personajes</label>
        <label><input type="checkbox" data-action-change="map-opt" data-o="co" ${showCo ? 'checked' : ''} ${showChars ? '' : 'disabled'}> Relaciones entre personajes (secuencias juntos)</label>
        <label><input type="checkbox" data-action-change="map-opt" data-o="all" ${allChars ? 'checked' : ''} ${showChars ? '' : 'disabled'}> Todos los personajes</label>
        <span class="spacer"></span>
        <span class="zoom-ctl"><span class="muted">Zoom</span><button class="btn btn-small" data-action="map-zoom" data-d="-1" ${zoom <= 0.6 ? 'disabled' : ''}>−</button><b>${Math.round(zoom * 100)}%</b><button class="btn btn-small" data-action="map-zoom" data-d="1" ${zoom >= 2.5 ? 'disabled' : ''}>+</button></span>
        <button class="btn btn-small" data-action="map-relayout">Reorganizar</button>
        <button class="btn btn-small" data-action="map-svg">Descargar SVG</button>
      </div>
      <div class="map-layout">
        <div class="map-wrap" id="mapWrap">${svg(p)}</div>
        <div id="mapPanel">${panel(p)}</div>
      </div>
    </section>`;
  }

  /* ---------------- Interacción: arrastrar y seleccionar ---------------- */
  function redraw() {
    const p = A.P(); const w = document.getElementById('mapWrap'); const pn = document.getElementById('mapPanel');
    if (w) w.innerHTML = svg(p);
    if (pn) pn.innerHTML = panel(p);
  }
  document.addEventListener('pointerdown', e => {
    const svgEl = e.target.closest && e.target.closest('#mapSvg'); if (!svgEl) return;
    const node = e.target.closest('.node'); const edge = e.target.closest('.edge-hit');
    if (!node) {
      if (edge) { sel = edge.dataset.id; redraw(); }
      else if (sel) { sel = null; redraw(); }
      return;
    }
    e.preventDefault();
    const p = A.P(); const m = st(p);
    const toSvg = ev => { const pt = svgEl.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY; return pt.matrixTransform(svgEl.getScreenCTM().inverse()); };
    const id = node.dataset.id; const start = toSvg(e);
    const tr = node.getAttribute('transform').match(/translate\(([-\d.]+) ([-\d.]+)\)/);
    const x0 = +tr[1], y0 = +tr[2]; let moved = false;
    // fija la posición de todos los nodos en su sitio actual para que no salten
    svgEl.querySelectorAll('.node').forEach(n => { const t = n.getAttribute('transform').match(/translate\(([-\d.]+) ([-\d.]+)\)/); const P0 = store(m); if (t && !P0[n.dataset.id]) P0[n.dataset.id] = { x: +t[1], y: +t[2] }; });
    const move = ev => {
      const q = toSvg(ev); const dx = q.x - start.x, dy = q.y - start.y;
      if (!moved && Math.hypot(dx, dy) < 4) return;
      moved = true;
      store(m)[id] = { x: Math.round(Math.max(20, Math.min(VW - 20, x0 + dx))), y: Math.round(Math.max(20, Math.min(VH - 20, y0 + dy))) };
      const w = document.getElementById('mapWrap'); if (w) w.innerHTML = svg(p);
    };
    const up = () => {
      document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); document.removeEventListener('pointercancel', up);
      if (!moved) sel = sel === id ? null : id;
      A.save(); redraw();
    };
    document.addEventListener('pointermove', move); document.addEventListener('pointerup', up); document.addEventListener('pointercancel', up);
  });

  /* ---------------- Acciones ---------------- */
  const setHidden = (p, arr) => { st(p).hidden = arr; A.save(); A.renderTab(); };
  A.actions['map-vis'] = el => { const p = A.P(); const h = new Set(st(p).hidden); const id = el.dataset.id; if (h.has(id)) h.delete(id); else h.add(id); setHidden(p, Array.from(h)); };
  A.actions['map-solo'] = el => { const p = A.P(); sel = 't:' + el.dataset.id; setHidden(p, p.tramas.map(t => t.id).filter(id => id !== el.dataset.id)); };
  A.actions['map-vis-all'] = () => setHidden(A.P(), []);
  A.actions['map-sel'] = el => { sel = el.dataset.id; redraw(); };
  A.actions['map-zoom'] = el => { const d = Number(el.dataset.d); zoom = Math.max(0.6, Math.min(2.5, Math.round((zoom + d * 0.25) * 100) / 100)); A.renderTab(); };
  A.actions['map-relayout'] = () => { const p = A.P(); const m = st(p); if (m.mode === 'tiempo') m.posT = {}; else if (m.mode === 'actos') m.posA = {}; else m.pos = {}; A.save(); A.renderTab(); };
  A.actions['map-mode'] = el => { const p = A.P(); st(p).mode = el.dataset.v; A.save(); A.renderTab(); };
  A.actions['map-svg'] = () => { const p = A.P(); A.download(A.fileBase(p) + '_mapa_tramas.svg', svg(p).replace(/ width="[^"]+"( height="\d+")?( style="[^"]*")?/, ` width="${VW}" height="${VH}"`), 'image/svg+xml'); };
  A.changeActions = A.changeActions || {};
  window.MapaTramas = { tab, setOpt: (o, v) => { if (o === 'chars') showChars = v; if (o === 'co') showCo = v; if (o === 'all') allChars = v; if (o === 'giros') showGiros = v; A.renderTab(); } };
})();
