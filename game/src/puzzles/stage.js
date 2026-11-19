import * as THREE from 'three';
import { loadAsset } from '../assets.js';

export function createStage(host, label, { span = 4, target = [0, 0, 0], yaw = 0, pitch = 0.88, orbit = false } = {}) {
  // 操作画布与观察小窗共用场景，关闭弹窗时统一释放渲染器和监听。
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
  renderer.setClearColor('#38372d', 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.16;
  const canvas = renderer.domElement;
  canvas.tabIndex = 0;
  canvas.setAttribute('aria-label', label);
  host.append(canvas);
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight('#ffefd1', '#888f81', 2.4));
  const light = new THREE.DirectionalLight('#ffdfb1', 2.6);
  light.position.set(-3, 8, 5);
  scene.add(light);
  const fill = new THREE.DirectionalLight('#c7d9dc', 1.3);
  fill.position.set(4, 3, -6);
  scene.add(fill);
  const camera = new THREE.OrthographicCamera(-span, span, span, -span, 0.01, 100);
  const focus = new THREE.Vector3(...target);
  const resources = [];
  const observers = [];
  const picking = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const controls = new Map();
  const abort = new AbortController();
  let disposed = false;
  let drag;
  let selected;
  let animation;
  let locked = false;
  let keyHandler;

  function placeCamera() {
    camera.position.set(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
    camera.position.multiplyScalar(12).add(focus);
    camera.lookAt(focus);
  }

  function renderView(output, view, container, viewSpan) {
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (!width || !height) return;
    const half = Math.max(viewSpan, viewSpan * 1.25 / (width / height));
    Object.assign(view, { left: -half * width / height, right: half * width / height, top: half, bottom: -half });
    view.updateProjectionMatrix();
    const ratio = output.getPixelRatio();
    if (output.domElement.width !== Math.floor(width * ratio) || output.domElement.height !== Math.floor(height * ratio)) {
      output.setSize(width, height, false);
    }
    output.render(scene, view);
  }

  function draw() {
    if (disposed) return;
    scene.updateMatrixWorld(true);
    renderView(renderer, camera, host, span);
    for (const view of observers) renderView(view.renderer, view.camera, view.host, view.span);
  }

  function ray(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, 1 - (event.clientY - rect.top) / rect.height * 2);
    picking.setFromCamera(pointer, camera);
    return picking.ray;
  }

  function select(object) {
    selected = object;
    for (const [item, control] of controls) control.select?.(item === object);
    draw();
  }

  function pointerDown(event) {
    if (event.button !== 0 || drag || locked) return;
    ray(event);
    scene.updateMatrixWorld(true);
    const hits = picking.intersectObjects([...controls.keys()], true);
    let object = hits[0]?.object;
    while (object && !controls.has(object)) object = object.parent;
    if (!object && !orbit) return;
    canvas.focus({ preventScroll: true });
    canvas.setPointerCapture(event.pointerId);
    const control = controls.get(object);
    const plane = control?.plane ?? new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const point = ray(event).intersectPlane(plane, new THREE.Vector3());
    drag = { id: event.pointerId, object, control, plane, point, x: event.clientX, y: event.clientY, yaw, pitch };
    if (object) select(object);
    control?.start?.(point);
  }

  function pointerMove(event) {
    if (drag?.id !== event.pointerId || locked) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (drag.control) {
      const point = ray(event).intersectPlane(drag.plane, new THREE.Vector3());
      if (point && drag.point) drag.control.move?.(point, point.clone().sub(drag.point), dx, dy);
    } else {
      yaw = drag.yaw - dx * 0.009;
      pitch = THREE.MathUtils.clamp(drag.pitch + dy * 0.008, -1.3, 1.45);
      placeCamera();
    }
    draw();
  }

  function pointerUp(event) {
    if (drag?.id !== event.pointerId) return;
    const control = drag.control;
    drag = null;
    if (event.type === 'pointerup') control?.end?.();
    draw();
  }

  function box(parent, color, position, size, opacity = 1) {
    const geometry = new THREE.BoxGeometry(...size);
    const material = new THREE.MeshStandardMaterial({ color, roughness: 0.84, transparent: opacity < 1, opacity, depthWrite: opacity === 1 });
    const object = new THREE.Mesh(geometry, material);
    object.position.set(...position);
    parent.add(object);
    resources.push(geometry, material);
    return object;
  }

  async function asset(id, position, size, parent = scene) {
    const model = await loadAsset(id);
    if (disposed) return model;
    if (size) {
      const bounds = new THREE.Box3().setFromObject(model);
      const extent = bounds.getSize(new THREE.Vector3());
      model.scale.multiply(new THREE.Vector3(size[0] / extent.x, size[1] / extent.y, size[2] / extent.z));
    }
    model.position.set(...position);
    parent.add(model);
    draw();
    return model;
  }

  function observe(container, { position, target: lookAt, span: observerSpan }) {
    const output = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    output.setPixelRatio(Math.min(devicePixelRatio, 1.6));
    output.setClearColor('#38372d', 1);
    output.toneMapping = renderer.toneMapping;
    output.toneMappingExposure = renderer.toneMappingExposure;
    container.append(output.domElement);
    const view = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 100);
    view.position.set(...position);
    view.lookAt(new THREE.Vector3(...lookAt));
    observers.push({ renderer: output, camera: view, host: container, span: observerSpan });
    resize.observe(container);
    draw();
    return view;
  }

  // 指针捕获覆盖触屏拖动；键盘在当前选中物件上执行同一套移动规则。
  for (const [name, listener] of [['pointerdown', pointerDown], ['pointermove', pointerMove], ['pointerup', pointerUp], ['pointercancel', pointerUp], ['lostpointercapture', pointerUp]]) {
    canvas.addEventListener(name, listener, { signal: abort.signal });
  }
  canvas.addEventListener('keydown', (event) => {
    if (locked || !keyHandler) return;
    if (keyHandler(event, selected)) { event.preventDefault(); event.stopPropagation(); draw(); }
  }, { signal: abort.signal });
  const resize = new ResizeObserver(draw);
  resize.observe(host);
  placeCamera();
  renderer.setAnimationLoop((now) => {
    if (!animation) return;
    const ratio = Math.min((now - animation.start) / animation.duration, 1);
    animation.update(ratio);
    draw();
    if (ratio === 1) { const done = animation.done; animation = null; done?.(); }
  });

  return {
    scene, camera, canvas, draw, asset, box, observe, select,
    get disposed() { return disposed; },
    get selected() { return selected; },
    bind(object, control) { controls.set(object, control); },
    onKey(handler) { keyHandler = handler; },
    lock(value) { locked = value; drag = null; },
    view(newYaw, newPitch = pitch) { yaw = newYaw; pitch = newPitch; placeCamera(); draw(); },
    animate(duration, update, done) { animation = { start: performance.now(), duration, update, done }; },
    stop() { animation = null; locked = false; },
    destroy() {
      if (disposed) return;
      disposed = true;
      abort.abort();
      resize.disconnect();
      renderer.setAnimationLoop(null);
      renderer.dispose();
      renderer.forceContextLoss();
      for (const view of observers) { view.renderer.dispose(); view.renderer.forceContextLoss(); }
      for (const resource of resources) resource.dispose();
      host.replaceChildren();
    },
  };
}
