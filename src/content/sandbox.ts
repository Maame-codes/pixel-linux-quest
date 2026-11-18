import { dir, file, type DirNode } from '../shell'

// The Break It sandbox's starting filesystem: a small but realistic Linux
// layout. Program files hold a short note instead of real machine code.

const program = (name: string) => file(`(${name} is a program: machine code, not text)`)

export function sandboxFs(): DirNode {
  return dir({
    bin: dir({
      bash: program('bash'),
      cat: program('cat'),
      ls: program('ls'),
      mkdir: program('mkdir'),
      rm: program('rm'),
    }),
    boot: dir({
      vmlinuz: program('vmlinuz, the Linux kernel,'),
    }),
    dev: dir({
      null: file(''),
      tty: file(''),
    }),
    etc: dir({
      hostname: file('island'),
      'os-release': file('NAME="Pip OS"\nPRETTY_NAME="Pip OS (pretend)"\nID=pipos'),
      passwd: file(
        'root:x:0:0:root:/root:/bin/bash\npip:x:1000:1000:Pip the penguin:/home/pip:/bin/bash',
      ),
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
          'hello.sh': file('#!/bin/bash\necho "Hello from Pip!"'),
        }),
      }),
    }),
    lib: dir({
      'libc.so.6': program('libc'),
    }),
    root: dir(),
    sbin: dir({
      init: program('init'),
      reboot: program('reboot'),
    }),
    tmp: dir(),
    usr: dir({
      bin: dir({
        man: program('man'),
        sudo: program('sudo'),
        whoami: program('whoami'),
      }),
      share: dir({
        doc: dir(),
      }),
    }),
    var: dir({
      log: dir({
        'syslog': file('Nov 18 09:00:01 island systemd[1]: Started Daily cleanup.\nNov 18 09:00:02 island kernel: All systems normal.'),
        'auth.log': file('Nov 18 09:01:12 island sudo: pip : TTY=pts/0 ; PWD=/home/pip ; USER=root ; COMMAND=/usr/bin/whoami'),
      }),
    }),
  })
}
