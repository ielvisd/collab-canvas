import type { Ref } from 'vue'

export interface Shape {
  id: string
  x: number
  y: number
  fill: string
  stroke: string
  strokeWidth: number
  draggable: boolean
  rotation?: number
}

export interface Rectangle extends Shape {
  type: 'rectangle'
  width: number
  height: number
}

export interface Circle extends Shape {
  type: 'circle'
  radius: number
}

export interface Text extends Shape {
  type: 'text'
  text: string
  fontSize: number
}

export interface Line extends Shape {
  type: 'line'
  points: number[]
}

export interface Star extends Shape {
  type: 'star'
  outerRadius: number
  innerRadius: number
  numPoints: number
}

export type ShapeType = Rectangle | Circle | Text | Line | Star

export interface ShapeState {
  rectangles: Ref<Rectangle[]>
  circles: Ref<Circle[]>
  texts: Ref<Text[]>
  lines: Ref<Line[]>
  stars: Ref<Star[]>
  selectedShapeId: Ref<string | null>
  totalShapes: Ref<number>
}

export interface ShapeActions {
  addRectangle: (options?: Partial<Omit<Rectangle, 'id' | 'type'>>) => Rectangle
  addCircle: (options?: Partial<Omit<Circle, 'id' | 'type'>>) => Circle
  addText: (options?: Partial<Omit<Text, 'id' | 'type'>>) => Text
  addLine: (options?: Partial<Omit<Line, 'id' | 'type'>>) => Line
  addStar: (options?: Partial<Omit<Star, 'id' | 'type'>>) => Star
  selectShape: (shapeId: string | null) => void
  updateShape: (shapeId: string, updates: Partial<Shape>) => void
  deleteShape: (shapeId: string) => boolean
  deleteSelectedShape: () => boolean
  clearAllShapes: () => void
  getShapeById: (shapeId: string) => ShapeType | null
  getShapeByType: (type: 'rectangle' | 'circle' | 'text' | 'line' | 'star', shapeId: string) => ShapeType | null
}

export const useShapes = (canvasWidth: number = 800, canvasHeight: number = 600) => {
  // State
  const rectangles = ref<Rectangle[]>([])
  const circles = ref<Circle[]>([])
  const texts = ref<Text[]>([])
  const lines = ref<Line[]>([])
  const stars = ref<Star[]>([])
  const selectedShapeId = ref<string | null>(null)

  // Computed
  const totalShapes = computed(() => 
    rectangles.value.length + circles.value.length + texts.value.length + lines.value.length + stars.value.length
  )

  // Utility functions
  const generateId = (type: string) => {
    // Generate a proper UUID v4
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }
  
  const getRandomColor = () => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8']
    return colors[Math.floor(Math.random() * colors.length)]
  }

  const getRandomPosition = (maxX: number, maxY: number) => ({
    x: Math.random() * maxX,
    y: Math.random() * maxY
  })

  // Shape creation methods
  const addRectangle = (options: Partial<Omit<Rectangle, 'id' | 'type'>> = {}): Rectangle => {
    const position = getRandomPosition(canvasWidth - 100, canvasHeight - 100)
    
    const rectangle: Rectangle = {
      id: generateId('rect'),
      type: 'rectangle',
      x: options.x ?? position.x,
      y: options.y ?? position.y,
      width: options.width ?? 100,
      height: options.height ?? 60,
      fill: (options.fill ?? getRandomColor()) as string,
      stroke: options.stroke ?? '#000',
      strokeWidth: options.strokeWidth ?? 2,
      draggable: options.draggable ?? true,
      rotation: options.rotation ?? 0
    }
    
    rectangles.value.push(rectangle)
    return rectangle
  }

  const addCircle = (options: Partial<Omit<Circle, 'id' | 'type'>> = {}): Circle => {
    const position = getRandomPosition(canvasWidth - 100, canvasHeight - 100)
    
    const circle: Circle = {
      id: generateId('circle'),
      type: 'circle',
      x: options.x ?? position.x,
      y: options.y ?? position.y,
      radius: options.radius ?? 50,
      fill: (options.fill ?? getRandomColor()) as string,
      stroke: (options.stroke ?? '#000') as string,
      strokeWidth: (options.strokeWidth ?? 2) as number,
      draggable: options.draggable ?? true,
      rotation: options.rotation ?? 0
    }
    
    circles.value.push(circle)
    return circle
  }

  const addText = (options: Partial<Omit<Text, 'id' | 'type'>> = {}): Text => {
    const position = getRandomPosition(canvasWidth - 100, canvasHeight - 50)
    
    const text: Text = {
      id: generateId('text'),
      type: 'text',
      x: options.x ?? position.x,
      y: options.y ?? position.y,
      text: options.text ?? 'hola! 👋',
      fontSize: options.fontSize ?? 24,
      fill: (options.fill ?? getRandomColor()) as string,
      stroke: (options.stroke ?? '#000') as string,
      strokeWidth: (options.strokeWidth ?? 2) as number,
      draggable: options.draggable ?? true,
      rotation: options.rotation ?? 0
    }
    
    texts.value.push(text)
    return text
  }

  const addLine = (options: Partial<Omit<Line, 'id' | 'type'>> = {}): Line => {
    const position = getRandomPosition(canvasWidth - 100, canvasHeight - 100)
    
    const line: Line = {
      id: generateId('line'),
      type: 'line',
      x: options.x ?? position.x,
      y: options.y ?? position.y,
      points: options.points ?? [0, 0, 100, 0], // Simple horizontal line
      fill: (options.fill ?? getRandomColor()) as string,
      stroke: (options.stroke ?? '#000') as string,
      strokeWidth: (options.strokeWidth ?? 2) as number,
      draggable: options.draggable ?? true,
      rotation: options.rotation ?? 0
    }
    
    lines.value.push(line)
    return line
  }

  const addStar = (options: Partial<Omit<Star, 'id' | 'type'>> = {}): Star => {
    const position = getRandomPosition(canvasWidth - 100, canvasHeight - 100)
    
    const star: Star = {
      id: generateId('star'),
      type: 'star',
      x: options.x ?? position.x,
      y: options.y ?? position.y,
      outerRadius: options.outerRadius ?? 50,
      innerRadius: options.innerRadius ?? 25,
      numPoints: options.numPoints ?? 5,
      fill: (options.fill ?? getRandomColor()) as string,
      stroke: (options.stroke ?? '#000') as string,
      strokeWidth: (options.strokeWidth ?? 2) as number,
      draggable: options.draggable ?? true,
      rotation: options.rotation ?? 0
    }
    
    stars.value.push(star)
    return star
  }

  // Shape management methods
  const selectShape = (shapeId: string | null) => {
    selectedShapeId.value = shapeId
  }

  const updateShape = (shapeId: string, updates: Partial<Shape>) => {
    // Update rectangle
    const rectIndex = rectangles.value.findIndex(r => r.id === shapeId)
    if (rectIndex !== -1) {
      rectangles.value[rectIndex] = { ...rectangles.value[rectIndex], ...updates } as Rectangle
      return
    }

    // Update circle
    const circleIndex = circles.value.findIndex(c => c.id === shapeId)
    if (circleIndex !== -1) {
      circles.value[circleIndex] = { ...circles.value[circleIndex], ...updates } as Circle
      return
    }

    // Update text
    const textIndex = texts.value.findIndex(t => t.id === shapeId)
    if (textIndex !== -1) {
      texts.value[textIndex] = { ...texts.value[textIndex], ...updates } as Text
      return
    }
  }

  const deleteShape = (shapeId: string): boolean => {
    // Try to delete from rectangles
    const rectIndex = rectangles.value.findIndex(r => r.id === shapeId)
    if (rectIndex !== -1) {
      rectangles.value.splice(rectIndex, 1)
      if (selectedShapeId.value === shapeId) {
        selectedShapeId.value = null
      }
      return true
    }

    // Try to delete from circles
    const circleIndex = circles.value.findIndex(c => c.id === shapeId)
    if (circleIndex !== -1) {
      circles.value.splice(circleIndex, 1)
      if (selectedShapeId.value === shapeId) {
        selectedShapeId.value = null
      }
      return true
    }

    // Try to delete from texts
    const textIndex = texts.value.findIndex(t => t.id === shapeId)
    if (textIndex !== -1) {
      texts.value.splice(textIndex, 1)
      if (selectedShapeId.value === shapeId) {
        selectedShapeId.value = null
      }
      return true
    }

    // Try to delete from lines
    const lineIndex = lines.value.findIndex(l => l.id === shapeId)
    if (lineIndex !== -1) {
      lines.value.splice(lineIndex, 1)
      if (selectedShapeId.value === shapeId) {
        selectedShapeId.value = null
      }
      return true
    }

    // Try to delete from stars
    const starIndex = stars.value.findIndex(s => s.id === shapeId)
    if (starIndex !== -1) {
      stars.value.splice(starIndex, 1)
      if (selectedShapeId.value === shapeId) {
        selectedShapeId.value = null
      }
      return true
    }

    return false
  }

  const deleteSelectedShape = (): boolean => {
    if (!selectedShapeId.value) return false
    return deleteShape(selectedShapeId.value)
  }

  const clearAllShapes = () => {
    rectangles.value = []
    circles.value = []
    texts.value = []
    lines.value = []
    stars.value = []
    selectedShapeId.value = null
  }

  const getShapeById = (shapeId: string): ShapeType | null => {
    const allShapes = [...rectangles.value, ...circles.value, ...texts.value, ...lines.value, ...stars.value]
    return allShapes.find(shape => shape.id === shapeId) || null
  }

  const getShapeByType = (type: 'rectangle' | 'circle' | 'text' | 'line' | 'star', shapeId: string): ShapeType | null => {
    switch (type) {
      case 'rectangle':
        return rectangles.value.find(r => r.id === shapeId) || null
      case 'circle':
        return circles.value.find(c => c.id === shapeId) || null
      case 'text':
        return texts.value.find(t => t.id === shapeId) || null
      case 'line':
        return lines.value.find(l => l.id === shapeId) || null
      case 'star':
        return stars.value.find(s => s.id === shapeId) || null
      default:
        return null
    }
  }

  // Return state and actions
  const state: ShapeState = {
    rectangles,
    circles,
    texts,
    lines,
    stars,
    selectedShapeId,
    totalShapes
  }

  const actions: ShapeActions = {
    addRectangle,
    addCircle,
    addText,
    addLine,
    addStar,
    selectShape,
    updateShape,
    deleteShape,
    deleteSelectedShape,
    clearAllShapes,
    getShapeById,
    getShapeByType
  }

  return {
    ...state,
    ...actions
  }
}
