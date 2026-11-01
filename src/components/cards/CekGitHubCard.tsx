import { useState } from 'react';
import type { CekGitHubCard } from '../../types/schema';
import { bacaRepoTersimpan, periksaTahap, simpanRepo, type HasilTahap } from '../../lib/cekGithub';

/** Proyek Akhir sungguhan: pengguna menempel alamat repo-nya, website memeriksa tahap ini lewat GitHub API. */
export function CekGitHubCardComponent({ card, onSuccess }: { card: CekGitHubCard; onSuccess: (attempts: number) => void }) {
  const [repo, setRepo] = useState(bacaRepoTersimpan);
  const [bukti, setBukti] = useState('');
  const [hasil, setHasil] = useState<HasilTahap | null>(null);
  const [memeriksa, setMemeriksa] = useState(false);
  const [percobaan, setPercobaan] = useState(0);

  const periksa = async () => {
    setMemeriksa(true);
    const ke = percobaan + 1;
    setPercobaan(ke);
    simpanRepo(repo.trim());
    const h = await periksaTahap(card.tahap, repo, bukti);
    setHasil(h);
    setMemeriksa(false);
    if (h.lulus) onSuccess(ke);
  };

  return (
    <div className="flex flex-col gap-4 w-full min-w-0">
      <h3 className="m-0 font-space font-bold text-lg">{card.judul}</h3>
      <p className="m-0 text-[15px] leading-[1.55]">
        Kerjakan tahap ini di akun GitHub-mu dan di komputermu sendiri, lalu periksa hasilnya di sini.
      </p>

      <label className="flex flex-col gap-1.5">
        <span className="font-bold text-[14px]">Alamat repo GitHub-mu</span>
        <input
          type="text"
          inputMode="url"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          value={repo}
          onChange={(e) => setRepo(e.target.value)}
          placeholder="https://github.com/nama-akun/todolist-akhir"
          className="w-full min-w-0 px-3 py-2.5 border-2 border-[var(--color-text-main)] rounded-lg bg-white font-mono text-[14px]"
        />
      </label>

      {card.bukti && (
        <label className="flex flex-col gap-1.5">
          <span className="font-bold text-[14px]">{card.bukti.label}</span>
          <input
            type="text"
            inputMode="url"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            value={bukti}
            onChange={(e) => setBukti(e.target.value)}
            placeholder={card.bukti.contoh}
            className="w-full min-w-0 px-3 py-2.5 border-2 border-[var(--color-text-main)] rounded-lg bg-white font-mono text-[14px]"
          />
        </label>
      )}

      <button
        type="button"
        onClick={periksa}
        disabled={memeriksa || !repo.trim() || hasil?.lulus}
        className="brutal-btn self-start px-5 py-2.5 rounded-lg bg-[var(--color-primary)] font-bold disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
      >
        {memeriksa ? 'Memeriksa...' : hasil?.lulus ? 'Lulus' : 'Periksa di GitHub'}
      </button>

      {hasil?.galat && (
        <p role="alert" className="m-0 p-3 rounded-lg border-2 border-[#d4a72c] bg-[#fff8c5] text-[14px]">{hasil.galat}</p>
      )}

      {hasil && hasil.hasil.length > 0 && (
        <ul aria-live="polite" className="m-0 p-0 list-none flex flex-col gap-2">
          {hasil.hasil.map((h) => (
            <li key={h.teks} className={`p-3 rounded-lg border-2 ${h.ok ? 'border-[#1a7f37] bg-[#dafbe1]' : 'border-[#cf222e] bg-[#ffebe9]'}`}>
              <div className="flex items-start gap-2 text-[14px] font-semibold">
                <span aria-hidden="true">{h.ok ? '✓' : '✗'}</span>
                <span>
                  <span className="sr-only">{h.ok ? 'Sudah: ' : 'Belum: '}</span>
                  {h.teks}
                </span>
              </div>
              {!h.ok && h.pesan && <p className="m-0 mt-1 pl-5 text-[13px] text-[#57606a] break-words">{h.pesan}</p>}
            </li>
          ))}
        </ul>
      )}

      {hasil?.lulus && (
        <p role="status" className="m-0 font-bold text-[15px] text-[#1a7f37]">Tahap {card.tahap} lulus! Lanjutkan ke kartu berikutnya.</p>
      )}
    </div>
  );
}
