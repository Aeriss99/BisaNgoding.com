import { describe, it, expect } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';
import type { Lesson, Card, FillBlankCard, PredictOutputCard, TheoryCard, PraktikTerminalCard, PraktikGitHubCard } from '../types/schema';
import { contohPerintah } from '../lib/praktikTerminal';
import { ambilElemenLayar } from '../lib/praktikGithub';

describe('Git Content Integrity', () => {
  const contentDir = path.resolve(__dirname, '../../content/git');
  if (!fs.existsSync(contentDir)) {
    it('skips when no content', () => {
      expect(true).toBe(true);
    });
    return;
  }

  const dirs = fs.readdirSync(contentDir).filter(f => fs.statSync(path.join(contentDir, f)).isDirectory());

  if (dirs.length === 0) {
    it('skips when no content', () => {
      expect(true).toBe(true);
    });
    return;
  }

  for (const moduleDir of dirs) {
    const lessonFiles = fs.readdirSync(path.join(contentDir, moduleDir)).filter(f => f.endsWith('.json') && f.startsWith('lesson-'));
    
    for (const file of lessonFiles) {
      const lessonPath = path.join(contentDir, moduleDir, file);
      const lesson: Lesson = JSON.parse(fs.readFileSync(lessonPath, 'utf-8'));

      describe(`Lesson: ${lesson.title} (${file})`, () => {
        
        it('has runnable false', () => {
          expect(lesson.runnable).toBe(false);
        });

        it('does not have runnable or code_challenge cards', () => {
          const invalidCards = lesson.cards.filter(c => c.type === 'runnable' || c.type === 'code_challenge');
          expect(invalidCards.length).toBe(0);
        });

        lesson.cards.forEach((card, index) => {
          describe(`Card ${index + 1} (${card.type})`, () => {
            
            if (card.type === 'fill_blank') {
              it('has blanks equal to answers length', () => {
                const fbc = card as FillBlankCard;
                const blanksCount = (fbc.code.match(/___/g) || []).length;
                expect(blanksCount).toBe(fbc.answers.length);
              });
            }

            if (card.type === 'predict_output') {
              it('has exactly 4 options', () => {
                const poc = card as PredictOutputCard;
                expect(poc.options.length).toBe(4);
              });
              
              it('has unique options', () => {
                const poc = card as PredictOutputCard;
                expect(new Set(poc.options).size).toBe(poc.options.length);
              });

              it('has valid answer index', () => {
                const poc = card as PredictOutputCard;
                expect(poc.answer).toBeGreaterThanOrEqual(0);
                expect(poc.answer).toBeLessThan(poc.options.length);
              });
            }

            if (card.type === 'theory') {
              it('starts mermaid blocks with gitGraph or flowchart', () => {
                const tc = card as TheoryCard;
                const mermaidBlocks = Array.from(tc.content.matchAll(/```mermaid\n([\s\S]*?)```/g));
                for (const match of mermaidBlocks) {
                  const content = match[1].trim();
                  expect(content.startsWith('gitGraph') || content.startsWith('flowchart')).toBe(true);
                }
              });
            } else if (card.type === 'praktik_terminal') {
              it('praktik terminal: ada langkah, setiap langkah punya pola, keluaran, dan petunjuk', () => {
                const pt = card as PraktikTerminalCard;
                expect(pt.judul).toMatch(/^Proyek Todolist \d+: /);

                const ghOffsets: Record<string, number> = {
                  'modul-04-github-dasar': 36,
                  'modul-05-github-kolaborasi': 41,
                  'modul-06-github-proyek': 46,
                  'modul-07-github-keamanan': 50,
                  'modul-08-github-otomatisasi': 54,
                  'modul-09-github-ekosistem': 59,
                  'modul-11-profesional': 63,
                  'modul-12-lanjutan': 66,
                  'modul-13-tim': 74,
                };
                if (ghOffsets[moduleDir] !== undefined) {
                  const noDiharapkan = ghOffsets[moduleDir] + (lesson.order - 1);
                  const noNyata = parseInt(pt.judul.match(/^Proyek Todolist (\d+):/)?.[1] || '0', 10);
                  expect(noNyata).toBe(noDiharapkan);
                }

                expect(pt.langkah.length).toBeGreaterThan(0);
                for (const l of pt.langkah) {
                  expect(l.terima.length).toBeGreaterThan(0);
                  expect(typeof l.keluaran).toBe('string');
                  expect(l.arahan.length).toBeGreaterThan(0);
                  if (!l.otomatis) expect(l.petunjuk.length).toBeGreaterThan(0);
                }
                // Lingga mencontohkan 1 perintah dulu, lalu pengguna mengerjakan minimal 2 tugas
                expect(pt.langkah[0].otomatis).toBe(true);
                expect(pt.langkah.slice(1).some((l) => l.otomatis)).toBe(false);
                expect(pt.langkah.filter((l) => !l.otomatis).length).toBeGreaterThanOrEqual(2);
                // Tugas biasa menyebut perintahnya dengan jelas. Tantangan hanya menyebut tujuannya
                // (perintahnya sudah pernah diketik), jadi tidak boleh membocorkan perintah itu.
                for (const l of pt.langkah.slice(1)) {
                  const perintah = '`' + contohPerintah(l.terima[0], {}, pt.bawaan) + '`';
                  if (l.tantangan) {
                    expect(l.arahan).not.toContain(perintah);
                    expect(l.petunjuk).not.toContain(perintah);
                  } else {
                    expect(l.arahan).toContain(perintah);
                  }
                }
                // Git Dasar belum mengajarkan branch dan HEAD
                if (moduleDir === 'modul-01-dasar') {
                  const kataLingga = [pt.pembuka, pt.penutup, ...pt.langkah.flatMap((l) => [l.arahan, l.benar ?? ''])]
                    .join('\n')
                    .replace(/defaultBranch/g, '');
                  expect(kataLingga).not.toMatch(/HEAD|branch/i);
                  expect(pt.langkah.map((l) => l.keluaran).join('\n')).not.toContain('HEAD');
                }
                // Kartu praktik ada di akhir materi: setelah teori terakhir, sebelum soal
                expect(lesson.cards[index - 1]?.type).toBe('theory');
                expect(['understanding_check', 'praktik_github']).toContain(lesson.cards[index + 1]?.type);
                if (lesson.cards[index + 1]?.type === 'praktik_github') {
                  expect(pt.judul).toMatch(/\(terminal\)$/);
                }
                // dan menggantikan daftar perintah panjang "Coba di komputermu"
                const teori = lesson.cards.filter((c): c is TheoryCard => c.type === 'theory');
                expect(teori.some((t) => t.content.includes('Coba di komputermu'))).toBe(false);
              });
            } else if (card.type === 'praktik_github') {
              it('praktik github: ada langkah, setiap target ada di layarnya, dan arahan menyebut tombol', () => {
                const pg = card as PraktikGitHubCard;
                expect(pg.judul).toMatch(/^Proyek Todolist \d+: /);

                const ghOffsets: Record<string, number> = {
                  'modul-04-github-dasar': 36,
                  'modul-05-github-kolaborasi': 41,
                  'modul-06-github-proyek': 46,
                  'modul-07-github-keamanan': 50,
                  'modul-08-github-otomatisasi': 54,
                  'modul-09-github-ekosistem': 59,
                  'modul-11-profesional': 63,
                  'modul-12-lanjutan': 66,
                  'modul-13-tim': 74,
                };
                if (ghOffsets[moduleDir] !== undefined) {
                  const noDiharapkan = ghOffsets[moduleDir] + (lesson.order - 1);
                  const noNyata = parseInt(pg.judul.match(/^Proyek Todolist (\d+):/)?.[1] || '0', 10);
                  expect(noNyata).toBe(noDiharapkan);
                }

                expect(pg.langkah.length).toBeGreaterThan(0);
                expect(pg.langkah[0].otomatis).toBe(true);
                expect(pg.langkah.slice(1).some((l) => l.otomatis)).toBe(false);
                expect(pg.langkah.filter((l) => !l.otomatis).length).toBeGreaterThanOrEqual(2);

                for (const l of pg.langkah) {
                  expect(l.target).not.toMatch(/^input-|^textarea-/i);
                  expect(pg.layar[l.layar]).toBeDefined();
                  const elemen = ambilElemenLayar(pg.layar[l.layar]);
                  expect(elemen).toHaveProperty(l.target);
                  expect(l.arahan.length).toBeGreaterThan(0);
                  if (!l.otomatis) expect(l.petunjuk.length).toBeGreaterThan(0);
                }

                for (const l of pg.langkah.slice(1)) {
                  const elemen = ambilElemenLayar(pg.layar[l.layar]);
                  const namaTombol = elemen[l.target];
                  if (l.tantangan) {
                    expect(l.target).not.toBe('tab-code');
                    expect(l.arahan).not.toContain(namaTombol);
                    expect(l.petunjuk).not.toContain(namaTombol);
                  } else {
                    expect(l.arahan).toContain(namaTombol);
                  }
                }

                for (let stepIdx = 0; stepIdx < pg.langkah.length - 1; stepIdx++) {
                  const currentStep = pg.langkah[stepIdx];
                  const nextStep = pg.langkah[stepIdx + 1];
                  const isActionBtn =
                    /create|save|submit|merge|resolve|add|setup|btn-board|btn-table/i.test(currentStep.target) ||
                    /buat|simpan|create|save|submit|merge/i.test(currentStep.arahan);
                  if (isActionBtn && !currentStep.target.startsWith('input-')) {
                    expect(nextStep.layar).not.toBe(currentStep.layar);
                  }
                }

                expect(['theory', 'praktik_terminal']).toContain(lesson.cards[index - 1]?.type);
                expect(lesson.cards[index + 1]?.type).toBe('understanding_check');
                if (lesson.cards[index - 1]?.type === 'praktik_terminal') {
                  expect(pg.judul).toMatch(/\(GitHub\)$/);
                }
              });
            } else if (card.type === 'understanding_check' || card.type === 'summary') {
              it('exists', () => {
                expect(card).toBeDefined();
              });
            }
          });
        });
      });
    }
  }
});
