const storageKey = 'lantern-keeper:shop-notebook:v1';

function readEntries(knownIds) {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    return new Set(Array.isArray(saved) ? saved.filter((id) => knownIds.has(id)) : []);
  } catch {
    return new Set();
  }
}

export function createProgress({ objects, characters, dialogs }) {
  // 沿用物件笔记的存档格式，统一记录查看、遇见和完成的条目。
  const knownIds = new Set([...objects, ...characters, ...dialogs].map(({ id }) => id));
  const seen = readEntries(knownIds);
  return {
    get discovered() { return [...seen]; },
    has: (id) => seen.has(id),
    sections: (entry) => entry.sections.filter(({ requirements }) =>
      requirements.every((id) => seen.has(id))),
    record(id) {
      if (seen.has(id)) return false;
      seen.add(id);
      try {
        localStorage.setItem(storageKey, JSON.stringify([...seen]));
      } catch {
        // 浏览器禁用存储时，笔记本保留当前会话记录。
      }
      return true;
    },
  };
}
