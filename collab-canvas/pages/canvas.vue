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
              :data-id="emoji.id"
          :class="[
            'emoji-item absolute cursor-pointer select-none transition-all duration-200',
            { 'selected': isItemSelected(emoji.id) }
          ]"
              :style="{
                left: emoji.x + 'px',
                top: emoji.y + 'px',
                width: '32px',
                height: '32px',
                fontSize: Math.min(emoji.size || 32, 32) + 'px',
                zIndex: emoji.layer || 1,
                transform: `rotate(${emoji.rotation || 0}deg)`,
                boxShadow: isItemSelected(emoji.id) ? '0 0 0 2px #3b82f6' : 'none',
                outline: 'none',
                outlineOffset: '0px',
                backgroundColor: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
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
              :data-id="shape.id"
          :class="[
            'shape-item absolute cursor-pointer select-none',
            { 'selected': isItemSelected(shape.id) }
          ]"
              :style="{
                left: shape.x + 'px',
                top: shape.y + 'px',
                width: shape.type === 'circle' ? (shape as any).radius * 2 + 'px' : (shape as any).width + 'px',
                height: shape.type === 'circle' ? (shape as any).radius * 2 + 'px' : (shape as any).height + 'px',
                backgroundColor: isItemSelected(shape.id) ? 'rgba(59, 130, 246, 0.1)' : (shape.type === 'text' ? 'transparent' : shape.fill),
                border: shape.type === 'text' ? 'none' : `2px solid ${shape.stroke}`,
                borderRadius: shape.type === 'circle' ? '50%' : '4px',
                zIndex: 1,
                transform: `rotate(${shape.rotation || 0}deg)`,
                boxShadow: isItemSelected(shape.id) ? '0 0 0 4px #3b82f6, 0 0 0 6px rgba(59, 130, 246, 0.3)' : 'none',
                outline: isItemSelected(shape.id) ? '2px solid #3b82f6' : 'none',
                outlineOffset: isItemSelected(shape.id) ? '2px' : '0px'
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

            <!-- Selection Box -->
            <div
              v-if="selectionBox"
              class="absolute border border-blue-400 bg-blue-50/20 pointer-events-none"
              :style="{
                left: selectionBox.x + 'px',
                top: selectionBox.y + 'px',
                width: selectionBox.width + 'px',
                height: selectionBox.height + 'px',
                zIndex: 1001
              }"
            />

            <!-- Selection Handles (Rotation + Resize) -->
            <div
              v-if="(selectedEmojiId || selectedShapeId) && currentTool === 'select' && !isMultiSelect"
              class="absolute pointer-events-none"
              :style="{
                left: (selectedEmojiId ? getEmojiById(selectedEmojiId)?.x : getSelectedShape()?.x) + 'px',
                top: (selectedEmojiId ? getEmojiById(selectedEmojiId)?.y : getSelectedShape()?.y) + 'px',
                width: '0px',
                height: '0px',
                zIndex: 1002,
                border: 'none',
                background: 'transparent'
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
              
              <!-- Resize Handles -->
              <!-- Corner handles -->
              <div
                v-for="handle in ['nw', 'ne', 'sw', 'se']"
                :key="handle"
                :class="[
                  'absolute w-2 h-2 bg-blue-500 border border-white shadow-lg cursor-pointer pointer-events-auto',
                  {
                    'top-0 left-0 -translate-x-1 -translate-y-1': handle === 'nw',
                    'top-0 right-0 translate-x-1 -translate-y-1': handle === 'ne',
                    'bottom-0 left-0 -translate-x-1 translate-y-1': handle === 'sw',
                    'bottom-0 right-0 translate-x-1 translate-y-1': handle === 'se'
                  }
                ]"
                :style="{
                  cursor: handle === 'nw' || handle === 'se' ? 'nwse-resize' : 'nesw-resize'
                }"
                @mousedown.stop="startResize($event, handle, selectedEmojiId || selectedShapeId, !!selectedEmojiId)"
                @touchstart.stop="(event: TouchEvent) => startResize(event as any, handle, selectedEmojiId || selectedShapeId, !!selectedEmojiId)"
              />
              
              <!-- Edge handles -->
              <div
                v-for="handle in ['n', 's', 'e', 'w']"
                :key="handle"
                :class="[
                  'absolute w-2 h-2 bg-blue-500 border border-white shadow-lg cursor-pointer pointer-events-auto',
                  {
                    'top-0 left-1/2 -translate-x-1/2 -translate-y-1': handle === 'n',
                    'bottom-0 left-1/2 -translate-x-1/2 translate-y-1': handle === 's',
                    'right-0 top-1/2 translate-x-1 -translate-y-1/2': handle === 'e',
                    'left-0 top-1/2 -translate-x-1 -translate-y-1/2': handle === 'w'
                  }
                ]"
                :style="{
                  cursor: handle === 'n' || handle === 's' ? 'ns-resize' : 'ew-resize'
                }"
                @mousedown.stop="startResize($event, handle, selectedEmojiId || selectedShapeId, !!selectedEmojiId)"
                @touchstart.stop="(event: TouchEvent) => startResize(event as any, handle, selectedEmojiId || selectedShapeId, !!selectedEmojiId)"
              />
              
              <!-- Center Point -->
              <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full border border-white"/>
            </div>

            <!-- Multi-select Rotation Handles (no resize) -->
            <div
              v-if="isMultiSelect && currentTool === 'select'"
              data-multiselect-ui
              class="absolute pointer-events-none"
              :style="{
                left: groupCenter.x - 25 + 'px',
                top: groupCenter.y - 25 + 'px',
                width: '50px',
                height: '50px',
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
          :selected-item-count="selectedItemCount"
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

// Multi-select state
const selectedItemIds = ref<Set<string>>(new Set())
const selectionBox = ref<{ x: number; y: number; width: number; height: number } | null>(null)
const selectionStart = ref<{ x: number; y: number } | null>(null)
const isSelecting = ref(false)
const originalPositions = ref<Map<string, { x: number; y: number }>>(new Map())
const selectionUpdateCounter = ref(0)
const justFinishedBoxSelection = ref(false)

// Canvas refs
const canvasContainer = ref<HTMLElement | null>(null)
const textInput = ref<HTMLInputElement | null>(null)
const toolPaletteRef = ref<{ openDrawer: () => void } | null>(null)

// Drag state
const pendingDragShapeId = ref<string | null>(null)
const pendingDragEmojiId = ref<string | null>(null)
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })

// Resize state
const isResizing = ref(false)
const resizingItemId = ref<string | null>(null)
const resizeHandle = ref<string | null>(null)
const resizeStart = ref({ 
  x: 0, 
  y: 0, 
  width: 0, 
  height: 0, 
  radius: 0, 
  size: 0,
  itemX: 0,
  itemY: 0
})

// Rotation state
const initialRotations = ref<Map<string, number>>(new Map())
const rotationStartAngle = ref(0)

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
const { canUndo, canRedo, undo: undoAction, redo: redoAction, loadHistory, isUndoRedoInProgress, recordAction } = useUndoRedo()

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
      // Prevent default to avoid scrolling
      event.preventDefault()
      
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
      // Prevent default to avoid scrolling
      event.preventDefault()
      
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      })
      handleCanvasMouseMove(mouseEvent)
    }
  }
}

function handleCanvasTouchEnd(event: TouchEvent) {
  // Prevent default to avoid scrolling
  event.preventDefault()
  handleCanvasMouseUp()
}

// Touch handlers for emojis and shapes
function startEmojiTouch(event: TouchEvent, emojiId: string) {
  if (event.touches.length === 1) {
    const touch = event.touches[0]
    if (touch) {
      // Prevent default to avoid scrolling
      event.preventDefault()
      event.stopPropagation()
      
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY,
        button: 0,
        ctrlKey: event.ctrlKey || event.metaKey
      })
      startEmojiDrag(mouseEvent, emojiId)
    }
  }
}

function startShapeTouch(event: TouchEvent, shapeId: string) {
  if (event.touches.length === 1) {
    const touch = event.touches[0]
    if (touch) {
      // Prevent default to avoid scrolling
      event.preventDefault()
      event.stopPropagation()
      
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY,
        button: 0,
        ctrlKey: event.ctrlKey || event.metaKey
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

// Multi-select computed properties
const isMultiSelect = computed(() => selectedItemIds.value.size > 1)
const selectedItemCount = computed(() => selectedItemIds.value.size)

// Computed property to get selected emojis and shapes
const selectedEmojis = computed(() => {
  return emojis.value.filter(emoji => selectedItemIds.value.has(emoji.id))
})

const selectedShapes = computed(() => {
  return allShapes.value.filter(shape => selectedItemIds.value.has(shape.id))
})

// Helper function to check if an item is selected
const isItemSelected = (itemId: string) => {
  return selectedItemIds.value.has(itemId)
}

// Group center calculation for rotation
const groupCenter = computed(() => {
  if (selectedItemIds.value.size === 0) return { x: 0, y: 0 }
  
  let totalX = 0
  let totalY = 0
  let count = 0
  
  // Calculate center from all selected items
  selectedItemIds.value.forEach(id => {
    // Check emojis
    const emoji = getEmojiById(id)
    if (emoji) {
      totalX += emoji.x + (emoji.size || 48) / 2
      totalY += emoji.y + (emoji.size || 48) / 2
      count++
      return
    }
    
    // Check shapes
    const shape = allShapes.value.find(s => s.id === id)
    if (shape) {
      const width = (shape as Rectangle).width || (shape as Circle).radius * 2 || 50
      const height = (shape as Rectangle).height || (shape as Circle).radius * 2 || 50
      totalX += shape.x + width / 2
      totalY += shape.y + height / 2
      count++
    }
  })
  
  return count > 0 ? { x: totalX / count, y: totalY / count } : { x: 0, y: 0 }
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
    selectedItemIds.value.clear()
  }
}

// Multi-select helper functions
function clearSelection() {
  selectedItemIds.value = new Set()
  selectedEmojiId.value = null
  selectedShapeId.value = null
  rotationAngle.value = 0
  selectionUpdateCounter.value++
}

function selectItem(itemId: string, isEmoji: boolean = false) {
  // Clear existing selection and select only this item
  selectedItemIds.value = new Set([itemId])
  selectionUpdateCounter.value++
  
  if (isEmoji) {
    selectedEmojiId.value = itemId
  } else {
    selectedShapeId.value = itemId
  }
  
  updateRotationFromSelection()
  updateColorFromSelection()
}

function addToSelection(itemId: string, isEmoji: boolean = false) {
  selectedItemIds.value = new Set([...selectedItemIds.value, itemId])
  selectionUpdateCounter.value++
  
  if (isEmoji) {
    selectedEmojiId.value = itemId
  } else {
    selectedShapeId.value = itemId
  }
  
  updateRotationFromSelection()
  updateColorFromSelection()
}

function removeFromSelection(itemId: string) {
  const newSet = new Set(selectedItemIds.value)
  newSet.delete(itemId)
  selectedItemIds.value = newSet
  selectionUpdateCounter.value++
  
  if (selectedEmojiId.value === itemId) {
    selectedEmojiId.value = null
  }
  if (selectedShapeId.value === itemId) {
    selectedShapeId.value = null
  }
  
  updateRotationFromSelection()
  updateColorFromSelection()
}

function isItemInSelectionBox(item: { x: number; y: number; width?: number; height?: number; radius?: number; size?: number }, box: { x: number; y: number; width: number; height: number }): boolean {
  const itemWidth = item.width || item.radius! * 2 || item.size || 50
  const itemHeight = item.height || item.radius! * 2 || item.size || 50
  
  // Ensure box has minimum size
  if (box.width < 5 || box.height < 5) return false
  
  // Check if item intersects with selection box
  const itemLeft = item.x
  const itemRight = item.x + itemWidth
  const itemTop = item.y
  const itemBottom = item.y + itemHeight
  
  const boxLeft = Math.min(box.x, box.x + box.width)
  const boxRight = Math.max(box.x, box.x + box.width)
  const boxTop = Math.min(box.y, box.y + box.height)
  const boxBottom = Math.max(box.y, box.y + box.height)
  
  const intersects = (
    itemLeft < boxRight &&
    itemRight > boxLeft &&
    itemTop < boxBottom &&
    itemBottom > boxTop
  )
  
  console.log(`Intersection check:`, {
    item: { x: item.x, y: item.y, width: itemWidth, height: itemHeight },
    box: { x: box.x, y: box.y, width: box.width, height: box.height },
    itemBounds: { left: itemLeft, right: itemRight, top: itemTop, bottom: itemBottom },
    boxBounds: { left: boxLeft, right: boxRight, top: boxTop, bottom: boxBottom },
    intersects
  })
  
  return intersects
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
  // Select the emoji (or add to selection if Ctrl/Cmd is held)
  if (event.ctrlKey || event.metaKey) {
    if (selectedItemIds.value.has(emojiId)) {
      removeFromSelection(emojiId)
    } else {
      addToSelection(emojiId, true)
    }
  } else {
    // If clicking on an item that's already selected in a multi-selection, don't change selection
    if (isMultiSelect.value && selectedItemIds.value.has(emojiId)) {
      // Keep current selection, just prepare for dragging
    } else {
      selectItem(emojiId, true)
    }
  }
  
  // Only prepare for dragging if select tool is active
  if (currentTool.value === 'select') {
    // Store original positions for all selected items
    originalPositions.value.clear()
    selectedItemIds.value.forEach(id => {
      const emoji = getEmojiById(id)
      if (emoji) {
        originalPositions.value.set(id, { x: emoji.x, y: emoji.y })
      } else {
        const shape = allShapes.value.find(s => s.id === id)
        if (shape) {
          originalPositions.value.set(id, { x: shape.x, y: shape.y })
        }
      }
    })
    
    dragStart.value = { x: event.clientX, y: event.clientY }
    pendingDragEmojiId.value = emojiId
  }
}

function startShapeDrag(event: MouseEvent, shapeId: string) {
  // Select the shape (or add to selection if Ctrl/Cmd is held)
  if (event.ctrlKey || event.metaKey) {
    if (selectedItemIds.value.has(shapeId)) {
      removeFromSelection(shapeId)
    } else {
      addToSelection(shapeId, false)
    }
  } else {
    // If clicking on an item that's already selected in a multi-selection, don't change selection
    if (isMultiSelect.value && selectedItemIds.value.has(shapeId)) {
      // Keep current selection, just prepare for dragging
    } else {
      selectItem(shapeId, false)
    }
  }
  
  // Only prepare for dragging if select tool is active
  if (currentTool.value === 'select') {
    // Store original positions for all selected items
    originalPositions.value.clear()
    selectedItemIds.value.forEach(id => {
      const emoji = getEmojiById(id)
      if (emoji) {
        originalPositions.value.set(id, { x: emoji.x, y: emoji.y })
      } else {
        const shape = allShapes.value.find(s => s.id === id)
        if (shape) {
          originalPositions.value.set(id, { x: shape.x, y: shape.y })
        }
      }
    })
    
    dragStart.value = { x: event.clientX, y: event.clientY }
    pendingDragShapeId.value = shapeId
  }
}

function handleDrag(event: MouseEvent) {
  if (isDragging.value) {
    const deltaX = event.clientX - dragStart.value.x
    const deltaY = event.clientY - dragStart.value.y
    
    // Move all selected items
    selectedItemIds.value.forEach(id => {
      const originalPos = originalPositions.value.get(id)
      if (!originalPos) return
      
      // Check if it's an emoji
      const emoji = getEmojiById(id)
      if (emoji) {
        emoji.x = originalPos.x + deltaX
        emoji.y = originalPos.y + deltaY
        return
      }
      
      // Check if it's a shape
      const shape = allShapes.value.find(s => s.id === id)
      if (shape) {
        shape.x = originalPos.x + deltaX
        shape.y = originalPos.y + deltaY
      }
    })
  }
}

async function endDrag() {
  if (isDragging.value) {
    // Persist all moved items to database
    const updatePromises: Promise<unknown>[] = []
    
    selectedItemIds.value.forEach(id => {
      // Check if it's an emoji
      const emoji = getEmojiById(id)
      if (emoji) {
        updatePromises.push(updateEmoji(id, {
          x: emoji.x,
          y: emoji.y
        }))
        return
      }
      
      // Check if it's a shape
      const shape = allShapes.value.find(s => s.id === id)
      if (shape) {
        updatePromises.push(
          endShapeDragOperation(id).then(() => 
            updateShape(id, {
              x: shape.x,
              y: shape.y
            })
          )
        )
      }
    })
    
    try {
      await Promise.all(updatePromises)
    } catch (error) {
      console.error('❌ Error updating item positions:', error)
    }
    
    isDragging.value = false
    originalPositions.value.clear()
  }
}

// Resize functions
function startResize(event: MouseEvent, handleType: string, itemId: string | null, isEmoji: boolean) {
  if (!itemId) return
  
  event.preventDefault()
  event.stopPropagation()
  
  isResizing.value = true
  resizingItemId.value = itemId
  resizeHandle.value = handleType
  
  // Get current item dimensions
  if (isEmoji) {
    const emoji = getEmojiById(itemId)
    if (emoji) {
      resizeStart.value = {
        x: event.clientX,
        y: event.clientY,
        width: emoji.size,
        height: emoji.size,
        radius: 0,
        size: emoji.size,
        itemX: emoji.x,
        itemY: emoji.y
      }
    }
  } else {
    const shape = allShapes.value.find(s => s.id === itemId)
    if (shape) {
      const width = (shape as Rectangle).width || (shape as Circle).radius * 2 || 50
      const height = (shape as Rectangle).height || (shape as Circle).radius * 2 || 50
      const radius = (shape as Circle).radius || 0
      
      resizeStart.value = {
        x: event.clientX,
        y: event.clientY,
        width,
        height,
        radius,
        size: 0,
        itemX: shape.x,
        itemY: shape.y
      }
    }
  }
}

function handleResize(event: MouseEvent) {
  if (!isResizing.value || !resizingItemId.value || !resizeHandle.value) return
  
  const deltaX = event.clientX - resizeStart.value.x
  const deltaY = event.clientY - resizeStart.value.y
  
  // Check if it's an emoji
  const emoji = getEmojiById(resizingItemId.value)
  if (emoji) {
    handleEmojiResize(deltaX, deltaY, emoji)
    return
  }
  
  // Check if it's a shape
  const shape = allShapes.value.find(s => s.id === resizingItemId.value)
  if (shape) {
    handleShapeResize(deltaX, deltaY, shape)
  }
}

function handleEmojiResize(deltaX: number, deltaY: number, emoji: any) {
  if (!resizeHandle.value) return
  
  const baseSize = resizeStart.value.size
  let newSize = baseSize
  
  // Calculate new size based on handle type
  switch (resizeHandle.value) {
    case 'nw':
    case 'se':
      // Diagonal resize - use average of X and Y deltas
      newSize = Math.max(16, baseSize + (deltaX + deltaY) / 2)
      break
    case 'ne':
    case 'sw':
      // Diagonal resize - use average of X and Y deltas (inverted for ne/sw)
      newSize = Math.max(16, baseSize + (-deltaX + deltaY) / 2)
      break
    case 'n':
    case 's':
      // Vertical resize
      newSize = Math.max(16, baseSize + deltaY)
      break
    case 'e':
    case 'w':
      // Horizontal resize
      newSize = Math.max(16, baseSize + deltaX)
      break
  }
  
  // Update emoji size
  emoji.size = Math.round(newSize)
}

function handleShapeResize(deltaX: number, deltaY: number, shape: any) {
  if (!resizeHandle.value) return
  
  const baseWidth = resizeStart.value.width
  const baseHeight = resizeStart.value.height
  const baseRadius = resizeStart.value.radius
  
  let newWidth = baseWidth
  let newHeight = baseHeight
  let newRadius = baseRadius
  
  // Calculate new dimensions based on handle type
  switch (resizeHandle.value) {
    case 'nw':
      newWidth = Math.max(20, baseWidth - deltaX)
      newHeight = Math.max(20, baseHeight - deltaY)
      break
    case 'ne':
      newWidth = Math.max(20, baseWidth + deltaX)
      newHeight = Math.max(20, baseHeight - deltaY)
      break
    case 'sw':
      newWidth = Math.max(20, baseWidth - deltaX)
      newHeight = Math.max(20, baseHeight + deltaY)
      break
    case 'se':
      newWidth = Math.max(20, baseWidth + deltaX)
      newHeight = Math.max(20, baseHeight + deltaY)
      break
    case 'n':
      newHeight = Math.max(20, baseHeight - deltaY)
      break
    case 's':
      newHeight = Math.max(20, baseHeight + deltaY)
      break
    case 'e':
      newWidth = Math.max(20, baseWidth + deltaX)
      break
    case 'w':
      newWidth = Math.max(20, baseWidth - deltaX)
      break
  }
  
  // Update shape properties based on type
  if (shape.type === 'circle') {
    // For circles, use the average of width and height for radius
    const avgSize = (newWidth + newHeight) / 2
    newRadius = Math.max(10, avgSize / 2)
    shape.radius = Math.round(newRadius)
  } else if (shape.type === 'rectangle') {
    shape.width = Math.round(newWidth)
    shape.height = Math.round(newHeight)
  } else if (shape.type === 'text') {
    // For text, update fontSize based on height
    const fontSize = Math.max(12, Math.round(newHeight * 0.6))
    shape.fontSize = fontSize
  }
}

async function endResize() {
  if (!isResizing.value || !resizingItemId.value) return
  
  try {
    // Check if it's an emoji
    const emoji = getEmojiById(resizingItemId.value)
    if (emoji) {
      // Record action for undo/redo
      const beforeState = { size: resizeStart.value.size }
      const afterState = { size: emoji.size }
      
      await updateEmoji(resizingItemId.value, {
        size: emoji.size
      })
      
      // Record undo/redo action
      if (!isUndoRedoInProgress.value) {
        await recordAction('update', 'emoji', resizingItemId.value, beforeState, afterState)
      }
    } else {
      // Check if it's a shape
      const shape = allShapes.value.find(s => s.id === resizingItemId.value)
      if (shape) {
        const updates: any = {}
        const beforeState: any = {}
        const afterState: any = {}
        
        if (shape.type === 'circle') {
          updates.radius = shape.radius
          beforeState.radius = resizeStart.value.radius
          afterState.radius = shape.radius
        } else if (shape.type === 'rectangle') {
          updates.width = shape.width
          updates.height = shape.height
          beforeState.width = resizeStart.value.width
          beforeState.height = resizeStart.value.height
          afterState.width = shape.width
          afterState.height = shape.height
        } else if (shape.type === 'text') {
          updates.fontSize = shape.fontSize
          beforeState.fontSize = resizeStart.value.height * 0.6 // Approximate original fontSize
          afterState.fontSize = shape.fontSize
        }
        
        await updateShape(resizingItemId.value, updates)
        
        // Record undo/redo action
        if (!isUndoRedoInProgress.value) {
          await recordAction('update', shape.type as 'rectangle' | 'circle' | 'text', resizingItemId.value, beforeState, afterState)
        }
      }
    }
  } catch (error) {
    console.error('❌ Error updating item size:', error)
  }
  
  isResizing.value = false
  resizingItemId.value = null
  resizeHandle.value = null
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
  selectItem(shapeId, false)
}


// Canvas mouse handlers
function handleCanvasClick(event: MouseEvent) {
  // Only deselect if clicking on empty canvas space (not on an emoji or shape)
  // But don't clear if we just finished a box selection
  if (event.target === canvasContainer.value && !isSelecting.value && !justFinishedBoxSelection.value) {
    clearSelection()
  }
}

function handleCanvasMouseDown(event: MouseEvent) {
  // Start selection box if clicking on empty canvas
  if (event.target === canvasContainer.value && currentTool.value === 'select') {
    const rect = canvasContainer.value!.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    // Store the start coordinates separately
    selectionStart.value = { x, y }
    selectionBox.value = { x, y, width: 0, height: 0 }
    isSelecting.value = true
    selectedItemIds.value = new Set()
  }
}

function handleCanvasMouseMove(event: MouseEvent) {
  if (isResizing.value) {
    handleResize(event)
  } else if (isDragging.value) {
    handleDrag(event)
  } else if (isSelecting.value && selectionBox.value && selectionStart.value) {
    // Update selection box dimensions using stored start coordinates
    const rect = canvasContainer.value!.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    // Calculate the selection box from start point to current point
    const startX = selectionStart.value.x
    const startY = selectionStart.value.y
    
    selectionBox.value = {
      x: Math.min(startX, x),
      y: Math.min(startY, y),
      width: Math.abs(x - startX),
      height: Math.abs(y - startY)
    }
  } else if ((pendingDragShapeId.value || pendingDragEmojiId.value) && currentTool.value === 'select') {
    // Start dragging when mouse actually moves
    const distance = Math.sqrt(
      Math.pow(event.clientX - dragStart.value.x, 2) + 
      Math.pow(event.clientY - dragStart.value.y, 2)
    )
    
    if (distance > 5) { // Minimum distance threshold to start dragging
      isDragging.value = true
      
      // Start drag operations for all selected items (for undo/redo batching)
      selectedItemIds.value.forEach(id => {
        const emoji = getEmojiById(id)
        if (emoji) {
          // Emojis don't need special drag operation handling
        } else {
          const shape = allShapes.value.find(s => s.id === id)
          if (shape) {
            startShapeDragOperation(id)
          }
        }
      })
      
      // Clear pending drag IDs
      pendingDragShapeId.value = null
      pendingDragEmojiId.value = null
    }
  }
}

async function handleCanvasMouseUp() {
  if (isResizing.value) {
    endResize()
  } else if (isDragging.value) {
    endDrag()
  } else if (isSelecting.value && selectionBox.value) {
    // Finalize selection box - find intersecting items
    const box = selectionBox.value
    console.log('Selection box:', box)
    console.log('Available emojis:', emojis.value.length)
    console.log('Available shapes:', allShapes.value.length)
    
    if (box.width > 5 && box.height > 5) { // Minimum selection size
      // Create a new Set to trigger Vue reactivity
      const newSelection = new Set<string>()
      
      // Check emojis
      emojis.value.forEach(emoji => {
        const isIntersecting = isItemInSelectionBox(emoji, box)
        console.log(`Emoji ${emoji.id} at (${emoji.x}, ${emoji.y}) intersects:`, isIntersecting)
        if (isIntersecting) {
          newSelection.add(emoji.id)
        }
      })
      
      // Check shapes
      allShapes.value.forEach(shape => {
        const isIntersecting = isItemInSelectionBox(shape, box)
        console.log(`Shape ${shape.id} at (${shape.x}, ${shape.y}) intersects:`, isIntersecting)
        if (isIntersecting) {
          newSelection.add(shape.id)
        }
      })
      
      // Update the reactive Set
      selectedItemIds.value = newSelection
      selectionUpdateCounter.value++
      
      // Force a re-render by updating a dummy reactive value
      await nextTick()
      
      console.log('Final selection:', Array.from(selectedItemIds.value))
      console.log('isMultiSelect:', isMultiSelect.value)
      console.log('selectedItemCount:', selectedItemCount.value)
      console.log('selectionUpdateCounter:', selectionUpdateCounter.value)
      console.log('groupCenter:', groupCenter.value)
      console.log('currentTool:', currentTool.value)
      console.log('isMultiSelect condition:', isMultiSelect.value && currentTool.value === 'select')
      console.log('groupCenter valid:', groupCenter.value.x !== 0 || groupCenter.value.y !== 0)
      
      // Check if selection gets cleared after setting
      setTimeout(() => {
        console.log('⏰ SELECTION CHECK AFTER 100ms:', Array.from(selectedItemIds.value))
      }, 100)
      
      // Test template reactivity by checking if any emoji should be selected
      const firstSelectedId = Array.from(selectedItemIds.value)[0]
      if (firstSelectedId) {
        const testEmoji = emojis.value.find(e => e.id === firstSelectedId)
        if (testEmoji) {
          console.log('TEST - First selected emoji should have selected class:', {
            id: testEmoji.id,
            shouldBeSelected: selectedItemIds.value.has(testEmoji.id),
            selectedItemIds: Array.from(selectedItemIds.value)
          })
        }
      }
      
      // Test computed properties
      console.log('selectedEmojis computed:', selectedEmojis.value.length)
      console.log('selectedShapes computed:', selectedShapes.value.length)
      
      // Test helper function
      const firstId = Array.from(selectedItemIds.value)[0]
      if (firstId) {
        console.log('isItemSelected test:', {
          id: firstId,
          result: isItemSelected(firstId),
          selectedItemIds: Array.from(selectedItemIds.value)
        })
      }
      
      // Quick test: Check if any emoji has the selected class
      const testEmoji = document.querySelector('.emoji-item.selected')
      if (testEmoji) {
        const htmlEl = testEmoji as HTMLElement
        console.log('TEST - First selected emoji styles:', {
          boxShadow: htmlEl.style.boxShadow,
          outline: htmlEl.style.outline,
          outlineOffset: htmlEl.style.outlineOffset
        })
      }
      
      // Check if multiselect UI elements exist
      const multiselectUI = document.querySelector('[data-multiselect-ui]')
      console.log('Multiselect UI element exists:', !!multiselectUI)
      
      // Check again after a short delay to see if it gets rendered
      setTimeout(() => {
        const multiselectUIDelayed = document.querySelector('[data-multiselect-ui]')
        console.log('Multiselect UI element exists (delayed):', !!multiselectUIDelayed)
        if (multiselectUIDelayed) {
          const htmlEl = multiselectUIDelayed as HTMLElement
          console.log('Multiselect UI position:', {
            left: htmlEl.style.left,
            top: htmlEl.style.top,
            display: window.getComputedStyle(multiselectUIDelayed).display
          })
        }
      }, 100)
      
      // Debug: Check if selected class is applied (immediate check)
      try {
        const selectedElements = document.querySelectorAll('.emoji-item.selected, .shape-item.selected')
        console.log('Selected elements in DOM:', selectedElements.length)
        console.log('selectedItemIds.value:', Array.from(selectedItemIds.value))
        
        // Check first few elements in detail
        for (let i = 0; i < Math.min(3, selectedElements.length); i++) {
          const el = selectedElements[i]
          if (!el) continue
          
          const computedStyle = window.getComputedStyle(el)
          const htmlEl = el as HTMLElement
          console.log(`Element ${i}:`, {
            className: el.className,
            id: el.getAttribute('data-id') || 'no-id',
            hasSelectedClass: el.classList.contains('selected'),
            inlineBoxShadow: htmlEl.style.boxShadow,
            inlineOutline: htmlEl.style.outline,
            inlineBackgroundColor: htmlEl.style.backgroundColor,
            computedBoxShadow: computedStyle.boxShadow,
            computedOutline: computedStyle.outline,
            computedOutlineOffset: computedStyle.outlineOffset,
            computedBackgroundColor: computedStyle.backgroundColor,
            computedDisplay: computedStyle.display,
            computedVisibility: computedStyle.visibility,
            computedOpacity: computedStyle.opacity
          })
        }
        
        // Also check all emoji and shape elements
        const allEmojis = document.querySelectorAll('.emoji-item')
        const allShapes = document.querySelectorAll('.shape-item')
        console.log('All emojis:', allEmojis.length, 'All shapes:', allShapes.length)
      } catch (error) {
        console.error('Debug error:', error)
      }
      
      // Update UI state based on selection
      if (selectedItemIds.value.size > 0) {
        const firstId = Array.from(selectedItemIds.value)[0]
        if (firstId) {
          // Only set single selection IDs if we have exactly one item selected
          if (selectedItemIds.value.size === 1) {
            const emoji = getEmojiById(firstId)
            if (emoji) {
              selectedEmojiId.value = firstId
              console.log('Set selectedEmojiId to:', firstId)
            } else {
              selectedShapeId.value = firstId
              console.log('Set selectedShapeId to:', firstId)
            }
          } else {
            // For multiselect, clear single selection IDs
            selectedEmojiId.value = null
            selectedShapeId.value = null
            console.log('Multiselect - cleared single selection IDs')
          }
          updateRotationFromSelection()
          updateColorFromSelection()
        }
      }
    }
    
    // Clear selection box
    selectionBox.value = null
    selectionStart.value = null
    isSelecting.value = false
    
    // Set flag to prevent click handler from clearing selection
    justFinishedBoxSelection.value = true
    setTimeout(() => {
      justFinishedBoxSelection.value = false
    }, 100)
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
  
  // Ensure angle is a number, not an array
  const numericAngle = Array.isArray(angle) ? angle[0] : angle
  if (typeof numericAngle !== 'number' || isNaN(numericAngle)) {
    console.warn('Invalid angle received:', angle)
    return
  }
  
  rotationAngle.value = numericAngle
  
  if (isMultiSelect.value) {
    // Individual rotation - each item rotates around its own center
    selectedItemIds.value.forEach(id => {
      // Check if it's an emoji
      const emoji = getEmojiById(id)
      if (emoji) {
        const initialRotation = initialRotations.value.get(id) || 0
        emoji.rotation = initialRotation + numericAngle
        
        // Don't update database during rotation - only update visual state
        return
      }
      
      // Check if it's a shape
      const shape = allShapes.value.find(s => s.id === id)
      if (shape) {
        const initialRotation = initialRotations.value.get(id) || 0
        shape.rotation = initialRotation + numericAngle
        
        // Don't update database during rotation - only update visual state
      }
    })
  } else {
    // Single item rotation
    if (selectedEmojiId.value) {
      const emoji = getEmojiById(selectedEmojiId.value)
      if (emoji) {
        emoji.rotation = numericAngle
        // Don't update database during rotation - only update visual state
      }
    }
    
    if (selectedShapeId.value) {
      const allShapesArray = allShapes.value
      const shape = allShapesArray.find(s => s.id === selectedShapeId.value)
      if (shape) {
        shape.rotation = numericAngle
        // Don't update database during rotation - only update visual state
      }
    }
  }
}

function resetRotation() {
  rotationAngle.value = 0
  handleRotationChange(0)
}

async function deleteSelectedItem() {
  if (selectedItemIds.value.size === 0) return
  
  // Delete all selected items in parallel
  const deletePromises: Promise<boolean>[] = []
  
  selectedItemIds.value.forEach(id => {
    // Check if it's an emoji
    const emoji = getEmojiById(id)
    if (emoji) {
      deletePromises.push(deleteEmoji(id))
    } else {
      // Check if it's a shape
      const shape = allShapes.value.find(s => s.id === id)
      if (shape) {
        deletePromises.push(deleteShape(id))
      }
    }
  })
  
  try {
    await Promise.all(deletePromises)
    clearSelection()
  } catch (error) {
    console.error('❌ Error deleting selected items:', error)
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
  
  // Store initial rotation values for all selected items
  initialRotations.value.clear()
  selectedItemIds.value.forEach(id => {
    const emoji = getEmojiById(id)
    if (emoji) {
      const initialRot = emoji.rotation || 0
      initialRotations.value.set(id, initialRot)
    } else {
      const shape = allShapes.value.find(s => s.id === id)
      if (shape) {
        const initialRot = shape.rotation || 0
        initialRotations.value.set(id, initialRot)
      }
    }
  })
  
  // Calculate center point for rotation
  let centerX: number, centerY: number
  
  if (isMultiSelect.value) {
    // For multi-select, use the group center for the rotation handle position
    // but each item will rotate around its own center
    const center = groupCenter.value
    const canvasRect = canvasContainer.value!.getBoundingClientRect()
    centerX = canvasRect.left + center.x
    centerY = canvasRect.top + center.y
  } else {
    // Use rotation handle center for single select
    const rect = (event.target as HTMLElement).getBoundingClientRect()
    centerX = rect.left + rect.width / 2
    centerY = rect.top + rect.height / 2
  }
  
  // Calculate initial angle
  const initialAngle = Math.atan2(event.clientY - centerY, event.clientX - centerX) * (180 / Math.PI)
  rotationStartAngle.value = initialAngle
  
  const handleMouseMove = (e: MouseEvent) => {
    if (isRotating.value) {
      const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI)
      const deltaAngle = currentAngle - initialAngle
      const normalizedAngle = (deltaAngle + 360) % 360
      handleRotationChange(Math.round(normalizedAngle))
    }
  }
  
  const handleMouseUp = () => {
    isRotating.value = false
    
    // Save all rotation changes to database
    selectedItemIds.value.forEach(id => {
      const emoji = getEmojiById(id)
      if (emoji) {
        updateEmoji(id, { 
          x: emoji.x, 
          y: emoji.y, 
          rotation: emoji.rotation 
        })
      } else {
        const shape = allShapes.value.find(s => s.id === id)
        if (shape) {
          updateShape(id, { 
            x: shape.x, 
            y: shape.y, 
            rotation: shape.rotation 
          })
        }
      }
    })
    
    initialRotations.value.clear()
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}


// Keyboard shortcuts
onMounted(() => {
  const handleKeyDown = async (event: KeyboardEvent) => {
    // Check if user is typing in an input field
    const isTypingInInput = event.target instanceof HTMLInputElement || 
                           event.target instanceof HTMLTextAreaElement ||
                           event.target instanceof HTMLSelectElement ||
                           (event.target as HTMLElement)?.contentEditable === 'true'
    
    // AI chat toggle (Cmd/Ctrl + K) - allow this even when typing
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault()
      showAIChat.value = !showAIChat.value
    }
    
    // Skip other shortcuts if typing in input field
    if (isTypingInInput) {
      return
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
      clearSelection()
    }
    
    // Delete selected items (Delete or Backspace key)
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault()
      await deleteSelectedItem()
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
  -webkit-touch-callout: none; /* Disable callout on iOS */
  -webkit-user-select: none; /* Disable text selection on iOS */
  user-select: none; /* Disable text selection */
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
  -webkit-touch-callout: none; /* Disable callout on iOS */
  -webkit-user-select: none; /* Disable text selection on iOS */
  user-select: none; /* Disable text selection */
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
  -webkit-touch-callout: none; /* Disable callout on iOS */
  -webkit-user-select: none; /* Disable text selection on iOS */
  user-select: none; /* Disable text selection */
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

/* Selection styles - ultra high specificity to override Nuxt UI */
.canvas-container .emoji-item.selected,
.canvas-container .shape-item.selected {
  position: relative !important;
}

</style>
