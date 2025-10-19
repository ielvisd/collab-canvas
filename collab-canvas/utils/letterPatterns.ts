// Letter patterns for emoji-based text rendering
// Each letter is defined as an array of relative coordinates [x, y]
// where (0,0) is the top-left corner of the letter

export interface LetterPattern {
  width: number
  height: number
  points: Array<[number, number]>
}

// Letter patterns (3x5 grid for compact horizontal text)
export const LETTER_PATTERNS: Record<string, LetterPattern> = {
  'A': {
    width: 3,
    height: 5,
    points: [
      [1, 0], [0, 1], [2, 1], [0, 2], [1, 2], [2, 2], [0, 3], [2, 3], [0, 4], [2, 4]
    ]
  },
  'B': {
    width: 3,
    height: 5,
    points: [
      [0, 0], [1, 0], [0, 1], [2, 1], [0, 2], [1, 2], [0, 3], [2, 3], [0, 4], [1, 4]
    ]
  },
  'C': {
    width: 3,
    height: 5,
    points: [
      [1, 0], [2, 0], [0, 1], [0, 2], [0, 3], [1, 4], [2, 4]
    ]
  },
  'D': {
    width: 3,
    height: 5,
    points: [
      [0, 0], [1, 0], [0, 1], [2, 1], [0, 2], [2, 2], [0, 3], [2, 3], [0, 4], [1, 4]
    ]
  },
  'E': {
    width: 3,
    height: 5,
    points: [
      [0, 0], [1, 0], [2, 0], [0, 1], [0, 2], [1, 2], [0, 3], [0, 4], [1, 4], [2, 4]
    ]
  },
  'F': {
    width: 3,
    height: 5,
    points: [
      [0, 0], [1, 0], [2, 0], [0, 1], [0, 2], [1, 2], [0, 3], [0, 4]
    ]
  },
  'G': {
    width: 3,
    height: 5,
    points: [
      [1, 0], [2, 0], [0, 1], [0, 2], [1, 2], [2, 2], [0, 3], [2, 3], [1, 4], [2, 4]
    ]
  },
  'H': {
    width: 3,
    height: 5,
    points: [
      [0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [1, 2], [2, 2], [0, 3], [2, 3], [0, 4], [2, 4]
    ]
  },
  'I': {
    width: 3,
    height: 5,
    points: [
      [0, 0], [1, 0], [2, 0], [1, 1], [1, 2], [1, 3], [0, 4], [1, 4], [2, 4]
    ]
  },
  'J': {
    width: 3,
    height: 5,
    points: [
      [0, 0], [1, 0], [2, 0], [1, 1], [1, 2], [0, 3], [1, 4]
    ]
  },
  'K': {
    width: 3,
    height: 5,
    points: [
      [0, 0], [2, 0], [0, 1], [1, 1], [0, 2], [1, 2], [0, 3], [1, 3], [0, 4], [2, 4]
    ]
  },
  'L': {
    width: 3,
    height: 5,
    points: [
      [0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [1, 4], [2, 4]
    ]
  },
  'M': {
    width: 3,
    height: 5,
    points: [
      [0, 0], [2, 0], [0, 1], [1, 1], [2, 1], [0, 2], [2, 2], [0, 3], [2, 3], [0, 4], [2, 4]
    ]
  },
  'N': {
    width: 3,
    height: 5,
    points: [
      [0, 0], [2, 0], [0, 1], [1, 1], [2, 1], [0, 2], [1, 2], [2, 2], [0, 3], [2, 3], [0, 4], [2, 4]
    ]
  },
  'O': {
    width: 3,
    height: 5,
    points: [
      [1, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2], [0, 3], [2, 3], [1, 4], [2, 4]
    ]
  },
  'P': {
    width: 3,
    height: 5,
    points: [
      [0, 0], [1, 0], [0, 1], [2, 1], [0, 2], [1, 2], [0, 3], [0, 4]
    ]
  },
  'Q': {
    width: 3,
    height: 5,
    points: [
      [1, 0], [2, 0], [0, 1], [2, 1], [0, 2], [1, 2], [2, 2], [0, 3], [2, 3], [1, 4], [2, 4]
    ]
  },
  'R': {
    width: 3,
    height: 5,
    points: [
      [0, 0], [1, 0], [0, 1], [2, 1], [0, 2], [1, 2], [0, 3], [1, 3], [0, 4], [2, 4]
    ]
  },
  'S': {
    width: 3,
    height: 5,
    points: [
      [1, 0], [2, 0], [0, 1], [1, 2], [2, 3], [0, 4], [1, 4]
    ]
  },
  'T': {
    width: 3,
    height: 5,
    points: [
      [0, 0], [1, 0], [2, 0], [1, 1], [1, 2], [1, 3], [1, 4]
    ]
  },
  'U': {
    width: 3,
    height: 5,
    points: [
      [0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2], [0, 3], [2, 3], [1, 4], [2, 4]
    ]
  },
  'V': {
    width: 3,
    height: 5,
    points: [
      [0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2], [1, 3], [1, 4]
    ]
  },
  'W': {
    width: 3,
    height: 5,
    points: [
      [0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [1, 2], [2, 2], [0, 3], [1, 3], [2, 3], [0, 4], [2, 4]
    ]
  },
  'X': {
    width: 3,
    height: 5,
    points: [
      [0, 0], [2, 0], [1, 1], [1, 2], [1, 3], [0, 4], [2, 4]
    ]
  },
  'Y': {
    width: 3,
    height: 5,
    points: [
      [0, 0], [2, 0], [1, 1], [1, 2], [1, 3], [1, 4]
    ]
  },
  'Z': {
    width: 3,
    height: 5,
    points: [
      [0, 0], [1, 0], [2, 0], [1, 1], [2, 2], [0, 3], [0, 4], [1, 4], [2, 4]
    ]
  }
}

/**
 * Generate emoji positions for a word using letter patterns
 */
export function generateWordPositions(
  word: string,
  emoji: string,
  startX: number = 200,
  startY: number = 200,
  letterSpacing: number = 40,
  emojiSpacing: number = 15
): Array<{ emoji: string; x: number; y: number; size: number; layer: number; rotation: number }> {
  const result: Array<{ emoji: string; x: number; y: number; size: number; layer: number; rotation: number }> = []
  
  let currentX = startX
  
  for (let i = 0; i < word.length; i++) {
    const letter = word[i]?.toUpperCase() || 'A'
    const pattern = LETTER_PATTERNS[letter]
    
    if (pattern) {
      // Generate positions for this letter
      for (const [relX, relY] of pattern.points) {
        result.push({
          emoji,
          x: currentX + relX * emojiSpacing,
          y: startY + relY * emojiSpacing,
          size: 20,
          layer: 1,
          rotation: 0
        })
      }
      
      // Move to next letter position
      currentX += pattern.width * emojiSpacing + letterSpacing
    } else {
      // Unknown letter, just place a single emoji
      result.push({
        emoji,
        x: currentX,
        y: startY,
        size: 40,
        layer: 1,
        rotation: 0
      })
      currentX += letterSpacing
    }
  }
  
  return result
}

/**
 * Generate vertical word positions
 */
export function generateVerticalWordPositions(
  word: string,
  emoji: string,
  startX: number = 200,
  startY: number = 200,
  letterSpacing: number = 60,
  emojiSpacing: number = 20
): Array<{ emoji: string; x: number; y: number; size: number; layer: number; rotation: number }> {
  const result: Array<{ emoji: string; x: number; y: number; size: number; layer: number; rotation: number }> = []
  
  let currentY = startY
  
  for (let i = 0; i < word.length; i++) {
    const letter = word[i]?.toUpperCase() || 'A'
    const pattern = LETTER_PATTERNS[letter]
    
    if (pattern) {
      // Generate positions for this letter (rotated 90 degrees)
      for (const [relX, relY] of pattern.points) {
        result.push({
          emoji,
          x: startX + relY * emojiSpacing, // Swap X and Y for vertical
          y: currentY + relX * emojiSpacing,
          size: 20,
          layer: 1,
          rotation: 0
        })
      }
      
      // Move to next letter position
      currentY += pattern.height * emojiSpacing + letterSpacing
    } else {
      // Unknown letter, just place a single emoji
      result.push({
        emoji,
        x: startX,
        y: currentY,
        size: 40,
        layer: 1,
        rotation: 0
      })
      currentY += letterSpacing
    }
  }
  
  return result
}
