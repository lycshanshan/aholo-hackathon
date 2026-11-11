import * as THREE from 'three';

export function createModelPreview(container) {
  // 物件预览使用独立镜头和灯光，店内画面暂停时仍可旋转和缩放。
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.65));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  const canvas = renderer.domElement;
  canvas.tabIndex = 0;
  canvas.setAttribute('aria-label', '物件 3D 模型，拖动或按方向键旋转，滚轮缩放');
  container.prepend(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1.3, 1.3, 1.3, -1.3, 0.1, 30);
  scene.add(new THREE.HemisphereLight('#fff0d6', '#90816b', 2.05));
  for (const [color, intensity, x, y, z] of [
    ['#ffdcaf', 2.15, -3, 5, 4],
    ['#c1d5d0', 1.25, 3, 2, -3],
  ]) {
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(x, y, z);
    scene.add(light);
  }

  const mount = new THREE.Group();
  scene.add(mount);
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1.02, 0.105, 64),
    new THREE.MeshStandardMaterial({ color: '#73634c', roughness: 0.86 }),
  );
  scene.add(base);

  const initialAngle = 0.51;
  let initialElevation = 0.59;
  let azimuth = initialAngle;
  let elevation = initialElevation;
  let drag = null;
  let width = 0;
  let height = 0;
  const focus = new THREE.Vector3();

  function draw() {
    if (!mount.children.length) return;
    const { clientWidth, clientHeight } = container;
    if (!clientWidth || !clientHeight) return;
    if (clientWidth !== width || clientHeight !== height) {
      width = clientWidth;
      height = clientHeight;
      const aspect = width / height;
      const halfHeight = Math.max(1.27, 1.24 / aspect);
      camera.left = -halfHeight * aspect;
      camera.right = halfHeight * aspect;
      camera.top = halfHeight;
      camera.bottom = -halfHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    }
    const groundDistance = 6 * Math.cos(elevation);
    camera.position.set(Math.sin(azimuth) * groundDistance, 6 * Math.sin(elevation), Math.cos(azimuth) * groundDistance).add(focus);
    camera.lookAt(focus);
    renderer.render(scene, camera);
  }

  function turn(yaw, pitch = 0) {
    azimuth += yaw;
    elevation = THREE.MathUtils.clamp(elevation + pitch, 0.14, 1.38);
    draw();
  }

  function reset() {
    azimuth = initialAngle;
    elevation = initialElevation;
    camera.zoom = 1;
    camera.updateProjectionMatrix();
    draw();
  }

  // 捕获指针，让拖动跨出画布后仍能正常结束。
  canvas.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || drag) return;
    canvas.focus({ preventScroll: true });
    canvas.setPointerCapture(event.pointerId);
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
  });
  canvas.addEventListener('pointermove', (event) => {
    if (drag?.id !== event.pointerId) return;
    turn((drag.x - event.clientX) * 0.011, (event.clientY - drag.y) * 0.009);
    drag.x = event.clientX;
    drag.y = event.clientY;
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    canvas.addEventListener(type, (event) => {
      if (drag?.id === event.pointerId) drag = null;
    });
  }
  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    const unit = [1, 16, container.clientHeight][event.deltaMode];
    const change = THREE.MathUtils.clamp(event.deltaY * unit * 0.002, -0.35, 0.35);
    camera.zoom = THREE.MathUtils.clamp(camera.zoom * Math.exp(-change), 0.75, 3);
    camera.updateProjectionMatrix();
    draw();
  }, { passive: false });
  const arrowTurns = {
    ArrowLeft: [-0.21, 0], ArrowRight: [0.21, 0],
    ArrowUp: [0, 0.13], ArrowDown: [0, -0.13],
  };
  canvas.addEventListener('keydown', (event) => {
    const angles = arrowTurns[event.code];
    if (!angles) return;
    event.preventDefault();
    turn(...angles);
  });
  new ResizeObserver(draw).observe(container);

  function show(source, startElevation, preserveView = false) {
    // 复用原模型的几何和材质，按包围盒调整展台位置。
    const object = source.clone();
    object.position.set(0, 0, 0);
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const extent = size.length();
    if (!Number.isFinite(extent) || extent <= 0) throw new Error('模型没有可用的尺寸');
    object.position.sub(box.getCenter(new THREE.Vector3()));
    const scale = 1.84 / extent;
    mount.scale.setScalar(scale);
    mount.clear();
    mount.add(object);
    const baseRadius = Math.hypot(size.x, size.z) * scale / 2 + 0.12;
    base.scale.set(baseRadius, 1, baseRadius);
    base.position.y = -size.y * scale / 2 - 0.057;
    focus.y = -0.05;
    initialElevation = startElevation;
    if (preserveView) draw();
    else reset();
  }

  return {
    show, turn, reset,
    clear() {
      drag = null;
      mount.clear();
      renderer.clear();
    },
  };
}
