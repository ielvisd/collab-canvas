import type { Ref } from 'vue'
import { nextTick } from 'vue'
import { generateId } from '~/utils/shapeUtils'
import type { ActionHistory, ActionHistoryInsert, ActionType, ObjectType } from '~/types/database'

export interface UndoRedoState {
  canUndo: Ref<boolean>
  canRedo: Ref<boolean>
  undoStack: Ref<ActionHistory[]>
  redoStack: Ref<ActionHistory[]>
  loading: Ref<boolean>
  error: Ref<string | null>
  isUndoRedoInProgress: Ref<boolean>
}

export interface UndoRedoActions {
  recordAction: (actionType: ActionType, objectType: ObjectType, objectId: string, beforeState: any, afterState: any) => Promise<void>
  undo: () => Promise<boolean>
  redo: () => Promise<boolean>
  clearHistory: () => Promise<void>
  loadHistory: () => Promise<void>
}

export const useUndoRedo = (canvasId: string = '550e8400-e29b-41d4-a716-446655440000') => {
  const { $supabase } = useNuxtApp()
  const { user } = useAuth()
  
  // Use useState for shared state across all instances
  const undoStack = useState<ActionHistory[]>('undo-stack', () => [])
  const redoStack = useState<ActionHistory[]>('redo-stack', () => [])
  const loading = useState<boolean>('undo-loading', () => false)
  const error = useState<string | null>('undo-error', () => null)
  const isUndoRedoInProgress = useState<boolean>('undo-in-progress', () => false)
  
  // Computed
  const canUndo = computed(() => undoStack.value.length > 0)
  const canRedo = computed(() => redoStack.value.length > 0)
  
  // Constants
  const MAX_STACK_SIZE = 50 // Limit in-memory stack size for performance
  
  // Helper function to get current user ID
  const getCurrentUserId = () => {
    return user.value?.id || null
  }
  
  // Record an action to both database and local stack
  const recordAction = async (
    actionType: ActionType, 
    objectType: ObjectType, 
    objectId: string, 
    beforeState: any, 
    afterState: any
  ): Promise<void> => {
    try {
      // Skip recording if undo/redo is in progress to prevent infinite loops
      if (isUndoRedoInProgress.value) {
        console.log('⏭️ Skipping action recording - undo/redo in progress')
        return
      }
      
      const userId = getCurrentUserId()
      if (!userId) {
        console.warn('Cannot record action: user not authenticated')
        return
      }
      
      // Create local action data for undo stack
      const localActionData = {
        id: generateId('action'),
        user_id: userId,
        canvas_id: canvasId,
        action_type: actionType,
        object_type: objectType,
        object_id: objectId,
        before_state: beforeState,
        after_state: afterState,
        timestamp: new Date().toISOString(),
        undone_at: null
      }
      
      // Try to save to database (optional - don't fail if it doesn't work)
      try {
        const actionData: ActionHistoryInsert = {
          user_id: userId,
          canvas_id: canvasId,
          action_type: actionType,
          object_type: objectType,
          object_id: objectId,
          before_state: beforeState,
          after_state: afterState,
          timestamp: new Date().toISOString()
        }
        
        const { data, error: dbError } = await $supabase
          .from('action_history')
          .insert(actionData)
          .select()
          .single()
        
        if (dbError) {
          console.warn('Could not save action to database (continuing with local only):', dbError.message)
        }
      } catch (dbErr) {
        console.warn('Database save failed (continuing with local only):', dbErr)
      }
      
      // Add to local undo stack regardless of database success
      const newUndoStack = [localActionData, ...undoStack.value]
      
      // Limit stack size
      if (newUndoStack.length > MAX_STACK_SIZE) {
        undoStack.value = newUndoStack.slice(0, MAX_STACK_SIZE)
      } else {
        undoStack.value = newUndoStack
      }
      
      // Clear redo stack when new action is recorded
      redoStack.value = []
      
      console.log(`📝 Recorded ${actionType} action for ${objectType}:`, objectId)
    } catch (err) {
      console.error('Error recording action:', err)
      error.value = err instanceof Error ? err.message : 'Unknown error occurred'
    }
  }
  
  // Undo the last action
  const undo = async (): Promise<boolean> => {
    if (!canUndo.value) return false
    
    try {
      loading.value = true
      isUndoRedoInProgress.value = true
      
      const action = undoStack.value.shift()
      
      if (!action) {
        console.warn('No action to undo')
        return false
      }
      
      console.log('🔄 Undoing action:', action)
      
      // Move action from undo stack to redo stack
      redoStack.value.unshift(action)
      
      // Mark action as undone in database
      await $supabase
        .from('action_history')
        .update({ undone_at: new Date().toISOString() })
        .eq('id', action.id)
      
      // Apply the undo based on action type
      const success = await applyUndoAction(action)
      
      if (!success) {
        // If undo failed, check if it's because object doesn't exist
        if (action.action_type === 'update' || action.action_type === 'delete') {
          console.log('⚠️ Undo failed - object may not exist in current session, skipping action')
          // Don't move action back to undo stack, just skip it
          redoStack.value.shift()
          return true // Return true to continue with next action
        } else {
          // For add actions, move back to undo stack
          undoStack.value.unshift(action)
          redoStack.value.shift()
          return false
        }
      }
      
      console.log('✅ Action undone successfully')
      return true
    } catch (err) {
      console.error('Error undoing action:', err)
      error.value = err instanceof Error ? err.message : 'Unknown error occurred'
      return false
    } finally {
      loading.value = false
      isUndoRedoInProgress.value = false
    }
  }
  
  // Redo the last undone action
  const redo = async (): Promise<boolean> => {
    if (!canRedo.value) return false
    
    try {
      loading.value = true
      isUndoRedoInProgress.value = true
      
      const action = redoStack.value.shift()
      
      if (!action) {
        console.warn('No action to redo')
        return false
      }
      
      console.log('🔄 Redoing action:', action)
      
      // Move action from redo stack to undo stack
      undoStack.value.unshift(action)
      
      // Clear undone_at in database
      await $supabase
        .from('action_history')
        .update({ undone_at: null })
        .eq('id', action.id)
      
      // Apply the redo based on action type
      const success = await applyRedoAction(action)
      
      if (!success) {
        // If redo failed, move action back to redo stack
        redoStack.value.unshift(action)
        undoStack.value.shift()
        return false
      }
      
      console.log('✅ Action redone successfully')
      return true
    } catch (err) {
      console.error('Error redoing action:', err)
      error.value = err instanceof Error ? err.message : 'Unknown error occurred'
      return false
    } finally {
      loading.value = false
      isUndoRedoInProgress.value = false
    }
  }
  
  // Apply undo action by reverting to before state
  const applyUndoAction = async (action: ActionHistory): Promise<boolean> => {
    try {
      console.log('🔄 Applying undo action:', {
        type: action.action_type,
        objectType: action.object_type,
        objectId: action.object_id,
        beforeState: action.before_state,
        afterState: action.after_state
      })
      
      switch (action.action_type) {
        case 'add':
          // For add actions, we need to delete the object
          console.log('🗑️ Undoing add action - deleting object')
          return await deleteObject(action.object_type, action.object_id)
          
        case 'update':
          // For update actions, we need to restore the before state
          console.log('🔄 Undoing update action - restoring before state')
          if (!action.before_state) {
            console.warn('No before state available for update action')
            return false
          }
          return await restoreObjectState(action.object_type, action.object_id, action.before_state)
          
        case 'delete':
          // For delete actions, we need to recreate the object
          console.log('➕ Undoing delete action - recreating object')
          if (!action.after_state) {
            console.warn('No after state available for delete action')
            return false
          }
          return await recreateObject(action.object_type, action.object_id, action.after_state)
          
        default:
          console.warn('Unknown action type for undo:', action.action_type)
          return false
      }
    } catch (err) {
      console.error('Error applying undo action:', err)
      return false
    }
  }
  
  // Apply redo action by applying the after state
  const applyRedoAction = async (action: ActionHistory): Promise<boolean> => {
    try {
      switch (action.action_type) {
        case 'add':
          // For add actions, we need to recreate the object
          return await recreateObject(action.object_type, action.object_id, action.after_state)
          
        case 'update':
          // For update actions, we need to apply the after state
          return await restoreObjectState(action.object_type, action.object_id, action.after_state)
          
        case 'delete':
          // For delete actions, we need to delete the object
          return await deleteObject(action.object_type, action.object_id)
          
        default:
          console.warn('Unknown action type for redo:', action.action_type)
          return false
      }
    } catch (err) {
      console.error('Error applying redo action:', err)
      return false
    }
  }
  
  // Helper functions to interact with existing composables
  const deleteObject = async (objectType: ObjectType, objectId: string): Promise<boolean> => {
    try {
      console.log('🗑️ Deleting object for undo:', { objectType, objectId })
      
      if (objectType === 'emoji') {
        // Use emoji composable
        const { deleteEmoji } = useEmojis()
        return await deleteEmoji(objectId)
      } else {
        console.warn('⚠️ Only emoji objects are supported')
        return false
      }
    } catch (err) {
      console.error('Error deleting object:', err)
      return false
    }
  }
  
  const restoreObjectState = async (objectType: ObjectType, objectId: string, state: any): Promise<boolean> => {
    try {
      console.log('🔄 Restoring object state for undo:', { objectType, objectId, state })
      
      if (objectType === 'emoji') {
        // Use emoji composable
        const { updateEmoji, getEmojiById } = useEmojis()
        
        // Check if emoji exists before trying to update
        const existingEmoji = getEmojiById(objectId)
        if (!existingEmoji) {
          console.warn('⚠️ Emoji not found for state restoration - may have been deleted by another user:', objectId)
          return false
        }
        
        return await updateEmoji(objectId, state)
      } else {
        console.warn('⚠️ Only emoji objects are supported')
        return false
      }
    } catch (err) {
      console.error('Error restoring object state:', err)
      return false
    }
  }
  
  const recreateObject = async (objectType: ObjectType, objectId: string, state: any): Promise<boolean> => {
    try {
      console.log('➕ Recreating object for redo:', { objectType, objectId, state })
      
      if (objectType === 'emoji') {
        // Use emoji composable
        const { addEmoji } = useEmojis()
        const result = await addEmoji(state)
        return result !== null
      } else {
        console.warn('⚠️ Only emoji objects are supported')
        return false
      }
    } catch (err) {
      console.error('Error recreating object:', err)
      return false
    }
  }
  
  // Load action history from database
  const loadHistory = async (): Promise<void> => {
    try {
      loading.value = true
      error.value = null
      
      const userId = getCurrentUserId()
      if (!userId) {
        console.warn('Cannot load history: user not authenticated')
        return
      }
      
      // For now, start with empty history to avoid conflicts with old sessions
      // In a production app, you might want to implement session-based tracking
      undoStack.value = []
      redoStack.value = []
    } catch (err) {
      console.error('Error loading action history:', err)
      error.value = err instanceof Error ? err.message : 'Unknown error occurred'
    } finally {
      loading.value = false
    }
  }
  
  // Clear all history
  const clearHistory = async (): Promise<void> => {
    try {
      const userId = getCurrentUserId()
      if (!userId) return
      
      await $supabase
        .from('action_history')
        .delete()
        .eq('user_id', userId)
        .eq('canvas_id', canvasId)
      
      undoStack.value = []
      redoStack.value = []
      
      console.log('🗑️ Action history cleared')
    } catch (err) {
      console.error('Error clearing action history:', err)
    }
  }
  
  
  // State
  const state: UndoRedoState = {
    canUndo,
    canRedo,
    undoStack,
    redoStack,
    loading,
    error,
    isUndoRedoInProgress
  }
  
  // Actions
  const actions: UndoRedoActions = {
    recordAction,
    undo,
    redo,
    clearHistory,
    loadHistory
  }
  
  return {
    ...state,
    ...actions
  }
}
