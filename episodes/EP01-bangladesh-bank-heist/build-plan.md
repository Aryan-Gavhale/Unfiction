# EP01 â€” remaining build plan

**Status (2 Nov 2026):** Phases 1â€“4 done. `evid-scenes.html` (6 scenes) and `me-scenes.html` (27 scenes)
both pass `check.py` with 0 errors / 0 warnings. L92 (`BBHOBDDH`) added from the BAE post; `evid-scenes.html` now has 7 scenes.

Script: `Unfiction/script.md` (v2, L01â€“L112). ANIM, GFX and CARD shots are done
(`anim-scenes.html`, `gfx-scenes.html`, `overlays.html`). What is left is below.

## Phase 1 â€” Evidence page `evid-scenes.html` (6 scenes)

Photos in `photos/`, embedded with `toolkit/tools/embed_images.py` into `images.js`.
`park-jin-hyok.pdf` is rendered to `l96-fbi-wanted.png` first.

| Scene | Line | Image | Beat |
|---|---|---|---|
| l42-bae-report | L42 | L42.png | page slides in, highlight author + date, then title |
| l44-bae-patch | L43â€“44 support | L92.png | push in on `75 04` / `jnz failed`, then the `90 90` nops (optional insert under the HexPatch GFX) |
| l79-inquirer | L79 | L79.png | headline, then mark "repeatedly invoked her right against self-incrimination" |
| l92-swift-code | L92 | none yet | screenshot shows the patch, not `BBHOBDDH`. Fallback: own CARD citing BAE until a real capture exists |
| l95-doj | L95 | L95_headline.png â†’ L95.png | headline, then highlight "stole $81 million from Bangladesh Bank" |
| l96-fbi-wanted | L96 | l96-fbi-wanted.png | slow push-in on the poster |
| l104-daily-star | L104 | L104.png | headline highlight, date |

Every evidence scene carries a source tag; no RECREATION label (real images).

## Phase 2 â€” Toolkit additions

- `UF.BigText` â€” kinetic line for ME replacements: words land in time with the VO,
  one word can be marked red, struck through or swapped, optional dark backdrop or over a shot.
- Narrator room â€” a reusable set (Room, desk, lamp, chair, evidence wall) with the `main`
  character, as a function in the ME page so every narrator beat shares one set.

## Phase 3 â€” ME replacement page `me-scenes.html` (27 beats)

Treatments agreed: narrator room / big text / evidence board / reuse a shot. Built in three batches:

1. Cold open â€“ Act 2: L03 L06 L08 L12 L15 L19 L23 L29 L32 L39
2. Acts 3â€“4: L41 L45 L49 L52 L58 L62 L66 L69 L72 L77 L80
3. Acts 5â€“7: L85 L89 L99 L105 L108 L110

## Phase 4 â€” Verify

`check.py` on each page, one contact sheet per page, crops only where something looks off.
