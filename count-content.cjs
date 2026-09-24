const fs = require('fs');
const path = require('path');

function count(dir) {
  let modules = 0;
  let materials = 0;
  let quizzes = 0;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.isDirectory() && (e.name.startsWith('module-') || e.name.startsWith('js-module-'))) {
      modules++;
      const files = fs.readdirSync(path.join(dir, e.name));
      materials += files.filter(f => f.startsWith('lesson-')).length;
      quizzes += files.filter(f => f === 'quiz.json').length;
    }
  }
  return { modules, materials, quizzes };
}
console.log(count('./content'));
