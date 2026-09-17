import fs from 'fs';
import path from 'path';

const contentDir = path.join(process.cwd(), 'content');
const modulesData = JSON.parse(fs.readFileSync(path.join(contentDir, 'modules.json'), 'utf8'));

const moduleFolders = fs.readdirSync(contentDir).filter(f => f.startsWith('module-'));

for (const folder of moduleFolders) {
  const folderPath = path.join(contentDir, folder);
  const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.json'));

  const mod = modulesData.find(m => folder.includes(m.id));
  if (!mod) continue;

  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Fix IDs
    const paddedLesson = String(data.order).padStart(2, '0');
    data.id = `${mod.id}-${paddedLesson}`;
    data.moduleId = mod.id;

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }
}
console.log('Fixed IDs in all lessons.');
