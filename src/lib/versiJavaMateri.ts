import { createContext } from 'react';

/** javaVersion materi yang sedang dibuka (misalnya 21), dipakai kartu Java untuk memilih runtime. */
export const VersiJavaMateri = createContext<number | undefined>(undefined);
