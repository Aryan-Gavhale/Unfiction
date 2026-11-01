/*!
 * Unfiction GFX Toolkit — scene presets
 * Ready-made scenes for the shots most episodes need. Each returns a scene object for UF.Stage,
 * with the background, heading and source line already placed:
 *
 *   scenes: [
 *     UF.scenes.chapter({ id: 'act-2', kicker: 'ACT 2', heading: 'BUILDING THE ESCAPE ROUTE', sub: 'May 2015 — Feb 2016' }),
 *     UF.scenes.chart({ id: 'losses', duration: 10, kicker: 'THE $951M ATTEMPT', heading: 'Where the orders ended up',
 *                       source: 'Reuters, 2016', chart: { type: 'bar', format: 'money', bars: [ ... ] } }),
 *     UF.scenes.chat({ id: 'scam-texts', duration: 16, source: 'Court filing, 2021', chat: { messages: [ ... ] } }),
 *   ]
 *
 * Shared options: id (required), duration (seconds, required except for chapter), title (HUD name),
 * transition, pushIn, background ('void' | 'grid' | 'desk'), factual, ignore, label.
 * Every preset except chapter needs `source`: the SourceTag text. To show none, pass source: false
 * with a `note` saying why (e.g. 'Illustrative figures'); the note is shown in the source's place.
 * Ledger, chat and call print their own note, so with source: false a note in the component's
 * options is enough.
 * The component's own options go in one object named after the preset (chart, document, ledger,
 * chat, call, route, wall, board), so they never mix with scene options.
 * kicker / heading are accepted by chart and ledger, the presets that leave room for them.
 */
(function (UF) {
  'use strict';

  const W = UF.W;
  const SCENE = ['id', 'title', 'duration', 'transition', 'pushIn', 'background', 'factual', 'ignore', 'label'];
  const SOURCED = [...SCENE, 'source', 'sourceAt', 'note'];

  function check(name, o, allowed) {
    if (!o || typeof o !== 'object') throw new Error(`UF.scenes.${name}: pass an options object.`);
    const bad = Object.keys(o).filter(k => !allowed.includes(k));
    if (bad.length) throw new Error(`UF.scenes.${name}: unknown option "${bad[0]}" — use ${allowed.join(', ')}.`);
    if (!o.id) throw new Error(`UF.scenes.${name}: every scene needs an id.`);
    if (!(o.duration > 0)) throw new Error(`UF.scenes.${name} "${o.id}": pass duration in seconds.`);
  }

  function need(name, cls, file) {
    if (!UF[cls]) throw new Error(`UF.scenes.${name} needs UF.${cls} — add <script src=".../components/${file}"> before uf-presets.js.`);
  }

  function opts(name, o, key) {
    const v = o[key];
    if (!v || typeof v !== 'object') throw new Error(`UF.scenes.${name} "${o.id}": pass the component's options as ${key}: { ... }.`);
    return Object.assign({}, v);
  }

  function scene(name, o, layers) {
    const s = { id: o.id, title: o.title || `${name} · ${o.id}`, duration: o.duration, layers };
    for (const k of ['transition', 'pushIn', 'factual', 'ignore', 'label']) if (o[k] !== undefined) s[k] = o[k];
    return s;
  }

  /** A SourceTag, a NOTE in its place, or nothing when the component already prints its own note. */
  function source(name, o, place = {}, ownNote = '') {
    if (o.source === false) {
      if (!o.note && ownNote) return [];
      if (!o.note) throw new Error(`UF.scenes.${name} "${o.id}": source: false needs a note saying why there is no source; it is shown on screen.`);
      return [new UF.SourceTag(Object.assign({ label: 'NOTE', text: o.note, at: o.sourceAt ?? 0.8 }, place))];
    }
    if (typeof o.source !== 'string' || !o.source.trim()) {
      throw new Error(`UF.scenes.${name} "${o.id}": pass source: 'Publisher, date' (shown as a SourceTag), or source: false with a note.`);
    }
    return [new UF.SourceTag(Object.assign({ text: o.source, at: o.sourceAt ?? 0.8 }, place))];
  }

  /** The source goes on the opposite side to a phone's own note. */
  const opposite = comp => (comp.noteSide === 'l' ? { x: W - 96, align: 'right' } : {});

  function heading(o) {
    return o.kicker || o.heading ? [new UF.Heading({ kicker: o.kicker || '', title: o.heading || '', at: 0.2, y: 80 })] : [];
  }

  const bg = (o, style, extra) => new UF.Background(Object.assign({ style: o.background || style }, extra));

  UF.scenes = {
    /** Chapter card. { id, kicker, heading, sub, duration = 5 } */
    chapter(o) {
      o = Object.assign({ duration: 5 }, o);
      check('chapter', o, [...SCENE, 'kicker', 'heading', 'sub']);
      if (!o.heading) throw new Error(`UF.scenes.chapter "${o.id}": pass heading (the chapter title).`);
      return scene('chapter', Object.assign({ title: `Chapter · ${o.heading}` }, o), [
        bg(o, 'void'),
        new UF.TitleCard({ kicker: o.kicker || '', title: o.heading, sub: o.sub || '', at: 0.3 }),
      ]);
    },

    /** Line or bar chart under a heading. chart: { type: 'line' | 'bar', ...LineChart / BarChart options } */
    chart(o) {
      check('chart', o, [...SOURCED, 'kicker', 'heading', 'chart']);
      const c = opts('chart', o, 'chart');
      const type = c.type || (c.bars ? 'bar' : 'line');
      delete c.type;
      const cls = { line: 'LineChart', bar: 'BarChart' }[type];
      if (!cls) throw new Error(`UF.scenes.chart "${o.id}": chart.type must be 'line' or 'bar', not "${type}".`);
      need('chart', cls, 'uf-chart.js');
      const top = o.kicker || o.heading ? 230 : 140;
      return scene('chart', o, [
        bg(o, 'grid'), ...heading(o),
        new UF[cls](Object.assign({ y: top, h: 930 - top, at: 0.3 }, c)),
        ...source('chart', o),
      ]);
    },

    /** Court filing or letter with highlights, redactions and a camera. document: DocumentReveal options */
    document(o) {
      check('document', o, [...SOURCED, 'document']);
      need('document', 'DocumentReveal', 'uf-reveal.js');
      const d = Object.assign({ at: 0.2 }, opts('document', o, 'document'));
      return scene('document', Object.assign({ pushIn: 0 }, o), [bg(o, 'desk'), new UF.DocumentReveal(d), ...source('document', o, { backing: true })]);
    },

    /** Bank statement with a running balance. ledger: Ledger options */
    ledger(o) {
      check('ledger', o, [...SOURCED, 'kicker', 'heading', 'ledger']);
      need('ledger', 'Ledger', 'uf-ledger.js');
      const l = Object.assign({ at: 0.2 }, opts('ledger', o, 'ledger'));
      if ((o.kicker || o.heading) && l.y == null) l.y = 600;
      return scene('ledger', o, [bg(o, 'grid'), ...heading(o), new UF.Ledger(l), ...source('ledger', o, {}, l.note)]);
    },

    /** Messaging thread on a phone. chat: ChatThread options */
    chat(o) {
      check('chat', o, [...SOURCED, 'chat']);
      need('chat', 'ChatThread', 'uf-chat.js');
      const comp = new UF.ChatThread(Object.assign({ at: 0.2 }, opts('chat', o, 'chat')));
      return scene('chat', o, [bg(o, 'void'), comp, ...source('chat', o, opposite(comp), comp.note)]);
    },

    /** Phone call with an optional transcript. call: PhoneCall options */
    call(o) {
      check('call', o, [...SOURCED, 'call']);
      need('call', 'PhoneCall', 'uf-phone.js');
      const comp = new UF.PhoneCall(Object.assign({ at: 0.2 }, opts('call', o, 'call')));
      return scene('call', o, [bg(o, 'void'), comp, ...source('call', o, opposite(comp), comp.note)]);
    },

    /** Dated journey across the map. route: RouteMap options */
    route(o) {
      check('route', o, [...SOURCED, 'route']);
      need('route', 'RouteMap', 'uf-route.js');
      return scene('route', Object.assign({ pushIn: 0 }, o), [bg(o, 'void', { dust: false }), new UF.RouteMap(opts('route', o, 'route')), ...source('route', o)]);
    },

    /** Wall of portraits narrowing to one person. wall: PhotoWall options */
    wall(o) {
      check('wall', o, [...SOURCED, 'wall']);
      need('wall', 'PhotoWall', 'uf-wall.js');
      return scene('wall', o, [bg(o, 'void'), new UF.PhotoWall(Object.assign({ at: 0.2 }, opts('wall', o, 'wall'))), ...source('wall', o)]);
    },

    /** Evidence board. board: EvidenceBoard options */
    board(o) {
      check('board', o, [...SOURCED, 'board']);
      need('board', 'EvidenceBoard', 'uf-board.js');
      return scene('board', Object.assign({ pushIn: 0 }, o), [new UF.EvidenceBoard(opts('board', o, 'board')), ...source('board', o, { backing: true })]);
    },
  };
})(window.UF);
