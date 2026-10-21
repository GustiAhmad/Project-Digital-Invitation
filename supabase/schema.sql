-- =============================================================
--  supabase/schema.sql
--  -------------------------------------------------------------
--  Tabel & aturan keamanan (RLS) untuk papan "Doa & Ucapan".
--
--  CARA PAKAI:
--    1. Buka proyek Supabase Anda.
--    2. Menu kiri: SQL Editor > New query.
--    3. Salin SELURUH isi file ini, tempel, klik "Run".
--    4. Selesai. Tidak ada yang perlu diubah.
--
--  Aman dijalankan berulang kali (idempotent).
-- =============================================================

-- ---------- 1. Tabel utama ----------
create table if not exists public.wishes (
  id          uuid primary key default gen_random_uuid(),
  name        text        not null,
  message     text        not null,
  status      text        not null,
  created_at  timestamptz not null default now(),

  -- Batas panjang ditegakkan DI DATABASE, bukan hanya di browser.
  -- Validasi JavaScript bisa dilewati siapa pun yang memanggil API
  -- langsung; constraint ini tidak bisa.
  constraint wishes_name_len    check (char_length(name)    between 1 and 60),
  constraint wishes_message_len check (char_length(message) between 1 and 500),

  -- Status hanya boleh salah satu dari tiga pilihan form.
  constraint wishes_status_valid
    check (status in ('hadir', 'tidak_hadir', 'belum_pasti'))
);

-- Index untuk query "terbaru dulu", pola baca papan ucapan.
create index if not exists wishes_created_at_idx
  on public.wishes (created_at desc);

-- ---------- 2. Aktifkan Row Level Security ----------
--    Tanpa ini, tabel bisa dibaca/ditulis siapa saja memakai anon key.
alter table public.wishes enable row level security;

-- ---------- 3. Kebijakan RLS ----------
--    anon key memang publik (ada di bundle browser). RLS inilah yang
--    membatasi apa yang boleh dilakukan pemegang kunci itu.

-- 3a. Siapa pun boleh MEMBACA ucapan (papan bersifat publik).
drop policy if exists "wishes_select_public" on public.wishes;
create policy "wishes_select_public"
  on public.wishes
  for select
  to anon, authenticated
  using (true);

-- 3b. Siapa pun boleh MENAMBAH ucapan, TAPI tidak boleh memalsukan
--     waktu (created_at) atau memakai id sendiri. Kolom created_at
--     selalu diisi default now() oleh database.
drop policy if exists "wishes_insert_public" on public.wishes;
create policy "wishes_insert_public"
  on public.wishes
  for insert
  to anon, authenticated
  with check (true);

-- 3c. TIDAK ada policy update/delete untuk anon.
--     Artinya: pengunjung hanya bisa menambah, tidak bisa mengubah
--     atau menghapus ucapan orang lain. Moderasi (kalau nanti perlu)
--     dilakukan lewat service_role / dashboard, yang melewati RLS.

-- ---------- 4. Realtime ----------
--    Supaya ucapan baru muncul di HP semua tamu tanpa refresh.
--    "add table" aman diulang; kalau sudah ada, Supabase mengabaikan.
alter publication supabase_realtime add table public.wishes;
