import { useMemo, useRef, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { EditorView } from '@codemirror/view';
import { ekstensiBahasa } from '../../lib/editorBahasa';

/** One editor configuration for playgrounds and challenges in every supported language. */
export function CodeEditor({ value, onChange, language, resetKey = 0 }: {
  value: string;
  onChange: (value: string) => void;
  language: string;
  resetKey?: number;
}) {
  const view = useRef<EditorView | null>(null);
  const extensions = useMemo(() => [
    ...ekstensiBahasa(language),
    EditorView.lineWrapping,
    EditorView.theme({ '&': { fontSize: '14px', lineHeight: '1.6', fontVariantLigatures: 'none' } }),
    EditorView.contentAttributes.of({ spellcheck: 'false', autocorrect: 'off', autocapitalize: 'off' }),
    EditorView.domEventHandlers({
      beforeinput(e, view) {
        if (e.data === '—' || e.data === '–') {
          e.preventDefault();
          const { from, to } = view.state.selection.main;
          view.dispatch({
            changes: { from, to, insert: '--' },
            selection: { anchor: from + 2 }
          });
          return true;
        }
        return false;
      }
    }),
  ], [language]);
  useEffect(() => {
    if (view.current) {
      view.current.scrollDOM.scrollLeft = 0;
      view.current.scrollDOM.scrollTop = 0;
    }
  }, [resetKey]);
  return <CodeMirror value={value} onChange={onChange} extensions={extensions}
    theme="light" basicSetup={{ lineNumbers: true }} minHeight="240px" maxHeight="70vh"
    onCreateEditor={(editor) => { view.current = editor; }} />;
}
