import type { Ref } from 'vue'
import type { Shape, Rectangle, Circle, Text, Line, Star, ShapeType } from './useShapes'
import { useRealtimeSync } from './useRealtimeSync'

// useState is auto-imported in Nuxt, but we'll use it explicitly

export interface PersistentShapeState {
  rectangles: Ref<Rectangle[]>
  circles: Ref<Circle[]>
  texts: Ref<Text[]>
  selectedShapeId: Ref<string | null>
  totalShapes: Ref<number>
  loading: Ref<boolean>
  saving: Ref<boolean>
  error: Ref<string | null>
  autoSave: Ref<boolean>
}

export interface PersistentShapeActions {
  addRectangle: (options?: Partial<Omit<Rectangle, 'id' | 'type'>>) => Promise<Rectangle | null>
  addCircle: (options?: Partial<Omit<Circle, 'id' | 'type'>>) => Promise<Circle | null>
  addText: (options?: Partial<Omit<Text, 'id' | 'type'>>) => Promise<Text | null>
  selectShape: (shapeId: string | null) => void
  updateShape: (shapeId: string, updates: Partial<Shape> & { text?: string; fontSize?: number; width?: number; height?: number; radius?: number }) => Promise<boolean>
  deleteShape: (shapeId: string) => Promise<boolean>
  deleteSelectedShape: () => Promise<boolean>
  clearAllShapes: () => Promise<void>
  getShapeById: (shapeId: string) => ShapeType | null
  getShapeByType: (type: 'rectangle' | 'circle' | 'text', shapeId: string) => ShapeType | null
  loadShapesFromDatabase: () => Promise<void>
  saveShapeToDatabase: (shape: ShapeType) => Promise<boolean>
  deleteShapeFromDatabase: (shapeId: string) => Promise<boolean>
  setAutoSave: (enabled: boolean) => void
  clearError: () => void
  // Drag operations
  startDrag: (shapeId: string) => void
  endDrag: (shapeId: string) => Promise<void>
  // Real-time sync
  startRealtimeSync: () => Promise<void>
  stopRealtimeSync: () => void
  isRealtimeConnected: Ref<boolean>
  lastSyncTime: Ref<Date | null>
}

export const useShapesWithPersistence = (canvasWidth: number = 800, canvasHeight: number = 600) => {
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

  // Undo/Redo composable
  const { recordAction, isUndoRedoInProgress } = useUndoRedo()

  // State - Use useState for shared state across components with performance optimization
  const rectangles = useState<Rectangle[]>('canvas-rectangles', () => [])
  const circles = useState<Circle[]>('canvas-circles', () => [])
  const texts = useState<Text[]>('canvas-texts', () => [])
  const selectedShapeId = useState<string | null>('canvas-selected-shape', () => null)
  const autoSave = ref(true)
  
  // Drag operation tracking for undo/redo batching
  const dragStartState = ref<{ [shapeId: string]: any }>({})
  const isDragging = ref(false)
  
  // Start drag operation
  const startDrag = (shapeId: string) => {
    isDragging.value = true
    
    // Capture the initial state immediately when drag starts
    const currentShape = rectangles.value.find(r => r.id === shapeId) ||
                        circles.value.find(c => c.id === shapeId) ||
                        texts.value.find(t => t.id === shapeId)
    
    if (currentShape) {
      dragStartState.value[shapeId] = { ...currentShape }
      console.log('🎯 Drag operation started for', shapeId, 'with initial state:', dragStartState.value[shapeId])
    }
  }
  
  // End drag operation and record final action
  const endDrag = async (shapeId: string) => {
    if (isDragging.value && dragStartState.value[shapeId]) {
      // Find the current shape to get the final state
      const currentShape = rectangles.value.find(r => r.id === shapeId) ||
                          circles.value.find(c => c.id === shapeId) ||
                          texts.value.find(t => t.id === shapeId)
      
      if (currentShape && !isUpdatingFromRealtime.value && !isUndoRedoInProgress.value) {
        // Record the complete drag operation (from start to end)
        const objectType = currentShape.type as 'rectangle' | 'circle' | 'text'
        console.log('🎯 Drag operation completed - recording action:', {
          shapeId,
          objectType,
          startState: dragStartState.value[shapeId],
          endState: currentShape
        })
        await recordAction('update', objectType, shapeId, dragStartState.value[shapeId], currentShape)
        console.log('🎯 Drag operation completed - recorded final action for', shapeId)
      }
      
      // Clean up
      delete dragStartState.value[shapeId]
    }
    isDragging.value = false
  }
  
  // Real-time sync
  const {
    isConnected: isRealtimeConnected,
    lastSyncTime,
    error: _realtimeError,
    startSync: startRealtimeSync,
    stopSync: stopRealtimeSync,
    markOurChange
  } = useRealtimeSync(rectangles, circles, texts, (_type, shape) => {
    console.log('Real-time shape change:', _type, shape)
    isUpdatingFromRealtime.value = true
    nextTick(() => {
      isUpdatingFromRealtime.value = false
    })
  })

  // Flag to prevent update loops during real-time sync
  const isUpdatingFromRealtime = ref(false)

  // Computed
  const totalShapes = computed(() => 
    rectangles.value.length + circles.value.length + texts.value.length
  )

  // Utility functions - moved to shared utilities
  const generateId = (type: string) => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }
  
  const getRandomColor = () => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8']
    return colors[Math.floor(Math.random() * colors.length)]
  }

  const getRandomPosition = (maxX: number, maxY: number) => ({
    x: Math.random() * maxX,
    y: Math.random() * maxY
  })

  // Auto-save functionality
  const autoSaveShape = async (shape: ShapeType) => {
    if (!autoSave.value) return

    try {
      await saveShapeToDatabase(shape)
    } catch (error) {
      console.warn('Auto-save failed:', error)
    }
  }

  // Shape creation methods with database persistence
  const addRectangle = async (options: Partial<Omit<Rectangle, 'id' | 'type'>> = {}): Promise<Rectangle | null> => {
    const position = getRandomPosition(canvasWidth - 100, canvasHeight - 100)
    
    const rectangle: Rectangle = {
      id: generateId('rect'),
      type: 'rectangle',
      x: options.x ?? position.x,
      y: options.y ?? position.y,
      width: options.width ?? 100,
      height: options.height ?? 60,
      fill: (options.fill ?? getRandomColor()) as string,
      stroke: (options.stroke ?? '#000') as string,
      strokeWidth: (options.strokeWidth ?? 2) as number,
      draggable: options.draggable ?? true,
      rotation: options.rotation ?? 0
    }
    
    rectangles.value.push(rectangle)
    
    // Auto-save to database
    await autoSaveShape(rectangle)
    
    // Record action for undo/redo (only if not from real-time sync or undo/redo)
    if (!isUpdatingFromRealtime.value && !isUndoRedoInProgress.value) {
      await recordAction('add', 'rectangle', rectangle.id, null, rectangle)
    }
    
    return rectangle
  }

  const addCircle = async (options: Partial<Omit<Circle, 'id' | 'type'>> = {}): Promise<Circle | null> => {
    const position = getRandomPosition(canvasWidth - 100, canvasHeight - 100)
    
    const circle: Circle = {
      id: generateId('circle'),
      type: 'circle',
      x: options.x ?? position.x,
      y: options.y ?? position.y,
      radius: options.radius ?? 50,
      fill: (options.fill ?? getRandomColor()) as string,
      stroke: (options.stroke ?? '#000') as string,
      strokeWidth: (options.strokeWidth ?? 2) as number,
      draggable: options.draggable ?? true,
      rotation: options.rotation ?? 0
    }
    
    circles.value.push(circle)
    
    // Auto-save to database
    await autoSaveShape(circle)
    
    // Record action for undo/redo (only if not from real-time sync or undo/redo)
    if (!isUpdatingFromRealtime.value && !isUndoRedoInProgress.value) {
      await recordAction('add', 'circle', circle.id, null, circle)
    }
    
    return circle
  }

  const addText = async (options: Partial<Omit<Text, 'id' | 'type'>> = {}): Promise<Text | null> => {
    const position = getRandomPosition(canvasWidth - 100, canvasHeight - 50)
    
    const text: Text = {
      id: generateId('text'),
      type: 'text',
      x: options.x ?? position.x,
      y: options.y ?? position.y,
      text: options.text ?? 'Hola! 👋',
      fontSize: options.fontSize ?? 24,
      fill: (options.fill ?? getRandomColor()) as string,
      stroke: (options.stroke ?? '#000') as string,
      strokeWidth: (options.strokeWidth ?? 2) as number,
      draggable: options.draggable ?? true,
      rotation: options.rotation ?? 0
    }
    
    texts.value.push(text)
    
    // Auto-save to database
    await autoSaveShape(text)
    
    // Record action for undo/redo (only if not from real-time sync or undo/redo)
    if (!isUpdatingFromRealtime.value && !isUndoRedoInProgress.value) {
      await recordAction('add', 'text', text.id, null, text)
    }
    
    return text
  }



  // Shape management methods with database persistence
  const selectShape = (shapeId: string | null) => {
    selectedShapeId.value = shapeId
  }

  const updateShape = async (shapeId: string, updates: Partial<Shape> & { text?: string; fontSize?: number; width?: number; height?: number; radius?: number }): Promise<boolean> => {
    try {
      // Skip database update if this is from real-time sync
      if (isUpdatingFromRealtime.value) {
        console.log('🔄 Skipping database update - updating from real-time sync')
        return true
      }

      console.log('🔄 Updating shape:', shapeId, 'with updates:', updates)
      console.log('🔄 isUpdatingFromRealtime:', isUpdatingFromRealtime.value)
      
      // Check if this is a position update during dragging
      const isPositionUpdate = updates.hasOwnProperty('x') || updates.hasOwnProperty('y')
      const isDragUpdate = isPositionUpdate && isDragging.value
      
      // Update local state and capture before/after states for undo/redo
      const rectIndex = rectangles.value.findIndex(r => r.id === shapeId)
      if (rectIndex !== -1) {
        // Capture the state BEFORE any modifications
        const oldRect = { ...rectangles.value[rectIndex] } as Rectangle
        rectangles.value[rectIndex] = { ...rectangles.value[rectIndex], ...updates } as Rectangle
        console.log('Updated rectangle:', { old: oldRect, new: rectangles.value[rectIndex] })
        
        // Pass the complete updated shape data instead of just updates
        console.log('🔄 Calling updateShapeInDb for rectangle:', shapeId, rectangles.value[rectIndex])
        const updateResult = await updateShapeInDb(shapeId, rectangles.value[rectIndex])
        console.log('🔄 Rectangle update completed:', updateResult)
        
        // Record action for undo/redo (only if not from real-time sync or undo/redo)
        if (!isUpdatingFromRealtime.value && !isUndoRedoInProgress.value) {
          // For drag operations, don't record intermediate positions
          if (isDragUpdate) {
            console.log('🎯 Drag in progress - skipping action recording for', shapeId)
          } else {
            // Record non-drag updates immediately
            await recordAction('update', 'rectangle', shapeId, oldRect, rectangles.value[rectIndex])
          }
        }
        
        return updateResult
      }

      const circleIndex = circles.value.findIndex(c => c.id === shapeId)
      if (circleIndex !== -1) {
        // Capture the state BEFORE any modifications
        const oldCircle = { ...circles.value[circleIndex] } as Circle
        circles.value[circleIndex] = { ...circles.value[circleIndex], ...updates } as Circle
        console.log('Updated circle:', { old: oldCircle, new: circles.value[circleIndex] })
        
        // Pass the complete updated shape data instead of just updates
        console.log('🔄 Calling updateShapeInDb for circle:', shapeId, circles.value[circleIndex])
        const updateResult = await updateShapeInDb(shapeId, circles.value[circleIndex])
        console.log('🔄 Circle update completed:', updateResult)
        
        // Record action for undo/redo (only if not from real-time sync or undo/redo)
        if (!isUpdatingFromRealtime.value && !isUndoRedoInProgress.value) {
          // For drag operations, don't record intermediate positions
          if (isDragUpdate) {
            console.log('🎯 Drag in progress - skipping action recording for circle', shapeId)
          } else {
            // Record non-drag updates immediately
            await recordAction('update', 'circle', shapeId, oldCircle, circles.value[circleIndex])
          }
        }
        
        return updateResult
      }

      const textIndex = texts.value.findIndex(t => t.id === shapeId)
      if (textIndex !== -1) {
        // Capture the state BEFORE any modifications
        const oldText = { ...texts.value[textIndex] } as Text
        texts.value[textIndex] = { ...texts.value[textIndex], ...updates } as Text
        console.log('Updated text:', { old: oldText, new: texts.value[textIndex] })
        
        // Pass the complete updated shape data instead of just updates
        const updateResult = await updateShapeInDb(shapeId, texts.value[textIndex])
        console.log('Text update completed:', updateResult)
        
        // Record action for undo/redo (only if not from real-time sync or undo/redo)
        if (!isUpdatingFromRealtime.value && !isUndoRedoInProgress.value) {
          // For drag operations, don't record intermediate positions
          if (isDragUpdate) {
            console.log('🎯 Drag in progress - skipping action recording for text', shapeId)
          } else {
            // Record non-drag updates immediately
            await recordAction('update', 'text', shapeId, oldText, texts.value[textIndex])
          }
        }
        
        return updateResult
      }

      console.warn('Shape not found for update:', shapeId)
      return false
    } catch (error) {
      console.error('Error updating shape:', error)
      return false
    }
  }

  const deleteShape = async (shapeId: string): Promise<boolean> => {
    try {
      console.log('Deleting shape:', shapeId)
      console.log('Current shapes before deletion:', {
        rectangles: rectangles.value.length,
        circles: circles.value.length,
        texts: texts.value.length
      })
      
      // Get shape before deletion for undo/redo
      let shapeToDelete: any = null
      let objectType: 'rectangle' | 'circle' | 'text' = 'rectangle'
      
      const rectIndex = rectangles.value.findIndex(r => r.id === shapeId)
      if (rectIndex !== -1) {
        shapeToDelete = rectangles.value[rectIndex]
        objectType = 'rectangle'
      } else {
        const circleIndex = circles.value.findIndex(c => c.id === shapeId)
        if (circleIndex !== -1) {
          shapeToDelete = circles.value[circleIndex]
          objectType = 'circle'
        } else {
          const textIndex = texts.value.findIndex(t => t.id === shapeId)
          if (textIndex !== -1) {
            shapeToDelete = texts.value[textIndex]
            objectType = 'text'
          }
        }
      }
      
      // First, try to delete from database
      const dbDeleteSuccess = await deleteShapeFromDatabase(shapeId)
      if (!dbDeleteSuccess) {
        console.error('Failed to delete shape from database:', shapeId)
        return false
      }
      
      // Only remove from local state after successful database deletion
      if (rectIndex !== -1) {
        console.log('Deleting rectangle at index:', rectIndex)
        rectangles.value.splice(rectIndex, 1)
        if (selectedShapeId.value === shapeId) {
          selectedShapeId.value = null
        }
        console.log('Rectangle deleted successfully')
      } else if (circles.value.findIndex(c => c.id === shapeId) !== -1) {
        const circleIndex = circles.value.findIndex(c => c.id === shapeId)
        console.log('Deleting circle at index:', circleIndex)
        circles.value.splice(circleIndex, 1)
        if (selectedShapeId.value === shapeId) {
          selectedShapeId.value = null
        }
        console.log('Circle deleted successfully')
      } else if (texts.value.findIndex(t => t.id === shapeId) !== -1) {
        const textIndex = texts.value.findIndex(t => t.id === shapeId)
        console.log('Deleting text at index:', textIndex)
        texts.value.splice(textIndex, 1)
        if (selectedShapeId.value === shapeId) {
          selectedShapeId.value = null
        }
        console.log('Text deleted successfully')
      } else {
        console.log('Shape not found for deletion:', shapeId)
        return false
      }
      
      // Record action for undo/redo (only if not from real-time sync or undo/redo)
      if (!isUpdatingFromRealtime.value && !isUndoRedoInProgress.value && shapeToDelete) {
        await recordAction('delete', objectType, shapeId, shapeToDelete, null)
      }
      
      return true
    } catch (error) {
      console.error('Error deleting shape:', error)
      return false
    }
  }

  const deleteSelectedShape = async (): Promise<boolean> => {
    if (!selectedShapeId.value) return false
    return await deleteShape(selectedShapeId.value)
  }

  const clearAllShapes = async (): Promise<void> => {
    try {
      console.log('Clearing all shapes from local state and database...')
      
      // Clear from database first
      const success = await deleteAllShapes()
      if (!success) {
        throw new Error('Failed to clear shapes from database')
      }

      // Clear local state
      rectangles.value = []
      circles.value = []
      texts.value = []
      selectedShapeId.value = null

      console.log('All shapes cleared successfully from both local state and database')
    } catch (error) {
      console.error('Error clearing all shapes:', error)
      throw error
    }
  }

  const getShapeById = (shapeId: string): ShapeType | null => {
    const allShapes = [...rectangles.value, ...circles.value, ...texts.value]
    return allShapes.find(shape => shape.id === shapeId) || null
  }

  const getShapeByType = (type: 'rectangle' | 'circle' | 'text', shapeId: string): ShapeType | null => {
    switch (type) {
      case 'rectangle':
        return rectangles.value.find(r => r.id === shapeId) || null
      case 'circle':
        return circles.value.find(c => c.id === shapeId) || null
      case 'text':
        return texts.value.find(t => t.id === shapeId) || null
      default:
        return null
    }
  }

  // Database operations
  const loadShapesFromDatabase = async (): Promise<void> => {
    try {
      const dbShapes = await loadShapesFromDb()
      
      // Clear current shapes
      rectangles.value = []
      circles.value = []
      texts.value = []
      
      // Convert database shapes to local format
      console.log('Total shapes loaded from database:', dbShapes.length)
      dbShapes.forEach((dbShape, index) => {
        console.log(`Shape ${index + 1}:`, { 
          id: dbShape.id, 
          type: dbShape.type, 
          data: dbShape.data,
          created_at: dbShape.created_at,
          updated_at: dbShape.updated_at
        })
        console.log(`Shape ${index + 1} data details:`, {
          x: dbShape.data.x,
          y: dbShape.data.y,
          rotation: dbShape.data.rotation,
          width: dbShape.data.width,
          height: dbShape.data.height,
          radius: dbShape.data.radius,
          fill: dbShape.data.fill,
          stroke: dbShape.data.stroke
        })
        console.log(`Shape ${index + 1} full data object:`, JSON.stringify(dbShape.data, null, 2))
        
        if (dbShape.type === 'rect') {
          const rectangle: Rectangle = {
            id: dbShape.id,
            type: 'rectangle',
            x: dbShape.data.x ?? 0,
            y: dbShape.data.y ?? 0,
            width: dbShape.data.width ?? 100,
            height: dbShape.data.height ?? 60,
            fill: dbShape.data.fill ?? '#ff6b6b',
            stroke: dbShape.data.stroke ?? '#000',
            strokeWidth: dbShape.data.strokeWidth ?? 2,
            draggable: dbShape.data.draggable !== false, // Default to true unless explicitly false
            rotation: dbShape.data.rotation ?? 0
          }
          rectangles.value.push(rectangle)
          console.log('Added rectangle:', rectangle)
          console.log('Rectangle final values:', {
            x: rectangle.x,
            y: rectangle.y,
            rotation: rectangle.rotation,
            fill: rectangle.fill,
            width: rectangle.width,
            height: rectangle.height
          })
        } else if (dbShape.type === 'circle') {
          const circle: Circle = {
            id: dbShape.id,
            type: 'circle',
            x: dbShape.data.x ?? 0,
            y: dbShape.data.y ?? 0,
            radius: dbShape.data.radius ?? 50,
            fill: dbShape.data.fill ?? '#4ecdc4',
            stroke: dbShape.data.stroke ?? '#000',
            strokeWidth: dbShape.data.strokeWidth ?? 2,
            draggable: dbShape.data.draggable !== false, // Default to true unless explicitly false
            rotation: dbShape.data.rotation ?? 0
          }
          circles.value.push(circle)
          console.log('Added circle:', circle)
        } else if (dbShape.type === 'text') {
          // Skip emoji shapes - they're handled by useEmojis composable
          if (dbShape.data && dbShape.data.emoji) {
            console.log('Skipping emoji shape (handled by useEmojis):', dbShape.data.emoji)
            return
          }
          
          const text: Text = {
            id: dbShape.id,
            type: 'text',
            x: dbShape.data.x ?? 0,
            y: dbShape.data.y ?? 0,
            text: dbShape.data.text ?? 'Text',
            fontSize: dbShape.data.fontSize ?? 16,
            fill: dbShape.data.fill ?? '#45b7d1',
            stroke: dbShape.data.stroke ?? '#000',
            strokeWidth: dbShape.data.strokeWidth ?? 2,
            draggable: dbShape.data.draggable !== false, // Default to true unless explicitly false
            rotation: dbShape.data.rotation ?? 0
          }
          texts.value.push(text)
          console.log('Added text:', text)
        } else if (dbShape.type === 'emoji') {
          // Skip emoji shapes - they're handled by useEmojis composable
          console.log('Skipping emoji shape (handled by useEmojis):', dbShape.data?.emoji || 'emoji')
          return
        } else {
          console.warn('Unknown shape type:', dbShape.type)
        }
      })
    } catch (error) {
      console.error('Error loading shapes from database:', error)
    }
  }

  const saveShapeToDatabase = async (shape: ShapeType): Promise<boolean> => {
    try {
      console.log('Saving shape to database:', { type: shape.type, id: shape.id })
      const result = await saveShapeToDb(shape)
      console.log('Shape saved result:', result)
      return result !== null
    } catch (error) {
      console.error('Error saving shape to database:', error)
      return false
    }
  }


  const deleteShapeFromDatabase = async (shapeId: string): Promise<boolean> => {
    try {
      console.log('Attempting to delete shape from database:', shapeId)
      const result = await deleteShapeFromDb(shapeId)
      console.log('Database delete result:', result)
      return result
    } catch (error) {
      console.error('Error deleting shape from database:', error)
      return false
    }
  }

  const setAutoSave = (enabled: boolean) => {
    autoSave.value = enabled
  }

  const clearError = () => {
    clearDbError()
  }

  // State
  const state: PersistentShapeState = {
    rectangles,
    circles,
    texts,
    selectedShapeId,
    totalShapes,
    loading: dbLoading,
    saving: dbSaving,
    error: dbError,
    autoSave
  }

  // Actions
  const actions: PersistentShapeActions = {
    addRectangle,
    addCircle,
    addText,
    selectShape,
    updateShape,
    deleteShape,
    deleteSelectedShape,
    clearAllShapes,
    getShapeById,
    getShapeByType,
    loadShapesFromDatabase,
    saveShapeToDatabase,
    deleteShapeFromDatabase,
    setAutoSave,
    clearError,
    // Drag operations
    startDrag,
    endDrag,
    // Real-time sync
    startRealtimeSync: startRealtimeSync,
    stopRealtimeSync: stopRealtimeSync,
    isRealtimeConnected: isRealtimeConnected,
    lastSyncTime: lastSyncTime
  }

  return {
    ...state,
    ...actions
  }
}
