import * as THREE from 'three';

const materials = new Map();
const cube = new THREE.BoxGeometry(1, 1, 1);

function matte(color) {
  if (!materials.has(color)) {
    materials.set(color, new THREE.MeshStandardMaterial({ color, roughness: 0.87 }));
  }
  return materials.get(color);
}

export function mesh(parent, geometry, surface, x, y, z) {
  const object = new THREE.Mesh(geometry, surface.isMaterial ? surface : matte(surface));
  object.position.set(x, y, z);
  object.castShadow = true;
  object.receiveShadow = true;
  parent.add(object);
  return object;
}

export function box(parent, surface, x, y, z, width, height, depth) {
  const object = mesh(parent, cube, surface, x, y, z);
  object.scale.set(width, height, depth);
  return object;
}

export function group(parent, name, x = 0, y = 0, z = 0) {
  const object = new THREE.Group();
  object.name = name;
  object.position.set(x, y, z);
  parent.add(object);
  return object;
}

export function spindle(parent, surface, x, y, z, top, bottom, height, sides = 12) {
  return mesh(parent, new THREE.CylinderGeometry(top, bottom, height, sides), surface, x, y, z);
}

const sphere = new THREE.SphereGeometry(1, 12, 8);
export function ellipsoid(parent, surface, x, y, z, rx, ry, rz) {
  const object = mesh(parent, sphere, surface, x, y, z);
  object.scale.set(rx, ry, rz);
  return object;
}

export function canvasTexture(width, height, paint) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  paint(canvas.getContext('2d'), width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export function randomFrom(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

export function surfaceTexture(kind, base, seed) {
  const random = randomFrom(seed);
  const map = canvasTexture(256, 256, (context, width, height) => {
    context.fillStyle = base;
    context.fillRect(0, 0, width, height);
    for (let i = 0; i < 4000; i++) {
      const white = random() > 0.52;
      context.fillStyle = white ? '#fff0ce18' : '#251b161a';
      const length = kind === 'wood' ? 10 + random() * 140 : 1 + random() * 5;
      context.fillRect(random() * width, random() * height, kind === 'wood' ? length : 2, kind === 'wood' ? 1 : length);
    }
    if (kind === 'wood') {
      for (let i = 0; i < 22; i++) {
        const y = random() * height;
        context.strokeStyle = '#301e181f';
        context.beginPath();
        context.moveTo(0, y);
        context.bezierCurveTo(104, y - 10, 146, y + 13, width, y - 2);
        context.stroke();
      }
    }
  });
  return new THREE.MeshStandardMaterial({ map, roughness: 0.93 });
}
