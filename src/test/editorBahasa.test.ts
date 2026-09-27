import { describe, it, expect } from 'vitest';
import { ekstensiBahasa } from '../lib/editorBahasa';

describe('ekstensiBahasa', () => {
  it('returns javascript extension for javascript', () => {
    const ext = ekstensiBahasa('javascript');
    expect(ext.length).toBeGreaterThan(0);
  });

  it('returns java extension for java', () => {
    const ext = ekstensiBahasa('java');
    expect(ext.length).toBeGreaterThan(0);
  });

  it('returns empty array for git', () => {
    const ext = ekstensiBahasa('git');
    expect(ext).toEqual([]);
  });

  it('returns empty array for english', () => {
    const ext = ekstensiBahasa('english');
    expect(ext).toEqual([]);
  });
});
