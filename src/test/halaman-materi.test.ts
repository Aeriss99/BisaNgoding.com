import { describe, it, expect } from 'vitest';
import { labelKartu, infoMateri, BATAS_SEGMEN } from '../lib/materi';
import { modulesData, getVisibleLessons } from '../lib/content';

const modulJava = modulesData
  .filter((m) => (m.courseId || 'java') === 'java' && m.status !== 'draft')
  .sort((a, b) => a.order - b.order);

describe('labelKartu', () => {
  it('memberi label huruf besar untuk setiap jenis kartu', () => {
    expect(labelKartu('theory')).toBe('TEORI');
    expect(labelKartu('runnable')).toBe('CONTOH KODE');
    expect(labelKartu('code_challenge')).toBe('TANTANGAN KODE');
    expect(labelKartu('summary')).toBe('RINGKASAN');
  });
});

describe('infoMateri', () => {
  it('materi pertama modul pertama bernomor 1.1 dan kembali ke kelas dengan modul terbuka', () => {
    const m = modulJava[0];
    const l = getVisibleLessons(m.id)[0];
    expect(infoMateri(l)).toEqual({ nomor: '1.1', judulModul: m.title, kembaliKe: `/kelas/java?modul=${m.id}` });
  });

  it('nomor mengikuti urutan modul dan urutan materi', () => {
    const m = modulJava[1];
    const ls = getVisibleLessons(m.id);
    expect(infoMateri(ls[ls.length - 1]).nomor).toBe(`2.${ls.length}`);
  });

  it('kelas selain Java memakai id kelasnya sendiri', () => {
    const m = modulesData.find((x) => x.courseId === 'mysql' && x.status !== 'draft')!;
    const l = getVisibleLessons(m.id)[0];
    expect(infoMateri(l).kembaliKe).toBe(`/kelas/mysql?modul=${m.id}`);
  });

  it('batas segmen progres', () => {
    expect(BATAS_SEGMEN).toBe(12);
  });
});