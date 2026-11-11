import * as THREE from 'three';
import { loadAsset } from './assets.js';
import { box, ellipsoid, group, spindle } from './geometry.js';
import { bounds, obstacles, spawn } from './shop.js';

const radius = 0.22;
const speed = 2.4;

function canStand(x, z) {
  if (x < bounds.left + radius || x > bounds.right - radius ||
      z < bounds.back + radius || z > bounds.front - radius) return false;

  return !obstacles.some(({ left, right, back, front }) => {
    const dx = x - THREE.MathUtils.clamp(x, left, right);
    const dz = z - THREE.MathUtils.clamp(z, back, front);
    return dx * dx + dz * dz < radius * radius;
  });
}

function makeActor(scene, name, elder = false) {
  const actor = group(scene, name);
  const torso = group(actor, '上身');
  const jacket = elder ? '#744c50' : '#647875';
  const jacketShadow = elder ? '#56383e' : '#4f625e';
  const pants = '#4d4b4a';
  const sole = '#36332f';
  const skin = '#cc9b72';
  const hair = elder ? '#a7a098' : '#34302b';

  // 分节腿部与衣袖保留各自的转动支点。
  const legs = [-1, 1].map((side) => {
    const hip = group(actor, '腿', side * 0.111, 0.62, 0);
    spindle(hip, pants, 0, -0.125, 0, 0.10, 0.085, 0.30, 10);
    const knee = group(hip, '膝', 0, -0.25, 0);
    spindle(knee, pants, 0, -0.13, 0, 0.084, 0.068, 0.27, 10);
    ellipsoid(knee, sole, 0, -0.319, 0.048, 0.095, 0.055, 0.150);
    box(knee, '#927e66', 0, -0.355, 0.051, 0.150, 0.026, 0.221);
    return { hip, knee };
  });

  const coat = spindle(torso, jacket, 0, 0.889, 0, 0.220, 0.236, 0.53, 12);
  coat.scale.z = 0.69;
  ellipsoid(torso, jacket, 0, 1.108, 0, 0.257, 0.102, 0.151);
  const hem = spindle(torso, jacketShadow, 0, 0.624, 0, 0.236, 0.237, 0.061);
  hem.scale.z = 0.69;
  box(torso, '#ac9978', 0, 0.889, 0.157, 0.025, 0.41, 0.016);
  for (let i = 0; i < 3; i++) {
    box(torso, '#d1ba90', 0, 1.035 - 0.104 * i, 0.17, 0.056, 0.014, 0.013);
  }
  spindle(torso, skin, 0, 1.186, 0, 0.071, 0.080, 0.13, 10);
  spindle(torso, '#e5d3ad', 0, 1.164, 0.007, 0.102, 0.117, 0.072);

  // 发色、衣服和随身物件区分店里的人物。
  const head = group(torso, '头', 0, 1.393, 0);
  ellipsoid(head, skin, 0, 0, 0.017, 0.155, 0.184, 0.151);
  ellipsoid(head, hair, 0, 0.067, -0.037, 0.164, 0.156, 0.151);
  ellipsoid(head, hair, 0, 0.078, -0.174, 0.097, 0.098, 0.087);
  const fringe = ellipsoid(head, hair, -0.035, 0.104, 0.082, 0.130, 0.051, 0.093);
  fringe.rotation.z = -0.25;
  ellipsoid(head, skin, 0, -0.024, 0.158, 0.028, 0.023, 0.025);
  for (const side of [-1, 1]) {
    ellipsoid(head, skin, side * 0.154, -0.009, 0.017, 0.026, 0.044, 0.028);
    ellipsoid(head, '#34302b', side * 0.057, 0.006, 0.152, 0.015, 0.016, 0.009);
  }

  const arms = [-1, 1].map((side) => {
    const shoulder = group(torso, '袖', side * 0.232, 1.083, 0);
    shoulder.rotation.z = side * 0.13;
    spindle(shoulder, jacket, 0, -0.159, 0, 0.088, 0.071, 0.34, 10);
    spindle(shoulder, jacketShadow, 0, -0.341, 0, 0.072, 0.070, 0.071, 10);
    ellipsoid(shoulder, skin, 0, -0.405, 0.007, 0.054, 0.079, 0.056);
    return shoulder;
  });

  if (!elder) {
    const strap = box(torso, '#a2825c', 0.017, 0.9, -0.158, 0.043, 0.54, 0.02);
    strap.rotation.z = -0.52;
    const bag = box(torso, '#917457', 0.148, 0.705, -0.165, 0.207, 0.251, 0.119);
    bag.rotation.z = 0.10;
    box(torso, '#c1a17b', 0.143, 0.757, -0.229, 0.181, 0.070, 0.026);
  }
  return { actor, torso, legs, arms };
}

export function makeGrandma(scene, title, { x, z }) {
  const mount = group(scene, title, x, 0, z);
  const { actor, torso, arms } = makeActor(mount, title, true);
  actor.scale.setScalar(0.9);
  mount.rotation.y = 0.58;
  torso.rotation.x = 0.045;
  arms.forEach((arm) => { arm.rotation.x = -0.18; });
  return { mount, fallback: actor };
}

function jointRotation(model, joint, axis = [1, 0, 0], restRoll = 0) {
  const name = THREE.PropertyBinding.sanitizeNodeName(`mixamorig:${joint}`);
  const bone = model.getObjectByName(name);
  if (!bone?.isBone) throw new Error(`主角模型缺少关节 ${joint}`);

  // 用绑定姿势换算角色的摆动轴，使不同朝向的关节沿同一方向运动。
  const inverse = bone.getWorldQuaternion(new THREE.Quaternion()).invert();
  const direction = new THREE.Vector3(...axis).applyQuaternion(inverse);
  const roll = new THREE.Vector3(0, 0, 1).applyQuaternion(inverse);
  const relaxed = new THREE.Quaternion().setFromAxisAngle(roll, restRoll);
  const bind = bone.quaternion.clone();
  const swing = new THREE.Quaternion();
  return (angle) => bone.quaternion.copy(bind).multiply(swing.setFromAxisAngle(direction, angle)).multiply(relaxed);
}

function rigPose(model) {
  const turnSpine = jointRotation(model, 'Spine', [0, 1, 0]);
  const legs = ['Left', 'Right'].map((side) => ({
    hip: jointRotation(model, `${side}UpLeg`),
    knee: jointRotation(model, `${side}Leg`),
    arm: jointRotation(model, `${side}Arm`, [1, 0, 0], side === 'Left' ? -0.68 : 0.68),
  }));
  return {
    torso(lift, turn) {
      model.position.y = lift;
      turnSpine(turn);
    },
    legs,
  };
}

export function makePlayer(scene) {
  const actor = group(scene, '年轻传承人');
  const { actor: fallback, torso, legs, arms } = makeActor(actor, '本地主角');
  let pose = {
    torso(lift, turn) {
      torso.position.y = lift;
      torso.rotation.y = turn;
    },
    legs: legs.map(({ hip, knee }, i) => ({
      hip(angle) { hip.rotation.x = angle; },
      knee(angle) { knee.rotation.x = angle; },
      arm(angle) { arms[i].rotation.x = angle; },
    })),
  };

  // 移动、碰撞和朝向由同一个角色挂点负责，模型替换时延续当前步态。
  let stride = 0;
  let walk = 0;
  function applyPose() {
    pose.torso(0.024 * walk * Math.abs(Math.sin(stride)), 0.07 * walk * Math.sin(stride));
    pose.legs.forEach(({ hip, knee, arm }, i) => {
      const swing = Math.sin(stride + i * Math.PI);
      hip(0.52 * walk * swing);
      knee(0.43 * walk * Math.max(0, swing));
      arm(-0.29 * walk * swing);
    });
  }

  function reset() {
    actor.position.set(spawn.x, 0, spawn.z);
    actor.rotation.y = Math.PI * 0.97;
    stride = 0;
    walk = 0;
    applyPose();
  }

  function step(dx, dz, seconds) {
    const { x, z } = actor.position;
    if (dx || dz) {
      const nx = x + dx * seconds * speed;
      const nz = z + dz * seconds * speed;
      if (canStand(nx, z)) actor.position.x = nx;
      if (canStand(actor.position.x, nz)) actor.position.z = nz;

      const heading = Math.atan2(dx, dz);
      const angle = heading - actor.rotation.y;
      actor.rotation.y += Math.atan2(Math.sin(angle), Math.cos(angle)) * (1 - Math.exp(-15 * seconds));
    }

    const distance = Math.hypot(actor.position.x - x, actor.position.z - z);
    stride += distance * 7.2;
    walk = THREE.MathUtils.damp(walk, distance > 0.0001 ? 1 : 0, 12, seconds);
    applyPose();
  }

  reset();
  loadAsset('player').then((model) => {
    pose = rigPose(model);
    actor.add(model);
    actor.remove(fallback);
    applyPose();
  }).catch((error) => console.warn('主角模型加载失败，已保留本地模型。', error));
  return { actor, step, reset };
}
