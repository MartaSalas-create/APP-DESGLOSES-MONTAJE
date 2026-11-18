/* ==========================================================================
   APP · DESGLOSE DE MONTAJE
   Todo se guarda en el navegador (localStorage). Copias de seguridad en .json
   ========================================================================== */
(function () {
  'use strict';

  const STORE_KEY = 'desgloses-montaje-v1';
  const $ = sel => document.querySelector(sel);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Math.random().toString(36).slice(2, 10);

  /* ------------------------------------------------------------------ */
  /* Catálogos                                                            */
  /* ------------------------------------------------------------------ */
  const DEFAULT_TRAMAS = [
    { letter: 'A', name: 'Trama principal', color: '#e8a9a9' },
    { letter: 'B', name: 'Trama secundaria', color: '#f2c9a0' },
    { letter: 'C', name: 'Trama C', color: '#a9c6e8' },
    { letter: 'D', name: 'Trama D', color: '#a9ddb9' },
    { letter: 'E', name: 'Trama E', color: '#cdb4e0' },
    { letter: 'F', name: 'Trama F', color: '#f5e3a0' }
  ];
  const EXTRA_COLORS = ['#b5e3e0', '#f4b6d2', '#d6d0b0', '#c3c9f5', '#e0c3a0', '#bfe0a0'];

  const DEPTS = {
    montaje: 'Montaje',
    color: 'Color / Conformado',
    vfx: 'GFX / VFX',
    sonido: 'Sonido',
    musica: 'Música'
  };
  /* Leyenda de colores de postproducción y montaje (etiquetas de la montadora) */
  const ESTADOS = [
    { k: 'sinrodar', label: '', option: '(sin rodar)', color: '#ffffff', help: 'Todavía no se ha rodado' },
    { k: 'rodada', label: 'RODADA', color: '#ffffff', help: 'Rodada' },
    { k: 'ingesta', label: 'INGESTA', color: '#72bad8', help: 'Material en ingesta / por sincronizar' },
    { k: 'preparada', label: 'PREPARADA', color: '#dd8ac6', help: 'Material preparado para montar' },
    { k: 'pendiente', label: 'PENDIENTE', color: '#e6ae66', help: 'Por montar' },
    { k: 'montada', label: 'MONTADA', color: '#cc6b55', help: 'Secuencia montada' },
    { k: 'urgente', label: 'URGENTE', color: '#98e0a2', help: 'Prioridad' },
    { k: 'sono', label: 'SONO', color: '#86b86a', help: 'En sonido' },
    { k: 'vfx', label: 'VFX', color: '#e8d660', help: 'En VFX / GFX' },
    { k: 'color', label: 'COLOR', color: '#ad7fd6', help: 'En color / conformado' },
    { k: 'musica', label: 'MÚSICA', color: '#4575b4', help: 'En música' },
    { k: 'eliminada', label: 'ELIMINADA', color: '#4d4d4d', help: 'Fuera del montaje' }
  ];
  const estadoOf = k => ESTADOS.find(e => e.k === k) || ESTADOS[0];
  const DEPT_LABEL = { montaje: 'montada', color: 'color', vfx: 'vfx', sonido: 'sono', musica: 'musica' };

  const NEEDS = [
    { k: 'accion', label: 'Acción', dept: 'montaje' },
    { k: 'secMontaje', label: 'Sec. de montaje / musical', dept: 'montaje' },
    { k: 'alterno', label: 'Montaje alterno', dept: 'montaje' },
    { k: 'sobrante', label: 'Posible sobrante', dept: 'montaje', lbl: 'eliminada' },
    { k: 'flashback', label: 'Flashback / tratamiento', dept: 'color' },
    { k: 'archivo', label: 'Material de archivo', dept: 'color', lbl: 'ingesta' },
    { k: 'vfx', label: 'VFX', dept: 'vfx' },
    { k: 'gfx', label: 'GFX / rótulos', dept: 'vfx' },
    { k: 'pantallas', label: 'Insertos de pantalla', dept: 'vfx' },
    { k: 'off', label: 'Voz en off', dept: 'sonido' },
    { k: 'sfx', label: 'SFX / ambientes', dept: 'sonido' },
    { k: 'cancion', label: 'Canción diegética', dept: 'musica' },
    { k: 'musica', label: 'Música', dept: 'musica' }
  ];
  const ACT_NAMES = ['Prólogo', 'Planteamiento', 'Desarrollo', 'Convergencia / Clímax', 'Resolución'];
  const ACT_DEFAULT_SPLIT = [0, 0.04, 0.25, 0.75, 0.92];

  const TABS = [
    { group: 'Preparación' },
    { id: 'proyecto', label: 'Proyecto' },
    { id: 'ia', label: '✦ Desglose automático' },
    { id: 'analisis', label: 'Lectura de guion' },
    { id: 'tramas', label: 'Tramas y personajes' },
    { group: 'Documentos' },
    { id: 'desglose', label: 'Desglose de montaje' },
    { id: 'escaleta', label: 'Escaleta de script' },
    { id: 'montaje', label: 'Escaleta de montaje' },
    { id: 'arcos', label: 'Arco de personajes' },
    { id: 'stepline', label: 'Step line' },
    { group: 'Postproducción' },
    { id: 'departamentos', label: 'Necesidades por departamento' },
    { id: 'necesidad', label: 'Detalle por necesidad' },
    { id: 'workflow', label: 'Reunión workflow' }
  ];

  const WORKFLOW_FIELDS = [
    ['Rodaje', [
      ['camara', 'Cámara(s) / formato de grabación'], ['resolucion', 'Resolución y aspecto (rodaje / entrega)'],
      ['fps', 'Fotogramas por segundo (rodaje / proyecto)'], ['codec', 'Códec de cámara'],
      ['lut', 'LUT / gestión de color en set'], ['sonidoDirecto', 'Sonido directo (grabadora, pistas, TC)'],
      ['sincro', 'Sincronización (timecode, claqueta, sincro por forma de onda)'], ['dit', 'DIT / laboratorio / copias de seguridad']
    ]],
    ['Montaje', [
      ['software', 'Software de montaje y versión'], ['proxies', 'Proxies / medios de montaje (códec, resolución)'],
      ['almacenamiento', 'Almacenamiento compartido / discos'], ['nomenclatura', 'Nomenclatura de clips, bins y secuencias'],
      ['calendario', 'Calendario: primer montaje, director’s cut, montaje definitivo'], ['visionados', 'Visionados y aprobaciones'],
      ['ayudante', 'Ayudante de montaje / tareas']
    ]],
    ['Entregas a departamentos', [
      ['conformado', 'Conformado y color (EDL/XML/AAF, handles, sala, colorista)'], ['vfxEntregas', 'VFX / GFX (pulls, formato, nomenclatura de planos, rótulos)'],
      ['sonidoEntregas', 'Sonido (AAF/OMF, guías, edición de diálogos, mezcla, M&E)'], ['musicaEntregas', 'Música (temp tracks, spotting, derechos, compositor/a)'],
      ['archivoDerechos', 'Material de archivo y derechos'], ['subtitulos', 'Subtítulos / accesibilidad'], ['masters', 'Másteres y entregables finales (DCP, broadcast, plataformas)']
    ]]
  ];

  /* ------------------------------------------------------------------ */
  /* Estado                                                               */
  /* ------------------------------------------------------------------ */
  let state = load();
  let tab = 'proyecto';
  let expanded = new Set();
  let montajeView = 'montaje';
  let steplineOrder = 'guion';

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { console.warn(e); }
    return { projects: {}, currentId: null };
  }
  let saveTimer = null;
  let localWarned = false;
  function save() {
    const p = P();
    if (p) p.updatedAt = Date.now();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
      catch (e) { if (!Cloud.ready && !localWarned) { localWarned = true; toast('⚠ No se ha podido guardar en el navegador. Guarda una copia .json.'); } }
    }, 250);
    if (p) Cloud.queue(p.id);
  }

  /* ------------------------------------------------------------------ */
  /* Guardado en la nube (cuando la app se abre como página publicada en  */
  /* claude.ai: iPad, iPhone, otros ordenadores). Datos privados de cada  */
  /* persona en data/users/<id>/.                                         */
  /* ------------------------------------------------------------------ */
  const Cloud = {
    db: null, uid: null, ready: false, dl: null,
    pending: new Set(), timer: null, writing: false, textsDirty: new Set(),
    async init() {
      if (!window.claude || typeof window.claude.use !== 'function') return;
      try { this.dl = await window.claude.use('downloads'); } catch (e) { this.dl = null; }
      try {
        const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
        if (!db || !user) return;
        const uid = await user.id();
        if (!uid) return;
        this.db = db; this.uid = uid;
        await this.loadAll();
        this.ready = true;
        // subir los proyectos que solo existan en este navegador
        Object.keys(state.projects).forEach(id => { if (!this.known.has(id)) { this.textsDirty.add(id); this.queue(id); } });
      } catch (e) { console.warn('nube no disponible', e); }
    },
    col() { return this.db.collection('data/users/' + this.uid); },
    known: new Set(),
    async loadAll() {
      const snap = await this.col().get();
      let changed = false;
      for (const d of snap.docs) {
        const body = d.data();
        if (!body || !body.json || d.id === 'settings') continue;
        this.known.add(d.id);
        const local = state.projects[d.id];
        if (local && (local.updatedAt || 0) >= (body.updatedAt || 0)) continue;
        const p = JSON.parse(body.json);
        // textos de las secuencias, troceados
        try {
          const tsnap = await this.col().doc(d.id).collection('texts').get();
          const parts = tsnap.docs.map(x => x.data()).filter(Boolean).sort((a, b) => a.i - b.i).map(x => x.json).join('');
          if (parts) { const texts = JSON.parse(parts); p.scenes.forEach(sc => { sc.text = texts[sc.id] || sc.text || ''; }); }
        } catch (e) { console.warn(e); }
        state.projects[d.id] = p; changed = true;
      }
      try {
        const st = await this.col().doc('settings').get();
        if (st.exists && st.data().currentId && state.projects[st.data().currentId] && !state.currentId) state.currentId = st.data().currentId;
      } catch (e) { /* sin ajustes */ }
      if (!state.currentId || !state.projects[state.currentId]) state.currentId = Object.keys(state.projects)[0] || null;
      if (changed) { render(); toast('Proyectos recuperados de tu cuenta.'); }
    },
    queue(id) {
      if (!this.db) return;
      this.pending.add(id);
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.flush(), 1500);
    },
    async flush() {
      if (this.writing) { this.timer = setTimeout(() => this.flush(), 800); return; }
      this.writing = true;
      try {
        for (const id of Array.from(this.pending)) {
          this.pending.delete(id);
          const p = state.projects[id];
          if (!p) continue;
          const light = Object.assign({}, p, { scenes: p.scenes.map(sc => Object.assign({}, sc, { text: '' })) });
          await this.col().doc(id).set({ json: JSON.stringify(light), title: p.title || '', updatedAt: p.updatedAt || Date.now() });
          if (this.textsDirty.has(id) || !this.known.has(id)) {
            const texts = {}; p.scenes.forEach(sc => { texts[sc.id] = sc.text || ''; });
            const str = JSON.stringify(texts), size = 180000, n = Math.ceil(str.length / size) || 1;
            const tcol = this.col().doc(id).collection('texts');
            for (let i = 0; i < n; i++) await tcol.doc('c' + i).set({ i, json: str.slice(i * size, (i + 1) * size) });
            for (let i = n; i < n + 20; i++) { const d = await tcol.doc('c' + i).get(); if (!d.exists) break; await tcol.doc('c' + i).delete(); }
            this.textsDirty.delete(id);
          }
          this.known.add(id);
        }
        if (state.currentId) await this.col().doc('settings').set({ currentId: state.currentId });
      } catch (e) {
        console.warn(e);
        if (e && e.code === 'quota_exceeded') toast('⚠ Espacio de guardado lleno: guarda una copia .json y borra proyectos antiguos.');
      } finally { this.writing = false; }
    },
    async remove(id) {
      if (!this.db) return;
      try {
        const tcol = this.col().doc(id).collection('texts');
        const t = await tcol.get();
        for (const d of t.docs) await tcol.doc(d.id).delete();
        await this.col().doc(id).delete();
        this.known.delete(id);
      } catch (e) { console.warn(e); }
    }
  };
  const P = () => state.projects[state.currentId] || null;

  function newProject(data) {
    const id = 'p' + uid();
    const p = Object.assign({
      id, title: 'Proyecto sin título', version: '', pages: 0, durationMin: '', logline: '',
      credits: { guion: '', direccion: '', montaje: '', otros: '' },
      formato: 'Largometraje', genero: '', tono: '',
      source: null, createdAt: new Date().toISOString(),
      tramas: DEFAULT_TRAMAS.map(t => Object.assign({ id: 't' + uid() }, t)),
      scenes: [], montajeOrder: [], removed: {}, characters: {}, acts: [],
      analysis: {}, workflow: {}, deptNotes: {}
    }, data || {});
    state.projects[id] = p;
    state.currentId = id;
    return p;
  }

  function sceneFromParsed(s) {
    return {
      id: 's' + uid(), num: s.num, intExt: s.intExt, location: s.location, time: s.time,
      heading: s.heading, page: s.page, pos: s.pos, lengthPages: s.lengthPages, eighths: s.eighths,
      characters: s.characters.slice(), offCharacters: (s.offCharacters || []).slice(),
      summary: s.summary || '', summaryEdited: false, conflict: '', tramaId: '',
      intensity: 5, keyEvent: false, eventLabel: '',
      needs: Object.assign({ sobrante: false }, s.needs), notes: {}, text: s.text || ''
    };
  }

  function applyParsed(p, parsed) {
    p.scenes = parsed.scenes.map(sceneFromParsed);
    p.pages = parsed.pages;
    p.source = { filename: parsed.filename, format: parsed.format, importedAt: new Date().toISOString() };
    p.montajeOrder = p.scenes.map(s => s.id);
    p.removed = {};
    ensureCharacters(p);
    p.acts = defaultActs(p);
  }

  /* Datos de portada -> proyecto. En una versión nueva se actualizan versión y
     fecha, y el resto solo se rellena si estaba vacío (para no pisar cambios). */
  const PORTADA_FIELDS = [
    ['title', 'Título', 'title'], ['version', 'Versión', 'version'], ['fecha', 'Fecha', 'fecha'],
    ['guion', 'Guion', 'credits.guion'], ['basadoEn', 'Basado en', 'basadoEn'], ['direccion', 'Dirección', 'credits.direccion'],
    ['produccion', 'Producción', 'produccion'], ['episodio', 'Episodio / serie', 'episodio'],
    ['registro', 'Registro / derechos', 'registro'], ['contacto', 'Contacto', 'contacto']
  ];
  function applyPortada(p, info, isVersion) {
    if (!info) return [];
    const changed = [];
    PORTADA_FIELDS.forEach(([k, label, path]) => {
      const v = String(info[k] || '').trim(); if (!v) return;
      const cur = getPath(p, path);
      const always = !isVersion || k === 'version' || k === 'fecha';
      const empty = !cur || (k === 'title' && cur === 'Proyecto sin título');
      if (always || empty) { setPath(p, path, v); changed.push([label, v]); }
    });
    if (info.raw) p.portada = info.raw;
    return changed;
  }
  function portadaHTML(changed) {
    if (!changed || !changed.length) return '<p class="muted">No se han encontrado datos de portada: puedes escribirlos en <b>Proyecto</b>.</p>';
    return `<p><b>Datos de la portada:</b></p><div class="legend" style="grid-template-columns:auto 1fr;font-size:13px">${changed.map(([l, v]) => `<div class="muted">${esc(l)}</div><div>${esc(v)}</div>`).join('')}</div>`;
  }

  function mergeVersion(p, parsed) {
    const old = {};
    p.scenes.forEach(s => { old[String(s.num).toUpperCase()] = s; });
    let kept = 0;
    const scenes = parsed.scenes.map(ps => {
      const s = sceneFromParsed(ps);
      const o = old[String(s.num).toUpperCase()];
      if (o) {
        kept++;
        s.id = o.id;
        ['conflict', 'tramaId', 'intensity', 'keyEvent', 'eventLabel', 'notes'].forEach(k => { s[k] = o[k]; });
        if (o.summaryEdited) { s.summary = o.summary; s.summaryEdited = true; }
        NEEDS.forEach(n => { s.needs[n.k] = !!(s.needs[n.k] || o.needs[n.k]); });
      }
      return s;
    });
    const ids = new Set(scenes.map(s => s.id));
    p.scenes = scenes;
    p.montajeOrder = p.montajeOrder.filter(id => ids.has(id)).concat(scenes.filter(s => !p.montajeOrder.includes(s.id)).map(s => s.id));
    p.pages = parsed.pages;
    p.source = { filename: parsed.filename, format: parsed.format, importedAt: new Date().toISOString() };
    p.acts = (p.acts || []).map(a => ({ name: a.name, start: ids.has(a.start) ? a.start : '' }));
    ensureCharacters(p);
    return kept;
  }

  function ensureCharacters(p) {
    p.scenes.forEach(s => s.characters.forEach(c => {
      if (!p.characters[c]) p.characters[c] = { tramaId: '', objetivo: '', arcoInicio: '', arcoFin: '', notas: '', hidden: false };
    }));
  }

  function defaultActs(p) {
    const total = p.scenes.reduce((a, s) => a + (s.lengthPages || 1), 0) || 1;
    let acc = 0;
    const startFrac = p.scenes.map(s => { const f = acc / total; acc += s.lengthPages || 1; return f; });
    return ACT_NAMES.map((name, i) => {
      if (!p.scenes.length) return { name, start: '' };
      let idx = startFrac.findIndex(f => f >= ACT_DEFAULT_SPLIT[i] - 1e-9);
      if (idx < 0) idx = p.scenes.length - 1;
      return { name, start: p.scenes[idx].id };
    }).filter((a, i, arr) => i === 0 || a.start !== arr[i - 1].start);
  }

  /* ------------------------------------------------------------------ */
  /* Helpers de datos                                                     */
  /* ------------------------------------------------------------------ */
  const tramaById = (p, id) => p.tramas.find(t => t.id === id) || null;
  const sceneById = (p, id) => p.scenes.find(s => s.id === id);
  function tramaOf(p, s) { return tramaById(p, s.tramaId); }
  function textColor(hex) {
    // versión oscura y saturada del color de trama (textos de las fichas de escaleta de montaje)
    const n = parseInt((hex || '#888888').slice(1), 16);
    const r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0;
    if (max !== min) {
      const d = max - min;
      h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h = (h * 60 + 360) % 360;
    }
    return max === min ? 'hsl(0,0%,30%)' : `hsl(${Math.round(h)},45%,36%)`;
  }
  function charactersByTrama(p) {
    const out = {};
    Object.keys(p.characters).forEach(c => {
      const ch = p.characters[c];
      if (ch.hidden || !ch.tramaId) return;
      (out[ch.tramaId] = out[ch.tramaId] || []).push(c);
    });
    return out;
  }
  function characterStats(p) {
    const st = {};
    p.scenes.forEach((s, i) => s.characters.forEach(c => {
      const x = st[c] || (st[c] = { count: 0, first: s, last: s, pages: 0, idx: [] });
      x.count++; x.last = s; x.pages += s.lengthPages || 0; x.idx.push(i);
    }));
    return st;
  }
  const fmtEighths = e => { e = Math.max(1, Math.round(e)); const w = Math.floor(e / 8), r = e % 8; return (w ? w + (r ? ' ' : '') : '') + (r ? r + '/8' : ''); };
  const fmtMin = m => { m = Math.round(m * 10) / 10; return (Math.round(m) === m ? m : m.toFixed(1)) + "'"; };
  const minutesPerPage = p => (Number(p.durationMin) && p.pages) ? Number(p.durationMin) / sumPages(p) : 1;
  const sumPages = p => p.scenes.reduce((a, s) => a + (s.lengthPages || 0), 0) || 1;
  const sceneHeading = s => `${s.intExt ? s.intExt + '. ' : ''}${s.location}${s.time ? ' — ' + s.time : ''}`;
  const montajeScenes = p => p.montajeOrder.map(id => sceneById(p, id)).filter(Boolean);

  function setPath(obj, path, value) {
    const parts = path.split('.');
    let o = obj;
    for (let i = 0; i < parts.length - 1; i++) { if (o[parts[i]] == null || typeof o[parts[i]] !== 'object') o[parts[i]] = {}; o = o[parts[i]]; }
    o[parts[parts.length - 1]] = value;
  }
  function getPath(obj, path) { return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj); }

  /* data-k: "p:campo.sub" | "s:<sceneId>:campo" | "c:<personaje>:campo" | "t:<tramaId>:campo" */
  function bindTarget(k) {
    const p = P();
    const [kind, a, b] = splitKey(k);
    if (kind === 'p') return { obj: p, path: a };
    if (kind === 's') return { obj: sceneById(p, a), path: b };
    if (kind === 'c') return { obj: p.characters[a], path: b };
    if (kind === 't') return { obj: tramaById(p, a), path: b };
    return null;
  }
  function splitKey(k) {
    const i = k.indexOf(':');
    const kind = k.slice(0, i), rest = k.slice(i + 1);
    if (kind === 'p') return [kind, rest];
    const j = rest.lastIndexOf(':');
    return [kind, rest.slice(0, j), rest.slice(j + 1)];
  }
  const val = (k) => { const t = bindTarget(k); return t && t.obj ? getPath(t.obj, t.path) : ''; };

  // Constructores de campos
  const inp = (k, attrs = '') => `<input data-k="${esc(k)}" value="${esc(val(k) ?? '')}" ${attrs}>`;
  const area = (k, attrs = '') => `<textarea data-k="${esc(k)}" ${attrs}>${esc(val(k) ?? '')}</textarea>`;
  const field = (label, control, cls = '', help = '') => `<div class="field ${cls}"><label>${esc(label)}</label>${control}${help ? `<small>${help}</small>` : ''}</div>`;
  function tramaSelect(k, cls = 'cell-input') {
    const p = P(); const cur = val(k) || '';
    return `<select class="${cls}" data-k="${esc(k)}" data-rerender="1"><option value="">—</option>${p.tramas.map(t => `<option value="${t.id}" ${t.id === cur ? 'selected' : ''}>${esc(t.letter)} · ${esc(t.name)}</option>`).join('')}</select>`;
  }
  function needChips(s) {
    return NEEDS.map(n => `<label class="chip lbl-${n.lbl || DEPT_LABEL[n.dept]} ${s.needs[n.k] ? 'on' : ''}" title="${esc(DEPTS[n.dept])}"><input type="checkbox" data-k="s:${s.id}:needs.${n.k}" data-rerender="1" ${s.needs[n.k] ? 'checked' : ''}>${esc(n.label)}</label>`).join('');
  }
  /* Estados de una secuencia: se pueden marcar varios a la vez (sin ninguno = sin rodar) */
  function getEstados(s) {
    if (!Array.isArray(s.estados)) s.estados = s.estado && s.estado !== 'sinrodar' ? [s.estado] : [];
    return s.estados;
  }
  const isRemoved = (p, s) => getEstados(s).includes('eliminada') || !!(p.removed && p.removed[s.id]);
  let openEst = null;   // desplegable de estados abierto
  function estadoSelect(s) {
    const on = getEstados(s);
    return `<details class="est-dd" data-id="${s.id}" ${openEst === s.id ? 'open' : ''}>
      <summary title="Estado (selección múltiple)">${estadoBadge(s)}<span class="est-caret">▾</span></summary>
      <div class="est-menu">${ESTADOS.filter(e => e.k !== 'sinrodar').map(e =>
        `<button type="button" class="est-opt ${on.includes(e.k) ? 'on' : ''}" data-action="toggle-estado" data-id="${s.id}" data-e="${e.k}"><span class="est-check">${on.includes(e.k) ? '✓' : ''}</span><span class="estado-badge lbl-bg-${e.k}">${e.label}</span><span class="muted">${esc(e.help)}</span></button>`).join('')}
        <button type="button" class="est-opt est-clear" data-action="clear-estado" data-id="${s.id}"><span class="est-check"></span><span class="estado-badge lbl-bg-sinrodar">&nbsp;</span><span class="muted">Sin rodar (quitar todas)</span></button>
      </div></details>`;
  }
  const estadoBadge = s => {
    const on = getEstados(s);
    if (!on.length) return '<span class="estado-badge lbl-bg-sinrodar" title="Sin rodar">&nbsp;</span>';
    return ESTADOS.filter(e => on.includes(e.k)).map(e => `<span class="estado-badge lbl-bg-${e.k}" title="${esc(e.help)}">${e.label}</span>`).join(' ');
  };
  function postLegendHTML() {
    return `<div class="post-legend"><b>LEYENDA DE POSTPRODUCCIÓN Y MONTAJE</b>${ESTADOS.map(e => `<span class="estado-badge lbl-bg-${e.k}" title="${esc(e.help)}">${e.label || '&nbsp;&nbsp;&nbsp;&nbsp;'}</span>${e.k === 'sinrodar' ? '<span class="muted" style="margin-right:4px">sin rodar</span>' : ''}`).join('')}</div>`;
  }
  function legendHTML(p) {
    return `<div class="legend"><div style="grid-column:1/-1;font-weight:800;font-size:12px;letter-spacing:.05em">LEYENDA DE TRAMAS</div>${p.tramas.map(t => `<div class="sw" style="background:${t.color}">${esc(t.letter)}</div><div>${esc(t.name)}</div>`).join('')}</div>`;
  }
  const printHeader = (p, doc) => `<div class="print-header"><h1>${esc(p.title)} — ${esc(doc)}</h1><div>${esc([p.version && 'Versión ' + p.version, p.credits.direccion && 'Dirección: ' + p.credits.direccion, p.credits.montaje && 'Montaje: ' + p.credits.montaje].filter(Boolean).join(' · '))}</div></div>`;

  /* ------------------------------------------------------------------ */
  /* Render general                                                       */
  /* ------------------------------------------------------------------ */
  function render() {
    renderProjectSelect();
    const p = P();
    const secs = sections();
    const cur = secs.find(x => x.tabs.some(t => t.id === tab)) || secs[0];
    $('#tabs').innerHTML = p ? `<div class="tabs-sections">${secs.map(x => `<button data-section="${esc(x.name)}" class="${x === cur ? 'active' : ''}">${esc(x.name)}</button>`).join('')}</div>
      <div class="tabs-sub">${cur.tabs.map(t => `<button data-tab="${t.id}" class="${t.id === tab ? 'active' : ''}">${t.label}</button>`).join('')}</div>` : '';
    $('#tabs').hidden = !p;
    if (!p) { $('#main').innerHTML = welcomeHTML(); return; }
    renderTab();
  }

  function sections() {
    const out = [];
    TABS.forEach(t => { if (t.group) out.push({ name: t.group, tabs: [] }); else out[out.length - 1].tabs.push(t); });
    return out;
  }
  const lastTabOf = {};

  function renderTab() {
    const p = P();
    const fn = {
      proyecto: tabProyecto, ia: p => window.AIEditor.tab(p), analisis: tabAnalisis, tramas: tabTramas, desglose: tabDesglose, escaleta: tabEscaleta,
      montaje: tabMontaje, arcos: tabArcos, stepline: tabStepline, departamentos: tabDepartamentos, necesidad: tabNecesidad, workflow: tabWorkflow
    }[tab] || tabProyecto;
    const y = window.scrollY;
    $('#main').innerHTML = fn(p);
    window.scrollTo(0, y);
    if (tab === 'stepline') attachSteplineDrag();
    if (tab === 'montaje') attachCardDrag();
    autoGrow();
  }

  function renderProjectSelect() {
    const sel = $('#projectSelect');
    const ids = Object.keys(state.projects);
    sel.innerHTML = ids.length ? ids.map(id => `<option value="${id}" ${id === state.currentId ? 'selected' : ''}>${esc(state.projects[id].title)}${state.projects[id].version ? ' · ' + esc(state.projects[id].version) : ''}</option>`).join('') : '<option>— sin proyectos —</option>';
    sel.disabled = !ids.length;
  }

  function welcomeHTML() {
    return `<div class="welcome">
      <h1>Desglose de guion para montaje</h1>
      <p>Sube el guion del proyecto y la app detectará secuencias, localizaciones, día/noche, personajes, páginas (en octavos) y posibles necesidades de postproducción. A partir de ahí podrás preparar todos los documentos de preproducción de montaje.</p>
      <div class="dropzone" id="dropzone">
        <div class="big">📄</div>
        <div><b>Arrastra aquí el guion</b> o</div>
        <label class="btn btn-primary">⬆ Subir guion<input type="file" class="file-trigger" hidden></label>
        <div class="formats">PDF (con texto, no escaneado) · Final Draft .fdx · Fountain · Word .docx · .txt</div>
      </div>
      <div class="docs-grid">
        <div><b>Desglose de montaje</b>Trama, personajes, acción, conflicto y necesidades por secuencia.</div>
        <div><b>Escaleta de script</b>Tabla coloreada por tramas para lectura de guion.</div>
        <div><b>Escaleta de montaje</b>Fichas reordenables en el orden de montaje.</div>
        <div><b>Arco de personajes</b>Presencia por secuencia y evolución.</div>
        <div><b>Step line (Marimón)</b>Curva de intensidad, actos, puntos de giro y mapa de tramas.</div>
        <div><b>Postproducción</b>Necesidades para color/conformado, GFX/VFX, sonido y música, y reunión de workflow.</div>
      </div>
      <p style="font-size:12px;margin-top:26px">El guion se lee en tu propio dispositivo. En la versión de claude.ai, tus proyectos se guardan de forma privada en tu cuenta.</p>
    </div>`;
  }

  /* ------------------------------------------------------------------ */
  /* Pestaña: Proyecto                                                    */
  /* ------------------------------------------------------------------ */
  function tabProyecto(p) {
    const sc = p.scenes;
    const count = (f) => sc.filter(f).length;
    const estMin = sumPages(p);
    const needCounts = NEEDS.map(n => ({ n, c: count(s => s.needs[n.k]) })).filter(x => x.c);
    return `
    <section class="panel">
      ${printHeader(p, 'Datos del proyecto')}
      <h2>Datos de partida</h2>
      <p class="lead">Datos que aparecerán en la cabecera del step line y de los documentos. ${p.source ? `Guion cargado: <b>${esc(p.source.filename)}</b> (${esc(p.source.format)}, ${new Date(p.source.importedAt).toLocaleString('es-ES')}). Para cargar una versión nueva del guion usa <b>Subir guion</b>: se conservarán tus anotaciones en las secuencias con el mismo número.` : 'Todavía no hay guion cargado: usa <b>Subir guion</b>.'}</p>
      <div class="form-grid">
        ${field('Título', inp('p:title', 'data-rerender-select="1"'))}
        ${field('Versión del guion', inp('p:version', 'placeholder="p. ej. 3ª versión"'))}
        ${field('Fecha del guion', inp('p:fecha', 'placeholder="p. ej. 12 de octubre de 2026"'))}
        ${field('Formato', `<select data-k="p:formato">${['Largometraje', 'Cortometraje', 'Serie (episodio)', 'TV movie', 'Documental', 'Otro'].map(o => `<option ${p.formato === o ? 'selected' : ''}>${o}</option>`).join('')}</select>`)}
        ${field('Páginas del guion', inp('p:pages', 'type="number" min="0"'))}
        ${field('Duración real / prevista (min)', inp('p:durationMin', 'type="number" min="0" step="0.5" placeholder="' + Math.round(estMin) + ' estimados"'), '', 'Si se deja vacío se estima 1 página ≈ 1 minuto.')}
        ${field('Género', inp('p:genero'))}
        ${field('Guion', inp('p:credits.guion'))}
        ${field('Dirección', inp('p:credits.direccion'))}
        ${field('Montaje', inp('p:credits.montaje'))}
        ${field('Otros créditos (música, fotografía…)', inp('p:credits.otros'))}
        ${field('Basado en', inp('p:basadoEn'))}
        ${field('Producción', inp('p:produccion'))}
        ${field('Episodio / serie', inp('p:episodio'))}
        ${field('Registro / derechos', inp('p:registro'))}
        ${field('Contacto', inp('p:contacto'))}
        ${field('Idea / logline', area('p:logline', 'rows="2"'), 'wide')}
        ${p.portada ? field('Texto de la portada (tal como aparece en el guion)', `<div class="script-text" style="max-height:200px">${esc(p.portada)}</div>`, 'wide') : ''}
      </div>
      <div class="stats">
        <div class="stat"><b>${sc.length}</b><span>secuencias</span></div>
        <div class="stat"><b>${p.pages || '—'}</b><span>páginas</span></div>
        <div class="stat"><b>${fmtMin(Number(p.durationMin) || estMin)}</b><span>${p.durationMin ? 'duración real' : 'duración estimada'}</span></div>
        <div class="stat"><b>${count(s => /INT/.test(s.intExt) && !/EXT/.test(s.intExt))} / ${count(s => /EXT/.test(s.intExt) && !/INT/.test(s.intExt))}</b><span>INT / EXT</span></div>
        <div class="stat"><b>${count(s => /D[IÍ]A|DAY|MAÑANA|TARDE|MEDIOD/.test(s.time))} / ${count(s => /NOCHE|NIGHT|MADRUG/.test(s.time))}</b><span>día / noche</span></div>
        <div class="stat"><b>${Object.keys(p.characters).filter(c => !p.characters[c].hidden).length}</b><span>personajes</span></div>
        <div class="stat"><b>${new Set(sc.map(s => s.location.split(/[,.]/)[0].trim())).size}</b><span>localizaciones</span></div>
      </div>
      ${needCounts.length ? `<h3>Necesidades detectadas automáticamente</h3><div class="needs-cell">${needCounts.map(x => `<button class="chip on need-nav lbl-${x.n.lbl || DEPT_LABEL[x.n.dept]}" data-action="go-need" data-k="${x.n.k}">${esc(x.n.label)}: ${x.c}</button>`).join('')}</div><p class="muted" style="font-size:12px">Pincha una etiqueta para ver su desglose detallado. Detección por palabras clave: revísala en el <b>Desglose de montaje</b>.</p>` : ''}
    </section>
    <section class="panel no-print">
      <h2>Orden de trabajo sugerido</h2>
      <ol style="line-height:1.8;margin:0">
        <li><b>Lectura de guion</b>: 1ª lectura (historia, género, tono, personajes) y 2ª lectura (temas, mapa de personajes).</li>
        <li><b>Tramas y personajes</b>: nombra las tramas (A, B, C…) y asigna cada personaje a su trama.</li>
        <li><b>Desglose de montaje</b>: asigna trama a cada secuencia, revisa resumen, conflicto y necesidades.</li>
        <li><b>Escaleta de script / de montaje</b>: documentos de lectura y reordenación.</li>
        <li><b>Step line</b>: ajusta la curva arrastrando los puntos, marca actos y puntos de giro.</li>
        <li><b>Necesidades por departamento</b> y <b>Reunión workflow</b>: para la coordinación de postproducción.</li>
      </ol>
    </section>`;
  }

  /* ------------------------------------------------------------------ */
  /* Pestaña: Lectura / análisis de guion                                  */
  /* ------------------------------------------------------------------ */
  function tabAnalisis(p) {
    const A = (k, label, help) => field(label, area('p:analysis.' + k, 'rows="4"'), 'wide', help);
    return `<section class="panel">
      ${printHeader(p, 'Lectura de guion')}
      <h2>El guion como punto de partida</h2>
      <p class="lead">Notas para la reunión con dirección y la lectura de guion. Se imprimen como documento de trabajo.</p>
      <h3>1ª lectura · Historia, género, tono y personajes</h3>
      <div class="form-grid">
        ${A('historia', 'Historia (de qué trata)')}
        ${A('generoTono', 'Género y tono')}
        ${A('personajes', 'Personajes principales (primera impresión)')}
      </div>
      <h3>2ª lectura · Temas y mapa de personajes</h3>
      <div class="form-grid">
        ${A('temas', 'Temas')}
        ${A('mapa', 'Mapa de personajes y relaciones')}
        ${A('estructura', 'Estructura: actos, eventos y giros', 'Se completa visualmente en el Step line.')}
        ${A('interes', 'Puntos de interés')}
      </div>
      <h3>Análisis avanzado</h3>
      <div class="form-grid">
        ${A('sobrantes', 'Posibles secuencias sobrantes', 'Marca también «Posible sobrante» en el desglose.')}
        ${A('problemas', 'Problemas generales o estructurales')}
        ${A('necesidades', 'Necesidades específicas de montaje', 'Secuencias de acción y musicales, montajes alternos, carga de VFX, sonido (canciones diegéticas, offs, sfx, ambientes), material de archivo.')}
        ${A('preguntas', 'Preguntas para dirección')}
      </div>
    </section>`;
  }

  /* ------------------------------------------------------------------ */
  /* Pestaña: Tramas y personajes                                         */
  /* ------------------------------------------------------------------ */
  function tabTramas(p) {
    const st = characterStats(p);
    const names = Object.keys(p.characters).sort((a, b) => (st[b]?.count || 0) - (st[a]?.count || 0));
    return `<section class="panel">
      ${printHeader(p, 'Tramas y personajes')}
      <h2>Tramas</h2>
      <p class="lead">El código de color de cada trama se usa en la escaleta, el desglose y los globos del step line.</p>
      ${p.tramas.map(t => `<div class="trama-row">
        ${inp('t:' + t.id + ':letter', 'class="cell-input" maxlength="3" data-rerender="1"')}
        <input type="color" data-k="t:${t.id}:color" value="${esc(t.color)}" data-rerender="1">
        ${inp('t:' + t.id + ':name', 'class="cell-input" placeholder="Nombre de la trama"')}
        ${inp('t:' + t.id + ':desc', 'class="cell-input" placeholder="Descripción (relación, conflicto…)"')}
        <button class="btn btn-small btn-ghost" data-action="del-trama" data-id="${t.id}" title="Eliminar trama">✕</button>
      </div>`).join('')}
      <div class="toolbar"><button class="btn btn-small" data-action="add-trama">+ Añadir trama</button></div>
    </section>
    <section class="panel">
      <h2>Personajes</h2>
      <p class="lead">Detectados en el guion (por los nombres sobre los diálogos). Asigna su trama principal; oculta los que sean falsos positivos o figuración. Para unir dos nombres (p. ej. «TENIENTE ROJAS» y «ROJAS») usa <i>Fusionar</i>.</p>
      <div class="toolbar">
        <button class="btn btn-small" data-action="auto-char-tramas">Asignar trama a personajes según sus secuencias</button>
        <button class="btn btn-small" data-action="auto-scene-tramas">Asignar trama a secuencias sin trama según sus personajes</button>
        <span class="spacer"></span>
        <button class="btn btn-small" data-action="add-character">+ Añadir personaje</button>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>Personaje</th><th class="num">Secuencias</th><th class="num">Primera / última</th><th>Trama</th><th class="num">Mostrar</th><th>Fusionar con…</th></tr></thead>
        <tbody>${names.map(n => {
          const c = p.characters[n], s = st[n];
          return `<tr class="${c.hidden ? 'strike' : ''}">
            <td><b>${esc(n)}</b></td>
            <td class="num">${s ? s.count : 0}</td>
            <td class="num">${s ? esc(s.first.num) + ' → ' + esc(s.last.num) : '—'}</td>
            <td>${tramaSelect('c:' + n + ':tramaId')}</td>
            <td class="num"><input type="checkbox" data-k="c:${esc(n)}:hidden" data-invert="1" data-rerender="1" ${c.hidden ? '' : 'checked'}></td>
            <td><select class="cell-input" data-action-change="merge-char" data-name="${esc(n)}"><option value="">—</option>${names.filter(m => m !== n).map(m => `<option value="${esc(m)}">${esc(m)}</option>`).join('')}</select></td>
          </tr>`;
        }).join('')}</tbody></table></div>
    </section>`;
  }

  /* ------------------------------------------------------------------ */
  /* Pestaña: Desglose de montaje                                         */
  /* ------------------------------------------------------------------ */
  function tabDesglose(p) {
    const mpp = minutesPerPage(p);
    return `<section class="panel">
      ${printHeader(p, 'Desglose de montaje')}
      <h2>Desglose de montaje</h2>
      <p class="lead">Una fila por secuencia. Las necesidades se han marcado automáticamente por palabras clave del guion: revísalas (clic para activar/desactivar). Abre ▸ para ver el texto de la secuencia y las notas por departamento.</p>
      <div class="toolbar">
        <button class="btn btn-small" data-action="expand-all">Abrir todas</button>
        <button class="btn btn-small" data-action="collapse-all">Cerrar todas</button>
        <span class="spacer"></span>
        ${postLegendHTML()}
        <span class="legend-inline">${p.tramas.map(t => `<span><span class="trama-dot" style="background:${t.color}"></span>${esc(t.letter)} ${esc(t.name)}</span>`).join('')}</span>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th></th><th class="num">Nº</th><th>Encabezado</th><th class="num">Pág.</th><th class="num">Octavos</th><th class="num">Dur. est.</th><th>Estado</th><th>Trama</th><th>Personajes</th><th>Acción / resumen</th><th>Conflicto / objetivo</th><th>Necesidades</th><th>Notas de montaje</th></tr></thead>
        <tbody>${p.scenes.map(s => {
          const t = tramaOf(p, s);
          const open = expanded.has(s.id);
          return `<tr style="${t ? `box-shadow: inset 5px 0 0 ${t.color}` : ''}">
            <td><button class="btn btn-small btn-ghost" data-action="toggle-row" data-id="${s.id}">${open ? '▾' : '▸'}</button></td>
            <td class="num"><b>${esc(s.num)}</b></td>
            <td class="scene-head" style="min-width:200px">${esc(sceneHeading(s))}</td>
            <td class="num">${s.page}</td>
            <td class="num">${fmtEighths(s.eighths)}</td>
            <td class="num">${fmtMin(s.lengthPages * mpp)}</td>
            <td>${estadoSelect(s)}</td>
            <td>${tramaSelect('s:' + s.id + ':tramaId')}</td>
            <td><input class="cell-input" data-k="s:${s.id}:characters" data-list="1" value="${esc(s.characters.join(', '))}" style="min-width:150px"></td>
            <td>${area('s:' + s.id + ':summary', 'class="cell-input" data-edited="summaryEdited"')}</td>
            <td>${area('s:' + s.id + ':conflict', 'class="cell-input" placeholder="¿Qué cambia? ¿Qué quiere cada personaje?"')}</td>
            <td><div class="needs-cell">${needChips(s)}</div></td>
            <td>${area('s:' + s.id + ':notes.montaje', 'class="cell-input" style="min-width:180px"')}</td>
          </tr>
          ${open ? `<tr class="row-detail"><td></td><td colspan="12">
            <div class="detail-grid">
              <div><div class="field"><label>Texto de la secuencia</label><div class="script-text">${esc(s.heading)}\n\n${esc(s.text)}</div></div></div>
              <div class="form-grid" style="grid-template-columns:1fr">
                ${Object.keys(DEPTS).filter(d => d !== 'montaje').map(d => field('Notas · ' + DEPTS[d], area('s:' + s.id + ':notes.' + d, 'rows="2"'))).join('')}
                <div class="field"><button class="btn btn-small" data-action="ai-scene" data-id="${s.id}">✦ Proponer desglose de esta secuencia</button><small id="aiScene-${s.id}"></small></div>
                ${field('Personajes en off', `<input data-k="s:${s.id}:offCharacters" data-list="1" value="${esc((s.offCharacters || []).join(', '))}">`)}
              </div>
            </div></td></tr>` : ''}`;
        }).join('')}</tbody></table></div>
    </section>`;
  }

  /* ------------------------------------------------------------------ */
  /* Pestaña: Escaleta de script (tabla coloreada por tramas)              */
  /* ------------------------------------------------------------------ */
  function tabEscaleta(p) {
    return `<section class="panel">
      ${printHeader(p, 'Escaleta coloreada por tramas')}
      <h2>${esc(p.title)} — Escaleta coloreada por tramas</h2>
      <p class="lead no-print">Documento de lectura en el orden del guion. Los datos se editan en el <b>Desglose de montaje</b>. Exporta a .csv para abrirlo en Numbers / Excel / Google Sheets.</p>
      <div class="toolbar no-print"><button class="btn btn-small" data-action="export-csv">Exportar .csv</button><button class="btn btn-small" data-action="print">Imprimir / PDF</button></div>
      ${legendHTML(p)}
      <div class="table-wrap"><table class="escaleta">
        <thead><tr><th class="num">Nº</th><th>INT/EXT</th><th>Localización</th><th>Día/Noche</th><th>Trama</th><th>Personajes</th><th>Resumen</th><th>Estado</th></tr></thead>
        <tbody>${p.scenes.map(s => {
          const t = tramaOf(p, s);
          return `<tr style="background:${t ? t.color : '#fff'}" class="${s.needs.sobrante ? 'strike' : ''}">
            <td class="num">${esc(s.num)}</td><td>${esc(s.intExt)}</td><td>${esc(s.location)}</td><td>${esc(s.time)}</td>
            <td>${t ? esc(t.name.toUpperCase()) : ''}</td><td>${esc(s.characters.filter(c => !(p.characters[c] || {}).hidden).join(', '))}</td><td>${esc(s.summary)}</td><td>${estadoBadge(s)}</td></tr>`;
        }).join('')}</tbody></table></div>
    </section>`;
  }

  /* ------------------------------------------------------------------ */
  /* Pestaña: Escaleta de montaje (fichas)                                */
  /* ------------------------------------------------------------------ */
  function tabMontaje(p) {
    const list = montajeView === 'montaje' ? montajeScenes(p) : p.scenes;
    const mpp = minutesPerPage(p);
    let acc = 0;
    const totalActive = list.filter(s => !isRemoved(p, s)).reduce((a, s) => a + s.lengthPages * mpp, 0);
    return `<section class="panel">
      ${printHeader(p, montajeView === 'montaje' ? 'Escaleta de montaje' : 'Escaleta (orden de guion)')}
      <h2>Escaleta de montaje</h2>
      <p class="lead no-print">Fichas por secuencia con el color de su trama. En <b>orden de montaje</b> puedes arrastrarlas (⋮⋮) o moverlas con las flechas para proponer una estructura distinta a la del guion, y quitar secuencias (⊘) para ver cómo cambia la duración. Acción y conflicto se editan directamente en la ficha.</p>
      <div class="toolbar no-print">
        <button class="btn btn-small ${montajeView === 'montaje' ? 'btn-primary' : ''}" data-action="montaje-view" data-v="montaje">Orden de montaje</button>
        <button class="btn btn-small ${montajeView === 'guion' ? 'btn-primary' : ''}" data-action="montaje-view" data-v="guion">Orden de guion</button>
        <button class="btn btn-small" data-action="reset-order">Restablecer orden de guion</button>
        <span class="spacer"></span>
        ${postLegendHTML()}
        <span class="muted">Duración estimada: <b>${fmtMin(totalActive)}</b> · ${list.filter(s => !isRemoved(p, s)).length} secuencias</span>
        <button class="btn btn-small" data-action="print">Imprimir / PDF</button>
      </div>
      <div class="cards" id="cards">${list.map((s, i) => {
        const t = tramaOf(p, s);
        const col = t ? textColor(t.color) : '#555';
        const removed = isRemoved(p, s);
        const start = acc; if (!removed) acc += s.lengthPages * mpp;
        return `<div class="card ${removed ? 'removed' : ''}" style="color:${col}" data-id="${s.id}" ${montajeView === 'montaje' ? 'draggable="true"' : ''}>
          ${montajeView === 'montaje' ? '<span class="handle" title="Arrastrar">⋮⋮</span>' : ''}
          <div class="card-tools no-print">
            ${montajeView === 'montaje' ? `<button class="btn btn-small btn-ghost" data-action="move" data-id="${s.id}" data-d="-1" title="Subir">↑</button><button class="btn btn-small btn-ghost" data-action="move" data-id="${s.id}" data-d="1" title="Bajar">↓</button>` : ''}
            <button class="btn btn-small btn-ghost" data-action="toggle-removed" data-id="${s.id}" title="${removed ? 'Recuperar' : 'Quitar del montaje'}">${removed ? '↺' : '⊘'}</button>
          </div>
          <div class="card-title"><span>ESC. ${esc(s.num)}</span><span>${esc(sceneHeading(s))}</span><span class="dur">${fmtEighths(s.eighths)} pág · ${fmtMin(s.lengthPages * mpp)}${removed ? '' : ' · TC ≈ ' + fmtMin(start)}</span></div>
          <div class="row"><b><i>Personajes:</i></b><i>${esc(s.characters.filter(c => !(p.characters[c] || {}).hidden).join(', ') || '—')}</i></div>
          <div class="row"><b>Acción:</b><textarea class="edit" rows="1" data-k="s:${s.id}:summary" data-edited="summaryEdited">${esc(s.summary)}</textarea></div>
          <div class="row"><b>Conflicto / objetivo:</b><textarea class="edit" rows="1" data-k="s:${s.id}:conflict" placeholder="…">${esc(s.conflict)}</textarea></div>
          <div class="tag"><span class="no-print">${estadoSelect(s)}</span><span class="print-only">${estadoBadge(s)}</span> [ ${t ? esc(t.name.toUpperCase()) : 'SIN TRAMA'} ]${s.keyEvent ? ' · ★ ' + esc(s.eventLabel || 'punto de giro') : ''}</div>
        </div>`;
      }).join('')}</div>
    </section>`;
  }

  /* ------------------------------------------------------------------ */
  /* Pestaña: Arco de personajes                                          */
  /* ------------------------------------------------------------------ */
  function tabArcos(p) {
    const st = characterStats(p);
    const names = Object.keys(p.characters).filter(n => !p.characters[n].hidden && st[n]).sort((a, b) => st[b].count - st[a].count);
    return `<section class="panel">
      ${printHeader(p, 'Arco de personajes')}
      <h2>Arco de personajes</h2>
      <p class="lead">Presencia de cada personaje por secuencia (color = trama de la secuencia) y evolución dramática: de dónde parte, a dónde llega y qué secuencias marcan el cambio.</p>
      <div class="table-wrap" style="padding:10px"><table class="matrix">
        <thead><tr><th></th>${p.scenes.map(s => `<th class="vert" title="${esc(sceneHeading(s))}">${esc(s.num)}</th>`).join('')}</tr></thead>
        <tbody>${names.map(n => `<tr><td class="name">${esc(n)} <span class="muted">(${st[n].count})</span></td>${p.scenes.map(s => {
          if (!s.characters.includes(n)) return '<td></td>';
          const t = tramaOf(p, s);
          return `<td class="on" style="background:${t ? t.color : '#777'}" title="Esc. ${esc(s.num)} · ${esc(s.location)}"></td>`;
        }).join('')}</tr>`).join('')}</tbody>
      </table></div>
      <div class="char-cards">${names.map(n => {
        const c = p.characters[n], s = st[n], t = tramaById(p, c.tramaId);
        return `<div class="char-card" style="border-left-color:${t ? t.color : '#ccc'}">
          <h4>${esc(n)}</h4>
          <div class="meta">${s.count} secuencias · ${fmtEighths(s.pages * 8)} págs · entra en ${esc(s.first.num)}, sale en ${esc(s.last.num)} ${t ? '· ' + esc(t.letter + ' ' + t.name) : ''}</div>
          ${field('Objetivo / deseo · necesidad', area('c:' + n + ':objetivo', 'rows="2"'))}
          <div class="arc-line">${field('Al inicio', area('c:' + n + ':arcoInicio', 'rows="2"'))}<span>→</span>${field('Al final', area('c:' + n + ':arcoFin', 'rows="2"'))}</div>
          ${field('Secuencias clave del arco / notas', area('c:' + n + ':notas', 'rows="2"'))}
        </div>`;
      }).join('')}</div>
    </section>`;
  }

  /* ------------------------------------------------------------------ */
  /* Pestaña: Step line                                                   */
  /* ------------------------------------------------------------------ */
  function steplineScenes(p) {
    return steplineOrder === 'montaje' ? montajeScenes(p).filter(s => !isRemoved(p, s)) : p.scenes;
  }
  function tabStepline(p) {
    const scenes = steplineScenes(p);
    const { svg } = StepLine.render(p, scenes, {
      tramaOf: s => tramaOf(p, s), charactersByTrama: () => charactersByTrama(p)
    });
    const opt = (cur) => `<option value="">— (sin este acto)</option>` + scenes.map(s => `<option value="${s.id}" ${s.id === cur ? 'selected' : ''}>Esc. ${esc(s.num)} · ${esc(s.location.slice(0, 40))}</option>`).join('');
    const acts = ACT_NAMES.map(name => p.acts.find(a => a.name === name) || { name, start: '' });
    return `<section class="panel">
      ${printHeader(p, 'Step line')}
      <h2 class="no-print">Step line · curva de intensidad dramática</h2>
      <p class="lead no-print">Según la metodología del step line de Marimón (<i>El montaje cinematográfico. Del guion a la pantalla</i>). <b>Arrastra los puntos de la curva</b> hacia arriba o abajo para fijar la intensidad de cada secuencia. Marca los puntos de giro en la tabla inferior: aparecerán como globos con el color de su trama.</p>
      <div class="note no-print" style="margin-bottom:14px">Los valores de intensidad dramática son una <b>interpretación editorial</b> a partir de la lectura del guion — no vienen de un análisis objetivo ni de una medición externa. Son un punto de partida para debatir y corregir en clase: ¿algún pico o valle debería estar más arriba, más abajo o directamente en otro sitio de la curva?</div>
      <div class="toolbar no-print">
        <label>Orden: <select data-action-change="stepline-order"><option value="guion" ${steplineOrder === 'guion' ? 'selected' : ''}>Guion</option><option value="montaje" ${steplineOrder === 'montaje' ? 'selected' : ''}>Escaleta de montaje</option></select></label>
        <button class="btn btn-small" data-action="suggest-curve">Proponer curva inicial</button>
        <button class="btn btn-small" data-action="flat-curve">Curva plana (5)</button>
        <button class="btn btn-small" data-action="default-acts">Actos por proporción</button>
        <span class="spacer"></span>
        <button class="btn btn-small" data-action="export-svg">Descargar SVG</button>
        <button class="btn btn-small" data-action="export-png">Descargar PNG</button>
        <button class="btn btn-small" data-action="print">Imprimir / PDF</button>
      </div>
      <div class="stepline-wrap" id="steplineWrap">${svg}</div>
    </section>
    <section class="panel no-print">
      <h3 style="margin-top:0">Estructura en actos</h3>
      <p class="lead">Secuencia en la que empieza cada acto (línea vertical roja).</p>
      <div class="acts-editor">${acts.map((a, i) => field(a.name, `<select data-action-change="set-act" data-act="${esc(a.name)}">${opt(a.start)}</select>`)).join('')}</div>
      <h3>Intensidad y puntos de giro por secuencia</h3>
      <div class="table-wrap"><table>
        <thead><tr><th class="num">Nº</th><th>Secuencia</th><th>Trama</th><th class="num">Intensidad (0–10)</th><th class="num">Punto de giro / evento</th><th>Etiqueta (globo)</th></tr></thead>
        <tbody>${scenes.map(s => {
          const t = tramaOf(p, s);
          return `<tr><td class="num"><b>${esc(s.num)}</b></td><td>${esc(sceneHeading(s))}<div class="muted" style="font-size:12px">${esc(s.summary.slice(0, 120))}</div></td>
          <td>${t ? `<span class="trama-dot" style="background:${t.color}"></span>${esc(t.letter)}` : '—'}</td>
          <td class="num"><input class="cell-input" type="number" min="0" max="10" step="0.5" style="width:70px" data-k="s:${s.id}:intensity" data-num="1" data-rerender="1" data-lazy="1" value="${esc(s.intensity)}"></td>
          <td class="num"><input type="checkbox" data-k="s:${s.id}:keyEvent" data-rerender="1" ${s.keyEvent ? 'checked' : ''}></td>
          <td><input class="cell-input" data-k="s:${s.id}:eventLabel" data-rerender="1" data-lazy="1" value="${esc(s.eventLabel)}" placeholder="p. ej. Incidente desencadenante"></td></tr>`;
        }).join('')}</tbody></table></div>
    </section>`;
  }

  function attachSteplineDrag() {
    const svg = document.querySelector('#steplineWrap svg');
    if (!svg) return;
    const p = P();
    const top = +svg.dataset.plotTop, h = +svg.dataset.plotH;
    let drag = null;
    svg.addEventListener('pointerdown', e => {
      const c = e.target.closest('.pt'); if (!c) return;
      drag = { c, s: sceneById(p, c.dataset.id) };
      c.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    svg.addEventListener('pointermove', e => {
      if (!drag) return;
      const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
      const loc = pt.matrixTransform(svg.getScreenCTM().inverse());
      const v = Math.round(Math.max(0, Math.min(10, (top + h - loc.y) / h * 10)) * 2) / 2;
      drag.s.intensity = v;
      drag.c.setAttribute('cy', top + h - v / 10 * h);
    });
    const end = () => { if (!drag) return; drag = null; save(); renderTab(); };
    svg.addEventListener('pointerup', end);
    svg.addEventListener('pointercancel', end);
  }

  function suggestCurve(p) {
    // Propuesta orientativa: paradigma clásico (subida progresiva con valle en el desarrollo,
    // pico en el clímax y caída en la resolución) + ajustes por acción, conflicto y puntos de giro.
    const scenes = steplineScenes(p);
    const total = scenes.reduce((a, s) => a + (s.lengthPages || 1), 0) || 1;
    let acc = 0;
    scenes.forEach(s => {
      const x = (acc + (s.lengthPages || 1) / 2) / total; acc += s.lengthPages || 1;
      let base;
      if (x < 0.04) base = 4;
      else if (x < 0.25) base = 3 + (x - 0.04) / 0.21 * 3;
      else if (x < 0.5) base = 5 + Math.sin((x - 0.25) / 0.25 * Math.PI) * 1;
      else if (x < 0.75) base = 5 + (x - 0.5) / 0.25 * 2.5;
      else if (x < 0.9) base = 7.5 + (x - 0.75) / 0.15 * 2.5;
      else base = 10 - (x - 0.9) / 0.1 * 5;
      if (s.needs.accion) base += 1;
      if (s.keyEvent) base += 1;
      if (s.needs.sobrante) base -= 1;
      s.intensity = Math.round(Math.max(1, Math.min(10, base)) * 2) / 2;
    });
  }

  /* ------------------------------------------------------------------ */
  /* Pestaña: Necesidades por departamento                                */
  /* ------------------------------------------------------------------ */
  function tabDepartamentos(p) {
    const mpp = minutesPerPage(p);
    return `<section class="panel">
      ${printHeader(p, 'Necesidades de montaje y postproducción por departamento')}
      <h2>Necesidades por departamento</h2>
      <p class="lead no-print">Documento para la coordinación de postproducción: reúne, por departamento, las secuencias con necesidades marcadas en el desglose y sus notas. Añade notas generales de cada departamento.</p>
      <div class="toolbar no-print"><button class="btn btn-small" data-action="print">Imprimir / PDF</button></div>
      <div class="toolbar no-print"><span class="muted">Ver detalle de:</span> ${needChipsNav(p, '')}</div>
      ${Object.keys(DEPTS).map(d => {
        const needs = NEEDS.filter(n => n.dept === d);
        const rows = p.scenes.filter(s => needs.some(n => s.needs[n.k]) || (s.notes && s.notes[d]));
        return `<div class="dept dept-${d}">
          <h3>${esc(DEPTS[d])} <span class="muted" style="font-weight:400">· ${rows.length} secuencias</span></h3>
          ${field('Notas generales para ' + DEPTS[d], area('p:deptNotes.' + d, 'rows="2"'), 'wide')}
          ${rows.length ? `<div class="table-wrap" style="margin-top:10px"><table>
            <thead><tr><th class="num">Nº</th><th>Secuencia</th><th class="num">Dur. est.</th><th>Necesidades</th><th>Descripción</th><th>Notas ${esc(DEPTS[d])}</th></tr></thead>
            <tbody>${rows.map(s => `<tr><td class="num"><b>${esc(s.num)}</b></td><td>${esc(sceneHeading(s))}</td><td class="num">${fmtMin(s.lengthPages * mpp)}</td>
              <td><div class="needs-cell" style="min-width:140px">${needs.filter(n => s.needs[n.k]).map(n => `<button class="chip on need-nav lbl-${n.lbl || DEPT_LABEL[d]}" data-action="go-need" data-k="${n.k}">${esc(n.label)}</button>`).join('')}${d === 'sonido' && s.offCharacters && s.offCharacters.length ? `<span class="muted" style="font-size:11px">off: ${esc(s.offCharacters.join(', '))}</span>` : ''}</div></td>
              <td style="min-width:240px">${esc(s.summary)}</td>
              <td>${area('s:' + s.id + ':notes.' + d, 'class="cell-input" style="min-width:200px"')}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">Sin secuencias marcadas.</p>'}
        </div>`;
      }).join('')}
    </section>`;
  }

  /* ------------------------------------------------------------------ */
  /* Pestaña: Detalle por necesidad (al pinchar una etiqueta)             */
  /* ------------------------------------------------------------------ */
  const NEED_FIELDS = {
    accion: [['desc', 'Qué ocurre (coreografía, cobertura, ritmo)']],
    secMontaje: [['desc', 'Contenido de la secuencia de montaje / musical']],
    alterno: [['con', 'Alterna con (secuencias / acciones)']],
    sobrante: [['motivo', 'Por qué podría caer o compactarse']],
    flashback: [['trat', 'Tiempo / realidad y tratamiento de imagen']],
    archivo: [['material', 'Material de archivo (qué, fuente, derechos)']],
    vfx: [['planos', 'Efectos / planos VFX']],
    gfx: [['rotulos', 'Rótulos y grafismo (texto exacto)']],
    pantallas: [['contenido', 'Contenido de pantallas / monitores']],
    off: [['quien', 'Quién habla en off y en qué momento']],
    sfx: [['sfx', 'SFX (efectos puntuales)'], ['amb', 'Ambientes']],
    cancion: [['cancion', 'Canción / fuente diegética (radio, baile, actuación…)']],
    musica: [['momento', 'Momento musical (entrada, función, tono)']]
  };
  const AMB_RE = /lluvia|llueve|viento|tormenta|truenos?|tr[aá]fico|coches|multitud|gente|murmullo|bullicio|bar\b|cafeter[ií]a|mar\b|olas|p[aá]jaros|grillos|silencio|mercado|f[aá]brica|oficina|p[uú]blico|risas|aplausos|campo|ciudad|calle|pasillo|tel[eé]fono|radio|televisi[oó]n|m[aá]quinas|motor/i;
  function sentencesMatching(text, re, max) {
    const out = [];
    (text || '').replace(/\n\s*\n/g, '\u0001').replace(/\s*\n\s*/g, ' ').replace(/([.!?…])\s+/g, '$1\u0001').split('\u0001').forEach(t => {
      t = t.trim(); if (t && re.test(t) && !out.includes(t) && out.length < max) out.push(t.length > 220 ? t.slice(0, 220) + '…' : t);
    });
    return out;
  }
  function autoNeedDetail(s, k) {
    const re = (ScriptParser.NEED_PATTERNS || {})[k];
    const ev = re ? sentencesMatching(s.heading + '\n' + s.text, re, 4) : [];
    const d = {};
    if (k === 'sfx') {
      d.sfx = ev.map(x => '- ' + x).join('\n');
      const amb = sentencesMatching(s.text, AMB_RE, 3);
      d.amb = [`- Base: ${s.intExt} ${s.location}${s.time ? ' — ' + s.time : ''}`].concat(amb.map(x => '- ' + x)).join('\n');
    } else if (k === 'off') {
      d.quien = (s.offCharacters && s.offCharacters.length ? 'En off: ' + s.offCharacters.join(', ') + '\n' : '') + ev.map(x => '- ' + x).join('\n');
    } else {
      d[NEED_FIELDS[k][0][0]] = ev.map(x => '- ' + x).join('\n');
    }
    return d;
  }
  let needSel = 'sfx';
  function needChipsNav(p, active) {
    return `<div class="needs-cell" style="min-width:0">${NEEDS.map(n => {
      const c = p.scenes.filter(s => s.needs[n.k]).length;
      return `<button class="chip lbl-${n.lbl || DEPT_LABEL[n.dept]} on need-nav ${n.k === active ? 'need-active' : ''}" data-action="go-need" data-k="${n.k}">${esc(n.label)}: ${c}</button>`;
    }).join('')}</div>`;
  }
  function tabNecesidad(p) {
    const n = NEEDS.find(x => x.k === needSel) || NEEDS[0];
    const fields = NEED_FIELDS[n.k];
    const rows = p.scenes.filter(s => s.needs[n.k]);
    const mpp = minutesPerPage(p);
    let filled = false;
    rows.forEach(s => {
      s.needDetail = s.needDetail || {};
      if (!s.needDetail[n.k]) { s.needDetail[n.k] = autoNeedDetail(s, n.k); filled = true; }
    });
    if (filled) save();
    return `<section class="panel">
      ${printHeader(p, 'Detalle: ' + n.label)}
      <h2>Detalle por necesidad · <span class="estado-badge lbl-bg-${n.lbl || DEPT_LABEL[n.dept]}" style="font-size:14px">${esc(n.label.toUpperCase())}</span></h2>
      <p class="lead no-print">Departamento: <b>${esc(DEPTS[n.dept])}</b>. Secuencias con esta necesidad y lo que piden en concreto. Los campos se rellenan con las frases del guion que lo mencionan: revísalos y edítalos, o pide a Claude que los detalle con criterio profesional.</p>
      <div class="toolbar no-print">${needChipsNav(p, n.k)}</div>
      <div class="toolbar no-print">
        <button class="btn btn-small" data-action="ai-need" data-k="${n.k}">✦ Detallar con Claude</button>
        <button class="btn btn-small" data-action="reset-need" data-k="${n.k}">Volver a extraer del guion</button>
        <span class="spacer"></span><span class="muted">${rows.length} secuencias · ${fmtMin(rows.reduce((a, s) => a + s.lengthPages * mpp, 0))}</span>
        <button class="btn btn-small" data-action="print">Imprimir / PDF</button>
      </div>
      <div id="aiNeedStatus" class="muted" style="margin-bottom:8px"></div>
      ${rows.length ? `<div class="table-wrap"><table>
        <thead><tr><th class="num">Nº</th><th>Secuencia</th><th>Estado</th><th class="num">Dur. est.</th>${fields.map(f => `<th>${esc(f[1])}</th>`).join('')}<th>Notas ${esc(DEPTS[n.dept])}</th></tr></thead>
        <tbody>${rows.map(s => `<tr>
          <td class="num"><b>${esc(s.num)}</b></td>
          <td style="min-width:200px"><b>${esc(sceneHeading(s))}</b><div class="muted" style="font-size:12px">${esc(s.summary.slice(0, 160))}</div></td>
          <td>${estadoSelect(s)}</td>
          <td class="num">${fmtMin(s.lengthPages * mpp)}</td>
          ${fields.map(f => `<td>${area('s:' + s.id + ':needDetail.' + n.k + '.' + f[0], 'class="cell-input" style="min-width:260px;min-height:80px"')}</td>`).join('')}
          <td>${area('s:' + s.id + ':notes.' + n.dept, 'class="cell-input" style="min-width:180px"')}</td>
        </tr>`).join('')}</tbody></table></div>` : '<p class="muted">Ninguna secuencia tiene marcada esta necesidad. Márcala en el Desglose de montaje.</p>'}
    </section>`;
  }

  /* ------------------------------------------------------------------ */
  /* Pestaña: Reunión workflow                                            */
  /* ------------------------------------------------------------------ */
  function tabWorkflow(p) {
    return `<section class="panel">
      ${printHeader(p, 'Reunión de workflow de postproducción')}
      <h2>Reunión de workflow de postproducción</h2>
      <p class="lead no-print">Guion de la reunión con producción, dirección de fotografía, DIT, sonido directo y coordinación de postproducción. Se imprime como acta.</p>
      <div class="form-grid">
        ${field('Fecha de la reunión', inp('p:workflow.fecha', 'type="date"'))}
        ${field('Asistentes', inp('p:workflow.asistentes'))}
        ${field('Coordinación de postproducción', inp('p:workflow.coordinacion'))}
      </div>
      ${WORKFLOW_FIELDS.map(([title, fields]) => `<h3>${esc(title)}</h3><div class="form-grid">${fields.map(([k, label]) => field(label, area('p:workflow.' + k, 'rows="2"'))).join('')}</div>`).join('')}
      <h3>Acuerdos y pendientes</h3>
      <div class="form-grid">${field('Acuerdos', area('p:workflow.acuerdos', 'rows="4"'), 'wide')}${field('Pendientes / responsables', area('p:workflow.pendientes', 'rows="4"'), 'wide')}</div>
    </section>`;
  }

  /* ------------------------------------------------------------------ */
  /* Subida de guiones                                                    */
  /* ------------------------------------------------------------------ */
  async function handleFile(file) {
    if (!file) return;
    showModal(`<h3><span class="spinner"></span>Leyendo «${esc(file.name)}»…</h3><p>Detectando secuencias, personajes y necesidades.</p>`);
    let parsed;
    try {
      parsed = await ScriptParser.parseFile(file);
    } catch (e) {
      console.error(e);
      showModal(`<h3>No se ha podido leer el guion</h3><p>${esc(e.message || e)}</p><div class="actions"><button class="btn btn-primary" data-action="close-modal">Cerrar</button></div>`);
      return;
    }
    const cur = P();
    const summary = `<p><b>${parsed.scenes.length}</b> secuencias · <b>${parsed.pages}</b> páginas · <b>${new Set(parsed.scenes.flatMap(s => s.characters)).size}</b> personajes detectados (${esc(parsed.format)}).</p>`;
    if (!cur || !cur.scenes.length) {
      if (cur && !cur.scenes.length) applyParsed(cur, parsed);
      else createFromParsed(parsed);
      const changed = applyPortada(P(), parsed.portada, false);
      if (window.AIEditor) window.AIEditor.portada(P(), parsed, false);
      finishImport(`<h3>Guion cargado</h3>${summary}${portadaHTML(changed)}<p>Siguiente paso: pide el <b>desglose automático</b> (criterio de montaje profesional) o empieza a desglosar a mano. Todo queda editable.</p>`, true);
      return;
    }
    pendingParsed = parsed;
    showModal(`<h3>Guion leído: «${esc(parsed.filename)}»</h3>${summary}
      <p>¿Es una <b>nueva versión</b> de «${esc(cur.title)}» o un <b>proyecto nuevo</b>? En una nueva versión se conservan tramas, notas, intensidad y puntos de giro de las secuencias con el mismo número.</p>
      <div class="actions"><button class="btn" data-action="close-modal">Cancelar</button><button class="btn" data-action="import-version">Nueva versión de «${esc(cur.title)}»</button><button class="btn btn-primary" data-action="import-new">Proyecto nuevo</button></div>`);
  }
  let pendingParsed = null;
  function createFromParsed(parsed) {
    const p = newProject({ title: parsed.title || parsed.filename.replace(/\.[^.]+$/, '') });
    applyParsed(p, parsed);
  }
  function finishImport(msg, offerAI) {
    if (P()) Cloud.textsDirty.add(P().id);
    tab = 'proyecto'; expanded.clear(); save(); render();
    showModal(msg + `<div class="actions"><button class="btn" data-action="close-modal">${offerAI ? 'Desglosar a mano' : 'Empezar'}</button>${offerAI ? '<button class="btn btn-primary" data-action="go-ia">✦ Desglose automático</button>' : ''}</div>`);
  }

  /* ------------------------------------------------------------------ */
  /* Exportaciones                                                        */
  /* ------------------------------------------------------------------ */
  async function download(name, content, type) {
    if (Cloud.dl) {
      try { await Cloud.dl.save({ filename: name, data: content }); toast('Archivo guardado: ' + name); }
      catch (e) { if (e && e.code !== 'declined') toast('⚠ No se ha podido descargar (' + (e.code || e) + ').'); }
      return;
    }
    const blob = content instanceof Blob ? content : new Blob([content], { type });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  const fileBase = p => (p.title || 'proyecto').replace(/[^\wÀ-ÿ-]+/g, '_') + (p.version ? '_v' + String(p.version).replace(/[^\w-]+/g, '') : '');

  function exportCSV(p) {
    const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    const mpp = minutesPerPage(p);
    const head = ['Estado', 'Nº', 'INT/EXT', 'Localización', 'Día/Noche', 'Trama', 'Personajes', 'Resumen', 'Conflicto / objetivo', 'Página', 'Octavos', 'Duración est. (min)', 'Intensidad', 'Punto de giro', 'Necesidades', 'Notas montaje', 'Notas color', 'Notas VFX', 'Notas sonido', 'Notas música'];
    const rows = p.scenes.map(s => {
      const t = tramaOf(p, s);
      return [ESTADOS.filter(e => getEstados(s).includes(e.k)).map(e => e.label).join(', ') || 'SIN RODAR', s.num, s.intExt, s.location, s.time, t ? t.letter + ' · ' + t.name : '', s.characters.join(', '), s.summary, s.conflict, s.page, fmtEighths(s.eighths),
        (s.lengthPages * mpp).toFixed(1), s.intensity, s.keyEvent ? (s.eventLabel || 'sí') : '', NEEDS.filter(n => s.needs[n.k]).map(n => n.label).join(', '),
        s.notes.montaje, s.notes.color, s.notes.vfx, s.notes.sonido, s.notes.musica];
    });
    download(fileBase(p) + '_escaleta.csv', '﻿' + [head, ...rows].map(r => r.map(q).join(';')).join('\n'), 'text/csv;charset=utf-8');
  }

  function exportPrintable(p) {
    // En la página publicada (iPad/claude.ai) no se puede imprimir directamente:
    // se descarga un HTML con la pestaña actual, que se abre y se imprime o guarda como PDF.
    renderTab();
    let css = '';
    Array.from(document.styleSheets).forEach(sh => { try { css += Array.from(sh.cssRules).map(r => r.cssText).join('\n'); } catch (e) { /* hoja externa */ } });
    const tabLabel = (TABS.find(t => t.id === tab) || {}).label || 'documento';
    const html = '<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>' + esc(p.title + ' — ' + tabLabel) +
      '</title><style>' + css + '\n.no-print,.toolbar,.card-tools,.handle,.btn{display:none!important}.print-header{display:block}main{max-width:none;padding:12px}.panel{border:0}</style></head><body><main>' +
      $('#main').innerHTML + '</main><script>setTimeout(function(){try{window.print()}catch(e){}},400)<\/script></body></html>';
    download(fileBase(p) + '_' + tabLabel.replace(/[^\wÀ-ÿ]+/g, '_') + '.html', html, 'text/html');
  }

  function steplineSVGString() {
    const svg = document.querySelector('#steplineWrap svg');
    return svg ? new XMLSerializer().serializeToString(svg) : '';
  }
  function exportPNG(p) {
    const s = steplineSVGString(); if (!s) return;
    const svg = document.querySelector('#steplineWrap svg');
    const w = svg.viewBox.baseVal.width, h = svg.viewBox.baseVal.height, scale = 2;
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = w * scale; c.height = h * scale;
      const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      c.toBlob(b => download(fileBase(p) + '_stepline.png', b), 'image/png');
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
  }

  /* ------------------------------------------------------------------ */
  /* Acciones                                                             */
  /* ------------------------------------------------------------------ */
  const actions = {
    'close-modal': () => hideModal(),
    'go-need': (el) => { needSel = el.dataset.k; tab = 'necesidad'; window.scrollTo(0, 0); render(); },
    'reset-need': (el) => { const k = el.dataset.k; P().scenes.forEach(s => { if (s.needDetail) delete s.needDetail[k]; }); save(); renderTab(); },
    'ai-need': (el) => { if (window.AIEditor) window.AIEditor.detailNeed(el.dataset.k, NEED_FIELDS[el.dataset.k], NEEDS.find(n => n.k === el.dataset.k)); },
    'go-ia': () => { hideModal(); tab = 'ia'; window.scrollTo(0, 0); render(); },
    'import-new': () => {
      const parsed = pendingParsed; createFromParsed(parsed); pendingParsed = null;
      const changed = applyPortada(P(), parsed.portada, false);
      if (window.AIEditor) window.AIEditor.portada(P(), parsed, false);
      finishImport('<h3>Proyecto nuevo creado</h3>' + portadaHTML(changed), true);
    },
    'import-version': () => {
      const parsed = pendingParsed; const p = P(); const kept = mergeVersion(p, parsed); pendingParsed = null;
      const changed = applyPortada(p, parsed.portada, true);
      if (window.AIEditor) window.AIEditor.portada(p, parsed, true);
      finishImport(`<h3>Versión actualizada</h3><p>${p.scenes.length} secuencias; se han conservado las anotaciones de ${kept}.</p>${portadaHTML(changed)}<p class="muted">Comprueba la versión y la fecha en <b>Proyecto</b>.</p>`);
    },
    'new-empty': () => { newProject(); tab = 'proyecto'; save(); render(); },
    'export-json': () => { const p = P(); if (p) download(fileBase(p) + '.desglose.json', JSON.stringify(p, null, 1), 'application/json'); },
    'export-csv': () => { const p = P(); if (p) exportCSV(p); },
    'print': () => {
      if (!window.claude) { window.print(); return; }
      exportPrintable(P());
    },
    'delete-project': () => {
      const p = P(); if (!p) return;
      showModal(`<h3>¿Borrar «${esc(p.title)}»?</h3><p>Se eliminará de este navegador. Si quieres conservarlo, guarda antes una copia .json.</p><div class="actions"><button class="btn" data-action="close-modal">Cancelar</button><button class="btn btn-primary" data-action="confirm-delete">Borrar</button></div>`);
    },
    'confirm-delete': () => { Cloud.remove(state.currentId); delete state.projects[state.currentId]; state.currentId = Object.keys(state.projects)[0] || null; hideModal(); save(); render(); },
    'add-trama': () => {
      const p = P(); const i = p.tramas.length;
      p.tramas.push({ id: 't' + uid(), letter: String.fromCharCode(65 + i), name: 'Trama ' + String.fromCharCode(65 + i), color: EXTRA_COLORS[i % EXTRA_COLORS.length] });
      save(); renderTab();
    },
    'del-trama': (el) => {
      const p = P(); const id = el.dataset.id;
      p.tramas = p.tramas.filter(t => t.id !== id);
      p.scenes.forEach(s => { if (s.tramaId === id) s.tramaId = ''; });
      Object.values(p.characters).forEach(c => { if (c.tramaId === id) c.tramaId = ''; });
      save(); renderTab();
    },
    'add-character': () => {
      showModal(`<h3>Añadir personaje</h3><div class="field"><label>Nombre</label><input id="newCharName" autocomplete="off"></div><div class="actions"><button class="btn" data-action="close-modal">Cancelar</button><button class="btn btn-primary" data-action="confirm-add-character">Añadir</button></div>`);
      setTimeout(() => { const i = $('#newCharName'); if (i) i.focus(); }, 50);
    },
    'confirm-add-character': () => {
      const name = ($('#newCharName').value || '').trim().toUpperCase();
      hideModal();
      if (!name) return; const p = P();
      if (!p.characters[name]) p.characters[name] = { tramaId: '', objetivo: '', arcoInicio: '', arcoFin: '', notas: '', hidden: false };
      save(); renderTab();
    },
    'auto-char-tramas': () => {
      const p = P(); let n = 0;
      Object.keys(p.characters).forEach(c => {
        const cnt = {};
        p.scenes.forEach(s => { if (s.tramaId && s.characters.includes(c)) cnt[s.tramaId] = (cnt[s.tramaId] || 0) + 1; });
        const best = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0];
        if (best && !p.characters[c].tramaId) { p.characters[c].tramaId = best; n++; }
      });
      save(); renderTab(); toast(n ? `Trama asignada a ${n} personajes.` : 'Asigna primero trama a algunas secuencias en el Desglose de montaje.');
    },
    'auto-scene-tramas': () => {
      const p = P(); let n = 0;
      p.scenes.forEach(s => {
        if (s.tramaId) return;
        const cnt = {};
        s.characters.forEach((c, i) => { const t = (p.characters[c] || {}).tramaId; if (t) cnt[t] = (cnt[t] || 0) + (i === 0 ? 1.5 : 1); });
        const best = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0];
        if (best) { s.tramaId = best; n++; }
      });
      save(); renderTab(); toast(n ? `Trama asignada a ${n} secuencias. Revísalas en el desglose.` : 'Asigna primero trama a los personajes.');
    },
    'toggle-row': (el) => { const id = el.dataset.id; expanded.has(id) ? expanded.delete(id) : expanded.add(id); renderTab(); },
    'expand-all': () => { P().scenes.forEach(s => expanded.add(s.id)); renderTab(); },
    'collapse-all': () => { expanded.clear(); renderTab(); },
    'montaje-view': (el) => { montajeView = el.dataset.v; renderTab(); },
    'reset-order': () => { const p = P(); p.montajeOrder = p.scenes.map(s => s.id); p.removed = {}; save(); renderTab(); },
    'move': (el) => {
      const p = P(); const i = p.montajeOrder.indexOf(el.dataset.id), j = i + Number(el.dataset.d);
      if (i < 0 || j < 0 || j >= p.montajeOrder.length) return;
      [p.montajeOrder[i], p.montajeOrder[j]] = [p.montajeOrder[j], p.montajeOrder[i]];
      save(); renderTab();
    },
    'toggle-estado': (el) => {
      const sc = sceneById(P(), el.dataset.id); const est = getEstados(sc); const k = el.dataset.e;
      const i = est.indexOf(k); if (i >= 0) est.splice(i, 1); else est.push(k);
      sc.estado = est[est.length - 1] || 'sinrodar';
      openEst = sc.id; save(); renderTab();
    },
    'clear-estado': (el) => { const sc = sceneById(P(), el.dataset.id); sc.estados = []; sc.estado = 'sinrodar'; openEst = null; save(); renderTab(); },
    'toggle-removed': (el) => {
      const p = P(); const sc = sceneById(p, el.dataset.id);
      const est = getEstados(sc);
      if (isRemoved(p, sc)) { delete p.removed[sc.id]; sc.estados = est.filter(x => x !== 'eliminada'); }
      else est.push('eliminada');
      save(); renderTab();
    },
    'suggest-curve': () => {
      showModal(`<h3>Proponer curva inicial</h3><p>Se sustituirán las intensidades actuales por una propuesta orientativa basada en el paradigma clásico (planteamiento ascendente, desarrollo, clímax y resolución), ajustada por secuencias de acción y puntos de giro marcados.</p><p>Es solo un <b>punto de partida para discutir</b>: corrígela arrastrando los puntos.</p><div class="actions"><button class="btn" data-action="close-modal">Cancelar</button><button class="btn btn-primary" data-action="confirm-suggest">Proponer</button></div>`);
    },
    'confirm-suggest': () => { suggestCurve(P()); hideModal(); save(); renderTab(); },
    'flat-curve': () => { steplineScenes(P()).forEach(s => { s.intensity = 5; }); save(); renderTab(); },
    'default-acts': () => { const p = P(); p.acts = defaultActs(p); save(); renderTab(); },
    'export-svg': () => { const p = P(); download(fileBase(p) + '_stepline.svg', steplineSVGString(), 'image/svg+xml'); },
    'export-png': () => exportPNG(P())
  };

  const changeActions = {
    'merge-char': (el) => {
      const p = P(); const from = el.dataset.name, into = el.value; if (!into) return;
      p.scenes.forEach(s => {
        const rep = arr => { const i = arr.indexOf(from); if (i >= 0) { if (arr.includes(into)) arr.splice(i, 1); else arr[i] = into; } };
        rep(s.characters); rep(s.offCharacters || []);
      });
      const a = p.characters[from], b = p.characters[into];
      ['tramaId', 'objetivo', 'arcoInicio', 'arcoFin', 'notas'].forEach(k => { if (!b[k] && a[k]) b[k] = a[k]; });
      delete p.characters[from];
      save(); renderTab(); toast(`«${from}» fusionado con «${into}».`);
    },
    'stepline-order': (el) => { steplineOrder = el.value; renderTab(); },
    'set-act': (el) => {
      const p = P(); const name = el.dataset.act;
      p.acts = p.acts.filter(a => a.name !== name);
      if (el.value) p.acts.push({ name, start: el.value });
      p.acts.sort((a, b) => ACT_NAMES.indexOf(a.name) - ACT_NAMES.indexOf(b.name));
      save(); renderTab();
    }
  };

  /* ------------------------------------------------------------------ */
  /* Eventos                                                              */
  /* ------------------------------------------------------------------ */
  function onFieldInput(el, isChange) {
    const k = el.dataset.k; if (!k) return;
    const t = bindTarget(k); if (!t || !t.obj) return;
    let v;
    if (el.type === 'checkbox') v = el.dataset.invert ? !el.checked : el.checked;
    else if (el.dataset.list) v = el.value.split(',').map(x => x.trim().toUpperCase()).filter(Boolean);
    else if (el.dataset.num) v = Math.max(0, Math.min(10, parseFloat(el.value) || 0));
    else v = el.value;
    setPath(t.obj, t.path, v);
    if (el.dataset.edited) t.obj[el.dataset.edited] = true;
    if (el.dataset.list) ensureCharacters(P());
    save();
    if (el.dataset.rerenderSelect) renderProjectSelect();
    if (el.dataset.rerender && (isChange || !el.dataset.lazy)) {
      if (el.type === 'checkbox' || el.tagName === 'SELECT' || el.type === 'color' || isChange) renderTab();
    }
    if (el.classList.contains('edit')) grow(el);
  }

  document.addEventListener('input', e => {
    const el = e.target;
    if (el.dataset && el.dataset.k && el.type !== 'checkbox' && el.tagName !== 'SELECT' && el.type !== 'color') onFieldInput(el, false);
    if (el.tagName === 'TEXTAREA') grow(el);
  });
  document.addEventListener('change', e => {
    const el = e.target;
    if (el.id === 'fileInput' || el.classList.contains('file-trigger')) { handleFile(el.files[0]); el.value = ''; return; }
    if (el.id === 'jsonInput') { importJSON(el.files[0]); el.value = ''; return; }
    if (el.id === 'projectSelect') { state.currentId = el.value; expanded.clear(); save(); render(); return; }
    if (el.dataset.actionChange) { changeActions[el.dataset.actionChange](el); return; }
    if (el.dataset.k) onFieldInput(el, true);
  });
  document.addEventListener('toggle', e => {
    const d = e.target;
    if (!d.classList || !d.classList.contains('est-dd')) return;
    if (d.open) { openEst = d.dataset.id; document.querySelectorAll('.est-dd[open]').forEach(x => { if (x !== d) x.open = false; }); }
    else if (openEst === d.dataset.id) openEst = null;
  }, true);
  document.addEventListener('click', e => {
    if (!e.target.closest('.est-dd') && openEst) { openEst = null; document.querySelectorAll('.est-dd[open]').forEach(x => { x.open = false; }); }
    const secBtn = e.target.closest('[data-section]');
    if (secBtn) {
      const sec = sections().find(x => x.name === secBtn.dataset.section);
      if (sec) { tab = lastTabOf[sec.name] && sec.tabs.some(t => t.id === lastTabOf[sec.name]) ? lastTabOf[sec.name] : sec.tabs[0].id; window.scrollTo(0, 0); render(); }
      return;
    }
    const tabBtn = e.target.closest('[data-tab]');
    if (tabBtn) { tab = tabBtn.dataset.tab; const sc = sections().find(x => x.tabs.some(t => t.id === tab)); if (sc) lastTabOf[sc.name] = tab; window.scrollTo(0, 0); render(); return; }
    const a = e.target.closest('[data-action]');
    if (a) { document.querySelector('.menu').classList.remove('open'); if (actions[a.dataset.action]) actions[a.dataset.action](a); return; }
    if (e.target.closest('#menuBtn')) { document.querySelector('.menu').classList.toggle('open'); return; }
    if (!e.target.closest('.menu')) document.querySelector('.menu').classList.remove('open');
    if (e.target.closest('#dropzone') && !e.target.closest('label')) document.querySelector('#dropzone .file-trigger').click();
  });

  // Arrastrar y soltar archivos en toda la ventana
  let dragDepth = 0;
  const isFileDrag = e => e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files');
  window.addEventListener('dragenter', e => { if (!isFileDrag(e)) return; dragDepth++; $('#dropOverlay').hidden = false; });
  window.addEventListener('dragleave', e => { if (!isFileDrag(e)) return; dragDepth = Math.max(0, dragDepth - 1); if (!dragDepth) $('#dropOverlay').hidden = true; });
  window.addEventListener('dragover', e => { if (isFileDrag(e)) e.preventDefault(); });
  window.addEventListener('drop', e => {
    if (!isFileDrag(e)) return;
    e.preventDefault(); dragDepth = 0; $('#dropOverlay').hidden = true;
    const f = e.dataTransfer.files[0];
    if (f && /\.json$/i.test(f.name)) importJSON(f); else handleFile(f);
  });

  // Reordenar fichas de escaleta de montaje
  function attachCardDrag() {
    const wrap = $('#cards'); if (!wrap || montajeView !== 'montaje') return;
    let dragId = null;
    wrap.addEventListener('dragstart', e => {
      const c = e.target.closest('.card'); if (!c) return;
      if (e.target.tagName === 'TEXTAREA') { e.preventDefault(); return; }
      dragId = c.dataset.id; c.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', dragId);
    });
    wrap.addEventListener('dragover', e => {
      if (!dragId) return; e.preventDefault();
      wrap.querySelectorAll('.drop-before').forEach(x => x.classList.remove('drop-before'));
      const c = e.target.closest('.card'); if (c && c.dataset.id !== dragId) c.classList.add('drop-before');
    });
    wrap.addEventListener('drop', e => {
      if (!dragId) return; e.preventDefault(); e.stopPropagation();
      const c = e.target.closest('.card'); const p = P();
      if (c && c.dataset.id !== dragId) {
        const order = p.montajeOrder.filter(id => id !== dragId);
        order.splice(order.indexOf(c.dataset.id), 0, dragId);
        p.montajeOrder = order; save();
      }
      dragId = null; renderTab();
    });
    wrap.addEventListener('dragend', () => { dragId = null; wrap.querySelectorAll('.dragging,.drop-before').forEach(x => x.classList.remove('dragging', 'drop-before')); });
  }

  function importJSON(file) {
    if (!file) return;
    file.text().then(t => {
      const p = JSON.parse(t);
      if (!p || !Array.isArray(p.scenes)) throw new Error('formato');
      p.id = 'p' + uid();
      Cloud.textsDirty.add(p.id);
      state.projects[p.id] = p; state.currentId = p.id; tab = 'proyecto';
      save(); render(); toast(`Proyecto «${p.title}» abierto.`);
    }).catch(() => toast('⚠ El archivo no es una copia válida de esta app.'));
  }

  /* ------------------------------------------------------------------ */
  /* UI auxiliares                                                        */
  /* ------------------------------------------------------------------ */
  function showModal(html) { $('#modalBody').innerHTML = html; $('#modal').hidden = false; }
  function hideModal() { $('#modal').hidden = true; }
  let toastTimer;
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 3500); }
  function grow(el) { if (!el.classList.contains('edit')) return; el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; }
  function autoGrow() { document.querySelectorAll('textarea.edit').forEach(grow); }

  window.addEventListener('beforeprint', autoGrow);
  // API para el módulo de desglose automático (js/ai.js)
  window.DesgloseApp = {
    P, save, render, renderTab, toast, showModal, hideModal, esc, uid, field, area, inp,
    NEEDS, DEPTS, ACT_NAMES, DEFAULT_TRAMAS, EXTRA_COLORS, sceneHeading, fmtEighths, ensureCharacters,
    applyPortada, actions, getTab: () => tab, setTab: t => { tab = t; render(); }
  };
  render();
  Cloud.init();
})();
