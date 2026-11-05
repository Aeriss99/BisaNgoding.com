#!/usr/bin/env python3
"""Memotong hening di awal rekaman public/audio/en/*.mp3 supaya suara langsung terdengar saat diklik.
Menyisakan 0,03 detik hening. Nama file tidak berubah. Format: MP3 24 kHz mono 48 kb/s (sama dengan aslinya).
Butuh ffmpeg. Pakai:
  python3 scripts/potong-hening-suara.py          (hanya laporan)
  python3 scripts/potong-hening-suara.py --tulis  (menimpa file)
"""
import glob, os, re, subprocess, sys, tempfile

FOLDER = 'public/audio/en'
SISA = 0.03        # detik hening yang disisakan
BATAS = 0.095      # hening awal di bawah ini dianggap sudah pendek (file sudah dipotong), tidak diproses

def hening_awal(f):
    o = subprocess.run(['ffmpeg', '-hide_banner', '-i', f, '-af', 'silencedetect=noise=-45dB:d=0.05', '-f', 'null', '-'],
                       capture_output=True, text=True).stderr
    mulai = re.findall(r'silence_start: (-?[\d.e-]+)', o)
    akhir = re.findall(r'silence_end: ([\d.]+)', o)
    if mulai and akhir and abs(float(mulai[0])) < 0.01:
        return float(akhir[0])
    return 0.0

def main():
    tulis = '--tulis' in sys.argv
    berkas = sorted(glob.glob(os.path.join(FOLDER, '*.mp3')))
    if not berkas:
        raise SystemExit('BERHENTI: tidak ada file di ' + FOLDER)
    diproses = 0
    total_potong = 0.0
    for f in berkas:
        h = hening_awal(f)
        if h < BATAS:
            continue
        potong = h - SISA
        diproses += 1
        total_potong += potong
        if tulis:
            fd, tmp = tempfile.mkstemp(suffix='.mp3'); os.close(fd)
            r = subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-ss', f'{potong:.3f}', '-i', f,
                                '-map_metadata', '-1', '-ac', '1', '-ar', '24000', '-b:a', '48k', '-c:a', 'libmp3lame', tmp])
            if r.returncode != 0 or os.path.getsize(tmp) < 500:
                os.remove(tmp)
                raise SystemExit(f'BERHENTI: gagal memproses {f}')
            os.replace(tmp, f)
    rata = total_potong / diproses if diproses else 0
    print(f'{"Dipotong" if tulis else "Akan dipotong"}: {diproses} dari {len(berkas)} file, rata-rata {rata:.2f} detik')

if __name__ == '__main__':
    main()
