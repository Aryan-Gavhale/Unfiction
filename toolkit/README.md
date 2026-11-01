# Unfiction GFX Toolkit

Reusable motion-graphics components for Unfiction videos. Each episode is one HTML file that lists its scenes; the toolkit draws them at 1920×1080 with the channel's film look (grain, vignette, colour split, glitch) and records each scene straight to MP4 from the browser.

Version 1.4.0. No install, no build step, no internet. Chrome or Edge (Python 3.10+ for the optional tools).

Besides the scenes themselves, every page can save a YouTube thumbnail, export a cue sheet of its hits for the sound edit, render a contact sheet, and check itself against the channel's editorial rules.

## Folder layout

```
Unfiction/
  toolkit/
    core/
      uf-core.js        stage, timing, easing, colours, fonts, film-look shader, transitions, MP4 export,
                        thumbnail, cue sheet, contact sheet, editorial check
      uf-draw.js        text, panels, highlights, paths, paper texture, money format, legal status, street sign, 28 line icons
      uf-geo.js         world land shapes and ~50 city coordinates
    components/
      uf-overlays.js    Background, Heading, SourceTag, TitleCard, LowerThird, StatusBadge, Caption,
                        DramaLabel, Disclaimer, Stamp, Counter, DataPanel
      uf-worldmap.js    WorldMap (dot map, camera moves, pins, money arcs)
      uf-clocks.js      WorldClocks, CalendarStrip
      uf-flow.js        FlowChart (money moving between accounts)
      uf-quote.js       QuoteCard (typed statement on paper or dark card)
      uf-code.js        HexPatch (memory dump, bytes changed)
      uf-timeline.js    Timeline, TimeChip
      uf-document.js    EmailCard (recreated email with a click)
      uf-network.js     NetworkSpread (infection spreading through PCs, then a wait timer)
      uf-board.js       EvidenceBoard (cards pinned to cork, red string, camera, focus)
      uf-chart.js       LineChart, BarChart (animated charts with money formatting)
      uf-reveal.js      DocumentReveal (court filing or letter: highlighter, redactions, circles, camera)
      uf-ledger.js      Ledger (bank statement with a running balance, flagged rows and erased rows)
      uf-factcard.js    FactCard (dated fact: highlighted phrase, figure, legal status, source footer)
      uf-calendar.js    CalendarFlip (split-flap calendar flipping through months or years)
      uf-compare.js     Compare (two panels that turn out to match: words, icons or code listings)
      uf-nightmap.js    NightMap (city lights seen from space at night; needs uf-geo.js)
      uf-endscreen.js   EndScreen (closing card with slots for YouTube's end-screen elements)
      uf-chat.js        ChatThread (message thread on a phone)
      uf-phone.js       PhoneCall (incoming call, timer, waveform, transcript)
      uf-route.js       RouteMap (dated journey across the world map; needs uf-worldmap.js)
      uf-wall.js        PhotoWall (wall of portraits narrowing to one person)
      uf-thumbnail.js   Thumbnail (YouTube thumbnail layout)
      uf-props.js       Prop (ATM, cards, cash, desk, chairs, screens, phones, bags, paper, clock, fan, ...), Room
      uf-character.js   Character (the recurring faceless figure: roles, poses, walking, hand targets; needs uf-props.js)
      uf-presets.js     UF.scenes.* (whole scenes for the common shots; load it last)
    examples/
      episode-template.html     copy this to start an episode
      thumbnail-template.html   copy this to make an episode's thumbnails
      gallery.html              one demo scene per component not used in EP01
      cast.html                 the character and every prop, plus three dramatised set-ups
    tools/
      stills.py          PNG previews of chosen frames
      contact_sheet.py   one JPEG with a row of frames per scene
      thumbnail.py       saves thumbnails as 1280x720 JPEGs under 2 MB
      cues.py            cue sheet (CSV) of every hit, flash and glitch
      check.py           editorial check from the command line
      embed_images.py    packs photos into a script so pages can use them (see Using real photos)
      _chrome.py         shared headless-Chrome helper the other tools use
  episodes/
    EP01-bangladesh-bank-heist/gfx-scenes.html   45 scenes in script order, the best worked example
    EP01-bangladesh-bank-heist/overlays.html     green-screen overlays: labels, time chips, name tags (open with ?key)
```

## Making MP4 snippets

1. Open the episode HTML in Chrome or Edge (double-click works).
2. Press **Space** to watch. The panel in the top-left lists every scene with its start time.
3. Press **Shift+E** to record every scene as its own file, or open `gfx-scenes.html?scene=3` and press **E** to record just scene 3.
4. Files land in your Downloads folder as `<slug>-<NN>-<scene-id>.mp4`, for example `ep01-20-funds-trace.mp4`.

Things to know:

- **Recording happens in real time.** An 18-second scene takes 18 seconds. Keep the tab visible and in front while it records; a hidden or minimised tab is throttled by the browser and the video will stutter. Press **Esc** to cancel.
- The first time you use Shift+E, Chrome asks whether the page may download multiple files. Allow it.
- Each file from Shift+E includes 0.25 s of black before and after the scene, so you have clean handles to cut on.
- Recent Chrome and Edge write H.264 MP4. An older browser falls back to WebM; DaVinci Resolve and Premiere import WebM, or convert it with HandBrake.
- `?scale=2` records at 3840×2160. Use it only if playback stays smooth on your machine; dropped frames end up in the file.
- If playback stutters even at normal scale, open `chrome://gpu` and check that Canvas says *Hardware accelerated*. Without it the browser draws in software and recordings drop frames.
- `?key` swaps the background for flat `#00FF00` and turns off the film look (grain, vignette, colour split, glitch, fades), so you can key the graphics cleanly over your own footage. Backgrounds draw nothing in this mode.
- There is no audio. Add music and sound effects in your editor.

### URL options

| Option | Effect |
|---|---|
| `?scene=N` | Show only scene N (1-based). E then exports just that scene. |
| `?frame=T` | Freeze at time T seconds. With `?scene`, T is measured from the scene start. |
| `?autoplay` | Start playing on load. |
| `?loop` | Loop at the end. |
| `?scale=0.5..2` | Output resolution multiplier. Layout is always 1920×1080 logical. |
| `?key` | Green-screen mode. |
| `?check`, `?cues`, `?sheet=N`, `?thumb` | Report modes used by the tools: the page renders once, writes its report into the page and stops. You won't need them by hand. |

Combine with `&`: `gfx-scenes.html?scene=2&scale=2`.

### Keys

| Key | Action |
|---|---|
| Space or click | Play / pause |
| R | Restart from the beginning |
| ← / → | Previous / next scene |
| 1–9 | Jump to scene |
| E | Export the whole reel (or the solo scene) as one file |
| Shift+E | Export every scene as a separate file |
| S | Save a PNG of the current frame |
| T | Save the current frame as a YouTube thumbnail (1280×720 JPEG, under 2 MB) |
| C | Save the cue sheet (CSV of every hit, flash and glitch) |
| K | Show the editorial check findings |
| F | Fullscreen |
| H | Show / hide the scene panel |
| Esc | Cancel recording |

## Starting a new episode

1. Make a folder `episodes/EPxx-short-name/` and copy `toolkit/examples/episode-template.html` into it as `gfx-scenes.html`. The script paths already point at the toolkit from there.
2. Write one function per scene. Put every timing at the top of the function in a `B` (beats) object, with a comment naming the script line it belongs to.
3. Add the scene function to the `scenes` list at the bottom, and set `title` and `slug` (the slug prefixes exported filenames).
4. To fit a scene to your voice-over, play the narration, note when each beat lands measured from the start of the scene, and change only the `B` numbers.
5. Before exporting, press **K** (or run `tools/check.py`) and clear every editorial error. See Editorial check.

```js
function sceneMoneyTrail() {
  const B = {
    map: 0.4,      // L12  map fades in
    arc: 2.0,      // L12  "the money left Dhaka..."
    stop: 7.5,     // L13  "...and one payment was stopped"
    end: 12,
  };
  return {
    id: 'money-trail',               // used in exported filenames
    title: 'L12–13 · Money trail',   // shown in the scene panel
    duration: B.end,
    layers: [
      new UF.Background({ style: 'grid' }),
      new UF.WorldMap({
        reveal: { at: B.map, dur: 1.4 },
        pins: [{ place: 'DHAKA', label: 'DHAKA', at: B.map + 0.4, icon: 'bank' }],
        arcs: [{ from: 'DHAKA', to: 'COLOMBO', at: B.arc, label: '$20M', stop: { at: B.stop, label: 'STOPPED' } }],
      }),
      new UF.SourceTag({ text: 'Reuters, 2016', at: 1 }),
    ],
  };
}
```

## How a scene works

A scene is `{ id, title, duration, layers: [...] }`. Optional per-scene keys:

| Key | Effect |
|---|---|
| `transition` | How the scene enters and leaves: `'fade'` (default), `'cut'`, `'glitch'`, `'wipe'`, `'flash'` or `'zoom'`. See Transitions. |
| `pushIn` | Slow zoom over the scene. Default `0.03`; `0` turns it off. |
| `factual` | `true` or `false`: overrides whether the editorial check expects a source here. |
| `source` | Source text for the editorial check, when the source is in the voice-over rather than on screen. |
| `label` | `'RECREATION'`, `'ILLUSTRATION'` or `'DRAMATISATION'`, when the whole scene is staged and the label is in the footage or the edit. |
| `ignore` | Editorial-check rules to skip for this scene, e.g. `['stamp-near-person']`. Leave a comment saying why. |

- **Scenes never overlap.** The stage plays them one after another with `gap` seconds of pure black between, and each one enters and leaves on its own. A transition runs inside its own scene, so every exported file stays self-contained.
- **Layers draw in order**, first at the back. A layer is any component, or a function wrapped with `UF.layer` (see below).
- **All times are seconds from the start of the scene.** Every component takes `at` (appear), `out` (disappear, default never), `fadeIn` and `fadeOut` (default 0.4 s).
- **Coordinates are 1920×1080** regardless of `?scale`. `UF.W` and `UF.H` hold those numbers.
- **Frames are deterministic.** The same time always draws the same picture, so previews, stills and exports match. Use `UF.rng(seed)` instead of `Math.random()`.

Instead of `layers`, a scene may supply `render(ctx, t, fx, scene)` and draw everything itself.

### Transitions

Each scene opens and closes with its `transition`. It happens inside the scene's own time, over the first and last fraction of a second, so the scene still starts and ends on black and never bleeds into its neighbour.

| Type | In / out | Default length |
|---|---|---|
| `'fade'` | Fade from and to black | the stage's `fadeIn` / `fadeOut` (0.35 s) |
| `'cut'` | Hard cut | 0 |
| `'glitch'` | Digital break-up and colour split, then picture | 0.3 s |
| `'wipe'` | Black panel with a red edge sweeps across | 0.6 s |
| `'flash'` | White flash with a colour split | 0.45 s |
| `'zoom'` | Camera rushes in (or out) while fading | 0.6 s |

```js
transition: 'glitch'                                   // both ends
transition: { in: 'cut', out: 'flash' }                // different ends
transition: { in: 'wipe', out: 'fade', dur: 0.5 }      // dur applies to both ends
transition: { in: 'zoom', dur: { in: 0.8 } }           // or per end; the other end keeps its default
```

An unknown type throws an error, and so does a transition longer than half the scene. Glitch and flash transitions appear in the cue sheet, so the sound editor can hit them. `?key` skips transitions, since a keyed graphic should be cut in the edit.

## Scene presets — `uf-presets.js`

Presets build a whole scene for the shots most episodes need, with the background, heading and source line already placed. Load `uf-presets.js` after the components it uses.

```js
scenes: [
  UF.scenes.chapter({ id: 'act-2', kicker: 'ACT 2', heading: 'BUILDING THE ESCAPE ROUTE', sub: 'May 2015 — Feb 2016' }),
  UF.scenes.chart({
    id: 'orders', duration: 10, kicker: 'THE $951M ATTEMPT', heading: 'Where the payment orders ended up',
    source: 'Reuters; BAE Systems, 2016',
    chart: { type: 'bar', format: 'money', bars: [ /* ... */ ] },
  }),
  UF.scenes.chat({ id: 'texts', duration: 16, source: false, chat: { note: 'Recreation based on <source>', messages: [ /* ... */ ] } }),
]
```

| Preset | Builds | Component options go in |
|---|---|---|
| `chapter` | void background + TitleCard. Takes `kicker`, `heading`, `sub`; `duration` defaults to 5 | — |
| `chart` | grid + optional heading + LineChart or BarChart (`type: 'line' \| 'bar'`) + source | `chart` |
| `document` | desk + DocumentReveal + source on a dark backing | `document` |
| `ledger` | grid + optional heading + Ledger + source | `ledger` |
| `chat` | void + ChatThread + source on the side away from the phone's note | `chat` |
| `call` | void + PhoneCall + source on the side away from the phone's note | `call` |
| `route` | void (no dust) + RouteMap + source, `pushIn: 0` | `route` |
| `wall` | void + PhotoWall + source | `wall` |
| `board` | EvidenceBoard + source on a dark backing, `pushIn: 0` | `board` |

- Every preset takes `id` (required), `duration` (required except for `chapter`), `title`, `transition`, `pushIn`, `background` (`'void' | 'grid' | 'desk'`, to override the default), `factual`, `ignore` and `label`.
- `kicker` and `heading` are accepted by `chart` and `ledger`, the two that leave room for them.
- Every preset except `chapter` needs `source`: the SourceTag text. When there is no source to name, pass `source: false` with a `note` saying why (`'Illustrative figures'`); it shows as a NOTE in the source's place. Ledger, chat and call print their own `note`, so with `source: false` a note inside the component options is enough. `sourceAt` moves the source's entrance (default 0.8 s).
- An unknown option, a missing component file or a missing source throws an error that says which.

### Stage options

```js
new UF.Stage({
  title: 'EP02 · TITLE',  // scene panel heading
  slug: 'ep02',           // export filename prefix
  scenes: [ ... ],
  gap: 1,                 // black between scenes (s)
  lead: 0.6, tail: 1,     // black before the first / after the last scene (s)
  fadeIn: 0.35, fadeOut: 0.35,
  pushIn: 0.03,           // default slow zoom per scene
  grain: 0.065, vignette: 0.5,
  fps: 60,
});
```

## Component reference

Every component also accepts `at`, `out`, `fadeIn`, `fadeOut`. Defaults are shown. Colours are theme names (`'red'`, `'amber'`, `'blue'`, `'green'`, `'paper'`, `'dim'`, `'graphite'`) or any CSS colour. Open `gallery.html` or the EP01 file to see each one moving.

### Backgrounds and overlays — `uf-overlays.js`

```js
new UF.Background({ style: 'void', dust: true, dustCount: 70, seed: 3 })
// style: 'void' (dark blue radial) | 'grid' (blueprint grid) | 'desk' (warm brushed surface)

new UF.Heading({ kicker: '', title: '', x: 96, y: 96, align: 'left', size: 64, maxWidth: 1100 })
// Small red kicker line above a large title. Either may be empty.

new UF.SourceTag({ text: '', label: 'SOURCE', x: 96, y: 1010, align: 'left', backing: false })
// "SOURCE  Reuters, 2016" in the corner. Use on every factual graphic. label: 'NOTE' for a remark
// such as 'Illustrative figures'. backing: true adds a dark plate, for scenes where paper or cards
// pass underneath (documents, boards).

new UF.TitleCard({ kicker: '', title: '', sub: '', x: 960, y: 540, size: 120 })
// Chapter card: kicker, big title, red rule, sub line.

new UF.LowerThird({ name: '', role: '', style: 'bar', status: null, statusNote: '', x: 96, y: 890, align: 'left' })
// style: 'bar' (panel with red edge) | 'minimal' (no panel, for busy footage) | 'tag' (compact box).
// status: legal status badge under the name (see Legal status). statusNote: short line beside it,
// e.g. 'Denies the charges'. align: 'right' anchors it at x from the right.

new UF.StatusBadge({ status: 'charged', note: '', x: 96, y: 96, align: 'left', size: 18 })
// The legal status pill on its own, for a person already named on screen.

new UF.Caption({ style: 'subtitle', text: '', speaker: '', note: '', x: 960, y: 960, maxWidth: 1400, size: 40,
                 lines: [{ at: 1, text: '', speaker: '', out }] })
// style: 'subtitle' (boxed lines, speaker pill) | 'quote' (serif, in quotation marks, "— SPEAKER").
// Each line stays until the next starts (or its own out). One line: pass text and speaker instead.
// Lines wrap evenly, so a last line never holds one word. note: e.g. 'Translated from Spanish'.
// A quote states something someone said, so it needs a source like any other fact.

new UF.DramaLabel({ text: 'DRAMATISATION', corner: 'br', margin: 56 })
// corner: 'tl' | 'tr' | 'bl' | 'br'

new UF.Disclaimer({ title: 'PLEASE NOTE', text: '', x: 960, y: 540, width: 1100 })

new UF.Stamp({ text: 'FAKE', x: 960, y: 540, size: 120, angle: -12, color: 'red', kick: true })
// Slams in at `at` with a camera hit. fadeIn defaults to 0.

new UF.Counter({ value: 0, from: 0, prefix: '$', suffix: '', cents: false, dur: 2.4,
                 x: 960, y: 540, size: 150, label: '', strike: null, easing: 'outExpo', kick: true })
// Counts from `from` to `value` starting at `at`. strike: time to draw a red line through it.

new UF.DataPanel({ x: 1300, y: 300, w: 520, title: '', rowH: 64, count: 0.9,
  rows: [{ at, label, value, money: false, compact: true, decimals, dur, color, labelColor, size: 26, strike }] })
// Ledger-style panel. value may be a number (counts up over `count` s) or text such as '30 orders'.
// money: true formats as $81M (compact: false gives $81,000,000). strike: time to cross the value out.
```

### Legal status

`LowerThird`, `StatusBadge`, `PhotoWall` and `Thumbnail` take a `status`. Use the key; the badge spells out what it means.

| Key | Badge | Key | Badge |
|---|---|---|---|
| `alleged` | ALLEGED · NOT PROVEN | `acquitted` | ACQUITTED |
| `suspect` | SUSPECT · NOT CHARGED | `cleared` | CLEARED |
| `arrested` | ARRESTED · NOT CHARGED | `not-charged` | NOT CHARGED |
| `charged` | CHARGED · NOT CONVICTED | `witness` | WITNESS |
| `on-trial` | ON TRIAL · NOT CONVICTED | `victim` | VICTIM |
| `wanted` | WANTED · NOT CONVICTED | `official` | OFFICIAL |
| `convicted` | CONVICTED | `deceased` | DECEASED |

For anything else pass `{ text: 'EXTRADITED', color: 'amber' }`. An unknown key throws an error listing the valid ones. Amber means unproven, red convicted, green cleared, blue not accused.

### World map — `uf-worldmap.js`

```js
new UF.WorldMap({
  span: 252,                         // degrees of longitude across the frame at zoom 1
  camera: [{ t: 0, center: [16, 14], zoom: 1 },
           { t: 6, center: 'MANILA', zoom: 2.4, dur: 1.6, ease: 'inOutCubic' }],
  reveal: { at: 0, dur: 1.4 },       // scan-line sweep that draws the map in
  graticule: true, step: 10, dotSize: 2.35, seed: 37,
  pins: [{ place: 'DHAKA', label: 'DHAKA', sub: 'Bangladesh Bank', at: 0.8, out,
           side: 'right', lead, icon: 'bank', color, size, pulse }],
  arcs: [{ from: 'DHAKA', to: 'NEW YORK', at: 1.5, dur: 1.4, lift: 0.3,
           label: '$101M', labelAt: 0.5, labelOffset: [0, -30], labelOut, labelSize: 20,
           color: 'red', width, dashed: false, flow: true, speed, endRing: true, out, strikeLabel: true,
           stop: { at: 9, label: 'STOPPED', sub: '', pos: 0.93, labelOffset: [0, 46], kick: true } }],
})
```

- Places are names from the list below or `[lon, lat]`. An unknown name throws an error that tells you so.
- Pin `side`: `'right' | 'left' | 'top' | 'bottom' | 'tr' | 'tl' | 'br' | 'bl'`.
- Arc `labelAt` and `stop.pos` are positions along the arc, 0 to 1. `labelOut` is a scene time to hide the label (handy before a camera move).
- A stopped arc turns grey and gets a red X.
- More map detail fades in as you zoom past 1.45 and 2.6.

Built-in places: NEW YORK, WASHINGTON, LOS ANGELES, MIAMI, TORONTO, MEXICO CITY, PANAMA CITY, CAYMAN ISLANDS, SAO PAULO, LONDON, DUBLIN, PARIS, ZURICH, GENEVA, FRANKFURT, BRUSSELS, AMSTERDAM, LUXEMBOURG, MONACO, MOSCOW, ISTANBUL, CYPRUS, LAGOS, NAIROBI, JOHANNESBURG, DUBAI, KARACHI, MUMBAI, NEW DELHI, BENGALURU, KOLKATA, DHAKA, COLOMBO, KATHMANDU, BANGKOK, KUALA LUMPUR, SINGAPORE, JAKARTA, HANOI, HONG KONG, MACAU, MANILA, TAIPEI, SHANGHAI, BEIJING, PYONGYANG, SEOUL, TOKYO, SYDNEY, MELBOURNE, AUCKLAND. Add more to `UF.geo.CITIES` in `core/uf-geo.js`.

### Clocks and calendar — `uf-clocks.js`

```js
new UF.WorldClocks({
  x: 960, y: 300, radius: 116, gap: 520, spinAt: 1, spinDur: 2.2, stagger: 0.15, digital: true,
  clocks: [{ city: 'DHAKA', zone: 'UTC+6', from: 'THU 09:56', time: 'THU 20:36',
             times: [{ value: 'FRI 10:30', at: 12, dur: 1.5 }],     // optional later jumps
             notes: [{ at: 7, out, text: 'GOING HOME', color: 'red' }] }],
  focus: [{ at: 11, dur: 3.5, index: 0 }],   // brighten one clock, dim the others
})
// Times are 'DDD HH:MM' or 'HH:MM'. Clocks spin from `from` to `time` at spinAt.
// The face tints amber in daylight and shows a sun or moon.

new UF.CalendarStrip({
  x: 160, y: 610, labelW: 250, cellW: 272, rowH: 84, headH: 60, gapY: 8, month: '',
  days: ['THU 4', 'FRI 5', 'SAT 6'], rows: ['DHAKA', 'NEW YORK'],
  marks:   [{ row: 0, from: 1, to: 3, at: 11, label: 'WEEKEND', color, size, kick: true }],  // to is exclusive
  markers: [{ row: 0, pos: 0.86, at: 7.5, out, label: '20:36', color }],                   // fractional column
  columns: [{ col: 0, at: 6, out, color, label: 'THE NIGHT' }],
  merge:   { at: 24, from: 0.86, to: 5, row, label: '≈ 5 DAYS', size, sub: '' },
})
// merge: all marks slide into one glowing bar spanning from..to columns.
```

### Money flow — `uf-flow.js`

```js
new UF.FlowChart({
  nodeW: 300, nodeH: 110, color: 'red', particleColor: 'amber',
  nodes: [{ id: 'a', x: 250, y: 380, w, h, title: 'ACCOUNT 1', sub: 'USD account', icon: 'user', at: 0.8,
            value: 6e6, prefix: '$', decimals, valueAt, valueDur, valueSize, valueColor,
            iconColor, accent, titleSize,
            tag: { text: 'CASH', color: 'amber', textColor, at: 9.5, kick: true },
            swap: { from: 'USD', to: 'PHP', at: 5.6 } }],
  edges: [{ from: 'a', to: 'b', at: 2.2, dur: 1, weight: 6, color, particles, particleColor, speed,
            label, labelAt }],
})
// x, y are node centres. weight is stroke width, so use it for relative amounts.
```

### Statement card — `uf-quote.js`

```js
new UF.QuoteCard({
  quote: '', highlight: '', attribution: '', header: '', headerRight: '',
  x: 960, y: 520, w: 1420, h: 600, angle: -1.1, textWidth: null,
  typeAt: 1.2, cps: 20, size: 54, lineH: 76, style: 'paper', seed: 21, tape: true,
})
// Typed at cps characters per second from typeAt. highlight: a substring of quote to mark.
// style: 'paper' (marker highlight) | 'dark' (red underline). If the last line has one word, widen w.
```

### Code patch — `uf-code.js`

```js
new UF.HexPatch({
  title: 'SWIFT software', check: 'SECURITY CHECK', tag: 'ILLUSTRATION',
  from: ['75', '04'], to: ['90', '90'],
  before: ['8B', '45', 'F8', '85', 'C0'], after: ['33', 'C0', 'EB', '05'],
  fromLabel: 'Conditional jump', toLabel: 'Do nothing', fromAsm: '', toAsm: '',
  rows: 10, target: { row: 5, col: 7 }, base: 0x00412A40, seed: 77,
  zoomAt: 3, highlightAt: 5.6, pushAt: 6.4, pushDur: 1.8, push: 1.3, morphAt: 10.5, captionAt: 11.6,
})
// Padlock block -> memory dump -> target bytes highlighted -> camera push -> bytes morph -> captions.
// Surrounding bytes are random filler, so keep the ILLUSTRATION tag.
```

### Timeline — `uf-timeline.js`

```js
new UF.Timeline({ x0: 180, x1: 1740, y: 600, lineDur: 0.9, textWidth: 300,
  events: [{ at: 1, pos: 0.02, date: 'FRI 5 FEB', time: '10:30', text: 'Printer tray found empty',
             color, side: 'up', kick: true }] })
// pos: 0..1 along the line. side alternates up/down automatically if omitted.

new UF.TimeChip({ x: 96, y: 96, align: 'left',
  items: [{ at: 0.3, time: '10:30', date: 'FRIDAY 5 FEB', place: 'DHAKA' }] })
// Corner clock; digits scramble to each new item at its `at`.
```

### Recreated email — `uf-document.js`

```js
new UF.EmailCard({
  from: '', fromAddr: '', to: '', subject: '', date: '', body: '', link: '',
  label: 'RECREATION', note: '', app: 'INBOX',
  x: 960, y: 540, w: 1240, h: 700, typeAt: 1.4, cps: 45, clickAt: null,
})
// body uses \n for new lines and types in at cps. clickAt: a pointer moves to the link and clicks.
// Lower h for short emails (560 suits four lines). note: small source line under the card.
```

### Network spread — `uf-network.js`

```js
new UF.NetworkSpread({
  cols: 9, rows: 5, x0: 260, x1: 1660, y0: 290, y1: 830, jitter: 0.32, nodeSize: 46, seed: 15,
  start: [0, 4], startLabel: '',
  target: { col: 8, row: 0, label: 'TARGET', icon: 'server' },
  infectAt: 2, hop: 0.5,                                        // seconds per hop
  wait: { label: 'WAITING', from: 0, to: 12, unit: 'MONTHS', dur: 2.8 },   // optional
})
// Infection spreads hop by hop from start; the path to the target lights up.
// With wait, the scene freezes behind a panel counting up to `to`.
```

### Evidence board — `uf-board.js`

```js
new UF.EvidenceBoard({
  surface: 'cork', light: true, stringColor: 'red', seed: 9,
  cards: [{ id: 'order', kind: 'doc', x: 1250, y: 330, at: 2, out,
            title: 'Payment order', sub: 'MT103 · FEB 2016', text: '',
            w, h, angle, tone, pin: 'red', kick: true,
            stamp: { text: 'FRAUDULENT', at: 11, color: 'red', angle: -14, kick: true },
            mark: { at: 10, color: 'red' } }],
  strings: [{ from: 'order', to: 'sum', at: 6, dur: 0.9, out, color, sag: 0.12, label: '5 PAID', labelAt }],
  camera: [{ t: 0, center: [960, 540], zoom: 1 },
           { t: 8.6, center: 'order', zoom: 1.4, dur: 1.6, ease: 'inOutCubic' }],
  focus: [{ at: 9.2, dur: 3, ids: ['order', 'lanka'] }],
})
```

- Board coordinates equal screen coordinates at zoom 1. Card `x`, `y` are centres. A camera `center` is `[x, y]` or a card id.
- Card `kind`:
  - `'photo'`: an instant photo showing `image` (see Using real photos), else `initials`, else `icon` (default `'user'`). `imageY` (default 0.3) picks the vertical crop. `mono: false` keeps the colour; photos are greyscale by default.
  - `'note'` (the default): an index card. `text` types in line by line after the card lands; four lines fit at the default size.
  - `'doc'`: a document page. The title is printed in capitals. `text` prints as body copy; without it, grey placeholder lines show.
  - `'tag'`: a dark label for an amount or a name. It sizes itself to `title` and `sub`. `titleSize` defaults to 44 and `color` (the border) to `'red'`.
- Default sizes are photo 230×290, note 300×210 and doc 250×320; override them with `w` and `h`. Each card gets a small random tilt from `seed` unless you give it an `angle`.
- Titles shrink to fit their card and are cut with an ellipsis only below the smallest size.
- Cards drop onto the board at `at`, and a pin pushes in. A string runs pin to pin and fades out with either of its cards. Its `label` sits as near the middle as it can while staying clear of every card and of the labels of earlier strings. `labelAt` (0 to 1) forces the position.
- `stamp` slams onto the card. `mark` circles the card in red.
- `focus` darkens the board and keeps only the listed cards and their strings lit.
- `?key` drops the cork, the spotlight and the focus veil, leaving only cards and string.
- Card ids must be unique. An unknown id in a string, camera or focus throws an error that names it.
- Zoom stays sharp up to 3 (1.5 at `?scale=2`).

### Charts — `uf-chart.js`

Both charts fill the box `x, y, w, h`, axis labels included. `format` decides how numbers print:

| Format | Output |
|---|---|
| `'number'` (default) | 1,234,567 |
| `'money'` | $81M, $1.5B, $500 |
| `'compact'` | 81M, 1.5B |
| `'percent'` | 12.5% |
| a function | whatever `v => string` returns |

`decimals` fixes the number of decimals; otherwise they are chosen automatically. An unknown format throws an error.

```js
new UF.LineChart({
  x: 160, y: 190, w: 1600, h: 720,
  yFormat: 'number', decimals: null, yLabel: '',
  yMin, yMax, yStep, yTicks,                  // optional: override the automatic y axis
  xMin, xMax, xTicks, xFormat: v => String(v),
  grid: true, axisDur: 0.9, headValue: true, endLabel: true,
  series: [{ label: 'ACTUAL CASH', color: 'red', points: [[2002, 1e9], [2008, 0.3e9]],
             at, dur: 2.5, area: false, dashed: false, width: 4, dots: true, display, kick: true }],
  markers: [{ x: 2008, at: 7, label: 'COLLAPSE', color: 'amber', series: 1, kick: true }],
})
```

- Each series draws left to right from `at` (default: the chart's `at` + 0.6) over `dur`. While it draws, a pill at the head shows the current value (`headValue`).
- When a series finishes, its final value and `label` appear beside the last point (`endLabel`). `display` replaces the value text. End labels push apart so they never overlap.
- `area: true` shades under the line. A series needs at least two points.
- The y axis starts at 0 (or the lowest value, if that is negative) and gets round-number ticks. The x ticks are every distinct x when there are 12 or fewer, otherwise about 8 round ticks.
- A marker is a dashed vertical line at `x`. With `series` (an index), it also rings that line at `x`.

```js
new UF.BarChart({
  x: 160, y: 190, w: 1600, h: 720,
  orientation: 'vertical', format: 'number', decimals: null,
  max: null, sort: false, stagger: 0.25, dur: 1.1, gap: 0.38, color: 'blue', labelW: 380,
  bars: [{ label: 'SENT TO PHILIPPINES', value: 81e6, sub: '', color, at, display: '',
           highlight: { at: 6.5, color: 'red', label: 'TRACED TO CASINOS', kick: true } }],
})
```

- `orientation: 'horizontal'` puts labels on the left in a column `labelW` wide. That suits rankings and long names.
- Bars grow one after another, `stagger` seconds apart, and the value counts up with each bar. `display` replaces the final text, for example `'≈ $30M'`.
- `sort`: `'desc'` or `'asc'` reorders the bars; `false` keeps your order.
- `max` is the value of a full-length bar. By default it is the largest bar; set it to compare several charts on the same scale.
- `highlight` turns that bar red, dims the others and shows its `label`.
- Values must be 0 or more. In horizontal mode, the bars leave room so the longest bar's value and highlight label stay inside the box.

`UF.chart.compact(81e6, '$')` gives `'$81M'`, which is handy in one-off layers.

### Document reveal — `uf-reveal.js`

```js
new UF.DocumentReveal({
  docket: 'Case 1:00-cv-00000  Document 1  Filed 01/01/00  Page 4 of 31',
  header: ['IN THE DISTRICT COURT', 'FOR THE EXAMPLE DISTRICT'],
  title: 'COMPLAINT', body: ['First paragraph…', 'Second paragraph…'], footer: '', numbered: false,
  font: 'serif', size: 23, image: null,                    // image: a scanned page instead of typeset text
  x: 960, y: 620, w: 820, h: null, angle: -0.6, seed: 17, tone: null,
  highlights: [{ find: '12 payment orders', at: 3, dur: 0.7, color }],
  redactions: [{ find: 'John Doe 7', at: 9.6, dur: 0.6, on: false, kick: true }],
  marks:      [{ find: 'Three orders', at: 7, dur: 0.7, color: 'red' }],
  camera: [{ t: 0, center: [960, 540], zoom: 1 },
           { t: 2.2, find: '12 payment orders', zoom: 1.9, dur: 1.6, ease: 'inOutCubic' }],
  label: 'RECREATION', labelCorner: 'tr',
})
```

- Effects and camera frames find their text with `find` (exact words; `nth: 1` picks the second occurrence) or with `rect: [x, y, w, h]` in page pixels from the page's top-left. A scanned `image` has no searchable text, so use `rect` there.
- A redaction bar covers its words and slides off at `at`. With `on: true` it slides on instead. Without `at` it stays for the whole scene.
- A mark circles each printed line of the phrase in turn. A highlight sweeps across it like a marker.
- The page is A4 (`h` = `w` × 1.414), so by default it runs off the bottom of the frame like a real filing. Lower `h` or `y` to show the whole page.
- Text that is not on the page, or that falls below its bottom edge, throws an error naming it.
- A typeset page is a recreation and carries a RECREATION label unless you pass `image`. The page stays sharp up to zoom 3.

### Bank statement — `uf-ledger.js`

```js
new UF.Ledger({
  bank: 'EXAMPLE NATIONAL BANK', holder: 'ACME TRADING LTD', account: '•••• 4471', period: 'FEB 2016',
  currency: '$', decimals: 2, opening: 0, showOpening: true, closingLabel: 'CLOSING BALANCE',
  rows: [{ date: '04 FEB', text: 'INWARD SWIFT', credit: 20e6 },
         { date: '05 FEB', text: 'CASH WITHDRAWAL', debit: 5e6, flag: 'SAME DAY' },
         { date: '08 FEB', text: 'TRANSFER', debit: 19000, flag: { text: 'UNDER REVIEW', color: 'amber', at } },
         { date: '09 FEB', text: 'PAYMENT ORDER', debit: 6e6, erase: { at: 9.5, label: 'DELETED' } },
         { date: '10 FEB', text: 'ACCOUNT FROZEN' }],
  visible: 7, rowStep: 0.55, startAt: null, style: 'dark', seed: 5,
  x: 960, y: 550, w: 1400, rowH: 60, label: 'RECREATION', note: '',
})
```

- Rows slide in one by one, `rowStep` seconds apart from `startAt` (default `at` + 1), or at their own `at`. The balance counts to each new value.
- A row has `debit` or `credit` (never both), or neither for a memo line. `balance` restarts the running total from the figure the real statement prints.
- Once more than `visible` rows have arrived, the table scrolls.
- `erase: 9.5` (or `{ at, label }`) wipes a row at that time: a red sweep clears it, a `DELETED` pill flashes, the row collapses, and every later balance and the closing figure recount as if the row never existed. Earlier rows slide back down into the space, so give the table more rows than `visible` if it should still look full afterwards.
- `style: 'paper'` draws a printed statement for the desk background.
- `note` prints under the table and counts as the source for the editorial check.

### Fact card — `uf-factcard.js`

```js
new UF.FactCard({
  kicker: '', date: '', text: '', highlight: '', quote: false, note: '',
  figure: { value: 98, from: 0, prefix: '', suffix: '', decimals: 0, label: '', color, size: 150, dur: 1.6 },
  person: '', status: null, statusNote: '', source: '', sourceLabel: 'SOURCE',
  x: 960, y: 540, w: 1320, size: 52, dateSize: 92, style: 'dark', accent: 'red', highlightColor: 'amber',
  dateAt, textAt, lineStep: 0.22, highlightAt, figureAt, statusAt, sourceAt, seed: 13,
})
```

- The date drops in, the statement rises line by line, then `highlight` (a phrase from `text`) is marked. The card's height follows its content. Every beat time defaults from `at`; set one only to line it up with the voiceover.
- Lines come out evenly filled. A highlight up to 60% of the line width never splits across lines.
- `quote: true` sets the text as a quoted headline in italics. `figure` adds a large counter under the text.
- `person` (the card is about a named individual) requires a `status`: a key from Legal status, or `{ text, color }` for wording the list lacks. `statusNote` sits beside the badge.
- `source` prints in the card's own footer and counts for the editorial check. `style: 'paper'` suits the desk background.

### Calendar flip — `uf-calendar.js`

```js
new UF.CalendarFlip({
  from: 'FEB 2016', to: 'JAN 2015', flipAt, flipDur, easing: 'inOutSine',
  x: 960, y: 550, w: 780, h: 560, header: '', kicker: '', caption: '', captionAt, accent: 'red', seed: 31,
})
```

- `'MMM YYYY'` (or the full month name) flips month by month; `'YYYY'` flips year by year. Either direction works, up to 240 pages.
- The flip is slow at both ends and fast in the middle, and lands with a hit. `flipAt` defaults to `at` + 1 and `flipDur` grows with the page count (0.8–3.2 s).
- `kicker` types above the calendar, `header` sits in its red band, and `caption` lands under it 0.3 s after the last page unless `captionAt` says otherwise.

### Side-by-side match — `uf-compare.js`

```js
new UF.Compare({
  left:  { label: 'PAYMENT ADDRESS', title: 'JUPITER ST', sub: 'RCBC branch · Makati', sign: true, at },
  right: { label: 'US SANCTIONS LIST', title: 'JUPITER', sub: 'Oil tanker · Iran', icon: 'ship', at },
  link: { at: 4.6, label: 'MATCH', color, kick: true },
  overlay: { at: 10, text: 'LAZARUS', sub: '' },
  x: 960, y: 580, w: 1700, h: 640, gap: 180, titleSize: 120, codeSize: 21,
  label: '', color: 'red', matchColor: 'amber',
})
```

- Each side has a `title` (a word, drawn as a street sign with `sign: true` or under an icon with `icon`) or `code` (an array of source lines), never both. Both sides must be the same kind. Sides arrive at their own `at`, default `at` and `at` + 0.5.
- For code, `match: [first, last]` (0-based, inclusive) or a list of ranges marks the matching lines. The two sides pair their ranges in order, and the link draws a ribbon between each pair.
- `link` lands the verdict between the panels. `overlay` stamps a word across the whole frame afterwards and dims the panels under it.
- Code on screen is illustrative unless it is the real listing, so a code compare needs `label: 'ILLUSTRATION'`.

### Night map — `uf-nightmap.js`

```js
new UF.NightMap({
  center: [127.5, 38.3], span: 11,
  lights:   [{ place: 'SEOUL', weight: 1.6, spread: 0.22, count: 170 }],
  scatter:  [{ area: [lon, lat, lon, lat, ...], count: 900, weight: 0.25 }],
  borders:  [{ points: [lon, lat, ...], at: 4, dur, dashed: true, color, alpha, width }],
  outlines: [{ points: [lon, lat, ...], at: 6, dur, out, color: 'blue', fill }],
  labels:   [{ text: 'SOUTH KOREA', place: [128.2, 36.3], at: 3.5, out, color, size: 28, sub, align, dot, offset: [dx, dy] }],
  landAt, lightsAt, lightsDur: 2.6, color: '#ffc46b', land: '#0d1116', coast: null,
  label: 'ILLUSTRATION', seed: 17,
})
```

- Land fades up at `landAt`, then the lights switch on in waves over `lightsDur` seconds. `span` is the degrees of latitude from the top of the frame to the bottom.
- `lights` are glowing clusters around a city name or `[lon, lat]`; `scatter` sprinkles faint lights over a polygon. Lights only land on land.
- The lights are drawn, not photographed, so keep the `ILLUSTRATION` label and add a `SourceTag` crediting the imagery the picture is based on.

### End screen — `uf-endscreen.js`

```js
new UF.EndScreen({
  channel: 'UNFICTION', tagline: 'Real Scams. Real Crimes. Untold Stories.', kicker: '',
  video: { kicker: 'NEXT EPISODE', title: 'COMING SOON' }, subscribe: { label: 'SUBSCRIBE' },
  videoRect: [140, 420, 896, 504], subCenter: [1490, 672], subRadius: 160,
  titleX: 140, titleY: 250, titleSize: 150, accent: 'red', guides: false,
})
```

- The last 5–20 seconds of a video. The framed video slot and the subscribe circle are where YouTube's end-screen elements go; their text only shows where no element is placed.
- `guides: true` draws dashed boxes with their pixel sizes, for lining the elements up in YouTube Studio. Record without it.

### Messages — `uf-chat.js`

```js
new UF.ChatThread({
  contact: 'Unknown number', sub: '+44 •••• 0192', initials: null, avatar: null, clock: '9:41',
  messages: [{ divider: 'TODAY' },
             { from: 'them', text: 'Your parcel could not be delivered.', time: '10:02', typing: 1.0 },
             { from: 'me', text: 'What parcel?', time: '10:03', read: true, mark: 7 }],
  gap: 0.8, typing: 1.0, cps: 24,
  x: 960, y: 546, w: 470, h: 960, size: 23, label: 'RECREATION', labelCorner: null, note: '',
})
```

- Messages without `at` follow each other. Incoming ones show typing dots for `typing` seconds. Outgoing ones are typed into the input bar at `cps` characters a second (at most 2.5 s). `gap` separates one message from the next.
- `mark: 7` singles that message out at 7 s: the others dim and a red outline traces round it until the next message starts.
- `avatar` is an embedded image name. Without it, `initials` (worked out from `contact`) fill the circle.
- The label goes in the top corner away from the phone and the `note` in the bottom corner on the same side.

### Phone call — `uf-phone.js`

```js
new UF.PhoneCall({
  name: 'Unknown caller', number: '+00 •••• 1180', place: 'Overseas', date: 'Friday',
  initials: null, avatar: null, clock: '9:41',
  ringAt: 0.8, answerAt: 3.2, endAt: 12, callLength: 252,
  transcript: [{ at: 4.2, speaker: 'Caller', text: 'The money has arrived.' }], cps: 38,
  x: null, y: 546, w: 440, h: 900, label: 'RECREATION', labelCorner: null, note: '',
})
```

- The phone rings at `ringAt` (default `at` + 0.6), is answered at `answerAt` and hangs up at `endAt`. Leave `answerAt` out for a missed call.
- `callLength` is the real length in seconds, shown on the timer and spread across `answerAt`…`endAt`, so a four-minute call can play out in eight seconds.
- With a `transcript`, the phone moves left (`x` defaults to 29% of the width) and the lines type out beside it, each speaker in their own colour. The waveform follows whoever is talking.

### Route map — `uf-route.js`

`RouteMap` is a `WorldMap`, so load `uf-worldmap.js` first. It accepts every WorldMap option as well.

```js
new UF.RouteMap({
  stops: [{ place: 'LONDON', date: 'DAY 1', sub: 'Departs', icon: 'jet' },
          { place: 'SINGAPORE', date: 'DAY 2', sub: 'Meets courier', side: 'left', legLabel: '$2.4M' },
          { place: 'MANILA', date: 'DAY 4', sub: 'Cash withdrawn', icon: 'cash', hold: 2 }],
  travel: 1.6, hold: 1.4, startAt: null, zoom: 2.2, minZoom: 0.8,
  follow: true, overview: true, color: 'amber', dashed: true, lift: 0.22,
  vehicle: null, chip: 'tl', pinDates: false,
})
```

- Stop keys: `place`, `label`, `sub`, `date`, `at`, `travel`, `hold`, `side`, `icon`, `lift`, `color`, `legLabel`.
- Stops without `at` follow each other: `hold` seconds at a stop, then `travel` seconds to the next. Both can be set per stop.
- The camera starts on the whole route, pushes in to the first stop, follows each leg (pulling out when both ends don't fit at `zoom`) and ends on the whole route again. `overview: false` skips the last step, and `follow: false` hands the camera back to you.
- `vehicle` is an icon name (`'jet'`, `'cash'`…) that travels along each leg. The date chip sits in the `chip` corner, or nowhere with `chip: false`. `pinDates: true` also prints each date on its pin.
- A stop's label sits on the side away from the arriving line unless `side` says otherwise. An unknown place or icon throws an error.

### Photo wall — `uf-wall.js`

```js
new UF.PhotoWall({
  title: 'ACCOUNT HOLDERS · 8',
  tiles: [{ id: 'a', name: 'Person A', sub: 'Account opener', image: 'person-a' },
          { id: 'b', name: 'Person B', sub: 'Branch manager', status: 'charged', note: 'Denies wrongdoing' }],
  focus: 'b', cols: null, dimAt: null, dimStep: 0.09, focusAt: null,
  x: 960, y: 564, w: 1580, h: 780, gap: 16, seed: 9, label: '', labelCorner: 'tr',
})
```

- Tiles assemble into the best-fitting grid (`cols` forces a column count). Photos are black and white and cropped towards the top. A tile without `image` shows a silhouette.
- With `focus`, the other tiles dim one by one from `dimAt`, then the focus tile steps forward at `focusAt` with its name, role, status badge and `note`.
- The focus tile must have a `status`: a face singled out on screen must say where that person stands legally.

### Thumbnail — `uf-thumbnail.js`

```js
new UF.Thumbnail({
  kicker: 'BANGLADESH BANK · 2016', headline: 'ONE WORD STOPPED $850 MILLION', highlight: 'ONE WORD',
  image: null, person: null, status: null, stamp: null,
  background: 'grid', accent: 'red', side: 'left', label: '', mono: false,
})
```

- The headline is set as large as fits in three lines. `highlight` (a phrase in the headline) gets a box in the `accent` colour and never breaks across lines. A headline too long to read at thumbnail size throws an error.
- `side` is where the text goes: `'left'` or `'right'` (the image takes the other half) or `'center'` (no image).
- `background`: `'grid'`, `'void'`, `'desk'` or an embedded image name (darkened). `mono: true` makes the subject image black and white.
- `person` defaults to true when there is an `image`. Leave it so for a real person, and give their `status`. Set `person: false` only for an illustration, and add `label: 'ILLUSTRATION'`.
- A `stamp` sits low on the image side, off the face. Without an image it sits on the right.
- See Thumbnails for saving them.

### Character — `uf-character.js`

The channel's recurring faceless figure, for dramatised scenes instead of Blender. One jointed rig drawn flat under a soft key light. A role picks the clothes, a pose sets the body, timed actions move it. Load `uf-props.js` too: anything a character holds is drawn by it.

```js
new UF.Character({
  role: 'main', x: 300, y: 900, scale: 2.6, view: 'side', facing: 1, start: 'stand',
  build: 'average', skin: 'mannequin', hold: null, holdFar: null, seat: 47,
  actions: [
    { at: 0.5, to: 1100 },                                         // walk there, facing that way, then stand
    { at: 3.6, pose: 'reach', target: atm.point('slot'), hold: 'card' },
    { at: 5.0, facing: -1 },                                       // turn round
    { at: 5.6, view: 'front', pose: 'shrug' },                     // turn to camera
  ],
})
```

- **Units.** The body is built in centimetres for a 175 cm figure; `scale` is pixels per centimetre (2.6 puts a standing figure at about 455 px). `y` is the floor line, `x` the hips. `height` changes the figure's size; `build` is `slim`, `average` or `heavy`.
- **Roles:** `main` (the narrator figure, red collar), `mule` (short sleeves, backpack), `handler`, `staff` (light shirt, lanyard), `police` (khaki, peaked cap, belt), `hacker` (hood, dark face), `suit` (shirt and tie), `civilian` (long hair). Override any part with `look: { top, bottom, shoes, hair, hairColor, collar, shirt, tie, lanyard, belt, hat, sleeves: 'short', tuck: true }`; `backpack: true` or a colour adds one. Hair: `short`, `crop`, `long`, `bun`, `bald`, `cap`, `peak`, `hood`. `skin`: `mannequin` (default, keeps the figure anonymous), `light`, `medium`, `brown`, `dark` or a `#rrggbb`.
- **Views.** `side` is the main view. `front` and `back` have their own pose list. A change of `view` or `facing` plays a quick turn (`turnDur`).
- **Side poses:** `stand`, `wait`, `reach`, `type`, `handOver`, `receive`, `point`, `pocket`, `lookDown`, `lookUp`, `phone`, `carry`, `shrug`, `think`, `talk`, `count`, `handsUp`, and seated `sit`, `sitType`, `sitLaptop`, `sitLean`, `sitPhone`, `sitThink`. **Front/back poses:** `stand`, `wait`, `crossed`, `hips`, `phone`, `think`, `shrug`, `point`, `talk`, `handsUp`, `reach`, `type`, `lookDown`, `sit`, `sitType`. Both views also take `walk` and `run`. `UF.Character.poses` lists them.
- **Actions** run in time order: `{ at, pose, to, dur, then, facing, view, hold, holdFar, target, targetFar, blend, seat, zoom }`.
  - `to: x` or `to: [x, y]` walks there (`pose: 'run'` runs), turning to face the way it goes, and settles into `then` (default `stand`) on arrival. Without `dur` it walks at 1.3 m/s and runs at 3.8 m/s. `zoom` changes size on the way, for walking towards or away from camera.
  - `target: [x, y]` puts the near hand on a screen point, usually a prop's `point()`. Out of reach in side view, the figure bends forward from the hips. `targetFar` does the far hand.
  - `hold` / `holdFar` put a prop in the near / far hand: a type name (`'card'`, `'phone'`, `'bag'`, `'envelope'`, ...) or `{ type: 'cash', style: 'fan' }`. `hold: null` empties the hand. The swap happens halfway through the blend.
  - An action that only changes what is held keeps the current pose and target. Poses blend over `blend` seconds (0.35).
- **Seated.** Put a chair down and sit the figure on it: `x: chair.point('seat')[0]` and the same `y`. Use `seat: 45` for the plastic chair, 47 for the office one. The knees bend so the feet reach the floor.
- **Depth.** Draw order is the layer order: a character listed before a table stands behind it.
- `silhouette: true` draws a dark figure with a `rim` light; `dim` (0..1) darkens it for background figures; `light: 'right'` moves the key light. Drawing is a pure function of time, so scrubbing and `?frame=` are exact.
- It is always an illustration: the scene needs a `DramaLabel` (or `label: 'ILLUSTRATION'`), and the editorial check warns without one.

### Props — `uf-props.js`

```js
const atm = new UF.Prop({ type: 'atm', x: 1210, y: 960, scale: 3,
  screens: [{ at: 2, screen: 'pin' }, { at: 4, screen: 'wait' }, { at: 5.4, screen: 'approved', kick: { flash: 0.12 } }],
  card: { in: 1.5, out: 5.7, taken: 6.5 }, typing: { at: 2.3, dur: 1.4 }, dispense: [{ at: 7, take: 8.4 }] });
atm.point('slot');   // [x, y] on screen, for a character's target
```

- Drawn in centimetres like the character, so a prop and a figure at the same `scale` match in size. Floor and desk items stand on `y` (bottom centre); wall and hand items sit on their centre; `ceilingFan` hangs from `y`. Common options: `scale` (2.6), `size` (multiplier), `flip` (mirror; text stays readable), `rotate`, `dim`, `at`, `out`.
- `point(name)` gives a named point in screen pixels: `atm` slot / keypad / screen / cash / receipt / top; `desk` top / left / right; `chair` seat / back; `monitor` and `laptop` screen; `deskPhone` handset; `cardWriter` slot; `ceilingFan` hub; `serverRack` top / face.
- **Bank:** `atm` (`screen` or `screens: [{ at, screen, text, sub, kick }]` with `welcome`, `pin`, `amount`, `wait`, `approved`, `declined`, `cash`, `off`; `card`, `typing`, `dispense`, `receipt` (a time), `brand`, `sign`, `glow`), `card` (`style: 'bank' | 'blank'`, `side: 'front' | 'back'`, `number`), `cardStack` (`count`), `cardWriter` (`swipes: [t, ...]`), `cash` (`style: 'note' | 'bundle' | 'fan' | 'stack'`, `count`, `cols`, `color`; generic notes, not a real currency), `receipt`.
- **Office:** `desk` (`style: 'office' | 'wood' | 'table'`, `length`, `height`), `chair` (`style: 'office' | 'plastic'`, side view, back on the left), `monitor` and `laptop` (`view: 'front' | 'back' | 'side'`, `content`, `text`, `highlight`, `glow`), `keyboard`, `deskPhone` (`ring: [{ at, dur }]`, `lifted`: a time or true), `handset`, `mobile` (`content: 'lock' | 'call' | 'otp' | 'message' | 'off'`, `text`, `glow`), `lamp` (`on`, `light`), `mug` (`steam`).
- **Screens** (`monitor`, `laptop`): `dashboard` (`text` sets the green tile, default `ABNORMAL: 0`), `list` (`highlight` a row in red), `code`, `alert` (`text`), `email`, `text`, `blank`, `off`, or a function `(ctx, x, y, w, h, t)` in cm. `UF.props.screen` draws the same screens anywhere.
- **Bags and paper:** `backpack`, `duffel` (`open: true` shows cash inside), `envelope` (`side`, `seal`), `document` (A4: `title`, `lines`, `redact: [row, ...]`, `stamp`), `paperStack` (`count`, `title`), `notice` (`title`, `text` with `\n`, `band`).
- **Rooms and story:** `wallClock` (`time: 'HH:MM'` or `spin: { from, to, at, dur }` for time passing), `ceilingFan` (`speed` in turns a second), `serverRack` (`label`, `alarm`: true or a time), `cctv` (`sweep`, `period`), `clapperboard` (`clap`: a time, with a camera hit; `fields: { prod, scene, take, roll, date }`), `stopwatch` (`seconds` or `run: { at, dur, from, to }`).
- **Holding:** `card`, `cardStack`, `cash`, `receipt`, `handset`, `mobile` (alias `phone`), `envelope`, `document`, `clapperboard`, `backpack`, `duffel` (alias `bag`), `mug`, `stopwatch`.
- `UF.Room({ floor, wall, ground, light, skirting, window: { x, y, w, h } })` is a plain interior (wall, floor, skirting, soft key light, optional blinded window) for character scenes.
- `examples/cast.html` shows every role, pose and prop, plus three set-ups to copy: a mule at an ATM, a bank officer at a desk, and a handler paying a mule.

## One-off visuals

When a shot needs something no component does, draw it inline with `UF.layer`. The function gets the 2D context, scene time `t`, the camera-effects object `fx`, and the scene.

```js
UF.layer((ctx, t, fx) => {
  const a = UF.ease.outCubic(UF.seg(t, 1.0, 0.5));   // 0 -> 1 between 1.0 s and 1.5 s
  if (a <= 0) return;
  ctx.globalAlpha = a;
  D.panel(ctx, 760, 380, 400, 300, { tick: 16 });
  D.icon(ctx, 'printer', 960, 510, 140);
  fx.kick(t, 1.0, { shake: 0.006, rgb: 0.5, decay: 10 });
})
```

`episode-template.html` has a complete example (email, fax and phone each crossed out).

Helpers you will use (`const D = UF.draw;`):

- **Timing:** `UF.seg(t, at, dur)` is 0 before `at`, 1 after `at + dur`, linear between. `UF.ease.<name>(x)` shapes it: `linear`, `inQuad`, `outQuad`, `inCubic`, `outCubic`, `inOutCubic`, `inExpo`, `outExpo`, `inOutExpo`, `inOutSine`, `outBack`. Also `UF.win(t, in, out, fadeIn, fadeOut)`, `UF.pulse(t, at, decay)`, `UF.lerp`, `UF.clamp`, `UF.rng(seed)`.
- **Colour:** `UF.c('red', 0.5)` gives a theme colour with alpha. `UF.mix('blue', 'amber', k)` blends two. `D.hexMix(a, b, k)` blends two and returns `#rrggbb`, so the result can be blended again; `D.shade(color, k)` lightens (k > 0) or darkens (k < 0).
- **Fonts:** `UF.font.display(px)` (Impact headlines), `mono(px, weight)`, `type()`, `sans()`, `serif(px, style, weight)`.
- **Text:** `D.text(ctx, str, x, y, { font, color, spacing, align, baseline, stroke })` returns the width. `D.wrap(ctx, text, maxWidth, keep)`, `D.wrapBalanced` (same line count, evenly filled lines); phrases in the optional `keep` array never break across lines. `D.fit` (ellipsis), `D.typed(str, p)`, `D.cursor`, `D.scramble(target, p, seed)`.
- **Shapes:** `D.panel(ctx, x, y, w, h, { fill, stroke, radius, tick, label })`, `D.pill`, `D.rule`, `D.highlight`, `D.circleMark`, `D.underline`, `D.arrowHead`, `D.roundRect`, `D.shadowSprite(w, h, radius, blur)` (cached soft shadow), `D.statusBadge(ctx, status, x, y, { align, size, h })`, `D.sign(ctx, text, x, y, { size, fill, color, angle, pole })` (street-name plate centred on x, y, green by default; `angle` in degrees, `pole` the post length; returns `{ w, h }`).
- **Paths:** `D.partialPath(ctx, points, p)` draws a line up to progress p. `D.quadPoints`, `D.cubicPoints`, `D.pointAt`.
- **Other:** `D.paperTexture(w, h, seed)`, `D.money(value, { compact: true })` gives `$81M`.
- **Icons:** `D.icon(ctx, name, centreX, centreY, size, { color, width, fill })`. Names: email, fax, phone, bank, vault, casino, jet, doc, moon, sun, lock, alert, user, computer, server, money, exchange, printer, globe, clock, calendar, building, cash, check, cross, stop, code, ship.
- **Camera effects:** `fx.kick(t, at, { shake, flash, rgb, glitch, glitchDur, decay })` fires a decaying hit at `at`. Typical values: shake 0.006–0.012, flash 0.1–0.4, rgb 0.2–1.2, glitch 0.5–0.8, decay 8–14.

If you build the same one-off twice, promote it to a component (see below).

## Using real photos

A page opened from `file://` cannot use a photo loaded straight from disk. The browser marks the canvas as tainted, the film-look shader cannot read it, and both playback and export break. Instead, pack the photos into a script once:

```
python toolkit/tools/embed_images.py episodes/EP02-x/images.js episodes/EP02-x/photos
```

1. Resize the photos to about 800 px wide first. The script warns about any file over 1.5 MB, because large files slow the page down.
2. Run the command above. Each image is named after its file, so `Suspect 1.jpg` becomes `suspect-1`. If two files would get the same name, the script stops and asks you to rename one.
3. Load `images.js` right after `uf-core.js`; the template has that line ready, commented out.
4. Use the name on a photo card, `{ kind: 'photo', image: 'suspect-1' }`, or in a one-off layer with `ctx.drawImage(UF.images['suspect-1'], x, y, w, h)`.

Re-run the script whenever you add or change a photo; never edit `images.js` by hand. The stage waits for embedded images to decode before drawing, so stills and exports never show an empty frame. A name that was not embedded throws an error saying so.

Only use photos you have the rights to: agency licences, official handouts, public domain, or your own.

## Previewing frames without playing

`tools/stills.py` renders PNGs of chosen moments with headless Chrome, which is handy for checking layout after an edit.

```
python toolkit/tools/stills.py episodes/EP02-x/gfx-scenes.html episodes/EP02-x/_preview 1@3 2@12.5 4@8
```

`2@12.5` means scene 2 at 12.5 s into that scene; `0@40` means 40 s into the whole reel. Output files are named `s2_12_5.png`. Each frame takes 5–60 seconds. The `_preview` folders are disposable.

To see the whole reel at once, render a contact sheet: one row per scene, with N frames spread evenly through it (default 4, at most 12), each stamped with its time and the scene's transitions.

```
python toolkit/tools/contact_sheet.py episodes/EP02-x/gfx-scenes.html [OUT.jpg] [--frames 6]
```

`OUT` defaults to `gfx-scenes-sheet.jpg` beside the page.

All the tools drive headless Chrome through `tools/_chrome.py`. They run one browser at a time, because two headless launches started together tend to hang, and they kill the whole browser process tree if a page stalls, so nothing is left running in the background.

## Thumbnails

Design thumbnails in their own page: copy `examples/thumbnail-template.html` next to the episode. Each scene holds one `UF.Thumbnail` layer with `transition: 'cut'` and `pushIn: 0`, so every frame is the finished design. Then:

- **On the page:** pick the scene and press **T**, or
- **From the shell:** `python toolkit/tools/thumbnail.py thumbnails.html OUT_DIR 1@1 2@1 3@1`.

Either way you get a 1280×720 JPEG under YouTube's 2 MB limit. Grain is turned down for the saved frame so it compresses cleanly; quality steps down from 0.92 only if the file would be too big. `thumbnail.py` checks each file's size and dimensions and exits with an error if one fails. T works on any scene of any page, so you can also grab a frame from an episode.

YouTube covers the bottom-right corner with the video length, so keep text and faces out of it. A real person's face needs their legal `status`. Never stamp a verdict word on or beside them; the editorial check catches that.

## Cue sheet

Every hit the graphics fire (shake, flash, colour split, glitch), plus every glitch and flash transition, can be exported as a CSV for the sound edit.

- **On the page:** press **C**.
- **From the shell:** `python toolkit/tools/cues.py episodes/EP02-x/gfx-scenes.html [OUT.csv]`. It prints the count of each type.

| Column | Meaning |
|---|---|
| `reel_seconds`, `reel_tc` | Time on the whole reel (export **E**), and as HH:MM:SS:FF at the stage's fps |
| `scene`, `scene_id`, `scene_time` | Which scene, and the time inside it |
| `each_file_seconds` | Time inside that scene's own file from **Shift+E**, which starts with 0.25 s of black |
| `type` | GLITCH, IMPACT (shake and flash), HIT (shake), FLASH or ACCENT (colour split only) |
| `strength` | soft, medium or hard |
| `source` | The component that fired it, or `in transition` / `out transition` |

Cues come from the same `fx.kick` calls that move the picture, so they always match the export. A one-off `UF.layer` that calls `fx.kick` shows up too, under the scene's id.

## Editorial check

Every page checks itself against the editorial rules below when it loads. The HUD shows the result under the scene list (*EDITORIAL CHECK · 0 errors · 2 warnings*, in amber, or red when there are errors); click it, or press **K**, to read the findings. They are also printed in the browser console. From the shell:

```
python toolkit/tools/check.py episodes/EP02-x/gfx-scenes.html [--json]
```

It exits with 0 when there are no errors (warnings allowed), 1 when there is at least one, and 2 when the page could not run.

| Rule | Level | Fires when |
|---|---|---|
| `missing-source` | warning | A scene shows facts (a chart, a counter, a quote, a timeline, a map with money arcs…) but cites no source: no `SourceTag`, no `note` on the layer, no scene `source` |
| `unlabelled-recreation` | error | A rebuilt document, email, statement, chat or call has no RECREATION / ILLUSTRATION label, and neither does the scene |
| `untagged-illustration` | warning | An illustrative diagram (such as `HexPatch`) has no ILLUSTRATION tag |
| `stamp-near-person` | error or warning | A stamp is on screen at the same time as a real person (a `LowerThird` name, a person's photo on a board, a `PhotoWall`, a thumbnail subject). It is an error when the word reads as a verdict (FAKE, GUILTY, FRAUD, FRAUDULENT, SCAM, LIAR, CRIMINAL, THIEF, CROOK, CON MAN…) and a warning otherwise |

- A scene labelled ILLUSTRATION or DRAMATISATION (by a layer, a `DramaLabel` or the scene's `label`) is exempt from `missing-source`.
- Stamps count only while they overlap the person in time, fade-out included, so a stamp after the lower third has gone is fine. On an evidence board, a verdict word on a document card next to a person's photo is a warning; a neutral one (PAID, STOPPED) is fine.
- When a finding is a deliberate choice, silence it for that scene with `ignore: ['rule-id']` and a comment saying why. The gallery's evidence board does this for a FRAUDULENT stamp on the payment order.
- The check reads each layer's `editorial()` metadata. It can't read the voice-over or the footage, so a clean check is the minimum, not a sign-off.

## Editorial rules

These protect the channel. The editorial check catches the mechanical ones; the rest are yours.

- Put a `SourceTag` on every graphic that states a fact, naming the outlet or document and year.
- Label staged material: `DramaLabel` on re-enactments, `label: 'RECREATION'` on rebuilt documents, `tag: 'ILLUSTRATION'` on diagrams with invented detail.
- Say *alleged* or *charged* until there is a conviction. Use `Disclaimer` when naming charged people or states.
- Anyone singled out on screen gets their legal `status` (see Legal status).
- Never put a `Stamp` such as FAKE or GUILTY on the same frame as a real person's name or face. That includes a `stamp` on an evidence-board card when a real person's photo or name is on the board.
- Chart data must come from the source you name. Label invented or rounded figures (`'Illustrative figures'`, `'≈ $30M'`).
- Don't attach amounts to named account holders unless the source does.
- Example and demo data is fictional and says so. Never put real people's names to invented words.

## Extending the toolkit

To add a component:

1. Create `components/uf-<name>.js` following an existing file: an IIFE taking `UF`, a class extending `UF.Component`, registered as `UF.<Name>`.
2. Call `super({ ...defaults }, o)` in the constructor and implement `draw(ctx, t, fx, scene)`. Start with `const a = this.vis(t); if (a <= 0) return;`.
3. Background-like components should draw nothing when `scene.key` is true.
4. Implement `editorial()` so the editorial check knows what the component shows. Return any of: `factual` (states facts), `sourced` (the layer prints its own source note), `source` (it is a source line), `recreation` or `illustration` (rebuilt or invented material), `label` (the label it shows), `sceneLabel` (a label covering the whole scene), `person` (a real person is on screen), `status`, `stamps` (stamped words on the frame), `personStamps` (stamped on a person's photo), `cardStamps` (stamped on another card beside a person).
5. Fire hits with `fx.kick` so they land in the cue sheet automatically.
6. Add a demo scene to `examples/gallery.html` and a section to this README.

Rules that will bite you otherwise:

- **An option name must never match a method name.** Options are copied onto the instance, so an option called `draw` replaces the `draw()` method and the component silently stops rendering. This happened once; `Timeline` uses `lineDur` for that reason.
- **Use classic `<script src>` tags, not ES modules.** Browsers block modules on `file://`.
- **Load order matters:** `uf-core.js`, then `images.js` if the episode has photos, then `uf-draw.js`, `uf-geo.js`, then components (`uf-worldmap.js` before `uf-route.js`, `uf-overlays.js` before `uf-thumbnail.js`, `uf-props.js` before `uf-character.js`), and `uf-presets.js` last.
- **Cache anything expensive that does not change.** At 60 fps a frame has about 16 ms. `EvidenceBoard` draws each card once into an offscreen canvas and reuses it. When you draw such a canvas, leave `imageSmoothingQuality` at its default: `'medium'` and `'high'` make Chrome rebuild the image's mipmaps on every draw, which cost about 30 ms a frame on the board.
- **No `shadowBlur` in per-frame drawing.** It is one of the slowest canvas operations. Bake shadows into a cached sprite (`D.shadowSprite(w, h, …)` makes one) and draw that.
- **Draw cached sprites at whole-pixel positions and 1:1 size where you can.** Without a GPU, a fractional offset, a scale or a rotation forces filtering that costs many times more than a straight copy. `PhotoWall` keeps settled tiles on integer positions for that reason, and `DocumentReveal` picks a cached resolution close to the on-screen size.
- Keep drawing a pure function of `t`. No state that accumulates between frames, no `Math.random()`.

## For AI assistants

Read this README instead of the source files; it lists every component and option. To build an episode:

1. Copy `examples/episode-template.html` into the episode folder.
2. Compose scenes from the presets and components above, with a `B` beats object per scene and a `SourceTag` where facts are shown. Cite only sources the episode's research actually names; never invent an attribution.
3. Draw one-off shots with `UF.layer` and the helpers listed under One-off visuals. For dramatised shots use `UF.Character` with `UF.Prop` and `UF.Room`, starting from a set-up in `examples/cast.html`; place hands with a prop's `point()` rather than guessing coordinates.
4. For real photos, follow Using real photos. Never point an `Image` at a file path.
5. Run `tools/check.py` and fix every error. Treat each warning as a question to answer, not to silence.
6. Render a few frames with `tools/stills.py` (one call, several frames; never several calls in parallel) and look at the PNGs before reporting back.

Open a component's source only to change that component. `episodes/EP01-bangladesh-bank-heist/gfx-scenes.html` is the reference for tone and layout.
