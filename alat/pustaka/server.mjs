// Server statis kecil dengan dukungan Range (CheerpJ membaca jar sepotong-sepotong).
import http from 'http'; import fs from 'fs'; import path from 'path';
const akar = process.argv[2]; const port = +process.argv[3];
const jenis = { '.html': 'text/html', '.js': 'text/javascript', '.jar': 'application/java-archive' };
http.createServer((q, r) => {
  const f = path.join(akar, decodeURIComponent(q.url.split('?')[0]));
  if (!f.startsWith(akar) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  const n = fs.statSync(f).size; const h = { 'Content-Type': jenis[path.extname(f)] || 'application/octet-stream', 'Accept-Ranges': 'bytes', 'Access-Control-Allow-Origin': '*' };
  const m = /bytes=(\d+)-(\d*)/.exec(q.headers.range || '');
  if (m) { const a = +m[1], b = m[2] ? Math.min(+m[2], n - 1) : n - 1; r.writeHead(206, { ...h, 'Content-Range': `bytes ${a}-${b}/${n}`, 'Content-Length': b - a + 1 }); fs.createReadStream(f, { start: a, end: b }).pipe(r); }
  else { r.writeHead(200, { ...h, 'Content-Length': n }); fs.createReadStream(f).pipe(r); }
}).listen(port);
