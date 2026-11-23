# BUMDes Sidang Jaya - Sistem Kas & Inventori

Tahap 1: mode offline (disamakan dengan Margorukun).

Struktur:
- index.html                 -> aplikasi (belum dipecah; itu tahap berikutnya)
- sw.js                      -> service worker; WAJIB satu folder dengan index.html. Naikkan VERSION setiap deploy.
- assets/js/offline-layer.js -> antrean transaksi offline + salinan data terakhir (IndexedDB)
- manifest.json, icon-*.png, elegant-theme.css

Deploy: unggah SELURUH isi folder. Hapus service-worker.js lama dari hosting.
Buka aplikasi online sekali (termasuk halaman Penjualan & Barang Masuk) agar data tersimpan untuk mode offline.
