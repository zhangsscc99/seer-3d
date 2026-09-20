import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';

const base = process.env.SEER_URL || 'http://127.0.0.1:4175';
await mkdir('evidence', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [], checks = [];
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
const state = () => page.evaluate(() => window.__seer.getState());
const closePanel = () => page.locator('#close-panel').click();
let failure, activePage = page;
try {
  await page.goto(base);
  await page.waitForFunction(() => window.__seer?.ready);
  await page.waitForTimeout(300);
  const initial = await state();
  assert(initial.triangles > 10000 && initial.triangles < 1500000, 'Detailed scenery must stay within the triangle budget');
  assert(initial.calls < 350, 'Static details must remain batched');
  assert.equal(initial.terrainResolution, 2048);
  assert(initial.ambientPhase > 0, 'Environmental animation must be active');
  const pixels = await page.evaluate(() => window.__seer.pixelSample());
  assert(new Set(pixels.map(p => p.slice(0, 3).join(','))).size > 8, 'Canvas must contain varied rendered pixels');
  assert(pixels.every(p => p[3] === 255));
  await page.screenshot({ path: 'evidence/desktop.png' });
  checks.push('Desktop WebGL rendering, 2K terrain, ambient animation and geometry budgets');
  await page.locator('#zoom-in').click();
  await page.locator('#zoom-in').click();
  await page.screenshot({ path: 'evidence/terrain-closeup.png' });
  await page.locator('#reset').click();

  const point = await page.evaluate(() => window.__seer.project(1, 0, 7));
  assert(point.x > 0 && point.x < 1440 && point.y > 0 && point.y < 1000, 'Camera reset must update its projection immediately');
  await page.mouse.click(point.x, point.y);
  await page.waitForFunction(() => {
    const current = window.__seer.getState();
    return !current.moving && Math.hypot(current.player[0] - 1, current.player[2] - 7) < .3;
  });
  const walked = await state();
  assert(Math.hypot(walked.player[0] - 1, walked.player[2] - 7) < .3, 'Ground click must move the player');
  await page.keyboard.down('KeyA');
  await page.waitForTimeout(400);
  await page.keyboard.up('KeyA');
  assert((await state()).player[0] < walked.player[0] - .4);
  checks.push('Click to walk and keyboard movement');

  const cameraBefore = (await state()).camera;
  await page.mouse.move(900, 700);
  await page.mouse.down(); await page.mouse.move(1060, 700, { steps: 8 }); await page.mouse.up();
  await page.waitForTimeout(400);
  assert.notDeepEqual((await state()).camera, cameraBefore);
  await page.locator('#reset').click();
  const distanceBefore = (await state()).camera[2];
  await page.locator('#zoom-in').click();
  assert((await state()).camera[2] < distanceBefore);
  await page.locator('#reset').click();
  checks.push('Orbit, zoom and reset controls');

  await page.locator('#scan').click();
  await page.locator('#record').waitFor();
  await page.locator('#record').click();
  await closePanel();
  await page.locator('.world-label').filter({ hasText: '比波' }).click();
  await page.locator('#record').waitFor();
  await page.locator('#record').click();
  await closePanel();
  assert.deepEqual(new Set((await state()).records), new Set(['pipi', 'bibo']));
  checks.push('Scan and record both species');

  for (let i = 0; i < 3; i++) {
    const resource = page.locator(`[data-entity-id="crystal-${i}"]`);
    await resource.click();
    await page.waitForFunction(count => window.__seer.getState().collected.length === count, i + 1);
    assert(await resource.isHidden(), 'Collected crystal labels must disappear');
  }
  assert.equal(await page.locator('#progress').textContent(), '100%');
  await page.locator('[data-panel="bag"]').click();
  assert.match(await page.locator('#panel-content').textContent(), /× 3/);
  await closePanel();
  checks.push('Collect all crystals, inventory and complete exploration');

  await page.locator('[data-panel="dex"]').click();
  assert.equal(await page.locator('.record-state').filter({ hasText: '已收录' }).count(), 2);
  assert(await page.locator('.dex-row img').evaluateAll(images => images.every(img => img.complete && img.naturalWidth === 256)));
  await page.screenshot({ path: 'evidence/dex.png' });
  await closePanel();
  await page.locator('[data-panel="reference"]').click();
  await page.locator('.reference-image').evaluate(img => img.decode());
  assert(await page.locator('.reference-image').evaluate(img => img.naturalWidth > 1000));
  await closePanel();
  checks.push('Model portraits, encyclopedia and original reference image');

  await page.locator('[data-panel="map"]').click();
  await page.locator('[data-travel="portal"]').click();
  assert((await state()).player[1] > 3);
  await page.screenshot({ path: 'evidence/portal-closeup.png' });
  await page.locator('[data-panel="map"]').click();
  await page.locator('[data-travel="grass"]').click();
  assert.equal((await state()).player[1], 0);
  await page.locator('#sound').click();
  assert((await state()).sound);
  await page.locator('#sound').click();
  assert(!(await state()).sound);
  checks.push('Map travel and ambient audio toggle');

  await page.reload();
  await page.waitForFunction(() => window.__seer?.ready);
  assert.equal((await state()).collected.length, 3);
  assert.equal((await state()).records.length, 2);
  assert.equal(await page.locator('.world-label.resource:visible').count(), 0);
  checks.push('Progress persists after reload');
  await context.close();

  for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
    const mobileContext = await browser.newContext({ viewport, isMobile: true, hasTouch: true });
    const mobile = await mobileContext.newPage();
    activePage = mobile;
    mobile.on('pageerror', error => errors.push(error.message));
    await mobile.goto(base);
    await mobile.waitForFunction(() => window.__seer?.ready);
    await mobile.bringToFront();
    await mobile.waitForFunction(() => document.visibilityState === 'visible');
    const values = await mobile.evaluate(() => window.__seer.pixelSample());
    assert(new Set(values.map(p => p.slice(0, 3).join(','))).size > 7);
    assert(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    const buttons = await mobile.locator('.dock button').evaluateAll(elements => elements.map(e => { const r = e.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom }; }));
    buttons.forEach((b, i) => { assert(b.left >= 0 && b.right <= viewport.width && b.bottom <= viewport.height); if (i) assert(b.left >= buttons[i - 1].right - 1); });
    await mobile.screenshot({ path: `evidence/mobile-${viewport.width}.png` });
    await mobile.locator('[data-panel="dex"]').tap();
    assert(await mobile.locator('#panel').isVisible());
    await mobile.locator('#close-panel').tap();
    const t = (await mobile.evaluate(() => window.__seer.getState())).time;
    await mobile.waitForFunction(previous => window.__seer.getState().time > previous + .05, t, { timeout: 10000 });
    checks.push(`Mobile ${viewport.width}x${viewport.height}: pixels, animation, layout and touch menu`);
    await mobileContext.close();
  }
  const quietContext = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
  const quiet = await quietContext.newPage();
  activePage = quiet;
  quiet.on('pageerror', error => errors.push(error.message));
  await quiet.goto(base);
  await quiet.waitForFunction(() => window.__seer?.ready);
  const quietState = await quiet.evaluate(() => window.__seer.getState());
  await quiet.waitForFunction(previous => window.__seer.getState().time > previous + .05, quietState.time, { timeout: 10000 });
  const quietAfter = await quiet.evaluate(() => window.__seer.getState());
  assert(quietAfter.time > quietState.time, 'Reduced motion must not pause the application');
  assert.equal(quietAfter.ambientPhase, 0, 'Reduced motion must freeze ambient effects');
  await quiet.locator('[data-panel="map"]').click();
  await quiet.locator('[data-travel="mine"]').click();
  assert((await quiet.evaluate(() => window.__seer.getState())).player[0] < 0);
  await quiet.screenshot({ path: 'evidence/mine-closeup.png' });
  await quietContext.close();
  checks.push('Reduced-motion rendering and map navigation');
  assert.deepEqual(errors, []);
} catch (error) {
  failure = String(error.stack || error);
  process.exitCode = 1;
  await activePage.screenshot({ path: 'evidence/failure.png' }).catch(() => {});
} finally {
  await writeFile('evidence/report.json', JSON.stringify({ passed: !failure, checks, errors, failure }, null, 2));
  console.log(JSON.stringify({ passed: !failure, checks, errors, failure }, null, 2));
  await browser.close();
}
