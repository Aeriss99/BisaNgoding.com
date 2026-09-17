import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const contentDir = path.join(__dirname, '../../content');

// Minimal validation based on schema requirements
const CardSchema = z.union([
  z.object({ type: z.literal('theory'), content: z.string(), image: z.object({ src: z.string(), alt: z.string() }).optional() }),
  z.object({ type: z.literal('runnable'), code: z.string() }),
  z.object({ type: z.literal('multiple_choice'), question: z.string(), options: z.array(z.string()), answer: z.number(), explanation: z.string() }),
  z.object({ type: z.literal('fill_blank'), code: z.string(), answers: z.array(z.string()) }),
  z.object({ type: z.literal('code_challenge'), prompt: z.string(), starterCode: z.string(), tests: z.array(z.object({ input: z.string(), expectedOutput: z.string() })), hints: z.array(z.string()), solution: z.string().optional() }),
  z.object({ type: z.literal('summary'), points: z.array(z.string()) }),
  z.object({ type: z.literal('reorder'), prompt: z.string(), lines: z.array(z.string()), correctOrder: z.array(z.number()) }),
  z.object({ type: z.literal('predict_output'), code: z.string(), options: z.array(z.string()), answer: z.number(), explanation: z.string() })
]);

const LessonSchema = z.object({
  id: z.string(),
  moduleId: z.string(),
  order: z.number(),
  title: z.string(),
  estimatedMinutes: z.number(),
  runnable: z.boolean().optional(),
  javaVersion: z.number().optional(),
  cards: z.array(CardSchema)
});

async function run() {
  const modulesData = JSON.parse(fs.readFileSync(path.join(contentDir, 'modules.json'), 'utf8'));
  const moduleIds = new Set(modulesData.map((m) => m.id));
  let errors = 0;
  let skeletonCount = 0;
  let validCount = 0;

  let report = '# Laporan Test Konten\n\n';

  const allLessonIds = new Set();
  const allTitlesPerModule = {};

  const moduleFolders = fs.readdirSync(contentDir).filter(f => f.startsWith('module-'));

  for (const folder of moduleFolders) {
    const folderPath = path.join(contentDir, folder);
    const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.json'));

    const mod = modulesData.find(m => folder.endsWith(`-${m.id}`) || folder.endsWith(`-${m.id.replace(/-/g, '')}`));
    if (!mod) {
      console.error(`Folder ${folder} tidak punya modul terdaftar`);
      errors++;
      continue;
    }
    allTitlesPerModule[mod.id] = new Set();

    let modSkeletons = 0;
    let modValid = 0;

    for (const file of files) {
      const filePath = path.join(folderPath, file);
      let data;
      try {
        data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch (e) {
        console.error(`JSON parse error di ${filePath}: ${e.message}`);
        errors++;
        continue;
      }

      const res = LessonSchema.safeParse(data);
      if (!res.success) {
        console.error(`Zod validation error di ${filePath}: ${res.error.message}`);
        errors++;
        continue;
      }

      if (allLessonIds.has(data.id)) {
        console.error(`ID duplikat: ${data.id}`);
        errors++;
      }
      allLessonIds.add(data.id);

      if (!moduleIds.has(data.moduleId) && !(data.moduleId === 'java-dasar' && moduleIds.has('dasar'))) {
        console.error(`moduleId tidak valid: ${data.moduleId} di ${filePath}`);
        errors++;
      }

      if (allTitlesPerModule[mod.id].has(data.title)) {
        console.error(`Judul duplikat: ${data.title} di ${data.moduleId}`);
        errors++;
      }
      allTitlesPerModule[mod.id].add(data.title);

      const isSkeleton = 
        data.title.includes('TODO') || 
        data.title.includes('Pelajaran ' + data.order) || 
        data.cards.length === 1 || 
        data.cards.some((c) => c.type === 'theory' && c.content.includes('belum tersedia'));

      if (isSkeleton) {
        modSkeletons++;
        skeletonCount++;
      } else {
        modValid++;
        validCount++;
        
        // Basic requirement checks for non-skeleton
        const theories = data.cards.filter((c) => c.type === 'theory').length;
        const runnables = data.cards.filter((c) => c.type === 'runnable').length;
        const summaries = data.cards.filter((c) => c.type === 'summary').length;
        const exercises = data.cards.filter((c) => ['multiple_choice', 'fill_blank', 'code_challenge', 'reorder', 'predict_output'].includes(c.type)).length;
        
        if (theories < 2) {
          console.error(`${data.id}: Kartu teori kurang dari 2`);
          errors++;
        }
        if (summaries < 1) {
          console.error(`${data.id}: Tidak ada summary`);
          errors++;
        }
        if (exercises < 2) {
          console.error(`${data.id}: Latihan kurang dari 2`);
          errors++;
        }

        data.cards.forEach(c => {
          if (c.type === 'multiple_choice' || c.type === 'predict_output') {
            if (c.answer < 0 || c.answer >= c.options.length) {
              console.error(`${data.id}: Answer out of bounds in ${c.type}`);
              errors++;
            }
          }
          if (c.type === 'fill_blank') {
            const blankCount = (c.code.match(/___/g) || []).length;
            if (blankCount !== c.answers.length) {
              console.error(`${data.id}: Jumlah blank ___ tidak sama dengan answers`);
              errors++;
            }
          }
          if (c.type === 'reorder') {
            const linesLength = c.lines.length;
            if (c.correctOrder.length !== linesLength || new Set(c.correctOrder).size !== linesLength) {
              console.error(`${data.id}: correctOrder tidak valid di reorder`);
              errors++;
            }
          }
          if (c.type === 'theory' && c.image) {
            const imgPath = path.join(contentDir, 'images', c.image.src);
            if (!fs.existsSync(imgPath)) {
              console.error(`${data.id}: Gambar tidak ditemukan di content/images/${c.image.src}`);
              errors++;
            }
          }
          if (c.type === 'code_challenge') {
            if (!c.tests || c.tests.length === 0 || !c.hints || c.hints.length === 0 || !c.solution) {
              console.error(`${data.id}: code_challenge kurang test, hint, atau solution`);
              errors++;
            }
          }
        });
      }
    }

    if (mod.status === 'ready' && modSkeletons > 0) {
      console.error(`Modul ${mod.id} ready tapi ada ${modSkeletons} skeleton`);
      errors++;
    }
    
    if (mod.status === 'ready' && mod.lessonCount !== (modSkeletons + modValid)) {
      console.error(`Modul ${mod.id} lessonCount ${mod.lessonCount} tidak sama dengan file ${modSkeletons + modValid}`);
      errors++;
    }

    report += `- Modul **${mod.title}**: ${modValid} selesai, ${modSkeletons} skeleton.\n`;
  }

  report += `\nTotal: ${validCount} selesai, ${skeletonCount} skeleton, ${errors} error.\n`;
  const reportPath = path.join(__dirname, '../../reports/content.md');
  const reportDir = path.dirname(reportPath);
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(reportPath, report);

  if (errors > 0) {
    console.error(`Ada ${errors} error di test konten!`);
    process.exit(1);
  } else {
    console.log('Test konten lolos.');
  }
}

run().catch(e => { console.error(e); process.exit(1); });
