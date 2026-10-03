import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HtmlPreviewCardComponent } from './HtmlPreviewCard';
import { CodeChallengeCardComponent } from './InteractiveCards';
import { runJavaCode } from '../../lib/javaRunner';
import { runJsCode } from '../../lib/jsRunner';
vi.mock('../../lib/javaRunner', () => ({ runJavaCode: vi.fn() }));
vi.mock('../../lib/jsRunner', () => ({ runJsCode: vi.fn() }));
vi.mock('./CodeEditor', () => ({ CodeEditor: ({ value, onChange }: any) => <textarea aria-label="Kode" value={value} onChange={e => onChange(e.target.value)} /> }));

describe('HTML cards in the shared learning flow', () => {
  it('updates preview and resets exact starter code without enabling scripts', () => {
    const starter = '<h1>Halo</h1>\n<!-- komentar -->';
    render(<HtmlPreviewCardComponent card={{ type: 'html_preview', prompt: 'Coba HTML', html: starter }} />);
    expect(screen.getByText('Kode Playground')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Kode'), { target: { value: '<p>data--test</p>' } });
    expect(screen.getByTitle('Preview HTML')).toHaveAttribute('srcdoc', expect.stringContaining('<p>data--test</p>'));
    expect(screen.getByTitle('Preview HTML')).toHaveAttribute('sandbox', '');
    fireEvent.click(screen.getByText('Kembalikan Kode Awal'));
    expect(screen.getByLabelText('Kode')).toHaveValue(starter);
    expect(screen.getByTitle('Preview HTML')).toHaveAttribute('srcdoc', expect.stringContaining(starter));
  });
  it('checks HTML, shows failure, then unlocks success exactly once without invoking Java/JS', () => {
    const onSuccess = vi.fn();
    render(<CodeChallengeCardComponent language="html" onSuccess={onSuccess} card={{
      type: 'code_challenge', prompt: 'Buat heading', starterCode: '<!-- tulis -->', hints: ['Gunakan h1'], tests: [],
      htmlChecks: [{ selector: 'h1', count: 1, message: 'Tambahkan satu h1.' }],
    }} />);
    fireEvent.change(screen.getByLabelText('Kode'), { target: { value: '<p>Halo</p>' } });
    fireEvent.click(screen.getByText('Cek Jawaban'));
    expect(screen.getByText('Tambahkan satu h1.')).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Kode'), { target: { value: '<h1>Halo</h1><!-- -- -->' } });
    fireEvent.click(screen.getByText('Cek Jawaban'));
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Berhasil!')).toBeDisabled();
    expect(runJavaCode).not.toHaveBeenCalled();
    expect(runJsCode).not.toHaveBeenCalled();
  });
});
