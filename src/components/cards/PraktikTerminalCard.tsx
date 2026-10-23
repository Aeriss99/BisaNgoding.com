import { useEffect, useRef, useState } from 'react';
import type { PraktikTerminalCard } from '../../types/schema';
import {
  bacaVariabel,
  cekTantangan,
  cocokkanSalahSatu,
  contohPerintah,
  isiTemplate,
  pecahTeks,
  simpanVariabel,
  type HasilCocok,
} from '../../lib/praktikTerminal';

type Entri =
  | { jenis: 'lingga'; teks: string }
  | { jenis: 'terminal'; folder: string; perintah: string; keluaran: string };

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

function GelembungLingga({ teks }: { teks: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div
        aria-hidden="true"
        className="shrink-0 w-9 h-9 rounded-full bg-[var(--color-primary)] border-2 border-[var(--color-text-main)] flex items-center justify-center font-space font-bold text-[16px]"
      >
        L
      </div>
      <div className="min-w-0 flex-1 bg-white border-2 border-[var(--color-text-main)] rounded-xl rounded-tl-sm px-3.5 py-2.5 shadow-[3px_3px_0_var(--color-text-main)] text-[15px] leading-[1.55] whitespace-pre-line">
        <span className="sr-only">Lingga: </span>
        <Teks teks={teks} />
      </div>
    </div>
  );
}

function BlokTerminal({ folder, perintah, keluaran }: { folder: string; perintah: string; keluaran: string }) {
  return (
    <pre className="m-0 px-4 py-3 bg-[#1d1d1b] text-[#f5f1e6] rounded-[10px] font-mono text-[13px] leading-[20px] whitespace-pre-wrap [overflow-wrap:anywhere]">
      <span className="text-[#7ee2a8]">{folder} $</span> {perintah}
      {keluaran ? `\n${keluaran}` : ''}
    </pre>
  );
}

export function PraktikTerminalCardComponent({
  card,
  onSuccess,
}: {
  card: PraktikTerminalCard;
  onSuccess: (attempts: number) => void;
}) {
  const bawaan = card.bawaan ?? {};
  const [langkahKe, setLangkahKe] = useState(0);
  const [entri, setEntri] = useState<Entri[]>([]);
  const [ketikan, setKetikan] = useState('');
  const [folder, setFolder] = useState(card.folder);
  const [salahDiLangkah, setSalahDiLangkah] = useState(0);
  const [salahTotal, setSalahTotal] = useState(0);
  const [selesai, setSelesai] = useState(false);
  const [nilai, setNilai] = useState<Record<string, string>>({});
  const [tempelan, setTempelan] = useState('');
  const [hasilTantangan, setHasilTantangan] = useState<'belum' | 'benar' | 'salah'>('belum');
  const inputRef = useRef<HTMLInputElement>(null);
  const akhirRef = useRef<HTMLDivElement>(null);
  const sudahBerinteraksi = useRef(false);

  // Kartu baru = mulai dari awal.
  useEffect(() => {
    const v = bacaVariabel();
    setNilai(v);
    setLangkahKe(0);
    setFolder(card.folder);
    setSalahDiLangkah(0);
    setSalahTotal(0);
    setSelesai(false);
    setTempelan('');
    setHasilTantangan('belum');
    sudahBerinteraksi.current = false;
    const awal: Entri[] = [{ jenis: 'lingga', teks: isiTemplate(card.pembuka, v, card.bawaan) }];
    if (card.langkah[0]) awal.push({ jenis: 'lingga', teks: isiTemplate(card.langkah[0].arahan, v, card.bawaan) });
    setEntri(awal);
    const pertama = card.langkah[0];
    setKetikan(pertama?.otomatis ? contohPerintah(pertama.terima[0] ?? '', v, card.bawaan) : '');
  }, [card]);

  useEffect(() => {
    if (sudahBerinteraksi.current) akhirRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [entri]);

  const langkah = card.langkah[langkahKe];

  const jalankan = () => {
    if (selesai || !langkah) return;
    const teks = ketikan.trim();
    if (!teks) return;
    sudahBerinteraksi.current = true;

    const hasil: HasilCocok = langkah.otomatis ? { cocok: true, isian: {} } : cocokkanSalahSatu(langkah.terima, teks);
    if (hasil.cocok) {
      const v = Object.keys(hasil.isian).length > 0 ? simpanVariabel(hasil.isian) : nilai;
      if (v !== nilai) setNilai(v);
      const baru: Entri[] = [
        { jenis: 'terminal', folder, perintah: teks, keluaran: isiTemplate(langkah.keluaran, v, bawaan) },
      ];
      if (langkah.benar) baru.push({ jenis: 'lingga', teks: isiTemplate(langkah.benar, v, bawaan) });
      if (langkah.folderBaru) setFolder(langkah.folderBaru);
      const berikut = card.langkah[langkahKe + 1];
      if (berikut) {
        baru.push({ jenis: 'lingga', teks: isiTemplate(berikut.arahan, v, bawaan) });
        setLangkahKe(langkahKe + 1);
        setSalahDiLangkah(0);
        setKetikan(berikut.otomatis ? contohPerintah(berikut.terima[0] ?? '', v, bawaan) : '');
      } else {
        baru.push({ jenis: 'lingga', teks: isiTemplate(card.penutup, v, bawaan) });
        setSelesai(true);
        setKetikan('');
        onSuccess(salahTotal === 0 ? 1 : salahTotal + 1);
      }
      setEntri((e) => [...e, ...baru]);
      return;
    }

    const jumlahSalah = salahDiLangkah + 1;
    setSalahDiLangkah(jumlahSalah);
    setSalahTotal((n) => n + 1);
    const tambahan = jumlahSalah >= 2 ? '\n\nKalau buntu, tekan **Lihat jawabannya**.' : '';
    const dikenal = (langkah.salah ?? [])
      .map((s) => ({ s, h: cocokkanSalahSatu(s.terima, teks) }))
      .find((x) => x.h.cocok);
    if (dikenal) {
      // Isian dari ketikan yang salah hanya dipakai untuk menampilkan pesan, tidak disimpan.
      const v = { ...nilai, ...dikenal.h.isian };
      const baru: Entri[] = [];
      if (dikenal.s.keluaran !== undefined) {
        baru.push({ jenis: 'terminal', folder, perintah: teks, keluaran: isiTemplate(dikenal.s.keluaran, v, bawaan) });
      }
      baru.push({ jenis: 'lingga', teks: isiTemplate(dikenal.s.reaksi, v, bawaan) + tambahan });
      setEntri((e) => [...e, ...baru]);
    } else {
      setEntri((e) => [
        ...e,
        {
          jenis: 'lingga',
          teks: `Hmm, \`${teks}\` belum yang kita perlukan di langkah ini. ${isiTemplate(langkah.petunjuk, nilai, bawaan)}${tambahan}`,
        },
      ]);
    }
    setKetikan('');
    inputRef.current?.focus();
  };

  const lihatJawaban = () => {
    if (!langkah) return;
    setKetikan(contohPerintah(langkah.terima[0] ?? '', nilai, bawaan));
    inputRef.current?.focus();
  };

  const cek = () => {
    if (!card.tantangan) return;
    setHasilTantangan(cekTantangan(tempelan, card.tantangan.pola) ? 'benar' : 'salah');
  };

  return (
    <div className="space-y-4">
      <h3 className="m-0 font-space font-bold text-lg">{card.judul}</h3>

      <div role="log" aria-live="polite" aria-label="Percakapan dengan Lingga dan isi terminal" className="space-y-3">
        {entri.map((e, i) =>
          e.jenis === 'lingga' ? (
            <GelembungLingga key={i} teks={e.teks} />
          ) : (
            <BlokTerminal key={i} folder={e.folder} perintah={e.perintah} keluaran={e.keluaran} />
          )
        )}
        <div ref={akhirRef} />
      </div>

      {!selesai && langkah && (
        <div className="space-y-2">
          <form
            onSubmit={(ev) => {
              ev.preventDefault();
              jalankan();
            }}
            className="flex items-center gap-2 bg-[#1d1d1b] rounded-[10px] pl-4 pr-2 py-2 border-2 border-[var(--color-text-main)]"
          >
            <label htmlFor="ketik-perintah" className="shrink-0 font-mono text-[13px] text-[#7ee2a8]">
              {folder} $<span className="sr-only"> Ketik perintah</span>
            </label>
            <input
              id="ketik-perintah"
              ref={inputRef}
              type="text"
              value={ketikan}
              onChange={(ev) => setKetikan(ev.target.value)}
              readOnly={langkah.otomatis}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              enterKeyHint="send"
              placeholder={langkah.otomatis ? '' : 'ketik di sini'}
              className="min-w-0 flex-1 bg-transparent text-[#f5f1e6] font-mono text-[14px] leading-6 py-1.5 outline-none placeholder:text-[#8f8a7e]"
            />
            <button
              type="submit"
              className="shrink-0 min-h-[40px] px-3 rounded-lg bg-[var(--color-primary)] border-2 border-[var(--color-text-main)] font-bold text-[14px] text-[var(--color-text-main)]"
            >
              Jalankan
            </button>
          </form>
          {langkah.otomatis ? (
            <p className="m-0 text-[13px] text-[#5a5a5a]">Lingga sudah mengetik perintahnya. Tekan Jalankan.</p>
          ) : salahDiLangkah >= 2 ? (
            <button
              type="button"
              onClick={lihatJawaban}
              className="text-[14px] font-bold underline bg-transparent border-none p-0 cursor-pointer"
            >
              Lihat jawabannya
            </button>
          ) : null}
        </div>
      )}

      {selesai && card.tantangan && (
        <section
          aria-labelledby="judul-tantangan"
          className="border-2 border-dashed border-[var(--color-text-main)] rounded-xl p-4 space-y-3 bg-[var(--color-primary-light)]"
        >
          <h4 id="judul-tantangan" className="m-0 font-space font-bold text-[16px]">
            Tantangan di laptopmu (boleh dilewati)
          </h4>
          <p className="m-0 text-[15px] leading-[1.55] whitespace-pre-line">
            <Teks teks={isiTemplate(card.tantangan.tugas, nilai, bawaan)} />
          </p>
          <p className="m-0 text-[14px]">
            Lalu jalankan <code className="font-mono bg-white border border-[#d9d2c3] rounded px-1">{card.tantangan.perintah}</code> dan tempel hasilnya di bawah.
          </p>
          <label htmlFor="tempel-hasil" className="sr-only">
            Tempel hasil dari terminalmu
          </label>
          <textarea
            id="tempel-hasil"
            value={tempelan}
            onChange={(ev) => {
              setTempelan(ev.target.value);
              setHasilTantangan('belum');
            }}
            rows={4}
            spellCheck={false}
            placeholder="Tempel hasil dari terminalmu di sini"
            className="w-full box-border font-mono text-[13px] p-3 border-2 border-[var(--color-text-main)] rounded-lg bg-white"
          />
          <button
            type="button"
            onClick={cek}
            className="min-h-[44px] px-4 rounded-lg bg-white border-2 border-[var(--color-text-main)] font-bold text-[14px] shadow-[3px_3px_0_var(--color-text-main)]"
          >
            Cek hasilku
          </button>
          {hasilTantangan === 'benar' && (
            <p role="status" className="m-0 font-bold text-[var(--color-success)]">
              {card.tantangan.berhasil}
            </p>
          )}
          {hasilTantangan === 'salah' && (
            <p role="status" className="m-0 font-bold text-[var(--color-danger)]">
              Belum cocok. Pastikan kamu menempel seluruh hasil perintahnya, lalu coba lagi.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
