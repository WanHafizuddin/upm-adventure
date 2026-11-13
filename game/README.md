# Case Files: Serdang Raya — web game

Top-down pixel-art murder mystery on a fictional campus, built with Phaser 4 + TypeScript + Vite.
Design: [../docs/superpowers/specs/2026-09-27-campus-mystery-game-design.md](../docs/superpowers/specs/2026-09-27-campus-mystery-game-design.md)

## Run it

```bash
npm install      # once
npm run dev      # play at http://localhost:5173
npm test         # game-rule unit tests
npm run build    # static site in dist/ (upload to itch.io as HTML5)
```

## Controls

WASD or arrows move · E interact · Tab deduction board · 1–4 pick a reply · Esc close

## Where things live

- `src/logic/` — game rules (inventory, flags, dialogue, deduction, day completion). Plain TypeScript, no Phaser, each with a `.test.ts`.
- `src/data/day1.ts` — Day 1 content: clues, people, where everyone stands, dialogue, board links, Day 1 goals. `day1.test.ts` checks the content has no dead ends. New days are mostly new data files.
- `src/scenes/Day1Scene.ts` — the faculty courtyard, seen from above: props, lights, walking, interacting.
- `src/art/` — all pixel art, generated in code (`sprites.ts`), using the night palette in `palette.ts`.
- `src/ui/` — HTML overlays: dialogue box, deduction board, toasts, HUD.

In `npm run dev`, the browser console has `__game` and `__state` for poking at the running game.
