<template>
  <div class="min-h-screen bg-black">
    <div class="max-w-6xl mx-auto px-4 py-16">
      <!-- Hero Section -->
      <div class="text-center mb-20">
        <div class="inline-flex items-center justify-center w-20 h-20 bg-pink-500 rounded-2xl mb-8">
          <UIcon name="i-heroicons-paint-brush" class="w-10 h-10 text-white" />
        </div>
        <h1 class="text-5xl md:text-6xl font-bold text-white mb-6">
          CollabCanvas
        </h1>
        <p class="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
          Create, collaborate, and design together in real-time. The future of collaborative design tools is here.
        </p>
        
        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row justify-center gap-4 mb-16">
          <UButton size="xl" color="primary" to="/login" class="px-8 py-4 text-lg font-semibold bg-pink-500 text-white hover:bg-pink-600">
            <UIcon name="i-heroicons-rocket-launch" class="w-6 h-6 mr-3" />
            Start Creating
          </UButton>
          <UButton size="xl" variant="outline" to="/signup" class="px-8 py-4 text-lg font-semibold border-2 border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-white">
            <UIcon name="i-heroicons-user-plus" class="w-6 h-6 mr-3" />
            Sign Up
          </UButton>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
          <div class="text-center">
            <div class="text-3xl font-bold text-pink-500 mb-2">∞</div>
            <div class="text-sm text-gray-300">Unlimited Canvas</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-pink-500 mb-2">⚡</div>
            <div class="text-sm text-gray-300">Real-time Sync</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-pink-500 mb-2">👥</div>
            <div class="text-sm text-gray-300">Team Collaboration</div>
          </div>
        </div>
      </div>

      <!-- Feature Cards -->
      <div class="grid md:grid-cols-3 gap-8 mb-20">
        <UCard class="group hover:shadow-xl transition-all duration-300 border-2 border-pink-500 bg-gray-800 shadow-lg">
          <template #header>
            <div class="flex items-center space-x-3">
              <div class="w-12 h-12 bg-pink-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <UIcon name="i-heroicons-users" class="w-6 h-6 text-white" />
              </div>
              <h3 class="text-xl font-bold text-white">Real-time Collaboration</h3>
            </div>
          </template>
          <p class="text-gray-300 leading-relaxed">
            Work together with your team in real-time. See live cursors, instant changes, and team presence as it happens.
          </p>
        </UCard>

        <UCard class="group hover:shadow-xl transition-all duration-300 border-2 border-pink-500 bg-gray-800 shadow-lg">
          <template #header>
            <div class="flex items-center space-x-3">
              <div class="w-12 h-12 bg-pink-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <UIcon name="i-heroicons-paint-brush" class="w-6 h-6 text-white" />
              </div>
              <h3 class="text-xl font-bold text-white">Powerful Canvas</h3>
            </div>
          </template>
          <p class="text-gray-300 leading-relaxed">
            Create shapes, text, and designs with smooth pan, zoom, and manipulation tools. Professional-grade design capabilities.
          </p>
        </UCard>

        <UCard class="group hover:shadow-xl transition-all duration-300 border-2 border-pink-500 bg-gray-800 shadow-lg">
          <template #header>
            <div class="flex items-center space-x-3">
              <div class="w-12 h-12 bg-pink-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <UIcon name="i-heroicons-cpu-chip" class="w-6 h-6 text-white" />
              </div>
              <h3 class="text-xl font-bold text-white">Modern Tech Stack</h3>
            </div>
          </template>
          <p class="text-gray-300 leading-relaxed">
            Built with Nuxt 4, Supabase, and Konva.js for exceptional performance, reliability, and developer experience.
          </p>
        </UCard>
      </div>

      <!-- Call to Action -->
      <div class="text-center bg-pink-500 rounded-3xl p-12 text-white">
        <h2 class="text-3xl md:text-4xl font-bold mb-4">Ready to Transform Your Design Process?</h2>
        <p class="text-xl mb-8 opacity-90">Join thousands of designers already collaborating on CollabCanvas</p>
        <UButton size="xl" color="primary" variant="solid" to="/signup" class="px-8 py-4 text-lg font-semibold bg-pink-500 text-white hover:bg-pink-600">
          <UIcon name="i-heroicons-arrow-right" class="w-6 h-6 mr-3" />
          Get Started Free
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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
      content: 'Create, collaborate, and design together in real-time. The future of collaborative design tools is here.'
    }
  ]
})
</script>
