# Pixel Linux Quest

A free hobby website: a fun, hands-on way to learn Linux in the browser, in a retro pixel art style. It is not described as a game (only the Break Room has "mini games"). The learner reads short lessons, then proves what they learned by completing quests in a simulated "pocket terminal" in the browser.

Hosted on Vercel as a static site. No backend, no accounts.

## The learner journey

1. **Title screen.** Big pixel logo, Pip the penguin, tagline "A cool, brief introduction to Linux", a PRESS START button.
2. **Intro story (first visit only, replayable from the map).** A short cutscene of 6 to 8 scenes where Pip tells how Linux came about. Pixel art panel on top, speech bubble text below, NEXT and SKIP buttons. Ends with "Now it's your turn" and goes to the world map. Outline in "Intro story" below.
3. **World map.** Worlds unlock in order. Each world has 3 to 5 levels.
4. **Level = lesson, then test.**
   - **Lesson pages:** 2 to 4 short pages, one idea per page, with small examples. Pip can comment in a speech bubble. Learner clicks NEXT through them.
   - **Test:** either a **terminal challenge** (quest objectives checked against the simulated shell) or a **quiz** (multiple choice, for topics that can't be practised in a terminal, like history or distros).
   - Learner can go back to the lesson pages during the test.
5. **Level clear screen.** XP gained, badge progress, NEXT LEVEL and BACK TO MAP.
6. **Break It sandbox** (`/sandbox`). A terminal plus the live folder map on a realistic pretend system (`src/content/sandbox.ts`: /bin, /etc, /home/pip, /var/log and so on), no objectives. **Every command the engine implements is available here** (`ALL_COMMANDS` from the registry), whatever the learner has unlocked. Dangerous commands behave like real Linux: `rm -rf /` is refused with GNU rm's preserve-root failsafe, while `sudo rm -rf --no-preserve-root /` and `sudo rm -rf /*` (the shell expands the `*`, so the failsafe never sees `/`) destroy the system, and the fork bomb freezes it (with or without `sudo`). These play a collapse (or freeze) animation, then a shareable SYSTEM DESTROYED or SYSTEM FROZEN screen with a RESET button. The first one earns the secret badge Chaos Penguin, shown as ??? on the badges page until then. **Without sudo**, permissions apply as on real Linux: the same rm commands delete only what pip owns and print the real "Permission denied" lines for every system file, then (after a short pause to read them) a lighter HOME FOLDER WIPED screen (`home-wiped` event, its own scene) shows how many of pip's files went and how many system files were protected, and Pip explains that permissions saved the system and that sudo is what makes this command destroy everything. RESET as usual, no SHARE and no badge. Without sudo, `rm -rf /etc` (or another system folder) just prints Permission denied, with no screen. `rm -ri` and `rm -rI` ask first and delete nothing, so they are never a wipe. The share text says "I just destroyed Linux" for SYSTEM DESTROYED and "I just froze Linux" for SYSTEM FROZEN (`src/game/share.ts`). The first time the player uses sudo in the sandbox, Pip adds "On a real system, sudo would ask for your password first." (`src/game/sudoTip.ts`, remembered in localStorage). Detection lives in `src/shell/danger.ts` (parsed, not string-matched, unit tested); outside the sandbox these commands are stopped with a friendly message.
7. **Live folder map.** Every challenge level (and the sandbox) shows a pixel-art map of the folders next to the terminal, with Pip standing in the current folder (`src/game/folderMapModel.ts` is the pure, tested model; `FolderMap.tsx` draws it). SHOW MAP / HIDE MAP is remembered in localStorage.
8. **Weak spots** (`/practice`). Every failed command in a level or practice round (a non-zero exit, or a line Pip explains as a mistake) adds 1 to that command's count in localStorage (`src/game/weakSpots.ts`, key `plq.weakSpots`). Only known command names and counts are stored, never what the player typed, and only commands unlocked where they were typed count. With 3 or more mistakes across unlocked commands, the world map shows a "Practice your weak spots" card. It opens a round of 3 to 5 quick terminal tasks for the weakest commands, from the pool in `src/content/practice.ts` (at least 2 tasks per command a level unlocks; a test checks this and plays every task). Clearing a task lowers that command's count by 1. No XP penalty; clearing the round gives 10 bonus XP (`bonusXp` in progress).
9. **Saved data and privacy.** Everything lives in localStorage under keys starting with `plq.`. The settings panel has CLEAR MY SAVED DATA (progress, scores, settings, weak spots) with an in-page confirm step, never a browser dialog (`src/game/savedData.ts`). The footer and README say that nothing is sent to a server.
10. **Break Room** (`/break`, BREAK ROOM in the header nav and in the level header). A pixel arcade for a short break, then back to the quest. Details in "Break Room" below.

## Break Room

- **The room.** A 128x72 pixel scene (`src/game/pixelArt/scenes/break-room.ts`): one glowing arcade cabinet per game, a snack machine, a plant, and Pip dozing on a beanbag. Clicking a cabinet opens its game. Under the scene, every game is also a real button (name, one-line description, high score) for keyboard and screen reader users.
- **Break timer.** A break lasts 3, 5 or 10 minutes (the "Break length" setting, default 5), shown as a small pixel clock (counts only while the tab is visible). When time is up, the current round finishes first, then Pip asks "Ready to jump back in?" with BACK TO MY QUEST and STAY A BIT LONGER (+2 minutes, as many times as the player likes). BACK TO MY QUEST is always visible.
- **Going back.** The last page outside the Break Room is remembered in localStorage (`src/game/returnTo.ts`). BACK TO MY QUEST goes there, or to the next playable level. Leaving never loses quest progress: completed levels are saved as always, and an unfinished challenge (terminal, files and ticked objectives) is kept in memory for the visit (`src/game/levelSnapshots.ts`), so coming back carries on where the learner left off.
- **Break nudges.** Active time in levels is counted while the tab is visible. After the "Break reminder every" interval (15, 20, 30 or 45 minutes, or Off; default 20) Pip shows a small, non-blocking message above the level, "You've been at it for a while. Want a quick break?", with TAKE A BREAK (goes to `/break`) and NOT NOW (hides it for another full interval). It only appears when the learner has not typed for a few seconds and the terminal input is empty, and it never covers the terminal. Opening the Break Room starts the count again.
- **Settings.** A gear button in the header opens a small panel with "Break reminder every" (15, 20, 30, 45 minutes or Off, default 20), "Break length" (3, 5 or 10 minutes, default 5), sound on or off (default off) and "Boss level timer" on or off (default on), all remembered in localStorage (`src/arcade/settings.ts`). Older saves with the on/off `nudges` switch are migrated (off stays Off).

### Rules for every Break Room game (new games must follow them too)

- **Original.** Original names, art and sounds. Never copy or name a real game, in name or art. Generic game types are fine.
- **Drawing.** HTML canvas 2D with requestAnimationFrame, in the Sweetie 16 palette, crisp pixels (image smoothing off, `image-rendering: pixelated`). No new dependencies.
- **Pure, tested logic.** Each game in `src/arcade/games/` is a `GameDef` (`src/arcade/types.ts`): a state object, a pure `update(state, input, dt)` (randomness comes from a seed stored in the state, `src/arcade/random.ts`) and a separate `draw`. Unit tests cover scoring, collisions and game over. `GameFrame.tsx` runs the loop, input, pause, sound, high scores and the game over screen, so a new game only supplies its `GameDef` and an entry in `src/arcade/games.tsx` (plus a cabinet in the room scene).
- **Controls.** Keyboard: arrows and WASD, Space and Enter (and 1 to 9 where it fits). Touch: on-screen buttons at least 44px, or swipes or taps on the canvas. Every game has PAUSE (P or Esc) and pauses itself when the tab is hidden.
- **Sound.** Simple 8-bit beeps with the Web Audio API (`src/arcade/sound.ts`), off by default, SOUND ON / OFF remembered in localStorage.
- **Safety and focus.** Nothing flashes more than 3 times a second. Under `prefers-reduced-motion`, no screen shake and no big flashes, but the game stays playable.
- **Scores.** High score per game in localStorage (`src/arcade/highScores.ts`).
- **Game over.** Show the score, the high score, PLAY AGAIN and one short Pip's tip: a true, beginner-friendly Linux fact (`src/arcade/tips.ts`). Every tip must be correct on a real Linux system.
- **Phones.** Works at 390px with no horizontal scrolling.

### Games

- **Packet Snake:** a network cable eats data packets on a grid, speeding up gently. Golden packets give bonus points for a few seconds.
- **Bug Smash:** bugs pop out of a 3x3 grid of folders for 45 seconds, getting faster. Do not smash Pip.
- **Bit Breaker:** paddle and ball against rows of file bricks (CORE, .BAK, .TMP, .LOG). Three lives, two-hit bricks, a rare wide-paddle power-up, and a new level when every file is cleared.
- **Planned: Pip's Fishing, a calm game.** Not built yet. It must follow the same rules as the others.

## Tech stack

- Vite + React + TypeScript, react-router for pages.
- Plain CSS with CSS custom properties for the design tokens (no UI library).
- Vitest for unit tests.
- Progress (completed levels, XP, badges, intro seen) saved in localStorage under one versioned key, wrapped in try/catch.
- Must build with `npm run build` and deploy to Vercel as a static SPA (add a `vercel.json` rewrite so deep links work).

## Design system

Match the two reference screens in `design-reference/`. They are design mockups, not production code: copy the look (colors, fonts, spacing, borders, shadows, layout), not the markup or their script format.

- **Palette (Sweetie 16):** bg `#1a1c2c`, deep `#0f1020`, panel `#333c57`, panel-2 `#29366f`, blue `#3b5dc9`, sky `#41a6f6`, cyan `#73eff7`, white `#f4f4f4`, soft-text `#c5d2db`, grey `#94b0c2`, slate `#566c86`, yellow `#ffcd75`, orange `#ef7d57`, lime `#a7f070`, green `#38b764`.
- **Fonts (Google Fonts, self-hosted):** latin woff2 files live in `src/assets/fonts/`, each with its OFL licence file next to it.
  - **Press Start 2P** for headings, buttons, labels and chips only. Never smaller than 12px, never for paragraphs.
  - **Atkinson Hyperlegible** (400 and 700) for reading text: lessons, Pip's bubbles, quiz options, the intro story and other body text. 20 to 22px with line-height 1.5 (small meta lines may go down to 16px).
  - **IBM Plex Mono** (400) for the terminal and code.
  - The design reference mockups still show the old fonts (Pixelify Sans, VT323). Follow the fonts above, not the mockups.
- **Shapes:** no rounded corners. 3 to 4px solid `#0f1020` borders. Hard offset shadows like `6px 6px 0 #0f1020`. Images and sprites use `image-rendering: pixelated`; SVG sprites use `shape-rendering: crispEdges`.
- **Pip the penguin:** a 16x16 pixel SVG (see reference files). Make it a `<Pip size mood />` component. Moods can come later.
- **Intro scene art:** drawn in code on a 128x72 grid by `src/game/pixelArt/` (a TypeScript port of `design-reference/pixel-art-method.py`, which is reference only: no Python in the project). Rect and sprite helpers, characters drawn from small text maps with a colour legend, exported as one SVG path per colour. Animated overlay layers (blinking lights, Pip waddling) use CSS `steps()` animations and freeze to a still frame under `prefers-reduced-motion`. Scene 1 must stay pixel for pixel the same as `design-reference/intro-scene-1969.svg` (a test checks this). Every scene has recognisable objects, small generic pixel people where it fits, and Pip waddling somewhere. No real logos or mascots, and people are generic figures, never caricatures of real people.
- **Core components:** PixelButton (primary yellow, secondary panel), Panel, SpeechBubble, XPBar, Chip, ProgressPips, Terminal, QuestList, QuizCard.
- **Accessibility:** real buttons and links, labels on inputs, visible focus outline (yellow), text contrast at least 4.5:1, works at phone width (390px), respects `prefers-reduced-motion`.

## Content model

All learning content lives in `src/content/` as data, separate from code, so new levels can be added without touching components.

```ts
type Level = {
  id: string;              // "w2-l4-dig-a-folder"
  world: number;
  title: string;
  xp: number;
  lessonPages: string[];   // markdown, short
  test: ChallengeTest | QuizTest;
};

type ChallengeTest = {
  kind: "challenge";
  seedFs: FsNode;          // starting files and folders
  startDir: string;
  commands: string[];      // commands available in this level
  objectives: {
    id: string;
    label: string;         // "Make a directory called treasure"
    hint: string;          // Pip's gentle nudge
    answer: string;        // revealed by SHOW ANSWER
    check: (shell: ShellState, last: CommandResult) => boolean;
    recall?: boolean;      // earlier command, no hint ("You learned this in World 2."), SHOW ANSWER after 3 tries
  }[];
  boss?: { timeLimitSec: number };            // timed boss level, SHOW ANSWER after 3 tries
  failure?: (shell: ShellState) => string | null; // e.g. an important file was deleted: stop, RESTART LEVEL
};

type QuizTest = {
  kind: "quiz";
  questions: { prompt: string; options: string[]; correct: number; explain: string }[];
};
```

A quiz clears the level at 80% or more correct answers (`src/game/quizScore.ts`). With 4 questions that still means 4 out of 4, so quizzes have 5 (or 10) questions: then one mistake in five is allowed. The World 1 quizzes have 5.

## Shell engine

`src/shell/` is a pure TypeScript module with no React in it, fully unit tested.

- Virtual in-memory filesystem with home at `/home/pip`, `~` shortcut, absolute and relative paths, `.` and `..`.
- A command registry: each command is its own file returning stdout, stderr and the new state. Commands are unlocked per level.
- Supports pipes `|` and redirection `>` `>>` once World 5 needs them.
- Error messages should look like real Linux messages.
- Command lines are split like bash does it (`src/shell/parse.ts`): quotes, backslash escapes, and `*` / `?` patterns expanded against the filesystem.
- **Pip explains mistakes.** When a command fails, the terminal still shows the real error, and Pip adds a short, friendly explanation in the speech bubble (`src/shell/explain.ts`, one test per rule). Explanations point at the mistake and never give away the answer to the current objective. Only say a command does not exist on Linux if that is true (`dir` and `type` do exist).
- `rm` is implemented (`-r`, `-f`, `-d`, `-v`, `--no-preserve-root`) with GNU error messages, but stays locked in levels until World 3. The terminal cannot answer questions, so every question GNU tools ask is answered no: `rm` on a file the user cannot write (without `-f`), `rm -i` (every file, "descend into directory") and `rm -I` (once, for more than 3 names or recursive) print GNU's question, keep the files and exit 0; `cp -i` and `mv -i` print "overwrite 'x'?", keep the file and exit 1, as in coreutils 9.4. The last of `-f`, `-i` and `-I` wins. With several sources, a missing target prints "cp: target 'x': No such file or directory" and a file target "cp: target 'x': Not a directory" (same for mv). `sudo COMMAND` runs the command as root. `type` and `dir` exist because they exist on real Linux.
- **World 3 commands** (each its own file, unit tested in `src/shell/world3.test.ts`): `cp` (`-r`, `-v`, into a directory), `mv` (`-v`), `rmdir` (`-p`, `-v`), `head` and `tail` (`-n N`, `-nN`, `-N`, `--lines`, `tail -n +N`, `head -n -N`, default 10, `==> name <==` headers), `wc` (`-l`, `-w`, `-c`, GNU column widths and `total`), `find` (`PATH`, `-name`, `-iname`, `-type f|d`), `chmod` (numeric and symbolic modes, `-R`, `-v`), and `ls -l`, `-a`, `-A`, `-d`. Options are read GNU style by `src/shell/options.ts`. `less` is deliberately not implemented: typing it gives `less: command not found`, and Pip explains what it does and suggests `head` or `tail`.
- **Files and permissions** (`src/shell/perm.ts`). Every node has an owner, a group, a mode and a time. Seeds may leave them out: `createShellState` copies the seed and fills in pip:pip for anything under `/home/pip` and root:root elsewhere, mode 644 for files and 755 for directories (umask 022). New files and copies belong to whoever made them (root under sudo). The kernel rules are enforced for the user pip: r to read a file or list a directory, w on a file to change it, w and x on a directory to add, delete or rename in it, x on every directory on the way (`lookup`), the sticky bit in `/tmp`, and only the owner may `chmod`. root (sudo, sandbox only) bypasses them. A file's text is taken to end with a newline, so sizes and `wc` match a real text file.
- Fun easter eggs are welcome (`sudo`, `rm` and `chmod` before they are unlocked give friendly Pip messages).
- Terminal UI: command history with up/down arrows, Enter runs, a RUN button for touch screens, auto scroll to bottom, `clear` works.

## Intro story outline

Pip narrates. Keep each scene to 1 to 3 short sentences. Original wording only.

1. 1969: Ken Thompson and Dennis Ritchie create Unix at Bell Labs.
2. Unix spreads to universities and companies, but it is costly and comes in many incompatible versions.
3. 1983: Richard Stallman starts the GNU project to build a free Unix-like system. By the early 90s it has almost everything except a kernel.
4. 1991: Linus Torvalds, a student in Helsinki, writes his own kernel as a hobby and shares it online.
5. 1992: Linux is released under the GPL. GNU tools plus the Linux kernel make a complete free OS, and distributions start to appear.
6. Today: Linux runs most web servers, the cloud, Android phones and every one of the top 500 supercomputers.
7. "And now it's your turn." Go to the map.

## Curriculum

Topic order is inspired by the free Introduction to Linux (LFS101) course, but every lesson, example and quiz must be written from scratch. Do not copy text from that course and do not use the Linux Foundation name or logo anywhere except the footer credit: "Curriculum topics inspired by the free Introduction to Linux (LFS101) course. Not affiliated with or endorsed by the Linux Foundation. Linux is a registered trademark of Linus Torvalds."

- **World 1, Penguin Island:** Linux philosophy and key ideas (quiz), distro families (quiz), how a system boots (quiz or put-in-order game).
- **World 2, Command Caves:** first commands (`pwd`, `ls`, `whoami`), moving around (`cd`, absolute vs relative paths), dig a folder (`mkdir`, `touch`), getting help (`man`, `--help`), history and shortcuts.
- **World 3, File Forest:** `cp`, `mv`, `rm`, `rmdir`, viewing files (`cat`, `head`, `tail`, `wc -l`; `less` is explained but not in the terminal), finding files (`find`), permissions (`ls -l`, `chmod`).
- **World 4, Process Peaks:** processes (`ps`, `kill`, jobs), the user environment (variables, `PATH`, `alias`), a gentle look at `nano`.
- **World 5, Text Tundra:** redirection, `grep`, pipes, `sort`, `uniq`, more `wc`, `cut`.
- **World 6, Script Castle:** first Bash script, variables, if and loops, networking basics (`ping`, `ip`, simulated output), local security (users, root, `sudo`). Final boss level mixes everything.
- **Side quests (optional quizzes):** desktop environments, common applications, printing.

### Design rules for World 3 onwards

- **Mission framing.** Each world is told as real-world jobs, not abstract exercises. For example: "The website is down. Find the error in the logs." or "Lock this file so only you can read it." Objectives and Pip's lines follow the mission.
- **Boss level.** Every world ends with a boss level: a harder, timed challenge that mixes everything learned in that world. The learner can retry as often as they like, with no penalty for running out of time or retrying. The countdown only runs while the tab is visible, and the TIMER button on the level (or "Boss level timer" in settings) turns it off for players who want no time pressure. SHOW ANSWER appears only after 3 tries on each objective. The boss also has at least two recall objectives from the previous world.
- **Recall objectives.** At least two non-boss levels per world (from World 3) include a recall objective: an earlier command with no hint. Pip may say "You learned this in World 2." but never the command, and SHOW ANSWER appears after 3 tries.
- **Missions that can fail.** A level can define `failure` (for example deleting an important file in Clean Up). The run stops with MISSION FAILED, and RESTART LEVEL (always available in the quest card) puts everything back.
- **World 3, File Forest, as built:** 1 Copy and Move (back up a config, tidy files), 2 Clean Up (disk full: rm, rm -r, rmdir; fails if an important file is deleted), 3 Read the Logs (website down: head, tail, wc -l in /var/log/web), 4 Find It (lost logo: find -name, quoted patterns, -type), 5 Permissions (ls -l, chmod 600 diary, chmod u+x script), 6 Boss: Forest Fire (8 minute timer, everything plus whoami and mkdir as recall). Tested in `src/content/levels/world3.test.ts`.

## Build phases

Work one phase at a time. At the end of each phase: run tests and the build, summarise what changed, and stop so I can review before starting the next.

1. Scaffold the app, design tokens, core components, routes with placeholder pages, `vercel.json`. Deploy.
2. Shell engine with unit tests (filesystem, paths, `ls`, `cd`, `pwd`, `mkdir`, `touch`, `cat`, `echo`, `clear`, `help`).
3. Level player: lesson pages, then challenge, then level clear. Build World 2 Level 4 "Dig a folder" fully, matching `design-reference/lesson-terminal.html`.
4. Quiz test type and one quiz level from World 1.
5. Title screen and intro story cutscene.
6. Progress, XP, unlocks and badges in localStorage. World map matching `design-reference/home-world-map.html`.
7. Content for Worlds 1 and 2. Then the remaining worlds, one world per session.
8. Sandbox polish, mobile check, accessibility pass.

## Rules

- Keep lessons short and friendly. Assume the learner has never used a terminal.
- No em dashes in any on-screen text (lessons, quizzes, Pip's lines, buttons, labels, the intro story). Use commas, full stops or hyphens instead.
- Every technical fact in a lesson must be correct for a real Linux system. If unsure, say so in your summary so I can check it.
- Keep components small and typed. No `any`.
- Do not add dependencies without saying why.
