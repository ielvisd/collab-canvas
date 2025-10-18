<template>
  <div class="min-h-screen bg-black flex flex-col">
    <!-- Minimal Header with just user menu -->
    <div class="flex-shrink-0 bg-black/90 backdrop-blur-sm border-b-2 border-pink-500 p-2">
      <div class="flex items-center justify-end">
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

    <!-- Main Content -->
    <main class="flex-1 flex flex-col overflow-hidden">
      <slot />
    </main>

    <!-- Footer - Hidden on mobile -->
    <div class="hidden sm:block flex-shrink-0 bg-black/90 backdrop-blur-sm border-t-2 border-pink-500 p-4">
      <p class="text-sm text-pink-300">
        Built with Nuxt 4, Supabase, and Konva.js
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Auth composable
const { userDisplayName, userAvatarUrl, signOut } = useAuth()

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
