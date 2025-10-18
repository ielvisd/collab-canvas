<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
    <div class="max-w-6xl mx-auto px-4 py-16">
      <!-- Hero Section -->
      <div class="text-center mb-20">
        <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl mb-8">
          <span class="text-4xl">🎨</span>
        </div>
        <h1 class="text-6xl md:text-7xl font-bold text-white mb-6 font-display">
          EmojiKai
        </h1>
        <p class="text-xl md:text-2xl text-gray-200 mb-12 max-w-3xl mx-auto leading-relaxed">
          Where emojis tell stories and AI brings them to life. The most creative collaborative canvas on the planet! 🌟
        </p>
        
        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row justify-center gap-4 mb-16">
          <UButton size="xl" color="primary" to="/login" class="px-8 py-4 text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600">
            <span class="text-xl mr-3">🚀</span>
            Start Creating
          </UButton>
          <UButton size="xl" variant="outline" to="/signup" class="px-8 py-4 text-lg font-semibold border-2 border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white">
            <span class="text-xl mr-3">✨</span>
            Join EmojiKai
          </UButton>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
          <div class="text-center">
            <div class="text-4xl font-bold text-blue-400 mb-2">🎨</div>
            <div class="text-sm text-gray-200">Emoji Stories</div>
          </div>
          <div class="text-center">
            <div class="text-4xl font-bold text-purple-400 mb-2">🤖</div>
            <div class="text-sm text-gray-200">AI Powered</div>
          </div>
          <div class="text-center">
            <div class="text-4xl font-bold text-pink-400 mb-2">👥</div>
            <div class="text-sm text-gray-200">Live Collaboration</div>
          </div>
        </div>
      </div>

      <!-- Feature Cards -->
      <div class="grid md:grid-cols-3 gap-8 mb-20">
        <UCard class="group hover:shadow-xl transition-all duration-300 border-2 border-blue-400 bg-gray-800/50 backdrop-blur-sm shadow-lg">
          <template #header>
            <div class="flex items-center space-x-3">
              <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <span class="text-2xl">🎭</span>
              </div>
              <h3 class="text-xl font-bold text-white font-display">Emoji Storytelling</h3>
            </div>
          </template>
          <p class="text-gray-200 leading-relaxed">
            Tell incredible stories using emojis! From "Three little pigs on an island" to epic adventures - your imagination is the only limit.
          </p>
        </UCard>

        <UCard class="group hover:shadow-xl transition-all duration-300 border-2 border-purple-400 bg-gray-800/50 backdrop-blur-sm shadow-lg">
          <template #header>
            <div class="flex items-center space-x-3">
              <div class="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <span class="text-2xl">🤖</span>
              </div>
              <h3 class="text-xl font-bold text-white font-display">AI Magic</h3>
            </div>
          </template>
          <p class="text-gray-200 leading-relaxed">
            Our AI understands your creative vision and brings it to life with perfectly placed emojis and smart layouts.
          </p>
        </UCard>

        <UCard class="group hover:shadow-xl transition-all duration-300 border-2 border-pink-400 bg-gray-800/50 backdrop-blur-sm shadow-lg">
          <template #header>
            <div class="flex items-center space-x-3">
              <div class="w-12 h-12 bg-gradient-to-r from-pink-500 to-red-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <span class="text-2xl">👥</span>
              </div>
              <h3 class="text-xl font-bold text-white font-display">Live Collaboration</h3>
            </div>
          </template>
          <p class="text-gray-200 leading-relaxed">
            Create together in real-time! See your friends' emojis appear instantly as you build amazing stories together.
          </p>
        </UCard>
      </div>

      <!-- Call to Action -->
      <div class="text-center bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl p-12 text-white">
        <h2 class="text-3xl md:text-4xl font-bold mb-4 font-display">Ready to Create Epic Emoji Stories?</h2>
        <p class="text-xl mb-8 opacity-90">Join the EmojiKai revolution and unleash your creativity! 🎨✨</p>
        <UButton size="xl" color="primary" variant="solid" to="/signup" class="px-8 py-4 text-lg font-semibold bg-white text-purple-600 hover:bg-gray-100">
          <span class="text-xl mr-3">🚀</span>
          Start Creating Now
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
  title: 'EmojiKai - AI-Powered Emoji Storytelling Canvas',
  meta: [
    {
      name: 'description',
      content: 'Where emojis tell stories and AI brings them to life. The most creative collaborative canvas on the planet!'
    }
  ]
})
</script>
