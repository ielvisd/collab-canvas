<template>
  <div class="min-h-screen bg-black flex flex-col">
    <!-- Header -->
    <UHeader data-testid="app-header" class="flex-shrink-0" :toggle="false">
      <template #left>
        <div class="flex items-center space-x-2 sm:space-x-4">
          <NuxtLink to="/canvas" class="text-lg sm:text-xl font-bold text-blue-500 hover:text-blue-400 font-display">
            <span class="hidden sm:inline">EmojiKai</span>
            <span class="sm:hidden">EK</span>
          </NuxtLink>
        </div>
      </template>
      
      <template #right>
        <div class="flex items-center space-x-1 sm:space-x-2">
          <!-- User menu -->
          <UDropdownMenu :items="userMenuItems" :ui="{ content: 'z-[9999] min-w-48' }">
            <UButton variant="ghost" size="sm" class="p-1 sm:p-2">
              <UAvatar
                :src="userAvatarUrl"
                :alt="userDisplayName"
                size="sm"
                class="cursor-pointer"
              />
            </UButton>
          </UDropdownMenu>
        </div>
      </template>
    </UHeader>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col overflow-hidden">
      <slot />
    </main>

    <!-- Footer - Hidden on mobile -->
    <UFooter class="hidden sm:block flex-shrink-0">
      <template #left>
        <p class="text-sm text-white">
          Built with Nuxt 4, Supabase, and Konva.js
        </p>
      </template>
    </UFooter>
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
