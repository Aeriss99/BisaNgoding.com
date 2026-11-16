import { StreamLanguage, type StringStream } from '@codemirror/language';

const KATA_KUNCI = new Set(
  'abstract and array as break case catch class clone const continue declare default do echo else elseif empty enum extends final finally fn for foreach function global if implements include instanceof interface isset list match namespace new or print private protected public readonly require return static switch throw trait try unset use while xor yield true false null'.split(
    ' '
  )
);

/** Pewarnaan sederhana untuk PHP (paket bahasa PHP CodeMirror belum terpasang). */
export const php = StreamLanguage.define<{ diKomentar: boolean }>({
  name: 'php',
  startState: () => ({ diKomentar: false }),
  token(stream: StringStream, state) {
    if (state.diKomentar) {
      if (stream.skipTo('*/')) {
        stream.match('*/');
        state.diKomentar = false;
      } else stream.skipToEnd();
      return 'comment';
    }
    if (stream.eatSpace()) return null;
    if (stream.match('<?php') || stream.match('?>')) return 'meta';
    if (stream.match('/*')) {
      state.diKomentar = true;
      return 'comment';
    }
    if (stream.match('//') || stream.peek() === '#') {
      stream.skipToEnd();
      return 'comment';
    }
    const kutip = stream.peek();
    if (kutip === '"' || kutip === "'") {
      stream.next();
      while (!stream.eol()) {
        const c = stream.next();
        if (c === '\\') stream.next();
        else if (c === kutip) break;
      }
      return 'string';
    }
    if (stream.match(/^\$[A-Za-z_]\w*/)) return 'variableName';
    if (stream.match(/^\d+(\.\d+)?/)) return 'number';
    const kata = stream.match(/^[A-Za-z_]\w*/) as RegExpMatchArray | null;
    if (kata) {
      if (KATA_KUNCI.has(kata[0].toLowerCase())) return 'keyword';
      if (stream.peek() === '(') return 'function';
      return null;
    }
    stream.next();
    return null;
  },
});
