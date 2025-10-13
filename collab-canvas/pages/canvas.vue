<template>
  <div class="h-screen w-screen bg-gray-100">
    <!-- Toolbar -->
    <div class="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-4">
      <div class="flex gap-2">
        <UButton @click="addRectangle" color="primary" size="sm">
          Add Rectangle
        </UButton>
        <UButton @click="addCircle" color="primary" size="sm">
          Add Circle
        </UButton>
        <UButton @click="addText" color="primary" size="sm">
          Add Text
        </UButton>
        <UButton @click="clearCanvas" color="red" variant="outline" size="sm">
          Clear
        </UButton>
        <UButton @click="resetView" color="gray" variant="outline" size="sm">
          Reset View
        </UButton>
      </div>
    </div>

    <!-- Canvas Container -->
    <div class="w-full h-full flex items-center justify-center">
      <div 
        ref="canvasContainer" 
        class="border-2 border-gray-300 rounded-lg shadow-lg bg-white"
        :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }"
      >
        <CanvasKonva
          ref="canvasRef"
          :stage-config="stageConfig"
          :rectangles="rectangles"
          :circles="circles"
          :texts="texts"
          @stage-mousedown="handleStageMouseDown"
          @stage-mousemove="handleStageMouseMove"
          @stage-mouseup="handleStageMouseUp"
          @select-shape="selectShape"
          @update-shape="updateShape"
        />
      </div>
    </div>

    <!-- Debug Info -->
    <div class="absolute bottom-4 left-4 z-10 bg-white rounded-lg shadow-lg p-4">
      <div class="text-sm text-gray-600">
        <div>Shapes: {{ totalShapes }}</div>
        <div>Selected: {{ selectedShapeId || 'None' }}</div>
        <div>Zoom: {{ Math.round(zoom * 100) }}%</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

// Canvas dimensions
const canvasWidth = 800
const canvasHeight = 600

// Stage configuration
const stageConfig = ref({
  width: canvasWidth,
  height: canvasHeight,
  draggable: true,
  scaleX: 1,
  scaleY: 1,
  x: 0,
  y: 0
})

// Shape arrays
const rectangles = ref([])
const circles = ref([])
const texts = ref([])

// Interaction state
const selectedShapeId = ref(null)
const isDragging = ref(false)
const lastPointerPosition = ref({ x: 0, y: 0 })
const canvasRef = ref(null)

// Computed properties
const totalShapes = computed(() => 
  rectangles.value.length + circles.value.length + texts.value.length
)

const zoom = computed(() => stageConfig.value.scaleX || 1)

// Shape creation methods
const addRectangle = () => {
  const rect = {
    id: `rect_${Date.now()}`,
    x: Math.random() * (canvasWidth - 100),
    y: Math.random() * (canvasHeight - 100),
    width: 100,
    height: 60,
    fill: getRandomColor(),
    stroke: '#000',
    strokeWidth: 2,
    draggable: true
  }
  rectangles.value.push(rect)
}

const addCircle = () => {
  const circle = {
    id: `circle_${Date.now()}`,
    x: Math.random() * (canvasWidth - 100),
    y: Math.random() * (canvasHeight - 100),
    radius: 50,
    fill: getRandomColor(),
    stroke: '#000',
    strokeWidth: 2,
    draggable: true
  }
  circles.value.push(circle)
}

const addText = () => {
  const text = {
    id: `text_${Date.now()}`,
    x: Math.random() * (canvasWidth - 100),
    y: Math.random() * (canvasHeight - 50),
    text: 'Hello Konva!',
    fontSize: 24,
    fill: getRandomColor(),
    draggable: true
  }
  texts.value.push(text)
}

const clearCanvas = () => {
  rectangles.value = []
  circles.value = []
  texts.value = []
  selectedShapeId.value = null
}

const resetView = () => {
  // Reset stage configuration to default
  stageConfig.value = {
    width: canvasWidth,
    height: canvasHeight,
    draggable: true,
    scaleX: 1,
    scaleY: 1,
    x: 0,
    y: 0
  }
  
  // Also call the component's reset method
  if (canvasRef.value) {
    canvasRef.value.resetView()
  }
}

// Utility functions
const getRandomColor = () => {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8']
  return colors[Math.floor(Math.random() * colors.length)]
}

const selectShape = (shapeId) => {
  selectedShapeId.value = shapeId
}

const updateShape = (shapeId, event) => {
  const { x, y } = event.target.attrs
  // Update the shape in the appropriate array
  const allShapes = [...rectangles.value, ...circles.value, ...texts.value]
  const shape = allShapes.find(s => s.id === shapeId)
  if (shape) {
    shape.x = x
    shape.y = y
  }
}

// Stage interaction handlers
const handleStageMouseDown = (e) => {
  isDragging.value = true
  const pos = e.evt
  lastPointerPosition.value = { x: pos.clientX, y: pos.clientY }
}

const handleStageMouseMove = (e) => {
  if (!isDragging.value) return
  
  const pos = e.evt
  const dx = pos.clientX - lastPointerPosition.value.x
  const dy = pos.clientY - lastPointerPosition.value.y
  
  stageConfig.value.x += dx
  stageConfig.value.y += dy
  
  lastPointerPosition.value = { x: pos.clientX, y: pos.clientY }
}

const handleStageMouseUp = () => {
  isDragging.value = false
}

// Keyboard shortcuts
const handleKeyDown = (e) => {
  if (e.key === 'Delete' && selectedShapeId.value) {
    deleteSelectedShape()
  }
}

const deleteSelectedShape = () => {
  if (!selectedShapeId.value) return
  
  rectangles.value = rectangles.value.filter(r => r.id !== selectedShapeId.value)
  circles.value = circles.value.filter(c => c.id !== selectedShapeId.value)
  texts.value = texts.value.filter(t => t.id !== selectedShapeId.value)
  
  selectedShapeId.value = null
}

// Lifecycle
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  
  // Add some initial shapes for testing (client-side only)
  nextTick(() => {
    console.log('Adding initial shapes...')
    addRectangle()
    addCircle()
    addText()
    console.log('Shapes added:', { 
      rectangles: rectangles.value.length, 
      circles: circles.value.length, 
      texts: texts.value.length 
    })
  })
})

// Cleanup
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
/* Ensure the canvas container is properly sized */
canvas {
  display: block;
}
</style>
