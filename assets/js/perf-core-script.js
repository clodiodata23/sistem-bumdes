/* ============================================================
   INTI PERFORMA & KEBENARAN DATA
   - fetchAllRows : ambil data banyak baris (halaman 2..N paralel, urutan stabil)
   - coalesce     : cegah permintaan ganda & hasil lama menimpa hasil baru
   - debounce     : pencarian tidak merender ulang di setiap ketukan
   ============================================================ */
(function () {
  // Ambil SEMUA baris tabel. Halaman pertama membawa jumlah total, sisanya diambil bersamaan.
  // `shape` WAJIB memuat urutan yang unik (tambahkan kunci utama) agar halaman tidak tumpang-tindih.
  const rawFetchAll = async function fetchAllRows(table, columns, shape, pageSize = 1000, concurrency = 4) {
    const build = (withCount) => {
      let q = supabaseClient.from(table).select(columns, withCount ? { count: "exact" } : undefined);
      return typeof shape === "function" ? shape(q) : q;
    };
    const first = await build(true).range(0, pageSize - 1);
    if (first.error) throw new Error(table + ": " + first.error.message);
    const rows = first.data || [];
    if (rows.length < pageSize) return rows;

    const total = Number(first.count);
    if (!Number.isFinite(total)) {
      // Jumlah total tidak tersedia: lanjut berurutan sampai halaman terakhir.
      for (let from = pageSize; ; from += pageSize) {
        const { data, error } = await build(false).range(from, from + pageSize - 1);
        if (error) throw new Error(table + ": " + error.message);
        rows.push(...(data || []));
        if (!data || data.length < pageSize) break;
      }
      return rows;
    }
    const starts = [];
    for (let from = pageSize; from < total; from += pageSize) starts.push(from);
    const pages = new Array(starts.length);
    let next = 0;
    const worker = async () => {
      while (next < starts.length) {
        const i = next++;
        const { data, error } = await build(false).range(starts[i], starts[i] + pageSize - 1);
        if (error) throw new Error(table + ": " + error.message);
        pages[i] = data || [];
      }
    };
    await Promise.all(Array.from({ length: Math.min(concurrency, starts.length) }, worker));
    return rows.concat(...pages);
  };

  // ---- Cache singkat di memori (default 20 detik) ----
  // Tujuan: pindah-pindah menu tidak mengunduh ulang data yang sama.
  // Cache dikosongkan otomatis setiap ada tulis data (insert/update/upsert/delete/rpc)
  // dan saat tombol muat ulang diklik, sehingga data sendiri selalu terbaru.
  const CACHE_TTL = 20000;
  const cache = new Map();
  let dataVersion = 0;
  const dropEntry = (key, p) => { const e = cache.get(key); if (e && e.p === p) cache.delete(key); };
  const cloneResult = (res) => (res && Array.isArray(res.data)) ? Object.assign({}, res, { data: res.data.slice() }) : res;
  window.invalidateDataCache = function () { dataVersion++; cache.clear(); };
  window.cachedRead = function (key, factory, ttl) {
    const hit = cache.get(key);
    if (hit && Date.now() - hit.t < (ttl || CACHE_TTL)) return hit.p.then(cloneResult);
    const version = dataVersion;
    const p = Promise.resolve(factory()).then(
      res => { if ((res && res.error) || version !== dataVersion) dropEntry(key, p); return res; },
      err => { dropEntry(key, p); throw err; }
    );
    cache.set(key, { t: Date.now(), p });
    return p.then(cloneResult);
  };
  // cacheKey WAJIB unik per kombinasi tabel+kolom+filter; tanpa cacheKey tidak ada cache.
  window.fetchAllRows = function (table, columns, shape, pageSize, concurrency, cacheKey) {
    if (!cacheKey) return rawFetchAll(table, columns, shape, pageSize, concurrency);
    return window.cachedRead("all:" + cacheKey, () => rawFetchAll(table, columns, shape, pageSize, concurrency).then(rows => ({ data: rows, error: null }))).then(r => r.data);
  };
  (function patchClientForCache() {
    const c = window.supabaseClient;
    if (!c || c.__cachePatched) return;
    c.__cachePatched = true;
    const bump = window.invalidateDataCache;
    const watch = (res) => {
      if (res && typeof res.then === "function") {
        const t = res.then;
        res.then = function (onF, onR) {
          return t.call(this, v => { bump(); return onF ? onF(v) : v; }, e => { bump(); if (onR) return onR(e); throw e; });
        };
      }
      return res;
    };
    const origFrom = c.from.bind(c);
    c.from = function (table) {
      const qb = origFrom(table);
      ["insert", "update", "upsert", "delete"].forEach(m => {
        const orig = qb[m];
        if (typeof orig !== "function") return;
        qb[m] = function () { bump(); return watch(orig.apply(this, arguments)); };
      });
      return qb;
    };
    const origRpc = c.rpc.bind(c);
    c.rpc = function (name) {
      if (name === "ringkasan_kas") return origRpc.apply(c, arguments);
      bump();
      return watch(origRpc.apply(c, arguments));
    };
  })();
  // Tombol "muat ulang" selalu mengambil data baru dari server.
  document.addEventListener("click", function (e) {
    const b = e.target.closest && e.target.closest("button[onclick]");
    if (b && /\bload[A-Z]\w*\(/.test(b.getAttribute("onclick") || "")) window.invalidateDataCache();
  }, true);

  // Total debit/kredit kas untuk dashboard. Memakai fungsi SQL `ringkasan_kas` bila ada
  // (cepat, 1 baris), jika belum dibuat otomatis memakai cara biasa (tetap benar > 1.000 baris).
  window.ambilKasUntukDashboard = async function () {
    try {
      if (!window.__kasRpcMissing) {
        const { data, error } = await supabaseClient.rpc("ringkasan_kas");
        if (!error && data) {
          const r = Array.isArray(data) ? data[0] : data;
          if (r && r.total_debit !== undefined) return { data: [{ debit: r.total_debit, kredit: r.total_kredit }], error: null };
        }
        if (error && (error.code === "PGRST202" || error.code === "42883" || /could not find the function/i.test(error.message || ""))) {
          window.__kasRpcMissing = true;
        }
      }
      const rows = await fetchAllRows("kas", "debit,kredit", q => q.order("id_kas", { ascending: true }));
      return { data: rows, error: null };
    } catch (e) { return { data: null, error: e }; }
  };

  // Jika fungsi sedang berjalan lalu dipanggil lagi, jangan jalan paralel:
  // tunggu selesai, jalankan SEKALI lagi (data terbaru), semua pemanggil menunggu hasil akhir.
  function coalesce(fn) {
    let running = null, again = false;
    return function () {
      if (running) { again = true; return running; }
      const self = this, args = arguments;
      running = (async () => {
        try { do { again = false; await fn.apply(self, args); } while (again); }
        finally { running = null; }
      })();
      return running;
    };
  }
  [
    "loadDashboard", "loadStok", "loadKas", "loadLaporan", "loadMasterBarang",
    "loadRiwayatStokMasuk", "loadSalesHistory", "loadPurchaseHistory", "loadExpenseHistory",
    "loadSalesProducts", "loadPurchaseProducts"
  ].forEach(name => { if (typeof window[name] === "function") window[name] = coalesce(window[name]); });

  // Pencarian: tunggu pengguna berhenti mengetik sebentar sebelum menyaring ulang tabel besar.
  const timers = {};
  window.filterDebounced = function (name, delay) {
    clearTimeout(timers[name]);
    timers[name] = setTimeout(() => { if (typeof window[name] === "function") window[name](); }, delay || 200);
  };
})();
