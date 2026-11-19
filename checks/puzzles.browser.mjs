import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
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
const output = path.resolve('docs/ai/process/解谜改造验收');
await mkdir(output, { recursive: true });
await page.goto('http://127.0.0.1:8876', { waitUntil: 'networkidle' });
await page.waitForFunction(() => document.querySelector('#loading').hidden);

async function mount(id) {
  await page.evaluate(async (id) => {
    window.fixture?.destroy();
    const { mountBusinessPuzzle } = await import('/src/puzzles/index.js');
    const texts = await (await fetch('/data/puzzles.json')).json();
    const actions = await (await fetch('/data/actions.json')).json();
    const entry = actions.find((entry) => entry.id === id);
    const modal = document.querySelector('#activity');
    const host = document.querySelector('#activity-puzzle');
    host.hidden = false;
    document.querySelector('#activity-model').hidden = true;
    document.querySelector('#activity-drag').hidden = true;
    document.querySelector('#activity-options').replaceChildren();
    document.querySelector('#activity-feedback').hidden = true;
    document.querySelector('#activity-title').textContent = entry.title;
    document.querySelector('#activity-description').textContent = entry.description;
    modal.classList.add('activity--puzzle');
    if (!modal.open) modal.showModal();
    window.completed = null;
    window.fixture = mountBusinessPuzzle(host, id, new Map(texts.map((entry) => [entry.id, entry])),
      (poses) => { window.completed = poses; }, 0.52);
  }, id);
  if (id === 'wang-photo') await page.locator('.photo-piece').first().waitFor();
  else await page.locator('.puzzle-actions button').waitFor({ timeout: 20000 });
}

async function keys(key, count) {
  for (let i = 0; i < count; i++) await page.keyboard.press(key);
}

async function completed(id) {
  await page.waitForFunction(() => Array.isArray(window.completed), { timeout: 10000 });
  assert.ok((await page.evaluate(() => window.completed)).length > 0, id);
  console.log(`${id}: completed`);
}

async function capture(id) {
  await page.locator('#activity').screenshot({ path: path.join(output, `${id}.png`) });
}

await mount('lin-benches');
await page.getByRole('button', { name: '端水试走', exact: true }).click();
await page.getByText('托盘在凳角前停住了。砖路两侧还要留出一些余地。', { exact: true }).waitFor();
assert.equal(await page.evaluate(() => window.completed), null);
await page.getByRole('button', { name: '左边的窄凳', exact: true }).click();
await page.keyboard.press('r'); await keys('ArrowLeft', 20);
await page.getByRole('button', { name: '右边的窄凳', exact: true }).click();
await page.keyboard.press('r'); await keys('ArrowDown', 14); await keys('ArrowLeft', 34);
await capture('lin-benches');
await page.getByRole('button', { name: '端水试走', exact: true }).click();
await completed('lin-benches');

await mount('lin-light');
const closure = page.getByRole('slider', { name: '合上院门', exact: true });
await closure.focus(); await page.keyboard.press('End');
await page.getByRole('button', { name: '从门缝看看', exact: true }).click();
assert.equal(await page.evaluate(() => window.completed), null);
await page.getByRole('button', { name: '莲花灯', exact: true }).click();
await keys('ArrowRight', 21); await keys('ArrowDown', 25);
await capture('lin-light');
await page.getByRole('button', { name: '从门缝看看', exact: true }).click();
await completed('lin-light');

await mount('wang-photo');
const board = await page.locator('.photo-board').boundingBox();
for (let i = 0; i < 6; i++) {
  const rect = await page.locator('.photo-piece').nth(i).boundingBox();
  await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
  await page.mouse.down();
  await page.mouse.move(board.x + board.width * (0.14 + i % 3 * 0.2), board.y + board.height * (0.19 + Math.floor(i / 3) * 0.3), { steps: 8 });
  await page.mouse.up();
}
await page.locator('.photo-whole').waitFor();
await capture('wang-photo');
const whole = await page.locator('.photo-whole').boundingBox();
const frame = await page.locator('.photo-frame').boundingBox();
await page.mouse.move(whole.x + whole.width / 2, whole.y + whole.height / 2);
await page.mouse.down();
await page.mouse.move(frame.x + frame.width / 2, frame.y + frame.height / 2, { steps: 8 });
await page.mouse.up();
await completed('wang-photo');

await mount('wang-support');
await page.getByRole('button', { name: '松手试立', exact: true }).click();
await page.getByText('撑脚还贴得太近，相框往后倒了。', { exact: true }).waitFor();
const opening = page.getByRole('slider', { name: '展开背撑', exact: true });
await opening.focus(); await page.keyboard.press('Home'); await keys('ArrowRight', 48);
await capture('wang-support');
await page.getByRole('button', { name: '松手试立', exact: true }).click();
await completed('wang-support');

await mount('wang-frame');
await page.locator('.puzzle-surface canvas').focus();
await keys('ArrowRight', 38); await keys('ArrowUp', 14);
await page.getByRole('button', { name: '↶ 转一点', exact: true }).click({ clickCount: 2 });
await capture('wang-frame');
await page.getByRole('button', { name: '从门边看看', exact: true }).click();
await completed('wang-frame');

await mount('du-plane');
await page.getByRole('button', { name: '木刨一', exact: true }).click();
await page.getByRole('button', { name: '比一比刨口', exact: true }).click();
assert.equal(await page.evaluate(() => window.completed), null);
await page.getByRole('button', { name: '木刨二', exact: true }).click();
await keys('ArrowRight', 48); await keys('ArrowUp', 14);
await page.getByRole('button', { name: '转一点 ↷', exact: true }).click({ clickCount: 2 });
await page.getByRole('button', { name: '翻看刨底', exact: true }).click();
await capture('du-plane');
await page.getByRole('button', { name: '比一比刨口', exact: true }).click();
await completed('du-plane');

await mount('du-cradle');
await page.locator('.puzzle-surface canvas').focus();
await keys('ArrowRight', 33); await keys('ArrowDown', 22);
await page.getByRole('button', { name: '↶ 转一点', exact: true }).click({ clickCount: 2 });
await capture('du-cradle');
await page.getByRole('button', { name: '放下试试', exact: true }).click();
await completed('du-cradle');

// 窄屏重新布局与真实主流程中的跳过、刷新使用同一组交互入口。
await page.setViewportSize({ width: 390, height: 844 });
await mount('wang-support');
await capture('mobile-frame');
assert.equal(await page.evaluate(() => document.querySelector('#activity').scrollWidth > document.querySelector('#activity').clientWidth + 1), false);
await page.evaluate(() => {
  window.fixture.destroy();
  document.querySelector('#activity').close();
  localStorage.setItem('lantern-keeper:journey:v1', JSON.stringify({ scene: 'wang', seen: ['a-zhou', 'wang-photo', 'wang-groove'], skipped: [] }));
});
await page.reload({ waitUntil: 'networkidle' });
await page.locator('#chapter-skip').click();
await page.getByRole('button', { name: '跳过当前谜题', exact: true }).click();
let saved = await page.evaluate(() => JSON.parse(localStorage.getItem('lantern-keeper:journey:v1')));
assert.ok(saved.skipped.includes('wang-support'));
assert.equal(saved.skipped.includes('wang-frame'), false);
await page.reload({ waitUntil: 'networkidle' });
await page.locator('#chapter-skip').click();
await page.getByRole('button', { name: '跳过当前谜题', exact: true }).click();
await page.getByRole('button', { name: '返回经营单', exact: true }).waitFor();
saved = await page.evaluate(() => JSON.parse(localStorage.getItem('lantern-keeper:journey:v1')));
assert.ok(saved.skipped.includes('wang-frame'));
assert.deepEqual(errors, []);
console.log('Seven hands-on steps, mobile layout, main-flow skips and reload passed without page or asset errors.');
} finally {
  await browser.close();
}
