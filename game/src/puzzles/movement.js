import * as THREE from 'three';

export function movable(stage, object, state, { move, select, end, height = 0 } = {}) {
  let start;
  function place(x, z) {
    move(x, z);
    object.position.x = state.x;
    object.position.z = state.z;
    object.rotation.y = state.yaw;
    stage.draw();
  }
  stage.bind(object, {
    plane: new THREE.Plane(new THREE.Vector3(0, 1, 0), -height),
    start() { start = { x: state.x, z: state.z }; },
    move(point, delta) { place(start.x + delta.x, start.z + delta.z); },
    select,
    end,
  });
  return {
    object, state, place,
    nudge(dx, dz) { place(state.x + dx, state.z + dz); end?.(); },
    rotate(amount) { move(state.x, state.z, state.yaw + amount); place(state.x, state.z); end?.(); },
  };
}

export function movementKeys(event, item, step = 0.12) {
  const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
  if (moves[event.code]) { item.nudge(...moves[event.code]); return true; }
  if (event.code === 'KeyR') { item.rotate(Math.PI / 2); return true; }
  return false;
}

export function pose(key, position, yaw = 0, pitch = 0, visible = true) {
  return [key, ...position, yaw, pitch, visible];
}
