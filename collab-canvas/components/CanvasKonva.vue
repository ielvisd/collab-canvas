<template>
  <div v-if="isClient">
    <div ref="konvaContainer" class="w-full h-full konva-container"></div>
  </div>
  <div v-else class="flex items-center justify-center h-full bg-gray-100 rounded">
    <div class="text-gray-500">Loading canvas...</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'

// Client-side only rendering
const isClient = ref(false)
const konvaContainer = ref(null)
let stage = null
let layer = null
let Konva = null

// Props
const props = defineProps({
  stageConfig: {
    type: Object,
    required: true
  },
  rectangles: {
    type: Array,
    default: () => []
  },
  circles: {
    type: Array,
    default: () => []
  },
  texts: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits([
  'stage-mousedown',
  'stage-mousemove', 
  'stage-mouseup',
  'select-shape',
  'update-shape'
])

// Stage interaction handlers
const handleStageMouseDown = (e) => {
  // Only pan if clicking on empty space (not on shapes)
  if (e.target === stage) {
    stage.draggable(true)
  }
  emit('stage-mousedown', e)
}

const handleStageMouseMove = (e) => {
  emit('stage-mousemove', e)
}

const handleStageMouseUp = (e) => {
  stage.draggable(false)
  emit('stage-mouseup', e)
}

// Zoom functionality
const handleWheel = (e) => {
  e.evt.preventDefault()
  
  const scaleBy = 0.95
  const oldScale = stage.scaleX()
  const pointer = stage.getPointerPosition()
  
  const mousePointTo = {
    x: (pointer.x - stage.x()) / oldScale,
    y: (pointer.y - stage.y()) / oldScale,
  }
  
  const newScale = e.evt.deltaY > 0 ? oldScale * scaleBy : oldScale / scaleBy
  
  // Limit zoom levels
  const minScale = 0.1
  const maxScale = 5
  const clampedScale = Math.max(minScale, Math.min(maxScale, newScale))
  
  stage.scale({ x: clampedScale, y: clampedScale })
  
  const newPos = {
    x: pointer.x - mousePointTo.x * clampedScale,
    y: pointer.y - mousePointTo.y * clampedScale,
  }
  
  stage.position(newPos)
  stage.batchDraw()
}

const selectShape = (shapeId) => {
  emit('select-shape', shapeId)
}

const updateShape = (shapeId, event) => {
  emit('update-shape', shapeId, event)
}

// Keyboard shortcuts
const handleKeyDown = (e) => {
  if (e.key === 'Escape') {
    emit('select-shape', null)
  }
}

// Lifecycle
onMounted(async () => {
  // Only render on client-side
  isClient.value = true
  
  // Wait for next tick to ensure DOM is ready
  await nextTick()
  
  console.log('CanvasKonva mounted, isClient:', isClient.value)
  console.log('Props received:', { 
    stageConfig: props.stageConfig, 
    rectangles: props.rectangles.length, 
    circles: props.circles.length, 
    texts: props.texts.length 
  })
  
  // Import Konva dynamically
  try {
    const KonvaModule = await import('konva')
    console.log('KonvaModule:', KonvaModule)
    console.log('KonvaModule.default:', KonvaModule.default)
    console.log('KonvaModule.Stage:', KonvaModule.Stage)
    
    Konva = KonvaModule.default || KonvaModule
    console.log('Konva loaded:', Konva)
    console.log('Konva.Stage:', Konva.Stage)
  } catch (error) {
    console.error('Failed to load Konva:', error)
    return
  }
  
  // Create Konva stage
  stage = new Konva.Stage({
    container: konvaContainer.value,
    width: props.stageConfig.width,
    height: props.stageConfig.height,
    draggable: false // We'll handle dragging manually for better control
  })
  
  // Create layer
  layer = new Konva.Layer()
  stage.add(layer)
  
  // Add shapes
  addShapesToLayer()
  
  // Add event listeners
  stage.on('mousedown', handleStageMouseDown)
  stage.on('mousemove', handleStageMouseMove)
  stage.on('mouseup', handleStageMouseUp)
  
  // Add pan functionality
  stage.on('wheel', handleWheel)
  
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  if (stage) {
    stage.destroy()
  }
  window.removeEventListener('keydown', handleKeyDown)
})

// Function to add shapes to the layer
const addShapesToLayer = () => {
  if (!layer || !Konva) return
  
  // Clear existing shapes
  layer.destroyChildren()
  
  // Add rectangles
  props.rectangles.forEach(rect => {
    const konvaRect = new Konva.Rect({
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      fill: rect.fill,
      stroke: rect.stroke,
      strokeWidth: rect.strokeWidth,
      draggable: rect.draggable
    })
    
    konvaRect.on('mousedown', () => selectShape(rect.id))
    konvaRect.on('dragend', (e) => updateShape(rect.id, e))
    
    layer.add(konvaRect)
  })
  
  // Add circles
  props.circles.forEach(circle => {
    const konvaCircle = new Konva.Circle({
      x: circle.x,
      y: circle.y,
      radius: circle.radius,
      fill: circle.fill,
      stroke: circle.stroke,
      strokeWidth: circle.strokeWidth,
      draggable: circle.draggable
    })
    
    konvaCircle.on('mousedown', () => selectShape(circle.id))
    konvaCircle.on('dragend', (e) => updateShape(circle.id, e))
    
    layer.add(konvaCircle)
  })
  
  // Add texts
  props.texts.forEach(text => {
    const konvaText = new Konva.Text({
      x: text.x,
      y: text.y,
      text: text.text,
      fontSize: text.fontSize,
      fill: text.fill,
      draggable: text.draggable
    })
    
    konvaText.on('mousedown', () => selectShape(text.id))
    konvaText.on('dragend', (e) => updateShape(text.id, e))
    
    layer.add(konvaText)
  })
  
  // Redraw layer
  layer.draw()
}

// Watch for prop changes and update shapes
watch(() => [props.rectangles, props.circles, props.texts], () => {
  addShapesToLayer()
}, { deep: true })

// Watch for stage config changes
watch(() => props.stageConfig, (newConfig) => {
  if (stage && newConfig) {
    stage.scale({ x: newConfig.scaleX, y: newConfig.scaleY })
    stage.position({ x: newConfig.x, y: newConfig.y })
    stage.batchDraw()
  }
}, { deep: true })

// Expose methods to parent
defineExpose({
  resetView: () => {
    if (stage) {
      stage.scale({ x: 1, y: 1 })
      stage.position({ x: 0, y: 0 })
      stage.batchDraw()
    }
  }
})
</script>

<style scoped>
/* Canvas container styling */
.konva-container {
  cursor: grab;
}

.konva-container:active {
  cursor: grabbing;
}
</style>
