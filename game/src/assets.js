import * as THREE from 'three';
import { GLTFLoader } from '../vendor/three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
const assetSpecs = {
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
};

export async function loadAsset(id) {
  const { file, title, size: limits, normal, upright } = assetSpecs[id];
  const { scene: model } = await loader.loadAsync(new URL(`../assets/${file}`, import.meta.url).href);
  // 对齐账页和花圈的平面，再按柜台与花架的尺寸摆放。
  if (normal) {
    model.quaternion.setFromUnitVectors(new THREE.Vector3(...normal).normalize(), new THREE.Vector3(...upright));
  }
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model, true);
  const size = box.getSize(new THREE.Vector3());
  const scale = Math.min(limits[0] / size.x, limits[1] / size.y, limits[2] / size.z);
  if (box.isEmpty() || size.y <= 0 || Math.max(size.x, size.z) <= 0 || !Number.isFinite(scale) || scale <= 0) {
    throw new Error(`${title}的模型尺寸无效`);
  }

  const center = box.getCenter(new THREE.Vector3());
  const stand = new THREE.Group();
  stand.name = `Aholo Lux3D ${title}`;
  stand.scale.setScalar(scale);
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
