<template>
  <div class="min-h-screen bg-gray-50 p-8">
    <div class="max-w-4xl mx-auto">
      <!-- Hero Section -->
      <div class="text-center mb-12">
        <h1 class="text-4xl font-bold text-gray-900 mb-4">
          Welcome to CollabCanvas
        </h1>
        <p class="text-xl text-gray-600 mb-8">
          Real-time collaborative design canvas built with modern web technologies
        </p>
        
        <!-- Action Buttons -->
        <div class="flex justify-center space-x-4">
          <UButton size="lg" color="primary">
            <UIcon name="i-heroicons-play" class="w-5 h-5 mr-2" />
            Start Drawing
          </UButton>
          <UButton size="lg" variant="outline">
            <UIcon name="i-heroicons-document-text" class="w-5 h-5 mr-2" />
            Learn More
          </UButton>
        </div>
      </div>

      <!-- Feature Cards -->
      <div class="grid md:grid-cols-3 gap-6 mb-12">
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">Real-time Collaboration</h3>
          </template>
          <p class="text-gray-600">
            Work together with your team in real-time. See cursors, changes, and presence instantly.
          </p>
        </UCard>

        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">Powerful Canvas</h3>
          </template>
          <p class="text-gray-600">
            Create shapes, text, and designs with smooth pan, zoom, and manipulation tools.
          </p>
        </UCard>

        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">Modern Tech Stack</h3>
          </template>
          <p class="text-gray-600">
            Built with Nuxt 4, Supabase, and Konva.js for performance and reliability.
          </p>
        </UCard>
      </div>

      <!-- Demo Section -->
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Try the Components</h3>
        </template>
        
        <div class="space-y-6">
          <!-- Input Demo -->
          <div>
            <UFormGroup label="Your Name" help="Enter your name to get started">
              <UInput v-model="name" placeholder="John Doe" />
            </UFormGroup>
          </div>

          <!-- Button Variants -->
          <div>
            <h4 class="text-sm font-medium text-gray-700 mb-3">Button Variants</h4>
            <div class="flex flex-wrap gap-2">
              <UButton color="primary">Primary</UButton>
              <UButton color="gray">Gray</UButton>
              <UButton color="green">Green</UButton>
              <UButton color="red">Red</UButton>
              <UButton variant="outline">Outline</UButton>
              <UButton variant="ghost">Ghost</UButton>
            </div>
          </div>

          <!-- Alert Demo -->
          <UAlert
            icon="i-heroicons-information-circle"
            color="blue"
            variant="soft"
            title="Getting Started"
            description="This is a demo of Nuxt UI components. The actual canvas functionality will be implemented in the next phases."
          />

          <!-- Badge Demo -->
          <div>
            <h4 class="text-sm font-medium text-gray-700 mb-3">Status Badges</h4>
            <div class="flex flex-wrap gap-2">
              <UBadge color="green">Online</UBadge>
              <UBadge color="yellow">Away</UBadge>
              <UBadge color="red">Busy</UBadge>
              <UBadge color="gray">Offline</UBadge>
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
const name = ref('');

// Set page title
useHead({
  title: 'CollabCanvas - Real-time Collaborative Design',
  meta: [
    {
      name: 'description',
      content: 'Real-time collaborative design canvas built with Nuxt 4, Supabase, and Konva.js'
    }
  ]
});
</script>