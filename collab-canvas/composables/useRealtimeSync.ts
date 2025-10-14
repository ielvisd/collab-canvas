import type { Ref } from 'vue'
import { nextTick } from 'vue'
import type { Rectangle, Circle, Text } from './useShapes'

export interface RealtimeSyncState {
  isConnected: Ref<boolean>
  lastSyncTime: Ref<Date | null>
  error: Ref<string | null>
}

export interface RealtimeSyncActions {
  startSync: () => Promise<void>
  stopSync: () => void
  handleShapeInsert: (shape: any) => void
  handleShapeUpdate: (shape: any) => void
  handleShapeDelete: (shapeId: string) => void
}

export const useRealtimeSync = (
  rectangles: Ref<Rectangle[]>,
  circles: Ref<Circle[]>,
  texts: Ref<Text[]>,
  onShapeChange?: (type: 'insert' | 'update' | 'delete', shape: any) => void
) => {
  const { $supabase } = useNuxtApp()
  const { user } = useAuth()
  
  // State
  const isConnected = ref(false)
  const lastSyncTime = ref<Date | null>(null)
  const error = ref<string | null>(null)
  
  // Track our own changes to prevent echo
  const ourChanges = new Set<string>()
  
  // Get canvas ID (same logic as in useCanvasDatabase)
  const getCanvasId = (): string => {
    // For now, use a fixed canvas ID. In a real app, this would be dynamic
    return '550e8400-e29b-41d4-a716-446655440000'
  }
  
  // Convert database shape to local format
  const dbShapeToLocal = (dbShape: any): Rectangle | Circle | Text | null => {
    try {
      if (dbShape.type === 'rect' || dbShape.type === 'rectangle') {
        return {
          id: dbShape.id,
          type: 'rectangle',
          x: dbShape.data.x ?? 0,
          y: dbShape.data.y ?? 0,
          width: dbShape.data.width ?? 100,
          height: dbShape.data.height ?? 60,
          fill: dbShape.data.fill ?? '#ff6b6b',
          stroke: dbShape.data.stroke ?? '#000',
          strokeWidth: dbShape.data.strokeWidth ?? 2,
          draggable: dbShape.data.draggable !== false,
          rotation: dbShape.data.rotation ?? 0
        } as Rectangle
      } else if (dbShape.type === 'circle') {
        return {
          id: dbShape.id,
          type: 'circle',
          x: dbShape.data.x ?? 0,
          y: dbShape.data.y ?? 0,
          radius: dbShape.data.radius ?? 50,
          fill: dbShape.data.fill ?? '#4ecdc4',
          stroke: dbShape.data.stroke ?? '#000',
          strokeWidth: dbShape.data.strokeWidth ?? 2,
          draggable: dbShape.data.draggable !== false,
          rotation: dbShape.data.rotation ?? 0
        } as Circle
      } else if (dbShape.type === 'text') {
        return {
          id: dbShape.id,
          type: 'text',
          x: dbShape.data.x ?? 0,
          y: dbShape.data.y ?? 0,
          text: dbShape.data.text ?? 'Text',
          fontSize: dbShape.data.fontSize ?? 16,
          fill: dbShape.data.fill ?? '#45b7d1',
          stroke: dbShape.data.stroke ?? '#000',
          strokeWidth: dbShape.data.strokeWidth ?? 2,
          draggable: dbShape.data.draggable !== false,
          rotation: dbShape.data.rotation ?? 0
        } as Text
      }
      return null
    } catch (err) {
      console.error('Error converting database shape to local format:', err)
      return null
    }
  }
  
  // Handle shape insert from other users
  const handleShapeInsert = (shape: any) => {
    console.log('Real-time INSERT event:', shape)
    console.log('Current arrays before insert:', {
      rectangles: rectangles.value.length,
      circles: circles.value.length,
      texts: texts.value.length
    })
    
    // Re-enable echo prevention to prevent duplicate shapes
    console.log('Comparing user IDs - Current user:', user.value?.id, 'Shape user:', shape.user_id)
    if (user.value && shape.user_id === user.value.id) {
      console.log('Ignoring own INSERT change:', shape.id, 'user_id:', shape.user_id)
      return
    }
    
    // Check if shape already exists (prevent duplicates)
    const existingRect = rectangles.value.find(r => r.id === shape.id)
    const existingCircle = circles.value.find(c => c.id === shape.id)
    const existingText = texts.value.find(t => t.id === shape.id)
    
    if (existingRect || existingCircle || existingText) {
      console.log('Shape already exists, ignoring INSERT:', shape.id)
      return
    }
    
    const localShape = dbShapeToLocal(shape)
    if (!localShape) {
      console.error('Failed to convert shape to local format:', shape)
      return
    }
    
    console.log('Converted shape to local format:', localShape)
    
    // Add to appropriate array - create new array to ensure reactivity
    if (localShape.type === 'rectangle') {
      rectangles.value = [...rectangles.value, localShape as Rectangle]
      console.log('Added rectangle to array. New count:', rectangles.value.length)
    } else if (localShape.type === 'circle') {
      circles.value = [...circles.value, localShape as Circle]
      console.log('Added circle to array. New count:', circles.value.length)
    } else if (localShape.type === 'text') {
      texts.value = [...texts.value, localShape as Text]
      console.log('Added text to array. New count:', texts.value.length)
    }
    
    console.log('Current arrays after insert:', {
      rectangles: rectangles.value.length,
      circles: circles.value.length,
      texts: texts.value.length
    })
    
    lastSyncTime.value = new Date()
    onShapeChange?.('insert', localShape)
    console.log('Added shape from other user:', localShape)
  }
  
  // Handle shape update from other users
  const handleShapeUpdate = (shape: any) => {
    console.log('Real-time UPDATE event:', shape)
    console.log('Current user object:', user.value)
    console.log('Current user ID:', user.value?.id)
    console.log('Shape object keys:', Object.keys(shape))
    console.log('Shape user_id field:', shape.user_id)
    
    // For now, process all updates regardless of who owns the shape
    // TODO: Implement proper echo prevention using timestamps or other mechanisms
    console.log('Processing UPDATE for shape:', shape.id, 'user_id:', shape.user_id)
    
    const localShape = dbShapeToLocal(shape)
    if (!localShape) return
    
    // Update in appropriate array
    if (localShape.type === 'rectangle') {
      const index = rectangles.value.findIndex(r => r.id === shape.id)
      if (index !== -1) {
        rectangles.value[index] = localShape as Rectangle
      }
    } else if (localShape.type === 'circle') {
      const index = circles.value.findIndex(c => c.id === shape.id)
      if (index !== -1) {
        circles.value[index] = localShape as Circle
      }
    } else if (localShape.type === 'text') {
      const index = texts.value.findIndex(t => t.id === shape.id)
      if (index !== -1) {
        texts.value[index] = localShape as Text
      }
    }
    
    lastSyncTime.value = new Date()
    onShapeChange?.('update', localShape)
    console.log('Updated shape from other user:', localShape)
  }
  
  // Handle shape delete from other users
  const handleShapeDelete = (shapeId: string, shapeUserId?: string) => {
    console.log('Real-time DELETE event:', shapeId)
    console.log('Current shapes before delete:', {
      rectangles: rectangles.value.length,
      circles: circles.value.length,
      texts: texts.value.length
    })
    
    // Re-enable echo prevention to prevent duplicate deletes
    if (user.value && shapeUserId === user.value.id) {
      console.log('Ignoring own DELETE change:', shapeId, 'user_id:', shapeUserId)
      return
    }
    
    // Remove from all arrays
    const rectIndex = rectangles.value.findIndex(r => r.id === shapeId)
    if (rectIndex !== -1) {
      console.log('Removing rectangle at index:', rectIndex)
      rectangles.value.splice(rectIndex, 1)
    }
    
    const circleIndex = circles.value.findIndex(c => c.id === shapeId)
    if (circleIndex !== -1) {
      console.log('Removing circle at index:', circleIndex)
      circles.value.splice(circleIndex, 1)
    }
    
    const textIndex = texts.value.findIndex(t => t.id === shapeId)
    if (textIndex !== -1) {
      console.log('Removing text at index:', textIndex)
      texts.value.splice(textIndex, 1)
    }
    
    console.log('Current shapes after delete:', {
      rectangles: rectangles.value.length,
      circles: circles.value.length,
      texts: texts.value.length
    })
    
    lastSyncTime.value = new Date()
    onShapeChange?.('delete', { id: shapeId })
    console.log('Removed shape from other user:', shapeId)
    
    // Force canvas refresh to ensure visual update
    nextTick(() => {
      console.log('Forcing canvas refresh after delete')
      // This will be handled by the watch function in CanvasKonva
    })
  }
  
  // Start real-time sync
  const startSync = async () => {
    try {
      // Temporarily disable user check for testing
      // if (!user.value) {
      //   console.warn('No user logged in, cannot start real-time sync')
      //   return
      // }
      
      console.log('Starting real-time sync...')
      console.log('Current user ID:', user.value?.id)
      console.log('Canvas ID:', getCanvasId())
      error.value = null
      
      const canvasId = getCanvasId()
      
      // Subscribe to postgres changes
      const channel = $supabase
        .channel('canvas-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'canvas_objects',
            filter: `canvas_id=eq.${canvasId}`
          },
          (payload) => {
            console.log('Received INSERT event:', payload)
            console.log('INSERT payload.new:', payload.new)
            console.log('INSERT payload.old:', payload.old)
            handleShapeInsert(payload.new)
          }
        )
        // Add a general subscription to test if real-time is working at all
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'canvas_objects'
          },
          (payload) => {
            console.log('Received ANY event on canvas_objects:', payload)
            console.log('ANY event type:', payload.eventType)
            console.log('ANY event timestamp:', new Date().toISOString())
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
            console.log('Received UPDATE event:', payload)
            console.log('UPDATE payload.new:', payload.new)
            console.log('UPDATE payload.old:', payload.old)
            console.log('UPDATE payload.new.user_id:', payload.new?.user_id)
            console.log('UPDATE payload.old.user_id:', payload.old?.user_id)
            console.log('UPDATE event timestamp:', new Date().toISOString())
            handleShapeUpdate(payload.new)
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
            console.log('Received DELETE event:', payload)
            console.log('DELETE payload.old:', payload.old)
            console.log('DELETE payload.new:', payload.new)
            
            const shapeId = payload.old?.id
            const shapeUserId = payload.old?.user_id
            if (shapeId) {
              handleShapeDelete(shapeId, shapeUserId)
            } else {
              console.error('No shape ID found in DELETE payload:', payload)
            }
          }
        )
        .subscribe((status) => {
          console.log('Subscription status:', status)
          console.log('Canvas ID for subscription:', canvasId)
          console.log('Current user ID:', user.value?.id)
          console.log('Subscription timestamp:', new Date().toISOString())
          isConnected.value = status === 'SUBSCRIBED'
          if (status === 'CHANNEL_ERROR') {
            error.value = 'Failed to connect to real-time updates'
            console.error('Channel error - check RLS policies and Realtime configuration')
          } else if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to real-time updates for canvas:', canvasId)
          } else if (status === 'TIMED_OUT') {
            console.error('Subscription timed out')
            error.value = 'Real-time subscription timed out'
          } else if (status === 'CLOSED') {
            console.error('Subscription closed')
            error.value = 'Real-time subscription closed'
          }
        })
      
      // Store channel reference for cleanup
      ;(window as any).__realtimeChannel = channel
      
    } catch (err) {
      console.error('Error starting real-time sync:', err)
      error.value = err instanceof Error ? err.message : 'Unknown error'
    }
  }
  
  // Stop real-time sync
  const stopSync = () => {
    console.log('Stopping real-time sync...')
    const channel = (window as any).__realtimeChannel
    if (channel) {
      $supabase.removeChannel(channel)
      ;(window as any).__realtimeChannel = null
    }
    isConnected.value = false
  }
  
  // Mark our own changes to prevent echo
  const markOurChange = (shapeId: string) => {
    ourChanges.add(shapeId)
    // Remove after 5 seconds to prevent memory leaks
    setTimeout(() => {
      ourChanges.delete(shapeId)
    }, 5000)
  }
  
  // Cleanup on unmount
  onUnmounted(() => {
    stopSync()
  })
  
  return {
    // State
    isConnected: readonly(isConnected),
    lastSyncTime: readonly(lastSyncTime),
    error: readonly(error),
    
    // Actions
    startSync,
    stopSync,
    handleShapeInsert,
    handleShapeUpdate,
    handleShapeDelete,
    markOurChange
  }
}
