// AI Helper utilities for emoji command generation

export interface CanvasPosition {
  x: number
  y: number
}

export interface EmojiItem {
  emoji: string
  count: number
  size: number
  position?: CanvasPosition
}

export interface MultipleItemsResult {
  items: EmojiItem[]
  arrangement?: string
  position?: CanvasPosition
}

// Canvas dimensions (800x600)
const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 600

// Position mappings for 800x600 canvas
const POSITION_MAP: Record<string, CanvasPosition> = {
  'upper-left': { x: 100, y: 100 },
  'upper right': { x: 600, y: 100 },
  'upper-right': { x: 600, y: 100 },
  'lower-left': { x: 100, y: 450 },
  'lower left': { x: 100, y: 450 },
  'lower-right': { x: 600, y: 450 },
  'lower right': { x: 600, y: 450 },
  'center': { x: 400, y: 300 },
  'top-center': { x: 400, y: 100 },
  'top center': { x: 400, y: 100 },
  'bottom-center': { x: 400, y: 500 },
  'bottom center': { x: 400, y: 500 },
  'left': { x: 100, y: 300 },
  'right': { x: 600, y: 300 },
  'top': { x: 400, y: 100 },
  'bottom': { x: 400, y: 500 },
  // Row-based positioning
  'top-row': { x: 400, y: 100 },
  'top row': { x: 400, y: 100 },
  'middle-row': { x: 400, y: 300 },
  'middle row': { x: 400, y: 300 },
  'bottom-row': { x: 400, y: 500 },
  'bottom row': { x: 400, y: 500 },
  // Edge positioning
  'left-edge': { x: 50, y: 300 },
  'left edge': { x: 50, y: 300 },
  'right-edge': { x: 750, y: 300 },
  'right edge': { x: 750, y: 300 }
}

// Size mappings
const SIZE_MAP: Record<string, number> = {
  'tiny': 20,
  'small': 30,
  'medium': 50,
  'big': 80,
  'large': 80,
  'huge': 100,
  'giant': 100
}

// Word to number mapping (1-100)
const WORD_TO_NUMBER: Record<string, number> = {
  'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
  'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
  'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
  'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20,
  'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70,
  'eighty': 80, 'ninety': 90, 'hundred': 100
}

// Extended emoji type detection
const EMOJI_MAP: Record<string, string> = {
  'pumpkin': '🎃', 'pumpkins': '🎃',
  'heart': '❤️', 'hearts': '❤️',
  'star': '⭐', 'stars': '⭐',
  'pig': '🐷', 'pigs': '🐷',
  'cat': '🐱', 'cats': '🐱',
  'dog': '🐶', 'dogs': '🐶',
  'frog': '🐸', 'frogs': '🐸',
  'flower': '🌸', 'flowers': '🌸',
  'smile': '😊', 'smiles': '😊',
  'fire': '🔥', 'fires': '🔥',
  'ball': '⚽', 'balls': '⚽',
  'ghost': '👻', 'ghosts': '👻',
  'moon': '🌙', 'moons': '🌙',
  'sun': '☀️', 'suns': '☀️',
  'tree': '🌳', 'trees': '🌳',
  'house': '🏠', 'houses': '🏠',
  'car': '🚗', 'cars': '🚗',
  'plane': '✈️', 'planes': '✈️',
  'rocket': '🚀', 'rockets': '🚀',
  'fish': '🐟', 'fishes': '🐟',
  'bird': '🐦', 'birds': '🐦',
  'butterfly': '🦋', 'butterflies': '🦋',
  'dragon': '🐉', 'dragons': '🐉',
  'unicorn': '🦄', 'unicorns': '🦄',
  'rainbow': '🌈', 'rainbows': '🌈',
  'clown': '🤡', 'clowns': '🤡',
  'robot': '🤖', 'robots': '🤖',
  'alien': '👽', 'aliens': '👽',
  'skull': '💀', 'skulls': '💀',
  'crown': '👑', 'crowns': '👑',
  'gem': '💎', 'gems': '💎',
  'diamond': '💎', 'diamonds': '💎'
}

/**
 * Convert word-based numbers to integers (1-100)
 */
export function wordToNumber(text: string): number | null {
  const lowerText = text.toLowerCase().trim()
  
  // Direct mapping
  if (WORD_TO_NUMBER[lowerText]) {
    return WORD_TO_NUMBER[lowerText]
  }
  
  // Handle compound numbers like "twenty-five"
  const compoundMatch = lowerText.match(/^(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)-?(one|two|three|four|five|six|seven|eight|nine)$/)
  if (compoundMatch && compoundMatch[1] && compoundMatch[2]) {
    const tens = WORD_TO_NUMBER[compoundMatch[1]]
    const ones = WORD_TO_NUMBER[compoundMatch[2]]
    if (tens !== undefined && ones !== undefined) {
      return tens + ones
    }
  }
  
  // Handle "X hundred" format
  const hundredMatch = lowerText.match(/^(one|two|three|four|five|six|seven|eight|nine)\s*hundred$/)
  if (hundredMatch && hundredMatch[1]) {
    const value = WORD_TO_NUMBER[hundredMatch[1]]
    if (value !== undefined) {
      return value * 100
    }
  }
  
  return null
}

/**
 * Parse size keywords to numeric values
 */
export function parseSize(text: string): number {
  const lowerText = text.toLowerCase().trim()
  
  // Direct mapping
  if (SIZE_MAP[lowerText]) {
    return SIZE_MAP[lowerText]
  }
  
  // Default to medium size
  return 50
}

/**
 * Parse canvas position keywords to coordinates
 */
export function parseCanvasPosition(text: string): CanvasPosition | null {
  const lowerText = text.toLowerCase().trim()
  
  // Direct mapping
  if (POSITION_MAP[lowerText]) {
    return POSITION_MAP[lowerText]
  }
  
  // Handle variations with "corner"
  if (lowerText.includes('upper') && lowerText.includes('left')) {
    return POSITION_MAP['upper-left'] || null
  }
  if (lowerText.includes('upper') && lowerText.includes('right')) {
    return POSITION_MAP['upper-right'] || null
  }
  if (lowerText.includes('lower') && lowerText.includes('left')) {
    return POSITION_MAP['lower-left'] || null
  }
  if (lowerText.includes('lower') && lowerText.includes('right')) {
    return POSITION_MAP['lower-right'] || null
  }
  
  return null
}

/**
 * Detect emoji type from text
 */
export function detectEmojiType(text: string): string {
  const lowerText = text.toLowerCase().trim()
  
  // Direct mapping
  if (EMOJI_MAP[lowerText]) {
    return EMOJI_MAP[lowerText]
  }
  
  // Check for partial matches
  for (const [keyword, emoji] of Object.entries(EMOJI_MAP)) {
    if (lowerText.includes(keyword)) {
      return emoji
    }
  }
  
  // Default to pumpkin
  return '🎃'
}

/**
 * Parse multiple items from text like "one big pumpkin and two small hearts"
 */
export function parseMultipleItems(text: string): MultipleItemsResult | null {
  const lowerText = text.toLowerCase().trim()
  
  // Check if text contains "and" indicating multiple items
  if (!lowerText.includes(' and ')) {
    return null
  }
  
  const items: EmojiItem[] = []
  const parts = lowerText.split(' and ')
  
  for (const part of parts) {
    const trimmedPart = part.trim()
    
    // Extract count (word or number)
    let count = 1
    const countMatch = trimmedPart.match(/^(one|two|three|four|five|six|seven|eight|nine|ten|\d+)/)
    if (countMatch && countMatch[1]) {
      const countStr = countMatch[1]
      if (/\d+/.test(countStr)) {
        count = parseInt(countStr)
      } else {
        const wordCount = wordToNumber(countStr)
        if (wordCount !== null) {
          count = wordCount
        }
      }
    }
    
    // Extract size
    let size = 50 // default medium
    if (trimmedPart.includes('tiny')) size = 20
    else if (trimmedPart.includes('small')) size = 30
    else if (trimmedPart.includes('medium')) size = 50
    else if (trimmedPart.includes('big') || trimmedPart.includes('large')) size = 80
    else if (trimmedPart.includes('huge') || trimmedPart.includes('giant')) size = 100
    
    // Extract emoji type
    const emoji = detectEmojiType(trimmedPart)
    
    items.push({
      emoji,
      count,
      size
    })
  }
  
  if (items.length === 0) {
    return null
  }
  
  // Extract arrangement and position
  let arrangement = 'row' // default
  let position: CanvasPosition | undefined
  
  if (lowerText.includes('in a circle') || lowerText.includes('around')) {
    arrangement = 'circle'
  } else if (lowerText.includes('in a triangle') || lowerText.includes('triangle')) {
    arrangement = 'triangle'
  } else if (lowerText.includes('in a square') || lowerText.includes('square')) {
    arrangement = 'square'
  } else if (lowerText.includes('in a row') || lowerText.includes('row')) {
    arrangement = 'row'
  }
  
  // Check for position keywords
  const positionKeywords = ['upper', 'lower', 'left', 'right', 'center', 'top', 'bottom']
  for (const keyword of positionKeywords) {
    if (lowerText.includes(keyword)) {
      const detectedPosition = parseCanvasPosition(lowerText)
      if (detectedPosition) {
        position = detectedPosition
        break
      }
    }
  }
  
  return {
    items,
    arrangement,
    position
  }
}

/**
 * Extract count from text (handles both words and numbers)
 */
export function extractCount(text: string): number {
  const lowerText = text.toLowerCase().trim()
  
  // Try word-to-number first
  const wordCount = wordToNumber(lowerText)
  if (wordCount !== null) {
    return wordCount
  }
  
  // Try numeric match
  const numberMatch = lowerText.match(/\d+/)
  if (numberMatch) {
    return parseInt(numberMatch[0])
  }
  
  return 1 // default
}

/**
 * Extract size from text
 */
export function extractSize(text: string): number {
  const lowerText = text.toLowerCase().trim()
  return parseSize(lowerText)
}

/**
 * Extract position from text
 */
export function extractPosition(text: string): CanvasPosition | null {
  const lowerText = text.toLowerCase().trim()
  return parseCanvasPosition(lowerText)
}

/**
 * Extract emoji type from text
 */
export function extractEmojiType(text: string): string {
  return detectEmojiType(text)
}

/**
 * Parse direction words to x/y deltas
 */
export function parseDirection(text: string): { deltaX: number; deltaY: number } {
  const lowerText = text.toLowerCase().trim()
  
  // Direction mappings
  const directions: Record<string, { deltaX: number; deltaY: number }> = {
    'right': { deltaX: 1, deltaY: 0 },
    'left': { deltaX: -1, deltaY: 0 },
    'up': { deltaX: 0, deltaY: -1 },
    'down': { deltaX: 0, deltaY: 1 },
    'up-right': { deltaX: 1, deltaY: -1 },
    'up-left': { deltaX: -1, deltaY: -1 },
    'down-right': { deltaX: 1, deltaY: 1 },
    'down-left': { deltaX: -1, deltaY: 1 }
  }
  
  // Check for exact matches first
  if (directions[lowerText]) {
    return directions[lowerText]
  }
  
  // Check for partial matches
  for (const [direction, deltas] of Object.entries(directions)) {
    if (lowerText.includes(direction)) {
      return deltas
    }
  }
  
  // Default to no movement
  return { deltaX: 0, deltaY: 0 }
}

/**
 * Parse emoji from natural language text
 */
export function parseEmojiFromText(text: string): string | null {
  const lowerText = text.toLowerCase().trim()
  
  // Direct emoji mapping
  if (EMOJI_MAP[lowerText]) {
    return EMOJI_MAP[lowerText]
  }
  
  // Check for partial matches
  for (const [keyword, emoji] of Object.entries(EMOJI_MAP)) {
    if (lowerText.includes(keyword)) {
      return emoji
    }
  }
  
  return null
}

/**
 * Parse movement command to extract emoji type, direction, and amount
 */
export function parseMovementCommand(text: string): {
  emojiType: string | null;
  direction: { deltaX: number; deltaY: number };
  amount: number;
  moveAll: boolean;
} {
  const lowerText = text.toLowerCase().trim()
  
  // Extract amount (pixels)
  const amountMatch = lowerText.match(/(\d+)\s*(?:px|pixels?)?/)
  const amount = amountMatch ? parseInt(amountMatch[1]!) : 50
  
  // Check if it's a "move everything" command
  const moveAll = lowerText.includes('everything') || lowerText.includes('all emojis') || lowerText.includes('all shapes')
  
  // Extract emoji type if not moving everything
  let emojiType: string | null = null
  if (!moveAll) {
    emojiType = parseEmojiFromText(lowerText)
  }
  
  // Extract direction
  const direction = parseDirection(lowerText)
  
  return {
    emojiType,
    direction,
    amount,
    moveAll
  }
}

/**
 * Parse rotation command to extract emoji type and degrees
 */
export function parseRotationCommand(text: string): {
  emojiType: string | null;
  degrees: number;
} {
  const lowerText = text.toLowerCase().trim()
  
  // Extract degrees
  const degreesMatch = lowerText.match(/(\d+)\s*(?:degrees?|°)?/)
  const degrees = degreesMatch ? parseInt(degreesMatch[1]!) : 45
  
  // Extract emoji type
  const emojiType = parseEmojiFromText(lowerText)
  
  return {
    emojiType,
    degrees
  }
}

/**
 * Generate positions for a row of emojis
 */
export function generateRowPositions(
  count: number, 
  row: 'top' | 'middle' | 'bottom' = 'middle',
  startX?: number,
  spacing: number = 60
): CanvasPosition[] {
  const positions: CanvasPosition[] = []
  
  // Determine Y position based on row
  let y: number
  switch (row) {
    case 'top':
      y = 100
      break
    case 'bottom':
      y = 500
      break
    case 'middle':
    default:
      y = 300
      break
  }
  
  // Calculate starting X position
  const x = startX ?? (CANVAS_WIDTH - (count - 1) * spacing) / 2
  
  // Generate positions
  for (let i = 0; i < count; i++) {
    positions.push({
      x: Math.round(x + i * spacing),
      y: Math.round(y)
    })
  }
  
  return positions
}

/**
 * Generate positions for a column of emojis
 */
export function generateColumnPositions(
  count: number,
  column: 'left' | 'center' | 'right' = 'center',
  startY?: number,
  spacing: number = 60
): CanvasPosition[] {
  const positions: CanvasPosition[] = []
  
  // Determine X position based on column
  let x: number
  switch (column) {
    case 'left':
      x = 100
      break
    case 'right':
      x = 700
      break
    case 'center':
    default:
      x = 400
      break
  }
  
  // Calculate starting Y position
  const y = startY ?? (CANVAS_HEIGHT - (count - 1) * spacing) / 2
  
  // Generate positions
  for (let i = 0; i < count; i++) {
    positions.push({
      x: Math.round(x),
      y: Math.round(y + i * spacing)
    })
  }
  
  return positions
}

/**
 * Generate border positions around canvas
 */
export function generateBorderPositions(
  emoji: string,
  spacing: number = 50
): Array<{ emoji: string; x: number; y: number; size: number; layer: number }> {
  const positions: Array<{ emoji: string; x: number; y: number; size: number; layer: number }> = []
  
  // Top border
  for (let x = 50; x <= 750; x += spacing) {
    positions.push({ emoji, x, y: 50, size: 40, layer: 1 })
  }
  
  // Bottom border
  for (let x = 50; x <= 750; x += spacing) {
    positions.push({ emoji, x, y: 550, size: 40, layer: 1 })
  }
  
  // Left border
  for (let y = 100; y <= 500; y += spacing) {
    positions.push({ emoji, x: 50, y, size: 40, layer: 1 })
  }
  
  // Right border
  for (let y = 100; y <= 500; y += spacing) {
    positions.push({ emoji, x: 750, y, size: 40, layer: 1 })
  }
  
  return positions
}

/**
 * Generate alternating pattern positions
 */
export function generateAlternatingPattern(
  emojis: string[],
  count: number,
  arrangement: 'row' | 'column' = 'row',
  position?: CanvasPosition
): Array<{ emoji: string; x: number; y: number; size: number; layer: number }> {
  const result: Array<{ emoji: string; x: number; y: number; size: number; layer: number }> = []
  
  if (emojis.length === 0) return result
  
  const basePosition = position ?? { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 }
  const spacing = 60
  
  for (let i = 0; i < count; i++) {
    const emoji = emojis[i % emojis.length] || '😊'
    let x: number, y: number
    
    if (arrangement === 'row') {
      x = basePosition.x - (count - 1) * spacing / 2 + i * spacing
      y = basePosition.y
    } else {
      x = basePosition.x
      y = basePosition.y - (count - 1) * spacing / 2 + i * spacing
    }
    
    result.push({
      emoji,
      x: Math.round(x),
      y: Math.round(y),
      size: 40,
      layer: 1
    })
  }
  
  return result
}

/**
 * Generate trail positions between two points
 */
export function generateTrail(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  trailEmoji: string,
  density: number = 0.3
): Array<{ emoji: string; x: number; y: number; size: number; layer: number }> {
  const positions: Array<{ emoji: string; x: number; y: number; size: number; layer: number }> = []
  
  const distance = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2)
  const steps = Math.max(1, Math.floor(distance * density))
  
  for (let i = 1; i < steps; i++) {
    const t = i / steps
    const x = startX + (endX - startX) * t
    const y = startY + (endY - startY) * t
    
    positions.push({
      emoji: trailEmoji,
      x: Math.round(x),
      y: Math.round(y),
      size: 20,
      layer: 2
    })
  }
  
  return positions
}
