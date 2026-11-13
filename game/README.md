# Case Files: Serdang Raya — web game

Top-down pixel-art murder mystery set at UPM Serdang, built with Phaser 4 + TypeScript + Vite.
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

- `src/logic/` — game rules (inventory, flags, dialogue, deduction, days). Plain TypeScript, no Phaser, each with a `.test.ts`.
- `src/data/` — the story as data: `case.ts` (clues, people, looks, board links), `dialogue.ts`, `days.ts` (each day's goals and title card), `locations.ts` (every place, who's there on which day, exits, furniture, signs). `content.test.ts` plays every day through and catches dead ends.
- `src/scenes/` — `WorldScene.ts` (walking, talking, clues, exits), `CourtyardScene.ts`, `RoomScene.ts` (any indoor room from data), `BootScene.ts`.
- `src/art/` — all pixel art, generated in code: courtyard (`sprites.ts`), rooms and furniture (`interiors.ts`), UPM signage and the pixel font (`signage.ts`, `pixelFont.ts`).
- `src/ui/` — HTML overlays: day title card, "Today" checklist, dialogue box, deduction board, the final accusation and ending screens, toasts.

## The UPM logo

The title card has a slot for the official UPM logo. Save it as `game/public/upm-logo.png` (a transparent PNG about 200 px tall works well) and it appears automatically; without it, the card simply shows the university's name. The logo isn't included in this repository.

In `npm run dev`, the browser console has `__game` and `__state` for poking at the running game.
