import { describe, it, expect } from 'vitest';
import { pasangJagaLoop, rapikanPesanJavac, tutupTeks, PANGGIL_JAGA, PESAN_BATAS_WAKTU } from '../lib/javaJagaLoop';
import { rapikanHasil } from '../lib/javaRunner';

const jumlahJaga = (s: string) => s.split(PANGGIL_JAGA).length - 1;

describe('penjaga perulangan Java', () => {
  it('menyisipkan cek di badan while, for, dan do tanpa mengubah jumlah baris', () => {
    const src = 'public class Main {\n  public static void main(String[] a) {\n    while (true) {\n      int x = 1;\n    }\n  }\n}';
    const h = pasangJagaLoop(src);
    expect(h.kode).toContain('while (true) { ' + PANGGIL_JAGA);
    expect(h.kode.split('\n').length).toBe(src.split('\n').length);

    const f = pasangJagaLoop('for (int i = 0; i < 3; i++) { x(); }\nfor (String s : xs) {}\ndo { i++; } while (i < 3);');
    expect(jumlahJaga(f.kode)).toBe(3);
    expect(f.kode).toContain('} while (i < 3);');
  });

  it('menangani perulangan kosong dan badan satu pernyataan', () => {
    expect(pasangJagaLoop('while (true);').kode).toBe('while (true){' + PANGGIL_JAGA + ';}');
    expect(pasangJagaLoop('for (;;) i++;').kode).toBe('for (;;) { ' + PANGGIL_JAGA + ' i++; }');
    // ekor do-while bukan perulangan kosong
    expect(pasangJagaLoop('do i++; while (i < 3);').kode).toBe('do i++; while (i < 3);');
  });

  it('mengabaikan kata kunci di dalam string, char, komentar, dan nama lain', () => {
    const src = 'String s = "while (true) {"; // for (;;) {\n/* do { */ char c = \'{\'; int forX = 1; doIt(); x.while2();';
    expect(pasangJagaLoop(src).kode).toBe(src);
    expect(tutupTeks('"a{b"').trim()).toBe('');
  });

  it('mengembalikan baris kode dan tanda ^ pada pesan javac', () => {
    const src = 'class A {\n  void f() { while (x) { int y = z; } }\n}';
    const h = pasangJagaLoop(src);
    const baru = h.kode.split('\n')[1];
    const kolom = baru.indexOf('z;');
    const pesan = `/str/Main.java:2: error: cannot find symbol\n${baru}\n${' '.repeat(kolom)}^\n1 error`;
    const rapi = rapikanPesanJavac(pesan, h);
    const [, baris, tanda] = rapi.split('\n');
    expect(baris).toBe(src.split('\n')[1]);
    expect(tanda.indexOf('^')).toBe(src.split('\n')[1].indexOf('z;'));
    expect(rapi).not.toContain('_BnJaga');
  });

  it('mengganti tanda batas waktu dengan pesan ramah', () => {
    const r = rapikanHasil({ stdout: '1\n2\n', stderr: 'java.lang.Error: BN_BATAS_WAKTU\n\tat _BnJaga.cek(Runner.java:30)', exitCode: 1 }, pasangJagaLoop(''));
    expect(r.stderr).toBe(PESAN_BATAS_WAKTU);
    expect(r.timedOut).toBeFalsy();
  });
});
