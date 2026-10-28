import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import type { Lesson, PraktikJavaCard, TheoryCard } from '../types/schema';
import { cekWajib, keluaranSama, kodeAwalLangkah } from '../lib/praktikJava';

/**
 * Java Dasar: setiap materi punya praktik bersama Lingga (proyek bersambung "Kasir Warung").
 * Keluaran setiap jawaban diperiksa dengan Java 8 sungguhan oleh scripts/test-java.js.
 */
describe('Praktik bersama Lingga di Java Dasar', () => {
  const dir = path.resolve(__dirname, '../../content/java/module-01-dasar');
  const files = fs.readdirSync(dir).filter((f) => f.startsWith('lesson-')).sort();

  for (const file of files) {
    const lesson: Lesson = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));

    describe(`${lesson.id} ${lesson.title}`, () => {
      const idx = lesson.cards.findIndex((c) => c.type === 'praktik_java');
      const card = lesson.cards[idx] as PraktikJavaCard;

      it('punya satu kartu praktik setelah teori terakhir dan sebelum cek pemahaman', () => {
        expect(lesson.cards.filter((c) => c.type === 'praktik_java').length).toBe(1);
        expect(lesson.cards[idx - 1].type).toBe('theory');
        expect(lesson.cards[idx + 1].type).toBe('understanding_check');
        expect(lesson.cards.slice(idx + 1).some((c) => c.type === 'theory')).toBe(false);
      });

      it('judul berurutan sebagai proyek bersambung', () => {
        expect(card.judul).toMatch(new RegExp(`^Kasir Warung ${lesson.order}: `));
      });

      it('contoh Lingga di langkah pertama, lalu minimal 2 tugas', () => {
        expect(card.langkah[0].otomatis).toBe(true);
        expect(card.langkah.slice(1).some((l) => l.otomatis)).toBe(false);
        expect(card.langkah.filter((l) => !l.otomatis).length).toBeGreaterThanOrEqual(2);
      });

      it('setiap tugas punya petunjuk, kode awal yang belum selesai, dan jawaban yang memenuhi pola wajib', () => {
        card.langkah.forEach((l, i) => {
          expect(l.jawaban).toMatch(/public class Main/);
          expect(l.keluaran.length).toBeGreaterThan(0);
          for (const w of l.wajib ?? []) expect(() => new RegExp(w.pola)).not.toThrow();
          expect(cekWajib(l.jawaban, l.wajib)).toBeNull();
          if (l.otomatis) return;
          expect(l.petunjuk.length).toBeGreaterThan(0);
          const awal = kodeAwalLangkah(card, i);
          expect(awal.trim()).not.toBe(l.jawaban.trim());
          // langkah setelahnya melanjutkan jawaban ini, jadi keluaran langkah ini tidak boleh sama dengan langkah berikutnya
          const berikut = card.langkah[i + 1];
          if (berikut) expect(keluaranSama(berikut.keluaran, l.keluaran)).toBe(false);
        });
      });

      it('materi diperjelas: ada kartu "Gampangnya begini" dan jejak contoh kode', () => {
        const teori = lesson.cards.filter((c): c is TheoryCard => c.type === 'theory').map((c) => c.content);
        expect(teori[1].startsWith('### Gampangnya begini')).toBe(true);
        const r = lesson.cards.findIndex((c) => c.type === 'runnable');
        const jejak = lesson.cards[r + 1] as TheoryCard;
        expect(jejak.type).toBe('theory');
        expect(jejak.content.startsWith('### Pelan-pelan')).toBe(true);
        expect(jejak.content).toMatch(/Hasilnya:\n\n```text\n/);
      });
    });
  }
});
