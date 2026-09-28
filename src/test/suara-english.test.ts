import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import rekaman from '../data/rekaman-en.json';
import { kunciSuara, adaRekaman, alamatRekaman } from '../lib/suara';
import { normalisasi, cekKetik } from '../lib/latihan';
import type { Lesson } from '../types/schema';

const ROOT = path.resolve(__dirname, '../..');
const AUDIO = path.join(ROOT, 'public/audio/en');
const REKAMAN = rekaman as Record<string, string>;

// Kata tunggal yang sengaja tidak direkam (terlalu pendek, tidak lolos pemeriksaan pengenal suara).
// Di dalam kalimat, kata ini tetap terdengar.
const SENGAJA_TANPA_REKAMAN = new Set(["'s", "at", "bought", "he", "her", "the"]);

function semuaPelajaranLatihan(): { file: string; lesson: Lesson }[] {
  const dir = path.join(ROOT, 'content/english');
  const hasil: { file: string; lesson: Lesson }[] = [];
  for (const folder of fs.readdirSync(dir)) {
    const p = path.join(dir, folder);
    if (!fs.statSync(p).isDirectory()) continue;
    for (const f of fs.readdirSync(p)) {
      if (!f.startsWith('lesson-') || !f.endsWith('.json')) continue;
      const lesson = JSON.parse(fs.readFileSync(path.join(p, f), 'utf8')) as Lesson;
      if (lesson.mode === 'latihan') hasil.push({ file: `${folder}/${f}`, lesson });
    }
  }
  return hasil;
}

/** Teks bahasa Inggris yang diputar aplikasi untuk satu kartu (sama dengan skrip pembuat rekaman). */
function teksDiputar(card: Lesson['cards'][number]): string[] {
  switch (card.type) {
    case 'listen_tiles':
      return [card.text];
    case 'translate_tiles':
      return [card.direction === 'en-id' ? card.prompt : card.answers[0].join(' ')];
    case 'type_translation':
      return [card.direction === 'en-id' ? card.prompt : card.answers[0]];
    case 'match_pairs':
      return card.pairs.map((p) => p.en);
    default:
      return [];
  }
}

describe('kunciSuara', () => {
  it('menyamakan huruf besar, tanda baca, dan apostrof miring', () => {
    expect(kunciSuara('Hi, good morning.')).toBe('hi good morning');
    expect(kunciSuara('I’m fine, thanks!')).toBe("i'm fine thanks");
    expect(kunciSuara("It's seven o'clock.")).toBe("it's seven o'clock");
    expect(kunciSuara('twenty-one')).toBe('twenty-one');
    expect(kunciSuara('  See   you  ')).toBe('see you');
  });

  it('alamat rekaman mengikuti BASE_URL, null kalau tidak ada', () => {
    expect(alamatRekaman('Hi, good morning.')).toMatch(/audio\/en\/[0-9a-f]{12}\.mp3$/);
    expect(alamatRekaman('kalimat yang tidak pernah direkam')).toBeNull();
  });
});

describe('Rekaman suara bahasa Inggris', () => {
  it('setiap entri di rekaman-en.json punya file MP3', () => {
    const hilang = Object.entries(REKAMAN).filter(([, f]) => !fs.existsSync(path.join(AUDIO, `${f}.mp3`)));
    expect(hilang, `file hilang: ${hilang.map(([k]) => k).join(', ')}`).toEqual([]);
  });

  it('tidak ada file MP3 yatim di public/audio/en', () => {
    const dipakai = new Set(Object.values(REKAMAN).map((f) => `${f}.mp3`));
    const yatim = fs.readdirSync(AUDIO).filter((f) => f.endsWith('.mp3') && !dipakai.has(f));
    expect(yatim).toEqual([]);
  });

  it('semua kalimat yang diputar di pelajaran latihan punya rekaman', () => {
    const kurang: string[] = [];
    for (const { file, lesson } of semuaPelajaranLatihan()) {
      lesson.cards.forEach((card, i) => {
        for (const t of teksDiputar(card)) {
          if (!adaRekaman(t) && !SENGAJA_TANPA_REKAMAN.has(kunciSuara(t))) kurang.push(`${file} kartu ${i + 1}: "${t}"`);
        }
      });
      for (const nw of lesson.newWords ?? []) {
        if (!adaRekaman(nw.word) && !SENGAJA_TANPA_REKAMAN.has(kunciSuara(nw.word))) kurang.push(`${file} kata baru: "${nw.word}"`);
      }
    }
    expect(kurang).toEqual([]);
  });
});

describe('normalisasi jawaban ketik', () => {
  it('koma dan titik di tengah kalimat tidak membuat jawaban salah', () => {
    expect(normalisasi("I'm fine, thank you.")).toBe(normalisasi("i'm fine thank you"));
    expect(cekKetik("I'm fine, thank you.", ["i'm fine thank you"]).hasil).toBe('benar');
    expect(cekKetik('Hi, good morning!', ['hi good morning']).hasil).toBe('benar');
  });

  it('apostrof tetap bagian dari kata', () => {
    expect(normalisasi('I’m')).toBe("i'm");
    expect(normalisasi("don't")).not.toBe(normalisasi('dont'));
  });

  it('jam dengan titik dibaca sama seperti jawaban tersimpan', () => {
    expect(cekKetik('08.30', ['setengah sembilan', '08 30']).hasil).toBe('benar');
  });
});

describe('Kelas English: modul Dasar', () => {
  const modules = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/english/modules.json'), 'utf8')) as {
    id: string; status: string; requires?: string; order: number; lessonCount: number;
  }[];

  it('modul Dasar siap dan berurutan', () => {
    const dasar = modules.filter((m) => m.id.startsWith('en-d') && m.status === 'ready');
    expect(dasar.length).toBeGreaterThan(0);
    dasar.forEach((m, i) => {
      if (i > 0) expect(m.requires).toBe(dasar[i - 1].id);
    });
  });

  it('IT 1 terbuka setelah Dasar 2', () => {
    expect(modules.find((m) => m.id === 'en-u1')?.requires).toBe('en-d2');
  });

  it('jumlah pelajaran di modules.json sama dengan file yang ada', () => {
    const jumlah: Record<string, number> = {};
    for (const { lesson } of semuaPelajaranLatihan()) jumlah[lesson.moduleId] = (jumlah[lesson.moduleId] ?? 0) + 1;
    for (const m of modules.filter((x) => x.status === 'ready')) {
      expect(jumlah[m.id] ?? 0, m.id).toBe(m.lessonCount);
    }
  });

  it('urutan modul English tidak bentrok dengan kelas lain', () => {
    const lain = ['java', 'javascript', 'git']
      .map((k) => path.join(ROOT, `content/${k}/modules.json`))
      .filter((p) => fs.existsSync(p))
      .flatMap((p) => (JSON.parse(fs.readFileSync(p, 'utf8')) as { order: number }[]).map((m) => m.order));
    const bentrok = modules.filter((m) => lain.includes(m.order)).map((m) => m.id);
    expect(bentrok).toEqual([]);
  });
});
