import type { Ref } from 'vue'
import type { Emoji } from './useEmojis'

export interface EmojiRealtimeSyncState {
  isConnected: Ref<boolean>
  lastSyncTime: Ref<Date | null>
  error: Ref<string | null>
}

export interface EmojiRealtimeSyncActions {
  startSync: () => Promise<void>
  stopSync: () => void
  handleEmojiInsert: (payload: any) => void
  handleEmojiUpdate: (payload: any) => void
  handleEmojiDelete: (payload: any) => void
}

export const useEmojiRealtimeSync = (
  emojis: Ref<Emoji[]>,
  isUpdatingFromRealtime: Ref<boolean>
) => {
  const { $supabase } = useNuxtApp()
  const { user } = useAuth()
  
  // State
  const isConnected = ref(false)
  const lastSyncTime = ref<Date | null>(null)
  const error = ref<string | null>(null)
  
  // Get canvas ID (same logic as in useCanvasDatabase)
  const getCanvasId = (): string => {
    return '550e8400-e29b-41d4-a716-446655440000'
  }
  
  // Convert database shape to emoji (reuse logic from useEmojis)
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
  
  // Handle emoji insert
  const handleEmojiInsert = (payload: any) => {
    // Skip own changes
    if (user.value?.id && payload.new.user_id === user.value.id) return
    
    const emoji = dbShapeToEmoji(payload.new)
    if (emoji && !emojis.value.find(e => e.id === emoji.id)) {
      isUpdatingFromRealtime.value = true
      emojis.value = [...emojis.value, emoji]
      nextTick(() => { isUpdatingFromRealtime.value = false })
    }
  }
  
  // Handle emoji update
  const handleEmojiUpdate = (payload: any) => {
    const emoji = dbShapeToEmoji(payload.new)
    if (emoji) {
      const index = emojis.value.findIndex(e => e.id === emoji.id)
      if (index !== -1) {
        isUpdatingFromRealtime.value = true
        emojis.value[index] = emoji
        nextTick(() => { isUpdatingFromRealtime.value = false })
      }
    }
  }
  
  // Handle emoji delete
  const handleEmojiDelete = (payload: any) => {
    console.log('🗑️ Real-time delete received:', { 
      emojiId: payload.old.id, 
      userId: payload.old.user_id, 
      currentUserId: user.value?.id,
      shouldSkip: user.value?.id && payload.old.user_id === user.value.id
    })
    
    if (user.value?.id && payload.old.user_id === user.value.id) {
      console.log('🚫 Skipping own delete (echo prevention)')
      return
    }
    
    console.log('✅ Processing real-time delete for emoji:', payload.old.id)
    isUpdatingFromRealtime.value = true
    emojis.value = emojis.value.filter(e => e.id !== payload.old.id)
    nextTick(() => { isUpdatingFromRealtime.value = false })
  }
  
  // Start real-time sync
  const startSync = async (): Promise<void> => {
    try {
      const canvasId = getCanvasId()
      
      const channel = $supabase
        .channel(`canvas-emoji-changes-${canvasId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'canvas_objects',
            filter: `canvas_id=eq.${canvasId}`
          },
          (payload) => {
            if (payload.new.type === 'text') handleEmojiInsert(payload)
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'canvas_objects',
            filter: `canvas_id=eq.${canvasId}`
          },
          (payload) => {
            if (payload.new.type === 'text') handleEmojiUpdate(payload)
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'canvas_objects',
            filter: `canvas_id=eq.${canvasId}`
          },
          (payload) => {
            if (payload.old.type === 'text') handleEmojiDelete(payload)
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            isConnected.value = true
            lastSyncTime.value = new Date()
            error.value = null
          } else if (status === 'CHANNEL_ERROR') {
            isConnected.value = false
            error.value = 'Failed to connect to real-time sync'
          }
        })
      
      // Store channel reference for cleanup
      ;(window as any).emojiSyncChannel = channel
      
    } catch (err) {
      console.error('Error starting emoji real-time sync:', err)
      error.value = err instanceof Error ? err.message : 'Unknown error occurred'
    }
  }
  
  // Stop real-time sync
  const stopSync = (): void => {
    try {
      const channel = (window as any).emojiSyncChannel
      if (channel) {
        $supabase.removeChannel(channel)
        ;(window as any).emojiSyncChannel = null
      }
      isConnected.value = false
      error.value = null
    } catch (err) {
      console.error('Error stopping emoji real-time sync:', err)
    }
  }
  
  // State
  const state: EmojiRealtimeSyncState = {
    isConnected: readonly(isConnected),
    lastSyncTime: readonly(lastSyncTime),
    error: readonly(error)
  }
  
  // Actions
  const actions: EmojiRealtimeSyncActions = {
    startSync,
    stopSync,
    handleEmojiInsert,
    handleEmojiUpdate,
    handleEmojiDelete
  }
  
  return {
    ...state,
    ...actions
  }
}
