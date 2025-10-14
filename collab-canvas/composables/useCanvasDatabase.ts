import type { Ref } from 'vue'
import type { CanvasObject, CanvasObjectInsert, CanvasObjectUpdate } from '~/types/database'

export interface CanvasDatabaseState {
  loading: Ref<boolean>
  error: Ref<string | null>
  saving: Ref<boolean>
}

export interface CanvasDatabaseActions {
  saveShape: (shape: any, canvasId?: string) => Promise<CanvasObject | null>
  updateShape: (shapeId: string, updates: any, canvasId?: string) => Promise<boolean>
  deleteShape: (shapeId: string, canvasId?: string) => Promise<boolean>
  loadShapes: (canvasId?: string) => Promise<CanvasObject[]>
  loadShapesForUser: () => Promise<CanvasObject[]>
  softDeleteShape: (shapeId: string, canvasId?: string) => Promise<boolean>
  deleteAllShapes: (canvasId?: string) => Promise<boolean>
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
    // Temporarily disable auth check for testing
    // if (!user.value) {
    //   throw new Error('User not authenticated')
    // }
    return user.value?.id || 'anonymous-user'
  }

  // Helper function to get canvas ID
  const getCanvasId = (canvasId?: string) => {
    return canvasId || defaultCanvasId
  }

  // Helper function to convert shape to database format
  const shapeToDbFormat = (shape: any, canvasId: string, userId: string): CanvasObjectInsert => {
    // Convert local shape type to database type
    let dbType: 'rect' | 'circle' | 'text'
    if (shape.type === 'rectangle') {
      dbType = 'rect'
    } else if (shape.type === 'circle') {
      dbType = 'circle'
    } else if (shape.type === 'text') {
      dbType = 'text'
    } else {
      console.warn('Unknown shape type for database conversion:', shape.type)
      dbType = 'rect' // fallback
    }

    return {
      canvas_id: canvasId,
      user_id: userId,
      type: dbType,
      data: {
        x: shape.x,
        y: shape.y,
        fill: shape.fill,
        stroke: shape.stroke || '#000',
        strokeWidth: shape.strokeWidth || 2,
        draggable: shape.draggable ?? true,
        rotation: shape.rotation || 0,
        // Shape-specific properties
        ...(shape.type === 'rectangle' && {
          width: shape.width,
          height: shape.height
        }),
        ...(shape.type === 'circle' && {
          radius: shape.radius
        }),
        ...(shape.type === 'text' && {
          text: shape.text,
          fontSize: shape.fontSize
        })
      }
    }
  }


  // Save a shape to the database
  const saveShape = async (shape: any, canvasId?: string): Promise<CanvasObject | null> => {
    try {
      saving.value = true
      error.value = null

      const userId = getCurrentUserId()
      const canvas = getCanvasId(canvasId)
      
      const dbShape = shapeToDbFormat(shape, canvas, userId)
      console.log('Saving shape to database:', { originalShape: shape, dbShape })
      console.log('User ID being used:', userId)
      console.log('Canvas ID being used:', canvas)
      
      const { data, error: dbError } = await $supabase
        .from('canvas_objects')
        .insert(dbShape)
        .select()
        .single()

      if (dbError) {
        console.error('Database error:', dbError)
        console.error('Database error details:', dbError.details)
        console.error('Database error hint:', dbError.hint)
        throw new Error(`Failed to save shape: ${dbError.message}`)
      }

      console.log('Shape saved successfully:', data)
      console.log('Shape ID in response:', data?.id)
      console.log('Shape position in response:', { x: data?.data?.x, y: data?.data?.y })
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('Error saving shape:', err)
      return null
    } finally {
      saving.value = false
    }
  }

  // Update a shape in the database
  const updateShape = async (shapeId: string, updates: any, canvasId?: string): Promise<boolean> => {
    try {
      saving.value = true
      error.value = null

      const canvas = getCanvasId(canvasId)
      
      console.log('Updating shape in database:', { shapeId, updates, canvas })
      console.log('Complete shape data being saved:', JSON.stringify(updates, null, 2))

      // Since we're now passing the complete shape data, we don't need to merge
      // Just save the complete data directly
      const dbUpdates: CanvasObjectUpdate = {
        data: updates
      }

      const { error: dbError } = await $supabase
        .from('canvas_objects')
        .update(dbUpdates)
        .eq('id', shapeId)
        .eq('canvas_id', canvas)

      if (dbError) {
        console.error('Database update error:', dbError)
        throw new Error(`Failed to update shape: ${dbError.message}`)
      }

      console.log('Shape updated successfully in database')
      console.log('Final saved data:', JSON.stringify(updates, null, 2))
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('Error updating shape:', err)
      return false
    } finally {
      saving.value = false
    }
  }

  // Delete a shape from the database (hard delete)
  const deleteShape = async (shapeId: string, canvasId?: string): Promise<boolean> => {
    try {
      loading.value = true
      error.value = null

      const canvas = getCanvasId(canvasId)
      
      console.log('Deleting shape from database:', { shapeId, canvas })
      
      const { error: dbError } = await $supabase
        .from('canvas_objects')
        .delete()
        .eq('id', shapeId)
        .eq('canvas_id', canvas)

      if (dbError) {
        console.error('Database delete error:', dbError)
        throw new Error(`Failed to delete shape: ${dbError.message}`)
      }

      console.log('Shape deleted successfully from database:', shapeId)
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('Error deleting shape:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  // Soft delete a shape (mark as deleted)
  const softDeleteShape = async (shapeId: string, canvasId?: string): Promise<boolean> => {
    try {
      loading.value = true
      error.value = null

      const canvas = getCanvasId(canvasId)
      
      const { error: dbError } = await $supabase
        .from('canvas_objects')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', shapeId)
        .eq('canvas_id', canvas)

      if (dbError) {
        throw new Error(`Failed to soft delete shape: ${dbError.message}`)
      }

      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('Error soft deleting shape:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  // Delete all shapes for a canvas (bulk delete)
  const deleteAllShapes = async (canvasId?: string): Promise<boolean> => {
    try {
      loading.value = true
      error.value = null

      const canvas = getCanvasId(canvasId)
      
      console.log('Deleting all shapes for canvas:', canvas)
      
      const { error: dbError } = await $supabase
        .from('canvas_objects')
        .delete()
        .eq('canvas_id', canvas)

      if (dbError) {
        throw new Error(`Failed to delete all shapes: ${dbError.message}`)
      }

      console.log('All shapes deleted successfully from database')
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('Error deleting all shapes:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  // Load all shapes for a canvas
  const loadShapes = async (canvasId?: string): Promise<CanvasObject[]> => {
    try {
      loading.value = true
      error.value = null

      const canvas = getCanvasId(canvasId)
      console.log('Loading shapes for canvas:', canvas)
      
      const { data, error: dbError } = await $supabase
        .from('canvas_objects')
        .select('*')
        .eq('canvas_id', canvas)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })

      if (dbError) {
        console.error('Database error loading shapes:', dbError)
        throw new Error(`Failed to load shapes: ${dbError.message}`)
      }

      console.log('Loaded shapes from database:', data)
      return data || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('Error loading shapes:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  // Load all shapes for the current user
  const loadShapesForUser = async (): Promise<CanvasObject[]> => {
    try {
      loading.value = true
      error.value = null

      const userId = getCurrentUserId()
      
      const { data, error: dbError } = await $supabase
        .from('canvas_objects')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })

      if (dbError) {
        throw new Error(`Failed to load user shapes: ${dbError.message}`)
      }

      return data || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('Error loading user shapes:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  // Clear error state
  const clearError = () => {
    error.value = null
  }

  // State
  const state: CanvasDatabaseState = {
    loading,
    error,
    saving
  }

  // Actions
  const actions: CanvasDatabaseActions = {
    saveShape,
    updateShape,
    deleteShape,
    loadShapes,
    loadShapesForUser,
    softDeleteShape,
    deleteAllShapes
  }

  return {
    ...state,
    ...actions,
    clearError
  }
}
