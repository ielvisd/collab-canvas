<template>
  <AppLayout>
    <div class="h-full w-full bg-gray-100 flex flex-col sm:flex-row">
      <!-- Presence Sidebar - Hidden on mobile, shown as overlay -->
      <PresenceSidebar class="hidden sm:block" />
      
      <!-- Mobile Presence Toggle Button -->
      <UButton
        v-if="!showMobilePresence"
        class="fixed top-20 right-4 z-40 sm:hidden"
        size="sm"
        color="primary"
        icon="i-heroicons-users"
        @click="showMobilePresence = true"
      >
        Users
      </UButton>
      
      <!-- Mobile Presence Overlay -->
      <div
        v-if="showMobilePresence"
        class="fixed inset-0 z-50 bg-black bg-opacity-50 sm:hidden"
        @click="showMobilePresence = false"
      >
        <div class="absolute right-0 top-0 h-full w-80 bg-white shadow-xl" @click.stop>
          <div class="p-4 border-b">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">Online Users</h3>
              <UButton
                variant="ghost"
                size="sm"
                icon="i-heroicons-x-mark"
                @click="showMobilePresence = false"
              />
            </div>
          </div>
          <PresenceSidebar class="block" />
        </div>
      </div>
      
      <!-- Main Canvas Area -->
      <div class="flex-1 flex flex-col relative">
    <!-- Toolbar -->
    <div data-testid="canvas-toolbar" class="absolute left-1/2 transform -translate-x-1/2 z-50 bg-white rounded-lg shadow-lg p-2 sm:p-4" :style="{ top: isMobile ? 'calc(var(--ui-header-height, 4rem) + 0.5rem)' : 'calc(var(--ui-header-height, 4rem) + 1rem)' }">
      <div class="flex flex-wrap gap-1 sm:gap-2 items-center justify-center">
        <!-- Shape Creation Buttons -->
        <div class="flex gap-1 sm:gap-2">
          <UTooltip text="Add a rectangle (R)">
            <UButton 
              data-testid="add-rectangle-btn" 
              color="primary" 
              :size="isMobile ? 'xs' : 'sm'"
              :loading="saving"
              :disabled="loading || saving"
              @click="addRectangle"
            >
              <UIcon name="i-heroicons-square-3-stack-3d" :class="isMobile ? 'w-3 h-3' : 'w-4 h-4 mr-1'" />
              <span class="hidden sm:inline">Rectangle</span>
            </UButton>
          </UTooltip>
          <UTooltip text="Add a circle (C)">
            <UButton 
              data-testid="add-circle-btn" 
              color="primary" 
              :size="isMobile ? 'xs' : 'sm'"
              :loading="saving"
              :disabled="loading || saving"
              @click="addCircle"
            >
              <UIcon name="i-heroicons-circle-stack" :class="isMobile ? 'w-3 h-3' : 'w-4 h-4 mr-1'" />
              <span class="hidden sm:inline">Circle</span>
            </UButton>
          </UTooltip>
          <UTooltip text="Add text (T)">
            <UButton 
              data-testid="add-text-btn" 
              color="primary" 
              :size="isMobile ? 'xs' : 'sm'"
              :loading="saving"
              :disabled="loading || saving"
              @click="addText"
            >
              <UIcon name="i-heroicons-document-text" :class="isMobile ? 'w-3 h-3' : 'w-4 h-4 mr-1'" />
              <span class="hidden sm:inline">Text</span>
            </UButton>
          </UTooltip>
        </div>
        
        <!-- Color Picker -->
        <div class="flex items-center gap-1 sm:gap-2 border-l border-gray-200 pl-1 sm:pl-2">
          <label class="text-xs sm:text-sm font-medium text-gray-700 hidden sm:inline">Color:</label>
          <input 
            v-model="selectedColor"
            data-testid="color-picker" 
            type="color"
            :class="isMobile ? 'w-6 h-6' : 'w-8 h-8'"
            class="rounded border border-gray-300 cursor-pointer" 
            title="Select shape color"
            :disabled="!selectedShapeId"
            @input="applyColorToSelected"
          >
        </div>
        
        <!-- Rotation Controls -->
        <div v-if="selectedShapeId" class="flex items-center gap-1 sm:gap-2 border-l border-gray-200 pl-1 sm:pl-2">
          <label class="text-xs sm:text-sm font-medium text-gray-700 hidden sm:inline">Rotate:</label>
          <UButton 
            data-testid="rotate-left-btn"
            :size="isMobile ? '2xs' : 'xs'"
            variant="outline" 
            :disabled="!selectedShapeId"
            @click="rotateSelected(-45)"
          >
            <span class="hidden sm:inline">↶ -45°</span>
            <span class="sm:hidden">↶</span>
          </UButton>
          <UButton 
            data-testid="rotate-right-btn"
            :size="isMobile ? '2xs' : 'xs'"
            variant="outline" 
            :disabled="!selectedShapeId"
            @click="rotateSelected(45)"
          >
            <span class="hidden sm:inline">↷ +45°</span>
            <span class="sm:hidden">↷</span>
          </UButton>
        </div>
        
        <!-- Auto-save Toggle -->
        <div class="flex items-center gap-1 sm:gap-2 border-l border-gray-200 pl-1 sm:pl-2">
          <USwitch 
            v-model="autoSave" 
            :size="isMobile ? 'xs' : 'sm'"
            :label="isMobile ? undefined : 'Auto-save'"
            @update:model-value="setAutoSave"
          />
        </div>
        
        <!-- Help Button -->
        <div class="flex items-center gap-1 sm:gap-2 border-l border-gray-200 pl-1 sm:pl-2">
          <UTooltip text="Keyboard shortcuts help">
            <UButton 
              data-testid="help-btn"
              color="gray" 
              variant="ghost" 
              :size="isMobile ? 'xs' : 'sm'"
              @click="showHelpModal = true"
            >
              <UIcon name="i-heroicons-question-mark-circle" :class="isMobile ? 'w-3 h-3' : 'w-4 h-4'" />
            </UButton>
          </UTooltip>
        </div>
        
        <!-- Action Buttons -->
        <div class="flex gap-1 sm:gap-2 border-l border-gray-200 pl-1 sm:pl-2">
          <UTooltip text="Delete selected shape (Delete key)">
            <UButton 
              data-testid="delete-selected-btn"
              color="red" 
              variant="outline" 
              :size="isMobile ? 'xs' : 'sm'"
              :disabled="!selectedShapeId || loading || saving"
              :loading="saving"
              class="font-semibold text-red-700 border-red-700 hover:bg-red-50"
              @click="handleDeleteSelected"
            >
              <UIcon name="i-heroicons-trash" :class="isMobile ? 'w-3 h-3' : 'w-4 h-4 mr-1'" />
              <span class="hidden sm:inline">Delete</span>
            </UButton>
          </UTooltip>
          <UTooltip text="Clear all shapes from canvas">
            <UButton 
              data-testid="clear-all-btn" 
              color="red" 
              variant="outline" 
              :size="isMobile ? 'xs' : 'sm'"
              :disabled="loading || saving"
              :loading="saving"
              class="font-semibold text-red-700 border-red-700 hover:bg-red-50"
              @click="clearCanvas"
            >
              <UIcon name="i-heroicons-x-mark" :class="isMobile ? 'w-3 h-3' : 'w-4 h-4 mr-1'" />
              <span class="hidden sm:inline">Clear All</span>
            </UButton>
          </UTooltip>
          <UTooltip text="Reset zoom and position (Home key)">
            <UButton 
              data-testid="reset-view-btn" 
              color="gray" 
              variant="outline" 
              :size="isMobile ? 'xs' : 'sm'"
              class="font-semibold text-gray-700 border-gray-700 hover:bg-gray-50"
              @click="resetView"
            >
              <UIcon name="i-heroicons-home" :class="isMobile ? 'w-3 h-3' : 'w-4 h-4 mr-1'" />
              <span class="hidden sm:inline">Reset View</span>
            </UButton>
          </UTooltip>
          <UTooltip text="Add 50 random shapes for performance testing">
            <UButton 
              data-testid="add-many-shapes-btn" 
              color="blue" 
              variant="outline" 
              :size="isMobile ? 'xs' : 'sm'"
              @click="addManyShapes"
            >
              <UIcon name="i-heroicons-plus" :class="isMobile ? 'w-3 h-3' : 'w-4 h-4 mr-1'" />
              <span class="hidden sm:inline">Add 50 Shapes</span>
            </UButton>
          </UTooltip>
        </div>
      </div>
    </div>

    <!-- Canvas Container -->
    <div class="w-full h-full flex items-center justify-center relative p-2 sm:p-4">
      <div 
        ref="canvasContainer"
        data-testid="canvas-container" 
        class="border-2 border-gray-300 rounded-lg shadow-lg bg-white relative"
        :style="{ 
          width: isMobile ? Math.min(canvasWidth, (typeof window !== 'undefined' ? window.innerWidth : 800) - 32) + 'px' : canvasWidth + 'px', 
          height: isMobile ? Math.min(canvasHeight, (typeof window !== 'undefined' ? window.innerHeight : 600) - 200) + 'px' : canvasHeight + 'px' 
        }"
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
        
        <!-- Cursor Overlay -->
        <CursorOverlay />
      </div>
    </div>

    <!-- Debug Info -->
    <div data-testid="debug-info" class="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 z-10 bg-white rounded-lg shadow-lg p-2 sm:p-4 max-w-xs sm:max-w-none">
      <div :class="isMobile ? 'text-xs text-gray-800 font-medium' : 'text-sm text-gray-800 font-medium'">
        <div class="flex flex-wrap gap-2 sm:gap-4">
          <div>Shapes: {{ totalShapes }}</div>
          <div>Zoom: {{ Math.round(zoom * 100) }}%</div>
        </div>
        <div v-if="!isMobile" class="mt-1">
          <div>Selected: {{ selectedShapeId || 'None' }}</div>
          <div>Position: ({{ Math.round(stageConfig.x) }}, {{ Math.round(stageConfig.y) }})</div>
          <div>Bounds: X:[-2000,2000] Y:[-2000,2000]</div>
          <div>Auto-save: {{ autoSave ? 'ON' : 'OFF' }}</div>
        </div>
        <div class="flex items-center gap-1 mt-1">
          <div class="w-2 h-2 rounded-full" :class="isRealtimeConnected ? 'bg-green-500' : 'bg-red-500'"/>
          <span :class="isMobile ? 'text-xs' : 'text-sm'">Real-time: {{ isRealtimeConnected ? 'Connected' : 'Disconnected' }}</span>
        </div>
        <div v-if="lastSyncTime && !isMobile" class="text-xs text-gray-500">
          Last sync: {{ lastSyncTime.toLocaleTimeString() }}
        </div>
        <div v-if="loading" :class="isMobile ? 'text-xs text-blue-600 font-semibold' : 'text-sm text-blue-600 font-semibold'">Loading...</div>
        <div v-if="saving" :class="isMobile ? 'text-xs text-yellow-600 font-semibold' : 'text-sm text-yellow-600 font-semibold'">Saving...</div>
        <div v-if="error" :class="isMobile ? 'text-xs text-red-600 font-semibold' : 'text-sm text-red-600 font-semibold'">Error: {{ error }}</div>
      </div>
    </div>

    <!-- Notifications -->
    <UNotifications />
    
    <!-- Loading Overlay -->
    <div v-if="loading" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 flex items-center gap-4">
        <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin text-blue-600" />
        <span class="text-lg font-medium">Loading canvas...</span>
      </div>
    </div>
    
    <!-- Saving Overlay -->
    <div v-if="saving" class="fixed top-4 right-4 bg-white rounded-lg shadow-lg p-4 flex items-center gap-3 z-50">
      <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin text-yellow-600" />
      <span class="text-sm font-medium text-gray-700">Saving changes...</span>
    </div>
    
    <!-- Error Toast -->
    <UAlert
      v-if="error"
      color="red"
      variant="soft"
      title="Error"
      :description="error"
      class="fixed top-4 right-4 z-50 max-w-md"
      @close="clearError"
    />
    
    <!-- Help Modal -->
    <UModal v-model="showHelpModal" title="Keyboard Shortcuts">
      <template #content>
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <h4 class="font-medium text-gray-900">Shape Creation</h4>
              <div class="space-y-1 text-sm text-gray-600">
                <div class="flex justify-between">
                  <span>Rectangle</span>
                  <UKbd>R</UKbd>
                </div>
                <div class="flex justify-between">
                  <span>Circle</span>
                  <UKbd>C</UKbd>
                </div>
                <div class="flex justify-between">
                  <span>Text</span>
                  <UKbd>T</UKbd>
                </div>
              </div>
            </div>
            
            <div class="space-y-2">
              <h4 class="font-medium text-gray-900">Actions</h4>
              <div class="space-y-1 text-sm text-gray-600">
                <div class="flex justify-between">
                  <span>Delete Selected</span>
                  <UKbd>Delete</UKbd>
                </div>
                <div class="flex justify-between">
                  <span>Deselect</span>
                  <UKbd>Esc</UKbd>
                </div>
                <div class="flex justify-between">
                  <span>Reset View</span>
                  <UKbd>Home</UKbd>
                </div>
              </div>
            </div>
          </div>
          
          <div class="border-t pt-4">
            <h4 class="font-medium text-gray-900 mb-2">Canvas Controls</h4>
            <div class="text-sm text-gray-600 space-y-1">
              <div>• <strong>Pan:</strong> Click and drag on empty canvas</div>
              <div>• <strong>Zoom:</strong> Mouse wheel or pinch gesture</div>
              <div>• <strong>Select:</strong> Click on shapes</div>
              <div>• <strong>Resize:</strong> Drag the corner handles of selected shapes</div>
              <div>• <strong>Rotate:</strong> Use the rotation buttons in the toolbar</div>
            </div>
          </div>
        </div>
      </template>
    </UModal>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useShapesWithPersistence } from '~/composables/useShapesWithPersistence'

// Define page meta
definePageMeta({
  middleware: 'auth'
})

// Auth composable for user info
// const { } = useAuth()

// Presence composable
const { stopPresence } = usePresence()

// Cursor tracking composable
const { startTracking: startCursorTracking, stopTracking: stopCursorTracking } = useCursorTracking()

// Canvas dimensions
const canvasWidth = 800
const canvasHeight = 600

// Mobile detection
const isMobile = ref(false)
const showMobilePresence = ref(false)

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
const showHelpModal = ref(false)

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
  console.log('Canvas handleShapeUpdate called for:', shapeId, 'with updates:', updates)
  updateShape(shapeId, updates)
  console.log('Canvas updateShape called')
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
  // Prevent shortcuts when typing in input fields
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
    return
  }
  
  switch (e.key) {
    case 'Delete':
    case 'Backspace':
      if (selectedShapeId.value) {
        e.preventDefault()
        const success = await deleteSelectedShape()
        if (success && canvasRef.value) {
          canvasRef.value.forceRefresh()
        }
      }
      break
    case 'Escape':
      e.preventDefault()
      // Deselect current shape
      if (selectedShapeId.value) {
        selectShape(null)
      }
      break
    case 'r':
    case 'R':
      if (!e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        await addRectangle()
      }
      break
    case 'c':
    case 'C':
      if (!e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        await addCircle()
      }
      break
    case 't':
    case 'T':
      if (!e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        await addText()
      }
      break
    case 'Home':
      e.preventDefault()
      resetView()
      break
    case 'a':
    case 'A':
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        // Select all shapes (if we implement this feature)
        console.log('Select all shapes')
      }
      break
    case 's':
    case 'S':
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        // Manual save (if we implement this feature)
        console.log('Manual save')
      }
      break
  }
}

// Mobile detection function
const checkMobile = () => {
  isMobile.value = window.innerWidth < 640 // sm breakpoint
}

// Lifecycle
onMounted(async () => {
  // Check mobile on mount and resize
  checkMobile()
  window.addEventListener('resize', checkMobile)
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
  
  // Start real-time sync
  try {
    await startRealtimeSync()
    console.log('Real-time sync started')
  } catch (error) {
    console.error('Failed to start real-time sync:', error)
  }
  
  // Presence tracking will auto-start when user is authenticated
  console.log('Presence tracking will auto-start when user is authenticated')
  
  // Start cursor tracking
  try {
    startCursorTracking()
    console.log('Cursor tracking started')
  } catch (error) {
    console.error('Failed to start cursor tracking:', error)
  }
})

// Cleanup
onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
  window.removeEventListener('keydown', handleKeyDown)
  stopRealtimeSync()
  stopPresence()
  stopCursorTracking()
})
</script>

<style scoped>
/* Ensure the canvas container is properly sized */
canvas {
  display: block;
}
</style>
