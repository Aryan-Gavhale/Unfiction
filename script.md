# Unfiction — Episode 01
# The Bangladesh Bank Heist

**Working title:** The Word That Saved $850 Million
**Alternative titles:**
- Hackers Tried to Steal $1 Billion. A Broken Printer Hid It.
- The Perfect Bank Robbery Had One Flaw
- How Hackers Robbed a Country's Central Bank

**Thumbnail idea:** A dark Blender render of a SWIFT-style screen with one word circled in red: **JUPITER**. Big text: **"$951,000,000"** with a red strike-through, and small text: **"One word stopped it."** (Alternative: the printer version. Dark office, empty tray, red warning light, "…it almost worked.")

**Target runtime:** about 20 minutes
**Narration length:** about 2,530 words. At a deliberate storytelling pace of about 130 words per minute, plus pauses and graphic beats, this runs about 20 minutes. Section timestamps below are recalculated from word count.
**Research cut-off:** 19 October 2026. Re-check the "Ten years later" section on the day you publish.

---

## Shot legend

| Tag | What it means |
|---|---|
| `ME` | You on camera |
| `EVID` | A real document or official image on screen (DOJ press release, FBI poster, malware report, a key court headline). Used for only about six beats. Highlight the key line as you read it. |
| `CARD` | Your own designed text card that quotes or summarises a source, with the source named at the bottom. Replaces most news screenshots. |
| `GFX` | 2D motion graphics: maps, clocks, timelines, money-flow diagrams, text callouts |
| `ANIM` | 3D Blender scenes: faceless characters, props-only shots, and environment shots (city, street, bank, casino). Small **"Dramatisation"** label in the corner. |

**Rough shot split (by screen time):** ANIM about 23%, GFX about 35%, CARD about 9%, EVID about 6%, ME about 26%.

**Stock footage:** none. Everything on screen is your own Blender render, your own 2D graphics, or a real document.

**Do not use:** news channel footage, documentary clips, stock footage, or music from other films. No real bank logos in renders: use generic signage.

---

## Blender build list (build once, reuse everywhere)

Every `ANIM` shot comes from a handful of reusable scenes. Build each one once, save it as its own .blend file, and use camera presets for different angles. This keeps both render time and token use low.

| Scene | Used for | Notes |
|---|---|---|
| **SWIFT / printer room** | Opening shots, printer failure, the heist night, Friday and Saturday scenes, the error message, the final callback | Two lighting setups: night (monitors glow) and morning (cold fluorescent). The printer needs an empty tray, a red light, and a page that can slide out for the last shot. |
| **Office desk** | The CV email being opened | One desk, one monitor, one faceless figure. |
| **Dhaka skyline + bank building** | Act 1 establishing shot | Low-poly towers with lit windows and light-trail traffic. One plain, generic bank building. |
| **Makati street + bank branch** | Jupiter Street, the four fake customers | Street sign reading "JUPITER ST". No real logos. |
| **Casino hall + private baccarat room** | Chips sliding, the baccarat table | Chips are simple cylinders with a rigid-body drop. A few dozen is enough. |
| **Night car park** | Cash loaded into the manager's car | One car, one wall, two figures. |
| **Props only** | SWIFT envelope with wax seal, New York vault, the 35 payment envelopes, address close-ups, four ID cards and a stamp | No characters needed. Build one envelope and instance it 35 times. |

**Characters:** one faceless mannequin rig, recoloured per role (duty officer, employee, customers, dealer, players). Keep movement small: walk, stand, shrug, carry a bag.

---

## COLD OPEN — 00:00 to 01:28

**L01** · `ANIM` · Black. Then a dark, empty room on the tenth floor: monitors glowing, the chair empty, a cursor drifting across a screen by itself. Wall clock reads 8:36. Slow push-in.
Sound: low room hum, faint keyboard clicks. The first word is spoken within two seconds. No logo, no silence.
> Thursday night, February 2016. An empty office in Dhaka. A cursor starts to move. Over the next few hours, thirty-five orders go out to the New York Federal Reserve.

**L02** · `GFX` · Black screen. The number **$951,000,000** counts up fast, then freezes.
Sound: low bass hit.
> Nine hundred and fifty-one million dollars. Almost everything in one account.

**L03** · `ME` · Tight close-up, single hard light from one side. Say it slowly.
> And most of it was stopped. Not by security software. Not by a guard. By a single word in a street address: the name of a planet.

**L04** · `ANIM` · Hard cut to the same room in cold morning light. The printer against the wall has an empty tray and a red warning light. Slow push-in. Wall clock reads 10:30. A faceless figure walks in, looks at the tray, shrugs.
Sound: single error beep, then the fluorescent hum.
> But the first sign that anything was wrong came from a printer. On Friday morning, it stopped working.

**L05** · `CARD` · The man's police statement, typed on screen letter by letter, quote highlighted. Source tag at bottom: *"Police complaint, as reported by Bloomberg / AFP, March 2016."*
> The man on duty thought it was nothing. Later, he told police, quote: "We thought it was a common problem, just like any other day."

**L06** · `ME` · Tight close-up, same hard light.
> It wasn't. That printer was the only witness.

**L07** · `GFX` · Quick flash cuts, each 0.5 seconds: a street sign "JUPITER ST" / a misspelled word "Fundation" circled in red / casino chips / a red FBI "WANTED" frame (blurred).
Sound: rising tension.
> A street sign. A spelling mistake. Casinos. And a hacker the FBI says works for one of the most secretive countries on Earth.

**L08** · `ME` · Lean in slightly.
> I'm going to show you exactly how they did it, with the real evidence. And stay to the end, because ten years later one question about this case is still unanswered: did the thieves have help from the inside?

**L09** · `GFX` · Channel logo sting: **UNFICTION**. Tagline below: *Real Scams. Real Crimes. Untold Stories.*
Sound: 2-second logo sting.

---

## ACT 1 — THE VAULT WITH NO WALLS — 01:28 to 04:01

**L10** · `ANIM` · Stylised night aerial of Dhaka: low-poly towers, lit windows, car-light trails. The camera glides toward a plain, generic central-bank-style building (no real logo).
> Bangladesh Bank is the central bank of a country of more than 160 million people. It looks after the national reserves, the money the country uses to pay for fuel, food and everything it imports.

**L11** · `GFX` · Map: arrow from Dhaka to New York. A vault icon appears over New York labelled "Federal Reserve Bank of New York."
> But much of those reserves aren't kept in Dhaka. Like many central banks, Bangladesh keeps US dollars in an account at the Federal Reserve Bank of New York.

**L12** · `ME`
> So here's the first question. If the money is in New York, how do you move it from Dhaka?

**L13** · `ANIM` · Props only, no characters. A 3D sealed envelope with a red wax seal and a floating "SWIFT message" tag flies from a small Dhaka bank model to a New York vault model. The vault opens and money moves.
> Banks use a system called SWIFT. Think of it as an ultra-secure letter. A bank writes, "Pay this amount to this account," signs it with its digital credentials, and sends it.

**L14** · `ANIM` · Same scene. The wax seal glows green with a floating "AUTHENTIC" tag.
> If the letter is properly signed, the receiving bank trusts it. That's the whole point. Billions move every day on that trust.

**L15** · `ME` · Slower.
> Which means a thief doesn't need to break into a vault in New York. They just need to sit at the right computer in Dhaka and write the letter.

**L16** · `GFX` · Calendar flips back to **January 2015**. An email inbox appears.
Sound: soft keyboard clicks.
> And that's exactly where this story really begins. Not in 2016, but more than a year earlier.

**L17** · `ANIM` · Office. Faceless employee at a desk, monitor glow on their face. An email notification pops up.
> In January 2015, according to the FBI, several Bangladesh Bank employees received a polite email from a job seeker.

**L18** · `GFX` · A recreated email on screen. Sender: **"Rasel Ahlam"**. Body: a short job enquiry with a link to "download my CV and cover letter". Label: *"Recreation based on FBI complaint, 2018."*
> His name was Rasel Ahlam. He wanted a job, and he included a link to download his CV.

**L19** · `ME`
> Rasel Ahlam did not exist.

**L20** · `ANIM` · Close-up on the screen. The cursor clicks "Download". A progress bar fills. For one frame, the screen flickers.
Sound: a click, then a faint distorted glitch.
> The FBI says the name was a cover used by the hackers. At least one person inside the bank downloaded the file, and with it, malware.

**L21** · `GFX` · Network diagram of the bank: dozens of computer icons. One turns red, then the red spreads slowly, computer to computer, towards an icon labelled "SWIFT terminal".
> From that one infected computer, the intruders began moving quietly through the bank's network, machine by machine, towards the computers connected to SWIFT.

**L22** · `GFX` · Red reaches the SWIFT icon. Everything freezes. A timer appears: **"Waiting… 12 months"**.
> And then they did something strange. They stopped. They waited for about a year.

**L23** · `ME` · Mid-video hook.
> Why would thieves sit inside a bank for a year and steal nothing? Because breaking in was the easy part. The hard part was knowing where a billion dollars could go without anyone stopping it.

---

## ACT 2 — BUILDING THE ESCAPE ROUTE — 04:01 to 06:46

**L24** · `GFX` · Map zooms from Dhaka across to Manila, Philippines. Pin drops on Makati City.
> In May 2015, nearly four thousand kilometres away in Manila, the second part of the plan began.

**L25** · `ANIM` · Street-level shot of a busy Makati street in daylight: low-poly traffic, a street sign reading "JUPITER ST", and a generic mid-size bank branch with plain signage (no real logos).
> On Jupiter Street in Makati, there's a branch of RCBC, the Rizal Commercial Banking Corporation, one of the Philippines' large banks.

**L26** · `ANIM` · Bank branch interior. Four faceless customers wait in line, each holding a folder.
> On the 15th of May 2015, four people opened US dollar accounts at that branch. The names on the accounts were Michael Cruz, Jessie Lagrosas, Alfred Vergara and Enrico Vasquez.

**L27** · `CARD` · Source card in your own design: **May 15, 2015.** Four US dollar accounts opened. Deposit per account: **$500**. Highlight the $500 line. Source tag: *Philippine Daily Inquirer timeline.*
> Each account was opened with a deposit of 500 dollars. Then nothing happened. For nine months, the accounts just sat there.

**L28** · `ANIM` · Props only. Four 3D ID cards slide across a desk one after another. A rubber stamp lands on each: **FAKE**.
> Later it emerged that the driver's licences used to open them were fake. Investigators found that the four supposed customers all claimed the same job title and the same salary, despite working at different companies.

**L29** · `ME`
> Four strangers. Same title, same salary, fake IDs, empty accounts. And nobody asked a single question. Remember the name of that branch manager, because we'll come back to her.

**L30** · `GFX` · Map: second pin in Colombo, Sri Lanka. Label: "Shalika Foundation".
> They also lined up a second destination: a small organisation in Sri Lanka called the Shalika Foundation.

**L31** · `CARD` · Source card: *The foundation's founder says she believed the money was a legitimate donation.* Source tag: *Reuters, March 2016.*
> Its founder later said she had been told the money would be a legitimate donation, and that she was set up.

**L32** · `ME` · Lower voice. This is the "genius" moment.
> Now, the routes were ready. But a billion-dollar transfer gets noticed. So the hackers needed one more thing, and this is the part that makes security experts admire the plan. They needed time.

**L33** · `GFX` · Three large world clocks side by side: **DHAKA**, **NEW YORK**, **MANILA**. A calendar strip below: Thu 4 Feb, Fri 5, Sat 6, Sun 7, Mon 8.
> They chose the night of Thursday, the 4th of February 2016. Watch what that date does.

**L34** · `GFX` · Dhaka clock: 20:36 Thursday, moon icon. New York clock: 09:36 Thursday, sun icon.
> When it's Thursday night in Dhaka, it's Thursday morning in New York. The Fed is open and processing payments, while Bangladesh is going home.

**L35** · `GFX` · Friday and Saturday highlight in Dhaka with "WEEKEND".
> In Bangladesh, the weekend is Friday and Saturday. So the bank would be mostly empty for two days.

**L36** · `GFX` · Saturday and Sunday highlight in New York with "WEEKEND".
> By the time Dhaka came back on Sunday, New York would be on its weekend.

**L37** · `GFX` · Monday 8 Feb in Manila turns red: "LUNAR NEW YEAR — BANK HOLIDAY".
> And the money was heading to the Philippines, where Monday the 8th of February was the Lunar New Year, a public holiday.

**L38** · `GFX` · All highlighted days merge into one glowing bar labelled **"≈ 5 DAYS"**.
> Three countries, three calendars, one window of about five days where nobody who could stop the money would be at their desk.

**L39** · `ME`
> That's not a lucky hack. That's planned.

---

## ACT 3 — THE NIGHT OF THE HEIST — 06:46 to 10:43

**L40** · `ANIM` · Callback to the opening shot: the same empty 10th-floor SWIFT room at night, monitors glowing, nobody in the room. A cursor moves on its own. The wall clock reads 8:36 and the story now runs in real time.
Sound: air conditioning hum, faint ticking clock.
> Now let's go back to that room. Thursday, the 4th of February. 8:36 pm in Dhaka. The office is quiet. And the hackers begin.

**L41** · `ME`
> But before they could send a single payment, they had to solve one problem: the bank kept records, on screen and on paper.

**L42** · `EVID` · Screenshot of the BAE Systems Threat Research blog title "Two bytes to $951m" (25 April 2016). Highlight the author and date.
> Two months after the heist, investigators at BAE Systems published an analysis of malware they believed was used in it. They called their report "Two bytes to $951m."

**L43** · `GFX` · A simple block labelled "SWIFT software" with a small padlock check inside it. Zoom in to the two bytes in a code-style graphic: **`75 04`** shown in red.
> Inside the bank's SWIFT software, there was a security check. The malware changed just two bytes in the program's memory.

**L44** · `GFX` · **`75 04`** morphs into **`90 90`** in green. Caption: *"Conditional jump" → "Do nothing"*.
> Those two bytes were the instruction that said, "If this check fails, stop." The malware replaced them with instructions that do nothing.

**L45** · `ME` · Hold up two fingers.
> Two bytes. The check still ran, but its answer no longer mattered. The system would carry on as if everything had passed.

**L46** · `GFX` · Database table animation: rows labelled with transfers. Some rows are erased with a quick wipe. A balance figure changes.
> According to the same analysis, the malware could delete records of the fraudulent transfers from the bank's database and alter balance figures, so the account wouldn't look drained.

**L47** · `ANIM` · The printer. A page starts to feed, then stops. Nothing comes out.
> And it interfered with the printouts. The paper confirmations that should have revealed the transfers never appeared on the bank's printer.

**L48** · `ANIM` · Props only. The same envelope prop from the SWIFT shot, now 35 of them (instanced), fly into a grid one after another, each with a small amount tag. A floating total counter climbs to **$951 million**.
Sound: rapid typing.
> Now the stage was clear. Over the next hours, the hackers sent thirty-five payment instructions to the New York Fed, totalling about 951 million dollars.

**L49** · `ME` · First twist.
> And here's something most versions of this story leave out. According to Reuters, the Fed initially rejected the requests.

**L50** · `ANIM` · The 35 envelopes bounce back, each hit by a red **"REJECTED — FORMAT ERROR"** stamp.
> They weren't formatted correctly. They were missing required details.

**L51** · `ANIM` · The envelopes are re-stamped **"RESUBMITTED"** and fly back toward the New York vault.
> So the hackers fixed them, and sent them again.

**L52** · `ME` · Pause. Then:
> And this time, many of them should have gone through. Almost a billion dollars. Except for one word.

**L53** · `ANIM` · One envelope opens and the paper slides out. Push in on the beneficiary address line: "RCBC, **JUPITER** STREET, MAKATI". The word "JUPITER" pulses red (2D overlay).
> The Philippine bank branch was on Jupiter Street.

**L54** · `GFX` · Split screen. Left: "JUPITER" (street name). Right: a tanker ship silhouette labelled "JUPITER — US sanctions list (Iran)". A red line connects them. Text: **MATCH**.
> And by pure coincidence, "Jupiter" was also the name of an oil tanker and a shipping company on the United States' sanctions list against Iran.

**L55** · `CARD` · Source card: *"It was a 'total fluke'…"* Source tag: *Reuters Special Report, 2016.*
> The Fed's automatic sanctions screening flagged the word. The payments were pulled for human review. A source quoted by Reuters called it a "total fluke."

**L56** · `ANIM` · The 35 envelopes split. 30 turn grey and a padlock snaps onto each, with a floating tag **"HELD — $850 million"**. 5 glow orange with the tag **"PAID — $101 million"**.
> Thirty instructions, worth about 850 million dollars, were held. But by then, five had already gone through. One hundred and one million dollars.

**L57** · `GFX` · From the 5: one arrow to Sri Lanka ($20 million), four arrows to Manila ($6M, $30M, $20M, $25M).
> Four payments, adding up to 81 million dollars, went to those four accounts in Manila. One payment of 20 million went to Sri Lanka.

**L58** · `ME` · Second twist, myth-busting.
> Now, you might have heard that a spelling mistake saved the billion dollars. That's the famous version. It's not quite right. The spelling mistake is real, but it saved the 20 million.

**L59** · `ANIM` · The Sri Lanka payment message on paper. Push in on the beneficiary line: "SHALIKA **FUNDATION**". A red circle is drawn around the word (2D overlay), and "FOUNDATION" appears below it.
> The transfer was made out to the Shalika "Fundation", not Foundation.

**L60** · `GFX` · Map: the Deutsche Bank icon (intermediary) flashes a question mark.
> Deutsche Bank, which was passing the money along, noticed the error.

**L61** · `GFX` · Same map: the Pan Asia Bank icon in Colombo flashes a question mark. Arrow from Pan Asia back to Dhaka: "Too big for this account?"
> And staff at Pan Asia Bank in Sri Lanka were already suspicious, because twenty million dollars was a huge sum for a small organisation. They asked Bangladesh Bank to confirm. The payment was stopped, and the money came back.

**L62** · `ME`
> So most of the money was saved by a planet's name, and twenty million by a typo. But eighty-one million dollars was now in the Philippines. And in Dhaka, nobody knew.

---

## ACT 4 — THE WEEKEND NOBODY ANSWERED — 10:43 to 13:44

**L63** · `ANIM` · The SWIFT room in morning light. A faceless figure walks in carrying a folder. Timeline bar overlay (2D): **Friday 5 Feb, 10:30 am, Dhaka**.
> Friday morning, the 5th of February. Around half past ten, the duty officer, Zubair Bin Huda, comes in to collect the overnight SWIFT confirmations.

**L64** · `ANIM` · Same printer room as the cold open. The figure checks the empty tray, presses buttons, nothing happens.
Sound: printer beep, error tone.
> The tray is empty. He tries to print the messages manually. It doesn't work.

**L65** · `CARD` · The police-complaint quote card again: *"We thought it was a common problem, just like any other day."* Source tag: *Police complaint, as reported by Bloomberg / AFP, March 2016.*
> He assumes it's a printer problem, asks colleagues to fix it, and leaves at around 11:15. It's Friday, the holy day, and by 12:30 the office is empty.

**L66** · `ME`
> Meanwhile, in New York, it's still a working day. And the Fed is sending messages to Bangladesh Bank, asking questions about the payments. Those messages are going straight to the system nobody can read.

**L67** · `ANIM` · The SWIFT room in daylight. The figure stares at a frozen monitor, then restarts the machine. Timeline overlay (2D): **Saturday 6 Feb**.
> Saturday. Bin Huda notices the SWIFT software itself isn't responding. They try to restart it.

**L68** · `ANIM` · Close-up of a monitor showing a system error box: **"A file is missing or changed."**
Sound: Windows-style error chime, then a low drone.
> And a message appears on the screen: "A file is missing or changed."

**L69** · `ME` · Quietly.
> It was. The hackers had changed it.

**L70** · `GFX` · Timeline: **Saturday, 12:30 pm**. A stack of paper prints out in fast motion.
> By 12:30 they get the terminal running and print the messages by hand. And now they finally see it. Queries from the New York Fed about dozens of payment orders that Bangladesh Bank had never sent.

**L71** · `GFX` · Three icons light up one after another: email, fax, phone. Each one gets a "no reply" symbol. New York clock shows Saturday.
> They email the Fed, around 1:30 in the afternoon, asking it to halt all payments. They send a fax. They call. But now it's the weekend in New York. Nobody answers.

**L72** · `ME`
> Remember the five-day window? This is it working, exactly as designed.

**L73** · `GFX` · Timeline: **Sunday 7 Feb**. Dhaka clock shows office hours. New York clock shows the weekend.
> Sunday. Bangladesh's working week begins again. But in New York, it's still the weekend. The window is still open.

**L74** · `GFX` · Timeline: **Monday 8 Feb**. Manila calendar shows "LUNAR NEW YEAR".
> Monday. SWIFT is back up. Bangladesh Bank fires off urgent stop-payment orders to the Fed, to RCBC in Manila, and to other banks in the chain.

**L75** · `GFX` · Message from Dhaka arrives at the RCBC icon. A "CLOSED — HOLIDAY" sign hangs on it. Timestamp changes to **Tuesday 9 Feb**.
> But in the Philippines it's the Lunar New Year. According to the Philippine timeline, RCBC received Bangladesh Bank's stop-payment request on Tuesday the 9th.

**L76** · `CARD` · Source card: **Feb. 9.** The stop request reaches RCBC. **$58.15 million** already withdrawn. Highlight the $58.15 million. Source tag: *Philippine Daily Inquirer timeline.*
> By then, withdrawals of 58 million dollars had already been processed at the Jupiter Street branch.

**L77** · `ME` · Lean in.
> And this is where the story stops being about hackers. Because the money didn't move by itself in Manila. People moved it.

**L78** · `ANIM` · Night. A car parked outside a bank branch. Two faceless figures load heavy bags into the boot.
Sound: car door, heavy bags thudding.
> At a Philippine Senate hearing in March 2016, an RCBC employee testified that around 20 million pesos in cash had been loaded into the branch manager's car.

**L79** · `EVID` · Inquirer article screenshot: "RCBC branch manager invokes right vs self-incrimination at Senate probe" (15 March 2016). Highlight her name: Maia Santos-Deguito.
> The manager of that branch was Maia Santos-Deguito. When senators questioned her about the four accounts, she repeatedly invoked her right against self-incrimination.

**L80** · `ME`
> We'll come back to what happened to her at the end.

---

## ACT 5 — WASHING THE MONEY — 13:44 to 15:45

**L81** · `GFX` · Money-flow diagram begins. Four account boxes merge into one large box, then an arrow to "Philrem (remittance company)" with a USD to PHP currency swap icon.
> Here's how the 81 million disappeared. It moved between accounts, went to a remittance company called Philrem, and was converted into Philippine pesos.

**L82** · `GFX` · Arrows split from Philrem: "Solaire casino (Bloomberry) — about $29M", "Eastern Hawaii Leisure — about $21M", "Junket operator Weikang Xu — about $30M (cash)". The amounts appear on screen only; don't read them out. Small source tag: *Philippine Senate testimony, as reported by ABS-CBN, March 2016.*
> According to testimony at the Senate hearings, the money went three ways: to accounts at the Solaire casino resort, to a company called Eastern Hawaii Leisure, and, in cash, to a junket operator named Weikang Xu.

**L83** · `ANIM` · A casino hall in low light. Close-up: stacks of chips sliding across a baccarat table in slow motion (a rigid-body simulation of a few dozen chips is enough).
> Why casinos? Because in a casino, money becomes chips, chips become bets, and bets become "winnings". Once that happens, the trail goes cold.

**L84** · `ANIM` · Private gambling room. A dealer and faceless players around a baccarat table. Chips stacked high.
> According to the BBC's investigation, the money was played in private rooms, at baccarat, a simple game where an experienced player can expect to keep most of their stake. For weeks, players sat at the tables, washing it.

**L85** · `ME` · Third twist.
> And here's the part that should make you angry. At that time, Philippine casinos weren't covered by the country's anti-money-laundering reporting rules. Lawmakers had left them out in 2012. As far as the casinos were concerned, these were just gamblers.

**L86** · `GFX` · The Weikang Xu arrow ends in a silhouette walking onto a private jet. The jet flies off the edge of the screen. A question mark remains.
> As for Weikang Xu, according to the Philippine Senate inquiry, he's believed to have left on a private jet. He has never been found.

**L87** · `CARD` · Source card: *Kim Wong returned $4.63 million and denied the claims.* Source tag: *Rappler, Senate hearing coverage.*
> Another junket operator, Kim Wong, was named in testimony. He denied organising the scheme, but he returned millions to the authorities. Charges against him were later dropped.

**L88** · `GFX` · Map: Manila → arrow → Macau, labelled "Investigators believe…". Dotted line from Macau fades towards North Korea.
> Investigators traced links from the casino side to Macau, and believe much of the money ended up there, a territory with long-documented ties to North Korean financial networks.

**L89** · `ME`
> Which brings us to the question everyone was asking. Who was actually behind the keyboard?

---

## ACT 6 — WHO WAS IT? — 15:45 to 17:46

**L90** · `GFX` · Timeline: **29 February 2016**. Newspaper icon "Philippine Daily Inquirer".
> At first, Bangladesh Bank kept the theft quiet. Its governor hoped to get the money back without a public scandal. The story finally broke in the Philippine press at the end of February.

**L91** · `GFX` · Text card: **15 March 2016 — Bangladesh Bank Governor Atiur Rahman resigns.**
> On the 15th of March, the governor of Bangladesh Bank, Atiur Rahman, resigned.

**L92** · `EVID` · BAE Systems blog screenshot again, highlighting the hard-coded SWIFT code "BBHOBDDH". Caption: *"Bangladesh Bank's SWIFT code, written into the malware."*
> Meanwhile, security researchers were pulling the malware apart. It had been built specifically for this bank. The bank's own SWIFT code was written into it.

**L93** · `GFX` · Two pieces of code side by side, labelled "Bangladesh Bank, 2016" and "Sony Pictures attack, 2014". Matching sections glow.
> And researchers at companies like Symantec and BAE Systems noticed something else. Parts of the code resembled tools used in an earlier, famous attack: the 2014 hack of Sony Pictures in Hollywood.

**L94** · `GFX` · One word appears over the glowing code: **LAZARUS**.
> The group behind that attack was known as Lazarus.

**L95** · `EVID` · US Department of Justice press release, 6 September 2018. Highlight the headline and the line "the 2016 theft of $81 million from Bangladesh Bank".
> In September 2018, the US Department of Justice made it official. It charged a North Korean programmer, Park Jin Hyok.

**L96** · `EVID` · FBI "Wanted" poster for Park Jin Hyok (US government work). Slow push-in.
> The FBI alleges he was part of a hacking team working for a North Korean government front company, and that the same group was behind the Sony attack and the WannaCry ransomware outbreak, which hit Britain's National Health Service in 2017.

**L97** · `GFX` · Small disclaimer card: *"These are charges. A defendant is presumed innocent unless proven guilty. North Korea denies the allegations."*
> These are charges, not a conviction. Park has never been arrested, and North Korea denies all of it.

**L98** · `GFX` · Stylised night-lights map of the Korean peninsula: South Korea glowing with city lights, North Korea almost completely dark. Small credit tag: *Based on NASA night-lights imagery.*
Sound: low ambient drone.
> This is the Korean peninsula at night, seen from space. South Korea blazes with light. North Korea is almost completely dark.

**L99** · `ME` · Slow, direct to camera. Let each sentence land.
> One of the poorest, most isolated countries on Earth. A place where most people can't even access the global internet. Stands accused of reaching into a central bank on the other side of Asia, and nearly walking away with a billion dollars.

---

## ACT 7 — TEN YEARS LATER — 17:46 to 20:10

**L100** · `GFX` · Calendar pages flip quickly from 2016 to 2026.
> So what happened next?

**L101** · `CARD` · Source card: **January 2019.** Maia Santos-Deguito found guilty on eight counts of money laundering. Source tag: *ABS-CBN, January 2019.*
> In January 2019, Maia Santos-Deguito was convicted on eight counts of money laundering. An appeals court upheld the conviction in 2023.

**L102** · `GFX` · Text card: *RCBC fined ₱1 billion by the Philippine central bank (2016) — the largest fine it had ever imposed.*
> RCBC was fined one billion pesos by the Philippine central bank. It has always denied that it was part of any conspiracy, and it is still fighting Bangladesh Bank in court.

**L103** · `GFX` · Running tally: "$101M stolen → $20M back from Sri Lanka → about $15M back from the Philippines → **Most never recovered**."
> Of the 101 million, the Sri Lankan 20 million came back. From the Philippines, only a fraction has been recovered. Most of it has never been seen again.

**L104** · `EVID` · Daily Star / TBS headline, September 2025: "Dhaka court orders confiscation of $81m from RCBC".
> In September 2025, a court in Dhaka ordered that 81 million dollars be confiscated from RCBC. Whether the Philippines will ever enforce it is another question.

**L105** · `ME` · Final twist. Slow.
> Now, the question I promised you, and the part I find most disturbing. From the very beginning, investigators suspected the hackers had help inside Bangladesh.

**L106** · `CARD` · Source card: **June 2026.** CID drafts a charge sheet naming 64 people and entities. Follow with the "charged, not convicted / presumed innocent" text card. Source tag: *The Business Standard, 18 June 2026.*
> In 2026, Bangladesh's Criminal Investigation Department drafted a charge sheet naming 64 people and organisations. According to reports, they include former Bangladesh Bank officials. None of them has been tried, and they are presumed innocent.

**L107** · `CARD` · Source card: **14 September 2026.** "Probe report delayed for 98th time." Source tag: *The Business Standard.* Update this card if a newer delay has been reported (the last deadline was 19 October 2026).
> And the final investigation report? As of this recording, its deadline has been pushed back ninety-eight times.

**L108** · `ME`
> Ten years. Ninety-eight extensions. A hacker who's never been arrested. A man who left on a private jet. And tens of millions of dollars that vanished across a baccarat table.

**L109** · `ANIM` · Return to the printer room from the cold open. Same angle, same empty tray. Then, for the first time, the printer whirs and a single page slides out. Hold on the page. Cut to black.
Sound: printer whir, then silence.
> All of it began with a printer that stopped working on a Friday morning, and a man who thought it was a normal glitch.

**L110** · `ME` · Lighter, conversational. Lights slightly warmer.
> So what do you think: was this purely a foreign hack, or could it never have worked without someone on the inside? Tell me in the comments. I read every one.

**L111** · `ME` → `GFX` · End screen: subscribe button on the right. (Add a next-video card once Episode 2 is live. End screens can be edited after upload.)
> If you like stories about money that vanished and the people who thought no one would notice, subscribe to Unfiction. There's another one coming soon.

**L112** · `GFX` · End screen with subscribe button and next-video card. Logo sting.
Sound: logo sting.

---

## On-screen disclaimers to include

- On every `ANIM` shot: small **"Dramatisation"** label, bottom corner.
- On every `CARD`: the source named at the bottom.
- At L97 and L106: the "charged, not convicted / presumed innocent" text card.
- In the description: *"This video is based on public court records, official statements and published journalism. Allegations against individuals are unproven unless a conviction is stated. Corrections will be pinned in the comments."*

---

## Sources to cross-verify

| Claim | Source |
|---|---|
| FBI charge against Park Jin Hyok, Lazarus link, Sony and WannaCry, spear-phishing | [US DOJ press release, 6 Sep 2018](https://www.justice.gov/opa/pr/north-korean-regime-backed-programmer-charged-conspiracy-conduct-multiple-cyber-attacks-and) |
| "Rasel Ahlam" CV email (Jan 2015), the 20:36 start, five-day window, Jupiter Street accounts with fake licences and identical job titles, Xu on a private jet, baccarat, Macau | [BBC, "The Lazarus heist", 20 Jun 2021](https://www.bbc.com/news/stories-57520169) |
| Two-byte patch, deleting records, altering balances, printer manipulation, Bangladesh Bank SWIFT code in malware | [BAE Systems, "Two bytes to $951m", 25 Apr 2016](https://baesystemsai.blogspot.com/2016/04/two-bytes-to-951m.html) |
| "Jupiter" sanctions match, "total fluke" | [Reuters Special Report, 2016](https://www.reuters.com/article/world/special-report-how-the-new-york-fed-fumbled-over-the-bangladesh-bank-heist-idUSKCN1011CT/) |
| Fed first rejected the requests for formatting, then processed resubmitted ones | [Reuters Exclusive, 2016](https://www.reuters.com/article/technology/exclusive-ny-fed-first-rejected-cyber-heist-transfers-then-moved-81-million-idUSKCN0YR0VM/) |
| "Fundation" spelling, Deutsche Bank and Pan Asia Bank, the four RCBC amounts ($6M, $30M, $20M, $25M) | [Reuters, "How millions disappeared"](https://www.reuters.com/article/world/asia-pacific/how-millions-from-the-bangladesh-bank-heist-disappeared-idUSKCN1011EE/) |
| Printer tray empty, "common problem" quote, "A file is missing or changed", 12:30 manual print, email/fax/phone, Monday stop orders | [Business Times / Bloomberg, Mar 2016](https://www.businesstimes.com.sg/companies-markets/banking-finance/printer-error-triggered-bangladesh-race-halt-cyber-heist), [SecurityWeek / AFP](https://www.securityweek.com/faulty-printer-implicated-81-million-bangladesh-bank-heist/) |
| 15 May 2015 accounts, $500 deposits, Philrem, Feb 9 stop request, $58.15M withdrawn | [Philippine Daily Inquirer timeline](https://newsinfo.inquirer.net/772258/timeline-81-m-money-laundering) |
| Deguito invoking self-incrimination | [Inquirer, 15 Mar 2016](https://newsinfo.inquirer.net/773852/rcbc-branch-manager-invokes-right-vs-self-incrimination-at-senate-probe) |
| 20 million pesos loaded into manager's car (testimony), Solaire $29M, Eastern Hawaii $21M, Xu about $30M | [ABS-CBN, 17 Mar 2016](https://www.abs-cbn.com/business/03/17/16/p20-m-loaded-into-rcbc-managers-car-witness) |
| Kim Wong returned $4.63M, denied claims | [Rappler, 4th Senate hearing](https://www.rappler.com/business/industries/128366-fourth-hearing-bangladesh-bank-heist/) |
| Governor resigned 15 Mar 2016, Deguito conviction 2019 and appeal 2023, RCBC ₱1B fine, casinos excluded from AML rules in 2012 | [Wikipedia summary with citations](https://en.wikipedia.org/wiki/Bangladesh_Bank_robbery) — follow its links to primary reporting |
| Dhaka court orders $81M confiscation (18 Sep 2025) | [The Daily Star](https://www.thedailystar.net/news/bangladesh/crime-justice/news/dhaka-court-orders-confiscation-81m-rcbc-3991416), [TBS](https://www.tbsnews.net/bangladesh/bb-reserve-heist-dhaka-court-orders-confiscation-81m-philippine-bank-1241896) |
| Draft chargesheet naming 64 people and entities | [TBS, 18 Jun 2026](https://www.tbsnews.net/bangladesh/crime/bb-reserve-heist-cid-drafts-chargesheet-naming-64-people-entities-1466131) |
| Investigation report delayed 98th time, next date 19 Oct 2026 | [TBS, 14 Sep 2026](https://www.tbsnews.net/bangladesh/court/bangladesh-bank-reserve-heist-probe-report-delayed-98th-time-1542216) |

---

## Points where sources disagree (check before recording)

1. **What stopped the $850 million.** Wikipedia says the misspelling. Reuters, the BBC and US Congresswoman Carolyn Maloney say the "Jupiter" sanctions match stopped the Fed payments, and the misspelling stopped only the $20 million to Sri Lanka. The script follows Reuters and the BBC.
2. **When the hackers got in.** The FBI and BBC date the phishing email to January 2015. Bangladesh Bank's own early forensic findings said malware was installed in January 2016. The script uses the FBI date, since it comes from the criminal complaint.
3. **How much was recovered from the Philippines.** Figures range from about $15 million to over $30 million, depending on the source and on what is counted. The script deliberately says "only a fraction".
4. **Four or five accounts.** Most sources say four accounts received the $81 million. Bangladesh's CID has referred to five fake accounts. The script uses four.
5. **Status of the Dhaka investigation.** The report was due on 19 October 2026. Check whether it was filed or delayed again before you publish, and update L107. The deadline was 19 October 2026, so look for a 99th delay.
6. **"Jupiter" Fed numbers.** "Thirty held, five paid" is consistent across Reuters, the BBC and Wikipedia. The 46 queried payment orders in the police complaint include the Fed's queries on individual messages, so don't use 46 as the number of transfers.

---

## Legal notes for this episode

- **Park Jin Hyok:** always "charged" or "alleged"; never "the hacker who did it".
- **Kim Wong:** say he was named in testimony, denied it, and charges were dropped. Never call him the mastermind.
- **RCBC:** state the fine and the court cases, and that it denies conspiracy.
- **Deguito:** convicted, so you can say so, but don't add details beyond the record.
- **The 64 people in the draft chargesheet:** don't name individuals. Say "former Bangladesh Bank officials, according to reports", and that none has been tried.
- **Atiur Rahman:** mention only that he resigned. Don't connect him to the draft chargesheet in the video.

---

## Revision log — v2

- **Title:** working title is now *The Word That Saved $850 Million*. The old printer title implied the printer nearly let the thieves win, which the script itself contradicts. It is kept as an alternative with a more accurate verb.
- **Opening rebuilt:** starts on the heist itself (cursor, 35 orders, $951M), delivers the "one word" hook, then introduces the printer as the first sign. The promise to stay to the end now names a clear unanswered question: did the thieves have help from the inside? The ending answers it.
- **No stock footage:** the Dhaka aerial, Manila street and casino shots are now Blender scenes. The SWIFT envelope shot, the 35-envelope sequence, the address close-ups, the four ID cards and the Friday/Saturday office shots also moved from 2D to Blender, reusing the same props and rooms. Blender went from about 11% to about 23% of screen time, and stock went from about 4% to 0%.
- **Fewer images:** news screenshots became your own `CARD` shots with source tags. Only the real documents that matter stay as `EVID` (BAE report, Deguito hearing article, DOJ release, FBI poster, Dhaka confiscation headline). The NASA image is now a stylised 2D map.
- **Act 1 tightened:** two stock shots merged into one, and the unsourced poverty statistic was removed.
- **Timeline gap closed:** added a Sunday beat between Saturday and Monday.
- **Audio-friendly:** long narration lines split (the two-byte patch, Pan Asia Bank, Lazarus), the North Korea line given full stops to breathe, and the Philippine casino amounts moved to on-screen text only.
- **End screen:** no longer promotes a video that does not exist yet.
- **Timestamps:** recalculated from word count.

