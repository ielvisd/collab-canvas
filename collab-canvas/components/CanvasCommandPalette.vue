<template>
  <UModal v-model:open="isOpen">
    <UButton
      icon="i-lucide-command"
      label="Command Palette"
      color="neutral"
      variant="outline"
      class="fixed top-4 left-4 z-40"
    />

    <template #content>
      <UCommandPalette
        v-model:search-term="searchTerm"
        :groups="commandGroups"
        placeholder="Search commands..."
        class="h-96"
        @update:model-value="handleCommand"
      />
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// Props
interface Props {
  selectedItemCount: number
  clipboardHasData: boolean
  canUndo: boolean
  canRedo: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'copy': []
  'paste': []
  'delete-selected': []
  'clear-selection': []
  'undo': []
  'redo': []
  'select-all': []
  'duplicate': []
}>()

// State
const isOpen = ref(false)
const searchTerm = ref('')

// Command groups
const commandGroups = computed(() => [
  {
    id: 'selection',
    label: 'Selection',
    items: [
      {
        label: 'Select All',
        description: 'Select all items on the canvas',
        icon: 'i-lucide-mouse-pointer-click',
        kbds: ['meta', 'A'],
        onSelect: () => {
          emit('select-all')
          isOpen.value = false
        }
      },
      {
        label: 'Clear Selection',
        description: 'Deselect all items',
        icon: 'i-lucide-mouse-pointer-off',
        onSelect: () => {
          emit('clear-selection')
          isOpen.value = false
        }
      }
    ]
  },
  {
    id: 'edit',
    label: 'Edit',
    items: [
      {
        label: 'Copy',
        description: 'Copy selected items to clipboard',
        icon: 'i-lucide-copy',
        kbds: ['meta', 'C'],
        disabled: props.selectedItemCount === 0,
        onSelect: () => {
          if (props.selectedItemCount > 0) {
            emit('copy')
            isOpen.value = false
          }
        }
      },
      {
        label: 'Paste',
        description: 'Paste items from clipboard',
        icon: 'i-lucide-clipboard',
        kbds: ['meta', 'V'],
        disabled: !props.clipboardHasData,
        onSelect: () => {
          if (props.clipboardHasData) {
            emit('paste')
            isOpen.value = false
          }
        }
      },
      {
        label: 'Duplicate',
        description: 'Duplicate selected items',
        icon: 'i-lucide-copy-plus',
        kbds: ['meta', 'D'],
        disabled: props.selectedItemCount === 0,
        onSelect: () => {
          if (props.selectedItemCount > 0) {
            emit('duplicate')
            isOpen.value = false
          }
        }
      },
      {
        label: 'Delete',
        description: 'Delete selected items',
        icon: 'i-lucide-trash-2',
        kbds: ['Delete'],
        disabled: props.selectedItemCount === 0,
        onSelect: () => {
          if (props.selectedItemCount > 0) {
            emit('delete-selected')
            isOpen.value = false
          }
        }
      }
    ]
  },
  {
    id: 'history',
    label: 'History',
    items: [
      {
        label: 'Undo',
        description: 'Undo last action',
        icon: 'i-lucide-undo',
        kbds: ['meta', 'Z'],
        disabled: !props.canUndo,
        onSelect: () => {
          if (props.canUndo) {
            emit('undo')
            isOpen.value = false
          }
        }
      },
      {
        label: 'Redo',
        description: 'Redo last undone action',
        icon: 'i-lucide-redo',
        kbds: ['meta', 'Shift', 'Z'],
        disabled: !props.canRedo,
        onSelect: () => {
          if (props.canRedo) {
            emit('redo')
            isOpen.value = false
          }
        }
      }
    ]
  }
])

// Handle command selection
const handleCommand = (item: any) => {
  if (item.onSelect) {
    item.onSelect()
  }
}

// Expose open method for external control
defineExpose({
  open: () => {
    isOpen.value = true
  }
})
</script>
