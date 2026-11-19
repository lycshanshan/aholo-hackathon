import * as THREE from 'three';

const radius = 0.22;
const height = 1.57;
const groundClearance = 0.025;
const recoveryStep = 0.06;

function fitLocalBounds(object) {
  object.updateWorldMatrix(true, true);
  const inverse = object.matrixWorld.clone().invert();
  const relative = new THREE.Matrix4();
  const point = new THREE.Vector3();
  const bounds = new THREE.Box3();
  object.traverse((node) => {
    if (!node.isMesh) return;
    const vertices = node.geometry.attributes.position;
    relative.multiplyMatrices(inverse, node.matrixWorld);
    for (let i = 0; i < vertices.count; i++) {
      bounds.expandByPoint(point.fromBufferAttribute(vertices, i).applyMatrix4(relative));
    }
  });
  return bounds;
}

function isVisible(object) {
  for (let node = object; node; node = node.parent) {
    if (!node.visible) return false;
  }
  return true;
}

// 沿物件自身的水平方向取边界，斜放的凳子和门也能保留两旁的通道。
function projectBounds(object, { min, max }, point) {
  object.updateWorldMatrix(true, false);
  const matrix = object.matrixWorld;
  const [x, , z] = matrix.elements;
  const length = Math.hypot(x, z);
  const axisX = length ? x / length : 1;
  const axisZ = length ? z / length : 0;
  let left = Infinity;
  let right = -Infinity;
  let back = Infinity;
  let front = -Infinity;
  let bottom = Infinity;
  let top = -Infinity;
  for (const u of [min.x, max.x]) {
    for (const v of [min.y, max.y]) {
      for (const w of [min.z, max.z]) {
        point.set(u, v, w).applyMatrix4(matrix);
        const side = axisX * point.x + axisZ * point.z;
        const depth = axisX * point.z - axisZ * point.x;
        left = Math.min(left, side);
        right = Math.max(right, side);
        back = Math.min(back, depth);
        front = Math.max(front, depth);
        bottom = Math.min(bottom, point.y);
        top = Math.max(top, point.y);
      }
    }
  }
  if (top > groundClearance && bottom < height) return { left, right, back, front, axisX, axisZ };
}

function intersects({ left, right, back, front, axisX, axisZ }, x, z) {
  const side = axisX * x + axisZ * z;
  const depth = axisX * z - axisZ * x;
  const dx = Math.max(left - side, 0, side - right);
  const dz = Math.max(back - depth, 0, depth - front);
  return dx * dx + dz * dz < radius * radius;
}

export function createCollisionArea(bounds) {
  const models = new Map();
  const obstacles = [];
  const point = new THREE.Vector3();
  let dirty = true;

  // 模型替换时重新取尺寸，摆放或显隐变化时只更新投影。
  function fit(object) {
    models.set(object, fitLocalBounds(object));
    dirty = true;
    return object;
  }

  function refresh() {
    if (!dirty) return;
    obstacles.length = 0;
    for (const [object, local] of models) {
      if (local.isEmpty() || !isVisible(object)) continue;
      const obstacle = projectBounds(object, local, point);
      if (obstacle) obstacles.push(obstacle);
    }
    dirty = false;
  }

  function canStand(x, z) {
    if (x < bounds.left + radius || x > bounds.right - radius ||
        z < bounds.back + radius || z > bounds.front - radius) return false;
    refresh();
    return !obstacles.some((obstacle) => intersects(obstacle, x, z));
  }

  // 道具搬到脚边或加载后尺寸变大时，把主角放到最近一圈的空位。
  function keepClear(position) {
    if (canStand(position.x, position.z)) return;
    const limit = Math.hypot(bounds.right - bounds.left, bounds.front - bounds.back) + recoveryStep;
    for (let distance = recoveryStep; distance <= limit; distance += recoveryStep) {
      const count = Math.ceil(2 * Math.PI * distance / recoveryStep);
      for (let i = 0; i < count; i++) {
        const angle = 2 * Math.PI * i / count;
        const x = position.x + distance * Math.cos(angle);
        const z = position.z + distance * Math.sin(angle);
        if (!canStand(x, z)) continue;
        position.set(x, position.y, z);
        return;
      }
    }
  }

  return { fit, canStand, keepClear, invalidate() { dirty = true; } };
}
