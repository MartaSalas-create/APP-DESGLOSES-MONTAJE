/* ==========================================================================
   EXPORTAR A PDF
   Genera un PDF (A4 apaisado) de la pestaña que se está viendo, sin pasar por
   el diálogo de impresión (que la página publicada en claude.ai no permite).
   Se hace una copia «de impresión» de la pestaña (sin botones, con los campos
   convertidos en texto) y se fotografía por páginas, cortando entre filas.
   ========================================================================== */
(function () {
  'use strict';

  const loaded = {};
  function loadScript(src) {
    if (loaded[src]) return loaded[src];
    loaded[src] = new Promise((res, rej) => {
      const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('No se ha podido cargar ' + src));
      document.head.appendChild(s);
    });
    return loaded[src];
  }

  // Convierte los campos de formulario de la copia en texto plano
  function flatten(root) {
    root.querySelectorAll('.no-print, .toolbar, .card-tools, .handle, button.btn, .est-caret, .est-menu, script').forEach(el => el.remove());
    root.querySelectorAll('details').forEach(d => { d.removeAttribute('open'); });
    root.querySelectorAll('textarea').forEach(t => {
      // el texto se reparte en su columna: sin anchos mínimos grandes que obliguen a reducir toda la página
      const d = document.createElement('div'); d.className = 'pdf-text'; d.textContent = t.value || t.textContent || ''; d.style.minWidth = Math.min(parseFloat(getComputedStyle(t).minWidth) || 0, 150) + 'px'; d.style.display = 'block';
      t.replaceWith(d);
    });
    root.querySelectorAll('select').forEach(s => {
      const o = s.options[s.selectedIndex]; const d = document.createElement('span'); d.className = 'pdf-text';
      const sw = s.getBoundingClientRect().width; if (sw) d.style.minWidth = Math.min(sw, 140) + 'px';
      d.textContent = o && o.value !== '' ? o.textContent : '—';
      if (s.className.includes('lbl-bg-')) d.className += ' estado-badge ' + (s.className.match(/lbl-bg-\S+/) || [''])[0];
      s.replaceWith(d);
    });
    root.querySelectorAll('input').forEach(i => {
      if (i.type === 'checkbox') { const d = document.createElement('span'); d.textContent = i.checked ? '✓' : ''; i.replaceWith(d); return; }
      if (i.type === 'file') { i.remove(); return; }
      // el color se conserva como muestra (y no descoloca las rejillas)
      if (i.type === 'color') { const d = document.createElement('span'); d.className = 'pdf-swatch'; d.style.background = i.value; i.replaceWith(d); return; }
      const d = document.createElement('span'); d.className = 'pdf-text'; d.textContent = i.value || '';
      const iw = i.getBoundingClientRect().width; if (iw) d.style.minWidth = Math.min(iw, 200) + 'px';
      i.replaceWith(d);
    });
  }

  async function exportPDF(title, filename, onProgress, opts) {
    opts = opts || {};
    await Promise.all([loadScript('vendor/html2canvas.min.js'), loadScript('vendor/jspdf.umd.min.js')]);
    const { jsPDF } = window.jspdf;
    const src = document.getElementById('main');
    let W = opts.portrait ? 760 : 1400;
    const box = document.createElement('div');
    box.className = 'pdf-root' + (opts.html ? ' pdf-schema' : '');
    box.style.cssText = `position:absolute;left:0;top:0;width:${W}px;background:#fff;z-index:-10;`;
    box.innerHTML = opts.html || src.innerHTML;
    // conservar los valores actuales de los campos (innerHTML copia solo los atributos)
    const srcFields = src.querySelectorAll('textarea, input, select');
    const dstFields = box.querySelectorAll('textarea, input, select');
    if (!opts.html) srcFields.forEach((f, i) => { const d = dstFields[i]; if (!d) return; if (f.tagName === 'SELECT') d.selectedIndex = f.selectedIndex; else if (f.type === 'checkbox') d.checked = f.checked; else d.value = f.value; });
    document.body.appendChild(box);
    try {
      flatten(box);
      await new Promise(r => setTimeout(r, 60));
      // tablas más anchas que la página: se amplía el lienzo y se reduce al ancho del A4
      const wide = opts.html ? 0 : Math.max(box.scrollWidth, ...Array.from(box.querySelectorAll('table')).map(t => t.scrollWidth + 60));
      if (wide > W) { W = Math.min(wide, 3200); box.style.width = W + 'px'; await new Promise(r => setTimeout(r, 30)); }
      const total = box.scrollHeight;
      // A4 apaisado: 297 x 210 mm, márgenes de 8 mm
      const pdf = new jsPDF({ orientation: opts.portrait ? 'portrait' : 'landscape', unit: 'mm', format: 'a4' });
      const mm = opts.portrait ? 194 : 281, pageMmH = opts.portrait ? 277 : 194;
      const pageH = Math.floor(pageMmH / mm * W);                     // alto de página en px CSS
      // posibles cortes: final de filas, fichas, bloques…
      const top0 = box.getBoundingClientRect().top;
      // (nunca justo después de un título, de la cabecera de una tabla o de una fila de apartado: se cortan antes)
      const cuts = Array.from(box.querySelectorAll('tbody tr, .gv-scene, .gv-note, .card, .char-card, .dept, .emo-card, .panel, .field, .merge-item, .note, .legend, .stepline-wrap, .emo-big, .sch-card, .sch-row'))
        .filter(el => !(el.tagName === 'TR' && el.children.length === 1 && el.nextElementSibling))
        .map(el => Math.round(el.getBoundingClientRect().bottom - top0))
        .concat(Array.from(box.querySelectorAll('.sch-block, .sch-row, .sch-struct, h2, h3, table')).map(el => Math.round(el.getBoundingClientRect().top - top0) - 4))
        .filter(y => y > 0 && y < total).sort((a, b) => a - b);
      const pages = []; let y = 0;
      while (y < total - 2) {
        let end = Math.min(total, y + pageH);
        if (end < total) { const c = cuts.filter(v => v > y + pageH * 0.4 && v <= end).pop(); if (c) end = c; }
        pages.push([y, end]); y = end;
      }
      const scale = Math.min(2, 2800 / W) * (pages.length > 20 ? 0.7 : 1);
      const rect = box.getBoundingClientRect();
      for (let i = 0; i < pages.length; i++) {
        const [a, b] = pages[i];
        if (onProgress) onProgress(i + 1, pages.length);
        const canvas = await window.html2canvas(box, {
          scale, backgroundColor: '#ffffff', logging: false, useCORS: true,
          x: rect.left + window.scrollX, y: rect.top + window.scrollY + a, width: W, height: b - a,
          windowWidth: W + 40
        });
        if (i) pdf.addPage();
        const hMm = (b - a) / W * mm;
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 8, 8, mm, hMm, undefined, 'FAST');
        pdf.setFontSize(7); pdf.setTextColor(150);
        if (opts.portrait) pdf.text(`${title} · ${i + 1}/${pages.length}`, 202, 292, { align: 'right' });
        else pdf.text(`${title} · ${i + 1}/${pages.length}`, 289, 205, { align: 'right' });
      }
      return pdf.output('blob');
    } finally {
      box.remove();
    }
  }

  window.PdfExport = { exportPDF };
})();
