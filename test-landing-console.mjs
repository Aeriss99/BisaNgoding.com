import puppeteer from 'puppeteer';
import { exec } from 'child_process';

const server = exec('npm run preview -- --port 4173');

setTimeout(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', (err) => console.log('PAGE ERROR:', err.toString()));

  await page.goto('http://localhost:4173');
  await new Promise((r) => setTimeout(r, 2000));

  await browser.close();
  server.kill();
  process.exit(0);
}, 3000);
