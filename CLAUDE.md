# Pixel Linux Quest

A free hobby website that gives people a cool, brief introduction to Linux. It looks and feels like a retro pixel game. The learner reads short lessons, then proves what they learned by completing quests in a simulated "pocket terminal" in the browser.

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
6. **Break It sandbox** (`/sandbox`). A terminal plus the live folder map on a realistic pretend system (`src/content/sandbox.ts`: /bin, /etc, /home/pip, /var/log and so on), no objectives. **Every command the engine implements is available here** (`ALL_COMMANDS` from the registry), whatever the learner has unlocked. Dangerous commands behave like real Linux: `rm -rf /` is refused with GNU rm's preserve-root failsafe, while `rm -rf --no-preserve-root /`, `rm -rf /*` (the shell expands the `*`, so the failsafe never sees `/`) and the fork bomb break the system, with or without `sudo`. Breaking it plays a collapse animation, then a shareable SYSTEM DESTROYED or SYSTEM FROZEN screen with a RESET button. The first break earns the secret badge Chaos Penguin, shown as ??? on the badges page until then. Detection lives in `src/shell/danger.ts` (parsed, not string-matched, unit tested); outside the sandbox these commands are stopped with a friendly message.
7. **Live folder map.** Every challenge level (and the sandbox) shows a pixel-art map of the folders next to the terminal, with Pip standing in the current folder (`src/game/folderMapModel.ts` is the pure, tested model; `FolderMap.tsx` draws it). SHOW MAP / HIDE MAP is remembered in localStorage.

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
  }[];
};

type QuizTest = {
  kind: "quiz";
  questions: { prompt: string; options: string[]; correct: number; explain: string }[];
};
```

A quiz clears the level at 80% or more correct answers (`src/game/quizScore.ts`). With 4 questions that still means 4 out of 4, so give quizzes 5 or 10 questions if one mistake should be allowed.

## Shell engine

`src/shell/` is a pure TypeScript module with no React in it, fully unit tested.

- Virtual in-memory filesystem with home at `/home/pip`, `~` shortcut, absolute and relative paths, `.` and `..`.
- A command registry: each command is its own file returning stdout, stderr and the new state. Commands are unlocked per level.
- Supports pipes `|` and redirection `>` `>>` once World 5 needs them.
- Error messages should look like real Linux messages.
- Command lines are split like bash does it (`src/shell/parse.ts`): quotes, backslash escapes, and `*` / `?` patterns expanded against the filesystem.
- **Pip explains mistakes.** When a command fails, the terminal still shows the real error, and Pip adds a short, friendly explanation in the speech bubble (`src/shell/explain.ts`, one test per rule). Explanations point at the mistake and never give away the answer to the current objective. Only say a command does not exist on Linux if that is true (`dir` and `type` do exist).
- `rm` is implemented (`-r`, `-f`, `-d`, `-v`, `--no-preserve-root`) with GNU error messages, but stays locked in levels until World 3. `sudo COMMAND` runs the command as root. `type` and `dir` exist because they exist on real Linux.
- Fun easter eggs are welcome (`sudo` and `rm` before they are unlocked give friendly Pip messages).
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
- **World 3, File Forest:** `cp`, `mv`, `rm`, viewing files (`cat`, `head`, `tail`, `less`), finding files (`find`), permissions (`ls -l`, `chmod`).
- **World 4, Process Peaks:** processes (`ps`, `kill`, jobs), the user environment (variables, `PATH`, `alias`), a gentle look at `nano`.
- **World 5, Text Tundra:** redirection, `grep`, pipes, `sort`, `uniq`, `wc`, `cut`.
- **World 6, Script Castle:** first Bash script, variables, if and loops, networking basics (`ping`, `ip`, simulated output), local security (users, root, `sudo`). Final boss level mixes everything.
- **Side quests (optional quizzes):** desktop environments, common applications, printing.

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
