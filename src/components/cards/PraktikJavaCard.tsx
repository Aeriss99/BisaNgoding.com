import { useEffect, useRef, useState } from 'react';
import type { PraktikJavaCard } from '../../types/schema';
import { runJavaCode } from '../../lib/javaRunner';
import { getErrorHint } from '../../lib/errorHints';
import { pecahTeks } from '../../lib/praktikTerminal';
import {
  cekWajib,
  keluaranSama,
  kodeAwalLangkah,
  labelLangkahJava,
  rapikanError,
  rapikanKeluaran,
} from '../../lib/praktikJava';
import { CodeEditor } from './CodeEditor';

type Entri =
  | { jenis: 'lingga'; teks: string; label?: string; tantangan?: boolean }
  | { jenis: 'kode'; kode: string }
  | { jenis: 'hasil'; teks: string; status: 'benar' | 'salah' | 'error'; judul: string };

/** Jeda animasi contoh Lingga (milidetik). Kode lebih panjang dari perintah terminal, jadi diketik lebih cepat. */
const JEDA_MULAI = 600;
const JEDA_HURUF = 12;
const JEDA_KELUARAN = 500;

function bolehAnimasi(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function Teks({ teks }: { teks: string }) {
  return (
    <>
      {pecahTeks(teks).map((b, i) =>
        b.jenis === 'kode' ? (
          <code
            key={i}
            className="font-mono text-[0.92em] bg-[#f1ece0] border border-[#d9d2c3] rounded px-1 py-[1px] break-words"
          >
            {b.isi}
          </code>
        ) : b.jenis === 'tebal' ? (
          <strong key={i}>{b.isi}</strong>
        ) : (
          <span key={i}>{b.isi}</span>
        )
      )}
    </>
  );
}

function GelembungLingga({ teks, label, tantangan }: { teks: string; label?: string; tantangan?: boolean }) {
  return (
    <div className="flex items-start gap-2.5">
      <div
        aria-hidden="true"
        className="shrink-0 w-9 h-9 rounded-full bg-[var(--color-primary)] border-2 border-[var(--color-text-main)] flex items-center justify-center font-space font-bold text-[16px]"
      >
        L
      </div>
      <div
        className={`min-w-0 flex-1 ${tantangan ? 'bg-[#fff7d6]' : 'bg-white'} border-2 border-[var(--color-text-main)] rounded-xl rounded-tl-sm px-3.5 py-2.5 shadow-[3px_3px_0_var(--color-text-main)] text-[15px] leading-[1.55] whitespace-pre-line`}
      >
        {label && (
          <span
            className={`block mb-1 font-mono text-[12px] font-bold tracking-[0.5px] uppercase ${tantangan ? 'text-[#a3127f]' : 'text-[#5a5a5a]'}`}
          >
            {label}
          </span>
        )}
        <span className="sr-only">Lingga: </span>
        <Teks teks={teks} />
      </div>
    </div>
  );
}

function BlokKode({ kode, kursor }: { kode: string; kursor?: boolean }) {
  return (
    <div className="rounded-[10px] overflow-hidden border-2 border-[var(--color-text-main)]">
      <div className="px-3 py-1 bg-[#2b2b28] text-[#bdb7a8] font-mono text-[12px]">Main.java</div>
      <pre className="m-0 px-4 py-3 bg-[#1d1d1b] text-[#f5f1e6] font-mono text-[13px] leading-[20px] whitespace-pre-wrap [overflow-wrap:anywhere]">
        {kode}
        {kursor && (
          <span aria-hidden="true" className="inline-block w-[0.6em] h-[1.1em] align-text-bottom bg-[#f5f1e6] ml-[1px]" />
        )}
      </pre>
    </div>
  );
}

function BlokHasil({ teks, status, judul }: { teks: string; status: 'benar' | 'salah' | 'error'; judul: string }) {
  const warna = status === 'benar' ? 'text-[#7ee2a8]' : status === 'error' ? 'text-[#ff9b8f]' : 'text-[#f5d76e]';
  return (
    <div className="rounded-[10px] overflow-hidden border-2 border-[var(--color-text-main)]">
      <div className={`px-3 py-1 bg-[#2b2b28] font-mono text-[12px] ${warna}`}>{judul}</div>
      <pre className="m-0 px-4 py-3 bg-[#111110] text-[#f5f1e6] font-mono text-[13px] leading-[20px] whitespace-pre-wrap [overflow-wrap:anywhere]">
        {teks || '(tidak ada keluaran)'}
      </pre>
    </div>
  );
}

export function PraktikJavaCardComponent(props: { card: PraktikJavaCard; onSuccess: (attempts: number) => void }) {
  // Kartu baru = komponen baru, jadi semua keadaan mulai dari awal.
  return <Praktik key={`${props.card.judul}|${props.card.langkah.length}`} {...props} />;
}

function Praktik({ card, onSuccess }: { card: PraktikJavaCard; onSuccess: (attempts: number) => void }) {
  const [langkahKe, setLangkahKe] = useState(0);
  const [entri, setEntri] = useState<Entri[]>(() => {
    const awal: Entri[] = [{ jenis: 'lingga', teks: card.pembuka }];
    if (card.langkah[0]) {
      awal.push({
        jenis: 'lingga',
        teks: card.langkah[0].arahan,
        label: labelLangkahJava(card, 0),
        tantangan: card.langkah[0].tantangan,
      });
    }
    return awal;
  });
  const [kode, setKode] = useState(() => kodeAwalLangkah(card, card.langkah[0]?.otomatis ? 1 : 0));
  const [resetEditor, setResetEditor] = useState(0);
  const [sedangJalan, setSedangJalan] = useState(false);
  const [statusJalan, setStatusJalan] = useState('');
  const [salahDiLangkah, setSalahDiLangkah] = useState(0);
  const [salahTotal, setSalahTotal] = useState(0);
  const [selesai, setSelesai] = useState(false);
  /** Jumlah huruf contoh Lingga yang sudah tampil; null = Lingga tidak sedang mengetik. */
  const [hurufContoh, setHurufContoh] = useState<number | null>(null);
  const akhirRef = useRef<HTMLDivElement>(null);
  const sudahBerinteraksi = useRef(false);

  const langkah = card.langkah[langkahKe];

  useEffect(() => {
    if (sudahBerinteraksi.current) akhirRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [entri]);

  /** Langkah sekarang berhasil: tampilkan hasil, reaksi Lingga, lalu lanjut ke langkah berikutnya. */
  const berhasil = (tambahanAwal: Entri[]) => {
    if (!langkah) return;
    const baru: Entri[] = [...tambahanAwal];
    if (langkah.benar) baru.push({ jenis: 'lingga', teks: langkah.benar });
    const berikut = card.langkah[langkahKe + 1];
    if (berikut) {
      baru.push({
        jenis: 'lingga',
        teks: berikut.arahan,
        label: labelLangkahJava(card, langkahKe + 1),
        tantangan: berikut.tantangan,
      });
      setLangkahKe(langkahKe + 1);
      setSalahDiLangkah(0);
      setKode(kodeAwalLangkah(card, langkahKe + 1));
      setResetEditor((n) => n + 1);
    } else {
      baru.push({ jenis: 'lingga', teks: card.penutup });
      setSelesai(true);
      onSuccess(salahTotal === 0 ? 1 : salahTotal + 1);
    }
    setEntri((e) => [...e, ...baru]);
  };

  // ---------------- Contoh dari Lingga
  const contohSudah = useRef(-1);
  const jalankanContoh = () => {
    if (!langkah?.otomatis || contohSudah.current === langkahKe) return;
    contohSudah.current = langkahKe;
    setHurufContoh(null);
    berhasil([
      { jenis: 'kode', kode: langkah.jawaban },
      { jenis: 'hasil', teks: rapikanKeluaran(langkah.keluaran), status: 'benar', judul: 'Hasil' },
    ]);
  };
  const jalankanContohRef = useRef(jalankanContoh);
  jalankanContohRef.current = jalankanContoh;

  useEffect(() => {
    if (selesai || !card.langkah[langkahKe]?.otomatis) return;
    if (!bolehAnimasi()) {
      jalankanContohRef.current();
      return;
    }
    const panjang = card.langkah[langkahKe].jawaban.length;
    let n = 0;
    let t: ReturnType<typeof setTimeout>;
    const ketik = () => {
      n += 2;
      setHurufContoh(Math.min(n, panjang));
      t = n < panjang ? setTimeout(ketik, JEDA_HURUF) : setTimeout(() => jalankanContohRef.current(), JEDA_KELUARAN);
    };
    setHurufContoh(0);
    t = setTimeout(ketik, JEDA_MULAI);
    return () => clearTimeout(t);
  }, [card, langkahKe, selesai]);

  const lewatiContoh = () => {
    sudahBerinteraksi.current = true;
    jalankanContoh();
  };

  // ---------------- Tugas pengguna
  const salah = (tambahan: Entri[], teksLingga: string) => {
    const jumlahSalah = salahDiLangkah + 1;
    setSalahDiLangkah(jumlahSalah);
    setSalahTotal((n) => n + 1);
    const ajak = jumlahSalah >= 2 ? '\n\nKalau buntu, tekan **Lihat jawabannya**.' : '';
    setEntri((e) => [...e, ...tambahan, { jenis: 'lingga', teks: teksLingga + ajak }]);
  };

  const jalankan = async () => {
    if (selesai || !langkah || langkah.otomatis || sedangJalan) return;
    sudahBerinteraksi.current = true;
    setSedangJalan(true);
    setStatusJalan('Memuat Java (sekali saja)');
    try {
      const res = await runJavaCode(kode, langkah.input ?? '', (s) => setStatusJalan(s));
      if (res.timedOut) {
        salah(
          [{ jenis: 'hasil', teks: 'Program terlalu lama berjalan.', status: 'error', judul: 'Hasil kodemu' }],
          'Programnya tidak berhenti-henti. Biasanya ada perulangan yang syaratnya tidak pernah menjadi false.'
        );
        return;
      }
      if (res.exitCode !== 0) {
        const pesan = rapikanError(res.stderr || res.stdout);
        const saran = getErrorHint(pesan);
        salah(
          [{ jenis: 'hasil', teks: pesan, status: 'error', judul: 'Error' }],
          `Ada error. ${saran ? saran + ' ' : ''}Baca baris yang ditunjuk pesannya, lalu coba lagi.`
        );
        return;
      }
      if (!keluaranSama(res.stdout, langkah.keluaran)) {
        salah(
          [{ jenis: 'hasil', teks: rapikanKeluaran(res.stdout), status: 'salah', judul: 'Hasil kodemu' }],
          `Programnya jalan, tapi hasilnya belum sama dengan yang kita mau:\n\n${rapikanKeluaran(langkah.keluaran)}\n\n${langkah.petunjuk}`
        );
        return;
      }
      const kurang = cekWajib(kode, langkah.wajib);
      if (kurang) {
        salah(
          [{ jenis: 'hasil', teks: rapikanKeluaran(res.stdout), status: 'salah', judul: 'Hasil kodemu' }],
          `Hasilnya sudah benar, tapi ${kurang}`
        );
        return;
      }
      berhasil([{ jenis: 'hasil', teks: rapikanKeluaran(res.stdout), status: 'benar', judul: 'Hasil kodemu' }]);
    } catch (e) {
      setEntri((x) => [
        ...x,
        {
          jenis: 'lingga',
          teks: `Java belum bisa dijalankan (${e instanceof Error ? e.message : String(e)}). Periksa koneksi internet, lalu tekan Jalankan lagi.`,
        },
      ]);
    } finally {
      setSedangJalan(false);
      setStatusJalan('');
    }
  };

  const kembalikanKode = () => {
    setKode(kodeAwalLangkah(card, langkahKe));
    setResetEditor((n) => n + 1);
  };

  const lihatJawaban = () => {
    if (!langkah) return;
    setKode(langkah.jawaban);
    setResetEditor((n) => n + 1);
  };

  return (
    <div className="space-y-4">
      <h3 className="m-0 font-space font-bold text-lg">{card.judul}</h3>

      <div role="log" aria-live="polite" aria-label="Percakapan dengan Lingga dan hasil kode" className="space-y-3">
        {entri.map((e, i) =>
          e.jenis === 'lingga' ? (
            <GelembungLingga key={i} teks={e.teks} label={e.label} tantangan={e.tantangan} />
          ) : e.jenis === 'kode' ? (
            <BlokKode key={i} kode={e.kode} />
          ) : (
            <BlokHasil key={i} teks={e.teks} status={e.status} judul={e.judul} />
          )
        )}
        <div ref={akhirRef} />
      </div>

      {!selesai && langkah?.otomatis && (
        <div className="space-y-2">
          {hurufContoh !== null && (
            <div aria-hidden="true">
              <BlokKode kode={langkah.jawaban.slice(0, hurufContoh)} kursor />
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
            <p className="m-0 text-[13px] text-[#5a5a5a]">Lingga sedang mengetik. Perhatikan dulu ya.</p>
            <button
              type="button"
              onClick={lewatiContoh}
              className="shrink-0 text-[14px] font-bold underline bg-transparent border-none p-0 cursor-pointer"
            >
              Lewati
            </button>
          </div>
        </div>
      )}

      {!selesai && langkah && !langkah.otomatis && (
        <div className="space-y-2">
          <div className="brutal-border rounded-xl overflow-hidden bg-white" aria-label="Editor kode Java">
            <CodeEditor value={kode} onChange={setKode} language="java" resetKey={resetEditor} />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <button
              type="button"
              onClick={jalankan}
              disabled={sedangJalan}
              className="min-h-[44px] px-4 rounded-lg bg-[var(--color-primary)] border-2 border-[var(--color-text-main)] font-bold text-[14px] text-[var(--color-text-main)] shadow-[3px_3px_0_var(--color-text-main)] disabled:opacity-60"
            >
              {sedangJalan ? `${statusJalan || 'Menjalankan'}...` : '▶ Jalankan'}
            </button>
            {kode !== kodeAwalLangkah(card, langkahKe) && (
              <button
                type="button"
                onClick={kembalikanKode}
                className="text-[14px] font-bold underline bg-transparent border-none p-0 cursor-pointer"
              >
                Kembalikan kode awal
              </button>
            )}
            {salahDiLangkah >= 2 && (
              <button
                type="button"
                onClick={lihatJawaban}
                className="text-[14px] font-bold underline bg-transparent border-none p-0 cursor-pointer"
              >
                Lihat jawabannya
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
