import { useState, useEffect } from 'react';
import type { HtmlCssPreviewCard } from '../../types/schema';
import { CodeEditor } from './CodeEditor';
import { RefreshCw } from 'lucide-react';
import { HtmlResult } from './HtmlPreviewCard';
import ReactMarkdown from 'react-markdown';

export function HtmlCssPreviewCardComponent({ card }: { card: HtmlCssPreviewCard }) {
  const [htmlCode, setHtmlCode] = useState(card.html);
  const [cssCode, setCssCode] = useState(card.css);
  const [activeTab, setActiveTab] = useState<'html' | 'css'>(card.initialTab ?? 'html');

  const [resetKey, setResetKey] = useState(0);

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

  const handleReset = () => {
    setHtmlCode(card.html);
    setCssCode(card.css);
    setDebouncedHtml(card.html);
    setDebouncedCss(card.css);
    setResetKey(key => key + 1);
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-full">
      {card.prompt && (
        <div className="text-[16px] leading-[26px] lg:text-[18px] lg:leading-[30px] font-medium text-[var(--color-text-main)] [&_p]:m-0">
          <ReactMarkdown>{card.prompt}</ReactMarkdown>
        </div>
      )}

      <div className="flex justify-between items-center gap-3">
        <p className="font-bold text-gray-700 font-space text-xl">Kode Playground</p>
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1.5 text-sm font-bold text-[var(--color-primary)] underline"
        >
          <RefreshCw size={14} strokeWidth={2.5} />
          Kembalikan Kode Awal
        </button>
      </div>

      <div className="brutal-border rounded-xl overflow-hidden bg-white min-w-0">
        <div className="flex border-b-2 border-[var(--color-text-main)] bg-[var(--color-bg-base)] px-2">
          <div className="flex">
            <button
              type="button"
              onClick={() => setActiveTab('html')}
              aria-pressed={activeTab === 'html'}
              className={`px-4 py-3 font-bold text-[14px] lg:text-[16px] font-space cursor-pointer transition-colors ${
                activeTab === 'html'
                  ? 'text-[var(--color-text-main)] border-b-[3px] border-[var(--color-primary)]'
                  : 'text-gray-500 border-b-[3px] border-transparent hover:text-[var(--color-text-main)]'
              }`}
            >
              HTML
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('css')}
              aria-pressed={activeTab === 'css'}
              className={`px-4 py-3 font-bold text-[14px] lg:text-[16px] font-space cursor-pointer transition-colors ${
                activeTab === 'css'
                  ? 'text-[var(--color-text-main)] border-b-[3px] border-[var(--color-primary)]'
                  : 'text-gray-500 border-b-[3px] border-transparent hover:text-[var(--color-text-main)]'
              }`}
            >
              CSS
            </button>
          </div>
        </div>

        <div className="min-w-0">
          <CodeEditor key={activeTab} value={activeTab === 'html' ? htmlCode : cssCode}
            onChange={activeTab === 'html' ? setHtmlCode : setCssCode}
            language={activeTab} resetKey={resetKey} />
        </div>
      </div>

      <HtmlResult html={debouncedHtml} css={debouncedCss} language="HTML dan CSS" />
      <p className="text-sm text-gray-600">Hasil diperbarui saat kamu mengetik.</p>
    </div>
  );
}
