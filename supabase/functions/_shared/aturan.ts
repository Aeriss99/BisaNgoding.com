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

export function perluPengingat(data: { streak?: number; lastActiveDate?: string; streakDate?: string } | null, hariIni: string): boolean {
  // streakDate = tanggal terakhir menyelesaikan materi (dasar streak). Data lama hanya punya lastActiveDate.
  const tanggal = data?.streakDate ?? data?.lastActiveDate;
  if (!data || !data.streak || data.streak <= 0 || !tanggal) return false;

  const dateKemarin = new Date(hariIni);
  dateKemarin.setDate(dateKemarin.getDate() - 1);
  const kemarinStr = tanggalJakarta(dateKemarin);

  return tanggal === kemarinStr;
}

export function modulBaru(semua: {id:string}[], sudah: string[]): {id:string}[] {
  const sudahSet = new Set(sudah);
  return semua.filter(m => !sudahSet.has(m.id));
}

function escapeHtml(unsafe: string) {
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function baseTemplate(args: { preheader: string, bannerTitle: string, bannerDesc: string, greeting: string, content: string, infoBox: string, ctaText: string, ctaUrl: string, urlSitus: string, urlBerhenti: string, jenis: string }) {
  const tahun = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <style>
    @media (max-width: 620px) {
      .container { padding: 10px !important; }
      .card { padding: 20px !important; }
      .btn { width: 100% !important; box-sizing: border-box !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #fbf7ee; font-family: Arial, Helvetica, sans-serif; -webkit-font-smoothing: antialiased;">
  <div style="display:none; max-height:0; overflow:hidden; font-size:1px; line-height:1px; color:#fbf7ee;">
    ${args.preheader}
  </div>
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #fbf7ee; width: 100%;">
    <tr>
      <td align="center" class="container" style="padding: 40px 20px;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e6e1d6; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="background-color: #ffd93d; height: 4px; line-height: 4px; font-size: 4px;">&nbsp;</td>
          </tr>
          <tr>
            <td class="card" style="padding: 32px; text-align: left;">
              <table border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td>
                    <img src="${args.urlSitus}/pwa-192x192.png" width="40" height="40" alt="BisaNgoding" style="display: block; border: 0;" />
                  </td>
                  <td style="padding-left: 12px; font-size: 20px; font-weight: bold; color: #111111; letter-spacing: 0.5px;">
                    BISANGODING
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 16px 0; font-size: 16px; color: #111111;">${args.greeting}</p>
              <table border="0" cellspacing="0" cellpadding="0" width="100%" style="background-color: #ffd93d; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 28px; text-align: center;">
                    <h1 style="margin: 0 0 8px 0; font-size: 24px; color: #111111; line-height: 1.3;">
                      ${args.bannerTitle}
                    </h1>
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #111111;">
                      ${args.bannerDesc}
                    </p>
                    <table border="0" cellspacing="0" cellpadding="0" align="center" style="background-color: #ffffff; border-radius: 6px; padding: 4px 12px;">
                      <tr>
                        <td>
                          <img src="${args.urlSitus}/pwa-192x192.png" width="20" height="20" alt="BisaNgoding" style="display: block; border: 0;" />
                        </td>
                        <td style="padding-left: 8px; font-size: 12px; font-weight: bold; color: #111111;">
                          BISANGODING
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              ${args.content}
              <table border="0" cellspacing="0" cellpadding="0" width="100%" style="background-color: #fff3b8; border-left: 4px solid #ffd93d; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px;">
                    ${args.infoBox}
                  </td>
                </tr>
              </table>
              <table border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 16px; width: 100%;">
                <tr>
                  <td align="center">
                    <table border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                      <tr>
                        <td align="center" style="border-radius: 6px; background-color: #111111;">
                          <a href="${args.ctaUrl}" class="btn" target="_blank" style="display: inline-block; padding: 14px 28px; font-size: 16px; font-weight: bold; color: #ffffff; text-decoration: none; border-radius: 6px;">
                            ${args.ctaText}
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 32px 0; font-size: 13px; color: #5a5a5a; text-align: center;">
                Tombol tidak berfungsi? Salin tautan ini:<br/>
                <a href="${args.ctaUrl}" style="color: #1b5fd1; word-break: break-all;">${args.ctaUrl}</a>
              </p>
              <p style="margin: 0; font-size: 16px; color: #111111; line-height: 1.5;">
                Salam,<br/>Tim BisaNgoding
              </p>
            </td>
          </tr>
        </table>
        <table border="0" cellspacing="0" cellpadding="0" width="100%" style="max-width: 600px; margin-top: 24px;">
          <tr>
            <td align="center" style="padding: 0 20px;">
              <img src="${args.urlSitus}/pwa-192x192.png" width="48" height="48" alt="BisaNgoding" style="display: block; margin-bottom: 8px; opacity: 0.5;" />
              <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: bold; color: #5a5a5a; letter-spacing: 1px;">
                BISANGODING
              </p>
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #5a5a5a; line-height: 1.5;">
                Kamu menerima email ini karena terdaftar di BisaNgoding dengan akun Google.
              </p>
              <p style="margin: 0 0 16px 0; font-size: 12px; color: #5a5a5a;">
                <a href="${args.urlBerhenti}" style="color: #1b5fd1; text-decoration: underline;">Berhenti menerima ${args.jenis === 'streak' ? 'pengingat streak' : 'info modul baru'}</a> | 
                <a href="${args.urlSitus}/#/profile" style="color: #1b5fd1; text-decoration: underline;">Atur notifikasi</a>
              </p>
              <p style="margin: 0; font-size: 12px; color: #5a5a5a;">
                © ${tahun} BisaNgoding.com
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function templatPengingat(nama: string, streak: number, urlSitus: string, urlBerhenti: string) {
  const safeNama = escapeHtml(nama || "");
  const namaPanggilan = safeNama ? safeNama.split(' ')[0] : 'Kawan';
  
  const preheader = `Pertahankan rutinitas belajar dengan menyelesaikan satu materi hari ini.`;
  const bannerTitle = `Streak ${streak} hari kamu berlanjut.`;
  const bannerDesc = `Sisihkan waktu hari ini untuk menjaga streak belajarmu.`;
  const greeting = safeNama ? `Halo ${safeNama},` : `Halo,`;
  
  const content = `
    <p style="margin: 0 0 16px 0; font-size: 16px; color: #111111; line-height: 1.5;">
      Kami melihat kamu belum beraktivitas di platform hari ini. <b>Pertahankan rutinitas belajarmu.</b>
    </p>
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #111111; line-height: 1.5;">
      Luangkan waktu sedikit saja untuk membuka <a href="${urlSitus}" style="color: #1b5fd1; text-decoration: none;">halaman kelas</a> dan selesaikan satu materi. Konsistensi adalah kunci menguasai pemrograman.
    </p>
  `;
  
  const infoBox = `
    <p style="margin: 0 0 8px 0; font-size: 16px; color: #111111;">
      Streak saat ini: <b>${streak} hari</b>
    </p>
    <p style="margin: 0; font-size: 14px; color: #5a5a5a;">
      Batas: hari ini pukul 23.59 WIB
    </p>
  `;
  
  const html = baseTemplate({
    preheader, bannerTitle, bannerDesc, greeting, content, infoBox,
    ctaText: 'Lanjutkan belajar', ctaUrl: urlSitus, urlSitus, urlBerhenti, jenis: 'streak'
  });
  
  const teks = `Halo ${namaPanggilan},\n\nStreak ${streak} hari kamu berlanjut. Sisihkan waktu hari ini untuk menjaga streak belajarmu.\n\nKami melihat kamu belum beraktivitas di platform hari ini. Pertahankan rutinitas belajarmu.\nLuangkan waktu sedikit saja untuk membuka halaman kelas dan selesaikan satu materi.\n\nStreak saat ini: ${streak} hari\nBatas: hari ini pukul 23.59 WIB\n\nLanjutkan belajar: ${urlSitus}\n\nBerhenti langganan: ${urlBerhenti}`;
  
  return { subjek: `Pengingat belajar: streak ${streak} hari kamu berakhir hari ini`, teks, html };
}

export function templatModulBaru(nama: string, daftar: {judul:string, kelas:string, url:string}[], urlSitus: string, urlBerhenti: string) {
  const safeNama = escapeHtml(nama || "");
  const namaPanggilan = safeNama ? safeNama.split(' ')[0] : 'Kawan';
  
  const preheader = `${daftar.length} modul baru telah tersedia di BisaNgoding.`;
  const bannerTitle = `Ada materi baru untuk dipelajari.`;
  const bannerDesc = `${daftar.length} modul baru siap diakses di BisaNgoding.`;
  const greeting = safeNama ? `Halo ${safeNama},` : `Halo,`;
  
  const content = `
    <p style="margin: 0 0 16px 0; font-size: 16px; color: #111111; line-height: 1.5;">
      Tim kami telah merilis pembaruan kurikulum. <b>Sekarang ada materi baru yang tersedia untuk meningkatkan keahlian pemrograman kamu.</b>
    </p>
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #111111; line-height: 1.5;">
      Klik tombol di bawah ini untuk melihat detailnya di <a href="${urlSitus}" style="color: #1b5fd1; text-decoration: none;">katalog kelas</a>.
    </p>
  `;
  
  let infoBoxHtml = '';
  const maxTampil = 5;
  for(let i=0; i<Math.min(daftar.length, maxTampil); i++) {
    const d = daftar[i];
    const margin = i === Math.min(daftar.length, maxTampil) - 1 ? '0' : '12px';
    infoBoxHtml += `
      <p style="margin: 0 0 ${margin} 0; font-size: 16px; color: #111111;">
        <b><a href="${d.url}" style="color: #1b5fd1; text-decoration: none;">${escapeHtml(d.judul)}</a></b><br/>
        <span style="font-size: 14px; color: #5a5a5a;">${escapeHtml(d.kelas)}</span>
      </p>
    `;
  }
  if (daftar.length > maxTampil) {
    infoBoxHtml += `
      <p style="margin: 12px 0 0 0; font-size: 14px; color: #111111; font-weight: bold;">
        + ${daftar.length - maxTampil} modul lainnya
      </p>
    `;
  }
  
  const html = baseTemplate({
    preheader, bannerTitle, bannerDesc, greeting, content, infoBox: infoBoxHtml,
    ctaText: 'Lihat modul baru', ctaUrl: urlSitus, urlSitus, urlBerhenti, jenis: 'modul_baru'
  });
  
  const safeDaftar0 = escapeHtml(daftar[0].judul);
  const subjekModul = daftar.length > 1 
    ? `Modul baru di BisaNgoding: ${safeDaftar0} dan ${daftar.length - 1} lainnya` 
    : `Modul baru di BisaNgoding: ${safeDaftar0}`;
    
  const textList = daftar.map(m => `- ${m.kelas}: ${m.judul} (${m.url})`).join('\n');
  const teks = `Halo ${namaPanggilan},\n\nAda materi baru untuk dipelajari. ${daftar.length} modul baru telah tersedia di BisaNgoding.\n\nTim kami telah merilis pembaruan kurikulum. Sekarang ada materi baru yang tersedia untuk meningkatkan keahlian pemrograman kamu.\n\nDaftar modul baru:\n${textList}\n\nLihat modul baru: ${urlSitus}\n\nBerhenti langganan: ${urlBerhenti}`;
  
  return { subjek: subjekModul, teks, html };
}
