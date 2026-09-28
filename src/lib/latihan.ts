export function cekUbin(pilihan: string[], answers: string[][]): boolean {
  const normPilihan = pilihan.map(s => s.trim().toLowerCase());
  return answers.some(ans => {
    if (ans.length !== normPilihan.length) return false;
    return ans.every((a, i) => a.trim().toLowerCase() === normPilihan[i]);
  });
}

/**
 * Menyamakan bentuk jawaban sebelum dibandingkan: huruf kecil, apostrof miring jadi lurus,
 * semua tanda baca (termasuk koma di tengah kalimat) dibuang, spasi dirapikan.
 * "I'm fine, thank you." dan "i'm fine thank you" dianggap sama.
 * Apostrof dipertahankan karena bagian dari kata (I'm, don't).
 * Skrip pembuat materi memakai aturan yang sama persis.
 */
export function normalisasi(s: string): string {
  return s
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[.,!?;:"“”()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const d = Array.from({length: m+1}, () => Array(n+1).fill(0));
  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let j = 1; j <= n; j++) {
    for (let i = 1; i <= m; i++) {
      if (a[i-1] === b[j-1]) d[i][j] = d[i-1][j-1];
      else d[i][j] = Math.min(d[i-1][j] + 1, d[i][j-1] + 1, d[i-1][j-1] + 1);
    }
  }
  return d[m][n];
}

export function cekKetik(input: string, answers: string[]): { hasil: 'benar' | 'hampir' | 'salah'; terdekat: string } {
  const normInput = normalisasi(input);
  let bestDist = Infinity;
  let bestAns = '';
  
  for (const ans of answers) {
    const normAns = normalisasi(ans);
    if (normInput === normAns) {
      return { hasil: 'benar', terdekat: ans };
    }
    const dist = levenshtein(normInput, normAns);
    if (dist < bestDist) {
      bestDist = dist;
      bestAns = ans;
    }
  }
  
  if (bestAns === '') {
    return { hasil: 'salah', terdekat: '' };
  }

  const normBestAns = normalisasi(bestAns);
  const maxDist = Math.max(1, Math.floor(normBestAns.length / 10));
  if (bestDist <= maxDist) {
    return { hasil: 'hampir', terdekat: bestAns };
  }
  return { hasil: 'salah', terdekat: bestAns };
}

export interface StatusLatihan { 
  antrean: number[]; 
  posisi: number; 
  salahPertama: Set<number>; 
  selesai: Set<number>; 
}

export function mulaiLatihan(jumlahSoal: number): StatusLatihan {
  return {
    antrean: Array.from({length: jumlahSoal}, (_, i) => i),
    posisi: 0,
    salahPertama: new Set(),
    selesai: new Set(),
  };
}

export function setelahJawab(s: StatusLatihan, benar: boolean): StatusLatihan {
  const soalIndex = s.antrean[s.posisi];
  const newSelesai = new Set(s.selesai);
  const newSalahPertama = new Set(s.salahPertama);
  let newAntrean = [...s.antrean];
  
  if (benar) {
    newSelesai.add(soalIndex);
  } else {
    newSalahPertama.add(soalIndex);
    const sisaAntrean = newAntrean.slice(s.posisi + 1);
    if (!sisaAntrean.includes(soalIndex)) {
      newAntrean.push(soalIndex);
    }
  }
  
  return {
    antrean: newAntrean,
    posisi: s.posisi + 1,
    salahPertama: newSalahPertama,
    selesai: newSelesai,
  };
}

export function progres(s: StatusLatihan, jumlahSoal: number): number {
  if (jumlahSoal === 0) return 0;
  return s.selesai.size / jumlahSoal;
}

export function sudahSelesai(s: StatusLatihan): boolean {
  return s.posisi >= s.antrean.length;
}
