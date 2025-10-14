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
let transformer = null
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
    // Clear selection when clicking on empty space
    transformer.nodes([])
    emit('select-shape', null)
  }
  emit('stage-mousedown', e)
}

const handleStageMouseMove = (e) => {
  emit('stage-mousemove', e)
}

const handleStageMouseUp = (e) => {
  stage.draggable(false)
  
  // Apply bounds checking when dragging ends
  if (stage) {
    const currentPos = stage.position()
    const clampedPos = clampPosition(currentPos)
    stage.position(clampedPos)
    stage.batchDraw()
  }
  
  emit('stage-mouseup', e)
}

// Canvas bounds configuration
const canvasBounds = {
  minX: -2000,  // Minimum X position (left boundary)
  maxX: 2000,   // Maximum X position (right boundary)
  minY: -2000,  // Minimum Y position (top boundary)
  maxY: 2000,   // Maximum Y position (bottom boundary)
  minScale: 0.1, // Minimum zoom level
  maxScale: 5    // Maximum zoom level
}

// Function to clamp position within bounds
const clampPosition = (pos) => {
  return {
    x: Math.max(canvasBounds.minX, Math.min(canvasBounds.maxX, pos.x)),
    y: Math.max(canvasBounds.minY, Math.min(canvasBounds.maxY, pos.y))
  }
}

// Function to clamp scale within bounds
const clampScale = (scale) => {
  return Math.max(canvasBounds.minScale, Math.min(canvasBounds.maxScale, scale))
}

// Zoom functionality with bounds checking
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
  const clampedScale = clampScale(newScale)
  
  stage.scale({ x: clampedScale, y: clampedScale })
  
  const newPos = {
    x: pointer.x - mousePointTo.x * clampedScale,
    y: pointer.y - mousePointTo.y * clampedScale,
  }
  
  // Apply bounds checking to the new position
  const clampedPos = clampPosition(newPos)
  stage.position(clampedPos)
  stage.batchDraw()
}

const selectShape = (shapeId) => {
  emit('select-shape', shapeId)
  
  // Find the shape and attach transformer
  if (shapeId && transformer) {
    const allShapes = [...props.rectangles, ...props.circles, ...props.texts]
    const shape = allShapes.find(s => s.id === shapeId)
    
    if (shape) {
      // Find the corresponding Konva shape
      const konvaShape = layer.findOne(`#${shapeId}`)
      if (konvaShape) {
        transformer.nodes([konvaShape])
        transformer.getLayer()?.batchDraw()
      }
    }
  } else if (transformer) {
    transformer.nodes([])
    transformer.getLayer()?.batchDraw()
  }
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
  
  // Create Konva stage with performance optimizations
  stage = new Konva.Stage({
    container: konvaContainer.value,
    width: props.stageConfig.width,
    height: props.stageConfig.height,
    draggable: false, // We'll handle dragging manually for better control
    listening: true,
    imageSmoothingEnabled: true
  })
  
  // Create layer with performance optimizations
  layer = new Konva.Layer({
    listening: true,
    imageSmoothingEnabled: true
  })
  stage.add(layer)
  
  // Create transformer for selection
  transformer = new Konva.Transformer({
    rotateEnabled: true, // Enable rotation
    enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
    borderStroke: '#2563eb',
    borderStrokeWidth: 2,
    anchorStroke: '#2563eb',
    anchorFill: '#ffffff',
    anchorSize: 8,
    borderDash: [5, 5],
    keepRatio: false, // Allow free resizing
    centeredScaling: false, // Scale from corners, not center
    rotationSnaps: [0, 45, 90, 135, 180, 225, 270, 315] // Snap to common angles
  })
  
  // Add resize event handlers
  transformer.on('transformend', (e) => {
    const shape = e.target
    const shapeId = shape.id()
    
    // Update shape data based on type
    if (shape.getClassName() === 'Rect') {
      const newWidth = shape.width() * shape.scaleX()
      const newHeight = shape.height() * shape.scaleY()
      
      const updates = {
        x: shape.x(),
        y: shape.y(),
        width: newWidth,
        height: newHeight,
        rotation: shape.rotation()
      }
      console.log('Transformend - updating shape:', shapeId, 'with:', updates)
      updateShape(shapeId, updates)
      
      // Update the shape's base dimensions and reset scale
      shape.width(newWidth)
      shape.height(newHeight)
      shape.scaleX(1)
      shape.scaleY(1)
    } else if (shape.getClassName() === 'Circle') {
      // For circles, we need to calculate the new radius
      const newRadius = Math.min(shape.width() * shape.scaleX(), shape.height() * shape.scaleY()) / 2
      
      updateShape(shapeId, {
        x: shape.x(),
        y: shape.y(),
        radius: newRadius,
        rotation: shape.rotation()
      })
      
      // Update the shape's base radius and reset scale
      shape.radius(newRadius)
      shape.scaleX(1)
      shape.scaleY(1)
    } else if (shape.getClassName() === 'Text') {
      const newFontSize = shape.fontSize() * shape.scaleX()
      
      updateShape(shapeId, {
        x: shape.x(),
        y: shape.y(),
        fontSize: newFontSize,
        rotation: shape.rotation()
      })
      
      // Update the shape's base font size and reset scale
      shape.fontSize(newFontSize)
      shape.scaleX(1)
      shape.scaleY(1)
    }
  })
  
  layer.add(transformer)
  
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
  
  // Clear existing shapes but keep transformer
  const shapes = layer.getChildren().filter(node => node !== transformer)
  shapes.forEach(shape => shape.destroy())
  
  // Add rectangles
  props.rectangles.forEach(rect => {
    const konvaRect = new Konva.Rect({
      id: rect.id,
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      fill: rect.fill,
      stroke: rect.stroke,
      strokeWidth: rect.strokeWidth,
      draggable: rect.draggable,
      rotation: rect.rotation || 0,
      shadowColor: 'black',
      shadowBlur: 10,
      shadowOpacity: 0.2,
      shadowOffset: { x: 2, y: 2 },
      listening: true,
      imageSmoothingEnabled: true,
      // Improve drag sensitivity
      dragBoundFunc: (pos) => {
        // Allow dragging within canvas bounds
        return {
          x: Math.max(0, Math.min(pos.x, stage.width() - rect.width)),
          y: Math.max(0, Math.min(pos.y, stage.height() - rect.height))
        }
      }
    })
    
    // Set drag threshold to 0 for immediate drag response
    konvaRect.dragDistance(0)
    
    // Add hover effects
    konvaRect.on('mouseenter', () => {
      document.body.style.cursor = 'pointer'
      konvaRect.shadowOpacity(0.4)
      layer.draw()
    })
    
    konvaRect.on('mouseleave', () => {
      document.body.style.cursor = 'default'
      konvaRect.shadowOpacity(0.2)
      layer.draw()
    })
    
    konvaRect.on('mousedown', (e) => {
      // Prevent event bubbling to stage
      e.cancelBubble = true
      selectShape(rect.id)
      // Bring to front when selected
      konvaRect.moveToTop()
      // Add visual selection indicator
      konvaRect.strokeWidth(rect.strokeWidth + 2)
      konvaRect.stroke('#2563eb')
      layer.draw()
    })
    
    konvaRect.on('dragstart', () => {
      konvaRect.shadowOpacity(0.6)
      layer.draw()
    })
    
    konvaRect.on('dragend', (e) => {
      const updates = {
        x: e.target.x(),
        y: e.target.y()
      }
      console.log('Dragend - updating rectangle:', rect.id, 'with:', updates)
      updateShape(rect.id, updates)
      konvaRect.shadowOpacity(0.2)
      layer.draw()
    })
    
    layer.add(konvaRect)
  })
  
  // Add circles
  props.circles.forEach(circle => {
    const konvaCircle = new Konva.Circle({
      id: circle.id,
      x: circle.x,
      y: circle.y,
      radius: circle.radius,
      fill: circle.fill,
      stroke: circle.stroke,
      strokeWidth: circle.strokeWidth,
      draggable: circle.draggable,
      rotation: circle.rotation || 0,
      shadowColor: 'black',
      shadowBlur: 10,
      shadowOpacity: 0.2,
      shadowOffset: { x: 2, y: 2 },
      // Improve drag sensitivity
      dragBoundFunc: (pos) => {
        // Allow dragging within canvas bounds
        return {
          x: Math.max(circle.radius, Math.min(pos.x, stage.width() - circle.radius)),
          y: Math.max(circle.radius, Math.min(pos.y, stage.height() - circle.radius))
        }
      }
    })
    
    // Set drag threshold to 0 for immediate drag response
    konvaCircle.dragDistance(0)
    
    // Add hover effects
    konvaCircle.on('mouseenter', () => {
      document.body.style.cursor = 'pointer'
      konvaCircle.shadowOpacity(0.4)
      layer.draw()
    })
    
    konvaCircle.on('mouseleave', () => {
      document.body.style.cursor = 'default'
      konvaCircle.shadowOpacity(0.2)
      layer.draw()
    })
    
    konvaCircle.on('mousedown', (e) => {
      // Prevent event bubbling to stage
      e.cancelBubble = true
      selectShape(circle.id)
      // Bring to front when selected
      konvaCircle.moveToTop()
      // Add visual selection indicator
      konvaCircle.strokeWidth(circle.strokeWidth + 2)
      konvaCircle.stroke('#2563eb')
      layer.draw()
    })
    
    konvaCircle.on('dragstart', () => {
      konvaCircle.shadowOpacity(0.6)
      layer.draw()
    })
    
    konvaCircle.on('dragend', (e) => {
      updateShape(circle.id, {
        x: e.target.x(),
        y: e.target.y()
      })
      konvaCircle.shadowOpacity(0.2)
      layer.draw()
    })
    
    layer.add(konvaCircle)
  })
  
  // Add texts
  props.texts.forEach(text => {
    const konvaText = new Konva.Text({
      id: text.id,
      x: text.x,
      y: text.y,
      text: text.text,
      fontSize: text.fontSize,
      fill: text.fill,
      draggable: text.draggable,
      rotation: text.rotation || 0,
      shadowColor: 'black',
      shadowBlur: 10,
      shadowOpacity: 0.2,
      shadowOffset: { x: 2, y: 2 },
      // Improve drag sensitivity
      dragBoundFunc: (pos) => {
        // Allow dragging within canvas bounds
        return {
          x: Math.max(0, Math.min(pos.x, stage.width())),
          y: Math.max(0, Math.min(pos.y, stage.height()))
        }
      }
    })
    
    // Set drag threshold to 0 for immediate drag response
    konvaText.dragDistance(0)
    
    // Add hover effects
    konvaText.on('mouseenter', () => {
      document.body.style.cursor = 'pointer'
      konvaText.shadowOpacity(0.4)
      layer.draw()
    })
    
    konvaText.on('mouseleave', () => {
      document.body.style.cursor = 'default'
      konvaText.shadowOpacity(0.2)
      layer.draw()
    })
    
    konvaText.on('mousedown', (e) => {
      // Prevent event bubbling to stage
      e.cancelBubble = true
      selectShape(text.id)
      // Bring to front when selected
      konvaText.moveToTop()
      // Add visual selection indicator
      konvaText.strokeWidth(text.strokeWidth + 2)
      konvaText.stroke('#2563eb')
      layer.draw()
    })
    
    konvaText.on('dragstart', () => {
      konvaText.shadowOpacity(0.6)
      layer.draw()
    })
    
    konvaText.on('dragend', (e) => {
      updateShape(text.id, {
        x: e.target.x(),
        y: e.target.y()
      })
      konvaText.shadowOpacity(0.2)
      layer.draw()
    })
    
    layer.add(konvaText)
  })
  
  // Redraw layer
  layer.draw()
}

// Function to update existing shapes without recreation
const updateExistingShapes = () => {
  if (!layer || !Konva) return
  
  // Update rectangles
  props.rectangles.forEach(rect => {
    const konvaRect = layer.findOne(`#${rect.id}`)
    if (konvaRect) {
      // Only update position if the shape is not currently being dragged
      if (!konvaRect.isDragging()) {
        konvaRect.x(rect.x)
        konvaRect.y(rect.y)
      }
      konvaRect.width(rect.width)
      konvaRect.height(rect.height)
      konvaRect.fill(rect.fill)
      konvaRect.stroke(rect.stroke)
      konvaRect.strokeWidth(rect.strokeWidth)
      konvaRect.rotation(rect.rotation || 0)
    }
  })
  
  // Update circles
  props.circles.forEach(circle => {
    const konvaCircle = layer.findOne(`#${circle.id}`)
    if (konvaCircle) {
      // Only update position if the shape is not currently being dragged
      if (!konvaCircle.isDragging()) {
        konvaCircle.x(circle.x)
        konvaCircle.y(circle.y)
      }
      konvaCircle.radius(circle.radius)
      konvaCircle.fill(circle.fill)
      konvaCircle.stroke(circle.stroke)
      konvaCircle.strokeWidth(circle.strokeWidth)
      konvaCircle.rotation(circle.rotation || 0)
    }
  })
  
  // Update texts
  props.texts.forEach(text => {
    const konvaText = layer.findOne(`#${text.id}`)
    if (konvaText) {
      // Only update position if the shape is not currently being dragged
      if (!konvaText.isDragging()) {
        konvaText.x(text.x)
        konvaText.y(text.y)
      }
      konvaText.text(text.text)
      konvaText.fontSize(text.fontSize)
      konvaText.fill(text.fill)
      konvaText.stroke(text.stroke)
      konvaText.strokeWidth(text.strokeWidth)
      konvaText.rotation(text.rotation || 0)
    }
  })
  
  // Redraw layer
  layer.draw()
}

// Watch for prop changes and update shapes
watch(() => [props.rectangles, props.circles, props.texts], (newProps, oldProps) => {
  // Only recreate shapes if the arrays have actually changed (not just individual properties)
  const hasNewShapes = newProps[0].length !== oldProps?.[0]?.length || 
                      newProps[1].length !== oldProps?.[1]?.length || 
                      newProps[2].length !== oldProps?.[2]?.length
  
  console.log('Shape arrays changed:', {
    rectangles: { old: oldProps?.[0]?.length, new: newProps[0].length },
    circles: { old: oldProps?.[1]?.length, new: newProps[1].length },
    texts: { old: oldProps?.[2]?.length, new: newProps[2].length },
    hasNewShapes
  })
  
  if (hasNewShapes) {
    console.log('Recreating shapes due to array length change')
    addShapesToLayer()
  } else if (oldProps && (oldProps[0]?.length > 0 || oldProps[1]?.length > 0 || oldProps[2]?.length > 0)) {
    // Only update existing shapes if we had shapes before (not on initial load)
    console.log('Updating existing shapes without recreation')
    updateExistingShapes()
  }
}, { deep: true, immediate: true })

// Individual length watchers removed to prevent duplicate updates

// Watch for stage config changes
watch(() => props.stageConfig, (newConfig) => {
  if (stage && newConfig) {
    // Apply bounds checking to scale and position
    const clampedScale = clampScale(newConfig.scaleX)
    const clampedPos = clampPosition({ x: newConfig.x, y: newConfig.y })
    
    stage.scale({ x: clampedScale, y: clampedScale })
    stage.position(clampedPos)
    stage.batchDraw()
  }
}, { deep: true })

// Expose methods to parent
defineExpose({
  resetView: () => {
    if (stage) {
      const clampedScale = clampScale(1)
      const clampedPos = clampPosition({ x: 0, y: 0 })
      
      stage.scale({ x: clampedScale, y: clampedScale })
      stage.position(clampedPos)
      stage.batchDraw()
    }
  },
  getBounds: () => canvasBounds,
  forceRefresh: () => {
    console.log('Force refreshing canvas...')
    addShapesToLayer()
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
