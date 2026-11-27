/* ==========================================================================
   SCRIPT DOCTOR (Linda Seger + Robert McKee)
   - Modo «Guion cargado»: localiza los 11 hitos estructurales en el guion,
     teniendo en cuenta lo ya trabajado en el proyecto (tramas, step line,
     puntos de giro, actos, lectura de guion) y diagnostica la estructura.
   - Modo «Premisa»: desarrolla la estructura de un guion de 120 páginas.
   En ambos: gráfica stepline (escalones) de la carga de valor del protagonista.
   ========================================================================== */
(function () {
  'use strict';
  const A = window.DesgloseApp;
  const { esc } = A;

  const HITOS = [
    { n: 1, nombre: 'Imagen de apertura', acto: 1, ideal: 1, rango: '1', def: 'Tono, mundo y estado inicial del protagonista.' },
    { n: 2, nombre: 'Catalizador / Incidente incitador', acto: 1, ideal: 12, rango: '12', def: 'Evento que rompe el equilibrio.' },
    { n: 3, nombre: 'Inicio de la subtrama B', acto: 1, ideal: 20, rango: '20', def: 'Relación clave que impulsará el arco interno.' },
    { n: 4, nombre: 'Primer punto de giro', acto: 1, ideal: 30, rango: '30', def: 'Decisión irreversible + pregunta dramática central.' },
    { n: 5, nombre: 'Primeros obstáculos y desarrollo de la subtrama B', acto: 2, ideal: 42, rango: '30–55', def: 'Intentos fallidos y avance emocional.' },
    { n: 6, nombre: 'Punto medio', acto: 2, ideal: 60, rango: '60', def: 'Revelación, falsa victoria o derrota que eleva las apuestas.' },
    { n: 7, nombre: 'Complicaciones mayores y crisis de la subtrama B', acto: 2, ideal: 72, rango: '60–85', def: 'Presión máxima del antagonista.' },
    { n: 8, nombre: 'Segundo punto de giro', acto: 2, ideal: 90, rango: '90', def: 'Crisis definitiva y decisión sin retorno (McKee).' },
    { n: 9, nombre: 'Resolución de la subtrama B', acto: 3, ideal: 100, rango: '100', def: 'Aprendizaje interno aplicado.' },
    { n: 10, nombre: 'Clímax', acto: 3, ideal: 110, rango: '110', def: 'Confrontación final y cambio de valor absoluto.' },
    { n: 11, nombre: 'Resolución e imagen final', acto: 3, ideal: 120, rango: '120', def: 'Nuevo equilibrio.' }
  ];
  const DOCTOR = `Eres un script doctor experto en los métodos de Linda Seger («Cómo convertir un buen guion en un guion excelente») y Robert McKee («El guion»): estructura en tres actos, catalizador, puntos de giro, subtrama B, punto medio, crisis, clímax y resolución, y el CAMBIO DE VALOR (+/−) de cada secuencia y de cada hito según McKee (cada hito debe girar la carga de valor del protagonista). Trabajas además con montadores, así que tus notas son concretas y útiles para estructurar en montaje. Escribe en español de España, conciso y centrado en la acción dramática. Di siempre «secuencia» (nunca «escena») y abrevia «sec.».`;

  let busy = false;

  function doc(p) {
    if (!p.doctor) p.doctor = { mode: p.scenes.length ? 'guion' : 'premisa', premisa: {}, hitos: [], pregunta: '', diagnostico: '', recomendaciones: '', coherencia: '', protagonista: '', showIdeal: true, showCurve: true };
    return p.doctor;
  }
  const totalPages = (p, d) => d.mode === 'guion' && p.pages ? Number(p.pages) : 120;
  const idealPage = (h, total) => Math.round(h.ideal / 120 * total);

  /* ---------------- Prompts ---------------- */
  const hitosSpec = total => HITOS.map(h => `${h.n}. ${h.nombre} (pág. ideal ${total === 120 ? h.rango : '≈' + idealPage(h, total) + ' de ' + total}): ${h.def}`).join('\n');
  const jsonSpec = withScene => `{"protagonista": "nombre y defecto interno", "objetivo": "objetivo externo", "antagonista": "", "subtramaB": "relación secundaria", "pregunta": "pregunta dramática central", "logline": "",
  "hitos": [ {"n": 1, "pag": 1, ${withScene ? '"esc": "nº de secuencia", ' : ''}"etiqueta": "máx. 3 palabras", "accion": "acción dramática concreta (1-3 frases)", "cambio": "p. ej. − → +  (valor: soledad → conexión)", "carga": 0, "nota": ""} ],
  "diagnostico": "", "recomendaciones": ""${withScene ? ', "coherencia": ""' : ''}}`;

  function premisePrompt(p, d) {
    const pr = d.premisa || {};
    return `${DOCTOR}

TAREA: a partir de esta premisa, desarrolla la estructura completa de un guion cinematográfico de 120 páginas con los 11 hitos (Seger + McKee). En cada hito céntrate en la acción dramática y en el cambio de valor (+/−) del protagonista.

PREMISA
- Género: ${pr.genero || '—'}
- Protagonista y defecto interno: ${pr.protagonista || '—'}
- Objetivo externo y antagonista: ${pr.objetivo || '—'}
- Subtrama (relación secundaria): ${pr.subtrama || '—'}
${pr.extra ? '- Notas: ' + pr.extra : ''}

HITOS
${hitosSpec(120)}

Reglas:
- "pag": página del hito (usa las ideales; en los hitos 5 y 7, que son tramos, la página central del tramo).
- "carga": carga de valor / tensión del protagonista de -10 a +10 en ese hito (entero). Debe haber escalones reales: cada hito cambia la carga; el clímax lleva el cambio de valor absoluto.
- "etiqueta": máximo 3 palabras, para la gráfica.
- "nota": consejo breve de script doctor para ese hito (riesgos, alternativas).
- "diagnostico": fortalezas y riesgos de la premisa. "recomendaciones": 3-6 viñetas que empiecen por "- ".

Responde SOLO con JSON: ${jsonSpec(false)}`;
  }

  function scriptPrompt(p, d) {
    const AI = window.AIEditor;
    const total = totalPages(p, d);
    const steps = p.scenes.map(s => {
      const t = A.tramaOf(p, s);
      return `${s.num} | p.${s.page} | int ${s.intensity}${t ? ' | trama ' + t.letter : ''}${s.keyEvent ? ' | GIRO: ' + s.eventLabel : ''} | ${s.summary.slice(0, 110)}`;
    }).join('\n');
    const acts = (p.acts || []).map(a => { const s = p.scenes.find(x => x.id === a.start); return s ? `${a.name}: esc ${s.num} (p.${s.page})` : ''; }).filter(Boolean).join(' · ');
    const an = p.analysis || {};
    return `${DOCTOR}

TAREA: analiza la ESTRUCTURA del guion que sigue según los 11 hitos (Seger + McKee). Localiza dónde ocurre realmente cada hito (secuencia y página), qué acción dramática lo produce y qué cambio de valor provoca en el protagonista. Compara con la página ideal (escalada a ${total} páginas) y diagnostica.
Ten en cuenta y CHEQUEA el trabajo previo del proyecto (tramas, actos, puntos de giro e intensidades del step line, lectura de guion): úsalo como referencia, pero si algo no cuadra con el guion o con la estructura, dilo en "coherencia" (p. ej. un giro marcado que no gira el valor, una intensidad que contradice el hito, un acto que empieza demasiado pronto).

${A.P().title ? 'Título: ' + p.title : ''} · ${total} páginas · ${p.scenes.length} secuencias

HITOS (página ideal escalada)
${hitosSpec(total)}

TRABAJO PREVIO DEL PROYECTO
${AI.context(p)}
Actos marcados: ${acts || '—'}
Lectura de guion (estructura): ${an.estructura || '—'}
Problemas anotados: ${an.problemas || '—'}
Step line actual (nº | página | intensidad 0-10 | trama | giro | resumen):
${steps}

Reglas:
- "pag": página REAL del guion donde ocurre el hito; "esc": su número de secuencia. Si un hito no existe o está muy diluido, elige el momento más cercano y explícalo en "nota".
- "carga": carga de valor del protagonista de -10 a +10 (entero) tras ese hito.
- "nota": desviación respecto a la página ideal (p. ej. "llega 8 págs. tarde"), si funciona o no y qué se podría hacer (también en montaje: adelantar, compactar, reordenar, cortar).
- "diagnostico": valoración global de la estructura (ritmo de los actos, solidez de los giros, subtrama B, clímax).
- "recomendaciones": 4-8 viñetas con "- ", priorizando lo que se puede resolver en montaje.
- "coherencia": contraste con el trabajo previo del proyecto.

Responde SOLO con JSON: ${jsonSpec(true)}

GUION (secuencias en orden):
${AI.script(p)}`;
  }

  async function generate(p) {
    const AI = window.AIEditor; const d = doc(p);
    if (!AI || !AI.available()) { A.toast('El Script doctor con Claude solo funciona en la versión de claude.ai.'); return; }
    if (busy) return;
    if (d.mode === 'guion' && !p.scenes.length) { A.toast('Sube primero un guion, o usa el modo Premisa.'); return; }
    busy = true; A.renderTab();
    try {
      const r = await AI.ask(d.mode === 'guion' ? scriptPrompt(p, d) : premisePrompt(p, d));
      if (!r || !Array.isArray(r.hitos)) throw { code: 'invalid_json' };
      d.hitos = HITOS.map(h => {
        const x = r.hitos.find(y => Number(y.n) === h.n) || {};
        return { n: h.n, pag: x.pag != null ? String(x.pag) : String(d.mode === 'guion' ? idealPage(h, totalPages(p, d)) : h.ideal), esc: x.esc != null ? String(x.esc) : '', etiqueta: String(x.etiqueta || ''), accion: String(x.accion || ''), cambio: String(x.cambio || ''), carga: x.carga != null && !isNaN(parseFloat(x.carga)) ? String(Math.max(-10, Math.min(10, Math.round(parseFloat(x.carga))))) : '0', nota: String(x.nota || '') };
      });
      ['protagonista', 'objetivo', 'antagonista', 'subtramaB', 'pregunta', 'logline', 'diagnostico', 'recomendaciones', 'coherencia'].forEach(k => {
        if (r[k] != null) d[k] = Array.isArray(r[k]) ? r[k].map(v => '- ' + v).join('\n') : String(r[k]);
      });
      d.generatedMode = d.mode; d.generatedAt = new Date().toISOString();
      A.save(); A.toast('Estructura lista. Revísala: todo es editable.');
    } catch (e) {
      A.toast(AI.errText ? AI.errText(e) : 'No se ha podido generar.');
    } finally { busy = false; A.renderTab(); }
  }

  function blankHitos(p, d) {
    const total = totalPages(p, d);
    d.hitos = HITOS.map(h => ({ n: h.n, pag: String(d.mode === 'guion' ? idealPage(h, total) : h.ideal), esc: '', etiqueta: '', accion: '', cambio: '', carga: '0', nota: '' }));
  }

  /* ---------------- Gráfica stepline (escalones) ---------------- */
  function chart(p, d) {
    const total = totalPages(p, d);
    const W = 1400, H = 640, L = 70, R = 70, T = 70, B = 70;
    const pw = W - L - R, ph = H - T - B;
    const X = pg => L + Math.max(0, Math.min(total, pg)) / total * pw;
    const Y = v => T + (10 - Math.max(-10, Math.min(10, v))) / 20 * ph;
    const o = [`<rect width="${W}" height="${H}" fill="#fff"/>`];
    o.push(`<text x="${W / 2}" y="30" text-anchor="middle" font-size="22" font-weight="300" letter-spacing="3" fill="#2a4f8f" font-family="Georgia, serif">${esc((p.title || 'STEP LINE').toUpperCase())}</text>`);
    o.push(`<text x="${W / 2}" y="52" text-anchor="middle" font-size="12" fill="#555">${esc(d.mode === 'guion' ? `Estructura del guion · ${total} págs. · Seger + McKee` : `Estructura desde premisa · 120 págs. · Seger + McKee`)}${d.pregunta ? ' · ' + esc(d.pregunta.slice(0, 110)) : ''}</text>`);
    // actos
    const acts = [[0, 0.25, 'ACTO I · PLANTEAMIENTO', '#eef3fb'], [0.25, 0.75, 'ACTO II · CONFRONTACIÓN', '#fbf6ee'], [0.75, 1, 'ACTO III · DESENLACE', '#f1f7ee']];
    acts.forEach(([a, b, lab, bg]) => {
      o.push(`<rect x="${X(a * total)}" y="${T}" width="${X(b * total) - X(a * total)}" height="${ph}" fill="${bg}"/>`);
      o.push(`<text x="${(X(a * total) + X(b * total)) / 2}" y="${T + 18}" text-anchor="middle" font-size="12" font-weight="800" fill="#2a4f8f" letter-spacing="1">${lab}</text>`);
    });
    [0.25, 0.75].forEach(f => o.push(`<line x1="${X(f * total)}" x2="${X(f * total)}" y1="${T}" y2="${T + ph}" stroke="#d62828" stroke-width="4"/>`));
    // rejilla
    for (let v = -10; v <= 10; v += 2) {
      o.push(`<line x1="${L}" x2="${L + pw}" y1="${Y(v)}" y2="${Y(v)}" stroke="${v === 0 ? '#888' : '#e6e3de'}" ${v === 0 ? 'stroke-dasharray="5 4"' : ''}/>`);
      o.push(`<text x="${L - 10}" y="${Y(v) + 4}" text-anchor="end" font-size="11" fill="#2a4f8f">${v > 0 ? '+' + v : v}</text>`);
    }
    o.push(`<text transform="translate(18 ${T + ph / 2}) rotate(-90)" text-anchor="middle" font-size="11" fill="#888" letter-spacing="1">CARGA DE VALOR DEL PROTAGONISTA (−10 / +10)</text>`);
    const step = total > 150 ? 20 : 10;
    for (let pg = 0; pg <= total; pg += step) o.push(`<text x="${X(pg)}" y="${T + ph + 18}" text-anchor="middle" font-size="11" fill="#2a4f8f">${pg}</text>`);
    o.push(`<text x="${L + pw}" y="${T + ph + 36}" text-anchor="end" font-size="10" fill="#999">páginas del guion</text>`);
    // curva de intensidad del step line del proyecto (escala 0-10 a la derecha)
    if (d.mode === 'guion' && d.showCurve && p.scenes.length) {
      const pts = p.scenes.map(s => `${X(s.pos + (s.lengthPages || 0) / 2).toFixed(1)},${(T + (10 - (Number(s.intensity) || 0)) / 10 * ph).toFixed(1)}`);
      o.push(`<polyline points="${pts.join(' ')}" fill="none" stroke="#bbb" stroke-width="1.5" stroke-dasharray="3 3"/>`);
      for (let v = 0; v <= 10; v += 2) o.push(`<text x="${L + pw + 10}" y="${T + (10 - v) / 10 * ph + 4}" font-size="10" fill="#aaa">${v}</text>`);
      o.push(`<text transform="translate(${W - 14} ${T + ph / 2}) rotate(90)" text-anchor="middle" font-size="10" fill="#aaa">intensidad del step line (0–10)</text>`);
    }
    // posiciones ideales
    if (d.showIdeal) HITOS.forEach(h => {
      const x = X(d.mode === 'guion' ? idealPage(h, total) : h.ideal);
      o.push(`<line x1="${x}" x2="${x}" y1="${T + ph - 14}" y2="${T + ph}" stroke="#999" stroke-width="2"/><text x="${x}" y="${T + ph - 18}" text-anchor="middle" font-size="9" fill="#999">${h.n}</text>`);
    });
    // escalones
    const hs = (d.hitos || []).map(h => ({ ...h, pg: parseFloat(h.pag), v: parseFloat(h.carga) })).filter(h => !isNaN(h.pg) && !isNaN(h.v)).sort((a, b) => a.pg - b.pg);
    if (hs.length) {
      let path = `M${X(0)},${Y(hs[0].v)}`;
      hs.forEach((h, i) => { if (i) path += ` H${X(h.pg)} V${Y(h.v)}`; });
      path += ` H${X(total)}`;
      o.push(`<path d="${path}" fill="none" stroke="#d62828" stroke-width="3.5" stroke-linejoin="miter"/>`);
      hs.forEach((h, i) => {
        const x = X(h.pg), y = Y(h.v);
        const up = i % 2 === 0;
        const ly = up ? Math.max(T + 34, y - 44) : Math.min(T + ph - 30, y + 30);
        const lab = (h.etiqueta || HITOS[h.n - 1].nombre).toUpperCase().slice(0, 26);
        const bw = Math.max(lab.length * 6.6, 60) + 16;
        o.push(`<line x1="${x}" x2="${x}" y1="${y}" y2="${ly + (up ? 10 : -10)}" stroke="#2a4f8f" stroke-width="1" stroke-dasharray="2 2"/>`);
        o.push(`<rect x="${x - bw / 2}" y="${ly - 12}" width="${bw}" height="28" rx="6" fill="#fff" stroke="#2a4f8f"/>`);
        o.push(`<text x="${x}" y="${ly}" text-anchor="middle" font-size="10" font-weight="800" fill="#2a4f8f">${h.n} · p.${Math.round(h.pg)}${h.esc ? ' · sec. ' + esc(h.esc) : ''}</text>`);
        o.push(`<text x="${x}" y="${ly + 12}" text-anchor="middle" font-size="10" fill="#222">${esc(lab)}</text>`);
        o.push(`<circle cx="${x}" cy="${y}" r="5" fill="#fff" stroke="#d62828" stroke-width="2.5"><title>${h.n}. ${esc(HITOS[h.n - 1].nombre)} · p.${h.pg} · carga ${h.v}</title></circle>`);
      });
    } else {
      o.push(`<text x="${W / 2}" y="${T + ph / 2}" text-anchor="middle" font-size="14" fill="#aaa">Genera o escribe los hitos para dibujar la gráfica</text>`);
    }
    const legend = [`<tspan fill="#d62828">━ carga de valor (escalones)</tspan>`];
    if (d.showIdeal) legend.push(`<tspan fill="#999">  ▏ página ideal de cada hito</tspan>`);
    if (d.mode === 'guion' && d.showCurve) legend.push(`<tspan fill="#aaa">  ┄ intensidad del step line del proyecto</tspan>`);
    o.push(`<text x="${L}" y="${H - 14}" font-size="11">${legend.join('')}</text>`);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="Helvetica, Arial, sans-serif">${o.join('')}</svg>`;
  }

  /* ---------------- Pestaña ---------------- */
  function tab(p) {
    const d = doc(p);
    if (!d.hitos.length) blankHitos(p, d);
    const total = totalPages(p, d);
    const k = f => 'p:doctor.' + f;
    const cargaSel = i => { const v = String(d.hitos[i].carga); return `<select class="cell-input" data-k="${k('hitos.' + i + '.carga')}" data-rerender="1" style="min-width:70px">${Array.from({ length: 21 }, (_, j) => 10 - j).map(x => `<option value="${x}" ${String(x) === v ? 'selected' : ''}>${x > 0 ? '+' + x : x}</option>`).join('')}</select>`; };
    const actHead = n => ({ 1: 'ACTO I · PLANTEAMIENTO (págs. 1–30 · 25%)', 2: 'ACTO II · CONFRONTACIÓN Y COMPLICACIONES PROGRESIVAS (págs. 30–90 · 50%)', 3: 'ACTO III · DESENLACE (págs. 90–120 · 25%)' })[n];
    const scaled = d.mode === 'guion' && total !== 120;
    let lastAct = 0;
    return `<section class="panel">
      ${A.printHeader(p, 'Script doctor · estructura (Seger + McKee)')}
      <h2>Script doctor · estructura dramática (Linda Seger + Robert McKee)</h2>
      <p class="lead no-print">Los 11 hitos de la estructura en tres actos con la acción dramática y el <b>cambio de valor (+/−)</b> del protagonista en cada uno, y su gráfica stepline. En modo <b>Guion cargado</b> analiza el guion del proyecto y chequea el trabajo previo (tramas, actos, puntos de giro, intensidades del step line y lectura de guion). En modo <b>Premisa</b> desarrolla una estructura de 120 páginas desde una idea.</p>
      <div class="toolbar no-print">
        <button class="btn btn-small ${d.mode === 'guion' ? 'btn-primary' : ''}" data-action="doc-mode" data-v="guion">Guion cargado${p.scenes.length ? ' (' + p.scenes.length + ' sec.)' : ''}</button>
        <button class="btn btn-small ${d.mode === 'premisa' ? 'btn-primary' : ''}" data-action="doc-mode" data-v="premisa">Premisa</button>
      </div>
      ${d.mode === 'premisa' ? `<div class="form-grid">
        ${A.field('Género', A.inp(k('premisa.genero'), 'placeholder="p. ej. thriller político"'))}
        ${A.field('Protagonista y defecto interno', A.area(k('premisa.protagonista'), 'rows="2"'))}
        ${A.field('Objetivo externo y antagonista', A.area(k('premisa.objetivo'), 'rows="2"'))}
        ${A.field('Subtrama (relación secundaria)', A.area(k('premisa.subtrama'), 'rows="2"'))}
        ${A.field('Otras notas (opcional)', A.area(k('premisa.extra'), 'rows="2"'), 'wide')}
      </div>` : `<div class="note">${p.scenes.length ? `Se analizará el guion cargado (${total} págs.) junto con lo ya trabajado en el proyecto. ${scaled ? `Las páginas ideales se escalan a ${total} páginas.` : ''} Para mejores resultados, haz antes el desglose (manual o automático): tramas, puntos de giro e intensidades sirven como referencia y se chequean.` : 'No hay guion cargado en este proyecto: súbelo o usa el modo Premisa.'}</div>`}
      <div class="toolbar no-print" style="margin-top:14px">
        <button class="btn btn-primary" data-action="doc-run" ${busy ? 'disabled' : ''}>${busy ? '<span class="spinner"></span>Analizando… (1-3 min)' : d.mode === 'guion' ? '✦ Analizar la estructura del guion' : '✦ Desarrollar la estructura'}</button>
        <button class="btn btn-small" data-action="doc-clear">Vaciar hitos</button>
        ${d.mode === 'guion' && d.hitos.some(h => h.esc) ? '<button class="btn btn-small" data-action="doc-apply">Pasar los hitos al Step line del proyecto</button>' : ''}
      </div>
    </section>
    <section class="panel">
      <h3 style="margin-top:0">Gráfica stepline · tensión y carga de valor</h3>
      <div class="toolbar no-print">
        <label><input type="checkbox" data-k="${k('showIdeal')}" data-rerender="1" ${d.showIdeal ? 'checked' : ''}> Páginas ideales</label>
        ${d.mode === 'guion' ? `<label><input type="checkbox" data-k="${k('showCurve')}" data-rerender="1" ${d.showCurve ? 'checked' : ''}> Comparar con la intensidad del Step line</label>` : ''}
        <span class="spacer"></span>
        <button class="btn btn-small" data-action="doc-svg">Descargar SVG</button>
        <button class="btn btn-small" data-action="print">Descargar PDF</button>
      </div>
      <div class="stepline-wrap" id="doctorChart">${chart(p, d)}</div>
    </section>
    <section class="panel">
      <div class="form-grid" style="margin-bottom:14px">
        ${A.field('Protagonista (y defecto interno)', A.inp(k('protagonista')))}
        ${A.field('Objetivo externo', A.inp(k('objetivo')))}
        ${A.field('Antagonista', A.inp(k('antagonista')))}
        ${A.field('Subtrama B', A.inp(k('subtramaB')))}
        ${A.field('Pregunta dramática central', A.inp(k('pregunta')), 'wide')}
      </div>
      <div class="table-wrap"><table class="doctor-table">
        <thead><tr><th class="num">#</th><th>Hito</th><th class="num">Pág.</th>${d.mode === 'guion' ? '<th class="num">Sec.</th>' : ''}<th>Etiqueta (≤3 palabras)</th><th>Acción dramática</th><th>Cambio de valor (+/−)</th><th class="num">Carga</th><th>Nota del script doctor</th></tr></thead>
        <tbody>${d.hitos.map((h, i) => {
          const H = HITOS[i];
          const head = H.acto !== lastAct ? (lastAct = H.acto, `<tr class="act-row"><td colspan="${d.mode === 'guion' ? 9 : 8}">${actHead(H.acto)}</td></tr>`) : '';
          const dev = d.mode === 'guion' && h.pag !== '' ? Math.round(parseFloat(h.pag) - idealPage(H, total)) : 0;
          return head + `<tr>
            <td class="num"><b>${H.n}</b></td>
            <td style="min-width:170px"><b>${esc(H.nombre)}</b><div class="muted" style="font-size:11px">${esc(H.def)}<br>Ideal: pág. ${scaled ? '≈' + idealPage(H, total) : H.rango}</div></td>
            <td class="num"><input class="cell-input" type="number" min="0" step="1" style="width:66px;min-width:0" data-k="${k('hitos.' + i + '.pag')}" data-rerender="1" data-lazy="1" value="${esc(h.pag)}">${d.mode === 'guion' && dev ? `<div class="dev ${Math.abs(dev) > total * 0.05 ? 'dev-bad' : ''}">${dev > 0 ? '+' : ''}${dev}</div>` : ''}</td>
            ${d.mode === 'guion' ? `<td class="num"><input class="cell-input" style="width:56px;min-width:0" data-k="${k('hitos.' + i + '.esc')}" value="${esc(h.esc)}"></td>` : ''}
            <td><input class="cell-input" data-k="${k('hitos.' + i + '.etiqueta')}" data-rerender="1" data-lazy="1" value="${esc(h.etiqueta)}" style="min-width:120px"></td>
            <td>${A.area(k('hitos.' + i + '.accion'), 'class="cell-input" style="min-width:240px;min-height:64px"')}</td>
            <td>${A.area(k('hitos.' + i + '.cambio'), 'class="cell-input" style="min-width:150px;min-height:64px"')}</td>
            <td class="num">${cargaSel(i)}</td>
            <td>${A.area(k('hitos.' + i + '.nota'), 'class="cell-input" style="min-width:200px;min-height:64px"')}</td>
          </tr>`;
        }).join('')}</tbody></table></div>
      ${d.mode === 'guion' ? '<p class="muted" style="font-size:12px">Bajo la página: desviación respecto a la página ideal (en rojo si supera el 5% del guion).</p>' : ''}
      <div class="form-grid" style="margin-top:14px">
        ${A.field('Diagnóstico', A.area(k('diagnostico'), 'rows="5"'), 'wide')}
        ${A.field('Recomendaciones', A.area(k('recomendaciones'), 'rows="5"'), 'wide')}
        ${d.mode === 'guion' ? A.field('Coherencia con el trabajo previo del proyecto (step line, giros, actos, tramas)', A.area(k('coherencia'), 'rows="4"'), 'wide') : ''}
      </div>
    </section>`;
  }

  /* ---------------- Acciones ---------------- */
  A.actions['doc-mode'] = el => { const p = A.P(); const d = doc(p); if (d.mode !== el.dataset.v) { d.mode = el.dataset.v; if (!d.hitos.some(h => h.accion || h.etiqueta)) blankHitos(p, d); } A.save(); A.renderTab(); };
  A.actions['doc-run'] = () => {
    const p = A.P(); const d = doc(p);
    if (d.hitos.some(h => h.accion)) A.showModal(`<h3>Volver a generar</h3><p>Se sustituirán los hitos, el diagnóstico y las recomendaciones actuales.</p><div class="actions"><button class="btn" data-action="close-modal">Cancelar</button><button class="btn btn-primary" data-action="doc-run-ok">Continuar</button></div>`);
    else generate(p);
  };
  A.actions['doc-run-ok'] = () => { A.hideModal(); generate(A.P()); };
  A.actions['doc-clear'] = () => { const p = A.P(); const d = doc(p); blankHitos(p, d); ['diagnostico', 'recomendaciones', 'coherencia', 'pregunta'].forEach(x => { d[x] = ''; }); A.save(); A.renderTab(); };
  A.actions['doc-svg'] = () => { const p = A.P(); A.download(A.fileBase(p) + '_script_doctor_stepline.svg', chart(p, doc(p)), 'image/svg+xml'); };
  A.actions['doc-apply'] = () => A.showModal(`<h3>Pasar los hitos al Step line</h3><p>Se marcarán como <b>puntos de giro</b> (globos) las secuencias de los 11 hitos, y los actos del step line empezarán en el primer punto de giro (Desarrollo), el segundo punto de giro (Convergencia / Clímax) y la resolución. Las intensidades no se tocan.</p><div class="actions"><button class="btn" data-action="close-modal">Cancelar</button><button class="btn btn-primary" data-action="doc-apply-ok">Aplicar</button></div>`);
  A.actions['doc-apply-ok'] = () => {
    A.hideModal(); const p = A.P(); const d = doc(p);
    const find = n => p.scenes.find(s => String(s.num).toUpperCase() === String(n).trim().toUpperCase());
    let c = 0;
    d.hitos.forEach((h, i) => { const s = find(h.esc); if (!s) return; s.keyEvent = true; s.eventLabel = (h.etiqueta || HITOS[i].nombre).toUpperCase(); c++; });
    const setAct = (name, n) => { const s = find(n); if (!s) return; p.acts = (p.acts || []).filter(a => a.name !== name); p.acts.push({ name, start: s.id }); };
    setAct('Desarrollo', d.hitos[3] && d.hitos[3].esc);
    setAct('Convergencia / Clímax', d.hitos[7] && d.hitos[7].esc);
    setAct('Resolución', d.hitos[10] && d.hitos[10].esc);
    const order = A.ACTS(); p.acts.sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
    A.save(); A.toast(`${c} hitos marcados en el Step line.`);
  };

  window.ScriptDoctor = { tab, chart, HITOS };
})();
