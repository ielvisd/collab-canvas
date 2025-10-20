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
    // Skip own changes - but only if we already have this emoji locally
    if (user.value?.id && payload.new.user_id === user.value.id) {
      // Check if we already have this emoji locally (from optimistic update)
      const existingEmoji = emojis.value.find(e => e.id === payload.new.id)
      if (existingEmoji) {
        // Update the local emoji with the database ID if it changed
        const emoji = dbShapeToEmoji(payload.new)
        if (emoji) {
          const index = emojis.value.findIndex(e => e.id === emoji.id)
          if (index !== -1) {
            emojis.value[index] = emoji
          }
        }
        return
      }
    }
    
    const emoji = dbShapeToEmoji(payload.new)
    if (emoji && !emojis.value.find(e => e.id === emoji.id)) {
      isUpdatingFromRealtime.value = true
      emojis.value = [...emojis.value, emoji]
      nextTick(() => { isUpdatingFromRealtime.value = false })
    }
  }
  
  // Handle emoji update
  const handleEmojiUpdate = (payload: any) => {
    // Check if this is a soft delete (deleted_at is set)
    if (payload.new.deleted_at) {
      console.log('🗑️ Soft delete detected via UPDATE event:', { 
        emojiId: payload.new.id, 
        userId: payload.new.user_id,
        deleted_at: payload.new.deleted_at
      })
      
      // Skip own changes - but only if we already removed this emoji locally (from optimistic update)
      if (user.value?.id && payload.new.user_id === user.value.id) {
        const existingEmoji = emojis.value.find(e => e.id === payload.new.id)
        if (!existingEmoji) {
          console.log('✅ Emoji already removed by optimistic update:', payload.new.id)
          return
        }
      }
      
      // Process delete for other users or if we somehow still have the emoji locally
      console.log('✅ Processing soft delete for emoji:', payload.new.id)
      isUpdatingFromRealtime.value = true
      emojis.value = emojis.value.filter(e => e.id !== payload.new.id)
      nextTick(() => { isUpdatingFromRealtime.value = false })
      return
    }
    
    // Regular update handling
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
      payloadOld: payload.old
    })
    
    // Skip own changes - but only if we already removed this emoji locally (from optimistic update)
    if (user.value?.id && payload.old.user_id === user.value.id) {
      // Check if we already have this emoji locally (if not, it was already removed by optimistic update)
      const existingEmoji = emojis.value.find(e => e.id === payload.old.id)
      if (!existingEmoji) {
        // Emoji was already removed by optimistic update, nothing to do
        console.log('✅ Emoji already removed by optimistic update:', payload.old.id)
        return
      }
    }
    
    // Process delete for other users or if we somehow still have the emoji locally
    console.log('✅ Processing real-time delete for emoji:', payload.old.id)
    isUpdatingFromRealtime.value = true
    emojis.value = emojis.value.filter(e => e.id !== payload.old.id)
    nextTick(() => { isUpdatingFromRealtime.value = false })
  }
  
  // Start real-time sync
  const startSync = async (): Promise<void> => {
    try {
      const canvasId = getCanvasId()
      console.log('🚀 Starting emoji real-time sync for canvas:', canvasId)
      console.log('🔍 Real-time filter will be:', `canvas_id=eq.${canvasId}`)
      
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
            console.log('🔍 INSERT event received:', { 
              type: payload.new?.type, 
              id: payload.new?.id,
              isText: payload.new?.type === 'text'
            })
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
            console.log('🔍 UPDATE event received:', { 
              type: payload.new?.type, 
              id: payload.new?.id,
              isText: payload.new?.type === 'text'
            })
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
            console.log('🔍 DELETE event received:', { 
              type: payload.old?.type, 
              id: payload.old?.id,
              isText: payload.old?.type === 'text',
              fullPayload: payload
            })
            if (payload.old && payload.old.type === 'text') {
              handleEmojiDelete(payload)
            } else {
              console.log('⚠️ DELETE event filtered out - not a text type:', payload.old?.type)
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'canvas_objects',
            filter: `canvas_id=eq.${canvasId}`
          },
          (payload) => {
            console.log('🔍 ANY event received:', { 
              event: payload.eventType,
              type: (payload.new as any)?.type || (payload.old as any)?.type,
              id: (payload.new as any)?.id || (payload.old as any)?.id
            })
          }
        )
        .subscribe((status) => {
          console.log('🔄 Real-time subscription status:', status)
          if (status === 'SUBSCRIBED') {
            isConnected.value = true
            lastSyncTime.value = new Date()
            error.value = null
            console.log('✅ Emoji real-time sync connected successfully')
          } else if (status === 'CHANNEL_ERROR') {
            isConnected.value = false
            error.value = 'Failed to connect to real-time sync'
            console.error('❌ Emoji real-time sync connection failed')
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
