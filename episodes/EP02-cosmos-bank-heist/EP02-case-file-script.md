# Unfiction — Episode 02 · The Cosmos Bank Heist
# Case File edition

This is the visual script for EP02, built around one recurring investigation board: **the Case File**.
It replaces every `ME` shot and restructures the acts into phases. The narration is unchanged from
`EP02-script-and-production-guide.md` (the researched v2 text), so every fact, source and legal note
there still applies. Lines not listed under a board beat keep their v2 visual (`ANIM`, `GFX`, `CARD`, `EVID`).

---

## 1. The idea in one paragraph

The episode is an investigation the viewer completes. In the first two minutes they see the whole board
**empty**: twelve outlined slots, faint dashed threads, a counter reading **CASE FILE · 01 / 12**. Only one
card is filled: the Kolhapur ATM. From there the story moves **upstream**, from the cash in a man's hand,
through the crews and the fixers, into the bank, and finally to the keyboard on the far left. Each phase
opens by diving *into* a card and closes by shrinking the last shot back *into* it. By the end the board
is complete, every person on it carries a legal status stamp, and one red number is still unresolved.

## 2. Why it holds attention

| Device | What the viewer feels |
|---|---|
| **The empty board shown first** | "I can see how much is missing." The blank slots are open loops on screen. |
| **The counter 01 / 12** | Progress. Leaving at 7 / 12 feels like leaving a puzzle half done. |
| **One question per blank slot** | Before a card is revealed its slot shows a faint question ("WHO RECRUITED THEM?"). A fresh loop every few minutes. |
| **Dive in / shrink back** | A rhythm the viewer learns by Phase 2, so each return to the board feels like a chapter turning. |
| **Status stamps** | "What happened to them?" is answered on the card itself, at the moment the case reaches them. |
| **The red number** | The money nobody can account for stays red to the very last frame. |
| **The chord** | Each completed phase adds one note to a recurring chord. It resolves only when the last card fills. |

---

## 3. The board

### Look: dark slate

- **Surface:** near-black slate (`#14181e`) with a faint chalk-dust texture and a soft top-down pool of light. No cork, no clutter.
- **Cards:** matte off-white (`#e9e3d6`) for documents and people, charcoal tags for numbers. One typeface family: condensed display for titles, mono for dates and sources.
- **Threads:** thin, with a faint glow, drawn pin to pin. The glow pulses once when a thread lands.
- **Camera:** always at the same height. Moves are slow pushes and lateral glides; never a spin, never a whip.
- **Readability:** at most 6–8 cards sharp at once. Everything else sits under the focus veil.

### Layout: the chain, read left to right

The board is wider than the frame (about 3,600 × 1,600 board pixels). The camera glides along it.
**Columns** follow the chain from the keyboard to the cash. **Rows** are three bands.

|  | **C1 · THE KEYBOARD** | **C2 · INSIDE THE BANK** | **C3 · THE FIXERS** | **C4 · THE CREWS** | **C5 · THE CASH** |
|---|---|---|---|---|---|
| **DIGITAL** | — | 03 PHISHING EMAIL · 04 PROXY SWITCH | 05 CLONED CARDS | — | 09 28 COUNTRIES · VISA |
| **PEOPLE** | 12 THE HACKERS | 02 COSMOS BANK · PUNE | 06 BIG BOSS | 07 HANDLERS · 08 THE MULES | 01 KOLHAPUR ATM |
| **MONEY** | tag: NORTH KOREA (alleged) | — | 11 HONG KONG · ALM TRADING | — | 10 INDIA · RUPAY |

Two fixed corner pieces stay on screen whenever the board is wide:
- **Top left:** `CASE FILE · 01 / 12`, ticking up as each slot fills.
- **Top right:** **THE MONEY** ledger, a pinned charcoal card whose rows fill over the episode.

### The twelve slots

| # | Card | Kind | Blank-slot question | Filled in | Final stamp |
|---|---|---|---|---|---|
| 01 | KOLHAPUR ATM · SAT 11 AUG 2018 | photo (ATM still) | — (filled from the start) | Cold open | — |
| 02 | COSMOS CO-OPERATIVE BANK · PUNE · SINCE 1906 | doc | WHICH BANK? | Phase 1 | VICTIM |
| 03 | PHISHING EMAIL | doc | HOW DID THEY GET IN? | Phase 1 | — |
| 04 | PROXY SWITCH · "ALWAYS YES" | doc | WHY DID NOBODY SEE IT? | Phase 1 | — |
| 05 | CLONED CARDS · PLAIN PLASTIC | photo (card stack) | WHERE DID THE CARDS COME FROM? | Phase 2 | — |
| 06 | BIG BOSS · DARK-WEB FIXER | silhouette | WHO RAN THE CREWS ABROAD? | Phase 2 | flips in Phase 6 → GHALEB ALAUMARY · PLEADED GUILTY · 11 YRS 8 MO |
| 07 | HANDLERS · INDIA | silhouette ×2 | WHO RECRUITED THEM? | Phase 2 | WANTED · 3 BELIEVED IN DUBAI · RED NOTICE 2020 |
| 08 | THE MULES · "FILM EXTRAS" | silhouette ×3 | WHO TOOK THE CASH? | Phase 2 | 18 ARRESTED (Phase 5) → 11 CONVICTED · PUNE · 2023 (Phase 7) |
| 09 | 28 COUNTRIES · VISA · ₹78 CR | tag | HOW FAR DID IT GO? | Phase 3 | — |
| 10 | INDIA · RUPAY · ₹2.5 CR | tag | — | Phase 3 | — |
| 11 | HONG KONG · ALM TRADING · ₹13.92 CR | tag | WHERE DID THE REST GO? | Phase 4 | ₹10+ CR FROZEN → ₹5.72 CR RETURNED · 2020 |
| 12 | THE HACKERS · 3 CHARGED | silhouette ×3 | WHO WROTE THE CODE? | Phase 6 | CHARGED · NOT TRIED |

### Thread language (shown once, in Phase 1, as a small legend)

| Thread | Meaning | Examples |
|---|---|---|
| **Blue** | Commands and data | HACKERS → PHISHING → PROXY SWITCH → ATM / 28 COUNTRIES / RUPAY |
| **Gold** | People recruiting or supplying people | BIG BOSS → 28 COUNTRIES · HANDLERS → MULES · CLONED CARDS → MULES |
| **Red** | Money moving | ATM / 28 COUNTRIES / RUPAY → THE MONEY · BANK → HONG KONG |
| **Grey, dashed** | Alleged or suspected, not proven | HACKERS → NORTH KOREA · BIG BOSS ⇢ HACKERS ("US says linked") |

### THE MONEY ledger

| Row | Appears | Value |
|---|---|---|
| Visa ATMs abroad | Phase 3, L41 | ₹78.00 CR |
| RuPay ATMs in India | Phase 3, L41 | ₹2.50 CR |
| SWIFT to Hong Kong | Phase 4, L48 | ₹13.92 CR |
| **Total stolen** | Phase 4, L50 | **₹94.42 CR** |
| Returned from Hong Kong | Phase 5, L58 | − ₹5.72 CR |
| **No public recovery figure** | Phase 7, L75 | **₹88.70 CR**, in red, to the end |

---

## 4. Rules for every board beat

1. **8 to 15 seconds per return.** The board is the hub; the scenes still carry the story.
2. **Every return opens with a 2-second recap glide** along the filled threads, slightly speed-ramped. Late viewers catch up without a word.
3. **Enter a phase:** the camera pushes into the card's photo until it fills the frame, then a 6-frame crossfade into the live scene, which starts on the same image.
4. **Exit a phase:** the last shot freezes, takes on the card's matte tone, and shrinks back into its slot. The counter ticks. A pin sound.
5. **People are silhouettes only.** No faces, no photos of accused people, no individual names of the Indian accused. Names appear only where a US government document names them (Alaumary, and the three North Korean suspects, as charged).
6. **Stamps state the legal status exactly:** CONVICTED, PLEADED GUILTY, CHARGED · NOT TRIED, WANTED, ALLEGED. Never on a face, always on the card's lower edge.
7. **The narrator figure works the board in wide shots.** He pins cards and draws threads; the camera then moves in for the readable close shot. One board, two distances: the same layout must match in both.

---

## 5. Running order by phase

`BOARD` marks a Case File beat. Everything else keeps its v2 visual.

| Phase | Lines | Treatment |
|---|---|---|
| **Cold open** | L01–L10 | L01–L02 ANIM · L03 BOARD (first glimpse) · L04–L05 GFX · L06–L07 ANIM · L08 BOARD · L09 CARD · L10 GFX |
| **The reveal** | L11–L12 | L11 BOARD (empty board, full reveal) · L12 logo sting |
| **Phase 1 · The fake brain** | L13–L24 | L13 ANIM · L14 BOARD · L15–L17 GFX · L18 CARD · L19 BOARD · L20 ANIM · L21 GFX · L22 BOARD · L23 CARD · L24 BOARD (exit) |
| **Phase 2 · Hiring an army** | L25–L35 | L25 GFX · L26 ANIM · L27 GFX · L28 BOARD · L29 GFX · L30 ANIM · L31 BOARD · L32 GFX · L33–L34 CARD · L35 BOARD (exit) |
| **Phase 3 · Two hours thirteen** | L36–L46 | L36–L37 GFX · L38–L39 ANIM · L40 BOARD · L41–L42 GFX · L43–L44 ANIM · L45 GFX · L46 BOARD (exit) |
| **Phase 4 · Monday** | L47–L52 | L47 GFX · L48 ANIM · L49 BOARD · L50 GFX · L51 ANIM · L52 BOARD (exit) |
| **Phase 5 · The hunt** | L53–L60 | L53 GFX · L54 ANIM · L55 CARD · L56 GFX · L57 BOARD · L58–L59 GFX · L60 BOARD (exit) |
| **Phase 6 · Behind the keyboard** | L61–L71 | L61 EVID · L62 BOARD · L63 CARD · L64 BOARD (replaces `alias-board`) · L65 CARD · L66–L67 EVID · L68 BOARD · L69 EVID · L70 CARD · L71 BOARD (exit) |
| **Phase 7 · Where it stands** | L72–L81 | L72 GFX · L73–L74 CARD · L75 GFX · L76 BOARD (the full board) · L77 CARD · L78 ANIM (dive back into card 01) · L79 BOARD · L80–L81 end screen |

YouTube chapters follow the phases: *Cold open · The Case File · Phase 1 The fake brain · … · Phase 7 Where it stands.*

---

## 6. The board beats

Narration is quoted from v2 for timing. Board pixel positions are set when the board is built.

### Cold open

**L03** · `BOARD` · First glimpse. Hard cut from the ATM close-up to black, then a tight, shallow shot of a single
card on dark slate: the Kolhapur ATM still from L02, a pin pushing in. A gold thread runs off-frame to the left,
into darkness. Nothing else is visible yet.
> Some of the men doing this that day had been told they were extras in a Bollywood film. Their scene was simple: walk up to a cash machine and take out money. At least, that's what they were told.

**L08** · `BOARD` · Still tight. Beside card 01, an outlined blank slot fades up with its question: **WHY DID NOBODY SEE IT?**
A blue dashed thread from the ATM card reaches into it and stops.
> The system wasn't lying. It just wasn't being told. Somewhere inside the bank, hackers had built a fake copy of one of its most important computers. And that copy was saying "yes" to everyone.

### The reveal

**L11** · `BOARD` · The full reveal. The camera pulls back slowly from card 01 until the whole board is in frame:
twelve slots, eleven of them empty outlines, faint dashed threads between them, each blank slot showing its
question. `CASE FILE · 01 / 12` fades up top left; THE MONEY ledger, empty, top right. On "his court papers name
the bank", the camera drifts to slot 06 (WHO RAN THE CREWS ABROAD?) and holds for a beat.
Sound: the first note of the Case File chord.
> If you watched our last episode, you've met them before. This is the story of how they robbed a bank in Pune without breaking a single lock. And stay to the end, because one man in this chain was eventually caught in America, and his court papers name the bank.

### Phase 1 · The fake brain

**L14** · `BOARD` · Enter Phase 1. Wide: the narrator figure pins card **02 COSMOS BANK · PUNE · SINCE 1906** in the
centre column. Counter **02 / 12**. The camera moves in on slot 04 (WHY DID NOBODY SEE IT?), then pushes into it:
the slot's outline becomes the first node of the switch explainer (L15).
> To understand how it was robbed, you need to know what happens in the few seconds after you put your card into an ATM.

**L19** · `BOARD` · Card **04 PROXY SWITCH · "ALWAYS YES"** lands in the slot it was asked from. A blue thread draws
from it to card 01 (the ATM), and a second blue thread to card 02 dims to grey: the bank's own system, cut out.
Counter **03 / 12**. The thread legend fades up small, bottom left, for this beat only.
> That's why the staff saw nothing. The bank's main system never heard about the withdrawals. As far as it knew, it was a quiet Saturday.

**L22** · `BOARD` · Card **03 PHISHING EMAIL** pins beside the proxy switch; a blue thread joins them. A small
charcoal tag clips onto card 02: **SWIFT · "COMES BACK MONDAY"**, with a tiny EP01 wax-seal icon. Counter **04 / 12**.
> If you saw our Bangladesh episode, that second name will sound familiar. Keep it in mind. It comes back on Monday.

**L24** · `BOARD` · Exit Phase 1. Recap glide: ATM → proxy switch → phishing → bank. Then the camera slides right
to the crews column, where two blank slots wait: **WHO TOOK THE CASH?** and **WHO RECRUITED THEM?** A shadow
crosses the slots, as if someone is standing in front of the board.
Sound: the second note of the chord.
> But getting inside was only half the job. A fake switch can say yes as often as it likes. Someone still has to stand at the machine and take the cash. Thousands of someones.

### Phase 2 · Hiring an army

**L28** · `BOARD` · Card **05 CLONED CARDS** pins in the fixers column (from the L26 table shot). Then card
**06 BIG BOSS · DARK-WEB FIXER**: a silhouette card with no face. One gold thread hangs **loose** from it, swaying
slightly, attached to nothing. Counter **06 / 12**.
> Remember that name: Big Boss. He's the loose thread in this story.

**L31** · `BOARD` · Cards **07 HANDLERS · INDIA** and **08 THE MULES** pin in the crews column. Under the mules card,
a small clip: **"FILM EXTRAS"** with a clapperboard icon. Gold threads: handlers → mules, cloned cards → mules.
On "the real question", the camera tilts up from the mules card, past the handlers, to the darkness above them.
Counter **08 / 12**.
> That's where the Bollywood story comes from. According to the BBC, some of them were told they'd been hired as film extras. But the officer who led the investigation believes that by the day of the raid, even the "extras" knew what they were really doing. The real question is whether any of them knew who they were working for.

**L35** · `BOARD` · Exit Phase 2. Recap glide across all eight cards. A small clock card pins on the ATM: **SAT · 15:00**.
On "it started", every blue thread pulses once at the same moment. Hard cut.
Sound: the third note of the chord, then the first clock tick of Act 3.
> So on Saturday afternoon, nobody in Pune was looking for anything. And at around three o'clock, it started.

### Phase 3 · Two hours thirteen minutes

**L40** · `BOARD` · Mid-heist, fast. The camera glides the chain from left to right in one move:
proxy switch → handlers (a small laptop icon clips on: **SUPERVISOR**) → mules → ATM. Every card it passes
glows slightly, like a production line switching on.
> Think about that. A robbery in twenty-eight countries at once, run like a factory floor. With a supervisor.

**L46** · `BOARD` · Exit Phase 3. Cards **09 28 COUNTRIES · VISA · ₹78 CR** and **10 INDIA · RUPAY · ₹2.5 CR** pin in
the cash column, with gold from Big Boss to 28 countries and red threads from both into THE MONEY. Ledger rows
fill: ₹78.00 CR · ₹2.50 CR. Counter **10 / 12**. On "weren't finished", the camera drifts to the last money slot
(WHERE DID THE REST GO?) and the slot's outline flickers once.
Sound: the fourth note of the chord.
> The next day, Visa sent Cosmos the full list: twelve thousand withdrawals, from cash machines all over the planet. The bank finally knew it had been robbed. What it didn't know was that the robbers weren't finished.

### Phase 4 · Monday

**L49** · `BOARD` · Card **11 HONG KONG · ALM TRADING · ₹13.92 CR** pins in the money row. A red thread draws from the
bank card to it, through the small SWIFT tag from L22, which now ticks green. Ledger row: ₹13.92 CR.
Counter **11 / 12**.
> It's the same trick from Bangladesh: payment orders sent from inside the bank's own systems, carrying the bank's own credentials. Only this time, there was no strange street name to trip an alarm. The money went through.

**L52** · `BOARD` · Exit Phase 4. The ledger total lands: **₹94.42 CR**. Wide pull-back: eleven cards filled, one slot
left empty on the far left, **WHO WROTE THE CODE?** The camera pushes slowly towards it. The slot stays dark.
Sound: the fifth note of the chord.
> That was true. But it left a much bigger question. If a hundred-year-old bank could be emptied over a weekend by people it never saw, who exactly was on the other side?

### Phase 5 · The hunt

**L57** · `BOARD` · The mules card gets its first stamp: **18 ARRESTED · 2018**. Then every gold thread from the mules
lights up in turn, all pointing up and left: handlers, Big Boss, the empty slot. None of the upper cards has a stamp.
> But every arrest pointed the same way: upwards. These men were mules, paid a cut of what they withdrew. The people giving the orders were somewhere else.

**L60** · `BOARD` · Exit Phase 5. The handlers card gets **WANTED · 3 BELIEVED IN DUBAI · RED NOTICE 2020**. The Hong Kong
card gets **₹10+ CR FROZEN**; the ledger shows − ₹5.72 CR RETURNED. On "Big Boss", the loose gold thread from L28
is pulled taut, left, towards the empty slot.
Sound: the sixth note of the chord.
> The investigation had hit a wall that comes up again and again in crimes like this: the small fish get caught on camera, and the big fish live in another country. But there was one thread Indian police couldn't reach, and the Americans could. Big Boss.

### Phase 6 · Behind the keyboard

**L62** · `BOARD` · The FASTCash page from L61 shrinks into a small document card and pins beside the proxy switch.
A blue thread joins them with a **MATCH** label.
> The alert didn't name Cosmos. But the method matched exactly. And the experts were already pointing the same way.

**L64** · `BOARD` · Replaces the v2 `alias-board` scene. The Big Boss card fans out into four small cards: **BIG BOSS ·
G · HABIBI · BACKWOOD**. Grey threads from each meet at one note: **SAME EMAIL ADDRESS**. A pin press for each card,
a string twang as the threads meet.
> Meanwhile, researchers at the US security firm Intel 471 were digging into Big Boss. He'd been on criminal forums for years, under different names: G, Habibi, Backwood. And he'd made one mistake. He used the same email address for all of them.

**L68** · `BOARD` · After the L66–L67 documents. The four alias cards collapse back into card 06, which flips over:
**GHALEB ALAUMARY · CANADA · PLEADED GUILTY · 11 YRS 8 MO**, with a small clip: **RESTITUTION ORDERED: COSMOS $16.3M**.
On "Ordered to repay, that is", a thin line crosses out the word "RESTITUTION" and a note slides under it:
**ORDERED ≠ RECOVERED**.
> Ordered to repay, that is. There's no public record of how much of it Cosmos has actually received. But the bank's very first clue, back in August 2018, had pointed to Canada. Now there was a Canadian in an American courtroom.

**L71** · `BOARD` · Exit Phase 6. After the L69 poster and the L70 disclaimer: card **12 THE HACKERS** pins in the last
slot, three silhouettes, stamp **CHARGED · NOT TRIED**. Counter **12 / 12**. A grey dashed thread runs from it to a
small tag, **NORTH KOREA · ALLEGED**. On "may have helped pay for it", a faint line of light travels the whole chain
from the Kolhapur ATM back to that tag, and fades.
Sound: the seventh note of the chord. The chord is now complete, but unresolved.
> And this is why it matters. The US government says money from heists like this helps fund a state under UN sanctions for its nuclear weapons programme. If investigators are right, cash pulled out of an ATM in Kolhapur may have helped pay for it.

### Phase 7 · Where it stands

**L76** · `BOARD` · The full board. As each part is listed, the camera stops on it and its final stamp lands:
1. "eleven mules convicted in Pune" → mules card: **11 CONVICTED · PUNE · APR 2023**
2. "a Canadian money launderer in an American prison" → card 06 glows
3. "three suspects believed to be in Dubai" → handlers card glows
4. "the people who actually wrote the code?" → the camera pulls back to the whole board and rests on card 12.

On "Never arrested.", every card dims except card 12 and the ledger's red **₹88.70 CR · NO PUBLIC RECOVERY FIGURE**.
Sound: the chord resolves for the first time. Then **silence 1.2 s**.
> So, eleven mules convicted in Pune. A Canadian money launderer in an American prison. Three suspects believed to be in Dubai. And the people who actually wrote the code? Never arrested.

**L78** · `ANIM` with a board entry. Before the v2 callback shot, the camera travels the whole chain one last time, right
to left to right, ending on card 01, the Kolhapur ATM, and pushes into its photo. The photo comes alive as the
L78 evening shot. The board is never seen again.
> The men at the ATMs were told they'd been hired for a scene in a film. In a way, they had. They just never saw the script, or met the people who wrote it.

**L79** · `BOARD` · The completed board, wide and still, the narrator figure standing beside it, facing camera. Two new cards
pin at the bottom centre: **A BANK THAT WAS TOO SMALL?** and **AN ATTACK NO BANK COULD STOP?** A small comment
icon between them.
> So what do you think? Should a small co-operative bank ever have been plugged into the global card network without the defences of a big one? Or was this an attack no bank could have stopped? Tell me in the comments. I read every one.

---

## 7. Sound for the board

| Element | Sound |
|---|---|
| Card lands | a soft pin press, slightly different pitch per column |
| Thread draws | a thin string tension, rising with length |
| Stamp | a dry paper thump (no gavel) |
| Counter ticks | a quiet mechanical click |
| Dive in / shrink back | a short air whoosh, and its reverse |
| **The Case File chord** | one sustained note added at L11, L24, L35, L46, L52, L60 and L71; the first resolution at L76 |

The chord must use the same instrument every time (a soft piano or a felt pad), and sit under the act music cues
M01–M09 from the v2 sound plan.

---

## 8. Build notes for the toolkit

The current `UF.EvidenceBoard` already supports cards, coloured strings, stamps, marks, focus and camera moves.
The Case File needs:

1. **`surface: 'slate'`**, glowing threads and string styles: `color` plus `dashed` for the alleged threads.
2. **Blank slots:** an outlined, empty card with a faint question, which a real card later replaces in place.
3. **One shared board spec** (`case-file.js`) holding every slot, card, thread and stamp with the phase it appears in.
   Each board scene renders the board *as of* a given moment, so the board is identical on every return.
4. **The dive-in / shrink-back transition** between a card's photo and a live scene, plus the card's still frames.
5. **Board furniture:** the `CASE FILE · n / 12` counter and THE MONEY ledger as board pieces.
6. **Card flip** (for Big Boss, L68) and **card fan-out** (for the aliases, L64).
7. **The wide narrator shot** of the same board on the room wall, matching the close-up layout.

## 9. Shorts from the board

Each phase's build is a vertical Short on its own: "Phase 2: how they hired an army of film extras",
"Phase 6: the loose thread that caught Big Boss". Each ends on the half-filled board and the counter, pointing to
the full episode.
