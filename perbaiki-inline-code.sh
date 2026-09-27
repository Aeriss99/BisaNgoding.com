#!/usr/bin/env bash
# Inline code: hilangkan tanda ` dan ganti latar jadi #F4EB6C, huruf tetap hitam.
# Jalankan DARI ROOT PROJECT:   bash perbaiki-inline-code.sh
set -e

if [ ! -f package.json ] || [ ! -d src ]; then
  echo "ERROR: jalankan dari folder root project (yang ada package.json dan src/)."
  exit 1
fi

CSS=src/index.css
TSX=src/pages/Lesson.tsx
PENANDA="inline code: tanpa tanda backtick"

if grep -q "$PENANDA" "$CSS"; then
  echo "CSS sudah pernah dipasang, dilewati."
else
  cat >> "$CSS" <<'CSS_EOF'

/* inline code: tanpa tanda backtick, latar kuning, huruf hitam.
   Plugin @tailwindcss/typography secara bawaan menambahkan tanda ` lewat
   code::before dan code::after. Dua aturan di bawah mematikannya sekaligus
   menyeragamkan warnanya di semua tempat yang memakai class .prose. */
.prose code::before,
.prose code::after {
  content: '' !important;
}

.prose :where(code):not(pre code) {
  background-color: #f4eb6c;
  color: #111111;
  padding: 0.125rem 0.375rem;
  border-radius: 0.375rem;
  border: 1px solid #111111;
  font-weight: 600;
}

.prose :where(pre code) {
  background-color: transparent;
  color: inherit;
  padding: 0;
  border: 0;
  font-weight: inherit;
}
CSS_EOF
  echo "ditulis: $CSS (aturan inline code)"
fi

LAMA='className="bg-[var(--color-accent)] text-[var(--color-text-main)] px-1.5 py-0.5 rounded-md text-sm font-mono border border-[var(--color-text-main)]"'
BARU='className="bg-[#f4eb6c] text-[var(--color-text-main)] px-1.5 py-0.5 rounded-md text-sm font-mono border border-[var(--color-text-main)]"'

if grep -qF "$BARU" "$TSX"; then
  echo "Lesson.tsx sudah memakai warna baru, dilewati."
elif grep -qF "$LAMA" "$TSX"; then
  python3 - "$TSX" "$LAMA" "$BARU" <<'PY_EOF'
import sys
p, lama, baru = sys.argv[1], sys.argv[2], sys.argv[3]
s = open(p, encoding='utf-8').read()
assert s.count(lama) == 1, f'ditemukan {s.count(lama)} kali, seharusnya 1'
open(p, 'w', encoding='utf-8').write(s.replace(lama, baru))
PY_EOF
  echo "ditulis: $TSX (warna inline code)"
else
  echo "CATATAN: baris inline code di $TSX sudah berubah dari yang saya lihat."
  echo "         Aturan CSS di atas tetap berlaku, jadi tampilannya sudah benar."
fi

echo
echo "Selesai. Jalankan:  npm run build && npm run test:unit"
