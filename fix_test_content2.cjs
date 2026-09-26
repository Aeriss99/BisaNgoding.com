const fs = require('fs');
const path = 'src/scripts/test-content.js';
let content = fs.readFileSync(path, 'utf8');

const oldLogic = `    const mod = modulesData.find(
      (m) =>
        folder.endsWith(\`-\${m.id}\`) ||
        folder.endsWith(\`-\${m.id.replace(/-/g, '')}\`) ||
        (folder === 'module-01c-todolist' && m.id === 'java-dasar-todolist') ||
        (folder === 'module-02-oop' && m.id === 'java-oop') ||
        (folder === 'module-03-record-sealed' && m.id === 'java-modern') ||
        (folder === 'module-04-collection' && m.id === 'java-collection') ||
        (folder === 'js-module-01-dasar' && m.id === 'js-dasar') ||
        (folder === 'js-module-01c-todolist' && m.id === 'js-todolist')
    );`;

const newLogic = `    // Ambil moduleId dari file json pertama di folder
    const firstLessonFile = files.find(f => f.startsWith('lesson-'));
    let explicitModuleId = null;
    if (firstLessonFile) {
      try {
        const json = JSON.parse(fs.readFileSync(path.join(folderPath, firstLessonFile), 'utf8'));
        explicitModuleId = json.moduleId;
      } catch (e) {}
    }
    const mod = explicitModuleId ? modulesData.find(m => m.id === explicitModuleId) : null;`;

content = content.replace(oldLogic, newLogic);
fs.writeFileSync(path, content);
console.log('Fixed test-content.js again');
