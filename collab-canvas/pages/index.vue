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
          <UButton size="lg" color="primary" to="/login">
            <UIcon name="i-heroicons-play" class="w-5 h-5 mr-2" />
            Get Started
          </UButton>
          <UButton size="lg" variant="outline" to="/signup">
            <UIcon name="i-heroicons-user-plus" class="w-5 h-5 mr-2" />
            Sign Up
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
            <label class="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
            <UInput v-model="name" placeholder="John Doe" />
            <p class="text-xs text-gray-500 mt-1">Enter your name to get started</p>
          </div>

          <!-- Button Variants -->
          <div>
            <h4 class="text-sm font-medium text-gray-700 mb-3">Button Variants</h4>
            <div class="flex flex-wrap gap-2">
              <UButton color="primary">Primary</UButton>
              <UButton color="neutral">Gray</UButton>
              <UButton color="success">Green</UButton>
              <UButton color="error">Red</UButton>
              <UButton variant="outline">Outline</UButton>
              <UButton variant="ghost">Ghost</UButton>
            </div>
          </div>

          <!-- Alert Demo -->
          <UAlert
            icon="i-heroicons-information-circle"
            color="info"
            variant="soft"
            title="Getting Started"
            description="This is a demo of Nuxt UI components. The actual canvas functionality will be implemented in the next phases."
          />

          <!-- Badge Demo -->
          <div>
            <h4 class="text-sm font-medium text-gray-700 mb-3">Status Badges</h4>
            <div class="flex flex-wrap gap-2">
              <UBadge color="success">Online</UBadge>
              <UBadge color="warning">Away</UBadge>
              <UBadge color="error">Busy</UBadge>
              <UBadge color="neutral">Offline</UBadge>
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
const name = ref('')

// Auth composable
const { isAuthenticated, loading } = useAuth()

// Redirect to canvas if authenticated (client-side only)
onMounted(() => {
  watchEffect(() => {
    if (!loading.value && isAuthenticated.value) {
      navigateTo('/canvas')
    }
  })
})

// Set page title
useHead({
  title: 'CollabCanvas - Real-time Collaborative Design',
  meta: [
    {
      name: 'description',
      content: 'Real-time collaborative design canvas built with Nuxt 4, Supabase, and Konva.js'
    }
  ]
})
</script>
