# Case Files: Serdang Raya

A top-down pixel-art murder mystery set at Universiti Putra Malaysia (UPM), Serdang, at night. You play a student sleuth looking into the death of a lecturer: explore the campus, question suspects, collect clues, and link the evidence on a deduction board before making an accusation.

A fan-made game: every character and event is fictional, and it is not an official UPM production.

## Status

**Days 1 and 2 are playable** in the browser. It starts on the night Dr. Rosli Kamarudin is found poisoned by the fountain outside Fakulti Sains.

- a faculty courtyard at night, seen from above, with lamp-lit paths, a fountain plaza and a taped-off crime scene
- three suspects to question (a PhD student, the lab manager and a rival lecturer), each with their own story and alibi
- six clues: two to find on the ground, one from examining the crime scene, three from what the suspects tell you
- some questions only open up once you're holding the right clue
- a deduction board where linking clues to people reveals what they mean
- Day 1 ends once you've met everyone, examined the scene and worked out how he died; then you head back to KTDI
- Day 2 opens PSAS, the security office and the Fakulti Sains ground floor, with three new witnesses, three new clues and the evidence that clears one suspect
- UPM all around: the big red UPM sign, banners, Malay signage, motorcycles and the campus bus stop

Still to come: Days 3–5 (Lab 2, Dr. Rosli's office, toxicology), breaking the last alibis, and the final accusation with multiple endings. The full case is planned in [the case design](docs/superpowers/specs/2026-11-13-campus-mystery-case-design.md). It contains spoilers.

## Play it locally

You need [Node.js](https://nodejs.org/) 20 or newer.

```bash
cd game
npm install
npm run dev
```

Then open http://localhost:5173.

**Controls:** WASD or arrow keys to move · E to interact · Tab for the deduction board · 1–4 to pick a reply · Esc to close

## How it's built

- [Phaser 4](https://phaser.io/) and TypeScript, bundled with Vite
- Game rules (clues, dialogue, deduction, day progress) are plain TypeScript with unit tests: run `npm test` in `game/`
- All pixel art is generated in code, in `game/src/art/`, so there are no image assets

## Project layout

| Folder | What's in it |
|---|---|
| [`game/`](game/) | The game itself. See [`game/README.md`](game/README.md) for where things live. |
| [`docs/superpowers/specs/`](docs/superpowers/specs/) | Game design and the case (spoilers) |
| [`docs/superpowers/plans/`](docs/superpowers/plans/) | Implementation plans |
