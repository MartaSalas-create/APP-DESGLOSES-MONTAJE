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
  const editing = new Set();

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

  // el encabezado sin el número de secuencia repetido («7. INT. …  7»)
  const cleanHead = s => String(s.heading || A.sceneHeading(s)).replace(/^\s*\d+[A-Z]?\s*[.\-–)]?\s+(?=\S)/, '').replace(/\s+\d+[A-Z]?\s*$/, '');
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
        <div class="gv-head"><span class="gv-num">${esc(A.dnum(s))}</span>${s.separata ? '<span class="gv-sep">SEPARATA</span>' : ''}${s.rev && !s.separata ? `<span class="gv-sep gv-rev" title="Sustituida por la separata ${esc(s.rev.file || '')} (${esc(s.rev.at || '')})">REVISADA</span>` : ''}${marked(cleanHead(s), [], term)}
          <span class="gv-tools-s no-print">
            <button class="btn btn-small btn-ghost" data-action="gv-move" data-id="${s.id}" data-d="-1" title="Subir la secuencia">↑</button>
            <button class="btn btn-small btn-ghost" data-action="gv-move" data-id="${s.id}" data-d="1" title="Bajar la secuencia">↓</button>
            <button class="btn btn-small btn-ghost" data-action="gv-edit" data-id="${s.id}" title="Editar número, encabezado y texto">✎ Editar</button>
            <button class="btn btn-small btn-ghost" data-action="gv-sep" data-id="${s.id}" title="Añadir una separata (secuencia nueva) después de esta">＋ Separata</button>
            <button class="btn btn-small btn-ghost" data-action="gv-sep-import" data-id="${s.id}" title="Importar una separata desde un archivo (PDF, Final Draft, Fountain, Word o texto) y colocarla a partir de aquí">⇪ Importar</button>
          </span></div>
        <div class="gv-tp"><span>Trama</span>${A.tramaPicker(s)}</div>
        ${editing.has(s.id) ? editForm(s) : `<div class="gv-text" data-id="${s.id}">${body || '<p class="gv-act muted">(Sin texto)</p>'}</div>`}
      </div>
      <aside class="gv-notes">
        ${ns.map((n, i) => noteHTML(s, n, i)).join('')}
        <button class="btn btn-small no-print gv-add" data-action="gv-add" data-id="${s.id}">＋ Nota en la sec. ${esc(A.dnum(s))}</button>
      </aside>
    </section>`;
  }

  function editForm(s) {
    return `<div class="gv-edit" data-id="${s.id}">
      <div class="gv-edit-row">
        <label>Nº<input class="gv-e-num" value="${esc(s.num)}" maxlength="10"></label>
        <label class="grow">Encabezado<input class="gv-e-head" value="${esc(cleanHead(s))}" placeholder="INT. LOCALIZACIÓN - DÍA"></label>
        <label>Octavos<input class="gv-e-oct" type="number" min="1" step="1" value="${s.eighths || 1}"></label>
      </div>
      <label>Texto de la secuencia <small>(acción; el personaje en MAYÚSCULAS en su línea y debajo el diálogo; deja una línea en blanco entre bloques)</small>
        <textarea class="gv-e-text" rows="${Math.min(30, Math.max(8, String(s.text || '').split('\n').length + 2))}">${esc(s.text || '')}</textarea></label>
      <div class="gv-edit-f">
        <button class="btn btn-small btn-primary" data-action="gv-save" data-id="${s.id}">Guardar</button>
        <button class="btn btn-small" data-action="gv-cancel" data-id="${s.id}">Cancelar</button>
        ${s.separata ? `<span class="spacer"></span><button class="btn btn-small btn-ghost gv-danger" data-action="gv-delsep" data-id="${s.id}">Eliminar esta separata</button>` : ''}
        <small class="muted">Al guardar se actualizan INT/EXT, localización, momento del día y personajes.</small>
      </div>
    </div>`;
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
        <button class="btn btn-small" data-action="gv-sep-import" title="Importar separata: secuencias nuevas o revisadas desde un archivo">⇪ Importar separata</button>
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

  /* ---------- edición del guion: número, encabezado, texto, orden y separatas ---------- */
  const SP = () => window.ScriptParser;
  // posición en páginas (para las líneas de tiempo): acumulada en el orden del guion, por episodio
  function recomputePos() {
    const R = A.RP(); const acc = {};
    R.scenes.forEach(s => { const k = s.ep || ''; if (acc[k] == null) acc[k] = Math.min(...R.scenes.filter(x => (x.ep || '') === k).map(x => Number(x.pos) || 0)); s.pos = acc[k]; acc[k] += s.lengthPages || 0.125; });
  }
  function move(id, d) {
    const view = A.P().scenes; const i = view.findIndex(s => s.id === id); const nb = view[i + d];
    if (i < 0 || !nb) return;
    const R = A.RP().scenes; const s = R.splice(R.findIndex(x => x.id === id), 1)[0];
    const j = R.findIndex(x => x.id === nb.id);
    R.splice(d < 0 ? j : j + 1, 0, s);
    recomputePos(); A.save(); A.renderTab();
    const el = document.getElementById('gv-' + id); if (el) el.scrollIntoView({ block: 'center' });
  }
  function nextSepNum(base) {
    const nums = new Set(A.P().scenes.map(s => String(s.num).toUpperCase()));
    const b = String(base).replace(/[A-Z]+$/i, '');
    for (let c = 65; c < 91; c++) { const n = b + String.fromCharCode(c); if (!nums.has(n)) return n; }
    return b + '-' + A.uid().slice(0, 3);
  }
  function addSeparata(afterId) {
    const R = A.RP(); const prev = R.scenes.find(s => s.id === afterId); if (!prev) return;
    const s = {
      id: 's' + A.uid(), num: nextSepNum(prev.num), intExt: '', location: 'NUEVA SECUENCIA', time: '', heading: '',
      page: prev.page, pos: (prev.pos || 0) + (prev.lengthPages || 0), lengthPages: 0.125, eighths: 1,
      characters: [], offCharacters: [], summary: '', summaryEdited: false, conflict: '', tramaId: prev.tramaId || '',
      intensity: prev.intensity != null ? prev.intensity : 5, keyEvent: false, eventLabel: '', needs: { sobrante: false }, notes: {}, text: '', separata: true
    };
    if (prev.ep != null) s.ep = prev.ep;
    R.scenes.splice(R.scenes.indexOf(prev) + 1, 0, s);
    const mo = R.montajeOrder || (R.montajeOrder = []); const k = mo.indexOf(prev.id); mo.splice(k >= 0 ? k + 1 : mo.length, 0, s.id);
    recomputePos(); editing.add(s.id); A.save(); A.renderTab();
    const el = document.querySelector(`.gv-edit[data-id="${s.id}"] .gv-e-head`); if (el) { el.focus(); el.scrollIntoView({ block: 'center' }); }
  }
  function saveEdit(id) {
    const box = document.querySelector(`.gv-edit[data-id="${id}"]`); const s = A.sceneById(A.P(), id); if (!box || !s) return;
    const num = box.querySelector('.gv-e-num').value.trim(), head = box.querySelector('.gv-e-head').value.trim();
    const text = box.querySelector('.gv-e-text').value.replace(/\r/g, '').replace(/\s+$/, '');
    const oct = Math.max(1, Math.round(Number(box.querySelector('.gv-e-oct').value) || s.eighths || 1));
    if (num && A.P().scenes.some(x => x.id !== id && String(x.num).toUpperCase() === num.toUpperCase())) { A.toast(`Ya hay una sec. ${num}. Elige otro número.`); return; }
    if (num) s.num = num;
    if (head) {
      s.heading = head;
      const h = SP() && SP().parseHeading(head);
      if (h) { s.intExt = h.intExt || ''; s.location = h.location || head.toUpperCase(); s.time = h.time || ''; } else { s.intExt = ''; s.location = head.toUpperCase(); s.time = ''; }
    }
    s.text = text;
    if (oct !== s.eighths) { s.eighths = oct; s.lengthPages = oct / 8; recomputePos(); }
    // personajes y resumen a partir del texto nuevo
    try {
      const tl = SP().textToLines((head || s.heading || 'INT. X - DÍA') + '\n\n' + text);
      const sc = SP().buildScenes(SP().classifyLines(tl.lines, false), tl.pages).scenes[0];
      if (sc) {
        s.characters = sc.characters.slice(); s.offCharacters = (sc.offCharacters || []).slice();
        if (!s.summaryEdited) s.summary = sc.summary || '';
        Object.keys(sc.needs || {}).forEach(k => { if (sc.needs[k]) s.needs[k] = true; });
        A.ensureCharacters(A.RP());
      }
    } catch (e) { console.warn(e); }
    editing.delete(id); A.save(); A.renderTab(); A.toast(`Sec. ${A.dnum(s)} guardada.`);
  }
  A.actions['gv-move'] = el => move(el.dataset.id, +el.dataset.d);
  A.actions['gv-edit'] = el => { editing.add(el.dataset.id); A.renderTab(); const t = document.querySelector(`.gv-edit[data-id="${el.dataset.id}"] .gv-e-text`); if (t) t.focus(); };
  A.actions['gv-cancel'] = el => { editing.delete(el.dataset.id); A.renderTab(); };
  A.actions['gv-save'] = el => saveEdit(el.dataset.id);
  A.actions['gv-sep'] = el => addSeparata(el.dataset.id);
  A.actions['gv-delsep'] = el => {
    const R = A.RP(); const id = el.dataset.id; const s = R.scenes.find(x => x.id === id); if (!s || !s.separata) return;
    R.scenes.splice(R.scenes.indexOf(s), 1); R.montajeOrder = (R.montajeOrder || []).filter(x => x !== id);
    (R.acts || []).forEach(a => { if (a.start === id) a.start = (R.scenes[0] || {}).id; });
    editing.delete(id); recomputePos(); A.save(); A.renderTab(); A.toast('Separata eliminada.');
  };

  /* ---------- importar separata desde archivo ---------- */
  const fileIn = document.createElement('input');
  fileIn.type = 'file'; fileIn.accept = '.pdf,.fdx,.fountain,.spmd,.txt,.docx,image/*,.heic,.heif'; fileIn.multiple = true; fileIn.hidden = true; fileIn.id = 'gvSepFile';
  document.body.appendChild(fileIn);
  let sepAnchor = null, sepParsed = null;
  const normNum = n => String(n || '').toUpperCase().replace(/\s+/g, '');
  // «24.25» (capítulo.secuencia) equivale a la sec. 25
  const numTail = n => normNum(n).split(/[.\-]/).pop();
  A.actions['gv-sep-import'] = el => { sepAnchor = el.dataset.id || null; fileIn.value = ''; fileIn.click(); };
  const isImg = f => /^image\//.test(f.type) || /\.(jpe?g|png|webp|gif|heic|heif|tiff?|bmp)$/i.test(f.name);
  const prog = (t, sub) => A.showModal(`<h3><span class="spinner"></span>${esc(t)}</h3><p id="gvSepProg">${esc(sub || '')}</p>`);
  fileIn.addEventListener('change', async () => {
    const files = Array.from(fileIn.files || []); if (!files.length) return;
    const name = files.length > 1 ? `${files.length} archivos` : files[0].name;
    prog('Leyendo la separata…', name);
    try {
      let scenes = [];
      const imgs = files.filter(isImg), docs = files.filter(f => !isImg(f));
      for (const f of docs) {
        let r = null, err = null;
        try { r = await SP().parseFile(f); } catch (e) { err = e; }
        if (r && r.scenes && r.scenes.length) scenes = scenes.concat(r.scenes);
        else if (/\.pdf$/i.test(f.name)) { prog('Es un PDF escaneado: leyendo las páginas…', f.name); scenes = scenes.concat(await ocrScenes(await pdfPages(f), f.name)); } // sin texto: se lee como imagen
        else if (err) throw err;
      }
      if (imgs.length) scenes = scenes.concat(await ocrScenes(imgs, name));
      if (!scenes.length) throw new Error('No se ha encontrado ninguna secuencia (encabezados INT./EXT.).');
      sepParsed = { file: name, scenes };
      reviewModal();
    } catch (e) {
      A.showModal(`<h3>No se ha podido importar</h3><p style="white-space:pre-wrap">${esc(e.message || e)}</p><div class="actions"><button class="btn btn-primary" data-action="close-modal">Cerrar</button></div>`);
    }
  });
  /* Imágenes y PDF escaneados: Claude lee las páginas y las transcribe en formato guion */
  const OCR_PROMPT = `Eres el ayudante de una montadora de cine. Te paso fotos o escaneos de páginas de un guion (completo o una separata). Transcribe TODO el texto de las páginas (incluida la portada si la hay), en el orden en que aparecen, en texto plano y con este formato exacto, sin comentarios ni Markdown:
- Cada encabezado de secuencia en su propia línea, con su número delante tal como aparece (p. ej. «12A. INT. COCINA - NOCHE»). Si el número aparece en el margen, ponlo delante.
- Una línea en blanco entre bloques.
- El nombre del personaje que habla en MAYÚSCULAS en su propia línea (con (OFF), (V.O.) o (CONT'D) si los lleva) y, debajo, su diálogo con 4 espacios al principio de cada línea. Las acotaciones entre paréntesis en su propia línea, también con 4 espacios.
- Las transiciones (CORTE A:, FUNDIDO A NEGRO…) en su propia línea.
- No transcribas números de página, cabeceras ni pies de página, marcas de revisión (asteriscos) ni el texto «CONTINÚA» / «(MORE)».
- Si la página está rayada o anotada a mano (líneas verticales de cobertura, círculos, números de plano o de toma, fechas, tachones, firmas), IGNORA todo lo manuscrito: transcribe solo el texto mecanografiado del guion.
- Respeta la ortografía del original. Si una palabra no se lee, escribe [ilegible].`;
  async function shrink(blob) {
    try {
      const bmp = await createImageBitmap(blob);
      const k = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
      const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
      c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
      return await new Promise(res => c.toBlob(b => res(b || blob), 'image/jpeg', 0.88));
    } catch (e) { return blob; } // formato que el navegador no puede redibujar: se envía tal cual
  }
  async function pdfPages(file) {
    const lib = window.pdfjsLib; if (!lib) throw new Error('No se ha podido cargar el lector de PDF.');
    const pdf = await lib.getDocument({ data: await file.arrayBuffer() }).promise; const out = [];
    for (let i = 1; i <= Math.min(pdf.numPages, 40); i++) {
      const pg = await pdf.getPage(i); const vp = pg.getViewport({ scale: 2 });
      const c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height;
      await pg.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
      out.push(await new Promise(res => c.toBlob(res, 'image/jpeg', 0.88)));
    }
    return out;
  }
  async function ocrScenes(blobs, name) { return (await ocrParse(blobs, name)).scenes || []; }
  async function ocrParse(blobs, name) {
    const sample = window.claude && typeof window.claude.use === 'function' ? await window.claude.use('sample') : null;
    if (!sample) throw new Error('Leer imágenes necesita la versión de la app en claude.ai (usa Claude para leer el texto).');
    const lim = sample.limits ? await sample.limits() : { images: true };
    if (!lim || !lim.images) throw new Error('En esta vista no se pueden enviar imágenes a Claude.');
    const per = Math.max(1, Math.min(5, Number(lim.maxImages) || 5));
    let text = '';
    for (let i = 0; i < blobs.length; i += per) {
      const part = blobs.slice(i, i + per);
      const el = document.getElementById('gvSepProg'); if (el) el.textContent = `Leyendo ${blobs.length > 1 ? `páginas ${i + 1}–${i + part.length} de ${blobs.length}` : 'la imagen'} con Claude…`;
      const r = await sample(OCR_PROMPT, { images: await Promise.all(part.map(shrink)), modelTier: 'complex', cache: false });
      text += '\n\n' + String((r && r.text) || '').replace(/^```[a-z]*\n?|```$/gm, '');
    }
    if (!text.trim()) throw new Error('Claude no ha devuelto texto de las imágenes. Prueba con una foto más nítida.');
    let r;
    try { r = await SP().parseFile(new File([text.trim()], (name || 'separata').replace(/\.[^.]+$/, '') + '.txt', { type: 'text/plain' })); }
    catch (e) { throw new Error('Se ha leído el texto de la imagen, pero no se ha encontrado ningún encabezado de secuencia (INT./EXT., INTERIOR/EXTERIOR). Esto es lo que se ha leído:\n\n' + text.trim().slice(0, 600)); }
    r.format = 'leído de imagen con Claude'; r.filename = name; r.ocr = true; r.ocrText = text.trim();
    return r;
  }

  function reviewModal() {
    const view = A.P().scenes; const anchor = sepAnchor && view.find(x => x.id === sepAnchor);
    const rows = sepParsed.scenes.map((ps, i) => {
      const same = view.find(x => normNum(x.num) === normNum(ps.num)) || view.find(x => numTail(x.num) && numTail(x.num) === numTail(ps.num));
      const opts = (same ? [`<option value="replace:${same.id}" selected>Sustituir la sec. ${esc(A.dnum(same))}</option>`] : [])
        .concat([`<option value="add" ${same ? '' : 'selected'}>Añadir como nueva${anchor ? ` tras la sec. ${esc(A.dnum(anchor))}` : ''}</option>`, '<option value="skip">No importar</option>']);
      return `<tr><td class="num"><b>${esc(ps.num)}</b></td><td>${esc(cleanHead(ps))}<div class="muted" style="font-size:11px">${esc(String(ps.summary || '').slice(0, 90))}</div></td><td class="num">${ps.eighths || 1}/8</td><td><select class="gv-imp" data-i="${i}">${opts.join('')}</select></td></tr>`;
    }).join('');
    A.showModal(`<h3>Importar separata · ${esc(sepParsed.file)}</h3>
      <p>${sepParsed.scenes.length} secuencia${sepParsed.scenes.length === 1 ? '' : 's'} encontrada${sepParsed.scenes.length === 1 ? '' : 's'}. Si venía de una foto o un escaneo, revisa el texto después con <b>✎ Editar</b>. Si el número coincide con una secuencia del guion, se propone <b>sustituirla</b>: cambian el encabezado, el texto, los octavos y los personajes, y se conservan tus notas, trama, estados y adjuntos. Las demás se añaden como <b>separatas</b> ${anchor ? `a partir de la sec. ${esc(A.dnum(anchor))}` : 'en su sitio según el número (12A detrás de la 12)'}.</p>
      <div class="table-wrap" style="max-height:50vh;overflow:auto"><table class="gv-imp-t"><thead><tr><th class="num">Nº</th><th>Secuencia</th><th class="num">Oct.</th><th>Qué hacer</th></tr></thead><tbody>${rows}</tbody></table></div>
      <div class="actions"><button class="btn" data-action="close-modal">Cancelar</button><button class="btn btn-primary" data-action="gv-sep-apply">Importar</button></div>`);
  }
  // dónde va una secuencia nueva: tras el ancla (en orden) o tras la de su número base (12A → 12)
  function placeAfter(num, lastAdded) {
    const view = A.P().scenes;
    if (sepAnchor) return lastAdded || sepAnchor;
    const base = parseInt(String(num), 10);
    if (!isNaN(base)) {
      const cands = view.filter(x => parseInt(String(x.num), 10) === base && normNum(x.num) <= normNum(num));
      if (cands.length) return cands[cands.length - 1].id;
      const prev = view.filter(x => { const n = parseInt(String(x.num), 10); return !isNaN(n) && n < base; });
      if (prev.length) return prev.reduce((a, b) => (parseInt(b.num, 10) >= parseInt(a.num, 10) ? b : a)).id;
    }
    return view.length ? view[view.length - 1].id : null;
  }
  A.actions['gv-sep-apply'] = () => {
    if (!sepParsed) return;
    const R = A.RP(); const today = new Date().toISOString().slice(0, 10);
    const choice = Array.from(document.querySelectorAll('select.gv-imp')).map(sel => sel.value);
    let added = 0, replaced = 0, lastAdded = null;
    sepParsed.scenes.forEach((ps, i) => {
      const c = choice[i] || 'skip';
      if (c === 'skip') return;
      if (c.startsWith('replace:')) {
        const s = R.scenes.find(x => x.id === c.slice(8)); if (!s) return;
        Object.assign(s, { heading: ps.heading, intExt: ps.intExt, location: ps.location, time: ps.time, text: ps.text || '', characters: ps.characters.slice(), offCharacters: (ps.offCharacters || []).slice(), eighths: ps.eighths || s.eighths, lengthPages: ps.lengthPages || s.lengthPages });
        if (!s.summaryEdited) s.summary = ps.summary || '';
        Object.keys(ps.needs || {}).forEach(k => { if (ps.needs[k]) s.needs[k] = true; });
        s.rev = { file: sepParsed.file, at: today };
        replaced++;
        return;
      }
      const afterId = placeAfter(ps.num, lastAdded); const prev = R.scenes.find(x => x.id === afterId);
      const ns = {
        id: 's' + A.uid(), num: A.P().scenes.some(x => normNum(x.num) === normNum(ps.num)) ? nextSepNum(ps.num) : (ps.num || nextSepNum(prev ? prev.num : '1')),
        intExt: ps.intExt, location: ps.location, time: ps.time, heading: ps.heading, page: prev ? prev.page : 1, pos: 0,
        lengthPages: ps.lengthPages || 0.125, eighths: ps.eighths || 1, characters: ps.characters.slice(), offCharacters: (ps.offCharacters || []).slice(),
        summary: ps.summary || '', summaryEdited: false, conflict: '', tramaId: prev ? prev.tramaId || '' : '', intensity: prev && prev.intensity != null ? prev.intensity : 5,
        keyEvent: false, eventLabel: '', needs: Object.assign({ sobrante: false }, ps.needs), notes: {}, text: ps.text || '', separata: true, rev: { file: sepParsed.file, at: today }
      };
      if (prev && prev.ep != null) ns.ep = prev.ep;
      const at = prev ? R.scenes.indexOf(prev) + 1 : R.scenes.length;
      R.scenes.splice(at, 0, ns);
      const mo = R.montajeOrder || (R.montajeOrder = []); const k = prev ? mo.indexOf(prev.id) : -1; mo.splice(k >= 0 ? k + 1 : mo.length, 0, ns.id);
      lastAdded = ns.id; added++;
    });
    recomputePos(); A.ensureCharacters(R); A.hideModal(); A.save(); A.renderTab();
    A.toast(`Separata importada: ${added} nueva${added === 1 ? '' : 's'}, ${replaced} sustituida${replaced === 1 ? '' : 's'}.`);
    const first = lastAdded && document.getElementById('gv-' + lastAdded); if (first) first.scrollIntoView({ block: 'center' });
    sepParsed = null;
  };

  window.GuionView = { tab, blocks, ocrParse, pdfPages, isImg };
})();
