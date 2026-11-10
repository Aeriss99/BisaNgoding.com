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
// Ekspor bernama supaya paket CommonJS (send, express.static) yang memanggil require('fs') mendapat fungsi-fungsinya.
export const {
  Dir, Dirent, FSWatcher, F_OK, R_OK, ReadStream, StatWatcher, Stats, W_OK, WriteStream, X_OK, access, accessSync, appendFile, appendFileSync, chmod, chmodSync, chown, chownSync, close, closeSync, constants, copyFile, copyFileSync, cp, cpSync, createReadStream, createWriteStream, exists, existsSync, fchmod, fchmodSync, fchown, fchownSync, fdatasync, fdatasyncSync, fstat, fstatSync, fsync, fsyncSync, ftruncate, ftruncateSync, futimes, futimesSync, glob, globSync, lchmod, lchmodSync, lchown, lchownSync, link, linkSync, lstat, lstatSync, lutimes, lutimesSync, mkdir, mkdirSync, mkdtemp, mkdtempSync, open, openAsBlob, openSync, opendir, opendirSync, read, readFile, readFileSync, readSync, readdir, readdirSync, readlink, readlinkSync, readv, readvSync, realpath, realpathSync, rename, renameSync, rm, rmSync, rmdir, rmdirSync, stat, statSync, statfs, statfsSync, symlink, symlinkSync, truncate, truncateSync, unlink, unlinkSync, unwatchFile, utimes, utimesSync, watch, watchFile, write, writeFile, writeFileSync, writeSync, writev, writevSync,
} = fs;
export const promises = fs.promises;
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
