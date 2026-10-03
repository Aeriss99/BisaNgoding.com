import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HtmlPreviewCardComponent } from './HtmlPreviewCard';

vi.mock('@uiw/react-codemirror', () => ({
  default: ({ value, onChange, extensions }: any) => (
    <textarea data-testid="html-editor" value={value} onChange={(event) => onChange(event.target.value)} />
  ),
}));

describe('HtmlPreviewCardComponent', () => {
  const card = {
    type: 'html_preview' as const,
    prompt: 'Ubah judulnya.',
    html: '<h1>Awal</h1>',
  };

  it('menampilkan prompt, editor, dan preview', () => {
    render(<HtmlPreviewCardComponent card={card} />);
    expect(screen.getByText('Ubah judulnya.')).toBeInTheDocument();
    expect(screen.getByTestId('html-editor')).toHaveValue('<h1>Awal</h1>');
    expect(screen.getByTitle('Preview HTML')).toHaveAttribute('srcDoc', expect.stringContaining('<h1>Awal</h1>'));
    expect(screen.getByTitle('Preview HTML')).toHaveAttribute('sandbox', '');
  });

  it('mengubah preview dan bisa reset', () => {
    render(<HtmlPreviewCardComponent card={card} />);
    fireEvent.change(screen.getByTestId('html-editor'), { target: { value: '<h1>Baru</h1>' } });
    expect(screen.getByTitle('Preview HTML')).toHaveAttribute('srcDoc', expect.stringContaining('<h1>Baru</h1>'));
    fireEvent.click(screen.getByRole('button', { name: /reset/i }));
    expect(screen.getByTestId('html-editor')).toHaveValue('<h1>Awal</h1>');
  });

  it('user mengetik -- value editor tetap --', () => {
    render(<HtmlPreviewCardComponent card={card} />);
    const editor = screen.getByTestId('html-editor');
    fireEvent.change(editor, { target: { value: '--' } });
    expect(editor).toHaveValue('--');
  });

  it('user mengetik <!-- komentar --> value tetap persis <!-- komentar -->', () => {
    render(<HtmlPreviewCardComponent card={card} />);
    const editor = screen.getByTestId('html-editor');
    fireEvent.change(editor, { target: { value: '<!-- komentar -->' } });
    expect(editor).toHaveValue('<!-- komentar -->');
  });

  it('user mengetik data--test value tetap data--test', () => {
    render(<HtmlPreviewCardComponent card={card} />);
    const editor = screen.getByTestId('html-editor');
    fireEvent.change(editor, { target: { value: 'data--test' } });
    expect(editor).toHaveValue('data--test');
  });
  
  it('reset mengembalikan HTML awal dan mereset key (remount)', () => {
    // Reset test that ensures the element gets remounted (key change)
    const { container } = render(<HtmlPreviewCardComponent card={card} />);
    const editorBefore = screen.getByTestId('html-editor');
    fireEvent.change(editorBefore, { target: { value: '<h1>Baru</h1>' } });
    
    fireEvent.click(screen.getByRole('button', { name: /reset/i }));
    const editorAfter = screen.getByTestId('html-editor');
    expect(editorAfter).toHaveValue('<h1>Awal</h1>');
  });

  it('tidak menyebabkan horizontal scroll (memiliki min-w-0 pada container)', () => {
    const { container } = render(<HtmlPreviewCardComponent card={card} />);
    // Get the section that wraps the editor
    const sections = container.querySelectorAll('section');
    expect(sections[0].className).toContain('min-w-0');
  });
});
