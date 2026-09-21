import { chromium } from '@playwright/test';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://127.0.0.1:5174/');
  await page.waitForTimeout(1000);
  console.log("Initial URL:", page.url());
  
  await page.click('text="Modul"');
  await page.waitForTimeout(1000);
  console.log("After clicking Modul:", page.url());
  const text = await page.evaluate(() => document.body.innerText);
  console.log("TEXT START\n", text.slice(0, 100));
  
  await browser.close();
  process.exit(0);
})();
