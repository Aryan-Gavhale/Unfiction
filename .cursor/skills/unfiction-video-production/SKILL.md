---
name: unfiction-video-production
description: >-
  Plans and builds Unfiction YouTube episodes — researched script, Case File visual script,
  toolkit components, and HTML scene pages (gfx, anim, board, evidence). Use when the user
  mentions Unfiction, a new episode, crime/scam video script, Case File board, ME replacement,
  gfx-scenes, voice-over alignment, or extending the Unfiction toolkit.
---

# Unfiction video production

End-to-end pattern for **Unfiction** (true-crime / scam explainers): one researched narration script,
a **Case File** investigation board as the recurring “ME” layer, HTML motion graphics at 1920×1080,
and editorial-safe visuals. Follow this skill so every episode feels like the same show.

## Where the project lives

| Role | Path |
|---|---|
| **Day-to-day edit** | `C:\Users\ARYANGA\OneDrive - AMDOCS\Documents\Unfiction` |
| **Git (GitHub)** | `C:\Automation\Unfiction` — branch `master`, remote `https://github.com/Aryan-Gavhale/Unfiction` |
| **Toolkit** | `Unfiction/toolkit/` (core, components, tools, examples) |
| **Canonical examples** | EP01 `episodes/EP01-bangladesh-bank-heist/` · EP02 script `episodes/EP02-cosmos-bank-heist/` |

When the user asks to **push**, sync OneDrive → Automation clone (`robocopy` with `/XD .git _preview`), then commit and push from `C:\Automation\Unfiction`. Do not commit unless asked.

Read `toolkit/README.md` for component APIs; read EP01 pages for working patterns before inventing new ones.

---

## Default creative pattern: the Case File

From **EP02 onward**, treat **Case File** as the default “presenter” layer (replaces on-camera ME and most faceless desk shots).

- One **dark slate** investigation board for the whole episode.
- **Empty slots + questions** shown early; **CASE FILE · n / N** counter; optional **money ledger** in a corner.
- Story moves **along the chain** (usually cash → crews → fixers → bank → keyboard, or the reverse for cold open).
- **Phases**: dive **into** a card → full `ANIM`/`GFX`/`CARD`/`EVID` scene → shrink back **into** the card; **8–15 s** board returns with a **2 s recap glide**.
- **Threads**: blue (data/commands), gold (people/recruitment), red (money), grey dashed (alleged).
- **People**: silhouettes only on the board; **status stamps** on cards (CONVICTED, PLEADED GUILTY, CHARGED · NOT TRIED, WANTED, ALLEGED) — never verdict stamps on faces/photos.
- **Sound**: one note added to a recurring chord per phase; resolve on the final “where it stands” board beat.

**Reference implementation (spec, not yet built in HTML):**  
`episodes/EP02-cosmos-bank-heist/EP02-case-file-script.md`

**EP01 legacy:** mixed ME replacements (`me-scenes.html`: narrator room, `UF.BigText`, cork `EvidenceBoard`, `?key` overlays). Reuse those **only** when the user asks for EP01-style mix or a one-off beat.

Template for a new episode’s visual script: [case-file-template.md](case-file-template.md).

---

## Production workflow (always follow this order)

When the user starts a **new episode** or says tokens are limited, **plan first**, then build.

### Phase A — Research script (single source of truth for words)

Create `episodes/EPxx-short-name/EPxx-script-and-production-guide.md`:

- Acts, pacing notes, **L01–Lnn** lines with type tags: `ANIM`, `GFX`, `CARD`, `EVID`, and legacy `ME` if any.
- Each line: **quoted narration** (final VO text), visual brief, sound motif, **named on-screen source** where required.
- Legal appendix: charged vs convicted, no accused photos, jurisdiction-specific naming rules.
- Graphics inventory (scene ids), music cues, thumbnail/end-screen notes.

Do **not** change facts in the Case File script without updating this file.

### Phase B — Case File visual script

Create `episodes/EPxx-short-name/EPxx-case-file-script.md` from [case-file-template.md](case-file-template.md):

1. One-paragraph hook (viewer completes the investigation).
2. Board layout: columns/rows, slot table (id, question, phase filled, final stamp).
3. Thread legend + ledger rows (if money story).
4. Phase map: every script line → `BOARD` | keep v2 visual.
5. Per **BOARD** beat: enter/exit, camera, counter tick, stamps, narration quote (unchanged from Phase A).
6. Toolkit gaps list (what the existing components, including `uf-casefile.js`, cannot do yet).
7. YouTube chapters = phases; Shorts = one phase each.

Add a pointer at the top of the production guide linking to the Case File script.

### Phase C — Build plan

Create `episodes/EPxx-short-name/build-plan.md`:

- Status line (date, what’s done).
- Phased checklist: toolkit → `gfx-scenes.html` → `anim-scenes.html` → `board-scenes.html` (or `me-scenes.html`) → `evid-scenes.html` → `overlays.html`.
- Table: scene id | script line | page | component/preset | assets needed.
- Evidence list for the user (exact screenshots/PDFs, crop hints).

**Stop after Phase A–C** and confirm with the user if they asked for plan-only or have limited tokens.

### Phase D — Toolkit (only what the plan needs)

- Extend existing components before new ones; match EP01 style (`UF.Component`, `draw(ctx,t,fx)`, `editorial()`).
- Case File is built: `toolkit/components/uf-casefile.js` (`UF.CaseFile` spec, `UF.CaseFileBoard`, `UF.CaseFileWall`; toolkit 1.5.0). Each episode writes one `case-file.js` keyed to script lines; copy the pattern from `episodes/EP02-cosmos-bank-heist/case-file.js` and `board-proto.html`. Reference: "Case File — uf-casefile.js" in `toolkit/README.md`.
- Bump `toolkit/README.md` and note version in commit message when behavior changes.
- Add gallery demo scenes in `toolkit/examples/gallery.html` for new components.

### Phase E — HTML pages

Standard episode pages (copy from EP01 / `episode-template.html`):

| File | Purpose |
|---|---|
| `gfx-scenes.html` | Maps, charts, explainers, quotes-as-GFX, timelines |
| `anim-scenes.html` | Story animation (locations, characters, props) |
| `board-scenes.html` | All Case File beats + wide narrator-at-board if used |
| `evid-scenes.html` | Real documents (`UF.DocumentReveal` + `images.js`) |
| `overlays.html` | Labels, chips; use `?key` for green-screen |

Conventions:

- Frame **1920×1080**; scene list at bottom; **`B` beats** object per scene tied to script line ids.
- **`slug`** prefixes MP4 exports; **`DramaLabel`** / `label: 'ILLUSTRATION'` on dramatisations.
- Run from episode folder:  
  `python ../../toolkit/tools/check.py <page>.html`  
  Target **0 errors**; justify any `ignore` on scenes.

Evidence photos: `photos-src/` → resize to `photos/` →  
`python ../../toolkit/tools/embed_images.py images.js photos/`

### Phase F — Voice-over and assembly (target state)

Preferred user flow (automate when tools exist):

1. User records **final narration** (+ optional BG music stems).
2. Agent runs **alignment** (e.g. faster-whisper), **retimes** `B` blocks, **headless export** (Chrome tools), **ffmpeg** mix using cue sheets from `cues.py`.

Until that pipeline exists: user can VO first and give timestamps, or build visuals then fit `B` manually. Document which mode the episode uses in `build-plan.md`.

### Phase G — Verify and ship

- `check.py` on every page; contact sheets for layout review.
- Intro: `Intro/unfiction-intro.html` · End screen component on last ME/board beat.
- Push to GitHub only when user asks.

---

## Script line format (consistent across episodes)

```markdown
**L42** · `GFX` · `scene-id`. One-line visual brief.
Sound: …
> Narration sentence exactly as spoken.
```

Case File beats:

```markdown
**L57** · `BOARD` · Exit Phase 5. Recap glide; stamp on handlers card; chord note 6.
> Narration unchanged from production guide.
```

---

## Legal and editorial (non-negotiable)

- **No faces/photos of accused** where policy forbids; silhouettes and groups (“eleven men convicted in Pune”).
- **Say charged / alleged** when there is no conviction; use `StatusBadge` and card stamps correctly.
- **Every factual claim** on screen needs a **SourceTag** or scene `source` for the checker.
- **Recreations** labelled RECREATION or `DramaLabel` ILLUSTRATION.
- **No client logos** if the episode guide forbids them (e.g. Cosmos, Visa, RuPay in EP02).
- Stamps: use **doc/silhouette cards**, not person photos — `stamp-near-person` is an error for verdict words.

Full rules: `toolkit/README.md` → Editorial check.

---

## Decision tree: ME / faceless treatment

Ask once per episode unless the user already chose:

| User preference | Action |
|---|---|
| **Case File (default)** | All former ME → `BOARD`; narrator optional at board edge |
| **EP01 mix** | Split across narrator room, `UF.BigText`, cork board, `?key` over GFX |
| **No face on camera** | Never use live ME; use Case File + character silhouette |

---

## Checklist (copy per episode)

```
Episode EPxx — production checklist
- [ ] EPxx-script-and-production-guide.md (narration locked)
- [ ] EPxx-case-file-script.md (phases + slot table)
- [ ] build-plan.md
- [ ] gfx-scenes.html — check.py clean
- [ ] anim-scenes.html — check.py clean
- [ ] board-scenes.html — check.py clean
- [ ] evid-scenes.html + images.js (if any EVID)
- [ ] overlays.html
- [ ] sound-design.md or cues exported
- [ ] VO alignment / export pipeline noted
```

---

## Additional resources

- Toolkit detail, component list, git sync: [reference.md](reference.md)
- Blank Case File script skeleton: [case-file-template.md](case-file-template.md)
- Worked GFX/ANIM: `episodes/EP01-bangladesh-bank-heist/*.html`
- Case File spec: `episodes/EP02-cosmos-bank-heist/EP02-case-file-script.md`
