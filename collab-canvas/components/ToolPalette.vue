<template>
  <!-- Desktop: Floating Draggable Panel -->
  <UCard 
    v-if="!isMobile"
    ref="paletteRef"
    :class="[
      'fixed z-50 w-80 bg-black/90 backdrop-blur-sm border-2 border-pink-500 shadow-2xl',
      'select-none cursor-move',
      { 'opacity-50': isDragging }
    ]"
    :style="{ 
      left: position.x + 'px', 
      top: position.y + 'px',
      transform: isDragging ? 'scale(1.02)' : 'scale(1)',
      transition: isDragging ? 'none' : 'all 0.2s ease'
    }"
    @mousedown="startDrag"
  >
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold text-pink-300">Tools</h3>
        <UIcon name="i-lucide-grip-vertical" class="w-4 h-4 text-pink-400" />
      </div>
    </template>

    <div class="space-y-3">
      <!-- Primary Tools -->
      <div class="flex items-center gap-2">
        <UButton 
          label="🎨 Emoji"
          color="primary"
          variant="solid"
          size="sm"
          class="font-body bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white border-0 shadow-lg flex-1"
          @click="$emit('show-emoji-picker')"
        />
        
        <UButton
          :variant="currentTool === 'select' ? 'solid' : 'outline'"
          size="sm"
          class="font-body text-white border-pink-400 hover:bg-pink-500/20"
          @click="$emit('set-tool', 'select')"
        >
          <UIcon name="i-lucide-move" class="w-4 h-4 mr-1" />
          Select
        </UButton>
      </div>

      <!-- Shapes Dropdown -->
      <div class="flex items-center gap-2">
        <UDropdownMenu :items="shapeMenuItems" :ui="{ content: 'w-48' }">
          <UButton 
            color="neutral" 
            variant="outline" 
            size="sm"
            class="font-body text-white border-pink-400 hover:bg-pink-500/20 flex-1"
            trailing-icon="i-heroicons-chevron-down"
          >
            <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-1" />
            Shapes
          </UButton>
        </UDropdownMenu>
      </div>

      <!-- Multi-select Badge -->
      <div v-if="selectedItemCount > 1" class="flex items-center justify-center">
        <UBadge 
          color="primary" 
          variant="solid" 
          size="sm"
          class="font-body"
        >
          {{ selectedItemCount }} items selected
        </UBadge>
      </div>

      <!-- Contextual Controls -->
      <div v-if="(selectedEmojiId || selectedShapeId || selectedItemCount > 0) && currentTool === 'select'" class="space-y-2 pt-2 border-t border-pink-400/30">
        <!-- Rotation Controls -->
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-rotate-3d" class="w-4 h-4 text-pink-300" />
          <USlider
            :model-value="rotationAngle"
            :min="0"
            :max="360"
            :step="5"
            size="sm"
            class="flex-1"
            tooltip
            @update:model-value="$emit('rotation-change', $event)"
          />
          <UButton
            icon="i-lucide-rotate-ccw"
            size="xs"
            color="neutral"
            variant="outline"
            class="font-body"
            @click="$emit('reset-rotation')"
          />
        </div>
        
        <!-- Color Picker for Shapes -->
        <div v-if="selectedShapeId" class="flex items-center gap-2">
          <UIcon name="i-lucide-palette" class="w-4 h-4 text-pink-300" />
          <UPopover>
            <UButton 
              size="sm" 
              color="neutral" 
              variant="outline"
              class="font-body text-white border-pink-400 hover:bg-pink-500/20 flex-1"
            >
              <template #leading>
                <span :style="{ backgroundColor: selectedShapeColor }" class="size-3 rounded-full border border-pink-400" />
              </template>
              Color
            </UButton>
            
            <template #content>
              <div class="p-4 bg-black/90 border border-pink-500 rounded-lg">
                <UColorPicker 
                  :model-value="selectedShapeColor" 
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
                  @update:model-value="$emit('color-change', $event)"
                />
              </div>
            </template>
          </UPopover>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center gap-1 pt-2 border-t border-pink-400/30">
        <UButton 
          icon="i-lucide-undo"
          :disabled="!canUndo"
          color="neutral" 
          variant="outline" 
          size="xs"
          class="font-body text-white border-pink-400 hover:bg-pink-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          @click="$emit('undo')"
        />
        <UButton 
          icon="i-lucide-redo"
          :disabled="!canRedo"
          color="neutral" 
          variant="outline" 
          size="xs"
          class="font-body text-white border-pink-400 hover:bg-pink-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          @click="$emit('redo')"
        />
        
        <USeparator orientation="vertical" class="h-6" />
        
        <UButton 
          v-if="selectedItemCount > 0"
          icon="i-lucide-trash-2"
          color="error" 
          variant="solid" 
          size="xs"
          class="font-body text-white bg-red-500 hover:bg-red-600"
          @click="$emit('delete-selected')"
        >
          {{ selectedItemCount > 1 ? `Delete ${selectedItemCount} items` : 'Delete' }}
        </UButton>
        
        <UButton 
          icon="i-lucide-trash-2"
          color="error" 
          variant="outline" 
          size="xs"
          class="font-body text-white border-red-400 hover:bg-red-500/20"
          @click="$emit('clear-all')"
        />
        <UButton 
          icon="i-lucide-rotate-ccw"
          color="neutral" 
          variant="outline" 
          size="xs"
          class="font-body text-white border-pink-400 hover:bg-pink-500/20"
          @click="$emit('reset-view')"
        />
      </div>
    </div>
  </UCard>

  <!-- Mobile: Bottom Drawer -->
  <UDrawer 
    v-else
    v-model:open="isOpen"
    side="bottom"
    :ui="{ 
      overlay: 'fixed inset-0 bg-black/75',
      content: 'fixed bg-black/90 border-t-2 border-pink-500 shadow-2xl',
      header: 'bg-black/90 border-b-2 border-pink-500',
      title: 'text-lg font-display text-pink-300',
      body: 'bg-black/90 p-4'
    }"
  >
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-pink-300">Tools</h3>
        <UButton
          icon="i-heroicons-x-mark"
          variant="ghost"
          size="sm"
          class="text-pink-300 hover:text-white"
          @click="isOpen = false"
        />
      </div>
    </template>

    <div class="space-y-4">
      <!-- Primary Tools Row -->
      <div class="flex items-center gap-2">
        <UButton 
          label="🎨 Emoji"
          color="primary"
          variant="solid"
          size="lg"
          class="font-body bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white border-0 shadow-lg flex-1 h-12"
          @click="$emit('show-emoji-picker'); isOpen = false"
        />
        
        <UButton
          :variant="currentTool === 'select' ? 'solid' : 'outline'"
          size="lg"
          class="font-body text-white border-pink-400 hover:bg-pink-500/20 h-12"
          @click="$emit('set-tool', 'select')"
        >
          <UIcon name="i-lucide-move" class="w-5 h-5 mr-2" />
          Select
        </UButton>
      </div>

      <!-- Shapes Row -->
      <div class="flex items-center gap-2">
        <UDropdownMenu :items="shapeMenuItems" :ui="{ content: 'w-48' }">
          <UButton 
            color="neutral" 
            variant="outline" 
            size="lg"
            class="font-body text-white border-pink-400 hover:bg-pink-500/20 flex-1 h-12"
            trailing-icon="i-heroicons-chevron-down"
          >
            <UIcon name="i-heroicons-plus" class="w-5 h-5 mr-2" />
            Shapes
          </UButton>
        </UDropdownMenu>
      </div>

      <!-- Multi-select Badge for Mobile -->
      <div v-if="selectedItemCount > 1" class="flex items-center justify-center">
        <UBadge 
          color="primary" 
          variant="solid" 
          size="md"
          class="font-body"
        >
          {{ selectedItemCount }} items selected
        </UBadge>
      </div>

      <!-- Contextual Controls for Mobile -->
      <div v-if="(selectedEmojiId || selectedShapeId || selectedItemCount > 0) && currentTool === 'select'" class="space-y-3 pt-3 border-t border-pink-400/30">
        <!-- Rotation Controls -->
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-rotate-3d" class="w-5 h-5 text-pink-300" />
            <span class="text-sm text-pink-300">Rotation</span>
          </div>
          <div class="flex items-center gap-2">
            <USlider
              :model-value="rotationAngle"
              :min="0"
              :max="360"
              :step="5"
              size="lg"
              class="flex-1"
              tooltip
              @update:model-value="$emit('rotation-change', $event)"
            />
            <UButton
              icon="i-lucide-rotate-ccw"
              size="sm"
              color="neutral"
              variant="outline"
              class="font-body"
              @click="$emit('reset-rotation')"
            />
          </div>
        </div>
        
        <!-- Color Picker for Shapes -->
        <div v-if="selectedShapeId" class="space-y-2">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-palette" class="w-5 h-5 text-pink-300" />
            <span class="text-sm text-pink-300">Color</span>
          </div>
          <UPopover>
            <UButton 
              size="lg" 
              color="neutral" 
              variant="outline"
              class="font-body text-white border-pink-400 hover:bg-pink-500/20 w-full h-12"
            >
              <template #leading>
                <span :style="{ backgroundColor: selectedShapeColor }" class="size-4 rounded-full border border-pink-400" />
              </template>
              Choose Color
            </UButton>
            
            <template #content>
              <div class="p-4 bg-black/90 border border-pink-500 rounded-lg">
                <UColorPicker 
                  :model-value="selectedShapeColor" 
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
                  @update:model-value="$emit('color-change', $event)"
                />
              </div>
            </template>
          </UPopover>
        </div>
      </div>

      <!-- Action Buttons Row -->
      <div class="flex items-center gap-2 pt-3 border-t border-pink-400/30">
        <UButton 
          icon="i-lucide-undo"
          :disabled="!canUndo"
          color="neutral" 
          variant="outline" 
          size="sm"
          class="font-body text-white border-pink-400 hover:bg-pink-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex-1 h-12"
          @click="$emit('undo')"
        />
        <UButton 
          icon="i-lucide-redo"
          :disabled="!canRedo"
          color="neutral" 
          variant="outline" 
          size="sm"
          class="font-body text-white border-pink-400 hover:bg-pink-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex-1 h-12"
          @click="$emit('redo')"
        />
        
        <UButton 
          v-if="selectedItemCount > 0"
          icon="i-lucide-trash-2"
          color="error" 
          variant="solid" 
          size="sm"
          class="font-body text-white bg-red-500 hover:bg-red-600 flex-1 h-12"
          @click="$emit('delete-selected')"
        >
          {{ selectedItemCount > 1 ? `Delete ${selectedItemCount} items` : 'Delete' }}
        </UButton>
        
        <UButton 
          icon="i-lucide-trash-2"
          color="error" 
          variant="outline" 
          size="sm"
          class="font-body text-white border-red-400 hover:bg-red-500/20 flex-1 h-12"
          @click="$emit('clear-all')"
        />
        <UButton 
          icon="i-lucide-rotate-ccw"
          color="neutral" 
          variant="outline" 
          size="sm"
          class="font-body text-white border-pink-400 hover:bg-pink-500/20 flex-1 h-12"
          @click="$emit('reset-view')"
        />
      </div>
    </div>
  </UDrawer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

// Props
interface Props {
  currentTool: string
  selectedEmojiId: string | null
  selectedShapeId: string | null
  selectedItemCount: number
  rotationAngle: number
  selectedShapeColor: string
  canUndo: boolean
  canRedo: boolean
  shapeMenuItems: any[]
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'show-emoji-picker': []
  'set-tool': [tool: string]
  'rotation-change': [angle: number | undefined]
  'reset-rotation': []
  'color-change': [color: string | undefined]
  'undo': []
  'redo': []
  'delete-selected': []
  'clear-all': []
  'reset-view': []
}>()

// Mobile detection
const isMobile = ref(false)
const isOpen = ref(false)

// Dragging state
const isDragging = ref(false)
const position = ref({ x: 20, y: 20 })
const dragStart = ref({ x: 0, y: 0 })
const paletteRef = ref<HTMLElement | null>(null)

// Check if mobile
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

// Dragging functionality
const startDrag = (event: MouseEvent) => {
  if (isMobile.value) return
  
  isDragging.value = true
  dragStart.value = {
    x: event.clientX - position.value.x,
    y: event.clientY - position.value.y
  }
  
  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging.value) {
      position.value = {
        x: e.clientX - dragStart.value.x,
        y: e.clientY - dragStart.value.y
      }
    }
  }
  
  const handleMouseUp = () => {
    isDragging.value = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

// Expose mobile drawer control
const openDrawer = () => {
  if (isMobile.value) {
    isOpen.value = true
  }
}

defineExpose({
  openDrawer
})

// Lifecycle
onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped>
/* Ensure touch targets are at least 44px on mobile */
@media (max-width: 767px) {
  :deep(.u-button) {
    min-height: 44px;
  }
}
</style>
