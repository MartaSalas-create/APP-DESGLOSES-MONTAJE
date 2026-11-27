/* ==========================================================================
   APARIENCIA: estilos visuales para probar con los proyectos reales
   actual · sala (sala de montaje) · guion (página de guion) ·
   corte (guion ↔ montaje, «CORTE A:») · moviola (analógico)
   ========================================================================== */
(function () {
  'use strict';
  const A = window.DesgloseApp;
  const { esc } = A;
  const THEMES = [
    ['actual', 'Actual', 'El diseño de ahora: sobrio y claro.'],
    ['sala', '1 · Sala de montaje', 'Oscuro, como un programa de montaje: línea de tiempo con los clips por trama y cabezal rojo; letra de código de tiempo.'],
    ['guion', '2 · Página de guion', 'Papel y letra Courier; fases como encabezados de secuencia (INT./EXT.); líneas del guion rayado en el margen.'],
    ['corte', '3 · Guion ↔ Montaje · «CORTE A:»', 'Cabecera mitad papel de guion, mitad película, con la línea de corte en medio y franja de claqueta. Área de trabajo clara.'],
    ['moviola', '4 · Moviola', 'Montaje en celuloide: tonos cálidos, perforaciones, pestañas de cinta de carrocero y fichas pegadas con cinta.'],
    ['mixto', '5 · Guion ↔ Montaje + línea de tiempo', 'La recomendación del Consejo: la estructura clara de la 3 con la línea de tiempo real de tu película (clips por trama, cabezal de lo rodado) y, en el papel, la secuencia en la que estás trabajando.']
  ];
  // secuencia «actual»: la última que has tocado (campo, ficha o clip de la línea de tiempo)
  let curScene = null;
  const RODADA = ['rodada', 'ingesta', 'preparada', 'pendiente', 'montada', 'sono', 'vfx', 'color', 'musica'];
  const cur = () => { try { return (JSON.parse(localStorage.getItem('desgloses-tema') || '""')) || 'actual'; } catch (e) { return 'actual'; } };
  let theme = cur();

  function clipTitle(p, s) {
    const t = p && p.tramas.find(x => x.id === s.tramaId);
    return esc('Sec. ' + (A.dnum ? A.dnum(s) : s.num) + ' · ' + s.location + ' — ' + (t ? 'Trama ' + t.letter + ' · ' + t.name : 'Sin trama asignada'));
  }
  function tlLegend(p, scenes, cls) {
    const used = new Set(scenes.map(s => s.tramaId || ''));
    const items = (p.tramas || []).filter(t => used.has(t.id)).map(t => `<span><b style="background:${t.color}"></b>${esc(t.letter)} · ${esc(t.name)}</span>`);
    if (used.has('') || [...used].some(id => id && !(p.tramas || []).some(t => t.id === id))) items.push('<span><b style="background:#9aa3ad"></b>Sin trama</span>');
    return items.length ? `<div class="tl-legend ${cls}">${items.join('')}</div>` : '';
  }
  // cabezal blanco en la secuencia actual (la que lees o tocas)
  const weight = s => Math.max(0.05, s.lengthPages || 0.1);
  function cursorHTML(p, scenes, kind, s0) {
    const cur = scenes.find(s => s.id === curScene) || (kind === 'mix' ? s0 : null); if (!cur) return '';
    const tot = scenes.reduce((a, s) => a + weight(s), 0) || 1;
    let before = 0; for (const s of scenes) { if (s.id === cur.id) break; before += weight(s); }
    const f = (before + weight(cur) / 2) / tot;
    const left = kind === 'sala' ? `calc(22px + (100% - 44px) * ${f})` : (f * 100) + '%';
    return `<span class="tl-cursor tl-cursor-${kind}" style="left:${left}"><em>SEC. ${esc(A.dnum ? A.dnum(cur) : cur.num)}</em></span>`;
  }
  function tramaColor(p, s) { const t = p && p.tramas.find(x => x.id === s.tramaId); return t ? t.color : '#9aa3ad'; }

  function deco() {
    const box = document.getElementById('themeDeco'); if (!box) return;
    const p = A.P();
    document.body.classList.remove(...THEMES.map(t => 'theme-' + t[0]));
    document.body.classList.add('theme-' + theme);
    if (theme === 'mixto') document.body.classList.add('theme-corte');
    // en la pestaña Guion la línea de tiempo queda fija arriba para seguir la lectura
    document.body.classList.toggle('tl-sticky', (theme === 'mixto' || theme === 'sala') && A.getTab() === 'guion');
    if (theme === 'actual' || !p) { box.innerHTML = ''; return; }
    const scenes = p.scenes || [];
    if (theme === 'sala') {
      const mpp = A.minutesPerPage(p);
      const total = scenes.reduce((a, s) => a + (s.lengthPages || 0) * mpp, 0) || 1;
      const step = total > 60 ? 15 : total > 20 ? 5 : 1;
      const ticks = []; for (let m = 0; m <= total + 0.001; m += step) ticks.push(`<span style="left:${m / total * 100}%">${String(Math.floor(m / 60)).padStart(2, '0')}:${String(Math.round(m % 60)).padStart(2, '0')}</span>`);
      const shot = scenes.filter(s => (s.estados || []).some(e => e !== 'eliminada' && e !== 'urgente')).reduce((a, s) => a + (s.lengthPages || 0) * mpp, 0);
      box.innerHTML = `<div class="sala-tl"><div class="sala-ruler">${ticks.join('')}</div><div class="sala-clips">${scenes.map(s => `<i data-scene="${s.id}" class="${s.id === curScene ? 'cur' : ''}" style="flex:${Math.max(0.05, s.lengthPages || 0.1)};background:${tramaColor(p, s)}" title="${clipTitle(p, s)}"></i>`).join('')}</div>${tlLegend(p, scenes, 'tl-legend-sala')}${shot ? `<span class="sala-ph" style="left:calc(22px + (100% - 44px) * ${Math.min(1, shot / total)})" title="Rodado: ${Math.round(shot)}′"></span>` : ''}${cursorHTML(p, scenes, 'sala')}</div>`;
    } else if (theme === 'corte') {
      const s0 = scenes.find(s => s.summary) || scenes[0];
      const frames = scenes.slice(0, 40).map(s => `<span style="background:${tramaColor(p, s)}"></span>`).join('');
      const perf = '<i></i>'.repeat(40);
      box.innerHTML = `<div class="corte-hd"><div class="corte-paper">${s0 ? `<b>${esc(s0.num)}. ${esc(s0.intExt ? s0.intExt + '. ' : '')}${esc(s0.location)}${s0.time ? ' — ' + esc(s0.time) : ''}</b><br>${esc((s0.summary || '').slice(0, 150))}` : '<b>FUNDIDO DE ENTRADA:</b>'}</div>
        <div class="corte-cut"><span>${esc((p.title || 'DESGLOSE DE MONTAJE').toUpperCase().slice(0, 34))}</span><small>✂ CORTE A:</small></div>
        <div class="corte-film"><div class="corte-perf">${perf}</div><div class="corte-frames">${frames}</div><div class="corte-perf">${perf}</div></div></div><div class="corte-clap"></div>`;
    } else if (theme === 'guion') {
      const cols = (p.tramas || []).slice(0, 6).map(t => t.color);
      box.innerHTML = `<div class="guion-bar"><span>${esc((p.title || '').toUpperCase())}${p.version ? ' · ' + esc(p.version) : ''}</span><b>FUNDIDO DE ENTRADA:</b></div>
        <div class="guion-lines">${cols.map((c, i) => `<i style="left:${8 + i * 9}px;background:${c};top:${120 + i * 70}px"></i>`).join('')}</div>`;
    } else if (theme === 'mixto') {
      const mpp = A.minutesPerPage(p);
      const total = scenes.reduce((a, s) => a + (s.lengthPages || 0) * mpp, 0) || 1;
      const step = total > 90 ? 15 : total > 40 ? 10 : total > 15 ? 5 : 1;
      const ticks = []; for (let m = 0; m <= total + 0.001; m += step) ticks.push(`<span style="left:${m / total * 100}%">${Math.round(m)}′</span>`);
      const shotMin = scenes.filter(s => (s.estados || []).some(e => RODADA.includes(e))).reduce((a, s) => a + (s.lengthPages || 0) * mpp, 0);
      const shotN = scenes.filter(s => (s.estados || []).some(e => RODADA.includes(e))).length;
      const s0 = scenes.find(s => s.id === curScene) || scenes.find(s => !(s.estados || []).some(e => RODADA.includes(e))) || scenes[0];
      const t0 = s0 && p.tramas.find(x => x.id === s0.tramaId);
      const perf = '<i></i>'.repeat(60);
      box.innerHTML = `<div class="corte-hd mix-hd">
        <div class="corte-paper mix-paper">${s0 ? `<div class="mix-label">${s0.id === curScene ? 'SECUENCIA ACTUAL' : 'SIGUIENTE POR RODAR'}${t0 ? ` · <span style="color:${t0.color};filter:brightness(.7)">■</span> ${esc(t0.letter)}` : ''}</div><b>${esc(A.dnum ? A.dnum(s0) : s0.num)}. ${esc(s0.intExt ? s0.intExt + '. ' : '')}${esc(s0.location)}${s0.time ? ' — ' + esc(s0.time) : ''}</b><br>${esc((s0.summary || '').slice(0, 140))}` : '<b>FUNDIDO DE ENTRADA:</b>'}</div>
        <div class="corte-cut"><span>${esc((p.title || 'DESGLOSE DE MONTAJE').toUpperCase().slice(0, 34))}</span><small>✂ CORTE A:</small></div>
        <div class="corte-film mix-film"><div class="corte-perf">${perf}</div>
          <div class="mix-tl"><div class="mix-ruler">${ticks.join('')}</div>
            <div class="mix-clips">${scenes.map(s => `<i data-scene="${s.id}" class="${s.id === (s0 && s0.id) ? 'cur' : ''}" style="flex:${Math.max(0.05, s.lengthPages || 0.1)};background:${tramaColor(p, s)}" title="${clipTitle(p, s)}"></i>`).join('')}</div>
            ${cursorHTML(p, scenes, 'mix', s0)}
            ${tlLegend(p, scenes, 'tl-legend-mix')}
            ${shotMin ? `<span class="mix-ph" style="left:${Math.min(100, shotMin / total * 100)}%"><em>${shotN} rodadas · ${Math.round(shotMin)}′</em></span>` : ''}</div>
          <div class="corte-perf">${perf}</div></div></div><div class="corte-clap"></div>`;
    } else if (theme === 'moviola') {
      box.innerHTML = '<div class="mov-perf mov-l"></div><div class="mov-perf mov-r"></div>';
    }
  }

  function panel() {
    A.showModal(`<h3>Apariencia</h3><p>Prueba cada estilo con tus proyectos. Puedes cambiarlo cuando quieras; no afecta a tus datos ni a los PDF.</p>
      <div class="theme-list">${THEMES.map(([k, n, d]) => `<button class="theme-opt ${theme === k ? 'on' : ''}" data-action="theme-set" data-v="${k}"><span class="theme-sw theme-sw-${k}"></span><span><b>${esc(n)}</b><br><span class="muted">${esc(d)}</span></span></button>`).join('')}</div>
      <div class="actions"><button class="btn btn-primary" data-action="close-modal">Listo</button></div>`);
  }
  A.actions['theme-panel'] = () => panel();
  A.actions['theme-set'] = el => { theme = el.dataset.v; try { localStorage.setItem('desgloses-tema', JSON.stringify(theme)); } catch (e) { /* sin almacenamiento */ } deco(); panel(); };

  // la secuencia que tocas pasa a ser la «actual» del papel
  document.addEventListener('focusin', e => {
    if (theme !== 'mixto') return;
    const el = e.target.closest && e.target.closest('[data-k^="s:"]'); if (!el) return;
    const id = el.dataset.k.split(':')[1]; if (id && id !== curScene) { curScene = id; deco(); }
  });
  document.addEventListener('click', e => {
    if (theme !== 'mixto') return;
    const card = e.target.closest && e.target.closest('.card[data-id]');
    if (card && card.dataset.id !== curScene) { curScene = card.dataset.id; deco(); }
  });

  // Pinchar o arrastrar sobre la línea de tiempo: el cabezal va a esa secuencia y el guion salta a ella
  let lock = 0;
  function goTo(id, smooth) {
    if (!id) return;
    const changed = id !== curScene; curScene = id;
    if (A.getTab() !== 'guion') A.setTab('guion');
    let el = document.getElementById('gv-' + id);
    if (!el) { A.toast('Esa secuencia está oculta por el filtro de la pestaña Guion.'); }
    else { lock = Date.now() + (smooth ? 900 : 250); el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' }); }
    if (changed) deco();
  }
  const clipAt = (row, x) => { const cs = row.querySelectorAll('i[data-scene]'); for (const c of cs) { const r = c.getBoundingClientRect(); if (x >= r.left - 0.5 && x <= r.right + 0.5) return c; } const r0 = row.getBoundingClientRect(); return x < r0.left ? cs[0] : cs[cs.length - 1]; };
  document.addEventListener('pointerdown', e => {
    if (theme !== 'mixto' && theme !== 'sala') return;
    const row = e.target.closest && e.target.closest('.mix-clips, .sala-clips'); if (!row) return;
    e.preventDefault();
    const first = clipAt(row, e.clientX); if (first) goTo(first.dataset.scene, false);
    const move = ev => { const r = document.querySelector('.mix-clips, .sala-clips'); const c = r && clipAt(r, ev.clientX); if (c && c.dataset.scene !== curScene) goTo(c.dataset.scene, false); };
    const up = () => { document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); document.removeEventListener('pointercancel', up); };
    document.addEventListener('pointermove', move); document.addEventListener('pointerup', up); document.addEventListener('pointercancel', up);
  });
  // Al leer el guion, el cabezal sigue a la secuencia que tienes arriba en pantalla
  let raf = 0;
  window.addEventListener('scroll', () => {
    if ((theme !== 'mixto' && theme !== 'sala') || A.getTab() !== 'guion' || raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0; if (Date.now() < lock) return;
      const hd = document.body.classList.contains('tl-sticky') ? document.getElementById('themeDeco') : document.querySelector('.tabs');
      const top = (hd ? hd.getBoundingClientRect().bottom : 0) + 40;
      const sc = Array.from(document.querySelectorAll('.gv-scene')).find(el => el.getBoundingClientRect().bottom > top);
      const id = sc && sc.id.replace(/^gv-/, '');
      if (id && id !== curScene) { curScene = id; deco(); }
    });
  }, { passive: true });

  window.Theme = { deco };
  deco();
})();
