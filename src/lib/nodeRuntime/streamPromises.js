import { pipeline as p, finished as f } from 'readable-stream';
export const pipeline = (...a) => new Promise((res, rej) => p(...a, (e) => (e ? rej(e) : res())));
export const finished = (s, o) => new Promise((res, rej) => f(s, o || {}, (e) => (e ? rej(e) : res())));
export default { pipeline, finished };
