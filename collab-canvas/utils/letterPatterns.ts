// Letter patterns for emoji-based text rendering
// Each letter is defined as an array of relative coordinates [x, y]
// where (0,0) is the top-left corner of the letter

export interface LetterPattern {
  width: number
  height: number
  points: Array<[number, number]>
}

// Letter patterns (5x7 grid for each letter)
export const LETTER_PATTERNS: Record<string, LetterPattern> = {
  'A': {
    width: 5,
    height: 7,
    points: [
      [0, 6], [1, 6], [2, 6], [3, 6], [4, 6], // Bottom line
      [0, 5], [4, 5], // Sides
      [0, 4], [4, 4], // Sides
      [0, 3], [1, 3], [2, 3], [3, 3], [4, 3], // Middle line
      [0, 2], [4, 2], // Sides
      [0, 1], [4, 1], // Sides
      [0, 0], [4, 0]  // Top
    ]
  },
  'B': {
    width: 5,
    height: 7,
    points: [
      [0, 0], [1, 0], [2, 0], [3, 0], // Top line
      [0, 1], [4, 1], // Sides
      [0, 2], [1, 2], [2, 2], [3, 2], // Middle line
      [0, 3], [4, 3], // Sides
      [0, 4], [1, 4], [2, 4], [3, 4], // Middle line
      [0, 5], [4, 5], // Sides
      [0, 6], [1, 6], [2, 6], [3, 6]  // Bottom line
    ]
  },
  'C': {
    width: 5,
    height: 7,
    points: [
      [1, 0], [2, 0], [3, 0], // Top line
      [0, 1], [4, 1], // Sides
      [0, 2], // Left side
      [0, 3], // Left side
      [0, 4], // Left side
      [0, 5], [4, 5], // Sides
      [1, 6], [2, 6], [3, 6]  // Bottom line
    ]
  },
  'D': {
    width: 5,
    height: 7,
    points: [
      [0, 0], [1, 0], [2, 0], [3, 0], // Top line
      [0, 1], [4, 1], // Sides
      [0, 2], [4, 2], // Sides
      [0, 3], [4, 3], // Sides
      [0, 4], [4, 4], // Sides
      [0, 5], [4, 5], // Sides
      [0, 6], [1, 6], [2, 6], [3, 6]  // Bottom line
    ]
  },
  'E': {
    width: 5,
    height: 7,
    points: [
      [0, 0], [1, 0], [2, 0], [3, 0], [4, 0], // Top line
      [0, 1], // Left side
      [0, 2], [1, 2], [2, 2], [3, 2], // Middle line
      [0, 3], // Left side
      [0, 4], // Left side
      [0, 5], // Left side
      [0, 6], [1, 6], [2, 6], [3, 6], [4, 6]  // Bottom line
    ]
  },
  'F': {
    width: 5,
    height: 7,
    points: [
      [0, 0], [1, 0], [2, 0], [3, 0], [4, 0], // Top line
      [0, 1], // Left side
      [0, 2], [1, 2], [2, 2], [3, 2], // Middle line
      [0, 3], // Left side
      [0, 4], // Left side
      [0, 5], // Left side
      [0, 6]  // Left side
    ]
  },
  'G': {
    width: 5,
    height: 7,
    points: [
      [1, 0], [2, 0], [3, 0], // Top line
      [0, 1], [4, 1], // Sides
      [0, 2], // Left side
      [0, 3], [2, 3], [3, 3], [4, 3], // Middle line
      [0, 4], [4, 4], // Sides
      [0, 5], [4, 5], // Sides
      [1, 6], [2, 6], [3, 6]  // Bottom line
    ]
  },
  'H': {
    width: 5,
    height: 7,
    points: [
      [0, 0], [4, 0], // Top
      [0, 1], [4, 1], // Sides
      [0, 2], [4, 2], // Sides
      [0, 3], [1, 3], [2, 3], [3, 3], [4, 3], // Middle line
      [0, 4], [4, 4], // Sides
      [0, 5], [4, 5], // Sides
      [0, 6], [4, 6]  // Bottom
    ]
  },
  'I': {
    width: 5,
    height: 7,
    points: [
      [0, 0], [1, 0], [2, 0], [3, 0], [4, 0], // Top line
      [2, 1], // Center
      [2, 2], // Center
      [2, 3], // Center
      [2, 4], // Center
      [2, 5], // Center
      [0, 6], [1, 6], [2, 6], [3, 6], [4, 6]  // Bottom line
    ]
  },
  'J': {
    width: 5,
    height: 7,
    points: [
      [0, 0], [1, 0], [2, 0], [3, 0], [4, 0], // Top line
      [2, 1], // Center
      [2, 2], // Center
      [2, 3], // Center
      [0, 4], [2, 4], // Left side + center
      [0, 5], [2, 5], // Left side + center
      [1, 6], [2, 6]  // Bottom
    ]
  },
  'K': {
    width: 5,
    height: 7,
    points: [
      [0, 0], [4, 0], // Top
      [0, 1], [3, 1], // Sides
      [0, 2], [2, 2], // Sides
      [0, 3], [1, 3], // Left side + center
      [0, 4], [2, 4], // Sides
      [0, 5], [3, 5], // Sides
      [0, 6], [4, 6]  // Bottom
    ]
  },
  'L': {
    width: 5,
    height: 7,
    points: [
      [0, 0], // Left side
      [0, 1], // Left side
      [0, 2], // Left side
      [0, 3], // Left side
      [0, 4], // Left side
      [0, 5], // Left side
      [0, 6], [1, 6], [2, 6], [3, 6], [4, 6]  // Bottom line
    ]
  },
  'M': {
    width: 5,
    height: 7,
    points: [
      [0, 0], [4, 0], // Top
      [0, 1], [1, 1], [3, 1], [4, 1], // Sides + inner
      [0, 2], [2, 2], [4, 2], // Sides + center
      [0, 3], [4, 3], // Sides
      [0, 4], [4, 4], // Sides
      [0, 5], [4, 5], // Sides
      [0, 6], [4, 6]  // Bottom
    ]
  },
  'N': {
    width: 5,
    height: 7,
    points: [
      [0, 0], [4, 0], // Top
      [0, 1], [1, 1], [4, 1], // Left + inner
      [0, 2], [2, 2], [4, 2], // Left + center
      [0, 3], [3, 3], [4, 3], // Left + inner
      [0, 4], [4, 4], // Sides
      [0, 5], [4, 5], // Sides
      [0, 6], [4, 6]  // Bottom
    ]
  },
  'O': {
    width: 5,
    height: 7,
    points: [
      [1, 0], [2, 0], [3, 0], // Top line
      [0, 1], [4, 1], // Sides
      [0, 2], [4, 2], // Sides
      [0, 3], [4, 3], // Sides
      [0, 4], [4, 4], // Sides
      [0, 5], [4, 5], // Sides
      [1, 6], [2, 6], [3, 6]  // Bottom line
    ]
  },
  'P': {
    width: 5,
    height: 7,
    points: [
      [0, 0], [1, 0], [2, 0], [3, 0], // Top line
      [0, 1], [4, 1], // Sides
      [0, 2], [1, 2], [2, 2], [3, 2], // Middle line
      [0, 3], // Left side
      [0, 4], // Left side
      [0, 5], // Left side
      [0, 6]  // Left side
    ]
  },
  'Q': {
    width: 5,
    height: 7,
    points: [
      [1, 0], [2, 0], [3, 0], // Top line
      [0, 1], [4, 1], // Sides
      [0, 2], [4, 2], // Sides
      [0, 3], [2, 3], [4, 3], // Sides + center
      [0, 4], [3, 4], [4, 4], // Sides + inner
      [0, 5], [4, 5], // Sides
      [1, 6], [2, 6], [3, 6], [4, 6]  // Bottom line
    ]
  },
  'R': {
    width: 5,
    height: 7,
    points: [
      [0, 0], [1, 0], [2, 0], [3, 0], // Top line
      [0, 1], [4, 1], // Sides
      [0, 2], [1, 2], [2, 2], [3, 2], // Middle line
      [0, 3], [2, 3], [4, 3], // Left + center + right
      [0, 4], [3, 4], // Left + inner
      [0, 5], [4, 5], // Sides
      [0, 6], [4, 6]  // Bottom
    ]
  },
  'S': {
    width: 5,
    height: 7,
    points: [
      [1, 0], [2, 0], [3, 0], [4, 0], // Top line
      [0, 1], // Left side
      [0, 2], [1, 2], [2, 2], [3, 2], // Middle line
      [4, 3], // Right side
      [4, 4], // Right side
      [0, 5], [4, 5], // Sides
      [0, 6], [1, 6], [2, 6], [3, 6]  // Bottom line
    ]
  },
  'T': {
    width: 5,
    height: 7,
    points: [
      [0, 0], [1, 0], [2, 0], [3, 0], [4, 0], // Top line
      [2, 1], // Center
      [2, 2], // Center
      [2, 3], // Center
      [2, 4], // Center
      [2, 5], // Center
      [2, 6]  // Center
    ]
  },
  'U': {
    width: 5,
    height: 7,
    points: [
      [0, 0], [4, 0], // Top
      [0, 1], [4, 1], // Sides
      [0, 2], [4, 2], // Sides
      [0, 3], [4, 3], // Sides
      [0, 4], [4, 4], // Sides
      [0, 5], [4, 5], // Sides
      [1, 6], [2, 6], [3, 6]  // Bottom line
    ]
  },
  'V': {
    width: 5,
    height: 7,
    points: [
      [0, 0], [4, 0], // Top
      [0, 1], [4, 1], // Sides
      [0, 2], [4, 2], // Sides
      [0, 3], [4, 3], // Sides
      [1, 4], [3, 4], // Inner
      [2, 5], // Center
      [2, 6]  // Center
    ]
  },
  'W': {
    width: 5,
    height: 7,
    points: [
      [0, 0], [4, 0], // Top
      [0, 1], [4, 1], // Sides
      [0, 2], [4, 2], // Sides
      [0, 3], [2, 3], [4, 3], // Sides + center
      [0, 4], [1, 4], [3, 4], [4, 4], // Sides + inner
      [0, 5], [4, 5], // Sides
      [0, 6], [4, 6]  // Bottom
    ]
  },
  'X': {
    width: 5,
    height: 7,
    points: [
      [0, 0], [4, 0], // Top
      [1, 1], [3, 1], // Inner
      [2, 2], // Center
      [2, 3], // Center
      [1, 4], [3, 4], // Inner
      [0, 5], [4, 5], // Sides
      [0, 6], [4, 6]  // Bottom
    ]
  },
  'Y': {
    width: 5,
    height: 7,
    points: [
      [0, 0], [4, 0], // Top
      [1, 1], [3, 1], // Inner
      [2, 2], // Center
      [2, 3], // Center
      [2, 4], // Center
      [2, 5], // Center
      [2, 6]  // Center
    ]
  },
  'Z': {
    width: 5,
    height: 7,
    points: [
      [0, 0], [1, 0], [2, 0], [3, 0], [4, 0], // Top line
      [3, 1], // Inner
      [2, 2], // Center
      [1, 3], // Inner
      [0, 4], // Left side
      [0, 5], // Left side
      [0, 6], [1, 6], [2, 6], [3, 6], [4, 6]  // Bottom line
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
  letterSpacing: number = 60,
  emojiSpacing: number = 20
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
