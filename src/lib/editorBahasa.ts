import { javascript } from '@codemirror/lang-javascript';
import { java } from '@codemirror/lang-java';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import type { Extension } from '@codemirror/state';
import { python } from './editorPython';

export function ekstensiBahasa(language: string): Extension[] {
  if (language === 'javascript') return [javascript()];
  if (language === 'jsx' || language === 'react') return [javascript({ jsx: true })];
  if (language === 'java') return [java()];
  if (language === 'html') return [html()];
  if (language === 'css') return [css()];
  if (language === 'python') return [python];
  return []; // git, english, and others are plain text
}
