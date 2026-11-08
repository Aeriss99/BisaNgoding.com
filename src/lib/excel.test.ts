import { describe, it, expect } from 'vitest';
import {
  Lembar,
  cekLangkah,
  geserRumus,
  hitung,
  periksaRumus,
  rentangAlamat,
  tampilkan,
  terapkanIsi,
  uraiKonstanta,
} from './excel';

const lembar = new Lembar({
  A1: 'Nama', B1: 'Nilai',
  A2: 'Budi', B2: 80, A3: 'Sari', B3: 65, A4: 'Andi', B4: 90, A5: 'Dewi', B5: 'absen',
  D1: 'Kode', E1: 'Barang', F1: 'Harga',
  D2: 'K01', E2: 'Kopi', F2: 25000, D3: 'T02', E3: 'Teh', F3: 15000, D4: 'S03', E4: 'Susu', F4: 18000,
  H1: 0, I1: 'E', H2: 60, I2: 'C', H3: 75, I3: 'B', H4: 85, I4: 'A',
});
const t = (rumus: string) => tampilkan(hitung(rumus, lembar));

describe('mesin rumus Excel (pengaturan Indonesia)', () => {
  it.each([
    ['=1+2*3', '7'],
    ['=(1+2)*3', '9'],
    ['=-2^2', '4'],
    ['=2,5*2', '5'],
    ['=10/4', '2,5'],
    ['=50%*200', '100'],
    ['=0,1+0,2', '0,3'],
    ['=SUM(B2:B5)', '235'],
    ['=AVERAGE(B2:B5)', '78,333333333'],
    ['=COUNT(B2:B5)', '3'],
    ['=COUNTA(A2:A5)', '4'],
    ['=MAX(B2:B5)', '90'],
    ['=MIN(B2:B5)', '65'],
    ['=IF(B2>=75;"Lulus";"Ulang")', 'Lulus'],
    ['=IF(B3>=75;"Lulus";"Ulang")', 'Ulang'],
    ['=IF(B2>=85;"A";IF(B2>=75;"B";"C"))', 'B'],
    ['=IFS(B4>=85;"A";B4>=75;"B";TRUE;"C")', 'A'],
    ['=AND(B2>70;B4>70)', 'TRUE'],
    ['=OR(B3>70;B5="absen")', 'TRUE'],
    ['=COUNTIF(B2:B5;">=75")', '2'],
    ['=COUNTIF(A2:A5;"S*")', '1'],
    ['=SUMIF(B2:B5;">70")', '170'],
    ['=COUNTIFS(B2:B5;">60";A2:A5;"S*")', '1'],
    ['=SUMIFS(F2:F4;E2:E4;"<>Teh")', '43000'],
    ['=AVERAGEIF(A2:A5;"<>Sari";B2:B5)', '85'],
    ['=VLOOKUP("T02";D2:F4;3;FALSE)', '15000'],
    ['=VLOOKUP("t02";D2:F4;2;FALSE)', 'Teh'],
    ['=VLOOKUP("X";D2:F4;2;FALSE)', '#N/A'],
    ['=VLOOKUP("K01";D2:F4;4;FALSE)', '#REF!'],
    ['=VLOOKUP(80;H1:I4;2;TRUE)', 'B'],
    ['=VLOOKUP(59;H1:I4;2)', 'E'],
    ['=HLOOKUP("Kode";D1:F2;2;FALSE)', 'K01'],
    ['=INDEX(E2:E4;MATCH("S03";D2:D4;0))', 'Susu'],
    ['=XLOOKUP("K01";D2:D4;F2:F4)', '25000'],
    ['=XLOOKUP("Z";D2:D4;F2:F4;"Tidak ada")', 'Tidak ada'],
    ['=LEFT("KP-001-JKT";2)', 'KP'],
    ['=MID("KP-001-JKT";4;3)', '001'],
    ['=RIGHT("KP-001-JKT";3)', 'JKT'],
    ['=LEN("Sari Dewi")', '9'],
    ['=TRIM("  Budi   Santoso ")', 'Budi Santoso'],
    ['=PROPER("aNDI pRATAMA")', 'Andi Pratama'],
    ['=SUBSTITUTE("0812-3456";"-";"")', '08123456'],
    ['=A2&" - "&B2', 'Budi - 80'],
    ['=TEXTJOIN(", ";TRUE;A2:A4)', 'Budi, Sari, Andi'],
    ['=ROUND(2,345;2)', '2,35'],
    ['=ROUND(1234567;-3)', '1235000'],
    ['=ROUNDUP(17810;-2)', '17900'],
    ['=ROUNDDOWN(45900;-3)', '45000'],
    ['=IFERROR(1/0;"x")', 'x'],
    ['=1/0', '#DIV/0!'],
    ['=B5*2', '#VALUE!'],
    ['=Lulus', '#NAME?'],
    ['=SUMM(1)', '#NAME?'],
    ['=DATEDIF(DATE(2000;5;17);DATE(2026;5;16);"Y")', '25'],
    ['=DATEDIF(DATE(2022;3;1);DATE(2026;12;31);"YM")', '9'],
    ['=DATEDIF(DATE(2026;12;31);DATE(2022;3;1);"Y")', '#NUM!'],
    ['=YEAR(DATE(2026;13;1))', '2027'],
    ['=WEEKDAY(DATE(2026;8;17))', '2'],
    ['=RANK(B2;B2:B4)', '2'],
    ['=RANK(B2;B2:B4;1)', '2'],
  ])('%s = %s', (rumus, hasil) => {
    expect(t(rumus)).toBe(hasil);
  });

  it('COUNTIF mencocokkan teks berisi angka seperti Excel (nomor HP berawalan 0)', () => {
    const l = new Lembar({ B1: "'0812001", B2: "'0813002", B3: "'0812001" });
    expect(hitung('=COUNTIF(B1:B3;B1)', l)).toBe(2);
  });

  it('isian sel dibaca seperti Excel wilayah Indonesia', () => {
    expect(uraiKonstanta('1.250.000')).toBe(1250000);
    expect(uraiKonstanta('2,5')).toBe(2.5);
    expect(uraiKonstanta('15%')).toBeCloseTo(0.15);
    expect(uraiKonstanta('081234567890')).toBe(81234567890);
    expect(uraiKonstanta("'081234567890")).toBe('081234567890');
    expect(tampilkan(uraiKonstanta('17/08/2026'), 'tanggal')).toBe('17/08/2026');
    expect(uraiKonstanta('08/17/2026')).toBe('08/17/2026');
  });

  it('format tampilan', () => {
    expect(tampilkan(1250000, 'rupiah')).toBe('Rp1.250.000');
    expect(tampilkan(1250000, 'ribuan')).toBe('1.250.000');
    expect(tampilkan(0.125, 'persen')).toBe('13%');
    expect(tampilkan(1234.5, 'desimal2')).toBe('1.234,50');
    expect(tampilkan(3, 'tanggal')).toBe('03/01/1900');
    expect(tampilkan(true)).toBe('TRUE');
  });

  it('pesan untuk penulisan rumus yang ditolak Excel', () => {
    expect(periksaRumus('=IF(B2>70,"L","G")')?.jenis).toBe('koma');
    expect(periksaRumus('=B2*0.1')?.jenis).toBe('titik-desimal');
    expect(periksaRumus('=SUM(B2:B5')?.jenis).toBe('kurung');
    expect(periksaRumus('=ROUND(B2)')?.jenis).toBe('argumen');
    expect(periksaRumus('=IF(B2>=75;"Lulus";"Ulang")')).toBeNull();
  });

  it('menyalin rumus menggeser alamat relatif, alamat ber-$ tetap', () => {
    expect(geserRumus('=B2*$F$1+SUM($B$2:B2)', 0, 3)).toBe('=B5*$F$1+SUM($B$2:B5)');
    expect(geserRumus('=$A2*B$1', 2, 1)).toBe('=$A3*D$1');
    expect(geserRumus('=B2', 0, -5)).toBe('=#REF!');
    expect(rentangAlamat('B2', 'C3')).toEqual(['B2', 'C2', 'B3', 'C3']);
    const l = terapkanIsi(new Lembar({ B2: 1, B3: 2, B4: 3 }), 'C2', '=B2*10', 'C4');
    expect([l.mentah('C4'), l.nilai('C4')]).toEqual(['=B4*10', 30]);
  });

  it('rumus yang memakai selnya sendiri tidak membuat macet', () => {
    const l = new Lembar({ A1: 1, A2: '=SUM(A1:A2)' });
    expect(tampilkan(l.nilai('A2'))).toBe('0');
  });
});

describe('cekLangkah', () => {
  const l = new Lembar({ B2: 1, B3: 2, B4: 3, H3: 10, C1: 80 });
  const langkah = { sel: 'C2', sampai: 'C4', jawaban: '=B2*$H$3' };

  it('menerima rumus yang hasilnya sama di semua sel, huruf kecil juga boleh', () => {
    expect(cekLangkah(l, langkah, '=B2*$H$3').benar).toBe(true);
    expect(cekLangkah(l, langkah, '=b2*$h$3').benar).toBe(true);
  });

  it('menjelaskan $ yang terlupa saat rumus disalin', () => {
    const h = cekLangkah(l, langkah, '=B2*H3');
    expect(h.benar).toBe(false);
    expect(h.pesan).toMatch(/\$/);
  });

  it('menolak rumus tanpa = dan rumus dengan koma', () => {
    expect(cekLangkah(l, langkah, 'B2*$H$3').pesan).toMatch(/sama dengan/);
    expect(cekLangkah(l, { sel: 'D1', jawaban: '=IF(C1>=75;"L";"U")' }, '=IF(C1>=75,"L","U")').pesan).toMatch(/titik koma/);
  });

  it('menolak angka yang diketik langsung walaupun hasilnya sama', () => {
    const h = cekLangkah(l, { sel: 'D1', jawaban: '=C1*2' }, '=160');
    expect(h.benar).toBe(false);
    expect(h.pesan).toMatch(/alamat sel/);
  });

  it('memberi tahu kalau hanya huruf besar-kecil yang berbeda', () => {
    const h = cekLangkah(l, { sel: 'D1', jawaban: '=IF(C1>=75;"Lulus";"Ulang")' }, '=IF(C1>=75;"lulus";"Ulang")');
    expect(h.pesan).toMatch(/huruf besar-kecil/);
  });

  it('pola wajib dan pola salah', () => {
    const wajib = { sel: 'D1', jawaban: '=SUM(B2:B4)', wajib: [{ pola: 'SUM\\(', pesan: 'Pakai SUM.' }] };
    expect(cekLangkah(l, wajib, '=B2+B3+B4').pesan).toBe('Pakai SUM.');
    const salah = { sel: 'D1', jawaban: '=B2*B3', salah: [{ pola: 'b2xb3', reaksi: 'Pakai *.' }] };
    expect(cekLangkah(l, salah, '=B2xB3').pesan).toBe('Pakai *.');
  });
});
