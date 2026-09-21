import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 375, height: 667 } });
  
  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(2000);
  
  const layout = await page.evaluate(() => {
    const heroPanel = document.querySelector('section.max-w-7xl > div');
    const textBlock = heroPanel.children[0];
    const imgBlock = heroPanel.children[1];
    
    const btns = textBlock.querySelector('.flex.flex-col.sm\\:flex-row');
    
    return {
      heroH: heroPanel.clientHeight,
      textH: textBlock.clientHeight,
      btnsTop: btns.getBoundingClientRect().top,
      btnsH: btns.clientHeight,
      imgTop: imgBlock.getBoundingClientRect().top,
      imgH: imgBlock.clientHeight,
      imgW: imgBlock.clientWidth,
      imgSrc: imgBlock.querySelector('img') ? imgBlock.querySelector('img').src : 'NO IMG',
      cards: Array.from(imgBlock.querySelectorAll('.absolute')).map(el => ({
        top: el.getBoundingClientRect().top,
        left: el.getBoundingClientRect().left,
        w: el.clientWidth,
        h: el.clientHeight,
        bg: el.className
      }))
    };
  });
  
  console.log(JSON.stringify(layout, null, 2));
  
  await browser.close();
  process.exit(0);
})();
