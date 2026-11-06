import { describe, it, expect, beforeEach } from 'vitest';
import { buildIframeSrcdoc, versiJava } from '../lib/javaRunner';

// Mode percobaan Java 21 (CheerpJ 5). Bawaan tetap Java 8 (CheerpJ 3 + tools.jar).
function skrip(html: string): string {
  return html.split('<script>')[1].split('</script>')[0];
}

describe('Mode Java di javaRunner', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState(null, '', '/');
  });

  it('bawaan Java 8: CheerpJ 3 dan tools.jar', () => {
    expect(versiJava()).toBe(8);
    const html = buildIframeSrcdoc(8);
    expect(html).toContain('https://cjrtnc.leaningtech.com/3.0/cj3loader.js');
    expect(skrip(html)).toContain('var pakaiTools = true;');
    expect(skrip(html)).not.toContain('version: 21');
  });

  it('Java 21: CheerpJ 5, version 21, javac bawaan JDK', () => {
    const html = buildIframeSrcdoc(21);
    expect(html).toContain('https://cjrtnc.leaningtech.com/5.0/loader.js');
    expect(skrip(html)).toContain("cheerpjInit({ status: 'none', version: 21 })");
    expect(skrip(html)).toContain('var pakaiTools = false;');
  });

  it('skrip iframe kedua mode bisa dibaca JavaScript', () => {
    for (const v of [8, 21] as const) expect(() => new Function(skrip(buildIframeSrcdoc(v)))).not.toThrow();
  });

  it('?java=21 menyalakan dan diingat, ?java=8 mematikan', () => {
    window.history.replaceState(null, '', '/?java=21');
    expect(versiJava()).toBe(21);
    window.history.replaceState(null, '', '/');
    expect(versiJava()).toBe(21);
    window.history.replaceState(null, '', '/#/kelas/java?java=8');
    expect(versiJava()).toBe(8);
    window.history.replaceState(null, '', '/');
    expect(versiJava()).toBe(8);
  });
});
