import { describe, expect, it } from 'vitest';
import { buildHtmlPreviewDocument } from '../lib/htmlPreview';

describe('buildHtmlPreviewDocument', () => {
  it('membungkus fragmen HTML menjadi dokumen yang bisa dipreview', () => {
    const result = buildHtmlPreviewDocument('<h1>Halo</h1>');
    expect(result).toContain('<!doctype html>');
    expect(result).toContain('<meta charset="utf-8">');
    expect(result).toContain('<h1>Halo</h1>');
  });

  it('menyisipkan style dasar ke dokumen HTML lengkap', () => {
    const result = buildHtmlPreviewDocument('<!doctype html><html><head><title>Tes</title></head><body><p>Isi</p></body></html>');
    expect(result).toContain('<style>');
    expect(result).toContain('</style></head>');
    expect(result).toContain('<p>Isi</p>');
  });
});
