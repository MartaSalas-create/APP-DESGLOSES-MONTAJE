/* ==========================================================================
   PARSER DE GUIONES
   Formatos: PDF, Final Draft (.fdx), Fountain (.fountain), Word (.docx), TXT
   Flujo: archivo -> líneas (con página/posición) -> clasificación -> secuencias
   ========================================================================== */
(function (global) {
  'use strict';

  const LINES_PER_PAGE = 54;

  // Encabezado de secuencia: "12 INT. CASA - DÍA 12", "ESC. 62 INT. PISO — NOCHE", "INT/EXT. COCHE"
  const HEADING_RE = /^(?:(?:ESC(?:ENA)?|SEC(?:UENCIA)?|SC|SCENE)\.?\s*)?(\d{1,4}[A-Z]{0,2})?\s*[.\-–—:)]?\s*(INT\.?\s*\/\s*EXT\.?|EXT\.?\s*\/\s*INT\.?|INT\.?\s*[-–]\s*EXT\.?|I\s*\/\s*E\.?|INT\.|EXT\.|INT\b|EXT\b|INTERIOR\b|EXTERIOR\b)\s*[.\-–—:]?\s*(.*)$/i;

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
      if (!cur) { if (l.type !== 'blank' && l.type !== 'skip') preamble.push(l.text.trim()); return; }
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

    return { scenes, title: guessTitle(preamble) };
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
        row.items.push({ x, str: it.str, w: it.width });
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
        lines.push({ text, page: p, pos: (p - 1) + (1 - r.y / vp.height), x: r.items[0].x, width: vp.width });
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
    const titleEl = doc.querySelector('TitlePage Paragraph Text');
    return { typed, pages: Math.max(1, Math.ceil(count / LINES_PER_PAGE)), title: titleEl ? titleEl.textContent.trim() : '' };
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
      const { typed, pages, title } = fdxToTyped(await file.text());
      result = buildScenes(typed, pages); result.pages = pages; result.title = title || result.title;
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
      if (ext === 'fountain') result.title = fountainTitle(text) || result.title;
    }
    result.format = format;
    result.filename = name;
    if (!result.scenes.length) {
      throw new Error('No se han encontrado encabezados de secuencia (INT./EXT.). Comprueba que el guion tiene formato estándar o que el PDF contiene texto (no es una imagen escaneada).');
    }
    return result;
  }

  global.ScriptParser = { parseFile, parseHeading, classifyLines, buildScenes, textToLines, detectNeeds, NEED_PATTERNS };
})(typeof window !== 'undefined' ? window : globalThis);
