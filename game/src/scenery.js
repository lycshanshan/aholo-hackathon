import * as THREE from 'three';
import { loadModel } from './assets.js';
import { createCollisionArea } from './collision.js';
import { box, canvasTexture, ellipsoid, group, mesh, spindle, surfaceTexture } from './geometry.js';
import { buildShop, paperLotus } from './shop.js';
import { createFrameRig } from './frame-rig.js';

const wood = '#795a43';
const cream = '#e3d6b9';
const moss = '#68796a';
const gray = '#7e837c';

function table(root, width = 2.65, height = 0.91, depth = 1.04) {
  box(root, wood, 0, height - 0.05, 0, width, 0.1, depth);
  for (const x of [-width / 2 + 0.15, width / 2 - 0.15]) {
    for (const z of [-depth / 2 + 0.12, depth / 2 - 0.12]) {
      box(root, '#5f4939', x, height / 2 - 0.04, z, 0.12, height - 0.08, 0.12);
    }
  }
}

function bed(root) {
  box(root, '#899e8e', 0, 0.47, 0, 1.08, 0.08, 2.38);
  box(root, cream, 0, 0.58, 0, 1.04, 0.18, 2.31);
  box(root, moss, 0, 0.64, -1.15, 1.13, 0.58, 0.06);
  box(root, moss, 0, 0.56, 1.15, 1.13, 0.41, 0.06);
  for (const x of [-0.47, 0.47]) {
    for (const z of [-1.04, 1.04]) box(root, moss, x, 0.24, z, 0.06, 0.48, 0.06);
  }
  box(root, '#f0e2c8', 0, 0.73, -0.84, 0.68, 0.15, 0.43);
  ellipsoid(root, '#89837e', 0, 0.82, -0.79, 0.16, 0.14, 0.18);
  ellipsoid(root, '#c8a289', 0, 0.87, -0.73, 0.143, 0.105, 0.14);
  box(root, '#d0c6a7', 0, 0.78, 0.21, 0.75, 0.22, 1.47);
}

function person(root, color) {
  spindle(root, color, 0, 0.88, 0, 0.21, 0.22, 0.59);
  ellipsoid(root, color, 0, 1.13, 0, 0.23, 0.11, 0.14);
  ellipsoid(root, '#c4a089', 0, 1.34, 0, 0.145, 0.18, 0.14);
  ellipsoid(root, '#4a453e', 0, 1.43, -0.025, 0.146, 0.116, 0.143);
  for (const x of [-0.11, 0.11]) spindle(root, '#4f514b', x, 0.32, 0, 0.086, 0.077, 0.58);
}

const personColors = { zhou: '#5c7670', chen: '#846b53', ye: '#52617b' };

function shape(root, asset) {
  const simple = {
    counter: [3, 1.03, 0.85, wood], cabinet: [2.3, 2.25, 0.7, wood],
    gate: [3.5, 2.48, 0.21, wood], shutter: [3.35, 2.13, 0.16, gray],
    crate: [0.69, 0.44, 0.56, '#a8835d'], luggage: [0.61, 0.49, 0.29, wood],
    sign: [1.13, 0.32, 0.08, '#45362e'], letter: [0.34, 0.04, 0.23, '#c4a880'],
    frame: [0.46, 0.30, 0.037, wood], plane: [0.43, 0.14, 0.21, wood],
    cradle: [0.55, 0.081, 0.30, '#a3855d'], jar: [0.24, 0.26, 0.22, '#af9c74'],
    shaving: [0.64, 0.08, 0.31, '#ba915d'], tray: [0.39, 0.05, 0.28, '#9c7851'],
    cloth: [0.37, 0.055, 0.28, cream], door: [1.35, 2.58, 0.18, wood],
    'wreath-stand': [0.63, 0.75, 0.25, wood], 'paper-flower': [0.18, 0.16, 0.17, cream],
    'paper-stack': [0.61, 0.16, 0.44, cream],
  };
  if (asset === 'bed') bed(root);
  else if (asset === 'lotus') paperLotus(root);
  else if (asset === 'stool') table(root, 0.51, 0.42, 0.4);
  else if (asset === 'bench') table(root, 1.45, 0.4, 0.38);
  else if (asset === 'altar' || asset === 'workbench') table(root, 2.8);
  else if (asset.split('-')[0] in personColors) {
    person(root, personColors[asset.split('-')[0]]);
    if (asset.endsWith('-seated')) root.scale.y = 0.76;
  } else if (asset === 'branch') {
    for (let i = 0; i < 6; i++) ellipsoid(root, '#c8a35e', 0.067 * (i - 2), 0.061 + i * 0.008, 0, 0.05, 0.05, 0.05);
  } else if (asset === 'wreath') {
    mesh(root, new THREE.TorusGeometry(0.51, 0.08, 9, 32), cream, 0, 0.62, 0);
  } else if (asset === 'ledger') {
    box(root, cream, 0, 0.035, 0, 0.72, 0.07, 0.49);
  } else {
    const [w, h, d, color] = simple[asset];
    box(root, color, 0, h / 2, 0, w, h, d);
  }
}

const themes = {
  clinic: ['#bbcbba', '#b5af92', '#6f8174'],
  funeral: ['#b5a382', '#978c78', '#786052'],
  lin: ['#a39979', '#8c806f', '#786052'],
  wang: ['#b5b899', '#948c78', '#687562'],
  du: ['#aa9477', '#9e8565', '#705b49'],
  city: ['#b2b9b3', '#8c9890', '#6c7c78'],
};

function shell(root, theme, outdoor, solid) {
  // 墙面保留相机一侧的开口，石砖的拼缝标示可行走的院落边缘。
  const [wall, floor, trim] = themes[theme];
  const back = outdoor ? -3.45 : -3.02;
  const width = outdoor ? 9.65 : 8.95;
  const wallHeight = outdoor ? 1.74 : 2.7;
  const stone = surfaceTexture('stone', floor, 81);
  const plaster = surfaceTexture('stone', wall, 93);
  box(root, '#5b5750', 0, -0.25, 0.1, width + 0.19, 0.47, outdoor ? 7.55 : 6.44);
  box(root, stone, 0, -0.035, 0.05, width, 0.07, outdoor ? 7.22 : 6.16);
  solid(box(root, plaster, 0, wallHeight / 2, back, width, wallHeight, 0.24));
  solid(box(root, plaster, -width / 2, wallHeight / 2, -1.22, 0.20, wallHeight, 3.52));
  box(root, trim, 0, wallHeight, back, width + 0.18, 0.13, 0.33);
  box(root, trim, -width / 2, wallHeight, -1.22, 0.29, 0.13, 3.65);
  solid(box(root, trim, 0, 0.146, back + 0.135, width, 0.19, 0.05));
  for (let i = 0; i < 10; i++) {
    box(root, '#938879', (i - 4.5) * 0.86, 0.003, 2.77, 0.83, 0.013, 0.42);
  }
  if (!outdoor) solid(windowLight(root, theme === 'clinic' ? 2.08 : 1.78, back + 0.15, trim));
}

function windowLight(root, x, z, trim) {
  box(root, trim, x, 1.85, z, 2.35, 1.20, 0.12);
  const glow = new THREE.MeshStandardMaterial({ color: '#d7d3ac', emissive: '#c4bd89', emissiveIntensity: 0.37 });
  box(root, glow, x, 1.85, z + 0.072, 2.2, 1.03, 0.022);
  for (const dx of [-0.58, 0, 0.58]) box(root, trim, x + dx, 1.85, z + 0.102, 0.047, 1.04, 0.042);
  return box(root, trim, x, 1.37, z + 0.13, 2.45, 0.09, 0.31);
}

const layouts = {
  clinic: [
    ['bed', 'bed', -0.91, 0, -1.4], ['stool', 'stool', 0.61, 0, -1.49],
    ['nightstand', 'cabinet', -2.55, 0, -2.25, 0.22, 0.36],
  ],
  funeral: [
    ['gate', 'gate', 0, 0, -3.05], ['altar', 'altar', 0, 0, -1.96, 0, [1.35, 1.73, 0.96]],
    ['branch', 'branch', 0.47, 1.02, -1.82, 0.23],
    ['stand', 'wreath-stand', 2.33, 0, -2.02, 0.1],
    ['wreath', 'wreath', 2.33, 0.46, -1.95, 0.1],
    ['stool', 'stool', -1.13, 0, 1.31], ['lotus', 'lotus', -0.84, 1.04, -1.74],
    ['zhou', 'zhou', -2.56, 0, -0.43, 0.3], ['chen', 'chen', 2.55, 0, -0.8, -0.23],
    ['guest-seated', 'zhou-seated', -2.91, 0, 0.19, 0.26],
  ],
  lin: [
    ['table', 'workbench', -0.05, 0, -2.14], ['gate', 'gate', 3.55, 0, 1.55, Math.PI / 2, 0.48],
    ['door', 'door', 3.58, 0, 1.54, 1.27, 0.6],
    ['bench-a', 'bench', -1.13, 0, 0.15], ['bench-b', 'bench', 0.43, 0, 0.74],
    ['lotus', 'lotus', 0.87, 0.94, -1.87], ['water', 'jar', -0.63, 0.94, -1.97],
    ['light-stand', 'stool', 2.49, 0, 1.19, 0, [1.27, 1, 1.41]],
  ],
  wang: [
    ['counter', 'counter', 0, 0, -1.18], ['shutter', 'shutter', 2.72, 0, -2.46, -0.12, 0.85],
    ['jar', 'jar', -0.94, 1.06, -1.39], ['frame', 'frame', 0.82, 1.06, -1.46, -0.16],
    ['grocer-shelf', 'cabinet', -2.58, 0, -2.4, 0.08, 0.87],
  ],
  du: [
    ['workbench', 'workbench', -0.99, 0, -1.08], ['table', 'altar', 2.61, 0, -1.15, 0, [1.06, 1.36, 0.82]],
    ['narrow-plane', 'plane', -1.76, 0.94, -0.96, 0.2, [0.83, 0.83, 0.55]],
    ['wide-plane', 'plane', -1.19, 0.94, -0.83, -0.14],
    ['cradle', 'cradle', 2.88, 0.81, -0.88],
    ['shaving', 'shaving', -0.55, 0.94, -0.97],
    ['tray', 'tray', 1.81, 0.81, -0.92], ['cloth', 'cloth', 2.3, 0.81, -0.92],
  ],
  city: [
    ['table', 'workbench', 0, 0, -1.19], ['cabinet', 'cabinet', -2.9, 0, -2.51],
    ['ledger', 'ledger', -0.97, 0.94, -1.2], ['wreath', 'wreath', 0.58, 0.94, -1.29],
    ['ye', 'ye', 2.65, 0, -0.15, -0.24],
    ['shelf', 'workbench', 2.45, 0, -2.59, 0, 0.79],
    ['flower', 'paper-flower', 0.8, 0.98, -1.03, 0.17, 0.71],
  ],
};

const shopProps = {
  'funeral-shop': [['stool', 'stool', -3.3, 0, 1.83], ['paper', 'paper-stack', 1.27, 0.05, -2.40]],
  business: [['stool', 'stool', -2.31, 0, 0.64], ['crate', 'crate', 0.32, 0, 1.24]],
  decision: [
    ['stool', 'stool', -2.02, 0, 0.72], ['letter', 'letter', 2.17, 1.055, -0.76, 0.21],
    ['ye', 'ye', -0.95, 0, -0.33, 0.24], ['luggage', 'luggage', 0.43, 0, 1.11],
  ],
  'city-close': [
    ['crate', 'crate', 1.75, 1.05, -0.83, 0.08, 0.67], ['luggage', 'luggage', -1.31, 0, 1.44],
    ['chen', 'chen', -2.14, 0, 1.92, 0.32], ['stool', 'stool', -2.78, 0, 2.31],
    ['paper', 'paper-stack', 2.28, 1.05, -1.15],
    ['flower', 'paper-flower', 1.68, 1.27, -0.75, 0.3, 0.7],
    ['door', 'door', -4.2, 0, 2.88, -1.44, 0.9],
  ],
  'village-stock': [
    ['crate', 'crate', 0.32, 0, 1.71], ['stool', 'stool', -2.99, 0, 1.82],
    ['sign', 'sign', 2.42, 1.1, 2.99], ['zhou', 'zhou', 0.15, 0, 0.4, 0.3],
    ['paper', 'paper-stack', 0.31, 0.35, 1.72],
  ],
  'village-lamp': [
    ['branch', 'branch', 1.08, 1.059, -0.63, 0.4], ['chen', 'chen', -0.58, 0, -0.25, 0.17],
    ['stool', 'stool', -1.04, 0, 0.5], ['crate', 'crate', 1.8, 0, 2.65, -0.13],
    ['guest-seated', 'chen-seated', -1.04, 0, 0.65, 0.22],
  ],
};

function photo(root, image, x, y, z, yaw = 0, upright = false) {
  const texture = new THREE.TextureLoader().load(new URL(`../assets/${image}.png`, import.meta.url).href);
  texture.colorSpace = THREE.SRGBColorSpace;
  const surface = new THREE.MeshStandardMaterial({ map: texture, side: THREE.DoubleSide, roughness: 0.95 });
  const mount = group(root, image, x, y, z);
  mount.rotation.y = yaw;
  const picture = mesh(mount, new THREE.PlaneGeometry(0.37, 0.25), surface, 0, 0.005, 0);
  picture.rotation.x = upright ? -0.12 : -Math.PI / 2;
  return mount;
}

function details(root, area, parts, solid) {
  if (area.theme === 'lin') {
    for (let i = 0; i < 8; i++) {
      box(root, i % 2 ? '#6e685c' : '#777165', 0.19 - 0.035 * i, 0.006, 2.7 - 0.56 * i, 0.57, 0.012, 0.48);
    }
    solid(box(root, wood, 0.82, 1.13, -3.21, 1.48, 0.13, 0.36));
  }
  if (area.theme === 'wang') {
    const glass = new THREE.MeshStandardMaterial({
      color: '#a2bcc1', roughness: 0.21, transparent: true, opacity: 0.32, depthWrite: false,
    });
    solid(box(root, glass, 0, 1.055, -1.16, 2.26, 0.024, 0.67)).castShadow = false;
    const stack = group(root, '旧相片', -0.56, 1.071, -1.00);
    ['photo-yard', 'photo-door'].forEach((image, i) =>
      photo(stack, image, 0.4 * (i - 0.5), 0, -0.2, 0.12 * (i - 0.5)));
    const fragments = group(stack, '旧照碎片');
    const texture = new THREE.TextureLoader().load(new URL('../assets/photo-store.png', import.meta.url).href);
    texture.colorSpace = THREE.SRGBColorSpace;
    const surface = new THREE.MeshStandardMaterial({ map: texture, side: THREE.DoubleSide, roughness: 0.95 });
    for (let i = 0; i < 6; i++) {
      const geometry = new THREE.PlaneGeometry(0.123, 0.125);
      const uv = geometry.attributes.uv;
      for (let vertex = 0; vertex < uv.count; vertex++) {
        uv.setXY(vertex, (uv.getX(vertex) + i % 3) / 3, (uv.getY(vertex) + 1 - Math.floor(i / 3)) / 2);
      }
      const piece = mesh(fragments, geometry, surface, (i % 3 - 1) * 0.17, 0.004 + i * 0.001, 0.04 + Math.floor(i / 3) * 0.18);
      piece.rotation.set(-Math.PI / 2, 0, (i - 2.5) * 0.09);
    }
    parts.set('photo-stack', solid(stack));
    parts.set('photo-pieces', fragments);
    const framed = photo(root, 'photo-store', 0.82, 1.295, -1.34, -0.16, true);
    framed.visible = false;
    parts.set('selected-photo', solid(framed));
    for (const z of [-1.43, -1.37]) solid(box(root, '#473c32', 0.82, 1.070, z, 0.58, 0.024, 0.024));
  }
}

const poses = {
  'fold-lotus': [[['paper-petal', 1.42, 1.26, -0.62, 0.2, -0.67]]],
  'take-wreath': [[['wreath', -3.65, 0.18, 1.69, 0.12]]],
  'dress-wreath': [[['branch', 2.67, 1.49, -1.78, 0.6], ['wreath', 2.33, 0.46, -1.93, 0.15]]],
  'offer-stool': [[
    ['stool', -2.91, 0, 0.04], ['lotus', -2.64, 0.52, 0.4],
    ['zhou', -2.56, 0, -0.43, 0.3, 0, false], ['guest-seated', -2.91, 0, 0.19, 0.26],
  ]],
  'farewell-host': [[
    ['zhou', -1.7, 0, -0.57], ['chen', 1.4, 0, -0.65],
    ['guest-seated', -2.91, 0, 0.19, 0.26, 0, false], ['lotus', -1.5, 0.61, -0.32],
  ]],
  'lin-benches': [
    [['bench-a', -3.88, 0, -0.42, Math.PI / 2], ['bench-b', -3.88, 0, 1.36, Math.PI / 2]],
  ],
  'lin-light': [
    [['lotus', 2.49, 0.44, 1.19], ['door', 3.58, 0, 1.54, Math.PI / 2]],
  ],
  'wang-photo': [[['selected-photo', 0.82, 1.295, -1.34, -0.16, 0, true], ['photo-pieces', 0, 0, 0, 0, 0, false]]],
  'wang-support': [[['frame-leg', 0, 0.28, -0.025, 0, 0.52]]],
  'wang-frame': [
    [['frame', 0.82, 1.06, -1.46, -0.16, -0.12], ['selected-photo', 0.82, 1.295, -1.42, -0.16, -0.12]],
  ],
  'du-plane': [[['wide-plane', -0.55, 1.02, -0.99, 0.08]]],
  'du-cradle': [
    [['wide-plane', 2.88, 0.99, -0.88, 0.05], ['shaving', 2.84, 0.82, -1.32]],
  ],
  'box-flowers': [[['crate', 0.84, 0, 2.5], ['flower', 0.84, 0.19, 2.5, 0.6]]],
  'store-paper': [[['paper', 2.26, 0.46, -2.48, 0, 0, false]]],
  'pack-bag': [[['ledger', -1.31, 0.39, 1.44, 0.45, 0, false]]],
  'close-shop': [[['door', 0.55, 0, 3.16], ['stool', -3.44, 0, 2.81]]],
  'city-weave': [[['wreath', 1.99, 0.74, -2.44, -0.18]]],
  'city-finish': [[['wreath', 3.56, 0, -2.41, 0.17, 0, false], ['flower', 1.96, 0.72, -2.43, 0.17, 0, false]]],
  'split-paper': [[['crate', 2.37, 0.12, -2.48], ['paper', 2.62, 1.05, -1.2]]],
  'hang-sign': [[['sign', 2.42, 1.69, 2.99]]],
  'stool-out': [[['stool', -0.22, 0, 0.68]]],
  'trim-plum': [[['branch', 1.56, 1.14, -0.66, 0.69]]],
  'chen-lamp': [[['chen', -0.58, 0, -0.25, 0.17, 0, false], ['guest-seated', -1.04, 0, 0.65, 0.22]]],
  'village-finish': [[['crate', 0.48, 0, 2.98]]],
};

function titleCard(root, text) {
  const image = canvasTexture(512, 144, (context, w, h) => {
    context.fillStyle = '#4e3f33';
    context.fillRect(0, 0, w, h);
    context.strokeStyle = '#aa875d';
    context.strokeRect(11, 11, w - 22, h - 22);
    context.fillStyle = '#efdbad';
    context.font = '51px "Songti SC", "SimSun", serif';
    context.textBaseline = 'middle';
    context.textAlign = 'center';
    context.fillText(text, w / 2, h / 2, w - 35);
  });
  return mesh(root, new THREE.PlaneGeometry(0.94, 0.27), new THREE.MeshStandardMaterial({ map: image }), 0, 0.21, 0.102);
}

function modelPetal(root) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([
    -0.015, 0, 0, -0.097, 0.087, 0.008, 0, 0.21, 0.043,
    0.095, 0.087, 0.008, 0, 0.071, 0.045,
  ], 3));
  geometry.setIndex([0, 4, 1, 1, 4, 2, 2, 4, 3, 3, 4, 0]);
  geometry.computeVertexNormals();
  const surface = new THREE.MeshStandardMaterial({ color: '#eee0bd', side: THREE.DoubleSide, roughness: 0.8 });
  return mesh(root, geometry, surface, 1.49, 1.13, -0.50);
}

export function buildArea(scene, chapterId, area) {
  // 场景模型、交互预览和实际移物共享挂点。加载完成时保留挂点的状态。
  const root = group(scene, chapterId);
  const parts = new Map();
  const ready = new Map();
  const pendingPoses = new Map();
  const collision = createCollisionArea(area.bounds);
  const solid = collision.fit;
  const load = (key, asset, target) => {
    parts.set(key, solid(target.mount));
    ready.set(key, loadModel(asset, target).then(() => solid(target.mount))
      .catch((error) => console.warn(`模型加载失败：${asset}`, error)));
  };
  const put = ([key, asset, x, y, z, yaw = 0, scale = 1]) => {
    const mount = group(root, key, x, y, z);
    mount.rotation.y = yaw;
    if (Array.isArray(scale)) mount.scale.set(...scale);
    else mount.scale.setScalar(scale);
    const fallback = group(mount, asset);
    shape(fallback, asset);
    if (chapterId === 'wang' && key === 'frame') {
      parts.set(key, solid(mount));
      ready.set(key, createFrameRig().then(({ frame, hinge }) => {
        mount.add(frame);
        mount.remove(fallback);
        parts.set('frame-leg', hinge);
        if (pendingPoses.has('frame-leg')) applyPose([pendingPoses.get('frame-leg')]);
        solid(mount);
      }).catch((error) => console.warn('相框模型加载失败', error)));
      return;
    }
    load(key, asset, { mount, fallback });
  };

  // 店内实物和其他场景使用同一套碰撞，地砖等地面细节保留通路。
  if (area.layout === 'shop') {
    const shopModels = buildShop(root, solid);
    for (const [name, target] of Object.entries(shopModels)) load(name, name, target);
    shopProps[chapterId].forEach(put);
    if (chapterId === 'funeral-shop') parts.set('paper-petal', solid(modelPetal(root)));
    if (chapterId === 'village-stock') {
      const sign = parts.get('sign');
      titleCard(sign, '上午营业');
      solid(sign);
    }
  } else {
    shell(root, area.theme, area.layout === 'courtyard', solid);
    layouts[area.theme].forEach(put);
    details(root, area, parts, solid);
  }
  const seat = parts.get('guest-seated');
  if (seat) seat.visible = false;

  // 搬动、试摆和还原共用模型的位置与显隐状态。
  function showPose(id, choice = 0) {
    const changes = poses[id]?.[choice];
    if (!changes?.length) return;
    applyPose(changes);
  }

  function applyPose(changes) {
    for (const [key, x, y, z, yaw = 0, pitch = 0, visible = true] of changes) {
      const model = parts.get(key);
      if (!model) { pendingPoses.set(key, [key, x, y, z, yaw, pitch, visible]); continue; }
      model.position.set(x, y, z);
      model.rotation.set(pitch, yaw, 0);
      model.visible = visible;
    }
    collision.invalidate();
  }

  function snapshot() {
    const state = [...parts.values()].map((model) => [
      model, model.position.clone(), model.rotation.clone(), model.visible,
    ]);
    return () => {
      for (const [model, position, rotation, visible] of state) {
        model.position.copy(position);
        model.rotation.copy(rotation);
        model.visible = visible;
      }
      collision.invalidate();
    };
  }

  function drag(id, ratio) {
    const key = id === 'fold-lotus' ? 'paper-petal' : 'branch';
    const model = parts.get(key);
    if (id === 'fold-lotus') {
      model.position.set(1.49 - ratio * 0.07, 1.13 + ratio * 0.13, -0.50 - ratio * 0.12);
      model.rotation.set(-ratio * 0.67, ratio * 0.2, 0);
    } else {
      model.position.set(1.08 + ratio * 0.48, 1.059 + ratio * 0.081, -0.63 - ratio * 0.03);
      model.rotation.y = 0.4 + ratio * 0.29;
    }
    collision.invalidate();
  }

  return { root, parts, ready, collision, showPose, applyPose, snapshot, drag };
}
