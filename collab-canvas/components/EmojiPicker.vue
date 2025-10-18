<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center">
    <!-- Backdrop -->
    <div 
      @click="isOpen = false"
      class="fixed inset-0 bg-black/50"
    />
    
    <!-- Modal Content -->
    <div class="relative bg-black/95 border border-pink-500/30 rounded-xl shadow-2xl w-full max-w-sm mx-4">
      <!-- Custom close button -->
      <button
        @click="isOpen = false"
        class="absolute top-3 right-3 z-10 p-1.5 text-pink-300 hover:text-white hover:bg-pink-500/20 rounded-lg transition-colors"
      >
        <UIcon name="i-lucide-x" class="size-4" />
      </button>
      
      <!-- Emoji Picker -->
      <div class="p-4 pt-12">
        <NuxtEmojiPicker
          :hide-search="false"
          theme="dark"
          @select="onSelectEmoji"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  open?: boolean
}>()

const emit = defineEmits<{
  select: [emoji: string]
  'update:open': [open: boolean]
}>()

const isOpen = computed({
  get: () => props.open ?? false,
  set: (value) => emit('update:open', value)
})

function onSelectEmoji(emoji: any) {
  emit('select', emoji.i)
  isOpen.value = false
}
</script>

