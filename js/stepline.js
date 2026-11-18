/* ==========================================================================
   STEP LINE (metodología de J. C. Marimón, «El montaje cinematográfico:
   del guion a la pantalla»): curva de intensidad dramática, actos,
   puntos de giro por trama y mapa de personajes.
   Genera un SVG a partir del proyecto.
   ========================================================================== */
(function (global) {
  'use strict';

  const W = 1600;
  const M = { left: 70, right: 70 };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function wrap(text, maxChars) {
    const words = String(text || '').split(/\s+/).filter(Boolean);
    const lines = []; let cur = '';
    words.forEach(w => {
      if ((cur + ' ' + w).trim().length > maxChars && cur) { lines.push(cur); cur = w; }
      else cur = (cur + ' ' + w).trim();
    });
    if (cur) lines.push(cur);
    return lines;
  }

  // Curva suave (Catmull-Rom -> Bézier)
  function smoothPath(pts) {
    if (!pts.length) return '';
    if (pts.length === 1) return `M${pts[0].x},${pts[0].y}`;
    let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const t = 0.18;
      const c1x = p1.x + (p2.x - p0.x) * t, c1y = p1.y + (p2.y - p0.y) * t;
      const c2x = p2.x - (p3.x - p1.x) * t, c2y = p2.y - (p3.y - p1.y) * t;
      d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }
    return d;
  }

  /**
   * @param {object} p        proyecto
   * @param {Array}  scenes   secuencias en el orden a representar
   * @param {object} helpers  { tramaOf(scene), tramaById(id), charactersByTrama() }
   */
  function render(p, scenes, helpers) {
    const visible = s => !(helpers.isHidden && helpers.isHidden(s));
    const credits = p.credits || {};
    const headerLines = [];
    const creditBits = [];
    if (credits.guion) creditBits.push('Guion: ' + credits.guion);
    if (credits.direccion) creditBits.push('Dirección: ' + credits.direccion);
    if (credits.montaje) creditBits.push('Montaje: ' + credits.montaje);
    if (credits.otros) creditBits.push(credits.otros);
    if (p.basadoEn) creditBits.push('Basado en ' + p.basadoEn);
    const dataBits = [];
    if (p.version) dataBits.push('Guion: ' + p.version + (p.fecha ? ' (' + p.fecha + ')' : ''));
    else if (p.fecha) dataBits.push('Guion de ' + p.fecha);
    if (p.episodio) dataBits.unshift(p.episodio);
    if (p.pages) dataBits.push(p.pages + ' págs.');
    dataBits.push(scenes.length + ' secuencias');
    if (p.durationMin) dataBits.push('Duración real ' + p.durationMin + "'");
    else dataBits.push('Duración estimada ' + Math.round(totalPages(scenes)) + "' (1 pág ≈ 1 min)");

    // --- Escala temporal ---
    const sumPages = totalPages(scenes) || 1;
    const totalMin = Number(p.durationMin) || sumPages;
    const k = totalMin / sumPages;
    let acc = 0;
    const timeline = scenes.map(s => {
      const start = acc * k; acc += (s.lengthPages || 1);
      return { s, start, end: acc * k };
    });

    // --- Layout vertical ---
    const titleY = 70;
    const creditY = 108;
    const ideaLines = wrap(p.logline ? 'IDEA: ' + p.logline : '', 170);
    const ideaY = 136;
    const actLabelY = ideaY + ideaLines.length * 18 + 30;
    const plotTop = actLabelY + 46;
    const plotH = 380;
    const plotBottom = plotTop + plotH;
    const plotLeft = M.left, plotRight = W - M.right, plotW = plotRight - plotLeft;
    const X = min => plotLeft + (min / totalMin) * plotW;
    const Y = v => plotBottom - (Math.max(0, Math.min(10, Number(v) || 0)) / 10) * plotH;

    const out = [];
    out.push(`<rect x="0" y="0" width="${W}" height="100%" fill="#fff"/>`);
    // Título
    out.push(`<text x="${W / 2}" y="${titleY}" text-anchor="middle" font-size="58" font-weight="300" letter-spacing="6" fill="#2a4f8f" font-family="Georgia, 'Times New Roman', serif">${esc((p.title || 'SIN TÍTULO').toUpperCase())}</text>`);
    out.push(`<text x="${W / 2}" y="${creditY - 12}" text-anchor="middle" font-size="14" fill="#2a4f8f">${esc(creditBits.join('  ·  '))}</text>`);
    out.push(`<text x="${W / 2}" y="${creditY + 8}" text-anchor="middle" font-size="13" fill="#555">${esc(dataBits.join('  ·  '))}</text>`);
    ideaLines.forEach((l, i) => out.push(`<text x="${plotLeft}" y="${ideaY + i * 18}" font-size="14" fill="#2a4f8f">${esc(l)}</text>`));

    // Rejilla y ejes 0-10
    for (let v = 0; v <= 10; v++) {
      const y = Y(v);
      out.push(`<line x1="${plotLeft}" x2="${plotRight}" y1="${y}" y2="${y}" stroke="${v === 0 ? '#999' : '#eee'}" stroke-width="1"/>`);
      out.push(`<text x="${plotLeft - 12}" y="${y + 4}" text-anchor="end" font-size="12" fill="#2a4f8f">${v}</text>`);
      out.push(`<text x="${plotRight + 12}" y="${y + 4}" font-size="12" fill="#2a4f8f">${v}</text>`);
    }
    out.push(`<text transform="translate(22 ${plotTop + plotH / 2}) rotate(-90)" text-anchor="middle" font-size="11" fill="#888" letter-spacing="2">INTENSIDAD DRAMÁTICA</text>`);

    // Líneas finas por secuencia + etiquetas verticales
    const minGap = 13;
    let lastLabelX = -999;
    timeline.forEach(t => {
      const x = X(t.start);
      out.push(`<line x1="${x}" x2="${x}" y1="${plotTop}" y2="${plotBottom}" stroke="#c9d3e3" stroke-width="0.7"/>`);
      const s = t.s;
      const label = s.keyEvent && s.eventLabel && visible(s) ? s.eventLabel : '';
      const cx = X((t.start + t.end) / 2);
      if (label) {
        out.push(`<text transform="translate(${cx + 4} ${plotBottom - 8}) rotate(-90)" font-size="11" fill="#2a4f8f" font-weight="600">${esc(label.toUpperCase().slice(0, 40))}</text>`);
      }
      if (x - lastLabelX >= minGap) {
        out.push(`<text x="${cx}" y="${plotBottom + 16}" text-anchor="middle" font-size="9" fill="#999">${esc(s.num)}</text>`);
        lastLabelX = x;
      }
    });

    // Eje temporal (minutos)
    const step = totalMin > 150 ? 10 : totalMin > 60 ? 5 : totalMin > 20 ? 2 : 1;
    for (let m = 0; m <= totalMin + 0.001; m += step) {
      const x = X(m);
      out.push(`<line x1="${x}" x2="${x}" y1="${plotBottom + 22}" y2="${plotBottom + 28}" stroke="#2a4f8f"/>`);
      out.push(`<text x="${x}" y="${plotBottom + 42}" text-anchor="middle" font-size="11" fill="#2a4f8f">${Math.round(m)}'</text>`);
    }
    out.push(`<text x="${plotRight}" y="${plotBottom + 58}" text-anchor="end" font-size="10" fill="#999">minutos · nº de secuencia sobre el eje</text>`);

    // Actos
    const acts = (p.acts || []).map(a => {
      const idx = scenes.findIndex(s => s.id === a.start);
      return idx >= 0 ? { name: a.name, idx } : null;
    }).filter(Boolean).sort((a, b) => a.idx - b.idx);
    acts.forEach((a, i) => {
      const startMin = timeline[a.idx].start;
      const endMin = i + 1 < acts.length ? timeline[acts[i + 1].idx].start : totalMin;
      const x0 = X(startMin), x1 = X(endMin);
      if (a.idx > 0) out.push(`<line x1="${x0}" x2="${x0}" y1="${actLabelY - 30}" y2="${plotBottom + 28}" stroke="#d62828" stroke-width="5"/>`);
      const dur = Math.round(endMin - startMin);
      const name = a.name.toUpperCase();
      const room = x1 - x0;
      const fs = room > 260 ? 20 : room > 160 ? 15 : room > 90 ? 11 : 9;
      out.push(`<text x="${(x0 + x1) / 2}" y="${actLabelY}" text-anchor="middle" font-size="${fs}" fill="#2a4f8f" font-weight="600">${esc(name)}</text>`);
      out.push(`<text x="${(x0 + x1) / 2}" y="${actLabelY + 18}" text-anchor="middle" font-size="12" fill="#2a4f8f">${dur}'  ·  ${Math.round(startMin)}'–${Math.round(endMin)}'</text>`);
    });

    // Curva
    const pts = timeline.filter(t => visible(t.s)).map(t => ({ x: X((t.start + t.end) / 2), y: Y(t.s.intensity), s: t.s }));
    out.push(`<path d="${smoothPath(pts)}" fill="none" stroke="#d62828" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/>`);

    // Globos: puntos de giro / eventos clave (color de la trama)
    let globeLevel = 0;
    let lastGlobeX = -999;
    pts.forEach(pt => {
      const s = pt.s;
      if (!s.keyEvent) return;
      const tr = helpers.tramaOf(s);
      const color = tr ? tr.color : '#bbb';
      const label = (s.eventLabel || ('Esc. ' + s.num)).toUpperCase();
      const lines = wrap(label, 16).slice(0, 3);
      const bw = Math.max(...lines.map(l => l.length)) * 7.2 + 18;
      const bh = lines.length * 14 + 10;
      globeLevel = pt.x - lastGlobeX < bw + 6 ? (globeLevel + 1) % 4 : 0;
      lastGlobeX = pt.x;
      const by = Math.max(plotTop + 4, pt.y - 34 - bh - globeLevel * (bh + 6));
      const dx = Number(s.globeDx) || 0, dy = Number(s.globeDy) || 0;
      // el palito une el punto de la curva con el globo (se actualiza al arrastrar)
      out.push(`<line class="stem" data-id="${s.id}" data-bx="${pt.x}" data-by="${by + bh / 2}" x1="${pt.x}" y1="${pt.y}" x2="${pt.x + dx}" y2="${by + bh / 2 + dy}" stroke="${color}" stroke-width="2"/>`);
      out.push(`<g class="globe" data-id="${s.id}" transform="translate(${dx} ${dy})"><title>Arrastra para mover la etiqueta</title>`);
      out.push(`<rect x="${pt.x - bw / 2}" y="${by}" width="${bw}" height="${bh}" rx="${bh / 2}" fill="${color}" stroke="rgba(0,0,0,.35)"/>`);
      lines.forEach((l, i) => out.push(`<text x="${pt.x}" y="${by + 17 + i * 14}" text-anchor="middle" font-size="11" font-weight="700" fill="#222" pointer-events="none">${esc(l)}</text>`));
      out.push(`</g>`);
    });

    // Puntos editables
    pts.forEach(pt => {
      const tr = helpers.tramaOf(pt.s);
      out.push(`<circle class="pt" data-id="${pt.s.id}" cx="${pt.x}" cy="${pt.y}" r="${pt.s.keyEvent ? 6 : 4}" fill="${tr ? tr.color : '#fff'}" stroke="#d62828" stroke-width="2"><title>Esc. ${esc(pt.s.num)} · ${esc(pt.s.location)} · intensidad ${pt.s.intensity}\n(arrastra arriba/abajo para corregir)</title></circle>`);
    });

    // Leyenda inferior: mapa de tramas y personajes
    let ly = plotBottom + 90;
    out.push(`<text x="${plotLeft}" y="${ly}" font-size="13" font-weight="700" fill="#333" letter-spacing="1">MAPA DE TRAMAS Y PERSONAJES</text>`);
    ly += 14;
    const byTrama = helpers.charactersByTrama();
    const tramas = p.tramas || [];
    const colW = plotW / Math.min(3, Math.max(1, tramas.length));
    let col = 0, rowY = ly, rowMaxH = 0;
    tramas.forEach(t => {
      const x = plotLeft + col * colW;
      const off = helpers.isTramaHidden && helpers.isTramaHidden(t.id);
      if (off) out.push(`<g opacity="0.3">`);
      const chars = (byTrama[t.id] || []).join(', ');
      const charLines = wrap(chars || '—', Math.floor(colW / 7.2) - 4).slice(0, 3);
      out.push(`<rect x="${x}" y="${rowY + 6}" width="26" height="18" rx="3" fill="${t.color}" stroke="rgba(0,0,0,.2)"/>`);
      out.push(`<text x="${x + 13}" y="${rowY + 20}" text-anchor="middle" font-size="12" font-weight="800" fill="#222">${esc(t.letter)}</text>`);
      out.push(`<text x="${x + 34}" y="${rowY + 20}" font-size="12.5" font-weight="700" fill="#222">${esc(t.name)}</text>`);
      charLines.forEach((l, i) => out.push(`<text x="${x + 34}" y="${rowY + 36 + i * 14}" font-size="11" fill="#555">${esc(l)}</text>`));
      if (off) out.push(`</g>`);
      rowMaxH = Math.max(rowMaxH, 36 + charLines.length * 14);
      col++;
      if (col >= 3) { col = 0; rowY += rowMaxH + 4; rowMaxH = 0; }
    });
    ly = rowY + rowMaxH + 24;

    // Nota metodológica
    const noteLines = wrap('Nota: los valores de intensidad dramática son una interpretación editorial a partir de la lectura del guion — no proceden de un análisis objetivo ni de una medición externa. Es un punto de partida para debatir y corregir: ¿algún pico o valle debería estar más arriba, más abajo o en otro lugar de la curva?', 200);
    noteLines.forEach((l, i) => out.push(`<text x="${plotLeft}" y="${ly + i * 15}" font-size="11" font-style="italic" fill="#888">${esc(l)}</text>`));
    ly += noteLines.length * 15 + 20;

    const H = Math.ceil(ly);
    return {
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="Helvetica, Arial, sans-serif" data-plot-top="${plotTop}" data-plot-h="${plotH}">${out.join('')}</svg>`,
      plotTop, plotH
    };
  }

  function totalPages(scenes) {
    return scenes.reduce((a, s) => a + (s.lengthPages || 1), 0);
  }

  global.StepLine = { render };
})(window);
