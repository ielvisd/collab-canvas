<template>
  <div v-if="isClient" class="relative">
    <div ref="konvaContainer" class="w-full h-full konva-container"/>
    
    <!-- Text editing overlay -->
    <div
      v-if="editingText"
      ref="textInputOverlay"
      class="absolute pointer-events-auto"
      :style="textInputStyle"
    >
      <input
        ref="textInput"
        v-model="editingTextValue"
        type="text"
        class="bg-transparent border-none outline-none text-black font-sans"
        :style="textInputFontStyle"
        @blur="finishTextEditing"
        @keydown.enter="finishTextEditing"
        @keydown.escape="cancelTextEditing"
      >
    </div>
  </div>
  <div v-else class="flex items-center justify-center h-full bg-gray-100 rounded">
    <div class="text-gray-500">Loading canvas...</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch, computed } from 'vue'

// Client-side only rendering
const isClient = ref(false)
const konvaContainer = ref<HTMLElement | null>(null)
const textInputOverlay = ref<HTMLElement | null>(null)
const textInput = ref<HTMLInputElement | null>(null)
let stage: any = null
let layer: any = null
let transformer: any = null
let Konva: any = null

// Text editing state
const editingText = ref<any>(null)
const editingTextValue = ref<string>('')
const editingTextStyle = ref<any>({})

// Computed properties for text input styling
const textInputStyle = computed(() => {
  if (!editingText.value) return {}
  
  const stagePos = stage.position()
  const stageScale = stage.scaleX()
  
  return {
    left: `${editingTextStyle.value.x * stageScale + stagePos.x}px`,
    top: `${editingTextStyle.value.y * stageScale + stagePos.y}px`,
    transform: `rotate(${editingTextStyle.value.rotation || 0}deg)`,
    transformOrigin: '0 0'
  }
})

const textInputFontStyle = computed(() => {
  if (!editingText.value) return {}
  
  return {
    fontSize: `${editingTextStyle.value.fontSize}px`,
    color: editingTextStyle.value.fill || '#000000',
    fontFamily: 'Arial, sans-serif'
  }
})

// Props
const props = defineProps<{
  stageConfig: any
  rectangles: any[]
  circles: any[]
  texts: any[]
  lines?: any[]
  stars?: any[]
}>()

// Emits
const emit = defineEmits([
  'stage-mousedown',
  'stage-mousemove', 
  'stage-mouseup',
  'select-shape',
  'update-shape'
])

// Stage interaction handlers
const handleStageMouseDown = (e: any) => {
  // Only pan if clicking on empty space (not on shapes)
  if (e.target === stage) {
    stage.draggable(true)
    // Clear selection when clicking on empty space
    transformer.nodes([])
    emit('select-shape', null)
  }
  emit('stage-mousedown', e)
}

const handleStageMouseMove = (e: any) => {
  emit('stage-mousemove', e)
}

const handleStageMouseUp = (e: any) => {
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
const clampPosition = (pos: any) => {
  return {
    x: Math.max(canvasBounds.minX, Math.min(canvasBounds.maxX, pos.x)),
    y: Math.max(canvasBounds.minY, Math.min(canvasBounds.maxY, pos.y))
  }
}

// Function to clamp scale within bounds
const clampScale = (scale: number) => {
  return Math.max(canvasBounds.minScale, Math.min(canvasBounds.maxScale, scale))
}

// Zoom functionality with bounds checking
const handleWheel = (e: any) => {
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

// Touch zoom functionality for mobile
let lastTouchDistance = 0
const handleTouchMove = (e: any) => {
  e.evt.preventDefault()
  
  if (e.evt.touches.length === 2) {
    // Two finger pinch
    const touch1 = e.evt.touches[0]
    const touch2 = e.evt.touches[1]
    
    const distance = Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    )
    
    if (lastTouchDistance > 0) {
      const scaleBy = distance / lastTouchDistance
      const oldScale = stage.scaleX()
      const newScale = oldScale * scaleBy
      const clampedScale = clampScale(newScale)
      
      // Get center point between touches
      const centerX = (touch1.clientX + touch2.clientX) / 2
      const centerY = (touch1.clientY + touch2.clientY) / 2
      
      const pointer = { x: centerX, y: centerY }
      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      }
      
      stage.scale({ x: clampedScale, y: clampedScale })
      
      const newPos = {
        x: pointer.x - mousePointTo.x * clampedScale,
        y: pointer.y - mousePointTo.y * clampedScale,
      }
      
      const clampedPos = clampPosition(newPos)
      stage.position(clampedPos)
      stage.batchDraw()
    }
    
    lastTouchDistance = distance
  } else {
    lastTouchDistance = 0
  }
}

const handleTouchStart = (e: any) => {
  lastTouchDistance = 0
  handleStageMouseDown(e)
}

const handleTouchEnd = (e: any) => {
  lastTouchDistance = 0
  handleStageMouseUp(e)
}

const selectShape = (shapeId: string) => {
  emit('select-shape', shapeId)
  
  // Find the shape and attach transformer
  if (shapeId && transformer && layer) {
    const allShapes = [...props.rectangles, ...props.circles, ...props.texts, ...(props.lines || []), ...(props.stars || [])]
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

const updateShape = (shapeId: string, event: any) => {
  emit('update-shape', shapeId, event)
}

// Text editing methods
const startTextEditing = (textShape: any) => {
  editingText.value = textShape
  editingTextValue.value = textShape.text
  editingTextStyle.value = {
    x: textShape.x,
    y: textShape.y,
    fontSize: textShape.fontSize,
    fill: textShape.fill,
    rotation: textShape.rotation || 0
  }
  
  // Hide the Konva text while editing
  const konvaText = layer.findOne(`#${textShape.id}`)
  if (konvaText) {
    konvaText.visible(false)
    layer.draw()
  }
  
  // Focus the input after next tick
  nextTick(() => {
    if (textInput.value) {
      textInput.value.focus()
      textInput.value.select()
    }
  })
}

const finishTextEditing = () => {
  if (!editingText.value) return
  
  // Update the text content
  updateShape(editingText.value.id, {
    text: editingTextValue.value
  })
  
  // Show the Konva text again
  const konvaText = layer.findOne(`#${editingText.value.id}`)
  if (konvaText) {
    konvaText.visible(true)
    layer.draw()
  }
  
  // Clear editing state
  editingText.value = null
  editingTextValue.value = ''
  editingTextStyle.value = {}
}

const cancelTextEditing = () => {
  if (!editingText.value) return
  
  // Show the Konva text again without changes
  const konvaText = layer.findOne(`#${editingText.value.id}`)
  if (konvaText) {
    konvaText.visible(true)
    layer.draw()
  }
  
  // Clear editing state
  editingText.value = null
  editingTextValue.value = ''
  editingTextStyle.value = {}
}

// Keyboard shortcuts
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    if (editingText.value) {
      cancelTextEditing()
    } else {
      emit('select-shape', null)
    }
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
    console.log('KonvaModule.Stage:', (KonvaModule as any).Stage)
    
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
  transformer.on('transformend', (e: any) => {
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
    } else if (shape.getClassName() === 'Line' && !shape.closed()) {
      // This is a line (open line)
      const scaleX = shape.scaleX()
      const scaleY = shape.scaleY()
      const newPoints = shape.points().map((point: number, index: number) => {
        return index % 2 === 0 ? point * scaleX : point * scaleY
      })
      
      updateShape(shapeId, {
        x: shape.x(),
        y: shape.y(),
        points: newPoints,
        rotation: shape.rotation()
      })
      
      // Update the shape's base points and reset scale
      shape.points(newPoints)
      shape.scaleX(1)
      shape.scaleY(1)
    } else if (shape.getClassName() === 'Line' && shape.closed()) {
      // This is a star (closed line)
      const scaleX = shape.scaleX()
      const scaleY = shape.scaleY()
      const scale = Math.min(scaleX, scaleY) // Use uniform scaling for stars
      
      // Find the star data to update radius
      const star = props.stars?.find((s: any) => s.id === shapeId)
      if (star) {
        const newOuterRadius = star.outerRadius * scale
        const newInnerRadius = star.innerRadius * scale
        
        updateShape(shapeId, {
          x: shape.x(),
          y: shape.y(),
          outerRadius: newOuterRadius,
          innerRadius: newInnerRadius,
          rotation: shape.rotation()
        })
        
        // Update the shape's base scale
        shape.scaleX(1)
        shape.scaleY(1)
      }
    }
  })
  
  layer.add(transformer)
  
  // Add shapes
  addShapesToLayer()
  
  // Add event listeners
  stage.on('mousedown', handleStageMouseDown)
  stage.on('mousemove', handleStageMouseMove)
  stage.on('mouseup', handleStageMouseUp)
  
  // Add touch event listeners for mobile
  stage.on('touchstart', handleTouchStart)
  stage.on('touchmove', handleTouchMove)
  stage.on('touchend', handleTouchEnd)
  
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

// Helper function to convert color names to hex
const colorToHex = (color: string): string => {
  const colorMap: { [key: string]: string } = {
    'red': '#ff0000',
    'blue': '#0000ff',
    'green': '#00ff00',
    'yellow': '#ffff00',
    'orange': '#ffa500',
    'purple': '#800080',
    'pink': '#ffc0cb',
    'brown': '#a52a2a',
    'black': '#000000',
    'white': '#ffffff',
    'gray': '#808080',
    'grey': '#808080'
  }
  return colorMap[color.toLowerCase()] || color
}

// Function to add shapes to the layer
const addShapesToLayer = () => {
  if (!layer || !Konva) return
  
  // Clear existing shapes but keep transformer
  const shapes = layer.getChildren().filter((node: any) => node !== transformer)
  shapes.forEach((shape: any) => shape.destroy())
  
  // Clear transformer nodes to prevent errors
  if (transformer) {
    transformer.nodes([])
  }
  
  // Add rectangles
  props.rectangles.forEach((rect: any) => {
    const konvaRect = new Konva.Rect({
      id: rect.id,
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      fill: colorToHex(rect.fill),
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
      dragBoundFunc: (pos: any) => {
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
      if (layer) layer.draw()
    })
    
    konvaRect.on('mouseleave', () => {
      document.body.style.cursor = 'default'
      konvaRect.shadowOpacity(0.2)
      if (layer) layer.draw()
    })
    
    konvaRect.on('mousedown', (e: any) => {
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
      if (layer) layer.draw()
    })
    
    konvaRect.on('dragend', (e: any) => {
      const updates = {
        x: e.target.x(),
        y: e.target.y()
      }
      updateShape(rect.id, updates)
      konvaRect.shadowOpacity(0.2)
      if (layer) layer.draw()
    })
    
    layer.add(konvaRect)
      // Konva rectangle created and added to layer
  })
  
  // Add circles
  props.circles.forEach((circle: any) => {
    const konvaCircle = new Konva.Circle({
      id: circle.id,
      x: circle.x,
      y: circle.y,
      radius: circle.radius,
      fill: colorToHex(circle.fill),
      stroke: circle.stroke,
      strokeWidth: circle.strokeWidth,
      draggable: circle.draggable,
      rotation: circle.rotation || 0,
      shadowColor: 'black',
      shadowBlur: 10,
      shadowOpacity: 0.2,
      shadowOffset: { x: 2, y: 2 },
      // Improve drag sensitivity
      dragBoundFunc: (pos: any) => {
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
      if (layer) layer.draw()
    })
    
    konvaCircle.on('mouseleave', () => {
      document.body.style.cursor = 'default'
      konvaCircle.shadowOpacity(0.2)
      if (layer) layer.draw()
    })
    
    konvaCircle.on('mousedown', (e: any) => {
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
      if (layer) layer.draw()
    })
    
    konvaCircle.on('dragend', (e: any) => {
      updateShape(circle.id, {
        x: e.target.x(),
        y: e.target.y()
      })
      konvaCircle.shadowOpacity(0.2)
      if (layer) layer.draw()
    })
    
    layer.add(konvaCircle)
      // Konva circle created and added to layer
  })
  
  // Add texts
  props.texts.forEach((text: any) => {
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
      dragBoundFunc: (pos: any) => {
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
    
    konvaText.on('mousedown', (e: any) => {
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
    
    // Add double-click event for text editing
    konvaText.on('dblclick', (e: any) => {
      e.cancelBubble = true
      startTextEditing(text)
    })
    
    konvaText.on('dragstart', () => {
      konvaText.shadowOpacity(0.6)
      layer.draw()
    })
    
    konvaText.on('dragend', (e: any) => {
      updateShape(text.id, {
        x: e.target.x(),
        y: e.target.y()
      })
      konvaText.shadowOpacity(0.2)
      layer.draw()
    })
    
    layer.add(konvaText)
  })
  
  // Add lines
  props.lines?.forEach((line: any) => {
    const konvaLine = new Konva.Line({
      id: line.id,
      x: line.x,
      y: line.y,
      points: line.points,
      stroke: line.fill, // Use fill as stroke color for lines
      strokeWidth: line.strokeWidth,
      draggable: line.draggable,
      rotation: line.rotation || 0,
      shadowColor: 'black',
      shadowBlur: 10,
      shadowOpacity: 0.2,
      shadowOffset: { x: 2, y: 2 },
      // Improve drag sensitivity
      dragBoundFunc: (pos: any) => {
        return {
          x: Math.max(0, Math.min(pos.x, stage.width())),
          y: Math.max(0, Math.min(pos.y, stage.height()))
        }
      }
    })
    
    // Set drag threshold to 0 for immediate drag response
    konvaLine.dragDistance(0)
    
    // Add hover effects
    konvaLine.on('mouseenter', () => {
      document.body.style.cursor = 'pointer'
      konvaLine.shadowOpacity(0.4)
      layer.draw()
    })
    
    konvaLine.on('mouseleave', () => {
      document.body.style.cursor = 'default'
      konvaLine.shadowOpacity(0.2)
      layer.draw()
    })
    
    // Add click handler for selection
    konvaLine.on('click', (e: any) => {
      e.cancelBubble = true
      selectShape(line.id)
    })
    
    // Add drag handlers
    konvaLine.on('dragstart', () => {
      konvaLine.shadowOpacity(0.4)
      layer.draw()
    })
    
    konvaLine.on('dragend', (e: any) => {
      updateShape(line.id, {
        x: e.target.x(),
        y: e.target.y()
      })
      konvaLine.shadowOpacity(0.2)
      layer.draw()
    })
    
    layer.add(konvaLine)
  })
  
  // Add stars
  props.stars?.forEach((star: any) => {
    // Create star points
    const points = []
    const angle = Math.PI / star.numPoints
    for (let i = 0; i < star.numPoints * 2; i++) {
      const radius = i % 2 === 0 ? star.outerRadius : star.innerRadius
      const x = Math.cos(i * angle - Math.PI / 2) * radius
      const y = Math.sin(i * angle - Math.PI / 2) * radius
      points.push(x, y)
    }
    
    const konvaStar = new Konva.Line({
      id: star.id,
      x: star.x,
      y: star.y,
      points: points,
      fill: star.fill,
      stroke: star.stroke,
      strokeWidth: star.strokeWidth,
      closed: true,
      draggable: star.draggable,
      rotation: star.rotation || 0,
      shadowColor: 'black',
      shadowBlur: 10,
      shadowOpacity: 0.2,
      shadowOffset: { x: 2, y: 2 },
      // Improve drag sensitivity
      dragBoundFunc: (pos: any) => {
        return {
          x: Math.max(0, Math.min(pos.x, stage.width())),
          y: Math.max(0, Math.min(pos.y, stage.height()))
        }
      }
    })
    
    // Set drag threshold to 0 for immediate drag response
    konvaStar.dragDistance(0)
    
    // Add hover effects
    konvaStar.on('mouseenter', () => {
      document.body.style.cursor = 'pointer'
      konvaStar.shadowOpacity(0.4)
      layer.draw()
    })
    
    konvaStar.on('mouseleave', () => {
      document.body.style.cursor = 'default'
      konvaStar.shadowOpacity(0.2)
      layer.draw()
    })
    
    // Add click handler for selection
    konvaStar.on('click', (e: any) => {
      e.cancelBubble = true
      selectShape(star.id)
    })
    
    // Add drag handlers
    konvaStar.on('dragstart', () => {
      konvaStar.shadowOpacity(0.4)
      layer.draw()
    })
    
    konvaStar.on('dragend', (e: any) => {
      updateShape(star.id, {
        x: e.target.x(),
        y: e.target.y()
      })
      konvaStar.shadowOpacity(0.2)
      layer.draw()
    })
    
    layer.add(konvaStar)
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
    console.log('Updating rectangle:', rect.id, 'Found Konva shape:', !!konvaRect, 'New position:', { x: rect.x, y: rect.y })
    if (konvaRect) {
      // Only update position if the shape is not currently being dragged
      if (!konvaRect.isDragging()) {
        console.log('Setting rectangle position:', { x: rect.x, y: rect.y })
        console.log('Current Konva position before update:', { x: konvaRect.x(), y: konvaRect.y() })
        konvaRect.x(rect.x)
        konvaRect.y(rect.y)
        console.log('Current Konva position after update:', { x: konvaRect.x(), y: konvaRect.y() })
      } else {
        console.log('Rectangle is being dragged, skipping position update')
      }
      konvaRect.width(rect.width)
      konvaRect.height(rect.height)
      konvaRect.fill(rect.fill)
      konvaRect.stroke(rect.stroke)
      konvaRect.strokeWidth(rect.strokeWidth)
      konvaRect.rotation(rect.rotation || 0)
    } else {
      console.log('Rectangle not found in Konva layer:', rect.id)
    }
  })
  
  // Force redraw after updating all rectangles
  layer.draw()
  
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
  
  // Force redraw after updating all circles
  layer.draw()
  
  // Update texts
  props.texts.forEach((text: any) => {
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
  
  // Force redraw after updating all texts
  layer.draw()
}

// Watch for prop changes and update shapes
watch(() => [props.rectangles, props.circles, props.texts, props.lines || [], props.stars || []], (newProps, oldProps) => {
  if (!layer || !stage) return
  
  const [newRects, newCircles, newTexts, newLines, newStars] = newProps
  const [oldRects, oldCircles, oldTexts, oldLines, oldStars] = oldProps || [[], [], [], [], []]
  
  // Check if we need to recreate shapes (new shapes added or removed)
  const hasNewShapes = (newRects?.length || 0) !== (oldRects?.length || 0) || 
                       (newCircles?.length || 0) !== (oldCircles?.length || 0) || 
                       (newTexts?.length || 0) !== (oldTexts?.length || 0) ||
                       (newLines?.length || 0) !== (oldLines?.length || 0) || 
                       (newStars?.length || 0) !== (oldStars?.length || 0)
  
  if (hasNewShapes) {
    // Clear transformer first to prevent errors
    if (transformer) {
      transformer.nodes([])
    }
    
    // Clear existing shapes and recreate all
    if (layer.children) {
      layer.destroyChildren()
    }
    
    // Recreate all shapes
    addShapesToLayer()
  }
}, { deep: true })

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
    console.log('🔄 Force refreshing canvas - rectangles:', props.rectangles.length)
    if (layer && stage) {
      // Clear transformer first
      if (transformer) {
        transformer.nodes([])
      }
      
      // Clear existing shapes and recreate all
      if (layer.children) {
        layer.destroyChildren()
      }
      
      // Recreate all shapes
      addShapesToLayer()
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
