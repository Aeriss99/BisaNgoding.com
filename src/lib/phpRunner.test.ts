import { describe, it, expect } from 'vitest';
import { pisahKeluaranPhp, artiGalatPhp } from './phpRunner';

describe('pisahKeluaranPhp', () => {
  it('program sukses: semua teks jadi stdout, nama file internal diganti main.php', () => {
    const r = pisahKeluaranPhp('\nWarning: Undefined variable $x in /internal/eval.php on line 2\nlanjut\n', 0);
    expect(r).toEqual({ stdout: '\nWarning: Undefined variable $x in main.php on line 2\nlanjut\n', stderr: '', exitCode: 0 });
  });

  it('fatal error: keluaran sebelum error tetap stdout, stderr hanya baris pesannya', () => {
    const teks = 'a\n\nFatal error: Uncaught DivisionByZeroError: Division by zero in /internal/eval.php:3\nStack trace:\n#0 {main}\n';
    const r = pisahKeluaranPhp(teks, 255);
    expect(r.stdout).toBe('a\n');
    expect(r.stderr).toBe('Fatal error: Uncaught DivisionByZeroError: Division by zero in main.php:3');
    expect(r.exitCode).toBe(255);
  });

  it('parse error di awal program', () => {
    const r = pisahKeluaranPhp('\nParse error: syntax error, unexpected token "echo" in /internal/eval.php on line 3\n', 255);
    expect(r.stdout).toBe('');
    expect(r.stderr).toBe('Parse error: syntax error, unexpected token "echo" in main.php on line 3');
  });
});

describe('artiGalatPhp', () => {
  it('menjelaskan error yang sering muncul', () => {
    expect(artiGalatPhp('Parse error: syntax error, unexpected token "echo"')).toMatch(/titik koma/);
    expect(artiGalatPhp('Fatal error: Uncaught Error: Call to undefined function garsi()')).toMatch(/ejaan/);
    expect(artiGalatPhp('Fatal error: Uncaught DivisionByZeroError')).toMatch(/nol/);
    expect(artiGalatPhp('sesuatu yang lain')).toBe('');
  });
});
