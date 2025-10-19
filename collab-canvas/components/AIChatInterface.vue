<template>
  <div class="ai-chat-interface">
    <!-- AI Chat Panel -->
    <div
      v-if="props.showChat"
      class="fixed bottom-4 right-4 z-50 w-[420px] h-[500px] bg-black/90 border-2 border-pink-500 rounded-xl shadow-2xl flex flex-col backdrop-blur-sm"
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b-2 border-pink-500">
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-sparkles" class="w-5 h-5 text-pink-400 animate-pulse" />
          <h3 class="text-lg font-semibold font-display text-pink-300">🤖 AI Artist</h3>
        </div>
        <UButton
          variant="ghost"
          size="sm"
          icon="i-heroicons-x-mark"
          class="text-pink-300 hover:text-white hover:bg-pink-500/20"
          @click="emit('update:showChat', false)"
        />
      </div>

      <!-- Messages Area -->
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <div v-if="messages.length === 0" class="text-center text-pink-200">
          <UIcon name="i-heroicons-chat-bubble-left-ellipsis" class="w-8 h-8 mx-auto mb-2 text-pink-400" />
          <p class="text-sm font-medium">Ask me to create visual stories with emojis and shapes!</p>
          <div class="mt-4 space-y-2 text-xs">
            <p class="font-medium text-pink-300">Try these emoji stories:</p>
            <div class="space-y-1 text-pink-200">
              <p>• "Create a story with three little pigs on an island"</p>
              <p>• "Make an ocean scene with fish and waves"</p>
              <p>• "Create a space adventure with rockets and planets"</p>
              <p>• "Tell a story about a house with a tree"</p>
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
              ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white' 
              : 'bg-pink-500/20 text-pink-100 border border-pink-400/30'"
          >
            <div class="text-sm whitespace-pre-wrap">{{ message.content }}</div>
            <div v-if="message.role === 'assistant' && isLoading" class="mt-2">
              <div class="flex items-center gap-1">
                <div class="w-2 h-2 bg-pink-400 rounded-full animate-bounce"/>
                <div class="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style="animation-delay: 0.1s"/>
                <div class="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style="animation-delay: 0.2s"/>
              </div>
            </div>
          </div>
        </div>

        <!-- Processing Indicator -->
        <div v-if="isProcessing" class="flex justify-start">
          <div class="bg-pink-500/20 text-pink-200 border border-pink-400/30 px-3 py-2 rounded-lg">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-cog-6-tooth" class="w-4 h-4 animate-spin text-pink-400" />
              <span class="text-sm">Executing command...</span>
            </div>
          </div>
        </div>

        <!-- Error Display -->
        <div v-if="error" class="flex justify-start">
          <div class="bg-red-500/20 text-red-200 border border-red-400/30 px-3 py-2 rounded-lg">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 text-red-400" />
              <span class="text-sm">{{ error }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Input Area -->
      <div class="p-4 border-t-2 border-pink-500">
        <form class="flex gap-2" @submit.prevent="handleSubmit">
          <UInput
            v-model="input"
            placeholder="Ask me to create emoji stories..."
            :disabled="isLoading"
            class="flex-1 bg-black/50 border-pink-400 text-pink-100 placeholder-pink-300"
          />
          <UButton
            type="submit"
            :disabled="!input.trim() || isLoading"
            :loading="isLoading"
            class="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white border-0"
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
            class="text-pink-200 border-pink-400 hover:bg-pink-500/20 hover:text-white"
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

// Props
const props = defineProps<{
  showChat: boolean
}>()

// Emits
const emit = defineEmits<{
  'update:showChat': [value: boolean]
}>()

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

// Quick action commands - emoji-focused only
const quickActions = [
  { label: '🐷 Three Little Pigs', command: 'Create a story with three little pigs on an island' },
  { label: '🏠 House & Tree', command: 'Create a house with a tree next to it' },
  { label: '🌊 Ocean Adventure', command: 'Create an ocean scene with fish and waves' },
  { label: '🚀 Space Journey', command: 'Create a space scene with rockets and planets' },
  { label: '🎉 Party Scene', command: 'Create a party scene with balloons and cake' },
  { label: '🎭 Theater Story', command: 'Tell a theater story with actors and stage' },
  { label: '🍕 Food Scene', command: 'Create a food scene with pizza and drinks' },
  { label: '😊 Happy Face', command: 'Add a happy face emoji' },
  { label: '❤️ Heart', command: 'Add a heart emoji' },
  { label: '⭐ Star', command: 'Add a star emoji' },
  { label: '🧹 Clear Canvas', command: 'Delete all emojis from the canvas' }
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
watch(() => props.showChat, (newValue) => {
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
