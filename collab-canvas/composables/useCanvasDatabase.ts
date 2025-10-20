import type { Ref } from 'vue'
import type { CanvasObject, CanvasObjectInsert, CanvasObjectUpdate } from '~/types/database'

export interface CanvasDatabaseState {
  loading: Ref<boolean>
  error: Ref<string | null>
  saving: Ref<boolean>
}

export interface CanvasDatabaseActions {
  saveEmoji: (emoji: any, canvasId?: string) => Promise<CanvasObject | null>
  updateEmoji: (emojiId: string, updates: any, canvasId?: string) => Promise<boolean>
  deleteEmoji: (emojiId: string, canvasId?: string) => Promise<boolean>
  loadEmojis: (canvasId?: string) => Promise<CanvasObject[]>
  loadEmojisForUser: () => Promise<CanvasObject[]>
  softDeleteEmoji: (emojiId: string, canvasId?: string) => Promise<boolean>
  deleteAllEmojis: (canvasId?: string) => Promise<boolean>
}

export const useCanvasDatabase = () => {
  const { $supabase } = useNuxtApp()
  const { user } = useAuth()
  
  // State
  const loading = ref(false)
  const error = ref<string | null>(null)
  const saving = ref(false)

  // Default canvas ID (for single canvas mode) - generate a proper UUID
  const defaultCanvasId = '550e8400-e29b-41d4-a716-446655440000' // Fixed UUID for main canvas

  // Helper function to get current user ID
  const getCurrentUserId = () => {
    // Use the actual authenticated user ID or null for anonymous
    return user.value?.id || null
  }

  // Helper function to get canvas ID
  const getCanvasId = (canvasId?: string) => {
    return canvasId || defaultCanvasId
  }

  // Helper function to convert emoji to database format
  const emojiToDbFormat = (emoji: any, canvasId: string, userId: string | null): CanvasObjectInsert => {
    return {
      canvas_id: canvasId,
      user_id: userId || null,
      type: 'text', // Emojis are stored as text type in database
      data: {
        x: emoji.x,
        y: emoji.y,
        text: emoji.emoji, // Store emoji character as 'text'
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
  }

  // Save emoji to database
  const saveEmoji = async (emoji: any, canvasId?: string): Promise<CanvasObject | null> => {
    try {
      saving.value = true
      error.value = null

      const canvas = getCanvasId(canvasId)
      const userId = getCurrentUserId()
      
      const dbEmoji = emojiToDbFormat(emoji, canvas, userId)
      
      console.log('💾 Saving emoji to database:', { emoji, dbEmoji, canvas, userId })
      
      const { data, error: dbError } = await $supabase
        .from('canvas_objects')
        .insert(dbEmoji)
        .select()
        .single()

      if (dbError) {
        console.error('Database save error:', dbError)
        throw new Error(`Failed to save emoji: ${dbError.message}`)
      }

      console.log('✅ Successfully saved emoji to database:', data)
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('Error saving emoji:', err)
      return null
    } finally {
      saving.value = false
    }
  }

  // Update emoji in database
  const updateEmoji = async (emojiId: string, updates: any, canvasId?: string): Promise<boolean> => {
    try {
      saving.value = true
      error.value = null

      const canvas = getCanvasId(canvasId)
      
      // First, let's check if the emoji exists in the database
      const { data: existingData, error: checkError } = await $supabase
        .from('canvas_objects')
        .select('id, type, data')
        .eq('id', emojiId)
        .eq('canvas_id', canvas)
      
      if (checkError) {
        console.error('Error checking existing emoji:', checkError)
        return false
      }
      
      if (!existingData || existingData.length === 0) {
        console.error('❌ Emoji not found in database for update:', { emojiId, canvas })
        return false
      }
      
      console.log('✅ Found existing emoji in database:', existingData[0])
      
      // Get existing data to merge with updates
      const existingEmoji = existingData[0]?.data

      // Merge updates with existing data to preserve all properties
      const emojiData = {
        x: updates.x ?? existingEmoji.x,
        y: updates.y ?? existingEmoji.y,
        text: updates.emoji ?? existingEmoji.emoji ?? existingEmoji.text,
        emoji: updates.emoji ?? existingEmoji.emoji ?? existingEmoji.text,
        fontSize: updates.size ?? existingEmoji.emojiSize ?? existingEmoji.fontSize,
        emojiSize: updates.size ?? existingEmoji.emojiSize ?? existingEmoji.fontSize,
        layer: updates.layer ?? existingEmoji.layer ?? 1,
        rotation: updates.rotation ?? existingEmoji.rotation ?? 0,
        fill: existingEmoji.fill ?? 'transparent',
        stroke: existingEmoji.stroke ?? 'transparent',
        draggable: existingEmoji.draggable ?? true
      }
      
      const dbUpdates: CanvasObjectUpdate = {
        data: emojiData,
        updated_at: new Date().toISOString() // Ensure real-time events are triggered
      }

      console.log('🔄 Updating emoji with data:', { emojiId, canvas, dbUpdates })

      const { data, error: dbError } = await $supabase
        .from('canvas_objects')
        .update(dbUpdates)
        .eq('id', emojiId)
        .eq('canvas_id', canvas)
        .select()

      if (dbError) {
        console.error('Database update error:', dbError)
        throw new Error(`Failed to update emoji: ${dbError.message}`)
      }

      if (!data || data.length === 0) {
        console.error('No rows were updated! This means the UPDATE operation failed silently.')
        return false
      }

      console.log('✅ Successfully updated emoji in database:', data[0])
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('Error updating emoji:', err)
      return false
    } finally {
      saving.value = false
    }
  }

  // Delete emoji from database (soft delete using UPDATE instead of DELETE)
  const deleteEmoji = async (emojiId: string, canvasId?: string): Promise<boolean> => {
    try {
      loading.value = true
      error.value = null

      const canvas = getCanvasId(canvasId)
      
      console.log('🗑️ Soft deleting emoji from database:', { emojiId, canvas, canvasId })
      
      // Use UPDATE with deleted_at instead of DELETE for better real-time sync
      const { data, error: dbError } = await $supabase
        .from('canvas_objects')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', emojiId)
        .eq('canvas_id', canvas)
        .is('deleted_at', null) // Only delete if not already deleted
        .select()

      if (dbError) {
        console.error('Database delete error:', dbError)
        throw new Error(`Failed to delete emoji: ${dbError.message}`)
      }

      if (!data || data.length === 0) {
        console.warn('⚠️ No emoji was deleted (might already be deleted)')
        return true // Still return true as it's effectively deleted
      }

      console.log('✅ Successfully soft deleted emoji from database:', data)
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('Error deleting emoji:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  // Load emojis from database
  const loadEmojis = async (canvasId?: string): Promise<CanvasObject[]> => {
    try {
      loading.value = true
      error.value = null

      const canvas = getCanvasId(canvasId)
      
      const { data, error: dbError } = await $supabase
        .from('canvas_objects')
        .select('*')
        .eq('canvas_id', canvas)
        .eq('type', 'text') // Only load emojis (stored as text type)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })

      if (dbError) {
        console.error('Database load error:', dbError)
        throw new Error(`Failed to load emojis: ${dbError.message}`)
      }

      return data || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('Error loading emojis:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  // Load emojis for current user
  const loadEmojisForUser = async (): Promise<CanvasObject[]> => {
    try {
      loading.value = true
      error.value = null

      const userId = getCurrentUserId()
      if (!userId) {
        return []
      }

      const { data, error: dbError } = await $supabase
        .from('canvas_objects')
        .select('*')
        .eq('user_id', userId)
        .eq('type', 'text') // Only load emojis (stored as text type)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })

      if (dbError) {
        console.error('Database load error:', dbError)
        throw new Error(`Failed to load user emojis: ${dbError.message}`)
      }

      return data || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('Error loading user emojis:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  // Soft delete emoji (mark as deleted)
  const softDeleteEmoji = async (emojiId: string, canvasId?: string): Promise<boolean> => {
    try {
      saving.value = true
      error.value = null

      const canvas = getCanvasId(canvasId)
      
      const { error: dbError } = await $supabase
        .from('canvas_objects')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', emojiId)
        .eq('canvas_id', canvas)

      if (dbError) {
        console.error('Database soft delete error:', dbError)
        throw new Error(`Failed to soft delete emoji: ${dbError.message}`)
      }

      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('Error soft deleting emoji:', err)
      return false
    } finally {
      saving.value = false
    }
  }

  // Delete all emojis for canvas
  const deleteAllEmojis = async (canvasId?: string): Promise<boolean> => {
    try {
      loading.value = true
      error.value = null

      const canvas = getCanvasId(canvasId)
      
      const { error: dbError } = await $supabase
        .from('canvas_objects')
        .delete()
        .eq('canvas_id', canvas)
        .eq('type', 'text') // Only delete emojis

      if (dbError) {
        console.error('Database delete all error:', dbError)
        throw new Error(`Failed to delete all emojis: ${dbError.message}`)
      }

      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('Error deleting all emojis:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    loading: readonly(loading),
    error: readonly(error),
    saving: readonly(saving),
    
    // Actions
    saveEmoji,
    updateEmoji,
    deleteEmoji,
    loadEmojis,
    loadEmojisForUser,
    softDeleteEmoji,
    deleteAllEmojis
  }
}
