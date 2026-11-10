import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { buatPemeriksa, FILE_LIB_TS } from '../../lib/tsPeriksa';

const folderLib = path.dirname(require.resolve('typescript/lib/typescript.js'));

/** Pemeriksa TypeScript yang sama dengan di browser, dengan file lib dibaca dari node_modules. */
export function pemeriksaNode() {
  const lib = Object.fromEntries(FILE_LIB_TS.map((f) => [f, fs.readFileSync(path.join(folderLib, f), 'utf-8')]));
  return buatPemeriksa(ts, lib);
}
