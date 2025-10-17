/**
 * Shared utility functions for shape management
 * Centralizes common logic to avoid duplication across composables
 */

export const generateId = (type: string): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export const getRandomColor = (): string => {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8']
  return colors[Math.floor(Math.random() * colors.length)]!
}

export const getRandomPosition = (maxX: number, maxY: number) => ({
  x: Math.random() * maxX,
  y: Math.random() * maxY
})

export const CANVAS_ID = '550e8400-e29b-41d4-a716-446655440000'

export const DEFAULT_SHAPE_PROPS = {
  stroke: '#000',
  strokeWidth: 2,
  draggable: true,
  rotation: 0
} as const

export const CANVAS_BOUNDS = {
  minX: -2000,
  maxX: 2000,
  minY: -2000,
  maxY: 2000,
  minScale: 0.1,
  maxScale: 5
} as const
