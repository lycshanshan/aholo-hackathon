import { createModelPreview } from './model-preview.js';

export function createActivity(onOpen, onSkip) {
  const modal = document.querySelector('#activity');
  const kind = document.querySelector('#activity-kind');
  const title = document.querySelector('#activity-title');
  const description = document.querySelector('#activity-description');
  const feedback = document.querySelector('#activity-feedback');
  const options = document.querySelector('#activity-options');
  const skip = document.querySelector('#activity-skip');
  const drag = document.querySelector('#activity-drag');
  const slider = document.querySelector('#activity-drag-range');
  const dragLabel = document.querySelector('#activity-drag-label');
  const display = document.querySelector('#activity-model');
  const puzzle = document.querySelector('#activity-puzzle');
  let preview;
  let puzzleView;
  let active;
  let epoch = 0;

  function drawModel(model, preserveView = false) {
    if (!model) return;
    if (!preview) preview = createModelPreview(display);
    const box = model.source;
    if (!box.children.length) return;
    preview.show(box, model.elevation, preserveView);
  }

  function makeButton({ label, detail, image, disabled, activate }, index) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.option = String(index);
    button.disabled = Boolean(disabled);
    if (image) {
      const thumbnail = new Image();
      thumbnail.src = image;
      thumbnail.alt = '';
      button.append(thumbnail);
    }
    const content = document.createElement('span');
    content.textContent = label;
    if (detail) {
      const status = document.createElement('small');
      status.textContent = detail;
      content.append(status);
    }
    button.append(content);
    button.addEventListener('click', () => activate(Number(slider.value)));
    return button;
  }

  function renderOptions(choices, showPhotos = false) {
    options.classList.toggle('activity-options--photos', showPhotos);
    options.replaceChildren(...choices.map(makeButton));
  }

  // 手作完成后的继续按钮可衔接下一道已解锁的工序。
  function showFeedback(message, finished, onContinue = () => modal.close()) {
    feedback.textContent = message;
    feedback.hidden = !message;
    if (!finished) return;
    skip.hidden = true;
    drag.hidden = true;
    renderOptions([{ label: '继续', activate: onContinue }]);
    options.firstElementChild.focus();
  }

  function open(entry) {
    // 重用弹窗时释放上一项尝试，异步模型回调只更新当前项。
    active?.cleanup?.();
    puzzleView?.destroy();
    puzzleView = null;
    puzzle.replaceChildren();
    active = entry;
    const request = ++epoch;
    kind.textContent = entry.kind;
    title.textContent = entry.title;
    description.textContent = entry.description ?? '';
    description.hidden = !entry.description;
    skip.hidden = !entry.allowSkip;
    feedback.hidden = true;
    feedback.textContent = '';
    display.hidden = !entry.model;
    puzzle.hidden = !entry.mount;
    modal.classList.toggle('activity--puzzle', Boolean(entry.mount));
    drag.hidden = !entry.drag;
    slider.value = 0;
    dragLabel.textContent = entry.drag ?? '';
    preview?.clear();
    renderOptions(entry.choices, entry.photos);
    if (!modal.open) {
      onOpen();
      modal.showModal();
    }
    if (entry.drag) options.firstElementChild.disabled = true;
    if (entry.mount) puzzleView = entry.mount(puzzle);
    modal.scrollTop = 0;
    drawModel(entry.model);
    entry.model?.ready?.then(() => {
      if (request === epoch && modal.open) drawModel(entry.model, true);
    });
    title.focus({ preventScroll: true });
  }

  slider.addEventListener('input', () => {
    const ratio = Number(slider.value) / 100;
    options.firstElementChild.disabled = ratio < 0.96;
    active?.onDrag?.(ratio);
  });
  skip.addEventListener('click', onSkip);
  // 离开手作时停止独立画布，避免后台继续绘制已关闭的物件。
  modal.addEventListener('close', () => {
    if (modal.open) return;
    active?.cleanup?.();
    puzzleView?.destroy();
    puzzleView = null;
    active = null;
    epoch++;
    preview?.clear();
  });

  return { modal, open, showFeedback, get puzzleId() { return active?.puzzleId; } };
}
