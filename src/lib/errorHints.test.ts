import { describe, it, expect } from 'vitest';
import { getErrorHint } from './errorHints';

describe('getErrorHint', () => {
  it('matches correct pattern for semicolon', () => {
    const hint = getErrorHint("Main.java:5: error: ';' expected\n    System.out.println(\"Halo\")\n                              ^");
    expect(hint).toContain('titik koma');
  });

  it('matches non-static static context correctly', () => {
    const hint = getErrorHint("Main.java:6: error: non-static method sayHello() cannot be referenced from a static context");
    expect(hint).toContain('bukan static');
  });

  it('returns null for unknown error', () => {
    const hint = getErrorHint("java.lang.UnknownError: Something bad happened");
    expect(hint).toBeNull();
  });
});