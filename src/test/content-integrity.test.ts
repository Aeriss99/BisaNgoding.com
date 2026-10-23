import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { modulesData, getVisibleLessons, getQuizQuestions } from '../lib/content';

/**
 * Test ini SENGAJA tidak memakai angka hafalan (228, 169, dst).
 * Angka hafalan bikin test gagal setiap kali ada modul baru, lalu tergoda
 * diubah angkanya supaya lulus — itu menyembunyikan bug, bukan memperbaikinya.
 * Yang diperiksa di sini adalah hubungan antar data, bukan jumlahnya.
 */
describe('Integritas konten', () => {
  const ready = modulesData.filter((m) => m.status === 'ready');

  it('id modul tidak ada yang dobel', () => {
    const dobel = modulesData
      .map((m) => m.id)
      .filter((id, i, arr) => arr.indexOf(id) !== i);
    expect(dobel).toEqual([]);
  });

  it('setiap modul berstatus "ready" benar-benar punya file pelajaran', () => {
    const kosong = ready
      .filter((m) => getVisibleLessons(m.id).length === 0)
      .map((m) => m.id);
    expect(kosong).toEqual([]);
  });

  it('lessonCount di modules.json sama dengan jumlah file pelajaran yang ada', () => {
    const beda = ready
      .map((m) => ({
        id: m.id,
        ditulis: m.lessonCount,
        aktual: getVisibleLessons(m.id).length,
      }))
      .filter((x) => x.ditulis !== x.aktual);
    expect(beda).toEqual([]);
  });

  it('tidak ada pelajaran yang muncul di dua modul', () => {
    const pemilik: Record<string, string[]> = {};
    modulesData.forEach((m) => {
      getVisibleLessons(m.id).forEach((l) => {
        (pemilik[l.id] ||= []).push(m.id);
      });
    });
    const dobel = Object.entries(pemilik)
      .filter(([, mods]) => mods.length > 1)
      .map(([lessonId, mods]) => `${lessonId} -> ${mods.join(', ')}`);
    expect(dobel).toEqual([]);
  });

  it('prasyarat (requires) tidak menunjuk modul kosong sehingga modul berikutnya terkunci selamanya', () => {
    const rusak = modulesData
      .filter((m) => {
        if (!m.requires) return false;
        const req = modulesData.find((x) => x.id === m.requires);
        // modul draft dilewati oleh checkModuleUnlocked, jadi aman
        if (!req || req.status === 'draft') return false;
        return getVisibleLessons(req.id).length === 0;
      })
      .map((m) => `${m.id} terkunci karena prasyarat "${m.requires}" kosong`);
    expect(rusak).toEqual([]);
  });

  it('tidak ada dua modul yang memakai file quiz yang sama', () => {
    const terpakai = new Map<string, string>();
    const tertukar: string[] = [];
    modulesData.forEach((m) => {
      const q = getQuizQuestions(m.id);
      if (!q || q.length === 0) return;
      const sidik = JSON.stringify(q[0]);
      const sebelumnya = terpakai.get(sidik);
      if (sebelumnya) tertukar.push(`${m.id} memakai quiz milik ${sebelumnya}`);
      else terpakai.set(sidik, m.id);
    });
    expect(tertukar).toEqual([]);
  });

  it('setiap quiz.json dipakai oleh modul di folder yang sama, walaupun nama foldernya sama dengan kelas lain', () => {
    // Dulu git/modul-01-dasar dan rest-api/modul-01-dasar bertabrakan: quiz Git Dasar tidak muncul
    // dan REST API modul 1 menampilkan quiz Git.
    const akar = path.resolve(__dirname, '../../content');
    const salah: string[] = [];
    for (const kelas of fs.readdirSync(akar)) {
      const dirKelas = path.join(akar, kelas);
      if (!fs.statSync(dirKelas).isDirectory()) continue;
      for (const folder of fs.readdirSync(dirKelas)) {
        const dir = path.join(dirKelas, folder);
        const fileQuiz = path.join(dir, 'quiz.json');
        if (!fs.existsSync(fileQuiz)) continue;
        const pelajaran = fs.readdirSync(dir).find((f) => f.startsWith('lesson-') && f.endsWith('.json'));
        if (!pelajaran) continue;
        const moduleId = JSON.parse(fs.readFileSync(path.join(dir, pelajaran), 'utf8')).moduleId;
        const isi = JSON.parse(fs.readFileSync(fileQuiz, 'utf8'));
        const dimuat = getQuizQuestions(moduleId);
        if (!dimuat || dimuat[0]?.id !== isi[0]?.id) salah.push(`${kelas}/${folder} (${moduleId})`);
      }
    }
    expect(salah).toEqual([]);
  });
});
