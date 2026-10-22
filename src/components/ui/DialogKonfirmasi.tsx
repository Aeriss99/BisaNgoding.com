import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
} from 'react';

export interface OpsiKonfirmasi {
  judul: string;
  pesan: string;
  teksYa?: string;
  teksBatal?: string;
  bahaya?: boolean;
}

export type FungsiKonfirmasi = (opsi: OpsiKonfirmasi) => Promise<boolean>;

const defaultKonfirmasi: FungsiKonfirmasi = async () => {
  console.error('KonfirmasiProvider belum dipasang');
  return false;
};

const KonfirmasiContext = createContext<FungsiKonfirmasi>(defaultKonfirmasi);

export function useKonfirmasi(): FungsiKonfirmasi {
  return useContext(KonfirmasiContext);
}

interface DialogState {
  opsi: OpsiKonfirmasi;
  resolve: (value: boolean) => void;
}

export function KonfirmasiProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DialogState | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const btnBatalRef = useRef<HTMLButtonElement | null>(null);
  const btnYaRef = useRef<HTMLButtonElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const konfirmasi = useCallback((opsi: OpsiKonfirmasi): Promise<boolean> => {
    triggerRef.current = document.activeElement as HTMLElement | null;
    return new Promise<boolean>((resolve) => {
      setState({ opsi, resolve });
    });
  }, []);

  const tutup = useCallback(
    (hasil: boolean) => {
      if (!state) return;
      const resolver = state.resolve;
      setState(null);
      resolver(hasil);

      setTimeout(() => {
        if (triggerRef.current && typeof triggerRef.current.focus === 'function') {
          triggerRef.current.focus();
        }
      }, 0);
    },
    [state]
  );

  // Fokus awal di tombol Batal saat dialog terbuka
  useEffect(() => {
    if (state) {
      setTimeout(() => {
        btnBatalRef.current?.focus();
      }, 10);
    }
  }, [state]);

  // Trap focus dan tombol Escape
  useEffect(() => {
    if (!state) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        tutup(false);
        return;
      }

      if (e.key === 'Tab') {
        const focusables = [btnYaRef.current, btnBatalRef.current].filter(
          Boolean
        ) as HTMLElement[];
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state, tutup]);

  return (
    <KonfirmasiContext.Provider value={konfirmasi}>
      {children}
      {state && (
        <div
          data-testid="dialog-konfirmasi-backdrop"
          onClick={(e) => {
            if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
              tutup(false);
            }
          }}
          className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 selection:bg-[#2fe6f0]"
        >
          <div
            ref={cardRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="dialog-konfirmasi-judul"
            aria-describedby="dialog-konfirmasi-pesan"
            className="w-[calc(100vw-32px)] max-w-[400px] box-border bg-[#fffdf7] border-[3px] border-[#111111] shadow-[6px_6px_0_#111111] p-6 sm:p-7 text-[#111111] font-space flex flex-col gap-3"
          >
            <h2
              id="dialog-konfirmasi-judul"
              className="m-0 font-bungee text-xl sm:text-2xl font-normal leading-tight text-[#111111]"
            >
              {state.opsi.judul}
            </h2>
            <p
              id="dialog-konfirmasi-pesan"
              className="m-0 text-sm sm:text-base leading-relaxed text-[#111111]"
            >
              {state.opsi.pesan}
            </p>

            <div className="flex flex-col sm:flex-row-reverse gap-3 mt-4">
              <button
                ref={btnYaRef}
                type="button"
                onClick={() => tutup(true)}
                className={`font-bungee text-sm sm:text-base min-h-[44px] px-5 py-2.5 border-[3px] border-[#111111] shadow-[3px_3px_0_#111111] hover:shadow-[1px_1px_0_#111111] hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer flex-1 flex items-center justify-center ${
                  state.opsi.bahaya
                    ? 'bg-[#ff3dcb] text-[#111111]'
                    : 'bg-[#2fe6f0] text-[#111111]'
                }`}
              >
                {state.opsi.teksYa || 'YA'}
              </button>
              <button
                ref={btnBatalRef}
                type="button"
                onClick={() => tutup(false)}
                className="font-bungee text-sm sm:text-base min-h-[44px] px-5 py-2.5 border-[3px] border-[#111111] bg-white text-[#111111] shadow-[3px_3px_0_#111111] hover:shadow-[1px_1px_0_#111111] hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer flex-1 flex items-center justify-center"
              >
                {state.opsi.teksBatal || 'BATAL'}
              </button>
            </div>
          </div>
        </div>
      )}
    </KonfirmasiContext.Provider>
  );
}
