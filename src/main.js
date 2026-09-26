/* =========================================================
   UNDANGAN PERNIKAHAN - src/main.js  (TAHAP 0)
   ---------------------------------------------------------------
   Entry point. Hanya demolitionetting-up event listener.

   Catatan penting:
   Script ini adalah ES MODULE, jadi variabel/fungsi di sini
   TIDAK lagi menempel ke window. Semua handler yang dulu
   ditulis inline (onclick="...") WAJIB disambungkan lewat
   addEventListener. Itu juga prepping agar Content-Security-Policy
   ketat bisa diaktifkan di Tahap 9.
   ========================================================= */

import './styles/main.css';

/* =========================================================
   KONFIGURASI SEMENTARA
   Di Tahap 1 semua ini dipindah ke src/config.js supaya
   klien bisa ubah isi/content tanpa sentuh kode.
   ========================================================= */
const EVENT = {
  // PENTING: offset +08:00 wajib ditulis.
  // Tanpa offset, tanggal di-parse sebagai waktu LOKAL perangkat
  // pengunjung -> countdown salah untuk tamu yang di luar WITA.
  // (Nilai ini masih placeholder, menunggu konfirmasi klien.)
  start: '2026-11-20T08:00:00+08:00',
};

/* =========================================================
   1. COUNTDOWN
   ========================================================= */
function initCountdown() {
  const box = document.getElementById('countdown');
  const note = document.getElementById('countdownNote');
  if (!box) return;

  const target = new Date(EVENT.start).getTime();

  const el = {
    days: document.getElementById('days'),
    hours: document.getElementById('hours'),
    minutes: document.getElementById('minutes'),
    seconds: document.getElementById('seconds'),
  };

  // Nanti: 0 = sudahLewat, 1 = sedangBerlangsung, 2 = Mendatang
  let timer = null;

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function render() {
    const dist = target - Date.now();

    if (dist <= 0) {
      clearInterval(timer);
      timer = null;
      el.days.textContent = '00';
      el.hours.textContent = '00';
      el.minutes.textContent = '00';
      el.seconds.textContent = '00';
      // Hari-H sudah lewat / sedang berlangsung - tampilkan statusnya
      const sedangBerlangsung = Date.now() - target < 4 * 60 * 60 * 1000;
      note.textContent = sedangBerlangsung
        ? 'Hari-H sudah tiba!'
        : `Acara telah berlalu. Terima kasih!`;
      note.hidden = false;
      return;
    }

    const days = Math.floor(dist / 86400000);
    const hours = Math.floor((dist % 86400000) / 3600000);
    const minutes = Math.floor((dist % 3600000) / 60000);
    const seconds = Math.floor((dist % 60000) / 1000);

    el.days.textContent = pad(days);
    el.hours.textContent = pad(hours);
    el.minutes.textContent = pad(minutes);
    el.seconds.textContent = pad(seconds);
  }

  // Jalankan SEKARANG, bukan setelah 1 detik.
  // Versi lama menampilkan "00 00 00 00" selama 1 detik pertama.
  render();
  timer = setInterval(render, 1000);

  // Hemat baterai: hentikan interval saat tab tidak terlihat.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clearInterval(timer);
      timer = null;
    } else if (timer === null) {
      render();
      timer = setInterval(render, 1000);
    }
  });
}

/* =========================================================
   2. MUSIK
   ========================================================= */
function initMusic() {
  const audio = document.getElementById('music');
  const btn = document.getElementById('musicButton');
  if (!audio || !btn) return;

  let playing = false;

  function paint() {
    btn.setAttribute('aria-pressed', String(playing));
    btn.setAttribute('aria-label', playing ? 'Jeda musik' : 'Putar musik');
    btn.title = playing ? 'Jeda musik' : 'Putar musik';
    btn.style.opacity = playing ? '1' : '.75';
  }

  async function play() {
    try {
      audio.volume = 0.45;
      await audio.play();
      playing = true;
    } catch (err) {
      // Autoplay diblokir browser / format tidak didukung.
      // Jangan pakai alert() - cukup diamkan, tombol tetap bisa diklik.
      playing = false;
    }
    paint();
  }

  function pause() {
    audio.pause();
    playing = false;
    paint();
  }

  function toggle() {
    if (audio.paused) play();
    else pause();
  }

  // Tombol musik (fungsi toggleMusic TIDAK PERNAH ADA di kode asli,
  // sehingga tombolnya mati total -> ReferenceError)
  btn.addEventListener('click', toggle);

  // "Buka Undangan" = gesture pertama pengguna, satu-satunya saat
  // browser mengizinkan autoplay.
  document.getElementById('openInvitation')?.addEventListener('click', () => {
    if (audio.paused) play();
  });

  // Jeda otomatis kalau user pindah tab.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && !audio.paused) pause();
  });

  paint();
}

/* =========================================================
   3. COPY TO CLIPBOARD
   ========================================================= */
async function copyText(text) {
  // Metode modern. Hanya jalan di HTTPS atau localhost.
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      /* jatuh ke fallback di bawah */
    }
  }

  // Fallback untuk HTTP / file:// / browser lama.
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.cssText = 'position:fixed;top:0;left:-9999px;opacity:0';
  document.body.appendChild(ta);
  ta.select();
  ta.setSelectionRange(0, text.length);

  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  document.body.removeChild(ta);
  return ok;
}

function initClipboard() {
  document.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const text = btn.dataset.copy;
      const label = btn.dataset.copyLabel || 'Nomor rekening';
      const ok = await copyText(text);

      // Kode lama selalu menampilkan "berhasil" walau gagal total.
      // Sekarang pesannya jujur.
      if (ok) {
        const prev = btn.textContent;
        btn.textContent = 'Tersalin!';
        setTimeout(() => { btn.textContent = prev; }, 1800);
      } else {
        btn.textContent = 'Gagal - salin manual';
        setTimeout(() => {
          btn.textContent = label === 'Nomor DANA'
            ? 'Salin Nomor DANA'
            : 'Salin Nomor Rekening';
        }, 2600);
      }
    });
  });
}

/* =========================================================
   4. RSVP  (Tahap 0: validasi saja, belum kirim ke database)
   ========================================================= */
function initRsvp() {
  const form = document.getElementById('rsvpForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const data = Object.fromEntries(new FormData(form).entries());
    const btn = form.querySelector('button[type="submit"]');

    // Di Tahap 0 tombol sengaja nonaktif supaya tidak memberi
    // harapan palsu. Di Tahap 6 tombol aktif & mengirim ke Supabase.
    btn.disabled = true;
    btn.textContent = 'Fitur dikirim di Tahap 6';

    console.log('[Tahap 0] Data RSVP belum dikirim:', data);

    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = 'Kirim Konfirmasi';
    }, 2600);
  });
}

/* =========================================================
   5. UCAPAN
   ========================================================= */
function initWishes() {
  const form = document.getElementById('wishForm');
  const list = document.getElementById('wishList');
  if (!form || !list) return;

  const nameInput = form.querySelector('#namaUcapan');
  const msgInput = form.querySelector('#isiUcapan');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = nameInput.value.trim();
    const message = msgInput.value.trim();
    if (!name || !message) return;

    const card = document.createElement('div');
    card.className = 'wish';

    // WAJIB textContent, BUKAN innerHTML.
    // Kode lama mengetik input mentah ke dalam innerHTML -> Stored XSS.
    const strong = document.createElement('strong');
    strong.textContent = name;

    const p = document.createElement('p');
    p.textContent = message;

    const time = document.createElement('time');
    time.textContent = 'baru saja';

    card.append(strong, p, time);
    list.prepend(card);

    nameInput.value = '';
    msgInput.value = '';

    // Di Tahap 5 baris ini diganti INSERT ke Supabase.
    console.log('[Tahap 0] Ucapan hanya di memori, akan hilang saat refresh:', {
      name, message,
    });
  });
}

/* =========================================================
   6. URL SHARE
   ========================================================= */
function initShareUrl() {
  const el = document.getElementById('shareUrl');
  if (!el) return;
  // issuance sementara; Tahap 9 pakai VITE_SITE_URL.
  el.textContent = window.location.host || 'undangan-contoh.vercel.app';
}

/* =========================================================
   INISIALISASI
   ========================================================= */
function boot() {
  initCountdown();
  initMusic();
  initClipboard();
  initRsvp();
  initWishes();
  initShareUrl();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
