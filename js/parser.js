/* ==========================================================================
   PARSER DE GUIONES
   Formatos: PDF, Final Draft (.fdx), Fountain (.fountain), Word (.docx), TXT
   Flujo: archivo -> líneas (con página/posición) -> clasificación -> secuencias
   ========================================================================== */
(function (global) {
  'use strict';

  const LINES_PER_PAGE = 54;

  // Encabezado de secuencia: "12 INT. CASA - DÍA 12", "ESC. 62 INT. PISO — NOCHE", "INT/EXT. COCHE"
  const HEADING_RE = /^(?:\d{1,4}[A-Z]{0,2}\s+(?=\d))?(?:(?:ESC(?:ENA)?|SEC(?:UENCIA)?|SC|SCENE)\.?\s*)?(\d{1,4}(?:[.\-]\d{1,4})?[A-Z]{0,2})?\s*[.\-–—:)]?\s*(INT\.?\s*\/\s*EXT\.?|EXT\.?\s*\/\s*INT\.?|INT\.?\s*[-–]\s*EXT\.?|I\s*\/\s*E\.?|INT\.|EXT\.|INT\b|EXT\b|INTERIOR\b|EXTERIOR\b)\s*[.\-–—:]?\s*(.*)$/i;

  const TIME_WORDS = [
    'DÍA', 'DIA', 'NOCHE', 'AMANECER', 'ATARDECER', 'ANOCHECER', 'TARDE', 'MAÑANA', 'MEDIODÍA', 'MEDIODIA',
    'MADRUGADA', 'CONTINUACIÓN', 'CONTINUACION', 'CONTINUO', 'CONT', 'MÁS TARDE', 'MAS TARDE',
    'MOMENTOS DESPUÉS', 'MOMENTOS DESPUES', 'MISMO MOMENTO', 'DAY', 'NIGHT', 'DAWN', 'DUSK', 'CONTINUOUS',
    'LATER', 'SAME', 'MORNING', 'EVENING', 'AFTERNOON'
  ];
  const TIME_RE = new RegExp('^(.*?)[\\s.,]*(?:[-–—.,/]+\\s*)(' + TIME_WORDS.map(w => w.replace(/ /g, '\\s+')).join('|') + ')\\.?\\b(.*)$', 'i');

  const NON_CHARACTER = /^(CORTE|CORTA|FUNDIDO|FUNDE|ENCADENA|DISOLVE|FADE|CUT|SMASH|MATCH|FIN|THE END|CONTINUAR|CONTINÚA|CONTINUA|CONTINUED|MÁS|MAS|MORE|TÍTULO|TITULO|TITLE|SUPER|RÓTULO|ROTULO|INSERTO|INSERT|FLASHBACK|FLASH|MÁS TARDE|NEGRO|BLACK|OSCURO|CRÉDITOS|CREDITOS|TELÓN|SECUENCIA|MONTAJE|MONTAGE|INTERCUT|PLANO|POV|SOBREIMPRESIÓN|SOBREIMPRESION|CARTELA|PRÓLOGO|PROLOGO|EPÍLOGO|EPILOGO|ACTO|GUION|GUIÓN|VERSIÓN|VERSION|ESCRITO|WRITTEN|DRAFT|BORRADOR|PÁGINA|PAGINA|PAGE|ESCENA|SCENE|ESC)\b/;

  /* ------------------------------------------------------------------ */
  /* Detección de necesidades de postproducción a partir del texto        */
  /* ------------------------------------------------------------------ */
  const NEED_PATTERNS = {
    off: /\((?:off|en off|v\.?\s?o\.?|o\.?\s?s\.?|voz en off|o\.?c\.?)\)|voz en off|voice[- ]over/i,
    cancion: /canci[oó]n|canta(?:n|ndo)?\b|tararea|tocadiscos|gram[oó]fono|radio\b|disco\b|jukebox|baila(?:n|ndo)?\b|orquesta|banda de m[uú]sica|himno/i,
    musica: /m[uú]sica|music\b|melod[ií]a|piano|guitarra|viol[ií]n/i,
    sfx: /disparo|dispara|explosi[oó]n|estalla|trueno|sirena|portazo|golpe|cristal(?:es)? rot|timbre|tel[eé]fono suena|suena el tel[eé]fono|alarma|grito|chirr[ií]a|frenazo/i,
    vfx: /\bvfx\b|\bcgi\b|croma|chroma|pantalla verde|explosi[oó]n|incendi|llamas|holograma|sangre|herida de bala|multitud digital|efecto(?:s)? (?:visual|especial)/i,
    gfx: /r[oó]tulo|super(?:impos)?\s*:|sobreimpres|cartela|t[ií]tulo:|subt[ií]tul|mensaje de texto|whatsapp|sms\b|pantalla del (?:m[oó]vil|ordenador|port[aá]til)|chat\b|mapa animado|gr[aá]fico/i,
    pantallas: /televisi[oó]n|televisor|\btele\b|monitor(?:es)?|pantalla|proyector|proyecci[oó]n|\btv\b/i,
    archivo: /material de archivo|im[aá]genes de archivo|archivo hist[oó]rico|noticiario|\bno-?do\b|telediario|footage|stock|im[aá]genes de [eé]poca|documental/i,
    accion: /persecuci[oó]n|pelea|lucha(?:n)?\b|tiroteo|dispara|golpea|huye(?:n)?\b|corre(?:n)? (?:hacia|por|tras)|forcejea|atropell|choque|accidente/i,
    alterno: /montaje (?:alterno|paralelo)|intercut|alternando con|en paralelo con|intercalado/i,
    secMontaje: /secuencia de montaje|\bmontage\b|serie de planos|serie de im[aá]genes|montaje musical|videoclip/i,
    flashback: /flash-?back|flash-?forward|recuerdo|sue[ñn]o\b|pesadilla|alucinaci[oó]n|a[ñn]os antes|en el pasado/i
  };

  function detectNeeds(text) {
    const needs = {};
    for (const k in NEED_PATTERNS) needs[k] = NEED_PATTERNS[k].test(text);
    return needs;
  }

  /* ------------------------------------------------------------------ */
  /* Utilidades                                                           */
  /* ------------------------------------------------------------------ */
  function upperRatio(s) {
    const letters = s.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñÀÈÌÒÙàèìòùÇç]/g, '');
    if (!letters.length) return 0;
    const up = letters.replace(/[^A-ZÁÉÍÓÚÜÑÀÈÌÒÙÇ]/g, '').length;
    return up / letters.length;
  }

  function normalizeCharacter(name) {
    return name
      .replace(/\(.*?\)/g, '')
      .replace(/\b(CONT'?D|CONT\.|CONTINÚA|CONTINUA|O\.S\.|V\.O\.|OFF)\b/gi, '')
      .replace(/[\^:*_]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();
  }

  function parseHeading(text) {
    const t = text.replace(/\s+/g, ' ').trim();
    if (t.length < 5 || t.length > 140) return null;
    const m = t.match(HEADING_RE);
    if (!m) return null;
    if (upperRatio(t) < 0.75) return null;
    let num = m[1] || '';
    let ie = m[2].toUpperCase().replace(/\s+/g, '').replace(/\.$/, '');
    if (/^INTERIOR/.test(ie)) ie = 'INT';
    else if (/^EXTERIOR/.test(ie)) ie = 'EXT';
    else if (/^(INT.*EXT|EXT.*INT|I\/E)/.test(ie)) ie = 'INT/EXT';
    else ie = ie.replace(/\./g, '');
    let rest = (m[3] || '').trim();
    // número de secuencia al final (formato americano: "12 INT. CASA - DÍA 12")
    const trail = rest.match(/^(.*?)\s+\*?(\d{1,4}[A-Z]{0,2})\*?$/);
    if (trail) { rest = trail[1]; if (!num) num = trail[2]; }
    let location = rest, time = '';
    const tm = rest.match(TIME_RE);
    if (tm) {
      location = tm[1];
      time = (tm[2] + (tm[3] || '')).replace(/\s+/g, ' ').trim();
    }
    location = location.replace(/[\s.\-–—,]+$/, '').trim();
    time = time.toUpperCase().replace(/^DIA\b/, 'DÍA').replace(/\.$/, '');
    if (/^CONT/.test(time)) time = 'CONT.';
    if (!location) return null;
    return { num, intExt: ie, location: location.toUpperCase(), time };
  }

  /* ------------------------------------------------------------------ */
  /* Clasificación de líneas (PDF / texto plano / docx)                    */
  /*   line = { text, pos (en páginas, float), page, x?, width? }          */
  /* ------------------------------------------------------------------ */
  function classifyLines(lines, hasGeometry) {
    let minX = Infinity, width = 612;
    if (hasGeometry) {
      lines.forEach(l => { if (l.text.trim()) { minX = Math.min(minX, l.x); width = l.width || width; } });
      // margen de acción = percentil bajo de x (evita números de secuencia a la izquierda)
      const xs = lines.filter(l => l.text.trim().length > 25).map(l => l.x).sort((a, b) => a - b);
      if (xs.length) minX = xs[Math.floor(xs.length * 0.1)];
    }
    const out = [];
    let inDialogue = false;
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      const text = l.text.replace(/\s+$/, '');
      const trimmed = text.trim();
      if (!trimmed) { out.push({ ...l, type: 'blank' }); inDialogue = false; continue; }
      // números de página sueltos / cabeceras de continuación
      if (/^\d{1,3}\.?$/.test(trimmed) || /^\(?(CONTINÚA|CONTINUA|CONTINUED|MORE|MÁS)\)?$/i.test(trimmed) || /^CONTINUACI[OÓ]N:?$/i.test(trimmed)) {
        out.push({ ...l, type: 'skip' }); continue;
      }
      const forced = trimmed.startsWith('.') && !trimmed.startsWith('..') && /^\.[A-ZÁÉÍÓÚÑ0-9]/.test(trimmed);
      const h = parseHeading(forced ? trimmed.slice(1) : trimmed) || (forced ? { num: '', intExt: '', location: trimmed.slice(1).toUpperCase(), time: '' } : null);
      if (h) { out.push({ ...l, type: 'heading', heading: h }); inDialogue = false; continue; }

      const rel = hasGeometry ? (l.x - minX) / width : null;
      if (/^(CORTE A|CORTA A|FUNDIDO|FUNDE A|ENCADENA|CUT TO|FADE|DISSOLVE|SMASH CUT)/i.test(trimmed) && upperRatio(trimmed) > 0.8) {
        out.push({ ...l, type: 'transition' }); inDialogue = false; continue;
      }
      if (/^\(.*\)?$/.test(trimmed) && (inDialogue || (rel !== null && rel > 0.12))) {
        out.push({ ...l, type: 'paren' }); continue;
      }
      // Personaje (cue)
      const cueCandidate = trimmed.replace(/^@/, '');
      const isUpper = upperRatio(cueCandidate) === 1 && /[A-ZÁÉÍÓÚÑ]/.test(cueCandidate);
      const words = normalizeCharacter(cueCandidate).split(' ').filter(Boolean);
      let isCue = isUpper && cueCandidate.length <= 45 && words.length >= 1 && words.length <= 5 &&
        !/[.!?]$/.test(cueCandidate.replace(/\(.*\)/, '').trim()) && !NON_CHARACTER.test(cueCandidate) &&
        !/:$/.test(cueCandidate);
      if (isCue && hasGeometry) isCue = rel > 0.15 && rel < 0.55;
      if (isCue) {
        // debe seguirle diálogo (siguiente línea no vacía, no encabezado)
        const next = lines.slice(i + 1).find(n => n.text.trim());
        const nextIsBlankRightAfter = lines[i + 1] && !lines[i + 1].text.trim();
        if (!next || parseHeading(next.text.trim()) || (!hasGeometry && nextIsBlankRightAfter)) isCue = false;
      }
      if (isCue || trimmed.startsWith('@')) {
        out.push({ ...l, type: 'cue', character: normalizeCharacter(cueCandidate), off: /\((?:OFF|EN OFF|V\.?O\.?|O\.?S\.?|O\.?C\.?)\)/i.test(cueCandidate) });
        inDialogue = true; continue;
      }
      if (hasGeometry) {
        if (rel > 0.08 && rel < 0.45 && inDialogue) { out.push({ ...l, type: 'dialogue' }); continue; }
        inDialogue = false;
        out.push({ ...l, type: 'action' }); continue;
      }
      out.push({ ...l, type: inDialogue ? 'dialogue' : 'action' });
    }
    return out;
  }

  /* ------------------------------------------------------------------ */
  /* Construcción de secuencias                                           */
  /* ------------------------------------------------------------------ */
  function buildScenes(typed, totalPages) {
    const scenes = [];
    const preamble = [];
    let cur = null;
    typed.forEach(l => {
      if (l.type === 'heading') {
        cur = {
          num: l.heading.num, intExt: l.heading.intExt, location: l.heading.location, time: l.heading.time,
          heading: l.text.trim(), pos: l.pos, page: Math.floor(l.pos) + 1,
          characters: [], offCharacters: [], action: [], body: []
        };
        scenes.push(cur);
        return;
      }
      if (!cur) { if (l.type !== 'blank' && l.type !== 'skip') preamble.push({ text: l.text.trim(), size: l.size || 0, page: l.page || 1 }); return; }
      if (l.type === 'cue') {
        if (l.character && !cur.characters.includes(l.character)) cur.characters.push(l.character);
        if (l.off && !cur.offCharacters.includes(l.character)) cur.offCharacters.push(l.character);
        cur.body.push('\n' + l.text.trim());
      } else if (l.type === 'action') {
        cur.action.push(l.text.trim());
        cur.body.push(l.text.trim());
      } else if (l.type === 'dialogue' || l.type === 'paren') {
        cur.body.push('    ' + l.text.trim());
      } else if (l.type === 'transition') {
        cur.body.push(l.text.trim());
      } else if (l.type === 'blank') {
        cur.body.push('');
      }
    });

    let autoNum = 0;
    scenes.forEach((s, i) => {
      const next = scenes[i + 1];
      const end = next ? next.pos : totalPages;
      s.lengthPages = Math.max(0.125, end - s.pos);
      s.eighths = Math.max(1, Math.round(s.lengthPages * 8));
      autoNum++;
      if (!s.num) s.num = String(autoNum);
      else { const n = parseInt(s.num, 10); if (!isNaN(n)) autoNum = n; }
      const actionText = joinParagraphs(s.action);
      s.summary = firstSentences(actionText, 220);
      s.text = s.body.join('\n').replace(/\n{3,}/g, '\n\n').trim();
      s.needs = detectNeeds(s.heading + '\n' + s.text);
      if (s.offCharacters.length) s.needs.off = true;
      delete s.action; delete s.body;
    });

    const portada = parsePortada(preamble);
    return { scenes, title: portada.title, portada };
  }

  function joinParagraphs(arr) {
    return arr.join(' ').replace(/\s+/g, ' ').replace(/(\w)- (\w)/g, '$1$2').trim();
  }

  function firstSentences(text, max) {
    if (!text) return '';
    if (text.length <= max) return text;
    const cut = text.slice(0, max);
    const lastDot = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('.'));
    return lastDot > 60 ? cut.slice(0, lastDot + 1) : cut.replace(/\s+\S*$/, '') + '…';
  }

  /* ------------------------------------------------------------------ */
  /* Portada: título, versión, fecha, guion, basado en, producción…      */
  /* ------------------------------------------------------------------ */
  const MONTHS = 'enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre|january|february|march|april|may|june|july|august|september|october|november|december|ene|feb|mar|abr|jun|jul|ago|sep|sept|oct|nov|dic';
  const DATE_RES = [
    new RegExp('\\b\\d{1,2}\\s+(?:de\\s+)?(?:' + MONTHS + ')\\.?\\s+(?:de\\s+|del\\s+)?\\d{4}\\b', 'i'),
    new RegExp('\\b(?:' + MONTHS + ')\\.?\\s+\\d{1,2},?\\s+\\d{4}\\b', 'i'),
    new RegExp('\\b(?:' + MONTHS + ')\\.?\\s+(?:de\\s+|del\\s+)?\\d{4}\\b', 'i'),
    /\b\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}\b/,
    /\b\d{4}[\/.\-]\d{1,2}[\/.\-]\d{1,2}\b/
  ];
  const LABELS = {
    version: /\b(versi[oó]n|borrador|draft|tratamiento|revisi[oó]n|v\.\s?\d|\d+\s*[ªºa]\s*(?:versi[oó]n)?|final|shooting script|guion de rodaje|guion t[eé]cnico)\b/i,
    guion: /^(un\s+)?(guion|gui[oó]n|escrit[oa]|written|screenplay|teleplay|story by|historia de|idea original|argumento|creado por|created by|autor|autora|author)\b/i,
    basado: /\b(basad[oa]|a partir de|adaptaci[oó]n|adaptad[oa]|based on|inspirad[oa]|versi[oó]n libre)\b/i,
    direccion: /\b(direcci[oó]n|dirigid[oa]|directed by|director[a]?\b|un film de|una pel[ií]cula de|a film by)/i,
    produccion: /\b(producci[oó]n|productora|producid[oa]|produced by|producer|productor[a]?\b|producciones|films\b|pictures\b|s\.\s?l\.?\b|s\.\s?a\.?\b|media\b|studios?\b)/i,
    registro: /(registr|sgae|wga|propiedad intelectual|safe ?creative|©|\(c\)|copyright|dama\b|isbn|todos los derechos)/i,
    episodio: /\b(episodio|cap[ií]tulo|episode|temporada|season|serie\b|\d+\s?x\s?\d+)\b/i,
    contacto: /(@|\btel[eé]?f?\.?\b|tel[eé]fono|m[oó]vil|\+\d{2}|\b\d{3}[\s.]?\d{2,3}[\s.]?\d{2,3}[\s.]?\d{2,3}\b|www\.|https?:|\bcalle\b|\bc\/|avda|avenida|contacto|contact|agente|agent)/i
  };
  const stripLabel = (t, re) => t.replace(re, '').replace(/^[\s:.\-–—,]+|[\s:\-–—,]+$/g, '').replace(/^(de|del|por|by|en|on)\s+/i, '').trim();

  function parsePortada(preamble) {
    // Solo la portada: primeras líneas (o la primera página si hay geometría)
    let lines = preamble.filter(l => l.text && !/^\d{1,3}\.?$/.test(l.text));
    if (lines.some(l => l.page > 1) && lines.filter(l => l.page === 1).length >= 2) lines = lines.filter(l => l.page === 1);
    lines = lines.slice(0, 60);
    const out = { title: '', version: '', fecha: '', guion: '', basadoEn: '', direccion: '', produccion: '', contacto: '', registro: '', episodio: '', raw: lines.map(l => l.text).join('\n').slice(0, 3000) };
    if (!lines.length) return out;
    const used = new Set();
    const nextVal = i => { const n = lines[i + 1]; return n ? (used.add(i + 1), n.text) : ''; };
    const append = (k, v) => { v = (v || '').trim(); if (v && !out[k].includes(v)) out[k] = out[k] ? out[k] + ' · ' + v : v; };

    lines.forEach((l, i) => {
      const t = l.text;
      if (!out.fecha) { for (const re of DATE_RES) { const m = t.match(re); if (m) { out.fecha = m[0]; break; } } }
      if (/^(de|por|by|un guion de|una pel[ií]cula de)$/i.test(t)) { append('guion', nextVal(i)); used.add(i); return; }
      if (LABELS.registro.test(t)) { append('registro', t); used.add(i); return; }
      if (LABELS.contacto.test(t) && !LABELS.guion.test(t)) { append('contacto', t); used.add(i); return; }
      if (LABELS.basado.test(t)) {
        let v = t; if (/\b(en|de|on|of)\s*:?$/i.test(t)) v += ' ' + nextVal(i);
        append('basadoEn', stripLabel(v, /^.*?\b(basad[oa]\s+en|a partir de|adaptaci[oó]n de|adaptad[oa] de|based on|inspirad[oa]\s+en|versi[oó]n libre de)\b/i) || v); used.add(i); return;
      }
      if (LABELS.guion.test(t)) {
        let v = stripLabel(t, /^(un\s+)?(guion|gui[oó]n|escrit[oa]|written|screenplay|teleplay|story|historia|idea original|argumento|creado|created|autor|autora|author)(\s+(original|literario|cinematogr[aá]fico))?(\s+(y\s+)?(di[aá]logos|direcci[oó]n))?(\s+(de|por|by|del))?\s*:?/i);
        if (!v) v = nextVal(i);
        append('guion', v); used.add(i); return;
      }
      if (LABELS.direccion.test(t) && t.length < 90) {
        let v = stripLabel(t, /^.*?\b(direcci[oó]n|dirigid[oa]\s+por|directed by|director[a]?|un film de|una pel[ií]cula de|a film by)\b\s*:?/i);
        if (!v) v = nextVal(i);
        append('direccion', v); used.add(i); return;
      }
      if (LABELS.episodio.test(t) && t.length < 80) { append('episodio', t); used.add(i); return; }
      if (LABELS.version.test(t) && t.length < 90) { append('version', t.replace(/^versi[oó]n\s*:\s*/i, '')); used.add(i); return; }
      if (LABELS.produccion.test(t) && t.length < 90) { append('produccion', stripLabel(t, /^(producci[oó]n|productora|producid[oa]\s+por|produced by)\b\s*:?/i) || t); used.add(i); return; }
      if (out.fecha && DATE_RES.some(re => re.test(t)) && t.replace(/[\d\s\/.\-,de]+/gi, '').length < 12) used.add(i);
    });

    // Título: la línea de mayor tamaño de letra; si no hay tamaños, la primera en mayúsculas
    const free = lines.map((l, i) => ({ l, i })).filter(x => !used.has(x.i) && x.l.text.length < 90 && !/^(de|por|by|un|una)\s/i.test(x.l.text));
    let titleIdx = -1;
    const sized = free.filter(x => x.l.size);
    if (sized.length) {
      const max = Math.max(...sized.map(x => x.l.size));
      const big = sized.filter(x => x.l.size >= max - 0.5);
      if (max > Math.min(...sized.map(x => x.l.size)) + 0.5 || big.length === 1) {
        out.title = big.map(x => x.l.text).join(' ');
        titleIdx = big[big.length - 1].i;
      }
    }
    if (!out.title) {
      const c = free.find(x => upperRatio(x.l.text) > 0.8 && x.l.text.length > 1) || free[0];
      if (c) { out.title = c.l.text; titleIdx = c.i; }
    }
    out.title = out.title.replace(/^["“'«]+|["”'»]+$/g, '').replace(/\s+/g, ' ').trim();
    // «de Fulano» / «por Fulana» justo debajo del título = guion
    if (!out.guion && titleIdx >= 0) {
      const n = lines.slice(titleIdx + 1, titleIdx + 4).find(l => /^(de|por|by)\s+\S/i.test(l.text));
      if (n) out.guion = n.text.replace(/^(de|por|by)\s+/i, '').trim();
    }
    if (!out.version && /versi[oó]n|borrador|draft/i.test(out.fecha)) out.version = out.fecha;
    return out;
  }

  function guessTitle(preamble) {
    const cand = preamble.find(t => t.length > 2 && t.length < 70 && upperRatio(t) > 0.8 &&
      !/^(GUI[OÓ]N|ESCRITO|WRITTEN|VERSI[OÓ]N|DRAFT|BORRADOR|BY|POR|DE|\d)/i.test(t));
    return cand ? cand.replace(/["“”]/g, '').trim() : '';
  }

  /* ------------------------------------------------------------------ */
  /* PDF                                                                  */
  /* ------------------------------------------------------------------ */
  async function pdfToLines(arrayBuffer) {
    const pdfjsLib = global.pdfjsLib;
    if (!pdfjsLib) throw new Error('No se ha podido cargar el lector de PDF.');
    if (global.pdfjsWorker === undefined && pdfjsLib.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdf.worker.min.js';
    }
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const lines = [];
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const vp = page.getViewport({ scale: 1 });
      const content = await page.getTextContent();
      const rows = [];
      content.items.forEach(it => {
        if (!it.str) return;
        const x = it.transform[4], y = it.transform[5];
        let row = rows.find(r => Math.abs(r.y - y) < 2.5);
        if (!row) { row = { y, items: [] }; rows.push(row); }
        row.items.push({ x, str: it.str, w: it.width, size: Math.hypot(it.transform[2], it.transform[3]) || it.height || 0 });
      });
      rows.sort((a, b) => b.y - a.y);
      let prevY = null;
      rows.forEach(r => {
        r.items.sort((a, b) => a.x - b.x);
        let text = '', lastEnd = null;
        r.items.forEach(it => {
          if (lastEnd !== null && it.x - lastEnd > 2 && !text.endsWith(' ') && !it.str.startsWith(' ')) text += ' ';
          text += it.str; lastEnd = it.x + it.w;
        });
        if (!text.trim()) return;
        // línea en blanco si hay un salto vertical grande (para separar bloques)
        if (prevY !== null && prevY - r.y > 20) lines.push({ text: '', page: p, pos: (p - 1) + (1 - prevY / vp.height), x: 0, width: vp.width });
        // ignorar números de secuencia repetidos a la derecha: se mantienen en el texto y se limpian en parseHeading
        lines.push({ text, page: p, pos: (p - 1) + (1 - r.y / vp.height), x: r.items[0].x, width: vp.width, size: Math.round(Math.max(...r.items.map(it => it.size)) * 10) / 10 });
        prevY = r.y;
      });
      lines.push({ text: '', page: p, pos: p - 0.001, x: 0, width: vp.width });
    }
    return { lines, pages: pdf.numPages };
  }

  /* ------------------------------------------------------------------ */
  /* Texto plano / Fountain / docx                                        */
  /* ------------------------------------------------------------------ */
  function textToLines(text) {
    text = text.replace(/\r\n?/g, '\n').replace(/\f/g, '\n');
    // Fountain: eliminar notas [[ ]] y boneyard /* */
    text = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\[\[[\s\S]*?\]\]/g, '');
    const raw = text.split('\n');
    const lines = [];
    let count = 0;
    raw.forEach(t => {
      // estimación de líneas de página: acción ~60 car/línea
      const wraps = Math.max(1, Math.ceil(t.length / 60));
      lines.push({ text: t, pos: count / LINES_PER_PAGE, page: Math.floor(count / LINES_PER_PAGE) + 1 });
      count += t.trim() ? wraps : 1;
    });
    return { lines, pages: Math.max(1, Math.ceil(count / LINES_PER_PAGE)) };
  }

  function fountainTitle(text) {
    const m = text.match(/^\s*Title:\s*(.+)$/im);
    return m ? m[1].replace(/[_*]/g, '').trim() : '';
  }
  function fountainPortada(text) {
    const head = text.replace(/\r/g, '').split(/\n\s*\n/)[0];
    if (!/^\s*(title|credit|author|authors|source|draft date|date|contact|copyright|notes|version)\s*:/im.test(head)) return null;
    const get = k => { const m = head.match(new RegExp('^\\s*(?:' + k + ')\\s*:\\s*([^\\n]*(?:\\n(?:\\s{2,}|\\t)[^\\n]+)*)', 'im')); return m ? m[1].replace(/\n\s+/g, ' · ').replace(/[_*]/g, '').trim() : ''; };
    return { title: get('title'), guion: get('author|authors'), basadoEn: get('source'), fecha: get('draft date|date'), contacto: get('contact'), registro: get('copyright'), version: get('version|draft'), raw: head };
  }

  /* ------------------------------------------------------------------ */
  /* Final Draft (.fdx)                                                   */
  /* ------------------------------------------------------------------ */
  function fdxToTyped(xmlText) {
    const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
    if (doc.querySelector('parsererror')) throw new Error('El archivo FDX no es un XML válido.');
    const content = doc.querySelector('Content') || doc;
    const paras = Array.from(content.querySelectorAll(':scope > Paragraph'));
    const typed = [];
    let count = 0;
    const add = (type, text, extra) => {
      typed.push(Object.assign({ type, text, pos: count / LINES_PER_PAGE, page: Math.floor(count / LINES_PER_PAGE) + 1 }, extra || {}));
    };
    paras.forEach(p => {
      const type = p.getAttribute('Type') || 'Action';
      const text = Array.from(p.querySelectorAll('Text')).map(t => t.textContent).join('').trim();
      const width = /Dialogue|Parenthetical/.test(type) ? 35 : 60;
      if (type === 'Scene Heading') {
        const h = parseHeading(text) || { num: '', intExt: '', location: text.toUpperCase(), time: '' };
        const n = p.getAttribute('Number'); if (n) h.num = n;
        count += 1; add('heading', text, { heading: h }); count += 1;
      } else if (type === 'Character') {
        count += 1; add('cue', text, { character: normalizeCharacter(text), off: /\((?:OFF|V\.?O\.?|O\.?S\.?)\)/i.test(text) });
      } else if (type === 'Dialogue') {
        add('dialogue', text);
      } else if (type === 'Parenthetical') {
        add('paren', text);
      } else if (type === 'Transition') {
        count += 1; add('transition', text);
      } else if (text) {
        count += 1; add('action', text);
      }
      count += Math.max(1, Math.ceil(text.length / width));
    });
    const tp = Array.from(doc.querySelectorAll('TitlePage Paragraph')).map(p => ({
      text: Array.from(p.querySelectorAll('Text')).map(t => t.textContent).join('').trim(),
      size: Math.max(0, ...Array.from(p.querySelectorAll('Text')).map(t => parseFloat(t.getAttribute('Size')) || (/Bold/i.test(t.getAttribute('Style') || '') ? 13 : 12))),
      page: 1
    })).filter(x => x.text);
    const portada = tp.length ? parsePortada(tp) : null;
    return { typed, pages: Math.max(1, Math.ceil(count / LINES_PER_PAGE)), title: portada ? portada.title : '', portada };
  }

  /* ------------------------------------------------------------------ */
  /* API principal                                                        */
  /* ------------------------------------------------------------------ */
  async function parseFile(file) {
    const name = file.name;
    const ext = (name.split('.').pop() || '').toLowerCase();
    let result, format;
    if (ext === 'pdf') {
      format = 'PDF';
      const { lines, pages } = await pdfToLines(await file.arrayBuffer());
      const typed = classifyLines(lines, true);
      result = buildScenes(typed, pages); result.pages = pages;
    } else if (ext === 'fdx') {
      format = 'Final Draft';
      const { typed, pages, title, portada } = fdxToTyped(await file.text());
      result = buildScenes(typed, pages); result.pages = pages; result.title = title || result.title;
      if (portada) result.portada = portada;
    } else if (ext === 'docx') {
      format = 'Word';
      if (!global.mammoth) throw new Error('No se ha podido cargar el lector de Word.');
      const r = await global.mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
      // mammoth separa párrafos con \n\n: lo compactamos a \n entre párrafos de un mismo bloque
      const { lines, pages } = textToLines(r.value.replace(/\n\n/g, '\n'));
      result = buildScenes(classifyLines(lines, false), pages); result.pages = pages;
    } else {
      format = ext === 'fountain' ? 'Fountain' : 'Texto';
      const text = await file.text();
      const { lines, pages } = textToLines(text);
      result = buildScenes(classifyLines(lines, false), pages); result.pages = pages;
      if (ext === 'fountain') {
        const fp = fountainPortada(text);
        if (fp) { result.portada = Object.assign({}, result.portada, Object.fromEntries(Object.entries(fp).filter(([, v]) => v))); result.title = fp.title || result.title; }
      }
    }
    result.format = format;
    result.filename = name;
    if (!result.scenes.length) {
      throw new Error('No se han encontrado encabezados de secuencia (INT./EXT.). Comprueba que el guion tiene formato estándar o que el PDF contiene texto (no es una imagen escaneada).');
    }
    return result;
  }

  global.ScriptParser = { parseFile, parsePortada, parseHeading, classifyLines, buildScenes, textToLines, detectNeeds, NEED_PATTERNS };
})(typeof window !== 'undefined' ? window : globalThis);
