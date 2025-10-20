import type { Ref } from 'vue'
import { calculateViewportBounds, getRandomViewportPosition, getViewportCenterPosition, clampToViewport } from '~/utils/viewportUtils'

export interface Emoji {
  id: string
  emoji: string
  x: number
  y: number
  size: number
  layer: number
  rotation: number
  user_id?: string
  created_at?: string
  updated_at?: string
}

export interface EmojiActions {
  addEmoji: (emoji: Omit<Emoji, 'id' | 'created_at' | 'updated_at'>) => Promise<Emoji | null>
  updateEmoji: (id: string, updates: Partial<Emoji>) => Promise<boolean>
  deleteEmoji: (id: string) => Promise<boolean>
  deleteMultipleEmojis: (ids: string[]) => Promise<boolean>
  clearAllEmojis: () => Promise<boolean>
  getEmojiById: (id: string) => Emoji | null
  loadEmojis: () => Promise<void>
}

export interface EmojiState {
  emojis: Ref<Emoji[]>
  loading: Ref<boolean>
  saving: Ref<boolean>
  error: Ref<string | null>
  selectedEmojiId: Ref<string | null>
  totalEmojis: Ref<number>
}

export const useEmojis = (canvasWidth: number = 800, canvasHeight: number = 600, canvasState?: { scale: number; offsetX: number; offsetY: number; canvasWidth: number; canvasHeight: number }, viewportElement?: HTMLElement | null) => {
  // Database composable
  const {
    loading: dbLoading,
    saving: dbSaving,
    error: dbError,
    saveEmoji: saveEmojiToDb,
    updateEmoji: updateEmojiInDb,
    deleteEmoji: deleteEmojiFromDb,
    loadEmojis: loadEmojisFromDb,
    deleteAllEmojis
  } = useCanvasDatabase()

  // Undo/Redo composable
  const { recordAction, isUndoRedoInProgress } = useUndoRedo()

  // State - Use useState for shared state across components
  const emojis = useState<Emoji[]>('canvas-emojis', () => [])
  const selectedEmojiId = useState<string | null>('canvas-selected-emoji', () => null)
  const autoSave = ref(true)
  
  // Flag to prevent update loops during real-time sync
  const isUpdatingFromRealtime = ref(false)

  // Real-time sync for emojis
  const {
    isConnected: isRealtimeConnected,
    lastSyncTime,
    error: realtimeError,
    startSync: startEmojiSync,
    stopSync: stopEmojiSync
  } = useEmojiRealtimeSync(emojis, isUpdatingFromRealtime)

  // Computed
  const totalEmojis = computed(() => emojis.value.length)

  // Utility functions
  const generateId = (type: string) => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }
  
  const getRandomPosition = (maxX: number, maxY: number) => {
    // Try to use viewport bounds if available
    if (canvasState && viewportElement) {
      const viewportBounds = calculateViewportBounds(canvasState, viewportElement)
      if (viewportBounds) {
        return getRandomViewportPosition(viewportBounds, 50)
      }
    }
    
    // Fallback to original behavior
    return {
      x: Math.random() * (maxX - 50),
      y: Math.random() * (maxY - 50)
    }
  }

  // Convert emoji to database format
  const emojiToDbFormat = (emoji: Emoji) => {
    return {
      x: emoji.x,
      y: emoji.y,
      text: emoji.emoji,  // Store emoji character as 'text'
      emoji: emoji.emoji, // Also store in 'emoji' field for easy filtering
      fontSize: emoji.size,
      emojiSize: emoji.size,
      layer: emoji.layer || 1,
      rotation: emoji.rotation || 0,
      fill: 'transparent',
      stroke: 'transparent',
      draggable: true
    }
  }

  // Convert database shape to emoji
  const dbShapeToEmoji = (dbShape: any): Emoji | null => {
    try {
      // Only handle type='text' with emoji data
      if (dbShape.type !== 'text' || !dbShape.data?.emoji) {
        return null
      }
      
      return {
        id: dbShape.id,
        emoji: dbShape.data.emoji,
        x: dbShape.data.x ?? 0,
        y: dbShape.data.y ?? 0,
        size: dbShape.data.emojiSize ?? 48,
        layer: dbShape.data.layer ?? 1,
        rotation: dbShape.data.rotation ?? 0,
        user_id: dbShape.user_id,
        created_at: dbShape.created_at,
        updated_at: dbShape.updated_at
      }
    } catch (err) {
      console.error('Error converting dbShape to emoji:', err)
      return null
    }
  }

  // Add emoji
  const addEmoji = async (emojiData: Omit<Emoji, 'id' | 'created_at' | 'updated_at'>): Promise<Emoji | null> => {
    try {
      const emoji: Emoji = {
        id: generateId('emoji'),
        ...emojiData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Save to database
      const dbShape = await saveEmojiToDb(emoji)
      if (dbShape) {
        // Update the emoji with the database ID
        emoji.id = dbShape.id
        // Update local state
        emojis.value.push(emoji)
        
        // Record action for undo/redo (only if not from real-time sync or undo/redo)
        if (!isUpdatingFromRealtime.value && !isUndoRedoInProgress.value) {
          await recordAction('add', 'emoji', emoji.id, null, emoji)
        }
        
        // console.log('✅ Emoji added:', emoji)
        return emoji
      }
      return null
    } catch (err) {
      console.error('Error adding emoji:', err)
      return null
    }
  }

  // Update emoji
  const updateEmoji = async (id: string, updates: Partial<Emoji>): Promise<boolean> => {
    try {
      console.log('🔄 updateEmoji called with:', { id, updates })
      const emojiIndex = emojis.value.findIndex(e => e.id === id)
      if (emojiIndex === -1) {
        console.log('❌ Emoji not found for update:', id)
        return false
      }

      const currentEmoji = emojis.value[emojiIndex]
      if (!currentEmoji) {
        console.log('❌ Current emoji is null')
        return false
      }
      
      const updatedEmoji: Emoji = { 
        ...currentEmoji, 
        ...updates,
        emoji: updates.emoji ?? currentEmoji.emoji,
        x: updates.x ?? currentEmoji.x,
        y: updates.y ?? currentEmoji.y,
        size: updates.size ?? currentEmoji.size,
        layer: updates.layer ?? currentEmoji.layer,
        rotation: updates.rotation ?? currentEmoji.rotation,
        id: currentEmoji.id, // Ensure id is always defined
        updated_at: new Date().toISOString() 
      }
      
      console.log('🔄 Updated emoji object:', updatedEmoji)
      
      // Update in database
      const success = await updateEmojiInDb(id, updatedEmoji)
      if (success) {
        emojis.value[emojiIndex] = updatedEmoji
        
        // Record action for undo/redo (only if not from real-time sync or undo/redo)
        if (!isUpdatingFromRealtime.value && !isUndoRedoInProgress.value) {
          await recordAction('update', 'emoji', id, currentEmoji, updatedEmoji)
        }
        
        console.log('✅ Emoji updated in local state:', updatedEmoji)
        return true
      }
      console.log('❌ Failed to update emoji in database')
      return false
    } catch (err) {
      console.error('Error updating emoji:', err)
      return false
    }
  }

  // Delete emoji
  const deleteEmoji = async (id: string): Promise<boolean> => {
    try {
      // Get emoji before deletion for undo/redo
      const emojiToDelete = emojis.value.find(e => e.id === id)
      
      const success = await deleteEmojiFromDb(id)
      if (success) {
        emojis.value = emojis.value.filter(e => e.id !== id)
        if (selectedEmojiId.value === id) {
          selectedEmojiId.value = null
        }
        
        // Record action for undo/redo (only if not from real-time sync or undo/redo)
        if (!isUpdatingFromRealtime.value && !isUndoRedoInProgress.value && emojiToDelete) {
          await recordAction('delete', 'emoji', id, emojiToDelete, null)
        }
        
        console.log('✅ Emoji deleted:', id)
        return true
      }
      return false
    } catch (err) {
      console.error('Error deleting emoji:', err)
      return false
    }
  }

  // Delete multiple emojis at once (bulk delete)
  const deleteMultipleEmojis = async (ids: string[]): Promise<boolean> => {
    try {
      if (ids.length === 0) return true
      
      // Get emojis before deletion for undo/redo
      const emojisToDelete = emojis.value.filter(e => ids.includes(e.id))
      
      // Remove from local state immediately for instant UI feedback
      const originalEmojis = [...emojis.value]
      emojis.value = emojis.value.filter(e => !ids.includes(e.id))
      
      // Clear selection if any of the deleted emojis were selected
      if (selectedEmojiId.value && ids.includes(selectedEmojiId.value)) {
        selectedEmojiId.value = null
      }
      
      // Delete from database in parallel for better performance
      const deletePromises = ids.map(id => deleteEmojiFromDb(id))
      const results = await Promise.all(deletePromises)
      
      // Check if all deletions succeeded
      const allSuccessful = results.every((success: boolean) => success)
      
      if (allSuccessful) {
        // Record action for undo/redo (only if not from real-time sync or undo/redo)
        if (!isUpdatingFromRealtime.value && !isUndoRedoInProgress.value && emojisToDelete.length > 0) {
          await recordAction('delete-multiple', 'emoji', ids.join(','), emojisToDelete, null)
        }
        
        console.log('✅ Multiple emojis deleted:', ids.length)
        return true
      } else {
        // If database deletion failed, restore local state
        emojis.value = originalEmojis
        console.error('❌ Failed to delete some emojis from database')
        return false
      }
    } catch (err) {
      console.error('Error deleting multiple emojis:', err)
      return false
    }
  }

  // Clear all emojis
  const clearAllEmojis = async (): Promise<boolean> => {
    try {
      // Delete each emoji individually to trigger real-time sync
      const emojiIds = emojis.value.map(e => e.id)
      let successCount = 0
      
      for (const emojiId of emojiIds) {
        const success = await deleteEmojiFromDb(emojiId)
        if (success) {
          successCount++
        }
      }
      
      if (successCount === emojiIds.length) {
        emojis.value = []
        selectedEmojiId.value = null
        console.log('✅ All emojis cleared')
        return true
      }
      
      console.log(`⚠️ Cleared ${successCount}/${emojiIds.length} emojis`)
      return false
    } catch (err) {
      console.error('Error clearing all emojis:', err)
      return false
    }
  }

  // Get emoji by ID
  const getEmojiById = (id: string): Emoji | null => {
    return emojis.value.find(e => e.id === id) || null
  }

  // Load emojis from database
  const loadEmojis = async (): Promise<void> => {
    try {
      const shapes = await loadEmojisFromDb()
      console.log('📦 Raw shapes from DB:', shapes.length)
      
      const emojiShapes = shapes
        .map(dbShapeToEmoji)
        .filter((emoji): emoji is Emoji => emoji !== null)
      
      emojis.value = emojiShapes
    } catch (err) {
      console.error('Error loading emojis:', err)
    }
  }

  // Initialize emojis - call this from component onMounted instead
  const initializeEmojis = async () => {
    await loadEmojis()
    // Start real-time sync for emojis
    await startEmojiSync()
  }

  // State
  const state: EmojiState = {
    emojis,
    loading: dbLoading,
    saving: dbSaving,
    error: dbError,
    selectedEmojiId,
    totalEmojis
  }

  // Actions
  const actions: EmojiActions = {
    addEmoji,
    updateEmoji,
    deleteEmoji,
    deleteMultipleEmojis,
    clearAllEmojis,
    getEmojiById,
    loadEmojis
  }

  return {
    ...state,
    ...actions,
    isRealtimeConnected,
    lastSyncTime,
    realtimeError,
    initializeEmojis,
    stopEmojiSync
  }
}
