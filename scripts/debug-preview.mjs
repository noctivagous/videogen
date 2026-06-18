import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
await page.goto('http://localhost:3001/studio', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(4000);

const info = await page.evaluate(() => {
  const canvas = document.querySelector('.scene-mount canvas');
  const mount = document.querySelector('.scene-mount');
  const frame = document.querySelector('.preview-frame');
  const rect = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  };
  return {
    canvas: rect(canvas),
    mount: rect(mount),
    frame: rect(frame),
    canvasAttr: canvas ? { w: canvas.width, h: canvas.height } : null,
    frameStyle: frame ? { width: frame.style.width, height: frame.style.height, aspectRatio: frame.style.aspectRatio } : null,
  };
});

console.log(JSON.stringify(info, null, 2));
await page.screenshot({ path: '/tmp/videogen-preview.png' });
writeFileSync('/tmp/videogen-preview.png', await page.screenshot());
await browser.close();