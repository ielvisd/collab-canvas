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
    // Echo prevention - ignore our own changes
    if (user.value && shape.user_id === user.value.id) {
      return
    }
    
    // Check if shape already exists (prevent duplicates)
    const existingRect = rectangles.value.find(r => r.id === shape.id)
    const existingCircle = circles.value.find(c => c.id === shape.id)
    const existingText = texts.value.find(t => t.id === shape.id)
    
    if (existingRect || existingCircle || existingText) {
      return
    }
    
    const localShape = dbShapeToLocal(shape)
    if (!localShape) {
      console.error('Failed to convert shape to local format:', shape)
      return
    }
    
    // Add to appropriate array - create new array to ensure reactivity
    if (localShape.type === 'rectangle') {
      rectangles.value = [...rectangles.value, localShape as Rectangle]
    } else if (localShape.type === 'circle') {
      circles.value = [...circles.value, localShape as Circle]
    } else if (localShape.type === 'text') {
      texts.value = [...texts.value, localShape as Text]
    }
    
    lastSyncTime.value = new Date()
    onShapeChange?.('insert', localShape)
  }
  
  // Handle shape update from other users
  const handleShapeUpdate = (shape: any) => {
    const localShape = dbShapeToLocal(shape)
    if (!localShape) {
      console.error('Failed to convert shape to local format:', shape)
      return
    }
    
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
  }
  
  // Handle shape delete from other users
  const handleShapeDelete = (shapeId: string, shapeUserId?: string) => {
    // Echo prevention - only skip if we have a user and the shape belongs to us
    if (user.value && shapeUserId && shapeUserId === user.value.id) {
      return
    }
    
    // Check if shape exists before attempting to delete
    const existingRect = rectangles.value.find(r => r.id === shapeId)
    const existingCircle = circles.value.find(c => c.id === shapeId)
    const existingText = texts.value.find(t => t.id === shapeId)
    
    if (!existingRect && !existingCircle && !existingText) {
      return
    }
    
    // Remove from all arrays - create new arrays to ensure reactivity
    rectangles.value = rectangles.value.filter(r => r.id !== shapeId)
    circles.value = circles.value.filter(c => c.id !== shapeId)
    texts.value = texts.value.filter(t => t.id !== shapeId)
    
    lastSyncTime.value = new Date()
    onShapeChange?.('delete', { id: shapeId })
  }
  
  // Start real-time sync
  const startSync = async () => {
    try {
      // Temporarily disable user check for testing
      // if (!user.value) {
      //   console.warn('No user logged in, cannot start real-time sync')
      //   return
      // }
      
      console.log('🔄 Starting real-time sync...')
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
            // If it's a DELETE event, also call the handler directly
            if (payload.eventType === 'DELETE') {
              const shapeId = payload.old?.id
              const shapeUserId = payload.old?.user_id
              if (shapeId) {
                handleShapeDelete(shapeId, shapeUserId)
              }
            }
            // If it's an UPDATE event, also call the handler directly
            else if (payload.eventType === 'UPDATE') {
              if (payload.new) {
                handleShapeUpdate(payload.new)
              }
            }
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
            const shapeId = payload.old?.id
            const shapeUserId = payload.old?.user_id
            
            if (shapeId) {
              handleShapeDelete(shapeId, shapeUserId)
            }
          }
        )
        .subscribe((status) => {
          isConnected.value = status === 'SUBSCRIBED'
          if (status === 'CHANNEL_ERROR') {
            error.value = 'Failed to connect to real-time updates'
            console.error('❌ Real-time sync connection failed')
          } else if (status === 'SUBSCRIBED') {
            console.log('✅ Real-time sync connected')
          } else if (status === 'TIMED_OUT') {
            console.error('❌ Real-time sync timed out')
            error.value = 'Real-time subscription timed out'
          } else if (status === 'CLOSED') {
            console.error('❌ Real-time sync closed')
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
  
  // Cleanup function - call this from component onUnmounted
  const cleanup = () => {
    stopSync()
  }
  
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
    markOurChange,
    cleanup
  }
}
