/* ==========================================================================
   DESGLOSE AUTOMÁTICO CON CRITERIO DE MONTAJE
   Usa Claude (capacidad «sample» de la página publicada en claude.ai) para
   proponer el desglose completo como lo haría una montadora con más de
   30 años de experiencia. Todo lo propuesto queda editable y se puede deshacer.
   ========================================================================== */
(function () {
  'use strict';
  const A = window.DesgloseApp;
  const { esc } = A;

  const PERSONA = `Eres una montadora de cine y televisión con más de 30 años de experiencia en largometrajes, series y documental, y docente de montaje. Tienes un conocimiento pleno del guion cinematográfico y de las estructuras narrativas (estructura en actos, paradigma clásico, puntos de giro, tramas y subtramas, arcos de personaje, montajes alternos y paralelos, elipsis, ritmo) y trabajas con la metodología del step line de Juan Carlos Marimón («El montaje cinematográfico. Del guion a la pantalla»): curva de intensidad dramática, actos (Prólogo, Planteamiento, Desarrollo, Convergencia/Clímax, Resolución) y puntos de giro por trama.
Estás preparando la preproducción de montaje: reuniones con dirección, lectura de guion, reunión de workflow de postproducción y necesidades para la coordinación de postproducción (color/conformado, GFX/VFX, sonido y música).
Escribe en español de España, con vocabulario profesional de montaje, de forma concreta y útil para el equipo, sin relleno. Basa todo en el texto del guion; si algo es una interpretación tuya, formúlalo como propuesta.`;

  const NEED_HELP = {
    accion: 'secuencia de acción (coreografía, cobertura, ritmo de corte)',
    secMontaje: 'secuencia de montaje o musical (serie de planos, videoclip, elipsis musicada)',
    alterno: 'montaje alterno o paralelo con otra(s) secuencia(s)',
    sobrante: 'posible secuencia sobrante o candidata a caer/compactarse en montaje',
    flashback: 'flashback, sueño u otro tiempo/realidad que pide tratamiento de color o imagen',
    archivo: 'material de archivo (imágenes de época, noticiarios, TV real, fotos) y derechos',
    vfx: 'efectos visuales (composición, borrados, sangre, disparos, cromas, extensiones)',
    gfx: 'grafismo y rótulos (cartelas, sobreimpresiones, pantallas de móvil, textos)',
    pantallas: 'insertos de pantalla (TV, monitores, proyecciones) a rellenar en post',
    off: 'voz en off o diálogo fuera de campo / teléfono / radio',
    sfx: 'efectos de sonido y ambientes relevantes (disparos, multitudes, tráfico, silencios)',
    cancion: 'canción diegética (suena en escena: radio, baile, actuación) — derechos y playback',
    musica: 'música incidental / momento de partitura importante'
  };

  let sampleFn = null, available = null;
  const job = { running: false, log: [], ctl: null, error: '', done: false };
  const backups = {};   // copia para deshacer, por proyecto (dura mientras la página está abierta)
  const opts = { lectura: true, tramas: true, desglose: true, stepline: true, notas: true };

  async function init() {
    if (!window.claude || typeof window.claude.use !== 'function') { available = false; return; }
    try { sampleFn = await window.claude.use('sample'); } catch (e) { sampleFn = null; }
    available = !!sampleFn;
    if (A.getTab() === 'ia') A.renderTab();
  }

  /* ------------------------------------------------------------------ */
  /* Preparación del texto del guion                                      */
  /* ------------------------------------------------------------------ */
  function sceneBlock(s, maxChars) {
    let t = (s.text || s.summary || '').replace(/\n{3,}/g, '\n\n').trim();
    if (t.length > maxChars) t = t.slice(0, maxChars) + ' […]';
    return `### ESC ${s.num} | ${A.sceneHeading(s)} | ${A.fmtEighths(s.eighths)} pág | Personajes: ${s.characters.join(', ') || '—'}${(s.offCharacters || []).length ? ' | En off: ' + s.offCharacters.join(', ') : ''}\n${t}`;
  }

  function scriptForGlobal(p) {
    const budget = 170000;
    const per = Math.max(300, Math.min(3000, Math.floor(budget / Math.max(1, p.scenes.length))));
    return p.scenes.map(s => sceneBlock(s, per)).join('\n\n');
  }

  function projectHeader(p) {
    return [
      `Título: ${p.title}`, p.version && `Versión del guion: ${p.version}`, `Formato: ${p.formato || ''}`,
      `Páginas: ${p.pages || '?'} · Secuencias: ${p.scenes.length}`, p.durationMin && `Duración real/prevista: ${p.durationMin} min`,
      p.credits.guion && `Guion: ${p.credits.guion}`, p.credits.direccion && `Dirección: ${p.credits.direccion}`
    ].filter(Boolean).join('\n');
  }

  /* ------------------------------------------------------------------ */
  /* Prompts                                                              */
  /* ------------------------------------------------------------------ */
  function globalPrompt(p) {
    return `${PERSONA}

TAREA: haz la lectura completa del guion que sigue y devuelve el análisis global de montaje.

${projectHeader(p)}

Responde SOLO con un objeto JSON con esta forma exacta:
{
  "logline": "una o dos frases",
  "genero": "género y subgénero",
  "analisis": {
    "historia": "de qué trata la historia (1ª lectura)",
    "generoTono": "género y tono, referencias si ayudan",
    "personajes": "personajes principales: quiénes son y qué quieren",
    "temas": "temas (2ª lectura)",
    "mapa": "mapa de personajes y relaciones",
    "estructura": "estructura: actos, eventos y giros, con números de secuencia",
    "interes": "puntos de interés para el montaje",
    "sobrantes": "posibles secuencias sobrantes o compactables, con número y motivo",
    "problemas": "problemas generales o estructurales que anticipas (ritmo, información repetida, arranque lento, clímax…)",
    "necesidades": "necesidades específicas de montaje: secuencias de acción y musicales, montajes alternos, carga de VFX, sonido (canciones diegéticas, offs, sfx, ambientes), material de archivo",
    "preguntas": "preguntas concretas para la reunión con dirección"
  },
  "tramas": [ {"letra": "A", "nombre": "NOMBRE CORTO EN MAYÚSCULAS", "descripcion": "una frase", "personajes": ["NOMBRE", "..."]} ],
  "personajes": [ {"nombre": "NOMBRE TAL COMO APARECE EN EL GUION", "trama": "A", "objetivo": "deseo / necesidad", "inicio": "cómo empieza", "fin": "cómo termina", "clave": "secuencias clave del arco (números) y notas"} ],
  "actos": {"Prólogo": "nº de secuencia donde empieza o null", "Planteamiento": "nº", "Desarrollo": "nº", "Convergencia / Clímax": "nº", "Resolución": "nº"},
  "giros": [ {"esc": "nº de secuencia", "etiqueta": "máx. 4 palabras, p. ej. INCIDENTE DESENCADENANTE"} ]
}
Reglas:
- Entre 2 y 8 tramas, letras A, B, C… por orden de importancia (A = trama principal).
- "personajes": los principales y secundarios con peso dramático (no figuración), con los nombres EXACTOS del guion.
- "giros": entre 5 y 14 puntos de giro y eventos clave en toda la película (detonante, primer punto de giro, punto medio, crisis, clímax, etc.).
- Usa los números de secuencia tal como aparecen tras "ESC".
- En los textos puedes usar saltos de línea y viñetas con "- ".

GUION (secuencias en orden):
${scriptForGlobal(p)}`;
  }

  function globalContext(p) {
    const tr = p.tramas.map(t => `${t.letter} = ${t.name}${t.desc ? ' (' + t.desc + ')' : ''}${charsOf(p, t.id).length ? ' · personajes: ' + charsOf(p, t.id).join(', ') : ''}`).join('\n');
    const giros = p.scenes.filter(s => s.keyEvent).map(s => `${s.num}: ${s.eventLabel}`).join('; ');
    const acts = (p.acts || []).map(a => { const s = p.scenes.find(x => x.id === a.start); return s ? `${a.name} desde la ${s.num}` : ''; }).filter(Boolean).join('; ');
    return `${projectHeader(p)}
Logline: ${p.logline || '—'}
Tramas:
${tr}
Actos: ${acts || '—'}
Puntos de giro: ${giros || '—'}`;
  }

  function charsOf(p, tid) { return Object.keys(p.characters).filter(c => p.characters[c].tramaId === tid && !p.characters[c].hidden); }

  function batchPrompt(p, scenes) {
    return `${PERSONA}

TAREA: desglose de montaje secuencia a secuencia. Ya conoces la película completa por este resumen:

${globalContext(p)}

Para CADA secuencia de abajo, devuelve:
- "esc": el número de secuencia.
- "trama": la letra de la trama a la que pertenece principalmente.
- "accion": resumen de la acción en presente, 1-2 frases (máx. 35 palabras), como en una escaleta.
- "conflicto": conflicto / objetivo dramático de la secuencia: qué cambia y para qué está en la película (1 frase).
- "intensidad": intensidad dramática de 0 a 10 (puede ser decimal .5) según su lugar en la curva de la película completa, no aislada. Usa el rango completo: valles reales y picos reales.
- "necesidades": lista con las claves que apliquen, de entre:
${Object.keys(NEED_HELP).map(k => `  · ${k}: ${NEED_HELP[k]}`).join('\n')}
- "notas": objeto con notas breves y prácticas (cadena vacía si no hay nada) para "montaje" (ritmo, cobertura, posibles problemas, elipsis, punto de corte), "color", "vfx", "sonido" y "musica".

Responde SOLO con JSON: {"secuencias": [ {"esc": "", "trama": "A", "accion": "", "conflicto": "", "intensidad": 5, "necesidades": [], "notas": {"montaje": "", "color": "", "vfx": "", "sonido": "", "musica": ""}} ]}
Incluye todas las secuencias de la lista, en el mismo orden.

SECUENCIAS:
${scenes.map(s => sceneBlock(s, 5000)).join('\n\n')}`;
  }

  function batches(p) {
    const out = []; let cur = [], size = 0;
    p.scenes.forEach(s => {
      const len = Math.min(5000, (s.text || '').length) + 200;
      if (cur.length && (size + len > 70000 || cur.length >= 25)) { out.push(cur); cur = []; size = 0; }
      cur.push(s); size += len;
    });
    if (cur.length) out.push(cur);
    return out;
  }

  /* ------------------------------------------------------------------ */
  /* Aplicar resultados                                                   */
  /* ------------------------------------------------------------------ */
  const norm = s => String(s == null ? '' : s).trim().toUpperCase();
  const findScene = (p, num) => p.scenes.find(s => norm(s.num) === norm(num));
  const tramaByLetter = (p, l) => p.tramas.find(t => norm(t.letter) === norm(l));

  function snapshot(p) {
    return JSON.stringify({
      logline: p.logline, genero: p.genero, analysis: p.analysis, tramas: p.tramas, characters: p.characters, acts: p.acts,
      scenes: p.scenes.map(s => ({ id: s.id, tramaId: s.tramaId, summary: s.summary, summaryEdited: s.summaryEdited, conflict: s.conflict, intensity: s.intensity, keyEvent: s.keyEvent, eventLabel: s.eventLabel, needs: s.needs, notes: s.notes }))
    });
  }
  function restore(p, snap) {
    const b = JSON.parse(snap);
    ['logline', 'genero', 'analysis', 'tramas', 'characters', 'acts'].forEach(k => { p[k] = b[k]; });
    b.scenes.forEach(o => { const s = p.scenes.find(x => x.id === o.id); if (s) Object.assign(s, o); });
  }

  function applyGlobal(p, g) {
    if (!g || typeof g !== 'object') return;
    if (opts.lectura) {
      if (g.logline) p.logline = String(g.logline);
      if (g.genero) p.genero = String(g.genero);
      if (g.analysis || g.analisis) p.analysis = Object.assign({}, p.analysis, toStrings(g.analisis || g.analysis));
    }
    if (opts.tramas && Array.isArray(g.tramas) && g.tramas.length) {
      const old = p.tramas;
      p.tramas = g.tramas.slice(0, 10).map((t, i) => {
        const letter = norm(t.letra || String.fromCharCode(65 + i)).slice(0, 3);
        const prev = old.find(o => norm(o.letter) === letter);
        const color = prev ? prev.color : (A.DEFAULT_TRAMAS[i] || {}).color || A.EXTRA_COLORS[i % A.EXTRA_COLORS.length];
        return { id: prev ? prev.id : 't' + A.uid(), letter, name: String(t.nombre || 'Trama ' + letter), color, desc: String(t.descripcion || '') };
      });
      const valid = new Set(p.tramas.map(t => t.id));
      p.scenes.forEach(s => { if (!valid.has(s.tramaId)) s.tramaId = ''; });
      Object.values(p.characters).forEach(c => { if (!valid.has(c.tramaId)) c.tramaId = ''; });
      g.tramas.forEach(t => (t.personajes || []).forEach(n => {
        const key = matchCharacter(p, n); const tr = tramaByLetter(p, t.letra);
        if (key && tr && !p.characters[key].tramaId) p.characters[key].tramaId = tr.id;
      }));
    }
    if (opts.tramas && Array.isArray(g.personajes)) {
      g.personajes.forEach(c => {
        let key = matchCharacter(p, c.nombre);
        if (!key) { key = norm(c.nombre); if (!key) return; p.characters[key] = { tramaId: '', objetivo: '', arcoInicio: '', arcoFin: '', notas: '', hidden: false }; }
        const ch = p.characters[key]; const tr = tramaByLetter(p, c.trama);
        if (tr) ch.tramaId = tr.id;
        if (c.objetivo) ch.objetivo = String(c.objetivo);
        if (c.inicio) ch.arcoInicio = String(c.inicio);
        if (c.fin) ch.arcoFin = String(c.fin);
        if (c.clave) ch.notas = String(c.clave);
      });
    }
    if (opts.stepline) {
      if (g.actos && typeof g.actos === 'object') {
        const acts = [];
        A.ACT_NAMES.forEach(name => {
          const key = Object.keys(g.actos).find(k => norm(k).replace(/\s/g, '') === norm(name).replace(/\s/g, '') || norm(name).startsWith(norm(k).split(/[\s/]/)[0]));
          const s = key && g.actos[key] != null ? findScene(p, g.actos[key]) : null;
          if (s) acts.push({ name, start: s.id });
        });
        if (acts.length) p.acts = acts;
      }
      if (Array.isArray(g.giros)) {
        p.scenes.forEach(s => { s.keyEvent = false; s.eventLabel = ''; });
        g.giros.forEach(x => { const s = findScene(p, x.esc); if (s) { s.keyEvent = true; s.eventLabel = String(x.etiqueta || '').toUpperCase(); } });
      }
    }
  }

  function matchCharacter(p, name) {
    const n = norm(name); if (!n) return null;
    if (p.characters[n]) return n;
    const keys = Object.keys(p.characters);
    return keys.find(k => k.split(/\s+/).includes(n) || n.split(/\s+/).includes(k)) || null;
  }
  function toStrings(o) {
    const out = {};
    Object.keys(o || {}).forEach(k => { const v = o[k]; out[k] = Array.isArray(v) ? v.map(x => '- ' + x).join('\n') : String(v == null ? '' : v); });
    return out;
  }

  function applyScenes(p, list) {
    let n = 0;
    (list || []).forEach(x => {
      const s = findScene(p, x.esc); if (!s) return; n++;
      if (opts.desglose) {
        const tr = tramaByLetter(p, x.trama); if (tr) s.tramaId = tr.id;
        if (x.accion) { s.summary = String(x.accion); s.summaryEdited = true; }
        if (x.conflicto) s.conflict = String(x.conflicto);
        if (Array.isArray(x.necesidades)) {
          const set = new Set(x.necesidades.map(String));
          A.NEEDS.forEach(nd => { s.needs[nd.k] = set.has(nd.k); });
        }
      }
      if (opts.stepline && x.intensidad != null && !isNaN(parseFloat(x.intensidad))) {
        s.intensity = Math.round(Math.max(0, Math.min(10, parseFloat(x.intensidad))) * 2) / 2;
      }
      if (opts.notas && x.notas && typeof x.notas === 'object') {
        s.notes = s.notes || {};
        Object.keys(A.DEPTS).forEach(d => { const v = x.notas[d]; if (v && String(v).trim()) s.notes[d] = String(v); });
      }
    });
    return n;
  }

  /* ------------------------------------------------------------------ */
  /* Ejecución                                                            */
  /* ------------------------------------------------------------------ */
  function log(msg, kind) { job.log.push({ msg, kind: kind || '' }); if (A.getTab() === 'ia') A.renderTab(); }
  function errText(e) {
    const c = e && e.code;
    return ({
      not_granted: 'No se ha dado permiso para usar Claude en esta página.',
      rate_limited: 'Has llegado al límite de uso de Claude por ahora. Inténtalo más tarde.',
      prompt_too_large: 'El guion es demasiado largo para una sola petición.',
      session_expired: 'Tu sesión ha caducado: vuelve a iniciar sesión.',
      sampling_disabled: 'Claude no está disponible en esta cuenta.',
      invalid_json: 'La respuesta no tenía el formato esperado.',
      cancelled: 'Detenido.'
    })[c] || ('Error: ' + (e && (e.message || e.code) || e));
  }

  async function run() {
    const p = A.P(); if (!p || !sampleFn || job.running) return;
    if (!p.scenes.length) { A.toast('Primero sube un guion.'); return; }
    backups[p.id] = snapshot(p);
    job.running = true; job.done = false; job.error = ''; job.log = []; job.ctl = new AbortController();
    const signal = job.ctl.signal;
    try {
      if (opts.lectura || opts.tramas || opts.stepline) {
        log('Leyendo el guion completo: historia, tramas, personajes, estructura y puntos de giro… (puede tardar 1-3 minutos)');
        const g = await sampleFn.json(globalPrompt(p), { modelTier: 'complex', signal, cache: false });
        applyGlobal(p, g); A.ensureCharacters(p); A.save();
        log(`✓ Lectura global: ${(g.tramas || []).length} tramas, ${(g.personajes || []).length} personajes, ${(g.giros || []).length} puntos de giro.`, 'ok');
      }
      if (opts.desglose || opts.stepline || opts.notas) {
        const bs = batches(p);
        for (let i = 0; i < bs.length; i++) {
          if (signal.aborted) break;
          const b = bs[i];
          log(`Desglosando secuencias ${b[0].num}–${b[b.length - 1].num} (bloque ${i + 1} de ${bs.length})…`);
          try {
            const r = await sampleFn.json(batchPrompt(p, b), { modelTier: 'complex', signal, cache: false });
            const n = applyScenes(p, (r && r.secuencias) || r);
            A.save();
            log(`✓ ${n} secuencias desglosadas.`, 'ok');
          } catch (e) {
            if (e && e.code === 'cancelled') throw e;
            if (e && ['not_granted', 'sampling_disabled', 'session_expired', 'rate_limited'].includes(e.code)) throw e;
            log(`⚠ Bloque ${i + 1}: ${errText(e)} Se continúa con el siguiente; puedes repetir esas secuencias desde el Desglose (✦).`, 'warn');
          }
        }
      }
      job.done = true;
      log('Desglose terminado. Revísalo y corrige lo que quieras en cada pestaña: todo es editable.', 'ok');
    } catch (e) {
      job.error = errText(e);
      log(job.error, 'warn');
      if (e && e.code === 'not_granted') available = false;
    } finally {
      job.running = false; job.ctl = null;
      A.save();
      if (A.getTab() === 'ia') A.renderTab();
    }
  }

  async function runScene(el) {
    const p = A.P(); const s = p.scenes.find(x => x.id === el.dataset.id);
    const out = document.getElementById('aiScene-' + s.id);
    if (!sampleFn) { A.toast('El desglose automático solo funciona en la versión de claude.ai.'); return; }
    el.disabled = true; if (out) out.textContent = ' Pensando…';
    const keep = Object.assign({}, opts);
    Object.assign(opts, { desglose: true, stepline: true, notas: true });
    try {
      const r = await sampleFn.json(batchPrompt(p, [s]), { modelTier: 'complex', cache: false });
      applyScenes(p, (r && r.secuencias) || r); A.save(); A.renderTab(); A.toast(`Secuencia ${s.num} desglosada. Revísala.`);
    } catch (e) {
      if (out) out.textContent = ' ' + errText(e);
      el.disabled = false;
    } finally { Object.assign(opts, keep); }
  }

  /* ------------------------------------------------------------------ */
  /* Pestaña                                                              */
  /* ------------------------------------------------------------------ */
  function tab(p) {
    const chk = (k, label, help) => `<label style="display:flex;gap:8px;align-items:flex-start;margin:6px 0"><input type="checkbox" data-ai-opt="${k}" ${opts[k] ? 'checked' : ''} ${job.running ? 'disabled' : ''}><span><b>${label}</b><br><span class="muted" style="font-size:12px">${help}</span></span></label>`;
    const unavailable = available === false;
    return `<section class="panel">
      <h2>✦ Desglose automático con criterio de montaje</h2>
      <p class="lead">Claude lee el guion completo como lo haría una <b>montadora con más de 30 años de experiencia</b> y pleno conocimiento de guion y estructuras narrativas, y propone el desglose: lectura de guion, tramas, personajes y arcos, desglose secuencia a secuencia, necesidades por departamento, curva de intensidad, actos y puntos de giro del step line.</p>
      <div class="note" style="margin-bottom:16px"><b>Es una propuesta, no una verdad cerrada.</b> Todo lo que escribe queda en los campos normales de la app: puedes cambiar cualquier cosa en cada pestaña, arrastrar los puntos de la curva, cambiar tramas o reescribir resúmenes. Si no te convence, pulsa <b>Deshacer</b> para volver a como estaba antes (mientras no cierres la página). Para una secuencia concreta, usa <b>✦ Proponer desglose de esta secuencia</b> en el Desglose de montaje (botón ▸).</div>
      ${unavailable ? `<div class="note" style="background:#fdecea;border-color:#f5c2bd;color:#8a2a1f">El desglose automático solo funciona en la <b>versión publicada en claude.ai</b> (con tu sesión iniciada) y después de permitir que la página use Claude. ${window.claude ? 'Si rechazaste el permiso, recarga la página y acéptalo.' : 'Este archivo abierto en local no tiene acceso a Claude.'}</div>` : ''}
      <h3>Qué quieres que proponga</h3>
      ${chk('lectura', 'Lectura de guion', 'Logline, historia, género y tono, temas, mapa de personajes, estructura, posibles sobrantes, problemas, necesidades de montaje y preguntas para dirección.')}
      ${chk('tramas', 'Tramas y personajes', 'Tramas A, B, C… con nombre y descripción; trama de cada personaje y su arco (objetivo, inicio → final, secuencias clave). Mantiene tus colores.')}
      ${chk('desglose', 'Desglose secuencia a secuencia', 'Trama, acción, conflicto/objetivo y necesidades de postproducción de cada secuencia.')}
      ${chk('notas', 'Notas por departamento', 'Montaje, color/conformado, GFX/VFX, sonido y música.')}
      ${chk('stepline', 'Step line', 'Intensidad dramática de cada secuencia, inicio de cada acto y puntos de giro (globos).')}
      <div class="toolbar" style="margin-top:16px">
        ${job.running
          ? `<button class="btn btn-primary" disabled><span class="spinner"></span>Analizando…</button><button class="btn" data-action="ai-stop">Detener</button>`
          : `<button class="btn btn-primary" data-action="ai-run" ${unavailable || !p.scenes.length ? 'disabled' : ''}>✦ ${job.done ? 'Volver a hacer el desglose' : 'Hacer el desglose'} (${p.scenes.length} secuencias)</button>`}
        ${backups[p.id] && !job.running ? `<button class="btn" data-action="ai-undo">↺ Deshacer (volver a antes del análisis)</button>` : ''}
      </div>
      <p class="muted" style="font-size:12px">Se usa tu cuenta de Claude; la primera vez la página te pedirá permiso. Un largometraje tarda varios minutos (lectura global y después bloques de unas 25 secuencias). Lo que ya se haya completado se guarda aunque lo detengas. Se sobrescriben solo las partes marcadas.</p>
      ${job.log.length ? `<h3>Progreso</h3><div class="script-text" style="font-family:inherit;font-size:13px;max-height:none">${job.log.map(l => `<div style="color:${l.kind === 'ok' ? '#2e7d4f' : l.kind === 'warn' ? '#a3501b' : 'inherit'}">${esc(l.msg)}</div>`).join('')}</div>` : ''}
      ${job.done ? `<div class="toolbar" style="margin-top:12px">${['analisis:Lectura de guion', 'tramas:Tramas y personajes', 'desglose:Desglose de montaje', 'montaje:Escaleta de montaje', 'arcos:Arco de personajes', 'stepline:Step line', 'departamentos:Necesidades por departamento'].map(x => { const [id, l] = x.split(':'); return `<button class="btn btn-small" data-tab="${id}">Revisar ${l} →</button>`; }).join('')}</div>` : ''}
    </section>`;
  }

  A.actions['ai-run'] = () => run();
  A.actions['ai-stop'] = () => { if (job.ctl) job.ctl.abort(); };
  A.actions['ai-undo'] = () => {
    const p = A.P(); if (!backups[p.id]) return;
    restore(p, backups[p.id]); delete backups[p.id]; job.done = false; job.log = [];
    A.save(); A.renderTab(); A.toast('Se ha vuelto al estado anterior al desglose automático.');
  };
  A.actions['ai-scene'] = el => runScene(el);
  document.addEventListener('change', e => {
    const k = e.target && e.target.dataset && e.target.dataset.aiOpt;
    if (k) opts[k] = e.target.checked;
  });

  window.AIEditor = { tab };
  init();
})();
