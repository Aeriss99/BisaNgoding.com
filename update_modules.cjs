const fs = require('fs');
const path = 'content/java/modules.json';
let modules = JSON.parse(fs.readFileSync(path, 'utf8'));

// find index of java-oop
const oopIndex = modules.findIndex(m => m.id === 'java-oop');

// remove old collection
modules = modules.filter(m => m.id !== 'collection');

// insert java-collection after java-oop
const collectionMod = {
  id: "java-collection",
  title: "Java Collection",
  order: 4, // we will recalculate orders anyway
  lessonCount: 12,
  status: "ready",
  requires: "java-oop"
};

modules.splice(oopIndex + 1, 0, collectionMod);

// recalculate order and requires
for (let i = 0; i < modules.length; i++) {
  modules[i].order = i + 1;
  if (i > 0) {
    modules[i].requires = modules[i - 1].id;
  }
}

fs.writeFileSync(path, JSON.stringify(modules, null, 2) + '\n');
console.log('modules updated');
