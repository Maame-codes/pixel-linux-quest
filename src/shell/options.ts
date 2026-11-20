// Reading command options the way GNU tools do (getopt_long): options may
// come before or after the names, short ones can be bunched (-rv), a short
// option's value may be glued on (-n5) or follow (-n 5), and "--" ends the
// options.

export type OptionSpec = {
  /** Short options without a value, e.g. "rRv". */
  flags: string
  /** Short options that take a value, e.g. "n". */
  withValue?: string
  /** Long options and the short letter each one means, e.g. { recursive: 'r', lines: 'n' }. */
  long?: Record<string, string>
}

export type ParsedOptions = {
  /** Short letters that were given (long ones are stored by their letter). */
  flags: Set<string>
  /** Values of options that take one, by letter (the last one wins). */
  values: Record<string, string>
  operands: string[]
  /** The GNU error text, if an option was wrong. */
  error?: string
}

export const tryHelp = (cmd: string) => `Try '${cmd} --help' for more information.`

export function parseOptions(cmd: string, args: string[], spec: OptionSpec): ParsedOptions {
  const out: ParsedOptions = { flags: new Set(), values: {}, operands: [] }
  const withValue = spec.withValue ?? ''
  const fail = (msg: string) => {
    out.error ??= `${cmd}: ${msg}\n${tryHelp(cmd)}`
  }
  let done = false
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (done || arg === '-' || !arg.startsWith('-')) {
      out.operands.push(arg)
      continue
    }
    if (arg === '--') {
      done = true
      continue
    }
    if (arg.startsWith('--')) {
      const [name, glued] = arg.slice(2).split(/=(.*)/s)
      const letter = spec.long?.[name]
      if (!letter) {
        fail(`unrecognized option '${arg}'`)
        continue
      }
      if (withValue.includes(letter)) {
        const value = glued ?? args[++i]
        if (value === undefined) fail(`option '--${name}' requires an argument`)
        else out.values[letter] = value
      } else out.flags.add(letter)
      continue
    }
    for (let j = 1; j < arg.length; j++) {
      const c = arg[j]
      if (withValue.includes(c)) {
        const rest = arg.slice(j + 1)
        const value = rest !== '' ? rest : args[++i]
        if (value === undefined) fail(`option requires an argument -- '${c}'`)
        else out.values[c] = value
        break
      }
      if (spec.flags.includes(c)) out.flags.add(c)
      else fail(`invalid option -- '${c}'`)
    }
  }
  return out
}
