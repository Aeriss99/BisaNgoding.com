import { useEffect, useRef, useState } from 'react';
import type { PraktikPythonCard } from '../../types/schema';
import { konsol, siapkanPython } from '../../lib/pythonRunner';
import { nilaiLangkahPython, rapikanKeluaran } from '../../lib/praktikPython';
import { GelembungLingga } from './PraktikTerminalCard';

type Entri =
  | { jenis: 'lingga'; teks: string; label?: string; tantangan?: boolean }
  | { jenis: 'konsol'; masuk: string; keluar: string; galat: boolean };

const JEDA_MULAI = 600;
const JEDA_HURUF = 55;
const JEDA_HASIL = 400;

function bolehAnimasi(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function labelLangkah(card: PraktikPythonCard, i: number): string {
  const l = card.langkah[i];
  if (!l) return '';
  if (l.otomatis) return 'Contoh dari Lingga';
  const tugas = card.langkah.filter((x) => !x.otomatis);
  const ke = card.langkah.slice(0, i + 1).filter((x) => !x.otomatis).length;
  return `${l.tantangan ? 'Tantangan · ' : ''}Tugas ${ke} dari ${tugas.length}`;
}

export function PraktikPythonCardComponent(props: { card: PraktikPythonCard; onSuccess: (attempts: number) => void }) {
  return <Praktik key={`${props.card.judul}|${props.card.langkah.length}`} {...props} />;
}

function Praktik({ card, onSuccess }: { card: PraktikPythonCard; onSuccess: (attempts: number) => void }) {
  const [status, setStatus] = useState<'muat' | 'siap' | 'gagal'>('muat');
  const [langkahKe, setLangkahKe] = useState(0);
  const [entri, setEntri] = useState<Entri[]>(() => {
    const awal: Entri[] = [{ jenis: 'lingga', teks: card.pembuka }];
    if (card.langkah[0]) awal.push({ jenis: 'lingga', teks: card.langkah[0].arahan, label: labelLangkah(card, 0), tantangan: card.langkah[0].tantangan });
    return awal;
  });
  const [riwayat, setRiwayat] = useState<{ masuk: string; keluar: string; galat: boolean }[]>([]);
  const [ketikan, setKetikan] = useState('');
  const [sibuk, setSibuk] = useState(false);
  const [salahDiLangkah, setSalahDiLangkah] = useState(0);
  const [salahTotal, setSalahTotal] = useState(0);
  const [selesai, setSelesai] = useState(false);
  const [hurufContoh, setHurufContoh] = useState<number | null>(null);
  const [muatUlang, setMuatUlang] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const akhirRef = useRef<HTMLDivElement>(null);
  const konsolRef = useRef<HTMLDivElement>(null);
  const sudahBerinteraksi = useRef(false);
  /** Baris yang sudah diterima, untuk dijalankan ulang kalau Python dimuat ulang (misalnya setelah waktu habis). */
  const barisDiterima = useRef<string[]>([]);

  const langkah = card.langkah[langkahKe];

  // Muat Python, kosongkan namespace konsol, lalu jalankan persiapan.
  useEffect(() => {
    let batal = false;
    setStatus('muat');
    (async () => {
      const ok = await siapkanPython();
      if (batal) return;
      if (!ok) {
        setStatus('gagal');
        return;
      }
      await konsol.reset();
      if (card.persiapan) await konsol.persiapan(card.persiapan);
      if (!batal) setStatus('siap');
    })();
    return () => {
      batal = true;
    };
  }, [card, muatUlang]);

  useEffect(() => {
    if (sudahBerinteraksi.current) akhirRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    konsolRef.current?.scrollTo?.({ top: konsolRef.current.scrollHeight });
  }, [entri, riwayat]);

  const tambahKonsol = (masuk: string, keluar: string, galat: boolean) => setRiwayat((r) => [...r, { masuk, keluar, galat }]);

  /** Jalankan ulang baris yang sudah diterima setelah Python dihentikan karena waktu habis. */
  const pulihkanSesi = async () => {
    await siapkanPython();
    await konsol.reset();
    if (card.persiapan) await konsol.persiapan(card.persiapan);
    for (const b of barisDiterima.current) await konsol.jalankan(b);
  };

  const lanjutKeBerikut = (baris: string) => {
    if (!langkah) return;
    barisDiterima.current.push(baris);
    const baru: Entri[] = [];
    if (langkah.benar) baru.push({ jenis: 'lingga', teks: langkah.benar });
    const berikut = card.langkah[langkahKe + 1];
    if (berikut) {
      baru.push({ jenis: 'lingga', teks: berikut.arahan, label: labelLangkah(card, langkahKe + 1), tantangan: berikut.tantangan });
      setLangkahKe(langkahKe + 1);
      setSalahDiLangkah(0);
    } else {
      baru.push({ jenis: 'lingga', teks: card.penutup });
      setSelesai(true);
      onSuccess(salahTotal === 0 ? 1 : salahTotal + 1);
    }
    setKetikan('');
    setEntri((e) => [...e, ...baru]);
  };

  /** Jalankan satu baris di konsol dan nilai hasilnya. `contoh` = dijalankan Lingga (selalu dianggap benar). */
  const jalankan = async (baris: string, contoh = false) => {
    if (!langkah || sibuk || status !== 'siap') return;
    setSibuk(true);
    await konsol.simpan();
    const h = await konsol.jalankan(baris);
    if (h.waktuHabis) await pulihkanSesi();
    const keluar = rapikanKeluaran(h.keluaran + (h.galat ? (h.keluaran ? '\n' : '') + h.galat : '')) || '';
    tambahKonsol(baris, h.waktuHabis ? 'Dihentikan: terlalu lama berjalan.' : keluar, !!h.galat || !!h.waktuHabis);
    const cekLolos = langkah.cek && !h.jenisGalat ? await konsol.cek(langkah.cek) : null;
    const nilai = contoh ? { benar: true } : nilaiLangkahPython(langkah, baris, h, cekLolos);
    if (nilai.benar) {
      setSibuk(false);
      lanjutKeBerikut(baris);
      return;
    }
    await konsol.pulihkan();
    setSibuk(false);
    const jumlahSalah = salahDiLangkah + 1;
    setSalahDiLangkah(jumlahSalah);
    setSalahTotal((n) => n + 1);
    const tambahan = jumlahSalah >= 2 ? '\n\nKalau buntu, tekan **Lihat jawabannya**.' : '';
    const teks = nilai.khusus ? `${nilai.pesan}${tambahan}` : `${nilai.pesan} ${langkah.petunjuk}${tambahan}`;
    setEntri((e) => [...e, { jenis: 'lingga', teks }]);
    inputRef.current?.focus();
  };

  const jalankanRef = useRef(jalankan);
  jalankanRef.current = jalankan;
  const contohSudah = useRef(-1);
  const jalankanContoh = () => {
    if (!langkah?.otomatis || contohSudah.current === langkahKe) return;
    contohSudah.current = langkahKe;
    setHurufContoh(null);
    void jalankanRef.current(langkah.perintah, true);
  };
  const jalankanContohRef = useRef(jalankanContoh);
  jalankanContohRef.current = jalankanContoh;

  useEffect(() => {
    const l = card.langkah[langkahKe];
    if (selesai || !l?.otomatis || status !== 'siap') return;
    if (!bolehAnimasi()) {
      jalankanContohRef.current();
      return;
    }
    let n = 0;
    let t: ReturnType<typeof setTimeout>;
    const ketik = () => {
      n += 1;
      setHurufContoh(n);
      t = n < l.perintah.length ? setTimeout(ketik, JEDA_HURUF) : setTimeout(() => jalankanContohRef.current(), JEDA_HASIL);
    };
    setHurufContoh(0);
    t = setTimeout(ketik, JEDA_MULAI);
    return () => clearTimeout(t);
  }, [card, langkahKe, selesai, status]);

  const masukkan = () => {
    if (selesai || !langkah || langkah.otomatis) return;
    sudahBerinteraksi.current = true;
    if (!ketikan.trim()) {
      setEntri((e) => [...e, { jenis: 'lingga', teks: 'Ketik dulu perintahnya, lalu tekan Enter.' }]);
      return;
    }
    void jalankan(ketikan.trim());
  };

  const isiInput = langkah?.otomatis && hurufContoh !== null ? langkah.perintah.slice(0, hurufContoh) : ketikan;
  const bisaKetik = status === 'siap' && !selesai && !!langkah && !langkah.otomatis && !sibuk;

  return (
    <div className="space-y-4 min-w-0">
      <h3 className="m-0 font-space font-bold text-lg">{card.judul}</h3>

      <div role="log" aria-live="polite" aria-label="Percakapan dengan Lingga" className="space-y-3">
        {entri.map((e, i) =>
          e.jenis === 'lingga' ? <GelembungLingga key={i} teks={e.teks} label={e.label} tantangan={e.tantangan} /> : null
        )}
      </div>

      <div className="rounded-xl border-2 border-[var(--color-text-main)] bg-[#1d1d1b] overflow-hidden shadow-[3px_3px_0_var(--color-text-main)]">
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#3a3a36] font-mono text-[12px] text-[#b9b3a5]">
          <span>Python 3 · konsol</span>
          {status === 'muat' && <span role="status">Memuat Python (sekali saja)...</span>}
          {sibuk && status === 'siap' && <span role="status">Menjalankan...</span>}
        </div>
        <div
          ref={konsolRef}
          aria-label="Riwayat konsol Python"
          className="max-h-[320px] overflow-y-auto px-3 py-2 font-mono text-[13px] leading-[20px] text-[#f5f1e6] whitespace-pre-wrap [overflow-wrap:anywhere]"
        >
          {riwayat.length === 0 && status === 'siap' && <div className="text-[#8f8a7e]">Ketik perintah Python di bawah, lalu Enter.</div>}
          {riwayat.map((r, i) => (
            <div key={i} className="mb-1">
              <div>
                <span className="text-[#7ee2a8]">&gt;&gt;&gt; </span>
                {r.masuk}
              </div>
              {r.keluar && <div className={r.galat ? 'text-[#ff9b9b]' : ''}>{r.keluar}</div>}
            </div>
          ))}
        </div>
        {status === 'gagal' ? (
          <div className="px-3 py-3 border-t border-[#3a3a36] text-[14px] text-[#f5f1e6]">
            Python gagal dimuat. Periksa koneksi internet,{' '}
            <button type="button" onClick={() => setMuatUlang((n) => n + 1)} className="underline font-bold bg-transparent border-none p-0 text-[#7ee2a8] cursor-pointer">
              coba lagi
            </button>
            .
          </div>
        ) : (
          <form
            onSubmit={(ev) => {
              ev.preventDefault();
              masukkan();
            }}
            className="flex items-center gap-2 border-t border-[#3a3a36] pl-3 pr-2 py-2"
          >
            <label htmlFor="ketik-python" className="shrink-0 font-mono text-[13px] text-[#7ee2a8]">
              &gt;&gt;&gt;
            </label>
            <input
              id="ketik-python"
              ref={inputRef}
              type="text"
              aria-label="Ketik perintah Python"
              value={isiInput}
              readOnly={!bisaKetik}
              onChange={(ev) => setKetikan(ev.target.value)}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              enterKeyHint="send"
              placeholder={bisaKetik ? 'contoh: print("halo")' : ''}
              className="min-w-0 flex-1 bg-transparent text-[#f5f1e6] font-mono text-[14px] leading-6 py-1.5 outline-none placeholder:text-[#8f8a7e]"
            />
            {bisaKetik && (
              <button
                type="submit"
                className="shrink-0 min-h-[38px] px-3 rounded-lg bg-[var(--color-primary)] border-2 border-[var(--color-text-main)] font-bold text-[14px] text-[var(--color-text-main)]"
              >
                Enter
              </button>
            )}
          </form>
        )}
      </div>
      <div ref={akhirRef} />

      {!selesai && langkah?.otomatis && status === 'siap' && (
        <div className="flex items-center justify-between gap-3">
          <p className="m-0 text-[13px] text-[#5a5a5a]">Lingga sedang mengetik. Perhatikan dulu ya.</p>
          <button
            type="button"
            onClick={() => {
              sudahBerinteraksi.current = true;
              jalankanContoh();
            }}
            className="shrink-0 text-[14px] font-bold underline bg-transparent border-none p-0 cursor-pointer"
          >
            Lewati
          </button>
        </div>
      )}

      {!selesai && langkah && !langkah.otomatis && salahDiLangkah >= 2 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => {
              setKetikan(langkah.perintah);
              inputRef.current?.focus();
            }}
            className="text-[14px] font-bold underline bg-transparent border-none p-0 cursor-pointer text-[var(--color-text-main)]"
          >
            Lihat jawabannya
          </button>
        </div>
      )}
    </div>
  );
}
