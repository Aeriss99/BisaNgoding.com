import { describe, it, expect } from 'vitest';
import { amankanHtml, formatKeluaranHtml } from '../lib/formatKeluaran';

describe('amankanHtml', () => {
  it('mengamankan semua karakter khusus HTML', () => {
    expect(amankanHtml('<b>"a" & \'b\'</b>')).toBe('&lt;b&gt;&quot;a&quot; &amp; &#39;b&#39;&lt;/b&gt;');
  });
});

describe('formatKeluaranHtml', () => {
  it('mengamankan tanda < dan > di keluaran normal', () => {
    const result = formatKeluaranHtml('List<String>');
    expect(result).toContain('List&lt;String&gt;');
    expect(result).not.toContain('<String>');
  });

  it('mengamankan tipe generik di pesan error dan menampilkan span Main.java', () => {
    const result = formatKeluaranHtml('/str/Main.java:5: error: incompatible types: ArrayList<Integer>');
    expect(result).toContain('>Main.java:5</span>');
    expect(result).toContain('ArrayList&lt;Integer&gt;');
  });

  it('tidak menyisipkan tag HTML dari keluaran pengguna', () => {
    const result = formatKeluaranHtml('<img src=x onerror=alert(1)>');
    expect(result).not.toContain('<img');
  });

  it('menyaring baris stack trace Runner', () => {
    const result = formatKeluaranHtml('at Runner.main(Runner.java:3)');
    expect(result).not.toContain('Runner.main');
  });

  it('membatasi 5 error dan menampilkan pesan ringkasan', () => {
    const lines = [];
    for (let i = 1; i <= 7; i++) {
      lines.push(`/str/Main.java:${i}: error: x`);
    }
    const result = formatKeluaranHtml(lines.join('\n'));
    expect(result).toContain('dan beberapa error lainnya');
    expect(result).not.toContain('Main.java:6');
  });
});
