<template>
  <div
    v-if="selectedItemCount > 0"
    ref="controlsRef"
    class="fixed z-50 bg-black/95 border border-blue-500/50 shadow-2xl rounded-xl backdrop-blur-sm p-4 select-none cursor-move"
    :style="{ 
      left: position.x + 'px', 
      top: position.y + 'px',
      minWidth: '280px',
      transform: isDragging ? 'scale(1.02)' : 'scale(1)',
      transition: isDragging ? 'none' : 'transform 0.2s ease'
    }"
    @mousedown="startDrag"
  >
    <!-- Header -->
    <div class="flex items-center justify-between mb-3 pb-2 border-b border-blue-500/30">
      <h3 class="text-sm font-display text-blue-200">
        {{ selectedItemCount === 1 ? 'Item selected' : `${selectedItemCount} items selected` }}
      </h3>
      <UButton
        icon="i-lucide-x"
        size="xs"
        color="neutral"
        variant="ghost"
        class="text-blue-300 hover:text-white hover:bg-blue-500/20"
        @click="$emit('clear-selection')"
        title="Deselect items"
      />
    </div>
    
    <div class="space-y-3">
      <!-- Rotation Controls -->
      <div class="space-y-2">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-rotate-3d" class="w-4 h-4 text-blue-300" />
          <span class="text-xs text-blue-300">
            {{ selectedItemCount === 1 ? 'Rotate item' : 'Rotate items' }}
          </span>
        </div>
        <div class="flex items-center gap-2">
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
            class="text-blue-300 border-blue-400 hover:bg-blue-500/20"
            @click="$emit('reset-rotation')"
          />
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-2">
        <UButton 
          icon="i-lucide-copy"
          color="neutral" 
          variant="outline" 
          size="sm"
          class="flex-1 text-white border-blue-400 hover:bg-blue-500/20"
          @click="$emit('copy')"
        >
          Copy
        </UButton>
        
        <UButton 
          v-if="clipboardHasData"
          icon="i-lucide-clipboard"
          color="neutral" 
          variant="outline" 
          size="sm"
          class="flex-1 text-white border-blue-400 hover:bg-blue-500/20"
          @click="$emit('paste')"
        >
          Paste
        </UButton>
        
        <UButton 
          icon="i-lucide-trash-2"
          color="error" 
          variant="solid" 
          size="sm"
          class="flex-1 text-white bg-red-500 hover:bg-red-600"
          @click="$emit('delete-selected')"
        >
          {{ selectedItemCount === 1 ? 'Delete item' : 'Delete items' }}
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// Props
interface Props {
  selectedItemCount: number
  rotationAngle: number
  clipboardHasData: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'rotation-change': [angle: number | undefined]
  'reset-rotation': []
  'copy': []
  'paste': []
  'delete-selected': []
  'clear-selection': []
}>()

// Position state - draggable position
const position = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const controlsRef = ref<HTMLElement | null>(null)

// Initialize position when component mounts
const initializePosition = () => {
  // Position controls in the top-right area of the screen
  const controlsWidth = 280
  const controlsHeight = 200
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  
  // Position in top-right with some margin
  const x = viewportWidth - controlsWidth - 20
  const y = 20
  
  position.value = { x, y }
}

// Dragging functionality
const startDrag = (event: MouseEvent) => {
  // Only start drag if clicking on the header area or empty space
  const target = event.target as HTMLElement
  if (target.closest('button') || target.closest('.u-button') || target.closest('.u-slider')) {
    return // Don't drag if clicking on buttons or sliders
  }
  
  isDragging.value = true
  dragStart.value = {
    x: event.clientX - position.value.x,
    y: event.clientY - position.value.y
  }
  
  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging.value) {
      const newX = e.clientX - dragStart.value.x
      const newY = e.clientY - dragStart.value.y
      
      // Bounds checking to keep modal on screen
      const modalWidth = 280
      const modalHeight = 200
      const minX = 0
      const maxX = window.innerWidth - modalWidth
      const minY = 0
      const maxY = window.innerHeight - modalHeight
      
      position.value = {
        x: Math.max(minX, Math.min(newX, maxX)),
        y: Math.max(minY, Math.min(newY, maxY))
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

// Initialize position when component mounts
onMounted(() => {
  initializePosition()
})

onUnmounted(() => {
  // Cleanup any event listeners if needed
})
</script>

<style scoped>
/* Ensure touch targets are at least 44px on mobile */
@media (max-width: 767px) {
  :deep(.u-button) {
    min-height: 44px;
  }
  
  /* Make the controls wider on mobile for better touch targets */
  .fixed {
    min-width: 320px;
  }
}
</style>
