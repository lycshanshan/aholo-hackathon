import * as THREE from 'three';
import { box, canvasTexture, ellipsoid, group, mesh, randomFrom, spindle, surfaceTexture } from './geometry.js';

export const shopId = 'funeral-shop';
export const bounds = { left: -4.68, right: 4.68, back: -3.24, front: 4.02 };
export const spawn = { x: 0.62, z: 2.77 };

export const objectPoints = [
  { id: 'lotus', x: 1.39, z: -0.82, height: 1.66, reach: 1.27, elevation: 0.59 },
  { id: 'ledger', x: 3.30, z: -0.81, height: 1.36, reach: 1.27, elevation: 0.97 },
  { id: 'wreath', x: -3.83, z: -1.94, height: 2.56, reach: 1.52, elevation: 0.36 },
];

const cream = '#dfcfaf';
const lightWood = '#a57552';
const trim = '#76513c';
const dark = '#48382c';
const jade = '#718072';
const red = '#945e4d';
const paper = ['#eee1c3', '#dec9a2', '#bca688', '#c7c1a4'];

function architecture(root, solid) {
  const wood = surfaceTexture('wood', '#8f674c', 99);
  const woodShades = ['#9b7556', '#8b674d', '#a27a58', '#967052'].map((color, i) => surfaceTexture('wood', color, 33 + i));
  const plaster = surfaceTexture('stone', '#b4a384', 52);
  const foundation = surfaceTexture('stone', '#605951', 25);
  const stone = ['#817d6e', '#928a77', '#746f64', '#878571'].map((color, i) => surfaceTexture('stone', color, 81 + i));
  const random = randomFrom(50);

  box(root, foundation, 0, -0.29, 0.34, 10.26, 0.54, 8.30);
  box(root, '#51443a', 0, -0.066, -0.33, 9.86, 0.104, 6.43);
  for (let row = 0; row < 17; row++) {
    const z = -3.39 + row * 0.376;
    let x = -4.91;
    while (x < 4.88) {
      const length = Math.min(1.02 + random() * 1.88, 4.91 - x);
      box(root, woodShades[Math.floor(random() * 4)], x + length / 2, -0.025, z, length - 0.012, 0.05, 0.367);
      x += length;
    }
  }
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 15; col++) {
      const x = (col - 7) * 0.664;
      const z = 3.18 + row * 0.421;
      box(root, stone[Math.floor(random() * 4)], x, -0.027, z, 0.653, 0.052, 0.41);
    }
  }
  box(root, wood, 0, -0.024, 2.907, 10.01, 0.063, 0.10);
  box(root, '#a28c70', 0, -0.039, 4.31, 10.13, 0.08, 0.27);
  box(root, '#625349', 0, -0.419, 4.465, 10.29, 0.19, 0.20);
  for (let i = 0; i < 15; i++) {
    box(root, '#747063', (i - 7) * 0.68, -0.242, 4.485, 0.656, 0.146, 0.049);
  }

  // 地坪与门槛可通行，墙根和伸进店内的立柱参与碰撞。
  solid(box(root, plaster, 0, 1.68, -3.46, 9.91, 3.36, 0.31));
  solid(box(root, plaster, -4.83, 0.57, -0.20, 0.30, 1.14, 6.43));
  box(root, plaster, -4.83, 3.01, -0.20, 0.30, 0.72, 6.43);
  box(root, plaster, -4.83, 1.89, -1.95, 0.30, 1.52, 2.94);
  box(root, plaster, -4.83, 1.89, 2.40, 0.30, 1.52, 1.23);

  for (const x of [-4.72, -2.59, 0.76, 4.70]) {
    solid(box(root, wood, x, 1.68, -3.24, 0.16, 3.36, 0.22));
    solid(box(root, foundation, x, 0.11, -3.24, 0.26, 0.22, 0.27));
  }
  for (const z of [-3.24, -0.47, 1.80, 2.93]) {
    solid(box(root, wood, -4.68, 1.70, z, 0.20, 3.4, 0.18));
  }
  box(root, dark, 0, 3.35, -3.25, 10.01, 0.23, 0.30);
  box(root, dark, -4.73, 3.35, -0.14, 0.30, 0.23, 6.50);
  box(root, wood, 0, 3.51, -3.39, 10.20, 0.12, 0.48);
  box(root, wood, -4.80, 3.51, -0.13, 0.48, 0.12, 6.68);
  solid(box(root, trim, 0, 0.19, -3.265, 9.89, 0.16, 0.10));
  solid(box(root, trim, -4.665, 0.19, -0.18, 0.11, 0.16, 6.43));
  solid(box(root, wood, -4.63, 1.145, 0.66, 0.38, 0.11, 2.20));
  box(root, wood, -4.63, 2.642, 0.66, 0.26, 0.09, 2.20);
  for (let i = 0; i < 7; i++) box(root, trim, -4.71, 1.90, -0.40 + i * 0.352, 0.09, 1.42, 0.045);
  box(root, trim, -4.71, 1.78, 0.66, 0.075, 0.06, 2.14);

  const door = group(root, '木门', -3.66, 0, -3.21);
  box(door, dark, 0, 1.22, 0, 1.68, 2.48, 0.14);
  for (let i = 0; i < 6; i++) {
    box(door, woodShades[i % 4], (i - 2.5) * 0.248, 1.18, 0.085, 0.234, 2.23, 0.045);
  }
  for (const y of [0.31, 1.94]) box(door, trim, 0, y, 0.115, 1.50, 0.10, 0.04);
  const handle = mesh(door, new THREE.TorusGeometry(0.054, 0.010, 6, 16), '#b3925c', 0.49, 1.11, 0.159);
  handle.rotation.x = 0.09;
  solid(door);

  const window = group(root, '后窗', -0.96, 1.99, -3.26);
  const glow = new THREE.MeshStandardMaterial({ color: '#e2c991', emissive: '#b57f43', emissiveIntensity: 0.30, roughness: 0.9 });
  box(window, dark, 0, 0, 0, 2.56, 1.23, 0.15);
  box(window, glow, 0, 0, 0.09, 2.37, 1.04, 0.05);
  for (let i = 0; i < 8; i++) box(window, trim, (i - 3.5) * 0.32, 0, 0.127, 0.044, 1.08, 0.041);
  for (const y of [-0.27, 0.23]) box(window, trim, 0, y, 0.132, 2.43, 0.045, 0.044);
  solid(box(window, wood, 0, -0.612, 0.11, 2.73, 0.105, 0.38));
  for (let i = 0; i < 6; i++) {
    const x = -4.63 + i * 1.83;
    box(root, trim, x, 3.38, -3.07, 0.18, 0.17, 0.53);
  }
}

function shopSign(root) {
  const map = canvasTexture(768, 200, (context, w, h) => {
    context.fillStyle = '#3f372c';
    context.fillRect(0, 0, w, h);
    context.strokeStyle = '#b39461';
    context.lineWidth = 3;
    context.strokeRect(15, 15, w - 30, h - 30);
    context.fillStyle = '#e3c895';
    context.font = '600 88px "SimSun", "Songti SC", serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('长 宁 白 事 铺', w / 2, h * 0.53);
  });
  box(root, dark, -0.91, 2.99, -3.15, 2.94, 0.54, 0.12);
  const surface = new THREE.MeshStandardMaterial({ map, roughness: 0.87 });
  mesh(root, new THREE.PlaneGeometry(2.86, 0.50), surface, -0.91, 2.99, -3.086);
}

function paperBundle(parent, x, y, z, width, depth, color, angle) {
  const pack = group(parent, '扎纸', x, y, z);
  pack.rotation.y = angle;
  for (let i = 0; i < 5; i++) {
    box(pack, i % 2 ? '#e2cbaa' : color, 0.013 * (i % 3 - 1), i * 0.017, 0, width, 0.015, depth);
  }
  box(pack, '#9f7560', 0.09 * width, 0.033, 0, 0.028, 0.09, depth + 0.014);
  return pack;
}

function jar(parent, x, y, z, radius, color) {
  const shape = [
    [0, 0], [0.71, 0], [0.93, 0.17], [1, 0.72], [0.92, 1.05],
    [0.56, 1.34], [0.49, 1.51], [0.59, 1.56], [0.58, 1.65], [0.39, 1.65], [0.39, 1.30], [0, 1.25],
  ].map(([r, h]) => new THREE.Vector2(r * radius, h * radius));
  return mesh(parent, new THREE.LatheGeometry(shape, 20), color, x, y, z);
}

function shelf(root) {
  const mount = group(root, '纸料货架', 2.71, 0, -2.81);
  mount.scale.x = 1.42;
  const rack = group(mount, '纸料货架', 0, 0, -0.1);
  rack.scale.x = 1 / mount.scale.x;
  box(rack, '#544131', 0, 1.37, -0.22, 3.64, 2.73, 0.085);
  for (const x of [-1.80, 0, 1.80]) box(rack, trim, x, 1.38, 0, 0.12, 2.76, 0.60);
  for (const y of [0.21, 0.81, 1.44, 2.10, 2.73]) box(rack, lightWood, 0, y, 0, 3.74, 0.095, 0.59);
  for (let i = 0; i < 8; i++) {
    const x = -1.47 + (i % 4) * 0.85;
    const y = i < 4 ? 0.276 : 1.505;
    paperBundle(rack, x, y, 0.07, 0.50, 0.39, paper[i % 4], (i % 3 - 1) * 0.08);
    if (i % 3 === 0) paperBundle(rack, x, y + 0.088, 0.05, 0.42, 0.33, paper[(i + 1) % 4], -0.12);
  }
  for (let i = 0; i < 5; i++) {
    const x = [-1.44, -0.94, -0.42, 0.47, 1.16][i];
    jar(rack, x, 0.857, 0.04, 0.17 + (i % 3) * 0.03, i % 2 ? '#817c66' : jade);
  }
  for (let i = 0; i < 13; i++) {
    const x = -1.56 + i * 0.113 + (i > 5 ? 0.23 : 0);
    const roll = spindle(rack, paper[i % 4], x, 2.35, 0.03, 0.055, 0.055, 0.38 + 0.045 * (i % 4), 10);
    roll.rotation.z = (i % 5 - 2) * 0.046;
  }
  jar(rack, 1.22, 2.148, 0.025, 0.24, '#9e7759');
  return { mount, fallback: rack };
}

function ledger(root) {
  const mount = group(root, '账簿模型挂点', 3.30, 1.059, -0.81);
  mount.rotation.y = -0.15;
  const book = group(mount, '账簿与来信', 0, 0.005, 0);
  const map = canvasTexture(512, 384, (context, w, h) => {
    context.fillStyle = '#e7d4ad';
    context.fillRect(0, 0, w, h);
    context.fillStyle = '#b0936f55';
    context.fillRect(w / 2 - 4, 0, 8, h);
    context.strokeStyle = '#a15a4b55';
    for (let i = 24; i < w; i += 32) {
      context.beginPath();
      context.moveTo(i, 16);
      context.lineTo(i, h - 16);
      context.stroke();
    }
    context.fillStyle = '#463329';
    context.font = '22px "SimSun", serif';
    const lines = ['周家白花', '一束', '择日来取', '改日再收'];
    lines.forEach((line, i) => Array.from(line).forEach((letter, j) => context.fillText(letter, w - 39 - 64 * i, 45 + 30 * j)));
  });
  box(book, jade, 0, 0, 0, 0.71, 0.034, 0.48);
  box(book, cream, 0, 0.027, 0, 0.68, 0.043, 0.45);
  const page = mesh(book, new THREE.PlaneGeometry(0.68, 0.45), new THREE.MeshStandardMaterial({ map }), 0, 0.050, 0);
  page.rotation.x = -Math.PI / 2;
  const letter = box(book, '#c9af83', 0.43, 0.021, 0.12, 0.31, 0.020, 0.20);
  letter.rotation.y = 0.31;
  box(book, red, 0.46, 0.033, 0.10, 0.055, 0.004, 0.042);
  return { mount, fallback: book };
}

export function paperLotus(parent) {
  const lotus = group(parent, '本地纸扎莲花灯');
  spindle(lotus, dark, 0, 0.023, 0, 0.21, 0.205, 0.046, 16);
  spindle(lotus, '#a2865d', 0, 0.052, 0, 0.21, 0.21, 0.019, 16);
  const petal = new THREE.BufferGeometry();
  petal.setAttribute('position', new THREE.Float32BufferAttribute([
    0, 0.04, 0, -0.094, 0.095, 0.085, 0.094, 0.095, 0.085,
    0, 0.118, 0.112, -0.057, 0.151, 0.189, 0.057, 0.151, 0.189, 0, 0.219, 0.232,
  ], 3));
  petal.setIndex([0, 3, 1, 0, 2, 3, 1, 3, 4, 2, 5, 3, 3, 6, 4, 3, 5, 6]);
  petal.computeVertexNormals();
  const petals = ['#ece1c7', '#e8d1a4', '#f1dfb8'].map((color) => new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide, roughness: 0.95 }));
  for (let layer = 0; layer < 3; layer++) {
    const n = 8 - layer;
    for (let i = 0; i < n; i++) {
      const angle = (i + layer / 2) * Math.PI * 2 / n;
      const r = 0.077 - layer * 0.023;
      const leaf = mesh(lotus, petal, petals[(i + layer) % 3], r * Math.sin(angle), layer * 0.056, r * Math.cos(angle));
      leaf.rotation.y = angle;
      leaf.scale.setScalar(1 - layer * 0.24);
    }
  }
  spindle(lotus, '#d49959', 0, 0.159, 0, 0.055, 0.057, 0.166, 9);
  spindle(lotus, '#4f3e2e', 0, 0.246, 0, 0.011, 0.012, 0.022, 6);
  return lotus;
}

function counter(root, solid) {
  const tableMount = group(root, '木柜台', 2.45, 0, -0.93);
  const table = group(tableMount, '木柜台');
  box(table, dark, 0, 0.10, 0, 3.04, 0.20, 0.82);
  box(table, trim, 0, 0.57, 0, 3.03, 0.85, 0.84);
  for (const x of [-1.00, 0, 1.00]) {
    box(table, dark, x, 0.57, 0.437, 0.92, 0.61, 0.064);
    box(table, lightWood, x, 0.57, 0.48, 0.78, 0.48, 0.036);
    box(table, trim, x, 0.57, 0.501, 0.61, 0.32, 0.024);
  }
  box(table, lightWood, 0, 1.00, 0, 3.21, 0.115, 1.00);
  box(table, dark, 0, 0.912, 0.47, 3.14, 0.047, 0.073);
  solid(jar(root, 2.32, 1.059, -1.01, 0.139, jade));
  solid(paperBundle(root, 3.58, 1.07, -1.21, 0.40, 0.21, paper[1], 0.07));
  const mount = group(root, '莲花灯模型挂点', 1.39, 1.059, -0.82);
  return { counter: { mount: tableMount, fallback: table }, lotus: { mount, fallback: paperLotus(mount) }, ledger: ledger(root) };
}

function wreath(root, solid) {
  const stand = group(root, '手编花圈', -3.83, 0, -1.94);
  stand.rotation.y = 0.23;
  for (const x of [-0.35, 0.35]) {
    const leg = box(stand, trim, x, 0.91, 0.10, 0.062, 1.83, 0.064);
    leg.rotation.z = x * 0.46;
    leg.rotation.x = -0.13;
  }
  const backLeg = box(stand, dark, 0, 0.79, -0.19, 0.068, 1.60, 0.062);
  backLeg.rotation.x = 0.27;
  box(stand, trim, 0, 0.97, 0.17, 0.78, 0.071, 0.071);
  solid(stand);
  // 花架留在原处，花圈的场景坐标可随备物动作单独改变。
  const offset = new THREE.Vector3(0, 0.98, 0.21).applyEuler(stand.rotation).add(stand.position);
  const mount = group(root, '花圈模型挂点', offset.x, offset.y, offset.z);
  mount.rotation.y = stand.rotation.y;
  const ring = group(mount, '花圈本体', 0, -0.98, -0.21);
  const frame = mesh(ring, new THREE.TorusGeometry(0.50, 0.062, 7, 40), '#ad9667', 0, 1.65, 0.18);
  frame.scale.y = 1.11;
  const random = randomFrom(918);
  for (let i = 0; i < 23; i++) {
    const angle = Math.PI * 2 * i / 25;
    const x = Math.cos(angle) * 0.50;
    const y = 1.65 + Math.sin(angle) * 0.555;
    const flower = group(ring, '纸花', x, y, 0.24 + random() * 0.03);
    flower.rotation.z = angle;
    const tint = paper[i % 4];
    for (let j = 0; j < 5; j++) {
      const a = j * Math.PI * 2 / 5;
      ellipsoid(flower, tint, Math.cos(a) * 0.049, Math.sin(a) * 0.049, 0, 0.052, 0.044, 0.023).rotation.z = a;
    }
    ellipsoid(flower, '#c4a577', 0, 0, 0.020, 0.039, 0.039, 0.025);
  }
  for (const side of [-1, 1]) {
    const ribbon = box(ring, '#e3d6bc', side * 0.13, 1.26, 0.305, 0.135, 0.55, 0.014);
    ribbon.rotation.z = side * 0.17;
  }
  return { mount, fallback: ring };
}

function workbench(root) {
  const table = group(root, '裁纸案', -4.08, 0, 0.81);
  for (const x of [-0.46, 0.46]) {
    for (const z of [-0.51, 0.51]) box(table, dark, x, 0.40, z, 0.10, 0.80, 0.10);
  }
  box(table, lightWood, 0, 0.805, 0, 1.19, 0.11, 1.28);
  box(table, trim, 0, 0.36, 0, 1.03, 0.059, 1.14);
  paperBundle(table, 0.09, 0.881, -0.17, 0.63, 0.64, paper[0], 0.17);
  jar(table, -0.22, 0.866, 0.38, 0.165, red);
  for (let i = 0; i < 4; i++) {
    const stick = spindle(table, '#aa854e', -0.29 + i * 0.042, 1.08, 0.36, 0.012, 0.012, 0.37, 5);
    stick.rotation.z = (i - 1.5) * 0.18;
  }
  return table;
}

function hangingLantern(root, x, z) {
  spindle(root, dark, x, 2.89, z, 0.012, 0.012, 0.75, 7);
  const shade = new THREE.MeshStandardMaterial({ color: '#d7c198', emissive: '#9e6837', emissiveIntensity: 0.48, roughness: 0.95 });
  spindle(root, dark, x, 2.49, z, 0.14, 0.14, 0.047);
  spindle(root, shade, x, 2.27, z, 0.20, 0.19, 0.42, 10);
  spindle(root, trim, x, 2.06, z, 0.145, 0.145, 0.045);
  for (let i = 0; i < 10; i++) {
    const angle = 2 * Math.PI * i / 10;
    spindle(root, '#9f8055', x + Math.sin(angle) * 0.194, 2.27, z + Math.cos(angle) * 0.194, 0.008, 0.008, 0.41, 5);
  }
  const light = new THREE.PointLight('#ffd29a', 4.2, 4, 2);
  light.position.set(x + 0.30, 2.2, z + 0.22);
  root.add(light);
}

function storefront(root, solid) {
  solid(box(root, trim, -4.80, 1.66, 2.96, 0.22, 3.32, 0.24));
  box(root, dark, -4.48, 3.27, 2.96, 0.83, 0.18, 0.24);
  solid(box(root, '#857769', -4.80, 0.16, 2.96, 0.35, 0.32, 0.35));
  const mat = surfaceTexture('wood', '#b7a383', 15);
  box(root, mat, 0.62, 0.007, 2.68, 1.34, 0.014, 0.39);
  for (let i = 0; i < 10; i++) box(root, '#6e604c', 0.032 + i * 0.132, 0.016, 2.68, 0.013, 0.005, 0.365);
  for (const [x, z] of [[-4.50, 3.77], [4.72, 3.85]]) {
    for (let i = 0; i < 6; i++) {
      const stem = spindle(root, '#8c8463', x + 0.044 * i, 0.13, z + 0.045 * (i % 2), 0.006, 0.014, 0.18 + 0.025 * i, 4);
      stem.rotation.z = (i - 2.5) * 0.17;
    }
  }
}

export function buildShop(scene, solid) {
  const root = group(scene, '白事店');
  architecture(root, solid);
  shopSign(root);
  const cabinet = shelf(root);
  const wreathModel = wreath(root, solid);
  solid(workbench(root));
  hangingLantern(root, 4.34, -2.15);
  storefront(root, solid);
  return { ...counter(root, solid), cabinet, wreath: wreathModel };
}
