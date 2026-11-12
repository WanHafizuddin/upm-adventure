# Case Files: Serdang Raya

A top-down pixel-art murder mystery set on a university campus at night. You play a student sleuth looking into the death of a lecturer: explore the campus, question suspects, collect clues, and link the evidence on a deduction board before making an accusation.

The campus, characters and events are fictional. No real institution is depicted.

## Status

The **Day 1 vertical slice** is playable in the browser:

- a faculty courtyard at night, seen from above, with lamp-lit paths, a fountain plaza and a taped-off crime scene
- one suspect, with dialogue that changes once you've found the right clue
- two clues to pick up
- a drag-and-connect deduction board
- a "Day 1 complete" check once you've made the key connection

Still to come: Days 2–5, more locations, the other two suspects, and the final accusation with multiple endings.

## Play it locally

You need [Node.js](https://nodejs.org/) 20 or newer.

```bash
cd game
npm install
npm run dev
```

Then open http://localhost:5173.

**Controls:** WASD or arrow keys to move · E to interact · Tab for the deduction board · 1–3 to pick a reply · Esc to close

## How it's built

- [Phaser 4](https://phaser.io/) and TypeScript, bundled with Vite
- Game rules (clues, dialogue, deduction, day progress) are plain TypeScript with unit tests: run `npm test` in `game/`
- All pixel art is generated in code, in `game/src/art/`, so there are no image assets

## Project layout

| Folder | What's in it |
|---|---|
| [`game/`](game/) | The game itself. See [`game/README.md`](game/README.md) for where things live. |
| [`docs/superpowers/specs/`](docs/superpowers/specs/) | Game design document |
| [`docs/superpowers/plans/`](docs/superpowers/plans/) | Implementation plans |
