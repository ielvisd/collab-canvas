<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold mb-4">Konva Test Page</h1>
    
    <div class="mb-4">
      <UButton @click="addShape" color="primary">Add Rectangle</UButton>
    </div>
    
    <div class="border-2 border-gray-300 w-400 h-300">
      <v-stage
        ref="stage"
        :config="stageConfig"
      >
        <v-layer ref="layer">
          <v-rect
            v-for="rect in rectangles"
            :key="rect.id"
            :config="rect"
          />
        </v-layer>
      </v-stage>
    </div>
    
    <div class="mt-4">
      <p>Rectangles: {{ rectangles.length }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const stageConfig = ref({
  width: 400,
  height: 300
})

const rectangles = ref([])

const addShape = () => {
  rectangles.value.push({
    id: `rect_${Date.now()}`,
    x: Math.random() * 300,
    y: Math.random() * 200,
    width: 50,
    height: 50,
    fill: 'red',
    draggable: true
  })
}

// Add one initial rectangle
addShape()
</script>
