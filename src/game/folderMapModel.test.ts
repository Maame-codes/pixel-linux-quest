import { describe, expect, it } from 'vitest'

import { createShellState, dir, file, runCommand, type ShellState } from '../shell'
import { buildFolderMap, describeFolderMap, flattenFolderMap, newPaths } from './folderMapModel'

const CMDS = { commands: ['cd', 'mkdir', 'touch', 'ls'] }

function state(cwd = '/home/pip'): ShellState {
  return createShellState({
    cwd,
    seedFs: dir({
      etc: dir({ hostname: file('island') }),
      home: dir({
        pip: dir({
          'notes.txt': file(''),
          cave: dir({ tunnel: dir({ deep: dir({ deeper: dir({ deepest: dir({ end: dir() }) }) }) }) }),
          lake: dir({ 'boat.txt': file('') }),
        }),
      }),
    }),
  })
}

const names = (s: ShellState) => flattenFolderMap(buildFolderMap(s)).map((r) => (r.kind === 'more' ? `+${r.count}` : r.name))

describe('buildFolderMap', () => {
  it('starts at the home directory and marks where Pip is', () => {
    const map = buildFolderMap(state())
    expect(map.root.path).toBe('/home/pip')
    expect(map.root.current).toBe(true)
    expect(map.root.children.map((c) => c.name)).toEqual(['cave', 'lake', 'notes.txt'])
  })

  it('moves the highlight when Pip changes folder', () => {
    const s = runCommand(state(), 'cd lake', CMDS).state
    const map = buildFolderMap(s)
    expect(map.pipAt).toBe('/home/pip/lake')
    expect(map.root.current).toBe(false)
    expect(map.root.children.find((c) => c.name === 'lake')?.current).toBe(true)
  })

  it('shows new folders and files', () => {
    let s = runCommand(state(), 'mkdir treasure', CMDS).state
    s = runCommand(s, 'touch map.txt', CMDS).state
    expect(names(s)).toContain('treasure')
    expect(names(s)).toContain('map.txt')
  })

  it('shows the first 6 items and "+N more"', () => {
    let s = state()
    for (const n of ['a', 'b', 'c', 'd', 'e', 'f']) s = runCommand(s, `touch ${n}`, CMDS).state
    const map = buildFolderMap(s)
    expect(map.root.children).toHaveLength(6)
    expect(map.root.more).toBe(3)
    expect(names(s).at(-1)).toBe('+3')
  })

  it('always keeps the folder Pip is in on the map', () => {
    let s = state()
    for (const n of ['a', 'b', 'c', 'd', 'e', 'f']) s = runCommand(s, `touch ${n}`, CMDS).state
    s = runCommand(s, 'cd lake', CMDS).state
    expect(buildFolderMap(s).root.children.map((c) => c.name)).toContain('lake')
  })

  it('limits the depth, starting lower when Pip goes deep', () => {
    const s = state('/home/pip/cave/tunnel/deep/deeper/deepest/end')
    const map = buildFolderMap(s, { maxDepth: 4 })
    expect(map.root.path).toBe('/home/pip/cave/tunnel')
    const rows = flattenFolderMap(map)
    expect(Math.max(...rows.map((r) => r.depth))).toBeLessThanOrEqual(4)
    expect(rows.some((r) => r.kind !== 'more' && r.current)).toBe(true)
  })

  it('folders off Pip’s path are not opened past openDepth', () => {
    const map = buildFolderMap(state(), { openDepth: 1 })
    const cave = map.root.children.find((c) => c.name === 'cave')
    expect(cave?.open).toBe(false)
  })

  it('starts higher up when Pip leaves home', () => {
    const s = runCommand(state(), 'cd /etc', CMDS).state
    const map = buildFolderMap(s)
    expect(map.root.path).toBe('/')
    expect(map.pipAt).toBe('/etc')
  })
})

describe('newPaths', () => {
  it('lists what was added since the last map', () => {
    const before = buildFolderMap(state())
    const after = buildFolderMap(runCommand(state(), 'mkdir treasure', CMDS).state)
    expect([...newPaths(before, after)]).toEqual(['/home/pip/treasure'])
    expect(newPaths(null, after).size).toBe(0)
  })
})

describe('describeFolderMap', () => {
  it('gives a text outline with "you are here"', () => {
    const lines = describeFolderMap(buildFolderMap(state()))
    expect(lines[0]).toBe('/home/pip, folder (you are here)')
    expect(lines).toContain('notes.txt, file, in /home/pip')
  })
})
