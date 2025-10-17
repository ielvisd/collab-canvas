import { ref, computed, nextTick } from 'vue'
import { useShapesWithPersistence } from './useShapesWithPersistence'

export interface AICommand {
  action: string
  [key: string]: any
}

export interface AIAgentState {
  isProcessing: Ref<boolean>
  lastCommand: Ref<AICommand | null>
  error: Ref<string | null>
  isConnected: Ref<boolean>
}

export interface AIAgentActions {
  sendMessage: (message: string) => void
  executeCommand: (command: AICommand) => Promise<boolean>
  clearError: () => void
  reset: () => void
}

export const useAIAgent = () => {
  // Custom chat implementation since @ai-sdk/vue useChat has import issues
  const messages = ref<any[]>([])
  const input = ref('')
  const isLoading = ref(false)
  const isProcessing = ref(false)
  const error = ref<string | null>(null)
  const isConnected = ref(true)
  const lastCommand = ref<AICommand | null>(null)

  // Get shapes composable for canvas operations - now uses shared state
  const {
    rectangles,
    circles,
    texts,
    addRectangle,
    addCircle,
    addText,
    updateShape,
    deleteShape,
    clearAllShapes,
    getShapeById,
    getShapeByType
  } = useShapesWithPersistence()

  // Extract commands from AI message content
  const extractCommandsFromMessage = (content: string): AICommand[] => {
    console.log('🔍 Extracting commands from:', content)
    const commands: AICommand[] = []
    const seenCommands = new Set<string>() // Track seen commands to avoid duplicates
    
    // Look for JSON command objects in the message
    const jsonMatches = content.match(/\{[^}]*"action"[^}]*\}/g)
    console.log('🔍 JSON matches found:', jsonMatches)
    if (jsonMatches) {
      jsonMatches.forEach(match => {
        try {
          const command = JSON.parse(match)
          if (command.action) {
            const commandKey = JSON.stringify(command)
            if (!seenCommands.has(commandKey)) {
              console.log('✅ Parsed command:', command)
              commands.push(command)
              seenCommands.add(commandKey)
            }
          }
        } catch (e) {
          console.warn('Failed to parse command JSON:', match)
        }
      })
    }
    
    // Also look for commands in the new fallback format
    if (content.includes('Command:') && content.includes('{')) {
      console.log('🔍 Looking for fallback command format')
      // Find the start of the JSON object after "Command:"
      const commandStart = content.indexOf('Command:')
      const jsonStart = content.indexOf('{', commandStart)
      if (jsonStart !== -1) {
        // Find the matching closing brace
        let braceCount = 0
        let jsonEnd = jsonStart
        for (let i = jsonStart; i < content.length; i++) {
          if (content[i] === '{') braceCount++
          if (content[i] === '}') braceCount--
          if (braceCount === 0) {
            jsonEnd = i
            break
          }
        }
        
        if (jsonEnd > jsonStart) {
          const jsonString = content.substring(jsonStart, jsonEnd + 1)
          console.log('🔍 Extracted JSON string:', jsonString)
          try {
            const command = JSON.parse(jsonString)
            if (command.action) {
              const commandKey = JSON.stringify(command)
              if (!seenCommands.has(commandKey)) {
                console.log('✅ Parsed fallback command:', command)
                commands.push(command)
                seenCommands.add(commandKey)
              }
            }
          } catch (e) {
            console.warn('Failed to parse fallback command JSON:', jsonString)
          }
        }
      }
    }
    
    console.log('🔍 Final commands:', commands)
    return commands
  }

  // Execute a command on the canvas
  const executeCommand = async (command: AICommand): Promise<boolean> => {
    try {
      isProcessing.value = true
      lastCommand.value = command
      error.value = null

      console.log('🤖 Executing AI command:', command)

      switch (command.action) {
        case 'create-shape':
          return await handleCreateShape(command)
        
        case 'move-shape':
          return await handleMoveShape(command)
        
        case 'resize-shape':
          return await handleResizeShape(command)
        
        case 'delete-shape':
          return await handleDeleteShape(command)
        
        case 'get-shapes':
          return await handleGetShapes(command)
        
        case 'arrange-shapes':
          return await handleArrangeShapes(command)
        
        case 'clear-all':
          return await handleClearAll(command)
        
        default:
          console.warn('Unknown command action:', command.action)
          return false
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('Error executing AI command:', err)
      return false
    } finally {
      isProcessing.value = false
    }
  }

  // Handle shape creation
  const handleCreateShape = async (command: AICommand): Promise<boolean> => {
    const { shapeType, x, y, width, height, radius, text, fontSize, fill, stroke } = command
    
    console.log('🎨 Creating shape with command:', { shapeType, x, y, width, height, radius, fill, stroke })

    const options = {
      x: x || 100,
      y: y || 100,
      fill: fill || '#FF6B6B',
      stroke: stroke || '#000'
    }

    try {
      switch (shapeType) {
        case 'rectangle':
          const rectParams = {
            x: x || 100,
            y: y || 100,
            width: width || 100,
            height: height || 60,
            fill: fill || '#ff0000',
            stroke: stroke || '#000'
          }
          console.log('🔧 Rectangle parameters:', rectParams)
          await addRectangle(rectParams)
          console.log('🔍 Current rectangles array after creation:', rectangles.value.length)
          console.log('🔍 Rectangles data:', rectangles.value.map(r => ({ id: r.id, x: r.x, y: r.y, fill: r.fill })))
          break
        
        case 'circle':
          await addCircle({
            x: x || 100,
            y: y || 100,
            radius: radius || 50,
            fill: fill || '#0000ff',
            stroke: stroke || '#000'
          })
          console.log('🔍 Current circles array after creation:', circles.value.length)
          console.log('🔍 Circles data:', circles.value.map(c => ({ id: c.id, x: c.x, y: c.y, fill: c.fill })))
          break
        
        case 'text':
          await addText({
            x: x || 100,
            y: y || 100,
            text: text || 'AI Generated Text',
            fontSize: fontSize || 24,
            fill: fill || 'black',
            stroke: stroke || '#000'
          })
          break
        
        default:
          throw new Error(`Unknown shape type: ${shapeType}`)
      }
      
      console.log(`✅ Created ${shapeType} at (${x}, ${y})`)
      return true
    } catch (err) {
      console.error(`❌ Failed to create ${shapeType}:`, err)
      return false
    }
  }

  // Handle shape movement
  const handleMoveShape = async (command: AICommand): Promise<boolean> => {
    const { shapeId, x, y } = command

    if (!shapeId) {
      throw new Error('Shape ID is required for move command')
    }

    try {
      const success = await updateShape(shapeId, { x, y })
      if (success) {
        console.log(`✅ Moved shape ${shapeId} to (${x}, ${y})`)
      }
      return success
    } catch (err) {
      console.error(`❌ Failed to move shape ${shapeId}:`, err)
      return false
    }
  }

  // Handle shape resizing
  const handleResizeShape = async (command: AICommand): Promise<boolean> => {
    const { shapeId, width, height, radius } = command

    if (!shapeId) {
      throw new Error('Shape ID is required for resize command')
    }

    try {
      const shape = getShapeById(shapeId)
      if (!shape) {
        throw new Error(`Shape ${shapeId} not found`)
      }

      const updates: any = {}
      if (width !== undefined) updates.width = width
      if (height !== undefined) updates.height = height
      if (radius !== undefined) updates.radius = radius

      const success = await updateShape(shapeId, updates)
      if (success) {
        console.log(`✅ Resized shape ${shapeId}`)
      }
      return success
    } catch (err) {
      console.error(`❌ Failed to resize shape ${shapeId}:`, err)
      return false
    }
  }

  // Handle shape deletion
  const handleDeleteShape = async (command: AICommand): Promise<boolean> => {
    const { shapeId } = command

    if (!shapeId) {
      throw new Error('Shape ID is required for delete command')
    }

    try {
      const success = await deleteShape(shapeId)
      if (success) {
        console.log(`✅ Deleted shape ${shapeId}`)
      }
      return success
    } catch (err) {
      console.error(`❌ Failed to delete shape ${shapeId}:`, err)
      return false
    }
  }

  // Handle getting shape information
  const handleGetShapes = async (command: AICommand): Promise<boolean> => {
    const { shapeType = 'all' } = command

    try {
      let shapes: any[] = []
      
      if (shapeType === 'all' || shapeType === 'rectangle') {
        shapes = shapes.concat(rectangles.value.map(r => ({ ...r, type: 'rectangle' })))
      }
      if (shapeType === 'all' || shapeType === 'circle') {
        shapes = shapes.concat(circles.value.map(c => ({ ...c, type: 'circle' })))
      }
      if (shapeType === 'all' || shapeType === 'text') {
        shapes = shapes.concat(texts.value.map(t => ({ ...t, type: 'text' })))
      }

      console.log(`📊 Found ${shapes.length} shapes of type ${shapeType}:`, shapes)
      return true
    } catch (err) {
      console.error(`❌ Failed to get shapes:`, err)
      return false
    }
  }

  // Handle shape arrangement
  const handleArrangeShapes = async (command: AICommand): Promise<boolean> => {
    const { shapeIds, layout, spacing = 20 } = command

    if (!shapeIds || shapeIds.length === 0) {
      throw new Error('Shape IDs are required for arrange command')
    }

    try {
      const shapes = shapeIds.map((id: string) => getShapeById(id)).filter(Boolean)
      if (shapes.length === 0) {
        throw new Error('No valid shapes found for arrangement')
      }

      // Calculate positions based on layout
      let positions: { x: number, y: number }[] = []

      switch (layout) {
        case 'horizontal':
          positions = shapes.map((_: any, index: number) => ({
            x: 100 + index * (200 + spacing),
            y: 100
          }))
          break
        
        case 'vertical':
          positions = shapes.map((_: any, index: number) => ({
            x: 100,
            y: 100 + index * (100 + spacing)
          }))
          break
        
        case 'grid':
          const cols = Math.ceil(Math.sqrt(shapes.length))
          positions = shapes.map((_: any, index: number) => ({
            x: 100 + (index % cols) * (200 + spacing),
            y: 100 + Math.floor(index / cols) * (100 + spacing)
          }))
          break
        
        case 'circle':
          const centerX = 400
          const centerY = 300
          const radius = 150
          positions = shapes.map((_: any, index: number) => {
            const angle = (index / shapes.length) * 2 * Math.PI
            return {
              x: centerX + radius * Math.cos(angle),
              y: centerY + radius * Math.sin(angle)
            }
          })
          break
        
        default:
          throw new Error(`Unknown layout type: ${layout}`)
      }

      // Update shape positions
      for (let i = 0; i < shapes.length; i++) {
        const shape = shapes[i]
        const position = positions[i]
        if (position) {
          await updateShape(shape.id, { x: position.x, y: position.y })
        }
      }

      console.log(`✅ Arranged ${shapes.length} shapes in ${layout} layout`)
      return true
    } catch (err) {
      console.error(`❌ Failed to arrange shapes:`, err)
      return false
    }
  }

  // Handle clear all shapes command
  const handleClearAll = async (command: AICommand): Promise<boolean> => {
    try {
      await clearAllShapes()
      console.log('✅ Cleared all shapes from canvas')
      return true
    } catch (err) {
      console.error('❌ Failed to clear all shapes:', err)
      return false
    }
  }

  // Optimized sendMessage implementation with better error handling
  const sendMessage = async (message: string) => {
    if (!message.trim()) return

    // Add user message
    messages.value.push({
      id: Date.now().toString(),
      role: 'user',
      content: message
    })
    
    // Set loading state
    isLoading.value = true
    isProcessing.value = true
    error.value = null
    
    try {
      // Use $fetch for better Nuxt integration and error handling
      const response = await $fetch('/api/chat', {
        method: 'POST',
        body: { messages: messages.value }
      })
      
      // Handle streaming response
      let assistantMessage = ''
      if (typeof response === 'string') {
        assistantMessage = response
      } else if (response && typeof response === 'object' && 'content' in response) {
        assistantMessage = response.content as string
      }
      
      // Add assistant message
      messages.value.push({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantMessage
      })
      
      // Execute commands from the response
      const commands = extractCommandsFromMessage(assistantMessage)
      for (const command of commands) {
        await executeCommand(command)
      }
      
    } catch (err: any) {
      error.value = err.message || 'Failed to get AI response'
      
      // Add error message
      messages.value.push({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error.value}`
      })
    } finally {
      isLoading.value = false
      isProcessing.value = false
    }
  }

  // Handle form submission
  const handleSubmit = () => {
    if (input.value.trim()) {
      sendMessage(input.value)
      input.value = ''
    }
  }

  // Stop function (placeholder)
  const stop = () => {
    isLoading.value = false
    isProcessing.value = false
  }

  // Reload function (placeholder)
  const reload = () => {
    // Could implement retry logic here
    if (messages.value.length > 0) {
      const lastUserMessage = messages.value.filter(m => m.role === 'user').pop()
      if (lastUserMessage) {
        sendMessage(lastUserMessage.content)
      }
    }
  }

  // Clear error state
  const clearError = () => {
    error.value = null
  }

  // Reset AI agent state
  const reset = () => {
    messages.value = []
    input.value = ''
    error.value = null
    lastCommand.value = null
    isProcessing.value = false
    isLoading.value = false
  }

  // State
  const state: AIAgentState = {
    isProcessing,
    lastCommand,
    error,
    isConnected
  }

  // Actions
  const actions: AIAgentActions = {
    sendMessage,
    executeCommand,
    clearError,
    reset
  }

  return {
    ...state,
    ...actions,
    // Expose chat state
    messages,
    input,
    isLoading,
    stop,
    reload,
    handleSubmit,
    error
  }
}
