<template>
  <AppLayout>
    <div class="h-screen w-screen bg-gray-100">
    <!-- Toolbar -->
    <div data-testid="canvas-toolbar" class="absolute left-1/2 transform -translate-x-1/2 z-50 bg-white rounded-lg shadow-lg p-4" style="top: calc(var(--ui-header-height, 4rem) + 1rem);">
      <div class="flex flex-wrap gap-2 items-center justify-center">
        <!-- Shape Creation Buttons -->
        <div class="flex gap-2">
          <UButton 
            data-testid="add-rectangle-btn" 
            @click="addRectangle" 
            color="primary" 
            size="sm"
            :loading="saving"
            :disabled="loading || saving"
          >
            Add Rectangle
          </UButton>
          <UButton 
            data-testid="add-circle-btn" 
            @click="addCircle" 
            color="primary" 
            size="sm"
            :loading="saving"
            :disabled="loading || saving"
          >
            Add Circle
          </UButton>
          <UButton 
            data-testid="add-text-btn" 
            @click="addText" 
            color="primary" 
            size="sm"
            :loading="saving"
            :disabled="loading || saving"
          >
            Add Text
          </UButton>
        </div>
        
        <!-- Color Picker -->
        <div class="flex items-center gap-2 border-l border-gray-200 pl-2">
          <label class="text-sm font-medium text-gray-700">Color:</label>
          <input 
            data-testid="color-picker"
            v-model="selectedColor" 
            @input="applyColorToSelected"
            type="color" 
            class="w-8 h-8 rounded border border-gray-300 cursor-pointer"
            title="Select shape color"
            :disabled="!selectedShapeId"
          />
        </div>
        
        <!-- Rotation Controls -->
        <div v-if="selectedShapeId" class="flex items-center gap-2 border-l border-gray-200 pl-2">
          <label class="text-sm font-medium text-gray-700">Rotate:</label>
          <UButton 
            data-testid="rotate-left-btn"
            @click="rotateSelected(-45)" 
            size="xs" 
            variant="outline"
            :disabled="!selectedShapeId"
          >
            ↶ -45°
          </UButton>
          <UButton 
            data-testid="rotate-right-btn"
            @click="rotateSelected(45)" 
            size="xs" 
            variant="outline"
            :disabled="!selectedShapeId"
          >
            ↷ +45°
          </UButton>
        </div>
        
        <!-- Auto-save Toggle -->
        <div class="flex items-center gap-2 border-l border-gray-200 pl-2">
          <USwitch 
            v-model="autoSave" 
            @update:model-value="setAutoSave"
            size="sm"
            label="Auto-save"
          />
        </div>
        
        <!-- Action Buttons -->
        <div class="flex gap-2 border-l border-gray-200 pl-2">
          <UButton 
            data-testid="delete-selected-btn"
            @click="handleDeleteSelected" 
            color="red" 
            variant="outline" 
            size="sm"
            :disabled="!selectedShapeId || loading || saving"
            :loading="saving"
            class="font-semibold text-red-700 border-red-700 hover:bg-red-50"
          >
            <UIcon name="i-heroicons-trash" class="w-4 h-4 mr-1" />
            Delete Selected
          </UButton>
          <UButton 
            data-testid="clear-all-btn" 
            @click="clearCanvas" 
            color="red" 
            variant="outline" 
            size="sm"
            :disabled="loading || saving"
            :loading="saving"
            class="font-semibold text-red-700 border-red-700 hover:bg-red-50"
          >
            Clear All
          </UButton>
        <UButton 
          data-testid="reset-view-btn" 
          @click="resetView" 
          color="gray" 
          variant="outline" 
          size="sm"
          class="font-semibold text-gray-700 border-gray-700 hover:bg-gray-50"
        >
          Reset View
        </UButton>
        <UButton data-testid="add-many-shapes-btn" @click="addManyShapes" color="blue" variant="outline" size="sm">
          Add 50 Shapes
        </UButton>
        </div>
      </div>
    </div>

    <!-- Canvas Container -->
    <div class="w-full h-full flex items-center justify-center">
      <div 
        data-testid="canvas-container"
        ref="canvasContainer" 
        class="border-2 border-gray-300 rounded-lg shadow-lg bg-white"
        :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }"
      >
        <CanvasKonva
          ref="canvasRef"
          :stage-config="stageConfig"
          :rectangles="rectangles"
          :circles="circles"
          :texts="texts"
          @stage-mousedown="handleStageMouseDown"
          @stage-mousemove="handleStageMouseMove"
          @stage-mouseup="handleStageMouseUp"
          @select-shape="selectShape"
          @update-shape="handleShapeUpdate"
        />
      </div>
    </div>

    <!-- Debug Info -->
    <div data-testid="debug-info" class="absolute bottom-4 left-4 z-10 bg-white rounded-lg shadow-lg p-4">
      <div class="text-sm text-gray-800 font-medium">
        <div>Shapes: {{ totalShapes }}</div>
        <div>Selected: {{ selectedShapeId || 'None' }}</div>
        <div>Zoom: {{ Math.round(zoom * 100) }}%</div>
        <div>Position: ({{ Math.round(stageConfig.x) }}, {{ Math.round(stageConfig.y) }})</div>
        <div>Bounds: X:[-2000,2000] Y:[-2000,2000]</div>
        <div>Auto-save: {{ autoSave ? 'ON' : 'OFF' }}</div>
        <!-- Real-time status temporarily disabled -->
        <!-- <div class="flex items-center gap-1">
          <div class="w-2 h-2 rounded-full" :class="isRealtimeConnected ? 'bg-green-500' : 'bg-red-500'"></div>
          <span>Real-time: {{ isRealtimeConnected ? 'Connected' : 'Disconnected' }}</span>
        </div>
        <div v-if="lastSyncTime" class="text-xs text-gray-500">
          Last sync: {{ lastSyncTime.toLocaleTimeString() }}
        </div> -->
        <div v-if="loading" class="text-blue-600 font-semibold">Loading...</div>
        <div v-if="saving" class="text-yellow-600 font-semibold">Saving...</div>
        <div v-if="error" class="text-red-600 font-semibold">Error: {{ error }}</div>
      </div>
    </div>

    <!-- Error Toast handled by UApp -->
  </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watchEffect } from 'vue'
import { useShapesWithPersistence } from '~/composables/useShapesWithPersistence'

// Define page meta
definePageMeta({
  middleware: 'auth'
})

// Auth check
const { isAuthenticated, loading: authLoading } = useAuth()

// Redirect to login if not authenticated
onMounted(() => {
  watchEffect(() => {
    if (!authLoading.value && !isAuthenticated.value) {
      navigateTo('/login')
    }
  })
})

// Canvas dimensions
const canvasWidth = 800
const canvasHeight = 600

// Use shapes composable with persistence
const {
  rectangles,
  circles,
  texts,
  selectedShapeId,
  totalShapes,
  loading,
  saving,
  error,
  autoSave,
  addRectangle: addRect,
  addCircle: addCirc,
  addText: addTxt,
  selectShape,
  updateShape,
  deleteSelectedShape,
  clearAllShapes,
  getShapeById,
  loadShapesFromDatabase,
  setAutoSave,
  clearError,
  startRealtimeSync,
  stopRealtimeSync,
  isRealtimeConnected,
  lastSyncTime
} = useShapesWithPersistence(canvasWidth, canvasHeight)

// Stage configuration
const stageConfig = ref({
  width: canvasWidth,
  height: canvasHeight,
  draggable: true,
  scaleX: 1,
  scaleY: 1,
  x: 0,
  y: 0
})

// Interaction state
const isDragging = ref(false)
const lastPointerPosition = ref({ x: 0, y: 0 })
const canvasRef = ref(null)
const selectedColor = ref('#FF6B6B') // Default color

// Watch for selected shape changes to update color picker
watch(selectedShapeId, (newShapeId) => {
  if (newShapeId) {
    const shape = getShapeById(newShapeId)
    if (shape && shape.fill) {
      selectedColor.value = shape.fill
    }
  }
})

// Computed properties
const zoom = computed(() => stageConfig.value.scaleX || 1)

// Shape creation methods (now using composable with selected color and persistence)
const addRectangle = async () => {
  const shape = await addRect({ fill: selectedColor.value })
  if (shape && canvasRef.value) {
    console.log('Rectangle added, forcing canvas refresh')
    canvasRef.value.forceRefresh()
  }
}

const addCircle = async () => {
  const shape = await addCirc({ fill: selectedColor.value })
  if (shape && canvasRef.value) {
    console.log('Circle added, forcing canvas refresh')
    canvasRef.value.forceRefresh()
  }
}

const addText = async () => {
  const shape = await addTxt({ fill: selectedColor.value })
  if (shape && canvasRef.value) {
    console.log('Text added, forcing canvas refresh')
    canvasRef.value.forceRefresh()
  }
}

const clearCanvas = async () => {
  await clearAllShapes()
}

const applyColorToSelected = async () => {
  if (selectedShapeId.value) {
    console.log('Applying color to shape:', selectedShapeId.value, 'color:', selectedColor.value)
    
    // Get the current shape to see its current color
    const currentShape = getShapeById(selectedShapeId.value)
    console.log('Current shape before color change:', currentShape)
    
    const result = await updateShape(selectedShapeId.value, { fill: selectedColor.value })
    console.log('Color update result:', result)
    
    // Get the shape again to verify the color was updated
    const updatedShape = getShapeById(selectedShapeId.value)
    console.log('Shape after color change:', updatedShape)
  }
}

const rotateSelected = async (degrees) => {
  if (selectedShapeId.value) {
    const currentShape = getShapeById(selectedShapeId.value)
    if (currentShape) {
      const currentRotation = currentShape.rotation || 0
      const newRotation = (currentRotation + degrees) % 360
      await updateShape(selectedShapeId.value, { rotation: newRotation })
    }
  }
}

const handleDeleteSelected = async () => {
  if (selectedShapeId.value) {
    const confirmed = confirm('Are you sure you want to delete the selected shape?')
    if (confirmed) {
      const success = await deleteSelectedShape()
      if (success && canvasRef.value) {
        // Force refresh the canvas to ensure deleted shape is removed
        canvasRef.value.forceRefresh()
      }
    }
  }
}

const addManyShapes = () => {
  const startTime = performance.now()
  
  // Add 50 shapes for performance testing
  for (let i = 0; i < 50; i++) {
    const shapeType = Math.floor(Math.random() * 3)
    switch (shapeType) {
      case 0:
        addRect({ 
          x: Math.random() * (canvasWidth - 100),
          y: Math.random() * (canvasHeight - 100),
          fill: getRandomColor()
        })
        break
      case 1:
        addCirc({ 
          x: Math.random() * (canvasWidth - 100),
          y: Math.random() * (canvasHeight - 100),
          fill: getRandomColor()
        })
        break
      case 2:
        addTxt({ 
          x: Math.random() * (canvasWidth - 100),
          y: Math.random() * (canvasHeight - 100),
          fill: getRandomColor(),
          text: `Text ${i + 1}`
        })
        break
    }
  }
  
  const endTime = performance.now()
  console.log(`Added 50 shapes in ${(endTime - startTime).toFixed(2)}ms`)
}

const getRandomColor = () => {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8']
  return colors[Math.floor(Math.random() * colors.length)]
}

const resetView = () => {
  // Reset stage configuration to default
  stageConfig.value = {
    width: canvasWidth,
    height: canvasHeight,
    draggable: true,
    scaleX: 1,
    scaleY: 1,
    x: 0,
    y: 0
  }
  
  // Also call the component's reset method
  if (canvasRef.value) {
    canvasRef.value.resetView()
  }
}

// Shape update handler
const handleShapeUpdate = (shapeId, updates) => {
  // updates is already an object with x, y, etc.
  updateShape(shapeId, updates)
}

// Stage interaction handlers
const handleStageMouseDown = (e) => {
  isDragging.value = true
  const pos = e.evt
  lastPointerPosition.value = { x: pos.clientX, y: pos.clientY }
}

const handleStageMouseMove = (e) => {
  if (!isDragging.value) return
  
  const pos = e.evt
  const dx = pos.clientX - lastPointerPosition.value.x
  const dy = pos.clientY - lastPointerPosition.value.y
  
  stageConfig.value.x += dx
  stageConfig.value.y += dy
  
  lastPointerPosition.value = { x: pos.clientX, y: pos.clientY }
}

const handleStageMouseUp = () => {
  isDragging.value = false
}

// Keyboard shortcuts
const handleKeyDown = async (e) => {
  if (e.key === 'Delete' && selectedShapeId.value) {
    const success = await deleteSelectedShape()
    if (success && canvasRef.value) {
      // Force refresh the canvas to ensure deleted shape is removed
      canvasRef.value.forceRefresh()
    }
  }
}

// Lifecycle
onMounted(async () => {
  window.addEventListener('keydown', handleKeyDown)
  
  // Load shapes from database
  try {
    await loadShapesFromDatabase()
    console.log('Shapes loaded from database:', { 
      rectangles: rectangles.value.length, 
      circles: circles.value.length, 
      texts: texts.value.length 
    })
  } catch (error) {
    console.error('Failed to load shapes from database:', error)
    // Add some initial shapes for testing if database load fails
    nextTick(async () => {
      console.log('Adding initial shapes...')
      await addRectangle()
      await addCircle()
      await addText()
      console.log('Shapes added:', { 
        rectangles: rectangles.value.length, 
        circles: circles.value.length, 
        texts: texts.value.length 
      })
    })
  }
  
  // Start real-time sync - TEMPORARILY DISABLED
  // try {
  //   await startRealtimeSync()
  //   console.log('Real-time sync started')
  // } catch (error) {
  //   console.error('Failed to start real-time sync:', error)
  // }
})

// Cleanup
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  // stopRealtimeSync() - TEMPORARILY DISABLED
})
</script>

<style scoped>
/* Ensure the canvas container is properly sized */
canvas {
  display: block;
}
</style>
