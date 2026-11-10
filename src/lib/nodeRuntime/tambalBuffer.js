// Paket buffer (npm) belum mengenal encoding 'base64url' yang dipakai JWT; tambahkan seperti Node.
export function tambalBuffer(Buffer) {
  if (Buffer.__base64url) return;
  Buffer.__base64url = true;
  const keB64 = (s) => { s = String(s).replace(/-/g, '+').replace(/_/g, '/'); return s + '='.repeat((4 - (s.length % 4)) % 4); };
  const dariB64 = (s) => s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const fromAsli = Buffer.from;
  Buffer.from = function (v, enc, ...r) {
    if (typeof v === 'string' && typeof enc === 'string' && enc.toLowerCase() === 'base64url') return fromAsli.call(Buffer, keB64(v), 'base64');
    return fromAsli.call(Buffer, v, enc, ...r);
  };
  const toStringAsli = Buffer.prototype.toString;
  Buffer.prototype.toString = function (enc, ...r) {
    if (typeof enc === 'string' && enc.toLowerCase() === 'base64url') return dariB64(toStringAsli.call(this, 'base64', ...r));
    return toStringAsli.call(this, enc, ...r);
  };
  const isEncAsli = Buffer.isEncoding;
  Buffer.isEncoding = (e) => (typeof e === 'string' && e.toLowerCase() === 'base64url') || isEncAsli(e);
  const byteLengthAsli = Buffer.byteLength;
  Buffer.byteLength = (v, enc) => (typeof enc === 'string' && enc.toLowerCase() === 'base64url' ? byteLengthAsli(keB64(v), 'base64') : byteLengthAsli(v, enc));
}
