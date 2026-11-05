#!/usr/bin/env python3
"""Soal ditampilkan sebagai teks biasa, jadi tanda Markdown tampil mentah.
Skrip ini mengganti di field question, options, explanation (soal cek pemahaman, tebak output, quiz):
  `kode`   -> 'kode'   (isi ada ' -> "kode"; isi ada ' dan " -> tanpa tanda)
  **teks** -> 'teks' untuk istilah/nama tombol (dan semua di kelas English),
              TIDAK/BUKAN/... untuk kata penegas soal, teks biasa untuk penekanan lain
Field lain (theory, remedial, code, summary, dll.) tidak disentuh. Format file JSON dipertahankan.
Pakai:  python3 scripts/ganti-tanda-soal.py          (hanya laporan)
        python3 scripts/ganti-tanda-soal.py --tulis  (menulis perubahan)
"""
import glob, json, re, sys

RE_KODE = re.compile(r'`([^`\n]+)`')
# Hanya **teks** yang diawali dan diakhiri huruf/angka (pola bintang seperti ** ⏎ ** tidak disentuh).
RE_TEBAL = re.compile(r'(?<!\*)\*\*([^\s*](?:[^*\n]*?[^\s*])?)\*\*(?!\*)')
NEGASI = {'tidak', 'bukan', 'kecuali', 'belum', 'tanpa', 'tidak boleh', 'tidak bisa', 'tidak cukup'}
ISTILAH = {'private', 'public', 'privat', 'fork', 'path', 'server', 'base', 'lightweight', 'atomicity',
           'durability', 'true', 'draft pull request', 'secret gist', 'library API', '4-core', 'valid', 'error'}

# Kasus khusus: backtick di sini adalah sintaks SQL/Markdown asli, jadi ditulis ulang manual.
KHUSUS = {
    "Ada tabel bernama `group`. Bagaimana cara membaca isinya dengan benar?":
        "Ada tabel bernama group. Bagaimana cara membaca isinya dengan benar?",
    "`order` adalah kata kunci (seperti di ORDER BY). Tulis `` `order` `` atau lebih baik pakai nama lain seperti `pesanan`.":
        "order adalah kata kunci (seperti di ORDER BY). Apit dengan backtick (tanda di kiri angka 1 pada keyboard), atau lebih baik pakai nama lain seperti pesanan.",
    "Blok ```suggestion menghasilkan tombol Commit suggestion.":
        "Blok kode berlabel suggestion menghasilkan tombol Commit suggestion.",
}
# Pilihan jawaban yang memang berisi kode SQL dengan backtick: jangan diubah.
OPSI_TETAP = {"SELECT * FROM `group`;"}

def kutip(m):
    isi = m.group(1)
    if "'" not in isi:
        return f"'{isi}'"
    if '"' not in isi:
        return f'"{isi}"'
    return isi

def tebal(english):
    def ganti(m):
        isi = m.group(1)
        if english or isi in ISTILAH or any(c.isupper() for c in isi):
            return kutip(m)
        if isi in NEGASI:
            return isi.upper()
        return isi
    return ganti

def ubah(teks, english=False):
    if not isinstance(teks, str) or teks in OPSI_TETAP:
        return teks
    if teks in KHUSUS:
        return KHUSUS[teks]
    # **tebal** dulu, supaya bintang di dalam `kode` (misalnya `*** teks ***`) tidak ikut diubah
    bagian = re.split(r'(`[^`\n]+`)', teks)
    bagian = [b if b.startswith('`') else RE_TEBAL.sub(tebal(english), b) for b in bagian]
    return RE_KODE.sub(kutip, ''.join(bagian))

def kumpulkan(o, ganti, english):
    if isinstance(o, dict):
        if 'options' in o and 'answer' in o:
            daftar = [o.get('question'), o.get('explanation')]
            opsi = o['options'] if isinstance(o['options'], list) else []
            baru_opsi = [ubah(x, english) for x in opsi]
            if len(set(baru_opsi)) != len(baru_opsi):
                raise SystemExit(f'BERHENTI: pilihan jawaban jadi dobel: {opsi}')
            for s in daftar + opsi:
                b = ubah(s, english)
                if isinstance(s, str) and b != s:
                    ganti[s] = b
        for k, v in o.items():
            if k not in ('code', 'remedial'):
                kumpulkan(v, ganti, english)
    elif isinstance(o, list):
        for x in o:
            kumpulkan(x, ganti, english)

def enc(s):
    return json.dumps(s, ensure_ascii=False)

def main():
    tulis = '--tulis' in sys.argv
    total = berkas = 0
    for f in sorted(glob.glob('content/**/*.json', recursive=True)):
        teks = open(f, encoding='utf-8').read()
        ganti = {}
        kumpulkan(json.loads(teks), ganti, '/english/' in f.replace('\\', '/'))
        if not ganti:
            continue
        baru = teks
        for lama, b in ganti.items():
            if enc(lama) not in baru:
                raise SystemExit(f'BERHENTI: teks tidak ditemukan apa adanya di {f}: {lama[:60]}')
            baru = baru.replace(enc(lama), enc(b))
        json.loads(baru)  # pastikan JSON tetap sah
        total += len(ganti); berkas += 1
        if tulis:
            open(f, 'w', encoding='utf-8').write(baru)
    print(f'{"Diubah" if tulis else "Akan diubah"}: {total} teks di {berkas} file')

if __name__ == '__main__':
    main()
