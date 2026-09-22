export const ERROR_HINTS: Record<string, string> = {
  "';' expected": "Ada perintah yang belum diakhiri titik koma. Cek baris yang ditunjuk atau baris sebelumnya.",
  "cannot find symbol": "Java tidak mengenal nama itu. Cek salah ketik, huruf besar-kecil, atau apakah variabelnya sudah dibuat.",
  "incompatible types": "Tipe data tidak cocok, misalnya mengisi teks ke variabel int.",
  "missing return statement": "Method yang punya tipe kembalian belum mengembalikan nilai di semua kemungkinan.",
  "class, interface, enum, or record expected": "Ada kurung kurawal yang kelebihan atau kurang.",
  "reached end of file while parsing": "Ada kurung kurawal { yang belum ditutup.",
  "unclosed string literal": "Tanda kutip teks belum ditutup.",
  "might not have been initialized": "Variabel dipakai sebelum diberi nilai.",
  "already defined": "Nama variabel atau method yang sama dibuat dua kali.",
  "non-static": "Method static mencoba memakai sesuatu yang bukan static.",
  "ArithmeticException: / by zero": "Program membagi dengan nol.",
  "ArrayIndexOutOfBoundsException": "Mengakses index array di luar batas. Ingat, index terakhir adalah panjang dikurangi 1.",
  "NullPointerException": "Memakai object yang masih null (belum dibuat dengan new atau belum diisi).",
  "NumberFormatException": "Mengubah teks yang bukan angka menjadi angka.",
  "InputMismatchException": "Scanner meminta angka tapi yang diberikan bukan angka.",
  "NoSuchElementException": "Program meminta input lebih banyak dari yang tersedia.",
  "StackOverflowError": "Method rekursif tidak pernah berhenti. Cek base case-nya.",
  "ClassCastException": "Casting object ke tipe yang bukan tipe aslinya. Cek dengan instanceof dulu."
};

export function getErrorHint(errorMessage: string): string | null {
  for (const [pattern, explanation] of Object.entries(ERROR_HINTS)) {
    if (errorMessage.includes(pattern)) {
      // For "non-static ... static context", we need a bit of a manual check if it's split
      if (pattern === "non-static" && errorMessage.includes("static context")) {
        return explanation;
      }
      if (pattern !== "non-static") {
        return explanation;
      }
    }
  }
  return null;
}