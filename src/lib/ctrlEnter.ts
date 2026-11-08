import { useEffect, useRef } from 'react';

/** Ctrl+Enter (atau Cmd+Enter) menjalankan aksi. Enter biasa diabaikan. */
export function adalahCtrlEnter(e: KeyboardEvent): boolean {
  return e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && !e.isComposing && !e.repeat;
}

export function useCtrlEnter(aksi: () => void): void {
  const ref = useRef(aksi);
  ref.current = aksi;
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if (!adalahCtrlEnter(e)) return;
      if (document.querySelector('[aria-modal="true"]')) return;
      e.preventDefault();
      ref.current();
    };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, []);
}
