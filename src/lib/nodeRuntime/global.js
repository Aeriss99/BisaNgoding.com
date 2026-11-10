// Dipasang paling awal: paket npm (util, readable-stream, express) memakai process, Buffer, dan global saat dimuat.
import proc from './process.js';
import { Buffer } from 'buffer';
globalThis.process = proc;
globalThis.Buffer = Buffer;
globalThis.global = globalThis;
