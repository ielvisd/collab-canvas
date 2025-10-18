// Removed unused imports - using hubAI() directly

export default defineEventHandler(async (event) => {
  const { messages } = await readBody(event)

  // Check if we're in fallback mode with better error handling
  let isFallbackMode = false
  try {
    // Try to use hubAI() - if this fails, we're in fallback mode
    const ai = hubAI()
    if (!ai) {
      throw new Error('hubAI() returned undefined')
    }
    isFallbackMode = false
  } catch (error) {
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('hubAI not available, using fallback. Run "npx nuxthub link" to enable real AI.', error)
    }
    isFallbackMode = true
  }

  // If in fallback mode, return a simple response
  if (isFallbackMode) {
    const userMessage = messages?.[messages.length - 1]?.content || ''
    console.log('🤖 Fallback API: Processing message:', userMessage)
    
    // Simple command parsing for fallback mode
    let command = null
    if (userMessage.toLowerCase().includes('rectangle')) {
      // Determine color based on message content
      let color = '#ff0000' // default red
      if (userMessage.toLowerCase().includes('pink')) color = '#ffc0cb'
      else if (userMessage.toLowerCase().includes('blue')) color = '#0000ff'
      else if (userMessage.toLowerCase().includes('green')) color = '#00ff00'
      else if (userMessage.toLowerCase().includes('yellow')) color = '#ffff00'
      else if (userMessage.toLowerCase().includes('purple')) color = '#800080'
      else if (userMessage.toLowerCase().includes('orange')) color = '#ffa500'
      
      command = {
        action: 'create-shape',
        shapeType: 'rectangle',
        x: 100,
        y: 200,
        width: 100,
        height: 80,
        fill: color
      }
    } else if (userMessage.toLowerCase().includes('pigs around') || userMessage.toLowerCase().includes('around a star') || userMessage.toLowerCase().includes('in a circle')) {
      // Handle circular arrangements like "5 pigs around a star"
      const centerX = 400
      const centerY = 300
      const radius = 120
      const numPigs = 5
      
      // Create star in center
      const emojis = [
        { emoji: '⭐', x: centerX, y: centerY, size: 60, layer: 1 } // Star in center
      ]
      
      // Add pigs in a circle around the star
      for (let i = 0; i < numPigs; i++) {
        const angle = (i / numPigs) * 2 * Math.PI
        const x = centerX + radius * Math.cos(angle)
        const y = centerY + radius * Math.sin(angle)
        emojis.push({
          emoji: '🐷',
          x: Math.round(x),
          y: Math.round(y),
          size: 40,
          layer: 2
        })
      }
      
      command = {
        action: 'create-emoji-story',
        story: '5 pigs around a star in a circle',
        emojis: emojis
      }
    } else if (userMessage.toLowerCase().includes('circle') && !userMessage.toLowerCase().includes('pigs') && !userMessage.toLowerCase().includes('around')) {
      // Determine color based on message content
      let color = '#0000ff' // default blue
      if (userMessage.toLowerCase().includes('pink')) color = '#ffc0cb'
      else if (userMessage.toLowerCase().includes('red')) color = '#ff0000'
      else if (userMessage.toLowerCase().includes('green')) color = '#00ff00'
      else if (userMessage.toLowerCase().includes('yellow')) color = '#ffff00'
      else if (userMessage.toLowerCase().includes('purple')) color = '#800080'
      else if (userMessage.toLowerCase().includes('orange')) color = '#ffa500'
      
      command = {
        action: 'create-shape',
        shapeType: 'circle',
        x: 200,
        y: 200,
        radius: 50,
        fill: color
      }
    } else if (userMessage.toLowerCase().includes('text') || userMessage.toLowerCase().includes('hello')) {
      command = {
        action: 'create-shape',
        shapeType: 'text',
        x: 300,
        y: 200,
        text: 'Hello World',
        fontSize: 24,
        fill: 'black'
      }
    } else if (userMessage.toLowerCase().includes('arrange') || userMessage.toLowerCase().includes('horizontal')) {
      command = {
        action: 'arrange-shapes',
        shapeIds: ['all'],
        layout: 'horizontal',
        spacing: 20
      }
    } else if (userMessage.toLowerCase().includes('clear') || 
               userMessage.toLowerCase().includes('delete all') || 
               userMessage.toLowerCase().includes('remove all') ||
               userMessage.toLowerCase().includes('delete all emojis') ||
               userMessage.toLowerCase().includes('delete all shapes')) {
      command = {
        action: 'clear-all'
      }
    } else if (userMessage.toLowerCase().includes('three little pigs') || userMessage.toLowerCase().includes('pigs on island')) {
      // Emoji story example: Three little pigs on an island
      command = {
        action: 'create-emoji-story',
        story: 'Three little pigs on an island',
        emojis: [
          { emoji: '🏝️', x: 300, y: 200, size: 80, layer: 1 }, // Island (background)
          { emoji: '🐷', x: 280, y: 180, size: 40, layer: 2 }, // Pig 1
          { emoji: '🐷', x: 320, y: 180, size: 40, layer: 2 }, // Pig 2
          { emoji: '🐷', x: 300, y: 160, size: 40, layer: 2 }, // Pig 3
        ]
      }
    } else if (userMessage.toLowerCase().includes('in a triangle') || userMessage.toLowerCase().includes('triangle')) {
      // Handle triangular arrangements
      const centerX = 400
      const centerY = 300
      const radius = 100
      const count = userMessage.match(/\d+/)?.[0] ? parseInt(userMessage.match(/\d+/)[0]) : 3
      const emoji = userMessage.includes('heart') ? '❤️' : userMessage.includes('star') ? '⭐' : '🐷'
      
      const emojis = []
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * 2 * Math.PI
        const x = centerX + radius * Math.cos(angle)
        const y = centerY + radius * Math.sin(angle)
        emojis.push({
          emoji: emoji,
          x: Math.round(x),
          y: Math.round(y),
          size: 40,
          layer: 2
        })
      }
      
      command = {
        action: 'create-emoji-story',
        story: `${count} ${emoji} in a triangle`,
        emojis: emojis
      }
    } else if (userMessage.toLowerCase().includes('in a square') || userMessage.toLowerCase().includes('square')) {
      // Handle square arrangements
      const centerX = 400
      const centerY = 300
      const radius = 100
      const count = Math.min(userMessage.match(/\d+/)?.[0] ? parseInt(userMessage.match(/\d+/)[0]) : 4, 4)
      const emoji = userMessage.includes('heart') ? '❤️' : userMessage.includes('star') ? '⭐' : '🐷'
      
      const emojis = []
      for (let i = 0; i < count; i++) {
        let x, y
        if (i === 0) { x = centerX - radius; y = centerY - radius }
        else if (i === 1) { x = centerX + radius; y = centerY - radius }
        else if (i === 2) { x = centerX + radius; y = centerY + radius }
        else { x = centerX - radius; y = centerY + radius }
        
        emojis.push({
          emoji: emoji,
          x: x,
          y: y,
          size: 40,
          layer: 2
        })
      }
      
      command = {
        action: 'create-emoji-story',
        story: `${count} ${emoji} in a square`,
        emojis: emojis
      }
    } else if (userMessage.toLowerCase().includes('house with tree') || userMessage.toLowerCase().includes('house and tree')) {
      // Specific pattern for house with tree
      command = {
        action: 'create-emoji-story',
        story: 'A house with a tree next to it',
        emojis: [
          { emoji: '🏠', x: 300, y: 200, size: 60, layer: 1 }, // House
          { emoji: '🌳', x: 400, y: 200, size: 50, layer: 2 }  // Tree next to house
        ]
      }
    } else if (userMessage.toLowerCase().includes('story') || userMessage.toLowerCase().includes('scene') || userMessage.toLowerCase().includes('characters')) {
      // Generic emoji story creation for any story request
      const storyKeywords = userMessage.toLowerCase()
      let emojis = []
      
      if (storyKeywords.includes('island') || storyKeywords.includes('beach')) {
        emojis.push({ emoji: '🏝️', x: 300, y: 200, size: 80, layer: 1 })
        if (storyKeywords.includes('pig') || storyKeywords.includes('pigs')) {
          emojis.push({ emoji: '🐷', x: 280, y: 180, size: 40, layer: 2 })
          emojis.push({ emoji: '🐷', x: 320, y: 180, size: 40, layer: 2 })
          emojis.push({ emoji: '🐷', x: 300, y: 160, size: 40, layer: 2 })
        }
      } else if (storyKeywords.includes('house') || storyKeywords.includes('home')) {
        emojis.push({ emoji: '🏠', x: 300, y: 200, size: 60, layer: 1 })
        if (storyKeywords.includes('tree')) {
          emojis.push({ emoji: '🌳', x: 400, y: 200, size: 50, layer: 2 })
        }
      } else if (storyKeywords.includes('ocean') || storyKeywords.includes('sea')) {
        emojis.push({ emoji: '🌊', x: 300, y: 200, size: 60, layer: 1 })
        if (storyKeywords.includes('fish')) {
          emojis.push({ emoji: '🐟', x: 280, y: 180, size: 30, layer: 2 })
          emojis.push({ emoji: '🐠', x: 320, y: 190, size: 30, layer: 2 })
        }
      } else if (storyKeywords.includes('space') || storyKeywords.includes('rocket')) {
        emojis.push({ emoji: '🚀', x: 300, y: 200, size: 60, layer: 1 })
        emojis.push({ emoji: '🌍', x: 400, y: 150, size: 40, layer: 2 })
        emojis.push({ emoji: '⭐', x: 200, y: 100, size: 20, layer: 3 })
        emojis.push({ emoji: '⭐', x: 450, y: 120, size: 20, layer: 3 })
      } else {
        // Default story with some generic elements
        emojis = [
          { emoji: '🎭', x: 300, y: 200, size: 60, layer: 1 },
          { emoji: '✨', x: 280, y: 180, size: 30, layer: 2 },
          { emoji: '✨', x: 320, y: 180, size: 30, layer: 2 }
        ]
      }
      
      if (emojis.length > 0) {
        command = {
          action: 'create-emoji-story',
          story: userMessage,
          emojis: emojis
        }
      }
    } else if (userMessage.toLowerCase().includes('emoji') || userMessage.toLowerCase().includes('smile')) {
      command = {
        action: 'create-shape',
        shapeType: 'emoji',
        x: 200,
        y: 200,
        emoji: '😊',
        emojiSize: 48,
        layer: 1
      }
    }
    
    console.log('🤖 Fallback API: Generated command:', command)
    
    // Return a simple JSON response for fallback mode
    const response = `AI response (fallback mode - run npx nuxthub link to enable real AI)\n\nCommand: ${command ? JSON.stringify(command) : 'No command generated'}`
    
    return {
      content: response
    }
  }

  // Real AI mode - use hubAI() directly
  const ai = hubAI()
  
  // Use hubAI().run() directly as per NuxtHub documentation
  const response = await ai.run('@cf/meta/llama-3.1-8b-instruct' as any, {
    messages: [
      {
        role: 'system',
        content: `You are an AI assistant that helps create visual stories on a collaborative canvas. 

IMPORTANT: When users ask for stories, characters, scenes, or visual content, ALWAYS use the createEmojiStory tool instead of individual createShape commands. This creates better visual compositions.

For DELETE/CLEAR requests:
- When users ask to "delete all", "clear all", "remove all", "delete all emojis", or "delete all shapes", use the clearAllShapes tool
- NEVER create empty shapes or malformed commands for delete requests

For story creation with createEmojiStory:
- Use large emojis (size 60-80) for main elements like islands, houses, backgrounds
- Use medium emojis (size 40-50) for characters and important objects  
- Use small emojis (size 20-30) for details and decorations
- Arrange emojis in layers (background elements on layer 1, characters on layer 2, details on layer 3+)
- Position emojis to create meaningful compositions

For geometric arrangements, use arrangeEmojisInShape:
- "5 pigs around a star" → Use arrangeEmojisInShape with emoji: '🐷', count: 5, shape: 'circle', then add star in center
- "3 hearts in a triangle" → Use arrangeEmojisInShape with emoji: '❤️', count: 3, shape: 'triangle'
- "4 stars in a square" → Use arrangeEmojisInShape with emoji: '⭐', count: 4, shape: 'square'
- "6 flowers in a circle" → Use arrangeEmojisInShape with emoji: '🌸', count: 6, shape: 'circle'

Examples:
- "Three little pigs on an island" → Use createEmojiStory with: large island emoji (🏝️) at center, 3 pig emojis (🐷) positioned on top
- "5 pigs around a star" → Use arrangeEmojisInShape for pigs in circle, then add star in center
- "A house with a tree" → Use createEmojiStory with: house emoji (🏠) and tree emoji (🌳) positioned side by side
- "Ocean scene" → Use createEmojiStory with: wave emojis (🌊), fish emojis (🐟), and boat emoji (⛵)
- "Delete all emojis and shapes" → Use clearAllShapes tool

NEVER use individual createShape commands for stories. Always use createEmojiStory or arrangeEmojisInShape for visual storytelling.`
      },
      ...messages
    ],
    tools: [
      {
        name: 'createShape',
        description: 'Create a new shape on the canvas. For stories and visual content, ALWAYS prefer emoji shapes over text shapes.',
        parameters: {
          type: 'object',
          properties: {
            shapeType: {
              type: 'string',
              enum: ['rectangle', 'circle', 'text', 'emoji', 'pen'],
              description: 'Type of shape to create. Use "emoji" for visual stories and characters.'
            },
            x: { type: 'number', description: 'X position of the shape' },
            y: { type: 'number', description: 'Y position of the shape' },
            width: { type: 'number', description: 'Width of the shape (for rectangles)' },
            height: { type: 'number', description: 'Height of the shape (for rectangles)' },
            radius: { type: 'number', description: 'Radius of the shape (for circles)' },
            text: { type: 'string', description: 'Text content (for text shapes) - avoid for stories' },
            fontSize: { type: 'number', description: 'Font size (for text shapes)' },
            fill: { type: 'string', description: 'Fill color of the shape' },
            stroke: { type: 'string', description: 'Stroke color of the shape' },
            emoji: { type: 'string', description: 'Emoji character (for emoji shapes) - use for stories' },
            emojiSize: { type: 'number', description: 'Size of the emoji (60-80 for backgrounds, 40-50 for characters, 20-30 for details)' },
            layer: { type: 'number', description: 'Layer order (1 for backgrounds, 2 for characters, 3+ for details)' }
          },
          required: ['shapeType', 'x', 'y']
        },
        function: async ({ shapeType, x, y, width, height, radius, text, fontSize, fill, stroke, emoji, emojiSize, layer }: {
          shapeType: string;
          x?: number;
          y?: number;
          width?: number;
          height?: number;
          radius?: number;
          text?: string;
          fontSize?: number;
          fill?: string;
          stroke?: string;
          emoji?: string;
          emojiSize?: number;
          layer?: number;
        }) => {
          return JSON.stringify({
            action: 'create-shape',
            shapeType,
            x,
            y,
            width,
            height,
            radius,
            text,
            fontSize,
            fill,
            stroke,
            emoji,
            emojiSize,
            layer
          })
        }
      },
      {
        name: 'createEmojiStory',
        description: 'Create a complete emoji story with multiple emojis arranged to tell a visual story. Use this for story requests.',
        parameters: {
          type: 'object',
          properties: {
            story: { type: 'string', description: 'Description of the story being created' },
            emojis: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  emoji: { type: 'string', description: 'Emoji character' },
                  x: { type: 'number', description: 'X position' },
                  y: { type: 'number', description: 'Y position' },
                  size: { type: 'number', description: 'Size of emoji (60-80 for backgrounds, 40-50 for characters)' },
                  layer: { type: 'number', description: 'Layer order (1 for backgrounds, 2 for characters)' }
                },
                required: ['emoji', 'x', 'y']
              },
              description: 'Array of emojis to create for the story'
            }
          },
          required: ['story', 'emojis']
        },
        function: async ({ story, emojis }: Record<string, unknown>) => {
          return JSON.stringify({
            action: 'create-emoji-story',
            story,
            emojis
          })
        }
      },
      {
        name: 'arrangeEmojisInShape',
        description: 'Arrange multiple emojis in geometric patterns like circles, triangles, squares, etc. Use this when users want emojis arranged in specific shapes.',
        parameters: {
          type: 'object',
          properties: {
            emoji: { type: 'string', description: 'The emoji character to arrange' },
            count: { type: 'number', description: 'Number of emojis to create' },
            shape: { 
              type: 'string', 
              enum: ['circle', 'triangle', 'square', 'line', 'diamond', 'heart'],
              description: 'Geometric shape to arrange emojis in'
            },
            centerX: { type: 'number', description: 'X coordinate of the center point', default: 400 },
            centerY: { type: 'number', description: 'Y coordinate of the center point', default: 300 },
            radius: { type: 'number', description: 'Radius or size of the shape', default: 120 },
            size: { type: 'number', description: 'Size of each emoji', default: 40 },
            layer: { type: 'number', description: 'Layer order', default: 2 }
          },
          required: ['emoji', 'count', 'shape']
        },
        function: async ({ emoji, count, shape, centerX = 400, centerY = 300, radius = 120, size = 40, layer = 2 }: Record<string, unknown>) => {
          const emojis = []
          
          // Type assertions for the parameters
          const emojiStr = emoji as string
          const countNum = count as number
          const shapeStr = shape as string
          const centerXNum = centerX as number
          const centerYNum = centerY as number
          const radiusNum = radius as number
          const sizeNum = size as number
          const layerNum = layer as number
          
          for (let i = 0; i < countNum; i++) {
            let x, y
            
            switch (shapeStr) {
              case 'circle':
                const angle = (i / countNum) * 2 * Math.PI
                x = centerXNum + radiusNum * Math.cos(angle)
                y = centerYNum + radiusNum * Math.sin(angle)
                break
                
              case 'triangle':
                const triAngle = (i / countNum) * 2 * Math.PI
                x = centerXNum + radiusNum * Math.cos(triAngle)
                y = centerYNum + radiusNum * Math.sin(triAngle)
                break
                
              case 'square':
                const side = Math.floor(i / 4)
                const pos = i % 4
                if (pos === 0) { x = centerXNum - radiusNum; y = centerYNum - radiusNum }
                else if (pos === 1) { x = centerXNum + radiusNum; y = centerYNum - radiusNum }
                else if (pos === 2) { x = centerXNum + radiusNum; y = centerYNum + radiusNum }
                else { x = centerXNum - radiusNum; y = centerYNum + radiusNum }
                break
                
              case 'line':
                x = centerXNum + (i - Math.floor(countNum/2)) * (radiusNum / 2)
                y = centerYNum
                break
                
              case 'diamond':
                const diamondAngle = (i / countNum) * 2 * Math.PI + Math.PI/4
                x = centerXNum + radiusNum * Math.cos(diamondAngle)
                y = centerYNum + radiusNum * Math.sin(diamondAngle)
                break
                
              case 'heart':
                // Heart shape approximation
                const heartAngle = (i / countNum) * 2 * Math.PI
                x = centerXNum + radiusNum * Math.cos(heartAngle) * 0.8
                y = centerYNum + radiusNum * Math.sin(heartAngle) * 0.6 - Math.abs(Math.cos(heartAngle)) * radiusNum * 0.3
                break
                
              default:
                x = centerXNum + (i * 50)
                y = centerYNum
            }
            
            emojis.push({
              emoji: emojiStr,
              x: Math.round(x),
              y: Math.round(y),
              size: sizeNum,
              layer: layerNum
            })
          }
          
          return JSON.stringify({
            action: 'create-emoji-story',
            story: `${countNum} ${emojiStr} arranged in a ${shapeStr}`,
            emojis
          })
        }
      },
      {
        name: 'clearAllShapes',
        description: 'Clear all shapes and emojis from the canvas. Use this when users want to delete everything.',
        parameters: {
          type: 'object',
          properties: {},
          required: []
        },
        function: async () => {
          return JSON.stringify({
            action: 'clear-all'
          })
        }
      }
    ]
  })

  // Handle the response structure from hubAI()
  if (response && typeof response === 'object' && 'tool_calls' in response) {
    // Extract tool calls and convert to our command format
    const toolCalls = response.tool_calls || []
    const commands = toolCalls.map((toolCall: Record<string, unknown>) => {
      console.log('🔧 Processing tool call:', toolCall.name, 'with args:', toolCall.arguments)
      if (toolCall.name === 'createShape') {
        return {
          action: 'create-shape',
          ...(toolCall.arguments as Record<string, unknown>)
        }
      } else if (toolCall.name === 'createEmojiStory') {
        const args = toolCall.arguments as Record<string, unknown>
        console.log('🔍 createEmojiStory args:', JSON.stringify(args, null, 2))
        let emojis = args.emojis
        if (typeof emojis === 'string') {
          try {
            emojis = JSON.parse(emojis)
          } catch (e) {
            console.error('Failed to parse emojis JSON:', emojis)
            emojis = []
          }
        }
        console.log('🔍 Processed emojis:', emojis)
        return {
          action: 'create-emoji-story',
          story: args.story,
          emojis: emojis
        }
      } else if (toolCall.name === 'arrangeEmojisInShape') {
        const args = toolCall.arguments as Record<string, unknown>
        let emojis = args.emojis
        if (typeof emojis === 'string') {
          try {
            emojis = JSON.parse(emojis)
          } catch (e) {
            console.error('Failed to parse emojis JSON:', emojis)
            emojis = []
          }
        }
        return {
          action: 'create-emoji-story',
          story: args.story,
          emojis: emojis
        }
      } else if (toolCall.name === 'clearAllShapes') {
        return {
          action: 'clear-all'
        }
      }
      // Add other tool types as needed
      return {
        action: toolCall.name as string,
        ...(toolCall.arguments as Record<string, unknown>)
      }
    })

    return {
      content: `AI Response: ${response.response || 'Command executed'}`,
      commands: commands
    }
  }

  return {
    content: response
  }
})



