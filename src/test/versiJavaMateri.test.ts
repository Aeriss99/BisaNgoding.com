import { describe, it, expect, beforeEach } from 'vitest';
import { versiUntukMateri } from '../lib/javaRunner';

describe('versi Java per materi', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState(null, '', '/');
  });

  it('materi javaVersion 21 selalu memakai Java 21', () => {
    expect(versiUntukMateri(21)).toBe(21);
  });

  it('materi lain memakai Java 8 kecuali mode percobaan ?java=21', () => {
    expect(versiUntukMateri(undefined)).toBe(8);
    expect(versiUntukMateri(17)).toBe(8);
    window.history.replaceState(null, '', '/?java=21');
    expect(versiUntukMateri(undefined)).toBe(21);
    window.history.replaceState(null, '', '/?java=8');
    expect(versiUntukMateri(undefined)).toBe(8);
  });
});
