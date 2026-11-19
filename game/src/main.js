import * as THREE from 'three';
import { createActivity } from './activity.js';
import { businessScenes, caseStatus, chapters, currentPuzzle, endings, firstScene, requirementsMet } from './chapters.js';
import { createDialogue } from './dialogue.js';
import { loadGameData } from './game-data.js';
import { group, mesh } from './geometry.js';
import { createNotebook } from './notebook.js';
import { makePlayer } from './player.js';
import { createProgress } from './progress.js';
import { buildArea } from './scenery.js';
import { businessPuzzleIds, mountBusinessPuzzle } from './puzzles/index.js';

const select = (id) => document.getElementById(id);
const ui = {
  stage: select('stage'), loading: select('loading'), guide: select('guide'),
  inspect: select('inspect'), inspectLabel: document.querySelector('#inspect span'),
  reset: select('reset'), movement: select('movement-mode'), movementLabel: document.querySelector('#movement-mode span'),
  dpad: select('dpad'), next: select('chapter-next'), skip: select('chapter-skip'),
  journalSkip: select('journal-skip'), notice: select('scene-notice'), curtain: select('scene-curtain'),
};

const directions = new Map([
  ['ArrowLeft', [-1, 0]], ['KeyA', [-1, 0]],
  ['ArrowRight', [1, 0]], ['KeyD', [1, 0]],
  ['ArrowUp', [0, 1]], ['KeyW', [0, 1]],
  ['ArrowDown', [0, -1]], ['KeyS', [0, -1]],
]);
const houseNames = { lin: '林家', wang: '王家', du: '杜家' };
const statuses = { complete: '已完成', skipped: '已跳过', handled: '已处理' };
const backgrounds = {
  clinic: ['#949488', '#48574e'],
  funeral: ['#9d8b72', '#493e35'],
  lin: ['#8f8164', '#3a4034'],
  wang: ['#98947c', '#454739'],
  du: ['#9d8a73', '#4a3d30'],
  autumn: ['#8d7958', '#3c382e'],
  winter: ['#7f8580', '#363a38'],
  city: ['#9aa29d', '#455251'],
  spring: ['#999779', '#434c3d'],
};

function makeWorld() {
  // 一个渲染器和一组灯光贯穿全程；场景只替换局部布景和观察范围。
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.65));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  ui.stage.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-8, 8, 5, -5, 0.1, 80);
  const offset = new THREE.Vector3(8.6, 8.3, 11.8);
  const target = new THREE.Vector3(0, 1.03, 0.18);
  camera.position.copy(target).add(offset);
  camera.lookAt(target);
  const right = new THREE.Vector2(offset.z, -offset.x).normalize();
  const ahead = new THREE.Vector2(-offset.x, -offset.z).normalize();

  scene.add(new THREE.HemisphereLight('#f6e6d1', '#a4977d', 1.65));
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
  const fill = new THREE.DirectionalLight('#c3d3c9', 0.65);
  fill.position.set(5, 4, -5);
  scene.add(fill);
  const ground = mesh(scene, new THREE.PlaneGeometry(120, 120), new THREE.ShadowMaterial({ opacity: 0.26 }), 0, -0.57, 0);
  ground.rotation.x = -Math.PI / 2;
  ground.castShadow = false;

  let view = 5;
  function resize() {
    const { clientWidth: width, clientHeight: height } = ui.stage;
    const aspect = width / Math.max(1, height);
    const halfHeight = Math.max(view, 6.5 / aspect);
    camera.left = -halfHeight * aspect;
    camera.right = halfHeight * aspect;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }
  new ResizeObserver(resize).observe(ui.stage);

  return {
    renderer, scene, camera, right, ahead,
    frameArea(area) {
      const [inner, outer] = backgrounds[area.theme] ?? ['#85816b', '#383832'];
      ui.stage.style.setProperty('--scene-inner', inner);
      ui.stage.style.setProperty('--scene-outer', outer);
      sun.color.set(area.theme === 'winter' || area.theme === 'city' ? '#e6ece2' : '#ffdbac');
      sun.intensity = area.theme === 'winter' ? 1.67 : 2.29;
      view = area.view;
      resize();
    },
  };
}

const markerShape = new THREE.OctahedronGeometry(0.084);
const markerColors = {
  near: new THREE.MeshBasicMaterial({ color: '#ffebae', toneMapped: false }),
  action: new THREE.MeshBasicMaterial({ color: '#dcb781', toneMapped: false }),
  character: new THREE.MeshBasicMaterial({ color: '#abd9c8', toneMapped: false }),
};

function markersFor(root, points) {
  return points.map(({ x, z, height }) => {
    const marker = mesh(group(root, '交互标记', x, height, z), markerShape, markerColors.action, 0, 0, 0);
    marker.castShadow = false;
    marker.receiveShadow = false;
    return marker;
  });
}

function showChapter(chapter) {
  document.title = `长宁白事铺 · ${chapter.title}`;
  select('chapter-title').textContent = chapter.title;
  select('chapter-name').textContent = chapter.chapter;
  select('stage-chapter').textContent = chapter.chapter;
  select('scene-place').textContent = chapter.place;
  select('scene-time').textContent = chapter.time;
  select('scene-intro').textContent = chapter.intro;
  select('stage-place').textContent = chapter.title;
}

function game(data) {
  // 文本、碰撞范围和存档只通过场景与交互的 ID 相连。
  const byId = Object.fromEntries(Object.entries(data).map(([type, list]) =>
    [type, new Map(list.map((entry) => [entry.id, entry]))]));
  const progress = createProgress(data, firstScene);
  const { renderer, scene, camera, right, ahead, frameArea } = makeWorld();
  const player = makePlayer(scene);
  const visits = new Map();
  const pressed = new Set();
  const touches = new Map();
  const movement = new THREE.Vector2();
  let current;
  let near;
  let running = false;
  let noticeTimer;
  let lastFrame;

  const notebook = createNotebook(data, progress, findObjectModel, pauseMovement);
  const dialogue = createDialogue(data.dialogs, data.characters, progress, pauseMovement, onDialogueComplete);
  const activity = createActivity(pauseMovement, showSkip);
  const modalOpen = () => notebook.dialog.open || dialogue.modal.open || activity.modal.open;
  const optional = () => current.id === 'business' || businessScenes.includes(current.id);
  const finished = () => requirementsMet(progress, current.area.tasks);

  function clearMovement() {
    pressed.clear();
    touches.clear();
  }

  function pauseMovement() {
    clearMovement();
    ui.inspect.hidden = true;
  }

  function showNotice(text) {
    clearTimeout(noticeTimer);
    ui.notice.textContent = text;
    ui.notice.hidden = !text;
    if (text) noticeTimer = setTimeout(() => { ui.notice.hidden = true; }, 3500);
  }

  function modelFor(point, world = current.world) {
    const source = world.parts.get(point.model);
    if (!source) return null;
    return { source, elevation: point.elevation ?? 0.57, ready: world.ready.get(point.model) };
  }

  function makeVisit(id) {
    const area = chapters[id];
    const world = buildArea(scene, id, area);
    const points = area.points.map((point) => ({ ...point, entry: byId[point.kind].get(point.id) }));
    const markers = markersFor(world.root, points);
    for (const point of points) {
      const { id: step } = point;
      if (point.kind !== 'actions') continue;
      if (progress.has(step) || (businessPuzzleIds.has(step) && progress.skipped(step))) {
        const savedPose = progress.pose(step);
        if (savedPose) world.applyPose(savedPose);
        else world.showPose(step);
      }
    }
    for (const round of data.dialogs) {
      if (round.scene === id && progress.has(round.id)) world.showPose(round.id);
    }
    world.root.visible = false;
    return { id, area, world, points, markers, chapter: byId.scenes.get(id) };
  }

  function getVisit(id) {
    if (!visits.has(id)) visits.set(id, makeVisit(id));
    return visits.get(id);
  }

  function findObjectModel(entry) {
    const { points, world } = getVisit(entry.scene);
    return modelFor(points.find((point) => point.id === entry.id), world);
  }

  function enter() {
    if (current) current.world.root.visible = false;
    const id = progress.scene;
    if (id === 'business' && businessScenes.every((house) => caseStatus(progress, house) !== 'open')) {
      progress.go('decision');
      enter();
      return;
    }
    current = getVisit(id);
    current.world.root.visible = true;
    near = null;
    dialogue.setScene(id);
    frameArea(current.area);
    showChapter(current.chapter);
    showNotice('');
    pauseMovement();
    ui.curtain.classList.remove('scene-curtain--active');
    void ui.curtain.offsetWidth;
    ui.curtain.classList.add('scene-curtain--active');
    update();
    player.reset({ spawn: current.area.spawn, collision: current.world.collision });
  }

  function go(id, options) {
    if (activity.modal.open) activity.modal.close();
    progress.go(id, options);
    enter();
  }

  function update() {
    const { id, area, chapter, points, world } = current;
    const isComplete = finished();
    ui.guide.textContent = id !== 'business' && isComplete ? chapter.completeGuide : chapter.guide;
    ui.skip.hidden = !optional();
    ui.journalSkip.hidden = !optional();
    const nextLabel = id === 'business' ? '查看经营单'
      : endings[id] && isComplete ? '查看尾声' : isComplete ? chapter.nextLabel : '';
    ui.next.hidden = !nextLabel;
    ui.next.textContent = nextLabel ?? '';

    for (const actor of points.filter((point) => point.kind === 'characters')) {
      if (id === 'decision' || id === 'village-stock' || id === 'city-work') {
        world.parts.get(actor.model).visible = requirementsMet(progress, actor.requires);
      }
    }
    world.collision.invalidate();
    notebook.updateEntries();
  }

  function advance() {
    if (modalOpen()) return;
    const { area, id } = current;
    if (area.advanceOn && progress.has(area.advanceOn)) go(area.next);
    else if (endings[id] && finished() && !progress.has(endings[id])) showEnding();
  }

  function onDialogueComplete(id) {
    current.world.showPose(id);
    update();
  }

  function enabled(point) {
    if (!requirementsMet(progress, point.requires)) return false;
    if (point.kind === 'characters') return Boolean(dialogue.nextFor(point.id));
    if (point.kind === 'objects') return !progress.has(point.id);
    return !progress.has(point.id) && !progress.skipped(point.id);
  }

  function updateMarkers(now) {
    // 标记显示当前位置可触发的交互，进入谈话范围时记入人物笔记。
    const { x, z } = player.actor.position;
    let closest = Infinity;
    near = null;
    current.points.forEach((point, i) => {
      const marker = current.markers[i];
      const distance = Math.hypot(x - point.x, z - point.z);
      const available = requirementsMet(progress, point.requires);
      if (available && point.kind === 'characters' && distance <= point.reach && progress.record(point.id)) {
        notebook.updateEntries();
      }
      marker.visible = enabled(point);
      if (marker.visible && distance <= point.reach && distance < closest) {
        near = point;
        closest = distance;
      }
      marker.position.y = Math.sin(now / 380 + i) * 0.034;
      marker.rotation.y = now / 1250;
      marker.material = point.kind === 'characters' ? markerColors.character : markerColors.action;
    });
    if (near) {
      const marker = current.markers[current.points.indexOf(near)];
      marker.material = markerColors.near;
      const { kind, entry } = near;
      ui.inspectLabel.textContent = kind === 'characters' ? `与${entry.title}交谈`
        : kind === 'objects' ? `查看${entry.title}` : entry.title;
    }
    ui.inspect.hidden = !near || modalOpen();
  }

  function interact() {
    if (!near || modalOpen() || !enabled(near)) return;
    const { kind, entry, id } = near;
    if (kind === 'characters') dialogue.openFor(id);
    if (kind === 'objects') {
      progress.record(id);
      notebook.openItem(entry);
      update();
    }
    if (kind === 'actions') openAction(near);
  }

  function openAction(point) {
    if (businessPuzzleIds.has(point.id)) { openBusinessPuzzle(point); return; }
    // 试摆会改变场景中的实体。取消时还原，确认后才写入进度。
    const { id, entry } = point;
    const world = current.world;
    const restore = world.snapshot();
    let committed = false;
    const cleanup = () => { if (!committed) restore(); };
    const options = entry.choices ?? [{ label: entry.label, feedback: entry.result }];
    const choices = options.map(({ label, feedback }, index) => ({
      label,
      detail: id === 'branch-choice' ? feedback : undefined,
      activate() {
        if (id === 'branch-choice') {
          go(index === 0 ? 'city-close' : 'village-stock', { mark: [index === 0 ? 'choose-city' : 'choose-village'] });
          return;
        }
        restore();
        world.showPose(id, index);
        committed = true;
        progress.record(id);
        update();
        if (feedback) activity.showFeedback(feedback, true);
        else activity.modal.close();
      },
    }));
    activity.open({
      title: entry.title, description: entry.description,
      kind: id === 'branch-choice' ? '去留' : optional() ? '经营' : '备物',
      model: modelFor(point), allowSkip: optional(),
      drag: point.drag ? (id === 'fold-lotus' ? '拖合纸瓣' : '沿扎口穿入花枝') : null,
      onDrag: (ratio) => world.drag(id, ratio),
      choices, cleanup,
    });
  }

  function openBusinessPuzzle(point) {
    const { id, entry } = point;
    const world = current.world;
    const angle = progress.pose('wang-support')?.find(([key]) => key === 'frame-leg')?.[5];
    activity.open({
      title: entry.title, description: entry.description, kind: '经营', allowSkip: true, puzzleId: id, choices: [],
      mount: (host) => mountBusinessPuzzle(host, id, byId.puzzles, (placement) => {
        progress.record(id, placement);
        world.applyPose(placement);
        update();
        const nextId = { 'wang-support': 'wang-frame', 'du-plane': 'du-cradle' }[id];
        const next = current.points.find((entry) => entry.id === nextId);
        const continuePuzzle = next && enabled(next) ? () => openBusinessPuzzle(next) : undefined;
        activity.showFeedback(entry.result, true, continuePuzzle);
      }, angle),
    });
  }

  function showJobs() {
    activity.open({
      title: '经营单', description: '三户托办的丧事，按门牌去看看。', kind: '经营', allowSkip: true,
      choices: businessScenes.map((id) => {
        const status = caseStatus(progress, id);
        return {
          label: houseNames[id],
          detail: statuses[status] ?? byId.scenes.get(id).title,
          disabled: status !== 'open',
          activate: () => go(id),
        };
      }),
    });
  }

  function showSkip() {
    if (!optional()) return;
    const id = current.id;
    const puzzle = activity.puzzleId ?? (id === 'business' ? null : currentPuzzle(progress, id));
    const choices = [];
    if (puzzle) {
      choices.push({
        label: '跳过当前谜题',
        activate() {
          activity.modal.close();
          progress.go(id, { skip: [puzzle] });
          current.world.showPose(puzzle);
          update();
          showNotice(finished() ? '这家的余事由他们自理。' : '这一件由家属自己安排。');
        },
      }, {
        label: '跳过本场葬礼',
        activate: () => go('business', { skip: [id] }),
      });
    }
    choices.push({ label: '跳过经营阶段', activate: () => go('decision') });
    activity.open({ title: '跳过选项', kind: '经营', choices });
  }

  function showEnding() {
    const ending = endings[current.id];
    const { title, description } = byId.actions.get(ending);
    progress.record(ending);
    activity.open({
      title, description, kind: '尾声',
      choices: [
        { label: '回到场景', activate: () => activity.modal.close() },
        { label: '从头开始', activate: () => {
          activity.modal.close();
          progress.restart();
          progress.record('a-zhou');
          for (const visit of visits.values()) scene.remove(visit.world.root);
          visits.clear();
          enter();
        } },
      ],
    });
  }

  function toggleRunning() {
    running = !running;
    ui.movement.setAttribute('aria-pressed', String(running));
    ui.movementLabel.textContent = running ? '奔跑' : '步行';
  }

  function keydown(event) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (dialogue.modal.open) {
      if (event.code === 'KeyE' && !event.repeat) dialogue.advance();
      return;
    }
    if (activity.modal.open) return;
    if (event.code === 'KeyN' && !event.repeat) notebook.openNotebook();
    if (notebook.dialog.open) return;
    if (event.key === 'Shift' && !event.repeat) toggleRunning();
    if (directions.has(event.code)) {
      event.preventDefault();
      pressed.add(event.code);
    }
    if (event.code === 'KeyE' && !event.repeat) interact();
  }

  function bindControls() {
    window.addEventListener('keydown', keydown);
    window.addEventListener('keyup', (event) => pressed.delete(event.code));
    window.addEventListener('blur', clearMovement);
    document.addEventListener('visibilitychange', () => { if (document.hidden) clearMovement(); });
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
    ui.inspect.addEventListener('click', interact);
    ui.movement.disabled = false;
    ui.movement.addEventListener('click', toggleRunning);
    ui.reset.disabled = false;
    ui.reset.addEventListener('click', () => { clearMovement(); player.reset(); });
    ui.next.addEventListener('click', () => {
      if (current.id === 'business') showJobs();
      else if (endings[current.id]) showEnding();
      else if (finished()) go(current.area.next);
    });
    ui.skip.addEventListener('click', showSkip);
    ui.journalSkip.addEventListener('click', () => { notebook.dialog.close(); showSkip(); });
    for (const modal of [notebook.dialog, dialogue.modal, activity.modal]) modal.addEventListener('close', advance);
  }

  function frame(now) {
    const dt = lastFrame === undefined ? 0 : Math.min((now - lastFrame) / 1000, 0.05);
    lastFrame = now;
    if (!modalOpen()) {
      let x = 0;
      let y = 0;
      const held = new Set([...pressed, ...touches.values()].map((key) => directions.get(key)));
      for (const [dx, dy] of held) { x += dx; y += dy; }
      movement.copy(right).multiplyScalar(x).addScaledVector(ahead, y).normalize();
      player.step(movement.x, movement.y, dt, running);
      updateMarkers(now);
    }
    renderer.render(scene, camera);
    ui.loading.hidden = true;
  }

  progress.record('a-zhou');
  enter();
  bindControls();
  advance();
  renderer.setAnimationLoop(frame);
}

try {
  game(await loadGameData());
} catch (error) {
  console.error(error);
  ui.loading.textContent = '场景暂时无法载入。请通过本地服务打开，并使用支持 WebGL 2 的浏览器。';
}
