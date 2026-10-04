import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { HtmlPreviewCard } from '../../types/schema';
import { buildHtmlPreviewDocument } from '../../lib/htmlPreview';
import { CodeEditor } from './CodeEditor';

export function HtmlResult({ html, language = 'HTML' }: { html: string; language?: string }) {
  const document = useMemo(() => buildHtmlPreviewDocument(html), [html]);
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
