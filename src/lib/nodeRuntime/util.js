import * as u from 'util/';
import { inspect, format, formatWithOptions, stripVTControlCharacters } from 'node-inspect-extracted';
export { inspect, format, formatWithOptions, stripVTControlCharacters };
export const promisify = u.promisify;
export const callbackify = u.callbackify;
export const inherits = u.inherits;
export const deprecate = (fn) => fn;
export const types = u.types;
export const isDeepStrictEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
export const TextEncoder = globalThis.TextEncoder;
export const TextDecoder = globalThis.TextDecoder;
export const debuglog = () => () => {};
export function styleText(_f, t) { return t; }
export function parseArgs() { throw new Error('util.parseArgs belum didukung di editor ini'); }
export default { inspect, format, formatWithOptions, stripVTControlCharacters, promisify, callbackify, inherits, deprecate, types, isDeepStrictEqual, TextEncoder, TextDecoder, debuglog, styleText, parseArgs };
