(function () {
  const ID_HEADER = /^(id|id barang|id kas|id transaksi|id penjualan|id pembelian|id pengeluaran|id stok|id master barang)$/i;
  const MAX_COLS = 30;

  // Aturan CSS tetap: kolom ke-N disembunyikan bila <table data-hide-cols="... N ...">.
  // Berlaku otomatis untuk baris baru tanpa perlu memindai ulang ribuan baris lewat JavaScript.
  let css = '';
  for (let n = 1; n <= MAX_COLS; n++) {
    const t = 'table[data-hide-cols~="' + n + '"]';
    css += t + ' > thead > tr > :nth-child(' + n + '),' +
           t + ' > tbody > tr > :nth-child(' + n + '):not([colspan]),' +
           t + ' > tfoot > tr > :nth-child(' + n + '):not([colspan]){display:none !important}';
  }
  const styleEl = document.createElement('style');
  styleEl.id = 'hide-id-columns-style';
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // Hanya membaca baris judul tiap tabel (belasan sel), bukan seluruh isi tabel.
  function hideIdColumns() {
    document.querySelectorAll('table').forEach(function (table) {
      const headerRow = table.querySelector('thead tr');
      if (!headerRow) return;
      const indexes = [];
      Array.from(headerRow.children).forEach(function (cell, index) {
        const label = (cell.textContent || '').replace(/[↑↓↕↗↘↔⇅]/g, '').trim();
        if (ID_HEADER.test(label) && index < MAX_COLS) indexes.push(index + 1);
      });
      const value = indexes.join(' ');
      if (value) { if (table.getAttribute('data-hide-cols') !== value) table.setAttribute('data-hide-cols', value); }
      else if (table.hasAttribute('data-hide-cols')) table.removeAttribute('data-hide-cols');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hideIdColumns);
  } else {
    hideIdColumns();
  }
  let hideScheduled = false;
  function scheduleHideIdColumns() {
    if (hideScheduled) return;
    hideScheduled = true;
    requestAnimationFrame(function () { hideScheduled = false; hideIdColumns(); });
  }
  // Hanya bereaksi bila ada TABEL baru; mengisi baris tabel (TR) tidak memicu apa pun.
  const observer = new MutationObserver(function (mutations) {
    for (const m of mutations) {
      for (const n of m.addedNodes) {
        if (n.nodeType !== 1 || n.nodeName === 'TR' || n.nodeName === 'TD' || n.nodeName === 'TH') continue;
        if (n.nodeName === 'TABLE' || n.nodeName === 'THEAD' || (n.querySelector && n.querySelector('table'))) {
          scheduleHideIdColumns();
          return;
        }
      }
    }
  });
  observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
})();
