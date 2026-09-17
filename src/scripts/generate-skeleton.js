import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const modulesData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../content/modules.json'), 'utf8')
);

const baseContentDir = path.join(__dirname, '../../content');

function generateSkeleton() {
  modulesData.forEach((mod) => {
    const paddedOrder = String(mod.order).padStart(2, '0');
    const folderName = `module-${paddedOrder}-${mod.id.replace('java-', '')}`;
    const folderPath = path.join(baseContentDir, folderName);

    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    for (let i = 1; i <= mod.lessonCount; i++) {
      const paddedLesson = String(i).padStart(2, '0');
      const lessonId = `${mod.id}-${paddedLesson}`;
      
      const filesInDir = fs.readdirSync(folderPath);
      const existingFile = filesInDir.find(f => f.includes(lessonId) || f.includes(`lesson-${paddedLesson}`));
      if (existingFile) continue;

      const fileName = `lesson-${paddedLesson}.json`;
      const filePath = path.join(folderPath, fileName);

      const lessonSkeleton = {
        id: lessonId,
        moduleId: mod.id,
        order: i,
        title: `${mod.title} - Pelajaran ${i}`,
        estimatedMinutes: 5,
        cards: [
          {
            type: "theory",
            content: "Materi untuk pelajaran ini belum tersedia."
          }
        ]
      };

      fs.writeFileSync(filePath, JSON.stringify(lessonSkeleton, null, 2));
    }
  });

  console.log('Skeleton konten berhasil dibuat!');
}

generateSkeleton();
