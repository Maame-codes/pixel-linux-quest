import { describe, expect, it } from 'vitest'

import { basename, dirname, normalizePath, resolvePath, shortenPath } from './path'

const HOME = '/home/pip'

describe('normalizePath', () => {
  it('collapses . and redundant slashes', () => {
    expect(normalizePath('/home//pip/./notes')).toBe('/home/pip/notes')
  })

  it('resolves .. segments', () => {
    expect(normalizePath('/home/pip/snacks/..')).toBe('/home/pip')
  })

  it('does not climb above root', () => {
    expect(normalizePath('/../..')).toBe('/')
  })

  it('returns / for root-ish input', () => {
    expect(normalizePath('/')).toBe('/')
    expect(normalizePath('/.')).toBe('/')
  })
})

describe('resolvePath', () => {
  it('returns cwd for empty input', () => {
    expect(resolvePath(HOME, '', HOME)).toBe(HOME)
  })

  it('expands ~ to home', () => {
    expect(resolvePath('/', '~', HOME)).toBe(HOME)
    expect(resolvePath('/', '~/snacks', HOME)).toBe('/home/pip/snacks')
  })

  it('handles absolute paths', () => {
    expect(resolvePath(HOME, '/etc', HOME)).toBe('/etc')
  })

  it('handles relative paths and ..', () => {
    expect(resolvePath(HOME, 'snacks', HOME)).toBe('/home/pip/snacks')
    expect(resolvePath('/home/pip/snacks', '..', HOME)).toBe(HOME)
  })

  it('strips a trailing slash', () => {
    expect(resolvePath(HOME, 'snacks/', HOME)).toBe('/home/pip/snacks')
  })
})

describe('basename and dirname', () => {
  it('splits a path', () => {
    expect(basename('/home/pip/notes.txt')).toBe('notes.txt')
    expect(dirname('/home/pip/notes.txt')).toBe('/home/pip')
  })

  it('handles root', () => {
    expect(basename('/')).toBe('')
    expect(dirname('/home')).toBe('/')
  })
})

describe('shortenPath', () => {
  it('replaces home with ~', () => {
    expect(shortenPath(HOME, HOME)).toBe('~')
    expect(shortenPath('/home/pip/snacks', HOME)).toBe('~/snacks')
    expect(shortenPath('/etc', HOME)).toBe('/etc')
  })
})
