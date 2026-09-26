import { describe, it, expect } from 'vitest';
import {
  getModule,
  getLessonsForModule,
  getVisibleLessons,
  getQuizQuestions,
  modulesData,
} from '../lib/content';

describe('Regresi: pelajaran JavaScript bocor ke modul Java', () => {
  it('getModule("js-dasar") mengembalikan modul JavaScript, bukan modul Java', () => {
    const mod = getModule('js-dasar');
    expect(mod).toBeDefined();
    expect(mod?.courseId).toBe('javascript');
  });

  it('getModule("dasar") tetap mengembalikan modul Java Dasar', () => {
    const mod = getModule('dasar');
    expect(mod).toBeDefined();
    expect(mod?.id).toBe('dasar');
  });

  it('getLessonsForModule("dasar") tidak boleh berisi pelajaran js-dasar', () => {
    const lessons = getLessonsForModule('dasar');
    expect(lessons.length).toBeGreaterThan(0);
    expect(lessons.some((l) => l.moduleId === 'js-dasar')).toBe(false);
    expect(lessons.every((l) => l.moduleId === 'java-dasar')).toBe(true);
  });

  it('getLessonsForModule("js-dasar") hanya berisi pelajaran JavaScript', () => {
    const lessons = getLessonsForModule('js-dasar');
    expect(lessons.length).toBeGreaterThan(0);
    expect(lessons.every((l) => l.moduleId === 'js-dasar')).toBe(true);
  });

  it('judul pelajaran modul Java Dasar tidak menyebut JavaScript', () => {
    const judul = getVisibleLessons('dasar').map((l) => l.title.toLowerCase());
    expect(judul.some((t) => t.includes('javascript'))).toBe(false);
    expect(judul.some((t) => t.includes('console.log'))).toBe(false);
  });

  it('setiap pelajaran hanya muncul di satu modul', () => {
    const pemilik: Record<string, string[]> = {};
    modulesData.forEach((m) => {
      getLessonsForModule(m.id).forEach((l) => {
        (pemilik[l.id] ||= []).push(m.id);
      });
    });
    const dobel = Object.entries(pemilik).filter(([, mods]) => mods.length > 1);
    expect(dobel).toEqual([]);
  });

  it('modul Java Dasar memakai quiznya sendiri, bukan quiz JavaScript', () => {
    const quizJava = getQuizQuestions('dasar');
    const quizJs = getQuizQuestions('js-dasar');
    expect(quizJava).not.toBeNull();
    expect(quizJs).not.toBeNull();
    expect(quizJava!.every((q) => q.id.startsWith('java-dasar-quiz'))).toBe(true);
    expect(JSON.stringify(quizJava)).not.toBe(JSON.stringify(quizJs));
  });

  it('quiz tiap modul tidak tertukar antar modul', () => {
    const terpakai = new Map<string, string>();
    modulesData.forEach((m) => {
      const q = getQuizQuestions(m.id);
      if (!q) return;
      const sidik = JSON.stringify(q[0]);
      expect(terpakai.has(sidik)).toBe(false);
      terpakai.set(sidik, m.id);
    });
  });
});
