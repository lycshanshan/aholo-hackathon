const files = ['scenes', 'objects', 'characters', 'dialogs', 'stories'];

function numberedFields(entry, pattern) {
  return Object.entries(entry)
    .flatMap(([key, text]) => {
      const match = key.match(pattern);
      return match ? [{ prefix: match[1], number: Number(match[2]), text }] : [];
    })
    .sort((a, b) => a.number - b.number);
}

function readSections(entry) {
  const sections = numberedFields(entry, /^(story)\.([1-9]\d*)$/).map(({ number, text }) => ({
    text,
    requirements: entry[`requirement.${number}`] ?? [],
  }));
  return { ...entry, sections };
}

export async function loadGameData() {
  const lists = await Promise.all(files.map(async (name) => {
    const response = await fetch(new URL(`../data/${name}.json`, import.meta.url));
    if (!response.ok) throw new Error(`无法读取 ${name}.json（${response.status}）`);
    return response.json();
  }));
  const [scenes, objects, characters, dialogs, stories] = lists;
  return {
    scenes,
    objects: objects.map(readSections),
    characters: characters.map(readSections),
    dialogs: dialogs.map((entry) => ({
      ...entry,
      lines: numberedFields(entry, /^(.+)\.([1-9]\d*)$/),
    })),
    stories: stories.map(readSections),
  };
}
