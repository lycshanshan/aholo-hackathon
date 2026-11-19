import { benchesPuzzle, lampPuzzle } from './courtyard.js';
import { framePuzzle } from './frame.js';
import { photoPuzzle } from './photo.js';
import { createPuzzleUI } from './ui.js';
import { cradlePuzzle, planePuzzle } from './wood.js';

const factories = {
  'lin-benches': benchesPuzzle,
  'lin-light': lampPuzzle,
  'wang-photo': photoPuzzle,
  'wang-support': (ui, text, common, complete) => framePuzzle(ui, text, common, complete, false),
  'wang-frame': (ui, text, common, complete, angle) => framePuzzle(ui, text, common, complete, true, angle),
  'du-plane': planePuzzle,
  'du-cradle': cradlePuzzle,
};

export const businessPuzzleIds = new Set(Object.keys(factories));

export function mountBusinessPuzzle(host, id, texts, complete, supportAngle) {
  const common = texts.get('puzzle-controls');
  const text = texts.get(`${id}-puzzle`);
  const ui = createPuzzleUI(host, text, common);
  const resources = new Set();
  let disposed = false;
  let finished = false;
  ui.track = (resource) => {
    if (disposed) resource.destroy();
    else resources.add(resource);
    return resource;
  };
  function finish(poses) {
    if (disposed || finished) return;
    finished = true;
    for (const resource of resources) resource.lock?.(true);
    host.querySelectorAll('button, input').forEach((control) => { control.disabled = true; });
    complete(poses);
  }
  Promise.resolve(factories[id](ui, text, common, finish, supportAngle))
    .then((resource) => { if (resource) ui.track(resource); })
    .catch((error) => {
      if (disposed) return;
      console.error(error);
      ui.say(common.error);
      for (const resource of resources) resource.destroy();
      resources.clear();
      host.querySelectorAll('button, input').forEach((control) => { control.disabled = true; });
    });
  return {
    destroy() {
      disposed = true;
      for (const resource of resources) resource.destroy();
      resources.clear();
      host.replaceChildren();
    },
  };
}
