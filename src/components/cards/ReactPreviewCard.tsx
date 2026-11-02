import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { ReactPreviewCard } from '../../types/schema';
import { bacaPesan, buatDokumenReact, muatRuntime, ubahJsx, type PesanKonsol } from '../../lib/reactPreview';
import { CodeEditor } from './CodeEditor';

const TINGGI = 320;
const WARNA: Record<PesanKonsol['jenis'], string> = {
  log: 'text-[var(--color-text-main)]',
  warn: 'text-[#7d4e00] bg-[#fff8c5]',
  error: 'text-[#82071e] bg-[#ffebe9]',
};

/** Hasil kode React: dijalankan di iframe sandbox, console.log dan peringatan React tampil di bawahnya. */
export function ReactResult({ kode, css }: { kode: string; css?: string }) {
  const [dokumen, setDokumen] = useState('');
  const [galat, setGalat] = useState('');
  const [putaran, setPutaran] = useState(0);
  const [konsol, setKonsol] = useState<PesanKonsol[]>([]);
  const [adaSimpanan, setAdaSimpanan] = useState(false);
  const simpanan = useRef<Record<string, string>>({});
  const segera = useRef(false);
  const frame = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    let batal = false;
    const jeda = segera.current ? 0 : 400;
    segera.current = false;
    const t = setTimeout(async () => {
      try {
        const [hasil, runtime] = await Promise.all([ubahJsx(kode), muatRuntime()]);
        if (batal) return;
        if (!hasil.ok) { setGalat(hasil.galat); return; }
        setGalat('');
        setKonsol([]);
        setDokumen(buatDokumenReact(hasil.js, runtime, css, simpanan.current));
      } catch {
        if (!batal) setGalat('Pratinjau React belum bisa dimuat. Periksa koneksi internet lalu muat ulang halaman.');
      }
    }, jeda);
    return () => { batal = true; clearTimeout(t); };
  }, [kode, css, putaran]);

  useEffect(() => {
    const dengar = (e: MessageEvent) => {
      if (!frame.current || e.source !== frame.current.contentWindow) return;
      const d = bacaPesan(e.data);
      if (!d) return;
      if (d.jenis === 'simpan') {
        simpanan.current = d.data;
        setAdaSimpanan(Object.keys(d.data).length > 0);
        return;
      }
      setKonsol((k) => [...k, d].slice(-50));
    };
    window.addEventListener('message', dengar);
    return () => window.removeEventListener('message', dengar);
  }, []);

  return <div className="flex flex-col gap-3 w-full min-w-0">
    <section className="w-full min-w-0 brutal-border rounded-xl overflow-hidden bg-white">
      <div className="px-4 py-2 border-b-2 border-[var(--color-text-main)] bg-[var(--color-bg-base)] font-space font-bold text-sm flex items-center justify-between gap-2">
        <span className="whitespace-nowrap">Hasil React</span>
        <span className="flex flex-wrap gap-1 justify-end">
          {adaSimpanan && (
            <button type="button" onClick={() => { simpanan.current = {}; setAdaSimpanan(false); segera.current = true; setPutaran((n) => n + 1); }}
              className="px-2 py-0.5 rounded border border-[var(--color-text-main)] bg-white text-xs">
              Hapus localStorage
            </button>
          )}
          <button type="button" onClick={() => { segera.current = true; setPutaran((n) => n + 1); }}
            className="px-2 py-0.5 rounded border border-[var(--color-text-main)] bg-white text-xs">
            Jalankan ulang
          </button>
        </span>
      </div>
      {galat
        ? <pre role="alert" className="m-0 p-4 whitespace-pre-wrap break-words font-mono text-[13px] text-[#82071e] bg-[#ffebe9]" style={{ minHeight: 120 }}>{galat}</pre>
        : dokumen
          ? <iframe key={putaran} ref={frame} title="Preview React" sandbox="allow-scripts allow-forms" referrerPolicy="no-referrer"
              srcDoc={dokumen} className="block w-full border-0 bg-white" style={{ height: TINGGI }} />
          : <p className="m-0 p-4 text-sm text-gray-600" style={{ minHeight: 120 }}>Menyiapkan React...</p>}
    </section>
    {konsol.length > 0 && (
      <section aria-label="Konsol" className="w-full min-w-0 brutal-border rounded-xl overflow-hidden bg-white">
        <div className="px-4 py-2 border-b-2 border-[var(--color-text-main)] bg-[var(--color-bg-base)] font-space font-bold text-sm">
          Konsol ({konsol.length})
        </div>
        <ol aria-live="polite" className="m-0 p-0 list-none max-h-[180px] overflow-y-auto font-mono text-[13px]">
          {konsol.map((k, i) => (
            <li key={i} className={`px-4 py-1 border-b border-[#e5e5e5] whitespace-pre-wrap break-words ${WARNA[k.jenis] ?? ''}`}>{k.teks}</li>
          ))}
        </ol>
      </section>
    )}
  </div>;
}

export function ReactPreviewCardComponent({ card }: { card: ReactPreviewCard }) {
  const [kode, setKode] = useState(card.code);
  const [resetKey, setResetKey] = useState(0);
  useEffect(() => { setKode(card.code); setResetKey((k) => k + 1); }, [card.code]);
  return <div className="flex flex-col space-y-6 w-full min-w-0">
    <div className="font-medium [&_p]:m-0 [&_code]:font-mono [&_code]:bg-[var(--color-primary-light)] [&_code]:px-1 [&_code]:rounded">
      <ReactMarkdown>{card.prompt}</ReactMarkdown>
    </div>
    <div className="flex justify-between items-center gap-3">
      <p className="font-bold text-gray-700 font-space text-xl">App.jsx</p>
      {kode !== card.code && <button type="button" onClick={() => { setKode(card.code); setResetKey((k) => k + 1); }}
        className="text-sm font-bold text-[var(--color-primary)] underline">Kembalikan Kode Awal</button>}
    </div>
    <div className="brutal-border rounded-xl overflow-hidden bg-white min-w-0">
      <CodeEditor value={kode} onChange={setKode} language="jsx" resetKey={resetKey} />
    </div>
    <ReactResult kode={kode} css={card.css} />
    <p className="text-sm text-gray-600">Hasil diperbarui saat kamu mengetik. Tekan <b>Jalankan ulang</b> untuk mengulang dari awal.</p>
  </div>;
}
