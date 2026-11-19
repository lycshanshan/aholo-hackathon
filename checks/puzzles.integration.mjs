import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(path.join(process.env.GUARDIAN_NODE_MODULES, 'package.json'));
const { chromium } = require('playwright');
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.goto('http://127.0.0.1:8876');

  async function seed(scene, seen) {
    await page.evaluate(({ scene, seen }) => {
      localStorage.setItem('lantern-keeper:journey:v1', JSON.stringify({ scene, seen: ['a-zhou', ...seen], skipped: [] }));
    }, { scene, seen });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.querySelector('#loading').hidden);
  }

  async function walkTo(label, keys) {
    for (const key of keys) await page.keyboard.down(key);
    for (let i = 0; i < 40; i++) {
      if (await page.locator('#inspect').isVisible() && await page.locator('#inspect span').textContent() === label) break;
      await page.waitForTimeout(150);
    }
    for (const key of keys) await page.keyboard.up(key);
    if (await page.locator('#inspect span').textContent() !== label) {
      await page.screenshot({ path: 'docs/ai/process/解谜改造验收/walk-target.png' });
      console.log(await page.locator('main').innerText(), errors);
    }
    assert.equal(await page.locator('#inspect span').textContent(), label);
    await page.locator('#inspect').click();
    await page.locator('.puzzle-actions button').waitFor();
  }

  async function keys(key, count) {
    for (let i = 0; i < count; i++) await page.keyboard.press(key);
  }

  async function canvasPoint(point, view) {
    return page.evaluate(async ({ point, view }) => {
      const THREE = await import('three');
      const rect = document.querySelector('.puzzle-surface canvas').getBoundingClientRect();
      const half = Math.max(view.span, view.span * 1.25 / (rect.width / rect.height));
      const camera = new THREE.OrthographicCamera(-half * rect.width / rect.height, half * rect.width / rect.height, half, -half, 0.01, 100);
      const target = new THREE.Vector3(...view.target);
      camera.position.set(Math.sin(view.yaw) * Math.cos(view.pitch), Math.sin(view.pitch), Math.cos(view.yaw) * Math.cos(view.pitch)).multiplyScalar(12).add(target);
      camera.lookAt(target); camera.updateMatrixWorld();
      const at = new THREE.Vector3(...point).project(camera);
      return { x: rect.left + (at.x + 1) / 2 * rect.width, y: rect.top + (1 - at.y) / 2 * rect.height };
    }, { point, view });
  }

  // 从角色行走触发真实动作，完成后核对实际存档与刷新后的摆放记录。
  await seed('lin', ['lin-worn-floor']);
  await walkTo('给来客留路', ['w']);
  const courtyardView = { span: 3.5, target: [0, 0, 0], yaw: 0, pitch: 1.37 };
  const benchStart = await canvasPoint([-1.13, 0.35, 0.15], courtyardView);
  const benchFinish = await canvasPoint([-2.7, 0.35, 0.15], courtyardView);
  await page.mouse.move(benchStart.x, benchStart.y); await page.mouse.down();
  await page.mouse.move(benchFinish.x, benchFinish.y, { steps: 12 }); await page.mouse.up();
  await page.keyboard.press('r'); await keys('ArrowLeft', 7);
  await page.getByRole('button', { name: '右边的窄凳', exact: true }).click();
  await page.keyboard.press('r'); await keys('ArrowDown', 14); await keys('ArrowLeft', 34);
  await page.getByRole('button', { name: '端水试走', exact: true }).click();
  await page.locator('#activity-feedback').filter({ hasText: '托盘沿砖路送到了水桌前。' }).waitFor();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('lantern-keeper:journey:v1')));
  assert.ok(saved.seen.includes('lin-benches'));
  assert.equal(saved.poses['lin-benches'].length, 2);
  await page.getByRole('button', { name: '继续', exact: true }).click();
  await page.reload({ waitUntil: 'networkidle' });
  assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('lantern-keeper:journey:v1')).poses['lin-benches']), saved.poses['lin-benches']);
  console.log('Main-flow walk, completion and placement persistence passed.');

  // 相框背撑完成后直接衔接安放，两个动作分别保存。
  await seed('wang', ['wang-photo', 'wang-groove', 'wang-photos']);
  await walkTo('展开相框背撑', ['w', 'd']);
  const opening = page.getByRole('slider', { name: '展开背撑', exact: true });
  const grip = await canvasPoint([0, 0.28 - 0.27 * Math.cos(0.08) + 0.003 * Math.sin(0.08), -0.025 - 0.27 * Math.sin(0.08) - 0.003 * Math.cos(0.08)],
    { span: 0.43, target: [0, 0.22, -0.07], yaw: 2.65, pitch: 0.5 });
  await page.mouse.move(grip.x, grip.y); await page.mouse.down();
  await page.mouse.move(grip.x + 74, grip.y, { steps: 12 }); await page.mouse.up();
  assert.ok(Number(await opening.inputValue()) >= 50 && Number(await opening.inputValue()) <= 54);
  await page.getByRole('button', { name: '松手试立', exact: true }).click();
  await page.locator('#activity-feedback').filter({ hasText: '撑脚稳稳落了下来' }).waitFor();
  assert.ok(await page.evaluate(() => JSON.parse(localStorage.getItem('lantern-keeper:journey:v1')).seen.includes('wang-support')));
  await page.getByRole('button', { name: '继续', exact: true }).click();
  await page.getByRole('heading', { name: '把相框立稳', exact: true }).waitFor();
  await page.locator('.puzzle-surface canvas').focus();
  await keys('ArrowRight', 38); await keys('ArrowUp', 14);
  await page.getByRole('button', { name: '↶ 转一点', exact: true }).click({ clickCount: 2 });
  await page.getByRole('button', { name: '从门边看看', exact: true }).click();
  await page.locator('#activity-feedback').filter({ hasText: '撑脚卡进槽里' }).waitFor();
  await page.getByRole('button', { name: '继续', exact: true }).click();
  await page.getByRole('button', { name: '返回经营单', exact: true }).waitFor();
  console.log('Articulated-frame handoff and main-flow completion passed.');

  // 窄屏触屏在同一张拼图上拖放碎片，并覆盖提前关闭的异步清理。
  const touchContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const touch = await touchContext.newPage();
  touch.on('pageerror', (error) => errors.push(error.message));
  await touch.goto('http://127.0.0.1:8876');
  await touch.evaluate(async () => {
    const host = document.querySelector('#activity-puzzle');
    const modal = document.querySelector('#activity');
    host.hidden = false; modal.classList.add('activity--puzzle'); modal.showModal();
    const texts = await (await fetch('/data/puzzles.json')).json();
    window.touchFixture = (await import('/src/puzzles/index.js')).mountBusinessPuzzle(host, 'wang-photo', new Map(texts.map((entry) => [entry.id, entry])), () => {});
  });
  const piece = await touch.locator('.photo-piece').first().boundingBox();
  const board = await touch.locator('.photo-board').boundingBox();
  const start = { x: piece.x + piece.width / 2, y: piece.y + piece.height / 2 };
  const finish = { x: board.x + board.width * 0.14, y: board.y + board.height * 0.19 };
  const cdp = await touchContext.newCDPSession(touch);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...start, id: 1 }] });
  for (let i = 1; i <= 10; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: start.x + (finish.x - start.x) * i / 10, y: start.y + (finish.y - start.y) * i / 10, id: 1 }] });
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  assert.ok(await touch.locator('.photo-piece').first().isDisabled());
  assert.equal(await touch.evaluate(() => document.querySelector('#activity').scrollWidth > document.querySelector('#activity').clientWidth + 1), false);
  await touch.locator('#activity').screenshot({ path: 'docs/ai/process/解谜改造验收/mobile-photo-touch.png' });
  await touch.evaluate(async () => {
    window.touchFixture.destroy();
    const host = document.querySelector('#activity-puzzle');
    const texts = await (await fetch('/data/puzzles.json')).json();
    const mount = (await import('/src/puzzles/index.js')).mountBusinessPuzzle;
    const fixture = mount(host, 'wang-support', new Map(texts.map((entry) => [entry.id, entry])), () => {});
    fixture.destroy();
  });
  await touch.waitForTimeout(500);
  assert.equal(await touch.locator('#activity-puzzle canvas').count(), 0);
  assert.deepEqual(errors, []);
  console.log('Touch drag, narrow layout and asynchronous-close cleanup passed.');
} finally {
  await browser.close();
}
