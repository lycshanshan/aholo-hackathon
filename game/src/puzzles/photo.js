import { button, element } from './ui.js';
import { pose } from './movement.js';

const photoURL = new URL('../../assets/photo-store.png', import.meta.url).href;
const starts = [[73, 3], [73, 35], [73, 67], [4, 68], [27, 68], [50, 68]];

export function photoPuzzle(ui, text, common, complete) {
  // 百分比坐标使碎片和目标外沿随画布一起缩放。
  const board = element(ui.surface, 'div', 'photo-board');
  const target = element(board, 'div', 'photo-target');
  target.setAttribute('aria-label', text.outline);
  const frame = element(board, 'div', 'photo-frame');
  frame.setAttribute('aria-label', text.frame);
  const state = starts.map(([x, y]) => ({ x, y, locked: false }));
  let selected = 0;
  let layer = 1;
  let assembled = false;
  let drag;
  const abort = new AbortController();
  const pieces = state.map((item, index) => {
    const piece = button(board, '', () => { selected = index; });
    piece.className = 'photo-piece';
    piece.setAttribute('aria-label', text.pieces[index]);
    piece.style.backgroundImage = `url("${photoURL}")`;
    piece.style.backgroundPosition = `${index % 3 * 50}% ${Math.floor(index / 3) * 100}%`;
    return piece;
  });
  const whole = button(board, '', () => {});
  whole.className = 'photo-whole';
  whole.style.backgroundImage = `url("${photoURL}")`;
  whole.setAttribute('aria-label', text.whole);
  const insert = button(ui.actions, text.insert, () => { if (assembled) finish(); }, 'puzzle-primary');
  insert.disabled = true;

  function draw() {
    pieces.forEach((piece, index) => {
      piece.style.left = `${state[index].x}%`;
      piece.style.top = `${state[index].y}%`;
      piece.disabled = state[index].locked;
      piece.hidden = assembled;
    });
    whole.hidden = !assembled;
    if (assembled && !drag) { whole.style.left = '4%'; whole.style.top = '4%'; }
  }

  function finish() {
    complete([pose('selected-photo', [0.82, 1.295, -1.34], -0.16), pose('photo-pieces', [0, 0, 0], 0, 0, false)]);
  }

  function snap(index) {
    const item = state[index];
    const x = 4 + index % 3 * 20;
    const y = 4 + Math.floor(index / 3) * 30;
    if (Math.abs(item.x - x) <= 3.5 && Math.abs(item.y - y) <= 3.5) Object.assign(item, { x, y, locked: true });
    const count = state.filter((part) => part.locked).length;
    assembled = count === 6;
    insert.disabled = !assembled;
    ui.say(assembled ? text.assembled : text.progress.replace('{count}', count));
    draw();
    if (assembled) whole.focus();
  }

  // 碎片可自由试拼，接缝吸合后固定；整张照片完成后可拖进空框。
  function pointerDown(event) {
    if (event.button !== 0 || drag) return;
    const index = pieces.indexOf(event.target);
    if (index < 0 && event.target !== whole) return;
    if (index >= 0 && state[index].locked) return;
    event.preventDefault();
    event.target.focus();
    event.target.setPointerCapture(event.pointerId);
    const item = index < 0 ? { x: 4, y: 4 } : state[index];
    selected = Math.max(0, index);
    drag = { id: event.pointerId, index, x: event.clientX, y: event.clientY, left: item.x, top: item.y };
    event.target.style.zIndex = String(++layer);
  }

  function pointerMove(event) {
    if (drag?.id !== event.pointerId) return;
    const rect = board.getBoundingClientRect();
    const width = drag.index < 0 ? 60 : 20;
    const height = drag.index < 0 ? 60 : 30;
    const x = Math.max(0, Math.min(100 - width, drag.left + (event.clientX - drag.x) / rect.width * 100));
    const y = Math.max(0, Math.min(100 - height, drag.top + (event.clientY - drag.y) / rect.height * 100));
    if (drag.index < 0) { whole.style.left = `${x}%`; whole.style.top = `${y}%`; }
    else { Object.assign(state[drag.index], { x, y }); draw(); }
  }

  function pointerUp(event) {
    if (drag?.id !== event.pointerId) return;
    const { index } = drag;
    drag = null;
    if (event.type !== 'pointerup') { draw(); return; }
    if (index >= 0) { snap(index); return; }
    const rect = frame.getBoundingClientRect();
    if (event.clientX >= rect.left - 18 && event.clientX <= rect.right + 18 &&
        event.clientY >= rect.top - 18 && event.clientY <= rect.bottom + 18) finish();
    else { ui.say(text.insertHint); draw(); }
  }

  // 指针与方向键共享碎片坐标，回车执行相同的接缝吸附。
  for (const [name, listener] of [['pointerdown', pointerDown], ['pointermove', pointerMove], ['pointerup', pointerUp], ['pointercancel', pointerUp], ['lostpointercapture', pointerUp]]) {
    board.addEventListener(name, listener, { signal: abort.signal });
  }
  board.addEventListener('keydown', (event) => {
    if (assembled) { if (event.code === 'Enter' || event.code === 'Space') { event.preventDefault(); finish(); } return; }
    const index = pieces.indexOf(event.target);
    if (index < 0) return;
    selected = index;
    const moves = { ArrowLeft: [-1.5, 0], ArrowRight: [1.5, 0], ArrowUp: [0, -1.5], ArrowDown: [0, 1.5] };
    if (moves[event.code]) {
      event.preventDefault();
      const [dx, dy] = moves[event.code];
      state[selected].x = Math.max(0, Math.min(80, state[selected].x + dx));
      state[selected].y = Math.max(0, Math.min(70, state[selected].y + dy));
      draw();
    } else if (event.code === 'Enter' || event.code === 'Space') { event.preventDefault(); snap(index); }
  }, { signal: abort.signal });
  const references = element(ui.tools, 'div', 'photo-references');
  ['photo-yard', 'photo-door'].forEach((name, index) => {
    const image = element(references, 'img', '');
    image.src = new URL(`../../assets/${name}.png`, import.meta.url).href;
    image.alt = text.references[index];
  });
  ui.reset.onclick = () => {
    assembled = false; drag = null; insert.disabled = true;
    state.forEach((item, index) => Object.assign(item, { x: starts[index][0], y: starts[index][1], locked: false }));
    ui.say(text.instruction); draw();
  };
  draw();
  return { destroy() { abort.abort(); } };
}
