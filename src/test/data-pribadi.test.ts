import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Keluaran praktik yang direkam dari akun GitHub sungguhan harus disamarkan.
 * Data di bawah ini milik akun pemilik situs dan tidak boleh muncul di materi.
 */
const DILARANG = ['115941001', 'U_kgDOBukeiQ', 'Jakarta, Indonesia', 'linggaardyansyh'];

function semuaJson(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return semuaJson(p);
    return e.name.endsWith('.json') ? [p] : [];
  });
}

describe('Data pribadi tidak bocor ke materi', () => {
  const root = path.resolve(__dirname, '../../content');
  for (const file of semuaJson(root)) {
    it(path.relative(root, file), () => {
      const isi = fs.readFileSync(file, 'utf-8');
      for (const kata of DILARANG) expect(isi).not.toContain(kata);
    });
  }
});
