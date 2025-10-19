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
                  icon="i-heroicons-sparkles"
                  label="AI"
                  color="primary"
                  variant="outline"
                  size="sm"
                  class="font-body border-pink-400 text-pink-300 hover:bg-pink-500/10"
                  @click="$emit('show-ai-chat')"
                />
                
                <UButton
                  :variant="snapToGridEnabled ? 'solid' : 'outline'"
                  size="sm"
                  class="font-body text-white border-pink-400 hover:bg-pink-500/20"
                  @click="$emit('toggle-grid')"
                >
                  <UIcon name="i-lucide-grid-3x3" class="w-4 h-4" />
                </UButton>
              </div>

      <!-- Contextual Controls -->
      <div v-if="(selectedEmojiId || selectedItemCount > 0)" class="space-y-2 pt-2 border-t border-pink-400/30">
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
          icon="i-lucide-copy"
          color="neutral" 
          variant="outline" 
          size="xs"
          class="font-body text-white border-pink-400 hover:bg-pink-500/20"
          @click="$emit('copy')"
        >
          Copy
        </UButton>
        
        <UButton 
          v-if="clipboardHasData"
          icon="i-lucide-clipboard"
          color="neutral" 
          variant="outline" 
          size="xs"
          class="font-body text-white border-pink-400 hover:bg-pink-500/20"
          @click="$emit('paste')"
        >
          Paste
        </UButton>
        
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
                  icon="i-heroicons-sparkles"
                  label="AI"
                  color="primary"
                  variant="outline"
                  size="lg"
                  class="font-body border-pink-400 text-pink-300 hover:bg-pink-500/10 h-12"
                  @click="$emit('show-ai-chat'); isOpen = false"
                />
                
                <UButton
                  :variant="snapToGridEnabled ? 'solid' : 'outline'"
                  size="lg"
                  class="font-body text-white border-pink-400 hover:bg-pink-500/20 h-12"
                  @click="$emit('toggle-grid')"
                >
                  <UIcon name="i-lucide-grid-3x3" class="w-5 h-5" />
                </UButton>
              </div>

      <!-- Contextual Controls for Mobile -->
      <div v-if="(selectedEmojiId || selectedItemCount > 0)" class="space-y-3 pt-3 border-t border-pink-400/30">
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
          icon="i-lucide-copy"
          color="neutral" 
          variant="outline" 
          size="sm"
          class="font-body text-white border-pink-400 hover:bg-pink-500/20 flex-1 h-12"
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
          class="font-body text-white border-pink-400 hover:bg-pink-500/20 flex-1 h-12"
          @click="$emit('paste')"
        >
          Paste
        </UButton>
        
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
  selectedEmojiId: string | null
  selectedItemCount: number
  rotationAngle: number
  canUndo: boolean
  canRedo: boolean
  snapToGridEnabled: boolean
  clipboardHasData: boolean
}

const props = defineProps<Props>()

        // Emits
        const emit = defineEmits<{
          'show-emoji-picker': []
          'show-ai-chat': []
          'rotation-change': [angle: number | undefined]
          'reset-rotation': []
          'undo': []
          'redo': []
          'copy': []
          'paste': []
          'delete-selected': []
          'clear-all': []
          'reset-view': []
          'toggle-grid': []
        }>()

// Mobile detection
const isMobile = ref(false)
const isOpen = ref(false)

// Dragging state
const isDragging = ref(false)
const position = ref({ x: 20, y: 80 }) // Positioned below header to avoid overlap
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
      const newX = e.clientX - dragStart.value.x
      const newY = e.clientY - dragStart.value.y
      
      // Bounds checking to prevent dragging off-screen or over header
      const minX = 0
      const maxX = window.innerWidth - 320 // Tool palette width is ~320px
      const minY = 60 // Below header
      const maxY = window.innerHeight - 200 // Leave some space at bottom
      
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
