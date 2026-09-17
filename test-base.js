import puppeteer from 'puppeteer';
async function run() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err));
  
  await page.goto('http://localhost:4174/BisaNgoding.com/');
  await new Promise(r => setTimeout(r, 2000));
  const content = await page.content();
  if (content.includes('Ups, ada yang salah')) {
    console.log('ErrorBoundary triggered!');
  } else if (content.includes('Belajar Java')) {
    console.log('Dashboard loaded ok.');
  } else {
    console.log('Blank page?', content);
  }
  await browser.close();
}
run();
