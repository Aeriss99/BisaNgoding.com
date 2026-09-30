import { DaftarNotifikasi } from '../components/layout/MenuAtas';
import { useNotifikasi } from '../lib/useNotifikasi';

export default function NotifikasiPage() {
  const { daftar, dibaca, tandaiDibaca, tandaiSemua } = useNotifikasi();
  return (
    <div className="max-w-[760px] mx-auto px-4 md:px-8 py-8 lg:py-12 flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="m-0 font-space text-4xl font-bold">Notifikasi</h1>
        {daftar.length > 0 && (
          <button type="button" onClick={tandaiSemua} className="text-sm font-semibold underline min-h-[44px]">
            Tandai semua dibaca
          </button>
        )}
      </div>
      <div className="border-[3px] border-[var(--color-text-main)] rounded-[14px] bg-white shadow-[6px_6px_0_var(--color-text-main)] overflow-hidden [&_li:first-child>*]:border-t-0">
        <DaftarNotifikasi daftar={daftar} dibaca={dibaca} onBuka={(n) => tandaiDibaca(n.id)} />
      </div>
    </div>
  );
}
