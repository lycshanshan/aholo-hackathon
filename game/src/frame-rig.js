import * as THREE from 'three';
import { loadAsset } from './assets.js';

function fitPart(model, width, height, depth) {
  const size = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
  model.scale.multiply(new THREE.Vector3(width / size.x, height / size.y, depth / size.z));
  return model;
}

export async function createFrameRig() {
  const [body, leg] = await Promise.all([loadAsset('frame-body'), loadAsset('frame-support')]);
  const frame = new THREE.Group();
  frame.name = '木相框';
  frame.add(fitPart(body, 0.56, 0.45, 0.05));
  const hinge = new THREE.Group();
  hinge.name = '相框背撑';
  hinge.position.set(0, 0.28, -0.025);
  hinge.rotation.x = 0.52;
  frame.add(hinge);
  hinge.add(fitPart(leg, 0.13, 0.3, 0.022));
  leg.position.y = -0.3;
  return { frame, hinge };
}
