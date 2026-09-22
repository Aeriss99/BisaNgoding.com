cat > AGENTS.md <<'EOF'
# Aturan Hemat Waktu & Token

1. JANGAN jalankan test:e2e / Playwright kecuali diminta secara eksplisit.
2. Setelah mengubah kode, jalankan HANYA: npm run build dan npm run test:unit.
3. JANGAN jalankan test:all.
4. Maksimal 3 percobaan per masalah. Gagal? Berhenti, catat di LAPORAN.md, lanjut ke tugas berikutnya.
5. JANGAN bereksperimen berulang (coba-coba konfigurasi, debug log berkali-kali).
6. Jika lebih dari 20 menit tanpa kemajuan, berhenti dan laporkan.
7. JANGAN ubah isi content/ kecuali diminta.
8. JANGAN ubah src/lib/javaRunner.ts kecuali diminta.
9. Setiap selesai tugas: commit, push, dan tambah 1 baris LAPORAN.md dengan angka tes asli.
10. Balas singkat, tanpa menampilkan kode.
EOF