/* ==========================================================================
   PESTAÑA «GUION»: lectura del guion maquetado por secuencias, con notas.
   Selecciona un fragmento del texto → «＋ Nota con la cita». Cada nota se
   asigna a un departamento y se pasa con un toque a las notas del desglose.
   ========================================================================== */
(function () {
  'use strict';
  const A = window.DesgloseApp;
  const { esc } = A;
  let search = '', onlyNotes = false;

  const notesOf = s => (s.gnotes = s.gnotes || []);
  const RE_CUE = /^[A-ZÁÉÍÓÚÑÜ0-9][A-ZÁÉÍÓÚÑÜ0-9 .,'’\-]{0,38}(\s*\([^)]*\))?$/;
  const RE_TRANS = /^(CORTE A|CORTA A|FUNDIDO|ENCADENA|DISUELVE|CUT TO|FADE|SMASH CUT|TRANSICIÓN)[^a-z]*:?$/;

  // Bloques del texto de una secuencia: acción, personaje, acotación, diálogo, transición
  function blocks(text) {
    const out = [];
    String(text || '').replace(/\r/g, '').split(/\n\s*\n/).forEach(par => {
      const lines = par.split('\n').map(l => l.replace(/\s+$/, '')).filter(l => l.trim());
      if (!lines.length) return;
      const first = lines[0].trim();
      if (RE_TRANS.test(first) && lines.length === 1) { out.push({ k: 'trans', t: first }); return; }
      if (RE_CUE.test(first) && lines.length > 1 && /[A-ZÁÉÍÓÚÑ]{2}/.test(first)) {
        out.push({ k: 'cue', t: first });
        let dl = [];
        const flush = () => { if (dl.length) { out.push({ k: 'dlg', t: dl.join(' ') }); dl = []; } };
        lines.slice(1).forEach(l => { const t = l.trim(); if (/^\(.*\)$/.test(t)) { flush(); out.push({ k: 'par', t }); } else dl.push(t); });
        flush();
        return;
      }
      out.push({ k: 'act', t: lines.map(l => l.trim()).join(' ') });
    });
    return out;
  }

  // Resalta las citas de las notas y la búsqueda (sin romper el escapado)
  function marked(str, quotes, term) {
    const marks = [];
    quotes.forEach(q => { if (!q.q) return; const i = str.indexOf(q.q); if (i >= 0) marks.push({ a: i, b: i + q.q.length, cls: 'gv-q', n: q.n }); });
    if (term) { const low = str.toLowerCase(); let i = low.indexOf(term); while (i >= 0) { marks.push({ a: i, b: i + term.length, cls: 'gv-hit' }); i = low.indexOf(term, i + term.length); } }
    if (!marks.length) return esc(str);
    marks.sort((x, y) => x.a - y.a);
    let out = '', at = 0;
    marks.forEach(m => { if (m.a < at) return; out += esc(str.slice(at, m.a)) + `<mark class="${m.cls}"${m.n ? ` title="Nota ${m.n}"` : ''}>${esc(str.slice(m.a, m.b))}${m.n ? `<sup>${m.n}</sup>` : ''}</mark>`; at = m.b; });
    return out + esc(str.slice(at));
  }

  const lineFor = n => (n.q ? `«${n.q}» — ` : '') + (n.t || '').trim();

  function noteHTML(s, n, i) {
    const k = f => `s:${s.id}:gnotes.${i}.${f}`;
    const changed = n.sent && (n.sentStr !== lineFor(n) || n.sentD !== n.d);
    return `<div class="gv-note ${n.sent ? 'sent' : ''}">
      <div class="gv-note-h"><span class="gv-n">${i + 1}</span>
        <select data-k="${k('d')}" data-rerender="1" class="gv-dept">${Object.entries(A.DEPTS).map(([d, l]) => `<option value="${d}" ${n.d === d ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>
        <button class="btn btn-small btn-ghost no-print" data-action="gv-del" data-id="${s.id}" data-i="${i}" title="Borrar nota">✕</button></div>
      ${n.q ? `<div class="gv-quote">«${esc(n.q)}»</div>` : ''}
      ${A.area(k('t'), 'class="cell-input gv-text-in" rows="2" placeholder="Escribe la nota…"')}
      <div class="gv-note-f no-print">${n.sent && !changed
        ? `<span class="gv-ok">✓ En el desglose · Notas ${esc(A.DEPTS[n.d] || '')}</span><button class="btn btn-small btn-ghost" data-action="gv-unsend" data-id="${s.id}" data-i="${i}">Quitar del desglose</button>`
        : `<button class="btn btn-small btn-primary" data-action="gv-send" data-id="${s.id}" data-i="${i}">${changed ? '↻ Actualizar en el desglose' : '→ Añadir al desglose'}</button>`}</div>
    </div>`;
  }

  function sceneHTML(p, s, term) {
    const t = A.tramaOf(p, s);
    const ns = notesOf(s);
    const quotes = ns.map((n, i) => ({ q: n.q, n: i + 1 }));
    const body = blocks(s.text).map(b => `<p class="gv-${b.k}">${marked(b.t, quotes, term)}</p>`).join('');
    return `<section class="gv-scene" id="gv-${s.id}">
      <div class="gv-page" style="${t ? `border-left-color:${t.color}` : ''}">
        <div class="gv-head"><span class="gv-num">${esc(A.dnum(s))}</span>${marked(s.heading || A.sceneHeading(s), [], term)}${t ? `<span class="gv-trama" style="background:${t.color}">${esc(t.letter)}</span>` : ''}</div>
        <div class="gv-text" data-id="${s.id}">${body || '<p class="gv-act muted">(Sin texto)</p>'}</div>
      </div>
      <aside class="gv-notes">
        ${ns.map((n, i) => noteHTML(s, n, i)).join('')}
        <button class="btn btn-small no-print gv-add" data-action="gv-add" data-id="${s.id}">＋ Nota en la sec. ${esc(A.dnum(s))}</button>
      </aside>
    </section>`;
  }

  function tab(p) {
    const term = search.trim().toLowerCase();
    const all = p.scenes;
    const total = all.reduce((a, s) => a + notesOf(s).length, 0);
    const pend = all.reduce((a, s) => a + notesOf(s).filter(n => !n.sent || n.sentStr !== lineFor(n) || n.sentD !== n.d).length, 0);
    let list = all;
    if (onlyNotes) list = list.filter(s => notesOf(s).length);
    if (term) list = list.filter(s => ((s.heading || '') + '\n' + (s.text || '')).toLowerCase().includes(term));
    return `<section class="panel gv">
      ${A.printHeader(p, 'Guion con notas')}
      <h2>Guion</h2>
      <p class="lead">Lee el guion por secuencias. <b>Selecciona un fragmento</b> del texto y pulsa <b>＋ Nota con la cita</b>, o usa <b>＋ Nota</b> en cualquier secuencia. Elige el departamento y pulsa <b>Añadir al desglose</b>: la nota se suma a las notas de ese departamento en el Desglose de montaje.</p>
      <div class="toolbar no-print gv-tools">
        <input type="search" id="gvSearch" placeholder="Buscar en el guion…" value="${esc(search)}">
        <select data-action-change="gv-go"><option value="">Ir a la sec…</option>${all.map(s => `<option value="${s.id}">Sec. ${esc(A.dnum(s))} · ${esc(s.location.slice(0, 36))}</option>`).join('')}</select>
        <label class="gv-only"><input type="checkbox" data-action-change="gv-only" ${onlyNotes ? 'checked' : ''}> Solo secuencias con notas</label>
        <span class="spacer"></span>
        <span class="muted">${total} nota${total === 1 ? '' : 's'}${pend ? ` · <b>${pend}</b> sin pasar al desglose` : total ? ' · todas en el desglose' : ''}</span>
        ${pend ? `<button class="btn btn-small btn-primary" data-action="gv-send-all">→ Pasar todas al desglose</button>` : ''}
        <button class="btn btn-small" data-action="print">Descargar PDF</button>
      </div>
      ${term || onlyNotes ? `<p class="muted no-print">${list.length} de ${all.length} secuencias${term ? ` contienen «${esc(search.trim())}»` : ''}.</p>` : ''}
      <div class="gv-list">${list.map(s => sceneHTML(p, s, term)).join('') || '<p class="muted">Ninguna secuencia coincide.</p>'}</div>
    </section>`;
  }

  /* ---------- acciones ---------- */
  function addNote(id, q) {
    const s = A.sceneById(A.P(), id); if (!s) return;
    const ns = notesOf(s);
    ns.push({ id: A.uid(), q: (q || '').replace(/\s+/g, ' ').trim().slice(0, 400), t: '', d: 'montaje', sent: false });
    A.save(); A.renderTab();
    const el = document.querySelector(`[data-k="s:${id}:gnotes.${ns.length - 1}.t"]`);
    if (el) { el.focus(); el.scrollIntoView({ block: 'nearest' }); }
  }
  function removeFromDesglose(s, n) {
    if (!n.sent || !n.sentStr) return;
    const d = n.sentD || n.d; const cur = String(s.notes[d] || '');
    const i = cur.indexOf(n.sentStr);
    if (i >= 0) s.notes[d] = (cur.slice(0, i) + cur.slice(i + n.sentStr.length)).replace(/\n{2,}/g, '\n').replace(/^\n|\n$/g, '');
  }
  function send(s, n) {
    if (!(n.t || '').trim() && !n.q) return false;
    removeFromDesglose(s, n);
    const line = lineFor(n);
    const cur = String(s.notes[n.d] || '').trim();
    s.notes[n.d] = cur ? cur + '\n' + line : line;
    n.sent = true; n.sentStr = line; n.sentD = n.d;
    return true;
  }
  const at = el => { const s = A.sceneById(A.P(), el.dataset.id); return { s, n: s && notesOf(s)[+el.dataset.i] }; };
  A.actions['gv-add'] = el => addNote(el.dataset.id, '');
  // borrar la nota la quita también del desglose (si se había pasado)
  A.actions['gv-del'] = el => { const { s, n } = at(el); if (!n) return; const was = n.sent; removeFromDesglose(s, n); notesOf(s).splice(+el.dataset.i, 1); A.save(); A.renderTab(); if (was) A.toast('Nota borrada (también del desglose).'); };
  A.actions['gv-send'] = el => { const { s, n } = at(el); if (!n) return; if (!send(s, n)) { A.toast('Escribe la nota antes de pasarla al desglose.'); return; } A.save(); A.renderTab(); A.toast(`Añadida a Notas ${A.DEPTS[n.d]} · sec. ${A.dnum(s)}`); };
  A.actions['gv-unsend'] = el => { const { s, n } = at(el); if (!n) return; removeFromDesglose(s, n); n.sent = false; delete n.sentStr; delete n.sentD; A.save(); A.renderTab(); };
  A.actions['gv-send-all'] = () => {
    let k = 0; A.P().scenes.forEach(s => notesOf(s).forEach(n => { if (!n.sent || n.sentStr !== lineFor(n) || n.sentD !== n.d) { if (send(s, n)) k++; } }));
    A.save(); A.renderTab(); A.toast(k ? `${k} nota${k === 1 ? '' : 's'} pasada${k === 1 ? '' : 's'} al desglose.` : 'No había notas con texto por pasar.');
  };
  A.changeActions['gv-go'] = el => { const t = document.getElementById('gv-' + el.value); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); el.value = ''; };
  A.changeActions['gv-only'] = el => { onlyNotes = el.checked; A.renderTab(); };

  // búsqueda: se aplica al dejar de escribir (sin perder el foco)
  let tmr = null;
  document.addEventListener('input', e => {
    if (e.target.id !== 'gvSearch') return;
    search = e.target.value; clearTimeout(tmr);
    tmr = setTimeout(() => { A.renderTab(); const el = document.getElementById('gvSearch'); if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } }, 350);
  });

  /* ---------- seleccionar texto → nota con la cita ---------- */
  const btn = document.createElement('button');
  btn.className = 'gv-selbtn no-print'; btn.type = 'button'; btn.textContent = '＋ Nota con la cita'; btn.hidden = true;
  document.body.appendChild(btn);
  let pending = null;
  function onSel() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) { btn.hidden = true; pending = null; return; }
    const r = sel.getRangeAt(0);
    const box = el => (el.nodeType === 1 ? el : el.parentElement).closest('.gv-text');
    const a = box(r.startContainer), b = box(r.endContainer);
    if (!a || a !== b) { btn.hidden = true; pending = null; return; }
    const q = sel.toString().trim(); if (!q) { btn.hidden = true; return; }
    pending = { id: a.dataset.id, q };
    const rc = r.getBoundingClientRect();
    btn.style.left = Math.max(8, Math.min(window.innerWidth - 190, rc.left + rc.width / 2 - 85)) + 'px';
    btn.style.top = Math.max(8, rc.top - 44) + 'px';
    btn.hidden = false;
  }
  document.addEventListener('selectionchange', () => { if (A.getTab() === 'guion') onSel(); else btn.hidden = true; });
  window.addEventListener('scroll', () => { if (!btn.hidden) onSel(); }, { passive: true });
  // pointerdown + preventDefault: la selección no se pierde al tocar el botón (también en iPad)
  btn.addEventListener('pointerdown', e => { e.preventDefault(); });
  btn.addEventListener('click', () => { if (!pending) return; const { id, q } = pending; btn.hidden = true; pending = null; window.getSelection().removeAllRanges(); addNote(id, q); });

  window.GuionView = { tab, blocks };
})();
