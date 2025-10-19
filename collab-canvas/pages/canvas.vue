<template>
        <AppLayout 
          :is-connected="isConnected"
          :is-mobile="isMobile"
          :user-count="onlineUsers.length"
          @toggle-users="showUsersModal = !showUsersModal"
          @show-ai-chat="showAIChat = !showAIChat"
        >
          <div class="h-full w-full bg-gradient-to-br from-blue-50 to-purple-50 flex flex-col">
      
      <!-- Main Content -->
      <div class="flex-1 flex relative">
        <!-- Mobile Tool Button -->
        <UButton
          v-if="isMobile"
          icon="i-lucide-palette"
          color="primary"
          variant="solid"
          size="sm"
          class="fixed top-20 right-4 z-40 sm:hidden"
          @click="openToolPalette"
        />
        
        <!-- Canvas Area -->
        <div class="flex-1 flex items-start justify-center p-2 pt-4 canvas-container">
          <div 
            ref="canvasContainer"
            class="border-2 border-pink-500 rounded-xl shadow-lg bg-white relative overflow-hidden"
            :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }"
            data-tool="emoji"
            data-testid="canvas-container"
            @mousedown="handleCanvasMouseDown"
            @mousemove="handleCanvasMouseMove"
            @mouseup="handleCanvasMouseUp"
            @click="handleCanvasClick"
            @touchstart="handleCanvasTouchStart"
            @touchmove="handleCanvasTouchMove"
            @touchend="handleCanvasTouchEnd"
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
                boxShadow: isItemSelected(emoji.id) ? '0 0 0 3px #ff0000' : 'none',
                outline: isItemSelected(emoji.id) ? '2px solid #00ff00' : 'none',
                outlineOffset: '2px',
                backgroundColor: isItemSelected(emoji.id) ? 'rgba(255, 0, 0, 0.2)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }"
              @mousedown.stop="startEmojiDrag($event, emoji.id)"
              @touchstart.stop="startEmojiTouch($event, emoji.id)"
              @dblclick="editEmoji(emoji.id)"
            >
              {{ emoji.emoji }}
              <div v-if="isItemSelected(emoji.id)" style="position: absolute; top: -5px; left: -5px; background: red; color: white; font-size: 10px; padding: 2px; border-radius: 3px;">SEL</div>
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

            <!-- Selection Handles (Rotation + Resize) -->
            <div
              v-if="selectedEmojiId"
              class="absolute pointer-events-none"
              :style="{
                left: getEmojiById(selectedEmojiId)?.x + 'px',
                top: getEmojiById(selectedEmojiId)?.y + 'px',
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
                @touchstart.stop="(event: TouchEvent) => startRotation(event as unknown as MouseEvent)"
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
          
          <!-- Cursor Overlay for Real-time Collaboration -->
          <CursorOverlay />
        </div>
        
        <!-- Floating Tool Palette -->
                <ToolPalette
                  ref="toolPaletteRef"
                  :selected-emoji-id="selectedEmojiId"
                  :selected-item-count="selectedItemCount"
                  :rotation-angle="rotationAngle"
                  :can-undo="canUndo"
                  :can-redo="canRedo"
                  :snap-to-grid-enabled="snapToGridEnabled"
                  :clipboard-has-data="clipboardHasData"
                  @show-emoji-picker="showEmojiPicker = true"
                  @show-ai-chat="showAIChat = !showAIChat"
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
import { ref, onMounted, onUnmounted, computed, onScopeDispose, watch } from 'vue'

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

// Responsive canvas dimensions - optimized for space efficiency
const canvasWidth = computed(() => {
  if (isMobile.value) {
    return window.innerWidth - 24 // Mobile: full width with minimal padding
  } else if (window.innerWidth < 1024) {
    return Math.min(window.innerWidth * 0.85, window.innerWidth - 400) // Tablet: 85% of width, leave room for tools
  }
  return window.innerWidth - 400 // Desktop: full width minus space for tool palette
})

const canvasHeight = computed(() => {
  if (isMobile.value) {
    return window.innerHeight - 140 // Mobile: most of viewport height minus header
  } else if (window.innerWidth < 1024) {
    return Math.min(window.innerHeight * 0.8, window.innerHeight - 120) // Tablet: 80% of height
  }
  return window.innerHeight - 120 // Desktop: full height minus header
})

        // State
        const showAIChat = ref(false)
        const showUsersModal = ref(false)
        const showEmojiPicker = ref(false)
        const showClearAllModal = ref(false)
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
const _textInput = ref<HTMLInputElement | null>(null)
const toolPaletteRef = ref<{ openDrawer: () => void } | null>(null)

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
  if (event.target === canvasContainer.value && !isSelecting.value && !justCompletedSelection.value) {
    clearSelection()
  }
}

function handleCanvasMouseDown(event: MouseEvent) {
  // Only start selection box if clicking on empty canvas space (not on an emoji)
  if (event.target === canvasContainer.value) {
    // Don't start selection if Ctrl/Cmd is held (for multi-select)
    if (!event.ctrlKey && !event.metaKey) {
      // Start selection box (don't clear selection yet - wait until mouse up)
      isSelecting.value = true
      const rect = canvasContainer.value!.getBoundingClientRect()
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
  if (isResizing.value) {
    handleResize(event)
  } else if (isDragging.value) {
    handleDrag(event)
  } else if (isSelecting.value) {
    // Update selection box
    const rect = canvasContainer.value!.getBoundingClientRect()
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
  if (isResizing.value) {
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
  
  // Store initial rotation value for selected emoji
  if (selectedEmojiId.value) {
    const emoji = getEmojiById(selectedEmojiId.value)
    if (emoji) {
      const initialRot = emoji.rotation || 0
      initialRotations.value.set(selectedEmojiId.value, initialRot)
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
    
    // Save rotation change to database
    if (selectedEmojiId.value) {
      const emoji = getEmojiById(selectedEmojiId.value)
      if (emoji) {
        updateEmoji(selectedEmojiId.value, { 
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
  
  document.addEventListener('keydown', handleKeyDown)
  
  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown)
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

.emoji-item:hover {
  transform: scale(1.1);
}

.emoji-item.selected {
  outline: 2px solid #3b82f6;
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
.canvas-container .emoji-item.selected {
  position: relative !important;
}

/* Grid overlay styles */
.grid-overlay {
  opacity: 0.3;
  z-index: 1;
  pointer-events: none;
}

</style>
