-- ============================================================
-- Migrasi database Sidang Jaya agar cocok dengan aplikasi v4
-- AMAN: hanya MENAMBAH (kolom/tabel/trigger). Tidak mengubah atau menghapus data yang ada.
-- Jalankan sekali di Supabase > SQL Editor.
-- ============================================================

-- 1) Nama & id petugas penginput (untuk lencana "Penginput" di riwayat)
alter table public.penjualan    add column if not exists nama_penginput text;
alter table public.penjualan    add column if not exists id_penginput   uuid;
alter table public.barang_masuk add column if not exists nama_penginput text;
alter table public.barang_masuk add column if not exists id_penginput   uuid;

-- 2) Log penyesuaian stok (fitur "Sesuaikan" di halaman Stok)
create table if not exists public.penyesuaian_stok (
  id               bigint generated always as identity primary key,
  id_barang        text not null,
  nama_barang      text,
  tanggal          timestamptz not null default now(),
  stok_sebelumnya  numeric,
  stok_fisik       numeric,
  selisih          numeric,
  alasan           text,
  created_at       timestamptz not null default now()
);
alter table public.penyesuaian_stok enable row level security;
drop policy if exists "staff baca penyesuaian_stok"  on public.penyesuaian_stok;
drop policy if exists "staff tulis penyesuaian_stok" on public.penyesuaian_stok;
create policy "staff baca penyesuaian_stok" on public.penyesuaian_stok for select to authenticated
  using (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role in ('admin','petugas')));
create policy "staff tulis penyesuaian_stok" on public.penyesuaian_stok for insert to authenticated
  with check (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role in ('admin','petugas')));

-- 3) Status stok (HABIS / MENIPIS / AMAN) dijaga otomatis oleh database
create or replace function public.sj_set_status_stok() returns trigger language plpgsql as $$
declare v_min numeric;
begin
  select stok_minimum into v_min from public.master_barang where id_barang = new.id_barang;
  new.stok_minimum := coalesce(v_min, new.stok_minimum, 0);
  new.status := case when coalesce(new.stok_akhir,0) <= 0 then 'HABIS'
                     when coalesce(new.stok_akhir,0) <= new.stok_minimum then 'MENIPIS'
                     else 'AMAN' end;
  return new;
end $$;
drop trigger if exists trg_sj_set_status_stok on public.stok;
create trigger trg_sj_set_status_stok before insert or update of stok_akhir, stok_minimum on public.stok
  for each row execute function public.sj_set_status_stok();

-- 4) total_hpp penjualan selalu = hpp x qty (edit penjualan hanya mengubah hpp)
create or replace function public.sj_set_total_hpp() returns trigger language plpgsql as $$
begin
  new.total_hpp := coalesce(new.hpp,0) * coalesce(new.qty,0);
  return new;
end $$;
drop trigger if exists trg_sj_set_total_hpp on public.penjualan;
create trigger trg_sj_set_total_hpp before insert or update of hpp, qty on public.penjualan
  for each row execute function public.sj_set_total_hpp();

-- 5) (Opsional, mempercepat dashboard) total debit/kredit kas dalam 1 baris
create or replace function public.ringkasan_kas()
returns table(total_debit numeric, total_kredit numeric)
language sql stable security invoker as $$
  select coalesce(sum(debit),0), coalesce(sum(kredit),0) from public.kas;
$$;
grant execute on function public.ringkasan_kas() to authenticated;

-- 6) Tombol "Reset Data Operasional" (khusus Admin). Master Barang, stok, dan akun TIDAK dihapus.
create or replace function public.reset_data_operasional_admin()
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'admin') then
    raise exception 'Hanya Admin yang boleh mereset data operasional.';
  end if;
  delete from public.penjualan    where true;
  delete from public.barang_masuk where true;
  delete from public.pengeluaran  where true;
  delete from public.kas          where true;
end $$;
revoke all on function public.reset_data_operasional_admin() from public, anon;
grant execute on function public.reset_data_operasional_admin() to authenticated;
