# Unfiction toolkit — agent reference

Read `Unfiction/toolkit/README.md` for full API. This file is the fast path when building episodes.

## Page bootstrap

From `episodes/EPxx-.../`, typical load order:

```
uf-core.js → (images.js) → uf-draw.js → uf-geo.js → components… → uf-presets.js last
```

Optional EP01-style ME: `uf-board.js`, `uf-bigtext.js`, `uf-props.js`, `uf-character.js`, `uf-sets.js`.

## Component pattern

```javascript
(function (UF) {
  class MyThing extends UF.Component {
    constructor(o) {
      super({ x: 960, y: 540, start: 0, /* defaults */ }, o);
    }
    draw(ctx, t, fx) {
      const a = this.vis(t);
      if (a <= 0) return;
      // draw in 1920×1080 space
    }
    editorial() {
      return { factual: true, illustration: false, sourced: false };
    }
  }
  UF.MyThing = MyThing;
})(window.UF);
```

Scene function pattern:

```javascript
function scene_worldMap(id, title, end) {
  const B = { pins: 0.4, counter: 2.1 }; // L04 beats
  return {
    id, title, duration: end,
    layers: [
      new UF.Background({ style: 'void' }),
      new UF.WorldMap({ /* … */ }),
      new UF.SourceTag({ text: '…', at: B.counter }),
    ],
  };
}
```

Register in `scenes[]` with `title`, `slug` (e.g. `ep02`).

## Key components by shot type

| Shot need | Component |
|---|---|
| World pins / arcs | `UF.WorldMap`, `UF.RouteMap` |
| Money flow | `UF.FlowChart`, `UF.Ledger` |
| Explainers | `UF.NetworkSpread`, custom nodes in GFX |
| Quotes / cards | `UF.QuoteCard`, `UF.FactCard` |
| Real PDF/photo | `UF.DocumentReveal` + `embed_images.js` |
| Cork investigation board | `UF.EvidenceBoard` (EP01) |
| Case File board | `UF.EvidenceBoard` + slate spec (EP02 plan) |
| Faceless presenter | `UF.Room`, `UF.Character`, `UF.Prop` |
| Kinetic text | `UF.BigText` |
| Time | `UF.TimeChip`, `UF.WorldClocks`, `UF.CalendarStrip` |
| Legal status | `UF.StatusBadge`, card `stamp` on board |
| End | `UF.EndScreen` |

## Evidence page helper (EP01 pattern)

```javascript
const SRC = { l42: [1704, 887] }; // native px w,h
function shot(image, w, o) {
  const [sw, sh] = SRC[image], s = w / sw;
  const scale = list => (list || []).map(e =>
    e.rect ? Object.assign({}, e, { rect: e.rect.map(v => Math.round(v * s)) }) : e);
  return new UF.DocumentReveal(Object.assign({
    image, w, h: Math.round(sh * s), x: 960, y: 540, angle: -0.4,
  }, o, {
    highlights: scale(o.highlights),
    marks: scale(o.marks),
    camera: scale(o.camera),
  }));
}
```

`uf-core.js`: text-only check skips `UF.imagesReady()` when `?check` without sheet/thumb — use for evid pages.

## Tools (run from episode dir)

```bash
python ../../toolkit/tools/check.py gfx-scenes.html
python ../../toolkit/tools/stills.py gfx-scenes.html out/ 3@1.5
python ../../toolkit/tools/contact_sheet.py gfx-scenes.html out/sheet.jpg --frames 8
python ../../toolkit/tools/cues.py gfx-scenes.html
python ../../toolkit/tools/embed_images.py images.js photos/
```

Browser: **Shift+E** per-scene MP4; **?key** green screen; **?scene=N** solo scene.

## Git sync (OneDrive ↔ Automation)

```powershell
robocopy "C:\Users\ARYANGA\OneDrive - AMDOCS\Documents\Unfiction" "C:\Automation\Unfiction" /E /XD .git _preview
```

Commit from `C:\Automation\Unfiction` only when user requests push.

## Episode folder layout

```
episodes/EPxx-short-name/
  EPxx-script-and-production-guide.md
  EPxx-case-file-script.md
  build-plan.md
  sound-design.md          # optional
  gfx-scenes.html
  anim-scenes.html
  board-scenes.html        # Case File (preferred name)
  me-scenes.html           # legacy EP01-style
  evid-scenes.html
  overlays.html
  images.js
  photos/ photos-src/
```

## Naming

- Episode folder: `EP02-cosmos-bank-heist` (number + kebab slug).
- Scene ids: `l42-bae-report`, `phase3-exit-board`.
- Export slug: short prefix `ep02` in page config.

## VO automation (planned)

Dependencies not bundled: **ffmpeg**, **faster-whisper** (or similar). Pipeline steps:

1. Transcribe + word timestamps from user WAV.
2. Map lines L01–Lnn to time ranges; adjust scene `duration` and `B` beats.
3. Headless Chrome export per scene; ffmpeg concat + duck music using `cues.py` hits.

Document status in `build-plan.md` until implemented in `toolkit/tools/`.
