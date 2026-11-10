// node:fs tiruan di atas memfs (sistem file di memori). Folder kerja: /home/sari/proyek.
import { Volume, createFsFromVolume } from 'memfs';
import { setImmediate } from './timers.js';
export const vol = new Volume();
// Di Node asli, callback I/O datang di fase poll (setelah microtask). memfs memakai microtask,
// jadi urutannya digeser ke antrean makrotask seperti Node.
vol.wrapAsync = function (method, args, callback) {
  if (typeof callback !== 'function') throw new TypeError('The "cb" argument must be of type function. Received ' + typeof callback);
  setImmediate(() => {
    let hasil;
    try {
      hasil = method.apply(this, args);
    } catch (err) {
      callback(err);
      return;
    }
    callback(null, hasil);
  });
};
export const fs = createFsFromVolume(vol);
export function aturUlangFs(files, cwd) {
  vol.reset();
  vol.mkdirSync(cwd, { recursive: true });
  for (const [nama, isi] of Object.entries(files)) {
    const p = cwd + '/' + nama;
    vol.mkdirSync(p.slice(0, p.lastIndexOf('/')), { recursive: true });
    vol.writeFileSync(p, isi);
  }
}
export default fs;
