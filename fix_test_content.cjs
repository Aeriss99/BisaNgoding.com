const fs = require('fs');
const path = 'src/scripts/test-content.js';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "(folder === 'module-03-record-sealed' && m.id === 'java-modern')",
  "(folder === 'module-03-record-sealed' && m.id === 'java-modern') ||\n        (folder === 'module-04-collection' && m.id === 'java-collection') ||\n        (folder === 'js-module-01-dasar' && m.id === 'js-dasar') ||\n        (folder === 'js-module-01c-todolist' && m.id === 'js-todolist')"
);

fs.writeFileSync(path, content);
console.log('Fixed test-content.js');
