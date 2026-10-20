import type { Level } from '../types'

export const whatIsLinux: Level = {
  id: 'w1-l1-what-is-linux',
  world: 1,
  level: 1,
  title: 'What is Linux?',
  blurb: 'The big idea behind Linux, and why it is everywhere.',
  xp: 40,
  lessonPages: [
    'Linux is a free, open-source **operating system** — the software that runs a computer and lets programs use its hardware. A student named Linus Torvalds wrote the first version in 1991 and shared it with the world.',
    'Strictly speaking, "Linux" is the **kernel**: the core that talks to the hardware. Paired with tools from the **GNU** project, it makes a complete system, which is why you sometimes see the name **GNU/Linux**.',
    '"Open source" means anyone can read, change and share the code. A guiding idea from Unix lives on in Linux: build **small tools that each do one job well**, then combine them. You drive it all by typing commands into a **shell**.',
    'That design made Linux tough and flexible, so today it runs most web servers, the cloud, Android phones and every one of the world’s fastest supercomputers.',
  ],
  test: {
    kind: 'quiz',
    questions: [
      {
        prompt: 'Who wrote the first Linux kernel in 1991?',
        options: ['Richard Stallman', 'Linus Torvalds', 'Ken Thompson', 'Tim Berners-Lee'],
        correct: 1,
        explain: 'Linus Torvalds, then a student in Helsinki, wrote the first Linux kernel in 1991.',
      },
      {
        prompt: 'What does it mean that Linux is "open source"?',
        options: [
          'The source code is kept secret',
          'It only runs on one brand of computer',
          'Anyone can read, change and share the source code',
          'You must buy a yearly licence to use it',
        ],
        correct: 2,
        explain: 'Open source means the code is public: anyone can study it, modify it and share it.',
      },
      {
        prompt: 'Technically, the word "Linux" refers to which part of the system?',
        options: [
          'The kernel at the core',
          'The web browser',
          'The desktop wallpaper',
          'The keyboard layout',
        ],
        correct: 0,
        explain:
          'Linux is the kernel. Combined with GNU tools it forms the full system, sometimes called GNU/Linux.',
      },
      {
        prompt: 'Which idea best captures the Unix/Linux philosophy?',
        options: [
          'One giant program should do everything',
          'Small tools that each do one job well, combined together',
          'Users should never touch a keyboard',
          'Programs must never share their output',
        ],
        correct: 1,
        explain:
          'Linux favours small, focused tools you can combine — for example by piping one tool’s output into another.',
      },
    ],
  },
}
