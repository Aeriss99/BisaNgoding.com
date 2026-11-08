import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormatSelExcel, PraktikExcelCard } from '../../types/schema';
import {
  Lembar,
  alamat,
  cekLangkah,
  kolomKeHuruf,
  rentangAlamat,
  tampilkan,
  terapkanIsi,
  uraiAlamat,
  type Nilai,
} from '../../lib/excel';
import { GelembungLingga } from './PraktikTerminalCard';

type Entri =
  | { jenis: 'lingga'; teks: string; label?: string; tantangan?: boolean }
  | { jenis: 'isi'; target: string; isi: string };

const JEDA_MULAI = 600;
const JEDA_HURUF = 55;
const JEDA_HASIL = 450;
const LEBAR_BAWAAN = 92;

function bolehAnimasi(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function labelLangkah(card: PraktikExcelCard, i: number): string {
  const l = card.langkah[i];
  if (!l) return '';
  if (l.otomatis) return 'Contoh dari Lingga';
  const tugas = card.langkah.filter((x) => !x.otomatis);
  const ke = card.langkah.slice(0, i + 1).filter((x) => !x.otomatis).length;
  return `${l.tantangan ? 'Tantangan · ' : ''}Tugas ${ke} dari ${tugas.length}`;
}

function teksTarget(sel: string, sampai?: string): string {
  return sampai && sampai.toUpperCase() !== sel.toUpperCase() ? `${sel}:${sampai}` : sel;
}

function formatSel(card: PraktikExcelCard, a: string): FormatSelExcel {
  const f = card.format ?? {};
  const kolom = a.replace(/\d+$/, '');
  return f[a] ?? f[kolom] ?? 'umum';
}

/** Angka rata kanan, teks rata kiri, seperti Excel. */
function rataKanan(v: Nilai): boolean {
  return typeof v === 'number' || typeof v === 'boolean' || (typeof v === 'object' && v !== null);
}

export function PraktikExcelCardComponent(props: { card: PraktikExcelCard; onSuccess: (attempts: number) => void }) {
  return <Praktik key={`${props.card.judul}|${props.card.langkah.length}`} {...props} />;
}

function Praktik({ card, onSuccess }: { card: PraktikExcelCard; onSuccess: (attempts: number) => void }) {
  const [lembar, setLembar] = useState(() => new Lembar(card.sel));
  const [langkahKe, setLangkahKe] = useState(0);
  const [entri, setEntri] = useState<Entri[]>(() => {
    const awal: Entri[] = [{ jenis: 'lingga', teks: card.pembuka }];
    if (card.langkah[0]) {
      awal.push({ jenis: 'lingga', teks: card.langkah[0].arahan, label: labelLangkah(card, 0), tantangan: card.langkah[0].tantangan });
    }
    return awal;
  });
  const [ketikan, setKetikan] = useState('');
  const [salahDiLangkah, setSalahDiLangkah] = useState(0);
  const [salahTotal, setSalahTotal] = useState(0);
  const [selesai, setSelesai] = useState(false);
  const [hurufContoh, setHurufContoh] = useState<number | null>(null);
  const [baruDiisi, setBaruDiisi] = useState<Set<string>>(new Set());
  const [dipilih, setDipilih] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const akhirRef = useRef<HTMLDivElement>(null);
  const sudahBerinteraksi = useRef(false);

  const langkah = card.langkah[langkahKe];
  const target = useMemo(
    () => (langkah && !selesai ? new Set(rentangAlamat(langkah.sel, langkah.sampai).map((a) => a.toUpperCase())) : new Set<string>()),
    [langkah, selesai]
  );

  // Ukuran lembar tetap selama kartu: data awal + semua sel yang akan diisi.
  const ukuran = useMemo(() => {
    let kolom = 1;
    let baris = 1;
    const semua = [...Object.keys(card.sel), ...card.langkah.flatMap((l) => rentangAlamat(l.sel, l.sampai))];
    for (const a of semua) {
      const p = uraiAlamat(a);
      if (!p) continue;
      kolom = Math.max(kolom, p.kolom);
      baris = Math.max(baris, p.baris);
    }
    return { kolom, baris };
  }, [card]);

  useEffect(() => {
    if (sudahBerinteraksi.current) akhirRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [entri]);

  const berhasil = (isi: string, lembarBaru: Lembar) => {
    if (!langkah) return;
    const sel = rentangAlamat(langkah.sel, langkah.sampai).map((a) => a.toUpperCase());
    setLembar(lembarBaru);
    setBaruDiisi(new Set(sel));
    const baru: Entri[] = [{ jenis: 'isi', target: teksTarget(langkah.sel, langkah.sampai), isi }];
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
    setDipilih(null);
    setEntri((e) => [...e, ...baru]);
  };

  const contohSudah = useRef(-1);
  const jalankanContoh = () => {
    if (!langkah?.otomatis || contohSudah.current === langkahKe) return;
    contohSudah.current = langkahKe;
    setHurufContoh(null);
    berhasil(langkah.jawaban, terapkanIsi(lembar, langkah.sel, langkah.jawaban, langkah.sampai));
  };
  const jalankanContohRef = useRef(jalankanContoh);
  jalankanContohRef.current = jalankanContoh;

  useEffect(() => {
    const l = card.langkah[langkahKe];
    if (selesai || !l?.otomatis) return;
    if (!bolehAnimasi()) {
      jalankanContohRef.current();
      return;
    }
    const panjang = l.jawaban.length;
    let n = 0;
    let t: ReturnType<typeof setTimeout>;
    const ketik = () => {
      n += 1;
      setHurufContoh(n);
      t = n < panjang ? setTimeout(ketik, JEDA_HURUF) : setTimeout(() => jalankanContohRef.current(), JEDA_HASIL);
    };
    setHurufContoh(0);
    t = setTimeout(ketik, JEDA_MULAI);
    return () => clearTimeout(t);
  }, [card, langkahKe, selesai]);

  const masukkan = () => {
    if (selesai || !langkah || langkah.otomatis) return;
    sudahBerinteraksi.current = true;
    const hasil = cekLangkah(lembar, langkah, ketikan);
    if (hasil.benar && hasil.lembar) {
      berhasil(ketikan.trim(), hasil.lembar);
      return;
    }
    const jumlahSalah = salahDiLangkah + 1;
    setSalahDiLangkah(jumlahSalah);
    setSalahTotal((n) => n + 1);
    const tambahan = jumlahSalah >= 2 ? '\n\nKalau buntu, tekan **Lihat jawabannya**.' : '';
    const teks = hasil.khusus ? `${hasil.pesan}${tambahan}` : `${hasil.pesan} ${langkah.petunjuk}${tambahan}`;
    setEntri((e) => [...e, { jenis: 'lingga', teks }]);
    inputRef.current?.focus();
  };

  const lihatJawaban = () => {
    if (!langkah) return;
    setKetikan(langkah.jawaban);
    inputRef.current?.focus();
  };

  /** Klik sel: saat menulis rumus, alamatnya disisipkan (seperti Excel); selain itu tampilkan isinya. */
  const klikSel = (a: string) => {
    const input = inputRef.current;
    if (!selesai && langkah && !langkah.otomatis && ketikan.startsWith('=') && input) {
      const awal = input.selectionStart ?? ketikan.length;
      const akhir = input.selectionEnd ?? awal;
      const baru = ketikan.slice(0, awal) + a + ketikan.slice(akhir);
      setKetikan(baru);
      requestAnimationFrame(() => {
        input.focus();
        input.setSelectionRange(awal + a.length, awal + a.length);
      });
      return;
    }
    setDipilih(a === dipilih ? null : a);
  };

  const isiDipilih = dipilih ? lembar.mentah(dipilih) : undefined;
  const isiBar = langkah?.otomatis && hurufContoh !== null ? langkah.jawaban.slice(0, hurufContoh) : ketikan;
  const namaSel = langkah && !selesai ? teksTarget(langkah.sel, langkah.sampai) : '';

  const kolom = Array.from({ length: ukuran.kolom }, (_, i) => i + 1);
  const baris = Array.from({ length: ukuran.baris }, (_, i) => i + 1);

  return (
    <div className="space-y-4 min-w-0">
      <h3 className="m-0 font-space font-bold text-lg">{card.judul}</h3>

      <div role="log" aria-live="polite" aria-label="Percakapan dengan Lingga" className="space-y-3">
        {entri.map((e, i) =>
          e.jenis === 'lingga' ? (
            <GelembungLingga key={i} teks={e.teks} label={e.label} tantangan={e.tantangan} />
          ) : (
            <div key={i} className="ml-11 inline-flex max-w-[calc(100%-2.75rem)] items-center gap-2 rounded-lg border-2 border-[#1e7e45] bg-[#e8f5ec] px-3 py-1.5 font-mono text-[13px] [overflow-wrap:anywhere]">
              <span className="font-bold text-[#1e7e45]">{e.target}</span>
              <span aria-hidden="true">←</span>
              <span className="sr-only">diisi</span>
              <span>{e.isi}</span>
            </div>
          )
        )}
        <div ref={akhirRef} />
      </div>

      <div className="rounded-xl border-2 border-[var(--color-text-main)] bg-white overflow-hidden shadow-[3px_3px_0_var(--color-text-main)]">
        <form
          onSubmit={(ev) => {
            ev.preventDefault();
            masukkan();
          }}
          className="flex items-stretch gap-0 border-b-2 border-[var(--color-text-main)] bg-[#f3f6f4]"
        >
          <div
            aria-label="Sel yang diisi"
            className="shrink-0 min-w-[64px] px-2 flex items-center justify-center border-r-2 border-[var(--color-text-main)] font-mono text-[13px] font-bold"
          >
            {namaSel || '—'}
          </div>
          <div aria-hidden="true" className="shrink-0 px-2 flex items-center font-serif italic text-[15px] text-[#5a5a5a] border-r border-[#c9cfcb]">
            fx
          </div>
          <label htmlFor="isi-rumus" className="sr-only">
            Ketik rumus atau isi sel {namaSel}
          </label>
          <input
            id="isi-rumus"
            ref={inputRef}
            type="text"
            value={isiBar}
            readOnly={selesai || !!langkah?.otomatis}
            onChange={(ev) => setKetikan(ev.target.value)}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            enterKeyHint="done"
            placeholder={selesai ? '' : langkah?.otomatis ? '' : 'ketik di sini, contoh =B2*C2'}
            className="min-w-0 flex-1 bg-white px-2.5 py-2 font-mono text-[14px] leading-6 outline-none placeholder:text-[#9a9a9a]"
          />
          {!selesai && langkah && !langkah.otomatis && (
            <button
              type="submit"
              className="shrink-0 m-1 min-h-[38px] px-3 rounded-lg bg-[var(--color-primary)] border-2 border-[var(--color-text-main)] font-bold text-[14px] text-[var(--color-text-main)]"
            >
              Enter
            </button>
          )}
        </form>

        <div className="max-w-full overflow-x-auto">
          <table className="border-collapse text-[13px] leading-[18px]" aria-label="Lembar kerja">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 w-9 min-w-9 bg-[#e9ecea] border border-[#c9cfcb]" aria-label="Nomor baris" />
                {kolom.map((k) => (
                  <th
                    key={k}
                    scope="col"
                    style={{ minWidth: card.lebar?.[kolomKeHuruf(k)] ?? LEBAR_BAWAAN }}
                    className="bg-[#e9ecea] border border-[#c9cfcb] px-1 py-1 font-semibold text-[#3d3d3d]"
                  >
                    {kolomKeHuruf(k)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {baris.map((b) => (
                <tr key={b}>
                  <th scope="row" className="sticky left-0 z-10 bg-[#e9ecea] border border-[#c9cfcb] px-1 font-semibold text-[#3d3d3d] text-center">
                    {b}
                  </th>
                  {kolom.map((k) => {
                    const a = alamat(k, b);
                    const v = lembar.nilai(a);
                    const isTarget = target.has(a);
                    const isAktif = !!langkah && !selesai && a === langkah.sel.toUpperCase();
                    const isBaru = baruDiisi.has(a);
                    return (
                      <td
                        key={a}
                        onClick={() => klikSel(a)}
                        title={a}
                        className={`border border-[#d6dbd8] px-1.5 py-1 whitespace-nowrap cursor-cell ${
                          rataKanan(v) ? 'text-right tabular-nums' : 'text-left'
                        } ${b === 1 ? 'font-bold bg-[#f6f7f6]' : ''} ${
                          isTarget ? 'bg-[#e8f5ec] outline outline-2 -outline-offset-2 outline-[#1e7e45]' : isBaru ? 'bg-[#fff7d6]' : ''
                        } ${isAktif ? 'outline-[3px]' : ''} ${dipilih === a ? 'bg-[#dbeafe]' : ''}`}
                      >
                        {isTarget && v === null ? <span className="sr-only">{a} diisi di sini</span> : tampilkan(v, formatSel(card, a))}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {dipilih && (
          <p role="status" className="m-0 px-3 py-2 border-t border-[#c9cfcb] text-[13px] font-mono bg-[#f8faf9] [overflow-wrap:anywhere]">
            <strong>{dipilih}</strong> berisi: {isiDipilih === undefined ? '(kosong)' : String(isiDipilih)}
          </p>
        )}
      </div>

      {!selesai && langkah?.otomatis && (
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

      {!selesai && langkah && !langkah.otomatis && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-[13px] text-[#5a5a5a]">
          <span>Klik sel saat menulis rumus untuk menyisipkan alamatnya.</span>
          {salahDiLangkah >= 2 && (
            <button type="button" onClick={lihatJawaban} className="text-[14px] font-bold underline bg-transparent border-none p-0 cursor-pointer text-[var(--color-text-main)]">
              Lihat jawabannya
            </button>
          )}
        </div>
      )}
    </div>
  );
}
