import { test, expect } from '@playwright/test';

test('Alur kursus JavaScript', async ({ page }) => {
  await page.goto('/#/?bypass=true');
  await page.evaluate(() => {
    localStorage.setItem('e2e_bypass', 'true');
    localStorage.setItem(
      'bn_progress',
      JSON.stringify({
        unlockAll: true,
        completedLessons: [],
        moduleStatus: {},
        quizScores: {},
      })
    );
  });
  await page.goto('/');

  // Navigasi langsung ke halaman kelas JavaScript (sesuai alur baru)
  await page.goto('/#/kelas/javascript');

  // Kelas javascript berstatus 'soon' -> redirect ke daftar kelas atau tampil "Kelas tidak ditemukan"
  // Sesuai implementasi: courseId tidak dikenal -> tampil error page
  // Kita cukup verifikasi bisa navigasi ke modul js-dasar langsung
  await page.goto('/#/module/js-dasar');

  await page.getByText('Pengenalan JavaScript', { exact: true }).waitFor();
  await page.getByText('Pengenalan JavaScript', { exact: true }).click();

  // Lanjut
  await page.getByRole('button', { name: 'Lanjut' }).click();

  // Runnable
  await expect(page.getByText('Kode Playground').first()).toBeVisible();
  await page.getByRole('button', { name: 'Jalankan Kode' }).first().click();
  await expect(page.getByText('Halo Runnable')).toBeVisible();

  await page.getByRole('button', { name: 'Lanjut' }).click();

  // Lanjut (DOM)
  await page.getByRole('button', { name: 'Jalankan Kode' }).first().click();
  await page.getByRole('button', { name: 'Lanjut' }).click();

  // Challenge
  await page.locator('.cm-content').click();
  await page.keyboard.press('Control+A');
  await page.keyboard.press('Delete');
  await page.keyboard.insertText("console.log('Saya bisa JavaScript');");
  await page.getByRole('button', { name: 'Cek Jawaban' }).click();

  await expect(page.getByText('Berhasil!')).toBeVisible({ timeout: 10000 });
});
