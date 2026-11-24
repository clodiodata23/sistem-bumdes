async function ambilSemuaBarisUntukBackup(namaTabel) {
  const hasil = [];
  const ukuranBatch = 1000;
  for (let mulai = 0; ; mulai += ukuranBatch) {
    const { data, error } = await supabaseClient
      .from(namaTabel)
      .select("*")
      .range(mulai, mulai + ukuranBatch - 1);
    if (error) throw new Error("Gagal membaca tabel " + namaTabel + ": " + error.message);
    const batch = data || [];
    hasil.push(...batch);
    if (batch.length < ukuranBatch) break;
  }
  return hasil;
}

async function downloadFullBackup() {
  const tombol = document.getElementById("downloadBackupBtn");
  const status = document.getElementById("backupStatus");
  const tabel = ["master_barang", "stok", "barang_masuk", "penjualan", "pengeluaran", "kas"];
  tombol.disabled = true;
  tombol.textContent = "⏳ Menyiapkan backup...";
  status.className = "result";
  status.textContent = "";
  try {
    const backup = {
      aplikasi: "Sistem Kas & Inventori BUMDes Sidang Jaya",
      format_backup: 1,
      dibuat_pada: new Date().toISOString(),
      sumber: "Supabase",
      tabel: {}
    };
    for (const nama of tabel) {
      backup.tabel[nama] = await ambilSemuaBarisUntukBackup(nama);
    }
    const ringkasan = Object.fromEntries(tabel.map(nama => [nama, backup.tabel[nama].length]));
    backup.ringkasan_jumlah_baris = ringkasan;
    const blob = new Blob([JSON.stringify(backup, null, 2)], {type: "application/json;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const waktu = new Date();
    const capWaktu = [
      waktu.getFullYear(),
      String(waktu.getMonth()+1).padStart(2,"0"),
      String(waktu.getDate()).padStart(2,"0"),
      "_",
      String(waktu.getHours()).padStart(2,"0"),
      String(waktu.getMinutes()).padStart(2,"0")
    ].join("");
    a.href = url;
    a.download = "backup_bumdes_sidangjaya_" + capWaktu + ".json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    status.className = "result success";
    status.textContent = "✅ Backup berhasil dibuat. Jumlah data: " + tabel.map(n => n + " " + ringkasan[n]).join(" • ") + ". Simpan file di tempat aman.";
  } catch (error) {
    console.error("BACKUP ERROR:", error);
    status.className = "result error";
    status.textContent = "❌ Backup gagal: " + (error.message || "Periksa koneksi Supabase dan izin baca tabel.");
  } finally {
    tombol.disabled = false;
    tombol.textContent = "⬇️ Download Backup Lengkap";
  }
}
