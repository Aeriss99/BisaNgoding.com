import { describe, it, expect } from 'vitest';
import { runJsCode } from './jsRunner';

describe('jsRunner', () => {
  it('handles basic console.log and data types', async () => {
    const code = `
      console.log('string');
      console.log(123);
      console.log(true);
      console.log(null);
      console.log(undefined);
      console.log([1, 2, 3]);
      console.log({ a: 1, b: 'dua' });
    `;
    const res = await runJsCode(code);
    expect(res.exitCode).toBe(0);
    const lines = res.stdout.trim().split('\n');
    expect(lines[0]).toBe('string');
    expect(lines[1]).toBe('123');
    expect(lines[2]).toBe('true');
    expect(lines[3]).toBe('null');
    expect(lines[4]).toBe('undefined');
    expect(lines[5]).toBe('[ 1, 2, 3 ]');
    expect(lines[6]).toBe("{ a: 1, b: 'dua' }");
  });

  it('handles runtime error', async () => {
    const code = `nonExistentFunction();`;
    const res = await runJsCode(code);
    expect(res.exitCode).toBe(1);
    expect(res.stderr).toContain(
      'ReferenceError: nonExistentFunction is not defined (baris 1)'
    );
  });

  it('handles error on line 1 and 5', async () => {
    const code1 = `barisSatu();`;
    const res1 = await runJsCode(code1);
    expect(res1.stderr).toContain('(baris 1)');
    
    const code5 = `\n\n\n\nbarisLima();`;
    const res5 = await runJsCode(code5);
    expect(res5.stderr).toContain('(baris 5)');
  });

  it('handles syntax error', async () => {
    const code = `const a = ;`;
    const res = await runJsCode(code);
    expect(res.exitCode).toBe(1);
    expect(res.stderr).toContain('SyntaxError');
  });

  it('handles setTimeout', async () => {
    const code = `
      setTimeout(() => {
        console.log('delayed');
      }, 100);
      console.log('immediate');
    `;
    const res = await runJsCode(code);
    expect(res.exitCode).toBe(0);
    expect(res.stdout).toContain('immediate');
    expect(res.stdout).toContain('delayed');
  });

  it('handles async/await + Promise', async () => {
    const code = `
      const wait = (ms) => new Promise(r => setTimeout(r, ms));
      await wait(50);
      console.log('done async');
    `;
    const res = await runJsCode(code);
    expect(res.exitCode).toBe(0);
    expect(res.stdout.trim()).toBe('done async');
  });

  it('handles infinite loop (timeout)', async () => {
    const code = `while(true) {}`;
    const res = await runJsCode(code);
    expect(res.exitCode).toBe(-1);
    expect(res.timedOut).toBe(true);
    expect(res.stderr).toContain('Waktu habis');
  });

  it('handles DOM mode with html', async () => {
    const code = `console.log(document.getElementById('my-id').innerText);`;
    const html = `<div id="my-id">Hello from DOM</div>`;
    const res = await runJsCode(code, html);
    expect(res.exitCode).toBe(0);
    expect(res.stdout.trim()).toBe('Hello from DOM');
  });
});
