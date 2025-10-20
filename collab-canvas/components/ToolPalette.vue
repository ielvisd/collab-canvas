<template>
  <div
    v-if="isOpen"
    ref="toolPaletteRef"
    class="fixed bg-black/95 border border-pink-500/50 shadow-2xl rounded-xl z-50 backdrop-blur-sm p-6 w-80 cursor-move select-none"
    :style="{ 
      left: position.x + 'px', 
      top: position.y + 'px',
      transform: isDragging ? 'scale(1.02)' : 'scale(1)',
      transition: isDragging ? 'none' : 'transform 0.2s ease'
    }"
    @mousedown="startDrag"
  >
    <!-- Header with close button -->
    <div class="flex items-center justify-between mb-4 pb-3 border-b border-pink-500/30">
      <h3 class="text-lg font-display text-pink-200">Tools</h3>
      <UButton
        icon="i-lucide-x"
        size="sm"
        color="neutral"
        variant="ghost"
        class="text-pink-300 hover:text-white hover:bg-pink-500/20"
        @click="isOpen = false"
      />
    </div>
    
    <div class="space-y-4">
      <!-- Grid Toggle -->
      <div class="flex items-center gap-2">
        <UButton
          :variant="snapToGridEnabled ? 'solid' : 'outline'"
          size="sm"
          class="font-body text-white border-pink-400 hover:bg-pink-500/20"
          @click="$emit('toggle-grid')"
        >
          <UIcon name="i-lucide-grid-3x3" class="w-4 h-4 mr-2" />
          Grid
        </UButton>
      </div>

      <!-- Zoom Controls -->
      <div class="space-y-2 pt-2 border-t border-pink-400/30">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-zoom-in" class="w-4 h-4 text-pink-300" />
          <span class="text-sm text-pink-300">Zoom</span>
        </div>
        <div class="flex items-center gap-2">
          <UButton
            icon="i-lucide-zoom-in"
            size="sm"
            color="neutral"
            variant="outline"
            class="font-body text-white border-pink-400 hover:bg-pink-500/20"
            @click="$emit('zoom-in')"
          />
          <UButton
            icon="i-lucide-zoom-out"
            size="sm"
            color="neutral"
            variant="outline"
            class="font-body text-white border-pink-400 hover:bg-pink-500/20"
            @click="$emit('zoom-out')"
          />
          <UButton
            icon="i-lucide-rotate-ccw"
            size="sm"
            color="neutral"
            variant="outline"
            class="font-body text-white border-pink-400 hover:bg-pink-500/20"
            @click="$emit('reset-zoom')"
          />
        </div>
      </div>


      <!-- Action Buttons -->
      <div class="grid grid-cols-2 gap-2 pt-2 border-t border-pink-400/30">
        <UButton 
          icon="i-lucide-undo"
          :disabled="!canUndo"
          color="neutral" 
          variant="outline" 
          size="sm"
          class="font-body text-white border-pink-400 hover:bg-pink-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          @click="$emit('undo')"
        >
          Undo
        </UButton>
        <UButton 
          icon="i-lucide-redo"
          :disabled="!canRedo"
          color="neutral" 
          variant="outline" 
          size="sm"
          class="font-body text-white border-pink-400 hover:bg-pink-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          @click="$emit('redo')"
        />
        
        
        <UButton 
          icon="i-lucide-trash-2"
          color="error" 
          variant="outline" 
          size="sm"
          class="font-body text-white border-red-400 hover:bg-red-500/20"
          @click="$emit('clear-all')"
        >
          Clear All
        </UButton>
        
        <UButton 
          icon="i-lucide-rotate-ccw"
          color="neutral" 
          variant="outline" 
          size="sm"
          class="font-body text-white border-pink-400 hover:bg-pink-500/20 col-span-2"
          @click="$emit('reset-view')"
        >
          Reset View
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'

// Props
interface Props {
  canUndo: boolean
  canRedo: boolean
  snapToGridEnabled: boolean
  open: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update:open': [value: boolean]
  'undo': []
  'redo': []
  'clear-all': []
  'reset-view': []
  'toggle-grid': []
  'zoom-in': []
  'zoom-out': []
  'reset-zoom': []
}>()

// Computed for v-model
const isOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value)
})

// Dragging state
const isDragging = ref(false)
const position = ref({ x: 0, y: 0 })
const dragStart = ref({ x: 0, y: 0 })
const toolPaletteRef = ref<HTMLElement | null>(null)

// Initialize position when modal opens
watch(isOpen, (newValue) => {
  if (newValue) {
    // Center the modal initially
    position.value = {
      x: (window.innerWidth - 320) / 2, // 320px is modal width (w-80)
      y: (window.innerHeight - 400) / 2 // 400px is approximate modal height
    }
  }
})

// Dragging functionality
const startDrag = (event: MouseEvent) => {
  // Only start drag if clicking on the header area or empty space
  const target = event.target as HTMLElement
  if (target.closest('button') || target.closest('.u-button')) {
    return // Don't drag if clicking on buttons
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
      const modalWidth = 320
      const modalHeight = 400
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

// Lifecycle
onMounted(() => {
  // Add any initialization if needed
})

onUnmounted(() => {
  // Cleanup if needed
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
