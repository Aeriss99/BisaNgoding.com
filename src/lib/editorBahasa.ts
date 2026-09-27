import { javascript } from '@codemirror/lang-javascript';
import { java } from '@codemirror/lang-java';
import type { Extension } from '@codemirror/state';

export function ekstensiBahasa(language: string): Extension[] {
  if (language === 'javascript') return [javascript()];
  if (language === 'java') return [java()];
  return []; // git, english, and others are plain text
}
