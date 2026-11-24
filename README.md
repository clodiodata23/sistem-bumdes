# BUMDes Sidang Jaya - Sistem Kas & Inventori (v4)

Basis kode sama dengan Margorukun, memakai identitas dan database Supabase Sidang Jaya.

## Urutan deploy (WAJIB berurutan)
1. **Jalankan SQL**: Supabase > SQL Editor > tempel isi `supabase/migrasi-sidangjaya.sql` > Run.
   Hanya MENAMBAH kolom/tabel/fungsi, tidak mengubah atau menghapus data yang ada.
2. **(Untuk menu Manajemen Pengguna)** buat 2 Edge Function di dashboard Supabase (Edge Functions > Deploy a new function > Via Editor), tempel isi `index.ts` masing-masing:
   `admin-create-user` dan `admin-manage-user` (Supabase CLI: `supabase functions deploy <nama>`).
   Jika sebelumnya sudah ada dengan nama sama, cek dulu isinya sebelum menimpa.
3. **Unggah semua isi folder ini** ke hosting (folder `supabase/` dan `*.sql` diabaikan oleh `.assetsignore`).
4. Hapus `service-worker.js` lama dari hosting. Buka aplikasi online sekali setelah deploy.

## Struktur
- index.html  -> halaman login + aplikasi
- assets/css/ -> legacy.css (dasar), theme-pro.css (tema; warna utama di :root)
- assets/js/  -> inline-1.js = logika inti; modul: tutup-kas, wa-nota, reprint-nota, dashboard-plus, stok-bulanan,
                 backup-data, manajemen pengguna, suara, pasang-aplikasi, offline-layer, dll.
- sw.js       -> service worker (offline). Naikkan VERSION tiap deploy; perbarui SHELL bila menambah berkas.
- supabase/   -> SQL migrasi + Edge Function (tidak ikut dipublikasikan)

## Catatan
- Urutan <script> di index.html jangan diubah. offline-layer.js harus paling awal.
- Kolom stok memakai nama database Sidang Jaya: barang_masuk dan terjual.
- Cetak nota Bluetooth tidak didukung Safari iPhone; gunakan Android Chrome untuk kasir yang mencetak.
