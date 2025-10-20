// Shape pattern generators for emoji-based ASCII art drawing
// Supports both geometric shapes (algorithmic) and AI-generated patterns

export interface EmojiPosition {
  emoji: string
  x: number
  y: number
  size: number
  layer: number
  rotation: number
}

export interface ShapeOptions {
  emoji: string
  size?: number
  position?: { x: number; y: number }
  fillStyle?: 'filled' | 'outline'
  scale?: number
}

// Default canvas center
const DEFAULT_CENTER = { x: 400, y: 300 }
const DEFAULT_EMOJI_SIZE = 30
const DEFAULT_SPACING = 35

/**
 * Generate a filled triangle pattern
 */
export function generateTrianglePattern(options: ShapeOptions): EmojiPosition[] {
  const { emoji, size = 5, position = DEFAULT_CENTER, scale = 1 } = options
  const positions: EmojiPosition[] = []
  const spacing = DEFAULT_SPACING * scale
  const emojiSize = DEFAULT_EMOJI_SIZE * scale
  
  for (let row = 0; row < size; row++) {
    const emojisInRow = row + 1
    const startX = position.x - (emojisInRow - 1) * spacing / 2
    
    for (let col = 0; col < emojisInRow; col++) {
      positions.push({
        emoji,
        x: Math.round(startX + col * spacing),
        y: Math.round(position.y + row * spacing),
        size: emojiSize,
        layer: 1,
        rotation: 0
      })
    }
  }
  
  return positions
}

/**
 * Generate a triangle outline pattern
 */
export function generateTriangleOutlinePattern(options: ShapeOptions): EmojiPosition[] {
  const { emoji, size = 5, position = DEFAULT_CENTER, scale = 1 } = options
  const positions: EmojiPosition[] = []
  const spacing = DEFAULT_SPACING * scale
  const emojiSize = DEFAULT_EMOJI_SIZE * scale
  
  // Bottom row (all emojis)
  for (let col = 0; col < size; col++) {
    positions.push({
      emoji,
      x: Math.round(position.x - (size - 1) * spacing / 2 + col * spacing),
      y: Math.round(position.y + (size - 1) * spacing),
      size: emojiSize,
      layer: 1,
      rotation: 0
    })
  }
  
  // Left and right edges
  for (let row = 0; row < size - 1; row++) {
    const emojisInRow = row + 1
    const startX = position.x - (emojisInRow - 1) * spacing / 2
    
    // Left edge
    positions.push({
      emoji,
      x: Math.round(startX),
      y: Math.round(position.y + row * spacing),
      size: emojiSize,
      layer: 1,
      rotation: 0
    })
    
    // Right edge
    positions.push({
      emoji,
      x: Math.round(startX + (emojisInRow - 1) * spacing),
      y: Math.round(position.y + row * spacing),
      size: emojiSize,
      layer: 1,
      rotation: 0
    })
  }
  
  return positions
}

/**
 * Generate a filled square pattern
 */
export function generateSquarePattern(options: ShapeOptions): EmojiPosition[] {
  const { emoji, size = 5, position = DEFAULT_CENTER, scale = 1 } = options
  const positions: EmojiPosition[] = []
  const spacing = DEFAULT_SPACING * scale
  const emojiSize = DEFAULT_EMOJI_SIZE * scale
  
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      positions.push({
        emoji,
        x: Math.round(position.x - (size - 1) * spacing / 2 + col * spacing),
        y: Math.round(position.y - (size - 1) * spacing / 2 + row * spacing),
        size: emojiSize,
        layer: 1,
        rotation: 0
      })
    }
  }
  
  return positions
}

/**
 * Generate a square outline pattern
 */
export function generateSquareOutlinePattern(options: ShapeOptions): EmojiPosition[] {
  const { emoji, size = 5, position = DEFAULT_CENTER, scale = 1 } = options
  const positions: EmojiPosition[] = []
  const spacing = DEFAULT_SPACING * scale
  const emojiSize = DEFAULT_EMOJI_SIZE * scale
  
  // Top and bottom rows
  for (let col = 0; col < size; col++) {
    const x = position.x - (size - 1) * spacing / 2 + col * spacing
    
    // Top row
    positions.push({
      emoji,
      x: Math.round(x),
      y: Math.round(position.y - (size - 1) * spacing / 2),
      size: emojiSize,
      layer: 1,
      rotation: 0
    })
    
    // Bottom row
    positions.push({
      emoji,
      x: Math.round(x),
      y: Math.round(position.y + (size - 1) * spacing / 2),
      size: emojiSize,
      layer: 1,
      rotation: 0
    })
  }
  
  // Left and right columns (excluding corners already added)
  for (let row = 1; row < size - 1; row++) {
    const y = position.y - (size - 1) * spacing / 2 + row * spacing
    
    // Left column
    positions.push({
      emoji,
      x: Math.round(position.x - (size - 1) * spacing / 2),
      y: Math.round(y),
      size: emojiSize,
      layer: 1,
      rotation: 0
    })
    
    // Right column
    positions.push({
      emoji,
      x: Math.round(position.x + (size - 1) * spacing / 2),
      y: Math.round(y),
      size: emojiSize,
      layer: 1,
      rotation: 0
    })
  }
  
  return positions
}

/**
 * Generate a filled circle pattern (approximate)
 */
export function generateCirclePattern(options: ShapeOptions): EmojiPosition[] {
  const { emoji, size = 5, position = DEFAULT_CENTER, scale = 1 } = options
  const positions: EmojiPosition[] = []
  const spacing = DEFAULT_SPACING * scale
  const emojiSize = DEFAULT_EMOJI_SIZE * scale
  const radius = (size - 1) * spacing / 2
  
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const x = position.x - (size - 1) * spacing / 2 + col * spacing
      const y = position.y - (size - 1) * spacing / 2 + row * spacing
      
      // Check if point is inside circle
      const distance = Math.sqrt(
        Math.pow(x - position.x, 2) + Math.pow(y - position.y, 2)
      )
      
      if (distance <= radius) {
        positions.push({
          emoji,
          x: Math.round(x),
          y: Math.round(y),
          size: emojiSize,
          layer: 1,
          rotation: 0
        })
      }
    }
  }
  
  return positions
}

/**
 * Generate a circle outline pattern (approximate)
 */
export function generateCircleOutlinePattern(options: ShapeOptions): EmojiPosition[] {
  const { emoji, size = 5, position = DEFAULT_CENTER, scale = 1 } = options
  const positions: EmojiPosition[] = []
  const spacing = DEFAULT_SPACING * scale
  const emojiSize = DEFAULT_EMOJI_SIZE * scale
  const radius = (size - 1) * spacing / 2
  const tolerance = spacing * 0.3 // Allow some tolerance for outline
  
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const x = position.x - (size - 1) * spacing / 2 + col * spacing
      const y = position.y - (size - 1) * spacing / 2 + row * spacing
      
      // Check if point is on circle outline
      const distance = Math.sqrt(
        Math.pow(x - position.x, 2) + Math.pow(y - position.y, 2)
      )
      
      if (Math.abs(distance - radius) <= tolerance) {
        positions.push({
          emoji,
          x: Math.round(x),
          y: Math.round(y),
          size: emojiSize,
          layer: 1,
          rotation: 0
        })
      }
    }
  }
  
  return positions
}

/**
 * Generate a diamond pattern
 */
export function generateDiamondPattern(options: ShapeOptions): EmojiPosition[] {
  const { emoji, size = 5, position = DEFAULT_CENTER, scale = 1 } = options
  const positions: EmojiPosition[] = []
  const spacing = DEFAULT_SPACING * scale
  const emojiSize = DEFAULT_EMOJI_SIZE * scale
  
  // Top half
  for (let row = 0; row < size; row++) {
    const emojisInRow = row + 1
    const startX = position.x - (emojisInRow - 1) * spacing / 2
    
    for (let col = 0; col < emojisInRow; col++) {
      positions.push({
        emoji,
        x: Math.round(startX + col * spacing),
        y: Math.round(position.y - (size - 1) * spacing / 2 + row * spacing),
        size: emojiSize,
        layer: 1,
        rotation: 0
      })
    }
  }
  
  // Bottom half
  for (let row = 1; row < size; row++) {
    const emojisInRow = size - row
    const startX = position.x - (emojisInRow - 1) * spacing / 2
    
    for (let col = 0; col < emojisInRow; col++) {
      positions.push({
        emoji,
        x: Math.round(startX + col * spacing),
        y: Math.round(position.y - (size - 1) * spacing / 2 + (size - 1 + row) * spacing),
        size: emojiSize,
        layer: 1,
        rotation: 0
      })
    }
  }
  
  return positions
}

/**
 * Convert ASCII art string array to emoji positions
 */
export function convertAsciiToEmojiPositions(
  asciiLines: string[],
  emoji: string,
  position: { x: number; y: number },
  scale: number = 1
): EmojiPosition[] {
  const positions: EmojiPosition[] = []
  const spacing = DEFAULT_SPACING * scale
  const emojiSize = DEFAULT_EMOJI_SIZE * scale
  
  asciiLines.forEach((line, rowIndex) => {
    for (let colIndex = 0; colIndex < line.length; colIndex++) {
      const char = line[colIndex]
      if (char && char.trim() !== '') {
        positions.push({
          emoji,
          x: Math.round(position.x + colIndex * spacing),
          y: Math.round(position.y + rowIndex * spacing),
          size: emojiSize,
          layer: 1,
          rotation: 0
        })
      }
    }
  })
  
  return positions
}

/**
 * Main function to generate shape patterns
 */
export function generateShapePattern(
  shape: string,
  options: ShapeOptions
): EmojiPosition[] {
  const { fillStyle = 'filled' } = options
  
  switch (shape.toLowerCase()) {
    case 'triangle':
      return fillStyle === 'filled' 
        ? generateTrianglePattern(options)
        : generateTriangleOutlinePattern(options)
    
    case 'square':
    case 'rectangle':
      return fillStyle === 'filled'
        ? generateSquarePattern(options)
        : generateSquareOutlinePattern(options)
    
    case 'circle':
      return fillStyle === 'filled'
        ? generateCirclePattern(options)
        : generateCircleOutlinePattern(options)
    
    case 'diamond':
      return generateDiamondPattern(options)
    
    default:
      // For unknown shapes, return empty array
      // AI will handle these through pattern generation
      return []
  }
}
