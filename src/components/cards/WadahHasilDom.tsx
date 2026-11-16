import { useEffect, useRef } from 'react';
import { pratinjauHtml } from '../../lib/jsRunner';

/** Wadah hasil latihan DOM: menampilkan HTML awal, lalu diganti hasil kode setiap kali dijalankan. */
export function WadahHasilDom({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) pratinjauHtml(ref.current, html);
  }, [html]);
  return (
    <div
      ref={ref}
      id="js-dom-output-container"
      aria-label="Hasil tampilan halaman"
      className="mt-4 brutal-border bg-white rounded-xl overflow-hidden min-h-[200px]"
      style={{ width: '100%', height: '300px' }}
    />
  );
}

