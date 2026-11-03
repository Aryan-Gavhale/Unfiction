# EPxx — Case File visual script (template)

Copy to `episodes/EPxx-short-name/EPxx-case-file-script.md`. Narration must match
`EPxx-script-and-production-guide.md` verbatim; only visuals and phase structure change here.

---

## 1. One paragraph

[How the viewer “completes” the investigation; empty board early; counter; what stays unresolved at the end — usually money or unidentified masterminds.]

## 2. Retention devices

| Device | Viewer effect |
|---|---|
| Empty slots + questions | Open loops |
| CASE FILE · n / N | Progress guilt |
| Dive in / shrink back | Chapter rhythm |
| Status stamps | Payoff per person/node |
| Ledger / red total | Stake to the end |
| Phase chord | Audio progress |

## 3. Board look

- **Surface:** dark slate `#14181e`, soft top light, no cork (unless user overrides).
- **Cards:** matte `#e9e3d6` / charcoal tags; silhouettes for people.
- **Threads:** blue / gold / red / grey dashed — define once in legend.
- **Max in focus:** 6–8 cards.

## 4. Layout grid

Board size (e.g. 3600×1600). Columns = [chain left → right]. Rows = digital / people / money.

|  | Col1 | Col2 | Col3 | … |
|---|---|---|---|---|
| Digital | | | | |
| People | | | | |
| Money | | | | |

**Fixed UI:** top-left counter · top-right ledger (if applicable).

## 5. Slot table

| # | Card title | Kind | Blank question | Filled phase | Final stamp |
|---|---|---|---|---|---|
| 01 | | photo/doc/tag/silhouette | — or question | Cold open / Phase n | |

## 6. Thread legend

| Color | Meaning |
|---|---|
| Blue | |
| Gold | |
| Red | |
| Grey dashed | Alleged only |

## 7. Ledger (optional)

| Row | Script line | Value |
|---|---|---|
| | | |

## 8. Board beat rules

1. 8–15 s per return; 2 s recap glide.
2. Enter: push into card photo → crossfade to scene.
3. Exit: freeze → shrink into slot; counter++; pin sound.
4. Silhouettes only; stamps on card edge.
5. Wide narrator + close board must match layout.

## 9. Phase map

| Phase | Lines | Notes |
|---|---|---|
| Cold open | L… | |
| Reveal (full empty board) | L… | |
| Phase 1 · [title] | L… | |
| … | | |
| Final | L… | Full board + callback |

YouTube chapters = phase titles.

## 10. BOARD beats (detail)

For each `BOARD` line:

```markdown
**Lnn** · `BOARD` · [enter|mid|exit phase name]. Camera / stamps / counter / sound.
> [Exact narration from production guide.]
```

## 11. Sound (board)

| Event | SFX |
|---|---|
| Card lands | pin |
| Thread | tension |
| Stamp | paper thump |
| Phase exit | chord +1 note |

## 12. Toolkit gaps

- [ ] surface slate
- [ ] blank slots
- [ ] shared `case-file.js` state
- [ ] portal transition
- [ ] counter + ledger components
- [ ] flip / fan-out

## 13. Shorts

One vertical cut per phase; end on partial board + counter.
