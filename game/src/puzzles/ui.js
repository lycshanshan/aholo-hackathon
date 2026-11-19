export function button(parent, text, activate, className = '') {
  const element = document.createElement('button');
  element.type = 'button';
  element.className = className;
  element.textContent = text;
  element.addEventListener('click', activate);
  parent.append(element);
  return element;
}

export function element(parent, tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text) node.textContent = text;
  parent.append(node);
  return node;
}

export function createPuzzleUI(host, text, common) {
  const workspace = element(host, 'div', 'puzzle-workspace');
  const surface = element(workspace, 'div', 'puzzle-surface');
  const toolbar = element(host, 'div', 'puzzle-toolbar');
  const tools = element(toolbar, 'div', 'puzzle-tools');
  const actions = element(toolbar, 'div', 'puzzle-actions');
  const status = element(host, 'p', 'puzzle-status', text.instruction);
  status.setAttribute('role', 'status');
  const utility = element(host, 'div', 'puzzle-utility');
  let hint = 0;
  const reset = button(utility, common.reset, () => {});
  button(utility, common.hint, () => {
    status.textContent = text.hints[Math.min(hint++, text.hints.length - 1)];
  });
  return {
    workspace, surface, tools, actions, reset, status,
    say(message) { status.textContent = message; },
    observation(label) {
      const aside = element(workspace, 'aside', 'puzzle-observation');
      element(aside, 'p', 'puzzle-observation-title', label);
      return element(aside, 'div', 'puzzle-observation-view');
    },
    range(label, min, max, value, change) {
      const field = element(tools, 'label', 'puzzle-range');
      element(field, 'span', '', label);
      const input = element(field, 'input', '');
      Object.assign(input, { type: 'range', min, max, step: '1', value });
      input.addEventListener('input', () => change(Number(input.value)));
      return input;
    },
  };
}
