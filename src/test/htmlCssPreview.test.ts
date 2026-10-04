import { describe, it, expect } from 'vitest';
import { buildPreviewDocument } from '../lib/htmlCssPreview';

describe('buildPreviewDocument', () => {
  it('combines HTML fragment and CSS correctly', () => {
    const html = '<h1>Halo</h1>';
    const css = 'h1 { color: red; }';
    const result = buildPreviewDocument(html, css);
    
    expect(result).toContain('<meta charset="utf-8">');
    expect(result).toContain('<meta name="viewport" content="width=device-width, initial-scale=1">');
    expect(result).toContain('<style>h1 { color: red; }</style>');
    expect(result).toContain('<h1>Halo</h1>');
    expect(result).toContain('<!doctype html>');
  });

  it('works with full HTML document with <head>', () => {
    const html = '<!doctype html><html><head><title>Test</title></head><body><h1>Halo</h1></body></html>';
    const css = 'h1 { color: red; }';
    const result = buildPreviewDocument(html, css);
    
    expect(result).toContain('<style>h1 { color: red; }</style></head>');
  });

  it('works with full HTML document without <head>', () => {
    const html = '<!doctype html><html><body><h1>Halo</h1></body></html>';
    const css = 'h1 { color: red; }';
    const result = buildPreviewDocument(html, css);
    
    expect(result).toMatch(/<html[^>]*><head><style>h1 { color: red; }<\/style><\/head><body>/i);
  });
});
