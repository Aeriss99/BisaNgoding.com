import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { HtmlPreviewCard } from '../../types/schema';
import { buildHtmlPreviewDocument } from '../../lib/htmlPreview';
import { buildPreviewDocument } from '../../lib/htmlCssPreview';
import { PratinjauTailwind, buildTailwindDocument } from '../../lib/tailwindPreview';
import { CodeEditor } from './CodeEditor';

const TINGGI = 300;
// Lebar layar tiruan untuk mencoba kelas responsif (sm:, md:, lg:) di HP.
const PILIHAN_LEBAR: { label: string; px: number | null }[] = [
  { label: 'Pas', px: null },
  { label: 'HP 375', px: 375 },
  { label: 'Tablet 768', px: 768 },
  { label: 'Laptop 1024', px: 1024 },
];

function TailwindResult({ html }: { html: string }) {
  const [dokumen, setDokumen] = useState('');
  const [lebar, setLebar] = useState<number | null>(null);
  const [wadah, setWadah] = useState(0);
  const wadahRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let batal = false;
    const t = setTimeout(() => {
      buildTailwindDocument(html).then((d) => { if (!batal) setDokumen(d); });
    }, 150);
    return () => { batal = true; clearTimeout(t); };
  }, [html]);

  useEffect(() => {
    const el = wadahRef.current;
    if (!el) return;
    setWadah(el.clientWidth);
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => setWadah(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const skala = lebar && wadah ? Math.min(1, wadah / lebar) : 1;
  return <section className="w-full min-w-0 brutal-border rounded-xl overflow-hidden bg-white">
    <div className="px-4 py-2 border-b-2 border-[var(--color-text-main)] bg-[var(--color-bg-base)] font-space font-bold text-sm flex flex-wrap items-center justify-between gap-2">
      <span>Hasil HTML + Tailwind</span>
      <span className="flex flex-wrap gap-1" role="group" aria-label="Lebar layar pratinjau">
        {PILIHAN_LEBAR.map((p) => (
          <button key={p.label} type="button" aria-pressed={lebar === p.px} onClick={() => setLebar(p.px)}
            className={`px-2 py-0.5 rounded border border-[var(--color-text-main)] text-xs ${lebar === p.px ? 'bg-[var(--color-text-main)] text-white' : 'bg-white'}`}>
            {p.label}
          </button>
        ))}
      </span>
    </div>
    <div ref={wadahRef} className="relative w-full overflow-hidden" style={{ height: TINGGI }}>
      {dokumen
        ? <iframe title="Preview HTML + Tailwind" sandbox="" referrerPolicy="no-referrer" srcDoc={dokumen}
            className="block border-0 bg-white"
            style={lebar
              ? { width: lebar, height: TINGGI / skala, transform: `scale(${skala})`, transformOrigin: 'top left' }
              : { width: '100%', height: TINGGI }} />
        : <p className="p-4 text-sm text-gray-600">Menyiapkan Tailwind...</p>}
    </div>
  </section>;
}

export function HtmlResult({ html, css, language = 'HTML' }: { html: string; css?: string; language?: string }) {
  const tailwind = useContext(PratinjauTailwind);
  const document = useMemo(
    () => tailwind ? '' : css === undefined ? buildHtmlPreviewDocument(html) : buildPreviewDocument(html, css),
    [html, css, tailwind]
  );
  if (tailwind && css === undefined) return <TailwindResult html={html} />;
  return <section className="w-full min-w-0 brutal-border rounded-xl overflow-hidden bg-white">
    <div className="px-4 py-2 border-b-2 border-[var(--color-text-main)] bg-[var(--color-bg-base)] font-space font-bold text-sm">Hasil {language}</div>
    <iframe title={`Preview ${language}`} sandbox="" referrerPolicy="no-referrer" srcDoc={document}
      className="block h-[300px] w-full border-0 bg-white" />
  </section>;
}

export function HtmlPreviewCardComponent({ card }: { card: HtmlPreviewCard }) {
  const [html, setHtml] = useState(card.html);
  const [resetKey, setResetKey] = useState(0);
  useEffect(() => { setHtml(card.html); setResetKey(k => k + 1); }, [card.html]);
  return <div className="flex flex-col space-y-6 w-full min-w-0">
    <div className="font-medium [&_p]:m-0"><ReactMarkdown>{card.prompt}</ReactMarkdown></div>
    <div className="flex justify-between items-center gap-3">
      <p className="font-bold text-gray-700 font-space text-xl">Kode Playground</p>
      {html !== card.html && <button type="button" onClick={() => { setHtml(card.html); setResetKey(k => k + 1); }}
        className="text-sm font-bold text-[var(--color-primary)] underline">Kembalikan Kode Awal</button>}
    </div>
    <div className="brutal-border rounded-xl overflow-hidden bg-white min-w-0">
      <CodeEditor value={html} onChange={setHtml} language="html" resetKey={resetKey} />
    </div>
    <HtmlResult html={html} />
    <p className="text-sm text-gray-600">Hasil diperbarui saat kamu mengetik.</p>
  </div>;
}
