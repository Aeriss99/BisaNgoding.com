import { Buffer } from 'buffer';
import { sha1, md5 } from '@noble/hashes/legacy.js';
import { sha256, sha512 } from '@noble/hashes/sha2.js';
import { hmac } from '@noble/hashes/hmac.js';
import { scrypt as nobleScrypt } from '@noble/hashes/scrypt.js';
import { pbkdf2 as noblePbkdf2 } from '@noble/hashes/pbkdf2.js';
const ALGO = { sha1, md5, sha256, sha512 };
function algo(nama) {
  const a = ALGO[String(nama).toLowerCase().replace('-', '')];
  if (!a) { const e = new Error('Digest method not supported'); e.code = 'ERR_CRYPTO_INVALID_DIGEST'; throw e; }
  return a;
}
export class KeyObject {
  constructor(type, kunci) { this.type = type; this._k = kunci; }
  get symmetricKeySize() { return this._k.length; }
  export() { return Buffer.from(this._k); }
  equals(o) { return o instanceof KeyObject && Buffer.compare(this._k, o._k) === 0; }
}
const keBytes = (d, enc) => (d instanceof KeyObject ? Buffer.from(d._k) : typeof d === 'string' ? Buffer.from(d, enc || 'utf8') : Buffer.from(d.buffer ? new Uint8Array(d.buffer, d.byteOffset, d.byteLength) : d));
export function createSecretKey(k, enc) { return new KeyObject('secret', keBytes(k, enc)); }
function tidakDidukung() { const e = new Error('Kunci asimetris (RSA/EC) belum didukung di editor ini'); e.code = 'ERR_OSSL_UNSUPPORTED'; throw e; }
export const createPublicKey = tidakDidukung;
export const createPrivateKey = tidakDidukung;
export function createSign() { tidakDidukung(); }
export function createVerify() { tidakDidukung(); }
export const constants = {};
function keluaran(bytes, enc) { const b = Buffer.from(bytes); return enc ? b.toString(enc) : b; }
class Hash {
  constructor(fn, kunci) { this.fn = fn; this.kunci = kunci; this.isi = []; }
  update(d, enc) { this.isi.push(keBytes(d, enc)); return this; }
  digest(enc) {
    const data = Buffer.concat(this.isi);
    const h = this.kunci ? hmac(this.fn, this.kunci, data) : this.fn(data);
    return keluaran(h, enc);
  }
  copy() { const h = new Hash(this.fn, this.kunci); h.isi = [...this.isi]; return h; }
}
export const createHash = (nama) => new Hash(algo(nama));
export const createHmac = (nama, kunci) => new Hash(algo(nama), keBytes(kunci));
export const hash = (nama, data, enc = 'hex') => createHash(nama).update(data).digest(enc);
export function randomBytes(n, cb) { const b = Buffer.from(globalThis.crypto.getRandomValues(new Uint8Array(n))); if (cb) { queueMicrotask(() => cb(null, b)); return; } return b; }
export const randomUUID = () => globalThis.crypto.randomUUID();
export function randomInt(min, max) { if (max === undefined) { max = min; min = 0; } return min + Math.floor(Math.random() * (max - min)); }
export function timingSafeEqual(a, b) {
  if (a.length !== b.length) { const e = new RangeError('Input buffers must have the same byte length'); e.code = 'ERR_CRYPTO_TIMING_SAFE_EQUAL_LENGTH'; throw e; }
  let x = 0; for (let i = 0; i < a.length; i++) x |= a[i] ^ b[i]; return x === 0;
}
export function scryptSync(pw, salt, keylen, o = {}) {
  return Buffer.from(nobleScrypt(keBytes(pw), keBytes(salt), { N: o.N || o.cost || 16384, r: o.r || o.blockSize || 8, p: o.p || o.parallelization || 1, dkLen: keylen }));
}
export function scrypt(pw, salt, keylen, o, cb) {
  if (typeof o === 'function') { cb = o; o = {}; }
  setTimeout(() => { try { cb(null, scryptSync(pw, salt, keylen, o)); } catch (e) { cb(e); } }, 0);
}
export function pbkdf2Sync(pw, salt, iter, keylen, dig) { return Buffer.from(noblePbkdf2(algo(dig), keBytes(pw), keBytes(salt), { c: iter, dkLen: keylen })); }
export const webcrypto = globalThis.crypto;
export const subtle = globalThis.crypto.subtle;
export const getHashes = () => Object.keys(ALGO);
export default { KeyObject, createSecretKey, createPublicKey, createPrivateKey, createSign, createVerify, constants, createHash, createHmac, hash, randomBytes, randomUUID, randomInt, timingSafeEqual, scrypt, scryptSync, pbkdf2Sync, webcrypto, subtle, getHashes };
