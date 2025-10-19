<template>
        <AppLayout
          :is-connected="isConnected"
          :is-mobile="isMobile"
          :user-count="onlineUsers.length"
          @toggle-users="showUsersModal = !showUsersModal"
          @show-ai-chat="showAIChat = !showAIChat"
          @open-emoji-picker="showEmojiPicker = true"
          @open-ai-chat="showAIChat = !showAIChat"
          @open-tools="showToolPalette = true"
        >
          <div class="h-full w-full flex flex-col">
      
      <!-- Main Content -->
      <div class="flex-1 flex relative">
        
        <!-- Canvas Area -->
        <div class="flex-1 canvas-container bg-white relative overflow-hidden">
          <!-- Canvas Viewport - this handles the zoom and pan -->
          <div 
            ref="canvasViewport"
            class="canvas-viewport"
            :class="[
              {
                'cursor-grab': isSpacePressed && !isGrabbing,
                'cursor-grabbing': isGrabbing,
                'cursor-crosshair': !isSpacePressed && !isMobile
              }
            ]"
            :style="{
              transform: `scale(${canvasScale}) translate(${canvasOffset.x}px, ${canvasOffset.y}px)`,
              transformOrigin: 'center center',
              width: '100%',
              height: '100%'
            }"
            @mousedown="handleCanvasMouseDown"
            @mousemove="handleCanvasMouseMove"
            @mouseup="handleCanvasMouseUp"
            @click="handleCanvasClick"
            @touchstart="handleCanvasTouchStart"
            @touchmove="handleCanvasTouchMove"
            @touchend="handleCanvasTouchEnd"
            @wheel="handleCanvasWheel"
          >
            <div 
              ref="canvasContainer"
              class="bg-white relative"
              :style="{ 
                width: canvasWidth + 'px', 
                height: canvasHeight + 'px'
              }"
              data-tool="emoji"
              data-testid="canvas-container"
            >
            <!-- Grid Overlay -->
            <div 
              v-if="snapToGridEnabled"
              class="absolute inset-0 pointer-events-none grid-overlay"
              :style="{
                backgroundImage: `radial-gradient(circle, #6b7280 1px, transparent 1px)`,
                backgroundSize: `${gridSize}px ${gridSize}px`,
                backgroundPosition: '0 0'
              }"
            />

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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }"
              @mousedown.stop="startEmojiDrag($event, emoji.id)"
              @touchstart.stop="startEmojiTouch($event, emoji.id)"
              @touchmove.stop="handleEmojiTouchMove($event, emoji.id)"
              @touchend.stop="handleEmojiTouchEnd($event, emoji.id)"
              @dblclick="editEmoji(emoji.id)"
              @gesturestart.stop="handleGestureStart($event, emoji.id)"
              @gesturechange.stop="handleGestureChange($event, emoji.id)"
              @gestureend.stop="handleGestureEnd($event, emoji.id)"
            >
              {{ emoji.emoji }}
              
              <!-- Mobile Delete Button - appears when item is selected on mobile -->
              <div
                v-if="isMobile && isItemSelected(emoji.id)"
                class="absolute -top-2 -right-2 z-50"
                @click.stop="deleteSingleEmoji(emoji.id)"
              >
                <div class="bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg cursor-pointer transition-colors">
                  <UIcon name="i-lucide-x" class="w-3 h-3" />
                </div>
              </div>
            </div>

            <!-- Selection Box -->
            <div
              v-if="isSelecting && selectionBox.width > 0 && selectionBox.height > 0"
              class="absolute pointer-events-none border-2 border-blue-500"
              :style="{
                left: selectionBox.x + 'px',
                top: selectionBox.y + 'px',
                width: selectionBox.width + 'px',
                height: selectionBox.height + 'px',
                zIndex: 1000,
                backgroundColor: 'rgba(59, 130, 246, 0.05)'
              }"
            />

            <!-- Long Press Indicator for Touch -->
            <div
              v-if="isMobile && longPressTimer && !isSelecting && selectionStart.x > 0"
              class="absolute pointer-events-none z-50"
              :style="{
                left: selectionStart.x + 'px',
                top: selectionStart.y + 'px',
                transform: 'translate(-50%, -50%)'
              }"
            >
              <div class="w-4 h-4 bg-blue-500 rounded-full animate-ping opacity-75"/>
              <div class="absolute inset-0 w-4 h-4 bg-blue-500 rounded-full"/>
            </div>

            <!-- Mobile Floating Action Button for Selected Items -->
            <div
              v-if="isMobile && selectedItemIds.size > 0"
              class="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
            >
              <!-- Delete Button -->
              <button
                class="bg-red-500 hover:bg-red-600 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg transition-colors"
                :title="`Delete ${selectedItemIds.size} item${selectedItemIds.size > 1 ? 's' : ''}`"
                @click="deleteSelectedItem"
              >
                <UIcon name="i-lucide-trash-2" class="w-6 h-6" />
              </button>
              
              <!-- Copy Button -->
              <button
                class="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg transition-colors"
                title="Copy selected items"
                @click="handleCopy"
              >
                <UIcon name="i-lucide-copy" class="w-6 h-6" />
              </button>
              
              <!-- Paste Button (if clipboard has data) -->
              <button
                v-if="clipboardHasData"
                class="bg-green-500 hover:bg-green-600 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg transition-colors"
                title="Paste items"
                @click="handlePaste"
              >
                <UIcon name="i-lucide-clipboard" class="w-6 h-6" />
              </button>
            </div>


            <!-- Desktop Pan Mode Indicator -->
            <div v-if="!isMobile && isSpacePressed" class="absolute top-2 left-2 z-50">
              <div class="bg-blue-500/90 text-white px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-2">
                <UIcon name="i-lucide-hand" class="w-4 h-4" />
                Pan Mode
              </div>
            </div>

            <!-- Selection Handles (Rotation + Resize) -->
            <div
              v-if="selectedEmojiId || (isMobile && selectedItemIds.size > 0)"
              class="absolute pointer-events-none"
              :style="{
                left: (selectedEmojiId ? getEmojiById(selectedEmojiId)?.x : getCenterOfSelection().x) + 'px',
                top: (selectedEmojiId ? getEmojiById(selectedEmojiId)?.y : getCenterOfSelection().y) + 'px',
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
                @touchstart.stop="startRotationTouch"
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
                @mousedown.stop="startResize($event as MouseEvent, handle, selectedEmojiId)"
                @touchstart.stop="(event: TouchEvent) => startResize(event as unknown as MouseEvent, handle, selectedEmojiId)"
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
                @mousedown.stop="startResize($event as MouseEvent, handle, selectedEmojiId)"
                @touchstart.stop="(event: TouchEvent) => startResize(event as unknown as MouseEvent, handle, selectedEmojiId)"
              />
              
              <!-- Center Point -->
              <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full border border-white"/>
            </div>

            </div>
          </div>
          
          <!-- Cursor Overlay for Real-time Collaboration -->
          <CursorOverlay />
        </div>
        
        <!-- Tool Palette Popover -->
        <ToolPalette
          v-model:open="showToolPalette"
          :selected-emoji-id="selectedEmojiId"
          :selected-item-count="selectedItemCount"
          :rotation-angle="rotationAngle"
          :can-undo="canUndo"
          :can-redo="canRedo"
          :snap-to-grid-enabled="snapToGridEnabled"
          :clipboard-has-data="clipboardHasData"
          @rotation-change="handleRotationChange"
          @reset-rotation="resetRotation"
          @undo="undo"
          @redo="redo"
          @copy="handleCopy"
          @paste="handlePaste"
          @delete-selected="deleteSelectedItem"
          @clear-all="showClearAllModal = true"
          @reset-view="resetView"
          @toggle-grid="toggleSnapToGrid"
          @zoom-in="canvasScale = Math.min(2, canvasScale + 0.2)"
          @zoom-out="canvasScale = Math.max(0.5, canvasScale - 0.2)"
          @reset-zoom="resetCanvasView"
        />
      </div>
      
      
      <!-- AI Chat Interface -->
      <AIChatInterface v-if="showAIChat" :show-chat="showAIChat" @update:show-chat="showAIChat = $event" />

      <!-- Users Modal -->
      <UsersModal 
        v-if="showUsersModal"
        :is-connected="isConnected"
        :users="onlineUsers"
        :show-debug="true"
        @close="showUsersModal = false"
      />

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
import { ref, onMounted, onUnmounted, computed, onScopeDispose } from 'vue'

// Components
import AppLayout from '~/components/AppLayout.vue'
import CursorOverlay from '~/components/CursorOverlay.vue'
import ToolPalette from '~/components/ToolPalette.vue'
import AIChatInterface from '~/components/AIChatInterface.vue'
import UsersModal from '~/components/UsersModal.vue'
import EmojiPicker from '~/components/EmojiPicker.vue'

// Composables
import { useEmojis } from '~/composables/useEmojis'
import { useCursorTracking } from '~/composables/useCursorTracking'
import { useRealtimeSync } from '~/composables/useRealtimeSync'
import { useUndoRedo } from '~/composables/useUndoRedo'
import { useClipboard } from '~/composables/useClipboard'
import { usePresence } from '~/composables/usePresence'
import { useToast } from '#imports'

// Utility function for random colors (currently unused)
const _getRandomColor = () => {
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

// Pan and zoom state
const canvasScale = ref(1)
const canvasOffset = ref({ x: 0, y: 0 })
const isPanning = ref(false)
const panStart = ref({ x: 0, y: 0, offsetX: 0, offsetY: 0 })

// Spacebar pan state management
const isSpacePressed = ref(false)
const isGrabbing = ref(false)

// Responsive canvas dimensions - full viewport minus header
const canvasWidth = computed(() => {
  return window.innerWidth
})

const canvasHeight = computed(() => {
  return window.innerHeight - 80 // Full height minus header height
})

        // State
        const showAIChat = ref(false)
        const showUsersModal = ref(false)
        const showEmojiPicker = ref(false)
        const showClearAllModal = ref(false)
        const showToolPalette = ref(false)
        const selectedEmojiId = ref<string | null>(null)
        const rotationAngle = ref(0)
        const isRotating = ref(false)
        
        // Real-time presence tracking
        const { 
          onlineUsers: presenceUsers, 
          isConnected: presenceConnected, 
          startPresence, 
          stopPresence 
        } = usePresence()
        
        // Use real presence connection status
        const isConnected = presenceConnected
        
        // Transform presence data to match UsersModal interface
        const onlineUsers = computed(() => 
          presenceUsers.value.map((user: { id: string; name: string; avatar: string; lastSeen: Date }) => ({
            id: user.id,
            display_name: user.name,
            avatar_url: user.avatar,
            last_seen: user.lastSeen.toISOString(),
            is_online: true // All users in presence are online
          }))
        )

// Selection state
const selectedItemIds = ref<Set<string>>(new Set())

// Canvas refs
const canvasContainer = ref<HTMLElement | null>(null)
const canvasViewport = ref<HTMLElement | null>(null)
const _textInput = ref<HTMLInputElement | null>(null)

// Drag state
const pendingDragEmojiId = ref<string | null>(null)
const isDragging = ref(false)
const dragStart = ref({ 
  x: 0, 
  y: 0, 
  emojiX: 0, 
  emojiY: 0,
  selectedPositions: {} as Record<string, { x: number, y: number }>
})

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

// Selection box state
const isSelecting = ref(false)
const justCompletedSelection = ref(false)
const selectionBox = ref({
  x: 0,
  y: 0,
  width: 0,
  height: 0
})
const selectionStart = ref({ x: 0, y: 0 })

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

// Cursor tracking for real-time collaboration
const { startTracking: startCursorTracking, stopTracking: stopCursorTracking } = useCursorTracking()

// Real-time sync for emoji changes
const emptyRectangles = ref([])
const emptyCircles = ref([])
const emptyTexts = ref([])
const { startSync: startRealtimeSync, cleanup: cleanupRealtimeSync } = useRealtimeSync(
  emptyRectangles,
  emptyCircles, 
  emptyTexts,
  (type, shape) => {
    console.log(`🔄 Real-time ${type}:`, shape)
  }
)

// Undo/Redo functionality
const { canUndo, canRedo, undo: undoAction, redo: redoAction, loadHistory } = useUndoRedo()

// Clipboard functionality
const { hasData: clipboardHasData, copyItems, pasteItems } = useClipboard()

// Grid functionality (simplified)
const gridSize = ref(20)
const snapToGridEnabled = ref(false)
const snapToGrid = (x: number, y: number) => ({ x: Math.round(x / gridSize.value) * gridSize.value, y: Math.round(y / gridSize.value) * gridSize.value })
const snapToGridSingle = (value: number) => Math.round(value / gridSize.value) * gridSize.value
const toggleSnapToGrid = () => { snapToGridEnabled.value = !snapToGridEnabled.value }

// Wrapper functions for click handlers
const undo = async () => {
  await undoAction()
}

const redo = async () => {
  await redoAction()
}


// Touch event handlers for mobile
const touchStartTime = ref(0)
const longPressTimer = ref<number | null>(null)
const initialTouchDistance = ref(0)
const initialScale = ref(1)

function handleCanvasTouchStart(event: TouchEvent) {
  event.preventDefault()
  
  if (event.touches.length === 1) {
    const touch = event.touches[0]
    if (touch) {
      touchStartTime.value = Date.now()
      
      // Start long-press timer for selection box
      longPressTimer.value = window.setTimeout(() => {
        if (isMobile.value) {
          // Long press detected - start selection box
          isSelecting.value = true
          const rect = canvasViewport.value!.getBoundingClientRect()
          selectionStart.value = {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top
          }
          selectionBox.value = {
            x: selectionStart.value.x,
            y: selectionStart.value.y,
            width: 0,
            height: 0
          }
        }
      }, 500) // 500ms long press threshold
      
      // Only start panning on mobile if not interacting with an emoji
      if (isMobile.value) {
        // Check if touch is on an emoji - if so, don't start panning
        const target = event.target as HTMLElement
        if (target && target.closest('.emoji-item')) {
          // Touch is on an emoji, don't start panning
          return
        }
        startPan(event)
      } else {
        const mouseEvent = new MouseEvent('mousedown', {
          clientX: touch.clientX,
          clientY: touch.clientY,
          button: 0
        })
        handleCanvasMouseDown(mouseEvent)
      }
    }
  } else if (event.touches.length === 2) {
    // Two-finger pinch gesture for zoom
    const touch1 = event.touches[0]
    const touch2 = event.touches[1]
    
    if (touch1 && touch2) {
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      )
      
      initialTouchDistance.value = distance
      initialScale.value = canvasScale.value
      
      // Clear any pending long press
      if (longPressTimer.value) {
        clearTimeout(longPressTimer.value)
        longPressTimer.value = null
      }
    }
  }
}

function handleCanvasTouchMove(event: TouchEvent) {
  event.preventDefault()
  
  if (event.touches.length === 1) {
    const touch = event.touches[0]
    if (touch) {
      // Clear long press timer if user starts moving
      if (longPressTimer.value) {
        clearTimeout(longPressTimer.value)
        longPressTimer.value = null
      }
      
      // Handle panning on mobile or selection box update
      if (isMobile.value) {
        if (isSelecting.value) {
          // Update selection box
          const rect = canvasViewport.value!.getBoundingClientRect()
          const currentX = touch.clientX - rect.left
          const currentY = touch.clientY - rect.top
          
          selectionBox.value = {
            x: Math.min(selectionStart.value.x, currentX),
            y: Math.min(selectionStart.value.y, currentY),
            width: Math.abs(currentX - selectionStart.value.x),
            height: Math.abs(currentY - selectionStart.value.y)
          }
        } else if (isPanning.value) {
          // Only pan if we're already in panning mode
          handlePan(event)
        }
      } else {
        const mouseEvent = new MouseEvent('mousemove', {
          clientX: touch.clientX,
          clientY: touch.clientY
        })
        handleCanvasMouseMove(mouseEvent)
      }
    }
  } else if (event.touches.length === 2) {
    // Two-finger pinch gesture for zoom
    const touch1 = event.touches[0]
    const touch2 = event.touches[1]
    
    if (touch1 && touch2 && initialTouchDistance.value > 0) {
      const currentDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      )
      
      const scaleChange = currentDistance / initialTouchDistance.value
      const newScale = Math.max(0.5, Math.min(2, initialScale.value * scaleChange))
      
      // Calculate center point for zoom
      const centerX = (touch1.clientX + touch2.clientX) / 2
      const centerY = (touch1.clientY + touch2.clientY) / 2
      const rect = canvasViewport.value?.getBoundingClientRect()
      
      if (rect) {
        const mouseX = centerX - rect.left
        const mouseY = centerY - rect.top
        
        const zoomChange = newScale / canvasScale.value
        canvasOffset.value.x = mouseX - (mouseX - canvasOffset.value.x) * zoomChange
        canvasOffset.value.y = mouseY - (mouseY - canvasOffset.value.y) * zoomChange
      }
      
      canvasScale.value = newScale
    }
  }
}

function handleCanvasTouchEnd(event: TouchEvent) {
  event.preventDefault()
  
  // Clear long press timer
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
    longPressTimer.value = null
  }
  
  // Handle selection box completion on mobile
  if (isMobile.value && isSelecting.value) {
    selectEmojisInBox()
    isSelecting.value = false
    justCompletedSelection.value = true
    selectionBox.value = { x: 0, y: 0, width: 0, height: 0 }
    
    // If no items were selected, clear the selection
    if (selectedItemIds.value.size === 0) {
      clearSelection()
    }
    
    // Reset the flag after a short delay
    setTimeout(() => {
      justCompletedSelection.value = false
    }, 100)
  } else {
    handleCanvasMouseUp()
  }
  
  // Reset touch gesture state
  initialTouchDistance.value = 0
  initialScale.value = 1
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

function handleEmojiTouchMove(event: TouchEvent, _emojiId: string) {
  if (event.touches.length === 1) {
    const touch = event.touches[0]
    if (touch) {
      // Prevent default to avoid scrolling
      event.preventDefault()
      event.stopPropagation()
      
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      })
      handleCanvasMouseMove(mouseEvent)
    }
  }
}

function handleEmojiTouchEnd(event: TouchEvent, _emojiId: string) {
  // Prevent default to avoid scrolling
  event.preventDefault()
  event.stopPropagation()
  
  handleCanvasMouseUp()
}

// Gesture handling for mobile rotation
const gestureStartRotation = ref(0)
const isGestureRotating = ref(false)

function handleGestureStart(event: Event, emojiId: string) {
  if (isItemSelected(emojiId)) {
    isGestureRotating.value = true
    const emoji = getEmojiById(emojiId)
    if (emoji) {
      gestureStartRotation.value = emoji.rotation || 0
    }
  }
}

function handleGestureChange(event: Event, emojiId: string) {
  if (isGestureRotating.value && isItemSelected(emojiId)) {
    // Gesture events are not well typed in TypeScript, so we need to cast
    const gestureEvent = event as Event & { rotation?: number }
    const rotation = gestureEvent.rotation || 0
    const degrees = (rotation * 180) / Math.PI
    const newRotation = (gestureStartRotation.value + degrees) % 360
    
    // Apply rotation to all selected items
    for (const selectedId of selectedItemIds.value) {
      const emoji = getEmojiById(selectedId)
      if (emoji) {
        emoji.rotation = newRotation
      }
    }
    
    rotationAngle.value = newRotation
  }
}

function handleGestureEnd(_event: Event, _emojiId: string) {
  if (isGestureRotating.value) {
    isGestureRotating.value = false
    
    // Save rotation changes to database for all selected emojis
    for (const selectedId of selectedItemIds.value) {
      const emoji = getEmojiById(selectedId)
      if (emoji) {
        updateEmoji(selectedId, { 
          x: emoji.x, 
          y: emoji.y, 
          rotation: emoji.rotation 
        })
      }
    }
  }
}

// Pan and zoom handlers
function handleCanvasWheel(event: WheelEvent) {
  event.preventDefault()
  
  // Determine zoom sensitivity based on Ctrl key and device
  const isFineControl = event.ctrlKey || event.metaKey
  const zoomSensitivity = isFineControl ? 0.05 : 0.1
  const delta = event.deltaY > 0 ? (1 - zoomSensitivity) : (1 + zoomSensitivity)
  const newScale = Math.max(0.5, Math.min(2, canvasScale.value * delta))
  
  // Zoom towards mouse position
  const rect = canvasViewport.value?.getBoundingClientRect()
  if (rect) {
    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top
    
    const scaleChange = newScale / canvasScale.value
    canvasOffset.value.x = mouseX - (mouseX - canvasOffset.value.x) * scaleChange
    canvasOffset.value.y = mouseY - (mouseY - canvasOffset.value.y) * scaleChange
  }
  
  canvasScale.value = newScale
}

function startPan(event: MouseEvent | TouchEvent) {
  // Allow pan on mobile OR desktop with Space pressed
  if (!isMobile.value && !isSpacePressed.value) return
  
  isPanning.value = true
  const clientX = 'touches' in event ? event.touches[0]?.clientX ?? 0 : event.clientX
  const clientY = 'touches' in event ? event.touches[0]?.clientY ?? 0 : event.clientY
  
  panStart.value = {
    x: clientX,
    y: clientY,
    offsetX: canvasOffset.value.x,
    offsetY: canvasOffset.value.y
  }
}

function handlePan(event: MouseEvent | TouchEvent) {
  if (!isPanning.value) return
  
  event.preventDefault()
  const clientX = 'touches' in event ? event.touches[0]?.clientX ?? 0 : event.clientX
  const clientY = 'touches' in event ? event.touches[0]?.clientY ?? 0 : event.clientY
  
  const deltaX = clientX - panStart.value.x
  const deltaY = clientY - panStart.value.y
  
  canvasOffset.value.x = panStart.value.offsetX + deltaX
  canvasOffset.value.y = panStart.value.offsetY + deltaY
}

function endPan() {
  isPanning.value = false
}


// Status change watchers for toasts - removed live sync popup

        // Load emojis when page mounts
        onMounted(async () => {
          checkMobile()
          window.addEventListener('resize', checkMobile)
          
          await initializeEmojis()
          
          // Load undo/redo history
          await loadHistory()
          
          // Start real-time collaboration features
          await startRealtimeSync()
          startCursorTracking()
          
          // Start presence tracking for live users
          await startPresence()
        })



// Selection computed properties
const selectedItemCount = computed(() => selectedItemIds.value.size)

// Helper function to check if an item is selected
const isItemSelected = (itemId: string) => {
  return selectedItemIds.value.has(itemId)
}



// Selection helper functions
function clearSelection() {
  selectedItemIds.value = new Set()
  selectedEmojiId.value = null
  rotationAngle.value = 0
}

function selectItem(itemId: string) {
  // Clear existing selection and select only this item
  selectedItemIds.value = new Set([itemId])
    selectedEmojiId.value = itemId
  updateRotationFromSelection()
}


// Emoji functions
async function addEmoji(emojiChar: string) {
  let x = Math.random() * (canvasWidth.value - 100)
  let y = Math.random() * (canvasHeight.value - 100)
  
  // Apply grid snapping if enabled
  if (snapToGridEnabled.value) {
    const snapped = snapToGrid(x, y)
    x = snapped.x
    y = snapped.y
  }
  
  const emojiData = {
    emoji: emojiChar,
    x,
    y,
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
  // Check for Ctrl/Cmd key for multi-select
  const isMultiSelect = event.ctrlKey || event.metaKey
  
  if (isMultiSelect) {
    // Toggle item in selection
    if (selectedItemIds.value.has(emojiId)) {
      selectedItemIds.value.delete(emojiId)
      if (selectedEmojiId.value === emojiId) {
        selectedEmojiId.value = selectedItemIds.value.size > 0 
          ? Array.from(selectedItemIds.value)[0] ?? null
          : null
      }
    } else {
      selectedItemIds.value.add(emojiId)
      selectedEmojiId.value = emojiId
    }
    selectedItemIds.value = new Set(selectedItemIds.value) // Trigger reactivity
  } else {
    // If clicking on an already selected item, maintain selection and drag all
    if (selectedItemIds.value.has(emojiId)) {
      // Keep existing selection - don't clear it
      selectedEmojiId.value = emojiId
    } else {
      // Single select (clear existing selection and select only this item)
      selectItem(emojiId)
    }
  }
  
  // Store original positions for all selected items when drag starts
  const selectedEmojis = Array.from(selectedItemIds.value)
    .map(id => getEmojiById(id))
    .filter(emoji => emoji !== null)
  
  if (selectedEmojis.length > 0) {
    // Store both mouse position AND initial positions for all selected emojis
    dragStart.value = { 
      x: event.clientX, 
      y: event.clientY,
      emojiX: selectedEmojis[0]!.x, // Use first emoji as reference
      emojiY: selectedEmojis[0]!.y,
      selectedPositions: selectedEmojis.reduce((acc, emoji) => {
        acc[emoji!.id] = { x: emoji!.x, y: emoji!.y }
        return acc
      }, {} as Record<string, { x: number, y: number }>)
    }
    pendingDragEmojiId.value = emojiId
  }
}


function handleDrag(event: MouseEvent) {
  if (isDragging.value && selectedItemIds.value.size > 0) {
    const deltaX = event.clientX - dragStart.value.x
    const deltaY = event.clientY - dragStart.value.y
    
    // Move all selected items maintaining their relative positions
    for (const emojiId of selectedItemIds.value) {
      const emoji = getEmojiById(emojiId)
      if (emoji && dragStart.value?.selectedPositions?.[emojiId]) {
        // Calculate new position from INITIAL emoji position + delta
        let newX = dragStart.value.selectedPositions[emojiId]!.x + deltaX
        let newY = dragStart.value.selectedPositions[emojiId]!.y + deltaY
        
        // Add bounds checking to prevent going off-screen
        newX = Math.max(0, Math.min(newX, canvasWidth.value - 32))
        newY = Math.max(0, Math.min(newY, canvasHeight.value - 32))
        
        // Apply grid snapping if enabled
        if (snapToGridEnabled.value) {
          const snapped = snapToGrid(newX, newY)
          newX = snapped.x
          newY = snapped.y
        }
        
        emoji.x = newX
        emoji.y = newY
      }
    }
  }
}

async function endDrag() {
  if (isDragging.value && selectedItemIds.value.size > 0) {
    // Save all moved items to database
    for (const emojiId of selectedItemIds.value) {
      const emoji = getEmojiById(emojiId)
      if (emoji) {
        try {
          await updateEmoji(emojiId, {
            x: emoji.x,
            y: emoji.y
          })
        } catch (error) {
          console.error('❌ Error updating emoji position:', error)
        }
      }
    }
    
    isDragging.value = false
  }
}

// Resize functions
function startResize(event: MouseEvent, handleType: string, itemId: string | null) {
  if (!itemId) return
  
  event.preventDefault()
  event.stopPropagation()
  
  isResizing.value = true
  resizingItemId.value = itemId
  resizeHandle.value = handleType
  
  // Get current emoji dimensions
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
}

function handleResize(event: MouseEvent) {
  if (!isResizing.value || !resizingItemId.value || !resizeHandle.value) return
  
  const deltaX = event.clientX - resizeStart.value.x
  const deltaY = event.clientY - resizeStart.value.y
  
  const emoji = getEmojiById(resizingItemId.value)
  if (emoji) {
    handleEmojiResize(deltaX, deltaY, emoji)
  }
}

function handleEmojiResize(deltaX: number, deltaY: number, emoji: { size: number }) {
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
  
  // Apply grid snapping to size if enabled
  if (snapToGridEnabled.value) {
    newSize = snapToGridSingle(newSize)
  }
  
  // Update emoji size
  emoji.size = Math.round(newSize)
}


async function endResize() {
  if (!isResizing.value || !resizingItemId.value) return
  
  try {
    const emoji = getEmojiById(resizingItemId.value)
    if (emoji) {
      await updateEmoji(resizingItemId.value, {
        size: emoji.size
      })
    }
  } catch (error) {
    console.error('❌ Error updating emoji size:', error)
  }
  
  isResizing.value = false
  resizingItemId.value = null
  resizeHandle.value = null
}



// Canvas mouse handlers
function handleCanvasClick(event: MouseEvent) {
  // Only deselect if clicking on empty canvas space
  // and not during a selection box operation or just after completing one
  if (event.target === canvasViewport.value && !isSelecting.value && !justCompletedSelection.value) {
    clearSelection()
  }
}

function handleCanvasMouseDown(event: MouseEvent) {
  // Start panning on mobile if clicking on empty canvas
  if (isMobile.value && event.target === canvasViewport.value) {
    startPan(event)
    return
  }
  
  // Desktop behavior: check if Space is pressed for pan mode
  if (event.target === canvasViewport.value) {
    if (isSpacePressed.value) {
      // Space+drag = pan mode
      startPan(event)
      isGrabbing.value = true
    } else if (!event.ctrlKey && !event.metaKey) {
      // Default: start selection box
      isSelecting.value = true
      const rect = canvasViewport.value!.getBoundingClientRect()
      selectionStart.value = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      }
      selectionBox.value = {
        x: selectionStart.value.x,
        y: selectionStart.value.y,
        width: 0,
        height: 0
      }
    }
  }
}

function handleCanvasMouseMove(event: MouseEvent) {
  if (isPanning.value) {
    // Pan mode (mobile or desktop with Space)
    handlePan(event)
  } else if (isResizing.value) {
    handleResize(event)
  } else if (isDragging.value) {
    handleDrag(event)
  } else if (isSelecting.value) {
    // Update selection box
    const rect = canvasViewport.value!.getBoundingClientRect()
    const currentX = event.clientX - rect.left
    const currentY = event.clientY - rect.top
    
    selectionBox.value = {
      x: Math.min(selectionStart.value.x, currentX),
      y: Math.min(selectionStart.value.y, currentY),
      width: Math.abs(currentX - selectionStart.value.x),
      height: Math.abs(currentY - selectionStart.value.y)
    }
  } else if (pendingDragEmojiId.value) {
    // Start dragging when mouse actually moves
    const distance = Math.sqrt(
      Math.pow(event.clientX - dragStart.value.x, 2) + 
      Math.pow(event.clientY - dragStart.value.y, 2)
    )
    
    if (distance > 5) { // Minimum distance threshold to start dragging
      isDragging.value = true
      pendingDragEmojiId.value = null
    }
  }
}

async function handleCanvasMouseUp() {
  if (isPanning.value) {
    // Pan mode (mobile or desktop with Space)
    endPan()
    isGrabbing.value = false
  } else if (isResizing.value) {
    endResize()
  } else if (isDragging.value) {
    endDrag()
  } else if (isSelecting.value) {
    // Complete selection box and select emojis within it
    selectEmojisInBox()
    isSelecting.value = false
    justCompletedSelection.value = true
    selectionBox.value = { x: 0, y: 0, width: 0, height: 0 }
    
    // If no items were selected, clear the selection
    if (selectedItemIds.value.size === 0) {
      clearSelection()
    }
    
    // Reset the flag after a short delay to allow click event to be ignored
    setTimeout(() => {
      justCompletedSelection.value = false
    }, 100)
  }
  
  // Clear pending drag state
  pendingDragEmojiId.value = null
}



// Selection box collision detection
function selectEmojisInBox() {
  if (selectionBox.value.width < 2 || selectionBox.value.height < 2) {
    return
  }
  
  const selectedIds = new Set<string>()
  
  for (const emoji of emojis.value) {
    // Check if emoji is within selection box
    const emojiLeft = emoji.x
    const emojiRight = emoji.x + 32 // emoji width
    const emojiTop = emoji.y
    const emojiBottom = emoji.y + 32 // emoji height
    
    const boxLeft = selectionBox.value.x
    const boxRight = selectionBox.value.x + selectionBox.value.width
    const boxTop = selectionBox.value.y
    const boxBottom = selectionBox.value.y + selectionBox.value.height
    
    // Check if emoji overlaps with selection box (any overlap counts)
    if (emojiLeft < boxRight && emojiRight > boxLeft && 
        emojiTop < boxBottom && emojiBottom > boxTop) {
      selectedIds.add(emoji.id)
    }
  }
  
  // Update selection
  selectedItemIds.value = selectedIds
  if (selectedIds.size > 0) {
    selectedEmojiId.value = Array.from(selectedIds)[0] ?? null
  } else {
    selectedEmojiId.value = null
  }
}

async function clearCanvas() {
  await clearAllEmojis()
  selectedEmojiId.value = null
}

async function confirmClearAll() {
  await clearCanvas()
  showClearAllModal.value = false
}

function resetView() {
  // Reset view logic here
  console.log('Reset view')
}

function resetCanvasView() {
  canvasScale.value = 1
  canvasOffset.value = { x: 0, y: 0 }
}

function editEmoji(id: string) {
  // Cycle through sizes
  const emoji = getEmojiById(id)
  if (emoji) {
    const newSize = emoji.size === 32 ? 48 : emoji.size === 48 ? 64 : 32
    updateEmoji(id, { size: newSize })
  }
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
  
  // Rotate all selected items
  for (const emojiId of selectedItemIds.value) {
    const emoji = getEmojiById(emojiId)
    if (emoji) {
      emoji.rotation = numericAngle
      // Don't update database during rotation - only update visual state
    }
  }
}

function resetRotation() {
  rotationAngle.value = 0
  handleRotationChange(0)
}

async function deleteSelectedItem() {
  if (selectedItemIds.value.size > 0) {
    try {
      // Delete all selected items
      for (const emojiId of selectedItemIds.value) {
        await deleteEmoji(emojiId)
      }
      clearSelection()
    } catch (error) {
      console.error('❌ Error deleting emojis:', error)
    }
  }
}

async function deleteSingleEmoji(emojiId: string) {
  try {
    await deleteEmoji(emojiId)
    // Remove from selection if it was selected
    if (selectedItemIds.value.has(emojiId)) {
      selectedItemIds.value.delete(emojiId)
      if (selectedEmojiId.value === emojiId) {
        selectedEmojiId.value = selectedItemIds.value.size > 0 
          ? Array.from(selectedItemIds.value)[0] ?? null
          : null
      }
      selectedItemIds.value = new Set(selectedItemIds.value) // Trigger reactivity
    }
  } catch (error) {
    console.error('❌ Error deleting emoji:', error)
  }
}

function updateRotationFromSelection() {
  // Update rotation slider when selection changes
  if (selectedItemIds.value.size > 0) {
    // Use the first selected item's rotation as the reference
    const firstEmojiId = Array.from(selectedItemIds.value)[0]
    if (firstEmojiId) {
      const emoji = getEmojiById(firstEmojiId)
      if (emoji) {
        rotationAngle.value = emoji.rotation || 0
      }
    }
  } else {
    rotationAngle.value = 0
  }
}

function getCenterOfSelection() {
  if (selectedItemIds.value.size === 0) {
    return { x: 0, y: 0 }
  }
  
  let totalX = 0
  let totalY = 0
  let count = 0
  
  for (const emojiId of selectedItemIds.value) {
    const emoji = getEmojiById(emojiId)
    if (emoji) {
      totalX += emoji.x + 16 // Add half width for center
      totalY += emoji.y + 16 // Add half height for center
      count++
    }
  }
  
  return {
    x: count > 0 ? totalX / count - 16 : 0,
    y: count > 0 ? totalY / count - 16 : 0
  }
}

// Copy/paste functions
async function handleCopy() {
  if (selectedItemIds.value.size === 0) return
  
  const selectedEmojis = Array.from(selectedItemIds.value)
    .map(id => getEmojiById(id))
    .filter(emoji => emoji !== null)
    .map(emoji => ({
      emoji: emoji!.emoji,
      x: emoji!.x,
      y: emoji!.y,
      size: emoji!.size,
      layer: emoji!.layer,
      rotation: emoji!.rotation
    }))
  
  if (selectedEmojis.length > 0) {
    copyItems(selectedEmojis)
    toast.add({
      title: 'Copied',
      description: `${selectedEmojis.length} item(s) copied to clipboard`,
      color: 'success',
      icon: 'i-heroicons-check-circle'
    })
  }
}

async function handlePaste() {
  if (!clipboardHasData.value) return
  
  const pastedData = pasteItems()
  if (pastedData.length === 0) return
  
  const newEmojiIds: string[] = []
  
  // Add each pasted emoji to the canvas
  for (const emojiData of pastedData) {
    const newEmoji = await addEmojiToCanvas(emojiData)
    if (newEmoji) {
      newEmojiIds.push(newEmoji.id)
    }
  }
  
  if (newEmojiIds.length > 0) {
    // Select the newly pasted emojis
    selectedItemIds.value = new Set(newEmojiIds)
    selectedEmojiId.value = newEmojiIds[0] || null // Select first one for rotation controls
    
    toast.add({
      title: 'Pasted',
      description: `${newEmojiIds.length} item(s) pasted`,
      color: 'success',
      icon: 'i-heroicons-check-circle'
    })
  }
}

function startRotation(event: MouseEvent) {
  isRotating.value = true
  
  // Store initial rotation values for all selected emojis
  for (const emojiId of selectedItemIds.value) {
    const emoji = getEmojiById(emojiId)
    if (emoji) {
      const initialRot = emoji.rotation || 0
      initialRotations.value.set(emojiId, initialRot)
    }
  }
  
  // Calculate center point for rotation
  const rect = (event.target as HTMLElement).getBoundingClientRect()
  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2
  
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
    
    // Save rotation changes to database for all selected emojis
    for (const emojiId of selectedItemIds.value) {
      const emoji = getEmojiById(emojiId)
      if (emoji) {
        updateEmoji(emojiId, { 
          x: emoji.x, 
          y: emoji.y, 
          rotation: emoji.rotation 
        })
      }
    }
    
    initialRotations.value.clear()
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

function startRotationTouch(event: TouchEvent) {
  event.preventDefault()
  event.stopPropagation()
  
  if (event.touches.length === 1) {
    const touch = event.touches[0]
    if (touch) {
      // Convert touch to mouse event for existing rotation logic
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY,
        button: 0
      })
      startRotation(mouseEvent)
    }
  }
}


// Keyboard shortcuts
onMounted(() => {
  const handleKeyDown = async (event: KeyboardEvent) => {
    // Check if user is typing in an input field
    const isTypingInInput = event.target instanceof HTMLInputElement || 
                           event.target instanceof HTMLTextAreaElement ||
                           event.target instanceof HTMLSelectElement ||
                           (event.target as HTMLElement)?.contentEditable === 'true'
    
    // Spacebar for pan mode (only on desktop)
    if (event.code === 'Space' && !isTypingInInput && !isMobile.value) {
      event.preventDefault()
      isSpacePressed.value = true
      return
    }
    
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
    
    // Copy selected items (Cmd/Ctrl + C)
    if ((event.metaKey || event.ctrlKey) && event.key === 'c') {
      event.preventDefault()
      await handleCopy()
    }
    
    // Paste items (Cmd/Ctrl + V)
    if ((event.metaKey || event.ctrlKey) && event.key === 'v') {
      event.preventDefault()
      await handlePaste()
    }
  }
  
  const handleKeyUp = (event: KeyboardEvent) => {
    // Release spacebar pan mode
    if (event.code === 'Space' && !isMobile.value) {
      isSpacePressed.value = false
      isGrabbing.value = false
    }
  }
  
  document.addEventListener('keydown', handleKeyDown)
  document.addEventListener('keyup', handleKeyUp)
  
  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown)
    document.removeEventListener('keyup', handleKeyUp)
  })
})

        // Cleanup real-time features on unmount
        onScopeDispose(() => {
          stopCursorTracking()
          cleanupRealtimeSync()
          stopPresence()
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

.emoji-item:hover:not(.selected) {
  transform: scale(1.05);
}

.emoji-item.selected {
  /* Selection styling handled by inline boxShadow */
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
  transition: cursor 0.1s ease; /* Smooth cursor transitions */
  /* Ensure canvas fills entire available space */
  width: 100%;
  height: 100%;
  min-height: 100%;
}

/* Canvas viewport for zoom and pan */
.canvas-viewport {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  touch-action: none;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}

/* Cursor states for different interaction modes */
.cursor-grab {
  cursor: grab;
}

.cursor-grabbing {
  cursor: grabbing;
}

.cursor-crosshair {
  cursor: crosshair;
}

/* Mobile-specific optimizations */
@media (max-width: 767px) {
  .emoji-item:hover {
    transform: none; /* Disable hover effects on mobile */
  }
  
  /* Ensure touch targets are large enough */
  .emoji-item {
    min-width: 44px;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  /* Make rotation handles larger on mobile */
  .canvas-container :deep(.absolute.-top-8) {
    width: 44px;
    height: 44px;
    top: -50px;
    min-width: 44px;
    min-height: 44px;
  }
  
  .canvas-container :deep(.absolute.-top-8 .w-3) {
    width: 20px;
    height: 20px;
  }
  
  /* Mobile delete button improvements */
  .canvas-container :deep(.emoji-item .absolute.-top-2.-right-2) {
    min-width: 32px;
    min-height: 32px;
  }
  
  .canvas-container :deep(.emoji-item .absolute.-top-2.-right-2 .w-6) {
    width: 32px;
    height: 32px;
  }
  
  .canvas-container :deep(.emoji-item .absolute.-top-2.-right-2 .w-3) {
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

/* Selection styles handled by inline styles */

/* Grid overlay styles */
.grid-overlay {
  opacity: 0.3;
  z-index: 1;
  pointer-events: none;
}

</style>
