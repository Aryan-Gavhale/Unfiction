# EP01 · The Bangladesh Bank Heist · Sound Design

This is the complete sound plan for Episode 01: every music cue, every background ambience, and every sound effect, line by line from L01 to L112. It follows the v2 script (`Unfiction/script.md`) and the graphics in `gfx-scenes.html`.

Do the sound **after** the picture is locked. The voice is the star; everything here exists to hold it up, never to compete with it.

---

## Contents

1. [How to read this document](#1-how-to-read-this-document)
2. [The sound of the channel](#2-the-sound-of-the-channel)
3. [Five sound motifs that tie the story together](#3-five-sound-motifs-that-tie-the-story-together)
4. [Where to get the sounds (and what is safe)](#4-where-to-get-the-sounds-and-what-is-safe)
5. [Editor setup: tracks, buses, levels](#5-editor-setup-tracks-buses-levels)
6. [Music plan: nine cues for the whole episode](#6-music-plan-nine-cues-for-the-whole-episode)
7. [Sound library: every file to collect](#7-sound-library-every-file-to-collect)
8. [Line-by-line cue sheet, L01 to L112](#8-line-by-line-cue-sheet-l01-to-l112)
9. [Graphics: what to put on each hit](#9-graphics-what-to-put-on-each-hit)
10. [Your voice](#10-your-voice)
11. [Final mix and export](#11-final-mix-and-export)
12. [Checklist before upload](#12-checklist-before-upload)

---

## 1. How to read this document

**Times.** There are three kinds of time in this document:

| Written as | Means | Use it for |
|---|---|---|
| `≈ 06:46` | Rough position in the finished video, from the script's section timings. Your real timing depends on your recording. | Finding the right area of the timeline |
| `file 3.65 s` | Seconds inside a graphics scene's own MP4, the file you get with **Shift+E** (`ep01-NN-scene-id.mp4`). These files start with 0.25 s of black, already counted in. | Placing a sound effect exactly on a graphics hit |
| `on "word"` | Put the sound where you say that word. | Blender (`ANIM`) and on-camera (`ME`) shots |

**Graphics file times are exact.** They come from the toolkit's own cue sheet, `gfx-scenes-cues.csv` in this folder. It lists all 88 hits, flashes and glitches. If you retime a scene by changing its `B` numbers, export a fresh cue sheet with:

```
python toolkit\tools\cues.py episodes\EP01-bangladesh-bank-heist\gfx-scenes.html
```

**Scene numbers** (`scene 17`) match the `gfx-scenes.html` panel and the MP4 file names (`ep01-17-deleted-records.mp4`).

**Sound IDs** like `SFX-UI-03` or `AMB-02` refer to the files in [section 7](#7-sound-library-every-file-to-collect). Save each one under that name and the whole document becomes a lookup.

**Levels** are peak readings on your editor's meter (dBFS) unless marked LUFS. [Section 5](#5-editor-setup-tracks-buses-levels) has the full table.

---

## 2. The sound of the channel

**Concept: cold, procedural and ticking.** This is a story about systems, clocks and paperwork, so the sound should feel like machines and time. Think hum, pulse, tick, glitch. No big orchestral trailer music, no "epic" choirs, no rock. It should feel like the room on the tenth floor at 8:36 pm.

**The rules for every scene:**

1. **The voice is always on top.** If you can't hear every consonant of the narration, the music is too loud. No exceptions.
2. **No melody under important facts.** Melody pulls attention. Use drones and pulses under numbers, names and dates; let melody in only between lines and in reflective moments.
3. **Silence is a sound.** The most important beats (L19, L39, L52, L69, L99, L109) work because everything drops out. Plan these silences; don't fill them.
4. **One idea per hit.** A graphics hit gets one sound, two at most (for example a glitch plus a low thud). Never stack five effects on one frame.
5. **Ambience under every Blender shot.** Even a near-silent room has a tone. A shot with no room tone feels fake.
6. **Every sound has a reason in the picture.** If nothing on screen moves, clicks, lands or changes, there is no sound effect.
7. **Same palette all episode.** Pick your music from one library and one family of sounds. Unfiction should sound like Unfiction in every episode.

**Overall balance across the video:**

| Act | Energy | Music density | Feel |
|---|---|---|---|
| Cold open | High → hard stop | Medium | Tense, mysterious, hooks fast |
| Act 1 · The vault with no walls | Low → medium | Light | Curious, explanatory, a hint of menace |
| Act 2 · Building the escape route | Medium, steady | Medium | Methodical, planning, ticking |
| Act 3 · The night of the heist | Highest | Heavy, then gaps | Thriller, the main set piece |
| Act 4 · The weekend nobody answered | Low, then rising urgency | Light | Lonely, frustrating, clock running out |
| Act 5 · Washing the money | Medium | Medium | Smoky, noir, slippery |
| Act 6 · Who was it? | Building to heavy | Medium → near silence | Investigative, then sombre |
| Act 7 · Ten years later | Low, reflective | Light | Melancholy, unresolved |
| Ending | Warm | Light | Conversational, an invitation |

---

## 3. Five sound motifs that tie the story together

A motif is a sound that comes back every time a particular idea comes back. Viewers won't consciously notice it, but it makes the episode feel designed. Use **the exact same file** every time.

| Motif | Sound | Meaning | Where it appears |
|---|---|---|---|
| **A · The printer** | `SFX-FOL-05` error beep, `SFX-FOL-06` printer stall, `SFX-FOL-07` printer whir and page | The witness that couldn't speak | L04, L47, L64, L70 (graphics), L109 (the payoff: the printer finally works) |
| **B · The clock** | `SFX-UI-17` soft mechanical tick, 1 per second | Time as the weapon | L01, L22 (the 12-month wait), L33–38 (the five-day window), L40, L73–75 (ticking faster) |
| **C · Jupiter** | `SFX-UI-20` single resonant sonar ping with a long tail | The one word that saved $850 million | L03 ("the name of a planet"), L07 (street sign), L25 (soft, under the street shot), L53 (the word pulses), L54 (layered with the MATCH impact) |
| **D · The intruder** | `SFX-UI-10` data glitch, `SFX-UI-11` glitch swish | The hackers' presence | L01 (cursor moving by itself), L20, L21–22, L43–46, L68, L94 |
| **E · Silence** | Nothing: all music and effects drop, only room tone stays | Let a line land | Before L19, after L39, L52, L69, end of L99, after L109 |

**How to make the Jupiter ping recognisable:** use the same ping, at the same pitch, every time. At L03, L07 and L25 play it quietly (−28 to −26 dB). At L53 a little louder (−22 dB). At L54 full (−16 dB) and layered with the impact. The repetition makes the MATCH moment feel like a payoff.

---

## 4. Where to get the sounds (and what is safe)

The script says: **no music from films, no news-channel audio.** Every sound must be licensed for a monetised YouTube channel.

### Recommended sources

| Source | Cost | Good for | Licence notes |
|---|---|---|---|
| **YouTube Audio Library** (YouTube Studio → Audio library) | Free | Music and basic effects | Safe for YouTube. Some tracks need a credit in the description: check the "Attribution" column and copy the exact credit. |
| **Epidemic Sound** | Paid monthly | Music (best for this genre), and its effects library is excellent | Connect your channel in your Epidemic account so Content ID claims are cleared automatically. Download while subscribed; videos published during the subscription stay licensed. |
| **Artlist** (music and SFX) | Paid yearly | Music and effects | Videos made during the subscription stay licensed. |
| **Freesound.org** | Free | Specific effects (fax handshake, printer, phone ring-out) | **Use only CC0 files.** CC-BY is fine if you credit the creator in the description. **Never use CC-BY-NC** (non-commercial) on a monetised channel. |
| **Pixabay** (sound effects) | Free | Basic effects | Licence allows commercial use. Avoid Pixabay *music*: some tracks get false Content ID claims. |
| **Record it yourself** | Free | Keyboard, mouse clicks, paper, stamps, footsteps, car door, chips | Your own recordings are always safe and often sound more real. Use your phone in a quiet room. |

**My suggestion:** if you can afford one subscription, take **Epidemic Sound** for all music and most effects; it makes the episode consistent. If not, use the **YouTube Audio Library** for music, **Freesound CC0** plus your own recordings for effects.

**About exact track names.** Libraries add and remove tracks all the time, so this document gives you a precise brief for each music cue (mood, tempo, instruments, what it must and must not have) plus search terms that work in these libraries, rather than track titles that may not exist by the time you search. Spend 10 minutes per cue auditioning 5–10 candidates **with your voice playing over them**; pick the one that disappears under your voice best.

### Keep a sound log

Make a text file `sound-log.txt` in this folder. For every file you use, write the file name, where it came from, the track or creator name and the licence. You'll need it for description credits and for any copyright claim.

**Don't use:**
- Real Windows or Mac system sounds (Microsoft and Apple own them). Use a generic "error chime" instead.
- Real bank, casino or news-channel audio.
- Music recognisable from films, series or other YouTubers.
- Any "free" music from random websites or other YouTube channels' "no copyright music" uploads.

---

## 5. Editor setup: tracks, buses, levels

### Project settings

- **48 kHz, 24-bit** for everything. Convert any 44.1 kHz downloads to 48 kHz before editing (most editors do it automatically).
- Keep every source file as **WAV**. Use MP3 only if the library has nothing else.

### Track layout

Set these up once and save the project as a template for every episode.

| Track | Name | What goes on it |
|---|---|---|
| A1 | **VO** | Your narration (the cleaned voice) |
| A2 | **VO fixes** | Pickups and re-recorded lines |
| A3 | **MUSIC A** | Music cues (odd-numbered cues) |
| A4 | **MUSIC B** | Music cues (even-numbered), so you can crossfade between A3 and A4 |
| A5 | **AMB** | Room tones and ambiences |
| A6 | **SFX HARD** | Impacts, booms, glitches, whooshes, risers |
| A7 | **SFX SOFT** | UI ticks, clicks, typing, pins, pings |
| A8 | **FOLEY** | Footsteps, paper, stamps, car, chips, printer |
| A9 | **STING** | Logo sting and the end-screen music |

Route them into three buses:
- **Dialogue bus:** A1, A2
- **Music bus:** A3, A4, A9
- **Effects bus:** A5, A6, A7, A8

Then everything goes to the **Master**, which has a limiter as its last effect.

### Target levels

| What | Peak on the meter | Rule of thumb |
|---|---|---|
| Voice | −6 to −3 dBFS | Normalised to about −16 LUFS on its own |
| Music **under** the voice | −30 to −24 dBFS | You hear it only when you listen for it |
| Music **between** lines / no voice | −20 to −14 dBFS | Rise up within 0.3 s of the voice ending; dip back 0.2 s before it starts |
| Room tone / ambience | −42 to −32 dBFS | Felt more than heard |
| Soft UI ticks, clicks, pings | −30 to −22 dBFS | Like a tap on the glass |
| Whooshes, swishes, flips | −22 to −14 dBFS | Never louder than the voice |
| Impacts, booms, hard glitches | −12 to −6 dBFS | Short, with the voice dipped if they overlap |
| Logo sting, end-screen music | −10 to −6 dBFS | The loudest music moment |
| **Whole programme** | **−14 LUFS integrated, true peak −1 dBTP** | YouTube's playback level |

### Ducking (music dips under the voice)

Pick one method:

- **Keyframes (most reliable).** On the music track, put a −8 dB dip under every voice phrase, with about 0.2 s ramp down before the phrase and 0.4–0.6 s ramp up after it. Tedious but perfect.
- **Automatic ducking.** Premiere: Essential Sound → tag the music as Music → Ducking, duck against Dialogue, reduce about −8 to −10 dB, fades about 800 ms. DaVinci Resolve: put a compressor on the Music bus with its sidechain fed from the Dialogue bus (ratio 4:1, attack about 20 ms, release about 500 ms, threshold set for 6–8 dB of reduction). Check the result by ear; automatic ducking sometimes pumps.

### EQ that keeps the voice clear

- **Music bus:** cut 3 dB around 2.5–4 kHz (a wide bell). That's where speech clarity lives; this single move makes the voice cut through without turning the music down further.
- **Music and effects buses:** high-pass at 30 Hz to remove rumble you can't hear but that eats loudness. Leave the deep "boom" effects their low end by putting them on A6 and high-passing A6 at 25 Hz instead.
- **Voice:** high-pass at 80 Hz. Nothing else unless [section 10](#10-your-voice) says so.

### Reverb

Put one short reverb (a "room" or "small hall", 0.8–1.2 s decay) on an aux send. Send a little of these to it so they sit in the same space: the glitch hits, the Jupiter ping, the impacts and the logo sting. Never put reverb on the voice.

---

## 6. Music plan: nine cues for the whole episode

Nine cues, but only **four to five different tracks**: several cues reuse the same track (that's deliberate, it gives the episode a theme). Save the tracks as `MUS-M01.wav`, etc.

### M01 · "Night Shift" (main theme)

- **Where:** Cold open L01 → L08 (≈ 00:00–01:20). Comes back in Act 3 (M04) and at L105.
- **Brief:** Dark, minimal, electronic. A sustained low drone, a soft pulsing bass note or muted kick at a heartbeat pace, maybe a quiet ticking hi-hat. **No melody, no drums kit, no vocals.** Should feel like a server room at night.
- **Tempo:** 85–100 BPM. **Key:** minor (D minor or E minor works well with voice).
- **Must have:** a track with a long build (riser) section somewhere, which you can use at L07.
- **Search:** `dark minimal tension` · `cyber suspense pulse` · `investigation drone` · `hacker ambient` · `dark electronic underscore`
  - Epidemic: genre *Drone* or *Dark Ambient*, mood *Suspense* / *Mysterious*
  - YouTube Audio Library: genre *Cinematic* or *Ambient*, mood *Dark*
- **Avoid:** anything with a clear melody, "epic" brass, dubstep drops, lo-fi beats.

### M02 · "How It Works"

- **Where:** Act 1, L10 → L18 (≈ 01:28–02:45).
- **Brief:** Curious and clean. Soft plucks or felt piano over a light pad, a gentle steady pulse. Slightly cold. This is the "let me explain SWIFT" music: think documentary explainer, not thriller.
- **Tempo:** 95–110 BPM. Minor or modal, but not gloomy.
- **Search:** `curious documentary` · `minimal explainer pulse` · `tech investigation light` · `thoughtful electronic plucks`
- **Avoid:** happy corporate "ukulele" music, inspirational piano.

### M03 · "The Infection" (a build)

- **Where:** Act 1, L20 → L22 (≈ 02:55–03:35).
- **Brief:** A pulsing arpeggio that gets busier and brighter over 30–40 seconds, as the red spreads through the network. Has to end in a way you can **cut to silence** cleanly.
- **Tempo:** 110–130 BPM.
- **Search:** `tension build arpeggio` · `rising cyber pulse` · `suspense build electronic`
- **Shortcut:** you can use the build section of M01 instead, which keeps the palette tight.

### M04 · "The Plan" (procedural ostinato)

- **Where:** Act 2, L24 → L39 (≈ 04:01–06:46).
- **Brief:** Methodical, clever, forward-moving. A repeating string or synth figure (ostinato), pizzicato or muted plucks, light ticking percussion. The feeling of someone ticking boxes on a plan. A "heist planning" cue, but restrained.
- **Tempo:** 105–120 BPM.
- **Must have:** a calmer passage (for L30–L31) and a building passage (for L33–L38).
- **Search:** `heist planning suspense` · `methodical ostinato` · `clockwork tension` · `thriller pizzicato underscore` · `spy procedural`
- **Avoid:** comedic heist music (swing, jazz, Ocean's Eleven style).

### M05 · "The Night" (the big set piece)

- **Where:** Act 3, L41 → L62 (≈ 06:55–10:43). Use **M01 again** for the first half, then a stronger track from L48.
- **Brief:** From L41: the M01 theme, low. From L48: a heavier thriller cue with pulse, low percussion and tension strings or synths: the most intense music in the video. Must have breaks or drops you can cut at (L49, L52).
- **Tempo:** 100–120 BPM (or half-time feel).
- **Search:** `dark thriller pulse` · `cyber attack tension` · `intense suspense underscore` · `ticking thriller`
- **Avoid:** trailer "braams" every 4 seconds, which get tiring under narration.

### M06 · "The Weekend" (lonely, then urgent)

- **Where:** Act 4, L63 → L80 (≈ 10:43–13:44).
- **Brief:** Starts lonely and cold: sparse piano notes, a high thin pad, lots of space. From L73 the urgency rises: add a ticking pulse or a second track that drives harder.
- **Tempo:** 60–75 BPM to start. The second half can be 110+ BPM or the same tempo with denser rhythm.
- **Search:** `lonely piano dark ambient` · `cold sparse piano` · `waiting suspense`; second half `urgent ticking tension` · `race against time underscore`

### M07 · "Chips" (noir)

- **Where:** Act 5, L81 → L89 (≈ 13:44–15:45).
- **Brief:** Smoky, slippery, slightly glamorous but dangerous. Deep bass (upright or synth), soft brushed percussion or a slow beat, a muted guitar or Rhodes piano. Money disappearing into a casino.
- **Tempo:** 80–95 BPM.
- **Search:** `dark noir underscore` · `smoky crime jazz minimal` · `neo noir bass` · `casino suspense`
- **Avoid:** upbeat lounge jazz, Vegas-style swing.

### M08 · "Lazarus" (investigative build into sombre)

- **Where:** Act 6, L90 → L98 (≈ 15:45–17:30).
- **Brief:** Investigative and cyber. Steady pulsing synths that build towards L94 (LAZARUS), then turn heavier and slower for the DOJ and FBI evidence (L95–96). At L97–98 it should be able to fade to a single low drone.
- **Tempo:** 100–120 BPM, with a slower ending.
- **Search:** `cyber investigation build` · `dark revelation` · `state hackers suspense` · `ominous electronic`

### M09 · "Ten Years" (reflective) and the outro

- **Where:** Act 7, L100 → L108 (≈ 17:46–19:40). Outro L110 → L112.
- **Brief (Act 7):** Melancholy and unresolved. Slow piano with a soft string pad, or a felt-piano and cello duet. Space between notes. Unanswered-question feeling.
- **Tempo:** 65–80 BPM.
- **Brief (outro, L110–112):** A little warmer and lighter, still the channel sound. 20–30 s that can loop under the end screen and finish cleanly.
- **Search:** `melancholic piano documentary` · `reflective ambient strings` · `unresolved sad piano`; outro `warm minimal outro` · `hopeful dark ambient`

### Where music stops completely

These are as important as the cues themselves. At each one, cut **all** music (a hard cut or a 0.1 s fade), keep only room tone:

| Line | Moment | How long |
|---|---|---|
| L04 | Hard cut to the morning printer room | The whole shot (room tone and the error beep only) |
| L06 | "It wasn't." | 1 second, then the low hit on "only witness" |
| L19 | "Rasel Ahlam did not exist." | From 0.3 s before the line until the L20 click |
| L22 | The network freezes at SWIFT | Until "They waited for about a year" ends; only the clock ticks |
| L39 | After "That's planned." | 1 second of silence, then the Act 3 card |
| L40 | Back in the room, Thursday night | The whole shot (room hum and clock only) |
| L49 | "...the Fed initially rejected the requests." | Drop the music on "rejected", hold silence through L49 |
| L52 | The pause before "And this time..." | 1–1.5 seconds of total silence |
| L69 | "It was. The hackers had changed it." | The whole line |
| L85 | "And here's the part that should make you angry." | Music drops on "angry", returns on "As far as the casinos..." |
| L99 | The North Korea line | Near silence: one low drone at −34 dB, nothing else |
| L109 | After the page slides out | 2 seconds of complete silence before L110 |

---

## 7. Sound library: every file to collect

Collect these once and reuse them for every episode. Name the files exactly as the ID (for example `SFX-UI-03_soft-tick.wav`) and keep them in `Unfiction/sound-library/`.

### Ambiences and room tones (`AMB`)

| ID | Sound | Search terms / how to get it | Used at |
|---|---|---|---|
| AMB-01 | **Office at night:** low air-conditioning hum, very distant city | `office night room tone` · `hvac hum` · `empty office ambience` | L01, L40, L41–L48 Blender shots |
| AMB-02 | **Fluorescent hum:** thin mains buzz, cold | `fluorescent light hum` · `electrical buzz room` | L04, L47, L63–L68, L109 |
| AMB-03 | **Dhaka at night from above:** distant traffic, faint horns, wind | `city night distant traffic` · `asian city night horns distant` | L10 |
| AMB-04 | **Busy street by day:** traffic, motorbikes, horns, people | `city street traffic day asia` · `busy street ambience` | L25 |
| AMB-05 | **Bank branch interior:** murmur, a counter bell, shuffling | `bank lobby ambience` · `office reception murmur` | L26 |
| AMB-06 | **Casino floor:** muffled crowd, distant slot-machine chimes, chips | `casino ambience` · `casino floor crowd` | L83 |
| AMB-07 | **Private gaming room:** quiet murmur, cards, chips, low air | `card room ambience` · `quiet casino room` | L84 |
| AMB-08 | **Night car park:** distant traffic, a hum, hard reverb | `parking garage night ambience` · `car park room tone` | L78 |
| AMB-09 | **Airfield:** distant jet idle, wind across tarmac | `airport apron ambience` · `jet idle distant` | L86 (scene 29) |
| AMB-10 | **Space / void tone:** very low airy drone | `space ambience low drone` · `dark void ambience` | L98 (scene 36) |
| AMB-11 | **Room tone of your own recording room** | Record 30 s of silence in your room, with the mic where it was | Fill every gap in the voice track |

### Foley and props (`SFX-FOL`)

| ID | Sound | Search terms / how to get it | Used at |
|---|---|---|---|
| SFX-FOL-01 | Single keyboard keys, slow, office keyboard | Record yourself, or `keyboard typing slow` | L01, L16 |
| SFX-FOL-02 | Rapid typing burst, 3–6 s | Record yourself typing fast | L48 |
| SFX-FOL-03 | Mouse click | Record your own mouse | L20 |
| SFX-FOL-04 | Footsteps, shoes on hard office floor | `footsteps office floor shoes` | L04, L63, L64 |
| SFX-FOL-05 | **Printer error beep** (one short electronic beep) | `printer beep` · `device error beep short` | L04, L64 (motif A) |
| SFX-FOL-06 | **Printer stall:** motor starts, paper feeds a few cm, stops | `printer jam` · `printer feed stop` | L47 (motif A) |
| SFX-FOL-07 | **Printer whir and page sliding out** | `printer printing page` · `laser printer single page` | L109 (motif A) |
| SFX-FOL-08 | Fast printing of many pages | `printer printing multiple pages` | L70 (scene 23) |
| SFX-FOL-09 | Plastic button presses (printer panel) | Record yourself pressing a printer or remote | L64 |
| SFX-FOL-10 | Paper envelope whoosh and flutter | `paper flutter whoosh` · `envelope swish` | L13, L48, L50, L51, L56 |
| SFX-FOL-11 | Wax seal glow / magical shimmer (subtle) | `shimmer glow subtle` · `ui sparkle soft` | L14 |
| SFX-FOL-12 | Heavy vault door opening | `vault door open heavy metal` | L13 |
| SFX-FOL-13 | Card sliding across a desk | Record a card sliding on a table | L28 (four times) |
| SFX-FOL-14 | **Rubber stamp thump** (with a slight wooden knock) | Record a stamp or a fist with a book on a table, or `rubber stamp` | L28, L50, L51 |
| SFX-FOL-15 | Padlock snap shut (several variations) | `padlock close` · `lock click metal` | L56 |
| SFX-FOL-16 | Car boot opens, bags thud in, boot shuts | `car trunk open close` · `heavy bag drop` | L78 |
| SFX-FOL-17 | Casino chips: clatter, stack slide, single chip toss | `poker chips` · `casino chips stack` | L07 (scene 3), L83, L84 |
| SFX-FOL-18 | Cards dealt and flipped | `cards dealing` · `card flip` | L84 |
| SFX-FOL-19 | Fabric shrug / chair creak | `cloth movement` · `office chair creak` | L04, L67 |
| SFX-FOL-20 | Marker drawing a circle (felt-tip squeak) | Record a marker on paper | L07 (scene 3 typo circle), L59 |
| SFX-FOL-21 | PC restart: fan spins down, short beep, fans spin up | `computer boot` · `pc fan startup` | L67 |
| SFX-FOL-22 | Fax handshake screech (2–3 s) | `fax machine` (Freesound has CC0 ones) | L71 (scene 24) |
| SFX-FOL-23 | Phone ringing out, international ring tone, 2 rings | `phone ringing tone international` | L71 (scene 24) |
| SFX-FOL-24 | Email "sent" swoosh | `email send whoosh` · `ui swoosh send` | L71 (scene 24) |
| SFX-FOL-25 | Jet engine spool-up, roll and take-off past the camera to the right | `private jet takeoff` · `jet pass by` | L86 (scene 29) |
| SFX-FOL-26 | Metal airstair footsteps (4–5 steps) | `metal stairs footsteps` | L86 (scene 29) |
| SFX-FOL-27 | Jet door closing (heavy thunk) | `airplane door close` · `heavy door thunk` | L86 (scene 29) |
| SFX-FOL-28 | Typewriter clacks, a loop of several seconds | `typewriter typing` | L05, L55, L65 (quote cards) |
| SFX-FOL-29 | Paper card sliding onto a desk | `paper slide on table` | Every desk card (scenes 2, 13, 19, 26, 30, 39, 40, 42, 44) |

### Interface and graphics sounds (`SFX-UI`)

| ID | Sound | Search terms | Used at |
|---|---|---|---|
| SFX-UI-01 | **Soft tick**: tiny clean digital tick | `ui tick soft` · `interface click subtle` | Small accents, row arrivals, pins |
| SFX-UI-02 | **UI ping**: brighter, short, pitched | `ui notification ping` · `interface blip` | Highlights, labels landing |
| SFX-UI-03 | **Marker swipe**: a short felt-tip "fssht" | Record it, or `marker highlight swipe` | Every highlight on a card |
| SFX-UI-04 | **Email notification chime** (generic, not Outlook or Gmail) | `notification chime soft` | L16 (scene 6), L17 |
| SFX-UI-05 | **Generic error chime** (low two-note "dun-dun", not Windows) | `error chime` · `system error tone` | L68 |
| SFX-UI-06 | **Digital counter ticker**: fast rolling digits, 1–3 s | `counter ticking digital` · `numbers rolling` | L02 (scene 1), L48, L107 (scene 44) |
| SFX-UI-07 | **Map pin drop**: soft thud plus a click | `map pin drop` · `ui drop thud` | Map pins (scenes 5, 10, 12, 20, 31) |
| SFX-UI-08 | **Line draw swish**: short airy rising whoosh, 0.5–1.5 s | `ui swish` · `line draw whoosh soft` | Arcs and arrows on maps and flow charts |
| SFX-UI-09 | **Whoosh** (fast, 0.3–0.5 s) | `fast whoosh` · `swoosh transition` | Camera moves, flash cuts, cards flying |
| SFX-UI-10 | **Data glitch burst** (hard, 0.2–0.4 s, digital crunch) | `glitch hit` · `digital glitch burst` | Every hard GLITCH cue; motif D |
| SFX-UI-11 | **Glitch swish** (medium, 0.2–0.3 s, lighter than UI-10) | `glitch transition` · `digital swish short` | Medium GLITCH cues, transitions in and out of act cards |
| SFX-UI-12 | **Sub boom / impact** (deep, 1–2 s tail) | `cinematic boom` · `sub drop impact` · `low hit` | IMPACT cues, the counter freeze |
| SFX-UI-13 | **Tension riser** (4–8 s, ends on a cut) | `riser tension` · `reverse riser` | L07 (scene 3), L16 (scene 16 push), L21 |
| SFX-UI-14 | **Soft low hit** (muffled thud, no boom tail) | `soft impact` · `muffled hit` | HIT cues, the "no reply" crosses |
| SFX-UI-15 | **Split-flap / calendar flip** ratchet (a fast flapping run) | `split flap display` · `paper pages flipping fast` | L16 (scene 6), L100 (scene 38) |
| SFX-UI-16 | **Clock spin ratchet**: mechanical hands spinning | `clock hands spinning` · `clock winding` | L34 (scene 14) |
| SFX-UI-17 | **Clock tick**: soft mechanical tick, single (you repeat it) | `clock tick single` | Motif B |
| SFX-UI-18 | **Denied / no-reply buzz**: short low digital "bzzt" | `ui error buzz` · `access denied` | L71 (scene 24) |
| SFX-UI-19 | **Erase sweep**: a digital scrub or zap, 0.3 s | `digital erase` · `ui delete sweep` · `glitch scrub` | L46 (scene 17), five times |
| SFX-UI-20 | **Jupiter ping**: single resonant sonar ping or soft metallic bell, 3–4 s tail | `sonar ping` · `resonant ping` · `bell hit reverb` | Motif C |
| SFX-UI-21 | **Lock / padlock digital click** | `lock click ui` | L56 alternative, card status badges |
| SFX-UI-22 | **Heartbeat-like low pulse** (optional, single thump) | `low pulse thump` | L32, L105 (under the voice, very low) |
| SFX-UI-23 | **Paper stamp slam** (bigger than FOL-14, for graphics) | `stamp slam` | Status badges landing (optional) |
| SFX-UI-24 | **Scramble / data chatter**: fast digital chirps, 1 s | `data processing chirp` · `computer data sounds` | Time chips in `overlays.html`, the EndScreen channel name |
| SFX-UI-25 | **Shimmer glow** (soft rising sparkle, 1–2 s) | `shimmer rise soft` | L98 lights switching on (scene 36), L14 |

### Logo sting (`STING`)

| ID | Sound | How to get it | Used at |
|---|---|---|---|
| STING-01 | **The Unfiction intro sound** | `Intro/unfiction-intro.html` plays its own built-in sound, but the page can't save audio. Capture it with **OBS**: add it as a Browser Source with *Control audio via OBS* ticked, record, then press play. Keep the audio as WAV. | L09 |
| STING-02 | **Short end sting**: the last 2 seconds of STING-01 (the logo hit and tail) | Cut it from STING-01 | L112 |

---

## 8. Line-by-line cue sheet, L01 to L112

How each entry reads:

- **Music** is what the music does on this line.
- **Amb** is the ambience track.
- **SFX** lists every effect, with exact times for graphics files.
- **Note** covers anything about levels or feel.

Lines marked `ME` are you on camera; keep them simple: music under, nothing else, unless stated.

---

### COLD OPEN · ≈ 00:00–01:28

**L01** · `ANIM` · The empty SWIFT room at night, cursor moving by itself
- **Music:** none for the first 2 seconds. M01 fades in from silence under the voice, starting on "A cursor starts to move", at −30 dB.
- **Amb:** AMB-01 office night at −36 dB from frame 1. **Never start on digital silence.**
- **SFX:**
  - `SFX-UI-17` clock tick, once a second, very quiet (−34 dB). Motif B starts.
  - `SFX-FOL-01` two or three single key clicks scattered across the shot (−30 dB), as if someone is typing somewhere you can't see.
  - `SFX-UI-11` glitch swish, very quiet (−30 dB), on the cursor's first movement. Motif D starts.
- **Note:** your first word within 2 seconds, as the script says. The tick should stop at the end of the shot.

**L02** · `GFX` · scene 1, `ep01-01-cold-open-951m.mp4` · The $951,000,000 counter
- **Music:** M01 cuts out completely 0.2 s before the freeze, then returns 1 s after it.
- **SFX:**
  - file 0.55 s → 1.43 s: `SFX-UI-06` digital counter ticker, rising in pitch (−22 dB).
  - **file 1.43 s:** `SFX-UI-12` sub boom, the counter freeze (−8 dB). Script: "low bass hit".
  - file 2.45 s: `SFX-UI-01` soft tick as the label appears (−30 dB).
- **Note:** the boom lands **between** "Nine hundred and fifty-one million dollars" and "Almost everything...". Leave a 0.4 s gap in your voice there.

**L03** · `ME` · "And most of it was stopped..."
- **Music:** M01 low drone only, −32 dB.
- **SFX:** `SFX-UI-20` Jupiter ping on "the name of a planet", at −28 dB, letting it ring into L04. The motif's first appearance; almost subliminal.

**L04** · `ANIM` · Hard cut to the morning printer room
- **Music:** **none** (silence point).
- **Amb:** AMB-02 fluorescent hum starts **on the cut**, −34 dB. The jump from warm night hum to cold buzz is the effect.
- **SFX:**
  - `SFX-FOL-05` printer error beep, once, on the cut or 0.3 s after it (−18 dB). Motif A starts. Script: "single error beep".
  - `SFX-FOL-04` footsteps as the figure walks in (−26 dB).
  - `SFX-FOL-19` fabric movement on the shrug (−30 dB).
  - Optional: a second, quieter printer beep as the figure looks at the tray.

**L05** · `CARD` · scene 2, `ep01-02-police-quote.mp4` · The police statement typed in
- **Music:** M01 back in, very low (−30 dB); just the pulse.
- **SFX:**
  - file 0.45 s: `SFX-FOL-29` paper card sliding onto the desk (−26 dB).
  - file 1.55 s → 4.6 s: `SFX-FOL-28` typewriter loop under the typing (−30 dB). Don't sync every letter; a steady loop at low level is enough.
  - file 5.05 s: `SFX-UI-03` marker swipe on the highlight "a common problem" (−24 dB).
- **Note:** your quote reading should overlap the typing. If the typing sound fights your voice, drop it to −34 dB.

**L06** · `ME` · "It wasn't. That printer was the only witness."
- **Music:** cut to silence on "It wasn't." (silence point). On "only witness", `SFX-UI-12` sub boom at −14 dB (softer than L02) and M01 comes back.

**L07** · `GFX` · scene 3, `ep01-03-flash-cuts.mp4` · Sign, typo, chips, wanted poster
- **Music:** M01's build/riser section, or `SFX-UI-13` riser from file 0.2 s to 3.6 s, rising.
- **SFX:**
  - **file 0.45 s:** `SFX-UI-10` glitch burst (−12 dB) plus `SFX-UI-20` Jupiter ping (−26 dB) on the "JUPITER ST" sign.
  - **file 1.55 s:** `SFX-UI-10` glitch burst (−12 dB) on the typo. File 1.7 s → 2.3 s: `SFX-FOL-20` marker drawing the circle (−24 dB).
  - **file 2.75 s:** `SFX-UI-10` glitch burst (−12 dB) plus `SFX-FOL-17` chips clatter (−18 dB).
  - **file 3.65 s:** `SFX-UI-10` glitch burst (−10 dB) plus `SFX-UI-12` sub boom (−10 dB) on the wanted poster. The riser ends exactly here.
  - file 3.65 s → 7.7 s: hold a low drone (the M01 tail). No more effects while the poster zooms.
  - **file 7.95 s:** `SFX-UI-11` glitch swish out (−18 dB).
- **Note:** each cut matches one phrase: "A street sign." / "A spelling mistake." / "Casinos." / "And a hacker...". Cut your voice to fit these times, or retime the scene's `B` values to your voice.

**L08** · `ME` · "I'm going to show you exactly how they did it..."
- **Music:** M01 continues, slowly building over the line (−28 → −24 dB). Build towards the sting.
- **SFX:** none.

**L09** · `GFX` · Logo sting
- **Music:** M01 ends on a clean cut 0.1 s before the sting.
- **STING-01:** the Unfiction intro audio, at −8 dB peak.
- **Note:** if the 7-second intro feels too long right after the flash cuts, start it from its black frame (3.13 s into the intro), which leaves about 3.8 s: the logo hit, the sweep and the tagline.

---

### ACT 1 · THE VAULT WITH NO WALLS · ≈ 01:28–04:01

**Act card** · scene 4, `ep01-04-act-1.mp4`
- file 0.25 s: `SFX-UI-11` glitch swish in (−18 dB).
- file 0.65 s: `SFX-UI-12` sub boom, light (−16 dB), as the title lands.
- file 4.95 s: `SFX-UI-11` glitch swish out (−20 dB).
- **Music:** M02 starts under the card at file 1.0 s, rising from silence.
- *All seven act cards (scenes 4, 9, 15, 22, 27, 32, 37) use exactly this pattern at exactly these times. Do it once and copy it.*

**L10** · `ANIM` · Dhaka at night, camera glides to the bank
- **Music:** M02 under the voice, −28 dB.
- **Amb:** AMB-03 Dhaka night from above, −34 dB, fading out as the camera reaches the building.
- **SFX:** `SFX-UI-09` very soft whoosh (−30 dB) on the glide's start.

**L11** · `GFX` · scene 5, `ep01-05-reserves-new-york.mp4` · Dhaka → New York, vault icon
- **Music:** M02 continues.
- **SFX:**
  - file 0.25 s → 1.65 s: the map reveals; `SFX-UI-09` soft whoosh (−28 dB).
  - file 1.15 s: `SFX-UI-07` pin drop on Dhaka (−24 dB).
  - file 2.45 s: `SFX-UI-08` line-draw swish as the arc crosses to New York (−24 dB), lasting about 1.3 s.
  - file 4.05 s: `SFX-UI-07` pin drop plus `SFX-UI-02` ping on the Fed vault label (−22 dB).

**L12** · `ME` · "So here's the first question..."
- **Music:** M02, −28 dB. Nothing else.

**L13** · `ANIM` · The sealed envelope flies from Dhaka to the New York vault
- **Music:** M02.
- **SFX:**
  - `SFX-FOL-10` envelope whoosh as it flies (−22 dB).
  - `SFX-FOL-12` vault door opening (−20 dB) when the vault opens.
  - Optional: a soft money rustle (`paper money flutter`) as money moves (−28 dB).

**L14** · `ANIM` · The seal glows green, "AUTHENTIC"
- **SFX:** `SFX-FOL-11` shimmer as the seal glows (−24 dB). `SFX-UI-02` ping when the "AUTHENTIC" tag appears (−24 dB).

**L15** · `ME` · Slower: "...They just need to sit at the right computer in Dhaka and write the letter."
- **Music:** M02 thins to its pad only (or dip it a further 4 dB). Slower line, thinner music.

**L16** · `GFX` · scene 6, `ep01-06-roll-back.mp4` · Calendar flips back to January 2015
- **Music:** M02 continues; a slight lift in energy helps "where this story really begins".
- **SFX:**
  - file 0.45 s: `SFX-FOL-29` soft card arrival (−28 dB).
  - **file 1.65 s → 3.45 s:** `SFX-UI-15` split-flap run. It must speed up and then slow down, matching the flip. If your file is a constant-speed run, fade it in and out at its ends.
  - **file 3.45 s:** `SFX-UI-12` light boom (−14 dB) as January 2015 lands (IMPACT).
  - file 3.65 s: `SFX-UI-01` soft tick as the caption appears (−30 dB).
  - **file 4.85 s:** `SFX-UI-04` email notification chime as "1 NEW MESSAGE" pops in (−20 dB).
  - Script also asks for **soft keyboard clicks**: put `SFX-FOL-01` (3–4 keys, −30 dB) under the second half of the shot, after the chime.

**L17** · `ANIM` · Employee at a desk, an email notification pops up
- **Music:** M02.
- **Amb:** AMB-01, −38 dB.
- **SFX:** `SFX-UI-04` the same notification chime when it pops up on the monitor (−22 dB). Use the same file as L16 so it feels like the same email arriving.

**L18** · `GFX` · scene 7, `ep01-07-cv-email.mp4` · The recreated Rasel Ahlam email
- **Music:** M02, dip it a little more (−30 dB); the email text is busy.
- **SFX:**
  - file 0.55 s: `SFX-UI-09` very soft whoosh as the email window opens (−28 dB).
  - file 1.55 s → about 5.3 s: `SFX-FOL-01` soft typing loop under the typed body (−32 dB).
  - **file 6.85 s:** `SFX-FOL-03` mouse click on the link (−20 dB), plus `SFX-UI-11` glitch swish (−22 dB) right after it.

**L19** · `ME` · "Rasel Ahlam did not exist."
- **Music:** **silence point.** Fade M02 out over 0.3 s **before** the line. Room tone only.
- **SFX:** none. Let it sit for a full second after you finish.

**L20** · `ANIM` · Click "Download", progress bar, the screen flickers
- **Music:** M03 (or the M01 build) starts here, very low (−32 dB), rising from nothing.
- **SFX:**
  - `SFX-FOL-03` mouse click on "Download" (−20 dB). Script: "a click".
  - `SFX-UI-01` 4–6 tiny ticks as the progress bar fills (−32 dB).
  - `SFX-UI-10` glitch burst on the one-frame flicker (−18 dB). Script: "a faint distorted glitch", so keep it faint.

**L21–L22** · `GFX` · scene 8, `ep01-08-network-spread.mp4` · The infection spreads to SWIFT, then waits
- **Music:** M03 builds from file 1.75 s to file 10.98 s, getting busier. **At file 10.98 s it cuts to silence** (hard cut).
- **SFX:**
  - file 0.55 s: `SFX-UI-09` soft whoosh as the network appears (−28 dB).
  - **file 1.95 s:** `SFX-UI-02` ping, slightly detuned or distorted, as the first PC turns red (−20 dB).
  - From about 2.75 s, roughly once a second until 10.98 s: `SFX-UI-01` soft tick each time a machine turns red, pitching each one slightly higher if your editor can (−28 dB). That's about eight ticks, one per hop.
  - **file 10.98 s:** `SFX-UI-10` glitch burst (−10 dB) plus `SFX-UI-12` sub boom (−12 dB), as red reaches SWIFT and everything freezes.
  - file 11.5 s → end: `SFX-UI-17` clock tick, one per second (−26 dB), under "Waiting… 12 months". Motif B.
  - Under the wait, a single sustained low tone (from M01 or AMB-10) at −34 dB.
- **Note:** your line "And then they did something strange. They stopped." should land just after the freeze.

**L23** · `ME` · Mid-video hook: "Why would thieves sit inside a bank for a year...?"
- **Music:** M01 drone returns at −30 dB under the question, building slightly into "where a billion dollars could go...".
- **SFX:** none.

---

### ACT 2 · BUILDING THE ESCAPE ROUTE · ≈ 04:01–06:46

**Act card** · scene 9, `ep01-09-act-2.mp4` · Same pattern as the Act 1 card (glitch in 0.25 s, light boom 0.65 s, glitch out 4.95 s).
- **Music:** M04 starts at file 1.0 s.

**L24** · `GFX` · scene 10, `ep01-10-to-manila.mp4` · Map from Dhaka to Manila, pin on Makati
- **Music:** M04, −28 dB.
- **SFX:**
  - file 0.85 s: `SFX-UI-07` pin drop on Dhaka (−26 dB).
  - file 2.05 s → 4.45 s: `SFX-UI-08` line-draw swish plus a slow `SFX-UI-09` whoosh for the map pan (−26 dB).
  - **file 4.25 s:** `SFX-UI-07` pin drop on Makati (−20 dB), louder than the first.

**L25** · `ANIM` · Busy Makati street, "JUPITER ST" sign, the bank branch
- **Music:** M04, −30 dB.
- **Amb:** AMB-04 street by day at −30 dB, **louder than other ambiences**: this is the only busy daytime exterior.
- **SFX:** `SFX-UI-20` Jupiter ping at −28 dB the moment the sign is clearly in frame. Motif C, quietly planted.

**L26** · `ANIM` · Inside the branch, four customers in line
- **Amb:** AMB-05 bank interior, −32 dB. Cross-fade from AMB-04 over 0.5 s at the cut.
- **SFX:** optional single counter bell ("ding") at −28 dB as the shot opens.
- **Note:** you read four names here. Keep the music steady and low; no hits on the names.

**L27** · `CARD` · scene 11, `ep01-11-four-accounts.mp4` · Four accounts, $500 each
- **SFX:**
  - file 0.85 s: `SFX-UI-09` soft whoosh as the panel arrives (−28 dB).
  - file 1.25 s, 2.45 s, 3.65 s, 4.85 s: `SFX-UI-01` soft tick as each account row lands (−26 dB).
  - On "500 dollars" or the highlight: `SFX-UI-03` marker swipe (−24 dB).
- **Music:** on "For nine months, the accounts just sat there": dip M04 by 4 dB and let it hang.

**L28** · `ANIM` · Four ID cards slide across a desk, each stamped FAKE
- **Music:** M04.
- **SFX:** for each of the four cards: `SFX-FOL-13` card slide (−24 dB), then `SFX-FOL-14` stamp thump (−14 dB). Four identical thumps make a rhythm; keep them on the beat of the music if you can.

**L29** · `ME` · "Four strangers. Same title, same salary..."
- **Music:** M04, then on "And nobody asked a single question." stop the music for 1 beat, back in on "Remember the name...".

**L30** · `GFX` · scene 12, `ep01-12-shalika.mp4` · Second pin in Colombo
- **Music:** M04's calmer passage.
- **SFX:**
  - file 0.65 s: `SFX-UI-07` pins appear (−26 dB).
  - file 1.45 s: `SFX-UI-08` line-draw swish (−26 dB).
  - **file 2.45 s:** `SFX-UI-07` pin drop on Colombo plus `SFX-UI-02` ping on the "Shalika Foundation" label (−22 dB).

**L31** · `CARD` · scene 13, `ep01-13-shalika-founder.mp4` · The founder's statement
- **Music:** M04 calm, −30 dB.
- **SFX:**
  - file 0.45 s: `SFX-FOL-29` card slide (−26 dB).
  - **file 2.07 s → 2.77 s:** `SFX-UI-03` marker swipe on "a legitimate donation" (−22 dB). The swipe sound starts when the highlight starts sweeping and ends as it completes.

**L32** · `ME` · Lower voice: "Now, the routes were ready..."
- **Music:** strip M04 down to its lowest layer, or switch to M01's drone. Optional `SFX-UI-22` single low pulse at −30 dB on "They needed time."
- **Note:** this is the "genius" moment. The music getting smaller makes it feel bigger.

**L33–L38** · `GFX` · scene 14, `ep01-14-five-day-window.mp4` · Three clocks and the five-day window (31 s)
- **Music:** M04's building passage, rising slowly across the whole scene. Under it, motif B: `SFX-UI-17` clock tick, one per second, at −30 dB, getting very slightly louder each time a new country's weekend lights up.
- **SFX:**
  - file 0.65 s: `SFX-UI-09` soft whoosh as the clocks appear (−26 dB).
  - **file 4.65 s → 7.05 s:** `SFX-UI-16` clock-spin ratchet as the hands spin to 20:36 / 09:36 / 22:36 (−22 dB).
  - file 7.45 s: `SFX-UI-01` soft ticks as the moon and sun notes appear (−28 dB).
  - **file 11.25 s:** `SFX-UI-02` ping as the Dhaka weekend lights up (−22 dB). L35.
  - **file 15.25 s:** `SFX-UI-02` ping, a little higher or louder, for the New York weekend (−20 dB). L36.
  - **file 19.25 s:** `SFX-UI-02` ping plus `SFX-UI-14` soft hit for the Manila holiday turning red (−18 dB). L37.
  - file 24.25 s → 25.40 s: `SFX-UI-13` short riser as the days merge.
  - **file 25.40 s:** `SFX-UI-12` boom (−10 dB) as the glowing "≈ 5 DAYS" bar lands. The clock ticks stop here.
- **Note:** this is the cleverest idea in the episode; the sound should make it feel like a lock clicking into place.

**L39** · `ME` · "That's not a lucky hack. That's planned."
- **Music:** M04 ends **on** "planned" (a hard stop, or the track's natural ending). Then 1 second of silence (silence point) before the Act 3 card.

---

### ACT 3 · THE NIGHT OF THE HEIST · ≈ 06:46–10:43

**Act card** · scene 15, `ep01-15-act-3.mp4` · Same act-card pattern. Make the boom at file 0.65 s **a little bigger** (−12 dB): this is the main act.
- **Music:** none; the next shot is a silence point.

**L40** · `ANIM` · Back in the room: Thursday 8:36 pm, cursor moves by itself
- **Music:** **none** (silence point). The callback works because it sounds exactly like L01.
- **Amb:** AMB-01 office night, the **same file at the same level** as L01 (−36 dB). Script: "air conditioning hum".
- **SFX:**
  - `SFX-UI-17` clock tick, one per second (−28 dB), a little louder than in L01. Script: "faint ticking clock".
  - `SFX-UI-11` glitch swish, quiet (−28 dB), on the cursor's first movement.
  - `overlays.html` time chip "8:36 PM · THURSDAY 4 FEB": `SFX-UI-24` scramble (−28 dB) as its digits resolve, 0.3–0.9 s into the overlay.

**L41** · `ME` · "But before they could send a single payment..."
- **Music:** M05 begins: the M01 theme, low (−30 dB).

**L42** · `EVID` · BAE Systems blog "Two bytes to $951m"
- **Music:** M05, −30 dB.
- **SFX:**
  - `SFX-UI-09` soft whoosh as the screenshot appears (−26 dB).
  - `SFX-UI-03` marker swipe as you highlight the author and date (−24 dB).

**L43–L44** · `GFX` · scene 16, `ep01-16-two-bytes.mp4` · The SWIFT block, the padlock, 75 04 → 90 90 (18 s)
- **Music:** M05 with more digital texture; dip to −32 dB under the technical explanation.
- **SFX:**
  - file 0.55 s: `SFX-UI-09` soft whoosh as the block appears (−26 dB).
  - file 3.25 s: `SFX-UI-09` whoosh for the zoom into memory (−22 dB).
  - **file 4.25 s:** `SFX-UI-12` light boom plus `SFX-UI-02` ping, the hard flash (−14 dB).
  - file 5.85 s: `SFX-UI-02` ping as the two bytes `75 04` highlight red (−20 dB).
  - **file 6.65 s → 11.0 s:** `SFX-UI-13` slow riser under the camera push (−24 dB rising to −18 dB).
  - **file 11.10 s:** `SFX-UI-10` glitch burst (−10 dB): the bytes morph to `90 90`. The riser ends exactly here.
  - file 11.85 s: `SFX-UI-01` soft tick as the caption "Conditional jump → Do nothing" appears (−28 dB).

**L45** · `ME` · Holds up two fingers: "Two bytes."
- **Music:** M05 low. On "Two bytes." a `SFX-UI-14` soft hit (−22 dB).

**L46** · `GFX` · scene 17, `ep01-17-deleted-records.mp4` · The ledger: rows arrive, five orders are erased (12 s)
- **Music:** M05, −30 dB.
- **SFX:**
  - file 0.55 s: `SFX-UI-09` soft whoosh as the ledger appears (−26 dB).
  - file 1.25 s, then every 0.38 s for 12 rows (1.25, 1.63, 2.01, 2.39, 2.77, 3.15, 3.53, 3.91, 4.29, 4.67, 5.05, 5.43): `SFX-UI-01` soft tick per row (−30 dB). That's fast: use a short, quiet tick so it reads as a ripple, not a machine gun.
  - **file 6.65 s, 7.25 s, 7.85 s, 8.45 s, 9.05 s:** each erase gets `SFX-UI-19` erase sweep (−18 dB) plus a quiet `SFX-UI-11` glitch (−24 dB). Five erases, five identical sounds.
  - After each erase, the balance recounts: a very short `SFX-UI-06` counter ticker burst (0.3 s, −30 dB), optional.
- **Note:** the erase sounds should feel like something being *deleted*, not exploded. Thin and digital.

**L47** · `ANIM` · The printer: a page starts to feed, stops, nothing comes out
- **Music:** M05 drops to its drone only.
- **Amb:** AMB-01, −36 dB.
- **SFX:** `SFX-FOL-06` printer stall (−18 dB). Motif A. Let the silence after the stall hang for half a second.

**L48** · `ANIM` · 35 envelopes fly into a grid; counter climbs to $951 million
- **Music:** M05 switches to its heavier track here: the most intense music so far, building.
- **SFX:**
  - `SFX-FOL-02` rapid typing under the whole shot (−24 dB). Script: "rapid typing".
  - `SFX-FOL-10` paper whooshes, staggered as envelopes fly in. Use 6–8 copies, not 35 (−26 dB).
  - `SFX-UI-06` counter ticker under the climbing total (−24 dB).
  - `SFX-UI-12` boom when the counter reaches $951 million (−12 dB).

**L49** · `ME` · First twist: "...the Fed initially rejected the requests."
- **Music:** cut M05 dead on "rejected" (silence point). Room tone only to the end of the line.

**L50** · `ANIM` · The envelopes bounce back, stamped REJECTED
- **Music:** none, or a single drone (−34 dB).
- **SFX:** `SFX-FOL-14` stamp thumps, 4–6 of them in a fast rhythm, not all 35 (−16 dB). `SFX-UI-18` denied buzz once on the first stamp (−24 dB).

**L51** · `ANIM` · Re-stamped RESUBMITTED, they fly back to New York
- **Music:** M05 back in, building again.
- **SFX:** `SFX-FOL-14` stamps (−18 dB), then `SFX-FOL-10` envelope whooshes flying away (−24 dB).

**L52** · `ME` · Pause. "And this time, many of them should have gone through... Except for one word."
- **Music:** **total silence for 1–1.5 seconds** before you speak (silence point). M05 creeps in from "Almost a billion dollars" and stops dead after "Except for one word."

**L53** · `ANIM` · The envelope opens, push in on the address; "JUPITER" pulses red
- **Music:** none or a thin drone.
- **SFX:**
  - `SFX-FOL-10` the envelope opening and paper sliding out (−22 dB).
  - **`SFX-UI-20` Jupiter ping on the first red pulse of "JUPITER"** (−22 dB). Motif C, louder now.

**L54** · `GFX` · scene 18, `ep01-18-jupiter-match.mp4` · JUPITER ST vs JUPITER the tanker: MATCH
- **Music:** M05 returns at file 2.0 s with energy, building to the match.
- **SFX:**
  - file 0.65 s: `SFX-UI-09` whoosh as the left panel and the street sign arrive (−22 dB).
  - file 2.25 s: `SFX-UI-09` whoosh as the right panel and the ship arrive (−22 dB). Optional distant ship horn (`ship horn distant`) at −30 dB under the tanker.
  - file 4.85 s → 5.45 s: `SFX-UI-08` line-draw swish as the red line connects them (−20 dB).
  - **file 5.45 s:** `SFX-UI-12` boom (−8 dB) **plus `SFX-UI-20` Jupiter ping at full level (−16 dB)**. This is the payoff of motif C.
- **Note:** the "MATCH" impact is one of the three biggest hits in the video (with the counter freeze and LAZARUS).

**L55** · `CARD` · scene 19, `ep01-19-total-fluke.mp4` · "It was a 'total fluke'…"
- **Music:** M05 calm passage or dip to −32 dB.
- **SFX:**
  - file 0.45 s: `SFX-FOL-29` card slide (−26 dB).
  - file 1.45 s → 3.1 s: `SFX-FOL-28` typewriter (−30 dB).
  - **file 3.59 s:** `SFX-UI-03` marker swipe on "total fluke" (−22 dB).

**L56** · `ANIM` · 30 envelopes grey out and lock: "HELD — $850 million"; 5 glow orange: "PAID — $101 million"
- **Music:** M05.
- **SFX:**
  - `SFX-FOL-15` padlock snaps: 5–8 in a quick cascade, not 30 (−20 dB), then `SFX-UI-02` ping on the "HELD" tag.
  - A warm `SFX-FOL-11` shimmer (−24 dB) as the five glow orange, then `SFX-UI-14` soft hit on the "PAID" tag.

**L57** · `GFX` · scene 20, `ep01-20-funds-trace.mp4` · The five payments to Sri Lanka and Manila (21 s)
- **Music:** M05, steady, −28 dB.
- **SFX:**
  - file 1.05 s and 1.55 s: `SFX-UI-07` pins on Dhaka and New York (−26 dB).
  - file 2.25 s: `SFX-UI-08` swish, the arc to New York (−24 dB).
  - file 4.65 s: `SFX-UI-07` pin on Colombo; file 4.85 s: `SFX-UI-08` swish of the $20M arc (−24 dB).
  - file 6.85 s: `SFX-UI-07` pin on Manila; from file 7.05 s: four `SFX-UI-08` swishes, staggered, one per Manila arc (−26 dB each).
  - file 12.05 s: `SFX-UI-09` slow whoosh for the camera push into Asia (−24 dB).
  - **file 14.85 s:** `SFX-UI-14` soft hit (−16 dB) as the Sri Lanka payment is stopped.
  - file 16.05 s: `SFX-UI-09` soft whoosh as the panel slides in (−26 dB).

**L58** · `ME` · Myth-busting: "Now, you might have heard that a spelling mistake..."
- **Music:** M05 eases back to its lighter layer. This is a correction, not a threat.

**L59** · `ANIM` · The Sri Lanka message; red circle around "FUNDATION"
- **SFX:** `SFX-FOL-20` marker circle (−22 dB) as the circle is drawn, then `SFX-UI-02` ping as "FOUNDATION" appears below (−24 dB).

**L60–L61** · `GFX` · scene 21, `ep01-21-sri-lanka-questions.mp4` · Deutsche Bank and Pan Asia question marks; the money comes back (16 s)
- **Music:** M05 lighter layer.
- **SFX:**
  - file 0.65 s: `SFX-UI-01` soft ticks as the nodes appear (−28 dB).
  - file 1.45 s: `SFX-UI-08` swish as the $20M order leaves (−24 dB).
  - **file 4.05 s:** `SFX-UI-02` ping, a questioning upward pitch, on the Deutsche Bank "?" (−22 dB).
  - **file 7.05 s:** the same ping on the Pan Asia "?" (−22 dB).
  - file 8.65 s → 10.05 s: `SFX-UI-08` swish as the arrow curves back to Dhaka (−24 dB).
  - **file 10.05 s:** `SFX-UI-02` ping, a little stronger, on "TOO BIG FOR THIS ACCOUNT?" (−20 dB).
  - **file 12.65 s:** `SFX-UI-14` soft hit as the payment stops and the money comes back (−18 dB).

**L62** · `ME` · "So most of the money was saved by a planet's name... And in Dhaka, nobody knew."
- **Music:** M05 resolves to a drone. On "nobody knew": `SFX-UI-12` low boom (−14 dB) and then cut to silence before the Act 4 card.

---

### ACT 4 · THE WEEKEND NOBODY ANSWERED · ≈ 10:43–13:44

**Act card** · scene 22, `ep01-22-act-4.mp4` · Standard act-card pattern.
- **Music:** M06 (the lonely first half) starts at file 1.0 s.

**L63** · `ANIM` · Morning, the duty officer walks in with a folder; overlay "Friday 5 Feb, 10:30 am"
- **Music:** M06 sparse piano, −30 dB.
- **Amb:** AMB-02 fluorescent hum, −34 dB (the same as L04, for the callback).
- **SFX:**
  - `SFX-FOL-04` footsteps (−26 dB).
  - The `overlays.html` time chip "10:30 AM · FRIDAY 5 FEB": `SFX-UI-24` scramble (−28 dB) as the digits resolve.

**L64** · `ANIM` · He checks the empty tray, presses buttons, nothing
- **Music:** M06 drops to its thinnest layer.
- **SFX:**
  - `SFX-FOL-09` button presses, 3–4 of them (−24 dB).
  - `SFX-FOL-05` printer error beep (−18 dB), the **same file as L04**. Then a second beep, as the script asks for "printer beep, error tone".

**L65** · `CARD` · The police quote card again
- **Note:** if you reuse scene 2's MP4, reuse its sound effects at exactly the same times (card 0.45 s, typing 1.55–4.6 s, marker 5.05 s), but **quieter by 4 dB**. The repeat should feel like a memory.
- **Music:** M06.

**L66** · `ME` · "Meanwhile, in New York, it's still a working day..."
- **Music:** M06. On "straight to the system nobody can read", a very soft `SFX-UI-11` glitch at −30 dB.

**L67** · `ANIM` · Saturday: the frozen monitor; he restarts the machine
- **Amb:** AMB-02, −34 dB.
- **SFX:** `SFX-FOL-21` PC restart (fans down, beep, fans up) at −22 dB. `SFX-FOL-19` chair creak as he leans in (−30 dB). Time chip "SATURDAY 6 FEB" if you use one: `SFX-UI-24` (−28 dB).

**L68** · `ANIM` · Close-up: "A file is missing or changed."
- **Music:** M06 drops out; a **low drone** takes its place (script: "then a low drone"), from M01 or AMB-10 at −30 dB.
- **SFX:** `SFX-UI-05` generic error chime (−16 dB) exactly as the error box appears. Script: "Windows-style error chime"; **use a generic one**, not the real Windows sound. A faint `SFX-UI-11` glitch under it (−28 dB).

**L69** · `ME` · Quietly: "It was. The hackers had changed it."
- **Music:** silence point. Only the drone tail from L68 dying away, then nothing.

**L70** · `GFX` · scene 23, `ep01-23-messages-printed.mp4` · Saturday 12:30, the messages finally print (14 s)
- **Music:** M06 returns, slightly more urgent.
- **SFX:**
  - file 0.55 s: `SFX-UI-08` swish as the timeline draws (−26 dB).
  - file 1.05 s, 1.75 s, 2.45 s: `SFX-UI-01` soft tick on each recap event (tray, leave, frozen) (−28 dB).
  - **file 3.65 s:** `SFX-UI-02` ping on "SATURDAY 12:30" (−22 dB).
  - **file 4.25 s → about 9 s:** `SFX-FOL-08` fast printing of many pages (−20 dB). Motif A, finally working, but too late.

**L71** · `GFX` · scene 24, `ep01-24-no-reply.mp4` · Email, fax, phone, each with "no reply" (13 s)
- **Music:** M06 thin; keep space for these sounds.
- **SFX:**
  - **file 2.25 s:** email icon: `SFX-FOL-24` email-sent swoosh (−22 dB).
  - **file 3.05 s:** `SFX-UI-14` soft hit plus `SFX-UI-18` denied buzz (−18 dB) as the red cross lands.
  - **file 3.85 s:** fax icon: `SFX-FOL-22` fax handshake, 0.8 s of it (−24 dB).
  - **file 4.65 s:** soft hit plus denied buzz (−18 dB).
  - **file 5.45 s:** phone icon: `SFX-FOL-23` one ring-out tone (−22 dB).
  - **file 6.25 s:** soft hit plus denied buzz (−16 dB).
  - **file 9.05 s:** `SFX-UI-02` ping on the New York "Saturday" clock chip (−24 dB).
- **Note:** the three crosses must sound identical. The sameness is the point: nobody, nobody, nobody.

**L72** · `ME` · "Remember the five-day window? This is it working, exactly as designed."
- **Music:** M06. Optional: three soft `SFX-UI-17` clock ticks under "exactly as designed" (−30 dB), echoing motif B.

**L73–L75** · `GFX` · scene 25, `ep01-25-stop-orders.mp4` · Sunday, Monday, Tuesday: the stop orders arrive too late (28 s)
- **Music:** switch to M06's urgent second half here. Motif B under the whole scene: `SFX-UI-17` clock ticks, **starting at one per second and speeding up to two per second** by file 18 s (−28 dB).
- **SFX:**
  - **file 1.65 s:** `SFX-UI-01` tick as Sunday lights up (−24 dB).
  - **file 3.65 s:** `SFX-UI-02` ping as New York stays on its weekend (−24 dB).
  - file 9.25 s: `SFX-UI-02` ping as Monday arrives (−22 dB). L74.
  - **file 11.25 s and 11.85 s:** `SFX-UI-08` swishes as the stop orders fire off (−22 dB).
  - **file 14.25 s:** `SFX-UI-14` soft hit as the Manila holiday lights up (−20 dB).
  - **file 18.85 s:** `SFX-UI-14` soft hit plus `SFX-UI-18` denied buzz on "CLOSED — HOLIDAY" (−18 dB). L75.
  - **file 22.65 s:** `SFX-UI-02` ping on "RECEIVED · TUE 9 FEB" (−20 dB). **The clock ticks stop here.**
  - file 22.85 s: `SFX-UI-12` light boom (−16 dB).

**L76** · `CARD` · scene 26, `ep01-26-withdrawn.mp4` · 9 February: $58.15 million already withdrawn
- **Music:** M06 resolves to a low sustained note.
- **SFX:**
  - file 0.45 s: `SFX-FOL-29` card slide (−26 dB).
  - **file 0.95 s:** `SFX-UI-14` soft hit as the date drops in (−20 dB).
  - **file 2.47 s → 3.17 s:** `SFX-UI-03` marker swipe on "$58.15 million" (−20 dB), with a light `SFX-UI-12` boom at 3.17 s as it completes (−18 dB).

**L77** · `ME` · Lean in: "...the money didn't move by itself in Manila. People moved it."
- **Music:** drop M06 out; bring M07's bass in softly on "People moved it" to bridge into the car park.

**L78** · `ANIM` · Night car park; two figures load heavy bags into the car
- **Music:** M07 bass only, −30 dB.
- **Amb:** AMB-08 night car park, −32 dB.
- **SFX:** script: "car door, heavy bags thudding". `SFX-FOL-16`: boot opens (−22 dB), 2–3 bag thuds (−18 dB), boot shuts (−18 dB). Add footsteps on concrete (−28 dB) if the figures walk.

**L79** · `EVID` · Inquirer article; highlight "Maia Santos-Deguito"
- **SFX:** `SFX-UI-09` soft whoosh as the article appears (−26 dB). `SFX-UI-03` marker swipe on her name (−22 dB).
- **Music:** M07 low.

**L80** · `ME` · "We'll come back to what happened to her at the end."
- **Music:** M07 low. End the act with the track's natural phrase end, or a 1 s fade.

---

### ACT 5 · WASHING THE MONEY · ≈ 13:44–15:45

**Act card** · scene 27, `ep01-27-act-5.mp4` · Standard act-card pattern.
- **Music:** M07 full starts at file 1.0 s.

**L81–L82** · `GFX` · scene 28, `ep01-28-money-flow.mp4` · Four accounts merge → Philrem → USD to PHP → three ways (17 s)
- **Music:** M07, −28 dB.
- **SFX:**
  - file 1.05 s: `SFX-UI-01` soft ticks as the four account boxes appear, one each (−28 dB).
  - **file 2.45 s:** `SFX-UI-08` swishes as they merge (−22 dB), then `SFX-UI-14` soft hit when they combine.
  - file 4.25 s: `SFX-UI-08` swish to Philrem plus `SFX-UI-07` thud as Philrem appears (−22 dB).
  - **file 5.85 s → 6.25 s:** the USD to PHP swap: a quick `SFX-UI-24` scramble, or a coin flip (`coin flip`), ending in `SFX-UI-02` ping at 6.25 s (−20 dB).
  - **file 7.65 s:** three `SFX-UI-08` swishes, staggered, as the money splits three ways (−22 dB).
  - **file 9.85 s:** `SFX-UI-02` ping on the "CASH" tag (−20 dB). Optional: a cash-register-like `paper money flick` at −28 dB.

**L83** · `ANIM` · Casino hall, chips sliding across a baccarat table in slow motion
- **Music:** M07, −28 dB.
- **Amb:** AMB-06 casino floor, −30 dB.
- **SFX:** `SFX-FOL-17` chips sliding and clattering, **slowed to 70–80% speed** to match the slow motion (−18 dB). Don't put this on the line about "the trail goes cold"; put it on the movement.

**L84** · `ANIM` · Private room, dealer and players
- **Amb:** cross-fade AMB-06 → AMB-07 (quieter, more private), −32 dB.
- **SFX:** `SFX-FOL-18` cards dealt (−24 dB), `SFX-FOL-17` a few chips stacked (−24 dB). Keep it sparse.

**L85** · `ME` · Third twist: "And here's the part that should make you angry..."
- **Music:** drop M07 out on "angry" (silence point); bring it back on "As far as the casinos were concerned...", quieter.

**L86** · `GFX` · scene 29, `ep01-29-private-jet.mp4` · Xu walks onto a private jet; it takes off; "NEVER FOUND" (11 s)
- **Music:** M07 thins to bass only, −32 dB.
- **Amb:** AMB-09 airfield, −34 dB, from file 0.25 s.
- **SFX:**
  - file 0.65 s: `SFX-UI-01` tick as the Weikang Xu node appears (−28 dB).
  - file 1.45 s → 2.45 s: `SFX-UI-08` swish along the red arrow (−22 dB).
  - **file 2.45 s → 4.75 s:** footsteps on tarmac, roughly 2 steps per second, about 5 steps (−28 dB).
  - **file 4.75 s → 5.35 s:** `SFX-FOL-26` metal airstair, 3–4 steps (−24 dB).
  - **file 5.75 s:** `SFX-FOL-27` door thunk (−20 dB).
  - **file 6.05 s:** `SFX-FOL-25` jet spool-up and take-off starts (HIT); the engine rises from −24 dB and passes right, peaking around −14 dB near file 7.0 s.
  - **file 7.85 s:** the "?" lands: `SFX-UI-12` boom (−12 dB). Cut the jet sound off under the boom.
  - file 8.45 s: `SFX-UI-02` ping, or a stamp, on "NEVER FOUND" (−20 dB).
- **Note:** "He has never been found." should land just after the "?".

**L87** · `CARD` · scene 30, `ep01-30-kim-wong.mp4` · Kim Wong returned $4.63 million
- **Music:** M07, −30 dB.
- **SFX:**
  - file 0.45 s: `SFX-FOL-29` card slide (−26 dB).
  - **file 2.07 s → 2.77 s:** `SFX-UI-03` marker swipe on "$4.63 million" (−22 dB).
  - About 1 s after the highlight, the green status badge appears: `SFX-UI-21` soft click (−26 dB). **No dramatic hit on this badge**; he was not convicted.

**L88** · `GFX` · scene 31, `ep01-31-macau.mp4` · Manila → Macau, dotted line towards North Korea (12 s)
- **Music:** M07 darkens; add a low drone under it from file 6.0 s.
- **SFX:**
  - file 0.85 s: `SFX-UI-07` pin on Manila (−26 dB).
  - file 1.85 s: `SFX-UI-08` swish of the arc to Macau (−24 dB).
  - file 3.05 s: `SFX-UI-07` pin on Macau (−22 dB).
  - **file 6.25 s:** a slow, dark `SFX-UI-08` swish (pitched down if you can) as the dotted line fades towards North Korea (−24 dB).

**L89** · `ME` · "Who was actually behind the keyboard?"
- **Music:** M07 ends; one sustained low note leads into the Act 6 card. Optional `SFX-UI-11` glitch at −28 dB on "keyboard".

---

### ACT 6 · WHO WAS IT? · ≈ 15:45–17:46

**Act card** · scene 32, `ep01-32-act-6.mp4` · Standard act-card pattern.
- **Music:** M08 starts at file 1.0 s.

**L90–L91** · `GFX` · scene 33, `ep01-33-story-breaks.mp4` · The story breaks, the governor resigns (20 s)
- **Music:** M08's quieter opening, −28 dB.
- **SFX:**
  - file 0.55 s: `SFX-UI-08` swish as the timeline draws (−26 dB).
  - file 1.05 s: `SFX-UI-01` tick on the heist date (−28 dB).
  - **file 9.75 s:** `SFX-UI-02` ping on the Philippine Daily Inquirer event (−22 dB). Optional newspaper rustle (`newspaper page turn`, −28 dB).
  - **file 14.75 s:** `SFX-UI-14` soft hit on "Governor resigns" (−20 dB).

**L92** · `EVID` · BAE blog again, highlight "BBHOBDDH"
- **SFX:** `SFX-UI-09` whoosh in (−26 dB); `SFX-UI-03` marker swipe on the SWIFT code (−22 dB).
- **Music:** M08, slowly building.

**L93–L94** · `GFX` · scene 34, `ep01-34-lazarus-code.mp4` · Two code listings, matching lines glow, then LAZARUS (14 s)
- **Music:** M08 builds from file 0.5 s to file 10.75 s, then cuts out **on** the LAZARUS hit and returns 1 s later, heavier.
- **SFX:**
  - file 0.65 s: `SFX-UI-09` whoosh as the left panel arrives (−24 dB).
  - file 1.65 s: `SFX-UI-09` whoosh as the right panel arrives (−24 dB).
  - file 0.65 s → 4.6 s: very faint `SFX-FOL-01` typing texture as the code fills in (−34 dB), optional.
  - **file 5.60 s:** `SFX-UI-02` ping plus a soft `SFX-UI-08` swish as the matching lines glow and the ribbons connect (−20 dB).
  - file 6.5 s → 10.6 s: `SFX-UI-13` riser (−24 dB rising to −16 dB).
  - **file 10.75 s:** `SFX-UI-10` glitch burst (−8 dB) **plus** `SFX-UI-12` boom (−8 dB), as LAZARUS slams onto the screen. One of the three biggest hits in the video.

**L95** · `EVID` · DOJ press release, September 2018
- **Music:** M08's heavier, slower passage, −28 dB.
- **SFX:** `SFX-UI-09` whoosh in (−26 dB); `SFX-UI-03` marker swipe on the headline and on "$81 million from Bangladesh Bank" (−22 dB).

**L96** · `EVID` · FBI "Wanted" poster for Park Jin Hyok, slow push-in
- **Music:** M08, sombre. No effects at all during the push; let it be still.
- **SFX:** at most a single low `SFX-UI-22` pulse (−30 dB) as the poster appears.

**L97** · `GFX` · scene 35, `ep01-35-disclaimer-charges.mp4` · Disclaimer card
- **Music:** fade M08 down to −34 dB, neutral. **No hits, no glitch, no drama** on a legal disclaimer.
- **SFX:** only `SFX-UI-09` a very soft whoosh as the card appears (−30 dB).

**L98** · `GFX` · scene 36, `ep01-36-korea-at-night.mp4` · The Korean peninsula at night (11 s)
- **Music:** M08 fades to nothing by file 0.5 s. Script: "low ambient drone": use AMB-10 at −30 dB from file 0.25 s.
- **SFX:**
  - **file 1.05 s → 3.65 s:** `SFX-UI-25` soft shimmer rising as the city lights switch on in waves (−26 dB).
  - file 3.85 s: `SFX-UI-02` ping, soft, on "SOUTH KOREA" (−26 dB).
  - **file 5.85 s:** **no sound** as "NORTH KOREA" appears. The silence over the dark north *is* the effect. At most, drop the drone by 3 dB here.

**L99** · `ME` · Slow, direct: "One of the poorest, most isolated countries on Earth..."
- **Music:** near silence. One low drone (the AMB-10 tail) at −34 dB. Let each sentence land. **No sounds at all** at the end of "nearly walking away with a billion dollars"; hold 1 s of room tone.

---

### ACT 7 · TEN YEARS LATER · ≈ 17:46–20:10

**Act card** · scene 37, `ep01-37-act-7.mp4` · Standard act-card pattern, but a **softer** boom at file 0.65 s (−18 dB).
- **Music:** M09 starts at file 1.0 s.

**L100** · `GFX` · scene 38, `ep01-38-ten-years.mp4` · 2016 flips to 2026 (5 s)
- **Music:** M09, −28 dB.
- **SFX:**
  - **file 0.85 s → 2.85 s:** `SFX-UI-15` split-flap run, the same file as L16 (−20 dB).
  - **file 2.85 s:** `SFX-UI-12` light boom (−16 dB) as 2026 lands.
  - file 3.0 s+: `SFX-UI-01` tick on "SO WHAT HAPPENED NEXT?" (−28 dB).

**L101** · `CARD` · scene 39, `ep01-39-deguito-convicted.mp4` · Deguito convicted
- **Music:** M09.
- **SFX:**
  - file 0.45 s: `SFX-FOL-29` card slide (−26 dB).
  - **file 0.95 s:** `SFX-UI-14` soft hit as "JANUARY 2019" drops (−20 dB).
  - **file 2.47 s → 3.17 s:** `SFX-UI-03` marker swipe on "guilty on eight counts" (−20 dB).
  - About 1 s later, the red "CONVICTED" badge: `SFX-UI-23` stamp slam (−20 dB). A convicted status may land firmly; this is the one badge that earns a hit.

**L102** · `CARD` · scene 40, `ep01-40-rcbc-fine.mp4` · RCBC fined ₱1 billion
- **SFX:** the same pattern: card 0.45 s, date hit 0.95 s, **marker swipe 2.47 s → 3.17 s** on "₱1 billion".
- **Music:** M09. Keep it neutral on "RCBC has always denied..."; no hit on the note line.

**L103** · `GFX` · scene 41, `ep01-41-recovered.mp4` · The running tally: what came back (12 s)
- **Music:** M09, −28 dB.
- **SFX:**
  - file 0.75 s: `SFX-UI-09` soft whoosh as the panel appears (−26 dB).
  - **file 1.15 s:** `SFX-UI-06` short counter ticker on "$101M stolen" (−24 dB).
  - **file 2.85 s:** `SFX-UI-02` ping, slightly bright, on "$20M back" (−22 dB).
  - **file 5.05 s:** `SFX-UI-02` ping, quieter, on "about $15M back" (−24 dB).
  - **file 7.45 s:** `SFX-UI-14` soft, dull hit on "Most never recovered" (−18 dB). The heaviest sound in the scene; it should feel like a door closing.

**L104** · `EVID` · Daily Star / TBS headline: Dhaka court orders $81M confiscation
- **SFX:** `SFX-UI-09` whoosh in (−26 dB); `SFX-UI-03` marker swipe on the headline (−22 dB).
- **Music:** M09.

**L105** · `ME` · Final twist: "Now, the question I promised you..."
- **Music:** M09 drops out; **M01's drone comes back** (−30 dB): the cold-open theme returning for the cold-open question. Optional `SFX-UI-22` single pulse on "help inside Bangladesh" (−28 dB).

**L106** · `CARD` · scene 42, `ep01-42-charge-sheet.mp4`, then scene 43, `ep01-43-disclaimer-chargesheet.mp4`
- **Music:** M01 drone, −30 dB.
- **SFX on scene 42:** card 0.45 s; date hit 0.95 s (−20 dB); **marker swipe 2.47 s → 3.17 s** on "64 people and entities" (−20 dB).
- **SFX on scene 43:** only a very soft whoosh as it appears (−30 dB). **No hits on the disclaimer.**

**L107** · `CARD` · scene 44, `ep01-44-delayed-98.mp4` · "Probe report delayed for 98th time"
- **Music:** M01 drone.
- **SFX:**
  - file 0.45 s: `SFX-FOL-29` card slide (−26 dB).
  - **file 0.95 s:** `SFX-UI-14` soft hit as "14 SEPTEMBER 2026" drops (−20 dB).
  - file 1.5 s → about 2.0 s: `SFX-FOL-28` typewriter, brief, as the headline appears (−30 dB).
  - **file about 2.1 s → 3.25 s:** `SFX-UI-06` counter ticker as the 98 counts up (−22 dB).
  - **file 3.25 s:** `SFX-UI-14` soft hit (−18 dB) as the counter settles on 98.
- **Note:** if you update the card to 99, the timings stay the same.

**L108** · `ME` · Recap: "Ten years. Ninety-eight extensions. A hacker who's never been arrested..."
- **Music:** M09 returns and **swells** gently across the line (−28 → −22 dB). Optional: a single `SFX-UI-17` clock tick on each item of the list (four ticks, −30 dB), the last echo of motif B.

**L109** · `ANIM` · The printer room again; for the first time, the printer whirs and a page slides out. Cut to black.
- **Music:** cut M09 at the start of the shot. **No music.**
- **Amb:** AMB-02 fluorescent hum, exactly as in L04 (−34 dB).
- **SFX:** `SFX-FOL-07` printer whir and page sliding out (−16 dB). Motif A pays off: the first time the printer works.
- **Then:** on the cut to black, **cut everything, including room tone**, and hold 2 seconds of true silence (silence point). Script: "printer whir, then silence".

**L110** · `ME` · Lighter: "So what do you think...?"
- **Music:** M09 outro (warmer) fades in under the line at −30 dB.
- **SFX:** none.

**L111** · `ME` → `GFX` · Subscribe ask
- **Music:** outro bed rises a little (−26 dB) as you finish speaking.

**L112** · `GFX` · scene 45, `ep01-45-end-screen.mp4` · End screen (20 s)
- **Music:** outro track at −16 dB once the voice ends; this is the loudest music in the video apart from the sting. Fade out over the last 2 seconds.
- **SFX:**
  - **file 0.75 s:** `SFX-UI-10` glitch (−14 dB) plus `SFX-UI-24` scramble as "UNFICTION" resolves.
  - **file 1.65 s:** `SFX-UI-14` soft hit (−18 dB) on the flash.
  - file 1.65 s → 2.3 s: `SFX-UI-09` soft whooshes as the video slot and the subscribe circle appear (−26 dB).
  - **Logo sting at the end:** `STING-02`, 2 seconds before the end of the file (about file 18 s), at −10 dB. Script: "logo sting".

---

## 9. Graphics: what to put on each hit

If you change a scene or make new ones later, use this table to choose sounds from the cue sheet's `type` and `strength` columns.

| Cue type | Strength | Sound | Level |
|---|---|---|---|
| GLITCH | hard | `SFX-UI-10` glitch burst, plus `SFX-UI-12` boom if it's a reveal | −12 to −8 dB |
| GLITCH | medium | `SFX-UI-11` glitch swish (act-card transitions, small glitches) | −20 to −16 dB |
| IMPACT | medium / hard | `SFX-UI-12` sub boom | −14 to −8 dB |
| HIT | soft / medium | `SFX-UI-14` soft low hit | −20 to −16 dB |
| FLASH | soft | `SFX-UI-12` boom at low level, or `SFX-UI-14` | −16 dB |
| FLASH | hard / medium | `SFX-UI-12` boom plus `SFX-UI-02` ping | −14 to −10 dB |
| ACCENT | soft | `SFX-UI-01` soft tick, or `SFX-UI-03` marker swipe if it's a highlight on a card | −28 to −22 dB |
| ACCENT | medium | `SFX-UI-02` ping | −22 to −18 dB |

**On every desk card (FactCard):** the date hit is always at file 0.95 s. The highlight sweeps for 0.7 s and the cue sheet lists the moment it *finishes*, so start the marker swipe 0.7 s before that time: file 2.47 s → 3.17 s on the dated cards (scenes 26, 39, 40, 42), file 2.07 s → 2.77 s on the cards without a date (scenes 13 and 30).

**On the quote cards (scenes 2 and 19):** the cue sheet time is when the highlight *starts*; it sweeps for 0.9 s.

**On every act card:** glitch in at file 0.25 s, title boom at 0.65 s, glitch out at 4.95 s.

**On overlays from `overlays.html`:**
- **Dramatisation label:** no sound.
- **Time chips:** `SFX-UI-24` scramble at −28 dB, 0.3–0.9 s into the chip.
- **Name tags (lower thirds):** `SFX-UI-09` very soft whoosh at −30 dB as they slide in, nothing as they leave.

**Things that should never get a sound:**
- The `ILLUSTRATION` and `DRAMATISATION` labels
- Source tags
- Disclaimer cards (except a very soft whoosh)
- A status badge on someone who wasn't convicted

---

## 10. Your voice

Your face recordings used a collar mic and your faceless recordings used a table mic, so they don't match yet. Fix that before you add anything in this document; music hides small flaws, but it can't hide two different voices.

**Order of work:**

1. **Cut first:** remove mistakes, long breaths and dead air. Fill every gap with `AMB-11` (your room tone), never digital silence.
2. **Adobe Podcast Enhance Speech on every voice clip**, the collar and the table recordings alike, at the **same strength** (50–70%). Download as WAV. Listen through for garbled words, especially names (Deguito, Atiur Rahman, Park Jin Hyok, Pyongyang, Weikang Xu).
3. **EQ by ear, per mic:**
   - Collar clips boomy: cut 2–3 dB around 150–250 Hz.
   - Table clips thin or distant: add 2 dB around 120–200 Hz.
   - Both dull: add 1–2 dB around 3–5 kHz.
4. **The same light compression on all voice clips:** ratio 3:1, 3–6 dB of reduction on the loud words, attack about 10 ms, release about 100 ms.
5. **Normalise every voice clip to about −16 LUFS.** The finished mix then lands near −14 LUFS once music and effects are added.
6. **High-pass at 80 Hz.** Nothing else.

**Where the voice must be at its clearest** (dip music an extra 3 dB): every number (L02, L27, L48, L56, L57, L76, L101–L103, L106, L107), every name you read out (L18, L26, L63, L79, L82, L86, L87, L91, L95, L101), and every legal line (L97, L102, L106).

**Recording from now on:** one setup for everything, with the collar mic clipped mid-chest, about a hand-span below your chin, in the same room, at the same distance.

---

## 11. Final mix and export

**Mix pass order.** Do each one across the whole episode before starting the next:

1. **Voice alone.** Listen to the whole episode with only the voice playing. Every word clear, every clip the same loudness.
2. **Add the music.** Set the ducking. Check every silence point in [section 6](#where-music-stops-completely) actually goes silent.
3. **Add the ambience.** Check every Blender shot has room tone and that no ambience cuts off suddenly; cross-fade 0.3–0.5 s at every cut.
4. **Add the effects.** Graphics hits first (the times above), then the Blender foley.
5. **Listen on three systems:** headphones, laptop speakers and your phone speaker. If the voice is hard to follow on the phone, the music is too loud.
6. **Listen once without looking.** If a sound makes you look up from your phone for no reason, it's too loud or doesn't belong.

**Master bus, in this order:**

1. Gentle EQ only if the whole thing sounds dull or boomy (most of the time, leave it).
2. Light bus compression (ratio 2:1, 1–2 dB of reduction), optional.
3. **Limiter** with its ceiling at **−1.0 dBTP**.
4. Adjust the input gain until the whole episode measures **−14 LUFS integrated**.

**Export:**

- Audio: **AAC 320 kbps, 48 kHz** inside the video file (or PCM if your editor offers it for the upload file).
- Also export a **WAV stem of the voice alone** and a **WAV of the music and effects without voice**, and keep them. You'll need them for shorts, corrections or a dubbed version.

**Description credits:** copy every attribution from your `sound-log.txt` into the description under a "Music and sound" heading. YouTube Audio Library tracks that need attribution show the exact text to paste.

---

## 12. Checklist before upload

- [ ] Every voice clip went through the same Enhance setting and is normalised to about −16 LUFS
- [ ] No gaps of digital silence in the voice track (room tone everywhere)
- [ ] All 12 silence points really go silent
- [ ] The Jupiter ping is the same file at L03, L07, L25, L53 and L54, and loudest at L54
- [ ] The printer beep at L04 and L64 is the same file; L109's whir is followed by 2 s of silence
- [ ] The L01 and L40 room sound is the same file at the same level
- [ ] The three biggest hits are the counter freeze (L02), MATCH (L54) and LAZARUS (L94); nothing else is as loud
- [ ] No hits on disclaimers, source tags or the Kim Wong badge
- [ ] No real Windows, Mac, bank, casino or news-channel sounds
- [ ] Music never has a melody under a number, name or date
- [ ] Whole episode measures −14 LUFS integrated, true peak no higher than −1 dBTP
- [ ] Listened on headphones, laptop speakers and a phone
- [ ] `sound-log.txt` complete; attributions in the description
- [ ] After publishing: check YouTube Studio → Copyright for claims within 24 hours
