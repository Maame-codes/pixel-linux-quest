// Pip's tips for game over screens. Every tip must be true on a real Linux
// system and make sense to a beginner. Keep them short.

export const GENERAL_TIPS: readonly string[] = [
  'Press Tab while typing a command or file name, and the shell finishes it for you.',
  'The Up arrow brings back the last command you typed, so you do not have to type it again.',
  'cd on its own takes you straight back to your home folder.',
  '~ is a shortcut for your home folder, so cd ~ goes home too.',
  'cd .. moves you up one folder.',
  'pwd prints the folder you are in right now.',
  'Linux cares about capital letters: notes.txt and Notes.txt are two different files.',
  'A file whose name starts with a dot, like .bashrc, is hidden. ls -a shows it.',
  'man ls opens the manual for ls. Press q to close it.',
  'Ctrl+C stops a command that is still running.',
  'clear wipes the terminal screen. In bash, Ctrl+L does the same.',
  'history lists the commands you typed before.',
  'mkdir -p a/b/c makes a folder and any missing folders above it in one go.',
]

export const SNAKE_TIPS: readonly string[] = [
  ...GENERAL_TIPS,
  'Data travels across networks in small chunks called packets.',
  'ping sends small test packets to another computer to check that it can be reached.',
]

export const BUG_TIPS: readonly string[] = [
  ...GENERAL_TIPS,
  'When something goes wrong, Linux often writes about it in a log file, and many logs live in /var/log.',
  'A bug is a mistake in a program. Reading the error message is the first step to fixing one.',
]

export const BRICK_TIPS: readonly string[] = [
  ...GENERAL_TIPS,
  'Files ending in .bak are usually backup copies, kept in case something goes wrong.',
  'The /tmp folder is for temporary files, and many systems empty it when they restart.',
  'rm deletes files for good from the terminal: there is no recycle bin to get them back.',
]
