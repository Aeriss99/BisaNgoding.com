import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
});

export const Mermaid = ({ chart }: { chart: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');

  useEffect(() => {
    if (ref.current) {
      mermaid.render(`mermaid-${Math.random().toString(36).substring(2)}`, chart).then((res) => {
        setSvg(res.svg);
      }).catch(e => {
        console.error('Mermaid render error', e);
        setSvg('<div class="text-red-500">Error rendering diagram</div>');
      });
    }
  }, [chart]);

  return <div ref={ref} dangerouslySetInnerHTML={{ __html: svg }} className="flex justify-center my-4 overflow-x-auto" />;
};
