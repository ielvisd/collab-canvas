<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <UHeader>
      <template #left>
        <div class="flex items-center space-x-4">
          <NuxtLink to="/canvas" class="text-xl font-bold text-gray-900 hover:text-primary-600">
            CollabCanvas
          </NuxtLink>
        </div>
      </template>
      
      <template #right>
        <div class="flex items-center space-x-2">
          <!-- User menu -->
          <UDropdownMenu :items="userMenuItems">
            <UButton variant="ghost" size="sm" class="p-0">
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
    <main class="flex-1">
      <slot />
    </main>

    <!-- Footer -->
    <UFooter>
      <template #left>
        <p class="text-sm text-gray-500">
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
