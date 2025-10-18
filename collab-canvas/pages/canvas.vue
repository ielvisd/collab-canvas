<template>
  <AppLayout>
    <div class="h-full w-full bg-gradient-to-br from-blue-50 to-purple-50 flex flex-col">
      <!-- Single Professional Header -->
      <div class="bg-black/90 backdrop-blur-sm border-b-2 border-pink-500 p-4 shadow-lg">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <h1 class="text-3xl font-bold text-white font-display">EmojiKai 🎨</h1>
            <div class="flex items-center gap-2 text-sm text-pink-300 font-body">
              <div class="w-2 h-2 bg-gradient-to-r from-pink-400 to-pink-600 rounded-full animate-pulse"/>
              <span>Live Sync</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <!-- AI Status Indicator - Clickable to open chat -->
            <button 
              class="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-lg border border-pink-400/30 hover:from-pink-500/30 hover:to-purple-500/30 hover:border-pink-400/50 transition-all duration-200 cursor-pointer group"
              @click="showAIChat = !showAIChat"
            >
              <UIcon name="i-heroicons-sparkles" class="w-4 h-4 text-pink-400 animate-pulse group-hover:text-pink-300" />
              <span class="text-sm font-medium text-pink-300 group-hover:text-white">AI Ready</span>
            </button>
            
            <UButton
              icon="i-lucide-users"
              label="Users"
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
          <div class="flex-1 flex flex-col canvas-container">
          <!-- Emoji-First Toolbar -->
          <div class="bg-black/80 backdrop-blur-sm border-b-2 border-pink-500 p-4 shadow-lg">
            <div class="flex items-center justify-between">
              <!-- Primary Tools (Emoji-First) -->
              <div class="flex items-center gap-3">
          <UButton 
                  label="🎨 Emoji"
                  color="primary"
            variant="solid"
                  size="lg"
                  class="font-body bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white border-0 shadow-lg"
                  @click="showEmojiPicker = true"
                />
                
                <USeparator orientation="vertical" class="h-8" />
                
                <!-- Secondary Tools -->
                <div class="flex items-center gap-2">
                  <UButton
                    :variant="currentTool === 'select' ? 'solid' : 'outline'"
                    size="sm"
                    class="font-body text-white border-pink-400 hover:bg-pink-500/20"
                    @click="setTool('select')"
                  >
                    <UIcon name="i-lucide-move" class="w-4 h-4 mr-2" />
                    Select
          </UButton>
                  
            <UButton 
                    :variant="currentTool === 'pen' ? 'solid' : 'outline'"
                    size="sm"
                    class="font-body text-white border-pink-400 hover:bg-pink-500/20"
                    @click="setTool('pen')"
                  >
                    <UIcon name="i-lucide-pen-tool" class="w-4 h-4 mr-2" />
                    Pen
            </UButton>
                  
                  <UDropdownMenu :items="shapeMenuItems" :ui="{ content: 'w-48' }">
            <UButton 
                      color="neutral" 
              variant="outline" 
                      size="sm"
                      class="font-body text-white border-pink-400 hover:bg-pink-500/20"
                      trailing-icon="i-heroicons-chevron-down"
            >
                      <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-2" />
                      Shapes
            </UButton>
                  </UDropdownMenu>
                  
                  <!-- Rotation Controls -->
                  <div v-if="(selectedEmojiId || selectedShapeId) && currentTool === 'select'" class="flex items-center gap-2 ml-4 pl-4 border-l border-pink-400/30">
                    <UIcon name="i-lucide-rotate-3d" class="w-4 h-4 text-pink-300" />
                    <USlider
                      v-model="rotationAngle"
                      :min="0"
                      :max="360"
                      :step="5"
                      size="sm"
                      class="w-24"
                      tooltip
                      @update:model-value="handleRotationChange"
                    />
                    <UButton
                      icon="i-lucide-rotate-ccw"
                      size="xs"
                      color="neutral"
                      variant="outline"
                      class="font-body"
                      @click="resetRotation"
                    />
                  </div>
                  
                  <!-- Color Picker for Shapes -->
                  <div v-if="selectedShapeId && currentTool === 'select'" class="flex items-center gap-2 ml-4 pl-4 border-l border-pink-400/30">
                    <UIcon name="i-lucide-palette" class="w-4 h-4 text-pink-300" />
                    <UPopover>
                      <UButton 
                        size="sm" 
                        color="neutral" 
                        variant="outline"
                        class="font-body text-white border-pink-400 hover:bg-pink-500/20"
                      >
                        <template #leading>
                          <span :style="{ backgroundColor: selectedShapeColor }" class="size-3 rounded-full border border-pink-400" />
                        </template>
                        Color
                      </UButton>
                      
                      <template #content>
                        <div class="p-4 bg-black/90 border border-pink-500 rounded-lg">
                          <UColorPicker 
                            v-model="selectedShapeColor" 
                            class="p-2"
                            :ui="{
                              root: 'data-[disabled]:opacity-75',
                              picker: 'flex gap-4',
                              selector: 'rounded-md touch-none',
                              selectorBackground: 'w-full h-full relative rounded-md',
                              selectorThumb: '-translate-y-1/2 -translate-x-1/2 absolute size-4 ring-2 ring-white rounded-full cursor-pointer data-[disabled]:cursor-not-allowed',
                              track: 'w-[8px] relative rounded-md touch-none',
                              trackThumb: 'absolute transform -translate-y-1/2 -translate-x-[4px] rtl:translate-x-[4px] size-4 rounded-full ring-2 ring-white cursor-pointer data-[disabled]:cursor-not-allowed'
                            }"
                            @update:model-value="handleColorChange"
                          />
                        </div>
                      </template>
                    </UPopover>
                  </div>
                </div>
        </div>
        
        <!-- Action Buttons -->
              <div class="flex items-center gap-2">
            <UButton 
                  icon="i-lucide-trash-2"
                  label="Clear"
              color="error" 
              variant="outline" 
                  size="sm"
                  class="font-body text-white border-red-400 hover:bg-red-500/20"
              @click="clearCanvas"
                />
            <UButton 
                  icon="i-lucide-rotate-ccw"
                  label="Reset View"
              color="neutral" 
              variant="outline" 
                  size="sm"
                  class="font-body text-white border-pink-400 hover:bg-pink-500/20"
              @click="resetView"
                />
        </div>
      </div>
    </div>

    <!-- Canvas Container -->
          <div class="flex-1 flex items-center justify-center p-4">
      <div 
        ref="canvasContainer"
              class="border-2 border-pink-500 rounded-xl shadow-lg bg-white relative overflow-hidden"
              :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }"
              @mousedown="handleCanvasMouseDown"
              @mousemove="handleCanvasMouseMove"
              @mouseup="handleCanvasMouseUp"
              @click="handleCanvasClick"
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
                  backgroundColor: shape.fill,
                  border: `2px solid ${shape.stroke}`,
                  borderRadius: shape.type === 'circle' ? '50%' : '4px',
                  zIndex: 1,
                  transform: `rotate(${shape.rotation || 0}deg)`
                }"
                @mousedown.stop="startShapeDrag($event, shape.id)"
                @click.stop="selectShape(shape.id)"
              >
                <div v-if="shape.type === 'text'" class="p-2 text-sm font-body">
                  {{ (shape as any).text }}
      </div>
    </div>

              <!-- Pen Strokes -->
              <svg
                v-if="penStrokes.length > 0"
                class="absolute inset-0 pointer-events-none"
                :style="{ zIndex: 1000 }"
              >
                <path
                  v-for="stroke in penStrokes"
                  :key="stroke.id"
                  :d="stroke.path"
                  :stroke="stroke.color"
                  :stroke-width="stroke.width"
                  fill="none"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="pen-stroke"
                />
              </svg>

              <!-- Current Pen Stroke -->
              <svg
                v-if="currentPenStroke"
                class="absolute inset-0 pointer-events-none"
                :style="{ zIndex: 1001 }"
              >
                <path
                  :d="currentPenStroke"
                  :stroke="penColor"
                  :stroke-width="penWidth"
                  fill="none"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="pen-stroke"
                />
              </svg>

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
                >
                  <UIcon name="i-lucide-rotate-3d" class="w-3 h-3 text-white" />
                </div>
                
                <!-- Center Point -->
                <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full border border-white"/>
              </div>
            </div>
              </div>
            </div>
            
        <!-- Sidebar -->
        <div v-if="showPresence" class="w-80 bg-black/90 backdrop-blur-sm border-l-2 border-pink-500 shadow-lg">
          <PresenceSidebar />
            </div>
          </div>
          
      <!-- AI Chat Interface -->
      <AIChatInterface v-if="showAIChat" :show-chat="showAIChat" @update:show-chat="showAIChat = $event" />

      <!-- Emoji Picker Modal -->
      <UModal 
        v-model:open="showEmojiPicker" 
        title="🎨 Choose an Emoji" 
        :ui="{ 
          overlay: 'fixed inset-0 bg-black/75',
          content: 'fixed bg-black/90 border-2 border-pink-500 rounded-xl shadow-2xl',
          header: 'bg-black/90 border-b-2 border-pink-500',
          title: 'text-xl font-display text-pink-300',
          body: 'bg-black/90',
          close: 'text-pink-300 hover:text-white hover:bg-pink-500/20'
        }"
      >
        <template #content>
          <div class="p-4 bg-black/90">
            <UCommandPalette
              v-model:search-term="searchTerm"
              :groups="emojiGroups"
              placeholder="Search emojis... 🔍"
              icon="i-lucide-smile"
              class="h-96"
              :ui="{ 
                input: '[&>input]:h-12 [&>input]:text-lg [&>input]:bg-black/50 [&>input]:border-pink-400 [&>input]:text-pink-100 [&>input]:placeholder-pink-300',
                item: 'group relative w-full flex items-center gap-3 p-3 text-base select-none outline-none before:absolute before:z-[-1] before:inset-px before:rounded-lg data-disabled:cursor-not-allowed data-disabled:opacity-75 hover:bg-pink-500/20 text-pink-100',
                itemLabel: 'text-lg font-body text-pink-100',
                empty: 'text-pink-300'
              }"
              @update:model-value="handleEmojiSelect"
            />
        </div>
      </template>
    </UModal>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'

// Composables
import { useEmojis } from '~/composables/useEmojis'
import { useShapesWithPersistence } from '~/composables/useShapesWithPersistence'

// Auth middleware
definePageMeta({
  middleware: 'auth'
})

// Canvas dimensions
const canvasWidth = 1000
const canvasHeight = 700

// State
const showPresence = ref(false)
const showAIChat = ref(false) // AI chat closed by default
const showEmojiPicker = ref(false)
const currentTool = ref<'select' | 'pen'>('select')
const selectedEmojiId = ref<string | null>(null)
const selectedShapeId = ref<string | null>(null)
const searchTerm = ref('')
const rotationAngle = ref(0)
const isRotating = ref(false)
const selectedShapeColor = ref('#3B82F6') // Default blue color

// Canvas ref
const canvasContainer = ref<HTMLElement | null>(null)

// Drag state
const pendingDragShapeId = ref<string | null>(null)
const pendingDragEmojiId = ref<string | null>(null)

// Emoji system
const {
  emojis,
  addEmoji: addEmojiToCanvas,
  updateEmoji,
  clearAllEmojis,
  getEmojiById
} = useEmojis(canvasWidth, canvasHeight)

// Shape system for AI-created shapes
const {
  rectangles,
  circles,
  texts,
  loadShapesFromDatabase,
  addRectangle: addRectangleToCanvas,
  addCircle: addCircleToCanvas,
  addText: addTextToCanvas,
  updateShape
} = useShapesWithPersistence()

// Load shapes when page mounts
onMounted(async () => {
  await loadShapesFromDatabase()
})

// Shape interfaces - removed unused Shape interface

interface PenStroke {
  id: string
  path: string
  color: string
  width: number
}

// Pen strokes
const penStrokes = ref<PenStroke[]>([])

// Computed - All shapes combined for rendering
const allShapes = computed(() => [
  ...rectangles.value,
  ...circles.value,
  ...texts.value
])

// Drag state
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const originalPosition = ref({ x: 0, y: 0 })

// Pen drawing state
const isDrawing = ref(false)
const currentPenStroke = ref('')
const penColor = ref('#000000')
const penWidth = ref(3)
const lastPenPosition = ref({ x: 0, y: 0 })
const penPoints = ref<Array<{x: number, y: number}>>([])

// Emoji picker data
const emojiGroups = ref([
  {
    id: 'faces',
    label: 'Faces & Emotions',
    items: [
      { label: '😀', value: '😀' },
      { label: '😃', value: '😃' },
      { label: '😄', value: '😄' },
      { label: '😁', value: '😁' },
      { label: '😆', value: '😆' },
      { label: '😅', value: '😅' },
      { label: '🤣', value: '🤣' },
      { label: '😂', value: '😂' },
      { label: '🙂', value: '🙂' },
      { label: '🙃', value: '🙃' },
      { label: '😉', value: '😉' },
      { label: '😊', value: '😊' },
      { label: '😇', value: '😇' },
      { label: '🥰', value: '🥰' },
      { label: '😍', value: '😍' },
      { label: '🤩', value: '🤩' },
      { label: '😘', value: '😘' },
      { label: '😗', value: '😗' },
      { label: '😚', value: '😚' },
      { label: '😙', value: '😙' },
      { label: '😋', value: '😋' },
      { label: '😛', value: '😛' },
      { label: '😜', value: '😜' },
      { label: '🤪', value: '🤪' },
      { label: '😝', value: '😝' },
      { label: '🤑', value: '🤑' },
      { label: '🤗', value: '🤗' },
      { label: '🤭', value: '🤭' },
      { label: '🤫', value: '🤫' },
      { label: '🤔', value: '🤔' },
      { label: '🤐', value: '🤐' },
      { label: '🤨', value: '🤨' },
      { label: '😐', value: '😐' },
      { label: '😑', value: '😑' },
      { label: '😶', value: '😶' },
      { label: '😏', value: '😏' },
      { label: '😒', value: '😒' },
      { label: '🙄', value: '🙄' },
      { label: '😬', value: '😬' },
      { label: '🤥', value: '🤥' },
      { label: '😔', value: '😔' },
      { label: '😕', value: '😕' },
      { label: '🙁', value: '🙁' },
      { label: '☹️', value: '☹️' },
      { label: '😣', value: '😣' },
      { label: '😖', value: '😖' },
      { label: '😫', value: '😫' },
      { label: '😩', value: '😩' },
      { label: '🥺', value: '🥺' },
      { label: '😢', value: '😢' },
      { label: '😭', value: '😭' },
      { label: '😤', value: '😤' },
      { label: '😠', value: '😠' },
      { label: '😡', value: '😡' },
      { label: '🤬', value: '🤬' },
      { label: '🤯', value: '🤯' },
      { label: '😳', value: '😳' },
      { label: '🥵', value: '🥵' },
      { label: '🥶', value: '🥶' },
      { label: '😱', value: '😱' },
      { label: '😨', value: '😨' },
      { label: '😰', value: '😰' },
      { label: '😥', value: '😥' },
      { label: '😓', value: '😓' },
      { label: '🤗', value: '🤗' },
      { label: '🤔', value: '🤔' },
      { label: '🤭', value: '🤭' },
      { label: '🤫', value: '🤫' },
      { label: '🤥', value: '🤥' },
      { label: '🤐', value: '🤐' },
      { label: '🤨', value: '🤨' },
      { label: '😐', value: '😐' },
      { label: '😑', value: '😑' },
      { label: '😶', value: '😶' },
      { label: '😏', value: '😏' },
      { label: '😒', value: '😒' },
      { label: '🙄', value: '🙄' },
      { label: '😬', value: '😬' },
      { label: '🤥', value: '🤥' },
      { label: '😔', value: '😔' },
      { label: '😕', value: '😕' },
      { label: '🙁', value: '🙁' },
      { label: '☹️', value: '☹️' },
      { label: '😣', value: '😣' },
      { label: '😖', value: '😖' },
      { label: '😫', value: '😫' },
      { label: '😩', value: '😩' },
      { label: '🥺', value: '🥺' },
      { label: '😢', value: '😢' },
      { label: '😭', value: '😭' },
      { label: '😤', value: '😤' },
      { label: '😠', value: '😠' },
      { label: '😡', value: '😡' },
      { label: '🤬', value: '🤬' },
      { label: '🤯', value: '🤯' },
      { label: '😳', value: '😳' },
      { label: '🥵', value: '🥵' },
      { label: '🥶', value: '🥶' },
      { label: '😱', value: '😱' },
      { label: '😨', value: '😨' },
      { label: '😰', value: '😰' },
      { label: '😥', value: '😥' },
      { label: '😓', value: '😓' }
    ]
  },
  {
    id: 'animals',
    label: 'Animals & Nature',
    items: [
      { label: '🐶', value: '🐶' },
      { label: '🐱', value: '🐱' },
      { label: '🐭', value: '🐭' },
      { label: '🐹', value: '🐹' },
      { label: '🐰', value: '🐰' },
      { label: '🦊', value: '🦊' },
      { label: '🐻', value: '🐻' },
      { label: '🐼', value: '🐼' },
      { label: '🐨', value: '🐨' },
      { label: '🐯', value: '🐯' },
      { label: '🦁', value: '🦁' },
      { label: '🐮', value: '🐮' },
      { label: '🐷', value: '🐷' },
      { label: '🐸', value: '🐸' },
      { label: '🐵', value: '🐵' },
      { label: '🙈', value: '🙈' },
      { label: '🙉', value: '🙉' },
      { label: '🙊', value: '🙊' },
      { label: '🐒', value: '🐒' },
      { label: '🐔', value: '🐔' },
      { label: '🐧', value: '🐧' },
      { label: '🐦', value: '🐦' },
      { label: '🐤', value: '🐤' },
      { label: '🐣', value: '🐣' },
      { label: '🐥', value: '🐥' },
      { label: '🦆', value: '🦆' },
      { label: '🦅', value: '🦅' },
      { label: '🦉', value: '🦉' },
      { label: '🦇', value: '🦇' },
      { label: '🐺', value: '🐺' },
      { label: '🐗', value: '🐗' },
      { label: '🐴', value: '🐴' },
      { label: '🦄', value: '🦄' },
      { label: '🐝', value: '🐝' },
      { label: '🐛', value: '🐛' },
      { label: '🦋', value: '🦋' },
      { label: '🐌', value: '🐌' },
      { label: '🐞', value: '🐞' },
      { label: '🐜', value: '🐜' },
      { label: '🦟', value: '🦟' },
      { label: '🦗', value: '🦗' },
      { label: '🕷️', value: '🕷️' },
      { label: '🕸️', value: '🕸️' },
      { label: '🦂', value: '🦂' },
      { label: '🐢', value: '🐢' },
      { label: '🐍', value: '🐍' },
      { label: '🦎', value: '🦎' },
      { label: '🦖', value: '🦖' },
      { label: '🦕', value: '🦕' },
      { label: '🐙', value: '🐙' },
      { label: '🦑', value: '🦑' },
      { label: '🦐', value: '🦐' },
      { label: '🦞', value: '🦞' },
      { label: '🦀', value: '🦀' },
      { label: '🐡', value: '🐡' },
      { label: '🐠', value: '🐠' },
      { label: '🐟', value: '🐟' },
      { label: '🐬', value: '🐬' },
      { label: '🐳', value: '🐳' },
      { label: '🐋', value: '🐋' },
      { label: '🦈', value: '🦈' },
      { label: '🐊', value: '🐊' },
      { label: '🐅', value: '🐅' },
      { label: '🐆', value: '🐆' },
      { label: '🦓', value: '🦓' },
      { label: '🦍', value: '🦍' },
      { label: '🐘', value: '🐘' },
      { label: '🦏', value: '🦏' },
      { label: '🦛', value: '🦛' },
      { label: '🐪', value: '🐪' },
      { label: '🐫', value: '🐫' },
      { label: '🦒', value: '🦒' },
      { label: '🦘', value: '🦘' },
      { label: '🐃', value: '🐃' },
      { label: '🐂', value: '🐂' },
      { label: '🐄', value: '🐄' },
      { label: '🐎', value: '🐎' },
      { label: '🐖', value: '🐖' },
      { label: '🐏', value: '🐏' },
      { label: '🐑', value: '🐑' },
      { label: '🐐', value: '🐐' },
      { label: '🦌', value: '🦌' },
      { label: '🐕', value: '🐕' },
      { label: '🐩', value: '🐩' },
      { label: '🐈', value: '🐈' },
      { label: '🐓', value: '🐓' },
      { label: '🦃', value: '🦃' },
      { label: '🦚', value: '🦚' },
      { label: '🦜', value: '🦜' },
      { label: '🦢', value: '🦢' },
      { label: '🦩', value: '🦩' },
      { label: '🕊️', value: '🕊️' },
      { label: '🐇', value: '🐇' },
      { label: '🦝', value: '🦝' },
      { label: '🦨', value: '🦨' },
      { label: '🦡', value: '🦡' },
      { label: '🦦', value: '🦦' },
      { label: '🦥', value: '🦥' },
      { label: '🐁', value: '🐁' },
      { label: '🐀', value: '🐀' },
      { label: '🐿️', value: '🐿️' },
      { label: '🦔', value: '🦔' },
      { label: '🐾', value: '🐾' },
      { label: '🐉', value: '🐉' },
      { label: '🐲', value: '🐲' }
    ]
  },
  {
    id: 'objects',
    label: 'Objects & Things',
    items: [
      { label: '🎨', value: '🎨' },
      { label: '🎭', value: '🎭' },
      { label: '🎪', value: '🎪' },
      { label: '🎯', value: '🎯' },
      { label: '🎲', value: '🎲' },
      { label: '🎳', value: '🎳' },
      { label: '🎮', value: '🎮' },
      { label: '🕹️', value: '🕹️' },
      { label: '🎰', value: '🎰' },
      { label: '🧩', value: '🧩' },
      { label: '🎲', value: '🎲' },
      { label: '♠️', value: '♠️' },
      { label: '♥️', value: '♥️' },
      { label: '♦️', value: '♦️' },
      { label: '♣️', value: '♣️' },
      { label: '🃏', value: '🃏' },
      { label: '🀄', value: '🀄' },
      { label: '🎴', value: '🎴' },
      { label: '🎭', value: '🎭' },
      { label: '🎨', value: '🎨' },
      { label: '🎬', value: '🎬' },
      { label: '🎤', value: '🎤' },
      { label: '🎧', value: '🎧' },
      { label: '🎼', value: '🎼' },
      { label: '🎵', value: '🎵' },
      { label: '🎶', value: '🎶' },
      { label: '🎹', value: '🎹' },
      { label: '🥁', value: '🥁' },
      { label: '🎷', value: '🎷' },
      { label: '🎺', value: '🎺' },
      { label: '🎸', value: '🎸' },
      { label: '🪕', value: '🪕' },
      { label: '🎻', value: '🎻' },
      { label: '🪗', value: '🪗' },
      { label: '🎲', value: '🎲' },
      { label: '🎯', value: '🎯' },
      { label: '🎳', value: '🎳' },
      { label: '🎮', value: '🎮' },
      { label: '🕹️', value: '🕹️' },
      { label: '🎰', value: '🎰' },
      { label: '🧩', value: '🧩' },
      { label: '🎲', value: '🎲' },
      { label: '♠️', value: '♠️' },
      { label: '♥️', value: '♥️' },
      { label: '♦️', value: '♦️' },
      { label: '♣️', value: '♣️' },
      { label: '🃏', value: '🃏' },
      { label: '🀄', value: '🀄' },
      { label: '🎴', value: '🎴' }
    ]
  },
  {
    id: 'food',
    label: 'Food & Drink',
    items: [
      { label: '🍎', value: '🍎' },
      { label: '🍊', value: '🍊' },
      { label: '🍋', value: '🍋' },
      { label: '🍌', value: '🍌' },
      { label: '🍉', value: '🍉' },
      { label: '🍇', value: '🍇' },
      { label: '🍓', value: '🍓' },
      { label: '🫐', value: '🫐' },
      { label: '🍈', value: '🍈' },
      { label: '🍒', value: '🍒' },
      { label: '🍑', value: '🍑' },
      { label: '🥭', value: '🥭' },
      { label: '🍍', value: '🍍' },
      { label: '🥥', value: '🥥' },
      { label: '🥝', value: '🥝' },
      { label: '🍅', value: '🍅' },
      { label: '🍆', value: '🍆' },
      { label: '🥑', value: '🥑' },
      { label: '🥦', value: '🥦' },
      { label: '🥬', value: '🥬' },
      { label: '🥒', value: '🥒' },
      { label: '🌶️', value: '🌶️' },
      { label: '🫒', value: '🫒' },
      { label: '🌽', value: '🌽' },
      { label: '🥕', value: '🥕' },
      { label: '🫑', value: '🫑' },
      { label: '🥔', value: '🥔' },
      { label: '🍠', value: '🍠' },
      { label: '🥐', value: '🥐' },
      { label: '🥖', value: '🥖' },
      { label: '🍞', value: '🍞' },
      { label: '🥨', value: '🥨' },
      { label: '🥯', value: '🥯' },
      { label: '🧀', value: '🧀' },
      { label: '🥚', value: '🥚' },
      { label: '🍳', value: '🍳' },
      { label: '🧈', value: '🧈' },
      { label: '🥞', value: '🥞' },
      { label: '🧇', value: '🧇' },
      { label: '🥓', value: '🥓' },
      { label: '🥩', value: '🥩' },
      { label: '🍗', value: '🍗' },
      { label: '🍖', value: '🍖' },
      { label: '🦴', value: '🦴' },
      { label: '🌭', value: '🌭' },
      { label: '🍔', value: '🍔' },
      { label: '🍟', value: '🍟' },
      { label: '🍕', value: '🍕' },
      { label: '🥪', value: '🥪' },
      { label: '🥙', value: '🥙' },
      { label: '🌮', value: '🌮' },
      { label: '🌯', value: '🌯' },
      { label: '🫔', value: '🫔' },
      { label: '🥗', value: '🥗' },
      { label: '🥘', value: '🥘' },
      { label: '🫕', value: '🫕' },
      { label: '🥫', value: '🥫' },
      { label: '🍝', value: '🍝' },
      { label: '🍜', value: '🍜' },
      { label: '🍲', value: '🍲' },
      { label: '🍛', value: '🍛' },
      { label: '🍣', value: '🍣' },
      { label: '🍱', value: '🍱' },
      { label: '🥟', value: '🥟' },
      { label: '🦪', value: '🦪' },
      { label: '🍤', value: '🍤' },
      { label: '🍙', value: '🍙' },
      { label: '🍚', value: '🍚' },
      { label: '🍘', value: '🍘' },
      { label: '🍥', value: '🍥' },
      { label: '🥠', value: '🥠' },
      { label: '🥮', value: '🥮' },
      { label: '🍢', value: '🍢' },
      { label: '🍡', value: '🍡' },
      { label: '🍧', value: '🍧' },
      { label: '🍨', value: '🍨' },
      { label: '🍦', value: '🍦' },
      { label: '🥧', value: '🥧' },
      { label: '🧁', value: '🧁' },
      { label: '🍰', value: '🍰' },
      { label: '🎂', value: '🎂' },
      { label: '🍮', value: '🍮' },
      { label: '🍭', value: '🍭' },
      { label: '🍬', value: '🍬' },
      { label: '🍫', value: '🍫' },
      { label: '🍿', value: '🍿' },
      { label: '🍩', value: '🍩' },
      { label: '🍪', value: '🍪' },
      { label: '🌰', value: '🌰' },
      { label: '🥜', value: '🥜' },
      { label: '🍯', value: '🍯' }
    ]
  }
])

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
function setTool(tool: 'select' | 'pen') {
  currentTool.value = tool
  selectedEmojiId.value = null
  selectedShapeId.value = null
}

// Emoji functions
async function addEmoji(emojiChar: string) {
  const emojiData = {
    emoji: emojiChar,
    x: Math.random() * (canvasWidth - 100),
    y: Math.random() * (canvasHeight - 100),
    size: 48,
    layer: 1,
    rotation: 0
  }
  
  await addEmojiToCanvas(emojiData)
  showEmojiPicker.value = false
}

function handleEmojiSelect(item: { value?: string; label?: string }) {
  if (item && (item.value || item.label)) {
    const emoji = item.value || item.label
    if (emoji) {
      addEmoji(emoji)
    }
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
    const allShapesArray = [...rectangles.value, ...circles.value, ...texts.value]
    const shape = allShapesArray.find(s => s.id === shapeId)
    
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
      const allShapesArray = [...rectangles.value, ...circles.value, ...texts.value]
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
      const allShapesArray = [...rectangles.value, ...circles.value, ...texts.value]
      const shape = allShapesArray.find(s => s.id === selectedShapeId.value)
      if (shape) {
        try {
          const success = await updateShape(selectedShapeId.value, {
            x: shape.x,
            y: shape.y
          })
          if (success) {
            console.log('🎯 Successfully updated shape position in database:', selectedShapeId.value)
          } else {
            console.error('❌ Failed to update shape position in database')
          }
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
    x: Math.random() * (canvasWidth - 100),
    y: Math.random() * (canvasHeight - 100),
    width: 100,
    height: 60,
    fill: '#3b82f6',
    stroke: '#1e40af',
    rotation: 0
  })
}

async function addCircle() {
  await addCircleToCanvas({
    x: Math.random() * (canvasWidth - 100),
    y: Math.random() * (canvasHeight - 100),
    radius: 30,
    fill: '#8b5cf6',
    stroke: '#7c3aed',
    rotation: 0
  })
}

async function addText() {
  await addTextToCanvas({
    x: Math.random() * (canvasWidth - 100),
    y: Math.random() * (canvasHeight - 100),
    text: 'Hello!',
    fontSize: 16,
    fill: '#000000',
    stroke: 'transparent',
    rotation: 0
  })
}

function selectShape(shapeId: string) {
  selectedShapeId.value = shapeId
  selectedEmojiId.value = null
  updateRotationFromSelection()
  updateColorFromSelection()
}

function selectEmoji(emojiId: string) {
  console.log('🎯 selectEmoji called with:', emojiId)
  selectedEmojiId.value = emojiId
  selectedShapeId.value = null
  updateRotationFromSelection()
  console.log('🎯 Selected emoji ID:', selectedEmojiId.value)
}

// Canvas mouse handlers
function handleCanvasClick(event: MouseEvent) {
  // Only deselect if clicking on empty canvas space (not on an emoji or shape)
  if (event.target === canvasContainer.value) {
    console.log('🎯 Canvas clicked - deselecting all items')
    selectedEmojiId.value = null
    selectedShapeId.value = null
    rotationAngle.value = 0
  }
}

function handleCanvasMouseDown(event: MouseEvent) {
  if (currentTool.value === 'pen') {
    isDrawing.value = true
    const rect = (event.target as HTMLElement).getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    // Initialize pen stroke
    currentPenStroke.value = `M ${x} ${y}`
    lastPenPosition.value = { x, y }
    penPoints.value = [{ x, y }]
  }
}

function handleCanvasMouseMove(event: MouseEvent) {
  if (isDrawing.value && currentTool.value === 'pen') {
    const rect = (event.target as HTMLElement).getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    // Only add point if it's far enough from the last point (performance optimization)
    const distance = Math.sqrt(
      Math.pow(x - lastPenPosition.value.x, 2) + 
      Math.pow(y - lastPenPosition.value.y, 2)
    )
    
    if (distance > 2) { // Minimum distance threshold
      currentPenStroke.value += ` L ${x} ${y}`
      lastPenPosition.value = { x, y }
      penPoints.value.push({ x, y })
    }
  } else if (isDragging.value) {
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
  if (isDrawing.value && currentTool.value === 'pen') {
    isDrawing.value = false
    if (currentPenStroke.value && penPoints.value.length > 1) {
      // Use requestAnimationFrame for smooth rendering
      requestAnimationFrame(() => {
        const stroke: PenStroke = {
          id: generateId(),
          path: currentPenStroke.value,
          color: penColor.value,
          width: penWidth.value
        }
        penStrokes.value.push(stroke)
        currentPenStroke.value = ''
        penPoints.value = []
      })
          } else {
      // Clear if not enough points
      currentPenStroke.value = ''
      penPoints.value = []
    }
  } else if (isDragging.value) {
    endDrag()
  }
  
  // Clear pending drag state
  pendingDragShapeId.value = null
  pendingDragEmojiId.value = null
}

// Utility functions
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

async function clearCanvas() {
  await clearAllEmojis()
  rectangles.value = []
  circles.value = []
  texts.value = []
  penStrokes.value = []
  selectedEmojiId.value = null
  selectedShapeId.value = null
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
  
  console.log('🔄 Rotation change:', angle, 'Selected emoji:', selectedEmojiId.value)
  rotationAngle.value = angle
  
  // Update emoji rotation
  if (selectedEmojiId.value) {
    const emoji = getEmojiById(selectedEmojiId.value)
    console.log('🎨 Found emoji for rotation:', emoji)
    if (emoji) {
      emoji.rotation = angle
      console.log('🎨 Updating emoji rotation to:', angle)
      updateEmoji(selectedEmojiId.value, { rotation: angle })
    }
  }
  
  // Update shape rotation
  if (selectedShapeId.value) {
    const allShapesArray = [...rectangles.value, ...circles.value, ...texts.value]
    const shape = allShapesArray.find(s => s.id === selectedShapeId.value)
    if (shape) {
      shape.rotation = angle
    }
  }
}

function resetRotation() {
  rotationAngle.value = 0
  handleRotationChange(0)
}

async function handleColorChange(color: string | undefined) {
  if (!color || !selectedShapeId.value) return
  
  console.log('🎨 Color change:', color, 'Selected shape:', selectedShapeId.value)
  selectedShapeColor.value = color
  
  // Update the selected shape's color using the persistent update function
  try {
    const success = await updateShape(selectedShapeId.value, { fill: color })
    if (success) {
      console.log('🎨 Successfully updated shape color in database:', selectedShapeId.value, color)
    } else {
      console.error('❌ Failed to update shape color in database')
    }
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
    const allShapesArray = [...rectangles.value, ...circles.value, ...texts.value]
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
    const allShapesArray = [...rectangles.value, ...circles.value, ...texts.value]
    const shape = allShapesArray.find(s => s.id === selectedShapeId.value)
    if (shape && shape.fill) {
      selectedShapeColor.value = shape.fill
      console.log('🎨 Updated color picker to:', shape.fill)
    }
  } else {
    selectedShapeColor.value = '#3B82F6' // Reset to default blue
  }
}

function getSelectedShape() {
  if (selectedShapeId.value) {
    const allShapesArray = [...rectangles.value, ...circles.value, ...texts.value]
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
  const handleKeyDown = (event: KeyboardEvent) => {
    // AI chat toggle (Cmd/Ctrl + K)
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault()
      showAIChat.value = !showAIChat.value
    }
    
    // Deselect all items (Escape key)
    if (event.key === 'Escape') {
      event.preventDefault()
      console.log('⌨️ Escape pressed - deselecting all items')
      selectedEmojiId.value = null
      selectedShapeId.value = null
      rotationAngle.value = 0
    }
  }
  
  document.addEventListener('keydown', handleKeyDown)
  
  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown)
  })
})
</script>

<style scoped>
.emoji-item {
  transition: all 0.2s ease;
  will-change: transform;
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
}

/* Smooth pen tool rendering */
.pen-stroke {
  shape-rendering: geometricPrecision;
  vector-effect: non-scaling-stroke;
}
</style>
