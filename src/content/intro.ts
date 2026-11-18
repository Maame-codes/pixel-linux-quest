export type IntroScene = {
  id: string
  /** Pip's narration, 1–3 short sentences. Original wording. */
  text: string
}

// The story of how Linux came to be, told by Pip. Keep each scene tiny.
export const INTRO_SCENES: IntroScene[] = [
  {
    id: 'unix',
    text: '1969. At Bell Labs, Ken Thompson and Dennis Ritchie build a small, clever operating system and call it Unix.',
  },
  {
    id: 'spread',
    text: 'Unix was so useful it spread to universities and companies. But it cost money, and soon there were many versions that did not agree with each other.',
  },
  {
    id: 'gnu',
    text: '1983. Richard Stallman starts the GNU project to build a complete, free, Unix-like system. By the early 1990s it has almost every piece, except the core, called the kernel.',
  },
  {
    id: 'linus',
    text: '1991. Linus Torvalds, a student in Helsinki, writes his own kernel just for fun and posts it online for anyone to try.',
  },
  {
    id: 'gpl',
    text: '1992. Linus shares his kernel under a free licence. GNU’s tools and Linus’s kernel click together into a whole free system, and the first distributions appear.',
  },
  {
    id: 'today',
    text: 'Today Linux is everywhere: most web servers, the cloud, every Android phone, and all of the world’s fastest supercomputers.',
  },
  {
    id: 'your-turn',
    text: 'And now it’s your turn. Ready, explorer? Let’s go!',
  },
]
