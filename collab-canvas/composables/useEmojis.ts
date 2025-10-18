import type { Ref } from 'vue'

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

export const useEmojis = (canvasWidth: number = 800, canvasHeight: number = 600) => {
  // Database composable
  const {
    loading: dbLoading,
    saving: dbSaving,
    error: dbError,
    saveShape: saveShapeToDb,
    updateShape: updateShapeInDb,
    deleteShape: deleteShapeFromDb,
    loadShapes: loadShapesFromDb,
    deleteAllShapes,
    clearError: clearDbError
  } = useCanvasDatabase()

  // Real-time sync - we'll handle this differently for emojis
  const isRealtimeConnected = ref(false)
  const lastSyncTime = ref<Date | null>(null)

  // State - Use useState for shared state across components
  const emojis = useState<Emoji[]>('canvas-emojis', () => [])
  const selectedEmojiId = useState<string | null>('canvas-selected-emoji', () => null)
  const autoSave = ref(true)
  
  // Flag to prevent update loops during real-time sync
  const isUpdatingFromRealtime = ref(false)

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
  
  const getRandomPosition = (maxX: number, maxY: number) => ({
    x: Math.random() * (maxX - 50),
    y: Math.random() * (maxY - 50)
  })

  // Convert emoji to database format
  const emojiToDbFormat = (emoji: Emoji) => {
    return {
      type: 'text' as const,
      data: {
        x: emoji.x,
        y: emoji.y,
        text: emoji.emoji,
        fontSize: emoji.size,
        fill: 'black',
        stroke: 'transparent',
        rotation: emoji.rotation || 0,
        emoji: emoji.emoji,
        emojiSize: emoji.size,
        layer: emoji.layer || 1
      }
    }
  }

  // Convert database shape to emoji
  const dbShapeToEmoji = (dbShape: any): Emoji | null => {
    try {
      if (dbShape.type === 'text' && dbShape.data.emoji) {
        return {
          id: dbShape.id,
          emoji: dbShape.data.emoji,
          x: dbShape.data.x ?? 0,
          y: dbShape.data.y ?? 0,
          size: dbShape.data.emojiSize ?? 32,
          layer: dbShape.data.layer ?? 1,
          rotation: dbShape.data.rotation ?? 0,
          user_id: dbShape.user_id,
          created_at: dbShape.created_at,
          updated_at: dbShape.updated_at
        }
      }
      return null
    } catch (err) {
      console.error('Error converting database shape to emoji:', err)
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
      const dbShape = await saveShapeToDb(emojiToDbFormat(emoji))
      if (dbShape) {
        // Update local state
        emojis.value.push(emoji)
        console.log('✅ Emoji added:', emoji)
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
      const emojiIndex = emojis.value.findIndex(e => e.id === id)
      if (emojiIndex === -1) return false

      const currentEmoji = emojis.value[emojiIndex]
      if (!currentEmoji) return false
      
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
      
      // Update in database
      const success = await updateShapeInDb(id, emojiToDbFormat(updatedEmoji))
      if (success) {
        emojis.value[emojiIndex] = updatedEmoji
        console.log('✅ Emoji updated:', updatedEmoji)
        return true
      }
      return false
    } catch (err) {
      console.error('Error updating emoji:', err)
      return false
    }
  }

  // Delete emoji
  const deleteEmoji = async (id: string): Promise<boolean> => {
    try {
      const success = await deleteShapeFromDb(id)
      if (success) {
        emojis.value = emojis.value.filter(e => e.id !== id)
        if (selectedEmojiId.value === id) {
          selectedEmojiId.value = null
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

  // Clear all emojis
  const clearAllEmojis = async (): Promise<boolean> => {
    try {
      const success = await deleteAllShapes()
      if (success) {
        emojis.value = []
        selectedEmojiId.value = null
        console.log('✅ All emojis cleared')
        return true
      }
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
      const shapes = await loadShapesFromDb()
      console.log('📦 Raw shapes from DB:', shapes.length)
      
      const emojiShapes = shapes
        .map(dbShapeToEmoji)
        .filter((emoji): emoji is Emoji => emoji !== null)
      
      emojis.value = emojiShapes
      console.log('✅ Loaded emojis:', emojiShapes.length)
      
      // If no emojis found, add some test emojis
      if (emojiShapes.length === 0) {
        console.log('🎨 No emojis found, adding test emojis')
        await addEmoji({
          emoji: '🎨',
          x: 100,
          y: 100,
          size: 48,
          layer: 1,
          rotation: 0
        })
        await addEmoji({
          emoji: '✨',
          x: 200,
          y: 150,
          size: 32,
          layer: 2,
          rotation: 0
        })
      }
    } catch (err) {
      console.error('Error loading emojis:', err)
    }
  }

  // Initialize on mount
  onMounted(async () => {
    await loadEmojis()
    isRealtimeConnected.value = true
  })

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
    clearAllEmojis,
    getEmojiById,
    loadEmojis
  }

  return {
    ...state,
    ...actions,
    isRealtimeConnected,
    lastSyncTime
  }
}
