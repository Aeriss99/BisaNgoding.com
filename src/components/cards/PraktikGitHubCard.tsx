import { useEffect, useRef, useState } from 'react';
import type { PraktikGitHubCard, LayarGitHub } from '../../types/schema';
import {
  bacaVariabelGitHub,
  simpanVariabelGitHub,
  isiTemplate,
  pecahTeks,
} from '../../lib/praktikGithub';

type Entri = {
  jenis: 'lingga';
  teks: string;
  label?: string;
  tantangan?: boolean;
};

const JEDA_MULAI = 400;
const JEDA_KLIK = 600;

function bolehAnimasi(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function Teks({ teks }: { teks: string }) {
  return (
    <>
      {pecahTeks(teks).map((b, i) =>
        b.jenis === 'kode' ? (
          <code
            key={i}
            className="font-mono text-[0.92em] bg-[#f1ece0] border border-[#d9d2c3] rounded px-1 py-[1px] break-words"
          >
            {b.isi}
          </code>
        ) : b.jenis === 'tebal' ? (
          <strong key={i}>{b.isi}</strong>
        ) : (
          <span key={i}>{b.isi}</span>
        )
      )}
    </>
  );
}

function GelembungLingga({ teks, label, tantangan }: { teks: string; label?: string; tantangan?: boolean }) {
  return (
    <div className="flex items-start gap-2.5">
      <div
        aria-hidden="true"
        className="shrink-0 w-9 h-9 rounded-full bg-[var(--color-primary)] border-2 border-[var(--color-text-main)] flex items-center justify-center font-space font-bold text-[16px]"
      >
        L
      </div>
      <div
        className={`min-w-0 flex-1 ${tantangan ? 'bg-[#fff7d6]' : 'bg-white'} border-2 border-[var(--color-text-main)] rounded-xl rounded-tl-sm px-3.5 py-2.5 shadow-[3px_3px_0_var(--color-text-main)] text-[15px] leading-[1.55] whitespace-pre-line`}
      >
        {label && (
          <span
            className={`block mb-1 font-mono text-[12px] font-bold tracking-[0.5px] uppercase ${tantangan ? 'text-[#a3127f]' : 'text-[#5a5a5a]'}`}
          >
            {label}
          </span>
        )}
        <span className="sr-only">Lingga: </span>
        <Teks teks={teks} />
      </div>
    </div>
  );
}

function labelLangkah(card: PraktikGitHubCard, i: number): string {
  const l = card.langkah[i];
  if (!l) return '';
  if (l.otomatis) return 'Contoh dari Lingga';
  const tugas = card.langkah.filter((x) => !x.otomatis);
  const ke = card.langkah.slice(0, i + 1).filter((x) => !x.otomatis).length;
  return `${l.tantangan ? 'Tantangan · ' : ''}Tugas ${ke} dari ${tugas.length}`;
}

export function PraktikGitHubCardComponent(props: {
  card: PraktikGitHubCard;
  onSuccess: (attempts: number) => void;
}) {
  return <Praktik key={`${props.card.judul}|${props.card.langkah.length}`} {...props} />;
}

function Praktik({ card, onSuccess }: { card: PraktikGitHubCard; onSuccess: (attempts: number) => void }) {
  const bawaan = card.bawaan ?? {};
  const [nilai, setNilai] = useState<Record<string, string>>(() => ({
    ...bawaan,
    ...bacaVariabelGitHub(),
  }));
  const [langkahKe, setLangkahKe] = useState(0);
  const [entri, setEntri] = useState<Entri[]>(() => {
    const awal: Entri[] = [{ jenis: 'lingga', teks: isiTemplate(card.pembuka, nilai, card.bawaan) }];
    if (card.langkah[0]) {
      awal.push({
        jenis: 'lingga',
        teks: isiTemplate(card.langkah[0].arahan, nilai, card.bawaan),
        label: labelLangkah(card, 0),
        tantangan: card.langkah[0].tantangan,
      });
    }
    return awal;
  });

  const [isianNilai, setIsianNilai] = useState<Record<string, string>>({});
  const [salahDiLangkah, setSalahDiLangkah] = useState(0);
  const [salahTotal, setSalahTotal] = useState(0);
  const [selesai, setSelesai] = useState(false);
  const [sorotJawaban, setSorotJawaban] = useState(false);
  const [kursor, setKursor] = useState<{ x: number; y: number; aktif: boolean } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const akhirRef = useRef<HTMLDivElement>(null);
  const sudahBerinteraksi = useRef(false);

  const langkah = card.langkah[langkahKe];
  const layarAktif: LayarGitHub =
    (selesai && (card.layar['selesai'] || card.layar['daftar_issue_terisi'] || card.layar['pr_merged'])) ||
    (langkah && card.layar[langkah.layar]) || {
      templat: 'repo',
      repo: 'kamu/todolist',
    };

  useEffect(() => {
    if (sudahBerinteraksi.current) {
      akhirRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [entri]);

  const contohSudah = useRef(-1);
  const langkahSelesaiRef = useRef<number>(-1);

  const berhasil = (isianData?: Record<string, string>) => {
    if (!langkah) return;
    langkahSelesaiRef.current = langkahKe;
    let vBaru = nilai;
    if (isianData && Object.keys(isianData).length > 0) {
      vBaru = simpanVariabelGitHub(isianData);
      setNilai(vBaru);
    }
    const baru: Entri[] = [];
    if (langkah.benar) {
      baru.push({ jenis: 'lingga', teks: isiTemplate(langkah.benar, vBaru, bawaan) });
    }
    const berikut = card.langkah[langkahKe + 1];
    if (berikut) {
      baru.push({
        jenis: 'lingga',
        teks: isiTemplate(berikut.arahan, vBaru, bawaan),
        label: labelLangkah(card, langkahKe + 1),
        tantangan: berikut.tantangan,
      });
      setLangkahKe(langkahKe + 1);
      setSalahDiLangkah(0);
      setSorotJawaban(false);
      setKursor(null);
    } else {
      baru.push({ jenis: 'lingga', teks: isiTemplate(card.penutup, vBaru, bawaan) });
      setSelesai(true);
      setKursor(null);
      onSuccess(salahTotal === 0 ? 1 : salahTotal + 1);
    }
    setEntri((e) => [...e, ...baru]);
  };

  const jalankanContoh = () => {
    if (!langkah?.otomatis || contohSudah.current === langkahKe) return;
    contohSudah.current = langkahKe;
    setKursor(null);
    berhasil();
  };
  const jalankanContohRef = useRef(jalankanContoh);
  jalankanContohRef.current = jalankanContoh;

  useEffect(() => {
    if (selesai || !card.langkah[langkahKe]?.otomatis) return;
    if (!bolehAnimasi()) {
      jalankanContohRef.current();
      return;
    }

    const timerMulai = setTimeout(() => {
      const el = containerRef.current?.querySelector(`[data-target-id="${card.langkah[langkahKe].target}"]`) as HTMLElement | null;
      if (el && containerRef.current) {
        const cRect = containerRef.current.getBoundingClientRect();
        const eRect = el.getBoundingClientRect();
        const x = eRect.left - cRect.left + eRect.width / 2;
        const y = eRect.top - cRect.top + eRect.height / 2;
        setKursor({ x, y, aktif: true });

        const timerKlik = setTimeout(() => {
          jalankanContohRef.current();
        }, JEDA_KLIK);
        return () => clearTimeout(timerKlik);
      } else {
        jalankanContohRef.current();
      }
    }, JEDA_MULAI);

    return () => clearTimeout(timerMulai);
  }, [card, langkahKe, selesai]);

  const lewatiContoh = () => {
    sudahBerinteraksi.current = true;
    jalankanContoh();
  };

  const handleClickElement = (targetId: string) => {
    if (selesai || !langkah || langkah.otomatis) return;
    if (langkahSelesaiRef.current === langkahKe) {
      return;
    }
    sudahBerinteraksi.current = true;

    if (targetId === langkah.target) {
      let isianObj: Record<string, string> | undefined;
      if (langkah.isian) {
        const val = (isianNilai[langkah.isian] ?? bawaan[langkah.isian] ?? '').trim();
        if (!val) {
          setEntri((e) => [
            ...e,
            {
              jenis: 'lingga',
              teks: `Kolom ${langkah.isian} tidak boleh kosong. Ketik isinya dulu ya sebelum melanjutkan.`,
            },
          ]);
          return;
        }
        isianObj = { [langkah.isian]: val };
      }
      berhasil(isianObj);
      return;
    }

    const jumlahSalah = salahDiLangkah + 1;
    setSalahDiLangkah(jumlahSalah);
    setSalahTotal((n) => n + 1);

    const tambahan = jumlahSalah >= 2 ? '\n\nKalau buntu, tekan **Lihat jawabannya**.' : '';
    const khusus = langkah.salah?.find((s) => s.target === targetId);

    if (khusus) {
      setEntri((e) => [
        ...e,
        {
          jenis: 'lingga',
          teks: isiTemplate(khusus.reaksi, nilai, bawaan) + tambahan,
        },
      ]);
    } else {
      setEntri((e) => [
        ...e,
        {
          jenis: 'lingga',
          teks: `Hmm, tombol itu belum yang kita perlukan sekarang. ${isiTemplate(langkah.petunjuk, nilai, bawaan)}${tambahan}`,
        },
      ]);
    }
  };

  const lihatJawaban = () => {
    if (!langkah) return;
    setSorotJawaban(true);
    if (langkah.isian) {
      const defaultVal = bawaan[langkah.isian] || 'hapusTodo menghapus nomor yang salah';
      setIsianNilai((prev) => ({ ...prev, [langkah.isian!]: defaultVal }));
    }
  };

  const getSorotStyle = (targetId: string) => {
    if (!langkah) return '';
    const isTarget = langkah.target === targetId;
    if (isTarget && (sorotJawaban || (langkah.otomatis && kursor?.aktif))) {
      return 'ring-4 ring-[#ffd33d] shadow-[0_0_12px_rgba(255,211,61,0.9)] transition-all';
    }
    return '';
  };

  const repoNama = layarAktif.repo || 'kamu/todolist';
  const tabAktif = layarAktif.tabAktif || 'code';
  const isProfileProjects = layarAktif.templat === 'projects' && (layarAktif.stageProjects === 'profil' || layarAktif.stageProjects === 'daftar');

  return (
    <div className="space-y-4">
      <h3 className="m-0 font-space font-bold text-lg">{card.judul}</h3>

      <div role="log" aria-live="polite" aria-label="Percakapan dengan Lingga" className="space-y-3">
        {entri.map((e, i) => (
          <GelembungLingga key={i} teks={e.teks} label={e.label} tantangan={e.tantangan} />
        ))}
        <div ref={akhirRef} />
      </div>

      {!selesai && langkah?.otomatis && (
        <div className="flex items-center justify-between gap-3 bg-[#f6f8fa] border border-[#d0d7de] rounded-lg px-3 py-2 text-[13px] text-[#57606a]">
          <p className="m-0">Lingga sedang mencontohkan langkah ini. Perhatikan ya.</p>
          <button
            type="button"
            onClick={lewatiContoh}
            className="shrink-0 text-[13px] font-bold underline bg-transparent border-none p-0 cursor-pointer text-[#0969da]"
          >
            Lewati
          </button>
        </div>
      )}

      {!selesai && langkah && !langkah.otomatis && salahDiLangkah >= 2 && (
        <div className="flex items-center justify-between gap-3 bg-[#fff8c5] border border-[#d4a72c] rounded-lg px-3 py-2 text-[13px]">
          <span className="text-[#57606a]">Elemen yang benar akan ditandai dengan sorotan kuning.</span>
          <button
            type="button"
            onClick={lihatJawaban}
            className="shrink-0 font-bold underline bg-transparent border-none p-0 cursor-pointer text-[#0969da]"
          >
            Lihat jawabannya
          </button>
        </div>
      )}

      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px] font-mono text-[#57606a] px-1">
          <span>Tampilan GitHub tiruan untuk latihan</span>
          <span>{isProfileProjects ? '@kamu' : repoNama}</span>
        </div>

        <div
          ref={containerRef}
          className="relative w-full max-w-full overflow-hidden border border-[#d0d7de] rounded-lg bg-white shadow-sm font-sans text-[#24292f] text-sm select-none"
        >
          {kursor && (
            <div
              aria-hidden="true"
              style={{ left: `${kursor.x}px`, top: `${kursor.y}px` }}
              className="pointer-events-none absolute z-50 -translate-x-1 -translate-y-1 transition-all duration-300"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="drop-shadow-md">
                <path
                  d="M5.5 3.5L18.5 12.5L12 14L9 20.5L5.5 3.5Z"
                  fill="#24292f"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          )}

          {isProfileProjects ? (
            <div className="border-b border-[#d0d7de] bg-[#f6f8fa] px-3 pt-3">
              <div className="flex items-center gap-2 pb-2 text-[13px]">
                <div className="w-6 h-6 rounded-full bg-[var(--color-primary)] border border-[var(--color-text-main)] flex items-center justify-center font-bold text-xs text-[var(--color-text-main)]">
                  K
                </div>
                <span className="font-semibold text-[#24292f]">kamu (Your profile)</span>
              </div>
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar text-xs">
                <button
                  type="button"
                  id="tab-overview"
                  data-target-id="tab-overview"
                  className="px-2.5 py-2 border-b-2 border-transparent text-[#57606a]"
                >
                  Overview
                </button>
                <button
                  type="button"
                  id="tab-repositories"
                  data-target-id="tab-repositories"
                  className="px-2.5 py-2 border-b-2 border-transparent text-[#57606a]"
                >
                  Repositories
                </button>
                <button
                  type="button"
                  id="tab-projects"
                  data-target-id="tab-projects"
                  onClick={() => handleClickElement('tab-projects')}
                  className={`flex items-center gap-1.5 px-2.5 py-2 border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
                    tabAktif === 'projects'
                      ? 'border-[#fd8c73] font-semibold text-[#24292f]'
                      : 'border-transparent text-[#57606a] hover:text-[#24292f]'
                  } ${getSorotStyle('tab-projects')}`}
                >
                  <span>Projects</span>
                </button>
              </div>
            </div>
          ) : layarAktif.templat !== 'form_umum' && layarAktif.templat !== 'form_gist' ? (
            <div className="border-b border-[#d0d7de] bg-[#f6f8fa] px-3 pt-3">
              <div className="flex items-center justify-between pb-2 text-[13px]">
                <div className="flex items-center gap-1.5 font-semibold text-[#0969da] truncate">
                  <span className="text-[#57606a]">repo:</span>
                  <span>{repoNama}</span>
                  <span className="text-[10px] font-normal text-[#57606a] border border-[#d0d7de] rounded-full px-1.5 py-[1px] bg-white">
                    Public
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar text-xs">
                <button
                  type="button"
                  id="tab-code"
                  data-target-id="tab-code"
                  onClick={() => handleClickElement('tab-code')}
                  className={`flex items-center gap-1.5 px-2.5 py-2 border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
                    tabAktif === 'code'
                      ? 'border-[#fd8c73] font-semibold text-[#24292f]'
                      : 'border-transparent text-[#57606a] hover:text-[#24292f]'
                  } ${getSorotStyle('tab-code')}`}
                >
                  <span>Code</span>
                </button>

                <button
                  type="button"
                  id="tab-issues"
                  data-target-id="tab-issues"
                  onClick={() => handleClickElement('tab-issues')}
                  className={`flex items-center gap-1.5 px-2.5 py-2 border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
                    tabAktif === 'issues'
                      ? 'border-[#fd8c73] font-semibold text-[#24292f]'
                      : 'border-transparent text-[#57606a] hover:text-[#24292f]'
                  } ${getSorotStyle('tab-issues')}`}
                >
                  <span>Issues</span>
                  <span className="text-[10px] bg-[#afb8c1]/20 text-[#24292f] rounded-full px-1.5 py-[1px]">
                    {layarAktif.issueCount !== undefined
                      ? layarAktif.issueCount
                      : Array.isArray(layarAktif.items)
                      ? layarAktif.items.length
                      : 0}
                  </span>
                </button>

                <button
                  type="button"
                  id="tab-pulls"
                  data-target-id="tab-pulls"
                  onClick={() => handleClickElement('tab-pulls')}
                  className={`flex items-center gap-1.5 px-2.5 py-2 border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
                    tabAktif === 'pulls'
                      ? 'border-[#fd8c73] font-semibold text-[#24292f]'
                      : 'border-transparent text-[#57606a] hover:text-[#24292f]'
                  } ${getSorotStyle('tab-pulls')}`}
                >
                  <span>Pull requests</span>
                </button>

                <button
                  type="button"
                  id="tab-discussions"
                  data-target-id="tab-discussions"
                  onClick={() => handleClickElement('tab-discussions')}
                  className={`flex items-center gap-1.5 px-2.5 py-2 border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
                    tabAktif === 'discussions'
                      ? 'border-[#fd8c73] font-semibold text-[#24292f]'
                      : 'border-transparent text-[#57606a] hover:text-[#24292f]'
                  } ${getSorotStyle('tab-discussions')}`}
                >
                  <span>Discussions</span>
                </button>

                <button
                  type="button"
                  id="tab-actions"
                  data-target-id="tab-actions"
                  onClick={() => handleClickElement('tab-actions')}
                  className={`flex items-center gap-1.5 px-2.5 py-2 border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
                    tabAktif === 'actions'
                      ? 'border-[#fd8c73] font-semibold text-[#24292f]'
                      : 'border-transparent text-[#57606a] hover:text-[#24292f]'
                  } ${getSorotStyle('tab-actions')}`}
                >
                  <span>Actions</span>
                </button>

                <button
                  type="button"
                  id="tab-projects"
                  data-target-id="tab-projects"
                  onClick={() => handleClickElement('tab-projects')}
                  className={`flex items-center gap-1.5 px-2.5 py-2 border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
                    tabAktif === 'projects'
                      ? 'border-[#fd8c73] font-semibold text-[#24292f]'
                      : 'border-transparent text-[#57606a] hover:text-[#24292f]'
                  } ${getSorotStyle('tab-projects')}`}
                >
                  <span>Projects</span>
                </button>

                <button
                  type="button"
                  id="tab-settings"
                  data-target-id="tab-settings"
                  onClick={() => handleClickElement('tab-settings')}
                  className={`flex items-center gap-1.5 px-2.5 py-2 border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
                    tabAktif === 'settings'
                      ? 'border-[#fd8c73] font-semibold text-[#24292f]'
                      : 'border-transparent text-[#57606a] hover:text-[#24292f]'
                  } ${getSorotStyle('tab-settings')}`}
                >
                  <span>Settings</span>
                </button>
              </div>
            </div>
          ) : null}

          <div className="p-3 sm:p-4 bg-white">
            {layarAktif.templat === 'repo' && (
              <div className="space-y-3">
                {Boolean(layarAktif.bannerCompare) && (
                  <div className="flex items-center justify-between gap-2 p-2.5 bg-[#fff8c5] border border-[#d4a72c] rounded-md text-xs">
                    <span className="text-[#57606a] truncate">fitur-profil had recent pushes 1 minute ago</span>
                    <button
                      type="button"
                      id="banner-compare"
                      data-target-id="banner-compare"
                      onClick={() => handleClickElement('banner-compare')}
                      className={`shrink-0 px-2.5 py-1 bg-[#1f883d] text-white rounded font-medium hover:bg-[#1a7f37] cursor-pointer ${getSorotStyle('banner-compare')}`}
                    >
                      Compare & pull request
                    </button>
                  </div>
                )}

                {tabAktif === 'discussions' ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#d0d7de]">
                      <span className="font-semibold text-sm">Discussions</span>
                      <button
                        type="button"
                        id="btn-new-discussion"
                        data-target-id="btn-new-discussion"
                        onClick={() => handleClickElement('btn-new-discussion')}
                        className={`px-3 py-1 bg-[#1f883d] text-white rounded-md text-xs font-semibold hover:bg-[#1a7f37] cursor-pointer ${getSorotStyle('btn-new-discussion')}`}
                      >
                        New discussion
                      </button>
                    </div>
                    <div className="p-4 bg-[#f6f8fa] border border-[#d0d7de] rounded-md text-xs text-[#57606a] text-center">
                      Welcome to Discussions! Ask questions, share ideas, and connect with the community.
                    </div>
                  </div>
                ) : tabAktif === 'actions' ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[#d0d7de] text-xs">
                      <span className="font-semibold text-sm">All workflows</span>
                    </div>
                    <div className="border border-[#d0d7de] rounded-md divide-y divide-[#d0d7de] text-xs">
                      <div className="p-3 flex items-center justify-between bg-white">
                        <div className="flex items-center gap-2">
                          <span className="text-[#1a7f37] font-bold">✓</span>
                          <div>
                            <span className="font-semibold text-[#0969da] block">Deploy ke Pages</span>
                            <span className="text-[#57606a] text-[11px]">push: main by kamu</span>
                          </div>
                        </div>
                        <span className="text-[#57606a] text-[11px]">now</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 border border-[#d0d7de] rounded-md px-2 py-1 bg-[#f6f8fa] text-xs font-semibold">
                        <span>main</span>
                      </div>
                      <button
                        type="button"
                        id="btn-code"
                        data-target-id="btn-code"
                        onClick={() => handleClickElement('btn-code')}
                        className={`px-3 py-1 bg-[#1f883d] text-white rounded-md text-xs font-semibold hover:bg-[#1a7f37] cursor-pointer ${getSorotStyle('btn-code')}`}
                      >
                        &lt;&gt; Code
                      </button>
                    </div>

                    <div className="border border-[#d0d7de] rounded-md overflow-hidden text-xs divide-y divide-[#d0d7de]">
                      <div className="p-2 bg-[#f6f8fa] font-mono text-[#57606a]">README.md</div>
                      <div className="p-3 font-mono text-[13px] text-[#24292f]">
                        # Todolist
                        <br />
                        Aplikasi pencatat tugas sederhana.
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {layarAktif.templat === 'daftar_issue' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 max-w-[240px]">
                    <input
                      type="text"
                      readOnly
                      placeholder="is:issue is:open"
                      className="w-full px-2.5 py-1 text-xs border border-[#d0d7de] rounded-md bg-[#f6f8fa] text-[#57606a]"
                    />
                  </div>
                  <button
                    type="button"
                    id="btn-new-issue"
                    data-target-id="btn-new-issue"
                    onClick={() => handleClickElement('btn-new-issue')}
                    className={`px-3 py-1 bg-[#1f883d] text-white rounded-md text-xs font-semibold hover:bg-[#1a7f37] cursor-pointer ${getSorotStyle('btn-new-issue')}`}
                  >
                    New issue
                  </button>
                </div>

                <div className="border border-[#d0d7de] rounded-md overflow-hidden text-xs">
                  <div className="p-2.5 bg-[#f6f8fa] border-b border-[#d0d7de] flex items-center justify-between text-[#57606a]">
                    <span className="font-semibold text-[#24292f]">
                      {Array.isArray(layarAktif.items) && layarAktif.items.length > 0
                        ? `${layarAktif.items.length} Open`
                        : '0 Open'}
                    </span>
                    <span>Sort by: Newest</span>
                  </div>

                  {Array.isArray(layarAktif.items) && layarAktif.items.length > 0 ? (
                    <div className="divide-y divide-[#d0d7de]">
                      {layarAktif.items.map((it) => {
                        const judulFormatted = isiTemplate(it.judul, nilai, bawaan);
                        return (
                          <div
                            key={it.id}
                            id={it.id}
                            data-target-id={it.id}
                            onClick={() => handleClickElement(it.id)}
                            className={`p-3 flex items-start gap-2 hover:bg-[#f6f8fa] cursor-pointer ${getSorotStyle(it.id)}`}
                          >
                            <span className="w-2 h-2 rounded-full bg-[#1f883d] mt-1 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <span className="font-semibold text-[#24292f] block truncate">{judulFormatted}</span>
                              <span className="text-[11px] text-[#57606a]">
                                #{it.nomor ?? 1} opened {it.waktu || 'just now'} by kamu
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-[#57606a]">
                      <p className="font-semibold text-[#24292f] mb-1">There aren’t any open issues.</p>
                      <p className="text-[12px]">Buka issue baru untuk mencatat bug atau ide tugas.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {layarAktif.templat === 'form_issue' && (
              <div className="space-y-3">
                <div className="border-b border-[#d0d7de] pb-2">
                  <h4 className="font-semibold text-base m-0 text-[#24292f]">Create new issue</h4>
                </div>

                <div className="space-y-3">
                  <div>
                    <label htmlFor="input-title" className="block text-xs font-semibold mb-1 text-[#24292f]">
                      Add a title <span className="text-[#cf222e]">*</span>
                    </label>
                    <input
                      id="input-title"
                      data-target-id="input-title"
                      type="text"
                      value={isianNilai[langkah?.isian || 'judul'] ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const k = langkah?.isian || 'judul';
                        setIsianNilai((prev) => ({ ...prev, [k]: val }));
                      }}
                      placeholder="Title"
                      className={`w-full px-2.5 py-1.5 text-xs border border-[#d0d7de] rounded-md outline-none focus:border-[#0969da] ${getSorotStyle('input-title')}`}
                    />
                  </div>

                  <div>
                    <label htmlFor="input-body" className="block text-xs font-semibold mb-1 text-[#24292f]">
                      Add a description
                    </label>
                    <textarea
                      id="input-body"
                      data-target-id="input-body"
                      rows={3}
                      readOnly
                      placeholder="Type your description here..."
                      className={`w-full px-2.5 py-1.5 text-xs border border-[#d0d7de] rounded-md bg-[#f6f8fa] text-[#57606a] ${getSorotStyle('input-body')}`}
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#d0d7de]">
                    <button
                      type="button"
                      id="btn-cancel"
                      data-target-id="btn-cancel"
                      onClick={() => handleClickElement('btn-cancel')}
                      className={`px-3 py-1 border border-[#d0d7de] bg-[#f6f8fa] rounded-md text-xs font-medium hover:bg-[#f3f4f6] cursor-pointer ${getSorotStyle('btn-cancel')}`}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      id="btn-create"
                      data-target-id="btn-create"
                      onClick={() => handleClickElement('btn-create')}
                      className={`px-3.5 py-1 bg-[#1f883d] text-white rounded-md text-xs font-semibold hover:bg-[#1a7f37] cursor-pointer ${getSorotStyle('btn-create')}`}
                    >
                      Create
                    </button>
                  </div>
                </div>
              </div>
            )}

            {layarAktif.templat === 'daftar_pr' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 max-w-[240px]">
                    <input
                      type="text"
                      readOnly
                      placeholder="is:pr is:open"
                      className="w-full px-2.5 py-1 text-xs border border-[#d0d7de] rounded-md bg-[#f6f8fa] text-[#57606a]"
                    />
                  </div>
                  <button
                    type="button"
                    id="btn-new-pr"
                    data-target-id="btn-new-pr"
                    className="px-3 py-1 bg-[#1f883d] text-white rounded-md text-xs font-semibold"
                  >
                    New pull request
                  </button>
                </div>

                <div className="border border-[#d0d7de] rounded-md overflow-hidden text-xs divide-y divide-[#d0d7de]">
                  <div className="p-2.5 bg-[#f6f8fa] flex items-center justify-between text-[#57606a]">
                    <span className="font-semibold text-[#24292f]">1 Open</span>
                    <span>Sort by: Newest</span>
                  </div>
                  <div className="p-3 flex items-start gap-2 bg-white">
                    <span className="w-2 h-2 rounded-full bg-[#1f883d] mt-1 shrink-0" />
                    <div>
                      <span className="font-semibold text-[#24292f] block">{layarAktif.judul || 'Tambah fungsi filter'}</span>
                      <span className="text-[11px] text-[#57606a]">#1 opened just now by kamu</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {layarAktif.templat === 'form_pr' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-2 bg-[#f6f8fa] border border-[#d0d7de] rounded-md text-xs">
                  <span className="font-semibold">base: main</span>
                  <span>←</span>
                  <span className="font-semibold">compare: fitur-profil</span>
                  <span className="text-[#1a7f37] font-semibold ml-auto">✓ Able to merge</span>
                </div>

                <div>
                  <label htmlFor="pr-title" className="block text-xs font-semibold mb-1 text-[#24292f]">
                    Title
                  </label>
                  <input
                    id="pr-title"
                    data-target-id="input-title"
                    type="text"
                    value={isianNilai[langkah?.isian || 'judul'] ?? layarAktif.judul ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      const k = langkah?.isian || 'judul';
                      setIsianNilai((prev) => ({ ...prev, [k]: val }));
                    }}
                    placeholder="Title"
                    className={`w-full px-2.5 py-1.5 text-xs border border-[#d0d7de] rounded-md bg-white ${getSorotStyle('input-title')}`}
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    id="btn-create-pr"
                    data-target-id="btn-create-pr"
                    onClick={() => handleClickElement('btn-create-pr')}
                    className={`px-3.5 py-1.5 bg-[#1f883d] text-white rounded-md text-xs font-semibold hover:bg-[#1a7f37] cursor-pointer ${getSorotStyle('btn-create-pr')}`}
                  >
                    Create pull request
                  </button>
                </div>
              </div>
            )}

            {layarAktif.templat === 'pull_request' && (
              <div className="space-y-3">
                <div className="border-b border-[#d0d7de] pb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-base">{layarAktif.judul || 'Pull Request'}</span>
                    <span className="text-xs text-[#57606a]">#{layarAktif.nomor || 1}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {layarAktif.stageConflict === 'merged' ? (
                      <span className="bg-[#8250df] text-white text-[11px] font-semibold rounded-full px-2 py-0.5">
                        Merged
                      </span>
                    ) : (
                      <span className="bg-[#1f883d] text-white text-[11px] font-semibold rounded-full px-2 py-0.5">
                        Open
                      </span>
                    )}
                    <span className="text-xs text-[#57606a]">wants to merge into main</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 border-b border-[#d0d7de] text-xs">
                  <button
                    type="button"
                    id="tab-conversation"
                    data-target-id="tab-conversation"
                    onClick={() => handleClickElement('tab-conversation')}
                    className={`px-3 py-1.5 border-b-2 font-medium cursor-pointer ${
                      layarAktif.subTab !== 'files'
                        ? 'border-[#fd8c73] font-semibold text-[#24292f]'
                        : 'border-transparent text-[#57606a]'
                    } ${getSorotStyle('tab-conversation')}`}
                  >
                    Conversation
                  </button>
                  <button
                    type="button"
                    id="tab-files"
                    data-target-id="tab-files"
                    onClick={() => handleClickElement('tab-files')}
                    className={`px-3 py-1.5 border-b-2 font-medium cursor-pointer ${
                      layarAktif.subTab === 'files'
                        ? 'border-[#fd8c73] font-semibold text-[#24292f]'
                        : 'border-transparent text-[#57606a]'
                    } ${getSorotStyle('tab-files')}`}
                  >
                    Files changed
                  </button>
                </div>

                {layarAktif.subTab === 'files' ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 p-2 bg-[#f6f8fa] border border-[#d0d7de] rounded-md text-xs">
                      <span className="font-mono text-[#24292f]">todo.js</span>
                      <button
                        type="button"
                        id="btn-submit-review"
                        data-target-id="btn-submit-review"
                        onClick={() => handleClickElement('btn-submit-review')}
                        className={`px-3 py-1 bg-[#1f883d] text-white rounded-md font-semibold hover:bg-[#1a7f37] cursor-pointer ${getSorotStyle('btn-submit-review')}`}
                      >
                        Submit review
                      </button>
                    </div>
                    <pre className="p-3 bg-[#f6f8fa] border border-[#d0d7de] rounded-md font-mono text-xs text-[#24292f]">
                      + function formatTanggal(t) &#123; return t.toISOString(); &#125;
                    </pre>

                    {layarAktif.stageReview === 'panel' && (
                      <div className="border-2 border-[#0969da] rounded-lg p-3 bg-white shadow-md space-y-2 text-xs">
                        <span className="font-semibold block text-sm">Finish your review</span>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 p-1.5 opacity-50">
                            <input type="radio" name="review-type" disabled tabIndex={-1} className="pointer-events-none" />
                            <span>Comment</span>
                          </div>
                          <div
                            id="opt-approve"
                            data-target-id="opt-approve"
                            role="radio"
                            aria-checked={layarAktif.modeReview === 'approve'}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleClickElement('opt-approve');
                            }}
                            className={`flex items-center gap-2 p-1.5 rounded cursor-pointer ${getSorotStyle('opt-approve')}`}
                          >
                            <input
                              type="radio"
                              name="review-type"
                              checked={layarAktif.modeReview === 'approve'}
                              readOnly
                              tabIndex={-1}
                              className="pointer-events-none cursor-pointer"
                            />
                            <span className="font-semibold text-[#1a7f37]">Approve</span>
                          </div>
                          <div className="flex items-center gap-2 p-1.5 opacity-50">
                            <input type="radio" name="review-type" disabled tabIndex={-1} className="pointer-events-none" />
                            <span>Request changes</span>
                          </div>
                        </div>
                        <div className="flex justify-end pt-2">
                          <button
                            type="button"
                            id="btn-confirm-review"
                            data-target-id="btn-confirm-review"
                            onClick={() => handleClickElement('btn-confirm-review')}
                            className={`px-3.5 py-1.5 bg-[#1f883d] text-white rounded-md font-semibold hover:bg-[#1a7f37] cursor-pointer ${getSorotStyle('btn-confirm-review')}`}
                          >
                            Submit review
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : layarAktif.stageConflict === 'editor' ? (
                  <div className="border border-[#d0d7de] rounded-md p-3 space-y-3 bg-white text-xs">
                    <span className="font-semibold block text-sm">Resolve merge conflicts in README.md</span>
                    <pre className="p-3 bg-[#f6f8fa] border border-[#cf222e] rounded-md font-mono text-xs text-[#24292f]">
                      &lt;&lt;&lt;&lt;&lt;&lt;&lt; fitur-baru{'\n'}
                      # Aplikasi Todolist Lengkap{'\n'}
                      ======={'\n'}
                      # Aplikasi Todolist Sederhana{'\n'}
                      &gt;&gt;&gt;&gt;&gt;&gt;&gt; main
                    </pre>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        id="btn-hapus-marker"
                        data-target-id="btn-hapus-marker"
                        onClick={() => handleClickElement('btn-hapus-marker')}
                        className={`px-3 py-1.5 bg-[#0969da] text-white rounded-md font-semibold hover:bg-[#0860ca] cursor-pointer ${getSorotStyle('btn-hapus-marker')}`}
                      >
                        Hapus marker
                      </button>
                    </div>
                  </div>
                ) : layarAktif.stageConflict === 'bersih' ? (
                  <div className="border border-[#d0d7de] rounded-md p-3 space-y-3 bg-white text-xs">
                    <span className="font-semibold block text-sm">Resolved: README.md</span>
                    <pre className="p-3 bg-[#f6f8fa] border border-[#1a7f37] rounded-md font-mono text-xs text-[#24292f]">
                      # Aplikasi Todolist Lengkap
                    </pre>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        id="btn-mark-resolved"
                        data-target-id="btn-mark-resolved"
                        onClick={() => handleClickElement('btn-mark-resolved')}
                        className={`px-3.5 py-1.5 bg-[#1f883d] text-white rounded-md font-semibold hover:bg-[#1a7f37] cursor-pointer ${getSorotStyle('btn-mark-resolved')}`}
                      >
                        Mark as resolved
                      </button>
                    </div>
                  </div>
                ) : layarAktif.stageConflict === 'siap_commit' ? (
                  <div className="border border-[#d0d7de] rounded-md p-3 space-y-3 bg-white text-xs">
                    <div className="text-xs font-semibold text-[#1a7f37]">
                      ✓ All conflicts have been resolved
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        id="btn-commit-merge"
                        data-target-id="btn-commit-merge"
                        onClick={() => handleClickElement('btn-commit-merge')}
                        className={`px-3.5 py-1.5 bg-[#1f883d] text-white rounded-md font-semibold hover:bg-[#1a7f37] cursor-pointer ${getSorotStyle('btn-commit-merge')}`}
                      >
                        Commit merge
                      </button>
                    </div>
                  </div>
                ) : layarAktif.stageConflict === 'conflict' ? (
                  <div className="border border-[#d0d7de] rounded-md p-3 space-y-2 bg-[#f6f8fa]">
                    <div className="text-xs font-semibold text-[#cf222e]">
                      ✕ This branch has conflicts that must be resolved
                    </div>
                    <div className="pt-2">
                      <button
                        type="button"
                        id="btn-resolve-conflicts"
                        data-target-id="btn-resolve-conflicts"
                        onClick={() => handleClickElement('btn-resolve-conflicts')}
                        className={`px-3 py-1.5 bg-[#57606a] text-white rounded-md text-xs font-semibold hover:bg-[#424a53] cursor-pointer ${getSorotStyle('btn-resolve-conflicts')}`}
                      >
                        Resolve conflicts
                      </button>
                    </div>
                  </div>
                ) : layarAktif.stageConflict === 'confirm' ? (
                  <div className="border border-[#d0d7de] rounded-md p-3 space-y-2 bg-[#f6f8fa]">
                    <div className="text-xs font-semibold text-[#1a7f37]">
                      ✓ No conflicts with base branch
                    </div>
                    <div className="pt-2">
                      <button
                        type="button"
                        id="btn-confirm-merge"
                        data-target-id="btn-confirm-merge"
                        onClick={() => handleClickElement('btn-confirm-merge')}
                        className={`px-3.5 py-1.5 bg-[#1f883d] text-white rounded-md text-xs font-semibold hover:bg-[#1a7f37] cursor-pointer ${getSorotStyle('btn-confirm-merge')}`}
                      >
                        Confirm merge
                      </button>
                    </div>
                  </div>
                ) : layarAktif.stageConflict === 'merged' ? (
                  <div className="border border-[#d0d7de] rounded-md p-4 bg-[#f6f8fa] text-center text-xs">
                    <span className="font-semibold text-[#8250df] block mb-1">Pull request successfully merged and closed</span>
                    <span className="text-[#57606a]">You are all set — the branch can now be safely deleted.</span>
                  </div>
                ) : (
                  <div className="border border-[#d0d7de] rounded-md p-3 space-y-2 bg-[#f6f8fa]">
                    <div className="text-xs font-semibold text-[#1a7f37]">
                      ✓ No conflicts with base branch
                    </div>
                    <div className="pt-2">
                      <button
                        type="button"
                        id="btn-merge"
                        data-target-id="btn-merge"
                        onClick={() => handleClickElement('btn-merge')}
                        className={`px-3.5 py-1.5 bg-[#1f883d] text-white rounded-md text-xs font-semibold hover:bg-[#1a7f37] cursor-pointer ${getSorotStyle('btn-merge')}`}
                      >
                        Merge pull request
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {layarAktif.templat === 'pengaturan' && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div className="sm:border-r border-[#d0d7de] pr-2 space-y-1">
                  <button
                    type="button"
                    id="menu-general"
                    data-target-id="menu-general"
                    onClick={() => handleClickElement('menu-general')}
                    className={`w-full text-left px-2 py-1.5 rounded font-medium hover:bg-[#f6f8fa] cursor-pointer ${layarAktif.menuAktif === 'general' ? 'bg-[#f6f8fa] font-semibold text-[#24292f]' : 'text-[#57606a]'} ${getSorotStyle('menu-general')}`}
                  >
                    General
                  </button>
                  <button
                    type="button"
                    id="menu-collaborators"
                    data-target-id="menu-collaborators"
                    onClick={() => handleClickElement('menu-collaborators')}
                    className={`w-full text-left px-2 py-1.5 rounded font-medium hover:bg-[#f6f8fa] cursor-pointer ${layarAktif.menuAktif === 'collaborators' ? 'bg-[#f6f8fa] font-semibold text-[#24292f]' : 'text-[#57606a]'} ${getSorotStyle('menu-collaborators')}`}
                  >
                    Collaborators
                  </button>
                  <button
                    type="button"
                    id="menu-pages"
                    data-target-id="menu-pages"
                    onClick={() => handleClickElement('menu-pages')}
                    className={`w-full text-left px-2 py-1.5 rounded font-medium hover:bg-[#f6f8fa] cursor-pointer ${layarAktif.menuAktif === 'pages' ? 'bg-[#f6f8fa] font-semibold text-[#24292f]' : 'text-[#57606a]'} ${getSorotStyle('menu-pages')}`}
                  >
                    Pages
                  </button>
                  <button
                    type="button"
                    id="menu-copilot"
                    data-target-id="menu-copilot"
                    onClick={() => handleClickElement('menu-copilot')}
                    className={`w-full text-left px-2 py-1.5 rounded font-medium hover:bg-[#f6f8fa] cursor-pointer ${layarAktif.menuAktif === 'copilot' ? 'bg-[#f6f8fa] font-semibold text-[#24292f]' : 'text-[#57606a]'} ${getSorotStyle('menu-copilot')}`}
                  >
                    Copilot
                  </button>
                </div>

                <div className="sm:col-span-3 p-3 bg-[#f6f8fa] rounded-md border border-[#d0d7de] space-y-2">
                  <p className="font-semibold text-[#24292f] m-0">Settings: {layarAktif.menuAktif || 'General'}</p>

                  {(!layarAktif.menuAktif || layarAktif.menuAktif === 'general') && (
                    <div className="pt-2 space-y-3">
                      <div className="border border-[#d0d7de] rounded-md p-3 bg-white space-y-2">
                        <span className="font-semibold text-xs block text-[#24292f]">Features</span>
                        <div
                          id="check-discussions"
                          data-target-id="check-discussions"
                          role="checkbox"
                          aria-checked={Boolean(layarAktif.featuresDiscussionsChecked)}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleClickElement('check-discussions');
                          }}
                          className={`flex items-center gap-2 cursor-pointer p-1 rounded ${getSorotStyle('check-discussions')}`}
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(layarAktif.featuresDiscussionsChecked)}
                            readOnly
                            tabIndex={-1}
                            className="cursor-pointer pointer-events-none"
                          />
                          <span className="font-medium text-xs">Discussions (collaborative forums)</span>
                        </div>
                      </div>
                      {Boolean(layarAktif.featuresDiscussionsChecked) && (
                        <div className="flex justify-end">
                          <button
                            type="button"
                            id="btn-setup-discussions"
                            data-target-id="btn-setup-discussions"
                            onClick={() => handleClickElement('btn-setup-discussions')}
                            className={`px-3 py-1 bg-[#1f883d] text-white rounded-md text-xs font-semibold hover:bg-[#1a7f37] cursor-pointer ${getSorotStyle('btn-setup-discussions')}`}
                          >
                            Set up discussions
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {layarAktif.menuAktif === 'collaborators' && (
                    <div className="pt-2 space-y-3">
                      {layarAktif.showAddPeopleModal ? (
                        <div className="border-2 border-[#0969da] rounded-md p-3 bg-white space-y-2">
                          <span className="font-semibold block text-xs">Invite a collaborator</span>
                          <input
                            type="text"
                            id="input-collaborator"
                            data-target-id="input-collaborator"
                            value={isianNilai[langkah?.isian || 'rekanTim'] ?? ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              const k = langkah?.isian || 'rekanTim';
                              setIsianNilai((prev) => ({ ...prev, [k]: val }));
                            }}
                            placeholder="Enter username or email"
                            className="w-full px-2.5 py-1.5 text-xs border border-[#d0d7de] rounded-md bg-white"
                          />
                          <div className="flex justify-end">
                            <button
                              type="button"
                              id="btn-submit-invite"
                              data-target-id="btn-submit-invite"
                              onClick={() => handleClickElement('btn-submit-invite')}
                              className={`px-3 py-1 bg-[#1f883d] text-white rounded-md text-xs font-semibold hover:bg-[#1a7f37] cursor-pointer ${getSorotStyle('btn-submit-invite')}`}
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="border border-[#d0d7de] rounded-md p-3 bg-white space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">Manage access</span>
                            <button
                              type="button"
                              id="btn-add-people"
                              data-target-id="btn-add-people"
                              onClick={() => handleClickElement('btn-add-people')}
                              className={`px-3 py-1 bg-[#1f883d] text-white rounded-md text-xs font-semibold hover:bg-[#1a7f37] cursor-pointer ${getSorotStyle('btn-add-people')}`}
                            >
                              Add people
                            </button>
                          </div>
                          <p className="text-[11px] text-[#57606a] m-0">
                            {layarAktif.items && layarAktif.items.length > 0
                              ? `1 pending invite: ${layarAktif.items[0].judul}`
                              : '0 collaborators have access to this repository.'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {layarAktif.menuAktif === 'pages' && (
                    <div className="pt-2 space-y-3">
                      <div className="border border-[#d0d7de] rounded-md p-3 bg-white space-y-3">
                        <span className="font-semibold block text-xs">Build and deployment</span>

                        {layarAktif.stagePages === 'published' ? (
                          <div className="p-3 bg-[#dafbe1] border border-[#1a7f37] rounded-md space-y-2">
                            <span className="font-semibold text-xs text-[#1a7f37] block">Your site is live!</span>
                            <span className="text-[11px] text-[#57606a] block">https://kamu.github.io/todolist/</span>
                            <button
                              type="button"
                              id="btn-visit-site"
                              data-target-id="btn-visit-site"
                              onClick={() => handleClickElement('btn-visit-site')}
                              className={`px-3 py-1 bg-[#1f883d] text-white rounded-md text-xs font-semibold hover:bg-[#1a7f37] cursor-pointer ${getSorotStyle('btn-visit-site')}`}
                            >
                              Visit site
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <span className="text-[#57606a] text-xs block">Source:</span>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                id="btn-select-deploy-branch"
                                data-target-id="btn-select-deploy-branch"
                                onClick={() => handleClickElement('btn-select-deploy-branch')}
                                className={`px-3 py-1.5 border border-[#d0d7de] rounded-md text-xs font-medium cursor-pointer ${
                                  layarAktif.stagePages === 'actions' || layarAktif.stagePages === 'actions_set'
                                    ? 'bg-[#f6f8fa] text-[#57606a]'
                                    : 'bg-white text-[#24292f] font-semibold'
                                } ${getSorotStyle('btn-select-deploy-branch')}`}
                              >
                                Deploy from a branch
                              </button>
                              <button
                                type="button"
                                id="btn-source-actions"
                                data-target-id="btn-source-actions"
                                onClick={() => handleClickElement('btn-source-actions')}
                                className={`px-3 py-1.5 border border-[#d0d7de] rounded-md text-xs font-medium cursor-pointer ${
                                  layarAktif.stagePages === 'actions' || layarAktif.stagePages === 'actions_set'
                                    ? 'bg-white text-[#24292f] font-semibold'
                                    : 'bg-[#f6f8fa] text-[#57606a]'
                                } ${getSorotStyle('btn-source-actions')}`}
                              >
                                GitHub Actions
                              </button>
                            </div>

                            {layarAktif.stagePages === 'actions_set' && (
                              <p className="text-xs text-[#1a7f37] font-semibold m-0 pt-1">✓ Source set to GitHub Actions</p>
                            )}

                            {layarAktif.stagePages === 'branch_select' && (
                              <div className="pt-2 flex items-center gap-2">
                                <span className="text-xs text-[#57606a]">Branch:</span>
                                <button
                                  type="button"
                                  id="btn-select-branch-main"
                                  data-target-id="btn-select-branch-main"
                                  onClick={() => handleClickElement('btn-select-branch-main')}
                                  className={`px-3 py-1 bg-[#f6f8fa] border border-[#d0d7de] rounded-md text-xs font-semibold cursor-pointer ${getSorotStyle('btn-select-branch-main')}`}
                                >
                                  main
                                </button>
                              </div>
                            )}

                            {layarAktif.stagePages === 'folder_select' && (
                              <div className="pt-2 space-y-2">
                                <div className="text-xs text-[#57606a]">
                                  Branch: <span className="font-semibold text-[#24292f]">main</span>, Folder: <span className="font-semibold text-[#24292f]">/ (root)</span>
                                </div>
                                <button
                                  type="button"
                                  id="btn-save-pages"
                                  data-target-id="btn-save-pages"
                                  onClick={() => handleClickElement('btn-save-pages')}
                                  className={`px-3.5 py-1 bg-[#1f883d] text-white rounded-md text-xs font-semibold hover:bg-[#1a7f37] cursor-pointer ${getSorotStyle('btn-save-pages')}`}
                                >
                                  Save
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {layarAktif.menuAktif === 'copilot' && (
                    <div className="pt-2">
                      <p className="text-[11px] text-[#57606a] mb-2">Enable GitHub Copilot suggestions</p>
                      <button
                        type="button"
                        id="btn-save-copilot"
                        data-target-id="btn-save-copilot"
                        onClick={() => handleClickElement('btn-save-copilot')}
                        className={`px-3 py-1 bg-[#1f883d] text-white rounded-md text-xs font-semibold hover:bg-[#1a7f37] cursor-pointer ${getSorotStyle('btn-save-copilot')}`}
                      >
                        Save
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {layarAktif.templat === 'layar_live_site' && (
              <div className="border border-[#d0d7de] rounded-md overflow-hidden text-xs">
                <div className="bg-[#f6f8fa] p-2 border-b border-[#d0d7de] flex items-center gap-2 font-mono text-[#57606a]">
                  <span className="text-[#1a7f37]">🔒</span>
                  <span>https://kamu.github.io/todolist/</span>
                </div>
                <div className="p-4 space-y-3 bg-white">
                  <h4 className="text-lg font-bold text-[#24292f] m-0">Aplikasi Todolist</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-[#57606a]">
                    <li>Belajar Git Dasar</li>
                    <li>Membuat Pull Request</li>
                    <li>Deploy otomatis ke Pages</li>
                  </ul>
                </div>
              </div>
            )}

            {layarAktif.templat === 'projects' && (
              <div className="space-y-3 text-xs">
                {layarAktif.stageProjects === 'daftar' ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[#d0d7de]">
                      <span className="font-semibold text-sm">Projects</span>
                      <button
                        type="button"
                        id="btn-new-project"
                        data-target-id="btn-new-project"
                        onClick={() => handleClickElement('btn-new-project')}
                        className={`px-3 py-1 bg-[#1f883d] text-white rounded-md font-semibold hover:bg-[#1a7f37] cursor-pointer ${getSorotStyle('btn-new-project')}`}
                      >
                        New project
                      </button>
                    </div>
                    <p className="text-[#57606a] text-center p-6 bg-[#f6f8fa] rounded-md">
                      You don’t have any projects yet. Create one to organize tasks.
                    </p>
                  </div>
                ) : layarAktif.stageProjects === 'pilih_layout' ? (
                  <div className="space-y-3 p-3 bg-[#f6f8fa] rounded-md border border-[#d0d7de]">
                    <span className="font-semibold text-sm block">Select a layout</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        id="btn-board"
                        data-target-id="btn-board"
                        onClick={() => handleClickElement('btn-board')}
                        className={`p-3 bg-white border border-[#d0d7de] rounded-md font-semibold text-center hover:border-[#0969da] cursor-pointer ${getSorotStyle('btn-board')}`}
                      >
                        Board (kanban)
                      </button>
                      <button
                        type="button"
                        id="btn-table"
                        data-target-id="btn-table"
                        onClick={() => handleClickElement('btn-table')}
                        className={`p-3 bg-white border border-[#d0d7de] rounded-md font-semibold text-center hover:border-[#0969da] cursor-pointer ${getSorotStyle('btn-table')}`}
                      >
                        Table
                      </button>
                    </div>
                  </div>
                ) : layarAktif.stageProjects === 'nama_project' ? (
                  <div className="space-y-3 p-3 bg-white border border-[#d0d7de] rounded-md">
                    <span className="font-semibold text-sm block">Project details</span>
                    <div>
                      <label htmlFor="proj-title" className="block text-xs font-semibold mb-1 text-[#24292f]">
                        Title
                      </label>
                      <input
                        id="proj-title"
                        data-target-id="input-title"
                        type="text"
                        value={isianNilai[langkah?.isian || 'namaProject'] ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          const k = langkah?.isian || 'namaProject';
                          setIsianNilai((prev) => ({ ...prev, [k]: val }));
                        }}
                        placeholder="Project name"
                        className="w-full px-2.5 py-1.5 border border-[#d0d7de] rounded-md bg-white text-xs"
                      />
                    </div>
                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        id="btn-create-project"
                        data-target-id="btn-create-project"
                        onClick={() => handleClickElement('btn-create-project')}
                        className={`px-3.5 py-1 bg-[#1f883d] text-white rounded-md font-semibold hover:bg-[#1a7f37] cursor-pointer ${getSorotStyle('btn-create-project')}`}
                      >
                        Create
                      </button>
                    </div>
                  </div>
                ) : layarAktif.stageProjects === 'table' ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[#d0d7de]">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{layarAktif.judul || 'Proyek Todolist Tim'}</span>
                        <span className="px-2 py-0.5 bg-[#f6f8fa] border border-[#d0d7de] rounded text-[11px] font-semibold">Table</span>
                      </div>
                    </div>
                    <div className="border border-[#d0d7de] rounded-md overflow-hidden text-xs divide-y divide-[#d0d7de]">
                      <div className="p-2 bg-[#f6f8fa] font-semibold grid grid-cols-3">
                        <span>Title</span>
                        <span>Status</span>
                        <span>Assignee</span>
                      </div>
                      <div className="p-2 grid grid-cols-3 bg-white">
                        <span>#1 Buat filter selesai</span>
                        <span className="text-[#0969da]">In Progress</span>
                        <span>kamu</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[#d0d7de]">
                      <span className="font-semibold text-sm">{layarAktif.judul || 'Proyek Todolist Tim'}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          id="btn-table"
                          data-target-id="btn-table"
                          onClick={() => handleClickElement('btn-table')}
                          className={`px-2.5 py-1 border border-[#d0d7de] rounded-md font-medium hover:bg-[#f6f8fa] cursor-pointer ${getSorotStyle('btn-table')}`}
                        >
                          Table
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-[#f6f8fa] border border-[#d0d7de] rounded-md p-2">
                        <span className="font-semibold text-[11px] text-[#57606a] block mb-2">Todo</span>
                        <div className="bg-white border border-[#d0d7de] rounded p-1.5 shadow-xs">
                          <span>#1 Filter todolist</span>
                        </div>
                      </div>
                      <div className="bg-[#f6f8fa] border border-[#d0d7de] rounded-md p-2">
                        <span className="font-semibold text-[11px] text-[#57606a] block mb-2">In Progress</span>
                      </div>
                      <div className="bg-[#f6f8fa] border border-[#d0d7de] rounded-md p-2">
                        <span className="font-semibold text-[11px] text-[#57606a] block mb-2">Done</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {layarAktif.templat === 'form_gist' && (
              <div className="space-y-3 text-xs">
                {layarAktif.stageGist === 'selesai' ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[#d0d7de]">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{isiTemplate(layarAktif.deskripsi || 'Fungsi pembantu todolist', nilai, bawaan)}</span>
                        <span className="px-2 py-0.5 bg-[#f6f8fa] border border-[#d0d7de] rounded-full text-[11px] text-[#57606a]">Secret</span>
                      </div>
                      <button
                        type="button"
                        id="btn-new-gist"
                        data-target-id="btn-new-gist"
                        onClick={() => handleClickElement('btn-new-gist')}
                        className={`px-3 py-1 bg-[#1f883d] text-white rounded-md font-semibold hover:bg-[#1a7f37] cursor-pointer ${getSorotStyle('btn-new-gist')}`}
                      >
                        New gist
                      </button>
                    </div>
                    <div className="border border-[#d0d7de] rounded-md overflow-hidden bg-white">
                      <div className="bg-[#f6f8fa] p-2 border-b border-[#d0d7de] font-mono text-xs">
                        {isiTemplate(layarAktif.judul || 'todo-helper.js', nilai, bawaan)}
                      </div>
                      <pre className="p-3 font-mono text-xs text-[#24292f] m-0">
                        function hitungSisa(items) &#123; return items.filter(x =&gt; !x.done).length; &#125;
                      </pre>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <input
                        type="text"
                        id="input-desc"
                        data-target-id="input-desc"
                        placeholder="Gist description..."
                        value={isianNilai['deskripsi'] ?? 'Fungsi pembantu todolist'}
                        onChange={(e) => setIsianNilai((prev) => ({ ...prev, deskripsi: e.target.value }))}
                        className={`w-full px-2.5 py-1.5 border border-[#d0d7de] rounded-md outline-none bg-white ${getSorotStyle('input-desc')}`}
                      />
                    </div>
                    <div className="border border-[#d0d7de] rounded-md overflow-hidden bg-white">
                      <div className="bg-[#f6f8fa] p-2 border-b border-[#d0d7de]">
                        <input
                          type="text"
                          id="input-filename"
                          data-target-id="input-filename"
                          value={isianNilai[langkah?.isian || 'namaFile'] ?? ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const k = langkah?.isian || 'namaFile';
                            setIsianNilai((prev) => ({ ...prev, [k]: val }));
                          }}
                          placeholder="Filename including extension..."
                          className={`w-full max-w-[240px] px-2 py-1 text-xs border border-[#d0d7de] rounded bg-white ${getSorotStyle('input-filename')}`}
                        />
                      </div>
                      <textarea
                        id="input-code"
                        data-target-id="input-code"
                        rows={4}
                        readOnly
                        value="function hitungSisa(items) { return items.filter(x => !x.done).length; }"
                        className="w-full p-2.5 font-mono text-xs outline-none resize-none bg-transparent"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#d0d7de]">
                      <button
                        type="button"
                        id="btn-create-secret"
                        data-target-id="btn-create-secret"
                        onClick={() => handleClickElement('btn-create-secret')}
                        className={`px-3 py-1 bg-[#1f883d] text-white rounded-md font-semibold hover:bg-[#1a7f37] cursor-pointer ${getSorotStyle('btn-create-secret')}`}
                      >
                        Create secret gist
                      </button>
                      <button
                        type="button"
                        id="btn-create-public"
                        data-target-id="btn-create-public"
                        onClick={() => handleClickElement('btn-create-public')}
                        className={`px-3 py-1 bg-[#1f883d] text-white rounded-md font-semibold hover:bg-[#1a7f37] cursor-pointer ${getSorotStyle('btn-create-public')}`}
                      >
                        Create public gist
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {layarAktif.templat === 'form_umum' && (
              <div className="space-y-3">
                <div>
                  <label htmlFor="input-judul" className="block text-xs font-semibold mb-1 text-[#24292f]">
                    Judul
                  </label>
                  <input
                    id="input-judul"
                    data-target-id="input-judul"
                    type="text"
                    readOnly
                    value={layarAktif.judul || ''}
                    className={`w-full px-2.5 py-1.5 text-xs border border-[#d0d7de] rounded-md bg-white ${getSorotStyle('input-judul')}`}
                  />
                </div>

                <div>
                  <label htmlFor="input-isi" className="block text-xs font-semibold mb-1 text-[#24292f]">
                    Isi
                  </label>
                  <textarea
                    id="input-isi"
                    data-target-id="input-isi"
                    rows={3}
                    readOnly
                    value={layarAktif.deskripsi || ''}
                    className={`w-full px-2.5 py-1.5 text-xs border border-[#d0d7de] rounded-md bg-white ${getSorotStyle('input-isi')}`}
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    id="btn-simpan"
                    data-target-id="btn-simpan"
                    onClick={() => handleClickElement('btn-simpan')}
                    className={`px-3 py-1 bg-[#1f883d] text-white rounded-md text-xs font-semibold hover:bg-[#1a7f37] cursor-pointer ${getSorotStyle('btn-simpan')}`}
                  >
                    {String(layarAktif.tombolTeks || 'Simpan')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
