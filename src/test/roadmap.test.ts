import { describe, it, expect } from 'vitest';
import roadmapDataRaw from '../../content/roadmap.json';
import coursesDataRaw from '../../content/courses.json';
import { Roadmap, JalurBelajar } from '../types/schema';
import fs from 'fs';
import path from 'path';

const roadmapData = roadmapDataRaw as unknown as Roadmap;
const coursesData = coursesDataRaw;

describe('Roadmap Content', () => {
  it('Setiap id jalur unik', () => {
    const ids = roadmapData.jalur.map((j) => j.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });

  it('Setiap jalur punya minimal satu langkah yang bukan segera dan punya modul ready', () => {
    roadmapData.jalur.forEach((jalur) => {
      let hasReady = false;
      for (const langkah of jalur.langkah) {
        if (!langkah.segera && langkah.kelas && langkah.modul) {
          const modulesPath = path.resolve(__dirname, `../../content/${langkah.kelas}/modules.json`);
          if (fs.existsSync(modulesPath)) {
            const modulesData = JSON.parse(fs.readFileSync(modulesPath, 'utf8'));
            for (const modId of langkah.modul) {
              const mod = modulesData.find((m: any) => m.id === modId);
              if (mod && mod.status === 'ready') {
                hasReady = true;
                break;
              }
            }
          }
        }
        if (hasReady) break;
      }
      expect(hasReady).toBe(true);
    });
  });

  it('Setiap kelas di roadmap (termasuk pendamping) ada di courses.json', () => {
    const courseIds = new Set(coursesData.map((c: any) => c.id));
    
    // Check pendamping
    expect(courseIds.has(roadmapData.pendamping.kelas)).toBe(true);

    // Check jalur langkah
    roadmapData.jalur.forEach((jalur) => {
      jalur.langkah.forEach((langkah) => {
        if (langkah.kelas) {
          expect(courseIds.has(langkah.kelas)).toBe(true);
        }
      });
    });
  });

  it('Setiap id di modul ada di modules.json kelas tersebut', () => {
    roadmapData.jalur.forEach((jalur) => {
      jalur.langkah.forEach((langkah) => {
        if (langkah.kelas && langkah.modul) {
          // If the step has course and modules, load modules.json for that course
          // Map java to its folders which might not have courseId but are inside java dir
          const modulesPath = path.resolve(__dirname, `../../content/${langkah.kelas}/modules.json`);
          expect(fs.existsSync(modulesPath)).toBe(true);
          
          const modulesData = JSON.parse(fs.readFileSync(modulesPath, 'utf8'));
          const moduleIdsInFile = new Set(modulesData.map((m: any) => m.id));

          langkah.modul.forEach((modId) => {
            expect(moduleIdsInFile.has(modId)).toBe(true);
            
            // Checking courseId (if no courseId, it is java)
            const mod = modulesData.find((m: any) => m.id === modId);
            if (mod.courseId) {
              expect(mod.courseId).toBe(langkah.kelas);
            } else {
              expect(langkah.kelas).toBe('java');
            }
          });
        }
      });
    });
  });
});