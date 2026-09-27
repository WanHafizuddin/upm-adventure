# Campus Mystery Game — Design

## Overview

A story-driven murder-mystery adventure game set on a fictional university campus visually inspired by Universiti Putra Malaysia (UPM). The player is a student amateur sleuth investigating the death of a lecturer, gathering clues and testimony across a multi-day chapter structure, and using a deduction board to link evidence to suspects and motives before making a final accusation.

Solo developer project, first serious Unity project (developer is learning Unity/C# through this build).

## Setting

- Fictional university, name and branding inspired by UPM's real layout/architecture but not using real UPM names, buildings, or branding. This avoids implying a real crime occurred at a real named institution.
- Working title: *Case Files: Serdang Raya* (placeholder, can change).
- Tone: noir-lite. Murder is discussed and investigated seriously; crime scenes are implied via props/details, not graphic gore.

## Visual Style & Perspective

- **Engine:** Unity
- **Camera:** 3rd-person 3D (not top-down) — chosen after visual review to match a "White Day"-style realistic school-at-night mood
- **Art direction:** Stylized-realistic — modular, reusable corridor/room kits (not fully photoreal), moody realistic lighting, muted/desaturated palette. Chosen specifically to get the realistic-horror-adjacent atmosphere without the asset/production burden of full photorealism, which is not appropriate for a solo first project.
- No stealth/chase/antagonist-AI layer — the "White Day" influence is atmospheric/visual only. Confirmed explicitly: gameplay stays a pure investigation/deduction loop, no patrolling threat to hide from.

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

Each day gates which locations, NPCs, and clues are currently accessible; the `ChapterManager` system advances the day once that day's goal flags are met.

## Locations

5–6 reusable campus locations (e.g. faculty building, library, hostel block, cafeteria, admin office, crime scene). Locations persist across days but unlock new areas/interactions/dialogue as the case progresses, rather than being single-use per day.

## Core Gameplay Loop (per day)

1. Explore currently-unlocked locations (3rd-person 3D movement).
2. Talk to NPCs (suspects and witnesses) via a branching dialogue system. Some dialogue lines only unlock once the player already holds a relevant clue.
3. Pick up or observe clues in the world (physical items, notes, scene details), or receive clues through dialogue.
4. Open the deduction board: place collected clues and connect them to suspects, motives, and locations.
5. Correct connections unlock new dialogue, new areas, or progress toward the next day.
6. On the final day, enough correct connections unlock the accusation scene.

## Systems (Unity / C#)

- **PlayerController** — 3rd-person 3D movement and camera, collision with campus geometry, interaction trigger for NPCs and clue objects.
- **DialogueSystem** — branching dialogue trees (ScriptableObject-based nodes); key lines set flags (e.g. `HeardAlibi_LecturerX = true`) that gate later content.
- **ClueInventory** — collectible clues as ScriptableObjects (id, name, description, icon); populated via world pickups and dialogue grants.
- **DeductionBoard (UI)** — drag-and-connect UI where the player links clue/suspect/motive/location nodes; each valid connection is checked against a predefined solution table, and correct connections set flags that unlock further content.
- **ChapterManager** — tracks the current day (1–5), gates which locations/NPCs/clues are active, and advances the day when that day's completion flags are met.
- **AccusationSystem** — end-game scene where the player selects a suspect plus supporting evidence, checked against the solution to route to an ending.

## Endings

- **Correct suspect + sufficient correct evidence linked** → true ending, full reveal.
- **Correct suspect, weak evidence** → "right but unproven" ending — player knows the truth but can't prove it, suspect walks.
- **Wrong suspect** → bad ending — the real culprit escapes / case closed incorrectly.
- **Insufficient clues gathered** → accusation is blocked; player is prompted to keep investigating.

## Scope Risk & Recommended Build Order

This design (3rd-person 3D + deduction board UI + 4–5 day chapter structure) is a real step up from a minimal first project for a solo developer learning Unity. To manage this:

1. Build a **vertical slice first**: Day 1 content plus a partial deduction board wired to a single suspect. This proves the full loop end-to-end (movement → dialogue → clue pickup → deduction board → at least one unlock) before writing content for the remaining suspects and days.
2. Once the vertical slice works, Days 2–5 content is primarily new data (ScriptableObjects: dialogue, clues, solution-table entries) reusing the same systems, not new code — this is what keeps the larger day/suspect count tractable for one person.

## Testing Approach

- Each system should be testable in relative isolation in the Unity editor (e.g. `ClueInventory` exercised with placeholder clues before the dialogue system exists).
- After the vertical slice (Day 1 + one suspect + partial board) is done, do a full playtest of one complete loop iteration before building out the remaining days.
- Manual playtest checklist per day: can the player reach every intended clue; can every valid deduction-board connection for that day's content actually be made; does a wrong accusation correctly trigger the bad ending (not a soft-lock).
