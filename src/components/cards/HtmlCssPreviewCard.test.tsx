import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HtmlCssPreviewCardComponent } from './HtmlCssPreviewCard';
import type { HtmlCssPreviewCard } from '../../types/schema';

// Mock CodeMirror to make tests simpler
vi.mock('@uiw/react-codemirror', () => {
  return {
    default: ({ value, onChange }: any) => (
      <textarea 
        data-testid="mock-codemirror" 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
      />
    )
  };
});

describe('HtmlCssPreviewCardComponent', () => {
  const mockCard: HtmlCssPreviewCard = {
    type: 'html_css_preview',
    prompt: 'Tes prompt',
    html: '<h1>Awal HTML</h1>',
    css: 'h1 { color: red; }'
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders correctly with initial HTML and CSS', () => {
    render(<HtmlCssPreviewCardComponent card={mockCard} />);
    
    // Check prompt
    expect(screen.getByText('Tes prompt')).toBeInTheDocument();
    
    // Tabs should be present
    expect(screen.getByText('HTML')).toBeInTheDocument();
    expect(screen.getByText('CSS')).toBeInTheDocument();
    
    // CodeMirror for HTML should have initial text
    const textarea = screen.getByTestId('mock-codemirror');
    expect(textarea).toHaveValue('<h1>Awal HTML</h1>');
    
    // Iframe srcDoc should contain initial HTML and CSS
    const iframe = screen.getByTitle('Preview HTML dan CSS');
    expect(iframe).toHaveAttribute('srcDoc', expect.stringContaining('<h1>Awal HTML</h1>'));
    expect(iframe).toHaveAttribute('srcDoc', expect.stringContaining('h1 { color: red; }'));
    expect(iframe).toHaveAttribute('sandbox', '');
  });

  it('switches tabs and updates code', async () => {
    render(<HtmlCssPreviewCardComponent card={mockCard} />);

    // Initial is HTML
    const textareaHtml = screen.getByTestId('mock-codemirror');
    expect(textareaHtml).toHaveValue('<h1>Awal HTML</h1>');
    
    // Switch to CSS
    await fireEvent.click(screen.getByText('CSS'));
    const textareaCss = screen.getByTestId('mock-codemirror');
    expect(textareaCss).toHaveValue('h1 { color: red; }');
  });

  it('resets code when reset button is clicked', async () => {
    render(<HtmlCssPreviewCardComponent card={mockCard} />);

    // Change HTML
    const textareaHtml = screen.getByTestId('mock-codemirror');
    await fireEvent.change(textareaHtml, { target: { value: '<h2>Baru</h2>' } });
    expect(textareaHtml).toHaveValue('<h2>Baru</h2>');
    
    // Switch to CSS and change
    await fireEvent.click(screen.getByText('CSS'));
    const textareaCss = screen.getByTestId('mock-codemirror');
    await fireEvent.change(textareaCss, { target: { value: 'h2 { color: blue; }' } });
    expect(textareaCss).toHaveValue('h2 { color: blue; }');

    // Reset
    await fireEvent.click(screen.getByText('Reset'));

    // Should be back to CSS initial value (since we're still on CSS tab)
    const textareaCssReset = screen.getByTestId('mock-codemirror');
    expect(textareaCssReset).toHaveValue('h1 { color: red; }');
    
    // Switch back to HTML
    await fireEvent.click(screen.getByText('HTML'));
    const textareaHtmlReset = screen.getByTestId('mock-codemirror');
    expect(textareaHtmlReset).toHaveValue('<h1>Awal HTML</h1>');
  });
});
