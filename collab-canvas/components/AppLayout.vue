<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <UHeader>
      <template #left>
        <div class="flex items-center space-x-4">
          <h1 class="text-xl font-bold text-gray-900">CollabCanvas</h1>
        </div>
      </template>
      
      <template #right>
        <div class="flex items-center space-x-2">
          <UButton variant="ghost" size="sm">
            <UIcon name="i-heroicons-cog-6-tooth" class="w-4 h-4" />
          </UButton>
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
// Layout component for the application
</script>
