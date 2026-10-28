import { describe, it, expect } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';
import type { Lesson, PraktikGitHubCard } from '../types/schema';

describe('Nomor dan Judul PR/Issue Proyek Todolist', () => {
  const contentDir = path.resolve(__dirname, '../../content/git');

  const readLesson = (relPath: string): Lesson => {
    const fullPath = path.join(contentDir, relPath);
    return JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
  };

  const getPraktikGithubCard = (lesson: Lesson, titlePrefix: string): PraktikGitHubCard => {
    const card = lesson.cards.find(
      (c) => c.type === 'praktik_github' && 'judul' in c && (c as PraktikGitHubCard).judul.includes(titlePrefix)
    );
    expect(card).toBeDefined();
    return card as PraktikGitHubCard;
  };

  it('kartu 42: layar.pull_request.nomor = 1 dan bawaan.judulPR = "Tambah fungsi filter selesai"', () => {
    const lesson42 = readLesson('modul-05-github-kolaborasi/lesson-02.json');
    const card42 = getPraktikGithubCard(lesson42, 'Todolist 42');
    expect(card42.layar['pull_request']?.nomor).toBe(1);
    expect(card42.bawaan?.judulPR).toBe('Tambah fungsi filter selesai');
  });

  it('kartu 43: semua layar templat "pull_request" bernomor 2 dan judulnya "Tambah fungsi format tanggal"', () => {
    const lesson43 = readLesson('modul-05-github-kolaborasi/lesson-03.json');
    const card43 = getPraktikGithubCard(lesson43, 'Todolist 43');
    const prScreens = Object.values(card43.layar).filter((l) => l.templat === 'pull_request');
    expect(prScreens.length).toBeGreaterThan(0);
    for (const screen of prScreens) {
      expect(screen.nomor).toBe(2);
      expect(screen.judul).toBe('Tambah fungsi format tanggal');
    }
  });

  it('kartu 44: semua layar yang punya nomor bernomor 1 dan judulnya sama dengan bawaan.judulPR kartu 42', () => {
    const lesson42 = readLesson('modul-05-github-kolaborasi/lesson-02.json');
    const card42 = getPraktikGithubCard(lesson42, 'Todolist 42');
    const judulExpected = card42.bawaan?.judulPR;

    const lesson44 = readLesson('modul-05-github-kolaborasi/lesson-04.json');
    const card44 = getPraktikGithubCard(lesson44, 'Todolist 44');
    const screensWithNomor = Object.values(card44.layar).filter((l) => l.nomor !== undefined);
    expect(screensWithNomor.length).toBeGreaterThan(0);
    for (const screen of screensWithNomor) {
      expect(screen.nomor).toBe(1);
      expect(screen.judul).toBe(judulExpected);
    }
  });

  it('kartu 46: issue pertama bernomor 3', () => {
    const lesson46 = readLesson('modul-06-github-proyek/lesson-01.json');
    const card46 = getPraktikGithubCard(lesson46, 'Todolist 46');
    const daftarIssueTerisi = card46.layar['daftar_issue_terisi'];
    expect(daftarIssueTerisi).toBeDefined();
    expect(daftarIssueTerisi?.items?.[0]?.nomor).toBe(3);
  });
});
