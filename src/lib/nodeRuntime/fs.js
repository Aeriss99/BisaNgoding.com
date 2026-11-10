// node:fs tiruan di atas memfs (sistem file di memori). Folder kerja: /home/sari/proyek.
import { Volume, createFsFromVolume } from 'memfs';
export const vol = new Volume();
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
