import { fs } from './fs.js';
export const promises = fs.promises;
export default fs.promises;
export const { readFile, writeFile, appendFile, readdir, mkdir, rm, rmdir, unlink, stat, lstat, access, rename, copyFile, open, realpath, mkdtemp, cp, chmod } = fs.promises;
