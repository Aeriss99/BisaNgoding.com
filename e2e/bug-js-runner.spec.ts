import { test, expect } from '@playwright/test';

test('Bug JS Runner: /lesson/js-dasar-01 memanggil JS Runner', async ({ page }) => {
  // Bypass lock
  await page.goto('/#/?bypass=true');
  await page.evaluate(() => {
    localStorage.setItem('bisangoding_progress', JSON.stringify({ unlockAll: true }));
  });
  
  // Langsung ke materi JS pertama
  await page.goto('/#/lesson/js-dasar-01');

  // Lanjut teori 1
  await page.getByRole('button', { name: 'Lanjut' }).click();
  // Lanjut teori 2
  await page.getByRole('button', { name: 'Lanjut' }).click();
  // Lanjut teori 3
  await page.getByRole('button', { name: 'Lanjut' }).click();

  // Sekarang ada di card runnable
  const runBtn = page.getByRole('button', { name: 'Jalankan Kode' }).first();
  await expect(runBtn).toBeVisible({ timeout: 10000 });
  await runBtn.click();

  const jsLabel = page.locator('text=node script.js').first();
  await expect(jsLabel).toBeVisible({ timeout: 10000 });
});
