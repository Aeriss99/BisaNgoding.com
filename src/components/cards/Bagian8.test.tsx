import { describe, it, expect } from 'vitest';
import { getErrorHint } from '../../lib/errorHints';

describe('Bagian 8 - Error Dictionary', () => {
  it('kamus errorHints mencocokkan pola dengan benar, termasuk kasus tidak cocok', () => {
    expect(getErrorHint("Main.java:5: error: ';' expected")).toContain(
      'Ada perintah yang belum diakhiri titik koma'
    );
    expect(getErrorHint('cannot find symbol')).toContain(
      'Java tidak mengenal nama itu'
    );
    expect(getErrorHint('incompatible types')).toContain(
      'Tipe data tidak cocok'
    );
    expect(getErrorHint('missing return statement')).toContain(
      'Method yang punya tipe kembalian belum mengembalikan nilai'
    );
    expect(
      getErrorHint('class, interface, enum, or record expected')
    ).toContain('Ada kurung kurawal yang kelebihan atau kurang');
    expect(getErrorHint('reached end of file while parsing')).toContain(
      'belum ditutup'
    );
    expect(getErrorHint('unclosed string literal')).toContain(
      'Tanda kutip teks belum ditutup'
    );
    expect(getErrorHint('might not have been initialized')).toContain(
      'Variabel dipakai sebelum diberi nilai'
    );
    expect(getErrorHint('already defined')).toContain(
      'Nama variabel atau method yang sama dibuat dua kali'
    );
    expect(
      getErrorHint(
        'non-static method cannot be referenced from a static context'
      )
    ).toContain('Method static mencoba memakai sesuatu yang bukan static');
    expect(getErrorHint('java.lang.ArithmeticException: / by zero')).toContain(
      'Program membagi dengan nol'
    );
    expect(getErrorHint('java.lang.ArrayIndexOutOfBoundsException')).toContain(
      'Mengakses index array di luar batas'
    );
    expect(getErrorHint('java.lang.NullPointerException')).toContain(
      'Memakai object yang masih null'
    );
    expect(getErrorHint('java.lang.NumberFormatException')).toContain(
      'Mengubah teks yang bukan angka menjadi angka'
    );
    expect(getErrorHint('java.util.InputMismatchException')).toContain(
      'Scanner meminta angka tapi yang diberikan bukan angka'
    );
    expect(getErrorHint('java.util.NoSuchElementException')).toContain(
      'Program meminta input lebih banyak dari yang tersedia'
    );
    expect(getErrorHint('java.lang.StackOverflowError')).toContain(
      'Method rekursif tidak pernah berhenti'
    );
    expect(getErrorHint('java.lang.ClassCastException')).toContain(
      'Casting object ke tipe yang bukan tipe aslinya'
    );

    expect(getErrorHint('Random Weird Unknown Exception Error!!')).toBeNull();
  });
});
