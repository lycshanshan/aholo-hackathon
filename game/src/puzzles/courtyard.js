import * as THREE from 'three';
import { createStage } from './stage.js';
import { button } from './ui.js';
import { movable, movementKeys, pose } from './movement.js';
import { benchPositionAllowed, courtyard, lampSurface, lampVisible, path, routeCollision, table } from './rules.js';

function floor(stage) {
  stage.box(stage.scene, '#a69a7d', [0, -0.09, 0.1], [9, 0.18, 6.9]);
  stage.box(stage.scene, '#8b8068', [-4.45, 0.3, 0.1], [0.15, 0.6, 6.9]);
  stage.box(stage.scene, '#8b8068', [0, 0.3, -3.25], [9, 0.6, 0.15]);
  for (let i = 0; i < 8; i++) {
    stage.box(stage.scene, i % 2 ? '#777368' : '#66665c', [0.19 - 0.035 * i, 0.009, 2.7 - 0.56 * i], [0.57, 0.018, 0.48]);
  }
}

async function waterCarrier(stage) {
  const carrier = new THREE.Group();
  carrier.position.set(path[0].x, 0, path[0].z);
  carrier.rotation.y = Math.PI;
  stage.scene.add(carrier);
  await Promise.all([
    stage.asset('zhou', [0, 0, 0], [0.48, 1.32, 0.4], carrier),
    stage.asset('tray', [0, 0.8, 0.26], [0.72, 0.05, 0.4], carrier),
  ]);
  return carrier;
}

export async function benchesPuzzle(ui, text, common, complete) {
  // 旧砖路与桌边保留托盘的宽度，试走采用当前凳子的位置。
  const stage = ui.track(createStage(ui.surface, text.canvas, { span: 3.5, pitch: 1.37 }));
  floor(stage);
  const initial = [{ x: -1.13, z: 0.15, yaw: 0 }, { x: 0.43, z: 0.74, yaw: 0 }];
  const states = initial.map((state) => ({ ...state }));
  const models = await Promise.all([
    stage.asset('bench', [-1.13, 0, 0.15]), stage.asset('bench', [0.43, 0, 0.74]),
    stage.asset('workbench', [table.x, 0, table.z]), waterCarrier(stage),
  ]);
  if (stage.disposed) return stage;
  let selected = 0;
  let busy = false;
  const selections = [];
  const items = models.slice(0, 2).map((model, index) => movable(stage, model, states[index], {
    select(active) { selections[index]?.setAttribute('aria-pressed', String(active)); if (active) selected = index; },
    move(x, z, yaw = states[index].yaw) {
      if (busy) return;
      const next = { x, z, yaw: yaw % (2 * Math.PI) };
      if (benchPositionAllowed(next, states[1 - index])) Object.assign(states[index], next);
    },
  }));
  selections.push(...items.map((item, index) => button(ui.tools, text.items[index], () => { stage.select(item.object); stage.canvas.focus(); })));
  // 试走期间暂停搬动，停步位置对应第一处受阻的砖面。
  button(ui.tools, common.rotate, () => { if (!busy) items[selected].rotate(Math.PI / 2); });
  const trial = button(ui.actions, text.test, () => {
    if (busy) return;
    busy = true;
    trial.disabled = true;
    stage.lock(true);
    const collision = routeCollision(states);
    const end = collision < 0 ? path.length - 1 : Math.max(0, collision - 2);
    stage.animate(2200, (ratio) => {
      const at = path[Math.round(ratio * end)];
      models[3].position.set(at.x, 0, at.z);
    }, () => {
      busy = false;
      trial.disabled = false;
      stage.lock(false);
      if (collision >= 0) { ui.say(text.blocked); return; }
      complete(states.map((state, index) => pose(`bench-${index ? 'b' : 'a'}`, [state.x, 0, state.z], state.yaw)));
    });
  }, 'puzzle-primary');
  ui.reset.onclick = () => {
    stage.stop(); busy = false; trial.disabled = false;
    states.forEach((state, index) => { Object.assign(state, initial[index]); items[index].place(state.x, state.z); });
    models[3].position.set(path[0].x, 0, path[0].z);
    ui.say(text.instruction); stage.draw();
  };
  stage.onKey((event) => !busy && movementKeys(event, items[selected]));
  stage.select(items[0].object);
  return stage;
}

export async function lampPuzzle(ui, text, common, complete) {
  // 院内操作与门外观察共用灯和门的模型。
  const stage = ui.track(createStage(ui.surface, text.canvas, { span: 3.5, pitch: 1.1 }));
  floor(stage);
  const state = { x: -0.05, z: -1.87, yaw: 0 };
  const initial = { ...state };
  const models = await Promise.all([
    stage.asset('lotus', [state.x, 0.94, state.z]),
    stage.asset('workbench', [table.x, 0, table.z]),
    stage.asset('stool', [2.49, 0, 1.19], [0.76, 0.44, 0.76]),
  ]);
  if (stage.disposed) return stage;
  const lamp = models[0];
  stage.box(stage.scene, '#78654d', [0.82, 1.12, -2.63], [1.48, 0.16, 0.45]);
  stage.box(stage.scene, '#8b8068', [3.58, 0.95, -1.1], [0.16, 1.9, 4.4]);
  stage.box(stage.scene, '#8b8068', [3.58, 0.95, 3.08], [0.16, 1.9, 0.7]);
  const door = await stage.asset('door', [3.58, 0, 2.08], [1.3, 1.9, 0.14]);
  if (stage.disposed) return stage;
  let closed = 0;
  const glow = new THREE.PointLight('#ffd58b', 0.9, 1.6);
  glow.position.y = 0.16;
  lamp.add(glow);
  const observer = ui.observation(text.observation);
  stage.observe(observer, { position: [6.6, 1.1, 1.55], target: [2.49, 0.66, 1.19], span: 0.9 });
  const caption = document.createElement('p');
  caption.className = 'puzzle-observation-caption';
  observer.parentElement.append(caption);
  const move = movable(stage, lamp, state, {
    move(x, z) {
      state.x = Math.max(courtyard.left + 0.3, Math.min(courtyard.right - 0.3, x));
      state.z = Math.max(courtyard.back + 0.2, Math.min(courtyard.front - 0.2, z));
      const surface = lampSurface(state);
      lamp.position.y = surface?.y ?? 0.1;
      refresh();
    },
    end() { ui.say(lampSurface(state) ? text.ready : text.unstable); },
  });
  function refresh() {
    const visible = lampVisible(state, closed >= 94);
    caption.textContent = closed < 94 ? text.closeFirst : visible ? text.visible : text.hidden;
    door.rotation.y = Math.PI / 2 - (1 - closed / 100) * 0.85;
    stage.draw();
  }
  const closure = ui.range(text.door, 0, 100, 0, (value) => { closed = value; refresh(); });
  let startClosure = 0;
  stage.bind(door, {
    start() { startClosure = closed; },
    move(point, delta, dx, dy) {
      closed = THREE.MathUtils.clamp(startClosure + dx * 0.5 - dy * 0.25, 0, 100);
      closure.value = String(Math.round(closed));
      refresh();
    },
  });
  // 灯底须完整落在承托面上，合门后再检查穿过门缝的视线。
  button(ui.tools, text.lamp, () => { stage.select(lamp); stage.canvas.focus(); });
  button(ui.actions, text.test, () => {
    if (!lampSurface(state)) { ui.say(text.unstable); return; }
    if (closed < 94) { ui.say(text.closeFirst); return; }
    if (!lampVisible(state, true)) { ui.say(text.hidden); return; }
    complete([pose('lotus', [state.x, lamp.position.y, state.z]), pose('door', [3.58, 0, 1.54], Math.PI / 2)]);
  }, 'puzzle-primary');
  ui.reset.onclick = () => {
    Object.assign(state, initial); move.place(state.x, state.z); closed = 0; closure.value = 0;
    ui.say(text.instruction); refresh();
  };
  stage.onKey((event) => movementKeys(event, move));
  refresh();
  return stage;
}
