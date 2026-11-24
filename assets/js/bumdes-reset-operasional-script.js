    // Reset dilakukan melalui fungsi database yang memeriksa role Admin di Supabase.
    async function resetSemuaData() {
      const client = window.supabaseClient;
      if (!client || !client.auth) { alert("Koneksi Supabase belum siap. Muat ulang halaman."); return; }
      if (String(window.bumdesCurrentRole || "").toLowerCase() !== "admin") {
        alert("Akses ditolak. Fitur reset hanya untuk Admin."); return;
      }
      const yakin = confirm("PERINGATAN: Reset ini akan menghapus seluruh riwayat Penjualan, Barang Masuk, Pengeluaran, dan Kas. Master Barang, seluruh data stok beserta jumlah unit, dan akun pengguna tetap dipertahankan. Lanjutkan?");
      if (!yakin) return;
      const konfirmasi = prompt('Untuk melanjutkan, ketik RESET');
      if (konfirmasi !== "RESET") { alert("Reset dibatalkan. Teks konfirmasi tidak sesuai."); return; }
      const tombol = document.querySelector(".nav-reset");
      if (tombol) { tombol.disabled = true; tombol.dataset.oldText = tombol.innerText; tombol.innerText = "Memproses reset..."; }
      try {
        const { data, error } = await client.rpc("reset_data_operasional_admin");
        if (error) throw error;
        alert("Reset data operasional berhasil. Master Barang, data stok beserta jumlah unit, dan akun pengguna tetap aman.");
        if (typeof loadDashboard === "function") await loadDashboard();
        if (typeof loadMasterBarang === "function") await loadMasterBarang();
        if (typeof loadRiwayatPenjualan === "function") await loadRiwayatPenjualan();
        if (typeof loadRiwayatBarangMasuk === "function") await loadRiwayatBarangMasuk();
        if (typeof loadRiwayatPengeluaran === "function") await loadRiwayatPengeluaran();
        location.reload();
      } catch (err) {
        console.error("Reset data operasional gagal:", err);
        alert("Reset belum dijalankan. Pastikan SQL reset_data_operasional_admin sudah dipasang di Supabase. Detail: " + (err.message || err));
      } finally {
        if (tombol) { tombol.disabled = false; tombol.innerText = tombol.dataset.oldText || "Reset Data Operasional"; }
      }
    }
