export const URL = globalThis.URL;
export const URLSearchParams = globalThis.URLSearchParams;
export function fileURLToPath(u) { const s = typeof u === 'string' ? u : u.href; if (!s.startsWith('file://')) { const e = new TypeError('The URL must be of scheme file'); e.code = 'ERR_INVALID_URL_SCHEME'; throw e; } return decodeURIComponent(new URL(s).pathname); }
export function pathToFileURL(p) { return new URL('file://' + encodeURI(p)); }
export function parse(s, q) { const u = new URL(s, 'http://localhost'); const abs = /^[a-z]+:/i.test(s); return { protocol: abs ? u.protocol : null, host: abs ? u.host : null, hostname: abs ? u.hostname : null, port: abs ? u.port || null : null, pathname: u.pathname, search: u.search || null, query: q ? Object.fromEntries(u.searchParams) : (u.search ? u.search.slice(1) : null), hash: u.hash || null, href: s, path: u.pathname + u.search }; }
export function format(o) { return typeof o === 'string' ? o : o.href || String(o); }
export const domainToASCII = (d) => d;
export default { URL, URLSearchParams, fileURLToPath, pathToFileURL, parse, format, domainToASCII };
