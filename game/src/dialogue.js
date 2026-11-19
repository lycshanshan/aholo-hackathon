export function createDialogue(dialogs, characters, progress, onOpen, onComplete) {
  const modal = document.querySelector('#conversation');
  const speaker = document.querySelector('#conversation-speaker');
  const text = document.querySelector('#conversation-line');
  const counter = document.querySelector('#conversation-count');
  const next = document.querySelector('#conversation-next');
  const names = new Map(characters.map(({ id, title }) => [id, title]));
  names.set('me', names.get('a-zhou'));
  let ordered = [...dialogs].sort((a, b) => a.index - b.index);
  const lastReplay = new Map();
  let active;
  let lineIndex;

  function nextFor(id) {
    const rounds = ordered.filter((round) => round.trigger === id);
    const unread = rounds.find((round) => !progress.has(round.id));
    if (unread) return unread;
    const repeats = rounds.filter((round) => round.loop);
    if (!repeats.length) return;
    const last = repeats.findIndex((round) => round.id === lastReplay.get(id));
    return repeats[(last + 1) % repeats.length];
  }

  function showLine() {
    const line = active.lines[lineIndex];
    speaker.textContent = names.get(line.prefix);
    text.textContent = line.text;
    counter.textContent = `${lineIndex + 1} / ${active.lines.length}`;
    next.textContent = lineIndex === active.lines.length - 1 ? '结束对话' : '继续';
  }

  function openFor(id) {
    active = nextFor(id);
    if (!active) return;
    lineIndex = 0;
    showLine();
    onOpen();
    modal.showModal();
    next.focus();
  }

  function advance() {
    if (lineIndex < active.lines.length - 1) {
      lineIndex++;
      showLine();
      return;
    }
    // 提前退出时保留本轮对话，读完后再推进或解锁故事。
    if (progress.has(active.id)) lastReplay.set(active.trigger, active.id);
    const completed = active.id;
    const changed = progress.record(completed);
    modal.close();
    if (changed) onComplete(completed);
  }

  next.addEventListener('click', advance);
  return {
    modal, nextFor, openFor, advance,
    setScene(id) {
      ordered = dialogs.filter(({ scene }) => scene === id).sort((a, b) => a.index - b.index);
      lastReplay.clear();
    },
  };
}
