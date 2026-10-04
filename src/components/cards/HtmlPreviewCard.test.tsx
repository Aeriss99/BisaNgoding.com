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
  it('checks CSS with its fixed HTML, shows feedback and unlocks without invoking a code runner', () => {
    const onSuccess = vi.fn();
    render(<CodeChallengeCardComponent language="css" onSuccess={onSuccess} card={{
      type: 'code_challenge', prompt: 'Warnai kartu', html: '<article class="box">CSS</article>',
      starterCode: '/* mulai */', hints: ['Gunakan color'], tests: [],
      cssChecks: [{ selector: '.box', property: 'color', value: 'navy' }],
    }} />);
    expect(screen.getByText('HTML yang diberi gaya')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Kode'), { target: { value: '.box { color: red; }' } });
    fireEvent.click(screen.getByText('Cek Jawaban'));
    expect(screen.getByText('.box perlu color: navy;')).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Kode'), { target: { value: '.box { color: navy; }' } });
    const preview = screen.getByTitle('Preview HTML dan CSS');
    expect(preview).toHaveAttribute('srcdoc', expect.stringContaining('.box { color: navy; }'));
    expect(preview).toHaveAttribute('srcdoc', expect.stringContaining('<article class="box">CSS</article>'));
    expect(preview.getAttribute('srcdoc')).not.toContain('img { max-width: 100%');
    expect(screen.getByTitle('Preview HTML dan CSS')).toHaveAttribute('sandbox', '');
    fireEvent.click(screen.getByText('Cek Jawaban'));
    expect(onSuccess).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText('Kembalikan Kode Awal'));
    expect(screen.getByLabelText('Kode')).toHaveValue('/* mulai */');
    expect(screen.getByText('Berhasil!')).toBeDisabled();
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(runJavaCode).not.toHaveBeenCalled();
    expect(runJsCode).not.toHaveBeenCalled();
  });
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
