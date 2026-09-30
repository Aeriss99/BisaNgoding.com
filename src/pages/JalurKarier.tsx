import JalurBelajar from '../components/JalurBelajar';

export default function JalurKarier() {
  return (
    <div className="max-w-[1312px] mx-auto px-4 md:px-8 lg:px-16 py-8 lg:py-16 flex flex-col gap-6">
      <div className="flex flex-col gap-2.5">
        <h1 className="m-0 font-space text-4xl lg:text-[64px] lg:leading-[68px] font-bold">Mau jadi apa?</h1>
        <p className="m-0 text-base lg:text-xl lg:leading-[30px] text-[#3d3d3d] max-w-[820px]">
          Pilih jalur karier. Kami susun urutan belajarnya dari nol, dan kelas mana yang dipakai di setiap tahap.
        </p>
      </div>
      <JalurBelajar tampilkanProgres={true} />
    </div>
  );
}
