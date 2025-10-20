// Letter patterns for emoji-based text rendering
// Each letter is defined as an array of relative coordinates [x, y]
// where (0,0) is the top-left corner of the letter

export interface LetterPattern {
  width: number
  height: number
  points: Array<[number, number]>
}

// Letter patterns (5x7 grid for more detailed and readable text)
export const LETTER_PATTERNS: Record<string, LetterPattern> = {
  'A': {
    width: 5,
    height: 7,
    points: [
      [2, 0], [1, 1], [3, 1], [0, 2], [4, 2], [0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [0, 4], [4, 4], [0, 5], [4, 5], [0, 6], [4, 6]
    ]
  },
  'B': {
    width: 5,
    height: 7,
    points: [
      [0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [4, 1], [0, 2], [1, 2], [2, 2], [3, 2], [0, 3], [4, 3], [0, 4], [1, 4], [2, 4], [3, 4], [0, 5], [4, 5], [0, 6], [1, 6], [2, 6], [3, 6]
    ]
  },
  'C': {
    width: 5,
    height: 7,
    points: [
      [1, 0], [2, 0], [3, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [1, 6], [2, 6], [3, 6]
    ]
  },
  'D': {
    width: 5,
    height: 7,
    points: [
      [0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [4, 1], [0, 2], [4, 2], [0, 3], [4, 3], [0, 4], [4, 4], [0, 5], [4, 5], [0, 6], [1, 6], [2, 6], [3, 6]
    ]
  },
  'E': {
    width: 5,
    height: 7,
    points: [
      [0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [0, 1], [0, 2], [1, 2], [2, 2], [3, 2], [0, 3], [0, 4], [0, 5], [0, 6], [1, 6], [2, 6], [3, 6], [4, 6]
    ]
  },
  'F': {
    width: 5,
    height: 7,
    points: [
      [0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [0, 1], [0, 2], [1, 2], [2, 2], [3, 2], [0, 3], [0, 4], [0, 5], [0, 6]
    ]
  },
  'G': {
    width: 5,
    height: 7,
    points: [
      [1, 0], [2, 0], [3, 0], [0, 1], [0, 2], [0, 3], [2, 3], [3, 3], [4, 3], [0, 4], [4, 4], [0, 5], [4, 5], [1, 6], [2, 6], [3, 6]
    ]
  },
  'H': {
    width: 5,
    height: 7,
    points: [
      [0, 0], [4, 0], [0, 1], [4, 1], [0, 2], [4, 2], [0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [0, 4], [4, 4], [0, 5], [4, 5], [0, 6], [4, 6]
    ]
  },
  'I': {
    width: 5,
    height: 7,
    points: [
      [0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [2, 1], [2, 2], [2, 3], [2, 4], [2, 5], [0, 6], [1, 6], [2, 6], [3, 6], [4, 6]
    ]
  },
  'J': {
    width: 5,
    height: 7,
    points: [
      [0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [2, 1], [2, 2], [2, 3], [2, 4], [0, 5], [2, 5], [1, 6]
    ]
  },
  'K': {
    width: 5,
    height: 7,
    points: [
      [0, 0], [4, 0], [0, 1], [3, 1], [0, 2], [2, 2], [0, 3], [1, 3], [0, 4], [2, 4], [0, 5], [3, 5], [0, 6], [4, 6]
    ]
  },
  'L': {
    width: 5,
    height: 7,
    points: [
      [0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [1, 6], [2, 6], [3, 6], [4, 6]
    ]
  },
  'M': {
    width: 5,
    height: 7,
    points: [
      [0, 0], [4, 0], [0, 1], [1, 1], [3, 1], [4, 1], [0, 2], [2, 2], [4, 2], [0, 3], [4, 3], [0, 4], [4, 4], [0, 5], [4, 5], [0, 6], [4, 6]
    ]
  },
  'N': {
    width: 5,
    height: 7,
    points: [
      [0, 0], [4, 0], [0, 1], [1, 1], [4, 1], [0, 2], [2, 2], [4, 2], [0, 3], [3, 3], [4, 3], [0, 4], [4, 4], [0, 5], [4, 5], [0, 6], [4, 6]
    ]
  },
  'O': {
    width: 5,
    height: 7,
    points: [
      [1, 0], [2, 0], [3, 0], [0, 1], [4, 1], [0, 2], [4, 2], [0, 3], [4, 3], [0, 4], [4, 4], [0, 5], [4, 5], [1, 6], [2, 6], [3, 6]
    ]
  },
  'P': {
    width: 5,
    height: 7,
    points: [
      [0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [4, 1], [0, 2], [1, 2], [2, 2], [3, 2], [0, 3], [0, 4], [0, 5], [0, 6]
    ]
  },
  'Q': {
    width: 5,
    height: 7,
    points: [
      [1, 0], [2, 0], [3, 0], [0, 1], [4, 1], [0, 2], [4, 2], [0, 3], [4, 3], [0, 4], [2, 4], [4, 4], [0, 5], [3, 5], [4, 5], [1, 6], [2, 6], [3, 6], [4, 6]
    ]
  },
  'R': {
    width: 5,
    height: 7,
    points: [
      [0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [4, 1], [0, 2], [1, 2], [2, 2], [3, 2], [0, 3], [2, 3], [0, 4], [3, 4], [0, 5], [4, 5], [0, 6], [4, 6]
    ]
  },
  'S': {
    width: 5,
    height: 7,
    points: [
      [1, 0], [2, 0], [3, 0], [0, 1], [1, 2], [2, 2], [3, 2], [4, 3], [0, 4], [1, 4], [2, 4], [3, 4], [0, 5], [1, 6], [2, 6], [3, 6]
    ]
  },
  'T': {
    width: 5,
    height: 7,
    points: [
      [0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [2, 1], [2, 2], [2, 3], [2, 4], [2, 5], [2, 6]
    ]
  },
  'U': {
    width: 5,
    height: 7,
    points: [
      [0, 0], [4, 0], [0, 1], [4, 1], [0, 2], [4, 2], [0, 3], [4, 3], [0, 4], [4, 4], [0, 5], [4, 5], [1, 6], [2, 6], [3, 6]
    ]
  },
  'V': {
    width: 5,
    height: 7,
    points: [
      [0, 0], [4, 0], [0, 1], [4, 1], [0, 2], [4, 2], [0, 3], [4, 3], [1, 4], [3, 4], [2, 5], [2, 6]
    ]
  },
  'W': {
    width: 5,
    height: 7,
    points: [
      [0, 0], [4, 0], [0, 1], [4, 1], [0, 2], [2, 2], [4, 2], [0, 3], [1, 3], [3, 3], [4, 3], [0, 4], [4, 4], [0, 5], [4, 5], [0, 6], [4, 6]
    ]
  },
  'X': {
    width: 5,
    height: 7,
    points: [
      [0, 0], [4, 0], [1, 1], [3, 1], [2, 2], [1, 3], [3, 3], [0, 4], [4, 4], [0, 5], [4, 5], [0, 6], [4, 6]
    ]
  },
  'Y': {
    width: 5,
    height: 7,
    points: [
      [0, 0], [4, 0], [0, 1], [4, 1], [1, 2], [3, 2], [2, 3], [2, 4], [2, 5], [2, 6]
    ]
  },
  'Z': {
    width: 5,
    height: 7,
    points: [
      [0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [3, 1], [2, 2], [1, 3], [0, 4], [0, 5], [1, 5], [2, 5], [3, 5], [4, 5], [0, 6], [1, 6], [2, 6], [3, 6], [4, 6]
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
  letterSpacing: number = 25,
  emojiSpacing: number = 12
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
          size: 30,
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
        size: 50,
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
  letterSpacing: number = 40,
  emojiSpacing: number = 12
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
          size: 30,
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
        size: 50,
        layer: 1,
        rotation: 0
      })
      currentY += letterSpacing
    }
  }
  
  return result
}
