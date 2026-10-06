export function tanggalJakarta(d: Date): string {
  const parts = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;
  return `${year}-${month}-${day}`;
}

export function perluPengingat(data: { streak?: number; lastActiveDate?: string } | null, hariIni: string): boolean {
  if (!data || !data.streak || data.streak <= 0 || !data.lastActiveDate) return false;
  
  const dateKemarin = new Date(hariIni);
  dateKemarin.setDate(dateKemarin.getDate() - 1);
  const kemarinStr = tanggalJakarta(dateKemarin);
  
  return data.lastActiveDate === kemarinStr;
}

export function modulBaru(semua: {id:string}[], sudah: string[]): {id:string}[] {
  const sudahSet = new Set(sudah);
  return semua.filter(m => !sudahSet.has(m.id));
}

export function templatPengingat(nama: string, streak: number, urlSitus: string, urlBerhenti: string) {
  const namaPanggilan = nama ? nama.split(' ')[0] : 'Kawan';
  return {
    subjek: `🔥 Streak ${streak} harimu hampir putus!`,
    teks: `Halo ${namaPanggilan},\n\nJangan biarkan streak belajarmu putus hari ini! Yuk lanjutkan belajarmu.\n\nLanjut belajar: ${urlSitus}\n\nBerhenti langganan: ${urlBerhenti}`,
    html: `<div style="font-family: sans-serif; color: #111;">
      <h2 style="color: #c2410c;">Halo ${namaPanggilan},</h2>
      <p>Jangan biarkan <b>streak ${streak} hari</b>-mu putus hari ini! Yuk luangkan waktu 5 menit untuk belajar.</p>
      <a href="${urlSitus}" style="display: inline-block; padding: 10px 20px; background: #ffd93d; color: #111; text-decoration: none; font-weight: bold; border-radius: 8px; border: 2px solid #111;">Lanjut belajar →</a>
      <p style="margin-top: 30px; font-size: 12px; color: #5a5a5a;">Tidak ingin menerima pengingat lagi? <a href="${urlBerhenti}">Berhenti langganan</a></p>
    </div>`
  };
}

export function templatModulBaru(nama: string, daftar: {judul:string, kelas:string, url:string}[], urlSitus: string, urlBerhenti: string) {
  const namaPanggilan = nama ? nama.split(' ')[0] : 'Kawan';
  const htmlList = daftar.map(m => `<li><b>${m.kelas}</b>: <a href="${m.url}">${m.judul}</a></li>`).join('');
  const textList = daftar.map(m => `- ${m.kelas}: ${m.judul} (${m.url})`).join('\n');
  
  return {
    subjek: `📚 Modul baru di BisaNgoding!`,
    teks: `Halo ${namaPanggilan},\n\nAda modul baru yang siap kamu pelajari:\n${textList}\n\nBelajar sekarang: ${urlSitus}\n\nBerhenti langganan: ${urlBerhenti}`,
    html: `<div style="font-family: sans-serif; color: #111;">
      <h2 style="color: #1b7a3e;">Halo ${namaPanggilan},</h2>
      <p>Ada modul baru yang siap kamu pelajari:</p>
      <ul>${htmlList}</ul>
      <a href="${urlSitus}" style="display: inline-block; padding: 10px 20px; background: #ffd93d; color: #111; text-decoration: none; font-weight: bold; border-radius: 8px; border: 2px solid #111; margin-top: 10px;">Lihat semua kelas →</a>
      <p style="margin-top: 30px; font-size: 12px; color: #5a5a5a;">Tidak ingin menerima info modul baru? <a href="${urlBerhenti}">Berhenti langganan</a></p>
    </div>`
  };
}
