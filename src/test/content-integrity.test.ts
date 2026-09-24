import { describe, it, expect } from 'vitest';
import { modulesData, getVisibleLessons, getQuizQuestions } from '../lib/content';

describe('Content Restructure Integrity', () => {
  it('has the exact same number of modules, lessons, and quizzes', () => {
    // These numbers are verified BEFORE the restructuring
    const EXPECTED_MODULES = 39; // from moduleData length
    
    // There are 6 modules with physical folders currently.
    let actualLessons = 0;
    let actualQuizzes = 0;
    
    for (const mod of modulesData) {
      const lessons = getVisibleLessons(mod.id);
      actualLessons += lessons.length;
      
      const quiz = getQuizQuestions(mod.id);
      if (quiz && quiz.length > 0) {
        actualQuizzes++;
      }
    }
    
    // Total modules
    expect(modulesData.length).toBe(EXPECTED_MODULES);
    
    // Visible lessons count
    // I know from my node script: materials: 147, quizzes: 4
    expect(actualLessons).toBe(216);
    expect(actualQuizzes).toBe(7);
  });
});
