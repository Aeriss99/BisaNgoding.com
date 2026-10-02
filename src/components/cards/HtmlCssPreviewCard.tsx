import { useState, useMemo, useEffect } from 'react';
import type { HtmlCssPreviewCard } from '../../types/schema';
import CodeMirror from '@uiw/react-codemirror';
import { ekstensiBahasa } from '../../lib/editorBahasa';
import { EditorView } from '@codemirror/view';
import { RefreshCw } from 'lucide-react';
import { buildPreviewDocument } from '../../lib/htmlCssPreview';
import ReactMarkdown from 'react-markdown';

export function HtmlCssPreviewCardComponent({ card }: { card: HtmlCssPreviewCard }) {
  const [htmlCode, setHtmlCode] = useState(card.html);
  const [cssCode, setCssCode] = useState(card.css);
  const [activeTab, setActiveTab] = useState<'html' | 'css'>('html');

  // Debounce changes slightly to keep typing smooth
  const [debouncedHtml, setDebouncedHtml] = useState(htmlCode);
  const [debouncedCss, setDebouncedCss] = useState(cssCode);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedHtml(htmlCode);
      setDebouncedCss(cssCode);
    }, 200);
    return () => clearTimeout(handler);
  }, [htmlCode, cssCode]);

  const previewDocument = useMemo(() => {
    return buildPreviewDocument(debouncedHtml, debouncedCss);
  }, [debouncedHtml, debouncedCss]);

  const handleReset = () => {
    setHtmlCode(card.html);
    setCssCode(card.css);
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-full">
      {card.prompt && (
        <div className="text-[16px] leading-[26px] lg:text-[18px] lg:leading-[30px] font-medium text-[var(--color-text-main)] [&_p]:m-0">
          <ReactMarkdown>{card.prompt}</ReactMarkdown>
        </div>
      )}

      <div className="flex flex-col border-[3px] border-[var(--color-text-main)] rounded-xl overflow-hidden bg-[var(--color-bg-base)] w-full">
        <div className="flex items-center justify-between border-b-[3px] border-[var(--color-text-main)] bg-white px-2">
          <div className="flex">
            <button
              onClick={() => setActiveTab('html')}
              className={`px-4 py-3 font-bold text-[14px] lg:text-[16px] font-space cursor-pointer transition-colors ${
                activeTab === 'html'
                  ? 'text-[var(--color-text-main)] border-b-[3px] border-[var(--color-primary)]'
                  : 'text-gray-500 border-b-[3px] border-transparent hover:text-[var(--color-text-main)]'
              }`}
            >
              HTML
            </button>
            <button
              onClick={() => setActiveTab('css')}
              className={`px-4 py-3 font-bold text-[14px] lg:text-[16px] font-space cursor-pointer transition-colors ${
                activeTab === 'css'
                  ? 'text-[var(--color-text-main)] border-b-[3px] border-[var(--color-primary)]'
                  : 'text-gray-500 border-b-[3px] border-transparent hover:text-[var(--color-text-main)]'
              }`}
            >
              CSS
            </button>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 mr-1 text-[13px] font-bold text-[#5a5a5a] hover:text-[var(--color-text-main)] hover:bg-gray-100 rounded-lg transition-colors"
            title="Kembalikan kode awal"
          >
            <RefreshCw size={14} strokeWidth={2.5} />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>

        <div className="bg-white min-h-[150px] max-h-[300px] overflow-auto">
          {activeTab === 'html' ? (
            <CodeMirror
              value={htmlCode}
              extensions={[
                ...ekstensiBahasa('html'),
                EditorView.lineWrapping,
                EditorView.theme({ '&': { fontSize: '14px', lineHeight: '1.6' } }),
                EditorView.contentAttributes.of({ spellcheck: 'false', autocorrect: 'off', autocapitalize: 'off' }),
              ]}
              theme="light"
              onChange={(val) => setHtmlCode(val)}
              basicSetup={{ lineNumbers: true }}
            />
          ) : (
            <CodeMirror
              value={cssCode}
              extensions={[
                ...ekstensiBahasa('css'),
                EditorView.lineWrapping,
                EditorView.theme({ '&': { fontSize: '14px', lineHeight: '1.6' } }),
                EditorView.contentAttributes.of({ spellcheck: 'false', autocorrect: 'off', autocapitalize: 'off' }),
              ]}
              theme="light"
              onChange={(val) => setCssCode(val)}
              basicSetup={{ lineNumbers: true }}
            />
          )}
        </div>
      </div>

      <div className="flex flex-col border-[3px] border-[var(--color-text-main)] rounded-xl overflow-hidden bg-white w-full">
        <div className="px-4 py-2 border-b-[3px] border-[var(--color-text-main)] bg-[var(--color-bg-base)]">
          <span className="font-space font-bold text-[14px]">Preview</span>
        </div>
        <div className="w-full bg-white relative" style={{ minHeight: '200px' }}>
          <iframe
            title="Preview HTML dan CSS"
            sandbox=""
            referrerPolicy="no-referrer"
            srcDoc={previewDocument}
            className="w-full h-[300px] block border-none bg-white"
          />
        </div>
      </div>
    </div>
  );
}
