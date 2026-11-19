export const courtyard = { left: -4.3, right: 4.3, back: -2.9, front: 3.2 };
export const table = { x: -0.05, z: -2.14, width: 2.8, depth: 1.21 };
export const benchSize = { width: 1.52, depth: 0.42 };
export const path = Array.from({ length: 49 }, (_, index) => {
  const ratio = index / 48;
  return { x: 0.19 - 0.245 * ratio, z: 2.7 - 3.92 * ratio };
});
export const lampSurfaces = [
  { key: 'window', x: 0.82, z: -2.63, width: 1.48, depth: 0.45, y: 1.2 },
  { key: 'table', x: -0.05, z: -2.14, width: 2.8, depth: 1.21, y: 0.94 },
  { key: 'stand', x: 2.49, z: 1.19, width: 0.76, depth: 0.76, y: 0.44 },
];
export const frameSlot = { x: 0.3, z: -0.16, width: 0.74, depth: 0.15 };
export const planeTarget = { x: 0.48, z: 0.08, width: 0.13 };
export const supports = [
  { key: 'tray', x: -0.83, z: 0.08, width: 0.58, depth: 0.46, y: 0.1 },
  { key: 'cloth', x: 0, z: 0.08, width: 0.58, depth: 0.46, y: 0.1 },
  { key: 'cradle', x: 0.83, z: 0.08, width: 0.7, depth: 0.46, y: 0.14 },
];

export function footprint(item, size) {
  const sin = Math.abs(Math.sin(item.yaw));
  const cos = Math.abs(Math.cos(item.yaw));
  return { x: item.x, z: item.z, width: cos * size.width + sin * size.depth, depth: sin * size.width + cos * size.depth };
}

export function overlaps(a, b, margin = 0) {
  return Math.abs(a.x - b.x) < (a.width + b.width) / 2 + margin &&
    Math.abs(a.z - b.z) < (a.depth + b.depth) / 2 + margin;
}

export function benchPositionAllowed(item, other) {
  const bounds = footprint(item, benchSize);
  return bounds.x - bounds.width / 2 >= courtyard.left && bounds.x + bounds.width / 2 <= courtyard.right &&
    bounds.z - bounds.depth / 2 >= courtyard.back && bounds.z + bounds.depth / 2 <= courtyard.front &&
    !overlaps(bounds, table, 0.08) && !overlaps(bounds, footprint(other, benchSize), 0.06) &&
    !overlaps(bounds, { x: 3.2, z: 1.55, width: 1.2, depth: 1.65 });
}

export function routeCollision(benches) {
  return path.findIndex((point) => benches.some((bench) =>
    overlaps({ ...point, width: 0.86, depth: 0.5 }, footprint(bench, benchSize))));
}

export function lampSurface(point) {
  return lampSurfaces.find((surface) => Math.abs(point.x - surface.x) <= surface.width / 2 - 0.25 &&
    Math.abs(point.z - surface.z) <= surface.depth / 2 - 0.18);
}

export function lampVisible(point, closed) {
  const surface = lampSurface(point);
  const sightline = 1.55 + (point.z - 1.55) * (6.6 - 3.58) / (6.6 - point.x);
  return Boolean(surface && (!closed || (sightline >= 1.13 && sightline <= 1.4)));
}

export function supportFits(angle) {
  const footDistance = 0.3 * Math.sin(angle);
  return footDistance >= 0.12 && footDistance <= 0.18;
}

export function straight(angle, tolerance = 0.16) {
  return Math.abs(Math.sin(angle)) <= tolerance;
}

export function frameFits(point) {
  return Math.abs(point.x - frameSlot.x) <= 0.14 && Math.abs(point.z - frameSlot.z) <= 0.065 &&
    Math.abs(point.yaw) <= 0.16;
}

export function planeMatches(point, width) {
  return Math.abs(width - planeTarget.width) < 0.025 && Math.abs(point.x - planeTarget.x) < 0.1 &&
    Math.abs(point.z - planeTarget.z) < 0.06 && straight(point.yaw);
}

export function cradleFits(point) {
  const cradle = supports[2];
  return Math.abs(point.x - cradle.x) <= 0.1 && Math.abs(point.z - cradle.z) <= 0.065 && straight(point.yaw, 0.18);
}
