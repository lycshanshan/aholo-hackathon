import * as THREE from 'three';
import { GLTFLoader } from '../vendor/three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
const sourceModels = new Map();
const flatFacades = new Set(['gate', 'shutter', 'door']);
const assetSpecs = {
  bed: { file: 'bed-v2.glb', title: '病床上的奶奶', size: [1.37, 1.2, 2.68], align: 'z' },
  lotus: { file: 'paper-lotus.glb', title: '纸扎莲花灯', size: [0.65, 0.44, 0.65] },
  ledger: {
    file: 'ledger.glb', title: '柜台上的账簿', size: [0.84, 0.13, 0.62],
    normal: [-0.1583, 0.7645, 0.6249], upright: [0, 1, 0],
  },
  wreath: {
    file: 'wreath.glb', title: '手编花圈', size: [1.20, 1.45, 0.46],
    normal: [0.0133, 0.6143, 0.789], upright: [0, 0, 1],
  },
  grandma: { file: 'grandma.glb', title: '奶奶', size: [Infinity, 1.43, Infinity] },
  player: { file: 'player.glb', title: '主角', size: [Infinity, 1.57, Infinity] },
  'frame-body': { file: 'frame-body.glb', title: '木相框主体', size: [0.56, 0.45, 0.05] },
  'frame-support': { file: 'frame-support.glb', title: '相框背撑', size: [0.13, 0.30, 0.022] },
};

const scenery = {
  stool: ['竹凳', [0.6, 0.44, 0.54]],
  frame: ['木相框', [0.56, 0.54, 0.4]],
  plane: ['木工刨', [0.54, 0.21, 0.31], 'x'],
  counter: ['白事店柜台', [3.21, 1.06, 1.0], 'x'],
  workbench: ['木工作台', [2.8, 0.94, 1.21], 'x'],
  zhou: ['周家婶子', [Infinity, 1.49, Infinity]],
  chen: ['陈伯', [Infinity, 1.56, Infinity]],
  ye: ['叶禾', [Infinity, 1.57, Infinity]],
  altar: ['祠堂长案', [3.25, 1.05, 1.05], 'x'],
  gate: ['祠堂门廊', [8.2, 3.33, 1.25], 'x'],
  cabinet: ['纸料柜', [2.4, 2.5, 0.84], 'x'],
  shutter: ['卷帘门', [3.7, 2.9, 0.4], 'x'],
  crate: ['纸料箱', [0.82, 0.58, 0.66]],
  branch: ['花枝', [0.49, 0.31, 0.22], 'x'],
  luggage: ['行李箱', [0.72, 0.63, 0.42]],
  cradle: ['开槽木托', [0.64, 0.14, 0.36], 'x'],
  bench: ['窄木凳', [1.52, 0.40, 0.42], 'x'],
  sign: ['木招牌', [1.34, 0.44, 0.18], 'x'],
  jar: ['玻璃糖罐', [0.31, 0.32, 0.31]],
  letter: ['牛皮纸信封', [0.42, 0.09, 0.30], 'x'],
  shaving: ['带刨痕的木料', [0.67, 0.14, 0.32], 'x'],
  tray: ['平木托盘', [0.41, 0.1, 0.35], 'x'],
  cloth: ['棉布垫', [0.40, 0.10, 0.32], 'x'],
  door: ['木门与门闩', [1.49, 2.72, 0.28]],
  'wreath-stand': ['花圈支架', [1.05, 1.5, 0.68]],
  'paper-flower': ['素白纸花', [0.27, 0.35, 0.26]],
  'paper-stack': ['米白纸料', [0.66, 0.21, 0.54], 'x'],
  'zhou-seated': ['坐下试灯的周家婶子', [Infinity, 1.14, Infinity]],
  'chen-seated': ['坐着等雨的陈伯', [Infinity, 1.18, Infinity]],
};

for (const [id, [title, size, align]] of Object.entries(scenery)) {
  assetSpecs[id] = { file: `${id}.glb`, title, size, align };
}

export async function loadAsset(id) {
  const { file, title, size: limits, normal, upright, align } = assetSpecs[id];
  if (!sourceModels.has(id)) {
    sourceModels.set(id, loader.loadAsync(new URL(`../assets/${file}`, import.meta.url).href));
  }
  const { scene } = await sourceModels.get(id);
  const model = id === 'player' ? scene : scene.clone();
  // 对齐账页和花圈的平面，再按柜台与花架的尺寸摆放。
  if (normal) {
    model.quaternion.setFromUnitVectors(new THREE.Vector3(...normal).normalize(), new THREE.Vector3(...upright));
  }
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model, true);
  const size = box.getSize(new THREE.Vector3());
  if (align && (size.x >= size.z ? 'x' : 'z') !== align) {
    model.rotateY(Math.PI / 2);
    box.setFromObject(model, true);
    box.getSize(size);
  }
  const fitDepth = limits[2] / size.z;
  const scale = Math.min(limits[0] / size.x, limits[1] / size.y, flatFacades.has(id) ? Infinity : fitDepth);
  if (box.isEmpty() || size.y <= 0 || Math.max(size.x, size.z) <= 0 || !Number.isFinite(scale) || scale <= 0) {
    throw new Error(`${title}的模型尺寸无效`);
  }

  const center = box.getCenter(new THREE.Vector3());
  const stand = new THREE.Group();
  stand.name = `Aholo Lux3D ${title}`;
  stand.scale.set(scale, scale, Math.min(scale, fitDepth));
  model.position.add(new THREE.Vector3(-center.x, -box.min.y, -center.z));
  model.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;
  });
  stand.add(model);
  return stand;
}

export async function loadModel(id, { mount, fallback }) {
  const stand = await loadAsset(id);
  mount.add(stand);
  mount.remove(fallback);
}
