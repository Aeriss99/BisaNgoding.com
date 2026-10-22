import { Fragment } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Ikon } from '../components/ui/IkonDesain';
import { BarisStatus, BungkusKartu, KartuKelasJalur, Lencana, warnaKelas } from '../components/kelas/KartuKelas';
import { WARNA_JALUR, cariJalur, dataJalur, statusKartu } from '../lib/jalur';
import type { JalurKarier as TipeJalur, TahapJalur } from '../types/schema';

/* ───────────────────────── potongan kecil */
function Atau({ hp = false }: { hp?: boolean }) {
  return hp ? (
    <div className="self-start px-2.5 py-1 border-2 border-[var(--color-text-main)] rounded-full font-mono text-[12px] font-bold">ATAU</div>
  ) : (
    <div className="self-center px-3 py-1.5 border-2 border-[var(--color-text-main)] rounded-full bg-[var(--color-bg-base)] font-mono text-[13px] font-bold">ATAU</div>
  );
}

function Plus({ hp = false }: { hp?: boolean }) {
  return hp ? (
    <div className="font-space text-[22px] leading-[22px] font-bold">+</div>
  ) : (
    <div className="self-center font-space text-[28px] font-bold">+</div>
  );
}

function KartuTahap({ tahap, hp }: { tahap: TahapJalur; hp: boolean }) {
  return (
    <>
      {tahap.grup.map((grup, gi) => (
        <Fragment key={gi}>
          {gi > 0 && <Atau hp={hp} />}
          {grup.map((item, ki) => (
            <Fragment key={`${item.kelas}-${ki}`}>
              {ki > 0 && <Plus hp={hp} />}
              <KartuKelasJalur status={statusKartu(item)} topik={item.topik} warna={warnaKelas(item.kelas)} />
            </Fragment>
          ))}
        </Fragment>
      ))}
    </>
  );
}

/* ───────────────────────── kotak Fondasi dan cara membaca */
function KotakFondasi() {
  return (
    <aside className="box-border w-full lg:w-[380px] border-[3px] border-[var(--color-text-main)] rounded-[14px] bg-white shadow-[6px_6px_0_var(--color-text-main)] overflow-hidden flex flex-col">
      <div className="px-5 py-[18px] bg-[var(--color-landing-magenta)] border-b-[3px] border-[var(--color-text-main)]">
        <div className="font-mono text-[13px] font-bold tracking-[1px]">UNTUK SEMUA JALUR</div>
        <div className="font-space text-[26px] leading-8 font-bold">Fondasi</div>
      </div>
      <div className="p-5 flex flex-col gap-3.5">
        <p className="m-0 text-[15px] leading-[22px] text-[#3d3d3d]">
          Tidak masuk jalur mana pun karena dipakai di <b>semua</b> jalur. Pelajari pelan-pelan, sambil jalan.
        </p>
        {dataJalur.fondasi.map((item) => {
          const st = statusKartu(item);
          const ada = st.jenis === 'tersedia' || st.jenis === 'sebagian';
          return (
            <BungkusKartu
              key={item.kelas}
              url={st.url}
              className={`flex gap-3 p-3.5 border-2 border-[var(--color-text-main)] rounded-[10px] ${ada ? 'border-solid bg-white' : 'border-dashed bg-[var(--color-soon)]'}`}
            >
              <Lencana kode={st.kode} warna={warnaKelas(item.kelas)} redup={!ada} ukuran={40} />
              <div className="flex flex-col gap-1">
                <div className="font-space text-[18px] font-bold">{st.nama}</div>
                <div className="text-[14px] leading-5 text-[#3d3d3d]">{item.topik}</div>
                <BarisStatus status={st} kecil />
              </div>
            </BungkusKartu>
          );
        })}
      </div>
    </aside>
  );
}

function CaraMembaca() {
  const baris = [
    {
      contoh: <div className="w-7 h-5 box-border border-[3px] border-[var(--color-text-main)] rounded bg-white shadow-[2px_2px_0_var(--color-text-main)]" />,
      teks: 'Kelas sudah tersedia',
    },
    {
      contoh: <div className="w-7 h-5 box-border border-[3px] border-dashed border-[var(--color-soon-border)] rounded bg-[var(--color-soon)]" />,
      teks: 'Segera hadir',
    },
    {
      contoh: <div className="px-1.5 py-0.5 border-2 border-[var(--color-text-main)] rounded-full font-mono text-[11px] font-bold">ATAU</div>,
      teks: 'Pilih salah satu',
    },
    { contoh: <div className="w-7 text-center font-space text-[22px] font-bold">+</div>, teks: 'Pelajari keduanya' },
  ];
  return (
    <div className="box-border w-[380px] p-5 border-2 border-[var(--color-text-main)] rounded-xl flex flex-col gap-3">
      <div className="font-mono text-[13px] font-bold tracking-[1px]">CARA MEMBACA</div>
      {baris.map((b) => (
        <div key={b.teks} className="flex items-center gap-3 text-[15px]">
          {b.contoh}
          <span>{b.teks}</span>
        </div>
      ))}
      <Link to="/kelas" className="mt-1.5 self-start font-space font-bold text-[16px] flex items-center gap-2 underline text-[var(--color-text-main)]">
        Lihat semua kelas <Ikon nama="arrow" ukuran={18} tebal={2} />
      </Link>
    </div>
  );
}

/* ───────────────────────── desktop (≥1024px) */
function KartuPilihJalur({ j, dipilih, onPilih }: { j: TipeJalur; dipilih: boolean; onPilih: () => void }) {
  const warna = WARNA_JALUR[j.warna];
  return (
    <button
      type="button"
      onClick={onPilih}
      aria-pressed={dipilih}
      style={{ background: dipilih ? warna.utama : '#ffffff' }}
      className={`relative min-w-0 box-border p-6 rounded-[14px] text-left flex flex-col gap-3 text-[var(--color-text-main)] cursor-pointer ${
        dipilih
          ? 'border-4 border-[var(--color-text-main)] shadow-[8px_8px_0_var(--color-text-main)]'
          : 'border-[3px] border-[var(--color-text-main)] shadow-[4px_4px_0_var(--color-text-main)] hover:-translate-y-0.5 transition-transform'
      }`}
    >
      {dipilih && (
        <span className="absolute -top-3.5 right-4 px-2.5 py-1 bg-[var(--color-text-main)] text-white font-mono text-[12px] font-bold rounded-md">
          DIPILIH
        </span>
      )}
      <span className="flex items-center gap-3">
        <span className="w-[52px] h-[52px] shrink-0 box-border border-[3px] border-[var(--color-text-main)] rounded-xl bg-white flex items-center justify-center">
          <Ikon nama={j.ikon} ukuran={28} tebal={2} />
        </span>
        <span className="font-space text-[26px] leading-[30px] font-bold">{j.judul}</span>
      </span>
      <span className="text-[16px] leading-6">{j.ringkas}</span>
      <span className="flex items-center gap-2 font-mono text-[14px] font-bold">
        {j.tahap.length} {j.bebas ? 'topik' : 'tahap'} <Ikon nama="arrow" ukuran={18} tebal={2} />
      </span>
    </button>
  );
}

function TahapDesktop({ tahap, nomor, warna, terakhir, label }: { tahap: TahapJalur; nomor: number; warna: string; terakhir: boolean; label: string }) {
  return (
    <div className="flex gap-7">
      <div className="w-14 shrink-0 flex flex-col items-center">
        <div
          style={{ background: warna }}
          className="w-14 h-14 shrink-0 box-border border-[3px] border-[var(--color-text-main)] rounded-full flex items-center justify-center font-bungee text-[22px]"
        >
          {nomor}
        </div>
        {!terakhir && <div className="w-1 grow bg-[var(--color-text-main)] mt-2" />}
      </div>
      <div className="grow min-w-0 pb-12 flex flex-col gap-2.5">
        <div className="font-mono text-[13px] font-bold tracking-[1px] text-[#5a5a5a] pt-1.5">{label} {nomor}</div>
        <h3 className="m-0 font-space text-[30px] leading-9 font-bold">{tahap.judul}</h3>
        <p className="m-0 text-[16px] leading-6 text-[#3d3d3d] max-w-[720px]">{tahap.deskripsi}</p>
        <div className="flex flex-wrap gap-4 mt-2.5">
          <KartuTahap tahap={tahap} hp={false} />
        </div>
      </div>
    </div>
  );
}

function Desktop({ jalur, pilih }: { jalur: TipeJalur; pilih: (id: string) => void }) {
  const warna = WARNA_JALUR[jalur.warna];
  return (
    <div className="hidden lg:flex flex-col">
      <main className="px-8 xl:px-16 pt-16 flex flex-col gap-12">
        <section className="flex flex-col gap-3.5">
          <h1 className="m-0 font-space text-[64px] leading-[68px] font-bold">Mau jadi apa?</h1>
          <p className="m-0 text-[20px] leading-[30px] text-[#3d3d3d] max-w-[820px]">
            Pilih jalur karier. Kami susun urutan belajarnya dari nol, dan kelas mana yang dipakai di setiap tahap.
          </p>
        </section>
        <section className="grid grid-cols-2 xl:grid-cols-4 gap-5 xl:gap-6" aria-label="Pilih jalur karier">
          {dataJalur.jalur.map((j) => (
            <KartuPilihJalur key={j.id} j={j} dipilih={j.id === jalur.id} onPilih={() => pilih(j.id)} />
          ))}
        </section>
        <section className="flex gap-10 xl:gap-14 items-start">
          <div className="grow min-w-0 flex flex-col gap-9">
            <div style={{ background: warna.muda }} className="flex flex-col gap-2.5 p-6 border-[3px] border-[var(--color-text-main)] rounded-[14px]">
              <div className="font-mono text-[13px] font-bold tracking-[1px]">JALUR {jalur.judul.toUpperCase()}</div>
              <p className="m-0 text-[18px] leading-7">{jalur.intro}</p>
            </div>
            <div className="flex flex-col">
              {jalur.tahap.map((t, i) => (
                <TahapDesktop key={t.judul} tahap={t} nomor={i + 1} warna={warna.utama} terakhir={i === jalur.tahap.length - 1} label={jalur.bebas ? 'TOPIK' : 'TAHAP'} />
              ))}
            </div>
          </div>
          <div className="w-[380px] shrink-0 flex flex-col gap-7">
            <KotakFondasi />
            <CaraMembaca />
          </div>
        </section>
      </main>
      <footer className="mt-16 px-8 xl:px-16 py-6 border-t-[3px] border-[var(--color-text-main)] text-[14px] text-[#5a5a5a]">
        BisaNgoding.com · belajar coding gratis dalam bahasa Indonesia
      </footer>
    </div>
  );
}

/* ───────────────────────── HP (<1024px) */
function Hp({ jalur, pilih }: { jalur: TipeJalur; pilih: (id: string) => void }) {
  const warna = WARNA_JALUR[jalur.warna];
  return (
    <div className="lg:hidden flex flex-col">
      <main className="px-4 pt-7 pb-10 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="m-0 font-space text-[36px] leading-10 font-bold">Mau jadi apa?</h1>
          <p className="m-0 text-[15px] leading-[22px] text-[#3d3d3d]">Pilih jalur karier, lalu ikuti tahapnya dari atas.</p>
        </div>
        <div className="flex flex-col gap-2.5" aria-label="Pilih jalur karier">
          {dataJalur.jalur.map((j) => {
            const dipilih = j.id === jalur.id;
            return (
              <button
                key={j.id}
                type="button"
                onClick={() => pilih(j.id)}
                aria-pressed={dipilih}
                style={{ background: dipilih ? WARNA_JALUR[j.warna].utama : '#ffffff' }}
                className={`flex items-center gap-3 p-3.5 min-h-11 box-border rounded-xl text-left text-[var(--color-text-main)] border-[var(--color-text-main)] ${
                  dipilih ? 'border-[3px] shadow-[4px_4px_0_var(--color-text-main)]' : 'border-2'
                }`}
              >
                <Ikon nama={j.ikon} ukuran={24} tebal={2} />
                <span className="flex flex-col gap-0.5 grow">
                  <span className="font-space text-[18px] font-bold">{j.judul}</span>
                  <span className="text-[13px] leading-[18px] text-[#3d3d3d]">{j.ringkas}</span>
                </span>
                {dipilih && <Ikon nama="check" ukuran={20} tebal={3} />}
              </button>
            );
          })}
        </div>
        <div style={{ background: warna.muda }} className="p-4 border-2 border-[var(--color-text-main)] rounded-xl text-[14px] leading-[21px]">
          {jalur.intro}
        </div>
        <div className="flex flex-col">
          {jalur.tahap.map((t, i) => (
            <div key={t.judul} className="flex gap-3.5">
              <div className="w-9 shrink-0 flex flex-col items-center">
                <div
                  style={{ background: warna.utama }}
                  className="w-9 h-9 shrink-0 box-border border-[3px] border-[var(--color-text-main)] rounded-full flex items-center justify-center font-bungee text-[15px]"
                >
                  {i + 1}
                </div>
                {i < jalur.tahap.length - 1 && <div className="w-[3px] grow bg-[var(--color-text-main)] mt-1.5" />}
              </div>
              <div className="grow min-w-0 pb-8 flex flex-col gap-2">
                <div className="font-mono text-[11px] font-bold tracking-[1px] text-[#5a5a5a] pt-0.5">{jalur.bebas ? 'TOPIK' : 'TAHAP'} {i + 1}</div>
                <h3 className="m-0 font-space text-[22px] leading-[26px] font-bold">{t.judul}</h3>
                <p className="m-0 text-[14px] leading-5 text-[#3d3d3d]">{t.deskripsi}</p>
                <div className="flex flex-col gap-2.5 mt-1.5">
                  <KartuTahap tahap={t} hp />
                </div>
              </div>
            </div>
          ))}
        </div>
        <KotakFondasi />
        <Link to="/kelas" className="self-start py-3 font-space font-bold text-[16px] flex items-center gap-2 underline text-[var(--color-text-main)]">
          Lihat semua kelas <Ikon nama="arrow" ukuran={18} tebal={2} />
        </Link>
      </main>
    </div>
  );
}

/** Beranda dan halaman Jalur Karier: pilih jalur, lihat tahapannya, dan kotak Fondasi. */
export default function JalurKarier() {
  const [params, setParams] = useSearchParams();
  const jalur = cariJalur(params.get('jalur'));
  const pilih = (id: string) => {
    const baru = new URLSearchParams(params);
    baru.set('jalur', id);
    setParams(baru, { replace: true });
  };
  return (
    <div className="leading-[normal]">
      <Desktop jalur={jalur} pilih={pilih} />
      <Hp jalur={jalur} pilih={pilih} />
    </div>
  );
}
