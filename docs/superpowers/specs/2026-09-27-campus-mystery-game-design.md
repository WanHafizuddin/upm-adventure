# Campus Mystery Game — Design

## Overview

A story-driven murder-mystery adventure game set on a fictional university campus visually inspired by Universiti Putra Malaysia (UPM). The player is a student amateur sleuth investigating the death of a lecturer, gathering clues and testimony across a multi-day chapter structure, and using a deduction board to link evidence to suspects and motives before making a final accusation.

Solo developer project. The developer's first serious game project.

## Setting

- Fictional university, name and branding inspired by UPM's real layout/architecture but not using real UPM names, buildings, or branding. This avoids implying a real crime occurred at a real named institution.
- Working title: *Case Files: Serdang Raya* (placeholder, can change).
- Tone: noir-lite. Murder is discussed and investigated seriously; crime scenes are implied via props/details, not graphic gore.

## Revision History

- **2026-11-13: 3D to 2D.** The developer asked for 2D and left the style to Claude, who picked side-view pixel art. The 3rd-person camera, stylized-realistic 3D art and the "3D Free Modular Kit" are retired.
- **2026-11-13: Unity to the web.** The same day, the developer dropped Unity and left the technology choice to Claude. The game is now a browser game built with Phaser 4 and TypeScript (see Technology). Unity, C#, ScriptableObjects and the Unity plan are retired. The game design itself (story, loop, systems, endings) is unchanged.
- **2026-11-13: side-view to top-down.** After seeing the side-view build, the developer asked for a top-down view, pointing to a top-down pixel-art reference: deep blue/purple night palette, warm lantern light, dense foliage, chunky outlined props. Claude made the specific calls below to match that feel with original art. Side-view is retired.

## Technology (Claude's call)

- **Engine:** [Phaser 4](https://phaser.io/) (2D web game framework), written in **TypeScript**, built and served with **Vite**. The game runs in any modern desktop browser and can be published as a static site (itch.io HTML5 upload, GitHub Pages).
- **Why:** no editor to install or learn, so the developer works in plain code files and a browser. Phaser has strong 2D, pixel-art and arcade-physics support. The finished game is easy to share with a link. Claude can also run and play-test it directly.
- **UI:** dialogue and the deduction board are HTML overlays on top of the game canvas, not drawn inside Phaser. That gives crisp, readable text and simple drag-and-drop.
- **Content as data:** dialogue, clues, deduction links and day requirements live in typed TypeScript data files. They take the role ScriptableObjects had in the Unity design. Adding Days 2–5 means mostly adding data, not new code.
- **Tests:** game rules (inventory, flags, dialogue gating, deduction validation, day completion, interaction picking) are plain TypeScript modules with no Phaser dependency, covered by **Vitest** unit tests. Scenes are checked by play-testing in the browser.
- **Tooling floor:** Node.js 20.16 (installed), so Vite 6 and Vitest 3. Newer Vite/Vitest majors need Node 20.19+.

## Visual Style & Perspective

- **Camera (developer's call):** Top-down, high-angle (the classic "3/4" view: you see the ground from above and the fronts of buildings, people and props). The player walks in eight directions. The camera follows them and stops at the edges of the current area. Objects further down the screen draw in front of ones higher up, so the player can walk behind trees and lamp posts.
- **Art direction (developer's reference, Claude's specifics):** Detailed pixel art on a 16 px grid, rendered at 480×270 and scaled up with nearest-neighbour filtering. A rich night palette: indigo and violet ground, deep teal-blue foliage, dark 1 px outlines, and stone and wood that pick up warm highlights. Mood comes from lighting: a dim blue-violet ambient light, warm lantern/lamp-post light pools, lit building windows, and a faint torch around the player. Saturated and atmospheric, not muted-grey.
- **Environment and character art source (Claude's call):** Original pixel art generated in code (`game/src/art/`): ground, trees, bushes, lamp posts, benches, the faculty building, the fountain, crime-scene tape and characters. No third-party asset pack is needed, so there are no licence questions. A hand-drawn or commissioned pack can replace any piece later without changing game code. All signage uses the fictional campus, never real UPM branding.
- **Day 1 location (Claude's call):** The faculty courtyard at night: the faculty building along the top, a central dry fountain plaza, stone paths, rain trees and hedges, lamp posts, and a taped-off crime scene by the fountain.
- No stealth/chase/antagonist-AI layer. The "White Day" influence is atmospheric/visual only. Confirmed explicitly: gameplay stays a pure investigation/deduction loop, with no patrolling threat to hide from.

## Player Character

Student amateur sleuth — a regular student pulled into the investigation (e.g. was near the scene, or is close to someone implicated). Low institutional authority is intentional: it pushes the player toward social/clever solutions (talking, observing, sneaking into places) rather than official police-style access.

## Victim & Suspects

- **Victim:** A lecturer, found dead on campus.
- **Suspects:** 3 total. Each has a distinct motive, an alibi, and 2–3 clues tied specifically to them (roughly 6–9 core clues total, plus a small number of shared/red-herring clues).

## Structure: Day-by-Day Chapters

4–5 in-game days, each a gated chapter:

- **Day 1:** Discover the murder, meet the three suspects, first pass at the crime scene and initial testimony.
- **Days 2–3:** Deeper investigation — new locations/dialogue unlock, more clues surface, first deduction-board links become available.
- **Day 4:** Confrontations with suspects using gathered evidence; deduction board should be largely complete.
- **Day 5:** Final accusation.

Each day gates which locations, NPCs, and clues are currently accessible; the chapter system advances the day once that day's goal flags are met.

## Locations

5–6 reusable campus locations (e.g. faculty building, library, hostel block, cafeteria, admin office, crime scene). Locations persist across days but unlock new areas/interactions/dialogue as the case progresses, rather than being single-use per day.

## Core Gameplay Loop (per day)

1. Explore currently-unlocked locations (top-down movement in eight directions; doors and paths lead to other areas).
2. Talk to NPCs (suspects and witnesses) via a branching dialogue system. Some dialogue lines only unlock once the player already holds a relevant clue.
3. Pick up or observe clues in the world (physical items, notes, scene details), or receive clues through dialogue.
4. Open the deduction board: place collected clues and connect them to suspects, motives, and locations.
5. Correct connections unlock new dialogue, new areas, or progress toward the next day.
6. On the final day, enough correct connections unlock the accusation scene.

## Systems

- **Player** — top-down eight-direction movement at the same speed diagonally as straight, a camera that follows the player and stops at the area's edges, collision with buildings, trees and props (only their footprint at ground level blocks the player), and an interaction check that picks the nearest NPC or clue within reach. An on-screen prompt shows what pressing the interact key will do.
- **Dialogue** — branching dialogue trees stored as data; key lines set flags (e.g. `heard_alibi_suspect_a`) that gate later content. The dialogue box can be closed.
- **Clue inventory** — collectible clues stored as data (id, name, description); populated via world pickups and dialogue grants.
- **Deduction board (UI)** — a full-screen overlay the player opens and closes with a key. It's a drag-and-connect UI where the player links clue/suspect/motive/location nodes. Only clues the player has collected appear on it. Each connection is checked against a predefined solution table, in either drag direction, and correct connections set flags that unlock further content.
- **Chapters** — tracks the current day (1–5), gates which locations/NPCs/clues are active, and advances the day when that day's completion flags are met.
- **Accusation** — end-game scene where the player selects a suspect plus supporting evidence, checked against the solution to route to an ending.

## Endings

- **Correct suspect + sufficient correct evidence linked** → true ending, full reveal.
- **Correct suspect, weak evidence** → "right but unproven" ending — player knows the truth but can't prove it, suspect walks.
- **Wrong suspect** → bad ending — the real culprit escapes / case closed incorrectly.
- **Insufficient clues gathered** → accusation is blocked; player is prompted to keep investigating.

## Scope Risk & Recommended Build Order

This design (side-view 2D + deduction board UI + 4–5 day chapter structure) is a real step up from a minimal first project for a solo developer. Going 2D and web-based lowers the risk on movement, camera, art and tooling, but the dialogue, deduction and chapter systems are the same size as before. To manage this:

1. Build a **vertical slice first**: Day 1 content plus a partial deduction board wired to a single suspect. This proves the full loop end-to-end (movement → dialogue → clue pickup → deduction board → at least one unlock) before writing content for the remaining suspects and days.
2. Once the vertical slice works, Days 2–5 content is primarily new data (dialogue, clues, solution-table entries) reusing the same systems, not new code — this is what keeps the larger day/suspect count tractable for one person.

## Testing Approach

- Every game rule is a plain TypeScript module with Vitest unit tests, so it can be checked without running the game (e.g. the clue inventory is tested before any scene exists).
- After the vertical slice (Day 1 + one suspect + partial board) is done, do a full playtest of one complete loop iteration in the browser before building out the remaining days.
- Manual playtest checklist per day: can the player reach every intended clue; can every valid deduction-board connection for that day's content actually be made; does a wrong accusation correctly trigger the bad ending (not a soft-lock).
