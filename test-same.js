function sameModule(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;
  return a.endsWith('-' + b) || b.endsWith('-' + a);
}
console.log('js-dasar vs dasar:', sameModule('js-dasar', 'dasar'));
console.log('java-dasar vs dasar:', sameModule('java-dasar', 'dasar'));
