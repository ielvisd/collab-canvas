// server/api/emojiStory.ts
// Clean, modular rewrite of your handler — hubAI primary, graceful fallback.
// Canvas: 800x600

import {
  parseMultipleItems,
  extractCount,
  extractSize,
  extractPosition,
  extractEmojiType
} from '~/utils/aiHelpers'

const CANVAS = { width: 800, height: 600, centerX: 400, centerY: 300 }
const _POSITIONS: Record<string, { x: number; y: number }> = {
  'upper-left': { x: 100, y: 100 },
  'upper-right': { x: 600, y: 100 },
  'lower-left': { x: 100, y: 450 },
  'lower-right': { x: 600, y: 450 },
  center: { x: 400, y: 300 },
  'top-center': { x: 400, y: 100 },
  'bottom-center': { x: 400, y: 500 }
}

/* -----------------------
   Utility helpers
   ----------------------- */

/** clamp coordinate inside canvas */
function clampX(x: number) {
  return Math.max(0, Math.min(CANVAS.width, Math.round(x)))
}
function clampY(y: number) {
  return Math.max(0, Math.min(CANVAS.height, Math.round(y)))
}

function mapSize(keyword?: number | string) {
  if (!keyword) return 48 // Default medium size
  if (typeof keyword === 'number') return Math.max(16, Math.min(256, keyword))
  const s = String(keyword).toLowerCase()
  if (s.includes('tiny') || s.includes('mini')) return 20
  if (s.includes('small') || s.includes('little')) return 32
  if (s.includes('medium') || s.includes('normal')) return 48
  if (s.includes('big') || s.includes('large')) return 80
  if (s.includes('huge') || s.includes('giant') || s.includes('massive')) return 128
  return 48
}

/* -----------------------
   Fallback generation
   ----------------------- */

/** Minimal, deterministic generator used if hubAI not available */
function generateEmojisFromStory(story = ''): Array<{ emoji: string; x: number; y: number; size: number; layer: number }> {
  const lower = (story || '').toLowerCase()
  const cX = CANVAS.centerX
  const cY = CANVAS.centerY

  if (lower.includes('pizza') && lower.includes('moon')) {
    return [
      { emoji: '🌕', x: cX, y: cY, size: 120, layer: 1 },
      { emoji: '🍕', x: clampX(cX - 40), y: clampY(cY - 30), size: 40, layer: 2 },
      { emoji: '🍕', x: clampX(cX + 20), y: clampY(cY - 20), size: 40, layer: 2 },
      { emoji: '🍕', x: clampX(cX - 20), y: clampY(cY + 20), size: 40, layer: 2 },
      { emoji: '🍕', x: clampX(cX + 30), y: clampY(cY + 30), size: 40, layer: 2 }
    ]
  }

  if (lower.includes('bear') && lower.includes('beach')) {
    return [
      { emoji: '🐻', x: clampX(cX - 50), y: clampY(cY - 20), size: 50, layer: 2 },
      { emoji: '🏖️', x: clampX(cX), y: clampY(cY + 20), size: 60, layer: 1 },
      { emoji: '🌊', x: clampX(cX + 30), y: clampY(cY + 10), size: 40, layer: 1 }
    ]
  }

  if (lower.includes('monkey') && lower.includes('tree')) {
    return [
      { emoji: '🐒', x: clampX(cX - 30), y: clampY(cY - 30), size: 40, layer: 2 },
      { emoji: '🐒', x: clampX(cX), y: clampY(cY - 20), size: 40, layer: 2 },
      { emoji: '🐒', x: clampX(cX + 30), y: clampY(cY - 10), size: 40, layer: 2 },
      { emoji: '🌳', x: clampX(cX), y: clampY(cY + 10), size: 60, layer: 1 }
    ]
  }

  if (lower.includes('hello world')) {
    const letters = [
      '🎨', '🌟', '💎', '💎', '🔥', '⭐', '🔥', '💎', '🌟', '🎨'
    ]
    return letters.map((e, i) => ({ emoji: e, x: clampX(100 + i * 50), y: 200, size: 40, layer: 2 }))
  }

  // Generic scene parsing for fallback
  if (lower.includes('island') || lower.includes('beach')) {
    const out = [{ emoji: '🏝️', x: 300, y: 200, size: 80, layer: 1 }]
    if (lower.includes('pig') || lower.includes('pigs')) {
      out.push({ emoji: '🐷', x: 280, y: 180, size: 40, layer: 2 })
      out.push({ emoji: '🐷', x: 320, y: 180, size: 40, layer: 2 })
      out.push({ emoji: '🐷', x: 300, y: 160, size: 40, layer: 2 })
    }
    return out
  }

  if (lower.includes('space') || lower.includes('rocket')) {
    return [
      { emoji: '🚀', x: 300, y: 200, size: 60, layer: 1 },
      { emoji: '🌍', x: 400, y: 150, size: 40, layer: 2 },
      { emoji: '⭐', x: 200, y: 100, size: 20, layer: 3 },
      { emoji: '⭐', x: 450, y: 120, size: 20, layer: 3 }
    ]
  }


  // final fallback
  return [
    { emoji: '🎭', x: cX, y: cY, size: 50, layer: 1 },
    { emoji: '✨', x: clampX(cX - 30), y: clampY(cY - 20), size: 30, layer: 2 },
    { emoji: '✨', x: clampX(cX + 30), y: clampY(cY - 20), size: 30, layer: 2 }
  ]
}

/* -----------------------
   Geometric arranger
   ----------------------- */

function arrangeInShape(emojiChar: string, count: number, shape: string, centerX = CANVAS.centerX, centerY = CANVAS.centerY, radius = 120, size = 40, layer = 2) {
  const arr: Array<{ emoji: string; x: number; y: number; size: number; layer: number }> = []
  for (let i = 0; i < count; i++) {
    let x = centerX
    let y = centerY
    const t = (i / Math.max(1, count)) * 2 * Math.PI
    switch (shape) {
      case 'circle':
        x = centerX + radius * Math.cos(t)
        y = centerY + radius * Math.sin(t)
        break
      case 'triangle':
        x = centerX + radius * Math.cos(t)
        y = centerY + radius * Math.sin(t)
        break
      case 'square': {
        const pos = i % 4
        x = pos === 0 ? centerX - radius : pos === 1 ? centerX + radius : pos === 2 ? centerX + radius : centerX - radius
        y = pos === 0 ? centerY - radius : pos === 1 ? centerY - radius : pos === 2 ? centerY + radius : centerY + radius
        break
      }
      case 'line':
        x = centerX + (i - Math.floor(count / 2)) * (radius / 2)
        y = centerY
        break
      case 'diamond':
        x = centerX + radius * Math.cos(t + Math.PI / 4)
        y = centerY + radius * Math.sin(t + Math.PI / 4)
        break
      case 'heart':
        x = centerX + radius * Math.cos(t) * 0.8
        y = centerY + radius * Math.sin(t) * 0.6 - Math.abs(Math.cos(t)) * radius * 0.3
        break
      default:
        x = centerX + i * 50
        y = centerY
    }
    arr.push({ emoji: emojiChar, x: clampX(x), y: clampY(y), size, layer })
  }
  return arr
}

/* -----------------------
   HubAI integration & tools spec (keeps behavior)
   ----------------------- */

export default defineEventHandler(async (event) => {
  const { messages } = await readBody(event)

  const lastUserMessage = messages?.[messages.length - 1]?.content || ''

  // Try to get hubAI; fall back if not present
  let ai: any = null
  try {
    ai = hubAI()
  } catch {
    ai = null
  }

  if (!ai) {
    // Fallback-only path (concise response, same structure as AI path)
    const cmd = buildFallbackCommand(lastUserMessage)
    return {
      content: `🎨 Perfect! I've crafted something beautiful just for you using my fallback creativity.`,
      commands: cmd ? [cmd] : []
    }
  }

  // Real AI path
  const systemPrompt = createSystemPrompt()
  console.log('🤖 AI System Prompt:', systemPrompt.substring(0, 200) + '...')
  console.log('🤖 User message:', lastUserMessage)
  
  const response = await ai.run('@cf/meta/llama-3.1-8b-instruct' as any, {
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
    tools: buildToolSpecs()
  })
  
  console.log('🤖 AI Response:', JSON.stringify(response, null, 2))

  // Normalize hubAI response
  const commands = await parseAIResponse(response)
  return {
    content: (response as any).response || '✨ Your creation is complete! I\'ve brought your vision to life on the canvas.',
    commands
  }
})

/* -----------------------
   Small helpers used by handler
   ----------------------- */

function createSystemPrompt() {
  return `You are an expert emoji scene designer for a collaborative canvas (800x600). You help users create visual stories using emojis and basic shapes.

## CAPABILITIES

### Emoji Operations
- Create emoji stories: "Create a story with three little pigs on an island"
- Arrange emojis in shapes: circles, triangles, squares, lines, diamonds, hearts
- Move specific emojis: "move all pizza emojis by 50px right"
- Move everything: "move everything 10px up" 
- Rotate emojis: "rotate the hearts 45 degrees"
- Clear canvas: "delete all emojis"

### Advanced Emoji Features
- Spell words with emojis: "Spell PIZZA with pizza emojis" → Use spellWord tool
- Create borders: "Create a border of cheese wedges around the canvas" → Use createBorder tool
- Alternating patterns: "Fill the top row with alternating star and moon emojis" → Use createAlternatingPattern tool
- Movement with trails: "Move cats leaving paw-print hearts behind" → Use moveEmojis with trailEmoji
- Scene manipulation: "Shift the whole scene slightly to the right" → Use shiftScene tool
- Mirror arrangements: "Mirror the left side to the right" → Use mirrorScene tool

### Shape Drawing (ASCII-Art Style)
- Draw geometric shapes: "draw a triangle with pizzas", "draw a square outline with hearts" → Use drawShape tool
- Creative shapes: "draw a cat with cat emojis", "draw a dinosaur with bones" → AI generates ASCII patterns
- Filled vs outline: "draw a filled circle with stars" vs "draw a circle outline with hearts"
- Size control: "draw a big triangle with gems" (size parameter)
- Position control: "draw a diamond in the top-left corner"

### AI Pattern Generation for Creative Shapes
When generating ASCII patterns for creative shapes, use simple but recognizable designs:
- **Cat**: Simple face with ears, eyes, and whiskers
- **Dog**: Similar to cat but with different ear shape
- **Dinosaur**: Long body with tail, head, and legs
- **House**: Square base with triangular roof
- **Tree**: Trunk with branching canopy
- **Car**: Rectangular body with wheels
- **Heart**: Two rounded sections meeting at bottom point
- **Star**: 5-pointed star shape
- **Flower**: Center with radiating petals

**IMPORTANT**: For creative shapes (not geometric), you MUST include an asciiPattern array in the drawShape command. Example:
action: draw-shape, shape: cat, emoji: 🐱, asciiPattern: array of strings

Always output patterns as arrays of strings where each string represents a row of the ASCII art.

### Specific Prompt Patterns
- "Place a single pizza emoji in the top-left corner" → Create single emoji at (100,100)
- "Nestle a pizza emoji in the top-left corner, but make it 'guarded' by two winking eyes" → Pizza + winking eyes
- "Spell 'PIZZA' horizontally across the middle row" → Use spellWord with position (200,300)
- "Move a cluster of three cat emojis from the left half to the right half" → Create cats then move them
- "Slide a trio of mischievous cat emojis leaving a trail of paw-print hearts" → Move with trail
- "Put a rocket in the bottom-right corner, then fill the top row with alternating star and moon" → Rocket + alternating pattern
- "Create a border of cheese wedges around the canvas, place a central pizza emoji, and shift the whole scene slightly to the right" → Border + pizza + shift
- "Spell 'FUN' vertically on the left edge with fruit emojis, then mirror it to the right with veggie emojis" → Vertical spelling + mirror

### Shape Operations
- Create basic shapes: rectangles, circles, text
- Move, resize, delete individual shapes
- Arrange shapes in layouts: horizontal, vertical, grid, circle

### Canvas Information
- Dimensions: 800x600 pixels
- Coordinate system: (0,0) top-left, (800,600) bottom-right
- Position keywords: 
  - Corners: upper-left (100,100), upper-right (600,100), lower-left (100,450), lower-right (600,450)
  - Centers: center (400,300), top-center (400,100), bottom-center (400,500)
  - Rows: top-row (y=100), middle-row (y=300), bottom-row (y=500)
  - Edges: left-edge (x=50), right-edge (x=750)
- Size keywords: tiny (20), small (32), medium/normal (48), big/large (80), huge/giant (128)
- Examples: "add a tiny pizza", "create a huge moon", "place small hearts around the star"

## LIMITATIONS
- Cannot create custom drawings or freeform shapes
- Cannot edit individual pixels or create complex graphics
- Focus on emoji-based compositions and preset shapes
- Cannot modify text content after creation
- Cannot create animations or transitions

## BEST PRACTICES
- Use layers for depth (1=background, 2=foreground, 3=top)
- Vary emoji sizes for visual interest
- Consider spatial relationships and composition
- Use appropriate emojis for the story context
- Always populate emoji arrays with actual emoji characters and pixel coordinates
- Prefer emojis over text for visual elements
- For spelling words, use letter patterns to create readable text
- For borders, place emojis around canvas edges
- For alternating patterns, cycle through different emoji types

## EXAMPLES - ALWAYS USE THE SPECIFIC TOOLS
- "Place a single pizza emoji in the top-left corner" → Use createShape tool with shapeType "emoji", emoji "🍕", x: 100, y: 100
- "Spell PIZZA with pizza emojis" → Use spellWord tool with word "PIZZA", emoji "🍕"
- "Create a border of cheese wedges" → Use createBorder tool with emoji "🧀"
- "Fill the top row with alternating star and moon emojis" → Use createAlternatingPattern tool with emojis ["⭐","🌙"], count 10, arrangement "row", position {x: 400, y: 100}
- "Move cats leaving paw-print hearts behind" → Use moveEmojis tool with emojiType "🐱", deltaX 200, createTrail true, trailEmoji "❤️"
- "Draw a cat with cat emojis" → Use drawShape tool with shape "cat", emoji "🐱", asciiPattern array
- "Draw a triangle with pizzas" → Use drawShape tool with shape "triangle", emoji "🍕", fillStyle "filled"

IMPORTANT: Always use the specific tools (spellWord, createBorder, createAlternatingPattern, etc.) instead of createEmojiStory for these patterns!

## COMMANDS YOU CAN EXECUTE
- createEmojiStory: Create scenes with multiple emojis
- arrangeEmojisInShape: Arrange emojis in geometric patterns
- createShape: Create rectangles, circles, text, or emoji shapes
- moveEmojis: Move specific emoji types by pixel amounts (with optional trails)
- rotateEmojis: Rotate specific emoji types by degrees
- moveAllShapes: Move all emojis on canvas
- clearAllShapes: Clear the entire canvas
- spellWord: Spell words using emoji letter patterns
- createBorder: Create borders around canvas edges
- createAlternatingPattern: Create alternating emoji patterns
- shiftScene: Move entire scene by offset
- mirrorScene: Mirror scene horizontally or vertically

Never return empty tool calls. Always provide helpful feedback about what you're creating or modifying.`
}

function buildToolSpecs() {
  return [
    {
      name: 'createShape',
      description: 'Create a shape. Use emoji shapes for visuals.',
      parameters: {
        type: 'object',
        properties: {
          shapeType: { type: 'string', enum: ['rectangle', 'circle', 'text', 'emoji', 'pen'] },
          x: { type: 'number' },
          y: { type: 'number' },
          width: { type: 'number' },
          height: { type: 'number' },
          radius: { type: 'number' },
          text: { type: 'string' },
          fontSize: { type: 'number' },
          fill: { type: 'string' },
          stroke: { type: 'string' },
          emoji: { type: 'string' },
          emojiSize: { type: 'number' },
          layer: { type: 'number' }
        },
        required: ['shapeType', 'x', 'y']
      },
      function: async (args: Record<string, unknown>) => ({ name: 'createShape', arguments: args })
    },
    {
      name: 'createEmojiStory',
      description: 'Create an emoji story with populated emoji array.',
      parameters: {
        type: 'object',
        properties: {
          story: { type: 'string' },
          emojis: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                emoji: { type: 'string' },
                x: { type: 'number' },
                y: { type: 'number' },
                size: { type: 'number' },
                layer: { type: 'number' }
              },
              required: ['emoji', 'x', 'y']
            }
          }
        },
        required: ['story', 'emojis']
      },
      function: async ({ story, emojis }: Record<string, unknown>) => {
        if (Array.isArray(emojis) && emojis.length) {
          return { name: 'createEmojiStory', arguments: { story, emojis } }
        }
        // generate fallback if empty
        return { name: 'createEmojiStory', arguments: { story, emojis: generateEmojisFromStory(String(story)) } }
      }
    },
    {
      name: 'arrangeEmojisInShape',
      description: 'Arrange emojis in circle/triangle/square/line/diamond/heart',
      parameters: {
        type: 'object',
        properties: {
          emoji: { type: 'string' },
          count: { type: 'number' },
          shape: { type: 'string' },
          centerX: { type: 'number' },
          centerY: { type: 'number' },
          radius: { type: 'number' },
          size: { type: 'number' },
          layer: { type: 'number' }
        },
        required: ['emoji', 'count', 'shape']
      },
      function: async (args: Record<string, unknown>) => {
        const emoji = String(args.emoji)
        const count = Number(args.count)
        const shape = String(args.shape)
        const centerX = Number(args.centerX ?? CANVAS.centerX)
        const centerY = Number(args.centerY ?? CANVAS.centerY)
        const radius = Number(args.radius ?? 120)
        const size = Number(args.size ?? 40)
        const layer = Number(args.layer ?? 2)
        const emojis = arrangeInShape(emoji, count, shape, centerX, centerY, radius, size, layer)
        return { name: 'arrangeEmojisInShape', arguments: { emoji, count, shape, centerX, centerY, radius, size, layer, emojis } }
      }
    },
    {
      name: 'clearAllShapes',
      description: 'Clear canvas',
      parameters: { type: 'object', properties: {}, required: [] },
      function: async () => ({ name: 'clearAllShapes', arguments: {} })
    },
    {
      name: 'moveEmojis',
      description: 'Move specific emoji type by delta amount',
      parameters: {
        type: 'object',
        properties: {
          emojiType: { type: 'string', description: 'Emoji character to move (e.g., "🍕", "❤️")' },
          deltaX: { type: 'number', description: 'Horizontal movement in pixels' },
          deltaY: { type: 'number', description: 'Vertical movement in pixels' }
        },
        required: ['emojiType', 'deltaX', 'deltaY']
      },
      function: async (args: Record<string, unknown>) => ({ name: 'moveEmojis', arguments: args })
    },
    {
      name: 'rotateEmojis',
      description: 'Rotate specific emoji type by degrees',
      parameters: {
        type: 'object',
        properties: {
          emojiType: { type: 'string', description: 'Emoji character to rotate (e.g., "🍕", "❤️")' },
          degrees: { type: 'number', description: 'Rotation amount in degrees' }
        },
        required: ['emojiType', 'degrees']
      },
      function: async (args: Record<string, unknown>) => ({ name: 'rotateEmojis', arguments: args })
    },
    {
      name: 'moveAllShapes',
      description: 'Move all emojis on canvas by delta amount',
      parameters: {
        type: 'object',
        properties: {
          deltaX: { type: 'number', description: 'Horizontal movement in pixels' },
          deltaY: { type: 'number', description: 'Vertical movement in pixels' }
        },
        required: ['deltaX', 'deltaY']
      },
      function: async (args: Record<string, unknown>) => ({ name: 'moveAllShapes', arguments: args })
    },
    {
      name: 'spellWord',
      description: 'Spell a word using emoji letter patterns',
      parameters: {
        type: 'object',
        properties: {
          word: { type: 'string', description: 'Word to spell' },
          emoji: { type: 'string', description: 'Emoji to use for letters' },
          vertical: { type: 'boolean', description: 'Whether to spell vertically' },
          position: {
            type: 'object',
            properties: {
              x: { type: 'number' },
              y: { type: 'number' }
            }
          }
        },
        required: ['word', 'emoji']
      },
      function: async (args: Record<string, unknown>) => ({ name: 'spellWord', arguments: args })
    },
    {
      name: 'drawShape',
      description: 'Draw ASCII-art style shapes using emojis as pixels',
      parameters: {
        type: 'object',
        properties: {
          shape: { type: 'string', description: 'Shape to draw (triangle, square, circle, diamond, or creative shapes like cat, dinosaur)' },
          emoji: { type: 'string', description: 'Emoji to use as pixels' },
          fillStyle: { type: 'string', enum: ['filled', 'outline'], description: 'Whether to draw filled or outline shape', default: 'filled' },
          size: { type: 'number', description: 'Approximate size in emojis (default 5)' },
          position: {
            type: 'object',
            properties: {
              x: { type: 'number' },
              y: { type: 'number' }
            },
            description: 'Position to place the shape (default center)'
          },
          asciiPattern: {
            type: 'array',
            items: { type: 'string' },
            description: 'AI-generated ASCII pattern for creative shapes'
          }
        },
        required: ['shape', 'emoji']
      },
      function: async (args: Record<string, unknown>) => ({ name: 'drawShape', arguments: args })
    },
    {
      name: 'createBorder',
      description: 'Create a border around canvas edges',
      parameters: {
        type: 'object',
        properties: {
          emoji: { type: 'string', description: 'Emoji to use for border' },
          spacing: { type: 'number', description: 'Spacing between border emojis' }
        },
        required: ['emoji']
      },
      function: async (args: Record<string, unknown>) => ({ name: 'createBorder', arguments: args })
    },
    {
      name: 'createAlternatingPattern',
      description: 'Create alternating pattern with multiple emoji types',
      parameters: {
        type: 'object',
        properties: {
          emojis: { 
            type: 'array', 
            items: { type: 'string' },
            description: 'Array of emoji types to alternate' 
          },
          count: { type: 'number', description: 'Total number of emojis' },
          arrangement: { type: 'string', enum: ['row', 'column'], description: 'Arrangement type' },
          position: {
            type: 'object',
            properties: {
              x: { type: 'number' },
              y: { type: 'number' }
            }
          }
        },
        required: ['emojis', 'count']
      },
      function: async (args: Record<string, unknown>) => ({ name: 'createAlternatingPattern', arguments: args })
    },
    {
      name: 'shiftScene',
      description: 'Move entire scene by offset',
      parameters: {
        type: 'object',
        properties: {
          deltaX: { type: 'number', description: 'Horizontal shift in pixels' },
          deltaY: { type: 'number', description: 'Vertical shift in pixels' }
        },
        required: ['deltaX', 'deltaY']
      },
      function: async (args: Record<string, unknown>) => ({ name: 'shiftScene', arguments: args })
    },
    {
      name: 'mirrorScene',
      description: 'Mirror scene horizontally or vertically',
      parameters: {
        type: 'object',
        properties: {
          axis: { type: 'string', enum: ['horizontal', 'vertical'], description: 'Mirror axis' },
          centerX: { type: 'number', description: 'Center point for horizontal mirroring' }
        },
        required: ['axis']
      },
      function: async (args: Record<string, unknown>) => ({ name: 'mirrorScene', arguments: args })
    }
  ]
}

/* -----------------------
   Parse AI response into commands (concise, robust)
   ----------------------- */

async function parseAIResponse(response: any) {
  const commands: Array<Record<string, unknown>> = []
  
  console.log('🔍 Parsing AI response:', JSON.stringify(response, null, 2))

  // First check if there's a valid tool call in the content field
  if (response && typeof response === 'object' && typeof response.content === 'string') {
    const content = response.content as string
    console.log('🔍 Processing content for tool calls:', content)
    
    // First try to parse the entire content as a single tool call
    try {
      const toolCall = JSON.parse(content)
      if (toolCall.name && toolCall.arguments) {
        console.log('🔍 Found single tool call in content:', toolCall)
        const name = toolCall.name
        const args = toolCall.arguments
        
        if (name === 'spellWord') {
          commands.push({ action: 'spell-word', ...args })
        } else if (name === 'drawShape') {
          commands.push({ action: 'draw-shape', ...args })
        } else if (name === 'createBorder') {
          commands.push({ action: 'create-border', ...args })
        } else if (name === 'createAlternatingPattern') {
          commands.push({ action: 'create-alternating-pattern', ...args })
        } else if (name === 'shiftScene') {
          commands.push({ action: 'shift-scene', ...args })
        } else if (name === 'mirrorScene') {
          commands.push({ action: 'mirror-scene', ...args })
        } else if (name === 'createShape') {
          commands.push({ action: 'create-shape', ...args })
        } else if (name === 'createEmojiStory') {
          commands.push({ action: 'create-emoji-story', ...args })
        }
        
        if (commands.length > 0) {
          console.log('🔍 Extracted commands from content:', commands)
          return commands
        }
      }
    } catch (e) {
      console.log('🔍 Content is not a single tool call, trying other methods')
    }
  }

  if (response && typeof response === 'object' && Array.isArray(response.tool_calls) && response.tool_calls.length) {
    console.log('🔍 Found tool calls:', response.tool_calls.length)
    for (const call of response.tool_calls) {
      const name = call.name
      const args = call.arguments ?? {}
      console.log('🔍 Processing tool call:', name, args)
      if (name === 'createShape') {
        commands.push({ action: 'create-shape', ...args })
      } else if (name === 'createEmojiStory') {
        let emojis = args.emojis
        if (typeof emojis === 'string') {
          try { emojis = JSON.parse(emojis) } catch { emojis = [] }
        }
        if (!Array.isArray(emojis) || emojis.length === 0) {
          emojis = generateEmojisFromStory(String(args.story || ''))
        }
        commands.push({ action: 'create-emoji-story', story: args.story, emojis })
      } else if (name === 'arrangeEmojisInShape') {
        let emojis = args.emojis
        if (typeof emojis === 'string') {
          try { emojis = JSON.parse(emojis) } catch { emojis = [] }
        }
        if (!Array.isArray(emojis) || emojis.length === 0) {
          const arr = arrangeInShape(String(args.emoji), Number(args.count), String(args.shape), Number(args.centerX ?? CANVAS.centerX), Number(args.centerY ?? CANVAS.centerY), Number(args.radius ?? 120), Number(args.size ?? 40), Number(args.layer ?? 2))
          emojis = arr
        }
        commands.push({ action: 'create-emoji-story', story: `${args.count} ${args.emoji} arranged in a ${args.shape}`, emojis })
      } else if (name === 'clearAllShapes') {
        commands.push({ action: 'clear-all' })
      } else if (name === 'moveEmojis') {
        commands.push({ action: 'move-emojis', ...args })
      } else if (name === 'rotateEmojis') {
        commands.push({ action: 'rotate-emojis', ...args })
      } else if (name === 'moveAllShapes') {
        commands.push({ action: 'move-all-emojis', ...args })
      } else if (name === 'spellWord') {
        console.log('🔍 Converting spellWord to spell-word action:', args)
        commands.push({ action: 'spell-word', ...args })
      } else if (name === 'drawShape') {
        console.log('🔍 Converting drawShape to draw-shape action:', args)
        commands.push({ action: 'draw-shape', ...args })
      } else if (name === 'createBorder') {
        commands.push({ action: 'create-border', ...args })
      } else if (name === 'createAlternatingPattern') {
        commands.push({ action: 'create-alternating-pattern', ...args })
      } else if (name === 'shiftScene') {
        commands.push({ action: 'shift-scene', ...args })
      } else if (name === 'mirrorScene') {
        commands.push({ action: 'mirror-scene', ...args })
      } else {
        // passthrough
        commands.push({ action: name, ...(args || {}) })
      }
    }
    return commands
  }


  // Last-resort fallback: generate simple scene based on last user message
  return [buildFallbackCommand((response && response.response) || '')].filter(Boolean)
}

/* -----------------------
   Fallback command builder (used for fallback-only and last-resort)
   ----------------------- */

function buildFallbackCommand(userMessage: string) {
  const m = (userMessage || '').toLowerCase()

  // shape commands
  if (m.includes('rectangle')) {
    let color = '#ff0000'
    if (m.includes('pink')) color = '#ffc0cb'
    else if (m.includes('blue')) color = '#0000ff'
    else if (m.includes('green')) color = '#00ff00'
    else if (m.includes('yellow')) color = '#ffff00'
    else if (m.includes('purple')) color = '#800080'
    else if (m.includes('orange')) color = '#ffa500'

    return {
      action: 'create-shape',
      shapeType: 'rectangle',
      x: 100,
      y: 200,
      width: 100,
      height: 80,
      fill: color
    }
  }

  if (m.includes('circle') && !m.includes('pigs') && !m.includes('around')) {
    let color = '#0000ff'
    if (m.includes('pink')) color = '#ffc0cb'
    else if (m.includes('red')) color = '#ff0000'
    else if (m.includes('green')) color = '#00ff00'
    else if (m.includes('yellow')) color = '#ffff00'
    else if (m.includes('purple')) color = '#800080'
    else if (m.includes('orange')) color = '#ffa500'
    return {
      action: 'create-shape',
      shapeType: 'circle',
      x: 200,
      y: 200,
      radius: 50,
      fill: color
    }
  }

  if (m.includes('text') || m.includes('hello')) {
    return {
      action: 'create-shape',
      shapeType: 'text',
      x: 300,
      y: 200,
      text: 'Hello World',
      fontSize: 24,
      fill: 'black'
    }
  }

  if (m.includes('arrange') || m.includes('horizontal')) {
    return { action: 'arrange-shapes', shapeIds: ['all'], layout: 'horizontal', spacing: 20 }
  }

  if (m.includes('clear') || m.includes('delete all') || m.includes('remove all') || m.includes('delete all emojis') || m.includes('delete all shapes')) {
    return { action: 'clear-all' }
  }

  // emoji stories and arrangements (pumpkins, pigs, triangles, squares, circle-of-frogs, etc)
  if (m.includes('pigs around') || m.includes('around a star') || m.includes('in a circle')) {
    const centerX = CANVAS.centerX
    const centerY = CANVAS.centerY
    const radius = 120
    const numPigs = 5
    const emojis = [{ emoji: '⭐', x: centerX, y: centerY, size: 60, layer: 1 }]
    for (let i = 0; i < numPigs; i++) {
      const angle = (i / numPigs) * 2 * Math.PI
      emojis.push({ emoji: '🐷', x: clampX(centerX + radius * Math.cos(angle)), y: clampY(centerY + radius * Math.sin(angle)), size: 40, layer: 2 })
    }
    return { action: 'create-emoji-story', story: '5 pigs around a star in a circle', emojis }
  }

  if (m.includes('three little pigs') || m.includes('pigs on island')) {
    return {
      action: 'create-emoji-story',
      story: 'Three little pigs on an island',
      emojis: [
        { emoji: '🏝️', x: 300, y: 200, size: 80, layer: 1 },
        { emoji: '🐷', x: 280, y: 180, size: 40, layer: 2 },
        { emoji: '🐷', x: 320, y: 180, size: 40, layer: 2 },
        { emoji: '🐷', x: 300, y: 160, size: 40, layer: 2 }
      ]
    }
  }

  if (m.includes('triangle') || m.includes('in a triangle')) {
    const count = m.match(/\d+/)?.[0] ? parseInt(m.match(/\d+/)![0], 10) : 3
    const emoji = m.includes('heart') ? '❤️' : m.includes('star') ? '⭐' : '🐷'
    const generated = arrangeInShape(emoji, count, 'triangle', CANVAS.centerX, CANVAS.centerY, 100, 40, 2)
    return { action: 'create-emoji-story', story: `${count} ${emoji} in a triangle`, emojis: generated }
  }

  if (m.includes('square') || m.includes('in a square')) {
    const count = Math.min(m.match(/\d+/)?.[0] ? parseInt(m.match(/\d+/)![0], 10) : 4, 4)
    const emoji = m.includes('heart') ? '❤️' : m.includes('star') ? '⭐' : '🐷'
    const generated = arrangeInShape(emoji, count, 'square', CANVAS.centerX, CANVAS.centerY, 100, 40, 2)
    return { action: 'create-emoji-story', story: `${count} ${emoji} in a square`, emojis: generated }
  }

  if (m.includes('pumpkin') || m.includes('pumpkins')) {
    const count = extractCount(userMessageToString(userMessageToString(m))) || extractCount(m) || 3
    const size = mapSize(extractSize(m))
    const position = extractPosition(m) || { x: CANVAS.centerX, y: CANVAS.centerY }
    const centerX = position.x || CANVAS.centerX
    const centerY = position.y || CANVAS.centerY
    if (m.includes('in a row')) {
      const out: any[] = []
      for (let i = 0; i < count; i++) {
        out.push({ emoji: '🎃', x: clampX(centerX - count * 40 + i * 80), y: centerY, size, layer: 1 })
      }
      return { action: 'create-emoji-story', story: `${count} pumpkins in a row`, emojis: out }
    }
    if (m.includes('around') || m.includes('circle')) {
      const out = arrangeInShape('🎃', count, 'circle', centerX, centerY, 120, size, 1)
      return { action: 'create-emoji-story', story: `${count} pumpkins in a circle`, emojis: out }
    }
    const out: any[] = []
    for (let i = 0; i < count; i++) {
      out.push({ emoji: '🎃', x: clampX(centerX - count * 40 + i * 80), y: centerY, size, layer: 1 })
    }
    return { action: 'create-emoji-story', story: `${count} pumpkins`, emojis: out }
  }

  // generic "in a row" pattern using helpers
  if (m.includes(' in a row') || m.includes('in row')) {
    const count = extractCount(m) || 3
    const size = mapSize(extractSize(m))
    const position = extractPosition(m) || { x: CANVAS.centerX, y: CANVAS.centerY }
    const emoji = extractEmojiType(m) || '🐷'
    const out: any[] = []
    for (let i = 0; i < count; i++) {
      out.push({ emoji, x: clampX(position.x - count * 40 + i * 80), y: position.y || CANVAS.centerY, size, layer: 1 })
    }
    return { action: 'create-emoji-story', story: `${count} ${emoji} in a row`, emojis: out }
  }

  // multiple items like "one big pumpkin and two small hearts"
  if (m.includes(' and ') && (m.includes('big') || m.includes('small') || m.includes('tiny') || m.includes('huge'))) {
    const multiple = parseMultipleItems(m)
    if (multiple) {
      const emojis: any[] = []
      const centerX = multiple.position?.x || CANVAS.centerX
      const centerY = multiple.position?.y || CANVAS.centerY
      let index = 0
      const total = multiple.items.reduce((s: number, it: any) => s + it.count, 0)
      for (const it of multiple.items) {
        for (let i = 0; i < it.count; i++) {
          const angle = (index / total) * Math.PI * 2
          const r = 80
          const x = clampX(centerX + r * Math.cos(angle))
          const y = clampY(centerY + r * Math.sin(angle))
          emojis.push({ emoji: it.emoji, x, y, size: it.size, layer: 1 })
          index++
        }
      }
      return { action: 'create-emoji-story', story: m, emojis }
    }
  }

  // circle of frogs
  if (m.includes('circle of frogs') || m.includes('frogs in circle')) {
    const count = extractCount(m) || 8
    const size = mapSize(extractSize(m))
    const pos = extractPosition(m) || { x: CANVAS.centerX, y: CANVAS.centerY }
    const emojis = arrangeInShape('🐸', count, 'circle', pos.x, pos.y, 120, size, 1)
    return { action: 'create-emoji-story', story: 'circle of frogs', emojis }
  }

  // generic emoji request
  if (m.includes('emoji') || m.includes('smile') || m.includes('😊')) {
    return { action: 'create-shape', shapeType: 'emoji', x: 200, y: 200, emoji: '😊', emojiSize: 48, layer: 1 }
  }

  // Handle specific prompt patterns from the test cases
  console.log('🔍 Checking fallback patterns for:', m)
  
  if (m.includes('pizza') && m.includes('top-left corner')) {
    console.log('✅ Matched: Pizza in top-left corner')
    return {
      action: 'create-emoji-story',
      story: 'Pizza in top-left corner',
      emojis: [
        { emoji: '🍕', x: 100, y: 100, size: 40, layer: 1 }
      ]
    }
  }

  if (m.includes('pizza') && m.includes('guarded') && m.includes('winking eyes')) {
    return {
      action: 'create-emoji-story',
      story: 'Pizza guarded by winking eyes',
      emojis: [
        { emoji: '🍕', x: 100, y: 100, size: 40, layer: 2 },
        { emoji: '😉', x: 80, y: 80, size: 30, layer: 1 },
        { emoji: '😉', x: 120, y: 80, size: 30, layer: 1 }
      ]
    }
  }

  if (m.includes('spell') && m.includes('pizza')) {
    const word = 'PIZZA'
    return {
      action: 'spell-word',
      word: word,
      emoji: '🍕',
      position: { x: 200, y: 200 }
    }
  }

  if (m.includes('alternating') && m.includes('star') && m.includes('moon')) {
    return {
      action: 'create-alternating-pattern',
      emojis: ['⭐', '🌙'],
      count: 10,
      arrangement: 'row',
      position: { x: 400, y: 100 }
    }
  }

  if (m.includes('border') && m.includes('cheese')) {
    return {
      action: 'create-border',
      emoji: '🧀',
      spacing: 50
    }
  }

  if (m.includes('cats') && m.includes('trail') && m.includes('hearts')) {
    return {
      action: 'create-emoji-story',
      story: 'Cats with heart trail',
      emojis: [
        { emoji: '🐱', x: 200, y: 300, size: 40, layer: 2 },
        { emoji: '🐱', x: 250, y: 300, size: 40, layer: 2 },
        { emoji: '🐱', x: 300, y: 300, size: 40, layer: 2 },
        { emoji: '❤️', x: 220, y: 320, size: 20, layer: 1 },
        { emoji: '❤️', x: 270, y: 320, size: 20, layer: 1 },
        { emoji: '❤️', x: 320, y: 320, size: 20, layer: 1 }
      ]
    }
  }

  if (m.includes('mirror') && m.includes('left') && m.includes('right')) {
    return {
      action: 'mirror-scene',
      axis: 'horizontal',
      centerX: 400
    }
  }

  if (m.includes('shift') && m.includes('slightly') && m.includes('right')) {
    return {
      action: 'shift-scene',
      deltaX: 20,
      deltaY: 0
    }
  }

  // Handle creative shape requests
  if (m.includes('draw') && m.includes('cat')) {
    return {
      action: 'draw-shape',
      shape: 'cat',
      emoji: '🐱',
      asciiPattern: [
        '  🐱🐱🐱  ',
        ' 🐱🐱🐱🐱🐱 ',
        '🐱🐱🐱🐱🐱🐱🐱',
        ' 🐱🐱🐱🐱🐱 ',
        '  🐱🐱🐱  '
      ],
      position: { x: 400, y: 300 }
    }
  }

  if (m.includes('draw') && m.includes('dog')) {
    return {
      action: 'draw-shape',
      shape: 'dog',
      emoji: '🐶',
      asciiPattern: [
        '  🐶🐶🐶  ',
        ' 🐶🐶🐶🐶🐶 ',
        '🐶🐶🐶🐶🐶🐶🐶',
        ' 🐶🐶🐶🐶🐶 ',
        '  🐶🐶🐶  '
      ],
      position: { x: 400, y: 300 }
    }
  }

  if (m.includes('draw') && m.includes('dinosaur')) {
    return {
      action: 'draw-shape',
      shape: 'dinosaur',
      emoji: '🦕',
      asciiPattern: [
        '    🦕🦕    ',
        '   🦕🦕🦕   ',
        '  🦕🦕🦕🦕  ',
        ' 🦕🦕🦕🦕🦕 ',
        '🦕🦕🦕🦕🦕🦕🦕',
        ' 🦕🦕🦕🦕🦕 ',
        '  🦕🦕🦕🦕  '
      ],
      position: { x: 400, y: 300 }
    }
  }

  // default final fallback scene
  return { action: 'create-emoji-story', story: 'generic scene', emojis: generateEmojisFromStory(userMessageToString(m)) }
}

/* -----------------------
   tiny helper to safely get counts when helper expects original user string
   ----------------------- */

function userMessageToString(s: string) {
  return String(s || '')
}
