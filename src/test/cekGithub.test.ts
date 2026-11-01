import { describe, expect, it } from 'vitest';
import { bacaAlamatRepo, dariWebsite, periksaTahap, type AmbilJson } from '../lib/cekGithub';

const REPO = { private: false, default_branch: 'main', license: { spdx_id: 'MIT' }, has_pages: true, template_repository: { full_name: 'Aeriss99/todolist-starter' } };
const laptop = (pesan: string, parents = 1) => ({ commit: { message: pesan, committer: { name: 'Budi', email: 'budi@contoh.com' } }, parents: Array(parents).fill({}) });
const web = (pesan: string, parents = 1) => ({ commit: { message: pesan, committer: { name: 'GitHub', email: 'noreply@github.com' } }, parents: Array(parents).fill({}) });

function palsu(data: Record<string, any>, status: Record<string, number> = {}): AmbilJson {
  return async (path) => {
    const kunci = Object.keys(data).filter((k) => path.startsWith(k)).sort((x, y) => y.length - x.length)[0];
    const s = status[path] ?? (kunci ? 200 : 404);
    return { status: s, data: kunci ? data[kunci] : null, reset: 1767225600 };
  };
}
const P = '/repos/budi/todolist-akhir';

describe('alamat repo', () => {
  it('menerima nama-akun/nama-repo, URL, dan alamat .git', () => {
    for (const a of ['budi/todolist-akhir', 'https://github.com/budi/todolist-akhir', 'https://github.com/budi/todolist-akhir.git', 'github.com/budi/todolist-akhir/'])
      expect(bacaAlamatRepo(a)).toEqual({ pemilik: 'budi', nama: 'todolist-akhir' });
    expect(bacaAlamatRepo('todolist')).toBeNull();
  });

  it('commit dari website GitHub dikenali', () => {
    expect(dariWebsite(web('x'))).toBe(true);
    expect(dariWebsite(laptop('x'))).toBe(false);
  });
});

describe('periksa tahap', () => {
  it('tahap 1: repo publik dari template', async () => {
    expect((await periksaTahap(1, 'budi/todolist-akhir', '', palsu({ [P]: REPO }))).lulus).toBe(true);
    const fork = await periksaTahap(1, 'budi/todolist-akhir', '', palsu({ [P]: { ...REPO, template_repository: null } }));
    expect(fork.lulus).toBe(false);
    expect(fork.hasil[1].ok).toBe(false);
  });

  it('tahap 2: commit Conventional Commits harus dari laptop', async () => {
    const dasar = { [`${P}/contents/.gitignore`]: {}, [P]: REPO };
    const lulus = await periksaTahap(2, 'budi/todolist-akhir', '', palsu({ ...dasar, [`${P}/commits`]: [laptop('chore: tambah .gitignore dan lisensi MIT'), web('Initial commit')] }));
    expect(lulus.lulus).toBe(true);
    const dariWeb = await periksaTahap(2, 'budi/todolist-akhir', '', palsu({ ...dasar, [`${P}/commits`]: [web('chore: tambah lisensi'), web('Initial commit')] }));
    expect(dariWeb.lulus).toBe(false);
    expect(dariWeb.hasil.find((h) => h.teks.includes('komputermu'))?.ok).toBe(false);
  });

  it('tahap 4: PR di-merge, menutup issue, commit dari laptop', async () => {
    const ambil = palsu({
      [`${P}/pulls?`]: [{ number: 4, merged_at: '2026-11-02', body: 'Closes #1' }],
      [`${P}/issues/1`]: { state: 'closed' },
      [`${P}/pulls/4/commits`]: [laptop('feat: tambah fungsi hapusSelesai')],
      [P]: REPO,
    });
    expect((await periksaTahap(4, 'budi/todolist-akhir', '', ambil)).lulus).toBe(true);
  });

  it('tahap 6: conflict diselesaikan dengan commit merge dari laptop', async () => {
    const data = (c: any) => palsu({ [`${P}/pulls/7/commits`]: [laptop('docs: perjelas deskripsi'), c], [`${P}/pulls/7`]: { merged_at: '2026-11-02' }, [P]: REPO });
    const url = 'https://github.com/budi/todolist-akhir/pull/7';
    expect((await periksaTahap(6, 'budi/todolist-akhir', url, data(laptop('Merge remote-tracking branch', 2)))).lulus).toBe(true);
    expect((await periksaTahap(6, 'budi/todolist-akhir', url, data(web('Merge branch main into docs', 2)))).lulus).toBe(false);
    expect((await periksaTahap(6, 'budi/todolist-akhir', 'https://github.com/orang/lain/pull/7', data(laptop('m', 2)))).lulus).toBe(false);
  });

  it('tahap 8: tag beranotasi dari laptop dan release terbit', async () => {
    const data = (jenis: string) => palsu({ [`${P}/git/ref/tags/v1.0.0`]: { object: { type: jenis } }, [`${P}/releases/tags/v1.0.0`]: { draft: false }, [P]: REPO });
    expect((await periksaTahap(8, 'budi/todolist-akhir', '', data('tag'))).lulus).toBe(true);
    expect((await periksaTahap(8, 'budi/todolist-akhir', '', data('commit'))).lulus).toBe(false);
  });

  it('repo tidak ada, batas API habis, dan alamat salah memberi pesan jelas', async () => {
    expect((await periksaTahap(1, 'budi/tidak-ada', '', palsu({}))).galat).toContain('Repo tidak ditemukan');
    expect((await periksaTahap(1, 'budi/todolist-akhir', '', palsu({ [P]: REPO }, { [P]: 403 }))).galat).toContain('60 kali per jam');
    expect((await periksaTahap(1, 'bukan alamat', '', palsu({}))).galat).toContain('nama-akun/nama-repo');
  });
});
