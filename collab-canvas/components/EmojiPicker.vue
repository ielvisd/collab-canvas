<template>
  <UModal v-model:open="isOpen">
    <UButton
      icon="i-lucide-smile"
      label="Emoji"
      color="neutral"
      variant="outline"
      size="sm"
    />
    
    <template #content>
      <div class="p-4">
        <h3 class="text-lg font-semibold mb-4">Choose an Emoji</h3>
        
        <UCommandPalette
          v-model:search-term="searchTerm"
          :groups="emojiGroups"
          placeholder="Search emojis..."
          class="h-80"
          @update:model-value="onEmojiSelect"
        />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
interface EmojiCategory {
  id: string
  label: string
  items: Array<{
    label: string
    emoji: string
    keywords: string[]
    onSelect: () => void
  }>
}

const emit = defineEmits<{
  select: [emoji: string]
}>()

const isOpen = ref(false)
const searchTerm = ref('')

// Emoji categories with popular emojis
const emojiCategories: EmojiCategory[] = [
  {
    id: 'animals',
    label: 'Animals & Nature',
    items: [
      { label: 'Pig', emoji: '🐷', keywords: ['pig', 'animal', 'pink'], onSelect: () => selectEmoji('🐷') },
      { label: 'Island', emoji: '🏝️', keywords: ['island', 'beach', 'tropical'], onSelect: () => selectEmoji('🏝️') },
      { label: 'Tree', emoji: '🌳', keywords: ['tree', 'nature', 'green'], onSelect: () => selectEmoji('🌳') },
      { label: 'Sun', emoji: '☀️', keywords: ['sun', 'sunny', 'bright'], onSelect: () => selectEmoji('☀️') },
      { label: 'Moon', emoji: '🌙', keywords: ['moon', 'night', 'crescent'], onSelect: () => selectEmoji('🌙') },
      { label: 'Star', emoji: '⭐', keywords: ['star', 'sparkle', 'bright'], onSelect: () => selectEmoji('⭐') },
      { label: 'Heart', emoji: '❤️', keywords: ['heart', 'love', 'red'], onSelect: () => selectEmoji('❤️') },
      { label: 'Fire', emoji: '🔥', keywords: ['fire', 'hot', 'flame'], onSelect: () => selectEmoji('🔥') },
    ]
  },
  {
    id: 'faces',
    label: 'Faces & Emotions',
    items: [
      { label: 'Smile', emoji: '😊', keywords: ['smile', 'happy', 'face'], onSelect: () => selectEmoji('😊') },
      { label: 'Laugh', emoji: '😂', keywords: ['laugh', 'funny', 'tears'], onSelect: () => selectEmoji('😂') },
      { label: 'Wink', emoji: '😉', keywords: ['wink', 'playful', 'eye'], onSelect: () => selectEmoji('😉') },
      { label: 'Love Eyes', emoji: '😍', keywords: ['love', 'heart', 'eyes'], onSelect: () => selectEmoji('😍') },
      { label: 'Thinking', emoji: '🤔', keywords: ['thinking', 'question', 'hand'], onSelect: () => selectEmoji('🤔') },
      { label: 'Surprised', emoji: '😮', keywords: ['surprised', 'shock', 'mouth'], onSelect: () => selectEmoji('😮') },
    ]
  },
  {
    id: 'objects',
    label: 'Objects & Things',
    items: [
      { label: 'House', emoji: '🏠', keywords: ['house', 'home', 'building'], onSelect: () => selectEmoji('🏠') },
      { label: 'Car', emoji: '🚗', keywords: ['car', 'vehicle', 'drive'], onSelect: () => selectEmoji('🚗') },
      { label: 'Book', emoji: '📚', keywords: ['book', 'read', 'library'], onSelect: () => selectEmoji('📚') },
      { label: 'Phone', emoji: '📱', keywords: ['phone', 'mobile', 'call'], onSelect: () => selectEmoji('📱') },
      { label: 'Computer', emoji: '💻', keywords: ['computer', 'laptop', 'work'], onSelect: () => selectEmoji('💻') },
      { label: 'Camera', emoji: '📷', keywords: ['camera', 'photo', 'picture'], onSelect: () => selectEmoji('📷') },
    ]
  },
  {
    id: 'food',
    label: 'Food & Drink',
    items: [
      { label: 'Pizza', emoji: '🍕', keywords: ['pizza', 'food', 'cheese'], onSelect: () => selectEmoji('🍕') },
      { label: 'Coffee', emoji: '☕', keywords: ['coffee', 'drink', 'hot'], onSelect: () => selectEmoji('☕') },
      { label: 'Cake', emoji: '🎂', keywords: ['cake', 'birthday', 'sweet'], onSelect: () => selectEmoji('🎂') },
      { label: 'Apple', emoji: '🍎', keywords: ['apple', 'fruit', 'red'], onSelect: () => selectEmoji('🍎') },
      { label: 'Banana', emoji: '🍌', keywords: ['banana', 'fruit', 'yellow'], onSelect: () => selectEmoji('🍌') },
    ]
  }
]

// Convert to CommandPalette format
const emojiGroups = computed(() => 
  emojiCategories.map(category => ({
    id: category.id,
    label: category.label,
    items: category.items.map(item => ({
      label: `${item.emoji} ${item.label}`,
      suffix: item.keywords.join(', '),
      emoji: item.emoji,
      onSelect: item.onSelect
    }))
  }))
)

function selectEmoji(emoji: string) {
  emit('select', emoji)
  isOpen.value = false
  searchTerm.value = ''
}

function onEmojiSelect(item: any) {
  if (item?.emoji) {
    selectEmoji(item.emoji)
  }
}
</script>

