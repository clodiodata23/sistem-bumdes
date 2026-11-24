// ============================================================
// SUPABASE
// ============================================================

// const SUPABASE_URL = "https://tspfcbbjjurkbrihubgw.supabase.co/rest/v1/";
const SUPABASE_URL = "https://tspfcbbjjurkbrihubgw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_TNXvYkAj7uMTVao0P78LXw_mhIp_0AS";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_PUBLISHABLE_KEY = SUPABASE_PUBLISHABLE_KEY;
window.supabaseClient = supabaseClient;

// TES KONEKSI SUPABASE
async function testSupabaseConnection() {
  const { data, error } = await supabaseClient
    .from("master_barang")
    .select("id_barang")
    .limit(1);

  if (error) {
    console.error("❌ SUPABASE ERROR:", error);
  } else {
    console.log("✅ SUPABASE TERHUBUNG:", data);
  }
}

// testSupabaseConnection();





  // ============================================================

  // NAVIGASI

  // ============================================================



  function showPage(pageName, button) {

    document.querySelectorAll(".page").forEach(page => {

      page.classList.remove("active");

    });



    const target = document.getElementById("page-" + pageName);

    if (target) target.classList.add("active");



    document.querySelectorAll(".nav button").forEach(btn => {

      btn.classList.remove("active");

    });



    if (button) button.classList.add("active");



    document.getElementById("sidebar").classList.remove("open");



    if (pageName === "stok") {

      loadStok();
      loadRiwayatStokMasuk();

    }

    if (pageName === "master-barang") {

      loadMasterBarang();

    }



    if (pageName === "penjualan") {

      loadSalesProducts();
      loadSalesHistory();

    }



    if (pageName === "pembelian") {

      loadPurchaseHistory();

    }

    if (pageName === "pengeluaran") {

      loadExpenseHistory();

    }

    if (pageName === "kas") {

      loadKas();

    }

    if (pageName === "laporan") {

      loadLaporan();

    }

    if (pageName === "dashboard") {

      loadDashboard();

    }

  }

  function formatHargaInput(input) {
  let angka = input.value.replace(/\D/g, "");

  if (!angka) {
    input.value = "";
    return;
  }

  input.value = "Rp" + Number(angka).toLocaleString("id-ID");
}

function ambilAngkaHarga(value) {
  return Number(String(value).replace(/\D/g, "")) || 0;
}



  function toggleSidebar() {

    document.getElementById("sidebar").classList.toggle("open");

  }

  // Tutup sidebar mobile ketika pengguna mengklik area kosong
  // di luar sidebar dan di luar tombol hamburger.
  document.addEventListener("click", function (event) {

    if (window.innerWidth > 700) return;

    const sidebar = document.getElementById("sidebar");
    const menuButton = document.querySelector(".mobile-menu");

    if (!sidebar || !menuButton) return;

    if (
      sidebar.classList.contains("open") &&
      !sidebar.contains(event.target) &&
      !menuButton.contains(event.target)
    ) {
      sidebar.classList.remove("open");
    }

  });





  // ============================================================

  // CEK KONEKSI

  // ============================================================



  async function cekKoneksi() {
    const status = document.getElementById("connectionStatus");
    const dashboardStatus = document.getElementById("dashboardStatus");

    try {
      const { error } = await supabaseClient
        .from("master_barang")
        .select("id_barang")
        .limit(1);

      if (error) throw error;

      status.textContent = "● Terhubung";
      status.className = "connection ok";
      if (dashboardStatus) {
        dashboardStatus.textContent = "✅ Terhubung ke Supabase.";
      }

    } catch (error) {
      status.textContent = "● Tidak terhubung";
      status.className = "connection error";
      if (dashboardStatus) {
        dashboardStatus.textContent = "❌ Koneksi Supabase gagal.";
      }
      console.error("cekKoneksi Supabase:", error);
    }
  }





  // ============================================================

  // DATA BARANG UNTUK PENJUALAN

  // ============================================================



  let salesProducts = [];

  let salesProductsLoaded = false;



  async function loadSalesProducts() {
    if (salesProductsLoaded) return;

    const searchInput = document.getElementById("salesSearch");
    const list = document.getElementById("salesProductList");
    const info = document.getElementById("salesProductInfo");

    if (!searchInput || !list) return;

    info.textContent = "Memuat daftar barang...";

    try {
      const [
        { data: masterData, error: masterError },
        { data: stokRows, error: stokError }
      ] = await Promise.all([
        supabaseClient
          .from("master_barang")
          .select("id_barang,nama_barang,kategori,satuan,harga_jual,hpp_rata_rata,stok_minimum,status,aktif")
          .eq("aktif", true)
          .order("nama_barang", { ascending: true }),

        supabaseClient
          .from("stok")
          .select("id_barang,stok_awal,barang_masuk,terjual,stok_akhir")
      ]);

      if (masterError) throw masterError;
      if (stokError) throw stokError;

      const stokMap = new Map(
        (stokRows || []).map(x => [String(x.id_barang), x])
      );

      salesProducts = (masterData || []).map(item => {
        const stok = stokMap.get(String(item.id_barang));

        return {
          idBarang: item.id_barang,
          namaBarang: item.nama_barang,
          kategori: item.kategori,
          satuan: item.satuan,

          // Harga dan HPP berasal dari MASTER BARANG
          hargaJual: Number(item.harga_jual) || 0,
          hpp: Number(item.hpp_rata_rata) || 0,
          stokMinimum: Number(item.stok_minimum) || 0,
          status: item.status || "",

          // Pergerakan stok berasal dari tabel STOK
          stokAwal: stok ? Number(stok.stok_awal) || 0 : 0,
          barangMasuk: stok ? Number(stok.barang_masuk) || 0 : 0,
          terjual: stok ? Number(stok.terjual) || 0 : 0,
          stokAkhir: stok ? Number(stok.stok_akhir) || 0 : 0,

          aktif: item.aktif !== false
        };
      });

      salesProductsLoaded = true;

      info.textContent = salesProducts.length
        ? "Ketik nama barang untuk mencari, lalu pilih dari daftar."
        : "Belum ada data barang.";

    } catch (error) {
      info.textContent =
        "❌ Daftar barang gagal dimuat: " +
        (error.message || "Error");

      console.error(
        "SUPABASE SALES PRODUCTS ERROR:",
        error
      );
    }
  }

  function getSalesCartQty(idBarang) {
    return salesCart.reduce((sum, row) => sum + (String(row.idBarang) === String(idBarang) ? (Number(row.qty) || 0) : 0), 0);
  }

  function getSalesAvailableStock(productOrId) {
    const idBarang = typeof productOrId === "object" ? productOrId?.idBarang : productOrId;
    const product = typeof productOrId === "object"
      ? productOrId
      : salesProducts.find(row => String(row.idBarang) === String(idBarang));
    const stock = Math.max(0, Number(product?.stokAkhir) || 0);
    return Math.max(0, stock - getSalesCartQty(idBarang));
  }

  function renderSalesProductList(keyword = "") {

    const list = document.getElementById("salesProductList");

    if (!list) return;



    const q = String(keyword || "").trim().toLowerCase();

    const filtered = salesProducts.filter(item =>

      String(item.namaBarang || "").toLowerCase().includes(q) ||

      String(item.idBarang || "").toLowerCase().includes(q)

    );



    if (!filtered.length) {

      list.innerHTML = '<div style="padding:14px;color:#6b7b73;">Barang tidak ditemukan.</div>';

      list.hidden = false;

      return;

    }



    list.innerHTML = filtered.map(item => {

      const stok = Number(item.stokAkhir) || 0;
      const sudahDiKeranjang = getSalesCartQty(item.idBarang);
      const tersedia = getSalesAvailableStock(item);
      const stockText = tersedia > 0
        ? `Tersedia: ${formatNumber(tersedia)}${sudahDiKeranjang ? ` (di daftar ${formatNumber(sudahDiKeranjang)})` : ""}`
        : (sudahDiKeranjang > 0 ? `Stok habis • ${formatNumber(sudahDiKeranjang)} di daftar` : "Stok habis");
      const stockClass = tersedia <= 0 ? "is-empty" : (sudahDiKeranjang > 0 ? "is-reserved" : "");



      return `

        <button type="button" class="sales-product-option" data-id="${escapeHtml(item.idBarang)}">

          <span>

            <span class="sales-product-name">${escapeHtml(item.namaBarang)}</span>

            <span class="sales-product-id">${escapeHtml(item.idBarang)}</span>

          </span>

          <span class="sales-product-meta">
            <span class="sales-product-price">${escapeHtml(formatRupiah(item.hargaJual))}</span>
            <span class="sales-product-stock ${stockClass}">${escapeHtml(stockText)}</span>
          </span>

        </button>`;

    }).join("");



    list.querySelectorAll(".sales-product-option").forEach(button => {

      button.addEventListener("click", function() {

        selectSalesProduct(this.dataset.id);

      });

    });



    list.hidden = false;

  }



  function selectSalesProduct(idBarang) {

    const item = salesProducts.find(x => String(x.idBarang) === String(idBarang));

    if (!item) return;



    document.getElementById("idBarang").value = item.idBarang;

    document.getElementById("salesSearch").value = item.namaBarang;

    document.getElementById("salesProductList").hidden = true;



    const info = document.getElementById("salesProductInfo");
    const stokAwal = Number(item.stokAkhir) || 0;
    const diKeranjang = getSalesCartQty(item.idBarang);
    const stok = getSalesAvailableStock(item);

    if (stok <= 0) {
      info.className = "sales-product-info warning";
      info.textContent = diKeranjang > 0
        ? `⚠️ ${item.namaBarang}: stok tersedia 0. ${formatNumber(diKeranjang)} sudah ada di daftar belanja.`
        : `⚠️ ${item.namaBarang} sedang habis.`;
    } else {
      info.className = "sales-product-info selected";
      info.textContent = `✓ ${item.namaBarang} dipilih • Tersedia: ${formatNumber(stok)}${diKeranjang ? ` • ${formatNumber(diKeranjang)} sudah di daftar` : ""}`;
    }

  }



  function clearSalesProductSelection() {

    document.getElementById("idBarang").value = "";

    document.getElementById("salesProductInfo").className = "sales-product-info";

    document.getElementById("salesProductInfo").textContent = "Pilih barang dari daftar.";

  }



  // ============================================================

  // EVENT PENCARIAN BARANG

  // ============================================================



  document.getElementById("salesSearch").addEventListener("focus", async function() {

    await loadSalesProducts();

    renderSalesProductList(this.value);

  });



  document.getElementById("salesSearch").addEventListener("input", async function() {

    clearSalesProductSelection();

    await loadSalesProducts();

    renderSalesProductList(this.value);

  });



  document.addEventListener("click", function(event) {

    const picker = document.getElementById("salesProductPicker");

    const list = document.getElementById("salesProductList");

    if (picker && list && !picker.contains(event.target)) {

      list.hidden = true;

    }

  });





  // ============================================================


  // ============================================================
  // KASIR PENJUALAN MULTI-BARANG
  // Harga jual dan HPP selalu mengikuti Master Barang.
  // ============================================================

  const MAX_SALES_CART_ITEMS = 80;
  const SALES_STOCK_UPDATE_BATCH_SIZE = 40;
  let salesCart = [];
  let lastSalesReceipt = null;

  function salesCartTotal() {
    return salesCart.reduce((sum, item) => sum + (Number(item.qty) || 0) * (Number(item.hargaJual) || 0), 0);
  }

  function renderSalesCart() {
    const body = document.getElementById("salesCartBody");
    const count = document.getElementById("salesCartCount");
    const total = document.getElementById("salesCartTotal");
    const checkout = document.getElementById("salesCheckoutButton");
    if (!body || !count || !total || !checkout) return;

    count.textContent = `${salesCart.length}/${MAX_SALES_CART_ITEMS} jenis barang`;
    total.textContent = formatRupiah(salesCartTotal());
    checkout.disabled = salesCart.length === 0;

    if (!salesCart.length) {
      body.innerHTML = '<tr><td colspan="4" class="empty-state">Belum ada barang dalam daftar belanja.</td></tr>';
      return;
    }

    body.innerHTML = salesCart.map((item, index) => `
      <tr>
        <td><strong>${escapeHtml(item.namaBarang)}</strong><span class="sales-cart-stock-note">${formatRupiah(item.hargaJual)} / ${escapeHtml(item.satuan || "unit")}</span></td>
        <td><input class="sales-cart-qty" type="number" min="1" step="1" value="${Number(item.qty)}" aria-label="Jumlah ${escapeHtml(item.namaBarang)}" data-cart-index="${index}"></td>
        <td style="text-align:right"><strong>${formatRupiah(Number(item.qty) * Number(item.hargaJual))}</strong></td>
        <td><button type="button" class="sales-cart-remove" data-remove-index="${index}">Hapus</button></td>
      </tr>
    `).join("");

    body.querySelectorAll(".sales-cart-qty").forEach(input => {
      input.addEventListener("change", function() {
        const index = Number(this.dataset.cartIndex);
        const qty = Math.floor(Number(this.value));
        if (!Number.isFinite(qty) || qty < 1 || !salesCart[index]) {
          this.value = salesCart[index]?.qty || 1;
          return;
        }
        const item = salesCart[index];
        const product = salesProducts.find(p => String(p.idBarang) === String(item.idBarang));
        const stock = Number(product?.stokAkhir) || 0;
        const otherQty = salesCart.reduce((sum, row, i) => sum + (i === index ? 0 : (String(row.idBarang) === String(item.idBarang) ? Number(row.qty) : 0)), 0);
        if (qty + otherQty > stock) {
          alert(`Stok ${item.namaBarang} hanya ${formatNumber(stock)}.`);
          this.value = item.qty;
          return;
        }
        item.qty = qty;
        renderSalesCart();
      });
    });

    const search = document.getElementById("salesSearch");
    const productList = document.getElementById("salesProductList");
    if (search && productList && !productList.hidden) renderSalesProductList(search.value);

    body.querySelectorAll(".sales-cart-remove").forEach(button => {
      button.addEventListener("click", function() {
        salesCart.splice(Number(this.dataset.removeIndex), 1);
        renderSalesCart();
      });
    });
  }

  // Tombol pada form hanya menambahkan barang ke daftar, belum menyimpan transaksi.
  document.getElementById("salesForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const result = document.getElementById("salesResult");
    const idBarang = document.getElementById("idBarang").value.trim();
    const qty = Math.floor(Number(document.getElementById("qty").value));
    const product = salesProducts.find(x => String(x.idBarang) === String(idBarang));

    if (!idBarang || !product) {
      result.className = "result error";
      result.textContent = "Pilih barang dari hasil pencarian terlebih dahulu.";
      return;
    }
    if (!Number.isFinite(qty) || qty < 1) {
      result.className = "result error";
      result.textContent = "Masukkan jumlah barang minimal 1.";
      return;
    }

    const current = salesCart.find(x => String(x.idBarang) === String(idBarang));
    if (!current && salesCart.length >= MAX_SALES_CART_ITEMS) {
      result.className = "result error";
      result.textContent = `Daftar belanja sudah mencapai batas ${MAX_SALES_CART_ITEMS} jenis barang dalam satu nota. Simpan transaksi ini terlebih dahulu untuk membuat nota berikutnya.`;
      return;
    }
    const requestedQty = qty + (current ? Number(current.qty) : 0);
    const available = Number(product.stokAkhir) || 0;
    if (requestedQty > available) {
      result.className = "result error";
      result.textContent = `Stok ${product.namaBarang} tidak mencukupi. Tersedia ${formatNumber(available)}.`;
      return;
    }

    if (current) {
      current.qty = requestedQty;
    } else {
      salesCart.push({
        idBarang: product.idBarang,
        namaBarang: product.namaBarang,
        satuan: product.satuan || "",
        hargaJual: Number(product.hargaJual) || 0,
        hpp: Number(product.hpp) || 0,
        qty
      });
    }

    result.className = "result";
    result.textContent = `${product.namaBarang} ditambahkan ke daftar belanja.`;
    document.getElementById("salesSearch").value = "";
    document.getElementById("qty").value = "";
    clearSalesProductSelection();
    renderSalesCart();
    document.getElementById("salesSearch").focus();
  });

  function createSalesReceiptHtml(receipt) {
    const rows = receipt.items.map((item, index) => `
      <tr>
        <td style="width:6mm;padding:4px 2px 4px 0;vertical-align:top;text-align:left">${index + 1}.</td>
        <td style="padding:4px 2px;vertical-align:top;overflow-wrap:anywhere">${escapeHtml(item.namaBarang)}<br><small>${formatNumber(item.qty)} ${escapeHtml(item.satuan || "")} × ${formatRupiah(item.hargaJual)}</small></td>
        <td style="width:27mm;padding:4px 0 4px 2px;text-align:right;white-space:nowrap;vertical-align:top">${formatRupiah(item.qty * item.hargaJual)}</td>
      </tr>
    `).join("");
    return `
      <div id="salesReceiptPrint" style="font-family:Arial,sans-serif;color:#111;width:48mm;max-width:48mm;margin:0;padding:0;font-size:11px">
        <div style="text-align:center">
          <div style="font-size:13px;font-weight:700;margin:0 0 2px">BUMDes Sidang Jaya</div>
          <div>Kampung Sidang Jaya</div>
          <div style="font-size:12px;margin-top:4px">NOTA PENJUALAN</div>
        </div>
        <hr style="border:0;border-top:1px dashed #555;margin:7px 0">
        <div style="font-size:12px;display:flex;justify-content:space-between;gap:12px"><span>No. Nota</span><strong>${escapeHtml(receipt.noNota)}</strong></div>
        <div style="font-size:12px;display:flex;justify-content:space-between;gap:12px;margin-top:5px"><span>Tanggal</span><span>${escapeHtml(receipt.tanggalDisplay)}</span></div>
        <div style="font-size:12px;display:flex;justify-content:space-between;gap:12px;margin-top:5px"><span>Pembayaran</span><span>${escapeHtml(receipt.pembayaran)}</span></div>
        <hr style="border:0;border-top:1px dashed #555;margin:7px 0">
        <table style="width:100%;border-collapse:collapse;font-size:12px;table-layout:fixed">
          <thead><tr><th style="width:6mm;text-align:left;padding:5px 2px 5px 0">No.</th><th style="text-align:left;padding:5px 2px">Barang</th><th style="width:27mm;text-align:right;padding:5px 0 5px 2px">Subtotal</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <hr style="border:0;border-top:1px dashed #555;margin:7px 0">
        <div style="display:flex;justify-content:space-between;font-weight:bold;font-size:12px"><span>TOTAL</span><span>${formatRupiah(receipt.total)}</span></div>
        ${receipt.dibayar !== null ? `<div style="display:flex;justify-content:space-between;font-size:12px;margin-top:6px"><span>DIBAYAR</span><span>${formatRupiah(receipt.dibayar)}</span></div><div style="display:flex;justify-content:space-between;font-size:12px;margin-top:4px"><span>KEMBALIAN</span><strong>${formatRupiah(receipt.kembalian)}</strong></div>` : ""}
        ${receipt.keterangan ? `<div style="font-size:12px;margin-top:10px">Keterangan: ${escapeHtml(receipt.keterangan)}</div>` : ""}
        <div style="text-align:center;font-size:12px;margin-top:9px">Terima kasih telah berbelanja.</div>
      </div>`;
  }

  // ============================================================
  // CETAK LANGSUNG VIA BLUETOOTH (Web Bluetooth + ESC/POS)
  // Tanpa dialog cetak Android dan tanpa membuka aplikasi Cleanter.
  // Syarat: Chrome Android, situs HTTPS, printer BLE (Bluetooth 4.0+).
  // ============================================================
  const BT_PRINTER = { device: null, characteristic: null };
  const BT_SAVED_ID_KEY = "bumdesBtPrinterId";
  const BT_SERVICES = [
    "000018f0-0000-1000-8000-00805f9b34fb",
    "0000ff00-0000-1000-8000-00805f9b34fb",
    "0000ffe0-0000-1000-8000-00805f9b34fb",
    "0000fee7-0000-1000-8000-00805f9b34fb",
    "0000ae30-0000-1000-8000-00805f9b34fb",
    "0000fff0-0000-1000-8000-00805f9b34fb",
    "0000ffe5-0000-1000-8000-00805f9b34fb",
    "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
    "49535343-fe7d-4ae5-8fa9-9fafd205e455",
    "00001101-0000-1000-8000-00805f9b34fb"
  ];

  function buildEscPosReceipt(receipt) {
    const W = 32; // 58 mm (area cetak 48 mm) = 32 karakter per baris
    const bytes = [];
    const clean = s => String(s ?? "").replace(/[\r\n]+/g, " ").replace(/[\u00a0\u202f]/g, " ").replace(/\u00d7/g, "x").replace(/[^\x20-\x7E]/g, "?").trim();
    const money = v => clean(formatRupiah(Number(v) || 0));
    const raw = (...b) => { for (const x of b) bytes.push(x); };
    const text = s => { for (const ch of s) bytes.push(ch.charCodeAt(0)); };
    const line = (s = "") => { text(s); raw(0x0A); };
    const wrap = (s, w) => {
      const out = []; let cur = "";
      for (let word of clean(s).split(" ")) {
        while (word.length > w) { if (cur) { out.push(cur); cur = ""; } out.push(word.slice(0, w)); word = word.slice(w); }
        if (!cur) cur = word;
        else if ((cur + " " + word).length <= w) cur += " " + word;
        else { out.push(cur); cur = word; }
      }
      if (cur) out.push(cur);
      return out.length ? out : [""];
    };
    const lr = (l, r) => {
      l = clean(l); r = clean(r);
      const gap = W - l.length - r.length;
      if (gap >= 1) return [l + " ".repeat(gap) + r];
      return [...wrap(l, W), " ".repeat(Math.max(0, W - r.length)) + r];
    };
    const align = n => raw(0x1B, 0x61, n);  // 0 kiri, 1 tengah
    const bold = on => raw(0x1B, 0x45, on ? 1 : 0);
    const dash = () => line("-".repeat(W));

    raw(0x1B, 0x40);            // reset printer
    align(1); bold(true);
    wrap("BUMDes Sidang Jaya", W).forEach(line);
    bold(false);
    line("Kampung Sidang Jaya");
    line("NOTA PENJUALAN");
    align(0); dash();
    lr("No. Nota", receipt.noNota).forEach(line);
    lr("Tanggal", receipt.tanggalDisplay).forEach(line);
    lr("Pembayaran", receipt.pembayaran).forEach(line);
    dash();
    (receipt.items || []).forEach((item, i) => {
      wrap((i + 1) + ". " + item.namaBarang, W).forEach(line);
      const qty = formatNumber(item.qty) + (item.satuan ? " " + item.satuan : "");
      const sub = (Number(item.qty) || 0) * (Number(item.hargaJual) || 0);
      lr("  " + qty + " x " + money(item.hargaJual), money(sub)).forEach(line);
    });
    dash();
    bold(true); lr("TOTAL", money(receipt.total)).forEach(line); bold(false);
    if (receipt.dibayar !== null && receipt.dibayar !== undefined) {
      lr("Dibayar", money(receipt.dibayar)).forEach(line);
      lr("Kembalian", money(receipt.kembalian)).forEach(line);
    }
    if (receipt.keterangan) wrap("Catatan: " + receipt.keterangan, W).forEach(line);
    dash();
    align(1); line("Terima kasih telah berbelanja."); align(0);
    raw(0x0A, 0x0A, 0x0A, 0x0A); // jarak agar struk bisa disobek
    return new Uint8Array(bytes);
  }

  async function btConnectWithRetry(device, tries = 3) {
    let lastErr;
    for (let i = 0; i < tries; i++) {
      try {
        if (!device.gatt.connected) await device.gatt.connect();
        return;
      } catch (e) {
        lastErr = e;
        await new Promise(r => setTimeout(r, 600));
      }
    }
    throw lastErr;
  }

  async function btFindWritableCharacteristic(device) {
    await btConnectWithRetry(device);
    let services = [];
    try { services = await device.gatt.getPrimaryServices(); }
    catch (e) { if (!e || e.name !== "NotFoundError") throw e; services = []; }
    for (const service of services) {
      try {
        const chars = await service.getCharacteristics();
        const writable = chars.find(c => c.properties.writeWithoutResponse || c.properties.write);
        if (writable) return writable;
      } catch (_) { /* lanjut ke service berikutnya */ }
    }
    const err = new Error("Printer terhubung, tetapi layanan cetak tidak dikenali. Printer mungkin hanya mendukung Bluetooth klasik atau memakai UUID lain.");
    err.name = "PrinterServiceNotFound";
    throw err;
  }

  function btExplainError(error) {
    const name = (error && error.name) || "";
    const msg = (error && error.message) || "";
    if (name === "NotFoundError" && /cancel/i.test(msg)) return "Pemilihan printer dibatalkan.";
    if (name === "NotFoundError" && /adapter/i.test(msg)) return "Bluetooth HP mati. Nyalakan Bluetooth lalu coba lagi.";
    if (name === "NotFoundError") return "Printer tidak ditemukan. Nyalakan printer, putuskan dari HP lain, dan nyalakan Lokasi.";
    if (name === "SecurityError" || name === "NotAllowedError") return "Izin Bluetooth ditolak. Izinkan 'Perangkat di sekitar' dan 'Lokasi' untuk Chrome.";
    if (name === "NetworkError") return "Gagal terhubung ke printer. Matikan-nyalakan printer lalu coba lagi.";
    return "Gagal cetak Bluetooth: " + (msg || name || "kesalahan tidak diketahui");
  }

  async function btGetPrinter(forceChoose) {
    if (!navigator.bluetooth) throw new Error("Browser ini tidak mendukung Web Bluetooth. Gunakan Chrome di Android (bukan iPhone/Firefox).");
    if (BT_PRINTER.characteristic && BT_PRINTER.device && BT_PRINTER.device.gatt.connected && !forceChoose) return BT_PRINTER.characteristic;

    let device = forceChoose ? null : BT_PRINTER.device;
    if (!device && !forceChoose && navigator.bluetooth.getDevices) {
      try {
        const savedId = localStorage.getItem(BT_SAVED_ID_KEY);
        const list = await navigator.bluetooth.getDevices();
        device = list.find(d => d.id === savedId) || null;
      } catch (_) { device = null; }
    }
    if (!device) {
      device = await navigator.bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: BT_SERVICES });
    }
    try { localStorage.setItem(BT_SAVED_ID_KEY, device.id); } catch (_) {}
    if (BT_PRINTER.device !== device) {
      device.addEventListener("gattserverdisconnected", () => { BT_PRINTER.characteristic = null; });
    }
    BT_PRINTER.device = device;
    BT_PRINTER.characteristic = await btFindWritableCharacteristic(device);
    return BT_PRINTER.characteristic;
  }

  async function btSend(characteristic, data) {
    const CHUNK = 100;
    for (let i = 0; i < data.length; i += CHUNK) {
      const part = data.slice(i, i + CHUNK);
      if (characteristic.properties.writeWithoutResponse && characteristic.writeValueWithoutResponse) await characteristic.writeValueWithoutResponse(part);
      else await characteristic.writeValue(part);
      await new Promise(r => setTimeout(r, 25));
    }
  }

  async function printLastSalesReceipt(forceChoose) {
    if (!lastSalesReceipt) { alert("Data nota belum tersedia."); return; }
    const button = document.getElementById("printSalesReceiptButton");
    const fallbackBtn = document.getElementById("printSalesReceiptDialogButton");
    const status = document.getElementById("salesPrintStatus");
    const setStatus = (message, ok = true) => { if (status) { status.textContent = message; status.style.color = ok ? "#154a62" : "#b42318"; } };
    if (button) { button.disabled = true; button.textContent = "Menghubungkan printer..."; }
    try {
      const characteristic = await btGetPrinter(forceChoose === true);
      setStatus("Mencetak nota...");
      await btSend(characteristic, buildEscPosReceipt(lastSalesReceipt));
      setStatus("✓ Nota terkirim ke printer.");
      if (fallbackBtn) fallbackBtn.hidden = true;
    } catch (error) {
      console.error("BLUETOOTH PRINT ERROR:", error);
      BT_PRINTER.characteristic = null;
      if (error && (error.name === "NetworkError" || error.name === "PrinterServiceNotFound")) {
        // perangkat tersimpan mungkin sudah usang: lupakan agar dialog pilih printer muncul lagi
        try { localStorage.removeItem(BT_SAVED_ID_KEY); } catch (_) {}
        BT_PRINTER.device = null;
      }
      setStatus(btExplainError(error) + (error && error.name ? " [" + error.name + "]" : ""), false);
      if (fallbackBtn) fallbackBtn.hidden = false; // tawarkan cara lama (dialog cetak/Cleanter)
    } finally {
      if (button) { button.disabled = false; button.textContent = "Cetak Struk"; }
    }
  }

  // CADANGAN: cetak lewat dialog cetak Android (Cleanter). Permintaan pertama harus berasal dari
  // sentuhan tombol agar Chrome dapat meminta izin akses aplikasi/perangkat lokal.
  function printLastSalesReceiptViaDialog() {
    if (!lastSalesReceipt) {
      alert("Data nota belum tersedia.");
      return;
    }

    const receipt = lastSalesReceipt;
    const button = document.getElementById("printSalesReceiptButton");
    const status = document.getElementById("salesPrintStatus");
    const setStatus = (message, ok = true) => {
      if (status) {
        status.textContent = message;
        status.style.color = ok ? "#154a62" : "#b42318";
      }
    };

    // Buka jendela cetak langsung di dalam aksi klik agar tidak diblokir Chrome.
    // Metode ini menggunakan Android Print Service, bukan fetch ke localhost.
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      setStatus("Jendela cetak diblokir browser. Izinkan pop-up untuk SIMBUDES lalu coba lagi.", false);
      alert("Jendela cetak tidak dapat dibuka. Izinkan pop-up untuk situs SIMBUDES di Chrome, lalu tekan Cetak Struk kembali.");
      return;
    }

    if (button) {
      button.disabled = true;
      button.textContent = "Membuka dialog cetak...";
    }
    setStatus("Pilih Cleanter pada dialog cetak Android untuk mencetak nota.");

    const esc = value => escapeHtml(String(value ?? "-").replace(/[\r\n]+/g, " ").trim());
    const money = value => formatRupiah(Number(value) || 0);
    const rows = (receipt.items || []).map((item, index) => {
      const qty = formatNumber(item.qty) + (item.satuan ? " " + esc(item.satuan) : "");
      const subtotal = (Number(item.qty) || 0) * (Number(item.hargaJual) || 0);
      return `
        <div class="item">
          <div class="item-name">${index + 1}. ${esc(item.namaBarang)}</div>
          <div class="item-detail">${qty} x ${money(item.hargaJual)}</div>
          <div class="item-subtotal">${money(subtotal)}</div>
        </div>`;
    }).join("");

    const printHtml = `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Nota ${esc(receipt.noNota)}</title>
<style>
  @page { size: 58mm auto; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; color: #111; width: 58mm; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 7.6pt; line-height: 1.18; }
  /* RPP02N memakai kertas 58 mm, tetapi lebar cetak efektif kepala printer 48 mm.
     Sisakan margin ekstra di kanan-kiri untuk menghindari pemotongan dari driver. */
  .receipt { width: 37mm; max-width: 37mm; margin: 0 auto; padding: 0 1mm; }
  .center { text-align: center; }
  .brand { font-size: 8.3pt; font-weight: 700; line-height: 1.15; overflow-wrap: anywhere; }
  .subbrand { font-size: 7.6pt; margin-top: 0.8mm; }
  .doc-title { font-size: 7.6pt; margin-top: 0.8mm; }
  .dash { border: 0; border-top: 1px dashed #444; margin: 1.4mm 0; }
  .meta-row, .total-row { display: grid; grid-template-columns: 12mm minmax(0, 1fr); column-gap: 1mm; align-items: start; margin: 0.7mm 0; width: 100%; }
  .meta-row span:first-child { min-width: 0; }
  .meta-row span:last-child { min-width: 0; text-align: right; overflow-wrap: anywhere; word-break: break-word; }
  .item { padding: 0.7mm 0; width: 100%; min-width: 0; }
  .item-name { font-weight: 600; overflow-wrap: anywhere; word-break: break-word; }
  .item-detail { font-size: 7.3pt; padding-left: 1.5mm; overflow-wrap: anywhere; word-break: break-word; }
  .item-subtotal { text-align: right; font-size: 7.3pt; overflow-wrap: anywhere; word-break: break-word; }
  .total-row { grid-template-columns: 1fr auto; font-size: 7.7pt; font-weight: 700; }
  .total-row span:first-child { min-width: 0; }
  .total-row span:last-child { min-width: 0; text-align: right; white-space: normal; overflow-wrap: anywhere; word-break: break-word; }
  .note { margin-top: 1.2mm; overflow-wrap: anywhere; word-break: break-word; }
  .thanks { text-align: center; margin-top: 1.6mm; font-size: 7.3pt; overflow-wrap: anywhere; }
  @media screen {
    body { padding: 4mm 0; }
    .receipt { margin: 0 auto; }
  }
  @media print {
    html, body { width: 58mm; margin: 0; padding: 0; }
    .receipt { width: 37mm; max-width: 37mm; margin: 0 auto; padding: 0 1mm; }
    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
  <main class="receipt">
    <header class="center">
      <div class="brand">BUMDes Sidang Jaya</div>
      <div class="subbrand">Kampung Sidang Jaya</div>
      <div class="doc-title">NOTA PENJUALAN</div>
    </header>
    <hr class="dash">
    <div class="meta-row"><span>No. Nota</span><span>${esc(receipt.noNota)}</span></div>
    <div class="meta-row"><span>Tanggal</span><span>${esc(receipt.tanggalDisplay)}</span></div>
    <div class="meta-row"><span>Pembayaran</span><span>${esc(receipt.pembayaran)}</span></div>
    <hr class="dash">
    ${rows}
    <hr class="dash">
    <div class="total-row"><span>TOTAL</span><span>${money(receipt.total)}</span></div>
    ${receipt.dibayar !== null && receipt.dibayar !== undefined ? `
      <div class="meta-row"><span>Dibayar</span><span>${money(receipt.dibayar)}</span></div>
      <div class="meta-row"><span>Kembalian</span><span>${money(receipt.kembalian)}</span></div>` : ""}
    ${receipt.keterangan ? `<div class="note">Catatan: ${esc(receipt.keterangan)}</div>` : ""}
    <hr class="dash">
    <div class="thanks">Terima kasih telah berbelanja.</div>
  </main>
<script>
  window.addEventListener("load", function () {
    setTimeout(function () {
      window.focus();
      window.print();
    }, 450);
  });
  window.addEventListener("afterprint", function () {
    setTimeout(function () { window.close(); }, 250);
  });
<\/script>
</body>
</html>`;

    try {
      printWindow.document.open();
      printWindow.document.write(printHtml);
      printWindow.document.close();
      setStatus("Dialog cetak dibuka. Pilih Cleanter sebagai printer dan pastikan ukuran kertas 58 mm.");
    } catch (error) {
      console.error("PRINT SERVICE ERROR:", error);
      printWindow.close();
      setStatus("Tidak dapat membuka dialog cetak: " + (error.message || "kesalahan browser"), false);
      alert("Tidak dapat membuka dialog cetak. Coba buka SIMBUDES melalui Chrome, bukan dari pratinjau aplikasi.");
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = "Cetak Struk";
      }
    }
  }

  // Format nominal pembayaran dengan pemisah ribuan Indonesia saat diketik.
  document.getElementById("salesPaidAmount").addEventListener("input", function() {
    const digits = this.value.replace(/\D/g, "");
    this.value = digits ? Number(digits).toLocaleString("id-ID") : "";
  });

  document.getElementById("salesCheckoutButton").addEventListener("click", async function() {
    const button = this;
    const result = document.getElementById("salesResult");
    const tanggalInput = document.getElementById("salesTanggal").value;
    const pembayaran = document.getElementById("pembayaran").value || "Tunai";
    const keterangan = document.getElementById("keterangan").value.trim();
    const linkNota = document.getElementById("linkNota").value.trim();
    const paidRaw = document.getElementById("salesPaidAmount").value.trim();
    const paidDigits = paidRaw.replace(/\D/g, "");
    const paidAmount = paidDigits === "" ? null : Number(paidDigits);

    if (paidAmount !== null && (!Number.isFinite(paidAmount) || paidAmount < 0)) {
      result.className = "result error"; result.textContent = "Nilai Dibayar harus berupa angka nol atau lebih."; return;
    }
    if (!salesCart.length) {
      result.className = "result error";
      result.textContent = "Daftar belanja masih kosong.";
      return;
    }
    if (!tanggalInput) {
      result.className = "result error";
      result.textContent = "Pilih tanggal transaksi terlebih dahulu.";
      document.getElementById("salesTanggal").focus();
      return;
    }

    button.disabled = true;
    button.textContent = "Memeriksa stok & menyimpan...";
    result.className = "result";
    result.textContent = "";

    const invoiceDate = String(tanggalInput).replaceAll("-", "");
    const noNota = `INV-${invoiceDate}-${String(Date.now()).slice(-6)}`;
    const tanggal = tanggalInputKeISO(tanggalInput);
    const insertedIds = [];
    const stockBackups = [];
    const stockApplied = []; // hanya barang yang stoknya benar-benar sudah berubah
    let stockUpdatesStarted = false;

    try {
      // Ambil ulang data master dan stok agar harga/HPP/stok terkini dipakai.
      const ids = salesCart.map(item => item.idBarang);
      const [{ data: masterRows, error: masterError }, { data: stockRows, error: stockError }] = await Promise.all([
        supabaseClient.from("master_barang")
          .select("id_barang,nama_barang,satuan,harga_jual,hpp_rata_rata,aktif")
          .in("id_barang", ids),
        supabaseClient.from("stok")
          .select("id_barang,stok_awal,barang_masuk,terjual,stok_akhir")
          .in("id_barang", ids)
      ]);
      if (masterError) throw masterError;
      if (stockError) throw stockError;

      const masterMap = new Map((masterRows || []).map(row => [String(row.id_barang), row]));
      const stockMap = new Map((stockRows || []).map(row => [String(row.id_barang), row]));

      const finalizedItems = salesCart.map(item => {
        const master = masterMap.get(String(item.idBarang));
        const stock = stockMap.get(String(item.idBarang));
        if (!master || master.aktif === false) throw new Error(`Barang ${item.namaBarang} tidak aktif atau tidak ditemukan di Master Barang.`);
        if (!stock) throw new Error(`Data stok ${item.namaBarang} tidak ditemukan.`);
        const qty = Number(item.qty) || 0;
        const available = Number(stock.stok_akhir) || 0;
        if (qty > available) throw new Error(`Stok ${master.nama_barang} tidak mencukupi. Stok terkini: ${formatNumber(available)}.`);
        const hargaJual = Number(master.harga_jual) || 0;
        const hpp = Number(master.hpp_rata_rata) || 0;
        return {
          idBarang: master.id_barang,
          namaBarang: master.nama_barang,
          satuan: master.satuan || "",
          qty,
          hargaJual,
          hpp,
          total: qty * hargaJual,
          totalHpp: qty * hpp,
          laba: qty * (hargaJual - hpp),
          stockBefore: stock,
          stockAfter: (Number(stock.stok_akhir) || 0) - qty,
          soldAfter: (Number(stock.terjual) || 0) + qty
        };
      });

      const invoiceTotal = finalizedItems.reduce((sum, item) => sum + item.total, 0);
      if (paidAmount !== null && paidAmount < invoiceTotal) throw new Error(`Jumlah dibayar kurang dari total belanja (${formatRupiah(invoiceTotal)}).`);
      const invoiceKeterangan = `Nota ${noNota}${keterangan ? " | " + keterangan : ""}${linkNota ? " | Link nota: " + linkNota : ""}`;

      // Siapkan semua baris dengan ID unik, lalu kirim dalam SATU insert.
      // Semua hingga 80 jenis barang dikirim dalam satu bulk insert untuk satu nota.
      const penjualanPayload = finalizedItems.map((item, index) => ({
        id_penjualan: `PJL${Date.now()}${String(index).padStart(3, "0")}${Math.random().toString(36).slice(2, 8)}`,
        tanggal,
        id_barang: item.idBarang,
        nama_barang: item.namaBarang,
        qty: item.qty,
        hpp: item.hpp,
        harga_jual: item.hargaJual,
        total_penjualan: item.total,
        laba_kotor: item.laba,
        pembayaran,
        keterangan: invoiceKeterangan,
        nama_penginput: window.bumdesCurrentName || window.bumdesCurrentUser?.email || "Pengguna",
        id_penginput: window.bumdesCurrentUser?.id || null
      }));
      insertedIds.push(...penjualanPayload.map(row => row.id_penjualan));

      const { error: insertError } = await supabaseClient
        .from("penjualan")
        .insert(penjualanPayload);
      if (insertError) throw insertError;

      // Simpan snapshot seluruh stok sebelum mulai update.
      // Jika ada update yang gagal, semua snapshot akan dipulihkan.
      stockBackups.push(...finalizedItems.map(item => ({
        idBarang: item.idBarang,
        original: item.stockBefore
      })));
      stockUpdatesStarted = true;

      // Update stok tiap barang secara paralel dan tunggu SEMUA hasilnya.
      // Promise.allSettled mencegah proses rollback berjalan saat request lain
      // masih belum selesai.
      // Update stok bersyarat: hanya berhasil bila stok di database masih sama dengan yang tadi dibaca.
      // Jika kasir lain baru saja menjual barang yang sama, update ditolak (bukan menimpa diam-diam).
      const eqNilai = (q, kolom, nilai) => nilai === null || nilai === undefined ? q.is(kolom, null) : q.eq(kolom, nilai);
      for (let start = 0; start < finalizedItems.length; start += SALES_STOCK_UPDATE_BATCH_SIZE) {
        const batch = finalizedItems.slice(start, start + SALES_STOCK_UPDATE_BATCH_SIZE);
        const stockUpdateResults = await Promise.allSettled(batch.map(async item => {
          const { data: updated, error } = await eqNilai(
            supabaseClient.from("stok").update({
              terjual: item.soldAfter,
              stok_akhir: item.stockAfter
            }).eq("id_barang", item.idBarang),
            "stok_akhir", item.stockBefore.stok_akhir
          ).select("id_barang");
          if (error) throw error;
          if (!updated || !updated.length) throw new Error(`Stok ${item.namaBarang} baru saja berubah oleh transaksi lain. Silakan simpan ulang.`);
          stockApplied.push(item);
        }));
        const stockUpdateFailure = stockUpdateResults.find(result => result.status === "rejected");
        if (stockUpdateFailure) throw stockUpdateFailure.reason;
      }
      lastSalesReceipt = {
        noNota,
        tanggalDisplay: formatHistoryDate(tanggal),
        pembayaran,
        keterangan,
        items: finalizedItems,
        total: invoiceTotal,
        dibayar: paidAmount,
        kembalian: paidAmount === null ? null : paidAmount - invoiceTotal
      };

      result.className = "result success";
      result.innerHTML = `✅ Transaksi berhasil disimpan. Nomor nota: <strong>${escapeHtml(noNota)}</strong>.`;
      document.getElementById("salesReceiptModalContent").innerHTML = createSalesReceiptHtml(lastSalesReceipt);

      salesCart = [];
      renderSalesCart();
      document.getElementById("salesForm").reset();
      document.getElementById("salesPaidAmount").value = "";
      clearSalesProductSelection();
      salesProductsLoaded = false;
      salesProducts = [];
      // Tampilkan nota LANGSUNG setelah transaksi tersimpan (tanpa menunggu refresh data).
      // Modal berada di <body> dengan position:fixed, jadi perubahan layout halaman tidak menggeser modal.
      const receiptModal = document.getElementById("salesReceiptModal");
      if (receiptModal.parentElement !== document.body) document.body.appendChild(receiptModal);
      receiptModal.hidden = false;
      document.body.classList.add("sales-receipt-open");
      receiptModal.scrollTop = 0;
      const receiptCard = receiptModal.querySelector(".sales-receipt-modal-card");
      if (receiptCard) receiptCard.scrollTop = 0;
      // Penyegaran tampilan berjalan di latar belakang, paralel.
      // Kegagalan refresh tidak boleh membatalkan transaksi yang sudah berhasil.
      Promise.allSettled([
        Promise.resolve().then(() => loadSalesHistory()),
        Promise.resolve().then(() => refreshCrudViews())
      ]).then(results => results.forEach(r => {
        if (r.status === "rejected") console.error("Refresh tampilan gagal:", r.reason);
      }));
    } catch (error) {
      // Jika proses inti gagal, pulihkan stok yang sempat dicoba diperbarui
      // dan hapus baris penjualan yang dibuat untuk nota ini.
      if (stockUpdatesStarted && stockApplied.length) {
        // Pulihkan hanya barang yang sempat berubah, dan hanya jika belum diubah pihak lain.
        const rollbackResults = await Promise.allSettled(stockApplied.map(async item => {
          const { error: rollbackError } = await supabaseClient.from("stok").update({
            terjual: item.stockBefore.terjual,
            stok_akhir: item.stockBefore.stok_akhir
          }).eq("id_barang", item.idBarang).eq("stok_akhir", item.stockAfter);
          if (rollbackError) throw rollbackError;
        }));
        rollbackResults.forEach(result => {
          if (result.status === "rejected") console.error("Rollback stok gagal:", result.reason);
        });
      }
      if (insertedIds.length) {
        try {
          await supabaseClient.from("penjualan").delete().in("id_penjualan", insertedIds);
        } catch (rollbackError) {
          console.error("Rollback penjualan gagal:", rollbackError);
        }
      }
      result.className = "result error";
      result.textContent = "❌ " + (error.message || "Gagal menyimpan transaksi.");
      console.error("SUPABASE KASIR ERROR:", error);
    } finally {
      button.disabled = salesCart.length === 0;
      button.textContent = "Simpan Transaksi & Buat Nota";
    }
  });

  (function(){ const m = document.getElementById("salesReceiptModal"); if (m && m.parentElement !== document.body) document.body.appendChild(m); })();
  document.getElementById("printSalesReceiptButton").addEventListener("click", () => printLastSalesReceipt(false));
  document.getElementById("changeBtPrinterButton").addEventListener("click", () => printLastSalesReceipt(true));
  document.getElementById("printSalesReceiptDialogButton").addEventListener("click", printLastSalesReceiptViaDialog);
  function closeSalesReceiptModal() { document.getElementById("salesReceiptModal").hidden = true; document.body.classList.remove("sales-receipt-open"); }
  document.getElementById("closeSalesReceiptModal").addEventListener("click", closeSalesReceiptModal);
  document.getElementById("skipPrintSalesReceiptButton").addEventListener("click", closeSalesReceiptModal);
  document.getElementById("salesReceiptModal").addEventListener("click", function(event) { if (event.target === this) closeSalesReceiptModal(); });

  renderSalesCart();

  // DATA BARANG UNTUK BARANG MASUK

  // ============================================================



  let purchaseProducts = [];

  let purchaseProductsLoaded = false;



  async function loadPurchaseProducts() {
    if (purchaseProductsLoaded) return;
    const searchInput = document.getElementById("purchaseSearch");
    const list = document.getElementById("purchaseProductList");
    const info = document.getElementById("purchaseProductInfo");
    if (!searchInput || !list) return;
    info.textContent = "Memuat daftar barang...";
    try {
      const [{ data: masterData, error: masterError }, { data: stokRows, error: stokError }] = await Promise.all([
        supabaseClient.from("master_barang").select("id_barang,nama_barang,kategori,satuan,harga_jual,hpp_rata_rata,aktif").eq("aktif", true).order("nama_barang", { ascending: true }),
        supabaseClient.from("stok").select("id_barang,stok_awal,barang_masuk,terjual,stok_akhir")
      ]);
      if (masterError) throw masterError;
      if (stokError) throw stokError;
      const stokMap = new Map((stokRows || []).map(x => [String(x.id_barang), x]));
      purchaseProducts = (masterData || []).map(item => { const stok = stokMap.get(String(item.id_barang)); return {
        idBarang: item.id_barang, namaBarang: item.nama_barang, kategori: item.kategori, satuan: item.satuan,
        hargaJual: Number(item.harga_jual) || 0, hpp: Number(item.hpp_rata_rata) || 0,
        // stokAwal: stok ? Number(stok.stok_awal) || 0 : 0, barangMasuk: stok ? Number(stok.barang_masuk) || 0 : 0,
        // terjual: stok ? Number(stok.terjual) || 0 : 0, stokAkhir: stok ? Number(stok.stok_akhir) || 0 : 0,
        // status: stok?.status || "HABIS", aktif: item.aktif !== false
        stokAwal: stok ? Number(stok.stok_awal) || 0 : 0,
barangMasuk: stok ? Number(stok.barang_masuk) || 0 : 0,
terjual: stok ? Number(stok.terjual) || 0 : 0,
stokAkhir: stok ? Number(stok.stok_akhir) || 0 : 0,
status: item.status || "HABIS",
aktif: item.aktif !== false
      }; });
      purchaseProductsLoaded = true;
      info.textContent = purchaseProducts.length ? "Ketik nama barang untuk mencari, lalu pilih dari daftar." : "Belum ada data barang.";
    } catch (error) { info.textContent = "❌ Daftar barang gagal dimuat: " + (error.message || "Error"); console.error("SUPABASE PURCHASE PRODUCTS ERROR:", error); }
  }

  function renderPurchaseProductList(keyword = "") {

    const list = document.getElementById("purchaseProductList");

    if (!list) return;



    const q = String(keyword || "").trim().toLowerCase();

    const filtered = purchaseProducts.filter(item =>

      String(item.namaBarang || "").toLowerCase().includes(q) ||

      String(item.idBarang || "").toLowerCase().includes(q)

    );



    if (!filtered.length) {

      list.innerHTML = '<div style="padding:14px;color:#6b7b73;">Barang tidak ditemukan.</div>';

      list.hidden = false;

      return;

    }



    list.innerHTML = filtered.map(item => {

      const stok = Number(item.stokAkhir) || 0;

      const stockText = stok > 0 ? `Stok saat ini: ${formatNumber(stok)}` : "Stok saat ini: 0";



      return `

        <button type="button" class="sales-product-option" data-id="${escapeHtml(item.idBarang)}">

          <span>

            <span class="sales-product-name">${escapeHtml(item.namaBarang)}</span>

            <span class="sales-product-id">${escapeHtml(item.idBarang)}</span>

          </span>

          <span class="sales-product-stock">${escapeHtml(stockText)}</span>

        </button>`;

    }).join("");



    list.querySelectorAll(".sales-product-option").forEach(button => {

      button.addEventListener("click", function() {

        selectPurchaseProduct(this.dataset.id);

      });

    });



    list.hidden = false;

  }



  function selectPurchaseProduct(idBarang) {

    const item = purchaseProducts.find(x => String(x.idBarang) === String(idBarang));

    if (!item) return;



    document.getElementById("purchaseIdBarang").value = item.idBarang;

    document.getElementById("purchaseSearch").value = item.namaBarang;

    document.getElementById("purchaseProductList").hidden = true;



    const info = document.getElementById("purchaseProductInfo");

    const stok = Number(item.stokAkhir) || 0;

    info.className = "sales-product-info selected";

    info.textContent = `✓ ${item.namaBarang} dipilih • Stok saat ini: ${formatNumber(stok)}`;

  }



  function clearPurchaseProductSelection() {

    document.getElementById("purchaseIdBarang").value = "";

    document.getElementById("purchaseProductInfo").className = "sales-product-info";

    document.getElementById("purchaseProductInfo").textContent = "Pilih barang dari daftar.";

  }



  document.getElementById("purchaseSearch").addEventListener("focus", async function() {

    await loadPurchaseProducts();

    renderPurchaseProductList(this.value);

  });



  document.getElementById("purchaseSearch").addEventListener("input", async function() {

    clearPurchaseProductSelection();

    await loadPurchaseProducts();

    renderPurchaseProductList(this.value);

  });



  document.addEventListener("click", function(event) {

    const picker = document.getElementById("purchaseProductPicker");

    const list = document.getElementById("purchaseProductList");

    if (picker && list && !picker.contains(event.target)) {

      list.hidden = true;

    }

  });





  // ============================================================

  // SIMPAN BARANG MASUK — SUPABASE + TRIGGER KAS

  // ============================================================



  // Keranjang barang masuk: satu nota dapat berisi banyak barang.
  let purchaseCart = [];
  function renderPurchaseCart() {
    const wrap = document.getElementById("purchaseCartWrap");
    const body = document.getElementById("purchaseCartBody");
    const totalEl = document.getElementById("purchaseCartTotal");
    if (!wrap || !body || !totalEl) return;
    wrap.hidden = purchaseCart.length === 0;
    const count = document.getElementById("purchaseCartCount");
    if (count) count.textContent = `${purchaseCart.length} jenis barang`;
    body.innerHTML = purchaseCart.map((item, i) => `<tr>
      <td>${escapeHtml(item.namaBarang)}</td><td>${formatNumber(item.qty)}</td>
      <td>${formatRupiah(item.hargaBeli)}</td><td>${formatRupiah(item.qty * item.hargaBeli)}</td>
      <td><button type="button" class="btn btn-danger" data-remove-purchase="${i}">Hapus</button></td></tr>`).join("");
    totalEl.textContent = formatRupiah(purchaseCart.reduce((sum, x) => sum + x.qty * x.hargaBeli, 0));
    body.querySelectorAll("[data-remove-purchase]").forEach(btn => btn.addEventListener("click", () => {
      purchaseCart.splice(Number(btn.dataset.removePurchase), 1); renderPurchaseCart();
    }));
  }

  document.getElementById("purchaseAddItemButton").addEventListener("click", async function() {
    const idBarang = document.getElementById("purchaseIdBarang").value.trim();
    const qty = Number(document.getElementById("purchaseQty").value);
    const hargaBeli = ambilAngkaHarga(document.getElementById("purchaseHargaBeli").value);
    const item = purchaseProducts.find(x => String(x.idBarang) === String(idBarang));
    const result = document.getElementById("purchaseResult");
    if (!item || qty <= 0 || hargaBeli <= 0) {
      result.className = "result error"; result.textContent = "Pilih barang, isi jumlah, dan harga beli dengan benar."; return;
    }
    const existing = purchaseCart.find(x => String(x.idBarang) === String(idBarang));
    if (existing) { existing.qty += qty; existing.hargaBeli = hargaBeli; }
    else purchaseCart.push({ idBarang, namaBarang: item.namaBarang, qty, hargaBeli });
    renderPurchaseCart();
    document.getElementById("purchaseSearch").value = "";
    document.getElementById("purchaseQty").value = "";
    document.getElementById("purchaseHargaBeli").value = "";
    clearPurchaseProductSelection();
    result.className = "result success"; result.textContent = `${item.namaBarang} ditambahkan ke daftar. Total ${purchaseCart.length} jenis barang.`;
  });

  document.getElementById("purchaseButton").addEventListener("click", async function(event) {
    event.preventDefault();
    const button = document.getElementById("purchaseButton");
    const result = document.getElementById("purchaseResult");
    const metadata = {
      supplier: document.getElementById("purchaseSupplier").value.trim(),
      pembayaran: document.getElementById("purchasePembayaran").value,
      nomorNota: document.getElementById("purchaseNota").value.trim(),
      linkNota: document.getElementById("purchaseLinkNota").value.trim(),
      keterangan: document.getElementById("purchaseKeterangan").value.trim(),
      tanggal: document.getElementById("purchaseTanggal").value
    };
    if (!purchaseCart.length || !metadata.supplier || !metadata.tanggal) {
      result.className = "result error"; result.textContent = "Tambahkan minimal satu barang, lalu lengkapi tanggal barang masuk dan supplier."; return;
    }
    button.disabled = true; button.textContent = "Menyimpan...";
    result.className = "result"; result.textContent = "Menyimpan daftar barang masuk...";
    let saved = 0;
    try {
      for (const item of purchaseCart) {
        const [{ data: master, error: masterError }, { data: stok, error: stokError }] = await Promise.all([
          supabaseClient.from("master_barang").select("id_barang,nama_barang,harga_beli_terakhir,hpp_rata_rata,stok_minimum,aktif").eq("id_barang", item.idBarang).maybeSingle(),
          supabaseClient.from("stok").select("id_barang,stok_awal,barang_masuk,terjual,stok_akhir").eq("id_barang", item.idBarang).maybeSingle()
        ]);
        if (masterError) throw masterError; if (stokError) throw stokError;
        if (!master || master.aktif === false || !stok) throw new Error(`Data master/stok ${item.namaBarang} tidak ditemukan atau nonaktif.`);
        const stokLama = Number(stok.stok_akhir) || 0;
        const stokMasukBaru = (Number(stok.barang_masuk) || 0) + item.qty;
        const stokBaru = stokLama + item.qty;
        const hppLama = Number(master.hpp_rata_rata) || Number(master.harga_beli_terakhir) || 0;
        const hppBaru = hppLama > 0 && stokLama > 0 ? Math.round(((stokLama * hppLama) + (item.qty * item.hargaBeli)) / stokBaru) : item.hargaBeli;
        const idPembelian = "BM" + Date.now().toString() + Math.random().toString(36).slice(2, 6);
        const { error: pembelianError } = await supabaseClient.from("barang_masuk").insert({
          id_pembelian: idPembelian, tanggal: tanggalInputKeISO(metadata.tanggal), id_barang: item.idBarang,
          nama_barang: master.nama_barang, supplier: metadata.supplier, qty: item.qty, harga_beli: item.hargaBeli,
          total_pembelian: item.qty * item.hargaBeli, pembayaran: metadata.pembayaran || "Tunai",
          nomor_nota: metadata.nomorNota || null, link_nota: metadata.linkNota || null, keterangan: metadata.keterangan || null,
          nama_penginput: window.bumdesCurrentName || window.bumdesCurrentUser?.email || "Pengguna",
          id_penginput: window.bumdesCurrentUser?.id || null
        });
        if (pembelianError) throw pembelianError;
        const { error: stokUpdateError } = await supabaseClient.from("stok").update({ barang_masuk: stokMasukBaru, stok_akhir: stokBaru }).eq("id_barang", item.idBarang);
        if (stokUpdateError) throw stokUpdateError;
        const { error: masterUpdateError } = await supabaseClient.from("master_barang").update({ harga_beli_terakhir: item.hargaBeli, hpp_rata_rata: hppBaru }).eq("id_barang", item.idBarang);
        if (masterUpdateError) throw masterUpdateError;
        saved++;
      }
      const grandTotal = purchaseCart.reduce((sum, x) => sum + x.qty * x.hargaBeli, 0);
      result.className = "result success";
      result.innerHTML = `✅ ${saved} jenis barang berhasil disimpan.<br>Total pembelian: <strong>${formatRupiah(grandTotal)}</strong>${String(metadata.pembayaran).toLowerCase() === "tunai" ? "<br>Kas Keluar otomatis dicatat oleh sistem." : ""}`;
      purchaseCart = []; renderPurchaseCart();
      document.getElementById("purchaseForm").reset(); clearPurchaseProductSelection();
      purchaseProductsLoaded = false; purchaseProducts = []; salesProductsLoaded = false; salesProducts = [];
      await loadPurchaseHistory(); await refreshCrudViews();
    } catch (error) {
      result.className = "result error";
      result.textContent = `❌ ${error.message || "Gagal menyimpan barang masuk."}${saved ? ` (${saved} barang sudah tersimpan sebelum terjadi kesalahan; periksa riwayat sebelum mencoba ulang.)` : ""}`;
      console.error("SUPABASE BARANG MASUK ERROR:", error);
    } finally { button.disabled = false; button.textContent = "Simpan Semua Barang Masuk"; }
  });


  // ============================================================

  // SIMPAN PENGELUARAN — SUPABASE + KAS

  // ============================================================

  document.getElementById("expenseForm").addEventListener("submit", async function(event) {

    event.preventDefault();

    const button = document.getElementById("expenseButton");
    const result = document.getElementById("expenseResult");

    const data = {
      kategori: document.getElementById("expenseKategori").value,
      keterangan: document.getElementById("expenseKeterangan").value.trim(),
      jumlah: ambilAngkaHarga(document.getElementById("expenseJumlah").value),
      pembayaran: document.getElementById("expensePembayaran").value,
      referensi: document.getElementById("expenseReferensi").value.trim(),
      linkNota: document.getElementById("expenseLinkNota").value.trim(),
      tanggal: document.getElementById("expenseTanggal").value
    };

    if (!data.kategori || !data.keterangan || data.jumlah <= 0) {
      result.className = "result error";
      result.textContent = "❌ Kategori, keterangan, dan jumlah wajib diisi.";
      return;
    }

    button.disabled = true;
    button.textContent = "Menyimpan...";
    result.className = "result";
    result.textContent = "";

    let idPengeluaran = "";

    try {
      // ID transaksi dibuat unik agar tidak bentrok dengan primary key Supabase.
      const unik = (typeof crypto !== "undefined" && crypto.randomUUID)
        ? crypto.randomUUID().replace(/-/g, "")
        : (Date.now().toString(36) + Math.random().toString(36).slice(2));
      idPengeluaran = "OU" + unik;
      const tanggal = tanggalInputKeISO(data.tanggal);

      // Simpan pengeluaran ke Supabase.
      // Jika pembayaran Tunai, trigger Supabase otomatis membuat Kas Keluar.
      const { error: expenseError } = await supabaseClient
        .from("pengeluaran")
        .insert({
          id_pengeluaran: idPengeluaran,
          tanggal: tanggal,
          kategori: data.kategori,
          keterangan: data.keterangan,
          jumlah: data.jumlah,
          pembayaran: data.pembayaran || "Tunai"
        });

      if (expenseError) throw expenseError;

      result.className = "result success";
      result.innerHTML =
        "✅ Pengeluaran berhasil disimpan.<br>" +
        "ID: <strong>" + escapeHtml(idPengeluaran) + "</strong><br>" +
        "Jumlah: <strong>" + formatRupiah(data.jumlah) + "</strong>" +
        (String(data.pembayaran || "").toLowerCase() === "tunai"
          ? "<br>Kas: <strong>Kas Keluar otomatis dicatat</strong>"
          : "");

      document.getElementById("expenseForm").reset();
      await loadExpenseHistory();
      await refreshCrudViews();

      // Dashboard/Kas akan membaca data terbaru saat dibuka atau diperbarui.

    } catch (error) {
      result.className = "result error";
      result.textContent = "❌ " + (error.message || "Gagal menyimpan pengeluaran.");
      console.error("SUPABASE PENGELUARAN ERROR:", error);
    } finally {
      button.disabled = false;
      button.textContent = "Simpan Pengeluaran";
    }
  });



  // ============================================================

  // DATA DASHBOARD

  // ============================================================



  async function loadDashboard() {
    const statusEl = document.getElementById("dashboardStatus");
    const inventoryEl = document.getElementById("dashboardInventorySummary");

    if (statusEl) statusEl.textContent = "⏳ Memuat data dashboard dari Supabase...";

    try {
      const periode = getDashboardPeriod();
      if (periode.error) throw new Error(periode.error);
      // Barang terlaris diambil bersamaan (bukan menunggu dashboard selesai dulu).
      syncDashboardTopSellingDates(periode);
      const topSellingPromise = loadDashboardTopSelling();
      // Batasi data ke periode di sisi server agar tidak mengunduh seluruh riwayat transaksi.
      const nextDay = (iso) => { const d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); };
      const byPeriod = (query) => periode.all ? query : query.gte("tanggal", periode.mulai).lt("tanggal", nextDay(periode.selesai));
      const [
        { data: kasRows, error: kasError },
        { data: salesRows, error: salesError },
        { data: purchaseRows, error: purchaseError },
        { data: expenseRows, error: expenseError },
        { data: stockRows, error: stockError },
        { data: masterRows, error: masterError }
      ] = await Promise.all([
        ambilKasUntukDashboard(),

        byPeriod(supabaseClient
          .from("penjualan")
          .select("tanggal,total_penjualan,hpp,laba_kotor")),

        byPeriod(supabaseClient
          .from("barang_masuk")
          .select("tanggal,total_pembelian")),

        byPeriod(supabaseClient
          .from("pengeluaran")
          .select("tanggal,jumlah")),

        cachedRead("ref:dash-stok", () => supabaseClient
          .from("stok")
          .select("id_barang,stok_akhir")),

        cachedRead("ref:dash-master", () => supabaseClient
          .from("master_barang")
          .select("id_barang,aktif,status,stok_minimum"))
      ]);

      if (kasError) throw new Error("Kas: " + kasError.message);
      if (salesError) throw new Error("Penjualan: " + salesError.message);
      if (purchaseError) throw new Error("Barang Masuk: " + purchaseError.message);
      if (expenseError) throw new Error("Pengeluaran: " + expenseError.message);
      if (stockError) throw new Error("Stok: " + stockError.message);
      if (masterError) throw new Error("Master Barang: " + masterError.message);

      const inPeriod = row => {
        if (periode.all) return true;
        const date = String(row.tanggal || "").slice(0, 10);
        return date >= periode.mulai && date <= periode.selesai;
      };
      const filteredSales = (salesRows || []).filter(inPeriod);
      const filteredPurchases = (purchaseRows || []).filter(inPeriod);
      const filteredExpenses = (expenseRows || []).filter(inPeriod);

      const kasMasuk = (kasRows || []).reduce((total, row) =>
        total + (Number(row.debit) || 0), 0);

      const kasKeluar = (kasRows || []).reduce((total, row) =>
        total + (Number(row.kredit) || 0), 0);

      const saldoKas = kasMasuk - kasKeluar;

      const totalPenjualan = filteredSales.reduce((total, row) =>
        total + (Number(row.total_penjualan) || 0), 0);

      const totalHpp = filteredSales.reduce((total, row) =>
        total + (Number(row.hpp) || 0), 0);

      const labaKotor = filteredSales.reduce((total, row) =>
        total + (Number(row.laba_kotor) || 0), 0);

      const totalPembelian = filteredPurchases.reduce((total, row) =>
        total + (Number(row.total_pembelian) || 0), 0);

      const pengeluaran = filteredExpenses.reduce((total, row) =>
        total + (Number(row.jumlah) || 0), 0);

      const labaBersih = labaKotor - pengeluaran;

      const activeIds = new Set(
        (masterRows || [])
          .filter(row => row.aktif !== false && String(row.status || "AKTIF").toUpperCase() !== "NONAKTIF")
          .map(row => String(row.id_barang))
      );

      const activeStock = (stockRows || []).filter(row =>
        activeIds.size === 0 || activeIds.has(String(row.id_barang))
      );

      let stokAman = 0;
      let stokMenipis = 0;
      let stokHabis = 0;
      let totalStokUnit = 0;

      const masterMap = new Map(
        (masterRows || []).map(row => [String(row.id_barang), row])
      );

      activeStock.forEach(row => {
        const stokAkhir = Number(row.stok_akhir) || 0;
        const master = masterMap.get(String(row.id_barang));
        const stokMinimum = Number(master?.stok_minimum) || 0;
        totalStokUnit += stokAkhir;

        if (stokAkhir <= 0) {
          stokHabis++;
        } else if (stokAkhir <= stokMinimum) {
          stokMenipis++;
        } else {
          stokAman++;
        }
      });

      const totalJenisBarang = activeStock.length;

      document.getElementById("dashSaldoKas").textContent = formatRupiah(saldoKas);
      document.getElementById("dashPenjualan").textContent = formatRupiah(totalPenjualan);
      document.getElementById("dashLabaKotor").textContent = formatRupiah(labaKotor);
      document.getElementById("dashPengeluaran").textContent = formatRupiah(pengeluaran);
      document.getElementById("dashPembelian").textContent = formatRupiah(totalPembelian);
      document.getElementById("dashLabaBersih").textContent = formatRupiah(labaBersih);
      document.getElementById("dashStokMenipis").textContent = formatNumber(stokMenipis);
      document.getElementById("dashStokHabis").textContent = formatNumber(stokHabis);

      if (inventoryEl) {
        inventoryEl.innerHTML =
          "📦 <strong>" + formatNumber(totalJenisBarang) + "</strong> jenis barang • " +
          "<strong>" + formatNumber(totalStokUnit) + "</strong> unit stok • " +
          "<strong>" + formatNumber(stokAman) + "</strong> aman • " +
          "<strong>" + formatNumber(stokMenipis) + "</strong> menipis • " +
          "<strong>" + formatNumber(stokHabis) + "</strong> habis";
      }

      if (statusEl) {
        statusEl.className = "status-box";
        statusEl.textContent =
          "✅ Dashboard berhasil diperbarui dari Supabase.";
      }
      const periodLabel = document.getElementById("dashPeriodeLabel");
      if (periodLabel) periodLabel.textContent = periode.all ? "Menampilkan seluruh transaksi yang tersedia." : `Periode ${formatLaporanDate(periode.mulai)} sampai ${formatLaporanDate(periode.selesai)}.`;
      await topSellingPromise;

    } catch (error) {
      if (statusEl) {
        statusEl.className = "status-box";
        statusEl.textContent = "❌ Dashboard gagal dimuat: " + (error.message || error);
      }

      console.error("loadDashboard Supabase:", error);
    }
  }


  // ============================================================
  // DASHBOARD: BARANG TERLARIS BERDASARKAN RENTANG TANGGAL
  // ============================================================
  async function loadDashboardTopSelling() {
    const mulaiEl = document.getElementById("dashTerlarisMulai");
    const selesaiEl = document.getElementById("dashTerlarisSelesai");
    const tbody = document.getElementById("dashTopSellingBody");
    const status = document.getElementById("dashTopSellingStatus");
    const omzetEl = document.getElementById("dashTerlarisOmzet");
    const qtyEl = document.getElementById("dashTerlarisQty");
    if (!mulaiEl || !selesaiEl || !tbody) return;

    const mulai = mulaiEl.value;
    const selesai = selesaiEl.value;
    const allPeriod = document.getElementById("dashPeriodePreset")?.value === "all";
    if (!allPeriod && (!mulai || !selesai)) {
      if (status) status.textContent = "Silakan pilih tanggal mulai dan tanggal selesai.";
      return;
    }
    if (!allPeriod && mulai > selesai) {
      if (status) status.textContent = "Tanggal mulai tidak boleh melewati tanggal selesai.";
      return;
    }

    tbody.innerHTML = '<tr><td colspan="4" class="empty-state">⏳ Memuat data penjualan...</td></tr>';
    if (status) status.textContent = "Mengambil data dari Supabase...";
    try {
      let query = supabaseClient
        .from("penjualan")
        .select("tanggal,id_barang,nama_barang,qty,total_penjualan")
        .order("tanggal", { ascending: true });
      if (!allPeriod) query = query.gte("tanggal", mulai).lte("tanggal", selesai + "T23:59:59");
      const { data, error } = await query;
      if (error) throw error;

      const grouped = new Map();
      (data || []).forEach(row => {
        const key = String(row.id_barang || row.nama_barang || "Tanpa nama");
        if (!grouped.has(key)) grouped.set(key, { nama: row.nama_barang || "Barang tanpa nama", qty: 0, total: 0 });
        const item = grouped.get(key);
        item.qty += Number(row.qty) || 0;
        item.total += Number(row.total_penjualan) || 0;
        if (!item.nama || item.nama === "Barang tanpa nama") item.nama = row.nama_barang || item.nama;
      });
      const ranked = Array.from(grouped.values()).sort((a,b) => b.qty - a.qty || b.total - a.total || a.nama.localeCompare(b.nama, "id"));
      const totalOmzet = ranked.reduce((sum, item) => sum + item.total, 0);
      const totalQty = ranked.reduce((sum, item) => sum + item.qty, 0);
      if (omzetEl) omzetEl.textContent = formatRupiah(totalOmzet);
      if (qtyEl) qtyEl.textContent = formatNumber(totalQty);

      if (!ranked.length) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-state">Tidak ada transaksi penjualan pada rentang tanggal ini.</td></tr>';
      } else {
        tbody.innerHTML = ranked.map((item, index) => `<tr><td><strong>${index + 1}</strong></td><td>${escapeHtml(item.nama)}</td><td>${formatNumber(item.qty)}</td><td>${formatRupiah(item.total)}</td></tr>`).join("");
      }
      if (status) status.textContent = allPeriod ? `Semua data • ${ranked.length} jenis barang terjual.` : `Periode ${formatLaporanDate(mulai)} sampai ${formatLaporanDate(selesai)} • ${ranked.length} jenis barang terjual.`;
    } catch (error) {
      tbody.innerHTML = '<tr><td colspan="4" class="empty-state">Gagal memuat data penjualan.</td></tr>';
      if (status) status.textContent = "❌ " + (error.message || "Terjadi kesalahan saat mengambil data penjualan.");
      console.error("loadDashboardTopSelling:", error);
    }
  }

  function getDashboardPeriod() {
    const preset = document.getElementById("dashPeriodePreset")?.value || "today";
    const mulaiEl = document.getElementById("dashPeriodeMulai");
    const selesaiEl = document.getElementById("dashPeriodeSelesai");
    const today = tanggalHariIniISO();
    const d = new Date(today + "T12:00:00");
    let mulai = mulaiEl?.value || today;
    let selesai = selesaiEl?.value || today;
    if (preset === "today") mulai = selesai = today;
    else if (preset === "yesterday") { d.setDate(d.getDate()-1); mulai = selesai = d.toISOString().slice(0,10); }
    else if (preset === "7days") { d.setDate(d.getDate()-6); mulai = d.toISOString().slice(0,10); selesai = today; }
    else if (preset === "month") { mulai = `${today.slice(0,7)}-01`; selesai = today; }
    else if (preset === "lastmonth") { const first = new Date(d.getFullYear(), d.getMonth()-1, 1, 12); const last = new Date(d.getFullYear(), d.getMonth(), 0, 12); mulai = first.toISOString().slice(0,10); selesai = last.toISOString().slice(0,10); }
    else if (preset === "year") { mulai = `${today.slice(0,4)}-01-01`; selesai = today; }
    else if (preset === "all") return {all:true, mulai:"", selesai:""};
    if (!mulai || !selesai) return {error:"Pilih tanggal mulai dan tanggal selesai."};
    if (mulai > selesai) return {error:"Tanggal mulai tidak boleh melewati tanggal selesai."};
    if (mulaiEl) mulaiEl.value = mulai; if (selesaiEl) selesaiEl.value = selesai;
    return {all:false, mulai, selesai};
  }

  function applyDashboardPreset() {
    const period = getDashboardPeriod();
    const label = document.getElementById("dashPeriodeLabel");
    if (label) label.textContent = period.error || (period.all ? "Semua data" : `Periode ${formatLaporanDate(period.mulai)} sampai ${formatLaporanDate(period.selesai)}`);
  }

  function syncDashboardTopSellingDates(period) {
    const mulaiEl = document.getElementById("dashTerlarisMulai");
    const selesaiEl = document.getElementById("dashTerlarisSelesai");
    if (!mulaiEl || !selesaiEl || period.all) return;
    mulaiEl.value = period.mulai; selesaiEl.value = period.selesai;
  }

  function initDashboardTopSellingDates() {
    const preset = document.getElementById("dashPeriodePreset");
    const mulai = document.getElementById("dashPeriodeMulai");
    const selesai = document.getElementById("dashPeriodeSelesai");
    if (preset && !preset.value) preset.value = "today";
    if (mulai && !mulai.value) mulai.value = tanggalHariIniISO();
    if (selesai && !selesai.value) selesai.value = tanggalHariIniISO();
    const topMulai = document.getElementById("dashTerlarisMulai");
    const topSelesai = document.getElementById("dashTerlarisSelesai");
    if (topMulai && !topMulai.value) topMulai.value = mulai?.value || tanggalHariIniISO();
    if (topSelesai && !topSelesai.value) topSelesai.value = selesai?.value || tanggalHariIniISO();
  }

  // ============================================================
  // MASTER BARANG
  // ============================================================

  let masterBarangData = [];
  let masterBarangEditMode = false;

 async function loadMasterBarang() {
  const tbody = document.getElementById("masterBarangTableBody");
  const summary = document.getElementById("masterBarangSummary");
  const result = document.getElementById("masterBarangResult");
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="11" class="empty-state">⏳ Memuat master barang...</td></tr>';
  if (summary) summary.textContent = "Memuat data...";
  if (result) { result.className = "result"; result.textContent = ""; }
  try {
    const [{ data: masterData, error: masterError }, { data: stokRows, error: stokError }] = await Promise.all([
      cachedRead("ref:master-page-master", () => supabaseClient.from("master_barang").select("id_barang,nama_barang,kategori,satuan,harga_beli_terakhir,hpp_rata_rata,harga_jual,stok_minimum,status,aktif").order("id_barang", { ascending: true })),
      cachedRead("ref:master-page-stok", () => supabaseClient.from("stok").select("id_barang,nama_barang,stok_awal,barang_masuk,terjual,stok_akhir"))
    ]);
    if (masterError) throw masterError;
    if (stokError) throw stokError;
    const stokMap = new Map((stokRows || []).map(item => [String(item.id_barang), item]));
    masterBarangData = (masterData || []).map(item => {
      const stok = stokMap.get(String(item.id_barang));
      return {
        idBarang: item.id_barang, namaBarang: item.nama_barang, kategori: item.kategori, satuan: item.satuan,
        hargaBeliTerakhir: Number(item.harga_beli_terakhir) || 0, hppRataRata: Number(item.hpp_rata_rata) || 0,
        hargaJual: Number(item.harga_jual) || 0, stokAwal: stok ? Number(stok.stok_awal) || 0 : 0,
        barangMasuk: stok ? Number(stok.barang_masuk) || 0 : 0, terjual: stok ? Number(stok.terjual) || 0 : 0,
        stokAkhir: stok ? Number(stok.stok_akhir) || 0 : 0,
        stokMinimum: Number(item.stok_minimum) || (stok ? Number(stok.stok_minimum) || 0 : 0),
        status: item.status, aktif: item.aktif !== false
      };
    });
    renderMasterBarang(masterBarangData);
    if (result) { result.className = "result success"; result.textContent = "✅ Data Master Barang dan stok berhasil dimuat dari Supabase."; }
  } catch (error) {
    console.error("SUPABASE MASTER BARANG ERROR:", error); masterBarangData = [];
    tbody.innerHTML = '<tr><td colspan="11" class="empty-state">❌ Master barang gagal dimuat.</td></tr>';
    if (summary) summary.textContent = "Data gagal dimuat.";
    if (result) { result.className = "result error"; result.textContent = "❌ " + (error.message || "Gagal memuat Master Barang."); }
  }
}
  function renderMasterBarang(data) {
    const tbody = document.getElementById("masterBarangTableBody");
    const summary = document.getElementById("masterBarangSummary");
    if (!tbody) return;

    if (!data.length) {
      tbody.innerHTML = '<tr><td colspan="11" class="empty-state">Belum ada barang.</td></tr>';
      if (summary) summary.textContent = "0 barang";
      return;
    }

    tbody.innerHTML = data.map(item => {
      const aktif = item.aktif !== false;
      const statusText = aktif ? "AKTIF" : "NONAKTIF";
      const statusClass = aktif ? "badge-safe" : "badge-empty";
      const hpp = Number(item.hppRataRata) || 0;
      const jual = Number(item.hargaJual) || 0;
      const marginNominal = jual - hpp;
      const marginPersen = hpp > 0 ? (marginNominal / hpp) * 100 : 0;

      return `
        <tr>
          <td>${escapeHtml(item.idBarang)}</td>
          <td><strong>${escapeHtml(item.namaBarang)}</strong></td>
          <td>${escapeHtml(item.kategori)}</td>
          <td>${escapeHtml(item.satuan)}</td>
          <td>${formatRupiah(item.hargaBeliTerakhir)}</td>
          <td>${formatRupiah(item.hppRataRata)}</td>
          <td>${formatRupiah(item.hargaJual)}</td>
          <td>${formatNumber(item.stokMinimum)}</td>
          <td><span class="badge ${statusClass}">${statusText}</span></td>
          <td>${formatRupiah(marginNominal)} (${marginPersen.toFixed(1)}%)</td>
          <td>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              <button class="btn btn-secondary" type="button" onclick="editMasterBarang('${escapeHtml(item.idBarang)}')">✏️ Edit</button>
              ${
                aktif
                ? `<button class="btn btn-secondary" type="button" onclick="toggleMasterBarang('${escapeHtml(item.idBarang)}', false)">🚫 Nonaktifkan</button>`
                : `<button class="btn btn-primary" type="button" onclick="toggleMasterBarang('${escapeHtml(item.idBarang)}', true)">✓ Aktifkan</button>`
              }
            </div>
          </td>
        </tr>`;
    }).join("");

    const aktifCount = data.filter(x => x.aktif !== false).length;
    const nonaktifCount = data.length - aktifCount;
    if (summary) {
      summary.textContent = `${data.length} barang • ${aktifCount} aktif • ${nonaktifCount} nonaktif`;
    }
  }

  function filterMasterBarang() {
    const keyword = String(document.getElementById("masterBarangSearch").value || "").trim().toLowerCase();

    if (!keyword) {
      renderMasterBarang(masterBarangData);
      return;
    }

    const filtered = masterBarangData.filter(item =>
      String(item.idBarang || "").toLowerCase().includes(keyword) ||
      String(item.namaBarang || "").toLowerCase().includes(keyword) ||
      String(item.kategori || "").toLowerCase().includes(keyword) ||
      String(item.satuan || "").toLowerCase().includes(keyword)
    );

    renderMasterBarang(filtered);
  }

  function resetMasterBarangForm() {
    const form = document.getElementById("masterBarangForm");
    if (form) form.reset();

    document.getElementById("masterEditId").value = "";
    document.getElementById("masterIdBarang").disabled = false;
    document.getElementById("masterIdBarang").readOnly = true;
    document.getElementById("masterHargaBeli").disabled = false;
    document.getElementById("masterStokAwal").disabled = false;
    document.getElementById("masterAktifField").style.display = "none";
    document.getElementById("masterFormTitle").textContent = "Tambah Barang";
    document.getElementById("masterBarangButton").textContent = "Simpan Barang";
    document.getElementById("masterBarangResult").className = "result";
    document.getElementById("masterBarangResult").textContent = "";
    masterBarangEditMode = false;
  }

  function editMasterBarang(idBarang) {
    const item = masterBarangData.find(x => String(x.idBarang) === String(idBarang));
    if (!item) return;

    masterBarangEditMode = true;
    document.getElementById("masterEditId").value = item.idBarang;
    document.getElementById("masterIdBarang").value = item.idBarang;
    document.getElementById("masterNamaBarang").value = item.namaBarang || "";
    document.getElementById("masterKategori").value = item.kategori || "";
    document.getElementById("masterSatuan").value = item.satuan || "";
    document.getElementById("masterHargaBeli").value =
  item.hargaBeliTerakhir
    ? "Rp" + Number(item.hargaBeliTerakhir).toLocaleString("id-ID")
    : "";
    // document.getElementById("masterHargaJual").value = Number(item.hargaJual) || 0;
    document.getElementById("masterHargaJual").value =
  item.hargaJual
    ? "Rp" + Number(item.hargaJual).toLocaleString("id-ID")
    : "";
    document.getElementById("masterStokAwal").value = Number(item.stokAwal) || 0;
    document.getElementById("masterStokMinimum").value = Number(item.stokMinimum) || 0;
    document.getElementById("masterAktif").value = item.aktif !== false ? "true" : "false";

    document.getElementById("masterIdBarang").disabled = true;
    document.getElementById("masterHargaBeli").disabled = false;
    document.getElementById("masterStokAwal").disabled = false;
    document.getElementById("masterAktifField").style.display = "block";
    document.getElementById("masterFormTitle").textContent = "Edit Barang";
    document.getElementById("masterBarangButton").textContent = "Simpan Perubahan";

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  document.getElementById("masterBarangForm").addEventListener("submit", async function(event) {
  event.preventDefault();

  const button = document.getElementById("masterBarangButton");
  const result = document.getElementById("masterBarangResult");
  const editId = document.getElementById("masterEditId").value.trim();

  const namaBarang = document.getElementById("masterNamaBarang").value.trim();
  const kategori = document.getElementById("masterKategori").value.trim();
  const satuan = document.getElementById("masterSatuan").value.trim();

  const hargaBeli = ambilAngkaHarga(
    document.getElementById("masterHargaBeli").value
  );

  const hargaJual = ambilAngkaHarga(
    document.getElementById("masterHargaJual").value
  );

  const stokAwal = Number(
    document.getElementById("masterStokAwal").value || 0
  );

  const stokMinimum = Number(
    document.getElementById("masterStokMinimum").value || 0
  );

  const statusElement = document.getElementById("masterAktif");
  const status = statusElement
    ? (statusElement.value === "true" ? "AKTIF" : "NONAKTIF")
    : "AKTIF";

  // ==========================================================
  // VALIDASI
  // ==========================================================

  if (!namaBarang || !kategori || !satuan) {
    result.className = "result error";
    result.textContent =
      "❌ Nama, kategori, dan satuan wajib diisi.";
    return;
  }

  if (
    hargaBeli < 0 ||
    hargaJual < 0 ||
    stokAwal < 0 ||
    stokMinimum < 0
  ) {
    result.className = "result error";
    result.textContent =
      "❌ Nilai harga dan stok tidak boleh negatif.";
    return;
  }

  button.disabled = true;
  button.textContent = editId
    ? "Menyimpan Perubahan..."
    : "Menambahkan...";

  result.className = "result";
  result.textContent = editId
    ? "Menyimpan perubahan ke Supabase..."
    : "Menyimpan barang ke Supabase...";

  try {

    // ==========================================================
    // MODE EDIT
    // ==========================================================

    if (editId) {

      // --------------------------------------------------------
      // 1. UPDATE MASTER BARANG
      // Harga beli sekarang bisa diedit.
      // Jika belum ada riwayat Barang Masuk, HPP ikut disesuaikan.
      // Jika sudah ada riwayat pembelian, HPP rata-rata historis tetap aman.
      // --------------------------------------------------------

      const { data: riwayatPembelian, error: errorRiwayatPembelian } =
        await supabaseClient
          .from("barang_masuk")
          .select("id_pembelian")
          .eq("id_barang", editId)
          .limit(1);

      if (errorRiwayatPembelian) {
        throw errorRiwayatPembelian;
      }

      const masterUpdate = {
        nama_barang: namaBarang,
        kategori: kategori,
        satuan: satuan,
        harga_beli_terakhir: hargaBeli > 0 ? hargaBeli : null,
        harga_jual: hargaJual > 0 ? hargaJual : null,
        stok_minimum: stokMinimum,
        status: status,
        aktif: status === "AKTIF"
      };

      // Bila belum pernah ada transaksi Barang Masuk, harga beli menjadi HPP awal.
      if (!riwayatPembelian || riwayatPembelian.length === 0) {
        masterUpdate.hpp_rata_rata = hargaBeli > 0 ? hargaBeli : null;
      }

      const { error: errorEdit } =
        await supabaseClient
          .from("master_barang")
          .update(masterUpdate)
          .eq("id_barang", editId);

      if (errorEdit) {
        throw errorEdit;
      }


      // --------------------------------------------------------
      // 2. UPDATE STOK
      // Stok akhir dihitung ulang dari: stok awal + barang masuk - terjual.
      // --------------------------------------------------------

      const { data: dataStok, error: errorAmbilStok } =
        await supabaseClient
          .from("stok")
          .select("stok_awal, barang_masuk, terjual")
          .eq("id_barang", editId)
          .maybeSingle();

      if (errorAmbilStok) {
        throw errorAmbilStok;
      }

      const barangMasuk = Number(dataStok?.barang_masuk || 0);
      const terjual = Number(dataStok?.terjual || 0);
      const stokAkhir = stokAwal + barangMasuk - terjual;
      const statusStok = stokAkhir <= 0 ? "HABIS" : stokAkhir <= stokMinimum ? "MENIPIS" : "AMAN";

      // Jika baris stok sudah ada -> update. Jika belum ada -> buat baru.
      if (dataStok) {
        const { error: errorUpdateStok } = await supabaseClient.from("stok").update({
          nama_barang: namaBarang, stok_awal: stokAwal,
          stok_akhir: stokAkhir, barang_masuk: Number(dataStok?.barang_masuk || 0),
          terjual: Number(dataStok?.terjual || 0)
        }).eq("id_barang", editId);
        if (errorUpdateStok) throw errorUpdateStok;
      } else {
        const { error: errorInsertStok } = await supabaseClient.from("stok").insert({
          id_barang: editId, nama_barang: namaBarang, stok_awal: stokAwal,
          barang_masuk: 0, terjual: 0, stok_akhir: stokAwal
        });
        if (errorInsertStok) throw errorInsertStok;
      }

      // --------------------------------------------------------
      // 3. BERHASIL EDIT
      // --------------------------------------------------------

      result.className = "result success";
      result.textContent =
        "✅ Barang " + editId + " berhasil diperbarui.";

      resetMasterBarangForm();

      await loadMasterBarang();

      // Bersihkan cache daftar barang transaksi.
      salesProductsLoaded = false;
      salesProducts = [];

      purchaseProductsLoaded = false;
      purchaseProducts = [];

      return;
    }


    // ==========================================================
    // MODE TAMBAH BARANG
    // ==========================================================

    // ----------------------------------------------------------
    // 1. BUAT KODE BARANG OTOMATIS
    // ----------------------------------------------------------

    const { data: daftarBarang, error: errorKode } =
      await supabaseClient
        .from("master_barang")
        .select("id_barang");

    if (errorKode) {
      throw errorKode;
    }

    let nomorTerakhir = 0;

    (daftarBarang || []).forEach(item => {

      const kode = String(item.id_barang || "").trim();

      const cocok = kode.match(/^BRG(\d+)$/i);

      if (cocok) {
        nomorTerakhir = Math.max(
          nomorTerakhir,
          Number(cocok[1]) || 0
        );
      }
    });

    const idBarang =
      "BRG" + String(nomorTerakhir + 1).padStart(3, "0");


    // ----------------------------------------------------------
    // 2. SIMPAN MASTER BARANG
    // ----------------------------------------------------------

    const { error: errorBarang } =
      await supabaseClient
        .from("master_barang")
        .insert({
          id_barang: idBarang,
          nama_barang: namaBarang,
          kategori: kategori,
          satuan: satuan,
          harga_beli_terakhir: hargaBeli,
          hpp_rata_rata: hargaBeli,
          harga_jual: hargaJual,
          stok_minimum: stokMinimum,
          status: "AKTIF",
          aktif: true
        });

    if (errorBarang) {
      throw errorBarang;
    }


    // ----------------------------------------------------------
    // 3. SIMPAN STOK AWAL
    // ----------------------------------------------------------

    const { error: errorStok } =
      await supabaseClient
        .from("stok")
        .insert({
          id_barang: idBarang,
          nama_barang: namaBarang,
          stok_awal: stokAwal,
          barang_masuk: 0,
          terjual: 0,
          stok_akhir: stokAwal
        });

    if (errorStok) {

      throw new Error(
        "Master barang tersimpan, tetapi stok gagal disimpan: " +
        errorStok.message
      );
    }


    // ----------------------------------------------------------
    // 4. BERHASIL TAMBAH
    // ----------------------------------------------------------

    result.className = "result success";
    result.textContent =
      "✅ Barang " + idBarang +
      " berhasil ditambahkan ke Supabase.";

    resetMasterBarangForm();

    await loadMasterBarang();

    // Bersihkan cache daftar barang transaksi.
    salesProductsLoaded = false;
    salesProducts = [];

    purchaseProductsLoaded = false;
    purchaseProducts = [];


  } catch (error) {

    console.error(
      "SUPABASE MASTER BARANG ERROR:",
      error
    );

    result.className = "result error";

    result.textContent =
      "❌ " +
      (error.message || "Gagal menyimpan barang.");

  } finally {

    button.disabled = false;

    button.textContent = editId
      ? "Simpan Perubahan"
      : "Simpan Barang";
  }

});

  async function toggleMasterBarang(idBarang, aktif) {
  const aksi = aktif ? "mengaktifkan" : "menonaktifkan";

  if (!confirm(`Yakin ingin ${aksi} barang ${idBarang}?`)) {
    return;
  }

  const result = document.getElementById("masterBarangResult");

  result.className = "result";
  result.textContent = "Menyimpan perubahan...";

  try {

    const { error } = await supabaseClient
      .from("master_barang")
      .update({
        status: aktif ? "AKTIF" : "NONAKTIF",
        aktif: aktif
      })
      .eq("id_barang", idBarang);

    if (error) {
      throw error;
    }

    result.className = "result success";
    result.textContent =
      `✅ Barang ${idBarang} berhasil ${aktif ? "diaktifkan" : "dinonaktifkan"}.`;

    // Bersihkan cache barang transaksi
    salesProductsLoaded = false;
    salesProducts = [];

    purchaseProductsLoaded = false;
    purchaseProducts = [];

    // Muat ulang Master Barang
    await loadMasterBarang();

  } catch (error) {

    console.error("SUPABASE UBAH STATUS ERROR:", error);

    result.className = "result error";
    result.textContent =
      "❌ " + (error.message || "Gagal mengubah status barang.");
  }
}


  // ============================================================

  // DATA STOK

  // ============================================================



  let stokData = [];
  let riwayatStokMasukData = [];

  async function loadRiwayatStokMasuk() {
    const tbody = document.getElementById("stockInTableBody");
    const summary = document.getElementById("stockInSummary");
    const result = document.getElementById("stockInResult");
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">⏳ Memuat riwayat stok masuk...</td></tr>';
    if (summary) summary.textContent = "Memuat riwayat...";
    if (result) { result.className = "result"; result.textContent = ""; }
    try {
      const [{ data: rows, error }, { data: masters, error: masterError }] = await Promise.all([
        cachedRead("ref:riwayat-masuk", () => supabaseClient.from("barang_masuk")
          .select("id_pembelian,tanggal,id_barang,qty,harga_beli,total_pembelian")
          .order("tanggal", { ascending: false })),
        cachedRead("ref:riwayat-master", () => supabaseClient.from("master_barang").select("id_barang,nama_barang"))
      ]);
      if (error) throw error;
      if (masterError) throw masterError;
      const nameMap = new Map((masters || []).map(x => [String(x.id_barang), x.nama_barang || ""]));
      riwayatStokMasukData = (rows || []).map(x => ({
        tanggal: String(x.tanggal || "").slice(0, 10),
        idBarang: String(x.id_barang || ""),
        namaBarang: nameMap.get(String(x.id_barang)) || "(Nama barang tidak ditemukan)",
        qty: Number(x.qty) || 0,
        hargaBeli: Number(x.harga_beli) || 0,
        total: Number(x.total_pembelian) || (Number(x.qty) || 0) * (Number(x.harga_beli) || 0)
      }));
      filterRiwayatStokMasuk();
      if (result) { result.className = "result success"; result.textContent = "Riwayat stok masuk berhasil dimuat."; }
    } catch (error) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-state">❌ Gagal memuat riwayat stok masuk.</td></tr>';
      if (summary) summary.textContent = "Riwayat gagal dimuat.";
      if (result) { result.className = "result error"; result.textContent = "❌ " + (error.message || "Gagal memuat riwayat."); }
      console.error("SUPABASE RIWAYAT STOK MASUK ERROR:", error);
    }
  }

  function filterRiwayatStokMasuk() {
    const tbody = document.getElementById("stockInTableBody");
    const summary = document.getElementById("stockInSummary");
    if (!tbody) return;
    const keyword = (document.getElementById("stockInSearch")?.value || "").trim().toLowerCase();
    const from = document.getElementById("stockInFrom")?.value || "";
    const to = document.getElementById("stockInTo")?.value || "";
    const filtered = riwayatStokMasukData.filter(x => {
      const matchText = !keyword || x.idBarang.toLowerCase().includes(keyword) || x.namaBarang.toLowerCase().includes(keyword);
      const matchFrom = !from || x.tanggal >= from;
      const matchTo = !to || x.tanggal <= to;
      return matchText && matchFrom && matchTo;
    });
    if (!filtered.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Tidak ada transaksi stok masuk pada filter ini.</td></tr>';
    } else {
      window.__fc = window.__fc || {};
      const dateLabelCache = new Map();
      tbody.innerHTML = filtered.map(x => {
        const dateLabel = x.tanggal ? (dateLabelCache.get(x.tanggal) || (dateLabelCache.set(x.tanggal, (window.__fc.dl || (window.__fc.dl = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "long", year: "numeric" }))).format(new Date(x.tanggal + "T00:00:00"))), dateLabelCache.get(x.tanggal))) : "—";
        return `<tr><td>${escapeHtml(dateLabel)}</td><td>${escapeHtml(x.idBarang)}</td><td><strong>${escapeHtml(x.namaBarang)}</strong></td><td>${formatNumber(x.qty)}</td><td>${formatRupiah(x.hargaBeli)}</td><td>${formatRupiah(x.total)}</td></tr>`;
      }).join("");
    }
    if (summary) summary.textContent = `${filtered.length} transaksi stok masuk`;
  }

  async function loadStok() {
  const tbody = document.getElementById("stockTableBody");
  const summary = document.getElementById("stockSummary");
  const result = document.getElementById("stockResult");

  if (!tbody) return;

  tbody.innerHTML =
    '<tr><td colspan="9" class="empty-state">⏳ Memuat data stok...</td></tr>';

  if (summary) summary.textContent = "Memuat data stok...";
  if (result) {
    result.className = "result";
    result.textContent = "";
  }

  try {
    const [
      { data: stockRows, error: stockError },
      { data: masterRows, error: masterError }
    ] = await Promise.all([
      cachedRead("ref:stok-page-stok", () => supabaseClient.from("stok")
        .select("id_barang,nama_barang,stok_awal,barang_masuk,terjual,stok_akhir")
        .order("nama_barang", { ascending: true })),
      cachedRead("ref:stok-page-master", () => supabaseClient.from("master_barang")
        .select("id_barang,stok_minimum,status,aktif"))
    ]);

    if (stockError) throw stockError;
    if (masterError) throw masterError;

    const masterMap = new Map(
      (masterRows || []).map(item => [String(item.id_barang), item])
    );

    // Menu Stok hanya menampilkan barang yang masih aktif di Master Barang.
    // Barang nonaktif tetap tersimpan di database untuk menjaga riwayat transaksi.
    const activeStockRows = (stockRows || []).filter(item => {
      const master = masterMap.get(String(item.id_barang));
      return Boolean(master) &&
        master.aktif !== false &&
        String(master.status || "AKTIF").toUpperCase() !== "NONAKTIF";
    });

    stokData = activeStockRows.map(item => {
      const master = masterMap.get(String(item.id_barang)) || {};
      return {
        idBarang: item.id_barang,
        namaBarang: item.nama_barang,
        stokAwal: Number(item.stok_awal) || 0,
        barangMasuk: Number(item.barang_masuk) || 0,
        terjual: Number(item.terjual) || 0,
        stokAkhir: Number(item.stok_akhir) || 0,
        stokMinimum: Number(master.stok_minimum) || 0,
        status: (
          (Number(item.stok_akhir) || 0) <= 0
            ? "HABIS"
            : (Number(item.stok_akhir) || 0) <= (Number(master.stok_minimum) || 0)
              ? "MENIPIS"
              : "AMAN"
        )
      };
    });

    filterStok();

    if (result) {
      result.className = "result success";
      result.textContent = "✅ Data stok berhasil dimuat dari Supabase.";
    }
  } catch (error) {
    tbody.innerHTML =
      '<tr><td colspan="9" class="empty-state">❌ Gagal mengambil data stok.</td></tr>';
    if (summary) summary.textContent = "Data stok gagal dimuat.";
    if (result) {
      result.className = "result error";
      result.textContent = "❌ " + (error.message || "Gagal mengambil data stok.");
    }
    console.error("SUPABASE STOK ERROR:", error);
  }
}

  function renderStok(data) {

    const tbody = document.getElementById("stockTableBody");

    const summary = document.getElementById("stockSummary");

    if (!tbody) return;



    if (!data.length) {

      tbody.innerHTML =

        '<tr><td colspan="9" class="empty-state">Belum ada data stok.</td></tr>';

      summary.textContent = "0 barang";

      return;

    }



    tbody.innerHTML = data.map(item => {

      // Status halaman STOK berdasarkan stok akhir dan stok minimum.
      // Tidak lagi mengambil status aktif/nonaktif dari Master Barang.
      const stokAkhir = Number(item.stokAkhir) || 0;
      const stokMinimum = Number(item.stokMinimum) || 0;

      let status = "AMAN";
      let badgeClass = "badge-safe";
      let badgeText = "AMAN";

      if (stokAkhir <= 0) {
        status = "HABIS";
        badgeClass = "badge-danger";
        badgeText = "HABIS";
      } else if (stokAkhir <= stokMinimum) {
        status = "MENIPIS";
        badgeClass = "badge-warning";
        badgeText = "MENIPIS";
      }


      return `

        <tr>

          <td>${escapeHtml(item.idBarang)}</td>

          <td><strong>${escapeHtml(item.namaBarang)}</strong></td>

          <td>${formatNumber(item.stokAwal)}</td>

          <td>${formatNumber(item.barangMasuk)}</td>

          <td>${formatNumber(item.terjual)}</td>

          <td class="stock-number">${formatNumber(item.stokAkhir)}</td>

          <td>${formatNumber(item.stokMinimum)}</td>

          <td><span class="badge ${badgeClass}">${escapeHtml(badgeText)}</span></td>
          <td><button class="btn btn-aksi" type="button" onclick="sesuaikanStok('${escapeHtml(item.idBarang)}')"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/></svg>Sesuaikan</button></td>

        </tr>`;

    }).join("");



    // Ringkasan memakai logika status stok yang sama dengan tabel.
    const getStockStatus = (item) => {
      const stokAkhir = Number(item.stokAkhir) || 0;
      const stokMinimum = Number(item.stokMinimum) || 0;
      if (stokAkhir <= 0) return "HABIS";
      if (stokAkhir <= stokMinimum) return "MENIPIS";
      return "AMAN";
    };

    const aman = data.filter(x => getStockStatus(x) === "AMAN").length;
    const menipis = data.filter(x => getStockStatus(x) === "MENIPIS").length;
    const habis = data.filter(x => getStockStatus(x) === "HABIS").length;



    summary.textContent =

      `${data.length} jenis barang • ${aman} aman • ${menipis} menipis • ${habis} habis`;

  }



  function getStatusStok(item) {
    const stokAkhir = Number(item.stokAkhir) || 0;
    const stokMinimum = Number(item.stokMinimum) || 0;
    if (stokAkhir <= 0) return "HABIS";
    if (stokAkhir <= stokMinimum) return "MENIPIS";
    return "AMAN";
  }

  function getFilteredStokData() {
    const searchEl = document.getElementById("stockSearch");
    const statusEl = document.getElementById("stockStatusFilter");
    const keyword = searchEl ? searchEl.value.trim().toLowerCase() : "";
    const selectedStatus = statusEl ? statusEl.value : "SEMUA";

    return (Array.isArray(stokData) ? stokData : []).filter(item => {
      const cocokKata = !keyword ||
        String(item.idBarang || "").toLowerCase().includes(keyword) ||
        String(item.namaBarang || "").toLowerCase().includes(keyword);
      const cocokStatus = selectedStatus === "SEMUA" || getStatusStok(item) === selectedStatus;
      return cocokKata && cocokStatus;
    });
  }

  function filterStok() {
    renderStok(getFilteredStokData());
  }


  async function sesuaikanStok(idBarang) {
    const item = (Array.isArray(stokData) ? stokData : []).find(x => String(x.idBarang) === String(idBarang));
    if (!item) { alert("Data barang tidak ditemukan."); return; }

    const stokSebelumnya = Number(item.stokAkhir) || 0;
    const input = prompt(`Penyesuaian stok: ${item.namaBarang}\nStok aplikasi saat ini: ${stokSebelumnya}\n\nMasukkan jumlah stok fisik yang benar:`, String(stokSebelumnya));
    if (input === null) return;
    const stokFisik = Number(input);
    if (!Number.isFinite(stokFisik) || stokFisik < 0) {
      alert("Jumlah stok harus berupa angka 0 atau lebih."); return;
    }
    const alasan = prompt("Alasan penyesuaian (contoh: hasil hitung fisik toko):", "Hasil hitung fisik toko");
    if (alasan === null) return;
    if (!alasan.trim()) { alert("Alasan penyesuaian wajib diisi."); return; }

    const selisih = stokFisik - stokSebelumnya;
    if (!confirm(`Konfirmasi penyesuaian ${item.namaBarang}\nStok sebelumnya: ${stokSebelumnya}\nStok fisik: ${stokFisik}\nSelisih: ${selisih > 0 ? "+" : ""}${selisih}\n\nLanjutkan?`)) return;

    try {
      const { error: logError } = await supabaseClient.from("penyesuaian_stok").insert({
        id_barang: item.idBarang,
        nama_barang: item.namaBarang,
        tanggal: new Date().toISOString(),
        stok_sebelumnya: stokSebelumnya,
        stok_fisik: stokFisik,
        selisih: selisih,
        alasan: alasan.trim()
      });
      if (logError) throw logError;

      const { error: updateError } = await supabaseClient.from("stok")
        .update({ stok_akhir: stokFisik })
        .eq("id_barang", item.idBarang);
      if (updateError) throw updateError;

      alert("Stok berhasil disesuaikan. HPP dan transaksi lama tidak diubah.");
      await loadStok();
    } catch (error) {
      console.error("PENYESUAIAN STOK ERROR:", error);
      alert("Penyesuaian gagal: " + (error.message || "Periksa izin Supabase dan tabel penyesuaian_stok."));
    }
  }

  function downloadStokPDF() {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert("Library PDF belum siap. Pastikan koneksi internet aktif, lalu coba lagi.");
      return;
    }

    if (!Array.isArray(stokData) || !stokData.length) {
      alert("Data stok belum tersedia. Klik Refresh Stok terlebih dahulu.");
      return;
    }

    const dataPDF = getFilteredStokData();
    if (!dataPDF.length) {
      alert("Tidak ada data stok yang sesuai dengan pilihan filter saat ini.");
      return;
    }

    const statusFilterEl = document.getElementById("stockStatusFilter");
    const statusTerpilih = statusFilterEl ? statusFilterEl.value : "SEMUA";
    const namaStatus = statusTerpilih === "SEMUA" ? "SEMUA STATUS" : statusTerpilih;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("l", "mm", "a4");
    const margin = 12;
    let y = 14;

    const aman = dataPDF.filter(x => getStatusStok(x) === "AMAN").length;
    const menipis = dataPDF.filter(x => getStatusStok(x) === "MENIPIS").length;
    const habis = dataPDF.filter(x => getStatusStok(x) === "HABIS").length;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.text(`LAPORAN STOK BARANG - ${namaStatus}`, 148.5, y, { align: "center" });
    y += 7;

    doc.setFontSize(13);
    doc.text("BUMDes Sidang Jaya", 148.5, y, { align: "center" });
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Kampung Sidang Jaya", 148.5, y, { align: "center" });
    y += 5;
    doc.setFontSize(9);
    doc.text("Sistem Kas & Inventori", 148.5, y, { align: "center" });
    y += 5;

    doc.setDrawColor(21, 88, 117);
    doc.setLineWidth(0.7);
    doc.line(margin, y, 297 - margin, y);
    y += 7;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Tanggal Laporan", margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(formatLaporanDate(tanggalHariIniISO()), margin + 35, y);
    y += 8;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Ringkasan Stok", margin, y);
    y += 4;

    doc.autoTable({
      startY: y,
      head: [["Total Jenis Barang", "Stok Aman", "Stok Menipis", "Stok Habis"]],
      body: [[
        formatNumber(dataPDF.length),
        formatNumber(aman),
        formatNumber(menipis),
        formatNumber(habis)
      ]],
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 3, halign: "center" },
      headStyles: { fontStyle: "bold" },
      margin: { left: margin, right: margin }
    });

    y = doc.lastAutoTable.finalY + 8;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Daftar Stok Barang", margin, y);
    y += 2;

    const rows = dataPDF.map(item => [
      String(item.idBarang || "-"),
      String(item.namaBarang || "-"),
      formatNumber(item.stokAwal),
      formatNumber(item.barangMasuk),
      formatNumber(item.terjual),
      formatNumber(item.stokAkhir),
      formatNumber(item.stokMinimum),
      getStatusStok(item)
    ]);

    doc.autoTable({
      startY: y,
      head: [["ID Barang", "Nama Barang", "Stok Awal", "Barang Masuk", "Terjual", "Stok Akhir", "Minimum", "Status"]],
      body: rows,
      theme: "striped",
      styles: {
        fontSize: 8.5,
        cellPadding: 2.8,
        valign: "middle"
      },
      headStyles: { fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 68 },
        2: { halign: "right" },
        3: { halign: "right" },
        4: { halign: "right" },
        5: { halign: "right" },
        6: { halign: "right" },
        7: { halign: "center" }
      },
      margin: { left: margin, right: margin }
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(
        `BUMDes Sidang Jaya • Kampung Sidang Jaya • Laporan Stok • Halaman ${i}/${pageCount}`,
        148.5, 205, { align: "center" }
      );
    }

    doc.save(`Laporan-Stok-${namaStatus.replace(/\s+/g, "-")}-BUMDes-Sidang-Jaya-${tanggalHariIniISO()}.pdf`);
  }


  function formatNumber(value) {

    const c = (window.__fc || (window.__fc = {}));
    return (c.num || (c.num = new Intl.NumberFormat("id-ID"))).format(Number(value) || 0);

  }



  function escapeHtml(value) {

    return String(value ?? "")

      .replace(/&/g, "&amp;")

      .replace(/</g, "&lt;")

      .replace(/>/g, "&gt;")

      .replace(/"/g, "&quot;")

      .replace(/'/g, "&#039;");

  }



  // ============================================================

  // FORMAT RUPIAH

  // ============================================================



  function formatRupiah(value) {

    const c = (window.__fc || (window.__fc = {}));
    return (c.rp || (c.rp = new Intl.NumberFormat("id-ID", {

      style: "currency",

      currency: "IDR",

      maximumFractionDigits: 0

    }))).format(Number(value) || 0);

  }





  // ============================================================

  // START

  // ============================================================



  // cekKoneksi() dan loadDashboard() dijalankan setelah sesi login tervalidasi.



  // ============================================================
  // KAS
  // ============================================================

  let kasData = [];

  async function loadKas() {
    const body = document.getElementById("kasTableBody");
    const summary = document.getElementById("kasSummary");
    const result = document.getElementById("kasResult");

    if (!body) return;

    body.innerHTML = '<tr><td colspan="9" class="empty-state">Memuat data kas...</td></tr>';
    if (summary) summary.textContent = "Memuat data kas...";
    if (result) {
      result.className = "result";
      result.textContent = "";
    }

    try {
      // Ambil seluruh data kas secara bertahap (Supabase biasanya membatasi
      // hasil satu permintaan). Ini mencegah transaksi lama/baru terpotong di 1.000 baris.
      const data = await fetchAllRows(
        "kas",
        "id_kas,tanggal,jenis,kategori,keterangan,debit,kredit,referensi",
        q => q.order("tanggal", { ascending: true }).order("id_kas", { ascending: true }),
        1000, 4, "list:kas"
      );

      let saldo = 0;
      let totalMasuk = 0;
      let totalKeluar = 0;

      kasData = (Array.isArray(data) ? data : []).map(item => {
        const debit = Number(item.debit) || 0;
        const kredit = Number(item.kredit) || 0;

        totalMasuk += debit;
        totalKeluar += kredit;
        saldo += debit - kredit;

        return {
          idKas: item.id_kas || "",
          tanggal: item.tanggal || "",
          jenis: String(item.jenis || "").toUpperCase(),
          kategori: item.kategori || "",
          keterangan: item.keterangan || "",
          debit,
          kredit,
          saldo,
          referensi: item.referensi || ""
        };
      });

      document.getElementById("kasTotalMasuk").textContent = formatRupiah(totalMasuk);
      document.getElementById("kasTotalKeluar").textContent = formatRupiah(totalKeluar);
      document.getElementById("kasSaldoAkhir").textContent = formatRupiah(totalMasuk - totalKeluar);

      filterKas();

      if (result) {
        result.className = "result success";
        result.textContent = "✓ Data kas berhasil dimuat dari Supabase.";
      }

    } catch (error) {
      kasData = [];
      body.innerHTML = '<tr><td colspan="9" class="empty-state">❌ Data kas gagal dimuat.</td></tr>';
      if (summary) summary.textContent = "Gagal memuat data kas.";
      if (result) {
        result.className = "result error";
        result.textContent = "❌ " + (error.message || "Gagal mengambil data kas.");
      }
      console.error("loadKas Supabase:", error);
    }
  }

  function renderKas(data) {
    const body = document.getElementById("kasTableBody");
    const summary = document.getElementById("kasSummary");
    if (!body) return;
    if (!Array.isArray(data) || !data.length) {
      body.innerHTML = '<tr><td colspan="9" class="empty-state">Belum ada transaksi kas.</td></tr>';
      if (summary) summary.textContent = "0 transaksi";
      return;
    }
    body.innerHTML = data.map(item => {
      const jenis = String(item.jenis || "").toUpperCase();
      const debit = Number(item.debit) || 0;
      const kredit = Number(item.kredit) || 0;
      const saldo = Number(item.saldo) || 0;
      const badgeClass = jenis === "MASUK" ? "badge-safe" : "badge-danger";
      return `<tr><td>${escapeHtml(item.idKas || "-")}</td><td>${escapeHtml(formatKasDate(item.tanggal))}</td><td><span class="badge ${badgeClass}">${escapeHtml(jenis || "-")}</span></td><td>${escapeHtml(item.kategori || "-")}</td><td>${escapeHtml(item.keterangan || "-")}</td><td>${debit > 0 ? formatRupiah(debit) : "-"}</td><td>${kredit > 0 ? formatRupiah(kredit) : "-"}</td><td>${formatRupiah(saldo)}</td><td>${escapeHtml(item.referensi || "-")}</td></tr>`;
    }).join("");
    if (summary) summary.textContent = data.length + " transaksi";
  }

  function filterKas() {
    const keyword = String(document.getElementById("kasSearch")?.value || "").trim().toLowerCase();
    const mulai = String(document.getElementById("kasTanggalMulai")?.value || "");
    const selesai = String(document.getElementById("kasTanggalSelesai")?.value || "");
    const filtered = kasData.filter(item => {
      // Gunakan tanggal lokal browser (bukan potongan ISO UTC) agar konsisten
      // dengan tanggal yang ditampilkan kepada pengguna Indonesia.
      const t = toLocalDateInputValue(item.tanggal);
      const text = [item.idKas,item.tanggal,item.jenis,item.kategori,item.keterangan,item.debit,item.kredit,item.saldo,item.referensi].join(" ").toLowerCase();
      return (!keyword || text.includes(keyword)) && (!mulai || t >= mulai) && (!selesai || t <= selesai);
    });
    // Saldo tetap dihitung kronologis saat loadKas (tertua ke terbaru),
    // tetapi tampilan riwayat default menunjukkan transaksi input terbaru dahulu.
    filtered.sort((a, b) => {
      const timeA = new Date(a.tanggal || 0).getTime() || 0;
      const timeB = new Date(b.tanggal || 0).getTime() || 0;
      if (timeA !== timeB) return timeB - timeA;
      return String(b.idKas || "").localeCompare(String(a.idKas || ""));
    });
    renderKas(filtered);
    const masuk = filtered.reduce((s,x)=>s+(Number(x.debit)||0),0);
    const keluar = filtered.reduce((s,x)=>s+(Number(x.kredit)||0),0);
    document.getElementById("kasTotalMasuk").textContent = formatRupiah(masuk);
    document.getElementById("kasTotalKeluar").textContent = formatRupiah(keluar);
    document.getElementById("kasSaldoAkhir").textContent = formatRupiah(masuk-keluar);
  }

  function resetKasFilter() {
    ["kasSearch","kasTanggalMulai","kasTanggalSelesai"].forEach(id => { const el=document.getElementById(id); if(el) el.value=""; });
    filterKas();
  }

  function toLocalDateInputValue(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value).slice(0,10);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function formatKasDate(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    const c = (window.__fc || (window.__fc = {}));
    return (c.lap || (c.lap = new Intl.DateTimeFormat("id-ID", {day:"2-digit",month:"2-digit",year:"numeric"}))).format(date);
  }

  // ============================================================
  // LAPORAN
  // ============================================================

  let laporanData = { penjualan: [], pembelian: [], pengeluaran: [] };
  let laporanTerfilter = { penjualan: [], pembelian: [], pengeluaran: [] };

  function tanggalHariIniISO() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  async function loadLaporan() {
    const result = document.getElementById("laporanResult");
    if (result) {
      result.className = "result";
      result.textContent = "Memuat laporan dari Supabase...";
    }

    try {
      // Supabase biasanya mengembalikan maksimal 1.000 baris per permintaan.
      // Ambil data dengan pagination supaya laporan tidak terpotong di tengah bulan.
      async function ambilSemuaBarisLaporan(namaTabel, kolom, kunciUnik) {
        // Urutan harus unik (tanggal + kunci utama); jika hanya tanggal, halaman bisa tumpang-tindih.
        return fetchAllRows(namaTabel, kolom, q => q.order("tanggal", { ascending: true }).order(kunciUnik, { ascending: true }), 1000, 4, "laporan:" + namaTabel);
      }

      const [penjualanRows, pembelianRows, pengeluaranRows] = await Promise.all([
        ambilSemuaBarisLaporan(
          "penjualan",
          "id_penjualan,tanggal,id_barang,nama_barang,qty,hpp,harga_jual,total_penjualan,laba_kotor,pembayaran,keterangan",
          "id_penjualan"
        ),
        ambilSemuaBarisLaporan(
          "barang_masuk",
          "id_pembelian,tanggal,id_barang,nama_barang,supplier,qty,harga_beli,total_pembelian,pembayaran,nomor_nota,link_nota,keterangan",
          "id_pembelian"
        ),
        ambilSemuaBarisLaporan(
          "pengeluaran",
          "id_pengeluaran,tanggal,kategori,keterangan,jumlah,pembayaran",
          "id_pengeluaran"
        )
      ]);

      laporanData = {
        penjualan: (penjualanRows || []).map(x => ({
          id: x.id_penjualan,
          tanggal: x.tanggal,
          idBarang: x.id_barang,
          namaBarang: x.nama_barang,
          qty: Number(x.qty) || 0,
          hargaJual: Number(x.harga_jual) || 0,
          total: Number(x.total_penjualan) || 0,
          hpp: Number(x.hpp) || 0,
          laba: Number(x.laba_kotor) || 0,
          pembayaran: x.pembayaran || "Tunai",
          keterangan: x.keterangan || "",
          linkNota: x.link_nota || ""
        })),

        pembelian: (pembelianRows || []).map(x => ({
          id: x.id_pembelian,
          tanggal: x.tanggal,
          idBarang: x.id_barang,
          namaBarang: x.nama_barang,
          supplier: x.supplier || "",
          qty: Number(x.qty) || 0,
          hargaBeli: Number(x.harga_beli) || 0,
          total: Number(x.total_pembelian) || 0,
          pembayaran: x.pembayaran || "Tunai",
          nomorNota: x.nomor_nota || "",
          linkNota: x.link_nota || "",
          keterangan: x.keterangan || ""
        })),

        pengeluaran: (pengeluaranRows || []).map(x => ({
          id: x.id_pengeluaran,
          tanggal: x.tanggal,
          kategori: x.kategori || "",
          keterangan: x.keterangan || "",
          jumlah: Number(x.jumlah) || 0,
          pembayaran: x.pembayaran || "Tunai",
          referensi: x.referensi || "",
          linkNota: x.link_nota || ""
        }))
      };

      const today = tanggalHariIniISO();

      if (!document.getElementById("laporanMulai").value) {
        document.getElementById("laporanMulai").value = today.slice(0, 8) + "01";
      }

      if (!document.getElementById("laporanSelesai").value) {
        document.getElementById("laporanSelesai").value = today;
      }

      filterLaporan();

      if (result) {
        result.className = "result success";
        result.textContent =
          "✓ Laporan berhasil dimuat dari Supabase.";
      }

    } catch (error) {
      if (result) {
        result.className = "result error";
        result.textContent =
          "❌ Gagal memuat laporan: " +
          (error.message || "Terjadi kesalahan.");
      }

      console.error("loadLaporan Supabase:", error);
    }
  }


  function filterLaporan() {
    const mulai = document.getElementById("laporanMulai").value;
    const selesai = document.getElementById("laporanSelesai").value;
    if (mulai && selesai && mulai > selesai) {
      const result = document.getElementById("laporanResult");
      result.className = "result error";
      result.textContent = "❌ Tanggal mulai tidak boleh lebih besar dari tanggal selesai.";
      return;
    }
    const cocok = item => {
      const t = String(item.tanggal || "").slice(0, 10);
      return (!mulai || t >= mulai) && (!selesai || t <= selesai);
    };
    const penjualan = laporanData.penjualan.filter(cocok);
    const pembelian = laporanData.pembelian.filter(cocok);
    const pengeluaran = laporanData.pengeluaran.filter(cocok);
    laporanTerfilter = { penjualan, pembelian, pengeluaran };
    const totalPenjualan = penjualan.reduce((s, x) => s + Number(x.total || 0), 0);
    const totalPembelian = pembelian.reduce((s, x) => s + Number(x.total || 0), 0);
    const totalPengeluaran = pengeluaran.reduce((s, x) => s + Number(x.jumlah || 0), 0);
    const labaKotor = penjualan.reduce((s, x) => s + Number(x.laba || 0), 0);
    const labaBersih = labaKotor - totalPengeluaran;
    document.getElementById("lapTotalPenjualan").textContent = formatRupiah(totalPenjualan);
    document.getElementById("lapTotalPembelian").textContent = formatRupiah(totalPembelian);
    document.getElementById("lapTotalPengeluaran").textContent = formatRupiah(totalPengeluaran);
    document.getElementById("lapLabaBersih").textContent = formatRupiah(labaBersih);
    renderLaporanPenjualan(penjualan);
    renderLaporanPembelian(pembelian);
    renderLaporanPengeluaran(pengeluaran);
    const result = document.getElementById("laporanResult");
    if (result) { result.className = "result"; result.textContent = `Periode: ${mulai || "semua"} s.d. ${selesai || "semua"}`; }
  }

  function renderLaporanPenjualan(data) {
    const body = document.getElementById("lapPenjualanBody");
    document.getElementById("lapPenjualanSummary").textContent = data.length + " transaksi";
    if (!data.length) { body.innerHTML = '<tr><td colspan="7" class="empty-state">Tidak ada transaksi penjualan pada periode ini.</td></tr>'; return; }
    body.innerHTML = data.map(x => `<tr><td>${escapeHtml(x.id || "-")}</td><td>${escapeHtml(formatLaporanDate(x.tanggal))}</td><td>${escapeHtml(x.namaBarang || x.idBarang || "-")}</td><td>${Number(x.qty || 0)}</td><td>${formatRupiah(Number(x.total || 0))}</td><td>${formatRupiah(Number(x.hpp || 0))}</td><td>${formatRupiah(Number(x.laba || 0))}</td></tr>`).join("");
  }

  function renderLaporanPembelian(data) {
    const body = document.getElementById("lapPembelianBody");
    document.getElementById("lapPembelianSummary").textContent = data.length + " transaksi";
    if (!data.length) { body.innerHTML = '<tr><td colspan="6" class="empty-state">Tidak ada transaksi pembelian pada periode ini.</td></tr>'; return; }
    body.innerHTML = data.map(x => `<tr><td>${escapeHtml(x.id || "-")}</td><td>${escapeHtml(formatLaporanDate(x.tanggal))}</td><td>${escapeHtml(x.namaBarang || x.idBarang || "-")}</td><td>${escapeHtml(x.supplier || "-")}</td><td>${Number(x.qty || 0)}</td><td>${formatRupiah(Number(x.total || 0))}</td></tr>`).join("");
  }

  function renderLaporanPengeluaran(data) {
    const body = document.getElementById("lapPengeluaranBody");
    document.getElementById("lapPengeluaranSummary").textContent = data.length + " transaksi";
    if (!data.length) { body.innerHTML = '<tr><td colspan="6" class="empty-state">Tidak ada pengeluaran pada periode ini.</td></tr>'; return; }
    body.innerHTML = data.map(x => `<tr><td>${escapeHtml(x.id || "-")}</td><td>${escapeHtml(formatLaporanDate(x.tanggal))}</td><td>${escapeHtml(x.kategori || "-")}</td><td>${escapeHtml(x.keterangan || "-")}</td><td>${escapeHtml(x.pembayaran || "-")}</td><td>${formatRupiah(Number(x.jumlah || 0))}</td></tr>`).join("");
  }

  // ============================================================
  // DOWNLOAD LAPORAN PDF
  // ============================================================

  function downloadLaporanPDF() {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert("Library PDF belum siap. Pastikan koneksi internet aktif, lalu coba lagi.");
      return;
    }

    const mulai = document.getElementById("laporanMulai").value || "";
    const selesai = document.getElementById("laporanSelesai").value || "";
    if (mulai && selesai && mulai > selesai) {
      alert("Tanggal mulai tidak boleh lebih besar dari tanggal selesai.");
      return;
    }

    const { penjualan, pembelian, pengeluaran } = laporanTerfilter;
    const totalPenjualan = penjualan.reduce((s, x) => s + Number(x.total || 0), 0);
    const totalPembelian = pembelian.reduce((s, x) => s + Number(x.total || 0), 0);
    const totalPengeluaran = pengeluaran.reduce((s, x) => s + Number(x.jumlah || 0), 0);
    const totalHPP = penjualan.reduce((s, x) => s + Number(x.hpp || 0), 0);
    // Gunakan nilai laba yang tersimpan pada setiap transaksi agar konsisten dengan aplikasi.
    const labaKotor = penjualan.reduce((s, x) => s + Number(x.laba || 0), 0);
    const labaBersih = labaKotor - totalPengeluaran;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("p", "mm", "a4");
    const margin = 12;
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 14;

    const dateKey = x => String(x.tanggal || "").slice(0, 10) || "-";
    const dateLabel = key => key === "-" ? "-" : formatLaporanDate(key);
    const rupiah = value => formatRupiah(Number(value || 0));

    // Rekap penjualan dan pembelian per tanggal, bukan satu baris per transaksi.
    function rekapTanggal(data, type) {
      const map = new Map();
      data.forEach(item => {
        const key = dateKey(item);
        if (!map.has(key)) {
          map.set(key, { tanggal: key, transaksi: 0, qty: 0, total: 0, hpp: 0, laba: 0 });
        }
        const row = map.get(key);
        row.transaksi += 1;
        row.qty += Number(item.qty || 0);
        row.total += Number(item.total || 0);
        if (type === "sales") {
          row.hpp += Number(item.hpp || 0);
          row.laba += Number(item.laba || 0);
        }
      });
      return [...map.values()].sort((a, b) => a.tanggal.localeCompare(b.tanggal));
    }

    // Pengeluaran diringkas per kategori.
    function rekapKategori(data) {
      const map = new Map();
      data.forEach(item => {
        const kategori = String(item.kategori || "Lainnya").trim() || "Lainnya";
        if (!map.has(kategori)) map.set(kategori, { kategori, transaksi: 0, jumlah: 0 });
        const row = map.get(kategori);
        row.transaksi += 1;
        row.jumlah += Number(item.jumlah || 0);
      });
      return [...map.values()].sort((a, b) => a.kategori.localeCompare(b.kategori, "id"));
    }

    // KOP LAPORAN
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("LAPORAN KEUANGAN BUMDes", pageWidth / 2, y, { align: "center" });
    y += 7;
    doc.setFontSize(12);
    doc.text("BUMDes Sidang Jaya", pageWidth / 2, y, { align: "center" });
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Kampung Sidang Jaya | Sistem Kas & Inventori", pageWidth / 2, y, { align: "center" });
    y += 5;
    doc.setDrawColor(21, 88, 117);
    doc.setLineWidth(0.7);
    doc.line(margin, y, pageWidth - margin, y);
    y += 7;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Periode Laporan", margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(`${mulai ? formatLaporanDate(mulai) : "Semua"} s.d. ${selesai ? formatLaporanDate(selesai) : "Semua"}`, margin + 34, y);
    y += 8;

    // Ringkasan keuangan utama
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.text("Ringkasan Keuangan", margin, y);
    y += 3;
    doc.autoTable({
      startY: y,
      head: [["Penjualan", "HPP", "Laba Kotor", "Pengeluaran", "Laba Bersih"]],
      body: [[rupiah(totalPenjualan), rupiah(totalHPP), rupiah(labaKotor), rupiah(totalPengeluaran), rupiah(labaBersih)]],
      theme: "grid",
      styles: { fontSize: 7.3, cellPadding: 2.3, halign: "center" },
      headStyles: { fillColor: [21, 88, 117], textColor: 255, fontStyle: "bold" },
      margin: { left: margin, right: margin }
    });
    y = doc.lastAutoTable.finalY + 6;

    // Tambahkan tabel rekap; AutoTable akan melanjutkan halaman bila diperlukan.
    function addSummaryTable(title, head, rows, emptyText) {
      if (y > 260) {
        doc.addPage();
        y = 15;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(title, margin, y);
      y += 2.5;
      doc.autoTable({
        startY: y,
        head: [head],
        body: rows.length ? rows : [[emptyText]],
        theme: "striped",
        styles: { fontSize: 7.5, cellPadding: 2.1, overflow: "linebreak", valign: "middle" },
        headStyles: { fillColor: [21, 88, 117], textColor: 255, fontStyle: "bold" },
        margin: { left: margin, right: margin },
        didParseCell(data) {
          if (!rows.length && data.section === "body") data.cell.colSpan = head.length;
        }
      });
      y = doc.lastAutoTable.finalY + 6;
    }

    const salesDaily = rekapTanggal(penjualan, "sales");
    addSummaryTable(
      `Rekap Penjualan Harian (${penjualan.length} transaksi)`,
      ["Tanggal", "Transaksi", "Qty", "Penjualan", "HPP", "Laba Kotor"],
      salesDaily.map(x => [dateLabel(x.tanggal), formatNumber(x.transaksi), formatNumber(x.qty), rupiah(x.total), rupiah(x.hpp), rupiah(x.laba)]),
      "Tidak ada transaksi penjualan pada periode ini."
    );

    const purchaseDaily = rekapTanggal(pembelian, "purchase");
    addSummaryTable(
      `Rekap Pembelian Harian (${pembelian.length} transaksi)`,
      ["Tanggal", "Transaksi", "Qty", "Total Pembelian"],
      purchaseDaily.map(x => [dateLabel(x.tanggal), formatNumber(x.transaksi), formatNumber(x.qty), rupiah(x.total)]),
      "Tidak ada transaksi pembelian pada periode ini."
    );

    const expenseCategories = rekapKategori(pengeluaran);
    addSummaryTable(
      `Rekap Pengeluaran per Kategori (${pengeluaran.length} transaksi)`,
      ["Kategori", "Transaksi", "Total Pengeluaran"],
      expenseCategories.map(x => [x.kategori, formatNumber(x.transaksi), rupiah(x.jumlah)]),
      "Tidak ada pengeluaran pada periode ini."
    );

    // Total pembelian dicantumkan sebagai informasi tambahan pada penutup laporan.
    if (y > 265) {
      doc.addPage();
      y = 15;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`Total Pembelian Periode: ${rupiah(totalPembelian)}`, margin, y);

    // Footer setiap halaman
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.text(
        `BUMDes Sidang Jaya - Kampung Sidang Jaya - Halaman ${i}/${pageCount}`,
        pageWidth / 2, 289, { align: "center" }
      );
    }

    const suffix = selesai || mulai || tanggalHariIniISO();
    doc.save(`Laporan-Ringkas-BUMDes-Mandiri-Sejahtera-${suffix}.pdf`);
  }
  function formatLaporanDate(value) {
    if (!value) return "-";
    const parts = String(value).slice(0,10).split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return String(value);
  }



  // ============================================================
  // RIWAYAT TRANSAKSI + EDIT / HAPUS
  // ============================================================

  let salesHistoryData = [];
  let purchaseHistoryData = [];
  let expenseHistoryData = [];

  // Tanggal transaksi hanya menampilkan tanggal pilihan pengguna, bukan jam.
  function formatHistoryDate(value) {
    if (!value) return "-";
    const s = String(value);
    const match = s.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) {
      const [y,m,d] = match[1].split("-");
      return `${d}/${m}/${y}`;
    }
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return s;
    const c = (window.__fc || (window.__fc = {}));
    return (c.hd || (c.hd = new Intl.DateTimeFormat("id-ID", {day:"2-digit", month:"2-digit", year:"numeric", timeZone:"Asia/Jayapura"}))).format(d);
  }

  // Waktu input diambil dari created_at yang dibuat oleh PostgreSQL saat INSERT.
  function formatInputTime(createdAt, fallbackDate) {
    const value = createdAt || fallbackDate;
    if (!value) return "Belum tercatat";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "Belum tercatat";
    const c = (window.__fc || (window.__fc = {}));
    return (c.it || (c.it = new Intl.DateTimeFormat("id-ID", {day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit", second:"2-digit", hourCycle:"h23", timeZone:"Asia/Jayapura"}))).format(d);
  }

  // Kirim tanggal transaksi sebagai DATE string YYYY-MM-DD.
  // Hindari konversi timestamp UTC/WIT yang dapat menggeser tanggal.
  function tanggalInputKeISO(value) {
    const match = String(value || "").match(/^(\d{4}-\d{2}-\d{2})$/);
    return match ? match[1] : tanggalInputHariIni();
  }

  function historyButton(kind, id) {
    const safe = encodeURIComponent(String(id || ""));
    return `<div class="history-actions">
      <button type="button" class="history-btn edit" onclick="editTransaction('${kind}','${safe}')">✏️ Edit</button>
      <button type="button" class="history-btn delete" onclick="deleteTransaction('${kind}','${safe}')">🗑 Hapus</button>${kind === "sales" ? `
      <button type="button" class="history-btn" onclick="reprintSalesReceipt('${safe}')">📄 Cetak nota</button>` : ""}
    </div>`;
  }

  async function loadSalesHistory() {
    const body = document.getElementById("salesHistoryBody");
    if (!body) return;
    body.innerHTML = '<tr><td colspan="13" class="history-empty">⏳ Memuat riwayat penjualan...</td></tr>';
    try {
      const semua = await fetchAllRows("penjualan", "id_penjualan,tanggal,created_at,id_barang,nama_barang,qty,hpp,harga_jual,total_penjualan,laba_kotor,pembayaran,keterangan,nama_penginput,id_penginput", q => q.order("created_at", {ascending:false, nullsFirst:false}).order("id_penjualan", {ascending:false}), 1000, 4, "hist:penjualan");
      salesHistoryData = semua;
      filterSalesHistory();
    } catch (error) {
      body.innerHTML = `<tr><td colspan="13" class="history-empty">❌ ${escapeHtml(error.message || "Gagal memuat riwayat")}</td></tr>`;
    }
  }

  const selectedSalesIds = new Set();

  function syncSalesBulkControls(visibleRows = []) {
    const isAdmin = String(window.bumdesCurrentRole || "").toLowerCase() === "admin";
    const button = document.getElementById("deleteSelectedSalesBtn");
    const selectAll = document.getElementById("selectAllSalesHistory");
    const selectHeader = document.getElementById("salesBulkSelectHeader");
    if (!isAdmin) selectedSalesIds.clear();
    if (button) {
      button.hidden = !isAdmin;
      button.disabled = !isAdmin || selectedSalesIds.size === 0;
      button.textContent = `🗑 Hapus Terpilih (${selectedSalesIds.size})`;
    }
    if (selectHeader) selectHeader.hidden = !isAdmin;
    document.querySelectorAll(".sales-bulk-select-cell").forEach(cell => { cell.hidden = !isAdmin; });
    if (selectAll) {
      selectAll.checked = isAdmin && visibleRows.length > 0 && visibleRows.every(row => selectedSalesIds.has(String(row.id_penjualan)));
      selectAll.indeterminate = isAdmin && visibleRows.some(row => selectedSalesIds.has(String(row.id_penjualan))) && !selectAll.checked;
    }
  }

  function getInputterBadgeClass(name) {
    const value = String(name || "").trim().toLowerCase();
    if (!value || value === "belum tercatat") return "inputter-badge inputter-unknown";
    let hash = 0;
    for (let i = 0; i < value.length; i++) hash = ((hash * 31) + value.charCodeAt(i)) >>> 0;
    return "inputter-badge inputter-color-" + (hash % 6);
  }

  // Penanda baris transaksi terakhir yang diinput: baris yang waktu inputnya paling baru (selisih maksimal 5 detik,
  // supaya satu transaksi berisi beberapa barang ikut ditandai). Dipakai untuk memberi warna hijau muda di riwayat.
  function idsInputTerakhir(data, idField, opsi) {
    opsi = opsi || {};
    const jendela = opsi.jendela || 5000;
    const kunci = opsi.kunci || (() => "");
    const set = new Set();
    let newest = 0, baru = null;
    (data || []).forEach(r => { const t = Date.parse(r.created_at || ""); if (t > newest) { newest = t; baru = r; } });
    if (!baru) return set;
    const k0 = kunci(baru);
    (data || []).forEach(r => {
      const t = Date.parse(r.created_at || "");
      if (t && newest - t <= jendela && kunci(r) === k0) set.add(String(r[idField]));
    });
    return set;
  }
  // Barang Masuk disimpan satu barang demi satu barang (tiap barang menunggu beberapa permintaan ke server),
  // sehingga waktu input antarbaris dalam satu nota bisa berselisih beberapa detik. Karena itu satu transaksi
  // dikenali dari data yang sama (pemasok, penginput, tanggal, nota, pembayaran, keterangan) dalam 3 menit.
  const kunciPembelian = r => [r.supplier, r.nama_penginput, r.tanggal, r.nomor_nota, r.pembayaran, r.keterangan]
    .map(v => v == null ? "" : String(v)).join("|");

  function renderSalesHistory(data) {
    const body = document.getElementById("salesHistoryBody");
    if (!body) return;
    if (!data.length) {
      body.innerHTML = '<tr><td colspan="13" class="history-empty">Belum ada transaksi penjualan.</td></tr>';
      syncSalesBulkControls([]);
      return;
    }
    const terbaru = idsInputTerakhir(salesHistoryData, "id_penjualan");
    body.innerHTML = data.map(x => {
      const id = String(x.id_penjualan);
      const checked = selectedSalesIds.has(id) ? "checked" : "";
      return `<tr${terbaru.has(id) ? ' class="row-terbaru"' : ""}>
      <td>${escapeHtml(x.id_penjualan)}</td>
      <td class="sales-bulk-select-cell" hidden><input type="checkbox" class="sales-history-select" data-sales-id="${escapeHtml(id)}" aria-label="Pilih transaksi ${escapeHtml(id)}" ${checked}></td>
      <td>${escapeHtml(formatHistoryDate(x.tanggal))}</td><td>${escapeHtml(formatInputTime(x.created_at, x.tanggal))}</td>
      <td>${escapeHtml(x.nama_barang || x.id_barang || "-")}</td><td>${formatNumber(x.qty)}</td>
      <td>${formatRupiah(x.harga_jual)}</td><td>${formatRupiah(x.total_penjualan)}</td>
      <td>${formatRupiah(x.hpp)}</td><td>${formatRupiah(x.laba_kotor)}</td>
      <td>${escapeHtml(x.pembayaran || "-")}</td><td><span class="${getInputterBadgeClass(x.nama_penginput)}">${escapeHtml(x.nama_penginput || "Belum tercatat")}</span></td><td>${historyButton("sales", x.id_penjualan)}</td>
    </tr>`;
    }).join("");
    syncSalesBulkControls(data);
  }
  function filterHistoryByDateAndSearch(data, config) {
    const q = String(document.getElementById(config.searchId)?.value || "").trim().toLowerCase();
    const from = String(document.getElementById(config.fromId)?.value || "");
    const to = String(document.getElementById(config.toId)?.value || "");
    const sortMode = String(document.getElementById(config.sortId)?.value || "input");
    let result = (data || []).filter(x => {
      const date = String(x.tanggal || "").slice(0, 10);
      if (from && (!date || date < from)) return false;
      if (to && (!date || date > to)) return false;
      if (!q) return true;
      return config.fields(x).join(" ").toLowerCase().includes(q);
    });
    const cmpStr = (x, y) => (x < y ? -1 : x > y ? 1 : 0);
    const numCol = (window.__fc || (window.__fc = {})).col || (window.__fc.col = new Intl.Collator(undefined, { numeric: true }));
    result.sort((a, b) => {
      if (sortMode === "date") {
        const byDate = cmpStr(String(b.tanggal || "").slice(0,10), String(a.tanggal || "").slice(0,10));
        if (byDate) return byDate;
      }
      const byInput = cmpStr(String(b.created_at || ""), String(a.created_at || ""));
      if (byInput) return byInput;
      return numCol.compare(String(b[config.idField] || ""), String(a[config.idField] || ""));
    });
    return result;
  }

  function getFilteredSalesHistory() {
    return filterHistoryByDateAndSearch(salesHistoryData, {
      searchId: "salesHistorySearch", fromId: "salesHistoryDateFrom", toId: "salesHistoryDateTo", sortId: "salesHistorySort", idField: "id_penjualan",
      fields: x => [x.id_penjualan,x.tanggal,x.created_at,x.nama_barang,x.id_barang,x.qty,x.harga_jual,x.total_penjualan,x.pembayaran,x.keterangan,x.nama_penginput]
    });
  }

  function filterSalesHistory() {
    renderSalesHistory(getFilteredSalesHistory());
  }

  document.getElementById("selectAllSalesHistory")?.addEventListener("change", function() {
    if (String(window.bumdesCurrentRole || "").toLowerCase() !== "admin") { this.checked = false; return; }
    const visible = getFilteredSalesHistory();
    visible.forEach(row => {
      const id = String(row.id_penjualan);
      if (this.checked) selectedSalesIds.add(id);
      else selectedSalesIds.delete(id);
    });
    filterSalesHistory();
  });

  document.getElementById("salesHistoryBody")?.addEventListener("change", function(event) {
    if (String(window.bumdesCurrentRole || "").toLowerCase() !== "admin") return;
    const checkbox = event.target.closest(".sales-history-select");
    if (!checkbox) return;
    const id = String(checkbox.dataset.salesId || "");
    if (checkbox.checked) selectedSalesIds.add(id);
    else selectedSalesIds.delete(id);
    syncSalesBulkControls(getFilteredSalesHistory());
  });
  // Mode halaman virtual: baris baru muncul saat pindah halaman, jadi kolom pilih (khusus Admin) disesuaikan lagi.
  document.getElementById("salesHistoryBody")?.closest("table")?.addEventListener("pager:rendered", function () {
    const isAdmin = String(window.bumdesCurrentRole || "").toLowerCase() === "admin";
    this.querySelectorAll(".sales-bulk-select-cell").forEach(cell => { cell.hidden = !isAdmin; });
  });

  async function deleteSelectedSales() {
    if (String(window.bumdesCurrentRole || "").toLowerCase() !== "admin") {
      alert("Akses ditolak. Hanya Admin yang dapat menghapus transaksi secara massal.");
      selectedSalesIds.clear();
      syncSalesBulkControls(getFilteredSalesHistory());
      return;
    }
    const ids = Array.from(selectedSalesIds);
    if (!ids.length) return;
    const rows = salesHistoryData.filter(row => ids.includes(String(row.id_penjualan)));
    if (rows.length !== ids.length) {
      alert("Sebagian transaksi terpilih tidak ditemukan. Refresh riwayat lalu pilih kembali.");
      return;
    }
    const dates = [...new Set(rows.map(row => String(row.tanggal || "").slice(0,10)).filter(Boolean))];
    const total = rows.reduce((sum, row) => sum + (Number(row.total_penjualan) || 0), 0);
    const message = `Anda akan menghapus ${rows.length} baris transaksi penjualan.\\nTanggal: ${dates.join(", ") || "-"}\\nTotal: ${formatRupiah(total)}\\n\\nKas terkait akan dihapus dan stok barang dihitung ulang. Penghapusan permanen. Lanjutkan?`;
    if (!confirm(message)) return;

    const button = document.getElementById("deleteSelectedSalesBtn");
    if (button) { button.disabled = true; button.textContent = "Menghapus…"; }
    try {
      const uniqueIds = [...new Set(rows.map(row => String(row.id_penjualan)))];
      const rowById = new Map(rows.map(row => [String(row.id_penjualan), row]));

      // Daftar ID dipecah per 50 agar alamat permintaan tidak kepanjangan (aman untuk ratusan transaksi).
      // Tiap potongan: hapus kas lalu penjualannya, jadi bila gagal di tengah, yang sudah terhapus tetap konsisten.
      const DELETE_CHUNK_SIZE = 50;
      const deletedIds = [];
      let deleteError = null;
      try {
        for (let start = 0; start < uniqueIds.length; start += DELETE_CHUNK_SIZE) {
          const chunk = uniqueIds.slice(start, start + DELETE_CHUNK_SIZE);
          const { error: kasError } = await supabaseClient.from("kas").delete().in("referensi", chunk);
          if (kasError) throw kasError;
          const { error: salesError } = await supabaseClient.from("penjualan").delete().in("id_penjualan", chunk);
          if (salesError) throw salesError;
          deletedIds.push(...chunk);
        }
      } catch (error) {
        deleteError = error;
      }

      // Stok dihitung ulang untuk barang yang transaksinya benar-benar sudah terhapus (juga bila proses berhenti di tengah).
      const uniqueItems = [...new Set(deletedIds.map(id => String((rowById.get(id) || {}).id_barang || "")).filter(Boolean))];

      // Hitung ulang stok beberapa barang secara paralel dengan batas aman.
      const REBUILD_STOCK_BATCH_SIZE = 5;
      for (let start = 0; start < uniqueItems.length; start += REBUILD_STOCK_BATCH_SIZE) {
        const batch = uniqueItems.slice(start, start + REBUILD_STOCK_BATCH_SIZE);
        const results = await Promise.allSettled(batch.map(idBarang => rebuildStockForItem(idBarang)));
        const failed = results.find(result => result.status === "rejected");
        if (failed) throw failed.reason;
      }

      if (deleteError) {
        deletedIds.forEach(id => selectedSalesIds.delete(id));
        throw new Error(`${deletedIds.length} dari ${uniqueIds.length} transaksi sudah terhapus (stoknya sudah dihitung ulang), sisanya gagal: ` + (deleteError.message || "Terjadi kesalahan."));
      }
      uniqueIds.forEach(id => selectedSalesIds.delete(id));
      alert(`Berhasil menghapus ${uniqueIds.length} transaksi. Stok telah dihitung ulang.`);
      await loadSalesHistory();
      await refreshCrudViews();
    } catch (error) {
      alert("Gagal menghapus transaksi terpilih: " + (error.message || "Terjadi kesalahan."));
      console.error("BULK SALES DELETE ERROR:", error);
      await loadSalesHistory();
    } finally {
      syncSalesBulkControls(getFilteredSalesHistory());
    }
  }
  window.deleteSelectedSales = deleteSelectedSales;

  async function loadPurchaseHistory() {
    const body = document.getElementById("purchaseHistoryBody");
    if (!body) return;
    body.innerHTML = '<tr><td colspan="12" class="history-empty">⏳ Memuat riwayat barang masuk...</td></tr>';
    try {
      const semua = await fetchAllRows("barang_masuk", "id_pembelian,tanggal,created_at,id_barang,nama_barang,supplier,qty,harga_beli,total_pembelian,pembayaran,nomor_nota,link_nota,keterangan,nama_penginput,id_penginput", q => q.order("created_at", {ascending:false, nullsFirst:false}).order("id_pembelian", {ascending:false}), 1000, 4, "hist:barang_masuk");
      purchaseHistoryData = semua;
      filterPurchaseHistory();
    } catch (error) {
      body.innerHTML = `<tr><td colspan="12" class="history-empty">❌ ${escapeHtml(error.message || "Gagal memuat riwayat")}</td></tr>`;
    }
  }

  function renderPurchaseHistory(data) {
    const body = document.getElementById("purchaseHistoryBody");
    if (!body) return;
    if (!data.length) { body.innerHTML = '<tr><td colspan="12" class="history-empty">Belum ada barang masuk.</td></tr>'; return; }
    const terbaru = idsInputTerakhir(purchaseHistoryData, "id_pembelian", { jendela: 180000, kunci: kunciPembelian });
    body.innerHTML = data.map(x => `<tr${terbaru.has(String(x.id_pembelian)) ? ' class="row-terbaru"' : ""}>
      <td>${escapeHtml(x.id_pembelian)}</td><td>${escapeHtml(formatHistoryDate(x.tanggal))}</td><td>${escapeHtml(formatInputTime(x.created_at, x.tanggal))}</td>
      <td>${escapeHtml(x.nama_barang || x.id_barang || "-")}</td><td>${escapeHtml(x.supplier || "-")}</td>
      <td>${formatNumber(x.qty)}</td><td>${formatRupiah(x.harga_beli)}</td><td>${formatRupiah(x.total_pembelian)}</td>
      <td>${escapeHtml(x.pembayaran || "-")}</td><td>${escapeHtml(x.nomor_nota || "-")}</td><td><span class="${getInputterBadgeClass(x.nama_penginput)}">${escapeHtml(x.nama_penginput || "Belum tercatat")}</span></td><td>${historyButton("purchase", x.id_pembelian)}</td>
    </tr>`).join("");
  }

  function filterPurchaseHistory() {
    renderPurchaseHistory(filterHistoryByDateAndSearch(purchaseHistoryData, {
      searchId: "purchaseHistorySearch", fromId: "purchaseHistoryDateFrom", toId: "purchaseHistoryDateTo", sortId: "purchaseHistorySort", idField: "id_pembelian",
      fields: x => [x.id_pembelian,x.tanggal,x.created_at,x.nama_barang,x.id_barang,x.supplier,x.qty,x.harga_beli,x.total_pembelian,x.pembayaran,x.nomor_nota,x.keterangan,x.nama_penginput]
    }));
  }

  async function loadExpenseHistory() {
    const body = document.getElementById("expenseHistoryBody");
    if (!body) return;
    body.innerHTML = '<tr><td colspan="9" class="history-empty">⏳ Memuat riwayat pengeluaran...</td></tr>';
    try {
      const semua = await fetchAllRows("pengeluaran", "id_pengeluaran,tanggal,created_at,kategori,keterangan,jumlah,pembayaran,referensi", q => q.order("created_at", {ascending:false, nullsFirst:false}).order("id_pengeluaran", {ascending:false}), 1000, 4, "hist:pengeluaran");
      expenseHistoryData = semua;
      filterExpenseHistory();
    } catch (error) {
      body.innerHTML = `<tr><td colspan="9" class="history-empty">❌ ${escapeHtml(error.message || "Gagal memuat riwayat")}</td></tr>`;
    }
  }

  function renderExpenseHistory(data) {
    const body = document.getElementById("expenseHistoryBody");
    if (!body) return;
    if (!data.length) { body.innerHTML = '<tr><td colspan="9" class="history-empty">Belum ada pengeluaran.</td></tr>'; return; }
    const terbaru = idsInputTerakhir(expenseHistoryData, "id_pengeluaran");
    body.innerHTML = data.map(x => `<tr${terbaru.has(String(x.id_pengeluaran)) ? ' class="row-terbaru"' : ""}>
      <td>${escapeHtml(x.id_pengeluaran)}</td><td>${escapeHtml(formatHistoryDate(x.tanggal))}</td><td>${escapeHtml(formatInputTime(x.created_at, x.tanggal))}</td>
      <td>${escapeHtml(x.kategori || "-")}</td><td>${escapeHtml(x.keterangan || "-")}</td>
      <td>${formatRupiah(x.jumlah)}</td><td>${escapeHtml(x.pembayaran || "-")}</td>
      <td>${escapeHtml(x.referensi || "-")}</td><td>${historyButton("expense", x.id_pengeluaran)}</td>
    </tr>`).join("");
  }

  function filterExpenseHistory() {
    renderExpenseHistory(filterHistoryByDateAndSearch(expenseHistoryData, {
      searchId: "expenseHistorySearch", fromId: "expenseHistoryDateFrom", toId: "expenseHistoryDateTo", sortId: "expenseHistorySort", idField: "id_pengeluaran",
      fields: x => [x.id_pengeluaran,x.tanggal,x.created_at,x.kategori,x.keterangan,x.jumlah,x.pembayaran,x.referensi]
    }));
  }

  async function getKasByReferensi(ref) {
    const {data,error} = await supabaseClient.from("kas")
      .select("id_kas,tanggal,jenis,kategori,keterangan,debit,kredit,referensi")
      .eq("referensi", ref);
    if (error) throw error;
    return data || [];
  }

  async function syncKasForTransaction(ref, type, row, forceCreate=true) {
    const refs = await getKasByReferensi(ref);
    const cash = String(row.pembayaran || "").toLowerCase() === "tunai";
    if (!cash) {
      if (refs.length) {
        const {error} = await supabaseClient.from("kas").delete().eq("referensi", ref);
        if (error) throw error;
      }
      return;
    }

    let kategori = type === "sales" ? "Penjualan" : (type === "purchase" ? "Pembelian" : (row.kategori || "Pengeluaran"));
    let keterangan = type === "sales"
      ? `Penjualan ${row.nama_barang || row.id_barang || ""}`.trim()
      : type === "purchase"
        ? `Pembelian ${row.nama_barang || row.id_barang || ""}`.trim()
        : (row.keterangan || "Pengeluaran");
    let debit = type === "sales" ? Number(row.total_penjualan) || 0 : 0;
    let kredit = type === "sales" ? 0 : (type === "purchase" ? Number(row.total_pembelian) || 0 : Number(row.jumlah) || 0);
    const payload = {tanggal: row.tanggal || new Date().toISOString(), jenis: type === "sales" ? "MASUK" : "KELUAR", kategori, keterangan, debit, kredit, referensi: ref};

    if (refs.length) {
      const {error} = await supabaseClient.from("kas").update(payload).eq("referensi", ref);
      if (error) throw error;
    } else if (forceCreate) {
      const idKas = "KAS-EDIT-" + Date.now() + "-" + Math.random().toString(36).slice(2,8).toUpperCase();
      const {error} = await supabaseClient.from("kas").insert({...payload,id_kas:idKas});
      if (error) throw error;
    }
  }

  async function deleteKasForReference(ref) {
    const {error} = await supabaseClient.from("kas").delete().eq("referensi", ref);
    if (error) throw error;
  }

  async function rebuildStockForItem(idBarang) {
    const [{data: stok,error: stokError},{data: master,error: masterError},{data: purchases,error: pError},{data: sales,error: sError}] = await Promise.all([
      supabaseClient.from("stok").select("id_barang,nama_barang,stok_awal,barang_masuk,terjual").eq("id_barang",idBarang).maybeSingle(),
      supabaseClient.from("master_barang").select("id_barang,hpp_rata_rata,harga_beli_terakhir,harga_jual,stok_minimum,status,aktif").eq("id_barang",idBarang).maybeSingle(),
      supabaseClient.from("barang_masuk").select("qty,harga_beli").eq("id_barang",idBarang),
      supabaseClient.from("penjualan").select("qty").eq("id_barang",idBarang)
    ]);
    if (stokError) throw stokError; if (masterError) throw masterError; if (pError) throw pError; if (sError) throw sError;
    if (!stok || !master) throw new Error("Data stok/master barang tidak ditemukan.");
    const masuk = (purchases || []).reduce((n,x)=>n+(Number(x.qty)||0),0);
    const terjual = (sales || []).reduce((n,x)=>n+(Number(x.qty)||0),0);
    const stokAwal = Number(stok.stok_awal)||0;
    const stokAkhir = stokAwal + masuk - terjual;
    const min = Number(master.stok_minimum)||0;
    const status = stokAkhir <= 0 ? "HABIS" : (stokAkhir <= min ? "MENIPIS" : "AMAN");

    // Hitung HPP rata-rata dari stok awal + histori pembelian.
    // Harga HPP awal dipulihkan dari HPP saat ini sebelum perubahan agar histori tetap konsisten.
    let hppAwal = Number(master.hpp_rata_rata)||Number(master.harga_beli_terakhir)||0;
    const totalPurchaseQtyBefore = masuk;
    if (stokAwal > 0 && totalPurchaseQtyBefore > 0 && Number(master.hpp_rata_rata) > 0) {
      const nilaiPembelian = (purchases || []).reduce((n,x)=>n+(Number(x.qty)||0)*(Number(x.harga_beli)||0),0);
      const derived = ((Number(master.hpp_rata_rata) * (stokAwal + totalPurchaseQtyBefore)) - nilaiPembelian) / stokAwal;
      if (Number.isFinite(derived) && derived >= 0) hppAwal = derived;
    }
    const nilaiPembelian = (purchases || []).reduce((n,x)=>n+(Number(x.qty)||0)*(Number(x.harga_beli)||0),0);
    const nilaiAwal = stokAwal * hppAwal;
    const hppBaru = (stokAwal + masuk) > 0 ? Math.round((nilaiAwal + nilaiPembelian) / (stokAwal + masuk)) : 0;
    const hargaTerakhir = purchases && purchases.length ? Number(purchases[purchases.length-1].harga_beli)||0 : hppAwal;

    const {error: stockUpdateError} = await supabaseClient.from("stok").update({barang_masuk:masuk,terjual:terjual,stok_akhir:stokAkhir}).eq("id_barang",idBarang);
    if (stockUpdateError) throw stockUpdateError;
    const {error: masterUpdateError} = await supabaseClient.from("master_barang").update({hpp_rata_rata:hppBaru,harga_beli_terakhir:hargaTerakhir}).eq("id_barang",idBarang);
    if (masterUpdateError) throw masterUpdateError;
  }

  async function refreshCrudViews() {
    // Stok berubah -> daftar produk Penjualan dan Barang Masuk harus diambil ulang.
    salesProductsLoaded = false;
    salesProducts = [];
    purchaseProductsLoaded = false;
    purchaseProducts = [];

    // Hanya halaman yang sedang terlihat yang dimuat ulang. Halaman lain otomatis
    // dimuat saat dibuka (showPage), jadi tidak perlu mengunduh data yang tak dilihat.
    const isActive = id => document.getElementById(id)?.classList.contains("active");
    const jobs = [];
    if (isActive("page-stok")) jobs.push(loadStok());
    if (isActive("page-dashboard")) jobs.push(loadDashboard());
    if (isActive("page-kas")) jobs.push(loadKas());
    if (isActive("page-penjualan")) {
      jobs.push((async () => {
        await loadSalesProducts();
        renderSalesProductList(document.getElementById("salesSearch")?.value || "");
      })());
    }
    if (isActive("page-pembelian")) {
      jobs.push((async () => {
        await loadPurchaseProducts();
        renderPurchaseProductList(document.getElementById("purchaseSearch")?.value || "");
      })());
    }
    const results = await Promise.allSettled(jobs);
    results.forEach(r => { if (r.status === "rejected") console.error("REFRESH ERROR:", r.reason); });
  }

  async function editTransaction(kind, encodedId) {
    const id = decodeURIComponent(encodedId || "");
    try {
      if (kind === "sales") {
        const row = salesHistoryData.find(x => String(x.id_penjualan) === String(id));
        if (!row) throw new Error("Transaksi penjualan tidak ditemukan.");
        const qty = Number(prompt(`Jumlah terjual untuk ${row.nama_barang}:`, row.qty));
        if (!Number.isFinite(qty) || qty <= 0) return;
        const tanggal = prompt("Tanggal transaksi (YYYY-MM-DD):", String(row.tanggal || "").slice(0,10) || tanggalInputHariIni());
        if (tanggal === null) return;
        const pembayaran = prompt("Pembayaran (Tunai/Transfer/Piutang):", row.pembayaran || "Tunai");
        if (pembayaran === null) return;
        const keterangan = prompt("Keterangan:", row.keterangan || "");
        if (keterangan === null) return;
        const stokRow = (await supabaseClient.from("stok").select("stok_awal,barang_masuk,terjual,stok_akhir").eq("id_barang",row.id_barang).maybeSingle()).data;
        if (!stokRow) throw new Error("Data stok tidak ditemukan.");
        const stokTersedia = (Number(stokRow.stok_akhir)||0) + (Number(row.qty)||0);
        if (qty > stokTersedia) throw new Error(`Stok tidak mencukupi. Maksimal untuk transaksi ini: ${formatNumber(stokTersedia)}.`);
        const hppUnit = Number(row.hpp)||0;
        const hargaJual = Number(row.harga_jual)||0;
        const total = qty * hargaJual, hpp = qty * hppUnit, laba = total - hpp;
        const {error} = await supabaseClient.from("penjualan").update({tanggal:tanggalInputKeISO(tanggal),qty,hpp:hppUnit,total_penjualan:total,laba_kotor:laba,pembayaran,keterangan:keterangan||null}).eq("id_penjualan",id);
        if (error) throw error;
        await rebuildStockForItem(row.id_barang);
        await syncKasForTransaction(id,"sales",{...row,tanggal:tanggalInputKeISO(tanggal),qty,total_penjualan:total,pembayaran,keterangan});
        alert("✅ Penjualan berhasil diedit.");
      }

      if (kind === "purchase") {
        const row = purchaseHistoryData.find(x => String(x.id_pembelian) === String(id));
        if (!row) throw new Error("Transaksi barang masuk tidak ditemukan.");
        const qty = Number(prompt(`Jumlah masuk untuk ${row.nama_barang}:`, row.qty));
        if (!Number.isFinite(qty) || qty <= 0) return;
        const tanggal = prompt("Tanggal barang masuk (YYYY-MM-DD):", String(row.tanggal || "").slice(0,10) || tanggalInputHariIni());
        if (tanggal === null) return;
        const hargaBeli = ambilAngkaHarga(prompt("Harga beli per unit:", String(row.harga_beli)));
        if (hargaBeli <= 0) return;
        const supplier = prompt("Supplier:", row.supplier || "");
        if (supplier === null) return;
        const pembayaran = prompt("Pembayaran (Tunai/Transfer/Hutang):", row.pembayaran || "Tunai");
        if (pembayaran === null) return;
        const nomorNota = prompt("Nomor Nota:", row.nomor_nota || "");
        if (nomorNota === null) return;
        const keterangan = prompt("Keterangan:", row.keterangan || "");
        if (keterangan === null) return;
        const {error} = await supabaseClient.from("barang_masuk").update({tanggal:tanggalInputKeISO(tanggal),qty,harga_beli:hargaBeli,total_pembelian:qty*hargaBeli,supplier:supplier||null,pembayaran,nomor_nota:nomorNota||null,keterangan:keterangan||null}).eq("id_pembelian",id);
        if (error) throw error;
        await rebuildStockForItem(row.id_barang);
        await syncKasForTransaction(id,"purchase",{...row,tanggal:tanggalInputKeISO(tanggal),qty,harga_beli:hargaBeli,total_pembelian:qty*hargaBeli,pembayaran});
        alert("✅ Barang masuk berhasil diedit.");
      }

      if (kind === "expense") {
        const row = expenseHistoryData.find(x => String(x.id_pengeluaran) === String(id));
        if (!row) throw new Error("Pengeluaran tidak ditemukan.");
        const tanggal = prompt("Tanggal pengeluaran (YYYY-MM-DD):", String(row.tanggal || "").slice(0,10) || tanggalInputHariIni());
        if (tanggal === null) return;
        const kategori = prompt("Kategori:", row.kategori || "Operasional");
        if (kategori === null) return;
        const keterangan = prompt("Keterangan:", row.keterangan || "");
        if (keterangan === null) return;
        const jumlah = ambilAngkaHarga(prompt("Jumlah:", String(row.jumlah)));
        if (jumlah <= 0) return;
        const pembayaran = prompt("Pembayaran (Tunai/Transfer):", row.pembayaran || "Tunai");
        if (pembayaran === null) return;
        const {error} = await supabaseClient.from("pengeluaran").update({tanggal:tanggalInputKeISO(tanggal),kategori,keterangan,jumlah,pembayaran}).eq("id_pengeluaran",id);
        if (error) throw error;
        await syncKasForTransaction(id,"expense",{...row,tanggal:tanggalInputKeISO(tanggal),kategori,keterangan,jumlah,pembayaran});
        alert("✅ Pengeluaran berhasil diedit.");
      }

      await loadSalesHistory();
      await loadPurchaseHistory();
      await loadExpenseHistory();
      await refreshCrudViews();
    } catch (error) {
      alert("❌ Gagal mengedit: " + (error.message || "Terjadi kesalahan."));
      console.error("CRUD EDIT ERROR:", error);
    }
  }

  async function deleteTransaction(kind, encodedId) {
    const id = decodeURIComponent(encodedId || "");
    const label = kind === "sales" ? "penjualan" : kind === "purchase" ? "barang masuk" : "pengeluaran";
    if (!confirm(`Yakin ingin menghapus transaksi ${label} ${id}?

Data terkait stok/kas akan ikut dikoreksi.`)) return;
    try {
      if (kind === "sales") {
        const row = salesHistoryData.find(x => String(x.id_penjualan) === String(id));
        if (!row) throw new Error("Transaksi penjualan tidak ditemukan.");
        await deleteKasForReference(id);
        const {error} = await supabaseClient.from("penjualan").delete().eq("id_penjualan",id);
        if (error) throw error;
        await rebuildStockForItem(row.id_barang);
      } else if (kind === "purchase") {
        const row = purchaseHistoryData.find(x => String(x.id_pembelian) === String(id));
        if (!row) throw new Error("Transaksi barang masuk tidak ditemukan.");
        await deleteKasForReference(id);
        const {error} = await supabaseClient.from("barang_masuk").delete().eq("id_pembelian",id);
        if (error) throw error;
        await rebuildStockForItem(row.id_barang);
      } else {
        await deleteKasForReference(id);
        const {error} = await supabaseClient.from("pengeluaran").delete().eq("id_pengeluaran",id);
        if (error) throw error;
      }
      alert("✅ Transaksi berhasil dihapus.");
      await loadSalesHistory();
      await loadPurchaseHistory();
      await loadExpenseHistory();
      await refreshCrudViews();
    } catch (error) {
      alert("❌ Gagal menghapus: " + (error.message || "Terjadi kesalahan."));
      console.error("CRUD DELETE ERROR:", error);
    }
  }
