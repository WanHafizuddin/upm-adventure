# Case Files: Serdang Raya — The Case

The story behind the game: who died, who did it, how, and how the player can prove it. Companion to the [game design](2026-09-27-campus-mystery-game-design.md).

**Every story decision here is Claude's call** (the developer asked Claude to choose). All of it lives in data files under `game/src/data/`, so any name, line or clue can be changed without touching game code.

The case is set at UPM Serdang (see the game design's Setting). Every person and event in it is fictional. Tone is noir-lite: the death is a poisoning, nothing graphic is shown.

---

## The victim

**Dr. Rosli Kamarudin**, senior lecturer in Chemistry, Fakulti Sains, UPM. Exacting, suspicious and often right. Known for auditing everything and everyone. Carries the same steel coffee tumbler everywhere.

Found collapsed beside the courtyard fountain at about 10:40 pm by campus security. He was poisoned through his coffee.

## The player

A student living at KTDI who was studying late in the faculty and heard the commotion. They have no authority, only curiosity, and the suspects talk to them more openly than to the police.

## The suspects

| | Farah Idris | Daniel Wong | Dr. Priya Nair |
|---|---|---|---|
| **Who** | PhD student, Rosli supervised her | Chemistry lab manager | Senior lecturer, Rosli's colleague of 15 years |
| **Looks like** | dusty-pink tudung, cream blouse | white lab coat | maroon kurta, glasses, long black hair |
| **Apparent motive** | Rosli called her results "impossible" and threatened to end her PhD | Rosli kept auditing the lab stores | Bitter feud: Rosli accused her of copying his grant proposal |
| **Claimed alibi** | Library, level 3, all evening | In Lab 2 all night, running an overnight experiment, signing the logbook every half hour | Argued with Rosli in the courtyard at 9:30, then on a video call in her office, 10:00–11:00 |
| **Truth** | Innocent. Her alibi holds. | **The killer.** | Innocent. Her alibi holds. |

## What really happened

1. For months Daniel had been quietly selling reagents from the chemistry stores and topping up the stock bottles to hide it. The topped-up stock contaminated Farah's samples, which is why her results looked impossible.
2. Rosli's audit found the missing stock. He planned to report Daniel to the Dean in the morning. He also realised Farah's results had been sabotaged, and wrote her a note asking to meet at ten to tell her. That's the **torn note**.
3. Daniel pre-signed the 10:00 and 10:30 lines of his experiment logbook. At 9:41 pm he left the building using his spare access card.
4. At about 9:45 pm Rosli filled his tumbler in the faculty pantry, then stepped out to the courtyard and had a loud argument with Priya. Daniel laced the coffee while the tumbler sat on the pantry counter. The cleaner saw him there.
5. Daniel went back in at 10:24 pm. Somewhere outside he dropped his **main access card**, the one he later claims he "lost days ago".
6. Rosli drank the coffee by the fountain while waiting for Farah, who never came because she was too scared. He collapsed around 10:30.

## Clues, by day

Clues marked ★ are needed to prove the case. The others are red herrings or context.

| Day | Clue | Where | What it shows |
|---|---|---|---|
| 1 | Coffee Tumbler ★ | Examining the crime scene | Bitter smell: he was poisoned through his coffee |
| 1 | Torn Note | On the ground by the tape | Rosli asked Farah to meet him at ten (points at Farah) |
| 1 | Lab Access Card ★ | In the grass near the hedge | Daniel's main card, outside, on the night |
| 1 | Farah's Alibi | Farah's statement | Library, level 3, borrowed books before closing |
| 1 | Daniel's Alibi | Daniel's statement | Lab 2, logbook signed every half hour |
| 1 | The Argument | Priya's statement | Priya argued with Rosli at 9:30 |
| 2 | Library Gate Log | PSAS (Perpustakaan Sultan Abdul Samad) | Farah's student card exits at 10:55 (clears Farah) |
| 2 | Door Access Log ★ | Pejabat Keselamatan (security office) | Daniel's spare card out 9:41, in 10:24; his "lost" main card was used at 6:15 that evening |
| 2 | Cleaner's Statement ★ | Fakulti Sains pantri | Daniel was at the pantry around 9:45, near a steel tumbler |
| 3 | Pre-signed Logbook ★ | Lab 2 | The 10:00 and 10:30 signatures are identical, written in one go |
| 3 | Rosli's Audit Notes ★ | Rosli's office | Reagent missing from stores; meeting with the Dean booked for the morning |
| 3 | Video Call Record | Priya's office | Call ran 9:58–11:02 (clears Priya) |
| 4 | Toxicology Report ★ | Inspektor Aziz, in the courtyard | The poison matches the reagent missing from the Lab 2 stores |

## Deduction board links

Day 1 links:

| Connect | Unlocks | Insight shown |
|---|---|---|
| Coffee Tumbler ↔ Dr. Rosli | `linked_tumbler_to_victim` | Dr. Rosli was poisoned through his coffee. |
| Torn Note ↔ Farah | `linked_note_to_farah` | Farah was supposed to meet Dr. Rosli at ten. |
| Lab Access Card ↔ Daniel | `linked_card_to_daniel` | Daniel's lab card was out here in the courtyard. |
| The Argument ↔ Priya | `linked_argument_to_priya` | Priya was the last person seen arguing with Dr. Rosli. |

Later days add links such as Library Gate Log ↔ Farah's Alibi (Farah cleared), Door Access Log ↔ Lab Access Card (Daniel lied), Pre-signed Logbook ↔ Daniel's Alibi (alibi broken), and Toxicology Report ↔ Rosli's Audit Notes (motive and means).

## Day goals

- **Day 1 (built):** meet all three suspects (`met_farah`, `met_daniel`, `met_priya`), examine the crime scene (`examined_scene`), and work out how he died (`linked_tumbler_to_victim`).
- **Day 2 (built):** PSAS (Puan Lim, librarian on night duty), the security office (Encik Rahman, the guard who found him) and the Fakulti Sains ground floor (Kak Ani, the cleaner). Goals: meet all three (`met_librarian`, `met_guard`, `met_cleaner`) and clear Farah (`farah_cleared`). Day 2 links: Library Gate Log ↔ Farah's Alibi, Door Access Log ↔ Lab Access Card, Door Access Log ↔ Daniel's Alibi, Cleaner's Statement ↔ Coffee Tumbler.
- **Day 3 (built):** Makmal 2 (Daniel is there), Fakulti Sains Aras 1, Dr. Rosli's office and Dr. Priya's office (she is there). Goals: read the logbook (`examined_logbook`), search Rosli's office (`examined_rosli_office`), ask Priya about her call (`checked_priya_call`), and on the board break Daniel's alibi (`daniel_alibi_broken`: Pre-signed Logbook ↔ Daniel's Alibi) and clear Priya (`priya_cleared`: Video Call Record ↔ The Argument). Optional: Rosli's Audit Notes ↔ Daniel (`daniel_motive`).
- **Day 4 (built):** Inspektor Aziz brings the toxicology report. Match the poison to the stores on the board (Toxicology Report ↔ Rosli's Audit Notes) and confront Daniel in Makmal 2 with the report.
- **Day 5 (built):** everyone gathers in the courtyard; tell Inspektor Aziz you're ready, then choose the killer and exactly three pieces of evidence.

## Endings

- **True ending:** accuse Daniel with at least three ★ clues that cover opportunity (Door Access Log or Pre-signed Logbook), means (Toxicology Report or Cleaner's Statement) and motive (Rosli's Audit Notes).
- **Right but unproven:** accuse Daniel without that coverage. He walks.
- **Wrong suspect:** accuse Farah or Priya. The real killer is never charged.
- **Not ready:** fewer than three clues chosen. The game tells the player to keep investigating.
