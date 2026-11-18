import type { Level } from '../types'

export const distroFamilies: Level = {
  id: 'w1-l2-distro-families',
  world: 1,
  level: 2,
  title: 'Distro Families',
  blurb: 'One kernel, many flavours: the big Linux families.',
  xp: 40,
  lessonPages: [
    'A Linux **distribution** (or "distro") bundles the Linux kernel together with a set of programs and tools, ready to install and use. There are hundreds of them.',
    'Most distros belong to a **family** that shares a way of installing software (a package manager):\n\n- **Debian family** (Debian, Ubuntu, Linux Mint) uses `apt` and `.deb` packages.\n- **Red Hat family** (Fedora, RHEL, Rocky) uses `dnf` and `.rpm` packages.',
    'Two more you will hear about:\n\n- **Arch family** (Arch, Manjaro) uses `pacman` and updates continuously.\n- **SUSE family** (openSUSE) uses `zypper`.\n\nUnderneath, they all run the same Linux kernel. The differences are in the tools and packaging.',
  ],
  test: {
    kind: 'quiz',
    questions: [
      {
        prompt: 'What is a Linux "distribution"?',
        options: [
          'A single application',
          'The Linux kernel bundled with software into a complete, usable system',
          'A type of computer chip',
          'A programming language',
        ],
        correct: 1,
        explain: 'A distro packages the kernel plus tools and programs so you can install and use it.',
      },
      {
        prompt: 'Which distro belongs to the Debian family and is popular with beginners?',
        options: ['Fedora', 'Ubuntu', 'Arch Linux', 'openSUSE'],
        correct: 1,
        explain: 'Ubuntu is built on Debian and is a common first distro.',
      },
      {
        prompt: 'Which package manager belongs to the Debian family?',
        options: ['pacman', 'dnf', 'apt', 'zypper'],
        correct: 2,
        explain: 'Debian and Ubuntu use apt with .deb packages. dnf is Red Hat, pacman is Arch, zypper is SUSE.',
      },
      {
        prompt: 'Can different distros share the same Linux kernel?',
        options: [
          'Yes, the kernel is common, while tools and packaging differ',
          'No, each distro writes its own kernel from scratch',
          'Only Ubuntu is allowed to use the Linux kernel',
          'Distros never use the Linux kernel at all',
        ],
        correct: 0,
        explain: 'They share the Linux kernel; what differs is the software and how it is packaged.',
      },
      {
        prompt: 'Which family does Fedora belong to?',
        options: ['Debian family', 'Red Hat family', 'Arch family', 'SUSE family'],
        correct: 1,
        explain: 'Fedora is in the Red Hat family, with RHEL and Rocky Linux. It installs software with dnf and .rpm packages.',
      },
    ],
  },
}
