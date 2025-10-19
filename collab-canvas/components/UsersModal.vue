<template>
  <!-- Desktop: Floating Draggable Modal -->
  <UCard 
    v-if="!isMobile"
    ref="modalRef"
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
  >
    <template #header>
      <div class="flex items-center justify-between cursor-move" @mousedown="startDrag">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-grip-vertical" class="w-4 h-4 text-pink-400" />
          <h3 class="text-sm font-semibold text-pink-300">Online Users</h3>
        </div>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-users" class="w-4 h-4 text-pink-400" />
          <UButton
            icon="i-heroicons-x-mark"
            variant="ghost"
            size="xs"
            class="text-pink-300 hover:text-white"
            @click="$emit('close')"
          />
        </div>
      </div>
    </template>

    <div class="space-y-3">
      <!-- Connection Status -->
      <div class="flex items-center gap-2 p-2 bg-pink-500/10 rounded-lg border border-pink-400/30">
        <UIcon 
          :name="isConnected ? 'i-heroicons-signal' : 'i-heroicons-signal-slash'" 
          :class="[
            'w-4 h-4',
            isConnected ? 'text-green-400' : 'text-red-400'
          ]"
        />
        <span class="text-sm text-pink-300">
          {{ isConnected ? 'Live Sync Active' : 'Connection Lost' }}
        </span>
      </div>

      <!-- Users List -->
      <div class="space-y-2">
        <h4 class="text-xs font-semibold text-pink-400 uppercase tracking-wide">Active Users</h4>
        <div v-if="users.length === 0" class="text-center py-4">
          <UIcon name="i-lucide-users" class="w-8 h-8 text-pink-400/50 mx-auto mb-2" />
          <p class="text-sm text-pink-300/70">No other users online</p>
        </div>
        <div v-else class="space-y-2">
          <div 
            v-for="user in users" 
            :key="user.id"
            class="flex items-center gap-3 p-2 bg-pink-500/5 rounded-lg border border-pink-400/20 hover:bg-pink-500/10 transition-colors"
          >
            <UAvatar
              :src="user.avatar_url"
              :alt="user.display_name || 'User'"
              size="sm"
              class="ring-2 ring-pink-400/30"
            />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-pink-300 truncate">
                {{ user.display_name || 'Anonymous User' }}
              </p>
              <p class="text-xs text-pink-400/70">
                {{ formatLastSeen(user.last_seen) }}
              </p>
            </div>
            <div class="flex items-center gap-1">
              <div 
                :class="[
                  'w-2 h-2 rounded-full',
                  user.is_online ? 'bg-green-400' : 'bg-gray-400'
                ]"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Debug Info (Development Only) -->
      <div v-if="showDebug" class="pt-2 border-t border-pink-400/30">
        <details class="text-xs text-pink-400/70">
          <summary class="cursor-pointer hover:text-pink-300">Debug Info</summary>
          <pre class="mt-2 p-2 bg-black/50 rounded text-xs overflow-auto">{{ JSON.stringify({ users: users.length, isConnected }, null, 2) }}</pre>
        </details>
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
        <h3 class="text-lg font-semibold text-pink-300">Online Users</h3>
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
      <!-- Connection Status -->
      <div class="flex items-center gap-2 p-3 bg-pink-500/10 rounded-lg border border-pink-400/30">
        <UIcon 
          :name="isConnected ? 'i-heroicons-signal' : 'i-heroicons-signal-slash'" 
          :class="[
            'w-5 h-5',
            isConnected ? 'text-green-400' : 'text-red-400'
          ]"
        />
        <span class="text-sm text-pink-300">
          {{ isConnected ? 'Live Sync Active' : 'Connection Lost' }}
        </span>
      </div>

      <!-- Users List -->
      <div class="space-y-3">
        <h4 class="text-sm font-semibold text-pink-400 uppercase tracking-wide">Active Users</h4>
        <div v-if="users.length === 0" class="text-center py-6">
          <UIcon name="i-lucide-users" class="w-12 h-12 text-pink-400/50 mx-auto mb-3" />
          <p class="text-sm text-pink-300/70">No other users online</p>
        </div>
        <div v-else class="space-y-3">
          <div 
            v-for="user in users" 
            :key="user.id"
            class="flex items-center gap-3 p-3 bg-pink-500/5 rounded-lg border border-pink-400/20 hover:bg-pink-500/10 transition-colors"
          >
            <UAvatar
              :src="user.avatar_url"
              :alt="user.display_name || 'User'"
              size="md"
              class="ring-2 ring-pink-400/30"
            />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-pink-300 truncate">
                {{ user.display_name || 'Anonymous User' }}
              </p>
              <p class="text-xs text-pink-400/70">
                {{ formatLastSeen(user.last_seen) }}
              </p>
            </div>
            <div class="flex items-center gap-1">
              <div 
                :class="[
                  'w-3 h-3 rounded-full',
                  user.is_online ? 'bg-green-400' : 'bg-gray-400'
                ]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </UDrawer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

// Props
interface Props {
  isConnected: boolean
  users: Array<{
    id: string
    display_name?: string
    avatar_url?: string
    last_seen: string
    is_online: boolean
  }>
  showDebug?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showDebug: false
})

// Emits
const emit = defineEmits<{
  'close': []
}>()

// Mobile detection
const isMobile = ref(false)
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

// Dragging state
const isDragging = ref(false)
const position = ref({ x: 20, y: 100 }) // Default position
const dragStart = ref({ x: 0, y: 0 })

// Mobile drawer state
const isOpen = ref(false)

// Modal ref
const modalRef = ref<HTMLElement | null>(null)

// Drag functionality
function startDrag(event: MouseEvent) {
  // Allow dragging from anywhere on the card, not just a specific handle
  isDragging.value = true
  dragStart.value = { x: event.clientX - position.value.x, y: event.clientY - position.value.y }
  
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

// Format last seen time
function formatLastSeen(lastSeen: string): string {
  const now = new Date()
  const lastSeenDate = new Date(lastSeen)
  const diffInMinutes = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
  return `${Math.floor(diffInMinutes / 1440)}d ago`
}

// Open drawer for mobile
const openDrawer = () => {
  isOpen.value = true
}

// Expose methods for parent component
defineExpose({
  openDrawer
})

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped>
/* Dragging styles */
.cursor-move {
  cursor: move;
}

/* Smooth transitions */
.transition-all {
  transition: all 0.2s ease;
}
</style>
