import { createModelPreview } from './model-preview.js';

const categories = {
  characters: { title: '人物', empty: '尚未遇见人物。', fact: '身份', memory: '人物轶事' },
  stories: { title: '故事', empty: '尚未解锁故事。', memory: '' },
  objects: { title: '物件', empty: '尚未查看物件。', fact: '材质', memory: '物件故事' },
};

export function createNotebook(data, progress, models, modelReady, onOpen) {
  const dialog = document.querySelector('#journal');
  const detail = document.querySelector('#entry-detail');
  const title = document.querySelector('#entry-title');
  const kind = document.querySelector('#entry-kind');
  const description = document.querySelector('#entry-description');
  const facts = document.querySelector('#entry-facts');
  const factLabel = document.querySelector('#entry-fact-label');
  const fact = document.querySelector('#entry-fact');
  const memory = document.querySelector('#entry-memory');
  const memoryLabel = document.querySelector('#entry-memory-label');
  const sections = document.querySelector('#entry-sections');
  const modelDisplay = document.querySelector('#item-display');
  const modelView = document.querySelector('#model-view');
  const modelError = document.querySelector('#model-error');
  const modelHint = document.querySelector('#model-hint');
  const controls = document.querySelector('#model-controls');
  const book = document.querySelector('#notebook');
  const bookTitle = document.querySelector('#notebook-title');
  const tabs = [...document.querySelectorAll('#notebook-tabs button')];
  const empty = document.querySelector('#notebook-empty');
  const list = document.querySelector('#notebook-list');
  const button = document.querySelector('#open-notebook');
  const count = document.querySelector('#notebook-count');
  const back = document.querySelector('#notebook-back');

  // 人物和物件按发现顺序排列，故事按内容表的顺序排列。
  const byId = Object.fromEntries(['characters', 'objects'].map((key) =>
    [key, new Map(data[key].map((entry) => [entry.id, entry]))]));
  let entries;
  let category = 'characters';
  let active = null;
  let preview = null;
  let entryToFocus = null;

  function updateEntries() {
    const discovered = progress.discovered;
    entries = {
      characters: discovered.map((id) => byId.characters.get(id)).filter(Boolean),
      stories: data.stories.filter((entry) => progress.sections(entry).length),
      objects: discovered.map((id) => byId.objects.get(id)).filter(Boolean),
    };
    const total = entries.characters.length + entries.stories.length + entries.objects.length;
    count.textContent = String(total);
    button.setAttribute('aria-label', `笔记本，${total} 条记录`);
  }

  function showPage(isNotebook, hasModel = false) {
    book.hidden = !isNotebook;
    detail.hidden = isNotebook;
    dialog.classList.toggle('folio--model', hasModel);
    dialog.setAttribute('aria-labelledby', isNotebook ? bookTitle.id : title.id);
    if (!dialog.open) {
      onOpen();
      dialog.showModal();
    }
    dialog.scrollTop = 0;
  }

  function drawModel(model, preserveView = false) {
    try {
      if (!preview) preview = createModelPreview(modelView);
      preview.show(model.source, model.elevation, preserveView);
      modelError.hidden = true;
      modelHint.hidden = false;
      controls.hidden = false;
    } catch (error) {
      console.warn('物件预览加载失败。', error);
      preview?.clear();
      modelError.hidden = false;
      modelHint.hidden = true;
      controls.hidden = true;
    }
  }

  // 场景物件和笔记本条目共用详情页，只有物件展示模型。
  function openEntry(key, entry, fromNotebook = false) {
    category = key;
    entryToFocus = fromNotebook ? entry.id : null;
    const labels = categories[key];
    const model = key === 'objects' ? models.get(entry.id) : null;
    active = model ? entry.id : null;
    kind.textContent = labels.title;
    title.textContent = entry.title;
    description.hidden = !entry.description;
    description.textContent = entry.description ?? '';
    facts.hidden = !labels.fact;
    factLabel.textContent = labels.fact ?? '';
    fact.textContent = entry.material ?? entry.identity ?? '';
    memoryLabel.textContent = labels.memory;
    memoryLabel.hidden = !labels.memory;
    const unlocked = progress.sections(entry);
    memory.hidden = !unlocked.length;
    sections.replaceChildren(...unlocked.map(({ text }) => {
      const paragraph = document.createElement('p');
      paragraph.textContent = text;
      return paragraph;
    }));
    modelDisplay.hidden = !model;
    back.textContent = fromNotebook ? '← 返回笔记本' : '打开笔记本';
    back.hidden = false;
    showPage(false, Boolean(model));
    title.focus({ preventScroll: true });
    if (model) drawModel(model);
  }

  function makeEntry(entry) {
    const item = document.createElement('li');
    const action = document.createElement('button');
    action.type = 'button';
    action.dataset.entry = entry.id;
    const label = document.createElement('span');
    const name = document.createElement('span');
    name.className = 'entry-title';
    name.textContent = entry.title;
    label.append(name);
    if (entry.identity || entry.material) {
      const subtitle = document.createElement('span');
      subtitle.className = 'entry-subtitle';
      subtitle.textContent = entry.identity ?? entry.material;
      label.append(subtitle);
    }
    const arrow = document.createElement('span');
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '→';
    action.append(label, arrow);
    action.addEventListener('click', () => openEntry(category, entry, true));
    item.append(action);
    return item;
  }

  function renderList() {
    for (const tab of tabs) {
      const key = tab.dataset.category;
      tab.setAttribute('aria-pressed', String(category === key));
      tab.querySelector('span').textContent = String(entries[key].length);
    }
    empty.hidden = entries[category].length > 0;
    empty.textContent = categories[category].empty;
    list.setAttribute('aria-label', categories[category].title);
    list.replaceChildren(...entries[category].map(makeEntry));
  }

  function openNotebook() {
    if (dialog.open && !book.hidden) return;
    active = null;
    preview?.clear();
    back.hidden = true;
    renderList();
    showPage(true);
    const entry = [...list.querySelectorAll('button')].find((action) => action.dataset.entry === entryToFocus);
    (entry ?? bookTitle).focus({ preventScroll: true });
    entryToFocus = null;
  }

  // 返回索引时保留栏目和焦点，替换模型时保留当前镜头。
  for (const tab of tabs) {
    tab.addEventListener('click', () => {
      category = tab.dataset.category;
      renderList();
    });
  }
  button.addEventListener('click', openNotebook);
  back.addEventListener('click', openNotebook);
  controls.addEventListener('click', (event) => {
    const control = event.target.closest('[data-turn]');
    if (!control || !preview) return;
    const direction = Number(control.dataset.turn);
    if (direction) preview.turn(direction * 0.38);
    else preview.reset();
  });
  for (const [id, ready] of modelReady) {
    ready.then(() => {
      if (dialog.open && active === id) drawModel(models.get(id), true);
    });
  }
  dialog.addEventListener('close', () => {
    if (dialog.open) return;
    active = null;
    entryToFocus = null;
    preview?.clear();
  });

  updateEntries();
  return { dialog, openNotebook, updateEntries, openItem: (entry) => openEntry('objects', entry) };
}
