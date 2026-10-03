import { useEffect, useMemo, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { EditorView } from '@codemirror/view';
import { ekstensiBahasa } from '../../lib/editorBahasa';
import { RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { HtmlPreviewCard } from '../../types/schema';
import { buildHtmlPreviewDocument } from '../../lib/htmlPreview';

export function HtmlPreviewCardComponent({ card }: { card: HtmlPreviewCard }) {
  const [html, setHtml] = useState(card.html);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    setHtml(card.html);
    setResetKey(k => k + 1);
  }, [card.html]);

  const document = useMemo(() => buildHtmlPreviewDocument(html), [html]);

  const handleReset = () => {
    setHtml(card.html);
    setResetKey(k => k + 1);
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="text-[16px] leading-[26px] lg:text-[18px] lg:leading-[30px] font-medium [&_p]:m-0">
        <ReactMarkdown>{card.prompt}</ReactMarkdown>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="overflow-hidden rounded-xl border-[3px] border-[var(--color-text-main)] bg-white min-w-0">
          <div className="flex min-h-11 items-center justify-between border-b-[3px] border-[var(--color-text-main)] bg-[var(--color-bg-base)] px-3">
            <span className="font-space text-[14px] font-bold tracking-wide">HTML</span>
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-bold hover:bg-white"
              title="Kembalikan HTML awal"
            >
              <RefreshCw size={14} strokeWidth={2.5} />
              Reset
            </button>
          </div>
          <CodeMirror
            key={resetKey}
            value={html}
            height="280px"
            theme="light"
            onChange={setHtml}
            extensions={[
              ...ekstensiBahasa('html'),
              EditorView.lineWrapping,
              EditorView.theme({ "&": { fontSize: "14px", lineHeight: "1.6", fontVariantLigatures: "none" } }),
              EditorView.contentAttributes.of({ spellcheck: "false", autocorrect: "off", autocapitalize: "off" })
            ]}
            basicSetup={{
              lineNumbers: true,
              foldGutter: false,
              highlightActiveLine: false,
              highlightActiveLineGutter: false,
            }}
          />
        </section>

        <section className="overflow-hidden rounded-xl border-[3px] border-[var(--color-text-main)] bg-white min-w-0">
          <div className="flex min-h-11 items-center border-b-[3px] border-[var(--color-text-main)] bg-[var(--color-bg-base)] px-3">
            <span className="font-space text-[14px] font-bold tracking-wide">HASIL</span>
          </div>
          <iframe
            title="Preview HTML"
            sandbox=""
            referrerPolicy="no-referrer"
            srcDoc={document}
            className="block h-[280px] w-full border-0 bg-white"
          />
        </section>
      </div>

      <p className="m-0 text-[13px] font-medium text-[#6a665e]">
        Edit HTML di kiri. Hasil berubah langsung di kanan. JavaScript dinonaktifkan di preview ini.
      </p>
    </div>
  );
}
