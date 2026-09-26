const fs = require('fs');
const path = 'src/scripts/test-content.js';
let content = fs.readFileSync(path, 'utf8');

const oldLogic = `    // Ambil moduleId dari file json pertama di folder
    const firstLessonFile = files.find(f => f.startsWith('lesson-'));
    let explicitModuleId = null;
    if (firstLessonFile) {
      try {
        const json = JSON.parse(fs.readFileSync(path.join(folderPath, firstLessonFile), 'utf8'));
        explicitModuleId = json.moduleId;
      } catch (e) {}
    }
    const mod = explicitModuleId ? modulesData.find(m => m.id === explicitModuleId) : null;`;

const newLogic = `    // Ambil moduleId dari file json pertama di folder
    const firstLessonFile = files.find(f => f.startsWith('lesson-'));
    let explicitModuleId = null;
    if (firstLessonFile) {
      try {
        const json = JSON.parse(fs.readFileSync(path.join(folderPath, firstLessonFile), 'utf8'));
        explicitModuleId = json.moduleId;
      } catch (e) {}
    }
    let mod = explicitModuleId ? modulesData.find(m => m.id === explicitModuleId) : null;
    
    // Fallback mapping untuk modul lama yang moduleId di file beda dengan id di modules.json
    if (!mod && explicitModuleId === 'java-dasar') mod = modulesData.find(m => m.id === 'dasar');
    `;

content = content.replace(oldLogic, newLogic);
fs.writeFileSync(path, content);
console.log('Fixed test-content.js again');
