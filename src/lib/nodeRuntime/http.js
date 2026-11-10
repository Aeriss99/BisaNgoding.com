// node:http tiruan. Server "listen" di port tiruan; fetch ke http://localhost:<port> diarahkan ke server ini.
import { EventEmitter } from 'events';
import { Readable, Writable } from 'readable-stream';
import { Buffer } from 'buffer';
import { tahan, lepas, jadwalTick } from './inti.js';

export const METHODS = ['ACL','BIND','CHECKOUT','CONNECT','COPY','DELETE','GET','HEAD','LINK','LOCK','M-SEARCH','MERGE','MKACTIVITY','MKCALENDAR','MKCOL','MOVE','NOTIFY','OPTIONS','PATCH','POST','PROPFIND','PROPPATCH','PURGE','PUT','QUERY','REBIND','REPORT','SEARCH','SOURCE','SUBSCRIBE','TRACE','UNBIND','UNLINK','UNLOCK','UNSUBSCRIBE'];
export const STATUS_CODES = {100:'Continue',101:'Switching Protocols',102:'Processing',103:'Early Hints',200:'OK',201:'Created',202:'Accepted',203:'Non-Authoritative Information',204:'No Content',205:'Reset Content',206:'Partial Content',207:'Multi-Status',208:'Already Reported',226:'IM Used',300:'Multiple Choices',301:'Moved Permanently',302:'Found',303:'See Other',304:'Not Modified',305:'Use Proxy',307:'Temporary Redirect',308:'Permanent Redirect',400:'Bad Request',401:'Unauthorized',402:'Payment Required',403:'Forbidden',404:'Not Found',405:'Method Not Allowed',406:'Not Acceptable',407:'Proxy Authentication Required',408:'Request Timeout',409:'Conflict',410:'Gone',411:'Length Required',412:'Precondition Failed',413:'Payload Too Large',414:'URI Too Long',415:'Unsupported Media Type',416:'Range Not Satisfiable',417:'Expectation Failed',418:"I'm a Teapot",421:'Misdirected Request',422:'Unprocessable Entity',423:'Locked',424:'Failed Dependency',425:'Too Early',426:'Upgrade Required',428:'Precondition Required',429:'Too Many Requests',431:'Request Header Fields Too Large',451:'Unavailable For Legal Reasons',500:'Internal Server Error',501:'Not Implemented',502:'Bad Gateway',503:'Service Unavailable',504:'Gateway Timeout',505:'HTTP Version Not Supported',506:'Variant Also Negotiates',507:'Insufficient Storage',508:'Loop Detected',509:'Bandwidth Limit Exceeded',510:'Not Extended',511:'Network Authentication Required'};

const pelabuhan = (globalThis.__nodePelabuhan ??= new Map());
export function semuaServer() { return pelabuhan; }
export function tutupSemua() { for (const s of pelabuhan.values()) s.close(); pelabuhan.clear(); }

class Socket extends EventEmitter {
  constructor() { super(); this.remoteAddress = '::1'; this.remotePort = 51234; this.localPort = 0; this.encrypted = false; this.readable = true; this.writable = true; this.destroyed = false; }
  destroy() { this.destroyed = true; this.writable = false; this.readable = false; return this; }
  setTimeout() { return this; } setNoDelay() { return this; } setKeepAlive() { return this; }
  ref() { return this; } unref() { return this; } address() { return { address: '::1', family: 'IPv6', port: this.localPort }; }
}

export class IncomingMessage extends Readable {
  constructor(socket) {
    super();
    this.socket = socket; this.connection = socket;
    this.headers = {}; this.rawHeaders = []; this.trailers = {}; this.rawTrailers = [];
    this.httpVersion = '1.1'; this.httpVersionMajor = 1; this.httpVersionMinor = 1;
    this.method = null; this.url = ''; this.statusCode = null; this.statusMessage = null;
    this.complete = false; this.aborted = false; this.upgrade = false;
  }
  _read() {}
  setTimeout() { return this; }
}

export class ServerResponse extends Writable {
  constructor(req) {
    super();
    this.req = req; this.socket = req.socket; this.connection = req.socket;
    this.statusCode = 200; this.statusMessage = undefined; this.sendDate = true;
    this._hdr = new Map(); this.headersSent = false; this.finished = false; this.chunkedEncoding = false;
    this._isi = [];
    this.on('finish', () => { this.finished = true; this._selesai && this._selesai(); });
  }
  get _header() { return this.headersSent ? 'HTTP/1.1' : null; }
  _cek(nama) { if (this.headersSent) { const e = new Error('Cannot set headers after they are sent to the client'); e.code = 'ERR_HTTP_HEADERS_SENT'; throw e; } }
  setHeader(n, v) { this._cek(n); this._hdr.set(String(n).toLowerCase(), [n, v]); return this; }
  appendHeader(n, v) { const k = String(n).toLowerCase(); const lama = this._hdr.get(k); if (lama) { const a = [].concat(lama[1], v); this._hdr.set(k, [lama[0], a]); } else this.setHeader(n, v); return this; }
  getHeader(n) { const x = this._hdr.get(String(n).toLowerCase()); return x ? x[1] : undefined; }
  getHeaders() { const o = Object.create(null); for (const [k, [, v]] of this._hdr) o[k] = v; return o; }
  getHeaderNames() { return [...this._hdr.keys()]; }
  getRawHeaderNames() { return [...this._hdr.values()].map((x) => x[0]); }
  hasHeader(n) { return this._hdr.has(String(n).toLowerCase()); }
  removeHeader(n) { this._cek(n); this._hdr.delete(String(n).toLowerCase()); }
  flushHeaders() { this.headersSent = true; }
  writeHead(code, msg, headers) {
    if (typeof msg !== 'string') { headers = msg; msg = undefined; }
    this.statusCode = code; if (msg) this.statusMessage = msg;
    if (headers) {
      if (Array.isArray(headers)) { for (let i = 0; i < headers.length; i += 2) this.setHeader(headers[i], headers[i + 1]); }
      else for (const k of Object.keys(headers)) this.setHeader(k, headers[k]);
    }
    this.headersSent = true;
    return this;
  }
  writeContinue() {}
  setTimeout() { return this; }
  _write(chunk, enc, cb) { this.headersSent = true; this._isi.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, enc)); cb(); }
  end(chunk, enc, cb) {
    if (typeof chunk === 'function') { cb = chunk; chunk = undefined; }
    if (typeof enc === 'function') { cb = enc; enc = undefined; }
    this.headersSent = true;
    if (chunk !== undefined && chunk !== null) return super.end(chunk, enc, cb);
    return super.end(cb);
  }
}

export class Server extends EventEmitter {
  constructor(opsi, handler) {
    super();
    if (typeof opsi === 'function') handler = opsi;
    if (handler) this.on('request', handler);
    this.listening = false; this._port = null; this.timeout = 0; this.keepAliveTimeout = 5000;
  }
  listen(...args) {
    let cb = typeof args[args.length - 1] === 'function' ? args.pop() : null;
    let port = args[0];
    if (port && typeof port === 'object') port = port.port;
    port = Number(port) || 0;
    if (!port) { port = 40000 + Math.floor(Math.random() * 20000); }
    if (cb) this.once('listening', cb);
    if (pelabuhan.has(port)) {
      jadwalTick(() => {
        const e = new Error('listen EADDRINUSE: address already in use :::' + port);
        e.code = 'EADDRINUSE'; e.errno = -98; e.syscall = 'listen'; e.address = '::'; e.port = port;
        this.emit('error', e);
      });
      return this;
    }
    pelabuhan.set(port, this);
    this._port = port; this.listening = true; tahan();
    jadwalTick(() => this.emit('listening'));
    return this;
  }
  address() { return this.listening ? { address: '::', family: 'IPv6', port: this._port } : null; }
  close(cb) {
    if (cb) this.once('close', cb);
    if (!this.listening) {
      jadwalTick(() => { const e = new Error('Server is not running.'); e.code = 'ERR_SERVER_NOT_RUNNING'; if (cb) cb(e); });
      return this;
    }
    pelabuhan.delete(this._port); this.listening = false;
    jadwalTick(() => { this.emit('close'); lepas(); });
    return this;
  }
  closeAllConnections() {} closeIdleConnections() {}
  setTimeout() { return this; }
  ref() { return this; } unref() { return this; }
  [Symbol.asyncDispose]() { return new Promise((r) => this.close(r)); }
}
export function createServer(opsi, handler) { return new Server(opsi, handler); }

export class Agent { constructor() {} }
export const globalAgent = new Agent();
export function request() { throw new Error('http.request belum didukung di editor ini. Pakai fetch.'); }
export const get = request;
export const maxHeaderSize = 16384;

// Dipanggil dari fetch tiruan.
export function kirimKeServer(url, init, BodyBawaan) {
  const port = Number(url.port) || 80;
  const server = pelabuhan.get(port);
  if (!server) {
    const sebab = new Error('connect ECONNREFUSED ::1:' + port);
    sebab.code = 'ECONNREFUSED'; sebab.errno = -111; sebab.syscall = 'connect'; sebab.address = '::1'; sebab.port = port;
    return Promise.reject(Object.assign(new TypeError('fetch failed'), { cause: sebab }));
  }
  return new Promise((resolve, reject) => {
    const socket = new Socket(); socket.localPort = port;
    const req = new IncomingMessage(socket);
    const method = String(init.method || 'GET').toUpperCase();
    req.method = method;
    req.url = url.pathname + url.search;
    const h = new Headers(init.headers || {});
    let isi = init.body;
    let bytes = null;
    if (isi !== undefined && isi !== null) {
      if (typeof isi === 'string') { bytes = Buffer.from(isi); if (!h.has('content-type')) h.set('content-type', 'text/plain;charset=UTF-8'); }
      else if (isi instanceof URLSearchParams) { bytes = Buffer.from(isi.toString()); if (!h.has('content-type')) h.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8'); }
      else if (isi instanceof ArrayBuffer || ArrayBuffer.isView(isi)) bytes = Buffer.from(isi.buffer ? new Uint8Array(isi.buffer, isi.byteOffset, isi.byteLength) : isi);
      else { bytes = Buffer.from(String(isi)); }
      h.set('content-length', String(bytes.length));
    }
    const hd = { host: url.host, connection: 'keep-alive' };
    for (const [k, v] of h) hd[k] = v;
    if (!('accept' in hd)) hd.accept = '*/*';
    if (!('accept-language' in hd)) hd['accept-language'] = '*';
    if (!('sec-fetch-mode' in hd)) hd['sec-fetch-mode'] = 'cors';
    if (!('user-agent' in hd)) hd['user-agent'] = 'node';
    if (!('accept-encoding' in hd)) hd['accept-encoding'] = 'gzip, deflate';
    req.headers = hd;
    for (const k of Object.keys(hd)) req.rawHeaders.push(k, hd[k]);
    const res = new ServerResponse(req);
    tahan();
    res._selesai = () => {
      lepas();
      const tanpaIsi = method === 'HEAD' || res.statusCode === 204 || res.statusCode === 304;
      const header = new Headers();
      for (const [, [n, v]] of res._hdr) {
        if (Array.isArray(v)) v.forEach((x) => header.append(n, String(x))); else header.set(n, String(v));
      }
      const body = Buffer.concat(res._isi);
      if (!header.has('content-length') && !tanpaIsi && !header.has('transfer-encoding')) header.set('transfer-encoding', 'chunked');
      header.set('date', new Date().toUTCString());
      header.set('connection', 'keep-alive');
      header.set('keep-alive', 'timeout=5');
      try {
        resolve(new Response(tanpaIsi ? null : body, { status: res.statusCode, statusText: res.statusMessage || STATUS_CODES[res.statusCode] || '', headers: header }));
      } catch (e) { reject(e); }
    };
    jadwalTick(() => {
      server.emit('request', req, res);
      if (bytes) req.push(bytes);
      req.complete = true;
      req.push(null);
    });
  });
}
export default { METHODS, STATUS_CODES, Server, createServer, IncomingMessage, ServerResponse, Agent, globalAgent, request, get, maxHeaderSize };
