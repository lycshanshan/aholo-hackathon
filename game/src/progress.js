const storageKey = 'lantern-keeper:journey:v1';

function readSave() {
  try {
    return JSON.parse(localStorage.getItem(storageKey));
  } catch {
    return null;
  }
}

function restoreIds(entries, ids) {
  return new Set(Array.isArray(entries) ? entries.filter((id) => ids.has(id)) : []);
}

function restorePoses(entries, ids) {
  return new Map(Object.entries(entries ?? {}).filter(([id, poses]) => ids.has(id) && Array.isArray(poses) &&
    poses.every((pose) => Array.isArray(pose) && pose.length === 7 && typeof pose[0] === 'string' &&
      pose.slice(1, 6).every(Number.isFinite) && typeof pose[6] === 'boolean')));
}

export function createProgress(data, firstScene) {
  const { objects, characters, dialogs, actions, scenes } = data;
  const knownIds = new Set([...objects, ...characters, ...dialogs, ...actions].map(({ id }) => id));
  knownIds.add('choose-city').add('choose-village');
  const scenesById = new Set(scenes.map(({ id }) => id));
  const saved = readSave();
  const seen = restoreIds(saved?.seen, knownIds);
  const skipped = restoreIds(saved?.skipped, new Set([...scenesById, ...actions.map(({ id }) => id)]));
  const poses = restorePoses(saved?.poses, knownIds);
  // 旧存档中跳过相框安放时，同时补齐它的前置步骤。
  if (skipped.has('wang-frame') && !seen.has('wang-support')) skipped.add('wang-support');
  let scene = scenesById.has(saved?.scene) ? saved.scene : firstScene;

  // 场景切换、选择和跳过共用一个存档，刷新后按同一进度继续。
  function save() {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ scene, seen: [...seen], skipped: [...skipped], poses: Object.fromEntries(poses) }));
    } catch {
      // 浏览器禁用存储时，当前会话仍可继续。
    }
  }

  // 完成动作时一并保存摆放，回到场景或刷新后仍能保留手作结果。
  return {
    get scene() { return scene; },
    get discovered() { return [...seen]; },
    has: (id) => seen.has(id),
    skipped: (id) => skipped.has(id),
    pose: (id) => poses.get(id),
    sections: (entry) => entry.sections.filter(({ requirements }) =>
      requirements.every((id) => seen.has(id))),
    record(id, placement) {
      if (seen.has(id)) return false;
      seen.add(id);
      if (placement) poses.set(id, placement);
      save();
      return true;
    },
    go(destination, { mark = [], skip = [] } = {}) {
      mark.forEach((id) => seen.add(id));
      skip.forEach((id) => skipped.add(id));
      scene = destination;
      save();
    },
    restart() {
      seen.clear();
      skipped.clear();
      poses.clear();
      scene = firstScene;
      save();
    },
  };
}
