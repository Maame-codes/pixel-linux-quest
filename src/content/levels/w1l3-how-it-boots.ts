import type { Level } from '../types'

export const howItBoots: Level = {
  id: 'w1-l3-how-it-boots',
  world: 1,
  level: 3,
  title: 'How a System Boots',
  blurb: 'From the power button to a login prompt.',
  xp: 40,
  lessonPages: [
    'When you press the power button, the computer’s built-in **firmware** runs first. On modern machines this is called **UEFI** (older ones used **BIOS**). It does a quick hardware check and finds something to start.',
    'The firmware hands over to a **bootloader**. On Linux this is usually **GRUB**. Its one job is to load the **Linux kernel** into memory and start it.',
    'The kernel sets up the hardware, then starts the very first program, known as **init**. On most distros that is **systemd**, which has process id 1. It starts all the other services and finally shows you a **login** prompt.',
    'So the order is: **firmware → bootloader → kernel → init (systemd) → login**.',
  ],
  test: {
    kind: 'quiz',
    questions: [
      {
        prompt: 'What runs first when you press the power button?',
        options: [
          'The web browser',
          'The firmware (UEFI or BIOS)',
          'The GRUB bootloader',
          'The systemd service manager',
        ],
        correct: 1,
        explain: 'Firmware (UEFI, or BIOS on older machines) runs first and then hands off to the bootloader.',
      },
      {
        prompt: 'What is the main job of a bootloader like GRUB?',
        options: [
          'To load the Linux kernel into memory and start it',
          'To browse the internet',
          'To erase the disk on every boot',
          'To charge the battery',
        ],
        correct: 0,
        explain: 'GRUB loads the kernel and starts it running.',
      },
      {
        prompt: 'After the kernel starts, what is the first process it launches (process id 1)?',
        options: ['init, usually systemd', 'Firefox', 'The bash shell you type in', 'GRUB again'],
        correct: 0,
        explain: 'The kernel starts init (systemd on most distros) as process 1; it brings up everything else.',
      },
      {
        prompt: 'Which sequence shows the boot order correctly?',
        options: [
          'Kernel → Firmware → Bootloader → init',
          'Firmware → Bootloader → Kernel → init',
          'Bootloader → Kernel → Firmware → init',
          'init → Kernel → Bootloader → Firmware',
        ],
        correct: 1,
        explain: 'Firmware, then bootloader, then kernel, then init (systemd), then the login prompt.',
      },
      {
        prompt: 'Before UEFI, what was the firmware on most PCs called?',
        options: ['GRUB', 'systemd', 'BIOS', 'bash'],
        correct: 2,
        explain: 'Older PCs used BIOS. Modern ones use UEFI, which does the same first job: check the hardware and start the bootloader.',
      },
    ],
  },
}
