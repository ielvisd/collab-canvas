import { ref } from 'vue'
import { useShapesWithPersistence } from './useShapesWithPersistence'
import { useEmojis } from './useEmojis'
import { 
  wordToNumber, 
  parseSize, 
  parseCanvasPosition, 
  parseMultipleItems, 
  extractCount, 
  extractSize, 
  extractPosition, 
  extractEmojiType,
  parseMovementCommand,
  parseRotationCommand,
  generateRowPositions,
  generateColumnPositions,
  generateBorderPositions,
  generateAlternatingPattern,
  generateTrail,
  type CanvasPosition,
  type EmojiItem,
  type MultipleItemsResult
} from '~/utils/aiHelpers'
import { generateWordPositions, generateVerticalWordPositions } from '~/utils/letterPatterns'

// Utility function for random colors
const getRandomColor = () => {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8']
  return colors[Math.floor(Math.random() * colors.length)]
}

export interface AICommand {
  action: string
  [key: string]: unknown
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
  const messages = ref<Array<{ id: string; role: string; content: string }>>([])
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
    getShapeById
  } = useShapesWithPersistence()

  // Extract commands from AI message content
  const extractCommandsFromMessage = (content: string): AICommand[] => {
    // console.log('🔍 Extracting commands from:', content)
    
    // Ensure content is a string
    if (typeof content !== 'string') {
      console.warn('⚠️ Content is not a string:', typeof content, content)
      return []
    }
    
    const commands: AICommand[] = []
    const seenCommands = new Set<string>() // Track seen commands to avoid duplicates
    
    // Look for JSON command objects in the message using a more robust approach
    // First try to find complete JSON objects by looking for balanced braces
    const jsonMatches = []
    let start = content.indexOf('{')
    while (start !== -1) {
      let braceCount = 0
      let end = start
      for (let i = start; i < content.length; i++) {
        if (content[i] === '{') braceCount++
        if (content[i] === '}') braceCount--
        if (braceCount === 0) {
          end = i
          break
        }
      }
      if (end > start) {
        const jsonStr = content.substring(start, end + 1)
        if (jsonStr.includes('"action"') || jsonStr.includes('"name"')) {
          jsonMatches.push(jsonStr)
        }
      }
      start = content.indexOf('{', end + 1)
    }
    
    console.log('🔍 JSON matches found:', jsonMatches)
    if (jsonMatches.length > 0) {
      jsonMatches.forEach(match => {
        try {
          const command = JSON.parse(match)
          // Handle both "action" and "name" formats
          const action = command.action || command.name
          if (action) {
            // Convert "name" format to "action" format
            if (command.name) {
              command.action = command.name
              delete command.name
            }
            const commandKey = JSON.stringify(command)
            if (!seenCommands.has(commandKey)) {
              console.log('✅ Parsed command:', command)
              commands.push(command)
              seenCommands.add(commandKey)
            }
          }
        } catch (e) {
          console.warn('Failed to parse command JSON:', match, e)
        }
      })
    }
    
    // Also handle semicolon-separated commands
    if (content.includes(';')) {
      console.log('🔍 Looking for semicolon-separated commands')
      const semicolonCommands = content.split(';').map(s => s.trim()).filter(s => s.startsWith('{'))
      semicolonCommands.forEach(match => {
        try {
          const command = JSON.parse(match)
          const action = command.action || command.name
          if (action) {
            if (command.name) {
              command.action = command.name
              delete command.name
            }
            const commandKey = JSON.stringify(command)
            if (!seenCommands.has(commandKey)) {
              console.log('✅ Parsed semicolon command:', command)
              commands.push(command)
              seenCommands.add(commandKey)
            }
          }
        } catch {
          console.warn('Failed to parse semicolon command JSON:', match)
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
          } catch {
            console.warn('Failed to parse fallback command JSON:', jsonString)
          }
        }
      }
    }
    
    // console.log('🔍 Final commands:', commands)
    return commands
  }

  // Execute a command on the canvas
  const executeCommand = async (command: AICommand): Promise<boolean> => {
    try {
      isProcessing.value = true
      lastCommand.value = command
      error.value = null

      console.log('🤖 Executing AI command:', command)
      console.log('🔍 Command action:', command.action)
      console.log('🔍 Command keys:', Object.keys(command))

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
        
        case 'create-emoji-story':
          return await handleCreateEmojiStory(command)
        
        case 'move-emojis':
          return await handleMoveEmojis(command)
        
        case 'rotate-emojis':
          return await handleRotateEmojis(command)
        
        case 'move-all-emojis':
          return await handleMoveAllEmojis(command)
        
        case 'create-border':
          return await handleCreateBorder(command)
        
        case 'create-alternating-pattern':
          return await handleCreateAlternatingPattern(command)
        
        case 'spell-word':
          console.log('🔤 Handling spell-word command:', command)
          return await handleSpellWord(command)
        
        case 'shift-scene':
          return await handleShiftScene(command)
        
        case 'mirror-scene':
          return await handleMirrorScene(command)
        
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
    const { shapeType, x, y, width, height, radius, text, fontSize, fill, stroke, emoji, emojiSize, layer } = command as unknown as {
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
    }
    
    console.log('🔧 Raw command received in handleCreateShape:', JSON.stringify(command, null, 2))
    console.log('🎨 Creating shape with command:', { shapeType, x, y, width, height, radius, fill, stroke, emoji, emojiSize })

    // Validate that we have meaningful values for shape creation
    const isEmptyCommand = !shapeType || 
      (x === 0 && y === 0 && width === 0 && height === 0 && radius === 0) ||
      (shapeType === 'emoji' && (!emoji || emojiSize === 0)) ||
      (shapeType === 'text' && !text)

    if (isEmptyCommand) {
      console.warn('⚠️ Skipping empty or malformed shape creation command:', command)
      return false
    }

    try {
      switch (shapeType) {
        case 'rectangle': {
          const rectParams = {
            x: x !== undefined ? x : 100,
            y: y !== undefined ? y : 100,
            width: width || 100,
            height: height || 60,
            fill: fill || getRandomColor(),
            stroke: stroke || '#000'
          }
          console.log('🔧 Rectangle parameters:', rectParams)
          await addRectangle(rectParams)
          console.log('🔍 Current rectangles array after creation:', rectangles.value.length)
          console.log('🔍 Rectangles data:', rectangles.value.map(r => ({ id: r.id, x: r.x, y: r.y, fill: r.fill })))
          break
        }
        
        case 'circle': {
          await addCircle({
            x: x !== undefined ? x : 100,
            y: y !== undefined ? y : 100,
            radius: radius || 50,
            fill: fill || getRandomColor(),
            stroke: stroke || '#000'
          })
          console.log('🔍 Current circles array after creation:', circles.value.length)
          console.log('🔍 Circles data:', circles.value.map(c => ({ id: c.id, x: c.x, y: c.y, fill: c.fill })))
          break
        }
        
        case 'text': {
          await addText({
            x: x !== undefined ? x : 100,
            y: y !== undefined ? y : 100,
            text: text || 'AI Generated Text',
            fontSize: fontSize || 24,
            fill: fill || getRandomColor(),
            stroke: stroke || '#000'
          })
          break
        }
        
        case 'emoji': {
          // Skip creating emoji if all values are empty/zero (likely a malformed command)
          if (!emoji || emojiSize === 0 || (x === 0 && y === 0 && width === 0 && height === 0)) {
            console.warn('⚠️ Skipping empty emoji shape creation - likely malformed command')
            return false
          }
          
          // For emoji shapes, we need to use the emoji composable
          console.log('🎨 Creating emoji shape:', { emoji, x, y, size: emojiSize, layer })
          const { addEmoji } = useEmojis()
          await addEmoji({
            x: x !== undefined ? x : 100,
            y: y !== undefined ? y : 100,
            emoji: emoji || '😊',
            size: emojiSize || 48,
            layer: layer || 1,
            rotation: 0
          })
          console.log('✅ Emoji shape created successfully')
          break
        }
        
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
    const { shapeId, x, y } = command as unknown as { shapeId: string; x: number; y: number }

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
    const { shapeId, width, height, radius } = command as unknown as { shapeId: string; width?: number; height?: number; radius?: number }

    if (!shapeId) {
      throw new Error('Shape ID is required for resize command')
    }

    try {
      const shape = getShapeById(shapeId)
      if (!shape) {
        throw new Error(`Shape ${shapeId} not found`)
      }

      const updates: Record<string, unknown> = {}
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
    const { shapeId } = command as unknown as { shapeId: string }

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
    const { shapeType = 'all' } = command as unknown as { shapeType?: string }

    try {
      let shapes: Array<Record<string, unknown>> = []
      
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
    const { shapeIds, layout, spacing = 20 } = command as unknown as { shapeIds: string[]; layout: string; spacing?: number }

    if (!shapeIds || shapeIds.length === 0) {
      throw new Error('Shape IDs are required for arrange command')
    }

    try {
      const shapes = shapeIds.map((id: string) => getShapeById(id)).filter(Boolean) as unknown as Array<Record<string, unknown>>
      if (shapes.length === 0) {
        throw new Error('No valid shapes found for arrangement')
      }

      // Calculate positions based on layout
      let positions: { x: number, y: number }[] = []

      switch (layout) {
        case 'horizontal': {
          positions = shapes.map((_, index: number) => ({
            x: 100 + index * (200 + spacing),
            y: 100
          }))
          break
        }
        
        case 'vertical': {
          positions = shapes.map((_, index: number) => ({
            x: 100,
            y: 100 + index * (100 + spacing)
          }))
          break
        }
        
        case 'grid': {
          const cols = Math.ceil(Math.sqrt(shapes.length))
          positions = shapes.map((_, index: number) => ({
            x: 100 + (index % cols) * (200 + spacing),
            y: 100 + Math.floor(index / cols) * (100 + spacing)
          }))
          break
        }
        
        case 'circle': {
          const centerX = 400
          const centerY = 300
          const radius = 150
          positions = shapes.map((_, index: number) => {
            const angle = (index / shapes.length) * 2 * Math.PI
            return {
              x: centerX + radius * Math.cos(angle),
              y: centerY + radius * Math.sin(angle)
            }
          })
          break
        }
        
        default:
          throw new Error(`Unknown layout type: ${layout}`)
      }

      // Update shape positions
      for (let i = 0; i < shapes.length; i++) {
        const shape = shapes[i]
        const position = positions[i]
        if (position && shape && typeof shape === 'object' && 'id' in shape) {
          await updateShape(shape.id as string, { x: position.x, y: position.y })
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
  const handleClearAll = async (_command: AICommand): Promise<boolean> => {
    try {
      // Clear regular shapes
      await clearAllShapes()
      
      // Also clear emojis
      const { clearAllEmojis } = useEmojis()
      await clearAllEmojis()
      
      console.log('✅ Cleared all shapes and emojis from canvas')
      return true
    } catch (err) {
      console.error('❌ Failed to clear all shapes and emojis:', err)
      return false
    }
  }

  // Handle moving specific emojis
  const handleMoveEmojis = async (command: AICommand): Promise<boolean> => {
    const { emojiType, deltaX, deltaY, trailEmoji, createTrail } = command as unknown as { 
      emojiType: string; 
      deltaX: number; 
      deltaY: number;
      trailEmoji?: string;
      createTrail?: boolean;
    }

    try {
      const { emojis, updateEmoji, addEmoji } = useEmojis()
      
      // Filter emojis by type if specified
      const targetEmojis = emojiType 
        ? emojis.value.filter(emoji => emoji.emoji === emojiType)
        : emojis.value

      if (targetEmojis.length === 0) {
        console.log(`⚠️ No emojis found with type: ${emojiType}`)
        return false
      }

      // Update each emoji and create trails if requested
      let successCount = 0
      for (const emoji of targetEmojis) {
        const oldX = emoji.x
        const oldY = emoji.y
        const newX = emoji.x + deltaX
        const newY = emoji.y + deltaY
        
        const success = await updateEmoji(emoji.id, { x: newX, y: newY })
        if (success) {
          successCount++
          
          // Create trail if requested
          if (createTrail && trailEmoji) {
            const trailPositions = generateTrail(oldX, oldY, newX, newY, trailEmoji)
            for (const trailPos of trailPositions) {
              await addEmoji({
                ...trailPos,
                rotation: 0
              })
              await new Promise(resolve => setTimeout(resolve, 5)) // Small delay
            }
          }
        }
      }

      console.log(`✅ Moved ${successCount}/${targetEmojis.length} emojis by (${deltaX}, ${deltaY})`)
      return successCount > 0
    } catch (err) {
      console.error('❌ Failed to move emojis:', err)
      return false
    }
  }

  // Handle rotating specific emojis
  const handleRotateEmojis = async (command: AICommand): Promise<boolean> => {
    const { emojiType, degrees } = command as unknown as { 
      emojiType: string; 
      degrees: number 
    }

    try {
      const { emojis, updateEmoji } = useEmojis()
      
      // Filter emojis by type if specified
      const targetEmojis = emojiType 
        ? emojis.value.filter(emoji => emoji.emoji === emojiType)
        : emojis.value

      if (targetEmojis.length === 0) {
        console.log(`⚠️ No emojis found with type: ${emojiType}`)
        return false
      }

      // Update each emoji's rotation
      let successCount = 0
      for (const emoji of targetEmojis) {
        const newRotation = (emoji.rotation + degrees) % 360
        
        const success = await updateEmoji(emoji.id, { rotation: newRotation })
        if (success) {
          successCount++
        }
      }

      console.log(`✅ Rotated ${successCount}/${targetEmojis.length} emojis by ${degrees} degrees`)
      return successCount > 0
    } catch (err) {
      console.error('❌ Failed to rotate emojis:', err)
      return false
    }
  }

  // Handle moving all emojis
  const handleMoveAllEmojis = async (command: AICommand): Promise<boolean> => {
    const { deltaX, deltaY } = command as unknown as { 
      deltaX: number; 
      deltaY: number 
    }

    try {
      const { emojis, updateEmoji } = useEmojis()
      
      if (emojis.value.length === 0) {
        console.log('⚠️ No emojis found on canvas')
        return false
      }

      // Update each emoji
      let successCount = 0
      for (const emoji of emojis.value) {
        const newX = emoji.x + deltaX
        const newY = emoji.y + deltaY
        
        const success = await updateEmoji(emoji.id, { x: newX, y: newY })
        if (success) {
          successCount++
        }
      }

      console.log(`✅ Moved all ${successCount}/${emojis.value.length} emojis by (${deltaX}, ${deltaY})`)
      return successCount > 0
    } catch (err) {
      console.error('❌ Failed to move all emojis:', err)
      return false
    }
  }

  // Handle creating border
  const handleCreateBorder = async (command: AICommand): Promise<boolean> => {
    const { emoji, spacing } = command as unknown as { 
      emoji: string; 
      spacing?: number 
    }

    try {
      const { addEmoji } = useEmojis()
      const borderPositions = generateBorderPositions(emoji, spacing)
      
      for (const pos of borderPositions) {
        await addEmoji({
          ...pos,
          rotation: 0
        })
        await new Promise(resolve => setTimeout(resolve, 10)) // Small delay
      }

      console.log(`✅ Created border with ${borderPositions.length} ${emoji} emojis`)
      return true
    } catch (err) {
      console.error('❌ Failed to create border:', err)
      return false
    }
  }

  // Handle creating alternating pattern
  const handleCreateAlternatingPattern = async (command: AICommand): Promise<boolean> => {
    const { emojis, count, arrangement, position } = command as unknown as { 
      emojis: string[]; 
      count: number; 
      arrangement?: 'row' | 'column';
      position?: CanvasPosition;
    }

    try {
      const { addEmoji } = useEmojis()
      const patternPositions = generateAlternatingPattern(emojis, count, arrangement, position)
      
      for (const pos of patternPositions) {
        await addEmoji({
          ...pos,
          rotation: 0
        })
        await new Promise(resolve => setTimeout(resolve, 10)) // Small delay
      }

      console.log(`✅ Created alternating pattern with ${patternPositions.length} emojis`)
      return true
    } catch (err) {
      console.error('❌ Failed to create alternating pattern:', err)
      return false
    }
  }

  // Handle spelling words
  const handleSpellWord = async (command: AICommand): Promise<boolean> => {
    console.log('🔤 handleSpellWord called with:', command)
    const { word, emoji, vertical, position } = command as unknown as { 
      word: string; 
      emoji: string; 
      vertical?: boolean;
      position?: CanvasPosition;
    }

    console.log('🔤 Parsed parameters:', { word, emoji, vertical, position })

    try {
      const { addEmoji } = useEmojis()
      let wordPositions: Array<{ emoji: string; x: number; y: number; size: number; layer: number; rotation: number }>
      
      if (vertical) {
        console.log('🔤 Generating vertical word positions')
        wordPositions = generateVerticalWordPositions(
          word, 
          emoji, 
          position?.x ?? 200, 
          position?.y ?? 200
        )
      } else {
        console.log('🔤 Generating horizontal word positions')
        wordPositions = generateWordPositions(
          word, 
          emoji, 
          position?.x ?? 200, 
          position?.y ?? 200
        )
      }
      
      console.log('🔤 Generated word positions:', wordPositions.length, 'positions')
      
      for (const pos of wordPositions) {
        console.log('🔤 Adding emoji position:', pos)
        await addEmoji(pos)
        await new Promise(resolve => setTimeout(resolve, 5)) // Small delay
      }

      console.log(`✅ Spelled "${word}" with ${wordPositions.length} ${emoji} emojis`)
      return true
    } catch (err) {
      console.error('❌ Failed to spell word:', err)
      return false
    }
  }

  // Handle shifting entire scene
  const handleShiftScene = async (command: AICommand): Promise<boolean> => {
    const { deltaX, deltaY } = command as unknown as { 
      deltaX: number; 
      deltaY: number 
    }

    try {
      const { emojis, updateEmoji } = useEmojis()
      
      if (emojis.value.length === 0) {
        console.log('⚠️ No emojis found on canvas')
        return false
      }

      // Update each emoji
      let successCount = 0
      for (const emoji of emojis.value) {
        const newX = emoji.x + deltaX
        const newY = emoji.y + deltaY
        
        const success = await updateEmoji(emoji.id, { x: newX, y: newY })
        if (success) {
          successCount++
        }
      }

      console.log(`✅ Shifted entire scene by (${deltaX}, ${deltaY})`)
      return successCount > 0
    } catch (err) {
      console.error('❌ Failed to shift scene:', err)
      return false
    }
  }

  // Handle mirroring scene
  const handleMirrorScene = async (command: AICommand): Promise<boolean> => {
    const { axis, centerX } = command as unknown as { 
      axis: 'horizontal' | 'vertical'; 
      centerX?: number 
    }

    try {
      const { emojis, updateEmoji } = useEmojis()
      
      if (emojis.value.length === 0) {
        console.log('⚠️ No emojis found on canvas')
        return false
      }

      const mirrorCenter = centerX ?? 400
      let successCount = 0

      for (const emoji of emojis.value) {
        let newX = emoji.x
        let newY = emoji.y

        if (axis === 'horizontal') {
          // Mirror horizontally around centerX
          newX = mirrorCenter - (emoji.x - mirrorCenter)
        } else {
          // Mirror vertically around centerY
          newY = 300 - (emoji.y - 300)
        }
        
        const success = await updateEmoji(emoji.id, { x: newX, y: newY })
        if (success) {
          successCount++
        }
      }

      console.log(`✅ Mirrored scene ${axis}ly`)
      return successCount > 0
    } catch (err) {
      console.error('❌ Failed to mirror scene:', err)
      return false
    }
  }

  // Generate emojis for multiple items (e.g., "one big pumpkin and two small hearts")
  const generateMultipleItemsEmojis = (multipleItems: MultipleItemsResult): Array<{ emoji: string; x: number; y: number; size: number; layer: number; rotation: number }> => {
    const emojis: Array<{ emoji: string; x: number; y: number; size: number; layer: number; rotation: number }> = []
    const centerX = multipleItems.position?.x || 400
    const centerY = multipleItems.position?.y || 300
    const arrangement = multipleItems.arrangement || 'row'
    
    let currentIndex = 0
    
    for (const item of multipleItems.items) {
      for (let i = 0; i < item.count; i++) {
        let x, y
        
        if (arrangement === 'circle') {
          const totalItems = multipleItems.items.reduce((sum, it) => sum + it.count, 0)
          const angle = (currentIndex / totalItems) * 2 * Math.PI
          const radius = 120
          x = centerX + radius * Math.cos(angle)
          y = centerY + radius * Math.sin(angle)
        } else if (arrangement === 'triangle') {
          const totalItems = multipleItems.items.reduce((sum, it) => sum + it.count, 0)
          const angle = (currentIndex / totalItems) * 2 * Math.PI
          const radius = 120
          x = centerX + radius * Math.cos(angle)
          y = centerY + radius * Math.sin(angle)
        } else if (arrangement === 'square') {
          const totalItems = multipleItems.items.reduce((sum, it) => sum + it.count, 0)
          const side = Math.floor(currentIndex / 4)
          const pos = currentIndex % 4
          const radius = 100
          if (pos === 0) { x = centerX - radius; y = centerY - radius }
          else if (pos === 1) { x = centerX + radius; y = centerY - radius }
          else if (pos === 2) { x = centerX + radius; y = centerY + radius }
          else { x = centerX - radius; y = centerY + radius }
        } else {
          // Default to row arrangement
          const totalItems = multipleItems.items.reduce((sum, it) => sum + it.count, 0)
          x = centerX - (totalItems * 40) + (currentIndex * 80)
          y = centerY
        }
        
        emojis.push({
          emoji: item.emoji,
          x: Math.round(x),
          y: Math.round(y),
          size: item.size,
          layer: 1,
          rotation: 0
        })
        
        currentIndex++
      }
    }
    
    return emojis
  }

  // Generate fallback emojis based on story description
  const generateFallbackEmojis = (story: string): Array<{ emoji: string; x: number; y: number; size: number; layer: number; rotation: number }> => {
    const storyLower = story.toLowerCase()
    const emojis: Array<{ emoji: string; x: number; y: number; size: number; layer: number; rotation: number }> = []
    
    // Check for multiple items first
    const multipleItems = parseMultipleItems(story)
    if (multipleItems) {
      return generateMultipleItemsEmojis(multipleItems)
    }
    
    // Extract count from story (handles both words and numbers)
    const count = extractCount(story)
    
    // Extract size from story
    const size = extractSize(story)
    
    // Extract position from story
    const position = extractPosition(story)
    
    // Determine emoji type using utility function
    const emoji = extractEmojiType(story)
    
    // Handle creative requests
    if (storyLower.includes('spelled') || storyLower.includes('spell')) {
      // Try to spell out a word with emojis
      const wordMatch = story.match(/(?:spelled?|spell)\s+(?:in|with|using)\s+\w+\s+(\w+)/i)
      if (wordMatch && wordMatch[1]) {
        const word = wordMatch[1].toUpperCase()
        const vertical = storyLower.includes('vertically') || storyLower.includes('vertical')
        return spellWordWithEmojis(word, emoji, vertical)
      }
    }
    
    if (storyLower.includes('draw') && storyLower.includes('using')) {
      // Try to draw a shape using emojis
      if (storyLower.includes('heart')) {
        return drawHeartWithEmojis(emoji)
      } else if (storyLower.includes('star')) {
        return drawStarWithEmojis(emoji)
      } else if (storyLower.includes('circle')) {
        return drawCircleWithEmojis(emoji)
      }
    }
    
    // Determine arrangement with position and size awareness
    const centerX = position?.x || 400
    const centerY = position?.y || 300
    
    if (storyLower.includes('in a row') || storyLower.includes('in row')) {
      // Horizontal row
      for (let i = 0; i < count; i++) {
        emojis.push({
          emoji: emoji,
          x: centerX - (count * 40) + (i * 80), // Center the row
          y: centerY,
          size: size,
          layer: 1,
          rotation: 0
        })
      }
    } else if (storyLower.includes('around') || storyLower.includes('circle')) {
      // Circular arrangement
      const radius = 120
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * 2 * Math.PI
        const x = centerX + radius * Math.cos(angle)
        const y = centerY + radius * Math.sin(angle)
        emojis.push({
          emoji: emoji,
          x: Math.round(x),
          y: Math.round(y),
          size: size,
          layer: 1,
          rotation: 0
        })
      }
    } else if (storyLower.includes('triangle')) {
      // Triangular arrangement
      const radius = 120
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * 2 * Math.PI
        const x = centerX + radius * Math.cos(angle)
        const y = centerY + radius * Math.sin(angle)
        emojis.push({
          emoji: emoji,
          x: Math.round(x),
          y: Math.round(y),
          size: size,
          layer: 1,
          rotation: 0
        })
      }
    } else {
      // Default arrangement (horizontal row)
      for (let i = 0; i < count; i++) {
        emojis.push({
          emoji: emoji,
          x: centerX - (count * 40) + (i * 80), // Center the row
          y: centerY,
          size: size,
          layer: 1,
          rotation: 0
        })
      }
    }
    
    return emojis
  }
  
  // Helper function to spell words with emojis using letter patterns
  const spellWordWithEmojis = (word: string, emoji: string, vertical: boolean = false): Array<{ emoji: string; x: number; y: number; size: number; layer: number; rotation: number }> => {
    const startX = 200
    const startY = 200
    
    if (vertical) {
      return generateVerticalWordPositions(word, emoji, startX, startY)
    } else {
      return generateWordPositions(word, emoji, startX, startY)
    }
  }
  
  // Helper function to draw a heart with emojis
  const drawHeartWithEmojis = (emoji: string): Array<{ emoji: string; x: number; y: number; size: number; layer: number; rotation: number }> => {
    const emojis: Array<{ emoji: string; x: number; y: number; size: number; layer: number; rotation: number }> = []
    const centerX = 400
    const centerY = 300
    
    // Simple heart shape pattern
    const heartPattern = [
      { x: 0, y: -2 }, { x: 1, y: -2 }, { x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: -1 },
      { x: -2, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 },
      { x: -1, y: 1 }, { x: 0, y: 1 }, { x: 1, y: 1 },
      { x: 0, y: 2 }
    ]
    
    heartPattern.forEach(({ x, y }) => {
      emojis.push({
        emoji: emoji,
        x: centerX + (x * 30),
        y: centerY + (y * 30),
        size: 30,
        layer: 1,
        rotation: 0
      })
    })
    
    return emojis
  }
  
  // Helper function to draw a star with emojis
  const drawStarWithEmojis = (emoji: string): Array<{ emoji: string; x: number; y: number; size: number; layer: number; rotation: number }> => {
    const emojis: Array<{ emoji: string; x: number; y: number; size: number; layer: number; rotation: number }> = []
    const centerX = 400
    const centerY = 300
    const radius = 100
    
    // 5-pointed star pattern
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5
      const x = centerX + radius * Math.cos(angle)
      const y = centerY + radius * Math.sin(angle)
      emojis.push({
        emoji: emoji,
        x: Math.round(x),
        y: Math.round(y),
        size: 40,
        layer: 1,
        rotation: 0
      })
    }
    
    return emojis
  }
  
  // Helper function to draw a circle with emojis
  const drawCircleWithEmojis = (emoji: string): Array<{ emoji: string; x: number; y: number; size: number; layer: number; rotation: number }> => {
    const emojis: Array<{ emoji: string; x: number; y: number; size: number; layer: number; rotation: number }> = []
    const centerX = 400
    const centerY = 300
    const radius = 120
    const count = 12
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * 2 * Math.PI
      const x = centerX + radius * Math.cos(angle)
      const y = centerY + radius * Math.sin(angle)
      emojis.push({
        emoji: emoji,
        x: Math.round(x),
        y: Math.round(y),
        size: 40,
        layer: 1,
        rotation: 0
      })
    }
    
    return emojis
  }
  
  // Create emoji story with provided emojis
  const createEmojiStoryWithEmojis = async (story: string, emojis: Array<{ emoji: string; x: number; y: number; size: number; layer: number; rotation: number }>): Promise<boolean> => {
    try {
      const { addEmoji } = useEmojis()
      
      // Add each emoji to the canvas with proper positioning and layering
      for (const emojiData of emojis) {
        const emoji = {
          emoji: emojiData.emoji,
          x: emojiData.x,
          y: emojiData.y,
          size: emojiData.size,
          layer: emojiData.layer,
          rotation: emojiData.rotation
        }
        
        await addEmoji(emoji)
        
        // Add a small delay between emoji additions for better visual effect
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      
      console.log(`✅ Emoji story "${story}" created successfully with ${emojis.length} emojis`)
      return true
    } catch (err) {
      console.error('❌ Failed to create emoji story with fallback emojis:', err)
      return false
    }
  }

  // Handle emoji story creation
  const handleCreateEmojiStory = async (command: AICommand): Promise<boolean> => {
    try {
      console.log('🔧 Raw command received in handleCreateEmojiStory:', JSON.stringify(command, null, 2))
      const { story, emojis } = command as unknown as { story: string; emojis: Array<{ emoji: string; x: number; y: number; size?: number; layer?: number; rotation?: number }> }
      console.log('🎭 Creating emoji story:', { story, emojis })
      console.log('🔍 Emojis type:', typeof emojis, 'Is array:', Array.isArray(emojis), 'Value:', emojis)
      
      // Check if we have a valid story and emojis
      if (!story || !emojis || !Array.isArray(emojis) || emojis.length === 0) {
        console.error('❌ Invalid command: missing story or emojis array. Story:', story, 'Emojis:', emojis)
        
        // If we don't have a story, we can't generate a fallback
        if (!story) {
          console.error('❌ Cannot generate fallback without story description')
          return false
        }
        
        // Try to generate a fallback emoji story based on the story description
        console.log('🔄 Attempting to generate fallback emoji story from story description:', story)
        const fallbackEmojis = generateFallbackEmojis(story)
        if (fallbackEmojis.length > 0) {
          console.log('✅ Generated fallback emojis:', fallbackEmojis)
          return await createEmojiStoryWithEmojis(story, fallbackEmojis)
        }
        
        return false
      }

      // Use the helper function to create the emoji story
      // Ensure all emoji properties have default values
      const normalizedEmojis = emojis.map(emojiData => ({
        emoji: emojiData.emoji,
        x: emojiData.x || 100,
        y: emojiData.y || 100,
        size: emojiData.size || 40,
        layer: emojiData.layer || 1,
        rotation: emojiData.rotation || 0
      }))
      
      return await createEmojiStoryWithEmojis(story, normalizedEmojis)
    } catch (err) {
      console.error('❌ Failed to create emoji story:', err)
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
      let commands: AICommand[] = []
      
      if (typeof response === 'string') {
        assistantMessage = response
        // Extract commands from text response (fallback mode)
        commands = extractCommandsFromMessage(assistantMessage)
      } else if (response && typeof response === 'object' && 'content' in response) {
        assistantMessage = String(response.content) // Ensure it's a string
        
        // Check if we have structured commands from AI
        console.log('🔍 Response structure:', Object.keys(response))
        console.log('🔍 Commands in response:', response.commands)
        console.log('🔍 Commands is array:', Array.isArray(response.commands))
        console.log('🔍 Full response:', JSON.stringify(response, null, 2))
        console.log('🔍 Full response:', JSON.stringify(response, null, 2))
        
        if ('commands' in response && Array.isArray(response.commands)) {
          console.log('🎯 Using structured commands from AI')
          commands = response.commands as AICommand[]
          console.log('🎯 Received structured commands from AI:', commands)
          console.log('🔍 First command details:', JSON.stringify(commands[0], null, 2))
        } else {
          console.log('🎯 Using fallback command extraction from message')
          // Extract commands from text response (fallback mode)
          commands = extractCommandsFromMessage(assistantMessage)
        }
      }
      
      // Add assistant message
      messages.value.push({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantMessage
      })
      
      // Execute commands from the response
      console.log('🔧 About to execute commands:', commands.length, 'commands')
      for (const command of commands) {
        console.log('🔧 Executing command:', JSON.stringify(command, null, 2))
        console.log('🔧 Command keys:', Object.keys(command))
        
        // Skip malformed commands that might be causing issues
        if (command.action === 'create-shape' && 
            (!command.shapeType || 
             (command.x === 0 && command.y === 0 && command.width === 0 && command.height === 0 && command.radius === 0))) {
          console.warn('⚠️ Skipping malformed create-shape command:', command)
          continue
        }
        
        await executeCommand(command)
      }
      
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to get AI response'
      
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
