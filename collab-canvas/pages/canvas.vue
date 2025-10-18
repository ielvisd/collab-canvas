<template>
  <AppLayout>
    <div class="h-full w-full bg-gradient-to-br from-blue-50 to-purple-50 flex flex-col">
      <!-- Single Unified Header -->
      <div class="bg-black/90 backdrop-blur-sm border-b-2 border-pink-500 p-3 sm:p-4 shadow-lg">
        <div class="flex items-center justify-between">
          <!-- Left: Logo and Branding -->
          <div class="flex items-center gap-2 sm:gap-3">
            <h1 class="text-xl sm:text-2xl lg:text-3xl font-bold text-white font-display">EmojiKai 🎨</h1>
            <!-- Status Badges (will trigger toasts on change) -->
            <div class="hidden sm:flex items-center gap-2 text-xs sm:text-sm text-pink-300 font-body">
              <UBadge 
                :color="isConnected ? 'success' : 'error'"
                variant="subtle"
                size="sm"
                class="animate-pulse"
              >
                <UIcon name="i-heroicons-signal" class="w-3 h-3 mr-1" />
                {{ isConnected ? 'Live Sync' : 'Offline' }}
              </UBadge>
              <UBadge 
                color="primary"
                variant="subtle"
                size="sm"
                class="animate-pulse"
              >
                <UIcon name="i-heroicons-sparkles" class="w-3 h-3 mr-1" />
                AI Ready
              </UBadge>
            </div>
          </div>
          
          <!-- Right: User Controls -->
          <div class="flex items-center gap-2">
            <!-- Mobile Tool Button -->
            <UButton
              v-if="isMobile"
              icon="i-lucide-palette"
              color="primary"
              variant="solid"
              size="sm"
              class="sm:hidden"
              @click="openToolPalette"
            />
            
            <!-- AI Chat Button -->
            <UButton
              icon="i-heroicons-sparkles"
              :label="isMobile ? '' : 'AI'"
              color="primary"
              variant="outline"
              size="sm"
              class="font-body border-pink-400 text-pink-300 hover:bg-pink-500/10"
              @click="showAIChat = !showAIChat"
            />
            
            <!-- Users Button -->
            <UButton
              icon="i-lucide-users"
              :label="isMobile ? '' : 'Users'"
              color="neutral"
              variant="outline"
              size="sm"
              class="font-body border-pink-400 text-pink-300 hover:bg-pink-500/10"
              @click="showPresence = !showPresence"
            />
          </div>
        </div>
      </div>
      
      <!-- Main Content -->
      <div class="flex-1 flex relative">
        <!-- Canvas Area -->
        <div class="flex-1 flex items-center justify-center p-2 sm:p-4 canvas-container">
          <div 
            ref="canvasContainer"
            class="border-2 border-pink-500 rounded-xl shadow-lg bg-white relative overflow-hidden"
            :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }"
            :data-tool="currentTool"
            data-testid="canvas-container"
            @mousedown="handleCanvasMouseDown"
            @mousemove="handleCanvasMouseMove"
            @mouseup="handleCanvasMouseUp"
            @click="handleCanvasClick"
            @touchstart="handleCanvasTouchStart"
            @touchmove="handleCanvasTouchMove"
            @touchend="handleCanvasTouchEnd"
          >

            <!-- Emojis (First Class Citizens) -->
            <div
              v-for="emoji in emojis"
              :key="emoji.id"
              :class="[
                'emoji-item absolute cursor-pointer select-none transition-all duration-200',
                { 'selected': selectedEmojiId === emoji.id }
              ]"
              :style="{
                left: emoji.x + 'px',
                top: emoji.y + 'px',
                fontSize: emoji.size + 'px',
                zIndex: emoji.layer || 1,
                transform: `rotate(${emoji.rotation || 0}deg)`
              }"
              @mousedown.stop="startEmojiDrag($event, emoji.id)"
              @touchstart.stop="startEmojiTouch($event, emoji.id)"
              @dblclick="editEmoji(emoji.id)"
            >
              {{ emoji.emoji }}
            </div>

            <!-- Shapes (Secondary) -->
            <div
              v-for="shape in allShapes"
              :key="shape.id"
              :class="[
                'shape-item absolute cursor-pointer select-none',
                { 'selected': selectedShapeId === shape.id }
              ]"
              :style="{
                left: shape.x + 'px',
                top: shape.y + 'px',
                width: shape.type === 'circle' ? (shape as any).radius * 2 + 'px' : (shape as any).width + 'px',
                height: shape.type === 'circle' ? (shape as any).radius * 2 + 'px' : (shape as any).height + 'px',
                backgroundColor: shape.type === 'text' ? 'transparent' : shape.fill,
                border: shape.type === 'text' ? 'none' : `2px solid ${shape.stroke}`,
                borderRadius: shape.type === 'circle' ? '50%' : '4px',
                zIndex: 1,
                transform: `rotate(${shape.rotation || 0}deg)`
              }"
              @mousedown.stop="startShapeDrag($event, shape.id)"
              @touchstart.stop="startShapeTouch($event, shape.id)"
              @click.stop="selectShape(shape.id)"
            >
              <div v-if="shape.type === 'text'" class="text-sm font-body cursor-pointer select-none" :style="{ color: shape.fill }" @dblclick="startEditText(shape.id)">
                <input 
                  v-if="editingTextId === shape.id"
                  ref="textInput"
                  v-model="editingTextValue"
                  class="bg-transparent border-none outline-none text-sm font-body w-full"
                  :style="{ color: shape.fill }"
                  @blur="finishEditText"
                  @keydown.enter="finishEditText"
                  @keydown.escape="cancelEditText"
                >
                <span v-else>{{ shape.text }}</span>
              </div>
            </div>

            <!-- Rotation Handles -->
            <div
              v-if="(selectedEmojiId || selectedShapeId) && currentTool === 'select'"
              class="absolute pointer-events-none"
              :style="{
                left: (selectedEmojiId ? getEmojiById(selectedEmojiId)?.x : getSelectedShape()?.x) + 'px',
                top: (selectedEmojiId ? getEmojiById(selectedEmojiId)?.y : getSelectedShape()?.y) + 'px',
                width: (selectedEmojiId ? getEmojiById(selectedEmojiId)?.size : (getSelectedShape() as any)?.width || (getSelectedShape() as any)?.radius * 2 || 50) + 'px',
                height: (selectedEmojiId ? getEmojiById(selectedEmojiId)?.size : (getSelectedShape() as any)?.height || (getSelectedShape() as any)?.radius * 2 || 50) + 'px',
                zIndex: 1002
              }"
            >
              <!-- Rotation Handle -->
              <div
                class="absolute -top-8 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg cursor-pointer pointer-events-auto flex items-center justify-center"
                @mousedown.stop="startRotation"
                @touchstart.stop="(event: TouchEvent) => startRotation(event as any)"
              >
                <UIcon name="i-lucide-rotate-3d" class="w-3 h-3 text-white" />
              </div>
              
              <!-- Center Point -->
              <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full border border-white"/>
            </div>
          </div>
          
          <!-- Cursor Overlay for Real-time Collaboration -->
          <CursorOverlay />
        </div>
        
        <!-- Floating Tool Palette -->
        <ToolPalette
          ref="toolPaletteRef"
          :current-tool="currentTool"
          :selected-emoji-id="selectedEmojiId"
          :selected-shape-id="selectedShapeId"
          :rotation-angle="rotationAngle"
          :selected-shape-color="selectedShapeColor"
          :can-undo="canUndo"
          :can-redo="canRedo"
          :shape-menu-items="shapeMenuItems"
          @show-emoji-picker="showEmojiPicker = true"
          @set-tool="setTool"
          @rotation-change="handleRotationChange"
          @reset-rotation="resetRotation"
          @color-change="handleColorChange"
          @undo="undo"
          @redo="redo"
          @delete-selected="deleteSelectedItem"
          @clear-all="showClearAllModal = true"
          @reset-view="resetView"
        />
      </div>
      
      <!-- Users Slideover -->
      <USlideover 
        v-model:open="showPresence" 
        side="right"
        :ui="{ 
          overlay: 'fixed inset-0 bg-black/75',
          content: 'fixed bg-black/90 border-l-2 border-pink-500 shadow-2xl',
          header: 'bg-black/90 border-b-2 border-pink-500',
          title: 'text-lg font-display text-pink-300',
          body: 'bg-black/90'
        }"
      >
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-pink-300">Online Users</h3>
            <UButton
              icon="i-heroicons-x-mark"
              variant="ghost"
              size="sm"
              class="text-pink-300 hover:text-white"
              @click="showPresence = false"
            />
          </div>
        </template>
        
        <div class="p-4">
          <PresenceSidebar />
        </div>
      </USlideover>
      
      <!-- AI Chat Interface -->
      <AIChatInterface v-if="showAIChat" :show-chat="showAIChat" @update:show-chat="showAIChat = $event" />

      <!-- Emoji Picker Modal -->
      <EmojiPicker 
        v-model:open="showEmojiPicker" 
        @select="handleEmojiSelect" 
      />

    <!-- Clear All Confirmation Modal -->
    <UModal 
      v-model:open="showClearAllModal" 
      title="⚠️ Clear All Canvas" 
      :ui="{ 
        overlay: 'fixed inset-0 bg-black/75',
        content: 'fixed bg-black/90 border-2 border-red-500 rounded-xl shadow-2xl',
        header: 'bg-black/90 border-b-2 border-red-500',
        title: 'text-xl font-display text-red-300',
        body: 'bg-black/90',
        close: 'text-red-300 hover:text-white hover:bg-red-500/20'
      }"
    >
      <template #content>
        <div class="p-4 bg-black/90">
          <p class="text-red-100 mb-4">This action will permanently delete all emojis and shapes from the canvas. This action cannot be undone.</p>
          <div class="flex gap-2 justify-end">
            <UButton 
              label="Cancel" 
              color="neutral" 
              variant="outline" 
              @click="showClearAllModal = false"
            />
            <UButton 
              label="Clear All" 
              color="error" 
              variant="solid" 
              @click="confirmClearAll"
            />
          </div>
        </div>
      </template>
    </UModal>

    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick, onScopeDispose, watch } from 'vue'

// Composables
import { useEmojis } from '~/composables/useEmojis'
import { useShapesWithPersistence } from '~/composables/useShapesWithPersistence'
import { useCursorTracking } from '~/composables/useCursorTracking'
import { useRealtimeSync } from '~/composables/useRealtimeSync'
import { useUndoRedo } from '~/composables/useUndoRedo'
import { useToast } from '#imports'

// Utility function for random colors
const getRandomColor = () => {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8']
  return colors[Math.floor(Math.random() * colors.length)]
}

// Auth middleware
definePageMeta({
  middleware: 'auth'
})

// Toast for status notifications
const toast = useToast()

// Mobile detection
const isMobile = ref(false)
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

// Responsive canvas dimensions
const canvasWidth = computed(() => {
  if (isMobile.value) {
    return Math.min(window.innerWidth - 32, 400) // Mobile: full width minus padding
  } else if (window.innerWidth < 1024) {
    return Math.min(window.innerWidth * 0.8, 800) // Tablet: 80% of width
  }
  return 1000 // Desktop: fixed width
})

const canvasHeight = computed(() => {
  if (isMobile.value) {
    return Math.min(window.innerHeight - 200, 300) // Mobile: height minus header and safe areas
  } else if (window.innerWidth < 1024) {
    return Math.min(window.innerHeight * 0.6, 600) // Tablet: 60% of height
  }
  return 700 // Desktop: fixed height
})

// State
const showPresence = ref(false)
const showAIChat = ref(false)
const showEmojiPicker = ref(false)
const showClearAllModal = ref(false)
const currentTool = ref<'select'>('select')
const selectedEmojiId = ref<string | null>(null)
const selectedShapeId = ref<string | null>(null)
const rotationAngle = ref(0)
const isRotating = ref(false)
const selectedShapeColor = ref('#3B82F6')
const editingTextId = ref<string | null>(null)
const editingTextValue = ref('')
const isConnected = ref(true) // Connection status for toasts

// Canvas refs
const canvasContainer = ref<HTMLElement | null>(null)
const textInput = ref<HTMLInputElement | null>(null)
const toolPaletteRef = ref<{ openDrawer: () => void } | null>(null)

// Drag state
const pendingDragShapeId = ref<string | null>(null)
const pendingDragEmojiId = ref<string | null>(null)
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const originalPosition = ref({ x: 0, y: 0 })

// Emoji system
const {
  emojis,
  addEmoji: addEmojiToCanvas,
  updateEmoji,
  clearAllEmojis,
  getEmojiById,
  deleteEmoji,
  initializeEmojis
} = useEmojis(canvasWidth.value, canvasHeight.value)

// Shape system for AI-created shapes
const {
  rectangles,
  circles,
  texts,
  loadShapesFromDatabase,
  addRectangle: addRectangleToCanvas,
  addCircle: addCircleToCanvas,
  addText: addTextToCanvas,
  updateShape,
  deleteShape,
  startDrag: startShapeDragOperation,
  endDrag: endShapeDragOperation
} = useShapesWithPersistence()

// Cursor tracking for real-time collaboration
const { startTracking: startCursorTracking, stopTracking: stopCursorTracking } = useCursorTracking()

// Real-time sync for shape changes
const { startSync: startRealtimeSync, cleanup: cleanupRealtimeSync } = useRealtimeSync(
  rectangles,
  circles,
  texts,
  (type, shape) => {
    console.log(`🔄 Real-time ${type}:`, shape)
  }
)

// Undo/Redo functionality
const { canUndo, canRedo, undo: undoAction, redo: redoAction, loadHistory } = useUndoRedo()

// Wrapper functions for click handlers
const undo = async () => {
  await undoAction()
}

const redo = async () => {
  await redoAction()
}

// Mobile tool palette control
const openToolPalette = () => {
  if (toolPaletteRef.value) {
    toolPaletteRef.value.openDrawer()
  }
}

// Touch event handlers for mobile
function handleCanvasTouchStart(event: TouchEvent) {
  if (event.touches.length === 1) {
    const touch = event.touches[0]
    if (touch) {
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY,
        button: 0
      })
      handleCanvasMouseDown(mouseEvent)
    }
  }
}

function handleCanvasTouchMove(event: TouchEvent) {
  if (event.touches.length === 1) {
    const touch = event.touches[0]
    if (touch) {
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      })
      handleCanvasMouseMove(mouseEvent)
    }
  }
}

function handleCanvasTouchEnd() {
  handleCanvasMouseUp()
}

// Touch handlers for emojis and shapes
function startEmojiTouch(event: TouchEvent, emojiId: string) {
  if (event.touches.length === 1) {
    const touch = event.touches[0]
    if (touch) {
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY,
        button: 0
      })
      startEmojiDrag(mouseEvent, emojiId)
    }
  }
}

function startShapeTouch(event: TouchEvent, shapeId: string) {
  if (event.touches.length === 1) {
    const touch = event.touches[0]
    if (touch) {
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY,
        button: 0
      })
      startShapeDrag(mouseEvent, shapeId)
    }
  }
}

// Status change watchers for toasts
watch(isConnected, (newValue, oldValue) => {
  if (oldValue !== undefined) { // Don't show toast on initial load
    toast.add({
      title: newValue ? 'Connected' : 'Disconnected',
      description: newValue ? 'Live sync is active' : 'Connection lost',
      color: newValue ? 'success' : 'error',
      icon: newValue ? 'i-heroicons-check-circle' : 'i-heroicons-exclamation-triangle'
    })
  }
})

// Load shapes when page mounts
onMounted(async () => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  
  await loadShapesFromDatabase()
  await initializeEmojis()
  
  // Load undo/redo history
  await loadHistory()
  
  // Start real-time collaboration features
  await startRealtimeSync()
  startCursorTracking()
})


// Computed - All shapes combined for rendering (excluding emoji text shapes)
const allShapes = computed(() => {
  // Filter out text shapes that are emojis to prevent duplication
  const nonEmojiTexts = texts.value.filter(text => {
    // Check if this text shape is an emoji by looking at the text content
    const textContent = text.text || ''
    // If it's a single character and matches emoji pattern, it's an emoji
    if (textContent.length === 1 && /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(textContent)) {
      return false // Exclude emoji text shapes
    }
    return true // Include regular text shapes
  })
  
  return [
    ...rectangles.value,
    ...circles.value,
    ...nonEmojiTexts
  ]
})

// Shape menu items
const shapeMenuItems = computed(() => [
  [{
    label: 'Basic Shapes',
    type: 'label'
  }],
  [{
    label: 'Rectangle',
    icon: 'i-heroicons-square-3-stack-3d',
    onSelect: () => addRectangle()
  }, {
    label: 'Circle',
    icon: 'i-heroicons-circle-stack',
    onSelect: () => addCircle()
  }, {
    label: 'Text',
    icon: 'i-heroicons-document-text',
    onSelect: () => addText()
  }]
])

// Tool functions
function setTool(tool: string) {
  if (tool === 'select') {
    currentTool.value = tool
    selectedEmojiId.value = null
    selectedShapeId.value = null
  }
}

// Emoji functions
async function addEmoji(emojiChar: string) {
  const emojiData = {
    emoji: emojiChar,
    x: Math.random() * (canvasWidth.value - 100),
    y: Math.random() * (canvasHeight.value - 100),
    size: 48,
    layer: 1,
    rotation: 0
  }
  
  await addEmojiToCanvas(emojiData)
  showEmojiPicker.value = false
}

function handleEmojiSelect(emoji: string) {
  if (emoji) {
    addEmoji(emoji)
  }
}

// Drag functions
function startEmojiDrag(event: MouseEvent, emojiId: string) {
  // Always select the emoji first
  selectedEmojiId.value = emojiId
  selectedShapeId.value = null
  updateRotationFromSelection()
  
  // Only prepare for dragging if select tool is active
  if (currentTool.value === 'select') {
    // Don't start dragging immediately - wait for mouse movement
    const emoji = getEmojiById(emojiId)
    if (emoji) {
      originalPosition.value = { x: emoji.x, y: emoji.y }
      dragStart.value = { x: event.clientX, y: event.clientY }
      // Store the emoji ID for potential dragging
      pendingDragEmojiId.value = emojiId
    }
  }
}

function startShapeDrag(event: MouseEvent, shapeId: string) {
  // Always select the shape first
  selectedShapeId.value = shapeId
  selectedEmojiId.value = null
  updateRotationFromSelection()
  
  // Only prepare for dragging if select tool is active
  if (currentTool.value === 'select') {
    // Don't start dragging immediately - wait for mouse movement
    const allShapesArray = allShapes.value
      const shape = allShapesArray.find(s => s.id === shapeId) as any
    
    if (shape) {
      originalPosition.value = { x: shape.x, y: shape.y }
      dragStart.value = { x: event.clientX, y: event.clientY }
      // Store the shape ID for potential dragging
      pendingDragShapeId.value = shapeId
    }
  }
}

function handleDrag(event: MouseEvent) {
  if (isDragging.value) {
    const deltaX = event.clientX - dragStart.value.x
    const deltaY = event.clientY - dragStart.value.y
    
    // Handle emoji dragging
    if (selectedEmojiId.value) {
      const emoji = getEmojiById(selectedEmojiId.value)
      if (emoji) {
        emoji.x = originalPosition.value.x + deltaX
        emoji.y = originalPosition.value.y + deltaY
      }
    }
    
    // Handle shape dragging
  if (selectedShapeId.value) {
      const allShapesArray = allShapes.value
      const shape = allShapesArray.find(s => s.id === selectedShapeId.value)
      if (shape) {
        shape.x = originalPosition.value.x + deltaX
        shape.y = originalPosition.value.y + deltaY
      }
    }
  }
}

async function endDrag() {
  if (isDragging.value) {
    // Handle emoji drag end
    if (selectedEmojiId.value) {
      const emoji = getEmojiById(selectedEmojiId.value)
      if (emoji) {
        await updateEmoji(selectedEmojiId.value, {
          x: emoji.x,
          y: emoji.y
        })
      }
    }
    
    // Handle shape drag end - persist position changes to database
    if (selectedShapeId.value) {
      const allShapesArray = allShapes.value
      const shape = allShapesArray.find(s => s.id === selectedShapeId.value)
      if (shape) {
        try {
          // End drag operation for undo/redo batching
          await endShapeDragOperation(selectedShapeId.value)
          
          await updateShape(selectedShapeId.value, {
            x: shape.x,
            y: shape.y
          })
        } catch (error) {
          console.error('❌ Error updating shape position:', error)
        }
      }
    }
    
    isDragging.value = false
    selectedEmojiId.value = null
    selectedShapeId.value = null
  }
}

// Shape functions
async function addRectangle() {
  await addRectangleToCanvas({
    x: Math.random() * (canvasWidth.value - 100),
    y: Math.random() * (canvasHeight.value - 100),
    width: 100,
    height: 60,
    fill: getRandomColor(),
    stroke: '#000',
    rotation: 0
  })
}

async function addCircle() {
  await addCircleToCanvas({
    x: Math.random() * (canvasWidth.value - 100),
    y: Math.random() * (canvasHeight.value - 100),
    radius: 30,
    fill: getRandomColor(),
    stroke: '#000',
    rotation: 0
  })
}

async function addText() {
  await addTextToCanvas({
    x: Math.random() * (canvasWidth.value - 100),
    y: Math.random() * (canvasHeight.value - 100),
    text: 'hola! 👋',
    fontSize: 16,
    fill: getRandomColor(),
    stroke: '#000',
    rotation: 0
  })
}

function selectShape(shapeId: string) {
  selectedShapeId.value = shapeId
  selectedEmojiId.value = null
  updateRotationFromSelection()
  updateColorFromSelection()
}


// Canvas mouse handlers
function handleCanvasClick(event: MouseEvent) {
  // Only deselect if clicking on empty canvas space (not on an emoji or shape)
  if (event.target === canvasContainer.value) {
    selectedEmojiId.value = null
    selectedShapeId.value = null
    rotationAngle.value = 0
  }
}

function handleCanvasMouseDown(_event: MouseEvent) {
  // Canvas mouse down handler - currently no specific functionality
}

function handleCanvasMouseMove(event: MouseEvent) {
  if (isDragging.value) {
    handleDrag(event)
  } else if (pendingDragShapeId.value && currentTool.value === 'select') {
    // Start dragging when mouse actually moves
    const distance = Math.sqrt(
      Math.pow(event.clientX - dragStart.value.x, 2) + 
      Math.pow(event.clientY - dragStart.value.y, 2)
    )
    
    if (distance > 5) { // Minimum distance threshold to start dragging
      isDragging.value = true
      selectedShapeId.value = pendingDragShapeId.value
      startShapeDragOperation(pendingDragShapeId.value) // Start drag operation for undo/redo batching
      pendingDragShapeId.value = null
    }
  } else if (pendingDragEmojiId.value && currentTool.value === 'select') {
    // Start dragging emoji when mouse actually moves
    const distance = Math.sqrt(
      Math.pow(event.clientX - dragStart.value.x, 2) + 
      Math.pow(event.clientY - dragStart.value.y, 2)
    )
    
    if (distance > 5) { // Minimum distance threshold to start dragging
      isDragging.value = true
      selectedEmojiId.value = pendingDragEmojiId.value
      pendingDragEmojiId.value = null
    }
  }
}

function handleCanvasMouseUp() {
  if (isDragging.value) {
    endDrag()
  }
  
  // Clear pending drag state
  pendingDragShapeId.value = null
  pendingDragEmojiId.value = null
}



async function clearCanvas() {
  await clearAllEmojis()
  rectangles.value = []
  circles.value = []
  texts.value = []
  selectedEmojiId.value = null
  selectedShapeId.value = null
}

async function confirmClearAll() {
  await clearCanvas()
  showClearAllModal.value = false
}

function resetView() {
  // Reset view logic here
  console.log('Reset view')
}

function editEmoji(id: string) {
  // Cycle through sizes
  const emoji = getEmojiById(id)
  if (emoji) {
    const newSize = emoji.size === 32 ? 48 : emoji.size === 48 ? 64 : 32
    updateEmoji(id, { size: newSize })
  }
}

function startEditText(shapeId: string) {
  const shape = allShapes.value.find(s => s.id === shapeId)
  if (shape && shape.type === 'text') {
    const textShape = shape as { text: string }
    editingTextId.value = shapeId
    editingTextValue.value = textShape.text
    
    // Focus the input after the next tick to ensure it's rendered
    nextTick(() => {
      textInput.value?.focus()
      textInput.value?.select()
    })
  }
}

function finishEditText() {
  if (editingTextId.value && editingTextValue.value.trim() !== '') {
    updateShape(editingTextId.value, { text: editingTextValue.value.trim() } as any)
  }
  editingTextId.value = null
  editingTextValue.value = ''
}

function cancelEditText() {
  editingTextId.value = null
  editingTextValue.value = ''
}

// Rotation functions
function handleRotationChange(angle: number | undefined) {
  if (angle === undefined) return
  
  rotationAngle.value = angle
  
  // Update emoji rotation
  if (selectedEmojiId.value) {
    const emoji = getEmojiById(selectedEmojiId.value)
    if (emoji) {
      emoji.rotation = angle
      updateEmoji(selectedEmojiId.value, { rotation: angle })
    }
  }
  
  // Update shape rotation
  if (selectedShapeId.value) {
    const allShapesArray = allShapes.value
    const shape = allShapesArray.find(s => s.id === selectedShapeId.value)
    if (shape) {
      shape.rotation = angle
      // Persist rotation to database
      updateShape(selectedShapeId.value, { rotation: angle })
    }
  }
}

function resetRotation() {
  rotationAngle.value = 0
  handleRotationChange(0)
}

async function deleteSelectedItem() {
  if (selectedEmojiId.value) {
    await deleteEmoji(selectedEmojiId.value)
    selectedEmojiId.value = null
    rotationAngle.value = 0
  } else if (selectedShapeId.value) {
    await deleteShape(selectedShapeId.value)
    selectedShapeId.value = null
    rotationAngle.value = 0
  }
}

async function handleColorChange(color: string | undefined) {
  if (!color || !selectedShapeId.value) return
  
  selectedShapeColor.value = color
  
  // Update the selected shape's color using the persistent update function
  try {
    await updateShape(selectedShapeId.value, { fill: color })
  } catch (error) {
    console.error('❌ Error updating shape color:', error)
  }
}

function updateRotationFromSelection() {
  // Update rotation slider when selection changes
  if (selectedEmojiId.value) {
    const emoji = getEmojiById(selectedEmojiId.value)
    if (emoji) {
      rotationAngle.value = emoji.rotation || 0
    }
  } else if (selectedShapeId.value) {
    const allShapesArray = allShapes.value
    const shape = allShapesArray.find(s => s.id === selectedShapeId.value)
    if (shape) {
      rotationAngle.value = shape.rotation || 0
    }
  } else {
    rotationAngle.value = 0
  }
}

function updateColorFromSelection() {
  // Update color picker when selection changes
  if (selectedShapeId.value) {
    const allShapesArray = allShapes.value
    const shape = allShapesArray.find(s => s.id === selectedShapeId.value)
    if (shape && shape.fill) {
      selectedShapeColor.value = shape.fill
    }
  } else {
    selectedShapeColor.value = '#3B82F6' // Reset to default blue
  }
}

function getSelectedShape() {
  if (selectedShapeId.value) {
    const allShapesArray = allShapes.value
    return allShapesArray.find(s => s.id === selectedShapeId.value)
  }
  return null
}

function startRotation(event: MouseEvent) {
  isRotating.value = true
  const rect = (event.target as HTMLElement).getBoundingClientRect()
  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2
  
  const handleMouseMove = (e: MouseEvent) => {
    if (isRotating.value) {
      const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI)
      const normalizedAngle = (angle + 360) % 360
      handleRotationChange(Math.round(normalizedAngle))
    }
  }
  
  const handleMouseUp = () => {
    isRotating.value = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}


// Keyboard shortcuts
onMounted(() => {
  const handleKeyDown = async (event: KeyboardEvent) => {
    // AI chat toggle (Cmd/Ctrl + K)
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault()
      showAIChat.value = !showAIChat.value
    }
    
    // Undo (Cmd/Ctrl + Z)
    if ((event.metaKey || event.ctrlKey) && event.key === 'z' && !event.shiftKey) {
      event.preventDefault()
      if (canUndo.value) {
        await undoAction()
      }
    }
    
    // Redo (Cmd/Ctrl + Shift + Z or Cmd/Ctrl + Y)
    if (((event.metaKey || event.ctrlKey) && event.key === 'z' && event.shiftKey) || 
        ((event.metaKey || event.ctrlKey) && event.key === 'y')) {
      event.preventDefault()
      if (canRedo.value) {
        await redoAction()
      }
    }
    
    // Deselect all items (Escape key)
    if (event.key === 'Escape') {
      event.preventDefault()
      selectedEmojiId.value = null
      selectedShapeId.value = null
      rotationAngle.value = 0
    }
    
    // Delete selected item (Delete or Backspace key)
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault()
      if (selectedEmojiId.value) {
        await deleteEmoji(selectedEmojiId.value)
        selectedEmojiId.value = null
        rotationAngle.value = 0
      } else if (selectedShapeId.value) {
        await deleteShape(selectedShapeId.value)
        selectedShapeId.value = null
        rotationAngle.value = 0
      }
    }
  }
  
  document.addEventListener('keydown', handleKeyDown)
  
  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown)
  })
})

// Cleanup real-time features on unmount
onScopeDispose(() => {
  stopCursorTracking()
  cleanupRealtimeSync()
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped>
.emoji-item {
  transition: all 0.2s ease;
  will-change: transform;
  touch-action: none; /* Prevent default touch behaviors */
}

.emoji-item:hover {
  transform: scale(1.1);
}

.emoji-item.selected {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.shape-item {
  transition: all 0.2s ease;
  will-change: transform;
  touch-action: none; /* Prevent default touch behaviors */
}

.shape-item:hover {
  transform: scale(1.05);
}

.shape-item.selected {
  outline: 2px solid #8b5cf6;
  outline-offset: 2px;
}

/* Performance optimizations for canvas */
.canvas-container {
  contain: layout style paint;
  transform: translateZ(0);
  will-change: transform;
  touch-action: none; /* Prevent scrolling on canvas */
}

/* Mobile-specific optimizations */
@media (max-width: 767px) {
  .emoji-item:hover {
    transform: none; /* Disable hover effects on mobile */
  }
  
  .shape-item:hover {
    transform: none; /* Disable hover effects on mobile */
  }
  
  /* Ensure touch targets are large enough */
  .emoji-item, .shape-item {
    min-width: 44px;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  /* Make rotation handles larger on mobile */
  .canvas-container :deep(.absolute.-top-8) {
    width: 32px;
    height: 32px;
    top: -40px;
  }
  
  .canvas-container :deep(.absolute.-top-8 .w-3) {
    width: 16px;
    height: 16px;
  }
}

/* Smooth drawing performance */
.canvas-container {
  contain: layout style paint;
  transform: translateZ(0);
  will-change: transform;
}
</style>
