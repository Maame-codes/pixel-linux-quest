# Contributing to Pixel Linux Quest

Thank you for helping! Pixel Linux Quest is a small hobby project, so friendly, focused contributions are the best kind. Everyone taking part follows the [Code of Conduct](CODE_OF_CONDUCT.md).

Not sure where to start? Open an issue first (bug report, lesson correction, level idea or Break Room mini game idea) and we can talk it through before you write code.

## Run it locally

Use the Node version in `.nvmrc` (with nvm: `nvm use`).

```sh
npm install
npm run dev     # dev server at http://localhost:5173
npm run test    # unit tests (Vitest)
npm run build   # type check and production build
```

`npm run test` and `npm run build` must both pass before a pull request is merged. CI runs them on every pull request.

## Project layout

| Folder | What lives there |
| --- | --- |
| `src/content/` | All learning content as data: levels, worlds, the intro story, the sandbox system |
| `src/shell/` | The pretend shell: filesystem, parser, commands (one file each), error explanations. Pure TypeScript, no React |
| `src/game/` | The level player, progress, folder map and the pixel art engine (`pixelArt/`) |
| `src/arcade/` | The Break Room games and their shared frame |
| `src/components/` | Small shared UI pieces (PixelButton, Panel, SpeechBubble, Terminal and so on) |
| `src/pages/` | One component per route |

## Adding a level

Levels are data in `src/content/levels/`, so you should not need to touch any components.

1. Create a file such as `src/content/levels/w3l1-copy-and-move.ts` exporting a `Level` (the types are in `src/content/types.ts`):

   ```ts
   import type { Level } from '../types'

   export const copyAndMove: Level = {
     id: 'w3-l1-copy-and-move',  // stable, never change it once released
     world: 3,
     level: 1,                    // position in the world, 1-based
     title: 'Copy and Move',
     blurb: 'One line for the map.',
     xp: 50,
     lessonPages: ['Short markdown page.', 'One idea per page.'],
     test: { kind: 'challenge', /* or 'quiz' */ },
   }
   ```

2. Pick a test:
   - **Challenge** (`kind: 'challenge'`): a starting filesystem (`seedFs`, built with `dir()` and `file()` from `src/shell`), a `startDir`, the `commands` unlocked in this level, and `objectives`. Each objective has a `label`, Pip's `hint`, the `answer` shown by SHOW ANSWER, and a `check(shell, last)` function that returns true once it is done.
   - **Quiz** (`kind: 'quiz'`): 5 (or 10) multiple choice questions, each with `options`, the `correct` index and a short `explain`. A quiz clears at 80%, so with 5 questions one mistake is allowed.
3. Add it to the `LEVELS` list in `src/content/levels/index.ts`, and check `levelCount` for its world in `src/content/worlds.ts`.
4. If it needs a command the shell does not have yet, add it in `src/shell/commands/` with unit tests.
5. Add a test for a challenge level that plays through every objective with its `answer` (see `w2l4-dig-a-folder.test.ts`).

From World 3 onwards, frame each world as real jobs ("The website is down. Find the error in the logs.") and end the world with a timed boss level that can be retried freely.

## Content rules

These come from the project's design notes (`CLAUDE.md`) and apply to every contribution.

- **Original content only.** Write every lesson, example, quiz and line of Pip's yourself. Do not copy text from courses, books or websites (topics may be inspired by the free LFS101 course, but not its text), and no real logos, mascots or caricatures of real people.
- **Correct Linux facts.** Every technical fact must be true on a real Linux system. If you are not sure, say so in your pull request so it can be checked. Real-looking error messages should match real tools (GNU coreutils and bash).
- **No em dashes in on-screen text** (lessons, quizzes, Pip's lines, buttons, labels, the intro story). Use commas, full stops or hyphens.
- **Short and friendly.** Assume the learner has never used a terminal. One idea per lesson page.
- **Pip explains mistakes, never the answer.** Explanations in `src/shell/explain.ts` point at the mistake without solving the current objective.
- **Code style.** Small, typed components. No `any`. No new dependencies without explaining why in the pull request.
- **Design.** Sweetie 16 colours, no rounded corners, hard shadows, Press Start 2P only for headings, buttons and labels (12px or bigger), Atkinson Hyperlegible for reading text, IBM Plex Mono for the terminal. Works at 390px wide and respects `prefers-reduced-motion`.
- **Tests must pass.** Add or update unit tests with your change.

## Adding a Break Room game

Every game follows the Break Room rules in `CLAUDE.md`. The short version:

1. **Original.** An original name, art and sounds. A generic game type is fine; copying or naming a real game is not.
2. **Logic.** Create `src/arcade/games/myGame.ts` exporting a `GameDef` (`src/arcade/types.ts`): a state object, `create(seed)`, a pure `update(state, input, dt)` and a separate `draw(ctx, state, opts)`. Randomness comes from the seed stored in the state (`src/arcade/random.ts`), never `Math.random()`.
3. **Tests.** Add `myGame.test.ts` covering scoring, collisions and game over.
4. **Register it.** Add an entry to `src/arcade/games.tsx`, and a cabinet in the room scene `src/game/pixelArt/scenes/break-room.ts`.
5. **Tips.** Add Pip's tips for its game over screen to `src/arcade/tips.ts`. Each tip must be a true, beginner-friendly Linux fact.
6. **Rules to keep.** Canvas 2D with crisp pixels in the Sweetie 16 palette, no new dependencies, keyboard (arrows, WASD, Space, Enter) and touch controls (buttons at least 44px, or swipes and taps), PAUSE with P or Esc, nothing flashing more than 3 times a second, no shake or big flashes under reduced motion, and no horizontal scrolling at 390px.

`GameFrame.tsx` already handles the game loop, input, pause, sound, high scores and the game over screen.

## Pull requests

- Keep each pull request to one change, and describe what you changed and why.
- Run `npm run test` and `npm run build` before pushing.
- Add screenshots for visible changes.

## Licence of contributions

By contributing, you agree that your contributions are licensed under the same licences as the project: code under the MIT licence ([LICENSE](LICENSE)), and lesson text, quizzes, the intro story, tips and pixel art under CC BY-NC 4.0 ([LICENSE-CONTENT](LICENSE-CONTENT)).
