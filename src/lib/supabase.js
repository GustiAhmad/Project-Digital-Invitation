/* =========================================================
   src/lib/supabase.js
   ---------------------------------------------------------------
   Klien Supabase untuk papan "Doa & Ucapan".

   KENAPA DIBUNGKUS SEPERTI INI:
     Aplikasi ini 100% frontend dan dipakai di HP tamu dengan
     koneksi internet yang tidak selalu bagus. Ada dua kondisi yang
     harus dilayani tanpa membuat halaman rusak:
       1. Env var belum diisi (dev lokal, sebelum deploy) -> fitur
          papan ucapan dinonaktifkan dengan rapi, form tetap jalan
          memakai penyimpanan lokal.
       2. Koneksi/ server bermasalah -> jangan crash; lempar error
          yang bisa ditangkap pemanggil.

   KEAMANAN:
     Hanya kunci `publishable`/`anon` yang dipakai di sini. Kunci
     itu memang publik dan SELALU dilindungi Row Level Security di
     sisi database (lihat supabase/schema.sql). Kunci
     `service_role` TIDAK BOLEH muncul di bundle browser.
   ========================================================= */

import { createClient } from '@supabase/supabase-js';

const url = import.meta.env?.VITE_SUPABASE_URL || '';
const anonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

/**
 * true kalau URL & kunci sudah diisi. Dipakai pemanggil untuk
 * memutuskan: pakai Supabase, atau jatuh ke penyimpanan lokal.
 */
export const isSupabaseConfigured = Boolean(url && anonKey);

/**
 * Klien Supabase, atau null kalau env belum diisi.
 * Selalu cek null sebelum dipakai.
 */
export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        // Papan ucapan tidak butuh login. Matikan agar tidak ada
        // sesi/refresh token yang disimpan di localStorage tamu.
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

/** Nama tabel, dikumpulkan di satu tempat supaya mudah diubah. */
export const WISHES_TABLE = 'wishes';
