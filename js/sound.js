/* ==========================================================================
   LISTADO DE SFX Y AMBIENTES PARA EL DISEÑADOR DE SONIDO
   Un listado único (sin repeticiones) de los archivos de sonido que hay que
   pedir para importarlos en el Avid y montar el sonido de referencia:
   cada SFX y cada ambiente con las secuencias en que se usa y la duración
   necesaria.
   ========================================================================== */
(function () {
  'use strict';
  const A = window.DesgloseApp;
  const { esc } = A;

  const ESTADOS_SND = [
    { k: 'pedir', label: 'Pedir', color: '#e6ae66' },
    { k: 'pedido', label: 'Pedido', color: '#72bad8' },
    { k: 'recibido', label: 'Recibido', color: '#86b86a' },
    { k: 'importado', label: 'Importado en Avid', color: '#cc6b55' },
    { k: 'descartado', label: 'Descartado', color: '#4d4d4d' }
  ];
  const PRIORIDADES = ['Alta', 'Media', 'Baja'];

  // Diccionario de SFX de librería habituales (palabra en el guion -> archivo a pedir)
  const SFX_DICT = [
    [/tiroteo|r[aá]fagas?|ametralladora|metralleta/i, 'Tiroteo / ráfagas de arma automática'],
    [/disparo|dispara|un tiro\b|tiros\b|balazo|pistoletazo/i, 'Disparo de arma de fuego'],
    [/explosi[oó]n|estalla|detonaci[oó]n|bomba/i, 'Explosión'],
    [/portazo|cierra la puerta de golpe|da un portazo/i, 'Portazo'],
    [/abre la puerta|cierra la puerta|puerta se abre|puerta se cierra|chirr[ií]a la puerta/i, 'Puerta abriéndose / cerrándose'],
    [/timbre|llaman a la puerta|golpes en la puerta|aporrea la puerta|toc,? toc/i, 'Timbre / llamada a la puerta'],
    [/suena el tel[eé]fono|tel[eé]fono suena|tel[eé]fono sonando|ring/i, 'Teléfono sonando'],
    [/cuelga el tel[eé]fono|descuelga|marca un n[uú]mero|tono de llamada/i, 'Teléfono: descolgar / marcar / colgar'],
    [/sirena/i, 'Sirena (policía / ambulancia)'],
    [/trueno|rel[aá]mpago/i, 'Truenos'],
    [/cristal(es)? (rot|se romp|estall)|vidrio rot|rompe el cristal|se hace a[ñn]icos/i, 'Cristales rotos'],
    [/frenazo|frena en seco|derrapa/i, 'Frenazo / derrape'],
    [/arranca el (coche|motor)|motor arranca|pone en marcha|acelera/i, 'Coche: arranque y aceleración'],
    [/claxon|bocina|pita\b/i, 'Claxon'],
    [/choque|choca|accidente|colisi[oó]n/i, 'Choque de coche'],
    [/pu[ñn]etazo|golpea|bofetada|patada|pelea|forcejeo/i, 'Golpes de pelea (impactos)'],
    [/pasos|camina por el pasillo|taconeo|tacones/i, 'Pasos (superficie según secuencia)'],
    [/reloj|tic-?tac/i, 'Reloj (tic-tac)'],
    [/m[aá]quina de escribir/i, 'Máquina de escribir'],
    [/helic[oó]ptero/i, 'Helicóptero'],
    [/avi[oó]n|avioneta/i, 'Avión pasando'],
    [/tren\b|locomotora/i, 'Tren'],
    [/campanas?|campanadas/i, 'Campanas'],
    [/perro ladra|ladridos?|ladra\b/i, 'Perro ladrando'],
    [/grifo|ducha|ba[ñn]era|cisterna/i, 'Agua (grifo / ducha / cisterna)'],
    [/cerilla|mechero|enciende un cigarr/i, 'Cerilla / mechero encendiendo'],
    [/brindis|vasos|copas|botella|descorcha/i, 'Vasos / copas / botella'],
    [/aplausos|aplauden/i, 'Aplausos de público'],
    [/risas del p[uú]blico|el p[uú]blico r[ií]e|carcajadas/i, 'Risas de público'],
    [/radio\b|transistor/i, 'Radio (sintonía / estática)'],
    [/televisi[oó]n|televisor|la tele\b/i, 'Televisión de fondo'],
    [/alarma/i, 'Alarma'],
    [/llaves|cerradura|cerrojo/i, 'Llaves / cerradura / cerrojo'],
    [/esposas|grilletes|cadenas/i, 'Esposas / cadenas metálicas'],
    [/celda|reja|barrotes/i, 'Puerta de reja / celda metálica'],
    [/fuego|llamas|incendio|crepita/i, 'Fuego crepitando']
  ];
  const AMB_EXTRAS = [
    [/lluvia|llueve|chaparr[oó]n/i, 'lluvia'], [/tormenta|truenos?/i, 'tormenta'], [/viento/i, 'viento'],
    [/multitud|gent[ií]o|muchedumbre|manifestaci[oó]n/i, 'multitud'], [/tr[aá]fico|coches pasan|avenida/i, 'tráfico'],
    [/mar\b|olas|playa|puerto/i, 'mar'], [/p[aá]jaros|grillos|campo/i, 'naturaleza'], [/p[uú]blico|plat[oó]|estudio de televisi/i, 'público / plató'],
    [/bar\b|cafeter[ií]a|restaurante/i, 'bar / restaurante'], [/silencio/i, 'silencio tenso (room tone)']
  ];

  const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
  const slug = s => norm(s).replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40);
  const timeKey = t => { const n = norm(t); if (/NOCHE|NIGHT|MADRUG/.test(n)) return 'NOCHE'; if (/AMANEC|ALBA|DAWN/.test(n)) return 'AMANECER'; if (/ATARDEC|ANOCHEC|DUSK/.test(n)) return 'ATARDECER'; if (/D[I]A|DAY|MANANA|TARDE|MEDIOD/.test(n)) return 'DIA'; return ''; };
  const mmss = min => { const t = Math.round(min * 60); return `${Math.floor(t / 60)}' ${String(t % 60).padStart(2, '0')}"`; };

  function list(p) { if (!Array.isArray(p.soundList)) p.soundList = []; return p.soundList; }

  /* ---------------- Listado automático a partir del guion ---------------- */
  function autoList(p) {
    const mpp = A.minutesPerPage(p);
    const amb = new Map(), sfx = new Map();
    p.scenes.forEach(s => {
      const text = s.heading + '\n' + (s.text || '');
      // Ambiente: uno por lugar + momento del día (aunque se repita en varias secuencias)
      const place = (s.location || '').split(/\s[-–—]\s/)[0];
      const tk = timeKey(s.time);
      const key = (s.intExt || '') + '|' + norm(place) + '|' + tk;
      const extras = AMB_EXTRAS.filter(([re]) => re.test(text)).map(x => x[1]);
      if (!amb.has(key)) amb.set(key, { tipo: 'AMB', desc: `Ambiente ${s.intExt ? s.intExt + '. ' : ''}${place}${tk ? ' — ' + tk : ''}`, escenas: [], min: 0, extras: new Set(), archivo: `AMB_${s.intExt ? slug(s.intExt) + '_' : ''}${slug(place)}${tk ? '_' + tk : ''}` });
      const a = amb.get(key); a.escenas.push(s.num); a.min += s.lengthPages * mpp; extras.forEach(e => a.extras.add(e));
      // SFX puntuales
      SFX_DICT.forEach(([re, desc]) => {
        const m = text.match(new RegExp(re.source, 'gi'));
        if (!m) return;
        if (!sfx.has(desc)) sfx.set(desc, { tipo: 'SFX', desc, escenas: [], veces: 0, archivo: 'SFX_' + slug(desc) });
        const x = sfx.get(desc); if (!x.escenas.includes(s.num)) x.escenas.push(s.num); x.veces += m.length;
      });
    });
    const items = [];
    sfx.forEach(x => items.push({ tipo: 'SFX', desc: x.desc, escenas: x.escenas.join(', '), uso: `Puntual · ${x.veces} ${x.veces === 1 ? 'vez' : 'veces'} en guion · pedir 3-5 variantes`, archivo: x.archivo, prioridad: 'Media', estado: 'pedir', notas: '', auto: true }));
    amb.forEach(a => items.push({ tipo: 'AMB', desc: a.desc + (a.extras.size ? ' (' + Array.from(a.extras).join(', ') + ')' : ''), escenas: a.escenas.join(', '), uso: `Continuo · ${mmss(a.min)} en pantalla · pedir mín. ${mmss(Math.max(1, a.min * 1.5))} sin cortes (loop)`, archivo: a.archivo, prioridad: 'Media', estado: 'pedir', notas: '', auto: true }));
    return numbered(items);
  }

  function numbered(items) {
    items.sort((a, b) => (a.tipo === b.tipo ? 0 : a.tipo === 'AMB' ? 1 : -1) || firstNum(a) - firstNum(b));
    let ns = 0, na = 0;
    items.forEach(it => {
      it.id = it.id || 'snd' + A.uid();
      const n = it.tipo === 'AMB' ? ++na : ++ns;
      const base = String(it.archivo || slug(it.desc)).replace(/^(SFX|AMB)_(\d{3}_)?/, '');
      it.archivo = `${it.tipo}_${String(n).padStart(3, '0')}_${base}`;
    });
    return items;
  }
  const firstNum = it => parseInt(String(it.escenas || '').split(/[,\s]+/)[0], 10) || 9999;

  /* ---------------- Listado con Claude (criterio de montadora) ---------------- */
  let busy = false;
  async function aiList(p) {
    const AI = window.AIEditor;
    if (!AI || !AI.available()) { A.toast('Generar con Claude solo funciona en la versión de claude.ai.'); return; }
    if (busy) return; busy = true;
    const mpp = A.minutesPerPage(p);
    const groups = []; for (let i = 0; i < p.scenes.length; i += 25) groups.push(p.scenes.slice(i, i + 25));
    const merged = new Map();
    const say = m => { const el = document.getElementById('sndStatus'); if (el) el.textContent = m; };
    try {
      for (let gi = 0; gi < groups.length; gi++) {
        const g = groups[gi];
        say(`✦ Claude está preparando el listado: secuencias ${g[0].num}–${g[g.length - 1].num} (bloque ${gi + 1} de ${groups.length})…`);
        const r = await AI.ask(`${AI.PERSONA}

TAREA: estás preparando el montaje de referencia en Avid y necesitas pedir al diseñador de sonido de postproducción los archivos de SFX (efectos de librería) y AMBIENTES para importarlos y montar el sonido de referencia. Haz el LISTADO DE PEDIDO de estas secuencias.

Criterios:
- SFX: efectos concretos y puntuales que el montaje necesita para funcionar (disparos, puertas, golpes, coches, teléfonos, objetos clave, foley destacado…). Descríbelos como se buscan en una librería: fuente + acción + matiz (p. ej. "Revólver años 70, disparo único en interior pequeño"). No incluyas diálogos ni voces de los actores.
- AMBIENTES: el fondo continuo de cada lugar y momento (exterior/interior, día/noche, época, ciudad, multitud, tráfico, naturaleza, room tone). Un mismo ambiente sirve para todas las secuencias del mismo lugar y momento: NO lo repitas, agrupa las secuencias.
- Ten en cuenta la época y el lugar de la historia (vehículos, teléfonos, máquinas de la época).
- "archivo": nombre corto en MAYÚSCULAS sin espacios ni tildes, p. ej. "AMB_EXT_CALLE_CIUDAD_NOCHE" o "SFX_DISPARO_REVOLVER_INT". Usa SIEMPRE el mismo nombre para el mismo sonido.
- "uso": para SFX, cuántas veces / variantes; para AMB, que sea continuo y la duración aproximada que cubre.

Contexto de la película:
${AI.context(p)}

Responde SOLO con JSON: {"items": [ {"tipo": "SFX" | "AMB", "descripcion": "", "archivo": "", "esc": ["nº", "..."], "uso": "", "prioridad": "Alta|Media|Baja", "notas": ""} ]}

SECUENCIAS (con su duración estimada):
${g.map(s => AI.block(s, 3000) + `\n(duración estimada: ${mmss(s.lengthPages * mpp)})`).join('\n\n')}`);
        ((r && r.items) || []).forEach(it => {
          const tipo = /AMB/i.test(it.tipo) ? 'AMB' : 'SFX';
          const key = tipo + '|' + slug(it.archivo || it.descripcion);
          const esc_ = (Array.isArray(it.esc) ? it.esc : String(it.esc || '').split(/[,\s]+/)).map(String).filter(Boolean);
          if (!merged.has(key)) merged.set(key, { tipo, desc: String(it.descripcion || ''), archivo: slug(it.archivo || it.descripcion), escenas: [], uso: String(it.uso || ''), prioridad: PRIORIDADES.includes(it.prioridad) ? it.prioridad : 'Media', estado: 'pedir', notas: String(it.notas || ''), auto: true });
          const m = merged.get(key);
          esc_.forEach(n => { if (!m.escenas.includes(n)) m.escenas.push(n); });
          if (it.notas && !m.notas.includes(it.notas)) m.notas = m.notas ? m.notas + ' · ' + it.notas : String(it.notas);
        });
      }
      const items = Array.from(merged.values()).map(x => {
        if (x.tipo === 'AMB') {
          const min = x.escenas.reduce((a, n) => { const s = p.scenes.find(sc => norm(sc.num) === norm(n)); return a + (s ? s.lengthPages * mpp : 0); }, 0);
          if (min) x.uso = (x.uso ? x.uso + ' · ' : '') + `${mmss(min)} en pantalla · pedir mín. ${mmss(Math.max(1, min * 1.5))} sin cortes`;
        }
        x.escenas = x.escenas.join(', ');
        return x;
      });
      const keep = list(p).filter(it => !it.auto);
      p.soundList = keep.concat(numbered(items));
      A.save(); A.renderTab();
      A.toast(`Listado preparado: ${items.filter(i => i.tipo === 'SFX').length} SFX y ${items.filter(i => i.tipo === 'AMB').length} ambientes. Revísalo.`);
    } catch (e) {
      say(AI.errText(e));
    } finally { busy = false; }
  }

  /* ---------------- Pestaña ---------------- */
  function tab(p) {
    const items = list(p);
    const sel = (k, opts, cur, cls) => `<select class="cell-input ${cls || ''}" data-k="${k}" data-rerender="1">${opts.map(o => `<option value="${esc(o[0])}" ${o[0] === cur ? 'selected' : ''}>${esc(o[1])}</option>`).join('')}</select>`;
    const row = (it, i) => {
      const est = ESTADOS_SND.find(e => e.k === it.estado) || ESTADOS_SND[0];
      const k = f => `p:soundList.${i}.${f}`;
      return `<tr class="${it.estado === 'descartado' ? 'strike' : ''}">
        <td><span class="estado-badge" style="background:${it.tipo === 'AMB' ? '#5f8f4a' : '#86b86a'};color:#fff">${it.tipo === 'AMB' ? 'AMBIENTE' : 'SFX'}</span><div style="margin-top:4px">${sel(k('tipo'), [['SFX', 'SFX'], ['AMB', 'Ambiente']], it.tipo)}</div></td>
        <td><textarea class="cell-input" data-k="${k('desc')}" style="min-width:260px">${esc(it.desc)}</textarea></td>
        <td><input class="cell-input" data-k="${k('escenas')}" value="${esc(it.escenas)}" style="min-width:110px"></td>
        <td><textarea class="cell-input" data-k="${k('uso')}" style="min-width:200px">${esc(it.uso)}</textarea></td>
        <td>${sel(k('estado'), ESTADOS_SND.map(e => [e.k, e.label]), it.estado, 'snd-estado')}<div style="height:4px;border-radius:2px;margin-top:3px;background:${est.color}"></div></td>
        <td><textarea class="cell-input" data-k="${k('notas')}" style="min-width:160px">${esc(it.notas)}</textarea></td>
        <td class="no-print"><button class="btn btn-small btn-ghost" data-action="snd-del" data-i="${i}" title="Quitar">✕</button></td>
      </tr>`;
    };
    const nS = items.filter(i => i.tipo === 'SFX').length, nA = items.filter(i => i.tipo === 'AMB').length;
    const byEst = ESTADOS_SND.map(e => [e, items.filter(i => i.estado === e.k).length]).filter(x => x[1]);
    return `<section class="panel">
      ${A.printHeader(p, 'Listado de SFX y ambientes para el diseñador de sonido')}
      <h2>Listado de SFX y ambientes</h2>
      <p class="lead no-print">Pedido al <b>diseñador de sonido de postproducción</b> de los archivos de librería que necesitamos para importar en el <b>Avid</b> y montar el sonido de referencia. Cada sonido aparece una sola vez con todas las secuencias donde se usa; los ambientes llevan la duración que cubren para pedirlos sin cortes. Edita, añade o quita lo que quieras y exporta el listado.</p>
      <div class="toolbar no-print">
        <button class="btn btn-small btn-primary" data-action="snd-ai">✦ Preparar listado con Claude</button>
        <button class="btn btn-small" data-action="snd-auto">Listado automático desde el guion</button>
        <button class="btn btn-small" data-action="snd-add" data-t="SFX">+ SFX</button>
        <button class="btn btn-small" data-action="snd-add" data-t="AMB">+ Ambiente</button>
        <span class="spacer"></span>
        <button class="btn btn-small" data-action="snd-csv">Exportar para el diseñador de sonido (.csv)</button>
        <button class="btn btn-small" data-action="print">Descargar PDF</button>
      </div>
      <div id="sndStatus" class="muted" style="margin-bottom:8px"></div>
      <div class="post-legend" style="margin-bottom:10px"><b>${nS} SFX · ${nA} AMBIENTES</b>${byEst.map(([e, n]) => `<span class="estado-badge" style="background:${e.color};color:#fff">${e.label}: ${n}</span>`).join('')}</div>
      ${items.length ? `<div class="table-wrap"><table>
        <thead><tr><th>Tipo</th><th>Descripción</th><th>Secuencias</th><th>Uso / duración</th><th>Estado</th><th>Notas</th><th class="no-print"></th></tr></thead>
        <tbody>${items.map(row).join('')}</tbody></table></div>`
        : `<div class="note">Todavía no hay listado. Pulsa <b>✦ Preparar listado con Claude</b> (lee el guion con criterio de montaje y agrupa SFX y ambientes) o <b>Listado automático desde el guion</b> (rápido, por palabras clave: un ambiente por cada lugar y momento del día, y los SFX habituales de librería que se mencionan).</div>`}
    </section>`;
  }

  /* ---------------- Exportar ---------------- */
  function csv(p) {
    const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    const head = ['Tipo', 'Descripción', 'Secuencias', 'Uso / duración', 'Estado', 'Notas'];
    const rows = list(p).filter(i => i.estado !== 'descartado').map(i => [i.tipo === 'AMB' ? 'AMBIENTE' : 'SFX', i.desc, i.escenas, i.uso, (ESTADOS_SND.find(e => e.k === i.estado) || {}).label, i.notas]);
    A.download(A.fileBase(p) + '_SFX_ambientes.csv', '﻿' + [head, ...rows].map(r => r.map(q).join(';')).join('\n'), 'text/csv;charset=utf-8');
  }

  /* ---------------- Acciones ---------------- */
  const confirmReplace = (msg, action) => A.showModal(`<h3>Sustituir el listado</h3><p>${msg}</p><p>Se conservan los sonidos que hayas añadido a mano.</p><div class="actions"><button class="btn" data-action="close-modal">Cancelar</button><button class="btn btn-primary" data-action="${action}">Continuar</button></div>`);
  A.actions['snd-auto'] = () => { const p = A.P(); if (list(p).some(i => i.auto)) confirmReplace('Se rehará el listado automático a partir del guion.', 'snd-auto-ok'); else A.actions['snd-auto-ok'](); };
  A.actions['snd-auto-ok'] = () => { A.hideModal(); const p = A.P(); p.soundList = list(p).filter(i => !i.auto).concat(autoList(p)); A.save(); A.renderTab(); };
  A.actions['snd-ai'] = () => { const p = A.P(); if (list(p).some(i => i.auto)) confirmReplace('Claude preparará un listado nuevo a partir del guion (tarda unos minutos en un largometraje).', 'snd-ai-ok'); else aiList(p); };
  A.actions['snd-ai-ok'] = () => { A.hideModal(); aiList(A.P()); };
  A.actions['snd-add'] = el => {
    const p = A.P(); const t = el.dataset.t; const n = list(p).filter(i => i.tipo === t).length + 1;
    list(p).push({ id: 'snd' + A.uid(), tipo: t, desc: '', escenas: '', uso: t === 'AMB' ? 'Continuo' : 'Puntual', archivo: `${t}_${String(n).padStart(3, '0')}_`, prioridad: 'Media', estado: 'pedir', notas: '', auto: false });
    A.save(); A.renderTab();
  };
  A.actions['snd-del'] = el => { const p = A.P(); list(p).splice(Number(el.dataset.i), 1); A.save(); A.renderTab(); };
  A.actions['snd-csv'] = () => csv(A.P());

  window.SoundList = { tab, autoList };
})();
