/**
 * Pemeriksa Proyek Akhir Git & GitHub (versi sungguhan).
 *
 * Pengguna mengerjakan proyek di akun GitHub-nya sendiri dan di komputernya sendiri. Website hanya membaca
 * hasilnya lewat GitHub REST API publik (tanpa login, batas 60 permintaan per jam per alamat IP).
 *
 * Supaya praktiknya benar-benar dikerjakan di komputer sendiri, beberapa tahap memeriksa bahwa commit dibuat
 * di laptop, bukan lewat tombol di website GitHub: commit dari website selalu punya committer "GitHub"
 * (noreply@github.com), dan tag yang dibuat dari halaman Release berupa tag ringan, bukan tag beranotasi.
 */

export const TEMPLATE_STARTER = 'Aeriss99/todolist-starter';
const API = 'https://api.github.com';
const KUNCI_REPO = 'bn_proyek_akhir_repo';

export interface HasilCek {
  teks: string;
  ok: boolean;
  pesan?: string;
}

export interface HasilTahap {
  lulus: boolean;
  hasil: HasilCek[];
  /** Pesan umum kalau pemeriksaan tidak bisa dijalankan (repo tidak ada, batas API, offline). */
  galat?: string;
}

export type AmbilJson = (path: string) => Promise<{ status: number; data: any; reset?: number }>;

export const ambilDariGitHub: AmbilJson = async (path) => {
  const r = await fetch(`${API}${path}`, { headers: { Accept: 'application/vnd.github+json' } });
  const reset = Number(r.headers.get('x-ratelimit-reset')) || undefined;
  const data = r.status === 204 ? null : await r.json().catch(() => null);
  return { status: r.status, data, reset };
};

export function bacaRepoTersimpan(): string {
  try {
    return localStorage.getItem(KUNCI_REPO) ?? '';
  } catch {
    return '';
  }
}

export function simpanRepo(alamat: string): void {
  try {
    localStorage.setItem(KUNCI_REPO, alamat);
  } catch {
    // tidak apa-apa: pengguna tinggal mengetik ulang
  }
}

/** "kamu/todolist-akhir", "https://github.com/kamu/todolist-akhir", atau alamat .git. */
export function bacaAlamatRepo(teks: string): { pemilik: string; nama: string } | null {
  const t = teks.trim().replace(/\.git$/, '').replace(/\/+$/, '');
  const m = t.match(/^(?:https?:\/\/)?(?:www\.)?(?:github\.com\/)?([A-Za-z0-9-]+)\/([A-Za-z0-9._-]+)$/);
  return m ? { pemilik: m[1], nama: m[2] } : null;
}

const POLA_CONVENTIONAL = /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([^)]+\))?!?: \S/;
const POLA_TUTUP = /\b(close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#(\d+)/i;

/** Commit yang dibuat lewat website GitHub (edit file, tombol merge) punya committer GitHub. */
export function dariWebsite(commit: any): boolean {
  const c = commit?.commit?.committer;
  return c?.email === 'noreply@github.com' || c?.name === 'GitHub';
}

class GalatCek extends Error {}

async function wajib(ambil: AmbilJson, path: string, pesan404: string) {
  const r = await ambil(path);
  if (r.status === 403 || r.status === 429) throw batasHabis(r.reset);
  if (r.status === 404) throw new GalatCek(pesan404);
  if (r.status >= 400) throw new GalatCek(`GitHub menjawab ${r.status}. Coba lagi sebentar lagi.`);
  return r.data;
}

function batasHabis(reset?: number): GalatCek {
  const jam = reset ? new Date(reset * 1000).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '';
  return new GalatCek(`Batas pemeriksaan GitHub (60 kali per jam) sudah habis.${jam ? ` Coba lagi setelah pukul ${jam}.` : ' Coba lagi nanti.'}`);
}

/** Seperti wajib, tapi 404 dan galat lain dianggap "tidak ada" (null). */
async function boleh(ambil: AmbilJson, path: string) {
  const r = await ambil(path);
  if (r.status === 403 || r.status === 429) throw batasHabis(r.reset);
  return r.status === 200 ? r.data : null;
}

type Pemeriksa = (ambil: AmbilJson, repo: { pemilik: string; nama: string }, dataRepo: any, bukti: string) => Promise<HasilCek[]>;

const PEMERIKSA: Record<number, Pemeriksa> = {
  1: async (_a, _r, repo) => [
    { teks: 'Repo publik', ok: repo.private === false },
    {
      teks: `Dibuat dari template ${TEMPLATE_STARTER}`,
      ok: repo.template_repository?.full_name?.toLowerCase() === TEMPLATE_STARTER.toLowerCase(),
      pesan: 'Buat repo lewat tombol Use this template di halaman template, bukan repo kosong atau fork.',
    },
  ],

  2: async (ambil, r, repo) => {
    const p = `/repos/${r.pemilik}/${r.nama}`;
    const gitignore = await boleh(ambil, `${p}/contents/.gitignore`);
    const commits: any[] = (await wajib(ambil, `${p}/commits?per_page=100`, 'Riwayat commit belum bisa dibaca.')) ?? [];
    const conventional = commits.filter((c) => POLA_CONVENTIONAL.test(c.commit?.message ?? ''));
    return [
      { teks: 'Ada file .gitignore', ok: !!gitignore, pesan: 'Tambahkan .gitignore berisi node_modules/ dan .env.' },
      { teks: 'Lisensi terbaca GitHub', ok: !!repo.license, pesan: 'Tambahkan file LICENSE, misalnya lisensi MIT.' },
      { teks: 'Ada commit berformat Conventional Commits', ok: conventional.length > 0, pesan: 'Contoh pesan: chore: tambah .gitignore dan lisensi MIT' },
      {
        teks: 'Commit itu dibuat di komputermu lalu di-push',
        ok: conventional.some((c) => !dariWebsite(c)),
        pesan: 'Commit dari tombol di website GitHub tidak dihitung. Clone repo-nya, commit di laptop, lalu git push.',
      },
    ];
  },

  3: async (ambil, r, _repo, bukti) => {
    const issues: any[] = (await wajib(ambil, `/repos/${r.pemilik}/${r.nama}/issues?state=all&per_page=100`, 'Daftar issue belum bisa dibaca.')) ?? [];
    const jumlah = issues.filter((i) => !i.pull_request).length;
    const m = bukti.trim().match(/^https:\/\/github\.com\/(?:users|orgs)\/([A-Za-z0-9-]+)\/projects\/\d+\/?(?:views\/\d+)?$/);
    return [
      { teks: `Minimal 3 issue (sekarang ${jumlah})`, ok: jumlah >= 3 },
      {
        teks: 'Tautan papan Projects milikmu',
        ok: !!m && m[1].toLowerCase() === r.pemilik.toLowerCase(),
        pesan: `Tempel alamat papan Projects, contohnya https://github.com/users/${r.pemilik}/projects/1`,
      },
    ];
  },

  4: async (ambil, r) => {
    const p = `/repos/${r.pemilik}/${r.nama}`;
    const prs: any[] = (await wajib(ambil, `${p}/pulls?state=closed&per_page=100`, 'Daftar pull request belum bisa dibaca.')) ?? [];
    const merged = prs.filter((x) => x.merged_at);
    let menutup = false;
    let dariLaptop = false;
    for (const pr of merged) {
      const n = (pr.body ?? '').match(POLA_TUTUP)?.[2];
      if (!n) continue;
      const issue = await boleh(ambil, `${p}/issues/${n}`);
      if (issue?.state !== 'closed') continue;
      menutup = true;
      const commits: any[] = (await boleh(ambil, `${p}/pulls/${pr.number}/commits`)) ?? [];
      if (commits.some((c) => !dariWebsite(c))) {
        dariLaptop = true;
        break;
      }
    }
    return [
      { teks: 'Ada pull request yang sudah di-merge', ok: merged.length > 0 },
      { teks: 'PR itu menutup issue dengan "Closes #nomor"', ok: menutup, pesan: 'Tulis Closes #1 (nomor issue-nya) di deskripsi PR, lalu merge.' },
      { teks: 'Commit di PR itu dibuat di komputermu', ok: dariLaptop, pesan: 'Kerjakan di branch di laptop (git switch -c ...), commit, lalu git push -u origin nama-branch.' },
    ];
  },

  5: async (ambil, r, repo) => {
    const p = `/repos/${r.pemilik}/${r.nama}`;
    const aturan: any[] = (await boleh(ambil, `${p}/rules/branches/${encodeURIComponent(repo.default_branch ?? 'main')}`)) ?? [];
    const jenis = new Set(aturan.map((a) => a.type));
    const runs = await boleh(ambil, `${p}/actions/runs?status=success&per_page=1`);
    return [
      { teks: 'Ruleset aktif: wajib pull request', ok: jenis.has('pull_request'), pesan: 'Settings → Rules → Rulesets → New branch ruleset, centang Require a pull request before merging, Enforcement Active.' },
      { teks: 'Ruleset aktif: status check harus lulus', ok: jenis.has('required_status_checks'), pesan: 'Di ruleset yang sama, centang Require status checks to pass dan pilih job tes.' },
      { teks: 'Workflow CI pernah berhasil', ok: (runs?.total_count ?? 0) > 0, pesan: 'Push atau buka PR supaya workflow CI dari template berjalan.' },
    ];
  },

  6: async (ambil, r, _repo, bukti) => {
    const m = bukti.trim().match(/^https:\/\/github\.com\/([A-Za-z0-9-]+)\/([A-Za-z0-9._-]+)\/pull\/(\d+)/);
    const repoSama = !!m && m[1].toLowerCase() === r.pemilik.toLowerCase() && m[2].toLowerCase() === r.nama.toLowerCase();
    let merged = false;
    let mergeLokal = false;
    if (repoSama) {
      const p = `/repos/${r.pemilik}/${r.nama}`;
      const pr = await boleh(ambil, `${p}/pulls/${m![3]}`);
      merged = !!pr?.merged_at;
      const commits: any[] = (await boleh(ambil, `${p}/pulls/${m![3]}/commits`)) ?? [];
      mergeLokal = commits.some((c) => (c.parents?.length ?? 0) >= 2 && !dariWebsite(c));
    }
    return [
      { teks: 'Tautan pull request di repo ini', ok: repoSama, pesan: `Tempel alamat PR, contohnya https://github.com/${r.pemilik}/${r.nama}/pull/7` },
      { teks: 'Pull request itu sudah di-merge', ok: merged },
      {
        teks: 'Conflict diselesaikan di komputermu (ada commit merge dari laptop)',
        ok: mergeLokal,
        pesan: 'Di branch PR: git fetch, git merge origin/main, perbaiki file, git add, git commit, lalu git push. Jangan pakai tombol Resolve conflicts di website.',
      },
    ];
  },

  7: async (_a, _r, repo) => [
    { teks: 'GitHub Pages aktif', ok: repo.has_pages === true, pesan: 'Settings → Pages → Deploy from a branch → main → Save.' },
  ],

  8: async (ambil, r) => {
    const p = `/repos/${r.pemilik}/${r.nama}`;
    const rilis = await boleh(ambil, `${p}/releases/tags/v1.0.0`);
    const ref = await boleh(ambil, `${p}/git/ref/tags/v1.0.0`);
    return [
      { teks: 'Tag v1.0.0 beranotasi, dibuat di komputermu', ok: ref?.object?.type === 'tag', pesan: 'git tag -a v1.0.0 -m "pesan rilis", lalu git push origin v1.0.0. Tag dari halaman Release bukan tag beranotasi.' },
      { teks: 'Release v1.0.0 sudah terbit', ok: !!rilis && rilis.draft === false, pesan: 'Releases → Create a new release → pilih tag v1.0.0 → Publish release.' },
    ];
  },
};

export async function periksaTahap(tahap: number, alamat: string, bukti = '', ambil: AmbilJson = ambilDariGitHub): Promise<HasilTahap> {
  const repo = bacaAlamatRepo(alamat);
  if (!repo) return { lulus: false, hasil: [], galat: 'Tulis alamat repo seperti nama-akun/nama-repo atau https://github.com/nama-akun/nama-repo.' };
  try {
    const dataRepo = await wajib(ambil, `/repos/${repo.pemilik}/${repo.nama}`, 'Repo tidak ditemukan. Periksa ejaannya, dan pastikan repo-nya Public.');
    const hasil = await PEMERIKSA[tahap](ambil, repo, dataRepo, bukti);
    return { lulus: hasil.every((h) => h.ok), hasil };
  } catch (e) {
    if (e instanceof GalatCek) return { lulus: false, hasil: [], galat: e.message };
    return { lulus: false, hasil: [], galat: 'Tidak bisa menghubungi GitHub. Periksa koneksi internet, lalu coba lagi.' };
  }
}
