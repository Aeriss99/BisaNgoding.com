import { StreamLanguage, type StringStream } from '@codemirror/language';

const KATA_KUNCI = new Set(
  'False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda match case nonlocal not or pass raise return try while with yield'.split(
    ' '
  )
);
const BAWAAN = new Set(
  'print input int float str bool list dict set tuple len range sum min max sorted abs round open type enumerate zip isinstance'.split(' ')
);

/** Pewarnaan sederhana untuk Python (paket bahasa Python CodeMirror belum terpasang). */
export const python = StreamLanguage.define<{ setelahDef: boolean }>({
  name: 'python',
  startState: () => ({ setelahDef: false }),
  token(stream: StringStream, state) {
    if (stream.eatSpace()) return null;
    if (stream.peek() === '#') {
      stream.skipToEnd();
      return 'comment';
    }
    const kutip = stream.match(/^[rbfRBF]{0,2}("""|'''|"|')/) as RegExpMatchArray | null;
    if (kutip) {
      const tutup = kutip[1];
      while (!stream.eol()) {
        if (tutup.length === 1 && stream.peek() === '\\') {
          stream.next();
          stream.next();
          continue;
        }
        if (stream.match(tutup)) return 'string';
        stream.next();
      }
      return 'string';
    }
    if (stream.match(/^\d+(\.\d+)?/)) return 'number';
    if (stream.match(/^[A-Za-z_]\w*/)) {
      const kata = stream.current();
      if (state.setelahDef) {
        state.setelahDef = false;
        return 'def';
      }
      if (kata === 'def' || kata === 'class') state.setelahDef = true;
      if (KATA_KUNCI.has(kata)) return 'keyword';
      if (BAWAAN.has(kata)) return 'builtin';
      return 'variableName';
    }
    stream.next();
    return null;
  },
  languageData: { commentTokens: { line: '#' } },
});
