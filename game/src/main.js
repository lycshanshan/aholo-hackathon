import * as THREE from 'three';
import { loadModel } from './assets.js';
import { createDialogue } from './dialogue.js';
import { loadGameData } from './game-data.js';
import { group, mesh } from './geometry.js';
import { createNotebook } from './notebook.js';
import { makeGrandma, makePlayer } from './player.js';
import { createProgress } from './progress.js';
import { buildShop, grandma, objectPoints, shopId } from './shop.js';

const ui = {
  stage: document.querySelector('#stage'),
  loading: document.querySelector('#loading'),
  guide: document.querySelector('#guide'),
  count: document.querySelector('#count'),
  inspect: document.querySelector('#inspect'),
  inspectLabel: document.querySelector('#inspect span'),
  reset: document.querySelector('#reset'),
  movementMode: document.querySelector('#movement-mode'),
  movementLabel: document.querySelector('#movement-mode span'),
  dpad: document.querySelector('#dpad'),
};

function makeWorld() {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.65));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  ui.stage.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-8, 8, 5, -5, 0.1, 80);
  const offset = new THREE.Vector3(8.6, 8.3, 11.8);
  const target = new THREE.Vector3(0, 1.18, 0.40);
  camera.position.copy(target).add(offset);
  camera.lookAt(target);

  scene.add(new THREE.HemisphereLight('#f6e0c7', '#a4977d', 1.75));
  const sun = new THREE.DirectionalLight('#ffdbac', 2.35);
  sun.position.set(-4, 8, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1536, 1536);
  Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 0.5, far: 25 });
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.normalBias = 0.025;
  sun.shadow.bias = -0.0002;
  sun.shadow.radius = 2.5;
  scene.add(sun);

  const fill = new THREE.DirectionalLight('#c3d3c9', 0.55);
  fill.position.set(5, 4, -5);
  scene.add(fill);
  const models = buildShop(scene);
  const modelReady = new Map(Object.entries(models).map(([id, target]) => [
    id,
    loadModel(id, target).catch((error) => console.warn('物件模型加载失败，已保留本地模型。', id, error)),
  ]));

  const ground = mesh(scene, new THREE.PlaneGeometry(120, 120), new THREE.ShadowMaterial({ opacity: 0.25 }), 0, -0.57, 0);
  ground.rotation.x = -Math.PI / 2;
  ground.castShadow = false;

  const right = new THREE.Vector2(offset.z, -offset.x).normalize();
  const ahead = new THREE.Vector2(-offset.x, -offset.z).normalize();
  function resize() {
    const { clientWidth: width, clientHeight: height } = ui.stage;
    const aspect = width / Math.max(1, height);
    const halfHeight = Math.max(5.55, 7.08 / aspect);
    camera.left = -halfHeight * aspect;
    camera.right = halfHeight * aspect;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }
  new ResizeObserver(resize).observe(ui.stage);
  resize();
  return { renderer, scene, camera, right, ahead, models, modelReady };
}

function addMarkers(scene, points) {
  const positions = new THREE.OctahedronGeometry(0.086, 0);
  const inside = new THREE.MeshBasicMaterial({ color: '#ffe4aa', toneMapped: false });
  const outside = new THREE.MeshBasicMaterial({ color: '#d6b47c', toneMapped: false });
  const talk = new THREE.MeshBasicMaterial({ color: '#b0d4c7', toneMapped: false });
  const read = new THREE.MeshBasicMaterial({ color: '#918573', toneMapped: false });
  const markers = points.map(({ entry, x, height, z }) => {
    const anchor = group(scene, entry.title, x, height, z);
    const marker = mesh(anchor, positions, outside, 0, 0, 0);
    marker.castShadow = false;
    marker.receiveShadow = false;
    return marker;
  });

  return (seconds, near, progress, canTalk) => {
    markers.forEach((marker, i) => {
      const point = points[i];
      const isCharacter = point.kind === 'characters';
      marker.visible = !isCharacter || canTalk(point.id);
      const color = isCharacter ? talk : progress.has(point.id) ? read : outside;
      marker.material = i === near ? inside : color;
      marker.position.y = Math.sin(seconds * 2.4 + i) * 0.036;
      marker.rotation.y = seconds * 0.8 + i;
      marker.scale.setScalar(i === near ? 1.28 : 1);
    });
  };
}

const leftward = [-1, 0];
const rightward = [1, 0];
const forward = [0, 1];
const backward = [0, -1];
const directions = new Map([
  ['ArrowLeft', leftward], ['KeyA', leftward],
  ['ArrowRight', rightward], ['KeyD', rightward],
  ['ArrowUp', forward], ['KeyW', forward],
  ['ArrowDown', backward], ['KeyS', backward],
]);

function showChapter(chapter) {
  document.title = `守灯人 · ${chapter.title}`;
  document.querySelector('#chapter-title').textContent = chapter.title;
  document.querySelector('#chapter-name').textContent = chapter.chapter;
  document.querySelector('#scene-place').textContent = chapter.place;
  document.querySelector('#scene-time').textContent = chapter.time;
  document.querySelector('#scene-intro').textContent = chapter.intro;
  document.querySelector('#stage-place').textContent = chapter.title;
}

function start(data) {
  // 场景坐标和模型来自店铺布局，交互内容按 ID 关联文本表。
  const chapter = data.scenes.find(({ id }) => id === shopId);
  const shopObjects = data.objects.filter(({ scene }) => scene === shopId);
  const shopDialogs = data.dialogs.filter(({ scene }) => scene === shopId);
  const grandmaEntry = data.characters.find(({ id }) => id === grandma.id);
  const points = [
    ...objectPoints.map((point) => ({
      ...point,
      kind: 'objects',
      entry: shopObjects.find(({ id }) => id === point.id),
    })),
    { ...grandma, entry: grandmaEntry },
  ];
  const { renderer, scene, camera, right, ahead, models, modelReady } = makeWorld();
  const previews = new Map(objectPoints.map(({ id, elevation }) => [id, { source: models[id].mount, elevation }]));
  const progress = createProgress(data);
  showChapter(chapter);
  const player = makePlayer(scene);
  const grandmaModel = makeGrandma(scene, grandmaEntry.title, grandma);
  loadModel(grandma.id, grandmaModel).catch((error) => console.warn('奶奶的模型加载失败，已保留本地模型。', error));
  const updateMarkers = addMarkers(scene, points);
  const pressed = new Set();
  const touches = new Map();
  const movement = new THREE.Vector2();
  let near = -1;
  let lastFrame = null;

  // 进入人物的交谈范围即记为遇见，交互提示优先显示最近的目标。
  function updatePrompt() {
    const { x, z } = player.actor.position;
    let closest = Infinity;
    near = -1;
    points.forEach((point, i) => {
      const distance = Math.hypot(x - point.x, z - point.z);
      if (distance > point.reach) return;
      if (point.kind === 'characters') {
        if (progress.record(point.id)) updateProgress();
        if (!dialogue.nextFor(point.id)) return;
      }
      if (distance < closest) {
        near = i;
        closest = distance;
      }
    });
    ui.inspect.hidden = near === -1 || notebook.dialog.open || dialogue.modal.open;
    if (near !== -1) {
      const { kind, entry } = points[near];
      ui.inspectLabel.textContent = kind === 'characters' ? `与${entry.title}交谈` : `查看${entry.title}`;
    }
  }

  function clearMovement() {
    pressed.clear();
    touches.clear();
  }

  function pauseMovement() {
    clearMovement();
    ui.inspect.hidden = true;
  }

  const notebook = createNotebook(data, progress, previews, modelReady, pauseMovement);
  const dialogue = createDialogue(shopDialogs, data.characters, progress, pauseMovement, updateProgress);
  document.querySelector('#object-total').textContent = String(shopObjects.length).padStart(2, '0');

  function updateProgress() {
    const seen = shopObjects.filter(({ id }) => progress.has(id)).length;
    ui.count.textContent = String(seen).padStart(2, '0');
    const complete = seen === shopObjects.length && shopDialogs.every(({ id }) => progress.has(id));
    ui.guide.textContent = complete ? chapter.completeGuide : chapter.guide;
    notebook.updateEntries();
  }
  updateProgress();

  function inspectNearby() {
    if (near === -1 || notebook.dialog.open || dialogue.modal.open) return;
    const { kind, entry } = points[near];
    if (kind === 'characters') {
      dialogue.openFor(entry.id);
      return;
    }
    if (progress.record(entry.id)) updateProgress();
    notebook.openItem(entry);
  }

  let running = false;
  function toggleRunning() {
    running = !running;
    ui.movementMode.setAttribute('aria-pressed', String(running));
    ui.movementLabel.textContent = running ? '奔跑' : '步行';
  }

  // 弹窗独占交互，对话中的 E 推进当前台词。
  window.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (dialogue.modal.open) {
      if (event.code === 'KeyE' && !event.repeat) dialogue.advance();
      return;
    }
    if (event.code === 'KeyN' && !event.repeat) {
      notebook.openNotebook();
      return;
    }
    if (notebook.dialog.open) return;
    if (event.key === 'Shift' && !event.repeat) toggleRunning();
    if (directions.has(event.code)) {
      event.preventDefault();
      pressed.add(event.code);
    }
    if (event.code === 'KeyE' && !event.repeat) inspectNearby();
  });
  window.addEventListener('keyup', (event) => pressed.delete(event.code));
  window.addEventListener('blur', clearMovement);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearMovement();
  });

  // 触屏按钮与键盘共用移动方向，指针取消时释放按键。
  for (const button of ui.dpad.querySelectorAll('button')) {
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      touches.set(event.pointerId, button.dataset.move);
    });
    for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      button.addEventListener(name, (event) => touches.delete(event.pointerId));
    }
  }
  ui.inspect.addEventListener('click', inspectNearby);
  ui.movementMode.disabled = false;
  ui.movementMode.addEventListener('click', toggleRunning);
  notebook.dialog.addEventListener('close', updatePrompt);
  dialogue.modal.addEventListener('close', updatePrompt);
  ui.reset.disabled = false;
  ui.reset.addEventListener('click', () => {
    clearMovement();
    player.reset();
    updatePrompt();
  });

  function frame(now) {
    const seconds = lastFrame === null ? 0 : Math.min((now - lastFrame) / 1000, 0.05);
    lastFrame = now;
    // 弹窗打开时保留上一帧店内画面。
    if (notebook.dialog.open || dialogue.modal.open) return;
    let x = 0;
    let y = 0;
    const held = new Set([...pressed, ...touches.values()].map((key) => directions.get(key)));
    for (const [dx, dy] of held) {
      x += dx;
      y += dy;
    }
    movement.copy(right).multiplyScalar(x).addScaledVector(ahead, y).normalize();
    player.step(movement.x, movement.y, seconds, running);
    updatePrompt();
    updateMarkers(now / 1000, near, progress, dialogue.nextFor);
    renderer.render(scene, camera);
    ui.loading.hidden = true;
  }
  renderer.setAnimationLoop(frame);
}

try {
  start(await loadGameData());
} catch (error) {
  console.error(error);
  ui.loading.textContent = '无法载入白事店。请通过本地服务打开，并使用支持 WebGL 2 的浏览器。';
}
