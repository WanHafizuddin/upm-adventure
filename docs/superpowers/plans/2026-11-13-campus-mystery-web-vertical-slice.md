# Campus Mystery — Day 1 Vertical Slice (Web) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Day-1 vertical slice as a browser game. The player walks a side-view corridor, talks to one suspect, picks up two clues, connects evidence on a deduction board, and sees Day 1 complete. This proves the full core loop before any other days or suspects are built.

**Architecture:** A Vite + TypeScript project in `game/`. Game rules live in `game/src/logic/` as plain TypeScript with no Phaser import, covered by Vitest. Day-1 content lives in `game/src/data/day1.ts` as typed data. One Phaser scene (`game/src/scenes/Day1Scene.ts`) draws the world and handles movement and interaction. The dialogue box, deduction board and toasts are HTML overlays in `game/src/ui/`. A single `GameState` object is shared by the scene and the overlays.

**Tech Stack:** Phaser 4.2.1, TypeScript 5.9, Vite 6.4, Vitest 3.2, Node 20.16.

**Spec:** [2026-09-27-campus-mystery-game-design.md](../specs/2026-09-27-campus-mystery-game-design.md) (revised 2026-11-13: side-view 2D, web stack).

**Status (2026-11-13):** Tasks 1–10 implemented and play-tested (Task 8 switched to top-down, Task 9 built the full Day 1, Task 10 added Day 2 and the UPM setting); 49 unit tests pass; `npm run build` succeeds. Nothing committed yet. Where the build differs from the steps below, the notes in each task say so.

**Supersedes:** [2026-09-27-campus-mystery-vertical-slice.md](2026-09-27-campus-mystery-vertical-slice.md) (the Unity plan).

## Global Constraints

- Side-view 2D. The player only walks left/right in this slice. The camera follows and stops at the room's edges.
- Internal resolution 480×270, `pixelArt: true`, scaled to fit the window. Placeholder art is flat-colored rectangles generated in code.
- Night mood: dim cool ambient light, warm point light over the suspect.
- Set at UPM Serdang with real UPM names, places and branding (revised 2026-11-13, see the spec's Setting). People and events stay fictional; witnesses are generic roles.
- Noir-lite tone. No gore.
- `game/src/logic/**` must not import Phaser or touch the DOM.
- Keys: A/D or Left/Right walk, E interact, Tab open/close the board, Esc close the dialogue or board.
- No stealth, chase or enemy AI.

## Review Focus

- **Two interactables within reach when E is pressed:** only the nearest responds. Pinned by `interaction.test.ts`.
- **Board dragged suspect→clue instead of clue→suspect:** connects the same way. Pinned by `deduction.test.ts`.
- **The same valid link made twice:** no error, flags not set twice, no second "connected" message. Pinned by `deduction.test.ts`.
- **Walking or pressing E while dialogue or the board is open:** nothing happens behind the overlay. Task 7 checklist.
- **Opening the board before picking up any clue:** it shows only the suspect and a hint, and doesn't break. Task 6 checklist.

---

### Task 1: Scaffold the project

**Files:** `game/package.json`, `game/tsconfig.json`, `game/vite.config.ts`, `game/index.html`, `game/src/main.ts`, `game/src/style.css`, `.gitignore`

- [ ] **Step 1:** Create `game/package.json` with scripts `dev` (`vite`), `build` (`tsc --noEmit && vite build`), `test` (`vitest run`), `typecheck` (`tsc --noEmit`). Dependencies `phaser@4.2.1`; dev dependencies `typescript@~5.9.3`, `vite@~6.4.6`, `vitest@~3.2.7`. Run `npm install` in `game/`.
- [ ] **Step 2:** `vite.config.ts`: `base: './'` (so the build works from a subfolder on itch.io), dev server port `5173`, Vitest `environment: 'node'`, `include: ['src/**/*.test.ts']`. `tsconfig.json`: `strict`, `target ES2022`, `module ESNext`, `moduleResolution bundler`, `noEmit`.
- [ ] **Step 3:** `index.html` has `<div id="game">` for the canvas and `<div id="ui">` for overlays. `main.ts` boots an empty Phaser game (480×270, `pixelArt: true`, `Scale.FIT` + `CENTER_BOTH`). WebGL renderer, because lighting needs it. No physics engine: the player only walks left/right, so movement is a clamped x position.
- [ ] **Step 4:** Repo-root `.gitignore`: ignore `game/node_modules/` and `game/dist/`. Replace the Unity rules with a single `/CampusMystery/` line, because the old Unity project is no longer used.
- [ ] **Step 5:** Verify: `npm run typecheck` passes and `npm run dev` serves a dark canvas at `http://localhost:5173`.
- [ ] **Step 6:** Commit `chore: scaffold Phaser + TypeScript web project`.

### Task 2: Clues, flags and day completion

**Files:** `game/src/logic/clues.ts`, `flags.ts`, `day.ts` and their `*.test.ts`

**Produces:**
- `interface Clue { id: string; name: string; description: string }`
- `class ClueInventory { add(clue: Clue): boolean; has(id: string): boolean; all(): readonly Clue[] }`. `add` returns `false` and changes nothing if the id is already held.
- `class Flags { set(id: string): boolean; get(id: string): boolean }`. `set` returns `true` only the first time.
- `isDayComplete(required: readonly string[], flags: Flags): boolean`

- [ ] **Step 1: Tests first.** `clues.test.ts`: `has` is false before `add`; true after; adding the same id twice returns `false` the second time and `all()` has length 1. `flags.test.ts`: `get` false for an unset flag; `set` returns `true` then `false`; `get` true after `set`. `day.test.ts`: false when any required flag is missing; true when all are set; true for an empty list.
- [ ] **Step 2:** `npm test` fails (modules missing).
- [ ] **Step 3:** Implement the three modules.
- [ ] **Step 4:** `npm test` passes.
- [ ] **Step 5:** Commit `feat: add clue inventory, flags and day completion`.

### Task 3: Dialogue rules

**Files:** `game/src/logic/dialogue.ts`, `dialogue.test.ts`

**Produces:**
- `interface DialogueChoice { text: string; next: string | null; requiresClue?: string }`. `next: null` ends the conversation.
- `interface DialogueNode { id: string; speaker: string; text: string; setsFlag?: string; choices: DialogueChoice[] }`
- `isChoiceAvailable(choice: DialogueChoice, inventory: ClueInventory): boolean`
- `resolveChoice(node: DialogueNode, index: number, nodes: Readonly<Record<string, DialogueNode>>): DialogueNode | null`. Returns the next node; `null` if the choice ends the conversation; `node` itself if the index is out of range or `next` names an unknown node.

- [ ] **Step 1: Tests first.** A choice with no requirement is available; one requiring `torn_note` is unavailable until the inventory holds it. `resolveChoice` follows `next`; returns `null` for `next: null`; returns the same node for index 5 and for an unknown `next`.
- [ ] **Step 2:** Run, see it fail. **Step 3:** Implement. **Step 4:** Run, see it pass.
- [ ] **Step 5:** Commit `feat: add dialogue choice gating and traversal`.

### Task 4: Deduction and interaction rules, game state

**Files:** `game/src/logic/deduction.ts`, `interaction.ts`, `gameState.ts` and their `*.test.ts`

**Produces:**
- `interface DeductionLink { clueId: string; targetId: string; unlockFlags: string[] }`
- `interface ConnectionResult { valid: boolean; unlockFlags: readonly string[] }`
- `class DeductionValidator { constructor(links: readonly DeductionLink[]); tryConnect(a: string, b: string): ConnectionResult; isConnected(a: string, b: string): boolean }`. Order of `a`/`b` doesn't matter. A link that was already made returns `{ valid: false, unlockFlags: [] }`.
- `pickNearest(originX: number, candidates: readonly { x: number }[], reach: number): number`. Index of the candidate with the smallest `|x - originX|` that is `<= reach`; first one wins a tie; `-1` if none is in reach.
- `class GameState { inventory; flags; validator; constructor(links, day1Required); connect(a, b): ConnectionResult; isDay1Complete(): boolean; onChange(listener: () => void): void }`. `connect` sets every unlocked flag. Anything that changes the inventory or flags goes through `GameState` methods (`pickUp(clue)`, `setFlag(id)`), which notify listeners.

- [ ] **Step 1: Tests first.**
  - `deduction.test.ts`: clue→suspect valid with `['linked_note_to_suspect_a']`; suspect→clue valid too; unrelated pair invalid with `[]`; the same pair a second time (either order) invalid with `[]`; `isConnected` true after a valid connect.
  - `interaction.test.ts`: no candidates → `-1`; candidates at x 120 and 105 from origin 100, reach 30 → `1`; candidates at 90 and 110 → `0`; a candidate at 200 with reach 30 → `-1`.
  - `gameState.test.ts`: `isDay1Complete()` false at start; still false after only `setFlag('met_suspect_a')`; true after also `connect('torn_note', 'suspect_a')`; listener is called on `pickUp`, `setFlag` and a valid `connect`.
- [ ] **Step 2:** Run, see it fail. **Step 3:** Implement. **Step 4:** Run, see it pass.
- [ ] **Step 5:** Commit `feat: add deduction validator, interaction picking and game state`.

### Task 5: Day-1 data and the world scene

**Files:** `game/src/data/day1.ts`, `game/src/scenes/Day1Scene.ts`, `game/src/main.ts`, `game/src/phaser-fixes.d.ts` (Phaser 4.2.1's types leave `setLighting` off `Shape`, though the runtime has it)

**Day-1 data** (exact copy):
- Clues: `torn_note` "Torn Note", "A half-burned note found near the scene, addressed to Suspect A."; `alibi_witness_statement` "Alibi Witness Statement", "A librarian confirms someone matching Suspect A's description was in the library that night."
- Suspect: `suspect_a`, display name "Suspect A".
- Dialogue (`speaker: 'Suspect A'`):
  - `suspectA_1`, `setsFlag: 'met_suspect_a'`, "I was in the library the whole evening. Ask anyone." Choices: "Ask something else" → `suspectA_1`; "Ask about the note" → `suspectA_2` (requires `torn_note`); "Leave" → `null`.
  - `suspectA_2`, "...Okay. Fine. That note isn't what you think it is." Choice: "Leave" → `null`.
- Links: `torn_note` + `suspect_a` → `['linked_note_to_suspect_a']`.
- Day-1 required flags: `met_suspect_a`, `linked_note_to_suspect_a`.

**Scene layout** (world units are pixels; the room is 960×270, two screens wide; the floor's top edge is y = 230):

| Thing | x | Look |
|---|---|---|
| Back wall, floor, skirting line | whole room | dark blue-grey bands |
| Left/right walls | 0–8, 952–960 | darker; the player can't pass them |
| Player | starts at 60 | 14×32 light-grey block, speed 90 px/s, x clamped between the end walls, weak torch light that follows them |
| Torn note | 300 | 8×6 pale-yellow block on the floor |
| Suspect A | 560 | 14×32 muted-red block |
| Desk + lamp | 600 | a desk block, warm point light at (600, 150), radius 140 |
| Alibi statement | 820 | 8×6 pale-yellow block |
| Ceiling lights | 160, 460, 760 | weak cool point lights |

- Ambient light is dim and cool, so the corridor reads as night, with the desk lamp clearly warmer and brighter.
- Camera follows the player with bounds `(0, 0, 960, 270)`.
- Reach for interaction is 28 px. The nearest interactable in reach shows a small "E" prompt above it. Picked-up clues disappear from the world.

- [ ] **Step 1:** Write `day1.ts`.
- [ ] **Step 2:** Write `Day1Scene` with movement, camera, lights, interaction picking via `pickNearest`, and the prompt. E on a clue calls `state.pickUp`. E on the suspect asks the UI layer to open dialogue (Task 6 provides it; until then, log to console).
- [ ] **Step 3:** Verify in the browser: walk both ways, walls stop the player, the camera stops at the room's edges, the prompt appears near each interactable, and clues disappear when picked up.
- [ ] **Step 4:** Commit `feat: add Day 1 corridor scene with movement and interaction`.

### Task 6: Dialogue box, deduction board, toasts

**Files:** `game/src/ui/dialogueBox.ts`, `game/src/ui/deductionBoard.ts`, `game/src/ui/toast.ts`, `game/src/ui/overlay.ts`, `game/src/style.css`

**Produces:**
- `class Overlays { constructor(root: HTMLElement, state: GameState, content: { dialogue; suspects }); openDialogue(startId: string): void; chooseNumber(n: number): void; toggleBoard(): void; closeAll(): void; isBlocking(): boolean; isDialogueOpen(): boolean; toast(text: string): void }`. Keys 1–3 pick dialogue replies.
- The dialogue box shows the speaker, the text and one button per choice. Unavailable choices are shown disabled with "(needs a clue)". Entering a node applies its `setsFlag` through `state.setFlag`. `null` or Esc closes it.
- The board lists Suspect A plus every collected clue as cards. Dragging from one card to another (pointer events) draws a line in an SVG layer. On drop, it calls `state.connect`. A valid result turns both cards green, keeps the line, and toasts "Connected: Torn Note ↔ Suspect A". An invalid result toasts "These don't connect." unless the pair is already connected. If no clues have been collected yet, it shows "Collect clues to add them to the board."
- Toasts: "Picked up Torn Note", and once only, "Day 1 complete. The case continues tomorrow." when `state.isDay1Complete()` first becomes true.

- [ ] **Step 1:** Write the overlays and styles: dark translucent panels, a serif headline font for the noir feel, readable 16px+ body text.
- [ ] **Step 2:** Wire them into `Day1Scene`. E on the suspect opens dialogue, Tab toggles the board, and the scene ignores movement and E while `isBlocking()` is true.
- [ ] **Step 3:** `npm run typecheck` and `npm test` pass.
- [ ] **Step 4:** Commit `feat: add dialogue box, deduction board and toasts`.

### Task 7: Play-test and build

- [ ] **Step 1: Full checklist in the browser.**
  - [ ] Walk from the start to both clues and the suspect. Walls stop the player, and the camera never shows past the room.
  - [ ] Picking up each clue toasts its name and removes it from the floor.
  - [ ] Before the torn note is held, "Ask about the note" is disabled. After, it leads to the second line.
  - [ ] While dialogue or the board is open, A/D and E do nothing. Esc closes either one.
  - [ ] Board: Torn Note ↔ Suspect A connects in either drag direction. Alibi Statement ↔ Suspect A is rejected. Repeating a made link changes nothing.
  - [ ] "Day 1 complete" appears exactly once, only after both talking to the suspect and making the link.
  - [ ] The corridor reads as dim and cool, with a warm pool of light at the desk.
  - [ ] No errors in the browser console.
- [ ] **Step 2:** `npm run build` succeeds and `game/dist/` runs from a static server.
- [ ] **Step 3:** Commit `feat: Day 1 web vertical slice playable end-to-end`.

### Task 8: Switch to top-down with original pixel art

The developer asked for a top-down view in the style of a top-down pixel-art reference (see spec revision history). Tasks 1–7 stand. This task changes the view, movement and art.

**Files:**
- Modify: `game/src/logic/interaction.ts` + test (2D distance), `game/src/main.ts` (arcade physics, `maxLights: 16`), `game/src/ui/overlays.ts` (HUD text)
- Create: `game/src/logic/movement.ts` + `movement.test.ts`
- Create: `game/src/art/pixelCanvas.ts` (drawing helper), `game/src/art/palette.ts`, `game/src/art/sprites.ts` (every generated texture)
- Replace: `game/src/scenes/Day1Scene.ts` (courtyard)

**Produces:**
- `pickNearest(origin: { x: number; y: number }, candidates: readonly { x: number; y: number }[], reach: number): number`. Straight-line distance; first wins a tie; `-1` if none in reach.
- `moveVector(input: { left: boolean; right: boolean; up: boolean; down: boolean }): { x: number; y: number }`. Unit-length or zero; opposite keys cancel.
- `facingFor(v: { x: number; y: number }, previous: Facing): Facing`, with `type Facing = 'down' | 'up' | 'left' | 'right'`. Horizontal wins on a diagonal; zero keeps `previous`.
- `class PixelCanvas { constructor(w, h); px(x, y, color); rect(x, y, w, h, color); ellipse(cx, cy, rx, ry, color); outline(color); toTexture(scene, key) }`. Colors are `#rrggbb` strings; `outline` adds a 1 px border around every filled pixel.
- `createSprites(scene: Phaser.Scene): void`. Registers every texture key the courtyard uses (`ground`, `building`, `tree`, `bush`, `lamp`, `bench`, `fountain`, `tape`, `briefcase`, `paper`, `player_<facing>_<0|1>`, `suspect_<facing>_0`).

- [ ] **Step 1: Tests first.** `interaction.test.ts`: no candidates → `-1`; `(110,100)` vs `(100,104)` from `(100,100)` with reach 30 → index 1; tie `(90,100)`/`(110,100)` → 0; `(100,140)` with reach 30 → `-1` (vertical distance counts). `movement.test.ts`: no keys → `{0,0}`; right → `{1,0}`; up+right → length 1 with `x > 0`, `y < 0`; left+right → `{0,0}`. `facingFor`: `{0,1}` → `down`; `{-0.7,-0.7}` → `left`; `{0,0}` keeps `previous`.
- [ ] **Step 2:** Run, see them fail. **Step 3:** Implement. **Step 4:** Run, see them pass.
- [ ] **Step 5:** Art: write `PixelCanvas`, the palette and `createSprites`. Every prop gets a dark outline. Ground is one 768×544 texture: indigo grass with noise and tufts, stone paths, a ring-stone plaza around the fountain, and flower beds.
- [ ] **Step 6:** Courtyard scene, 768×544 (two screens each way):

  | Thing | Where | Notes |
  |---|---|---|
  | Faculty building | top band, y 0–112 | lit and dark windows, double door at x 384, wall lamp; blocks movement |
  | Fountain plaza | centre (384, 300) | dry fountain blocks movement; ring path around it |
  | Paths | door → plaza → bottom edge; plaza → left/right edges | stone |
  | Rain trees | clusters along left and right edges | trunk footprint blocks; canopy draws over the player when they walk behind |
  | Lamp posts | beside paths, 5 | warm light, radius ~95 |
  | Crime scene | east of the fountain (~470, 300) | tape posts and tape, dropped briefcase; tape blocks |
  | Torn note | inside the tape gap (~470, 330) | clue |
  | Suspect A | under the west lamp by a bench (~250, 300) | talk |
  | Alibi statement | on a bench, south-east (~560, 440) | clue |
  | Player | start (384, 500), facing up | torch light follows |

  Depth = each object's ground y, so things lower on screen draw in front. Ambient light is dim blue-violet. Interaction reach is 24 px, measured from the player's feet.
- [ ] **Step 7:** Play-test: eight-way movement with no faster diagonals; can't walk through the building, fountain, tree trunks, lamp posts, benches or tape; can walk behind a tree canopy; camera stops at all four edges; the Task 7 checklist still passes; the night/lantern look reads clearly.

### Task 9: Full Day 1 — the real case and all three suspects

Builds Day 1 as the spec describes it, using the case in [the case design](../specs/2026-11-13-campus-mystery-case-design.md).

**Files:**
- Modify: `game/src/logic/dialogue.ts` (`givesClue` on nodes), `game/src/logic/deduction.ts` (`insight` on links and results), `game/src/logic/gameState.ts` (`enterNode`)
- Replace: `game/src/data/day1.ts` (clues, suspects, victim, dialogue, scene placements, links, Day 1 goals)
- Create: `game/src/data/day1.test.ts` (content checks)
- Modify: `game/src/art/sprites.ts` (per-character looks incl. tudung and long hair; access card and tumbler props), `game/src/scenes/Day1Scene.ts` (NPCs, floor clues and examine spots from data), `game/src/ui/*` (clue toasts from dialogue, board with victim card and a detail strip)

**Produces:**
- `DialogueNode.givesClue?: string`
- `DeductionLink.insight?: string`; `ConnectionResult.insight?: string` on valid results
- `GameState.enterNode(node: DialogueNode, clues: Readonly<Record<string, Clue>>): Clue | undefined`. Sets the node's flag and picks up its clue; returns the clue only the first time it's gained.
- `day1.ts` exports `CLUES`, `PEOPLE` (suspects + victim), `NPCS` (who stands where), `FLOOR_CLUES`, `EXAMINE_SPOTS`, `DIALOGUE`, `LINKS`, `DAY1_REQUIRED`

- [ ] **Step 1: Tests first.** `gameState.test.ts`: entering a node with `setsFlag` and `givesClue` sets the flag, adds the clue, returns it; entering again returns `undefined`. `deduction.test.ts`: a valid connect returns the link's `insight`. `day1.test.ts`: every `next` names a real node; every `givesClue`/`requiresClue`/link clue names a real clue; every link target is a person; every NPC and examine spot starts at a real node; every Day 1 goal flag can be set by some node or link; Day 1 can be completed by following the data (simulate: enter every reachable node, make every link, check `isDay1Complete`).
- [ ] **Step 2:** Run, see them fail. **Step 3:** Implement. **Step 4:** Run, see them pass.
- [ ] **Step 5:** Art and scene: Farah by the west lamp, Daniel near the faculty door, Priya by the south-east bench; torn note by the tape, lab access card in the grass by the west hedge, tumbler visible inside the tape; examining the tape gives the Coffee Tumbler.
- [ ] **Step 6:** Board: suspects and the victim on the right, clues on the left in up to two columns; hovering a card shows its full text in a strip at the bottom; a valid link toasts its insight; an invalid one says "No connection you can prove yet."
- [ ] **Step 7:** Play-test: meet all three, examine the scene, collect all six Day 1 clues, make all four links in either direction, and Day 1 completes only after the five goals; the board stays readable with every Day 1 card on it.

### Task 10: Day 2 — days, locations and three new rooms

Implements Day 2 from [the case design](../specs/2026-11-13-campus-mystery-case-design.md): the library, the security office and the faculty pantry open up; Farah is cleared; Daniel's card story falls apart.

**Files:**
- Modify: `game/src/logic/gameState.ts` (+ test): current day, goals per day, `advanceDay()`
- Create: `game/src/logic/days.ts` (+ test): `availableOn(item: { days?: readonly number[] }, day: number): boolean` (no `days` = every day)
- Replace `game/src/data/day1.ts` with `case.ts` (clues, people, looks, links), `dialogue.ts`, `days.ts` (title, time of day, goals, hint, start spawn per day), `locations.ts` (courtyard, library, security, faculty: NPCs, floor clues, examine spots, exits, room layout). `content.test.ts` replaces `day1.test.ts` and checks every day.
- Create: `game/src/art/interiors.ts` (room floors/walls and furniture), `game/src/scenes/BootScene.ts`, `WorldScene.ts` (movement, interaction, NPCs, clues, exits — shared), `CourtyardScene.ts`, `RoomScene.ts`; delete `Day1Scene.ts`
- Modify: `game/src/ui/overlays.ts` (HUD shows day/place/time, day title card, per-day completion message)

**Decisions:**
- Exits are E-interactions ("Enter the library"), never walk-off edges, so nobody changes room by accident. An exit closed today shows its reason ("The library's closed at this hour.").
- The day ends at the courtyard's south path ("Head home"), only once that day's goals are met. If the next day isn't built yet, it says so.
- Picked-up clues stay picked up when the player comes back to a room.
- Rooms are at least 480×272 so the camera never shows outside them.

**Day 2 content:** Mrs. Lim (librarian), Encik Rahman (security guard), Kak Ani (cleaner); Farah in the library, Daniel in the faculty corridor, Priya on her courtyard bench, each with new lines. Clues: Library Gate Log, Door Access Log, Cleaner's Statement. Links: Gate Log ↔ Farah's Alibi (`farah_cleared`), Door Log ↔ Lab Access Card (`daniel_card_lie`), Door Log ↔ Daniel's Alibi (`daniel_left_lab`), Cleaner's Statement ↔ Coffee Tumbler (`tumbler_at_pantry`). Goals: `met_librarian`, `met_guard`, `met_cleaner`, `farah_cleared`.

- [ ] **Step 1: Tests first.** `gameState.test.ts`: starts on day 1; `isDayComplete()` checks the current day's goals; `advanceDay()` moves to day 2 and notifies. `days.test.ts`: no `days` → available; `[2]` → not on day 1, yes on day 2. `content.test.ts`: every reference resolves (nodes, clues, looks, exit targets, link ends), and playing each day in order using only what's available that day completes it.
- [ ] **Step 2:** Run, see them fail. **Step 3:** Implement. **Step 4:** Run, see them pass.
- [ ] **Step 5:** Play-test: finish Day 1, head home, see the Day 2 card, visit all three rooms and back, meet the three witnesses, make the Day 2 links, see Day 2 complete; returning to a room doesn't bring picked-up clues back.

## Later (not this plan)

- More art: walk-cycle animation frames, NPC idle animation, more prop variety. Optionally swap generated art for a hand-drawn or commissioned pack.
- Doors and more rooms, Days 2–5 data (see the case design), the chapter system, the accusation scene and endings.
