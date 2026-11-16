import * as THREE from 'three';

const walkFile = new URL('../assets/player-walk.json', import.meta.url);

export async function loadPlayerGait() {
  const response = await fetch(walkFile);
  if (!response.ok) throw new Error(`无法载入主角步行动画（${response.status}）`);
  const { cycleDistance, runCycleDistance, idle, walk, run } = await response.json();
  return {
    cycleDistance,
    runCycleDistance,
    idle: THREE.AnimationClip.parse(idle),
    walk: THREE.AnimationClip.parse(walk),
    run: THREE.AnimationClip.parse(run),
  };
}

export function makeRigGait(model, gait) {
  const mixer = new THREE.AnimationMixer(model);
  const idle = mixer.clipAction(gait.idle).play();
  const walk = mixer.clipAction(gait.walk).play();
  const run = mixer.clipAction(gait.run).play();

  // 步行和奔跑共用双脚的落地相位，切换时混合当前姿势。
  return (phase, amount, runBlend) => {
    idle.weight = 1 - amount;
    walk.weight = amount * (1 - runBlend);
    run.weight = amount * runBlend;
    walk.time = phase * gait.walk.duration;
    run.time = phase * gait.run.duration;
    mixer.update(0);
  };
}
