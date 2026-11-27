/* ==========================================================================
   ADJUNTOS POR SECUENCIA (guion rayado, parte de script…)
   - En la página publicada de claude.ai los archivos se guardan con el
     proyecto (capacidad «assets»: PDF, imágenes, texto; máx. 20 MB).
   - Abierta en local, se guardan en el propio navegador (IndexedDB).
   En cada secuencia se guarda solo la referencia: {id, name, type, size, tipo, store}.
   ========================================================================== */
(function () {
  'use strict';
  const A = window.DesgloseApp;
  const { esc } = A;
  const TIPOS = ['Guion rayado', 'Parte de script', 'Guion rayado + parte', 'Documento'];
  let assets = null, assetsTried = false;

  async function getAssets() {
    if (assetsTried) return assets;
    assetsTried = true;
    if (window.claude && typeof window.claude.use === 'function') {
      try { assets = await window.claude.use('assets'); } catch (e) { assets = null; }
    }
    return assets;
  }
  if (window.claude) getAssets().then(() => { if (A.getTab() === 'montaje') A.renderTab(); });

  /* ---------- almacenamiento local (IndexedDB) ---------- */
  let dbp = null;
  function idb() {
    if (dbp) return dbp;
    dbp = new Promise((res, rej) => {
      const r = indexedDB.open('desglose-adjuntos', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('files');
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    });
    return dbp;
  }
  async function idbPut(key, blob) { const db = await idb(); return new Promise((res, rej) => { const tx = db.transaction('files', 'readwrite'); tx.objectStore('files').put(blob, key); tx.oncomplete = res; tx.onerror = () => rej(tx.error); }); }
  async function idbGet(key) { const db = await idb(); return new Promise((res, rej) => { const tx = db.transaction('files'); const q = tx.objectStore('files').get(key); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); }
  async function idbDel(key) { const db = await idb(); return new Promise(res => { const tx = db.transaction('files', 'readwrite'); tx.objectStore('files').delete(key); tx.oncomplete = res; tx.onerror = res; }); }

  /* ---------- utilidades ---------- */
  const fmtSize = b => b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB';
  const guessTipo = name => /rayad/i.test(name) && /parte|report/i.test(name) ? 'Guion rayado + parte' : /rayad|lined/i.test(name) ? 'Guion rayado' : /parte|report|informe|continuity/i.test(name) ? 'Parte de script' : 'Documento';
  const typeOf = f => {
    if (f.type) return f.type;
    const ext = (f.name.split('.').pop() || '').toLowerCase();
    return ({ pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', txt: 'text/plain', csv: 'text/csv', md: 'text/markdown' })[ext] || '';
  };
  const icon = t => /pdf/.test(t) ? '📄' : /image/.test(t) ? '🖼' : '📎';
  const list = s => (s.adjuntos = Array.isArray(s.adjuntos) ? s.adjuntos : []);

  async function addFiles(s, files) {
    const store = await getAssets();
    let ok = 0; const errors = [];
    for (const f of Array.from(files)) {
      const type = typeOf(f);
      try {
        let ref;
        if (store) {
          const r = await store.upload(f, type ? { type } : undefined);
          ref = { id: r.id, store: 'asset', size: r.sizeBytes, type: r.contentType };
        } else {
          const id = 'loc_' + A.uid() + A.uid();
          await idbPut(id, f);
          ref = { id, store: 'local', size: f.size, type };
        }
        list(s).push(Object.assign(ref, { name: f.name, tipo: guessTipo(f.name), addedAt: new Date().toISOString() }));
        ok++;
      } catch (e) {
        const code = e && e.code;
        errors.push(`«${f.name}»: ` + ({ too_large: 'supera los 20 MB', unsupported_type: 'tipo de archivo no admitido (usa PDF o imagen)', quota_or_state: 'no queda espacio en el proyecto' }[code] || (e && e.message) || 'no se ha podido guardar'));
      }
    }
    A.save();
    return { ok, errors };
  }

  async function blobOf(att) {
    if (att.store === 'local') return idbGet(att.id);
    const r = await fetch('/_blob/' + att.id); if (!r.ok) throw new Error('No se encuentra el archivo'); return r.blob();
  }
  const urlCache = {};
  async function urlOf(att) {
    if (att.store === 'asset') return '/_blob/' + att.id;
    if (urlCache[att.id]) return urlCache[att.id];
    const b = await idbGet(att.id); if (!b) throw new Error('El archivo no está en este navegador');
    return (urlCache[att.id] = URL.createObjectURL(b));
  }

  /* ---------- interfaz en la ficha ---------- */
  function cardRow(s) {
    const items = list(s);
    return `<div class="row att-row"><b>Script:</b><div class="att-list">${items.map((a, i) => `<button class="att-chip" data-action="att-open" data-id="${s.id}" data-i="${i}" title="${esc(a.name)} · ${fmtSize(a.size || 0)}">${icon(a.type)} <span class="att-tipo">${esc(a.tipo)}</span> <span class="att-name">${esc(a.name)}</span></button>`).join('')}
      <label class="att-add no-print" title="Adjuntar guion rayado, parte de script…">＋ Adjuntar<input type="file" class="att-input" data-id="${s.id}" multiple accept="application/pdf,image/*,.pdf,.jpg,.jpeg,.png,.txt" hidden></label>
      ${items.length ? '' : '<span class="muted att-empty">sin documentos</span>'}</div></div>`;
  }
  // Versión compacta para la tabla del Desglose de montaje
  function cell(s) {
    const items = list(s);
    return `<div class="att-cell">${items.map((a, i) => `<button class="att-chip att-mini" data-action="att-open" data-id="${s.id}" data-i="${i}" title="${esc(a.tipo)} · ${esc(a.name)} · ${fmtSize(a.size || 0)}">${icon(a.type)} <span class="att-name att-name-mini">${esc(a.name)}</span></button>`).join('')}
      <label class="att-add no-print" title="Adjuntar guion rayado, parte de script…">＋<input type="file" class="att-input" data-id="${s.id}" multiple accept="application/pdf,image/*,.pdf,.jpg,.jpeg,.png,.txt" hidden></label></div>`;
  }
  function toolbarButton() {
    return `<label class="btn btn-small" title="Sube varios archivos a la vez: se asignan a cada secuencia por el número que lleven en el nombre (p. ej. ESC_12_rayado.pdf)">📎 Adjuntar varios<input type="file" class="att-bulk" multiple accept="application/pdf,image/*,.pdf,.jpg,.jpeg,.png" hidden></label>`;
  }
  function note() {
    return assets ? 'Los documentos se guardan con el proyecto (PDF o imagen, máx. 20 MB cada uno).'
      : window.claude ? 'Solo las personas con permiso de edición de la página pueden adjuntar documentos.'
        : 'En esta copia local los documentos se guardan en este navegador.';
  }

  async function openViewer(s, i) {
    const a = list(s)[i]; if (!a) return;
    let url = '';
    try { url = await urlOf(a); } catch (e) { A.toast('⚠ ' + e.message); }
    const view = !url ? '<p class="muted">No se puede mostrar el archivo.</p>'
      : /image/.test(a.type) ? `<img src="${url}" alt="" style="max-width:100%;max-height:70vh;display:block;margin:auto">`
        : /pdf/.test(a.type) ? `<div class="att-frame att-pdf" id="attPdf"><p class="muted" style="padding:20px"><span class="spinner"></span>Cargando el PDF…</p></div>`
        : /text/.test(a.type) ? `<iframe src="${url}" title="${esc(a.name)}" class="att-frame"></iframe>`
          : '<p class="muted">Vista previa no disponible: descárgalo.</p>';
    A.showModal(`<div class="att-viewer">
      <h3 style="margin:0 0 4px">${icon(a.type)} ${esc(a.name)}</h3>
      <p class="muted" style="margin:0 0 10px">Sec. ${esc(s.num)} · ${esc(s.location)} · ${fmtSize(a.size || 0)}</p>
      <div class="form-grid" style="grid-template-columns:1fr 1fr;margin-bottom:10px">
        <div class="field"><label>Tipo de documento</label><select class="cell-input" data-k="s:${s.id}:adjuntos.${i}.tipo">${TIPOS.map(t => `<option ${t === a.tipo ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
        <div class="field"><label>Nota</label><input class="cell-input" data-k="s:${s.id}:adjuntos.${i}.nota" value="${esc(a.nota || '')}" placeholder="p. ej. tomas buenas 3 y 5"></div>
      </div>
      ${view}
      <div class="actions">
        <button class="btn danger" data-action="att-del" data-id="${s.id}" data-i="${i}">Quitar</button>
        ${url ? `<a class="btn" href="${url}" target="_blank" rel="noopener">Abrir en pestaña nueva</a>` : ''}
        <button class="btn" data-action="att-download" data-id="${s.id}" data-i="${i}">Descargar</button>
        <button class="btn btn-primary" data-action="att-close">Cerrar</button>
      </div></div>`);
    document.getElementById('modalBody').classList.add('modal-wide');
    if (url && /pdf/.test(a.type)) renderPdf(a);
  }

  // Dibuja todas las páginas del PDF con pdf.js (funciona igual en iPad, Mac o PC)
  let renderToken = 0;
  async function renderPdf(a) {
    const token = ++renderToken;
    const box = document.getElementById('attPdf'); if (!box) return;
    try {
      const pdfjsLib = window.pdfjsLib;
      const blob = await blobOf(a);
      const pdf = await pdfjsLib.getDocument({ data: await blob.arrayBuffer() }).promise;
      if (token !== renderToken) return;
      box.innerHTML = `<div class="muted att-pages">${pdf.numPages} página(s)</div>`;
      const width = Math.max(320, box.clientWidth - 24);
      for (let n = 1; n <= pdf.numPages; n++) {
        if (token !== renderToken || !document.getElementById('attPdf')) return;
        const page = await pdf.getPage(n);
        const vp1 = page.getViewport({ scale: 1 });
        const scale = width / vp1.width; const dpr = Math.min(2, window.devicePixelRatio || 1);
        const vp = page.getViewport({ scale: scale * dpr });
        const c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height; c.style.width = width + 'px';
        c.className = 'att-page';
        box.appendChild(c);
        await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
      }
    } catch (e) {
      console.warn(e);
      if (box) box.innerHTML = '<p class="muted" style="padding:20px">No se ha podido mostrar el PDF aquí. Usa «Abrir en pestaña nueva» o «Descargar».</p>';
    }
  }

  /* ---------- eventos ---------- */
  document.addEventListener('change', async e => {
    const el = e.target;
    if (el.classList && el.classList.contains('att-input')) {
      const s = A.sceneById(A.P(), el.dataset.id); const files = el.files; if (!s || !files.length) return;
      A.toast(`Subiendo ${files.length} archivo(s)…`);
      const r = await addFiles(s, files); el.value = '';
      A.renderTab();
      A.toast(r.errors.length ? '⚠ ' + r.errors.join(' · ') : `${r.ok} documento(s) adjuntado(s) a la secuencia ${s.num}.`);
    }
    if (el.classList && el.classList.contains('att-bulk')) {
      const p = A.P(); const files = Array.from(el.files); el.value = ''; if (!files.length) return;
      const nums = new Map(p.scenes.map(s => [String(s.num).toUpperCase().replace(/^0+/, ''), s]));
      const matched = [], unmatched = [];
      files.forEach(f => {
        const base = f.name.replace(/\.[^.]+$/, '').toUpperCase();
        const cands = (base.match(/\d+[A-Z]?/g) || []).map(x => x.replace(/^0+/, '')).filter(x => nums.has(x));
        const pref = base.match(/(?:ESC|SEC|SC|SCENE|S)[\s_.-]*0*(\d+[A-Z]?)/);
        const key = pref && nums.has(pref[1]) ? pref[1] : (new Set(cands).size === 1 ? cands[0] : null);
        if (key) matched.push([nums.get(key), f]); else unmatched.push(f.name);
      });
      A.showModal(`<h3><span class="spinner"></span>Subiendo ${matched.length} documento(s)…</h3>`);
      let ok = 0; const errors = [];
      for (const [s, f] of matched) { const r = await addFiles(s, [f]); ok += r.ok; errors.push(...r.errors); }
      A.renderTab();
      A.showModal(`<h3>Documentos adjuntados</h3><p><b>${ok}</b> archivo(s) asignado(s) a su secuencia por el número del nombre.</p>
        ${unmatched.length ? `<p>Sin secuencia reconocible (adjúntalos desde su ficha con «＋ Adjuntar»):</p><ul>${unmatched.map(n => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}
        ${errors.length ? `<p style="color:#a3501b">${errors.map(esc).join('<br>')}</p>` : ''}
        <div class="actions"><button class="btn btn-primary" data-action="close-modal">Aceptar</button></div>`);
    }
  });

  A.actions['att-open'] = el => openViewer(A.sceneById(A.P(), el.dataset.id), Number(el.dataset.i));
  A.actions['att-close'] = () => { A.hideModal(); document.getElementById('modalBody').classList.remove('modal-wide'); A.renderTab(); };
  A.actions['att-download'] = async el => {
    const s = A.sceneById(A.P(), el.dataset.id); const a = list(s)[Number(el.dataset.i)];
    try { A.download(a.name, await blobOf(a), a.type); } catch (e) { A.toast('⚠ ' + e.message); }
  };
  A.actions['att-del'] = el => {
    const s = A.sceneById(A.P(), el.dataset.id); const i = Number(el.dataset.i); const a = list(s)[i];
    A.showModal(`<h3>¿Quitar «${esc(a.name)}»?</h3><p>Se eliminará el documento de la secuencia ${esc(s.num)} y se borrará el archivo guardado.</p><div class="actions"><button class="btn" data-action="att-open" data-id="${s.id}" data-i="${i}">Cancelar</button><button class="btn btn-primary" data-action="att-del-ok" data-id="${s.id}" data-i="${i}">Quitar</button></div>`);
  };
  A.actions['att-del-ok'] = async el => {
    const s = A.sceneById(A.P(), el.dataset.id); const i = Number(el.dataset.i); const a = list(s)[i]; if (!a) return;
    try {
      if (a.store === 'local') await idbDel(a.id);
      else { const st = await getAssets(); if (st) await st.delete(a.id); }
    } catch (e) { console.warn(e); }
    list(s).splice(i, 1); A.save();
    A.hideModal(); document.getElementById('modalBody').classList.remove('modal-wide'); A.renderTab(); A.toast('Documento quitado.');
  };

  window.Attach = { cardRow, cell, toolbarButton, note };
})();
