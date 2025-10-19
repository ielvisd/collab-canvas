<template>
  <div class="min-h-screen bg-black flex flex-col">
    <!-- Main Header with branding and controls -->
    <div class="flex-shrink-0 bg-black/90 backdrop-blur-sm border-b-2 border-pink-500 p-2 sm:p-3 shadow-lg">
      <div class="flex items-center justify-between">
        <!-- Left: Logo and Branding -->
        <div class="flex items-center gap-2 sm:gap-3">
          <h1 class="text-xl sm:text-2xl lg:text-3xl font-bold text-white font-display">EmojiKai 🎨</h1>
          <!-- Status Badges -->
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
        
        <!-- Right: Controls and User Menu -->
        <div class="flex items-center gap-2">
          <!-- Users Button with Count -->
          <UButton
            icon="i-lucide-users"
            :label="isMobile ? '' : `Users (${userCount})`"
            color="neutral"
            variant="outline"
            size="sm"
            class="font-body border-pink-400 text-pink-300 hover:bg-pink-500/10 relative"
            @click="emit('toggle-users')"
          >
            <template #trailing>
              <UBadge 
                v-if="userCount > 0"
                :label="userCount.toString()"
                color="primary"
                variant="solid"
                size="xs"
                class="ml-1"
              />
            </template>
          </UButton>
          
          <!-- User menu -->
          <UDropdownMenu :items="userMenuItems" :ui="{ content: 'z-[9999] min-w-48' }">
            <UButton variant="ghost" size="sm" class="p-1 sm:p-2 text-pink-300 hover:text-white">
              <UAvatar
                :src="userAvatarUrl"
                :alt="userDisplayName"
                size="sm"
                class="cursor-pointer"
              />
            </UButton>
          </UDropdownMenu>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col overflow-hidden">
      <slot />
    </main>

  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

// Auth composable
const { userDisplayName, userAvatarUrl, signOut } = useAuth()

// Props
interface Props {
  isConnected?: boolean
  isMobile?: boolean
  userCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  isConnected: true,
  isMobile: false,
  userCount: 0
})

// Emits
const emit = defineEmits<{
  'toggle-users': []
  'show-ai-chat': []
}>()

// Local state for UI controls
const showPresence = ref(false)
const showAIChat = ref(false)

// User menu items
const userMenuItems = computed(() => [
  [{
    label: userDisplayName.value || 'User',
    type: 'label'
  }],
  [{
    label: 'Profile',
    icon: 'i-heroicons-user',
    onSelect: () => {
      // TODO: Navigate to profile page
      console.log('Navigate to profile')
    }
  }, {
    label: 'Settings',
    icon: 'i-heroicons-cog-6-tooth',
    onSelect: () => {
      // TODO: Navigate to settings page
      console.log('Navigate to settings')
    }
  }],
  [{
    label: 'Sign out',
    icon: 'i-heroicons-arrow-right-on-rectangle',
    onSelect: async () => {
      await signOut()
    }
  }]
])
</script>
