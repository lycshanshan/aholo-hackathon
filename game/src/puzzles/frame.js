import * as THREE from 'three';
import { createFrameRig } from '../frame-rig.js';
import { createStage } from './stage.js';
import { button } from './ui.js';
import { movable, movementKeys, pose } from './movement.js';
import { frameFits, frameSlot, supportFits } from './rules.js';

function addPhoto(stage, frame) {
  const texture = new THREE.TextureLoader().load(new URL('../../assets/photo-store.png', import.meta.url).href, stage.draw);
  texture.colorSpace = THREE.SRGBColorSpace;
  const picture = stage.box(frame, '#ffffff', [0, 0.235, 0.032], [0.46, 0.31, 0.002]);
  picture.material.map = texture;
  return texture;
}

export async function framePuzzle(ui, text, common, complete, placing, supportAngle = 0.52) {
  // 相框主体与背撑保持独立，铰链轴同时服务拖动和场景中的最终姿态。
  const stage = ui.track(createStage(ui.surface, text.canvas, {
    span: placing ? 0.84 : 0.43, target: [0, 0.22, -0.07], yaw: placing ? 0.18 : 2.65, pitch: 0.5, orbit: true,
  }));
  const { frame, hinge } = await createFrameRig();
  if (stage.disposed) return stage;
  if (placing) hinge.rotation.x = supportAngle;
  stage.scene.add(frame);
  const texture = addPhoto(stage, frame);
  ui.track({ destroy() { texture.dispose(); } });
  stage.box(stage.scene, '#90704c', [0, -0.04, 0], [placing ? 2.6 : 1.3, 0.08, placing ? 1.3 : 0.9]);
  const observer = ui.observation(placing ? text.observation : text.side);
  stage.observe(observer, {
    position: placing ? [1.7, 0.75, 3] : [3, 0.25, 0],
    target: placing ? [0.3, 0.23, -0.16] : [0, 0.22, -0.05], span: placing ? 0.58 : 0.33,
  });
  button(ui.tools, common.front, () => stage.view(0.1, 0.4));
  button(ui.tools, common.back, () => stage.view(2.65, 0.5));
  if (placing) setupPlacement(stage, frame, ui, text, common, complete);
  else setupHinge(stage, frame, hinge, ui, text, common, complete);
  stage.draw();
  return stage;
}

function setupHinge(stage, frame, hinge, ui, text, common, complete) {
  let angle = 0.08;
  let start = angle;
  let busy = false;
  const foot = stage.box(hinge, '#bfa77b', [0, -0.27, -0.003], [0.18, 0.09, 0.055], 0.15);
  const guide = stage.box(stage.scene, '#d1ba82', [0, 0.006, -0.15], [0.2, 0.012, 0.065], 0.7);
  function change(value) {
    if (busy) return;
    angle = THREE.MathUtils.clamp(value, 0.04, 1.25);
    hinge.rotation.x = angle;
    range.value = String(Math.round(angle * 100));
    frame.rotation.x = 0;
    ui.say(text.instruction);
    stage.draw();
  }
  const range = ui.range(text.open, 4, 125, 8, (value) => change(value / 100));
  stage.bind(foot, {
    plane: new THREE.Plane(new THREE.Vector3(0, 0, 1), 0.05),
    start() { start = angle; },
    move(point, delta, dx, dy) { change(start + dx * 0.006 - dy * 0.009); },
  });
  const trial = button(ui.actions, text.test, () => {
    if (busy) return;
    busy = true; trial.disabled = true; stage.lock(true);
    const fits = supportFits(angle);
    stage.animate(700, (ratio) => { frame.rotation.x = fits ? -0.12 * ratio : -Math.sin(ratio * Math.PI) * 0.48; }, () => {
      busy = false; trial.disabled = false; stage.lock(false);
      if (fits) complete([pose('frame-leg', [0, 0.28, -0.025], 0, angle)]);
      else ui.say(angle < 0.41 ? text.folded : text.overopened);
    });
  }, 'puzzle-primary');
  ui.reset.onclick = () => { stage.stop(); busy = false; trial.disabled = false; change(0.08); };
  stage.onKey((event) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.code)) return false;
    change(angle + (['ArrowRight', 'ArrowUp'].includes(event.code) ? 0.025 : -0.025));
    return true;
  });
  guide.visible = true;
  change(angle);
}

function setupPlacement(stage, frame, ui, text, common, complete) {
  const state = { x: -0.65, z: 0.18, yaw: 0.38 };
  frame.position.set(state.x, 0, state.z);
  frame.rotation.set(-0.12, state.yaw, 0);
  for (const z of [frameSlot.z - 0.06, frameSlot.z + 0.06]) {
    stage.box(stage.scene, '#453e30', [frameSlot.x, 0.012, z - 0.15], [frameSlot.width, 0.024, 0.025]);
  }
  const move = movable(stage, frame, state, {
    move(x, z, yaw = state.yaw) {
      state.x = THREE.MathUtils.clamp(x, -0.95, 0.95);
      state.z = THREE.MathUtils.clamp(z, -0.38, 0.38);
      state.yaw = Math.atan2(Math.sin(yaw), Math.cos(yaw));
    },
    end() {
      if (frameFits(state)) {
        state.z = frameSlot.z; frame.position.z = state.z;
        ui.say(text.seated);
      } else ui.say(text.adjust);
    },
  });
  button(ui.tools, common.turnLeft, () => move.rotate(-Math.PI / 18));
  button(ui.tools, common.turnRight, () => move.rotate(Math.PI / 18));
  button(ui.actions, text.test, () => {
    if (!frameFits(state)) { ui.say(text.adjust); return; }
    const x = 0.82 + (state.x - frameSlot.x) * 0.5;
    const z = -1.46 + (state.z - frameSlot.z) * 0.5;
    complete([pose('frame', [x, 1.06, z], state.yaw - 0.16, -0.12),
      pose('selected-photo', [x, 1.295, z + 0.04], state.yaw - 0.16, -0.12)]);
  }, 'puzzle-primary');
  ui.reset.onclick = () => {
    Object.assign(state, { x: -0.65, z: 0.18, yaw: 0.38 }); move.place(state.x, state.z); ui.say(text.instruction);
  };
  stage.onKey((event) => movementKeys(event, move, 0.025));
}
