import { dir, file, type DirNode } from '../shell'

// The Break It sandbox's starting filesystem: a small but realistic Linux
// layout. Program files hold a short note instead of real machine code.
// Everything outside /home/pip belongs to root (the shell fills that in), so
// pip needs sudo to change it, as on a real system.

const program = (name: string) => file(`(${name} is a program: machine code, not text)`, { mode: 0o755 })

/** Logs are readable by the adm group, not by everyone, as on Ubuntu. */
const log = (text: string) => file(text, { mode: 0o640, owner: 'syslog', group: 'adm' })

export function sandboxFs(): DirNode {
  return dir({
    bin: dir({
      bash: program('bash'),
      cat: program('cat'),
      chmod: program('chmod'),
      cp: program('cp'),
      ls: program('ls'),
      mkdir: program('mkdir'),
      mv: program('mv'),
      rm: program('rm'),
      rmdir: program('rmdir'),
    }),
    boot: dir({
      vmlinuz: program('vmlinuz, the Linux kernel,'),
    }),
    dev: dir({
      null: file('', { mode: 0o666 }),
      tty: file('', { mode: 0o666 }),
    }),
    etc: dir({
      hostname: file('island'),
      'os-release': file('NAME="Pip OS"\nPRETTY_NAME="Pip OS (pretend)"\nID=pipos'),
      passwd: file(
        'root:x:0:0:root:/root:/bin/bash\npip:x:1000:1000:Pip the penguin:/home/pip:/bin/bash',
      ),
      // Password hashes live here, readable only by root and the shadow group.
      shadow: file('root:*:20000:0:99999:7:::\npip:*:20000:0:99999:7:::', { mode: 0o640, group: 'shadow' }),
    }),
    home: dir({
      pip: dir({
        'notes.txt': file('Things to try in the sandbox:\n- make folders and files\n- look around with ls and cd\n- break things. Nothing here is real.'),
        'todo.txt': file('1. catch fish\n2. learn Linux\n3. nap'),
        photos: dir({
          'beach.png': file('(a picture of a beach)'),
          'iceberg.png': file('(a picture of an iceberg)'),
        }),
        projects: dir({
          'hello.sh': file('#!/bin/bash\necho "Hello from Pip!"', { mode: 0o755 }),
        }),
      }),
    }),
    lib: dir({
      'libc.so.6': program('libc'),
    }),
    root: dir({ '.bashrc': file("# root's shell settings") }, { mode: 0o700 }),
    sbin: dir({
      init: program('init'),
      reboot: program('reboot'),
    }),
    // Anyone may make files in /tmp, but the sticky bit (t) stops people deleting each other's.
    tmp: dir({}, { mode: 0o1777 }),
    usr: dir({
      bin: dir({
        find: program('find'),
        head: program('head'),
        man: program('man'),
        // sudo runs as root whoever starts it: the setuid bit (s).
        sudo: file('(sudo is a program: machine code, not text)', { mode: 0o4755 }),
        tail: program('tail'),
        wc: program('wc'),
        whoami: program('whoami'),
      }),
      share: dir({
        doc: dir(),
      }),
    }),
    var: dir({
      log: dir({
        syslog: log('Nov 18 09:00:01 island systemd[1]: Started Daily cleanup.\nNov 18 09:00:02 island kernel: All systems normal.'),
        'auth.log': log('Nov 18 09:01:12 island sudo: pip : TTY=pts/0 ; PWD=/home/pip ; USER=root ; COMMAND=/usr/bin/whoami'),
      }),
    }),
  })
}
