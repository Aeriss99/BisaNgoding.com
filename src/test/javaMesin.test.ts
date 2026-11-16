import { describe, it, expect } from 'vitest';
import * as runner from '../lib/javaRunner';
import { buildIframeSrcdoc } from '../lib/javaRunner';

// Editor situs hanya Java 8 (CheerpJ 3 + tools.jar). Mode percobaan Java 21 (?java=21, CheerpJ 5) sudah dihapus.
function skrip(html: string): string {
  return html.split('<script>')[1].split('</script>')[0];
}

describe('Mesin Java di javaRunner', () => {
  it('memakai CheerpJ 3 dan tools.jar', () => {
    const html = buildIframeSrcdoc();
    expect(html).toContain('https://cjrtnc.leaningtech.com/3.0/cj3loader.js');
    expect(skrip(html)).toContain('var pakaiTools = true;');
  });

  it('tidak ada lagi CheerpJ 5 atau Java 21', () => {
    const html = buildIframeSrcdoc();
    expect(html).not.toContain('5.0/loader.js');
    expect(skrip(html)).not.toContain('version: 21');
    expect('versiJava' in runner).toBe(false);
    expect('versiUntukMateri' in runner).toBe(false);
  });

  it('skrip iframe bisa dibaca JavaScript', () => {
    expect(() => new Function(skrip(buildIframeSrcdoc()))).not.toThrow();
  });
});
