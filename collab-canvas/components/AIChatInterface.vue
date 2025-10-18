<template>
  <div class="ai-chat-interface">
    <!-- AI Chat Toggle Button -->
    <UButton
      v-if="!showChat"
      class="fixed bottom-4 right-4 z-50"
      color="primary"
      size="lg"
      icon="i-heroicons-sparkles"
      @click="showChat = true"
    >
      AI Assistant
    </UButton>

    <!-- AI Chat Panel -->
    <div
      v-if="showChat"
      class="fixed bottom-4 right-4 z-50 w-96 h-96 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl flex flex-col"
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-sparkles" class="w-5 h-5 text-primary-500" />
          <h3 class="text-lg font-semibold font-display">🤖 AI Storyteller</h3>
        </div>
        <UButton
          variant="ghost"
          size="sm"
          icon="i-heroicons-x-mark"
          @click="showChat = false"
        />
      </div>

      <!-- Messages Area -->
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <div v-if="messages.length === 0" class="text-center text-gray-500 dark:text-gray-400">
          <UIcon name="i-heroicons-chat-bubble-left-ellipsis" class="w-8 h-8 mx-auto mb-2" />
          <p class="text-sm">Ask me to create, move, or arrange shapes on your canvas!</p>
          <div class="mt-4 space-y-2 text-xs">
            <p class="font-medium">Try these commands:</p>
            <div class="space-y-1">
              <p>• "Create a red rectangle at position 100, 200"</p>
              <p>• "Make a blue circle with radius 50"</p>
              <p>• "Arrange all shapes in a horizontal row"</p>
              <p>• "Create a login form with username and password fields"</p>
            </div>
          </div>
        </div>

        <div
          v-for="message in messages"
          :key="message.id"
          class="flex"
          :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
        >
          <div
            class="max-w-xs px-3 py-2 rounded-lg"
            :class="message.role === 'user' 
              ? 'bg-primary-500 text-white' 
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'"
          >
            <div class="text-sm whitespace-pre-wrap">{{ message.content }}</div>
            <div v-if="message.role === 'assistant' && isLoading" class="mt-2">
              <div class="flex items-center gap-1">
                <div class="w-2 h-2 bg-primary-500 rounded-full animate-bounce"/>
                <div class="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style="animation-delay: 0.1s"/>
                <div class="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style="animation-delay: 0.2s"/>
              </div>
            </div>
          </div>
        </div>

        <!-- Processing Indicator -->
        <div v-if="isProcessing" class="flex justify-start">
          <div class="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-3 py-2 rounded-lg">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-cog-6-tooth" class="w-4 h-4 animate-spin" />
              <span class="text-sm">Executing command...</span>
            </div>
          </div>
        </div>

        <!-- Error Display -->
        <div v-if="error" class="flex justify-start">
          <div class="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-3 py-2 rounded-lg">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4" />
              <span class="text-sm">{{ error }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Input Area -->
      <div class="p-4 border-t border-gray-200 dark:border-gray-700">
        <form class="flex gap-2" @submit.prevent="handleSubmit">
          <UInput
            v-model="input"
            placeholder="Ask me to create or modify shapes..."
            :disabled="isLoading"
            class="flex-1"
          />
          <UButton
            type="submit"
            :disabled="!input.trim() || isLoading"
            :loading="isLoading"
            color="primary"
            icon="i-heroicons-paper-airplane"
          />
        </form>
        
        <!-- Quick Actions -->
        <div class="mt-2 flex flex-wrap gap-1">
          <UButton
            v-for="quickAction in quickActions"
            :key="quickAction.label"
            size="xs"
            variant="outline"
            @click="input = quickAction.command"
          >
            {{ quickAction.label }}
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAIAgent } from '~/composables/useAIAgent'

// AI Agent composable - now uses shared state
const {
  messages,
  input,
  isLoading,
  isProcessing,
  error,
  sendMessage,
  clearError,
  reset
} = useAIAgent()

// Local state
const showChat = ref(false)

// Quick action commands
const quickActions = [
  { label: '🐷 Three Little Pigs', command: 'Create a story with three little pigs on an island' },
  { label: '😊 Happy Face', command: 'Add a happy face emoji' },
  { label: '🏠 House & Tree', command: 'Create a house with a tree next to it' },
  { label: '🎉 Party Scene', command: 'Create a party scene with balloons and cake' },
  { label: '🌊 Ocean Adventure', command: 'Create an ocean scene with fish and waves' },
  { label: '🚀 Space Journey', command: 'Create a space scene with rockets and planets' },
  { label: '🎭 Theater Story', command: 'Tell a theater story with actors and stage' },
  { label: '🍕 Food Scene', command: 'Create a food scene with pizza and drinks' },
  { label: '🔵 Blue Circle', command: 'Add a blue circle shape' },
  { label: '📝 Text Label', command: 'Add a text label that says "Hello World"' },
  { label: '🧹 Clear Canvas', command: 'Delete all emojis and shapes from the canvas' }
]

// Handle form submission
const handleSubmit = () => {
  if (input.value.trim()) {
    sendMessage(input.value)
  }
}

// Clear error when input changes
watch(input, () => {
  if (error.value) {
    clearError()
  }
})

// Reset when chat is closed
watch(showChat, (newValue) => {
  if (!newValue) {
    reset()
  }
})
</script>

<style scoped>
.ai-chat-interface {
  font-family: inherit;
}

/* Custom scrollbar for messages */
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Dark mode scrollbar */
.dark .overflow-y-auto::-webkit-scrollbar-thumb {
  background: #475569;
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #64748b;
}
</style>
