import { describe, expect, it } from 'vitest'

import { getDir, getNode, insertNode, listDir } from './fs'
import { dir, file, isDir, isFile } from './types'

function sampleTree() {
  return dir({
    home: dir({
      pip: dir({
        'notes.txt': file('hello'),
        snacks: dir({ 'fish.txt': file('><>') }),
      }),
    }),
  })
}

describe('getNode', () => {
  it('finds the root', () => {
    const root = sampleTree()
    expect(getNode(root, '/')).toBe(root)
  })

  it('finds a nested file', () => {
    const node = getNode(sampleTree(), '/home/pip/notes.txt')
    expect(isFile(node)).toBe(true)
  })

  it('returns null for missing paths', () => {
    expect(getNode(sampleTree(), '/home/pip/nope')).toBeNull()
  })

  it('returns null when descending into a file', () => {
    expect(getNode(sampleTree(), '/home/pip/notes.txt/x')).toBeNull()
  })
})

describe('getDir and listDir', () => {
  it('lists sorted children', () => {
    const d = getDir(sampleTree(), '/home/pip')
    expect(d && listDir(d)).toEqual(['notes.txt', 'snacks'])
  })

  it('returns null for a file path', () => {
    expect(getDir(sampleTree(), '/home/pip/notes.txt')).toBeNull()
  })
})

describe('insertNode', () => {
  it('adds a node under an existing parent', () => {
    const root = sampleTree()
    expect(insertNode(root, '/home/pip/treasure', dir())).toBe(true)
    expect(isDir(getNode(root, '/home/pip/treasure'))).toBe(true)
  })

  it('fails when the parent is missing', () => {
    const root = sampleTree()
    expect(insertNode(root, '/home/pip/nope/deep', file())).toBe(false)
  })
})
