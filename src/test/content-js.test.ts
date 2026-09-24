import { describe, it, expect } from 'vitest';
import { runJsCode } from '../lib/jsRunner';
import fs from 'fs';
import path from 'path';

describe('content-js', () => {
  const dirs = ['content/js-module-01-dasar', 'content/js-module-01c-todolist'];
  
  for (const d of dirs) {
    const dirPath = path.resolve(process.cwd(), d);
    if (!fs.existsSync(dirPath)) continue;
    
    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json') && f !== 'quiz.json');
    for (const file of files) {
      const lessonPath = path.join(dirPath, file);
      const lesson = JSON.parse(fs.readFileSync(lessonPath, 'utf8'));
      
      describe(`Lesson: ${lesson.title} (${file})`, () => {
        const challenges = (lesson.cards || []).filter((c: any) => c.type === 'code_challenge');
        for (let i = 0; i < challenges.length; i++) {
          const challenge = challenges[i];
          it(`Challenge ${i + 1} solution runs correctly`, async () => {
            if (!challenge.solution) return; // Skip if no solution
            const res = await runJsCode(challenge.solution);
            expect(res.exitCode).toBe(0);
            
            for (const test of challenge.tests) {
              expect(res.stdout.trim()).toBe(test.expectedOutput.trim());
            }
          });
        }
      });
    }
  }
});
