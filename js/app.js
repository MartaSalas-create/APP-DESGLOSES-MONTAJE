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
    { id: 'mapa', label: 'Mapa de tramas' },
    { id: 'stepline', label: 'Step line' },
    { id: 'doctor', label: 'Script doctor' },
    { group: 'Postproducción' },
    { id: 'departamentos', label: 'Necesidades por departamento' },
    { id: 'necesidad', label: 'Detalle por necesidad' },
    { id: 'sonido', label: 'Listado SFX y ambientes' },
    { id: 'workflow', label: 'Reunión workflow' }
  ];

  // Organización por fases (propuesta): fase → grupos → pestañas. Una pestaña puede estar en dos fases.
  const PHASES = [
    { name: 'Preproducción', groups: [
      ['Proyecto', ['proyecto', 'ia']],
      ['Guion', ['analisis', 'tramas', 'arcos', 'mapa', 'stepline', 'doctor']],
      ['Montaje', ['desglose', 'escaleta']],
      ['Workflow', ['workflow', 'departamentos']]
    ] },
    { name: 'Producción / Rodaje', groups: [
      ['Seguimiento', ['rodaje']],
      ['Montaje', ['montaje']]
    ] },
    { name: 'Postproducción', groups: [
      ['Montaje', ['montaje', 'steplinem']],
      ['Departamentos', ['departamentos', 'necesidad', 'sonido']]
    ] }
  ];
  const EXTRA_LABELS = { rodaje: 'Seguimiento de rodaje', steplinem: 'Step line del montaje', proyecto: 'Datos del proyecto', workflow: 'Reunión de workflow' };
  const tabLabel = id => (TABS.find(t => t.id === id) || {}).label || EXTRA_LABELS[id] || 'documento';
  const navMode = () => (state.ui && state.ui.nav) || 'clasica';
  const ALL_TAB_IDS = () => Array.from(new Set(TABS.filter(t => t.id).map(t => t.id).concat(Object.keys(EXTRA_LABELS))));
  const labelOf = id => (id === 'proyecto' || id === 'workflow' || (EXTRA_LABELS[id] && !TABS.find(t => t.id === id))) ? EXTRA_LABELS[id] : tabLabel(id);
  // organización por fases: la personalizada (si existe) o la propuesta original
  function getPhases() {
    const u = state.ui && state.ui.phases;
    if (Array.isArray(u) && u.length) return u;
    return JSON.parse(JSON.stringify(PHASES));
  }
  function setPhases(ph) { state.ui = state.ui || {}; state.ui.phases = ph; save(); if (typeof Cloud !== 'undefined') Cloud.queueSettings && Cloud.queueSettings(); }

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
        if (st.exists && st.data().ui && !(state.ui && state.ui.phases)) { try { state.ui = Object.assign({}, JSON.parse(st.data().ui), state.ui || {}); changed = true; } catch (e) { /* sin ajustes */ } }
      } catch (e) { /* sin ajustes */ }
      if (!state.currentId || !state.projects[state.currentId]) state.currentId = Object.keys(state.projects)[0] || null;
      if (changed) { render(); toast('Proyectos recuperados de tu cuenta.'); }
    },
    queueSettings() { if (!this.db) return; clearTimeout(this.timer); this.timer = setTimeout(() => this.flush(), 1500); },
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
        if (state.currentId) await this.col().doc('settings').set({ currentId: state.currentId, ui: JSON.stringify(state.ui || {}) });
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
  /* ---------- Series: varios episodios en un mismo proyecto ----------
     Cada secuencia lleva s.ep (id del episodio). Cuando se trabaja en un
     episodio, P() devuelve una «vista» del proyecto que solo enseña las
     secuencias de ese episodio (y sus actos, script doctor, páginas…); lo que
     se escribe en la vista va al proyecto real. */
  const RP = () => state.projects[state.currentId] || null;
  const isSerie = p => !!p && /^Serie/i.test(p.formato || '');
  const epList = p => (p && Array.isArray(p.episodes)) ? p.episodes : [];
  const epLabelFull = e => e ? (e.label || 'Episodio') + (e.title ? ' · ' + e.title : '') : '';
  function curEp(p) { const e = ((state.ui && state.ui.ep) || {})[p.id]; return e && epList(p).some(x => x.id === e) ? e : 'all'; }
  const viewCache = new Map();
  function viewFor(t, ep) {
    const key = t.id + '|' + ep; const c = viewCache.get(key);
    if (c && c.t === t) return c.v;
    const epObj = () => epList(t).find(e => e.id === ep) || {};
    const epIds = () => new Set(t.scenes.filter(x => x.ep === ep).map(x => x.id));
    const v = new Proxy(t, {
      get(tg, k) {
        switch (k) {
          case 'scenes': return tg.scenes.filter(x => x.ep === ep);
          case 'montajeOrder': { const ids = epIds(); return tg.montajeOrder.filter(id => ids.has(id)); }
          case 'acts': return ((tg.actsByEp || {})[ep]) || [];
          case 'doctor': return (tg.doctorByEp || {})[ep];
          case 'pages': return epObj().pages || 0;
          case 'durationMin': return epObj().durationMin || '';
          case 'episodio': return tg.episodio || epLabelFull(epObj());
          case '__ep': return ep;
          default: return tg[k];
        }
      },
      set(tg, k, val) {
        switch (k) {
          case 'scenes': {
            const others = tg.scenes.filter(x => x.ep !== ep);
            const first = tg.scenes.findIndex(x => x.ep === ep);
            const before = first < 0 ? others.length : tg.scenes.slice(0, first).filter(x => x.ep !== ep).length;
            val.forEach(x => { x.ep = ep; });
            tg.scenes = others.slice(0, before).concat(val, others.slice(before)); return true;
          }
          case 'montajeOrder': {
            const ids = epIds(); const q = val.slice();
            tg.montajeOrder = tg.montajeOrder.map(id => ids.has(id) ? q.shift() : id).filter(x => x !== undefined).concat(q); return true;
          }
          case 'acts': tg.actsByEp = tg.actsByEp || {}; tg.actsByEp[ep] = val; return true;
          case 'doctor': tg.doctorByEp = tg.doctorByEp || {}; tg.doctorByEp[ep] = val; return true;
          case 'pages': epObj().pages = val; return true;
          case 'durationMin': epObj().durationMin = val; return true;
          default: tg[k] = val; return true;
        }
      }
    });
    viewCache.set(key, { t, v });
    return v;
  }
  function P() {
    const p = RP(); if (!p) return null;
    if (!isSerie(p) || !epList(p).length) return p;
    const ep = curEp(p); return ep === 'all' ? p : viewFor(p, ep);
  }
  // nº de secuencia para mostrar: con la temporada completa a la vista, lleva delante el episodio
  function dnum(sc) {
    const p = RP(); if (!sc || !sc.ep || !isSerie(p) || curEp(p) !== 'all') return sc ? sc.num : '';
    const e = epList(p).find(x => x.id === sc.ep); return (e ? e.label + '·' : '') + sc.num;
  }
  // si un proyecto pasa a ser serie, lo que ya hay se convierte en el episodio 1
  function ensureEpisodes(p) {
    if (!p || !isSerie(p) || epList(p).length || !p.scenes.length) return;
    const e = { id: 'e' + uid(), label: 'Ep. 1', title: '', filename: p.source ? p.source.filename : '', pages: p.pages, importedAt: (p.source || {}).importedAt || new Date().toISOString(), durationMin: p.durationMin || '' };
    p.episodes = [e]; p.scenes.forEach(x => { x.ep = e.id; });
    p.actsByEp = { [e.id]: p.acts || [] }; if (p.doctor) p.doctorByEp = { [e.id]: p.doctor };
  }
  function guessEpLabel(parsed, n) {
    const src = ((parsed.portada || {}).episodio || '') + ' ' + parsed.filename;
    let m = src.match(/(\d{1,2})\s*[xX]\s*(\d{1,3})/); if (m) return `${+m[1]}x${String(+m[2]).padStart(2, '0')}`;
    m = src.match(/(?:ep(?:isodio)?|cap(?:[ií]tulo)?|chapter|episode)[\s._-]*0*(\d{1,3})/i); if (m) return `Ep. ${+m[1]}`;
    return `Ep. ${n}`;
  }
  function addEpisode(p, parsed) {
    ensureEpisodes(p);
    p.episodes = epList(p);
    const pt = parsed.portada || {};
    const e = { id: 'e' + uid(), label: guessEpLabel(parsed, p.episodes.length + 1), title: pt.episodio && !/^\s*(\d+\s*x\s*\d+|ep|cap)/i.test(pt.episodio) ? pt.episodio : '', filename: parsed.filename, pages: parsed.pages, version: pt.version || '', fecha: pt.fecha || '', importedAt: new Date().toISOString(), durationMin: '' };
    const sc = parsed.scenes.map(sceneFromParsed); sc.forEach(x => { x.ep = e.id; });
    p.episodes.push(e);
    p.scenes = p.scenes.concat(sc);
    p.montajeOrder = (p.montajeOrder || []).concat(sc.map(x => x.id));
    p.pages = p.episodes.reduce((a, x) => a + (Number(x.pages) || 0), 0);
    p.actsByEp = p.actsByEp || {}; p.actsByEp[e.id] = defaultActs({ scenes: sc });
    ensureCharacters(p); autoUnify(p);
    if (!p.source) p.source = { filename: parsed.filename, format: parsed.format, importedAt: e.importedAt };
    state.ui = state.ui || {}; state.ui.ep = Object.assign({}, state.ui.ep, { [p.id]: e.id });
    Cloud.textsDirty.add(p.id);
    return e;
  }
  function deleteEpisode(p, id) {
    const ids = new Set(p.scenes.filter(x => x.ep === id).map(x => x.id));
    p.scenes = p.scenes.filter(x => x.ep !== id);
    p.montajeOrder = (p.montajeOrder || []).filter(x => !ids.has(x));
    if (p.actsByEp) delete p.actsByEp[id]; if (p.doctorByEp) delete p.doctorByEp[id];
    p.episodes = epList(p).filter(e => e.id !== id);
    p.pages = p.episodes.reduce((a, x) => a + (Number(x.pages) || 0), 0);
    Cloud.textsDirty.add(p.id);
  }
  function regroupByEpisode(p) {
    const order = epList(p).map(e => e.id);
    p.scenes = order.flatMap(id => p.scenes.filter(x => x.ep === id)).concat(p.scenes.filter(x => !order.includes(x.ep)));
  }

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
    p.mergeLog = [];
    autoUnify(p);
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
    // volver a aplicar las uniones de nombres de la versión anterior y buscar nuevas
    (p.mergeLog || []).forEach(m => { if (p.characters[m.from] && p.characters[m.into]) mergeChars(p, m.from, m.into, null); });
    autoUnify(p);
    return kept;
  }

  /* ---------- Personajes repetidos con nombres distintos ---------- */
  const TITLES = new Set(['TENIENTE', 'CAPITAN', 'SARGENTO', 'CORONEL', 'GENERAL', 'COMANDANTE', 'CABO', 'SOLDADO', 'COMISARIO', 'INSPECTOR', 'INSPECTORA', 'AGENTE', 'DETECTIVE',
    'SENOR', 'SENORA', 'SENORITA', 'SR', 'SRA', 'SRTA', 'DON', 'DONA', 'DOCTOR', 'DOCTORA', 'DR', 'DRA', 'PROFESOR', 'PROFESORA', 'PADRE', 'MADRE', 'HERMANO', 'HERMANA', 'TIO', 'TIA',
    'ABUELO', 'ABUELA', 'SOR', 'FRAY', 'MISTER', 'MR', 'MRS', 'MS', 'MISS', 'EL', 'LA', 'JOVEN', 'VIEJO', 'VIEJA', 'PEQUENO', 'PEQUENA']);
  const plain = n => String(n).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  function lev(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 9;
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }
  function sceneCount(p, n) { return p.scenes.filter(s => s.characters.includes(n)).length; }
  function findDuplicates(p) {
    const names = Object.keys(p.characters).filter(n => !p.characters[n].hidden);
    const cnt = {}; names.forEach(n => { cnt[n] = sceneCount(p, n); });
    const out = [];
    names.forEach(a => {
      let best = null;
      names.forEach(b => {
        if (a === b) return;
        // b es el nombre que más aparece (a es la variante)
        if (cnt[b] < cnt[a] || (cnt[b] === cnt[a] && b.length > a.length)) return;
        const pa = plain(a), pb = plain(b);
        if (!pa || !pb) return;
        if (pa.replace(/\D/g, '') !== pb.replace(/\D/g, '')) return;      // POLICÍA 1 ≠ POLICÍA 2
        let reason = '';
        if (pa === pb) reason = 'mismo nombre con distinta tilde o signo';
        else {
          const wa = pa.split(' '), wb = pb.split(' ');
          const [lng, sht] = wa.length > wb.length ? [wa, wb] : [wb, wa];
          const contained = sht.every(w => lng.includes(w)) && sht.length < lng.length;
          const extra = lng.filter(w => !sht.includes(w));
          if (contained && (extra.every(w => TITLES.has(w)) || cnt[a] <= 2)) reason = 'el mismo nombre con o sin cargo/tratamiento';
          else if (pa.length >= 5 && cnt[a] <= 2 && cnt[b] > cnt[a] && lev(pa, pb) <= (pa.length >= 9 ? 2 : 1)) reason = 'posible errata';
        }
        if (reason && (!best || cnt[b] > cnt[best.into])) best = { from: a, into: b, reason, n: cnt[a], m: cnt[b] };
      });
      if (best) out.push(best);
    });
    // evitar cadenas (A→B y B→C): resolver al destino final
    out.forEach(x => { let t = x.into, guard = 0; while (out.find(y => y.from === t) && guard++ < 5) t = out.find(y => y.from === t).into; x.into = t; });
    return out.filter(x => x.from !== x.into);
  }
  function mergeChars(p, from, into, log) {
    const touched = [];
    p.scenes.forEach(s => {
      const rep = (arr, main) => { const i = arr.indexOf(from); if (i >= 0) { const had = arr.includes(into); if (main) touched.push({ id: s.id, had }); if (had) arr.splice(i, 1); else arr[i] = into; } };
      rep(s.characters, true); rep(s.offCharacters || [], false);
    });
    const a = p.characters[from] || {}, b = p.characters[into] || (p.characters[into] = { tramaId: '', objetivo: '', arcoInicio: '', arcoFin: '', notas: '', hidden: false });
    ['tramaId', 'objetivo', 'arcoInicio', 'arcoFin', 'notas'].forEach(k => { if (!b[k] && a[k]) b[k] = a[k]; });
    delete p.characters[from];
    if (log) { p.mergeLog = (p.mergeLog || []).filter(m => m.from !== from); p.mergeLog.push({ from, into, reason: log, scenes: touched, data: a }); }
  }
  function autoUnify(p) {
    const d = findDuplicates(p);
    d.forEach(x => { if (p.characters[x.from] && p.characters[x.into]) mergeChars(p, x.from, x.into, x.reason + ' (automático)'); });
    return d;
  }
  function undoMerge(p, i) {
    const m = (p.mergeLog || [])[i]; if (!m) return;
    m.scenes.forEach(t => { const s = sceneById(p, t.id); if (!s) return; const k = s.characters.indexOf(m.into); if (!t.had && k >= 0) s.characters[k] = m.from; else if (!s.characters.includes(m.from)) s.characters.push(m.from); });
    p.characters[m.from] = Object.assign({ tramaId: '', objetivo: '', arcoInicio: '', arcoFin: '', notas: '', hidden: false }, m.data || {}, { hidden: false });
    p.mergeLog.splice(i, 1);
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
  function needsDropdown(s) {
    const key = 'n:' + s.id;
    const on = NEEDS.filter(n => s.needs[n.k]);
    const chip = n => `<span class="chip on lbl-${n.lbl || DEPT_LABEL[n.dept]}">${esc(n.label)}</span>`;
    return `<details class="est-dd needs-dd" data-id="${key}" ${openEst === key ? 'open' : ''}>
      <summary title="Necesidades (selección múltiple)">${on.length ? on.map(chip).join('') : '<span class="muted" style="font-size:12px">— ninguna —</span>'}<span class="est-caret">▾</span></summary>
      <div class="est-menu">${Object.keys(DEPTS).map(d => `<div class="needs-group">${esc(DEPTS[d])}</div>` + NEEDS.filter(n => n.dept === d).map(n =>
        `<button type="button" class="est-opt ${s.needs[n.k] ? 'on' : ''}" data-action="toggle-need" data-id="${s.id}" data-n="${n.k}"><span class="est-check">${s.needs[n.k] ? '✓' : ''}</span>${chip(n)}<span></span></button>`).join('')).join('')}
      </div></details>`;
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
    ensureEpisodes(RP());
    renderProjectSelect();
    const p = P();
    const secs = sections();
    if (!secs.some(x => x.tabs.some(t => t.id === tab))) tab = secs[0].tabs[0].id;
    const cur = secs.find(x => x.name === curSec && x.tabs.some(t => t.id === tab)) || secs.find(x => x.tabs.some(t => t.id === tab)) || secs[0];
    curSec = cur.name;
    const fases = navMode() === 'fases';
    $('#tabs').innerHTML = p ? `<div class="tabs-sections">${secs.map((x, i) => `<button data-section="${esc(x.name)}" ${fases ? `data-pi="${x.pi}"` : ''} class="${x === cur ? 'active' : ''}">${fases ? `<span class="phase-n">${i + 1}</span>` : ''}${esc(x.name)}</button>`).join('')}
        <span class="nav-switch">${fases ? '<button class="nav-org" data-action="lay-open" title="Mover pestañas entre fases y grupos">⚙ Organizar</button>' : ''}<span>Vista:</span><button data-action="nav-mode" data-v="fases" class="${fases ? 'on' : ''}">Por fases</button><button data-action="nav-mode" data-v="clasica" class="${fases ? '' : 'on'}">Clásica</button></span></div>
      <div class="tabs-sub ${fases ? 'tabs-sub-groups' : ''}">${navSub(cur, fases)}</div>` : '';
    $('#tabs').hidden = !p;
    if (!p) { $('#main').innerHTML = welcomeHTML(); return; }
    renderTab();
    if (window.Theme) Theme.deco();
  }

  function sections() {
    if (navMode() === 'fases') {
      return getPhases().map((ph, pi) => ({ name: ph.name, pi, tabs: ph.groups.flatMap(([g, ids], gi) => ids.map((id, ti) => ({ id, label: labelOf(id), group: ti === 0 ? g : '', pi, gi, ti }))) })).filter(x => x.tabs.length);
    }
    const out = [];
    TABS.forEach(t => { if (t.group) out.push({ name: t.group, tabs: [] }); else out[out.length - 1].tabs.push(t); });
    return out;
  }
  let curSec = null;
  // Fila de pestañas: en la vista por fases, cada grupo en su caja con el título encima (no interactivo)
  function navSub(cur, fases) {
    const btn = t => `<button data-tab="${t.id}" class="${t.id === tab ? 'active' : ''}" ${fases ? `draggable="true" data-pi="${t.pi}" data-gi="${t.gi}" data-ti="${t.ti}" title="Arrastra para mover la pestaña"` : ''}>${t.label}</button>`;
    if (!fases) return cur.tabs.map(btn).join('');
    const groups = [];
    cur.tabs.forEach(t => { if (!groups.length || t.group) groups.push({ label: t.group || '', tabs: [] }); groups[groups.length - 1].tabs.push(t); });
    return groups.map(g => `<div class="tab-grp${g.tabs.some(t => t.id === tab) ? ' has-active' : ''}"><span class="tab-grp-title">${esc(g.label)}</span><div class="tab-grp-row">${g.tabs.map(btn).join('')}</div></div>`).join('');
  }
  const lastTabOf = {};
  // Al entrar en el Step line desde Guion se ve en orden de guion; «Step line del montaje», en orden de montaje
  function prepTab() { if (tab === 'steplinem') steplineOrder = 'montaje'; else if (tab === 'stepline' && navMode() === 'fases') steplineOrder = 'guion'; }

  function renderTab() {
    const p = P();
    const fn = {
      proyecto: tabProyecto, ia: p => window.AIEditor.tab(p), analisis: tabAnalisis, tramas: tabTramas, desglose: tabDesglose, escaleta: tabEscaleta,
      montaje: tabMontaje, arcos: tabArcos, stepline: tabStepline, steplinem: tabStepline, rodaje: tabRodaje, mapa: p => window.MapaTramas.tab(p), doctor: p => window.ScriptDoctor.tab(p), departamentos: tabDepartamentos, necesidad: tabNecesidad, sonido: p => window.SoundList.tab(p), workflow: tabWorkflow
    }[tab] || tabProyecto;
    const y = window.scrollY;
    $('#main').innerHTML = fn(p);
    window.scrollTo(0, y);
    if (tab === 'stepline' || tab === 'steplinem') attachSteplineDrag();
    if (tab === 'montaje') attachCardDrag();
    autoGrow();
  }

  const projName = pr => (pr && (pr.name || pr.title)) || 'Proyecto sin título';
  function renderProjectSelect() {
    const sel = $('#projectSelect');
    const ids = Object.keys(state.projects);
    sel.innerHTML = ids.length ? ids.map(id => `<option value="${id}" ${id === state.currentId ? 'selected' : ''}>${esc(projName(state.projects[id]))}${!state.projects[id].name && state.projects[id].version ? ' · ' + esc(state.projects[id].version) : ''}</option>`).join('') : '<option>— sin proyectos —</option>';
    sel.disabled = !ids.length;
    const es = $('#epSelect'); const rp = RP();
    if (es) {
      const show = rp && isSerie(rp) && epList(rp).length;
      es.hidden = !show;
      if (show) { const cur = curEp(rp); es.innerHTML = `<option value="all" ${cur === 'all' ? 'selected' : ''}>Temporada completa (${epList(rp).length} episodios)</option>` + epList(rp).map(e => `<option value="${e.id}" ${cur === e.id ? 'selected' : ''}>${esc(epLabelFull(e))}</option>`).join(''); }
    }
  }

  function welcomeHTML() {
    return `<div class="welcome">
      <h1>Desglose de guion para montaje</h1>
      <p>Sube el guion del proyecto y la app detectará secuencias, localizaciones, día/noche, personajes, páginas (en octavos) y posibles necesidades de postproducción. A partir de ahí podrás preparar todos los documentos de preproducción de montaje.</p>
      <div class="dropzone" id="dropzone">
        <div class="big">📄</div>
        <div><b>Arrastra aquí el guion</b> o</div>
        <label class="btn btn-primary">⬆ Subir guion<input type="file" class="file-trigger" multiple hidden></label>
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
      <p class="lead">Datos que aparecerán en la cabecera del step line y de los documentos. ${p.source ? `Guion cargado: <b>${esc(p.source.filename)}</b>. Para cargar una versión nueva del guion usa <b>Subir guion</b>: se conservarán tus anotaciones en las secuencias con el mismo número.` : 'Todavía no hay guion cargado: usa <b>Subir guion</b>.'}</p>
      <div class="form-grid">
        ${field('Nombre del proyecto (en tu lista)', inp('p:name', `data-rerender-select="1" placeholder="${esc(p.title || '')}"`), '', 'Solo para identificarlo en tu lista. Si lo dejas vacío se usa el título.')}
        ${field('Título de la obra', inp('p:title', 'data-rerender-select="1"'))}
        ${p.source && !isSerie(p) ? field('Nombre del guion', inp('p:source.filename'), '', `Archivo original importado el ${new Date(p.source.importedAt).toLocaleDateString('es-ES')} (${esc(p.source.format || '')}).`) : ''}
        ${field('Versión del guion', inp('p:version', 'placeholder="p. ej. 3ª versión"'))}
        ${field('Fecha del guion', inp('p:fecha', 'placeholder="p. ej. 12 de octubre de 2026"'))}
        ${field('Formato', `<select data-k="p:formato">${['Largometraje', 'Cortometraje', 'Serie', 'TV movie', 'Documental', 'Otro'].map(o => `<option ${p.formato === o || (o === 'Serie' && isSerie(p)) ? 'selected' : ''}>${o}</option>`).join('')}</select>`, '', isSerie(p) ? 'Serie: puedes subir varios guiones (episodios) en este proyecto.' : '')}
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
    ${isSerie(RP()) ? episodesHTML(RP()) : ''}
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

  function episodesHTML(rp) {
    const eps = epList(rp); const cur = curEp(rp);
    return `<section class="panel">
      <h2>Episodios</h2>
      <p class="lead no-print">Proyecto de serie: cada guion es un episodio. Elige arriba (junto al proyecto) si trabajas en un episodio o en la temporada completa. Al subir un guion te preguntará si es un episodio nuevo o una versión nueva de uno existente; puedes subir varios a la vez.</p>
      <div class="toolbar no-print"><label class="btn btn-small btn-primary">⬆ Subir episodios (uno o varios)<input type="file" class="file-trigger" multiple hidden></label></div>
      ${eps.length ? `<div class="table-wrap"><table>
        <thead><tr><th class="num">#</th><th>Episodio</th><th>Título</th><th>Nombre del guion</th><th class="num">Sec.</th><th class="num">Págs.</th><th>Versión / fecha</th><th class="no-print"></th></tr></thead>
        <tbody>${eps.map((e, i) => `<tr class="${cur === e.id ? 'ep-current' : ''}">
          <td class="num">${i + 1}</td>
          <td><input class="cell-input" data-k="p:episodes.${i}.label" data-rerender-select="1" value="${esc(e.label || '')}" style="min-width:80px;max-width:110px"></td>
          <td><input class="cell-input" data-k="p:episodes.${i}.title" data-rerender-select="1" value="${esc(e.title || '')}" placeholder="Título del episodio"></td>
          <td><input class="cell-input" data-k="p:episodes.${i}.filename" value="${esc(e.filename || '')}" placeholder="Nombre del guion" style="font-size:12px"></td>
          <td class="num">${rp.scenes.filter(x => x.ep === e.id).length}</td>
          <td class="num">${e.pages || '—'}</td>
          <td style="font-size:12px">${esc([e.version, e.fecha].filter(Boolean).join(' · ') || '—')}</td>
          <td class="no-print" style="white-space:nowrap"><button class="btn btn-small" data-action="ep-view" data-id="${e.id}">Ver</button><button class="btn btn-small btn-ghost" data-action="ep-move" data-i="${i}" data-d="-1" ${i ? '' : 'disabled'}>↑</button><button class="btn btn-small btn-ghost" data-action="ep-move" data-i="${i}" data-d="1" ${i < eps.length - 1 ? '' : 'disabled'}>↓</button><button class="btn btn-small btn-ghost" data-action="ep-del" data-id="${e.id}" title="Eliminar episodio">✕</button></td>
        </tr>`).join('')}</tbody></table></div>` : '<p class="muted">Todavía no hay episodios: sube el primer guion.</p>'}
    </section>`;
  }

  /* ------------------------------------------------------------------ */
  /* Pestaña: Lectura / análisis de guion                                  */
  /* ------------------------------------------------------------------ */
  /* ---------- PDF vertical esquemático de la Lectura de guion ---------- */
  function bulletsHTML(txt) {
    const t = String(txt || '').trim();
    if (!t) return '<p class="sch-empty">— pendiente —</p>';
    const lines = t.split(/\n+/).map(x => x.trim()).filter(Boolean);
    if (lines.length === 1 && !/^[-•·*]/.test(lines[0])) return `<p>${esc(lines[0])}</p>`;
    return `<ul>${lines.map(l => `<li>${esc(l.replace(/^[-•·*]\s*/, ''))}</li>`).join('')}</ul>`;
  }
  function schemaLecturaHTML(p) {
    const an = p.analysis || {}; const mpp = minutesPerPage(p);
    const st = characterStats(p);
    const chars = Object.keys(p.characters).filter(c => !p.characters[c].hidden && st[c]).sort((a, b) => st[b].count - st[a].count).slice(0, 8);
    const maxC = Math.max(1, ...chars.map(c => st[c].count));
    const tr = p.tramas.map(t => ({ t, n: p.scenes.filter(s => s.tramaId === t.id).length })).filter(x => x.n);
    const maxT = Math.max(1, ...tr.map(x => x.n));
    const dur = Number(p.durationMin) || sumPages(p);
    // estructura: actos y puntos de giro
    const total = p.scenes.reduce((a, s) => a + (s.lengthPages || 0), 0) || 1;
    const idx = new Map(p.scenes.map((s, i) => [s.id, i]));
    const acts = (p.acts || []).map(a => ({ name: a.name, i: idx.get(a.start) })).filter(a => a.i != null).sort((a, b) => a.i - b.i);
    const pos = i => p.scenes.slice(0, i).reduce((a, s) => a + (s.lengthPages || 0), 0) / total * 100;
    const ACT_COL = ['#c9d3e3', '#a9c6e8', '#f2c9a0', '#e8a9a9', '#a9ddb9'];
    const giros = p.scenes.filter(s => s.keyEvent);
    const card = (icon, title, k) => `<div class="sch-card"><h4><span>${icon}</span>${esc(title)}</h4>${bulletsHTML(an[k])}</div>`;
    const credits = [p.credits.guion && 'Guion: ' + p.credits.guion, p.credits.direccion && 'Dirección: ' + p.credits.direccion, p.credits.montaje && 'Montaje: ' + p.credits.montaje].filter(Boolean).join(' · ');
    return `<div class="sch">
      <div class="sch-head">
        <div><div class="sch-kicker">LECTURA DE GUION · DOCUMENTO DE TRABAJO</div><h1>${esc((p.title || 'Sin título').toUpperCase())}</h1>
          <div class="sch-sub">${esc([p.episodio, p.genero, p.formato, p.version, p.fecha].filter(Boolean).join(' · '))}</div>${credits ? `<div class="sch-sub">${esc(credits)}</div>` : ''}</div>
        <div class="sch-stats">${[[p.scenes.length, 'secuencias'], [p.pages || '—', 'páginas'], [fmtMin(dur), p.durationMin ? 'duración' : 'dur. estimada'], [chars.length ? Object.keys(st).length : 0, 'personajes'], [tr.length, 'tramas']].map(([v, l]) => `<div><b>${esc(v)}</b><span>${l}</span></div>`).join('')}</div>
      </div>
      ${p.logline ? `<div class="sch-logline">«${esc(p.logline)}»</div>` : ''}
      <div class="sch-row">
        <div class="sch-mini"><h4>🧵 Tramas</h4>${tr.length ? tr.map(x => `<div class="sch-bar"><span class="sch-tag" style="background:${x.t.color}">${esc(x.t.letter)}</span><span class="sch-bl">${esc(x.t.name)}</span><i style="width:${x.n / maxT * 100}%;background:${x.t.color}"></i><b>${x.n}</b></div>`).join('') : '<p class="sch-empty">Sin tramas asignadas</p>'}</div>
        <div class="sch-mini"><h4>👥 Personajes principales</h4>${chars.length ? chars.map(c => { const t = tramaById(p, p.characters[c].tramaId); return `<div class="sch-bar"><span class="sch-bl"><b>${esc(c)}</b></span><i style="width:${st[c].count / maxC * 100}%;background:${t ? t.color : '#bbb'}"></i><b>${st[c].count}</b></div>`; }).join('') : '<p class="sch-empty">—</p>'}</div>
      </div>
      ${acts.length ? `<div class="sch-row sch-struct"><h4>🎬 Estructura</h4><div class="sch-acts">${acts.map((a, j) => { const x0 = pos(a.i), x1 = j + 1 < acts.length ? pos(acts[j + 1].i) : 100; return `<div style="left:${x0}%;width:${x1 - x0}%;background:${ACT_COL[j % ACT_COL.length]}"><span>${esc(a.name)}</span><small>${Math.round((x1 - x0) / 100 * dur)}′</small></div>`; }).join('')}</div>
        <div class="sch-giros">${giros.map(s => `<div style="left:${pos(idx.get(s.id)) + (s.lengthPages || 0) / total * 50}%"><i></i><span>${esc((s.eventLabel || 'Giro').toUpperCase().slice(0, 22))}<br><small>esc. ${esc(s.num)}</small></span></div>`).join('')}</div></div>` : ''}
      <div class="sch-block b1"><div class="sch-block-h">1ª LECTURA · Historia, género, tono y personajes</div><div class="sch-grid">
        ${card('📖', 'Historia', 'historia')}${card('🎭', 'Género y tono', 'generoTono')}${card('👤', 'Personajes', 'personajes')}</div></div>
      <div class="sch-block b2"><div class="sch-block-h">2ª LECTURA · Temas y mapa de personajes</div><div class="sch-grid">
        ${card('💡', 'Temas', 'temas')}${card('🗺', 'Mapa de personajes', 'mapa')}${card('🧱', 'Estructura: actos, eventos y giros', 'estructura')}${card('⭐', 'Puntos de interés', 'interes')}</div></div>
      <div class="sch-block b3"><div class="sch-block-h">ANÁLISIS AVANZADO · Necesidades de montaje</div><div class="sch-grid">
        ${card('✂️', 'Posibles secuencias sobrantes', 'sobrantes')}${card('⚠️', 'Problemas generales o estructurales', 'problemas')}${card('🎚', 'Necesidades específicas de montaje', 'necesidades')}${card('❓', 'Preguntas para dirección', 'preguntas')}</div></div>
      <div class="sch-foot">Desglose de montaje · del guion a la pantalla</div>
    </div>`;
  }

  function tabAnalisis(p) {
    const A = (k, label, help) => field(label, area('p:analysis.' + k, 'rows="4"'), 'wide', help);
    return `<section class="panel">
      ${printHeader(p, 'Lectura de guion')}
      <h2>El guion como punto de partida</h2>
      <p class="lead">Notas para la reunión con dirección y la lectura de guion. Se imprimen como documento de trabajo.</p>
      <div class="toolbar no-print"><button class="btn btn-small btn-primary" data-action="print-schema">📄 PDF vertical · esquema visual</button><span class="muted" style="font-size:12px">Documento A4 vertical, esquemático, con tramas, personajes y estructura: para la reunión con dirección o para clase.</span></div>
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
      <p class="lead">Detectados en el guion (por los nombres sobre los diálogos). Asigna su trama principal; oculta los que sean falsos positivos o figuración. </p>
      <div class="note" style="margin-bottom:12px"><b>Nombres repetidos.</b> Al subir el guion, la app une automáticamente los nombres que son el mismo personaje (con o sin cargo —«TENIENTE ROJAS» / «ROJAS»—, distinta tilde o erratas como «SUSNA» / «SUSANA») en el nombre que <b>más aparece</b>. Abajo verás lo que ha unido y puedes deshacerlo. Si queda alguno sin unir (por ejemplo «MADRE» y «EMILIA»), en la última columna elige el nombre bueno y pulsa <b>Unir</b>.</div>
      ${(p.mergeLog || []).length ? `<div class="merge-log"><b>Nombres unificados (${p.mergeLog.length}):</b>${p.mergeLog.map((m, i) => `<div class="merge-item"><span><b>${esc(m.from)}</b> → <b>${esc(m.into)}</b> <span class="muted">· ${esc(m.reason)} · ${m.scenes.length} sec.</span></span><button class="btn btn-small" data-action="undo-merge" data-i="${i}">Deshacer</button></div>`).join('')}</div>` : ''}
      <div class="toolbar">
        <button class="btn btn-small" data-action="auto-char-tramas">Asignar trama a personajes según sus secuencias</button>
        <button class="btn btn-small" data-action="auto-scene-tramas">Asignar trama a secuencias sin trama según sus personajes</button>
        <span class="spacer"></span>
        <button class="btn btn-small" data-action="detect-dups">Buscar nombres repetidos</button>
        <button class="btn btn-small" data-action="add-character">+ Añadir personaje</button>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>Personaje</th><th class="num">Secuencias</th><th class="num">Primera / última</th><th>Trama</th><th class="num">Mostrar</th><th title="Une este nombre con otro si son el mismo personaje">Es el mismo personaje que…</th><th></th></tr></thead>
        <tbody>${names.map(n => {
          const c = p.characters[n], s = st[n];
          return `<tr class="${c.hidden ? 'strike' : ''}">
            <td><b>${esc(n)}</b></td>
            <td class="num">${s ? s.count : 0}</td>
            <td class="num">${s ? esc(s.first.num) + ' → ' + esc(s.last.num) : '—'}</td>
            <td>${tramaSelect('c:' + n + ':tramaId')}</td>
            <td class="num"><input type="checkbox" data-k="c:${esc(n)}:hidden" data-invert="1" data-rerender="1" ${c.hidden ? '' : 'checked'}></td>
            <td><select class="cell-input merge-sel" id="merge-${esc(n.replace(/[^A-Za-z0-9]/g, '_'))}"><option value="">—</option>${names.filter(m => m !== n).map(m => `<option value="${esc(m)}">${esc(m)} (${st[m] ? st[m].count : 0})</option>`).join('')}</select></td>
            <td><button class="btn btn-small" data-action="merge-char-btn" data-name="${esc(n)}">Unir</button></td>
          </tr>`;
        }).join('')}</tbody></table></div>
    </section>`;
  }

  /* ------------------------------------------------------------------ */
  /* Pestaña: Desglose de montaje                                         */
  /* ------------------------------------------------------------------ */
  const DESGLOSE_COLS = (p, mpp) => [
    { k: 'num', label: 'Nº', cls: 'num', td: s => `<td class="num"><b>${esc(dnum(s))}</b></td>` },
    { k: 'head', label: 'Encabezado', td: s => `<td class="scene-head" style="min-width:200px">${esc(sceneHeading(s))}</td>` },
    { k: 'page', label: 'Pág.', cls: 'num', td: s => `<td class="num">${s.page}</td>` },
    { k: 'eighths', label: 'Octavos', cls: 'num', td: s => `<td class="num">${fmtEighths(s.eighths)}</td>` },
    { k: 'dur', label: 'Dur. est.', cls: 'num', td: s => `<td class="num">${fmtMin(s.lengthPages * mpp)}</td>` },
    { k: 'estado', label: 'Estado', td: s => `<td>${estadoSelect(s)}</td>` },
    { k: 'trama', label: 'Trama', td: s => `<td>${tramaSelect('s:' + s.id + ':tramaId')}</td>` },
    { k: 'chars', label: 'Personajes', td: s => `<td><input class="cell-input" data-k="s:${s.id}:characters" data-list="1" value="${esc(s.characters.join(', '))}" style="min-width:150px"></td>` },
    { k: 'summary', label: 'Acción / resumen', td: s => `<td>${area('s:' + s.id + ':summary', 'class="cell-input" data-edited="summaryEdited"')}</td>` },
    { k: 'conflict', label: 'Conflicto / objetivo', td: s => `<td>${area('s:' + s.id + ':conflict', 'class="cell-input" placeholder="¿Qué cambia? ¿Qué quiere cada personaje?"')}</td>` },
    { k: 'needs', label: 'Necesidades', td: s => `<td>${needsDropdown(s)}</td>` },
    { k: 'script', label: 'Script', td: s => `<td>${window.Attach ? Attach.cell(s) : ''}</td>` },
    { k: 'notes', label: 'Notas de montaje', td: s => `<td>${area('s:' + s.id + ':notes.montaje', 'class="cell-input" style="min-width:180px"')}</td>` }
  ];
  const ESCALETA_COLS = p => [
    { k: 'num', label: 'Nº', cls: 'num', td: s => `<td class="num">${esc(dnum(s))}</td>` },
    { k: 'ie', label: 'INT/EXT', td: s => `<td>${esc(s.intExt)}</td>` },
    { k: 'loc', label: 'Localización', td: s => `<td>${esc(s.location)}</td>` },
    { k: 'time', label: 'Día/Noche', td: s => `<td>${esc(s.time)}</td>` },
    { k: 'trama', label: 'Trama', td: s => { const t = tramaOf(p, s); return `<td>${t ? esc(t.name.toUpperCase()) : ''}</td>`; } },
    { k: 'chars', label: 'Personajes', td: s => `<td>${esc(s.characters.filter(c => !(p.characters[c] || {}).hidden).join(', '))}</td>` },
    { k: 'summary', label: 'Resumen', td: s => `<td>${esc(s.summary)}</td>` },
    { k: 'conflict', label: 'Conflicto / objetivo', hidden: true, td: s => `<td>${esc(s.conflict || '')}</td>` },
    { k: 'needs', label: 'Necesidades', td: s => `<td class="esc-needs">${needsDropdown(s)}</td>` },
    { k: 'dur', label: 'Dur. est.', cls: 'num', hidden: true, td: s => `<td class="num">${fmtMin(s.lengthPages * minutesPerPage(p))}</td>` },
    { k: 'estado', label: 'Estado', td: s => `<td>${estadoBadge(s)}</td>` }
  ];

  /* ---------- Columnas: orden y visibilidad por tabla (se guardan en el proyecto) ---------- */
  function colsFor(p, table, cols, all) {
    const order = ((p.colOrder || {})[table]) || [];
    const hid = (p.colHidden || {})[table];
    const hidden = new Set(hid || cols.filter(c => c.hidden).map(c => c.k));
    const by = Object.fromEntries(cols.map(c => [c.k, c]));
    const keys = order.filter(k => by[k]).concat(cols.map(c => c.k).filter(k => !order.includes(k)));
    const list = keys.map(k => Object.assign({}, by[k], { off: hidden.has(k) }));
    return all ? list : list.filter(c => !c.off);
  }
  const colTh = (table, c) => `<th class="${c.cls || ''} col-drag" draggable="true" data-col="${c.k}" data-table="${table}" title="Arrastra para mover la columna">${esc(c.label)}</th>`;
  const colsButton = table => `<button class="btn btn-small" data-action="cols-panel" data-t="${table}">⇄ Columnas</button>`;
  const COL_SETS = { desglose: p => DESGLOSE_COLS(p, minutesPerPage(p)), escaleta: p => ESCALETA_COLS(p) };
  function setColState(p, table, list) {
    p.colOrder = p.colOrder || {}; p.colHidden = p.colHidden || {};
    p.colOrder[table] = list.map(c => c.k); p.colHidden[table] = list.filter(c => c.off).map(c => c.k);
    save(); renderTab();
  }
  function colsPanel(table) {
    const p = P(); const list = colsFor(p, table, COL_SETS[table](p), true);
    showModal(`<h3>Columnas · ${table === 'desglose' ? 'Desglose de montaje' : 'Escaleta de script'}</h3>
      <p>Ordena las columnas como te convenga en cada fase y oculta las que no necesites. También puedes arrastrar las cabeceras de la tabla.</p>
      <div class="cols-list">${list.map((c, i) => `<div class="cols-item ${c.off ? 'off' : ''}">
        <label><input type="checkbox" data-action-change="col-toggle" data-t="${table}" data-c="${c.k}" ${c.off ? '' : 'checked'}> ${esc(c.label)}</label>
        <span><button class="btn btn-small" data-action="col-move" data-t="${table}" data-c="${c.k}" data-d="-1" ${i === 0 ? 'disabled' : ''}>↑</button><button class="btn btn-small" data-action="col-move" data-t="${table}" data-c="${c.k}" data-d="1" ${i === list.length - 1 ? 'disabled' : ''}>↓</button></span>
      </div>`).join('')}</div>
      <div class="actions"><button class="btn" data-action="col-reset" data-t="${table}">Orden original</button><button class="btn btn-primary" data-action="close-modal">Listo</button></div>`);
  }

  function tabDesglose(p) {
    const mpp = minutesPerPage(p);
    const dCols = colsFor(p, 'desglose', DESGLOSE_COLS(p, mpp));
    return `<section class="panel">
      ${printHeader(p, 'Desglose de montaje')}
      <h2>Desglose de montaje</h2>
      <p class="lead">Una fila por secuencia. Las necesidades se han marcado automáticamente por palabras clave del guion: revísalas en su desplegable (muestra solo las marcadas; ábrelo para marcar o desmarcar). Abre ▸ para ver el texto de la secuencia y las notas por departamento.</p>
      <div class="toolbar">
        <button class="btn btn-small" data-action="expand-all">Abrir todas</button>
        <button class="btn btn-small" data-action="collapse-all">Cerrar todas</button>
        ${colsButton('desglose')}
        <span class="spacer"></span>
        ${postLegendHTML()}
        <span class="legend-inline">${p.tramas.map(t => `<span><span class="trama-dot" style="background:${t.color}"></span>${esc(t.letter)} ${esc(t.name)}</span>`).join('')}</span>
      </div>
      <div class="table-wrap"><table class="cols-table">
        <thead><tr><th></th>${dCols.map(c => colTh('desglose', c)).join('')}</tr></thead>
        <tbody>${p.scenes.map(s => {
          const t = tramaOf(p, s);
          const open = expanded.has(s.id);
          return `<tr style="${t ? `box-shadow: inset 5px 0 0 ${t.color}` : ''}">
            <td><button class="btn btn-small btn-ghost" data-action="toggle-row" data-id="${s.id}">${open ? '▾' : '▸'}</button></td>
            ${dCols.map(c => c.td(s)).join('')}
          </tr>
          ${open ? `<tr class="row-detail"><td></td><td colspan="${dCols.length}">
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
  /* Filtro por tramas en las escaletas (de script y de montaje) */
  const escHidden = p => new Set(p.escHidden || []);
  const escVisible = (p, s) => !escHidden(p).has(s.tramaId || '__none');
  function escFilterBar(p, list) {
    const h = escHidden(p);
    const chip = (id, label, color) => `<span class="trama-vis-wrap"><button class="btn btn-small trama-vis ${h.has(id) ? 'off' : ''}" data-action="toggle-esc-vis" data-id="${id}" title="${h.has(id) ? 'Mostrar' : 'Ocultar'} esta trama"><span class="trama-dot" style="background:${color}"></span>${esc(label)}</button><button class="btn btn-small btn-ghost solo-btn" data-action="esc-solo" data-id="${id}" title="Ver solo esta trama">solo</button></span>`;
    const vis = list.filter(s => escVisible(p, s)).length;
    return `<div class="toolbar no-print stepline-filter"><span class="muted">Ver tramas:</span>${p.tramas.map(t => chip(t.id, t.letter + ' · ' + t.name, t.color)).join('')}${chip('__none', 'Sin trama', '#fff')}
      <button class="btn btn-small btn-ghost" data-action="esc-vis-all">Todas</button>
      <span class="spacer"></span><span class="muted">${vis === list.length ? 'Todas las secuencias' : `Mostrando <b>${vis}</b> de ${list.length} secuencias`}</span></div>`;
  }

  function tabEscaleta(p) {
    const eCols = colsFor(p, 'escaleta', ESCALETA_COLS(p));
    return `<section class="panel">
      ${printHeader(p, 'Escaleta coloreada por tramas')}
      <h2>${esc(p.title)} — Escaleta coloreada por tramas</h2>
      <p class="lead no-print">Documento de lectura en el orden del guion. Los datos se editan en el <b>Desglose de montaje</b>. Exporta a .csv para abrirlo en Numbers / Excel / Google Sheets.</p>
      <div class="toolbar no-print"><button class="btn btn-small" data-action="export-csv">Exportar .csv</button><button class="btn btn-small" data-action="print">Descargar PDF</button>${colsButton('escaleta')}</div>
      ${legendHTML(p)}
      ${escFilterBar(p, p.scenes)}
      <div class="table-wrap"><table class="escaleta cols-table">
        <thead><tr>${eCols.map(c => colTh('escaleta', c)).join('')}</tr></thead>
        <tbody>${p.scenes.filter(s => escVisible(p, s)).map(s => {
          const t = tramaOf(p, s);
          return `<tr style="background:${t ? t.color : '#fff'}" class="${s.needs.sobrante ? 'strike' : ''}">${eCols.map(c => c.td(s)).join('')}</tr>`;
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
        ${window.Attach ? Attach.toolbarButton() : ''}
        <span class="spacer"></span>
        ${postLegendHTML()}
        <span class="muted">Duración estimada: <b>${fmtMin(totalActive)}</b> · ${list.filter(s => !isRemoved(p, s)).length} secuencias</span>
        <button class="btn btn-small" data-action="print">Descargar PDF</button>
      </div>
      ${window.Attach ? `<p class="muted no-print" style="font-size:12px;margin:-4px 0 10px">📎 En cada ficha, «＋ Adjuntar» para el guion rayado y el parte de script. ${Attach.note()}</p>` : ''}
      ${escFilterBar(p, list)}
      ${list.some(s => !escVisible(p, s)) ? `<p class="muted no-print" style="font-size:12px;margin:-6px 0 10px">Duración de lo visible: <b>${fmtMin(list.filter(s => escVisible(p, s) && !isRemoved(p, s)).reduce((a, s) => a + s.lengthPages * mpp, 0))}</b>. El TC de cada ficha sigue siendo el del montaje completo.</p>` : ''}
      <div class="cards" id="cards">${list.map((s, i) => {
        const t = tramaOf(p, s);
        const col = t ? textColor(t.color) : '#555';
        const removed = isRemoved(p, s);
        const start = acc; if (!removed) acc += s.lengthPages * mpp;
        if (!escVisible(p, s)) return '';
        return `<div class="card ${removed ? 'removed' : ''}" style="color:${col}" data-id="${s.id}" ${montajeView === 'montaje' ? 'draggable="true"' : ''}>
          ${montajeView === 'montaje' ? '<span class="handle" title="Arrastrar">⋮⋮</span>' : ''}
          <div class="card-tools no-print">
            ${montajeView === 'montaje' ? `<button class="btn btn-small btn-ghost" data-action="move" data-id="${s.id}" data-d="-1" title="Subir">↑</button><button class="btn btn-small btn-ghost" data-action="move" data-id="${s.id}" data-d="1" title="Bajar">↓</button>` : ''}
            <button class="btn btn-small btn-ghost" data-action="toggle-removed" data-id="${s.id}" title="${removed ? 'Recuperar' : 'Quitar del montaje'}">${removed ? '↺' : '⊘'}</button>
          </div>
          <div class="card-title"><span>ESC. ${esc(dnum(s))}</span><span>${esc(sceneHeading(s))}</span><span class="dur">${fmtEighths(s.eighths)} pág · ${fmtMin(s.lengthPages * mpp)}${removed ? '' : ' · TC ≈ ' + fmtMin(start)}</span></div>
          <div class="row"><b><i>Personajes:</i></b><i>${esc(s.characters.filter(c => !(p.characters[c] || {}).hidden).join(', ') || '—')}</i></div>
          <div class="row"><b>Acción:</b><textarea class="edit" rows="1" data-k="s:${s.id}:summary" data-edited="summaryEdited">${esc(s.summary)}</textarea></div>
          <div class="row"><b>Conflicto / objetivo:</b><textarea class="edit" rows="1" data-k="s:${s.id}:conflict" placeholder="…">${esc(s.conflict)}</textarea></div>
          <div class="row needs-row"><b>Necesidades:</b>${needsDropdown(s)}</div>
          ${window.Attach ? Attach.cardRow(s) : ''}
          <div class="tag"><span class="no-print">${estadoSelect(s)}</span><span class="print-only">${estadoBadge(s)}</span> [ ${t ? esc(t.name.toUpperCase()) : 'SIN TRAMA'} ]${s.keyEvent ? ' · ★ ' + esc(s.eventLabel || 'punto de giro') : ''}</div>
        </div>`;
      }).join('')}</div>
    </section>`;
  }

  /* ------------------------------------------------------------------ */
  /* Pestaña: Arco de personajes                                          */
  /* ------------------------------------------------------------------ */
  /* ---------- Arco emocional por actos ---------- */
  const ARC_ACTS = [
    { k: 'plant', label: 'Acto I — Planteamiento', sub: '(incl. prólogo)', short: 'I · Planteamiento' },
    { k: 'des', label: 'Acto II — Desarrollo', sub: '', short: 'II · Desarrollo' },
    { k: 'clim', label: 'Acto III-A — Clímax', sub: '', short: 'III-A · Clímax' },
    { k: 'res', label: 'Acto III-B — Resolución', sub: '', short: 'III-B · Resolución' }
  ];
  const EMO_SCALE = [[5, '+5 plenitud'], [4, '+4'], [3, '+3 esperanza'], [2, '+2'], [1, '+1'], [0, '0 neutro'], [-1, '−1'], [-2, '−2'], [-3, '−3 angustia'], [-4, '−4'], [-5, '−5 hundimiento']];
  const CHAR_COLORS = ['#c0392b', '#2a6fb0', '#d68910', '#1e8449', '#7d3c98', '#17a2b8', '#b03a69', '#6e5b2e', '#34495e', '#e67e22', '#16a085', '#8e44ad'];
  let arcView = 'grid', arcAll = false;
  const arcOf = (p, n) => { const c = p.characters[n]; c.arcoActos = c.arcoActos || {}; return c.arcoActos; };
  const emoVal = (p, n, k) => { const a = (p.characters[n].arcoActos || {})[k]; const v = a && a.v; return v === '' || v == null || isNaN(Number(v)) ? null : Number(v); };

  function emoChart(p, list, opt) {
    const W = opt.w, H = opt.h, L = opt.small ? 30 : 110, R = opt.small ? 14 : 130, T = opt.small ? 26 : 30, B = opt.small ? 30 : 46;
    const pw = W - L - R, ph = H - T - B;
    const X = i => L + (ARC_ACTS.length === 1 ? pw / 2 : i * pw / (ARC_ACTS.length - 1));
    const Y = v => T + (5 - v) / 10 * ph;
    const o = [`<rect width="${W}" height="${H}" fill="#fff"/>`];
    if (opt.title) o.push(`<text x="${L}" y="17" font-size="13" font-weight="800" fill="${opt.titleColor || '#222'}">${esc(opt.title)}</text>`);
    // franjas positivo / negativo
    o.push(`<rect x="${L}" y="${T}" width="${pw}" height="${ph / 2}" fill="#f2f8ef"/><rect x="${L}" y="${T + ph / 2}" width="${pw}" height="${ph / 2}" fill="#fbf0ee"/>`);
    [5, 0, -5].concat(opt.small ? [] : [3, -3]).forEach(v => {
      o.push(`<line x1="${L}" x2="${L + pw}" y1="${Y(v)}" y2="${Y(v)}" stroke="${v === 0 ? '#999' : '#e3e1dc'}" ${v === 0 ? 'stroke-dasharray="4 3"' : ''}/>`);
      const lab = opt.small ? (v > 0 ? '+' + v : String(v)) : (EMO_SCALE.find(e => e[0] === v) || [0, v])[1];
      o.push(`<text x="${L - 6}" y="${Y(v) + 4}" text-anchor="end" font-size="${opt.small ? 9 : 11}" fill="#888">${esc(lab)}</text>`);
    });
    ARC_ACTS.forEach((a, i) => {
      o.push(`<line x1="${X(i)}" x2="${X(i)}" y1="${T}" y2="${T + ph}" stroke="#ece9e4"/>`);
      o.push(`<text x="${X(i)}" y="${H - B + 16}" text-anchor="${i === 0 ? 'start' : i === ARC_ACTS.length - 1 ? 'end' : 'middle'}" font-size="${opt.small ? 9 : 11}" fill="#555" font-weight="600">${esc(opt.small ? a.short.split(' · ')[0] : a.short)}</text>`);
    });
    list.forEach(({ n, color }) => {
      const pts = ARC_ACTS.map((a, i) => ({ i, v: emoVal(p, n, a.k), word: ((p.characters[n].arcoActos || {})[a.k] || {}).e || '' })).filter(x => x.v !== null);
      if (!pts.length) return;
      const d = pts.map((q, j) => (j ? 'L' : 'M') + X(q.i).toFixed(1) + ',' + Y(q.v).toFixed(1)).join(' ');
      o.push(`<path d="${d}" fill="none" stroke="${color}" stroke-width="${opt.small ? 3 : 3}" stroke-linejoin="round" stroke-linecap="round"/>`);
      pts.forEach(q => {
        o.push(`<circle cx="${X(q.i)}" cy="${Y(q.v)}" r="${opt.small ? 4.5 : 5}" fill="#fff" stroke="${color}" stroke-width="2.5"><title>${esc(n)} · ${esc(ARC_ACTS[q.i].label)}: ${q.v > 0 ? '+' : ''}${q.v} ${esc(q.word)}</title></circle>`);
        if (opt.small && q.word) o.push(`<text x="${X(q.i)}" y="${Y(q.v) + (q.v >= 0 ? -9 : 16)}" text-anchor="${q.i === 0 ? 'start' : q.i === ARC_ACTS.length - 1 ? 'end' : 'middle'}" font-size="10" font-style="italic" fill="#333">${esc(q.word.slice(0, 22))}</text>`);
      });
      if (!opt.small) { const last = pts[pts.length - 1]; o.push(`<text x="${X(last.i) + 8}" y="${Y(last.v) + 4}" font-size="11" font-weight="700" fill="${color}">${esc(n)}</text>`); }
    });
    if (!list.some(({ n }) => ARC_ACTS.some(a => emoVal(p, n, a.k) !== null))) o.push(`<text x="${L + pw / 2}" y="${T + ph / 2 + 4}" text-anchor="middle" font-size="12" fill="#aaa">Sin valores todavía</text>`);
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px" font-family="Helvetica, Arial, sans-serif">${o.join('')}</svg>`;
  }

  function arcSection(p, names) {
    const shown = arcAll ? names : names.slice(0, 12);
    const colorOf = (n, i) => { const t = tramaById(p, p.characters[n].tramaId); return arcView === 'grid' && t ? textColor(t.color) : CHAR_COLORS[i % CHAR_COLORS.length]; };
    const valSel = (n, k) => { const v = emoVal(p, n, k); return `<select class="cell-input emo-sel" data-k="c:${esc(n)}:arcoActos.${k}.v" data-rerender="1" title="Estado emocional (−5 a +5)"><option value="">—</option>${EMO_SCALE.map(([x, l]) => `<option value="${x}" ${v === x ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`; };
    return `<section class="panel">
      <h2>Esquema: arco de los personajes por acto</h2>
      <p class="lead no-print">Qué le pasa a cada personaje en cada acto y su <b>estado emocional</b> (de −5 hundimiento a +5 plenitud), que dibuja la gráfica del arco emocional. Es una interpretación para discutir: escribe, corrige o pide una propuesta a Claude.</p>
      <div class="toolbar no-print">
        <button class="btn btn-small btn-primary" data-action="ai-arc">✦ Proponer arcos con Claude</button>
        ${names.length > 12 ? `<button class="btn btn-small" data-action="arc-all">${arcAll ? 'Ver solo los 12 principales' : 'Ver los ' + names.length + ' personajes'}</button>` : ''}
        <span id="aiArcStatus" class="muted"></span>
      </div>
      <div class="table-wrap"><table class="arc-table">
        <thead><tr><th>Personaje</th>${ARC_ACTS.map(a => `<th>${esc(a.label)}${a.sub ? '<br><span style="font-weight:400">' + a.sub + '</span>' : ''}</th>`).join('')}</tr></thead>
        <tbody>${shown.map(n => {
          const t = tramaById(p, p.characters[n].tramaId); arcOf(p, n);
          return `<tr><td class="arc-name" style="border-left:5px solid ${t ? t.color : '#ddd'}"><b>${esc(n)}</b>${t ? `<div class="muted" style="font-size:11px">${esc(t.letter + ' · ' + t.name)}</div>` : ''}</td>
            ${ARC_ACTS.map(a => `<td>${area('c:' + n + ':arcoActos.' + a.k + '.t', 'class="cell-input" style="min-width:200px;min-height:70px" placeholder="Qué le ocurre en este acto"')}
              <div class="emo-row no-print">${inp('c:' + n + ':arcoActos.' + a.k + '.e', 'class="cell-input" placeholder="Emoción (p. ej. ilusión)" style="min-width:0"')}${valSel(n, a.k)}</div>
              <div class="print-only muted">${esc(((p.characters[n].arcoActos || {})[a.k] || {}).e || '')} ${emoVal(p, n, a.k) !== null ? '(' + emoVal(p, n, a.k) + ')' : ''}</div></td>`).join('')}</tr>`;
        }).join('')}</tbody></table></div>
    </section>
    <section class="panel">
      <h2>Arco emocional</h2>
      <div class="toolbar no-print">
        <button class="btn btn-small ${arcView === 'grid' ? 'btn-primary' : ''}" data-action="arc-view" data-v="grid">Por personaje</button>
        <button class="btn btn-small ${arcView === 'all' ? 'btn-primary' : ''}" data-action="arc-view" data-v="all">Todos juntos</button>
        <span class="muted">Eje vertical: estado emocional (−5 hundimiento · +5 plenitud). Eje horizontal: actos.</span>
      </div>
      ${arcView === 'grid'
        ? `<div class="emo-grid">${shown.map((n, i) => `<div class="emo-card">${emoChart(p, [{ n, color: colorOf(n, i) }], { w: 340, h: 190, small: true, title: n, titleColor: colorOf(n, i) })}</div>`).join('')}</div>`
        : `<div class="emo-big">${emoChart(p, shown.map((n, i) => ({ n, color: colorOf(n, i) })), { w: 1100, h: 440, small: false })}</div>
           <div class="legend-inline" style="margin-top:8px">${shown.map((n, i) => `<span><span class="trama-dot" style="background:${colorOf(n, i)}"></span>${esc(n)}</span>`).join('')}</div>`}
    </section>`;
  }

  function characterNamesForArc(p) {
    const st = characterStats(p);
    return Object.keys(p.characters).filter(n => !p.characters[n].hidden && st[n]).sort((a, b) => st[b].count - st[a].count).slice(0, arcAll ? 30 : 12);
  }
  function tabArcos(p) {
    const st = characterStats(p);
    const names = Object.keys(p.characters).filter(n => !p.characters[n].hidden && st[n]).sort((a, b) => st[b].count - st[a].count);
    return `${printHeader(p, 'Arco de personajes')}${arcSection(p, names)}<section class="panel">
      <h2>Presencia y evolución</h2>
      <p class="lead">Presencia de cada personaje por secuencia (color = trama de la secuencia) y evolución dramática: de dónde parte, a dónde llega y qué secuencias marcan el cambio.</p>
      <div class="table-wrap" style="padding:10px"><table class="matrix">
        <thead><tr><th></th>${p.scenes.map(s => `<th class="vert" title="${esc(sceneHeading(s))}">${esc(dnum(s))}</th>`).join('')}</tr></thead>
        <tbody>${names.map(n => `<tr><td class="name">${esc(n)} <span class="muted">(${st[n].count})</span></td>${p.scenes.map(s => {
          if (!s.characters.includes(n)) return '<td></td>';
          const t = tramaOf(p, s);
          return `<td class="on" style="background:${t ? t.color : '#777'}" title="Esc. ${esc(dnum(s))} · ${esc(s.location)}"></td>`;
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
    const hidden = new Set(p.steplineHidden || []);
    const { svg } = StepLine.render(p, scenes, {
      tramaOf: s => tramaOf(p, s), charactersByTrama: () => charactersByTrama(p),
      isHidden: s => hidden.has(s.tramaId || '__none'), isTramaHidden: id => hidden.has(id),
      zoom: slZoom
    });
    const visChip = (id, label, color) => `<span class="trama-vis-wrap"><button class="btn btn-small trama-vis ${hidden.has(id) ? 'off' : ''}" data-action="toggle-trama-vis" data-id="${id}" title="${hidden.has(id) ? 'Mostrar' : 'Ocultar'}"><span class="trama-dot" style="background:${color}"></span>${esc(label)}</button><button class="btn btn-small btn-ghost solo-btn" data-action="trama-vis-solo" data-id="${id}" title="Ver solo esta trama">solo</button></span>`;
    const filterBar = `<div class="toolbar no-print stepline-filter"><span class="muted">Tramas:</span>${p.tramas.map(t => visChip(t.id, t.letter + ' · ' + t.name, t.color)).join('')}${visChip('__none', 'Sin trama', '#fff')}
      <button class="btn btn-small btn-ghost" data-action="trama-vis-all">Mostrar todas</button>
      <span class="spacer"></span>
      <span class="zoom-ctl"><span class="muted">Zoom</span><button class="btn btn-small" data-action="sl-zoom" data-d="-1" ${slZoom <= 1 ? 'disabled' : ''}>−</button><b>${Math.round(slZoom * 100)}%</b><button class="btn btn-small" data-action="sl-zoom" data-d="1" ${slZoom >= 8 ? 'disabled' : ''}>+</button>${slZoom > 1 ? '<button class="btn btn-small btn-ghost" data-action="sl-zoom" data-d="0">Ajustar</button>' : ''}</span>
      <button class="btn btn-small" data-action="reset-globes">Recolocar etiquetas</button></div>
      <p class="muted no-print" style="font-size:12px;margin:-6px 0 10px">Arrastra los <b>puntos</b> arriba/abajo para cambiar la intensidad y los <b>globos</b> para moverlos donde se lean mejor. Toca una trama para ocultarla o mostrarla, o «solo» para ver únicamente esa trama.</p>`;
    const opt = (cur) => `<option value="">— (sin este acto)</option>` + scenes.map(s => `<option value="${s.id}" ${s.id === cur ? 'selected' : ''}>Esc. ${esc(dnum(s))} · ${esc(s.location.slice(0, 40))}</option>`).join('');
    const acts = ACT_NAMES.map(name => p.acts.find(a => a.name === name) || { name, start: '' });
    return `<section class="panel">
      ${printHeader(p, 'Step line')}
      <h2 class="no-print">${tab === 'steplinem' ? 'Step line del montaje · curva según el orden de montaje' : 'Step line · curva de intensidad dramática'}</h2>
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
        <button class="btn btn-small" data-action="print">Descargar PDF</button>
      </div>
      ${filterBar}
      <div class="stepline-wrap ${slZoom > 1 ? 'zoomed' : ''}" id="steplineWrap">${svg}</div>
      ${slZoom > 1 ? '<p class="muted no-print" style="font-size:12px;margin-top:6px">Desliza la gráfica a izquierda y derecha para recorrerla. Con zoom se ven el nombre de cada secuencia y su intensidad.</p>' : ''}
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
          return `<tr><td class="num"><b>${esc(dnum(s))}</b></td><td>${esc(sceneHeading(s))}<div class="muted" style="font-size:12px">${esc(s.summary.slice(0, 120))}</div></td>
          <td>${t ? `<span class="trama-dot" style="background:${t.color}"></span>${esc(t.letter)}` : '—'}</td>
          <td class="num"><input class="cell-input" type="number" min="0" max="10" step="0.5" style="width:70px" data-k="s:${s.id}:intensity" data-num="1" data-rerender="1" data-lazy="1" value="${esc(s.intensity)}"></td>
          <td class="num"><input type="checkbox" data-k="s:${s.id}:keyEvent" data-rerender="1" ${s.keyEvent ? 'checked' : ''}></td>
          <td><input class="cell-input" data-k="s:${s.id}:eventLabel" data-rerender="1" data-lazy="1" value="${esc(s.eventLabel)}" placeholder="p. ej. Incidente desencadenante"></td></tr>`;
        }).join('')}</tbody></table></div>
    </section>`;
  }

  let slZoom = 1, slScroll = 0;
  const ZOOMS = [1, 1.5, 2, 3, 4, 6, 8];
  function attachSteplineDrag() {
    const svg = document.querySelector('#steplineWrap svg');
    if (!svg) return;
    const wrap = document.getElementById('steplineWrap');
    if (slZoom > 1) { wrap.scrollLeft = slScroll * (wrap.scrollWidth - wrap.clientWidth); }
    wrap.addEventListener('scroll', () => { const m = wrap.scrollWidth - wrap.clientWidth; slScroll = m > 0 ? wrap.scrollLeft / m : 0; });
    const p = P();
    const top = +svg.dataset.plotTop, h = +svg.dataset.plotH;
    let drag = null;
    const toSvg = e => { const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; return pt.matrixTransform(svg.getScreenCTM().inverse()); };
    svg.addEventListener('pointerdown', e => {
      const g = e.target.closest('.globe');
      if (g) {
        const s = sceneById(p, g.dataset.id); const start = toSvg(e);
        drag = { globe: g, s, start, dx0: Number(s.globeDx) || 0, dy0: Number(s.globeDy) || 0, stem: svg.querySelector(`.stem[data-id="${g.dataset.id}"]`) };
        g.setPointerCapture(e.pointerId); e.preventDefault(); return;
      }
      const c = e.target.closest('.pt'); if (!c) return;
      drag = { c, s: sceneById(p, c.dataset.id) };
      c.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    svg.addEventListener('pointermove', e => {
      if (!drag) return;
      const loc = toSvg(e);
      if (drag.globe) {
        const dx = Math.round(drag.dx0 + loc.x - drag.start.x), dy = Math.round(drag.dy0 + loc.y - drag.start.y);
        drag.dx = dx; drag.dy = dy;
        drag.globe.setAttribute('transform', `translate(${dx} ${dy})`);
        if (drag.stem) { drag.stem.setAttribute('x2', +drag.stem.dataset.bx + dx); drag.stem.setAttribute('y2', +drag.stem.dataset.by + dy); }
        return;
      }
      const v = Math.round(Math.max(0, Math.min(10, (top + h - loc.y) / h * 10)) * 2) / 2;
      drag.s.intensity = v;
      drag.c.setAttribute('cy', top + h - v / 10 * h);
    });
    const end = () => {
      if (!drag) return;
      if (drag.globe && drag.dx != null) { drag.s.globeDx = drag.dx; drag.s.globeDy = drag.dy; }
      drag = null; save(); renderTab();
    };
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
  let deptView = 'tabla';   // 'tabla' (todos a la vez) | 'bloques' (todos, uno tras otro) | clave de departamento
  function needChipsFor(s, d) {
    return NEEDS.filter(n => n.dept === d && s.needs[n.k]).map(n => `<button class="chip on need-nav lbl-${n.lbl || DEPT_LABEL[d]}" data-action="go-need" data-k="${n.k}">${esc(n.label)}</button>`).join('');
  }
  function deptsAllTable(p, mpp) {
    const ds = Object.keys(DEPTS);
    const rows = p.scenes.filter(s => NEEDS.some(n => s.needs[n.k]) || ds.some(d => s.notes && s.notes[d]));
    return `<div class="form-grid" style="margin-bottom:12px">${ds.map(d => field('Notas generales · ' + DEPTS[d], area('p:deptNotes.' + d, 'rows="2"'))).join('')}</div>
      ${rows.length ? `<div class="table-wrap"><table class="depts-all">
        <thead><tr><th class="num">Nº</th><th>Secuencia</th><th>Estado</th><th class="num">Dur. est.</th>${ds.map(d => `<th class="dept-th dept-th-${d}">${esc(DEPTS[d])}<br><span style="font-weight:400">${p.scenes.filter(s => NEEDS.some(n => n.dept === d && s.needs[n.k])).length} sec.</span></th>`).join('')}</tr></thead>
        <tbody>${rows.map(s => `<tr>
          <td class="num"><b>${esc(dnum(s))}</b></td>
          <td style="min-width:200px"><b>${esc(sceneHeading(s))}</b><div class="muted" style="font-size:12px">${esc(s.summary.slice(0, 140))}</div></td>
          <td>${estadoSelect(s)}</td>
          <td class="num">${fmtMin(s.lengthPages * mpp)}</td>
          ${ds.map(d => `<td class="dept-td-${d}" style="min-width:190px"><div class="needs-cell" style="min-width:0;margin-bottom:4px">${needChipsFor(s, d)}${d === 'sonido' && s.offCharacters && s.offCharacters.length ? `<span class="muted" style="font-size:11px">off: ${esc(s.offCharacters.join(', '))}</span>` : ''}</div>${area('s:' + s.id + ':notes.' + d, 'class="cell-input" style="min-width:170px;min-height:44px" placeholder="Notas"')}</td>`).join('')}
        </tr>`).join('')}</tbody></table></div>` : '<p class="muted">Sin secuencias con necesidades marcadas.</p>'}`;
  }
  function tabDepartamentos(p) {
    const mpp = minutesPerPage(p);
    const views = [['tabla', 'Todos a la vez'], ['bloques', 'Todos, uno tras otro']].concat(Object.keys(DEPTS).map(d => [d, DEPTS[d]]));
    const shown = DEPTS[deptView] ? [deptView] : Object.keys(DEPTS);
    return `<section class="panel">
      ${printHeader(p, 'Necesidades de montaje y postproducción' + (DEPTS[deptView] ? ' · ' + DEPTS[deptView] : ''))}
      <h2>Necesidades por departamento</h2>
      <p class="lead no-print">Documento para la coordinación de postproducción: reúne las secuencias con necesidades marcadas en el desglose y sus notas. Puedes verlo con <b>todos los departamentos a la vez</b> (una tabla con una columna por departamento), todos uno tras otro, o un solo departamento.</p>
      <div class="toolbar no-print">${views.map(([k, l]) => `<button class="btn btn-small ${deptView === k ? 'btn-primary' : ''} ${DEPTS[k] ? 'dept-btn dept-btn-' + k : ''}" data-action="dept-view" data-v="${k}">${esc(l)}</button>`).join('')}<span class="spacer"></span><button class="btn btn-small" data-action="print">Descargar PDF</button></div>
      <div class="toolbar no-print"><span class="muted">Ver detalle de:</span> ${needChipsNav(p, '')}</div>
      ${deptView === 'tabla' ? deptsAllTable(p, mpp) : shown.map(d => {
        const needs = NEEDS.filter(n => n.dept === d);
        const rows = p.scenes.filter(s => needs.some(n => s.needs[n.k]) || (s.notes && s.notes[d]));
        return `<div class="dept dept-${d}">
          <h3>${esc(DEPTS[d])} <span class="muted" style="font-weight:400">· ${rows.length} secuencias</span></h3>
          ${field('Notas generales para ' + DEPTS[d], area('p:deptNotes.' + d, 'rows="2"'), 'wide')}
          ${rows.length ? `<div class="table-wrap" style="margin-top:10px"><table>
            <thead><tr><th class="num">Nº</th><th>Secuencia</th><th class="num">Dur. est.</th><th>Necesidades</th><th>Descripción</th><th>Notas ${esc(DEPTS[d])}</th></tr></thead>
            <tbody>${rows.map(s => `<tr><td class="num"><b>${esc(dnum(s))}</b></td><td>${esc(sceneHeading(s))}</td><td class="num">${fmtMin(s.lengthPages * mpp)}</td>
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
        <button class="btn btn-small" data-action="print">Descargar PDF</button>
      </div>
      ${n.k === 'sfx' ? '<div class="note no-print" style="margin-bottom:12px">Para pedir los archivos al diseñador de sonido (listado único de SFX y ambientes con secuencias, duración y nombre de archivo para importar en el Avid) ve a <button class="btn btn-small" data-action="go-sound">Listado SFX y ambientes →</button></div>' : ''}
      <div id="aiNeedStatus" class="muted" style="margin-bottom:8px"></div>
      ${rows.length ? `<div class="table-wrap"><table>
        <thead><tr><th class="num">Nº</th><th>Secuencia</th><th>Estado</th><th class="num">Dur. est.</th>${fields.map(f => `<th>${esc(f[1])}</th>`).join('')}<th>Notas ${esc(DEPTS[n.dept])}</th></tr></thead>
        <tbody>${rows.map(s => `<tr>
          <td class="num"><b>${esc(dnum(s))}</b></td>
          <td style="min-width:200px"><b>${esc(sceneHeading(s))}</b><div class="muted" style="font-size:12px">${esc(s.summary.slice(0, 160))}</div></td>
          <td>${estadoSelect(s)}</td>
          <td class="num">${fmtMin(s.lengthPages * mpp)}</td>
          ${fields.map(f => `<td>${area('s:' + s.id + ':needDetail.' + n.k + '.' + f[0], 'class="cell-input" style="min-width:260px;min-height:80px"')}</td>`).join('')}
          <td>${area('s:' + s.id + ':notes.' + n.dept, 'class="cell-input" style="min-width:180px"')}</td>
        </tr>`).join('')}</tbody></table></div>` : '<p class="muted">Ninguna secuencia tiene marcada esta necesidad. Márcala en el Desglose de montaje.</p>'}
    </section>`;
  }

  /* ---------- Panel «Organizar pestañas» (vista por fases) ---------- */
  function layoutPanel() {
    const ph = getPhases();
    const dest = ph.flatMap((x, pi) => x.groups.map((g, gi) => [`${pi}|${gi}`, `${x.name} › ${g[0]}`]));
    const placed = new Set(ph.flatMap(x => x.groups.flatMap(g => g[1])));
    const unplaced = ALL_TAB_IDS().filter(id => !placed.has(id));
    showModal(`<h3>Organizar pestañas</h3>
      <p>Mueve cada pestaña al grupo y la fase que te convenga, cámbiala de orden o añádela en más de un sitio. También puedes arrastrar las pestañas en la barra (con ratón).</p>
      <div class="lay-wrap">${ph.map((x, pi) => `<div class="lay-phase">
        <div class="lay-phase-h"><span class="phase-n">${pi + 1}</span><input class="cell-input" value="${esc(x.name)}" data-action-change="lay-rename-phase" data-p="${pi}"></div>
        ${x.groups.map((g, gi) => `<div class="lay-group">
          <div class="lay-group-h"><input class="cell-input" value="${esc(g[0])}" data-action-change="lay-rename-group" data-p="${pi}" data-g="${gi}">${g[1].length ? '' : `<button class="btn btn-small btn-ghost" data-action="lay-delgroup" data-p="${pi}" data-g="${gi}" title="Quitar grupo vacío">✕</button>`}</div>
          ${g[1].map((id, ti) => `<div class="lay-tab"><span>${esc(labelOf(id))}</span><span class="lay-tools">
            <button class="btn btn-small" data-action="lay-move" data-p="${pi}" data-g="${gi}" data-i="${ti}" data-d="-1" ${ti === 0 ? 'disabled' : ''}>↑</button><button class="btn btn-small" data-action="lay-move" data-p="${pi}" data-g="${gi}" data-i="${ti}" data-d="1" ${ti === g[1].length - 1 ? 'disabled' : ''}>↓</button>
            <select class="cell-input lay-to" data-action-change="lay-to" data-p="${pi}" data-g="${gi}" data-i="${ti}"><option value="">Mover a…</option>${dest.filter(d => d[0] !== `${pi}|${gi}`).map(d => `<option value="${d[0]}">${esc(d[1])}</option>`).join('')}</select>
            <button class="btn btn-small btn-ghost" data-action="lay-del" data-p="${pi}" data-g="${gi}" data-i="${ti}" title="Quitar de aquí">✕</button></span></div>`).join('')}
          <select class="cell-input lay-add" data-action-change="lay-add" data-p="${pi}" data-g="${gi}"><option value="">＋ Añadir pestaña aquí…</option>${ALL_TAB_IDS().filter(id => !g[1].includes(id)).map(id => `<option value="${id}">${esc(labelOf(id))}${placed.has(id) ? '' : ' (sin colocar)'}</option>`).join('')}</select>
        </div>`).join('')}
        <button class="btn btn-small" data-action="lay-addgroup" data-p="${pi}">＋ Grupo</button>
      </div>`).join('')}</div>
      ${unplaced.length ? `<p class="muted" style="font-size:12px">Pestañas sin colocar (no se ven en la vista por fases): ${unplaced.map(id => esc(labelOf(id))).join(', ')}.</p>` : ''}
      <div class="actions"><button class="btn" data-action="lay-reset">Volver a la propuesta original</button><button class="btn btn-primary" data-action="close-modal">Listo</button></div>`);
    document.getElementById('modalBody').classList.add('modal-wide');
  }
  function editLayout(fn) { const ph = getPhases(); fn(ph); setPhases(ph); render(); layoutPanel(); }

  /* ---------- Panel «Mis proyectos»: renombrar, abrir, borrar ---------- */
  function projectsPanel() {
    const ids = Object.keys(state.projects);
    showModal(`<h3>Mis proyectos</h3><p>Cambia el nombre con el que aparece cada proyecto en tu lista (el título de la obra no cambia), ábrelo o bórralo.</p>
      <div class="cols-list">${ids.map(id => { const pr = state.projects[id]; const eps = epList(pr).length; return `<div class="cols-item proj-item ${id === state.currentId ? 'proj-cur' : ''}">
        <div style="flex:1;min-width:0"><input class="cell-input" value="${esc(projName(pr))}" data-action-change="proj-rename" data-id="${id}" style="font-weight:700">
        <div class="muted" style="font-size:11px;margin-top:3px">${esc(pr.title || '')}${pr.version ? ' · ' + esc(pr.version) : ''} · ${esc(pr.formato || '')}${eps ? ' · ' + eps + ' episodios' : ''} · ${pr.scenes.length} secuencias${id === state.currentId ? ' · <b>abierto</b>' : ''}</div></div>
        <span>${id === state.currentId ? '' : `<button class="btn btn-small" data-action="proj-open" data-id="${id}">Abrir</button>`}<button class="btn btn-small" data-action="proj-dup" data-id="${id}" title="Duplicar">⧉</button><button class="btn btn-small btn-ghost" data-action="proj-del" data-id="${id}" title="Borrar">✕</button></span>
      </div>`; }).join('') || '<p class="muted">No hay proyectos.</p>'}</div>
      <div class="actions"><button class="btn btn-primary" data-action="close-modal">Listo</button></div>`);
  }

  /* ------------------------------------------------------------------ */
  /* Pestaña: Seguimiento de rodaje                                       */
  /* ------------------------------------------------------------------ */
  const RODADA_SET = ['rodada', 'ingesta', 'preparada', 'pendiente', 'montada', 'sono', 'vfx', 'color', 'musica'];
  const isShot = s => getEstados(s).some(e => RODADA_SET.includes(e));
  let rodajeFilter = 'todas';
  function tabRodaje(p) {
    const mpp = minutesPerPage(p);
    const active = p.scenes.filter(s => !getEstados(s).includes('eliminada'));
    const shot = active.filter(isShot);
    const minT = active.reduce((a, s) => a + s.lengthPages * mpp, 0), minS = shot.reduce((a, s) => a + s.lengthPages * mpp, 0);
    const pct = active.length ? Math.round(shot.length / active.length * 100) : 0;
    const docs = s => (s.adjuntos || []).length;
    const F = { todas: ['Todas', () => true], pendientes: ['Sin rodar', s => !isShot(s) && !getEstados(s).includes('eliminada')], rodadas: ['Rodadas', isShot], sindocs: ['Rodadas sin documentos de script', s => isShot(s) && !docs(s)], urgentes: ['Urgentes', s => getEstados(s).includes('urgente')] };
    const estF = rodajeFilter.startsWith('est:') ? rodajeFilter.slice(4) : null;
    if (!estF && !F[rodajeFilter]) rodajeFilter = 'todas';
    const rows = estF ? p.scenes.filter(s => getEstados(s).includes(estF)) : p.scenes.filter(F[rodajeFilter][1]);
    const counts = ESTADOS.filter(e => e.k !== 'sinrodar').map(e => [e, p.scenes.filter(s => getEstados(s).includes(e.k)).length]).filter(x => x[1]);
    return `<section class="panel">
      ${printHeader(p, 'Seguimiento de rodaje')}
      <h2>Seguimiento de rodaje</h2>
      <p class="lead no-print">Control diario del material que llega del rodaje: estado de cada secuencia, documentos de la script (guion rayado y parte) y notas de rodaje. «✓ Rodada» la marca como rodada con la fecha de hoy.</p>
      <div class="rodaje-progress">
        <div class="rp-bar"><i style="width:${pct}%"></i></div>
        <div class="rp-nums"><b>${shot.length}</b> de ${active.length} secuencias rodadas (${pct}%) · <b>${fmtMin(minS)}</b> de ${fmtMin(minT)} estimados · ${p.scenes.filter(s => isShot(s) && docs(s)).length} con documentos de script</div>
      </div>
      ${counts.length ? `<div class="post-legend est-filters" style="margin:8px 0 14px">${counts.map(([e, n]) => `<button class="estado-badge lbl-bg-${e.k} est-filter ${estF === e.k ? 'on' : ''}" data-action="rodaje-filter" data-v="${estF === e.k ? 'todas' : 'est:' + e.k}" title="${estF === e.k ? 'Quitar filtro' : 'Ver solo las secuencias ' + e.label}">${e.label}: ${n}</button>`).join('')}${estF ? `<span class="muted" style="font-size:12px">Mostrando solo <b>${esc(estadoOf(estF).label)}</b> · toca de nuevo para quitar el filtro</span>` : '<span class="muted" style="font-size:12px">Toca una etiqueta para ver solo esas secuencias</span>'}</div>` : ''}
      <div class="toolbar no-print">${Object.keys(F).map(k => `<button class="btn btn-small ${!estF && rodajeFilter === k ? 'btn-primary' : ''}" data-action="rodaje-filter" data-v="${k}">${F[k][0]} (${p.scenes.filter(F[k][1]).length})</button>`).join('')}
        <span class="spacer"></span>${window.Attach ? Attach.toolbarButton() : ''}<button class="btn btn-small" data-action="print">Descargar PDF</button></div>
      <div class="table-wrap"><table>
        <thead><tr><th class="num">Nº</th><th>Secuencia</th><th class="num">Dur. est.</th><th>Estado</th><th></th><th>Fecha de rodaje</th><th>Script (guion rayado / parte)</th><th>Notas de rodaje</th></tr></thead>
        <tbody>${rows.map(s => { const t = tramaOf(p, s); return `<tr style="${t ? `box-shadow: inset 5px 0 0 ${t.color}` : ''}" class="${isShot(s) ? 'row-shot' : ''}">
          <td class="num"><b>${esc(dnum(s))}</b></td>
          <td style="min-width:220px"><b>${esc(sceneHeading(s))}</b><div class="muted" style="font-size:12px">${esc(s.characters.slice(0, 5).join(', '))}</div></td>
          <td class="num">${fmtMin(s.lengthPages * mpp)}</td>
          <td>${estadoSelect(s)}</td>
          <td class="no-print">${isShot(s) ? '<span class="muted">✓</span>' : `<button class="btn btn-small" data-action="rodaje-mark" data-id="${s.id}">✓ Rodada</button>`}</td>
          <td>${inp('s:' + s.id + ':rodaje.fecha', 'type="date" class="cell-input" style="min-width:140px"')}</td>
          <td>${window.Attach ? Attach.cell(s) : ''}</td>
          <td>${area('s:' + s.id + ':rodaje.notas', 'class="cell-input" style="min-width:240px" placeholder="Cambios respecto al guion, tomas buenas, problemas…"')}</td>
        </tr>`; }).join('') || `<tr><td colspan="8" class="muted" style="padding:16px">No hay secuencias en este filtro.</td></tr>`}</tbody></table></div>
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
  async function handleFiles(files) {
    files = Array.from(files || []).filter(Boolean);
    if (!files.length) return;
    if (files.length === 1) return handleFile(files[0]);
    const parsedList = [];
    for (let i = 0; i < files.length; i++) {
      showModal(`<h3><span class="spinner"></span>Leyendo guiones… ${i + 1} de ${files.length}</h3><p>${esc(files[i].name)}</p>`);
      try { parsedList.push(await ScriptParser.parseFile(files[i])); }
      catch (e) { parsedList.push({ error: e.message || String(e), filename: files[i].name }); }
    }
    pendingMulti = parsedList.filter(x => !x.error);
    const bad = parsedList.filter(x => x.error);
    const cur = RP();
    const list = `<ul>${pendingMulti.map((x, i) => `<li><b>${esc(guessEpLabel(x, (cur && isSerie(cur) ? epList(cur).length : 0) + i + 1))}</b> · ${esc(x.filename)} · ${x.scenes.length} secuencias</li>`).join('')}</ul>${bad.length ? `<p style="color:#a3501b">No se han podido leer: ${bad.map(x => esc(x.filename)).join(', ')}</p>` : ''}`;
    if (!pendingMulti.length) { showModal(`<h3>No se ha podido leer ningún guion</h3>${list}<div class="actions"><button class="btn btn-primary" data-action="close-modal">Cerrar</button></div>`); return; }
    showModal(`<h3>${pendingMulti.length} guiones leídos</h3><p>Se importarán como <b>episodios</b> de una serie:</p>${list}
      <div class="actions"><button class="btn" data-action="close-modal">Cancelar</button>
      ${cur && cur.scenes.length ? `<button class="btn" data-action="import-eps">Añadir a «${esc(cur.title)}»${isSerie(cur) ? '' : ' (pasa a ser serie)'}</button>` : ''}
      <button class="btn btn-primary" data-action="import-eps-new">${cur && !cur.scenes.length ? `Importar en «${esc(cur.title)}»` : 'Proyecto de serie nuevo'}</button></div>`);
  }
  let pendingMulti = null;

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
    const cur = RP();
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
    if (isSerie(cur)) {
      const eps = epList(cur); const ce = curEp(cur);
      showModal(`<h3>Guion leído: «${esc(parsed.filename)}»</h3>${summary}
        <p>«${esc(cur.title)}» es una <b>serie</b>. ¿Qué es este guion?</p>
        <div class="field" style="margin:10px 0"><label>Nueva versión de un episodio existente</label>
          <div style="display:flex;gap:6px"><select id="epTarget" class="cell-input">${eps.map(e => `<option value="${e.id}" ${e.id === ce ? 'selected' : ''}>${esc(epLabelFull(e))}</option>`).join('')}</select><button class="btn" data-action="import-ep-version">Nueva versión</button></div>
          <small>Se conservan tramas, notas, intensidad y puntos de giro de las secuencias con el mismo número.</small></div>
        <div class="actions"><button class="btn" data-action="close-modal">Cancelar</button><button class="btn" data-action="import-new">Proyecto nuevo</button><button class="btn btn-primary" data-action="import-ep">Episodio nuevo (${esc(guessEpLabel(parsed, eps.length + 1))})</button></div>`);
      return;
    }
    showModal(`<h3>Guion leído: «${esc(parsed.filename)}»</h3>${summary}
      <p>¿Es una <b>nueva versión</b> de «${esc(cur.title)}» o un <b>proyecto nuevo</b>? En una nueva versión se conservan tramas, notas, intensidad y puntos de giro de las secuencias con el mismo número.</p>
      <div class="actions"><button class="btn" data-action="close-modal">Cancelar</button><button class="btn" data-action="import-ep" title="Convierte «${esc(cur.title)}» en serie y añade este guion como episodio">Es una serie: episodio nuevo</button><button class="btn" data-action="import-version">Nueva versión de «${esc(cur.title)}»</button><button class="btn btn-primary" data-action="import-new">Proyecto nuevo</button></div>`);
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
    const tabLabelTxt = tabLabel(tab);
    const html = '<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>' + esc(p.title + ' — ' + tabLabelTxt) +
      '</title><style>' + css + '\n.no-print,.toolbar,.card-tools,.handle,.btn{display:none!important}.print-header{display:block}main{max-width:none;padding:12px}.panel{border:0}</style></head><body><main>' +
      $('#main').innerHTML + '</main><script>setTimeout(function(){try{window.print()}catch(e){}},400)<\/script></body></html>';
    download(fileBase(p) + '_' + tabLabelTxt.replace(/[^\wÀ-ÿ]+/g, '_') + '.html', html, 'text/html');
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
    'merge-char-btn': (el) => {
      const from = el.dataset.name;
      const sel = el.closest('tr').querySelector('.merge-sel');
      const into = sel && sel.value;
      if (!into) { toast('Elige primero en el desplegable el nombre con el que unir «' + from + '».'); if (sel) sel.focus(); return; }
      mergeChars(P(), from, into, 'unido a mano'); save(); renderTab(); toast(`«${from}» unido a «${into}».`);
    },
    'undo-merge': (el) => { undoMerge(P(), Number(el.dataset.i)); save(); renderTab(); toast('Unión deshecha.'); },
    'detect-dups': () => {
      const d = autoUnify(P()); save(); renderTab();
      toast(d.length ? `${d.length} nombres repetidos unificados. Revisa la lista de arriba.` : 'No se han encontrado nombres repetidos.');
    },
    'cols-panel': (el) => colsPanel(el.dataset.t),
    'col-move': (el) => {
      const p = P(); const t = el.dataset.t; const list = colsFor(p, t, COL_SETS[t](p), true);
      const i = list.findIndex(c => c.k === el.dataset.c), j = i + Number(el.dataset.d);
      if (i < 0 || j < 0 || j >= list.length) return;
      [list[i], list[j]] = [list[j], list[i]]; setColState(p, t, list); colsPanel(t);
    },
    'col-reset': (el) => { const p = P(); const t = el.dataset.t; if (p.colOrder) delete p.colOrder[t]; if (p.colHidden) delete p.colHidden[t]; save(); renderTab(); colsPanel(t); },
    'lay-open': () => layoutPanel(),
    'lay-move': (el) => editLayout(ph => { const arr = ph[+el.dataset.p].groups[+el.dataset.g][1]; const i = +el.dataset.i, j = i + Number(el.dataset.d); if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; }),
    'lay-del': (el) => editLayout(ph => { ph[+el.dataset.p].groups[+el.dataset.g][1].splice(+el.dataset.i, 1); }),
    'lay-addgroup': (el) => editLayout(ph => { ph[+el.dataset.p].groups.push(['Nuevo grupo', []]); }),
    'lay-delgroup': (el) => editLayout(ph => { ph[+el.dataset.p].groups.splice(+el.dataset.g, 1); }),
    'lay-reset': () => { state.ui = state.ui || {}; delete state.ui.phases; save(); render(); layoutPanel(); toast('Organización original restaurada.'); },
    'projects-panel': () => projectsPanel(),
    'proj-open': (el) => { state.currentId = el.dataset.id; expanded.clear(); save(); render(); projectsPanel(); },
    'proj-dup': (el) => {
      const src = state.projects[el.dataset.id]; if (!src) return;
      const cp = JSON.parse(JSON.stringify(src)); cp.id = 'p' + uid(); cp.name = projName(src) + ' (copia)'; cp.updatedAt = Date.now();
      state.projects[cp.id] = cp; Cloud.textsDirty.add(cp.id); Cloud.queue(cp.id); save(); renderProjectSelect(); projectsPanel(); toast('Proyecto duplicado.');
    },
    'proj-del': (el) => {
      const pr = state.projects[el.dataset.id]; if (!pr) return;
      showModal(`<h3>¿Borrar «${esc(projName(pr))}»?</h3><p>Se eliminará de este navegador y de tu cuenta. Si quieres conservarlo, guarda antes una copia .json.</p><div class="actions"><button class="btn" data-action="projects-panel">Cancelar</button><button class="btn btn-primary" data-action="proj-del-ok" data-id="${el.dataset.id}">Borrar</button></div>`);
    },
    'proj-del-ok': (el) => {
      const id = el.dataset.id; Cloud.remove(id); delete state.projects[id];
      if (state.currentId === id) state.currentId = Object.keys(state.projects)[0] || null;
      save(); render(); projectsPanel(); toast('Proyecto borrado.');
    },
    'nav-mode': (el) => { state.ui = state.ui || {}; state.ui.nav = el.dataset.v; curSec = null; save(); render(); toast(el.dataset.v === 'fases' ? 'Vista por fases: Preproducción · Producción/Rodaje · Postproducción.' : 'Vista clásica.'); },
    'rodaje-mark': (el) => { const sc = sceneById(P(), el.dataset.id); const est = getEstados(sc); if (!est.includes('rodada')) est.push('rodada'); sc.estado = 'rodada'; sc.rodaje = sc.rodaje || {}; if (!sc.rodaje.fecha) sc.rodaje.fecha = new Date().toISOString().slice(0, 10); save(); renderTab(); },
    'rodaje-filter': (el) => { rodajeFilter = el.dataset.v; renderTab(); },
    'go-sound': () => { tab = 'sonido'; window.scrollTo(0, 0); render(); },
    'toggle-trama-vis': (el) => {
      const p = P(); const set = new Set(p.steplineHidden || []); const id = el.dataset.id;
      if (set.has(id)) set.delete(id); else set.add(id);
      p.steplineHidden = Array.from(set); save(); renderTab();
    },
    'toggle-esc-vis': (el) => { const p = P(); const h = escHidden(p); const id = el.dataset.id; if (h.has(id)) h.delete(id); else h.add(id); p.escHidden = Array.from(h); save(); renderTab(); },
    'esc-solo': (el) => { const p = P(); p.escHidden = p.tramas.map(t => t.id).concat('__none').filter(id => id !== el.dataset.id); save(); renderTab(); },
    'esc-vis-all': () => { P().escHidden = []; save(); renderTab(); },
    'trama-vis-solo': (el) => { const p = P(); p.steplineHidden = p.tramas.map(t => t.id).concat('__none').filter(id => id !== el.dataset.id); save(); renderTab(); },
    'trama-vis-all': () => { P().steplineHidden = []; save(); renderTab(); },
    'sl-zoom': (el) => {
      const d = Number(el.dataset.d);
      if (!d) { slZoom = 1; slScroll = 0; }
      else { const i = ZOOMS.indexOf(slZoom); slZoom = ZOOMS[Math.max(0, Math.min(ZOOMS.length - 1, (i < 0 ? 0 : i) + d))]; }
      renderTab();
    },
    'reset-globes': () => { P().scenes.forEach(s => { delete s.globeDx; delete s.globeDy; }); save(); renderTab(); },
    'arc-view': (el) => { arcView = el.dataset.v; renderTab(); },
    'arc-all': () => { arcAll = !arcAll; renderTab(); },
    'ai-arc': () => { if (window.AIEditor) window.AIEditor.arcs(characterNamesForArc(P()), ARC_ACTS); },
    'dept-view': (el) => { deptView = el.dataset.v; renderTab(); },
    'go-need': (el) => { needSel = el.dataset.k; tab = 'necesidad'; window.scrollTo(0, 0); render(); },
    'reset-need': (el) => { const k = el.dataset.k; P().scenes.forEach(s => { if (s.needDetail) delete s.needDetail[k]; }); save(); renderTab(); },
    'ai-need': (el) => { if (window.AIEditor) window.AIEditor.detailNeed(el.dataset.k, NEED_FIELDS[el.dataset.k], NEEDS.find(n => n.k === el.dataset.k)); },
    'go-ia': () => { hideModal(); tab = 'ia'; window.scrollTo(0, 0); render(); },
    'import-ep': () => {
      const parsed = pendingParsed; pendingParsed = null; const p = RP();
      if (!isSerie(p)) { p.formato = 'Serie'; ensureEpisodes(p); }
      const e = addEpisode(p, parsed);
      finishImport(`<h3>Episodio añadido: ${esc(epLabelFull(e))}</h3><p>${parsed.scenes.length} secuencias · ${parsed.pages} páginas. Estás viendo este episodio; elige arriba otro episodio o la temporada completa.</p><p class="muted">Puedes cambiar el nombre del episodio en <b>Proyecto → Episodios</b>.</p>`, true);
    },
    'import-ep-version': () => {
      const parsed = pendingParsed; pendingParsed = null; const p = RP();
      const id = ($('#epTarget') || {}).value; const e = epList(p).find(x => x.id === id); if (!e) return;
      const kept = mergeVersion(viewFor(p, id), parsed);
      Object.assign(e, { filename: parsed.filename, pages: parsed.pages, importedAt: new Date().toISOString(), version: (parsed.portada || {}).version || e.version, fecha: (parsed.portada || {}).fecha || e.fecha });
      p.pages = epList(p).reduce((a, x) => a + (Number(x.pages) || 0), 0);
      state.ui = state.ui || {}; state.ui.ep = Object.assign({}, state.ui.ep, { [p.id]: id });
      finishImport(`<h3>Nueva versión de ${esc(epLabelFull(e))}</h3><p>${parsed.scenes.length} secuencias; se han conservado las anotaciones de ${kept}.</p>`);
    },
    'import-eps': () => {
      const list = pendingMulti || []; pendingMulti = null; const p = RP();
      if (!isSerie(p)) { p.formato = 'Serie'; ensureEpisodes(p); }
      list.forEach(x => addEpisode(p, x));
      finishImport(`<h3>${list.length} episodios añadidos a «${esc(p.title)}»</h3><p>Elige arriba el episodio en el que quieres trabajar, o la temporada completa.</p>`, true);
    },
    'import-eps-new': () => {
      const list = pendingMulti || []; pendingMulti = null; if (!list.length) return;
      let p = RP();
      if (!p || p.scenes.length) p = newProject({ title: (list[0].portada || {}).title || list[0].title || 'Serie sin título', formato: 'Serie' });
      else { p.formato = 'Serie'; if (p.title === 'Proyecto sin título' && (list[0].portada || {}).title) p.title = list[0].portada.title; }
      list.forEach(x => addEpisode(p, x));
      applyPortada(p, Object.assign({}, list[0].portada, { version: '', fecha: '', episodio: '' }), true);
      finishImport(`<h3>Serie creada con ${list.length} episodios</h3><p>Elige arriba el episodio en el que quieres trabajar, o la temporada completa.</p>`, true);
    },
    'ep-view': (el) => { state.ui = state.ui || {}; state.ui.ep = Object.assign({}, state.ui.ep, { [state.currentId]: el.dataset.id }); save(); render(); },
    'ep-move': (el) => { const p = RP(); const eps = epList(p); const i = +el.dataset.i, j = i + Number(el.dataset.d); if (j < 0 || j >= eps.length) return; [eps[i], eps[j]] = [eps[j], eps[i]]; regroupByEpisode(p); save(); render(); },
    'ep-del': (el) => { const p = RP(); const e = epList(p).find(x => x.id === el.dataset.id); if (!e) return; showModal(`<h3>¿Eliminar ${esc(epLabelFull(e))}?</h3><p>Se borrarán sus ${p.scenes.filter(x => x.ep === e.id).length} secuencias y todo lo anotado en ellas. Si quieres conservarlo, guarda antes una copia .json.</p><div class="actions"><button class="btn" data-action="close-modal">Cancelar</button><button class="btn btn-primary" data-action="ep-del-ok" data-id="${e.id}">Eliminar</button></div>`); },
    'ep-del-ok': (el) => { deleteEpisode(RP(), el.dataset.id); hideModal(); save(); render(); toast('Episodio eliminado.'); },
    'import-new': () => {
      const parsed = pendingParsed; createFromParsed(parsed); pendingParsed = null;
      const changed = applyPortada(P(), parsed.portada, false);
      if (window.AIEditor) window.AIEditor.portada(P(), parsed, false);
      finishImport('<h3>Proyecto nuevo creado</h3>' + portadaHTML(changed), true);
    },
    'import-version': () => {
      const parsed = pendingParsed; const p = RP(); const kept = mergeVersion(p, parsed); pendingParsed = null;
      const changed = applyPortada(p, parsed.portada, true);
      if (window.AIEditor) window.AIEditor.portada(p, parsed, true);
      finishImport(`<h3>Versión actualizada</h3><p>${p.scenes.length} secuencias; se han conservado las anotaciones de ${kept}.</p>${portadaHTML(changed)}<p class="muted">Comprueba la versión y la fecha en <b>Proyecto</b>.</p>`);
    },
    'new-empty': () => { newProject(); tab = 'proyecto'; save(); render(); },
    'export-json': () => { const p = RP(); if (p) download(fileBase(p) + '.desglose.json', JSON.stringify(p, null, 1), 'application/json'); },
    'export-csv': () => { const p = P(); if (p) exportCSV(p); },
    'print-schema': async () => {
      const p = P(); if (!p || !window.PdfExport) return;
      showModal(`<h3><span class="spinner"></span>Generando PDF vertical…</h3><p id="pdfProg">Preparando el esquema.</p>`);
      try {
        const blob = await PdfExport.exportPDF(`${p.title} — Lectura de guion`, '', (i, n) => { const el = document.getElementById('pdfProg'); if (el) el.textContent = `Página ${i} de ${n}…`; }, { portrait: true, html: schemaLecturaHTML(p) });
        hideModal();
        await download(fileBase(p) + '_Lectura_de_guion_esquema.pdf', blob, 'application/pdf');
      } catch (e) {
        console.error(e);
        showModal(`<h3>No se ha podido generar el PDF</h3><p>${esc(e.message || e)}</p><div class="actions"><button class="btn btn-primary" data-action="close-modal">Cerrar</button></div>`);
      }
    },
    'print': async () => {
      const p = P(); if (!p || !window.PdfExport) return;
      const tabLabelTxt = tabLabel(tab);
      renderTab();
      showModal(`<h3><span class="spinner"></span>Generando PDF…</h3><p id="pdfProg">Preparando «${esc(tabLabelTxt)}».</p>`);
      try {
        const blob = await PdfExport.exportPDF(`${p.title} — ${tabLabelTxt}`, '', (i, n) => { const el = document.getElementById('pdfProg'); if (el) el.textContent = `Página ${i} de ${n}…`; });
        hideModal();
        await download(fileBase(p) + '_' + tabLabelTxt.replace(/[^\wÀ-ÿ]+/g, '_') + '.pdf', blob, 'application/pdf');
      } catch (e) {
        console.error(e);
        showModal(`<h3>No se ha podido generar el PDF</h3><p>${esc(e.message || e)}</p><div class="actions"><button class="btn btn-primary" data-action="close-modal">Cerrar</button></div>`);
      }
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
      const p = P(); const i = p.montajeOrder.indexOf(el.dataset.id), d = Number(el.dataset.d);
      let j = i + d;
      // con filtro de tramas, saltar las secuencias ocultas
      while (j >= 0 && j < p.montajeOrder.length && !escVisible(p, sceneById(p, p.montajeOrder[j]) || {})) j += d;
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
    'toggle-need': (el) => { const sc = sceneById(P(), el.dataset.id); sc.needs[el.dataset.n] = !sc.needs[el.dataset.n]; openEst = 'n:' + sc.id; save(); renderTab(); },
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

    'proj-rename': (el) => {
      const pr = state.projects[el.dataset.id]; if (!pr) return;
      const v = el.value.trim(); pr.name = v && v !== pr.title ? v : '';
      pr.updatedAt = Date.now(); Cloud.queue(pr.id); save(); renderProjectSelect(); if (pr.id === state.currentId) renderTab();
      toast('Proyecto renombrado.');
    },
    'lay-to': (el) => {
      if (!el.value) return; const [tp, tg] = el.value.split('|').map(Number);
      editLayout(ph => { const src = ph[+el.dataset.p].groups[+el.dataset.g][1]; const id = src.splice(+el.dataset.i, 1)[0]; const dst = ph[tp].groups[tg][1]; if (!dst.includes(id)) dst.push(id); });
    },
    'lay-add': (el) => { if (!el.value) return; editLayout(ph => { const g = ph[+el.dataset.p].groups[+el.dataset.g][1]; if (!g.includes(el.value)) g.push(el.value); }); },
    'lay-rename-phase': (el) => editLayout(ph => { ph[+el.dataset.p].name = el.value.trim() || ph[+el.dataset.p].name; }),
    'lay-rename-group': (el) => editLayout(ph => { ph[+el.dataset.p].groups[+el.dataset.g][0] = el.value.trim() || 'Grupo'; }),
    'col-toggle': (el) => {
      const p = P(); const t = el.dataset.t; const list = colsFor(p, t, COL_SETS[t](p), true);
      const c = list.find(x => x.k === el.dataset.c); if (!c) return;
      c.off = !el.checked;
      if (list.every(x => x.off)) { c.off = false; toast('Tiene que quedar al menos una columna.'); }
      setColState(p, t, list); colsPanel(t);
    },
    'map-opt': (el) => window.MapaTramas.setOpt(el.dataset.o, el.checked),
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
    if (k === 'p:formato') { ensureEpisodes(RP()); render(); }
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
    if (el.id === 'fileInput' || el.classList.contains('file-trigger')) { handleFiles(el.files); el.value = ''; return; }
    if (el.id === 'jsonInput') { importJSON(el.files[0]); el.value = ''; return; }
    if (el.id === 'epSelect') { state.ui = state.ui || {}; state.ui.ep = Object.assign({}, state.ui.ep, { [state.currentId]: el.value }); expanded.clear(); save(); render(); return; }
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
      if (sec) { curSec = sec.name; tab = lastTabOf[sec.name] && sec.tabs.some(t => t.id === lastTabOf[sec.name]) ? lastTabOf[sec.name] : sec.tabs[0].id; prepTab(); window.scrollTo(0, 0); render(); }
      return;
    }
    const tabBtn = e.target.closest('[data-tab]');
    if (tabBtn) { tab = tabBtn.dataset.tab; prepTab(); const sc = sections().find(x => x.name === curSec && x.tabs.some(t => t.id === tab)) || sections().find(x => x.tabs.some(t => t.id === tab)); if (sc) { curSec = sc.name; lastTabOf[sc.name] = tab; } window.scrollTo(0, 0); render(); return; }
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
    if (f && /\.json$/i.test(f.name)) importJSON(f); else handleFiles(e.dataTransfer.files);
  });

  // Mover pestañas arrastrándolas en la barra (vista por fases)
  let tabDrag = null;
  document.addEventListener('dragstart', e => {
    const b = e.target.closest && e.target.closest('.tabs-sub button[data-tab][data-pi]'); if (!b) return;
    tabDrag = { pi: +b.dataset.pi, gi: +b.dataset.gi, ti: +b.dataset.ti }; b.classList.add('tab-dragging');
    e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', b.dataset.tab);
  });
  document.addEventListener('dragover', e => {
    if (!tabDrag) return;
    const t = e.target.closest && (e.target.closest('.tabs-sub button[data-tab][data-pi]') || e.target.closest('.tabs-sections button[data-pi]'));
    document.querySelectorAll('.tab-over').forEach(x => x.classList.remove('tab-over'));
    if (t) { e.preventDefault(); t.classList.add('tab-over'); }
  });
  document.addEventListener('drop', e => {
    if (!tabDrag) return;
    const tb = e.target.closest && e.target.closest('.tabs-sub button[data-tab][data-pi]');
    const sb = !tb && e.target.closest && e.target.closest('.tabs-sections button[data-pi]');
    if (tb || sb) {
      e.preventDefault();
      const ph = getPhases(); const src = ph[tabDrag.pi].groups[tabDrag.gi][1]; const id = src[tabDrag.ti];
      if (tb) {
        const pi = +tb.dataset.pi, gi = +tb.dataset.gi; let ti = +tb.dataset.ti;
        const after = e.clientX > tb.getBoundingClientRect().left + tb.offsetWidth / 2;
        src.splice(tabDrag.ti, 1);
        const dst = ph[pi].groups[gi][1];
        if (dst === src && tabDrag.ti < ti) ti--;
        const k = dst.indexOf(id); if (k >= 0) dst.splice(k, 1);
        dst.splice(Math.min(dst.length, ti + (after ? 1 : 0)), 0, id);
      } else {
        const pi = +sb.dataset.pi; if (pi !== tabDrag.pi) { src.splice(tabDrag.ti, 1); const g = ph[pi].groups[ph[pi].groups.length - 1][1]; if (!g.includes(id)) g.push(id); toast(`«${labelOf(id)}» movida a ${ph[pi].name}.`); }
      }
      setPhases(ph); render();
    }
    tabDrag = null;
  });
  document.addEventListener('dragend', () => { tabDrag = null; document.querySelectorAll('.tab-dragging,.tab-over').forEach(x => x.classList.remove('tab-dragging', 'tab-over')); });

  // Mover columnas arrastrando la cabecera
  let colDrag = null;
  document.addEventListener('dragstart', e => {
    const th = e.target.closest && e.target.closest('th.col-drag'); if (!th) return;
    colDrag = { t: th.dataset.table, k: th.dataset.col }; th.classList.add('col-dragging');
    e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', th.dataset.col);
  });
  document.addEventListener('dragover', e => {
    if (!colDrag) return; const th = e.target.closest && e.target.closest('th.col-drag');
    document.querySelectorAll('th.col-over').forEach(x => x.classList.remove('col-over'));
    if (th && th.dataset.table === colDrag.t) { e.preventDefault(); th.classList.add('col-over'); }
  });
  document.addEventListener('drop', e => {
    if (!colDrag) return; const th = e.target.closest && e.target.closest('th.col-drag');
    if (th && th.dataset.table === colDrag.t && th.dataset.col !== colDrag.k) {
      e.preventDefault();
      const p = P(); const list = colsFor(p, colDrag.t, COL_SETS[colDrag.t](p), true);
      const from = list.findIndex(c => c.k === colDrag.k); const moved = list.splice(from, 1)[0];
      const to = list.findIndex(c => c.k === th.dataset.col);
      const rect = th.getBoundingClientRect(); const after = e.clientX > rect.left + rect.width / 2;
      list.splice(to + (after ? 1 : 0), 0, moved);
      setColState(p, colDrag.t, list);
    }
    colDrag = null;
  });
  document.addEventListener('dragend', () => { colDrag = null; document.querySelectorAll('.col-dragging,.col-over').forEach(x => x.classList.remove('col-dragging', 'col-over')); });

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
  function hideModal() { $('#modal').hidden = true; $('#modalBody').classList.remove('modal-wide'); }
  let toastTimer;
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 3500); }
  function grow(el) { if (!el.classList.contains('edit')) return; el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; }
  function autoGrow() { document.querySelectorAll('textarea.edit').forEach(grow); }

  window.addEventListener('beforeprint', autoGrow);
  // API para el módulo de desglose automático (js/ai.js)
  window.DesgloseApp = {
    P, save, render, renderTab, toast, showModal, hideModal, esc, uid, field, area, inp,
    NEEDS, DEPTS, ACT_NAMES, DEFAULT_TRAMAS, EXTRA_COLORS, sceneHeading, fmtEighths, ensureCharacters,
    applyPortada, RP, dnum, isSerie, tramaOf: (p, s) => tramaOf(p, s), ACTS: () => ACT_NAMES, minutesPerPage, fmtMin, download, fileBase, printHeader, estadoSelect, sceneById, area, actions, getTab: () => tab, setTab: t => { tab = t; render(); }
  };
  render();
  Cloud.init();
})();
