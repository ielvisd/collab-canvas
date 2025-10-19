import type { Ref } from 'vue'

export interface ClipboardEmoji {
  emoji: string
  x: number
  y: number
  size: number
  layer: number
  rotation: number
}

export interface ClipboardState {
  hasData: Ref<boolean>
  itemCount: Ref<number>
}

export interface ClipboardActions {
  copyItems: (emojis: ClipboardEmoji[]) => void
  pasteItems: () => ClipboardEmoji[]
  clear: () => void
}

export const useClipboard = () => {
  // Store copied emoji data in memory
  const clipboardData = ref<ClipboardEmoji[]>([])
  
  // Computed state
  const hasData = computed(() => clipboardData.value.length > 0)
  const itemCount = computed(() => clipboardData.value.length)
  
  // Copy items to clipboard
  const copyItems = (emojis: ClipboardEmoji[]) => {
    clipboardData.value = emojis.map(emoji => ({
      emoji: emoji.emoji,
      x: emoji.x,
      y: emoji.y,
      size: emoji.size,
      layer: emoji.layer,
      rotation: emoji.rotation
    }))
    console.log('📋 Copied items to clipboard:', clipboardData.value.length)
  }
  
  // Paste items from clipboard (returns a copy with offset)
  const pasteItems = (): ClipboardEmoji[] => {
    if (!hasData.value) return []
    
    const offset = 20
    const pastedItems = clipboardData.value.map(emoji => ({
      emoji: emoji.emoji,
      x: emoji.x + offset,
      y: emoji.y + offset,
      size: emoji.size,
      layer: emoji.layer,
      rotation: emoji.rotation
    }))
    
    console.log('📋 Pasted items from clipboard:', pastedItems.length)
    return pastedItems
  }
  
  // Clear clipboard
  const clear = () => {
    clipboardData.value = []
    console.log('📋 Clipboard cleared')
  }
  
  // State
  const state: ClipboardState = {
    hasData,
    itemCount
  }
  
  // Actions
  const actions: ClipboardActions = {
    copyItems,
    pasteItems,
    clear
  }
  
  return {
    ...state,
    ...actions
  }
}

