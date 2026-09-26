import { describe, it, expect } from 'vitest';
import { getModule, getLessonsForModule } from '../lib/content';

describe('Regression Test: sameModule bug', () => {
  it('getModule("js-dasar") harus mengembalikan modul dengan courseId "javascript", BUKAN modul Java', () => {
    const mod = getModule("js-dasar");
    expect(mod).toBeDefined();
    expect(mod?.courseId).toBe("javascript");
  });

  it('getModule("dasar") (modul Java) harus tetap mengembalikan modul Java seperti biasa', () => {
    const mod = getModule("dasar");
    expect(mod).toBeDefined();
    expect(mod?.id).toBe("dasar");
  });
});

  it('getLessonsForModule("dasar") should not include js-dasar lessons', () => {
    const lessons = getLessonsForModule("dasar");
    const hasJsLessons = lessons.some(l => l.moduleId === "js-dasar");
    expect(hasJsLessons).toBe(false);
  });
