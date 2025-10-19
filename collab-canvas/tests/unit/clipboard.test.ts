import { describe, it, expect, beforeEach } from 'vitest'
import { useClipboard } from '~/composables/useClipboard'

describe('useClipboard', () => {
  let clipboard: ReturnType<typeof useClipboard>

  beforeEach(() => {
    clipboard = useClipboard()
  })

  it('should initialize with empty clipboard', () => {
    expect(clipboard.hasData.value).toBe(false)
    expect(clipboard.itemCount.value).toBe(0)
  })

  it('should copy items to clipboard', () => {
    const testEmojis = [
      {
        emoji: '😀',
        x: 100,
        y: 100,
        size: 32,
        layer: 1,
        rotation: 0
      },
      {
        emoji: '🎉',
        x: 200,
        y: 200,
        size: 48,
        layer: 2,
        rotation: 45
      }
    ]

    clipboard.copyItems(testEmojis)

    expect(clipboard.hasData.value).toBe(true)
    expect(clipboard.itemCount.value).toBe(2)
  })

  it('should paste items with offset', () => {
    const testEmojis = [
      {
        emoji: '😀',
        x: 100,
        y: 100,
        size: 32,
        layer: 1,
        rotation: 0
      }
    ]

    clipboard.copyItems(testEmojis)
    const pastedItems = clipboard.pasteItems()

    expect(pastedItems).toHaveLength(1)
    expect(pastedItems[0]).toEqual({
      emoji: '😀',
      x: 120, // 100 + 20 offset
      y: 120, // 100 + 20 offset
      size: 32,
      layer: 1,
      rotation: 0
    })
  })

  it('should clear clipboard', () => {
    const testEmojis = [
      {
        emoji: '😀',
        x: 100,
        y: 100,
        size: 32,
        layer: 1,
        rotation: 0
      }
    ]

    clipboard.copyItems(testEmojis)
    expect(clipboard.hasData.value).toBe(true)

    clipboard.clear()
    expect(clipboard.hasData.value).toBe(false)
    expect(clipboard.itemCount.value).toBe(0)
  })

  it('should handle multiple pastes with increasing offset', () => {
    const testEmojis = [
      {
        emoji: '😀',
        x: 100,
        y: 100,
        size: 32,
        layer: 1,
        rotation: 0
      }
    ]

    clipboard.copyItems(testEmojis)
    
    const firstPaste = clipboard.pasteItems()
    const secondPaste = clipboard.pasteItems()

    expect(firstPaste[0].x).toBe(120) // 100 + 20
    expect(firstPaste[0].y).toBe(120) // 100 + 20
    
    expect(secondPaste[0].x).toBe(120) // 100 + 20 (offset from original, not cumulative)
    expect(secondPaste[0].y).toBe(120) // 100 + 20 (offset from original, not cumulative)
  })

  it('should return empty array when pasting with empty clipboard', () => {
    const pastedItems = clipboard.pasteItems()
    expect(pastedItems).toEqual([])
  })
})

