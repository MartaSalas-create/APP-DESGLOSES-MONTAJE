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
    ['moviola', '4 · Moviola', 'Montaje en celuloide: tonos cálidos, perforaciones, pestañas de cinta de carrocero y fichas pegadas con cinta.']
  ];
  const cur = () => { try { return (JSON.parse(localStorage.getItem('desgloses-tema') || '""')) || 'actual'; } catch (e) { return 'actual'; } };
  let theme = cur();

  function tramaColor(p, s) { const t = p && p.tramas.find(x => x.id === s.tramaId); return t ? t.color : '#9aa3ad'; }

  function deco() {
    const box = document.getElementById('themeDeco'); if (!box) return;
    const p = A.P();
    document.body.classList.remove(...THEMES.map(t => 'theme-' + t[0]));
    document.body.classList.add('theme-' + theme);
    if (theme === 'actual' || !p) { box.innerHTML = ''; return; }
    const scenes = p.scenes || [];
    if (theme === 'sala') {
      const mpp = A.minutesPerPage(p);
      const total = scenes.reduce((a, s) => a + (s.lengthPages || 0) * mpp, 0) || 1;
      const step = total > 60 ? 15 : total > 20 ? 5 : 1;
      const ticks = []; for (let m = 0; m <= total + 0.001; m += step) ticks.push(`<span style="left:${m / total * 100}%">${String(Math.floor(m / 60)).padStart(2, '0')}:${String(Math.round(m % 60)).padStart(2, '0')}</span>`);
      const shot = scenes.filter(s => (s.estados || []).some(e => e !== 'eliminada' && e !== 'urgente')).reduce((a, s) => a + (s.lengthPages || 0) * mpp, 0);
      box.innerHTML = `<div class="sala-tl"><div class="sala-ruler">${ticks.join('')}</div><div class="sala-clips">${scenes.map(s => `<i style="flex:${Math.max(0.05, s.lengthPages || 0.1)};background:${tramaColor(p, s)}" title="Esc. ${esc(s.num)} · ${esc(s.location)}"></i>`).join('')}</div>${shot ? `<span class="sala-ph" style="left:calc(22px + (100% - 44px) * ${Math.min(1, shot / total)})" title="Rodado: ${Math.round(shot)}′"></span>` : ''}</div>`;
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

  window.Theme = { deco };
  deco();
})();
