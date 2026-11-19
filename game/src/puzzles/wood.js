import * as THREE from 'three';
import { createStage } from './stage.js';
import { button } from './ui.js';
import { movable, movementKeys, pose } from './movement.js';
import { cradleFits, planeMatches, planeTarget, supports } from './rules.js';

function inscription(stage, model, value) {
  const canvas = document.createElement('canvas');
  canvas.width = 128; canvas.height = 128;
  const context = canvas.getContext('2d');
  context.fillStyle = '#b58b54'; context.fillRect(0, 0, 128, 128);
  context.fillStyle = '#513c29'; context.font = '80px SimSun'; context.textAlign = 'center'; context.fillText(value, 64, 95);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const mark = stage.box(model, '#ffffff', [-0.2, 0.215, 0], [0.07, 0.002, 0.07]);
  mark.material.map = texture;
  mark.visible = false;
  return { mark, destroy() { texture.dispose(); } };
}

async function addPlane(stage, x, z, width) {
  const root = new THREE.Group();
  root.position.set(x, 0.16, z);
  stage.scene.add(root);
  const body = await stage.asset('plane', [0, 0, 0], [0.54, 0.21, width], root);
  if (stage.disposed) return { root, body };
  stage.box(root, '#a5a9a1', [0.01, -0.008, 0], [0.024, 0.024, width * 0.42]);
  return { root, body };
}

export async function planePuzzle(ui, text, common, complete) {
  // 两把刨子保持同一比例，刨口宽度与木料上的痕边共同参与匹配。
  const stage = ui.track(createStage(ui.surface, text.canvas, { span: 0.93, target: [0, 0.03, 0], pitch: 1.05, orbit: true }));
  stage.box(stage.scene, '#92724d', [0, -0.06, 0], [2.6, 0.12, 1.7]);
  const models = await Promise.all([addPlane(stage, -0.7, -0.42, 0.17), addPlane(stage, -0.7, 0.42, 0.31),
    stage.asset('shaving', [planeTarget.x, 0, planeTarget.z], [0.72, 0.08, 0.42])]);
  if (stage.disposed) return stage;
  const states = [{ x: -0.7, z: -0.42, yaw: 0.35 }, { x: -0.7, z: 0.42, yaw: -0.35 }];
  const selections = [];
  let selected = 0;
  let flipped = false;
  const engraving = ui.track(inscription(stage, models[1].root, text.surname));
  for (const z of [-planeTarget.width / 2, planeTarget.width / 2]) {
    stage.box(stage.scene, '#523f2e', [planeTarget.x, 0.081, planeTarget.z + z], [0.7, 0.006, 0.008]);
  }
  const items = models.slice(0, 2).map(({ root }, index) => {
    root.rotation.y = states[index].yaw;
    return movable(stage, root, states[index], {
      height: 0.16,
      select(active) { selections[index]?.setAttribute('aria-pressed', String(active)); if (active) selected = index; },
      move(x, z, yaw = states[index].yaw) {
        Object.assign(states[index], { x: THREE.MathUtils.clamp(x, -0.95, 0.95), z: THREE.MathUtils.clamp(z, -0.61, 0.61), yaw });
      },
    });
  });
  selections.push(...items.map((item, index) => button(ui.tools, text.items[index], () => {
    stage.select(item.object); stage.canvas.focus();
  })));
  button(ui.tools, text.flip, () => {
    flipped = !flipped;
    for (const model of models.slice(0, 2)) {
      model.body.rotation.x = flipped ? Math.PI : 0;
      model.body.position.y = flipped ? 0.21 : 0;
    }
    stage.draw();
  });
  button(ui.tools, common.turnLeft, () => items[selected].rotate(-Math.PI / 18));
  button(ui.tools, common.turnRight, () => items[selected].rotate(Math.PI / 18));
  // 对齐后保留刨尾刻字，完成位置同步到原木工台。
  button(ui.actions, text.test, () => {
    const state = states[selected];
    if (!planeMatches(state, selected ? 0.13 : 0.071)) { ui.say(text.mismatch); return; }
    engraving.mark.visible = true; stage.draw();
    complete([pose('wide-plane', [-0.55 + state.x - planeTarget.x, 1.02, -0.99 + state.z - planeTarget.z], 0.08)]);
  }, 'puzzle-primary');
  ui.reset.onclick = () => {
    states.forEach((state, index) => {
      Object.assign(state, { x: -0.7, z: index ? 0.42 : -0.42, yaw: index ? -0.35 : 0.35 });
      items[index].place(state.x, state.z); models[index].body.rotation.x = 0; models[index].body.position.y = 0;
    });
    flipped = false; engraving.mark.visible = false; ui.say(text.instruction); stage.draw();
  };
  stage.onKey((event) => movementKeys(event, items[selected], 0.025));
  stage.select(items[0].object);
  return stage;
}

export async function cradlePuzzle(ui, text, common, complete) {
  const stage = ui.track(createStage(ui.surface, text.canvas, { span: 0.96, target: [0, 0.1, 0], pitch: 1.05, orbit: true }));
  stage.box(stage.scene, '#92724d', [0, -0.06, 0], [2.9, 0.12, 1.5]);
  const model = await addPlane(stage, 0, -0.47, 0.31);
  const bases = await Promise.all(supports.map((support) =>
    stage.asset(support.key, [support.x, 0, support.z], [support.width, support.y, support.depth])));
  if (stage.disposed) return stage;
  // 凹槽和刃口使用相同的接触位置，侧视图可见两端承托与中央空隙。
  const cradle = supports[2];
  for (const x of [-0.23, 0.23]) {
    stage.box(stage.scene, '#a1865e', [cradle.x + x, 0.16, cradle.z], [0.12, 0.065, 0.42]);
  }
  const state = { x: 0, z: -0.47, yaw: 0.28 };
  let placed = false;
  const observer = ui.observation(text.observation);
  const camera = stage.observe(observer, { position: [0.83, 0.24, 2], target: [0.83, 0.17, 0.08], span: 0.4 });
  const move = movable(stage, model.root, state, {
    height: 0.16,
    move(x, z, yaw = state.yaw) {
      placed = false;
      Object.assign(state, { x: THREE.MathUtils.clamp(x, -1.07, 1.07), z: THREE.MathUtils.clamp(z, -0.55, 0.55), yaw });
      model.root.position.y = 0.3;
      model.root.rotation.x = 0;
      bases[1].position.y = 0;
    },
    end() { ui.say(text.instruction); },
  });
  button(ui.tools, common.turnLeft, () => move.rotate(-Math.PI / 18));
  button(ui.tools, common.turnRight, () => move.rotate(Math.PI / 18));
  // 放下后显示实际承托关系，软布会随刃口抬起。
  button(ui.actions, text.test, () => {
    const nearby = supports.find((support) => Math.abs(state.x - support.x) < 0.32 && Math.abs(state.z - support.z) < 0.23);
    if (!nearby) { ui.say(text.align); return; }
    camera.position.set(nearby.x, 0.24, 2); camera.lookAt(nearby.x, 0.17, nearby.z);
    model.root.position.y = nearby.key === 'cradle' ? 0.195 : 0.125;
    if (cradleFits(state)) {
      placed = true;
      complete([pose('wide-plane', [2.88 + state.x - cradle.x, 0.99, -0.88 + state.z - cradle.z], 0.05),
        pose('shaving', [2.84, 0.82, -1.32])]);
    } else if (nearby.key === 'cloth') {
      bases[1].position.y = 0.035; model.root.rotation.x = 0.06; ui.say(text.cloth);
    } else ui.say(nearby.key === 'tray' ? text.tray : text.align);
    stage.draw();
  }, 'puzzle-primary');
  ui.reset.onclick = () => {
    Object.assign(state, { x: 0, z: -0.47, yaw: 0.28 }); move.place(state.x, state.z);
    ui.say(text.instruction); stage.draw();
  };
  stage.onKey((event) => !placed && movementKeys(event, move, 0.025));
  stage.draw();
  return stage;
}
