// Suara untuk kelas bahasa Inggris.
//
// Urutan yang dicoba:
//   1. Rekaman MP3 yang sudah dibuat sebelumnya (public/audio/en/*.mp3).
//      Terdengar sama di semua perangkat, tidak bergantung pada suara bawaan browser.
//   2. Suara bawaan browser (speechSynthesis), hanya kalau rekamannya tidak ada.
//   3. Kalau dua-duanya tidak bisa, hasilnya 'gagal' supaya tampilan menawarkan teksnya.
//
// Daftar rekaman ada di src/data/rekaman-en.json: { kunci: nama_file }.
// Kunci dibuat dengan kunciSuara(). Skrip pembuat rekaman memakai aturan yang sama persis.
import daftarRekaman from '../data/rekaman-en.json';

const REKAMAN: Record<string, string> = daftarRekaman;

/**
 * rekaman   = rekaman MP3 diputar
 * browser   = suara bawaan browser diputar
 * diblokir  = browser menolak memutar sebelum pengguna mengetuk layar (aturan autoplay)
 * gagal     = tidak ada cara untuk memutar suara di perangkat ini
 */
export type HasilSuara = 'rekaman' | 'browser' | 'diblokir' | 'gagal';

/** Huruf kecil, tanda baca dibuang kecuali ' dan -, spasi dirapikan. */
export function kunciSuara(teks: string): string {
  return teks
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[^a-z0-9' -]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function adaRekaman(teks: string): boolean {
  return Object.prototype.hasOwnProperty.call(REKAMAN, kunciSuara(teks));
}

/** Alamat file rekaman, atau null kalau tidak ada. Mengikuti base Vite (GitHub Pages). */
export function alamatRekaman(teks: string): string | null {
  const nama = REKAMAN[kunciSuara(teks)];
  if (!nama) return null;
  const base = import.meta.env.BASE_URL || '/';
  return `${base}audio/en/${nama}.mp3`;
}

let audioAktif: HTMLAudioElement | null = null;
let giliran = 0;

/** Menghentikan suara yang sedang diputar (rekaman maupun suara browser). */
export function hentikanSuara(): void {
  giliran++;
  if (audioAktif) {
    audioAktif.pause();
    audioAktif = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Mengucapkan teks bahasa Inggris. Selalu mengembalikan hasil, tidak pernah melempar error.
 * Panggilan baru menghentikan suara sebelumnya.
 */
export async function ucapkan(teks: string, lambat = false): Promise<HasilSuara> {
  if (typeof window === 'undefined' || !teks.trim()) return 'gagal';
  hentikanSuara();
  const saya = giliran;

  const url = alamatRekaman(teks);
  if (url) {
    const hasil = await putarRekaman(url, lambat, saya);
    if (hasil !== 'gagal') return hasil;
  }
  if (saya !== giliran) return 'rekaman'; // sudah digantikan panggilan lain
  return ucapkanBrowser(teks, lambat, saya);
}

async function putarRekaman(url: string, lambat: boolean, saya: number): Promise<HasilSuara> {
  try {
    const audio = new Audio(url);
    // pelan: 0.7x. Browser modern menjaga nada suara tetap normal saat diperlambat.
    audio.defaultPlaybackRate = lambat ? 0.7 : 1;
    audio.playbackRate = lambat ? 0.7 : 1;
    audioAktif = audio;
    await audio.play();
    return 'rekaman';
  } catch (e) {
    const nama = (e as { name?: string } | null)?.name;
    if (saya !== giliran || nama === 'AbortError') return 'rekaman'; // dihentikan oleh suara berikutnya
    if (nama === 'NotAllowedError') return 'diblokir';
    return 'gagal'; // file tidak ada / format tidak didukung → coba suara browser
  }
}

function suaraInggris(): SpeechSynthesisVoice | undefined {
  const semua = window.speechSynthesis.getVoices();
  return (
    semua.find((v) => v.lang === 'en-US') ??
    semua.find((v) => v.lang === 'en-GB') ??
    semua.find((v) => v.lang.toLowerCase().startsWith('en'))
  );
}

function ucapkanBrowser(teks: string, lambat: boolean, saya: number): Promise<HasilSuara> {
  if (!('speechSynthesis' in window)) return Promise.resolve('gagal');
  return new Promise((selesai) => {
    let sudah = false;
    const akhiri = (h: HasilSuara) => {
      if (sudah) return;
      sudah = true;
      clearTimeout(batasWaktu);
      selesai(h);
    };
    // Di beberapa browser Linux tidak ada suara sama sekali: speak() diam saja tanpa error.
    const batasWaktu = setTimeout(() => akhiri(saya === giliran ? 'gagal' : 'browser'), 3000);
    try {
      const u = new SpeechSynthesisUtterance(teks);
      u.lang = 'en-US';
      // Jangan memakai suara bahasa lain: kalimat Inggris dengan suara Indonesia justru mengajarkan pelafalan yang salah.
      const v = suaraInggris();
      if (v) u.voice = v;
      u.rate = lambat ? 0.6 : 0.9;
      u.onstart = () => akhiri('browser');
      u.onend = () => akhiri('browser');
      u.onerror = (ev) => {
        if (ev.error === 'not-allowed') akhiri('diblokir');
        else if (ev.error === 'interrupted' || ev.error === 'canceled') akhiri('browser');
        else akhiri('gagal');
      };
      window.speechSynthesis.speak(u);
    } catch {
      akhiri('gagal');
    }
  });
}

/**
 * Perkiraan cepat tanpa memutar suara: true kalau teks punya rekaman
 * atau browser punya suara bahasa Inggris. Dipertahankan untuk kode lama.
 */
export async function bisaBersuara(teks?: string): Promise<boolean> {
  if (teks && adaRekaman(teks)) return true;
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  if (suaraInggris()) return true;
  await new Promise<void>((r) => {
    const t = setTimeout(r, 1500);
    window.speechSynthesis.addEventListener('voiceschanged', () => { clearTimeout(t); r(); }, { once: true });
  });
  return !!suaraInggris();
}
