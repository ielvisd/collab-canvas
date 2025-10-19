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
const POSITIONS: Record<string, { x: number; y: number }> = {
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
  if (!keyword) return 40
  if (typeof keyword === 'number') return keyword
  const s = String(keyword).toLowerCase()
  if (s.includes('tiny')) return 20
  if (s.includes('small')) return 30
  if (s.includes('medium')) return 50
  if (s.includes('big') || s.includes('large')) return 80
  if (s.includes('huge') || s.includes('giant')) return 100
  return 40
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
      content: `AI response (fallback)`,
      commands: cmd ? [cmd] : []
    }
  }

  // Real AI path
  const systemPrompt = createSystemPrompt()
  const response = await ai.run('@cf/meta/llama-3.1-8b-instruct' as any, {
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
    tools: buildToolSpecs()
  })

  // Normalize hubAI response
  const commands = await parseAIResponse(response)
  return {
    content: (response as any).response || 'AI executed',
    commands
  }
})

/* -----------------------
   Small helpers used by handler
   ----------------------- */

function createSystemPrompt() {
  return `You are an expert emoji scene designer for a collaborative canvas (800x600). Focus on creative, spatially-aware composition. Use provided tools to output commands (createEmojiStory, arrangeEmojisInShape, createShape, clearAllShapes). Always populate emoji arrays with actual emoji characters and pixel coordinates; prefer emojis to text. Position keywords: upper-left (100,100), upper-right (600,100), lower-left (100,450), lower-right (600,450), center (400,300). Size keywords: tiny (20), small (30), medium (50), big/large (80), huge (100). For multi-part requests, favor varied sizes and layers for depth. Never return empty tool calls.`
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
    }
  ]
}

/* -----------------------
   Parse AI response into commands (concise, robust)
   ----------------------- */

async function parseAIResponse(response: any) {
  const commands: Array<Record<string, unknown>> = []

  if (response && typeof response === 'object' && Array.isArray(response.tool_calls) && response.tool_calls.length) {
    for (const call of response.tool_calls) {
      const name = call.name
      const args = call.arguments ?? {}
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
      } else {
        // passthrough
        commands.push({ action: name, ...(args || {}) })
      }
    }
    return commands
  }

  // If content-based response, try to extract JSON tool calls
  if (response && typeof response === 'object' && typeof response.content === 'string') {
    const content = response.content as string
    const jsons: string[] = []
    let i = content.indexOf('{')
    while (i >= 0) {
      let braces = 0
      const start = i
      let j = i
      for (; j < content.length; j++) {
        if (content[j] === '{') braces++
        if (content[j] === '}') braces--
        if (braces === 0) break
      }
      if (braces === 0 && j > start) {
        jsons.push(content.substring(start, j + 1))
        i = content.indexOf('{', j + 1)
      } else break
    }

    for (const jstr of jsons) {
      try {
        const parsed = JSON.parse(jstr)
        if (parsed.name === 'createEmojiStory') {
          let emojis = parsed.arguments?.emojis ?? []
          if (typeof emojis === 'string') {
            try { emojis = JSON.parse(emojis) } catch { emojis = [] }
          }
          if (!Array.isArray(emojis) || emojis.length === 0) emojis = generateEmojisFromStory(String(parsed.arguments?.story || ''))
          commands.push({ action: 'create-emoji-story', story: parsed.arguments?.story, emojis })
        } else if (parsed.name === 'createShape') {
          commands.push({ action: 'create-shape', ...(parsed.arguments || {}) })
        } else if (parsed.name === 'arrangeEmojisInShape') {
          let emojis = parsed.arguments?.emojis ?? []
          if (typeof emojis === 'string') {
            try { emojis = JSON.parse(emojis) } catch { emojis = [] }
          }
          if (!Array.isArray(emojis) || emojis.length === 0) {
            const args = parsed.arguments || {}
            emojis = arrangeInShape(String(args.emoji), Number(args.count), String(args.shape), Number(args.centerX ?? CANVAS.centerX), Number(args.centerY ?? CANVAS.centerY), Number(args.radius ?? 120), Number(args.size ?? 40), Number(args.layer ?? 2))
          }
          commands.push({ action: 'create-emoji-story', story: `${parsed.arguments?.count} ${parsed.arguments?.emoji} arranged in a ${parsed.arguments?.shape}`, emojis })
        } else if (parsed.name === 'clearAllShapes') {
          commands.push({ action: 'clear-all' })
        } else {
          commands.push({ action: parsed.name, ...(parsed.arguments || {}) })
        }
      } catch {
        // ignore parse failures silently
      }
    }

    if (commands.length) return commands
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

  // default final fallback scene
  return { action: 'create-emoji-story', story: 'generic scene', emojis: generateEmojisFromStory(userMessageToString(m)) }
}

/* -----------------------
   tiny helper to safely get counts when helper expects original user string
   ----------------------- */

function userMessageToString(s: string) {
  return String(s || '')
}
