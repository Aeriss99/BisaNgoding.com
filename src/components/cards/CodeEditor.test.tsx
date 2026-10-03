import { render, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EditorView } from '@codemirror/view';
import { CodeEditor } from './CodeEditor';
import { useState } from 'react';

function Harness({ language }: { language: string }) {
  const [value, setValue] = useState('');
  return <CodeEditor value={value} onChange={setValue} language={language} />;
}
for (const language of ['html', 'java', 'javascript']) {
  describe(`${language} real CodeMirror input`, () => {
    it('retains consecutive hyphens and HTML comments through controlled rerenders', async () => {
      const { container } = render(<Harness language={language} />);
      await waitFor(() => expect(container.querySelector('.cm-content')).not.toBeNull());
      const content = container.querySelector('.cm-content')!;
      const view = EditorView.findFromDOM(content as HTMLElement)!;
      for (const text of ['--', '<!-- komentar -->', 'data--test']) {
        view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: '' } });
        for (const char of text) {
          view.dispatch({ changes: { from: view.state.doc.length, insert: char } });
          await waitFor(() => expect(view.state.doc.toString()).toContain(char));
        }
        await waitFor(() => expect(view.state.doc.toString()).toBe(text));
      }
      expect(content).toHaveClass('cm-lineWrapping');
      expect(content).toHaveAttribute('autocorrect', 'off');
    });
  });
}
