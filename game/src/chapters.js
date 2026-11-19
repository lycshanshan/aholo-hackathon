import { bounds as shopBounds, objectPoints, spawn as shopSpawn } from './shop.js';

export const firstScene = 'clinic';
export const businessScenes = ['lin', 'wang', 'du'];
export const endings = { 'city-work': 'city-ending', 'village-lamp': 'village-ending' };

const point = (kind, id, x, z, height, extra) => ({ kind, id, x, z, height, reach: 1.3, ...extra });
const object = (id, x, z, height, model) => point('objects', id, x, z, height, { model });
const person = (id, x, z, height, model, requires = []) =>
  point('characters', id, x, z, height, { model, requires });
const action = (id, x, z, height, extra) => point('actions', id, x, z, height, extra);

const shopNotes = objectPoints.map((entry) => ({
  kind: 'objects', model: entry.id, ...entry,
}));
const shop = { layout: 'shop', bounds: shopBounds, spawn: shopSpawn, view: 5.3 };
const courtyard = { layout: 'courtyard', bounds: { left: -4.6, right: 4.6, back: -3.1, front: 3.7 }, spawn: { x: 0.4, z: 2.6 }, view: 5.0 };
const room = { layout: 'room', bounds: { left: -4.3, right: 4.3, back: -2.85, front: 3.0 }, spawn: { x: 0.35, z: 2.2 }, view: 4.6 };

export const chapters = {
  clinic: {
    ...room, theme: 'clinic', tasks: ['last-words'], next: 'funeral-shop', advanceOn: 'last-words',
    points: [
      person('grandma', -0.77, -0.94, 1.36, 'bed'),
      object('clinic-stool', 0.61, -1.49, 0.68, 'stool'),
    ],
  },
  'funeral-shop': {
    ...shop, tasks: ['ledger', 'fold-lotus', 'take-wreath'], next: 'funeral',
    points: [
      ...shopNotes,
      action('fold-lotus', 1.39, -0.82, 1.66, { model: 'lotus', requires: ['lotus'], drag: true }),
      action('take-wreath', -3.83, -1.94, 2.56, { model: 'wreath', requires: ['wreath'], reach: 1.53 }),
    ],
  },
  funeral: {
    ...courtyard, theme: 'funeral', tasks: ['farewell-host'], next: 'business', advanceOn: 'farewell-host',
    points: [
      object('osmanthus', 0.44, -1.83, 1.4, 'branch'),
      action('dress-wreath', 0.44, -1.83, 1.4, { model: 'wreath', requires: ['osmanthus'] }),
      action('offer-stool', -2.56, 0.32, 0.82, { model: 'stool', requires: ['dress-wreath'] }),
      person('aunt-zhou', -2.91, 0.19, 1.42, 'zhou', ['offer-stool']),
      person('uncle-chen', 2.55, -0.80, 1.86, 'chen', ['dress-wreath']),
      action('farewell-host', 0, -1.62, 1.69, { requires: ['zhou-farewell', 'chen-farewell'] }),
    ],
  },
  business: { ...shop, theme: 'autumn', tasks: [], points: [] },
  lin: {
    ...courtyard, theme: 'lin', tasks: ['lin-benches', 'lin-light'], next: 'business',
    points: [
      object('lin-worn-floor', 0.1, 0.64, 0.34),
      object('lin-gate', 2.55, 1.83, 1.53, 'gate'),
      action('lin-benches', -1.2, 0.58, 0.75, { model: 'bench-a', requires: ['lin-worn-floor'] }),
      action('lin-light', 0.88, -1.65, 1.34, { model: 'lotus', requires: ['lin-benches', 'lin-gate'] }),
    ],
  },
  wang: {
    ...room, theme: 'wang', tasks: ['wang-photo', 'wang-support', 'wang-frame'], next: 'business',
    points: [
      object('wang-photos', -0.7, -1.07, 1.32, 'photo-stack'),
      object('wang-groove', 1.0, -1.34, 1.38, 'frame'),
      action('wang-photo', -0.7, -1.07, 1.32, { model: 'photo-stack', requires: ['wang-photos'] }),
      action('wang-support', 1.0, -1.34, 1.38, { model: 'frame', requires: ['wang-photo', 'wang-groove'] }),
      action('wang-frame', 1.0, -1.34, 1.38, { model: 'frame', requires: ['wang-support'] }),
    ],
  },
  du: {
    ...room, theme: 'du', tasks: ['du-plane', 'du-cradle'], next: 'business',
    points: [
      object('du-shaving', -0.58, -0.85, 1.27, 'shaving'),
      object('du-supports', 2.75, -0.85, 1.30, 'cradle'),
      action('du-plane', -1.44, -0.92, 1.40, { model: 'wide-plane', requires: ['du-shaving'], elevation: 0.28 }),
      action('du-cradle', 2.75, -0.85, 1.30, { model: 'cradle', requires: ['du-plane', 'du-supports'] }),
    ],
  },
  decision: {
    ...shop, theme: 'winter', tasks: ['ye-offer'],
    points: [
      object('delivery-note', 3.30, -0.81, 1.36, 'ledger'),
      object('city-letter', 2.17, -0.76, 1.32, 'letter'),
      person('ye-he', -0.95, -0.33, 1.85, 'ye', ['delivery-note', 'city-letter']),
      action('branch-choice', 0.1, 1.03, 0.85, { requires: ['ye-offer'] }),
    ],
  },
  'city-close': {
    ...shop, theme: 'winter', tasks: ['close-shop'], next: 'city-work', advanceOn: 'close-shop',
    points: [
      action('box-flowers', 1.72, -0.78, 1.37, { model: 'crate' }),
      action('store-paper', 2.4, -2.55, 1.33, { model: 'cabinet', reach: 1.42 }),
      action('pack-bag', -1.31, 1.44, 0.86, { model: 'luggage' }),
      person('uncle-chen', -2.14, 1.92, 1.8, 'chen', ['box-flowers', 'store-paper', 'pack-bag']),
      action('close-shop', 0.55, 2.72, 0.81, { model: 'door', requires: ['chen-handover'] }),
    ],
  },
  'city-work': {
    ...room, theme: 'city', tasks: ['city-finish'],
    points: [
      object('city-catalog', -1.04, -1.12, 1.29, 'ledger'),
      action('city-weave', 0.44, -1.24, 1.7, { model: 'wreath', requires: ['city-catalog'] }),
      person('ye-he', 2.65, -0.15, 1.86, 'ye', ['city-weave']),
      action('city-finish', 0.44, -1.24, 1.71, { model: 'wreath', requires: ['ye-delivery'] }),
    ],
  },
  'village-stock': {
    ...shop, theme: 'winter', tasks: ['zhou-open'], next: 'village-lamp',
    points: [
      action('split-paper', 0.32, 1.71, 0.76, { model: 'crate' }),
      action('village-book', 3.3, -0.81, 1.37, { model: 'ledger', requires: ['split-paper'] }),
      action('hang-sign', 2.4, 2.92, 1.35, { model: 'sign', requires: ['village-book'] }),
      action('stool-out', -2.99, 1.82, 0.67, { model: 'stool', requires: ['hang-sign'] }),
      person('aunt-zhou', 0.15, 0.4, 1.8, 'zhou', ['stool-out']),
    ],
  },
  'village-lamp': {
    ...shop, theme: 'spring', tasks: ['village-finish'],
    points: [
      action('trim-plum', 1.39, -0.82, 1.66, { model: 'lotus', drag: true }),
      person('uncle-chen', -0.58, -0.25, 1.86, 'chen', ['trim-plum']),
      action('village-finish', 3.3, -0.81, 1.37, { model: 'ledger', requires: ['chen-lamp'] }),
    ],
  },
};

export function requirementsMet(progress, requirements = []) {
  return requirements.every((id) => progress.has(id) || progress.skipped(id));
}

export function caseStatus(progress, id) {
  if (progress.skipped(id)) return 'skipped';
  const tasks = chapters[id].tasks;
  if (!requirementsMet(progress, tasks)) return 'open';
  return tasks.every(progress.has) ? 'complete' : 'handled';
}

export function currentPuzzle(progress, id) {
  return chapters[id].tasks.find((task) => !progress.has(task) && !progress.skipped(task));
}
