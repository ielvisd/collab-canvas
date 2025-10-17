import { streamText } from 'ai'
import { createWorkersAI } from 'workers-ai-provider'
import { z } from 'zod'

// Type declaration for hubAI() server composable
declare function hubAI(): any

export default defineEventHandler(async (event) => {
  const { messages } = await readBody(event)

  // Check if we're in fallback mode with better error handling
  let isFallbackMode = false
  try {
    // Try to use hubAI() - if this fails, we're in fallback mode
    const ai = hubAI()
    isFallbackMode = false
  } catch (error) {
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('hubAI not available, using fallback. Run "npx nuxthub link" to enable real AI.')
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
    } else if (userMessage.toLowerCase().includes('circle')) {
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
    } else if (userMessage.toLowerCase().includes('clear') || userMessage.toLowerCase().includes('delete all')) {
      command = {
        action: 'clear-all'
      }
    }
    
    console.log('🤖 Fallback API: Generated command:', command)
    
    // Return a simple JSON response for fallback mode
    const response = `AI response (fallback mode - run npx nuxthub link to enable real AI)\n\nCommand: ${command ? JSON.stringify(command) : 'No command generated'}`
    
    return {
      content: response
    }
  }

  // Real AI mode - use hubAI()
  const workersAI = createWorkersAI({ binding: hubAI() })

  return streamText({
    model: workersAI('@cf/meta/llama-3.1-8b-instruct'),
    messages,
    tools: {
      createShape: {
        description: 'Create a new shape on the canvas',
        inputSchema: z.object({
          shapeType: z.enum(['rectangle', 'circle', 'text']),
          x: z.number().describe('X position of the shape'),
          y: z.number().describe('Y position of the shape'),
          width: z.number().optional().describe('Width of the shape (for rectangles)'),
          height: z.number().optional().describe('Height of the shape (for rectangles)'),
          radius: z.number().optional().describe('Radius of the shape (for circles)'),
          text: z.string().optional().describe('Text content (for text shapes)'),
          fontSize: z.number().optional().describe('Font size (for text shapes)'),
          fill: z.string().optional().describe('Fill color of the shape'),
          stroke: z.string().optional().describe('Stroke color of the shape')
        }),
        execute: async ({ shapeType, x, y, width, height, radius, text, fontSize, fill, stroke }) => {
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
            stroke
          })
        }
      },
      moveShape: {
        description: 'Move a shape to a new position',
        inputSchema: z.object({
          shapeId: z.string().describe('ID of the shape to move'),
          x: z.number().describe('New X position'),
          y: z.number().describe('New Y position')
        }),
        execute: async ({ shapeId, x, y }) => {
          return JSON.stringify({
            action: 'move-shape',
            shapeId,
            x,
            y
          })
        }
      },
      resizeShape: {
        description: 'Resize a shape',
        inputSchema: z.object({
          shapeId: z.string().describe('ID of the shape to resize'),
          width: z.number().optional().describe('New width (for rectangles)'),
          height: z.number().optional().describe('New height (for rectangles)'),
          radius: z.number().optional().describe('New radius (for circles)')
        }),
        execute: async ({ shapeId, width, height, radius }) => {
          return JSON.stringify({
            action: 'resize-shape',
            shapeId,
            width,
            height,
            radius
          })
        }
      },
      deleteShape: {
        description: 'Delete a shape from the canvas',
        inputSchema: z.object({
          shapeId: z.string().describe('ID of the shape to delete')
        }),
        execute: async ({ shapeId }) => {
          return JSON.stringify({
            action: 'delete-shape',
            shapeId
          })
        }
      },
      getShapes: {
        description: 'Get information about all shapes on the canvas',
        inputSchema: z.object({
          shapeType: z.enum(['rectangle', 'circle', 'text', 'all']).optional().describe('Type of shapes to get information about')
        }),
        execute: async ({ shapeType = 'all' }) => {
          return JSON.stringify({
            action: 'get-shapes',
            shapeType
          })
        }
      },
      arrangeShapes: {
        description: 'Arrange multiple shapes in a specific layout',
        inputSchema: z.object({
          shapeIds: z.array(z.string()).describe('Array of shape IDs to arrange'),
          layout: z.enum(['horizontal', 'vertical', 'grid', 'circle']).describe('Layout type for arrangement'),
          spacing: z.number().optional().describe('Spacing between shapes')
        }),
        execute: async ({ shapeIds, layout, spacing = 20 }) => {
          return JSON.stringify({
            action: 'arrange-shapes',
            shapeIds,
            layout,
            spacing
          })
        }
      }
    }
  }).toTextStreamResponse()
})
