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
  'bottom': { x: 400, y: 500 }
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
