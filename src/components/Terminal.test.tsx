import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { complete, createShellState, dir, file } from '../shell'
import { Terminal } from './Terminal'

const state = createShellState({
  seedFs: dir({
    home: dir({ pip: dir({ cave: dir({}), 'cat.txt': file('meow'), 'notes.txt': file('hi') }) }),
  }),
})

function setup() {
  const onSubmit = vi.fn()
  const onPrint = vi.fn()
  const onClearScreen = vi.fn()
  render(
    <Terminal
      lines={[]}
      prompt="pip@island:~$"
      title="pip@island: ~"
      history={[]}
      onSubmit={onSubmit}
      onComplete={(before) => complete(before, state, ['cat', 'cd', 'ls'])}
      onPrint={onPrint}
      onClearScreen={onClearScreen}
    />,
  )
  const input = screen.getByRole('textbox') as HTMLInputElement
  const typeText = (value: string) => {
    fireEvent.change(input, { target: { value } })
    input.setSelectionRange(value.length, value.length)
  }
  return { input, typeText, onSubmit, onPrint, onClearScreen }
}

describe('Terminal shortcuts', () => {
  it('Tab completes a single match', () => {
    const { input, typeText } = setup()
    typeText('cd ca')
    fireEvent.keyDown(input, { key: 'Tab' })
    expect(input.value).toBe('cd cave/')
  })

  it('a second Tab lists several matches', () => {
    const { input, typeText, onPrint } = setup()
    typeText('c')
    fireEvent.keyDown(input, { key: 'Tab' })
    expect(input.value).toBe('c')
    expect(onPrint).not.toHaveBeenCalled()
    fireEvent.keyDown(input, { key: 'Tab' })
    expect(onPrint).toHaveBeenCalledWith(['pip@island:~$ c'], 'in')
    expect(onPrint).toHaveBeenCalledWith(['cat  cd'], 'out')
  })

  it('lists right after a Tab that filled in the shared letters', () => {
    const { input, typeText, onPrint } = setup()
    typeText('cat ')
    fireEvent.keyDown(input, { key: 'Tab' })
    fireEvent.keyDown(input, { key: 'Tab' })
    expect(onPrint).toHaveBeenCalledWith(['cat.txt  cave/  notes.txt'], 'out')
  })

  it('Tab on an empty line is left alone, so focus can move on', () => {
    const { input } = setup()
    const event = fireEvent.keyDown(input, { key: 'Tab' })
    // fireEvent returns false when the default was prevented.
    expect(event).toBe(true)
  })

  it('Ctrl+C cancels the line and prints ^C', () => {
    const { input, typeText, onPrint, onSubmit } = setup()
    typeText('ls -la')
    fireEvent.keyDown(input, { key: 'c', ctrlKey: true })
    expect(onPrint).toHaveBeenCalledWith(['pip@island:~$ ls -la^C'], 'in')
    expect(input.value).toBe('')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('Ctrl+C with text selected copies as usual instead', () => {
    const { input, typeText, onPrint } = setup()
    typeText('ls -la')
    input.setSelectionRange(0, 2)
    fireEvent.keyDown(input, { key: 'c', ctrlKey: true })
    expect(onPrint).not.toHaveBeenCalled()
    expect(input.value).toBe('ls -la')
  })

  it('Ctrl+L clears the screen and keeps the line', () => {
    const { input, typeText, onClearScreen } = setup()
    typeText('pwd')
    fireEvent.keyDown(input, { key: 'l', ctrlKey: true })
    expect(onClearScreen).toHaveBeenCalled()
    expect(input.value).toBe('pwd')
  })

  // The button only shows on touch screens; jsdom ignores the media query, so it counts as hidden.
  it('the TAB button completes too', () => {
    const { input, typeText } = setup()
    typeText('cat no')
    fireEvent.click(screen.getByText('TAB'))
    expect(input.value).toBe('cat notes.txt ')
  })
})
